using RepairFlow.Domain;

namespace RepairFlow.Application;

public static class RepairCaseMapper
{
    public static RepairCaseSummaryDto ToSummary(this RepairCase item)
    {
        var device = item.Device
            ?? throw new InvalidOperationException("Repair cases require a primary device.");

        return new RepairCaseSummaryDto(
            item.Id,
            item.Reference,
            item.CustomerDisplayName,
            device.ToDto(),
            item.Status,
            item.Priority,
            item.AssignedTechnicianId,
            item.UpdatedAt,
            item.Version);
    }

    public static RepairCaseDetailDto ToDetail(this RepairCase item)
    {
        var device = item.Device
            ?? throw new InvalidOperationException("Repair cases require a primary device.");

        return new RepairCaseDetailDto(
            item.Id,
            item.Reference,
            item.CustomerDisplayName,
            device.ToDto(),
            item.Status,
            item.Priority,
            item.AssignedTechnicianId,
            item.UpdatedAt,
            item.Version,
            item.ReportedFault,
            device.IntakeCondition,
            item.Diagnosis is null
                ? null
                : new DiagnosisRecordDto(
                    item.Diagnosis.Id,
                    item.Diagnosis.Summary,
                    item.Diagnosis.Recommendation,
                    item.Diagnosis.DiagnosticCode,
                    item.Diagnosis.CreatedAt,
                    item.Diagnosis.ActorId),
            item.RepairActions
                .OrderBy(action => action.CreatedAt)
                .Select(action => new RepairActionDto(
                    action.Id,
                    action.Title,
                    action.Detail,
                    action.PartNumber,
                    action.Status,
                    action.CreatedAt,
                    action.CompletedAt,
                    action.ActorId))
                .ToArray(),
            item.Evidence
                .OrderByDescending(evidence => evidence.CreatedAt)
                .Select(evidence => new EvidenceMetadataDto(
                    evidence.Id,
                    evidence.FileName,
                    evidence.ContentType,
                    evidence.SizeBytes,
                    evidence.Sha256,
                    evidence.Kind,
                    evidence.Note,
                    evidence.CreatedAt))
                .ToArray(),
            item.QualityReviews
                .OrderByDescending(review => review.CreatedAt)
                .Select(review => new QualityReviewDto(
                    review.Id,
                    review.Outcome,
                    review.Notes,
                    review.EvidenceComplete,
                    review.CreatedAt,
                    review.ActorId))
                .ToArray());
    }

    private static DeviceSummaryDto ToDto(this DeviceAsset device) =>
        new(
            device.Id,
            device.Manufacturer,
            device.Model,
            device.Category,
            device.GetMaskedSerialNumber(),
            device.IntakeCondition);
}
