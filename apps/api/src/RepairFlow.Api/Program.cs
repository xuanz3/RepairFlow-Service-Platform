using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RepairFlow.Application;
using RepairFlow.Infrastructure;
using RepairFlow.Infrastructure.Identity;
using RepairFlow.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<RepairFlowDbContext>(options =>
        options.UseInMemoryDatabase("repairflow-api-tests"));
    builder.Services.AddScoped<IRepairCaseRepository, RepairCaseRepository>();
}
else
{
    builder.Services.AddRepairFlowInfrastructure(builder.Configuration);
}

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
    .AddPolicy("RepairTeam", policy => policy.RequireRole("Admin", "Intake", "Technician", "Quality"));

builder.Services.AddScoped<RepairCaseQueries>();
builder.Services.AddHealthChecks().AddDbContextCheck<RepairFlowDbContext>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();

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
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.2.0",
    timestamp = DateTimeOffset.UtcNow
})).AllowAnonymous();

app.MapHealthChecks("/health/ready");
app.MapGroup("/api/auth").MapIdentityApi<ApplicationUser>();

app.MapGet("/api/repair-cases", async (RepairCaseQueries queries, CancellationToken cancellationToken) =>
    Results.Ok(await queries.ListAsync(cancellationToken)))
    .RequireAuthorization("RepairTeam");

if (!app.Environment.IsEnvironment("Testing"))
{
    await DatabaseSeeder.SeedAsync(app.Services, app.Lifetime.ApplicationStopping);
}

app.Run();

public partial class Program;
