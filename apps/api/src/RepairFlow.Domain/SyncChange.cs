namespace RepairFlow.Domain;

public sealed class SyncChange
{
    private SyncChange() { }

    private SyncChange(
        string entityType,
        Guid entityId,
        int version,
        bool deleted,
        string? payloadJson,
        DateTimeOffset changedAt)
    {
        EntityType = entityType;
        EntityId = entityId;
        Version = version;
        Deleted = deleted;
        PayloadJson = payloadJson;
        ChangedAt = changedAt;
    }

    public long Id { get; private set; }
    public string EntityType { get; private set; } = string.Empty;
    public Guid EntityId { get; private set; }
    public int Version { get; private set; }
    public bool Deleted { get; private set; }
    public string? PayloadJson { get; private set; }
    public DateTimeOffset ChangedAt { get; private set; }

    public static SyncChange Snapshot(Guid entityId, int version, string payloadJson, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(payloadJson);
        return new SyncChange("repair-case", entityId, version, false, payloadJson, now);
    }

    public static SyncChange Tombstone(Guid entityId, int version, DateTimeOffset now) =>
        new("repair-case", entityId, version, true, null, now);
}
