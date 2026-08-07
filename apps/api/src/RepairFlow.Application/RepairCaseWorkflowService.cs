using RepairFlow.Domain;

namespace RepairFlow.Application;

public sealed class RepairCaseWorkflowService(
    IRepairCaseRepository repository,
    TimeProvider timeProvider)
{
    public Task<RepairCaseDetailDto> CreateAsync(
        CreateRepairCaseRequest request,
        CancellationToken cancellationToken) =>
        CreateCoreAsync(request, null, cancellationToken);

    public Task<RepairCaseDetailDto> CreateWithIdAsync(
        Guid id,
        CreateRepairCaseRequest request,
        CancellationToken cancellationToken) =>
        CreateCoreAsync(request, id, cancellationToken);

    private async Task<RepairCaseDetailDto> CreateCoreAsync(
        CreateRepairCaseRequest request,
        Guid? requestedId,
        CancellationToken cancellationToken)
    {
        ValidateCreate(request);
        var now = timeProvider.GetUtcNow();
        var reference = await CreateReferenceAsync(now, cancellationToken);
        var repairCase = requestedId is { } id
            ? RepairCase.CreateWithId(
                id,
                reference,
                request.CustomerDisplayName,
                request.ReportedFault,
                request.Priority,
                now)
            : RepairCase.Create(
                reference,
                request.CustomerDisplayName,
                request.ReportedFault,
                request.Priority,
                now);

        repairCase.AttachDevice(
            request.Manufacturer,
            request.Model,
            request.Category,
            request.SerialNumber,
            request.IntakeCondition);

        await repository.AddAsync(repairCase, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return repairCase.ToDetail();
    }

    public Task<RepairCaseDetailDto> RecordDiagnosisAsync(
        Guid id,
        Guid actorId,
        RecordDiagnosisRequest request,
        CancellationToken cancellationToken) =>
        MutateAsync(
            id,
            repairCase => repairCase.RecordDiagnosis(
                actorId,
                request.Summary,
                request.Recommendation,
                request.DiagnosticCode,
                request.ExpectedVersion,
                timeProvider.GetUtcNow()),
            cancellationToken);

    public Task<RepairCaseDetailDto> AddRepairActionAsync(
        Guid id,
        Guid actorId,
        CreateRepairActionRequest request,
        CancellationToken cancellationToken) =>
        MutateAsync(
            id,
            repairCase => repairCase.AddRepairAction(
                actorId,
                request.Title,
                request.Detail,
                request.PartNumber,
                request.ExpectedVersion,
                timeProvider.GetUtcNow()),
            cancellationToken);

    public Task<RepairCaseDetailDto> CompleteRepairActionAsync(
        Guid id,
        Guid actionId,
        Guid actorId,
        CompleteRepairActionRequest request,
        CancellationToken cancellationToken) =>
        MutateAsync(
            id,
            repairCase => repairCase.CompleteRepairAction(
                actionId,
                actorId,
                request.ExpectedVersion,
                timeProvider.GetUtcNow()),
            cancellationToken);

    public Task<RepairCaseDetailDto> AddEvidenceAsync(
        Guid id,
        Guid actorId,
        CreateEvidenceRequest request,
        CancellationToken cancellationToken) =>
        MutateAsync(
            id,
            repairCase => repairCase.AddEvidence(
                request.FileName,
                request.ContentType,
                request.SizeBytes,
                request.Sha256,
                request.Kind,
                request.Note,
                actorId,
                request.ExpectedVersion,
                timeProvider.GetUtcNow()),
            cancellationToken);

    public Task<RepairCaseDetailDto> SubmitQualityReviewAsync(
        Guid id,
        Guid actorId,
        SubmitQualityReviewRequest request,
        CancellationToken cancellationToken) =>
        MutateAsync(
            id,
            repairCase => repairCase.SubmitQualityReview(
                actorId,
                request.Outcome,
                request.Notes,
                request.EvidenceComplete,
                request.ExpectedVersion,
                timeProvider.GetUtcNow()),
            cancellationToken);

    public Task<RepairCaseDetailDto> TransitionAsync(
        Guid id,
        Guid actorId,
        UpdateRepairStatusRequest request,
        CancellationToken cancellationToken) =>
        MutateAsync(
            id,
            repairCase => repairCase.TransitionTo(
                request.Status,
                actorId,
                request.ExpectedVersion,
                timeProvider.GetUtcNow(),
                request.Note),
            cancellationToken);

    private async Task<RepairCaseDetailDto> MutateAsync(
        Guid id,
        Action<RepairCase> mutation,
        CancellationToken cancellationToken)
    {
        var repairCase = await repository.FindAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Repair case was not found.");

        mutation(repairCase);
        await repository.SaveChangesAsync(cancellationToken);
        return repairCase.ToDetail();
    }

    private async Task<string> CreateReferenceAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var suffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
            var reference = $"RF-{now:yyMM}-{suffix}";
            if (!await repository.ReferenceExistsAsync(reference, cancellationToken))
            {
                return reference;
            }
        }

        throw new InvalidOperationException("A unique repair reference could not be generated.");
    }

    private static void ValidateCreate(CreateRepairCaseRequest request)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.CustomerDisplayName);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Manufacturer);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Model);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Category);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.SerialNumber);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ReportedFault);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.IntakeCondition);
    }
}
