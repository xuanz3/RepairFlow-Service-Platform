namespace RepairFlow.Domain;

public enum UploadSessionState
{
    Active,
    Completed,
    Aborted
}

public sealed class AttachmentUploadSession
{
    private AttachmentUploadSession() { }

    private AttachmentUploadSession(
        Guid id,
        Guid repairCaseId,
        Guid evidenceId,
        string fileName,
        string contentType,
        long totalBytes,
        string sha256,
        int chunkSize,
        DateTimeOffset createdAt,
        DateTimeOffset expiresAt)
    {
        Id = id;
        RepairCaseId = repairCaseId;
        EvidenceId = evidenceId;
        FileName = fileName;
        ContentType = contentType;
        TotalBytes = totalBytes;
        Sha256 = sha256;
        ChunkSize = chunkSize;
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
        ExpiresAt = expiresAt;
        State = UploadSessionState.Active;
    }

    public Guid Id { get; private set; }
    public Guid RepairCaseId { get; private set; }
    public Guid EvidenceId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long TotalBytes { get; private set; }
    public long ReceivedBytes { get; private set; }
    public string Sha256 { get; private set; } = string.Empty;
    public int ChunkSize { get; private set; }
    public UploadSessionState State { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }

    public static AttachmentUploadSession Create(
        Guid repairCaseId,
        Guid evidenceId,
        string fileName,
        string contentType,
        long totalBytes,
        string sha256,
        int chunkSize,
        DateTimeOffset now)
    {
        if (repairCaseId == Guid.Empty) throw new ArgumentException("Repair case id is required.", nameof(repairCaseId));
        if (evidenceId == Guid.Empty) throw new ArgumentException("Evidence id is required.", nameof(evidenceId));
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(contentType);
        if (totalBytes <= 0 || totalBytes > 50L * 1024 * 1024)
        {
            throw new ArgumentOutOfRangeException(nameof(totalBytes), "Attachments must be between 1 byte and 50 MiB.");
        }
        if (sha256.Length != 64 || !sha256.All(Uri.IsHexDigit))
        {
            throw new ArgumentException("SHA-256 must be a 64-character hexadecimal digest.", nameof(sha256));
        }
        if (chunkSize <= 0 || chunkSize > 1024 * 1024)
        {
            throw new ArgumentOutOfRangeException(nameof(chunkSize), "Chunk size must not exceed 1 MiB.");
        }

        return new AttachmentUploadSession(
            Guid.CreateVersion7(),
            repairCaseId,
            evidenceId,
            fileName.Trim(),
            contentType.Trim(),
            totalBytes,
            sha256.ToLowerInvariant(),
            chunkSize,
            now,
            now.AddHours(24));
    }

    public void Append(long offset, int byteCount, DateTimeOffset now)
    {
        EnsureActive(now);
        if (offset != ReceivedBytes)
        {
            throw new InvalidOperationException($"Upload offset {offset} does not match committed offset {ReceivedBytes}.");
        }
        if (byteCount <= 0 || byteCount > ChunkSize)
        {
            throw new ArgumentOutOfRangeException(nameof(byteCount), "Chunk length is outside the negotiated limit.");
        }
        if (ReceivedBytes + byteCount > TotalBytes)
        {
            throw new InvalidOperationException("Chunk exceeds the declared attachment size.");
        }
        ReceivedBytes += byteCount;
        UpdatedAt = now;
    }

    public void Complete(DateTimeOffset now)
    {
        EnsureActive(now);
        if (ReceivedBytes != TotalBytes)
        {
            throw new InvalidOperationException("Upload cannot complete until every declared byte is committed.");
        }
        State = UploadSessionState.Completed;
        UpdatedAt = now;
    }

    public void Abort(DateTimeOffset now)
    {
        if (State == UploadSessionState.Completed)
        {
            throw new InvalidOperationException("A completed upload cannot be aborted.");
        }
        State = UploadSessionState.Aborted;
        UpdatedAt = now;
    }

    private void EnsureActive(DateTimeOffset now)
    {
        if (State != UploadSessionState.Active)
        {
            throw new InvalidOperationException("Upload session is not active.");
        }
        if (now > ExpiresAt)
        {
            throw new InvalidOperationException("Upload session has expired.");
        }
    }
}
