using RepairFlow.Domain;
using Xunit;

namespace RepairFlow.Domain.Tests;

public sealed class RepairCaseTests
{
    private static readonly Guid ActorId =
        Guid.Parse("018f0a9b-4b55-7d62-9d10-11c359f9f101");

    [Fact]
    public void NewRepairCaseStartsCheckedInAtVersionOne()
    {
        var now = DateTimeOffset.Parse("2026-08-05T10:00:00Z");
        var repairCase = CreateCase(now);

        Assert.Equal(RepairCaseStatus.CheckedIn, repairCase.Status);
        Assert.Equal(RepairPriority.Priority, repairCase.Priority);
        Assert.Equal(1, repairCase.Version);
        Assert.NotNull(repairCase.Device);
        Assert.Equal("No visible impact damage.", repairCase.Device!.IntakeCondition);
    }

    [Fact]
    public void DiagnosisMovesCheckedInCaseIntoDiagnosing()
    {
        var now = DateTimeOffset.Parse("2026-08-05T10:00:00Z");
        var repairCase = CreateCase(now);

        repairCase.RecordDiagnosis(
            ActorId,
            "Charging instability reproduced under connector movement.",
            "Replace the charging daughterboard.",
            "PWR-INT",
            1,
            now.AddMinutes(10));

        Assert.Equal(RepairCaseStatus.Diagnosing, repairCase.Status);
        Assert.Equal(2, repairCase.Version);
        Assert.NotNull(repairCase.Diagnosis);
    }

    [Fact]
    public void StaleVersionIsRejectedBeforeMutation()
    {
        var now = DateTimeOffset.Parse("2026-08-05T10:00:00Z");
        var repairCase = CreateCase(now);

        repairCase.RecordDiagnosis(
            ActorId,
            "Charging instability reproduced.",
            "Replace the charging daughterboard.",
            null,
            1,
            now.AddMinutes(10));

        var exception = Assert.Throws<RepairCaseVersionConflictException>(() =>
            repairCase.AddRepairAction(
                ActorId,
                "Replace daughterboard",
                "Disconnect battery and replace board.",
                null,
                1,
                now.AddMinutes(20)));

        Assert.Equal(1, exception.ExpectedVersion);
        Assert.Equal(2, exception.ActualVersion);
        Assert.Empty(repairCase.RepairActions);
    }

    [Fact]
    public void QualityCheckRequiresAllRepairActionsCompleted()
    {
        var now = DateTimeOffset.Parse("2026-08-05T10:00:00Z");
        var repairCase = CreateCase(now);
        var action = repairCase.AddRepairAction(
            ActorId,
            "Replace daughterboard",
            "Disconnect battery and replace board.",
            "OR-USB14-DB01",
            1,
            now.AddMinutes(10));

        Assert.Throws<InvalidOperationException>(() =>
            repairCase.TransitionTo(
                RepairCaseStatus.QualityCheck,
                ActorId,
                2,
                now.AddMinutes(20)));

        repairCase.CompleteRepairAction(action.Id, ActorId, 2, now.AddMinutes(20));
        repairCase.TransitionTo(
            RepairCaseStatus.QualityCheck,
            ActorId,
            3,
            now.AddMinutes(30));

        Assert.Equal(RepairCaseStatus.QualityCheck, repairCase.Status);
        Assert.Equal(4, repairCase.Version);
    }

    [Fact]
    public void PassingQualityReviewRequiresCompleteEvidence()
    {
        var now = DateTimeOffset.Parse("2026-08-05T10:00:00Z");
        var repairCase = CreateQualityReadyCase(now);

        Assert.Throws<InvalidOperationException>(() =>
            repairCase.SubmitQualityReview(
                ActorId,
                QualityOutcome.Passed,
                "Functional and cosmetic checks passed.",
                false,
                4,
                now.AddMinutes(40)));

        repairCase.SubmitQualityReview(
            ActorId,
            QualityOutcome.Passed,
            "Functional and cosmetic checks passed.",
            true,
            4,
            now.AddMinutes(40));

        Assert.Equal(RepairCaseStatus.ReadyForDelivery, repairCase.Status);
        Assert.Single(repairCase.QualityReviews);
    }

    [Fact]
    public void FailedQualityReviewReturnsCaseToRepair()
    {
        var now = DateTimeOffset.Parse("2026-08-05T10:00:00Z");
        var repairCase = CreateQualityReadyCase(now);

        repairCase.SubmitQualityReview(
            ActorId,
            QualityOutcome.ReturnedToRepair,
            "Charging disconnect reproduced during cable movement.",
            true,
            4,
            now.AddMinutes(40));

        Assert.Equal(RepairCaseStatus.InRepair, repairCase.Status);
        Assert.Equal(5, repairCase.Version);
    }

    private static RepairCase CreateCase(DateTimeOffset now)
    {
        var repairCase = RepairCase.Create(
            "RF-TEST-0001",
            "Generated Customer",
            "Device does not charge under load.",
            RepairPriority.Priority,
            now);

        repairCase.AttachDevice(
            "Orion",
            "Notebook 14",
            "Laptop",
            "RF-TEST-SERIAL",
            "No visible impact damage.");

        return repairCase;
    }

    private static RepairCase CreateQualityReadyCase(DateTimeOffset now)
    {
        var repairCase = CreateCase(now);
        var action = repairCase.AddRepairAction(
            ActorId,
            "Replace daughterboard",
            "Disconnect battery and replace board.",
            null,
            1,
            now.AddMinutes(10));
        repairCase.CompleteRepairAction(action.Id, ActorId, 2, now.AddMinutes(20));
        repairCase.TransitionTo(
            RepairCaseStatus.QualityCheck,
            ActorId,
            3,
            now.AddMinutes(30));
        return repairCase;
    }
}
