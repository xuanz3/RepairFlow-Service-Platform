using RepairFlow.Domain;
using Xunit;

namespace RepairFlow.Domain.Tests;

public sealed class SyncReliabilityTests
{
    [Fact]
    public void UploadSessionOnlyAdvancesFromCommittedOffset()
    {
        var now = DateTimeOffset.UtcNow;
        var session = AttachmentUploadSession.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "evidence.jpg",
            "image/jpeg",
            512_000,
            new string('a', 64),
            256_000,
            now);

        session.Append(0, 256_000, now.AddSeconds(1));
        Assert.Equal(256_000, session.ReceivedBytes);
        Assert.Throws<InvalidOperationException>(() =>
            session.Append(0, 1, now.AddSeconds(2)));
        session.Append(256_000, 256_000, now.AddSeconds(3));
        session.Complete(now.AddSeconds(4));
        Assert.Equal(UploadSessionState.Completed, session.State);
    }

    [Fact]
    public void TombstoneDoesNotCarryPayload()
    {
        var change = SyncChange.Tombstone(Guid.NewGuid(), 7, DateTimeOffset.UtcNow);
        Assert.True(change.Deleted);
        Assert.Null(change.PayloadJson);
        Assert.Equal(7, change.Version);
    }
}
