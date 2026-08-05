using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Application;
using RepairFlow.Infrastructure.Persistence;

namespace RepairFlow.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddRepairFlowInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("RepairFlow")
            ?? throw new InvalidOperationException("Connection string 'RepairFlow' is required.");

        services.AddDbContext<RepairFlowDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IRepairCaseRepository, RepairCaseRepository>();
        return services;
    }
}
