using Microsoft.EntityFrameworkCore;
using RepairFlow.Application;
using RepairFlow.Domain;

namespace RepairFlow.Infrastructure.Persistence;

public sealed class SyncRepository(RepairFlowDbContext database) : ISyncRepository
{
    public async Task AcquireOperationLockAsync(Guid operationId, CancellationToken cancellationToken)
    {
        if (!string.Equals(
                database.Database.ProviderName,
                "Npgsql.EntityFrameworkCore.PostgreSQL",
                StringComparison.Ordinal))
        {
            return;
        }

        await database.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT pg_advisory_xact_lock(hashtextextended({operationId.ToString()}, 0))",
            cancellationToken);
    }

    public Task<SyncOperationRecord?> FindOperationAsync(Guid operationId, CancellationToken cancellationToken) =>
        database.SyncOperations.SingleOrDefaultAsync(item => item.OperationId == operationId, cancellationToken);

    public async Task AddOperationAsync(SyncOperationRecord operation, CancellationToken cancellationToken) =>
        await database.SyncOperations.AddAsync(operation, cancellationToken);

    public async Task<long> GetLatestCursorAsync(CancellationToken cancellationToken) =>
        await database.SyncChanges
            .Select(item => (long?)item.Id)
            .MaxAsync(cancellationToken) ?? 0L;

    public async Task<IReadOnlySet<Guid>> ListTombstonedRepairCaseIdsAsync(
        CancellationToken cancellationToken)
    {
        var changes = await database.SyncChanges
            .AsNoTracking()
            .Where(item => item.EntityType == "repair-case")
            .OrderBy(item => item.Id)
            .Select(item => new { item.EntityId, item.Deleted })
            .ToArrayAsync(cancellationToken);

        return changes
            .GroupBy(item => item.EntityId)
            .Where(group => group.Last().Deleted)
            .Select(group => group.Key)
            .ToHashSet();
    }

    public async Task<IReadOnlyList<SyncChange>> ListChangesAfterAsync(
        long cursor,
        int limit,
        CancellationToken cancellationToken) =>
        await database.SyncChanges
            .AsNoTracking()
            .Where(item => item.Id > cursor)
            .OrderBy(item => item.Id)
            .Take(limit)
            .ToArrayAsync(cancellationToken);

    public Task<bool> HasChangesAfterAsync(long cursor, CancellationToken cancellationToken) =>
        database.SyncChanges.AnyAsync(item => item.Id > cursor, cancellationToken);

    public async Task AddChangeAsync(SyncChange change, CancellationToken cancellationToken) =>
        await database.SyncChanges.AddAsync(change, cancellationToken);

    public Task<AttachmentUploadSession?> FindUploadSessionAsync(
        Guid sessionId,
        CancellationToken cancellationToken) =>
        database.AttachmentUploadSessions.SingleOrDefaultAsync(item => item.Id == sessionId, cancellationToken);

    public async Task AddUploadSessionAsync(
        AttachmentUploadSession session,
        CancellationToken cancellationToken) =>
        await database.AttachmentUploadSessions.AddAsync(session, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        database.SaveChangesAsync(cancellationToken);

    public async Task<T> ExecuteInTransactionAsync<T>(
        Func<CancellationToken, Task<T>> action,
        CancellationToken cancellationToken)
    {
        if (!database.Database.IsRelational())
        {
            return await action(cancellationToken);
        }

        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var result = await action(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return result;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
