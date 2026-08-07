using System.Security.Cryptography;
using RepairFlow.Application;
using RepairFlow.Domain;

namespace RepairFlow.Api;

public sealed class AttachmentUploadService(
    ISyncRepository syncRepository,
    IWebHostEnvironment environment,
    IConfiguration configuration,
    TimeProvider timeProvider)
{
    public const int ChunkSize = 256 * 1024;
    private const int MaximumChunkSize = 1024 * 1024;
    private readonly string _root = ResolveRoot(environment, configuration);

    public async Task<UploadSessionDto> BeginAsync(
        BeginUploadRequest request,
        CancellationToken cancellationToken)
    {
        ValidateFileName(request.FileName);
        ValidateContentType(request.ContentType);
        var now = timeProvider.GetUtcNow();
        var session = AttachmentUploadSession.Create(
            request.RepairCaseId,
            request.EvidenceId,
            request.FileName,
            request.ContentType,
            request.TotalBytes,
            request.Sha256,
            ChunkSize,
            now);

        Directory.CreateDirectory(ActiveDirectory);
        Directory.CreateDirectory(CompletedDirectory);
        var path = ActivePath(session.Id);
        await using (var stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await stream.FlushAsync(cancellationToken);
        }

        try
        {
            await syncRepository.AddUploadSessionAsync(session, cancellationToken);
            await syncRepository.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            File.Delete(path);
            throw;
        }

        RepairFlowTelemetry.UploadSessions.Add(1, new("state", "started"));
        return UploadSessionDto.FromDomain(session);
    }

    public async Task<UploadSessionDto> GetAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await RequireSessionAsync(sessionId, cancellationToken);
        return UploadSessionDto.FromDomain(session);
    }

    public async Task<UploadSessionDto> AppendAsync(
        Guid sessionId,
        long offset,
        Stream content,
        long? contentLength,
        CancellationToken cancellationToken)
    {
        if (contentLength is null or <= 0 or > MaximumChunkSize)
        {
            throw new ArgumentOutOfRangeException(nameof(contentLength), "Chunk length must be between 1 byte and 1 MiB.");
        }

        var session = await RequireSessionAsync(sessionId, cancellationToken);
        var originalOffset = session.ReceivedBytes;
        if (offset != originalOffset)
        {
            throw new InvalidOperationException(
                $"Upload offset {offset} does not match committed offset {originalOffset}.");
        }

        var buffer = new byte[checked((int)contentLength.Value)];
        var read = 0;
        while (read < buffer.Length)
        {
            var count = await content.ReadAsync(buffer.AsMemory(read, buffer.Length - read), cancellationToken);
            if (count == 0) break;
            read += count;
        }
        if (read != buffer.Length)
        {
            throw new InvalidOperationException("Chunk body ended before Content-Length bytes were received.");
        }

        Directory.CreateDirectory(ActiveDirectory);
        var path = ActivePath(session.Id);
        await using var stream = new FileStream(path, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
        if (stream.Length != originalOffset)
        {
            stream.SetLength(originalOffset);
        }
        stream.Position = originalOffset;
        await stream.WriteAsync(buffer, cancellationToken);
        await stream.FlushAsync(cancellationToken);

        try
        {
            session.Append(offset, read, timeProvider.GetUtcNow());
            await syncRepository.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            stream.SetLength(originalOffset);
            await stream.FlushAsync(cancellationToken);
            throw;
        }

        RepairFlowTelemetry.UploadBytes.Add(read);
        return UploadSessionDto.FromDomain(session);
    }

    public async Task<UploadSessionDto> CompleteAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await RequireSessionAsync(sessionId, cancellationToken);
        if (session.ReceivedBytes != session.TotalBytes)
        {
            throw new InvalidOperationException("Upload is incomplete.");
        }

        Directory.CreateDirectory(CompletedDirectory);
        var activePath = ActivePath(session.Id);
        var completedPath = CompletedPath(session.Id);
        var sourcePath = File.Exists(activePath) ? activePath : completedPath;
        if (!File.Exists(sourcePath))
        {
            throw new InvalidOperationException("Upload bytes are missing from durable storage.");
        }

        var actualHash = await ComputeSha256Async(sourcePath, cancellationToken);
        if (!CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(actualHash),
                Convert.FromHexString(session.Sha256)))
        {
            RepairFlowTelemetry.UploadIntegrityFailures.Add(1);
            throw new InvalidOperationException("Attachment SHA-256 verification failed.");
        }

        if (!File.Exists(completedPath))
        {
            File.Move(activePath, completedPath);
        }
        session.Complete(timeProvider.GetUtcNow());
        await syncRepository.SaveChangesAsync(cancellationToken);
        RepairFlowTelemetry.UploadSessions.Add(1, new("state", "completed"));
        return UploadSessionDto.FromDomain(session);
    }

    public async Task<UploadSessionDto> AbortAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await RequireSessionAsync(sessionId, cancellationToken);
        session.Abort(timeProvider.GetUtcNow());
        await syncRepository.SaveChangesAsync(cancellationToken);
        File.Delete(ActivePath(session.Id));
        RepairFlowTelemetry.UploadSessions.Add(1, new("state", "aborted"));
        return UploadSessionDto.FromDomain(session);
    }

    private async Task<AttachmentUploadSession> RequireSessionAsync(
        Guid sessionId,
        CancellationToken cancellationToken) =>
        await syncRepository.FindUploadSessionAsync(sessionId, cancellationToken)
            ?? throw new KeyNotFoundException("Upload session was not found.");

    private static string ResolveRoot(IWebHostEnvironment environment, IConfiguration configuration)
    {
        var configured = configuration["Uploads:Root"];
        return string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(environment.ContentRootPath, ".repairflow", "uploads")
            : Path.GetFullPath(configured);
    }

    private string ActiveDirectory => Path.Combine(_root, "active");
    private string CompletedDirectory => Path.Combine(_root, "completed");
    private string ActivePath(Guid sessionId) => Path.Combine(ActiveDirectory, $"{sessionId:N}.part");
    private string CompletedPath(Guid sessionId) => Path.Combine(CompletedDirectory, $"{sessionId:N}.bin");

    private static void ValidateFileName(string fileName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);
        if (!string.Equals(Path.GetFileName(fileName), fileName, StringComparison.Ordinal) || fileName.Length > 240)
        {
            throw new ArgumentException("Attachment file name must not contain a path.", nameof(fileName));
        }
    }

    private static void ValidateContentType(string contentType)
    {
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "text/plain"
        };
        if (!allowed.Contains(contentType))
        {
            throw new ArgumentException("Attachment content type is not supported.", nameof(contentType));
        }
    }

    private static async Task<string> ComputeSha256Async(string path, CancellationToken cancellationToken)
    {
        await using var stream = File.OpenRead(path);
        using var sha256 = SHA256.Create();
        var digest = await sha256.ComputeHashAsync(stream, cancellationToken);
        return Convert.ToHexString(digest).ToLowerInvariant();
    }
}
