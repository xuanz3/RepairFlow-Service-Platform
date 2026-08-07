using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using RepairFlow.Api;
using RepairFlow.Application;
using RepairFlow.Infrastructure;
using RepairFlow.Infrastructure.Identity;
using RepairFlow.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsEnvironment("Testing"))
{
    // Compute the database name once per test host so separate request scopes share
    // the same in-memory store while different WebApplicationFactory instances remain isolated.
    var testingDatabaseName = $"repairflow-api-tests-{Guid.NewGuid():N}";
    builder.Services.AddDbContext<RepairFlowDbContext>(options =>
        options.UseInMemoryDatabase(testingDatabaseName));
    builder.Services.AddScoped<IRepairCaseRepository, RepairCaseRepository>();
}
else
{
    builder.Services.AddRepairFlowInfrastructure(builder.Configuration);
}

builder.Services.AddScoped<ISyncRepository, SyncRepository>();

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 10;
        options.Password.RequireNonAlphanumeric = true;
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<RepairFlowDbContext>();

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(
        "RepairTeam",
        policy => policy.RequireRole("Admin", "Intake", "Technician", "Quality"))
    .AddPolicy(
        "IntakeTeam",
        policy => policy.RequireRole("Admin", "Intake"))
    .AddPolicy(
        "TechnicianTeam",
        policy => policy.RequireRole("Admin", "Technician"))
    .AddPolicy(
        "QualityTeam",
        policy => policy.RequireRole("Admin", "Quality"))
    .AddPolicy(
        "AdminOnly",
        policy => policy.RequireRole("Admin"));

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.KebabCaseLower));
});

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<RepairCaseQueries>();
builder.Services.AddScoped<RepairCaseWorkflowService>();
builder.Services.AddScoped<SyncCoordinator>();
builder.Services.AddScoped<AttachmentUploadService>();
builder.Services.AddHealthChecks().AddDbContextCheck<RepairFlowDbContext>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();

var otlpEndpoint = builder.Configuration["OpenTelemetry:OtlpEndpoint"];
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(
        serviceName: "RepairFlow.Api",
        serviceVersion: "0.6.0"))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddSource(RepairFlowTelemetry.ActivitySourceName);
        if (Uri.TryCreate(otlpEndpoint, UriKind.Absolute, out var endpoint))
        {
            tracing.AddOtlpExporter(options => options.Endpoint = endpoint);
        }
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddMeter(RepairFlowTelemetry.MeterName);
        if (Uri.TryCreate(otlpEndpoint, UriKind.Absolute, out var endpoint))
        {
            metrics.AddOtlpExporter(options => options.Endpoint = endpoint);
        }
    });

var app = builder.Build();

app.UseExceptionHandler();
if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health/live", () => Results.Ok(new
{
    service = "RepairFlow.Api",
    status = "healthy",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.6.0",
    timestamp = DateTimeOffset.UtcNow
})).AllowAnonymous();

app.MapHealthChecks("/health/ready");
app.MapGroup("/api/auth").MapIdentityApi<ApplicationUser>();
app.MapRepairCaseEndpoints();
app.MapSyncEndpoints();
app.MapAttachmentUploadEndpoints();

if (!app.Environment.IsEnvironment("Testing"))
{
    await DatabaseSeeder.SeedAsync(app.Services, app.Lifetime.ApplicationStopping);
}

app.Run();

public partial class Program;
