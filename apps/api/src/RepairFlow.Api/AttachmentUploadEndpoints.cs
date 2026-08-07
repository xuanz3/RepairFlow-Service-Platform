using RepairFlow.Application;

namespace RepairFlow.Api;

public static class AttachmentUploadEndpoints
{
    public static IEndpointRouteBuilder MapAttachmentUploadEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/attachments/uploads")
            .WithTags("Attachment uploads")
            .RequireAuthorization("RepairTeam");

        group.MapPost("", BeginAsync);
        group.MapGet("/{sessionId:guid}", GetAsync);
        group.MapPut("/{sessionId:guid}", AppendAsync);
        group.MapPost("/{sessionId:guid}/complete", CompleteAsync);
        group.MapDelete("/{sessionId:guid}", AbortAsync);
        return endpoints;
    }

    private static async Task<IResult> BeginAsync(
        BeginUploadRequest request,
        AttachmentUploadService uploads,
        CancellationToken cancellationToken) =>
        await ExecuteAsync(() => uploads.BeginAsync(request, cancellationToken));

    private static async Task<IResult> GetAsync(
        Guid sessionId,
        AttachmentUploadService uploads,
        CancellationToken cancellationToken) =>
        await ExecuteAsync(() => uploads.GetAsync(sessionId, cancellationToken));

    private static async Task<IResult> AppendAsync(
        Guid sessionId,
        long offset,
        HttpRequest request,
        AttachmentUploadService uploads,
        CancellationToken cancellationToken) =>
        await ExecuteAsync(() => uploads.AppendAsync(
            sessionId,
            offset,
            request.Body,
            request.ContentLength,
            cancellationToken));

    private static async Task<IResult> CompleteAsync(
        Guid sessionId,
        AttachmentUploadService uploads,
        CancellationToken cancellationToken) =>
        await ExecuteAsync(() => uploads.CompleteAsync(sessionId, cancellationToken));

    private static async Task<IResult> AbortAsync(
        Guid sessionId,
        AttachmentUploadService uploads,
        CancellationToken cancellationToken) =>
        await ExecuteAsync(() => uploads.AbortAsync(sessionId, cancellationToken));

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
                title: "Upload session was not found",
                detail: exception.Message);
        }
        catch (ArgumentException exception)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Upload request is invalid",
                detail: exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Upload state rejected the request",
                detail: exception.Message);
        }
    }
}
