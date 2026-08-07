#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
required = [
    'packages/sync-engine/src/outbox.ts', 'packages/sync-engine/src/delta.ts', 'packages/sync-engine/src/uploads.ts',
    'apps/api/src/RepairFlow.Domain/SyncOperationRecord.cs', 'apps/api/src/RepairFlow.Domain/SyncChange.cs',
    'apps/api/src/RepairFlow.Domain/AttachmentUploadSession.cs', 'apps/api/src/RepairFlow.Application/SyncCoordinator.cs',
    'apps/api/src/RepairFlow.Api/SyncEndpoints.cs', 'apps/api/src/RepairFlow.Api/AttachmentUploadService.cs',
    'apps/desktop/electron/syncStore.ts', 'apps/mobile/src/mobileSyncStore.ts',
    'tools/verify/phase3-failure-scenarios.mjs', 'tools/verify/measure-sync-engine.mjs',
    'infra/observability/otel-collector.yaml', 'infra/observability/prometheus.yml',
    'infra/observability/grafana/dashboards/repairflow-sync-reliability.json',
    '.github/workflows/phase3-reliability.yml',
]
missing = [path for path in required if not (ROOT / path).is_file()]
assert not missing, f'Missing Phase 3 files: {missing}'

contracts = (ROOT / 'packages/contracts/src/index.ts').read_text()
for token in ['SyncOperationEnvelope', 'SyncConflict', 'DeltaPage', 'UploadSessionInfo', 'syncOperationKinds']:
    assert token in contracts, f'Missing sync contract: {token}'

sync = (ROOT / 'packages/sync-engine/src/outbox.ts').read_text()
assert 'MAX_RETRY_ATTEMPTS = 8' in sync and "status: 'retrying'" in sync
desktop_store = (ROOT / 'apps/desktop/electron/syncStore.ts').read_text()
mobile_store = (ROOT / 'apps/mobile/src/mobileSyncStore.ts').read_text()
assert 'operation.operationId' in desktop_store and "WHERE status = 'sending'" in desktop_store
assert 'operation.operationId' in mobile_store and "WHERE status = 'sending'" in mobile_store

package = json.loads((ROOT / 'package.json').read_text())
assert package['version'] == '0.6.0'
for script in ['validate:phase3', 'validate:phase3-security', 'test:failure', 'measure:sync', 'verify:phase3']:
    assert script in package['scripts'], f'Missing package script: {script}'

api_project = (ROOT / 'apps/api/src/RepairFlow.Api/RepairFlow.Api.csproj').read_text()
for package_name in ['OpenTelemetry.Extensions.Hosting', 'OpenTelemetry.Instrumentation.AspNetCore', 'OpenTelemetry.Instrumentation.Http', 'OpenTelemetry.Exporter.OpenTelemetryProtocol']:
    assert package_name in api_project, f'Missing observability package: {package_name}'

with (ROOT / 'infra/observability/grafana/dashboards/repairflow-sync-reliability.json').open() as handle:
    dashboard = json.load(handle)
assert dashboard['uid'] == 'repairflow-sync-reliability'
assert len(dashboard['panels']) >= 5

print('Phase 3 repository validation passed.')
