using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Domain;
using RepairFlow.Infrastructure.Identity;

namespace RepairFlow.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    private static readonly string[] Roles = ["Admin", "Intake", "Technician", "Quality", "Viewer"];

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<RepairFlowDbContext>();
        await database.Database.EnsureCreatedAsync(cancellationToken);

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        if (!await database.RepairCases.AnyAsync(cancellationToken))
        {
            var first = RepairCase.Create(
                "RF-2608-0001",
                "Sample Customer",
                "Notebook does not charge consistently after the adapter is reconnected.",
                RepairPriority.Priority,
                DateTimeOffset.UtcNow.AddHours(-3));
            first.AttachDevice("Orion Devices", "Notebook 14", "Laptop", "RF-DEMO-SN-0001");

            var second = RepairCase.Create(
                "RF-2608-0002",
                "Example Studio",
                "Tablet display intermittently loses touch input near the lower edge.",
                RepairPriority.Standard,
                DateTimeOffset.UtcNow.AddHours(-1));
            second.AttachDevice("Northstar", "Slate Pro", "Tablet", "RF-DEMO-SN-0002");

            await database.RepairCases.AddRangeAsync([first, second], cancellationToken);
            await database.SaveChangesAsync(cancellationToken);
        }
    }
}
