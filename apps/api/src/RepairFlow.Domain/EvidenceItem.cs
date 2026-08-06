namespace RepairFlow.Domain;

public sealed class EvidenceItem
{
    private EvidenceItem() { }

    private EvidenceItem(
        Guid repairCaseId,
        string fileName,
        string contentType,
        long sizeBytes,
        string? sha256,
        EvidenceKind kind,
        string? note,
        DateTimeOffset createdAt)
    {
        Id = Guid.CreateVersion7();
        RepairCaseId = repairCaseId;
        FileName = fileName.Trim();
        ContentType = contentType.Trim();
        SizeBytes = sizeBytes;
        Sha256 = string.IsNullOrWhiteSpace(sha256) ? null : sha256.Trim().ToLowerInvariant();
        Kind = kind;
        Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid RepairCaseId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public string? Sha256 { get; private set; }
    public long SizeBytes { get; private set; }
    public EvidenceKind Kind { get; private set; }
    public string? Note { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public static EvidenceItem Create(
        Guid repairCaseId,
        string fileName,
        string contentType,
        long sizeBytes,
        string? sha256,
        EvidenceKind kind,
        string? note,
        DateTimeOffset createdAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(contentType);

        ArgumentOutOfRangeException.ThrowIfNegative(sizeBytes);

        if (!string.IsNullOrWhiteSpace(sha256) && sha256.Trim().Length != 64)
        {
            throw new ArgumentException("SHA-256 values must contain 64 hexadecimal characters.", nameof(sha256));
        }

        return new EvidenceItem(
            repairCaseId,
            fileName,
            contentType,
            sizeBytes,
            sha256,
            kind,
            note,
            createdAt);
    }
}
