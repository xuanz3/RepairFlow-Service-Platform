using System.Text.Json;
using RepairFlow.Domain;

namespace RepairFlow.Application;

public static class SyncOperationKinds
{
    public const string RepairCaseCreate = "repair-case.create";
    public const string DiagnosisRecord = "diagnosis.record";
    public const string RepairActionCreate = "repair-action.create";
    public const string RepairActionComplete = "repair-action.complete";
    public const string EvidenceAdd = "evidence.add";
    public const string QualitySubmit = "quality.submit";
    public const string StatusUpdate = "status.update";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        RepairCaseCreate,
        DiagnosisRecord,
        RepairActionCreate,
        RepairActionComplete,
        EvidenceAdd,
        QualitySubmit,
        StatusUpdate
    };
}

public sealed record SyncOperationRequest(
    Guid OperationId,
    string Kind,
    Guid? RepairCaseId,
    int? BaseVersion,
    JsonElement Payload,
    DateTimeOffset CreatedAt);

public sealed record SyncFieldDifferenceDto(
    string Field,
    string? LocalValue,
    string? ServerValue);

public sealed record SyncConflictDto(
    string EntityType,
    Guid EntityId,
    int? BaseVersion,
    int ServerVersion,
    IReadOnlyList<SyncFieldDifferenceDto> Differences);

public sealed record SyncOperationReceiptDto(
    Guid OperationId,
    string Status,
    int? ServerVersion,
    RepairCaseDetailDto? RepairCase,
    SyncConflictDto? Conflict);

public sealed record DeltaChangeDto(
    long Cursor,
    string EntityType,
    Guid EntityId,
    int Version,
    bool Deleted,
    DateTimeOffset ChangedAt,
    RepairCaseDetailDto? Payload);

public sealed record DeltaPageDto(
    long NextCursor,
    bool HasMore,
    bool Snapshot,
    IReadOnlyList<DeltaChangeDto> Changes);

public sealed record CompleteRepairActionSyncRequest(
    Guid ActionId,
    int ExpectedVersion);

public sealed record SyncTombstoneRequest(
    Guid EntityId,
    int Version);

public sealed record BeginUploadRequest(
    Guid RepairCaseId,
    Guid EvidenceId,
    string FileName,
    string ContentType,
    long TotalBytes,
    string Sha256);

public sealed record UploadSessionDto(
    Guid SessionId,
    Guid RepairCaseId,
    Guid EvidenceId,
    string FileName,
    string ContentType,
    long TotalBytes,
    long ReceivedBytes,
    string Sha256,
    int ChunkSize,
    string State,
    DateTimeOffset ExpiresAt)
{
    public static UploadSessionDto FromDomain(AttachmentUploadSession session) =>
        new(
            session.Id,
            session.RepairCaseId,
            session.EvidenceId,
            session.FileName,
            session.ContentType,
            session.TotalBytes,
            session.ReceivedBytes,
            session.Sha256,
            session.ChunkSize,
            session.State.ToString().ToLowerInvariant(),
            session.ExpiresAt);
}
