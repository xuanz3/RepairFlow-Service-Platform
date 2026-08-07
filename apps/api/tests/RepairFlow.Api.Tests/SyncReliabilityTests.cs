using System.Net;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Application;
using RepairFlow.Domain;
using Xunit;

namespace RepairFlow.Api.Tests;

public sealed class SyncReliabilityTests : IClassFixture<RepairFlowApiFactory>
{
    private readonly RepairFlowApiFactory _factory;

    public SyncReliabilityTests(RepairFlowApiFactory factory) => _factory = factory;

    [Fact]
    public async Task SyncAndUploadRoutesRequireAuthentication()
    {
        using var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/sync/delta")).StatusCode);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await client.GetAsync($"/api/attachments/uploads/{Guid.NewGuid()}")).StatusCode);
    }

    [Fact]
    public async Task StableOperationIdReplaysPreviousResult()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var coordinator = scope.ServiceProvider.GetRequiredService<SyncCoordinator>();
        var operationId = Guid.NewGuid();
        var actorId = Guid.NewGuid();
        var localRepairCaseId = Guid.NewGuid();
        var request = new SyncOperationRequest(
            operationId,
            SyncOperationKinds.RepairCaseCreate,
            localRepairCaseId,
            null,
            JsonSerializer.SerializeToElement(new CreateRepairCaseRequest(
                "Idempotency Test",
                "Orion",
                "Notebook 14",
                "Laptop",
                "SYNC-IDEMPOTENCY-001",
                "Synthetic charging fault.",
                "No visible damage.",
                RepairPriority.Standard)),
            DateTimeOffset.UtcNow);

        var applied = await coordinator.ApplyAsync(actorId, request, CancellationToken.None);
        var replayed = await coordinator.ApplyAsync(actorId, request, CancellationToken.None);

        Assert.Equal("applied", applied.Status);
        Assert.Equal(localRepairCaseId, applied.RepairCase?.Id);
        Assert.Equal("replayed", replayed.Status);
        Assert.Equal(applied.RepairCase?.Id, replayed.RepairCase?.Id);
        Assert.Equal(applied.ServerVersion, replayed.ServerVersion);
    }

    [Fact]
    public async Task StaleMutationReturnsExplicitConflictAndDeltaChange()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var workflows = scope.ServiceProvider.GetRequiredService<RepairCaseWorkflowService>();
        var coordinator = scope.ServiceProvider.GetRequiredService<SyncCoordinator>();
        var actorId = Guid.NewGuid();
        var created = await workflows.CreateAsync(
            new CreateRepairCaseRequest(
                "Conflict Test",
                "Northstar",
                "Slate Pro",
                "Tablet",
                "SYNC-CONFLICT-001",
                "Synthetic touch fault.",
                "No visible cracks.",
                RepairPriority.Priority),
            CancellationToken.None);

        var first = new SyncOperationRequest(
            Guid.NewGuid(),
            SyncOperationKinds.StatusUpdate,
            created.Id,
            created.Version,
            JsonSerializer.SerializeToElement(new UpdateRepairStatusRequest(
                RepairCaseStatus.Diagnosing,
                created.Version,
                "Begin diagnosis")),
            DateTimeOffset.UtcNow);
        var applied = await coordinator.ApplyAsync(actorId, first, CancellationToken.None);
        Assert.Equal("applied", applied.Status);

        var stale = new SyncOperationRequest(
            Guid.NewGuid(),
            SyncOperationKinds.StatusUpdate,
            created.Id,
            created.Version,
            JsonSerializer.SerializeToElement(new UpdateRepairStatusRequest(
                RepairCaseStatus.Cancelled,
                created.Version,
                "Stale cancellation")),
            DateTimeOffset.UtcNow);
        var conflict = await coordinator.ApplyAsync(actorId, stale, CancellationToken.None);

        Assert.Equal("conflict", conflict.Status);
        Assert.Equal(applied.ServerVersion, conflict.ServerVersion);
        Assert.Contains(conflict.Conflict!.Differences, item => item.Field == "aggregateVersion");

        var delta = await coordinator.PullAsync(0, 20, CancellationToken.None);
        Assert.False(delta.Snapshot);
        Assert.Contains(delta.Changes, item => item.EntityId == created.Id && !item.Deleted);
    }
    [Fact]
    public async Task InitialSnapshotDoesNotResurrectATombstonedCase()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var workflows = scope.ServiceProvider.GetRequiredService<RepairCaseWorkflowService>();
        var coordinator = scope.ServiceProvider.GetRequiredService<SyncCoordinator>();
        var created = await workflows.CreateAsync(
            new CreateRepairCaseRequest(
                "Tombstone Test", "Orion", "Notebook 14", "Laptop", "SYNC-TOMBSTONE-001",
                "Synthetic retired case.", "Generated fixture.", RepairPriority.Standard),
            CancellationToken.None);

        await coordinator.RecordTombstoneAsync(
            new SyncTombstoneRequest(created.Id, created.Version + 1),
            CancellationToken.None);

        var snapshot = await coordinator.PullAsync(null, 100, CancellationToken.None);
        Assert.True(snapshot.Snapshot);
        Assert.DoesNotContain(snapshot.Changes, item => item.EntityId == created.Id);
    }

}
