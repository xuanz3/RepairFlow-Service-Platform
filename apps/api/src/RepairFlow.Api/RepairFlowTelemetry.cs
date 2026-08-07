using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace RepairFlow.Api;

public static class RepairFlowTelemetry
{
    public const string ActivitySourceName = "RepairFlow.Sync";
    public const string MeterName = "RepairFlow.Sync";

    public static readonly ActivitySource ActivitySource = new(ActivitySourceName);
    public static readonly Meter Meter = new(MeterName, "0.6.0");
    public static readonly Counter<long> SyncOperations = Meter.CreateCounter<long>("repairflow.sync.operations");
    public static readonly Counter<long> SyncRejected = Meter.CreateCounter<long>("repairflow.sync.rejected");
    public static readonly Counter<long> DeltaChanges = Meter.CreateCounter<long>("repairflow.sync.delta.changes");
    public static readonly Histogram<double> SyncDurationMs = Meter.CreateHistogram<double>("repairflow.sync.duration.ms", "ms");
    public static readonly Counter<long> UploadSessions = Meter.CreateCounter<long>("repairflow.upload.sessions");
    public static readonly Counter<long> UploadBytes = Meter.CreateCounter<long>("repairflow.upload.bytes", "By");
    public static readonly Counter<long> UploadIntegrityFailures = Meter.CreateCounter<long>("repairflow.upload.integrity_failures");
}
