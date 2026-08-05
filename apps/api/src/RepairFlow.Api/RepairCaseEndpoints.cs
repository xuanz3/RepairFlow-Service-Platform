using System.Security.Claims;
using RepairFlow.Application;
using RepairFlow.Domain;

namespace RepairFlow.Api;

public static class RepairCaseEndpoints
{
    public static IEndpointRouteBuilder MapRepairCaseEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/repair-cases")
            .WithTags("Repair cases");

        group.MapGet(
                "",
                async (RepairCaseQueries queries, CancellationToken cancellationToken) =>
                    Results.Ok(await queries.ListAsync(cancellationToken)))
            .RequireAuthorization("RepairTeam");

        group.MapGet(
                "/{id:guid}",
                async (Guid id, RepairCaseQueries queries, CancellationToken cancellationToken) =>
                    await ExecuteAsync(() => queries.GetAsync(id, cancellationToken)))
            .RequireAuthorization("RepairTeam");

        group.MapPost(
                "",
                async (
                    CreateRepairCaseRequest request,
                    RepairCaseWorkflowService workflows,
                    CancellationToken cancellationToken) =>
                    await ExecuteAsync(() => workflows.CreateAsync(request, cancellationToken)))
            .RequireAuthorization("IntakeTeam");

        group.MapPost(
                "/{id:guid}/diagnosis",
                async (
                    Guid id,
                    RecordDiagnosisRequest request,
                    ClaimsPrincipal principal,
                    RepairCaseWorkflowService workflows,
                    CancellationToken cancellationToken) =>
                    await ExecuteAsync(() => workflows.RecordDiagnosisAsync(
                        id,
                        GetActorId(principal),
                        request,
                        cancellationToken)))
            .RequireAuthorization("TechnicianTeam");

        group.MapPost(
                "/{id:guid}/repair-actions",
                async (
                    Guid id,
                    CreateRepairActionRequest request,
                    ClaimsPrincipal principal,
                    RepairCaseWorkflowService workflows,
                    CancellationToken cancellationToken) =>
                    await ExecuteAsync(() => workflows.AddRepairActionAsync(
                        id,
                        GetActorId(principal),
                        request,
                        cancellationToken)))
            .RequireAuthorization("TechnicianTeam");

        group.MapPost(
                "/{id:guid}/repair-actions/{actionId:guid}/complete",
                async (
                    Guid id,
                    Guid actionId,
                    CompleteRepairActionRequest request,
                    ClaimsPrincipal principal,
                    RepairCaseWorkflowService workflows,
                    CancellationToken cancellationToken) =>
                    await ExecuteAsync(() => workflows.CompleteRepairActionAsync(
                        id,
                        actionId,
                        GetActorId(principal),
                        request,
                        cancellationToken)))
            .RequireAuthorization("TechnicianTeam");

        group.MapPost(
                "/{id:guid}/evidence",
                async (
                    Guid id,
                    CreateEvidenceRequest request,
                    ClaimsPrincipal principal,
                    RepairCaseWorkflowService workflows,
                    CancellationToken cancellationToken) =>
                    await ExecuteAsync(() => workflows.AddEvidenceAsync(
                        id,
                        GetActorId(principal),
                        request,
                        cancellationToken)))
            .RequireAuthorization("RepairTeam");

        group.MapPost(
                "/{id:guid}/quality-reviews",
                async (
                    Guid id,
                    SubmitQualityReviewRequest request,
                    ClaimsPrincipal principal,
                    RepairCaseWorkflowService workflows,
                    CancellationToken cancellationToken) =>
                    await ExecuteAsync(() => workflows.SubmitQualityReviewAsync(
                        id,
                        GetActorId(principal),
                        request,
                        cancellationToken)))
            .RequireAuthorization("QualityTeam");

        group.MapPost(
                "/{id:guid}/status",
                async (
                    Guid id,
                    UpdateRepairStatusRequest request,
                    ClaimsPrincipal principal,
                    RepairCaseWorkflowService workflows,
                    CancellationToken cancellationToken) =>
                    await ExecuteAsync(() => workflows.TransitionAsync(
                        id,
                        GetActorId(principal),
                        request,
                        cancellationToken)))
            .RequireAuthorization("RepairTeam");

        return endpoints;
    }

    private static async Task<IResult> ExecuteAsync<T>(Func<Task<T>> action)
    {
        try
        {
            return Results.Ok(await action());
        }
        catch (KeyNotFoundException exception)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Repair case was not found",
                detail: exception.Message);
        }
        catch (RepairCaseVersionConflictException exception)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Repair case version conflict",
                detail: exception.Message,
                extensions: new Dictionary<string, object?>
                {
                    ["expectedVersion"] = exception.ExpectedVersion,
                    ["actualVersion"] = exception.ActualVersion
                });
        }
        catch (ArgumentException exception)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Repair workflow request is invalid",
                detail: exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status422UnprocessableEntity,
                title: "Repair workflow rule rejected the operation",
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
