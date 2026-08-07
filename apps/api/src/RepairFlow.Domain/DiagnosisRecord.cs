namespace RepairFlow.Domain;

public sealed class DiagnosisRecord
{
    private DiagnosisRecord() { }

    private DiagnosisRecord(
        Guid repairCaseId,
        Guid actorId,
        string summary,
        string recommendation,
        string? diagnosticCode,
        DateTimeOffset createdAt)
    {
        Id = Guid.CreateVersion7();
        RepairCaseId = repairCaseId;
        ActorId = actorId;
        Summary = summary.Trim();
        Recommendation = recommendation.Trim();
        DiagnosticCode = string.IsNullOrWhiteSpace(diagnosticCode) ? null : diagnosticCode.Trim();
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid RepairCaseId { get; private set; }
    public Guid ActorId { get; private set; }
    public string Summary { get; private set; } = string.Empty;
    public string Recommendation { get; private set; } = string.Empty;
    public string? DiagnosticCode { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public static DiagnosisRecord Create(
        Guid repairCaseId,
        Guid actorId,
        string summary,
        string recommendation,
        string? diagnosticCode,
        DateTimeOffset createdAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(summary);
        ArgumentException.ThrowIfNullOrWhiteSpace(recommendation);

        return new DiagnosisRecord(
            repairCaseId,
            actorId,
            summary,
            recommendation,
            diagnosticCode,
            createdAt);
    }
}
