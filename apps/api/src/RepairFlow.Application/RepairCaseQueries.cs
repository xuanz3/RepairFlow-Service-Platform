namespace RepairFlow.Application;

public sealed class RepairCaseQueries(IRepairCaseRepository repository)
{
    public async Task<IReadOnlyList<RepairCaseSummaryDto>> ListAsync(
        CancellationToken cancellationToken)
    {
        var cases = await repository.ListAsync(cancellationToken);
        return cases.Select(item => item.ToSummary()).ToArray();
    }

    public async Task<RepairCaseDetailDto> GetAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var repairCase = await repository.FindAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Repair case was not found.");
        return repairCase.ToDetail();
    }
}
