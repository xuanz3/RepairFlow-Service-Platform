using Microsoft.EntityFrameworkCore;
using RepairFlow.Application;
using RepairFlow.Domain;

namespace RepairFlow.Infrastructure.Persistence;

public sealed class RepairCaseRepository(RepairFlowDbContext database) : IRepairCaseRepository
{
    public async Task<IReadOnlyList<RepairCase>> ListAsync(CancellationToken cancellationToken)
    {
        return await database.RepairCases
            .AsNoTracking()
            .Include(item => item.Device)
            .OrderByDescending(item => item.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<RepairCase?> FindAsync(Guid id, CancellationToken cancellationToken)
    {
        return database.RepairCases
            .Include(item => item.Device)
            .Include(item => item.AuditEntries)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
    }

    public Task AddAsync(RepairCase repairCase, CancellationToken cancellationToken)
    {
        return database.RepairCases.AddAsync(repairCase, cancellationToken).AsTask();
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return database.SaveChangesAsync(cancellationToken);
    }
}
