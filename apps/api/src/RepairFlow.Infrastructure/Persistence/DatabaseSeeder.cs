using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RepairFlow.Domain;
using RepairFlow.Infrastructure.Identity;

namespace RepairFlow.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    private static readonly string[] Roles = ["Admin", "Intake", "Technician", "Quality", "Viewer"];
    private static readonly Guid PreviewActorId = Guid.Parse("018f0a9b-4b55-7d62-9d10-11c359f9f101");

    public static async Task SeedAsync(
        IServiceProvider services,
        CancellationToken cancellationToken)
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
            var now = DateTimeOffset.UtcNow;

            var first = RepairCase.Create(
                "RF-2608-0001",
                "Sample Customer",
                "Notebook does not charge consistently after the adapter is reconnected.",
                RepairPriority.Priority,
                now.AddHours(-5));
            first.AttachDevice(
                "Orion Devices",
                "Notebook 14",
                "Laptop",
                "RF-DEMO-SN-0001",
                "Minor wear on the lower case. Charging port is visually intact.");
            first.RecordDiagnosis(
                PreviewActorId,
                "Intermittent power delivery was reproduced under connector movement.",
                "Replace the USB-C daughterboard and run a 30-minute load test.",
                "PWR-USB-C-INT",
                1,
                now.AddHours(-4));
            var action = first.AddRepairAction(
                PreviewActorId,
                "Replace USB-C daughterboard",
                "Disconnect battery, replace board and inspect connector seating.",
                "OR-USB14-DB01",
                2,
                now.AddHours(-3));
            first.CompleteRepairAction(action.Id, PreviewActorId, 3, now.AddHours(-2));
            first.AddEvidence(
                "charging-port-before.jpg",
                "image/jpeg",
                248_100,
                null,
                EvidenceKind.Diagnosis,
                "Connector condition before replacement.",
                PreviewActorId,
                4,
                now.AddHours(-2));
            first.TransitionTo(
                RepairCaseStatus.QualityCheck,
                PreviewActorId,
                5,
                now.AddHours(-1),
                "Repair action and evidence complete.");

            var second = RepairCase.Create(
                "RF-2608-0002",
                "Example Studio",
                "Tablet display intermittently loses touch input near the lower edge.",
                RepairPriority.Standard,
                now.AddHours(-2));
            second.AttachDevice(
                "Northstar",
                "Slate Pro",
                "Tablet",
                "RF-DEMO-SN-0002",
                "Display glass has no visible cracks. Light frame scuffing at upper-right corner.");

            await database.RepairCases.AddRangeAsync([first, second], cancellationToken);
            await database.SaveChangesAsync(cancellationToken);
        }
    }
}
