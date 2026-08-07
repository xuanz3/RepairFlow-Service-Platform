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
    public DiagnosisRecord? Diagnosis { get; private set; }
    public List<RepairAction> RepairActions { get; private set; } = [];
    public List<EvidenceItem> Evidence { get; private set; } = [];
    public List<QualityReview> QualityReviews { get; private set; } = [];
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

        return new RepairCase(
            Guid.CreateVersion7(),
            reference.Trim(),
            customerDisplayName.Trim(),
            reportedFault.Trim(),
            priority,
            now);
    }

    public void AttachDevice(
        string manufacturer,
        string model,
        string category,
        string serialNumber,
        string intakeCondition)
    {
        if (Device is not null)
        {
            throw new InvalidOperationException("A repair case can only have one primary device.");
        }

        Device = DeviceAsset.Create(
            Id,
            manufacturer,
            model,
            category,
            serialNumber,
            intakeCondition);
    }

    public void AssignTechnician(Guid technicianId, Guid actorId, int expectedVersion, DateTimeOffset now)
    {
        EnsureVersion(expectedVersion);
        AssignedTechnicianId = technicianId;
        Touch(now);
        AuditEntries.Add(AuditEntry.Record(Id, actorId, "technician.assigned", technicianId.ToString(), now));
    }

    public void RecordDiagnosis(
        Guid actorId,
        string summary,
        string recommendation,
        string? diagnosticCode,
        int expectedVersion,
        DateTimeOffset now)
    {
        EnsureVersion(expectedVersion);

        if (Status is RepairCaseStatus.Delivered or RepairCaseStatus.Cancelled)
        {
            throw new InvalidOperationException("A diagnosis cannot be recorded for a closed repair case.");
        }

        Diagnosis = DiagnosisRecord.Create(
            Id,
            actorId,
            summary,
            recommendation,
            diagnosticCode,
            now);

        if (Status == RepairCaseStatus.CheckedIn)
        {
            Status = RepairCaseStatus.Diagnosing;
        }

        Touch(now);
        AuditEntries.Add(AuditEntry.Record(Id, actorId, "diagnosis.recorded", summary, now));
    }

    public RepairAction AddRepairAction(
        Guid actorId,
        string title,
        string detail,
        string? partNumber,
        int expectedVersion,
        DateTimeOffset now)
    {
        EnsureVersion(expectedVersion);

        if (Status is RepairCaseStatus.Delivered or RepairCaseStatus.Cancelled or RepairCaseStatus.ReadyForDelivery)
        {
            throw new InvalidOperationException("Repair actions cannot be added to the current workflow state.");
        }

        var action = RepairAction.Create(Id, actorId, title, detail, partNumber, now);
        RepairActions.Add(action);

        if (Status is RepairCaseStatus.CheckedIn or RepairCaseStatus.Diagnosing or RepairCaseStatus.AwaitingApproval)
        {
            Status = RepairCaseStatus.InRepair;
        }

        Touch(now);
        AuditEntries.Add(AuditEntry.Record(Id, actorId, "repair-action.created", title, now));
        return action;
    }

    public void CompleteRepairAction(Guid actionId, Guid actorId, int expectedVersion, DateTimeOffset now)
    {
        EnsureVersion(expectedVersion);
        var action = RepairActions.SingleOrDefault(item => item.Id == actionId)
            ?? throw new KeyNotFoundException("Repair action was not found.");

        action.Complete(now);
        Touch(now);
        AuditEntries.Add(AuditEntry.Record(Id, actorId, "repair-action.completed", action.Title, now));
    }

    public EvidenceItem AddEvidence(
        string fileName,
        string contentType,
        long sizeBytes,
        string? sha256,
        EvidenceKind kind,
        string? note,
        Guid actorId,
        int expectedVersion,
        DateTimeOffset now)
    {
        EnsureVersion(expectedVersion);

        if (Status is RepairCaseStatus.Delivered or RepairCaseStatus.Cancelled)
        {
            throw new InvalidOperationException("Evidence cannot be added to a closed repair case.");
        }

        var evidence = EvidenceItem.Create(
            Id,
            fileName,
            contentType,
            sizeBytes,
            sha256,
            kind,
            note,
            now);

        Evidence.Add(evidence);
        Touch(now);
        AuditEntries.Add(AuditEntry.Record(Id, actorId, "evidence.added", $"{kind}:{fileName}", now));
        return evidence;
    }

    public QualityReview SubmitQualityReview(
        Guid actorId,
        QualityOutcome outcome,
        string notes,
        bool evidenceComplete,
        int expectedVersion,
        DateTimeOffset now)
    {
        EnsureVersion(expectedVersion);

        if (Status != RepairCaseStatus.QualityCheck)
        {
            throw new InvalidOperationException("Quality review requires the quality-check workflow state.");
        }

        if (outcome == QualityOutcome.Passed && !evidenceComplete)
        {
            throw new InvalidOperationException("A passing quality review requires complete evidence.");
        }

        var review = QualityReview.Create(Id, actorId, outcome, notes, evidenceComplete, now);
        QualityReviews.Add(review);
        Status = outcome == QualityOutcome.Passed
            ? RepairCaseStatus.ReadyForDelivery
            : RepairCaseStatus.InRepair;

        Touch(now);
        AuditEntries.Add(AuditEntry.Record(Id, actorId, "quality.reviewed", outcome.ToString(), now));
        return review;
    }

    public void TransitionTo(
        RepairCaseStatus next,
        Guid actorId,
        int expectedVersion,
        DateTimeOffset now,
        string? note = null)
    {
        EnsureVersion(expectedVersion);

        if (!AllowedTransitions[Status].Contains(next))
        {
            throw new InvalidOperationException($"Transition from {Status} to {next} is not allowed.");
        }

        if (next == RepairCaseStatus.QualityCheck &&
            (RepairActions.Count == 0 || RepairActions.Any(item => item.Status != RepairActionStatus.Completed)))
        {
            throw new InvalidOperationException("All repair actions must be completed before quality review.");
        }

        var previous = Status;
        Status = next;
        Touch(now);
        AuditEntries.Add(AuditEntry.RecordStatusChange(Id, actorId, previous, next, note, now));
    }

    private void EnsureVersion(int expectedVersion)
    {
        if (expectedVersion != Version)
        {
            throw new RepairCaseVersionConflictException(expectedVersion, Version);
        }
    }

    private void Touch(DateTimeOffset now)
    {
        UpdatedAt = now;
        Version++;
    }
}
