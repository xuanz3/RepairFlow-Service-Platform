using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using RepairFlow.Domain;

namespace RepairFlow.Application;

public sealed class SyncCoordinator(
    ISyncRepository syncRepository,
    IRepairCaseRepository repairCases,
    RepairCaseQueries queries,
    RepairCaseWorkflowService workflows,
    TimeProvider timeProvider)
{
    private static readonly JsonSerializerOptions StorageJsonOptions = new(JsonSerializerDefaults.Web);
    private const int MaxDeltaPageSize = 200;

    public Task<SyncOperationReceiptDto> ApplyAsync(
        Guid actorId,
        SyncOperationRequest request,
        CancellationToken cancellationToken)
    {
        ValidateOperation(request);
        var requestHash = HashRequest(request);

        return syncRepository.ExecuteInTransactionAsync(
            async transactionToken =>
            {
                await syncRepository.AcquireOperationLockAsync(request.OperationId, transactionToken);
                var existing = await syncRepository.FindOperationAsync(request.OperationId, transactionToken);
                if (existing is not null)
                {
                    if (existing.ActorId != actorId)
                    {
                        throw new InvalidOperationException(
                            "The operation id belongs to a different authenticated actor.");
                    }
                    if (!CryptographicOperations.FixedTimeEquals(
                            Encoding.ASCII.GetBytes(existing.RequestHash),
                            Encoding.ASCII.GetBytes(requestHash)))
                    {
                        throw new InvalidOperationException(
                            "The operation id was reused with a different request payload.");
                    }

                    if (string.IsNullOrWhiteSpace(existing.ResponseJson))
                    {
                        throw new InvalidOperationException(
                            "The operation is already being processed. Retry after the current attempt completes.");
                    }

                    var replay = JsonSerializer.Deserialize<SyncOperationReceiptDto>(
                            existing.ResponseJson,
                            StorageJsonOptions)
                        ?? throw new InvalidOperationException("Stored idempotency result is invalid.");
                    return replay with { Status = "replayed" };
                }

                var now = timeProvider.GetUtcNow();
                var operation = SyncOperationRecord.Begin(
                    request.OperationId,
                    actorId,
                    request.Kind,
                    requestHash,
                    now);
                await syncRepository.AddOperationAsync(operation, transactionToken);
                await syncRepository.SaveChangesAsync(transactionToken);

                try
                {
                    var repairCase = await ExecuteMutationAsync(actorId, request, transactionToken);
                    var receipt = new SyncOperationReceiptDto(
                        request.OperationId,
                        "applied",
                        repairCase.Version,
                        repairCase,
                        null);
                    var receiptJson = JsonSerializer.Serialize(receipt, StorageJsonOptions);
                    operation.Complete(receiptJson, SyncOperationState.Applied, timeProvider.GetUtcNow());
                    await syncRepository.AddChangeAsync(
                        SyncChange.Snapshot(
                            repairCase.Id,
                            repairCase.Version,
                            JsonSerializer.Serialize(repairCase, StorageJsonOptions),
                            timeProvider.GetUtcNow()),
                        transactionToken);
                    await syncRepository.SaveChangesAsync(transactionToken);
                    return receipt;
                }
                catch (RepairCaseVersionConflictException)
                {
                    var repairCaseId = RequireRepairCaseId(request);
                    var server = await queries.GetAsync(repairCaseId, transactionToken);
                    var conflict = BuildConflict(request, server);
                    var receipt = new SyncOperationReceiptDto(
                        request.OperationId,
                        "conflict",
                        server.Version,
                        server,
                        conflict);
                    operation.Complete(
                        JsonSerializer.Serialize(receipt, StorageJsonOptions),
                        SyncOperationState.Conflict,
                        timeProvider.GetUtcNow());
                    await syncRepository.SaveChangesAsync(transactionToken);
                    return receipt;
                }
            },
            cancellationToken);
    }

    public async Task<DeltaPageDto> PullAsync(
        long? cursor,
        int limit,
        CancellationToken cancellationToken)
    {
        if (cursor is < 0) throw new ArgumentOutOfRangeException(nameof(cursor));
        var safeLimit = Math.Clamp(limit, 1, MaxDeltaPageSize);

        if (cursor is null)
        {
            var cases = await repairCases.ListAsync(cancellationToken);
            var tombstoned = await syncRepository.ListTombstonedRepairCaseIdsAsync(cancellationToken);
            var latestCursor = await syncRepository.GetLatestCursorAsync(cancellationToken);
            var snapshot = cases
                .Where(item => !tombstoned.Contains(item.Id))
                .OrderBy(item => item.UpdatedAt)
                .Select(item => new DeltaChangeDto(
                    latestCursor,
                    "repair-case",
                    item.Id,
                    item.Version,
                    false,
                    item.UpdatedAt,
                    item.ToDetail()))
                .ToArray();
            return new DeltaPageDto(latestCursor, false, true, snapshot);
        }

        var changes = await syncRepository.ListChangesAfterAsync(
            cursor.Value,
            safeLimit,
            cancellationToken);
        var mapped = changes.Select(MapChange).ToArray();
        var nextCursor = mapped.Length == 0 ? cursor.Value : mapped[^1].Cursor;
        var hasMore = await syncRepository.HasChangesAfterAsync(nextCursor, cancellationToken);
        return new DeltaPageDto(nextCursor, hasMore, false, mapped);
    }

    public async Task<DeltaChangeDto> RecordTombstoneAsync(
        SyncTombstoneRequest request,
        CancellationToken cancellationToken)
    {
        if (request.EntityId == Guid.Empty) throw new ArgumentException("Entity id is required.");
        if (request.Version < 1) throw new ArgumentOutOfRangeException(nameof(request.Version));

        var change = SyncChange.Tombstone(request.EntityId, request.Version, timeProvider.GetUtcNow());
        await syncRepository.AddChangeAsync(change, cancellationToken);
        await syncRepository.SaveChangesAsync(cancellationToken);
        return MapChange(change);
    }

    private async Task<RepairCaseDetailDto> ExecuteMutationAsync(
        Guid actorId,
        SyncOperationRequest request,
        CancellationToken cancellationToken)
    {
        return request.Kind switch
        {
            SyncOperationKinds.RepairCaseCreate => await workflows.CreateWithIdAsync(
                RequireRepairCaseId(request),
                Deserialize<CreateRepairCaseRequest>(request),
                cancellationToken),
            SyncOperationKinds.DiagnosisRecord => await workflows.RecordDiagnosisAsync(
                RequireRepairCaseId(request),
                actorId,
                Deserialize<RecordDiagnosisRequest>(request),
                cancellationToken),
            SyncOperationKinds.RepairActionCreate => await workflows.AddRepairActionAsync(
                RequireRepairCaseId(request),
                actorId,
                Deserialize<CreateRepairActionRequest>(request),
                cancellationToken),
            SyncOperationKinds.RepairActionComplete => await CompleteRepairActionAsync(
                actorId,
                request,
                cancellationToken),
            SyncOperationKinds.EvidenceAdd => await workflows.AddEvidenceAsync(
                RequireRepairCaseId(request),
                actorId,
                Deserialize<CreateEvidenceRequest>(request),
                cancellationToken),
            SyncOperationKinds.QualitySubmit => await workflows.SubmitQualityReviewAsync(
                RequireRepairCaseId(request),
                actorId,
                Deserialize<SubmitQualityReviewRequest>(request),
                cancellationToken),
            SyncOperationKinds.StatusUpdate => await workflows.TransitionAsync(
                RequireRepairCaseId(request),
                actorId,
                Deserialize<UpdateRepairStatusRequest>(request),
                cancellationToken),
            _ => throw new ArgumentException($"Unsupported sync operation kind: {request.Kind}")
        };
    }

    private async Task<RepairCaseDetailDto> CompleteRepairActionAsync(
        Guid actorId,
        SyncOperationRequest request,
        CancellationToken cancellationToken)
    {
        var payload = Deserialize<CompleteRepairActionSyncRequest>(request);
        return await workflows.CompleteRepairActionAsync(
            RequireRepairCaseId(request),
            payload.ActionId,
            actorId,
            new CompleteRepairActionRequest(payload.ExpectedVersion),
            cancellationToken);
    }

    private static T Deserialize<T>(SyncOperationRequest request)
    {
        return JsonSerializer.Deserialize<T>(request.Payload.GetRawText(), StorageJsonOptions)
            ?? throw new ArgumentException($"Sync payload for {request.Kind} is invalid.");
    }

    private static Guid RequireRepairCaseId(SyncOperationRequest request) =>
        request.RepairCaseId is { } id && id != Guid.Empty
            ? id
            : throw new ArgumentException($"Sync operation {request.Kind} requires a repair case id.");

    private static void ValidateOperation(SyncOperationRequest request)
    {
        if (request.OperationId == Guid.Empty) throw new ArgumentException("Operation id is required.");
        if (!SyncOperationKinds.All.Contains(request.Kind))
        {
            throw new ArgumentException($"Unsupported sync operation kind: {request.Kind}");
        }
        if (request.BaseVersion is < 1) throw new ArgumentOutOfRangeException(nameof(request.BaseVersion));
        if (request.Kind == SyncOperationKinds.RepairCaseCreate)
        {
            _ = RequireRepairCaseId(request);
            if (request.BaseVersion is not null)
            {
                throw new ArgumentException("Create operations must not declare a base version.");
            }
        }
        else if (request.BaseVersion is null)
        {
            throw new ArgumentException("Mutation operations require a base version.");
        }
        if (request.Payload.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            throw new ArgumentException("Sync operation payload is required.");
        }
    }

    private static string HashRequest(SyncOperationRequest request)
    {
        var canonical = JsonSerializer.Serialize(new
        {
            request.Kind,
            request.RepairCaseId,
            request.BaseVersion,
            Payload = request.Payload
        }, StorageJsonOptions);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
    }

    private static SyncConflictDto BuildConflict(
        SyncOperationRequest request,
        RepairCaseDetailDto server)
    {
        var differences = new List<SyncFieldDifferenceDto>
        {
            new(
                "aggregateVersion",
                request.BaseVersion?.ToString(),
                server.Version.ToString())
        };

        if (request.Kind == SyncOperationKinds.StatusUpdate &&
            request.Payload.TryGetProperty("status", out var localStatus))
        {
            differences.Add(new SyncFieldDifferenceDto(
                "status",
                localStatus.GetString(),
                server.Status.ToString()));
        }

        return new SyncConflictDto(
            "repair-case",
            server.Id,
            request.BaseVersion,
            server.Version,
            differences);
    }

    private static DeltaChangeDto MapChange(SyncChange change)
    {
        RepairCaseDetailDto? payload = null;
        if (!change.Deleted && !string.IsNullOrWhiteSpace(change.PayloadJson))
        {
            payload = JsonSerializer.Deserialize<RepairCaseDetailDto>(
                change.PayloadJson,
                StorageJsonOptions);
        }

        return new DeltaChangeDto(
            change.Id,
            change.EntityType,
            change.EntityId,
            change.Version,
            change.Deleted,
            change.ChangedAt,
            payload);
    }
}
