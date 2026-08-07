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
    public DbSet<DiagnosisRecord> Diagnoses => Set<DiagnosisRecord>();
    public DbSet<RepairAction> RepairActions => Set<RepairAction>();
    public DbSet<EvidenceItem> EvidenceItems => Set<EvidenceItem>();
    public DbSet<QualityReview> QualityReviews => Set<QualityReview>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<SyncOperationRecord> SyncOperations => Set<SyncOperationRecord>();
    public DbSet<SyncChange> SyncChanges => Set<SyncChange>();
    public DbSet<AttachmentUploadSession> AttachmentUploadSessions => Set<AttachmentUploadSession>();

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
            entity.HasOne(item => item.Diagnosis)
                .WithOne()
                .HasForeignKey<DiagnosisRecord>(item => item.RepairCaseId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(item => item.RepairActions)
                .WithOne()
                .HasForeignKey(item => item.RepairCaseId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(item => item.Evidence)
                .WithOne()
                .HasForeignKey(item => item.RepairCaseId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(item => item.QualityReviews)
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
            entity.Property(item => item.IntakeCondition).HasMaxLength(2000);
        });

        builder.Entity<DiagnosisRecord>(entity =>
        {
            entity.ToTable("diagnoses");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => item.RepairCaseId).IsUnique();
            entity.Property(item => item.Summary).HasMaxLength(4000);
            entity.Property(item => item.Recommendation).HasMaxLength(2000);
            entity.Property(item => item.DiagnosticCode).HasMaxLength(80);
        });

        builder.Entity<RepairAction>(entity =>
        {
            entity.ToTable("repair_actions");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => new { item.RepairCaseId, item.CreatedAt });
            entity.Property(item => item.Title).HasMaxLength(160);
            entity.Property(item => item.Detail).HasMaxLength(2000);
            entity.Property(item => item.PartNumber).HasMaxLength(120);
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<EvidenceItem>(entity =>
        {
            entity.ToTable("evidence_items");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => new { item.RepairCaseId, item.CreatedAt });
            entity.Property(item => item.FileName).HasMaxLength(240);
            entity.Property(item => item.ContentType).HasMaxLength(120);
            entity.Property(item => item.Sha256).HasMaxLength(64);
            entity.Property(item => item.Kind).HasConversion<string>().HasMaxLength(32);
            entity.Property(item => item.Note).HasMaxLength(1000);
        });

        builder.Entity<QualityReview>(entity =>
        {
            entity.ToTable("quality_reviews");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => new { item.RepairCaseId, item.CreatedAt });
            entity.Property(item => item.Outcome).HasConversion<string>().HasMaxLength(40);
            entity.Property(item => item.Notes).HasMaxLength(2000);
        });

        builder.Entity<AuditEntry>(entity =>
        {
            entity.ToTable("audit_entries");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => new { item.RepairCaseId, item.CreatedAt });
            entity.Property(item => item.Action).HasMaxLength(120);
            entity.Property(item => item.Detail).HasMaxLength(2000);
        });

        builder.Entity<SyncOperationRecord>(entity =>
        {
            entity.ToTable("sync_operations");
            entity.HasKey(item => item.OperationId);
            entity.HasIndex(item => new { item.ActorId, item.CreatedAt });
            entity.Property(item => item.Kind).HasMaxLength(80);
            entity.Property(item => item.RequestHash).HasMaxLength(64);
            entity.Property(item => item.State).HasConversion<string>().HasMaxLength(32);
            entity.Property(item => item.ResponseJson).HasColumnType("text");
        });

        builder.Entity<SyncChange>(entity =>
        {
            entity.ToTable("sync_changes");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).ValueGeneratedOnAdd();
            entity.HasIndex(item => new { item.EntityType, item.EntityId, item.Id });
            entity.Property(item => item.EntityType).HasMaxLength(40);
            entity.Property(item => item.PayloadJson).HasColumnType("text");
        });

        builder.Entity<AttachmentUploadSession>(entity =>
        {
            entity.ToTable("attachment_upload_sessions");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => new { item.RepairCaseId, item.State, item.UpdatedAt });
            entity.Property(item => item.FileName).HasMaxLength(240);
            entity.Property(item => item.ContentType).HasMaxLength(120);
            entity.Property(item => item.Sha256).HasMaxLength(64);
            entity.Property(item => item.State).HasConversion<string>().HasMaxLength(32);
        });
    }
}
