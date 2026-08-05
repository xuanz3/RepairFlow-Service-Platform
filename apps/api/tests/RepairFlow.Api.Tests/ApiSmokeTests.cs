using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace RepairFlow.Api.Tests;

public sealed class ApiSmokeTests : IClassFixture<RepairFlowApiFactory>
{
    private readonly HttpClient _client;

    public ApiSmokeTests(RepairFlowApiFactory factory)
    {
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

    [Fact]
    public async Task RepairCaseListRequiresAuthentication()
    {
        var response = await _client.GetAsync("/api/repair-cases");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
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
