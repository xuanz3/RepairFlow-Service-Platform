namespace RepairFlow.Domain;

public sealed class RepairCase
{
    private static readonly Dictionary<RepairCaseStatus, RepairCaseStatus[]> AllowedTransitions =
        new()
        {
            [RepairCaseStatus.CheckedIn] = [RepairCaseStatus.Diagnosing, RepairCaseStatus.Cancelled],
            [RepairCaseStatus.Diagnosing] = [RepairCaseStatus.AwaitingApproval, RepairCaseStatus.InRepair, RepairCaseStatus.Cancelled],
            [RepairCaseStatus.AwaitingApproval] = [RepairCaseStatus.InRepair, RepairCaseStatus.Cancelled],
            [RepairCaseStatus.InRepair] = [RepairCaseStatus.QualityCheck, RepairCaseStatus.Cancelled],
            [RepairCaseStatus.QualityCheck] = [RepairCaseStatus.InRepair, RepairCaseStatus.ReadyForDelivery],
            [RepairCaseStatus.ReadyForDelivery] = [RepairCaseStatus.Delivered, RepairCaseStatus.InRepair],
            [RepairCaseStatus.Delivered] = [],
            [RepairCaseStatus.Cancelled] = []
        };

    private RepairCase() { }

    private RepairCase(
        Guid id,
        string reference,
        string customerDisplayName,
        string reportedFault,
        RepairPriority priority,
        DateTimeOffset createdAt)
    {
        Id = id;
        Reference = reference;
        CustomerDisplayName = customerDisplayName;
        ReportedFault = reportedFault;
        Priority = priority;
        Status = RepairCaseStatus.CheckedIn;
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
        Version = 1;
    }

    public Guid Id { get; private set; }
    public string Reference { get; private set; } = string.Empty;
    public string CustomerDisplayName { get; private set; } = string.Empty;
    public string ReportedFault { get; private set; } = string.Empty;
    public RepairPriority Priority { get; private set; }
    public RepairCaseStatus Status { get; private set; }
    public Guid? AssignedTechnicianId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public int Version { get; private set; }
    public DeviceAsset? Device { get; private set; }
    public List<EvidenceItem> Evidence { get; private set; } = [];
    public List<AuditEntry> AuditEntries { get; private set; } = [];

    public static RepairCase Create(
        string reference,
        string customerDisplayName,
        string reportedFault,
        RepairPriority priority,
        DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reference);
        ArgumentException.ThrowIfNullOrWhiteSpace(customerDisplayName);
        ArgumentException.ThrowIfNullOrWhiteSpace(reportedFault);

        return new RepairCase(Guid.CreateVersion7(), reference.Trim(), customerDisplayName.Trim(), reportedFault.Trim(), priority, now);
    }

    public void AttachDevice(string manufacturer, string model, string category, string serialNumber)
    {
        if (Device is not null)
        {
            throw new InvalidOperationException("A repair case can only have one primary device.");
        }

        Device = DeviceAsset.Create(Id, manufacturer, model, category, serialNumber);
    }

    public void TransitionTo(RepairCaseStatus next, Guid actorId, DateTimeOffset now, string? note = null)
    {
        if (!AllowedTransitions[Status].Contains(next))
        {
            throw new InvalidOperationException($"Transition from {Status} to {next} is not allowed.");
        }

        var previous = Status;
        Status = next;
        UpdatedAt = now;
        Version++;
        AuditEntries.Add(AuditEntry.RecordStatusChange(Id, actorId, previous, next, note, now));
    }
}
