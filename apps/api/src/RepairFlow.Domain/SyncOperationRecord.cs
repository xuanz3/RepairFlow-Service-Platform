namespace RepairFlow.Domain;

public enum SyncOperationState
{
    Processing,
    Applied,
    Conflict
}

public sealed class SyncOperationRecord
{
    private SyncOperationRecord() { }

    private SyncOperationRecord(
        Guid operationId,
        Guid actorId,
        string kind,
        string requestHash,
        DateTimeOffset createdAt)
    {
        OperationId = operationId;
        ActorId = actorId;
        Kind = kind;
        RequestHash = requestHash;
        State = SyncOperationState.Processing;
        CreatedAt = createdAt;
    }

    public Guid OperationId { get; private set; }
    public Guid ActorId { get; private set; }
    public string Kind { get; private set; } = string.Empty;
    public string RequestHash { get; private set; } = string.Empty;
    public SyncOperationState State { get; private set; }
    public string ResponseJson { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    public static SyncOperationRecord Begin(
        Guid operationId,
        Guid actorId,
        string kind,
        string requestHash,
        DateTimeOffset now)
    {
        if (operationId == Guid.Empty) throw new ArgumentException("Operation id is required.", nameof(operationId));
        ArgumentException.ThrowIfNullOrWhiteSpace(kind);
        ArgumentException.ThrowIfNullOrWhiteSpace(requestHash);
        return new SyncOperationRecord(operationId, actorId, kind.Trim(), requestHash, now);
    }

    public void Complete(string responseJson, SyncOperationState state, DateTimeOffset now)
    {
        if (state == SyncOperationState.Processing)
        {
            throw new ArgumentOutOfRangeException(nameof(state), "A completed operation needs a terminal state.");
        }
        ArgumentException.ThrowIfNullOrWhiteSpace(responseJson);
        ResponseJson = responseJson;
        State = state;
        CompletedAt = now;
    }
}
