namespace RepairFlow.Domain;

public enum RepairCaseStatus
{
    CheckedIn,
    Diagnosing,
    AwaitingApproval,
    InRepair,
    QualityCheck,
    ReadyForDelivery,
    Delivered,
    Cancelled
}
