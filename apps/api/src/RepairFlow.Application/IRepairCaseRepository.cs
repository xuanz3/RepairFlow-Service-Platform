using RepairFlow.Domain;

namespace RepairFlow.Application;

public interface IRepairCaseRepository
{
    Task<IReadOnlyList<RepairCase>> ListAsync(CancellationToken cancellationToken);
    Task<RepairCase?> FindAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(RepairCase repairCase, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
