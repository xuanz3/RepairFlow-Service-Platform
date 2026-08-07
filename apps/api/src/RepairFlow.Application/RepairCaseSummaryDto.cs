using RepairFlow.Domain;

namespace RepairFlow.Application;

public sealed record DeviceSummaryDto(
    Guid Id,
    string Manufacturer,
    string Model,
    string Category,
    string SerialNumberMasked,
    string IntakeCondition);

public sealed record EvidenceMetadataDto(
    Guid Id,
    string FileName,
    string ContentType,
    long SizeBytes,
    string? Sha256,
    EvidenceKind Kind,
    string? Note,
    DateTimeOffset CreatedAt);

public sealed record DiagnosisRecordDto(
    Guid Id,
    string Summary,
    string Recommendation,
    string? DiagnosticCode,
    DateTimeOffset CreatedAt,
    Guid ActorId);

public sealed record RepairActionDto(
    Guid Id,
    string Title,
    string Detail,
    string? PartNumber,
    RepairActionStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt,
    Guid ActorId);

public sealed record QualityReviewDto(
    Guid Id,
    QualityOutcome Outcome,
    string Notes,
    bool EvidenceComplete,
    DateTimeOffset CreatedAt,
    Guid ActorId);

public sealed record RepairCaseSummaryDto(
    Guid Id,
    string Reference,
    string CustomerDisplayName,
    DeviceSummaryDto Device,
    RepairCaseStatus Status,
    RepairPriority Priority,
    Guid? AssignedTechnicianId,
    DateTimeOffset UpdatedAt,
    int Version);

public sealed record RepairCaseDetailDto(
    Guid Id,
    string Reference,
    string CustomerDisplayName,
    DeviceSummaryDto Device,
    RepairCaseStatus Status,
    RepairPriority Priority,
    Guid? AssignedTechnicianId,
    DateTimeOffset UpdatedAt,
    int Version,
    string ReportedFault,
    string IntakeCondition,
    DiagnosisRecordDto? Diagnosis,
    IReadOnlyList<RepairActionDto> RepairActions,
    IReadOnlyList<EvidenceMetadataDto> Evidence,
    IReadOnlyList<QualityReviewDto> QualityReviews);
