namespace RepairFlow.Domain;

public sealed class EvidenceItem
{
    private EvidenceItem() { }

    public Guid Id { get; private set; }
    public Guid RepairCaseId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public string Sha256 { get; private set; } = string.Empty;
    public long SizeBytes { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
}
