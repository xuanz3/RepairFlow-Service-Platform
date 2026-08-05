namespace RepairFlow.Application;

public sealed class RepairCaseQueries(IRepairCaseRepository repository)
{
    public async Task<IReadOnlyList<RepairCaseSummaryDto>> ListAsync(CancellationToken cancellationToken)
    {
        var cases = await repository.ListAsync(cancellationToken);
        return cases
            .Where(item => item.Device is not null)
            .Select(item => new RepairCaseSummaryDto(
                item.Id,
                item.Reference,
                item.CustomerDisplayName,
                new DeviceSummaryDto(
                    item.Device!.Id,
                    item.Device.Manufacturer,
                    item.Device.Model,
                    item.Device.Category,
                    item.Device.GetMaskedSerialNumber()),
                item.Status,
                item.Priority,
                item.AssignedTechnicianId,
                item.UpdatedAt,
                item.Version))
            .ToArray();
    }
}
