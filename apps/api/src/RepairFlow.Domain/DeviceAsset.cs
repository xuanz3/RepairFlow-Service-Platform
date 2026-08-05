namespace RepairFlow.Domain;

public sealed class DeviceAsset
{
    private DeviceAsset() { }

    private DeviceAsset(Guid repairCaseId, string manufacturer, string model, string category, string serialNumber)
    {
        Id = Guid.CreateVersion7();
        RepairCaseId = repairCaseId;
        Manufacturer = manufacturer.Trim();
        Model = model.Trim();
        Category = category.Trim();
        SerialNumber = serialNumber.Trim();
    }

    public Guid Id { get; private set; }
    public Guid RepairCaseId { get; private set; }
    public string Manufacturer { get; private set; } = string.Empty;
    public string Model { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public string SerialNumber { get; private set; } = string.Empty;

    public static DeviceAsset Create(Guid repairCaseId, string manufacturer, string model, string category, string serialNumber)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(manufacturer);
        ArgumentException.ThrowIfNullOrWhiteSpace(model);
        ArgumentException.ThrowIfNullOrWhiteSpace(category);
        ArgumentException.ThrowIfNullOrWhiteSpace(serialNumber);
        return new DeviceAsset(repairCaseId, manufacturer, model, category, serialNumber);
    }

    public string GetMaskedSerialNumber()
    {
        if (SerialNumber.Length <= 4)
        {
            return new string('*', SerialNumber.Length);
        }

        return $"{new string('*', SerialNumber.Length - 4)}{SerialNumber[^4..]}";
    }
}
