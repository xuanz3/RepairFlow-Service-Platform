using RepairFlow.Domain;

namespace RepairFlow.Application;

public sealed record DeviceSummaryDto(
    Guid Id,
    string Manufacturer,
    string Model,
    string Category,
    string SerialNumberMasked);

public sealed record RepairCaseSummaryDto(
    Guid Id,
    string Reference,
    string CustomerDisplayName,
    DeviceSummaryDto Device,
    RepairCaseStatus Status,
    RepairPriority Priority,
    Guid? AssignedTechnicianId,
    DateTimeOffset UpdatedAt,
    int Version);
