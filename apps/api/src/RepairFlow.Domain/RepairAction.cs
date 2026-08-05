namespace RepairFlow.Domain;

public sealed class RepairAction
{
    private RepairAction() { }

    private RepairAction(
        Guid repairCaseId,
        Guid actorId,
        string title,
        string detail,
        string? partNumber,
        DateTimeOffset createdAt)
    {
        Id = Guid.CreateVersion7();
        RepairCaseId = repairCaseId;
        ActorId = actorId;
        Title = title.Trim();
        Detail = detail.Trim();
        PartNumber = string.IsNullOrWhiteSpace(partNumber) ? null : partNumber.Trim();
        Status = RepairActionStatus.Planned;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid RepairCaseId { get; private set; }
    public Guid ActorId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Detail { get; private set; } = string.Empty;
    public string? PartNumber { get; private set; }
    public RepairActionStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    public static RepairAction Create(
        Guid repairCaseId,
        Guid actorId,
        string title,
        string detail,
        string? partNumber,
        DateTimeOffset createdAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(detail);
        return new RepairAction(repairCaseId, actorId, title, detail, partNumber, createdAt);
    }

    public void Start()
    {
        if (Status != RepairActionStatus.Planned)
        {
            throw new InvalidOperationException("Only planned repair actions can be started.");
        }

        Status = RepairActionStatus.InProgress;
    }

    public void Complete(DateTimeOffset completedAt)
    {
        if (Status is RepairActionStatus.Completed or RepairActionStatus.Blocked)
        {
            throw new InvalidOperationException("The repair action cannot be completed from its current state.");
        }

        Status = RepairActionStatus.Completed;
        CompletedAt = completedAt;
    }

    public void Block()
    {
        if (Status == RepairActionStatus.Completed)
        {
            throw new InvalidOperationException("A completed repair action cannot be blocked.");
        }

        Status = RepairActionStatus.Blocked;
    }
}
