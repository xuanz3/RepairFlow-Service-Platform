namespace RepairFlow.Domain;

public sealed class RepairCaseVersionConflictException(int expectedVersion, int actualVersion)
    : InvalidOperationException($"Expected repair case version {expectedVersion}, but found {actualVersion}.")
{
    public int ExpectedVersion { get; } = expectedVersion;
    public int ActualVersion { get; } = actualVersion;
}
