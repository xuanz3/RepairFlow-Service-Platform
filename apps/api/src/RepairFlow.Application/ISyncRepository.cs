using RepairFlow.Domain;

namespace RepairFlow.Application;

public interface ISyncRepository
{
    Task AcquireOperationLockAsync(Guid operationId, CancellationToken cancellationToken);
    Task<SyncOperationRecord?> FindOperationAsync(Guid operationId, CancellationToken cancellationToken);
    Task AddOperationAsync(SyncOperationRecord operation, CancellationToken cancellationToken);
    Task<long> GetLatestCursorAsync(CancellationToken cancellationToken);
    Task<IReadOnlySet<Guid>> ListTombstonedRepairCaseIdsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<SyncChange>> ListChangesAfterAsync(long cursor, int limit, CancellationToken cancellationToken);
    Task<bool> HasChangesAfterAsync(long cursor, CancellationToken cancellationToken);
    Task AddChangeAsync(SyncChange change, CancellationToken cancellationToken);
    Task<AttachmentUploadSession?> FindUploadSessionAsync(Guid sessionId, CancellationToken cancellationToken);
    Task AddUploadSessionAsync(AttachmentUploadSession session, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    Task<T> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken);
}
