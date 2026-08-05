namespace RepairFlow.Domain;

public sealed class QualityReview
{
    private QualityReview() { }

    private QualityReview(
        Guid repairCaseId,
        Guid actorId,
        QualityOutcome outcome,
        string notes,
        bool evidenceComplete,
        DateTimeOffset createdAt)
    {
        Id = Guid.CreateVersion7();
        RepairCaseId = repairCaseId;
        ActorId = actorId;
        Outcome = outcome;
        Notes = notes.Trim();
        EvidenceComplete = evidenceComplete;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid RepairCaseId { get; private set; }
    public Guid ActorId { get; private set; }
    public QualityOutcome Outcome { get; private set; }
    public string Notes { get; private set; } = string.Empty;
    public bool EvidenceComplete { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public static QualityReview Create(
        Guid repairCaseId,
        Guid actorId,
        QualityOutcome outcome,
        string notes,
        bool evidenceComplete,
        DateTimeOffset createdAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(notes);
        return new QualityReview(repairCaseId, actorId, outcome, notes, evidenceComplete, createdAt);
    }
}
