using RepairFlow.Domain;

namespace RepairFlow.Application;

public sealed record CreateRepairCaseRequest(
    string CustomerDisplayName,
    string Manufacturer,
    string Model,
    string Category,
    string SerialNumber,
    string ReportedFault,
    string IntakeCondition,
    RepairPriority Priority);

public sealed record RecordDiagnosisRequest(
    string Summary,
    string Recommendation,
    string? DiagnosticCode,
    int ExpectedVersion);

public sealed record CreateRepairActionRequest(
    string Title,
    string Detail,
    string? PartNumber,
    int ExpectedVersion);

public sealed record CompleteRepairActionRequest(int ExpectedVersion);

public sealed record CreateEvidenceRequest(
    string FileName,
    string ContentType,
    long SizeBytes,
    string? Sha256,
    EvidenceKind Kind,
    string? Note,
    int ExpectedVersion);

public sealed record SubmitQualityReviewRequest(
    QualityOutcome Outcome,
    string Notes,
    bool EvidenceComplete,
    int ExpectedVersion);

public sealed record UpdateRepairStatusRequest(
    RepairCaseStatus Status,
    int ExpectedVersion,
    string? Note);
