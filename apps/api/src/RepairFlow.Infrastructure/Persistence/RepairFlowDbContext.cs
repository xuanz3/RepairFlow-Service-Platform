using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RepairFlow.Domain;
using RepairFlow.Infrastructure.Identity;

namespace RepairFlow.Infrastructure.Persistence;

public sealed class RepairFlowDbContext(DbContextOptions<RepairFlowDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<RepairCase> RepairCases => Set<RepairCase>();
    public DbSet<DeviceAsset> Devices => Set<DeviceAsset>();
    public DbSet<EvidenceItem> EvidenceItems => Set<EvidenceItem>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RepairCase>(entity =>
        {
            entity.ToTable("repair_cases");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => item.Reference).IsUnique();
            entity.Property(item => item.Reference).HasMaxLength(32);
            entity.Property(item => item.CustomerDisplayName).HasMaxLength(120);
            entity.Property(item => item.ReportedFault).HasMaxLength(2000);
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(40);
            entity.Property(item => item.Priority).HasConversion<string>().HasMaxLength(20);
            entity.HasOne(item => item.Device)
                .WithOne()
                .HasForeignKey<DeviceAsset>(item => item.RepairCaseId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(item => item.Evidence)
                .WithOne()
                .HasForeignKey(item => item.RepairCaseId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(item => item.AuditEntries)
                .WithOne()
                .HasForeignKey(item => item.RepairCaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<DeviceAsset>(entity =>
        {
            entity.ToTable("devices");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => item.SerialNumber);
            entity.Property(item => item.Manufacturer).HasMaxLength(80);
            entity.Property(item => item.Model).HasMaxLength(120);
            entity.Property(item => item.Category).HasMaxLength(80);
            entity.Property(item => item.SerialNumber).HasMaxLength(160);
        });

        builder.Entity<EvidenceItem>(entity =>
        {
            entity.ToTable("evidence_items");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.FileName).HasMaxLength(240);
            entity.Property(item => item.ContentType).HasMaxLength(120);
            entity.Property(item => item.Sha256).HasMaxLength(64);
        });

        builder.Entity<AuditEntry>(entity =>
        {
            entity.ToTable("audit_entries");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => new { item.RepairCaseId, item.CreatedAt });
            entity.Property(item => item.Action).HasMaxLength(120);
            entity.Property(item => item.Detail).HasMaxLength(2000);
        });
    }
}
