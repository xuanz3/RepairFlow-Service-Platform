namespace RepairFlow.Domain;

public sealed class AuditEntry
{
    private AuditEntry() { }

    private AuditEntry(Guid repairCaseId, Guid actorId, string action, string detail, DateTimeOffset createdAt)
    {
        Id = Guid.CreateVersion7();
        RepairCaseId = repairCaseId;
        ActorId = actorId;
        Action = action;
        Detail = detail;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid RepairCaseId { get; private set; }
    public Guid ActorId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string Detail { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }

    public static AuditEntry RecordStatusChange(
        Guid repairCaseId,
        Guid actorId,
        RepairCaseStatus previous,
        RepairCaseStatus next,
        string? note,
        DateTimeOffset now)
    {
        var detail = string.IsNullOrWhiteSpace(note)
            ? $"{previous} → {next}"
            : $"{previous} → {next}: {note.Trim()}";
        return new AuditEntry(repairCaseId, actorId, "repair-case.status-changed", detail, now);
    }
}
