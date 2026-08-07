using System.Collections.Generic;
using System.Diagnostics;
using System.Security.Claims;
using RepairFlow.Application;

namespace RepairFlow.Api;

public static class SyncEndpoints
{
    public static IEndpointRouteBuilder MapSyncEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/sync")
            .WithTags("Synchronisation")
            .RequireAuthorization("RepairTeam");

        group.MapPost("/operations", ApplyOperationAsync);
        group.MapGet("/delta", PullDeltaAsync);
        group.MapPost("/admin/tombstones", RecordTombstoneAsync)
            .RequireAuthorization("AdminOnly");
        return endpoints;
    }

    private static async Task<IResult> ApplyOperationAsync(
        SyncOperationRequest request,
        ClaimsPrincipal principal,
        SyncCoordinator coordinator,
        CancellationToken cancellationToken)
    {
        using var activity = RepairFlowTelemetry.ActivitySource.StartActivity(
            "sync.apply",
            ActivityKind.Server);
        activity?.SetTag("repairflow.sync.kind", request.Kind);
        var started = Stopwatch.GetTimestamp();
        try
        {
            var receipt = await coordinator.ApplyAsync(
                GetActorId(principal),
                request,
                cancellationToken);
            RepairFlowTelemetry.SyncOperations.Add(
                1,
                new KeyValuePair<string, object?>("status", receipt.Status));
            return Results.Ok(receipt);
        }
        catch (KeyNotFoundException exception)
        {
            RepairFlowTelemetry.SyncRejected.Add(1);
            return Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Repair case was not found",
                detail: exception.Message);
        }
        catch (ArgumentException exception)
        {
            RepairFlowTelemetry.SyncRejected.Add(1);
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Synchronisation request is invalid",
                detail: exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            RepairFlowTelemetry.SyncRejected.Add(1);
            return Results.Problem(
                statusCode: StatusCodes.Status422UnprocessableEntity,
                title: "Synchronisation operation was rejected",
                detail: exception.Message);
        }
        finally
        {
            RepairFlowTelemetry.SyncDurationMs.Record(Stopwatch.GetElapsedTime(started).TotalMilliseconds);
        }
    }

    private static async Task<IResult> PullDeltaAsync(
        long? cursor,
        int? limit,
        SyncCoordinator coordinator,
        CancellationToken cancellationToken)
    {
        try
        {
            var page = await coordinator.PullAsync(cursor, limit ?? 100, cancellationToken);
            RepairFlowTelemetry.DeltaChanges.Add(page.Changes.Count);
            return Results.Ok(page);
        }
        catch (ArgumentOutOfRangeException exception)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Delta cursor is invalid",
                detail: exception.Message);
        }
    }

    private static async Task<IResult> RecordTombstoneAsync(
        SyncTombstoneRequest request,
        SyncCoordinator coordinator,
        CancellationToken cancellationToken)
    {
        try
        {
            return Results.Ok(await coordinator.RecordTombstoneAsync(request, cancellationToken));
        }
        catch (ArgumentException exception)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Tombstone request is invalid",
                detail: exception.Message);
        }
    }

    private static Guid GetActorId(ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub");
        return Guid.TryParse(value, out var actorId)
            ? actorId
            : throw new InvalidOperationException("The authenticated user identifier is invalid.");
    }
}
