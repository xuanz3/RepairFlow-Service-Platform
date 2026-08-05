using RepairFlow.Domain;

namespace RepairFlow.Domain.Tests;

public sealed class RepairCaseTests
{
    [Fact]
    public void NewCaseStartsCheckedIn()
    {
        var repairCase = CreateCase();
        Assert.Equal(RepairCaseStatus.CheckedIn, repairCase.Status);
        Assert.Equal(1, repairCase.Version);
    }

    [Fact]
    public void ValidTransitionCreatesAuditEntryAndIncrementsVersion()
    {
        var repairCase = CreateCase();
        repairCase.TransitionTo(RepairCaseStatus.Diagnosing, Guid.CreateVersion7(), DateTimeOffset.UtcNow);

        Assert.Equal(RepairCaseStatus.Diagnosing, repairCase.Status);
        Assert.Equal(2, repairCase.Version);
        Assert.Single(repairCase.AuditEntries);
    }

    [Fact]
    public void InvalidTransitionIsRejected()
    {
        var repairCase = CreateCase();
        Assert.Throws<InvalidOperationException>(() =>
            repairCase.TransitionTo(RepairCaseStatus.Delivered, Guid.CreateVersion7(), DateTimeOffset.UtcNow));
    }

    private static RepairCase CreateCase()
    {
        var repairCase = RepairCase.Create(
            "RF-TEST-0001",
            "Generated Customer",
            "Generated device does not power on.",
            RepairPriority.Standard,
            DateTimeOffset.UtcNow);
        repairCase.AttachDevice("Example", "Model One", "Laptop", "SERIAL-0001");
        return repairCase;
    }
}
