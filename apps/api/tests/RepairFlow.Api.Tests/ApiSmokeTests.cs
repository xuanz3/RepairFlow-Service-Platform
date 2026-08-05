using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Application;
using RepairFlow.Domain;
using Xunit;

namespace RepairFlow.Api.Tests;

public sealed class ApiSmokeTests : IClassFixture<RepairFlowApiFactory>
{
    private readonly RepairFlowApiFactory _factory;
    private readonly HttpClient _client;

    public ApiSmokeTests(RepairFlowApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task LiveHealthEndpointReturnsServiceStatus()
    {
        var response = await _client.GetAsync("/health/live");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<HealthBody>();
        Assert.Equal("RepairFlow.Api", body?.Service);
        Assert.Equal("healthy", body?.Status);
    }

    [Theory]
    [InlineData("/api/repair-cases")]
    [InlineData("/api/repair-cases/018f0a9b-4b55-7d62-9d10-11c359f9f101")]
    public async Task RepairCaseRoutesRequireAuthentication(string path)
    {
        var response = await _client.GetAsync(path);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ApplicationWorkflowPersistsACompleteIntake()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var workflows = scope.ServiceProvider.GetRequiredService<RepairCaseWorkflowService>();
        var queries = scope.ServiceProvider.GetRequiredService<RepairCaseQueries>();

        var created = await workflows.CreateAsync(
            new CreateRepairCaseRequest(
                "Workflow Test",
                "Orion",
                "Notebook 14",
                "Laptop",
                "RF-TEST-SERIAL-001",
                "Device does not charge under load.",
                "No visible impact damage at intake.",
                RepairPriority.Priority),
            CancellationToken.None);

        var loaded = await queries.GetAsync(created.Id, CancellationToken.None);

        Assert.Equal(created.Id, loaded.Id);
        Assert.Equal("Workflow Test", loaded.CustomerDisplayName);
        Assert.Equal("No visible impact damage at intake.", loaded.IntakeCondition);
        Assert.Equal(RepairCaseStatus.CheckedIn, loaded.Status);
        Assert.Equal(1, loaded.Version);
    }
}

public sealed record HealthBody(string Service, string Status);

public sealed class RepairFlowApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
    }
}
