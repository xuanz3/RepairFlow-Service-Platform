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

program = (ROOT / 'apps/api/src/RepairFlow.Api/Program.cs').read_text()
sync_tests = (ROOT / 'apps/api/tests/RepairFlow.Api.Tests/SyncReliabilityTests.cs').read_text()
assert 'var testingDatabaseName = $\"repairflow-api-tests-{Guid.NewGuid():N}\";' in program
assert 'UseInMemoryDatabase(testingDatabaseName)' in program
assert 'UseInMemoryDatabase($\"repairflow-api-tests-{Guid.NewGuid():N}\")' not in program
assert 'await using (var createScope = _factory.Services.CreateAsyncScope())' in sync_tests
assert 'await using var syncScope = _factory.Services.CreateAsyncScope();' in sync_tests

# RepairFlow creates aggregate and sync GUIDs in the application. EF Core must not
# interpret non-default application-generated keys as database-generated existing rows.
db_context = (ROOT / 'apps/api/src/RepairFlow.Infrastructure/Persistence/RepairFlowDbContext.cs').read_text()
for entity, key in {
    'RepairCase': 'Id',
    'DeviceAsset': 'Id',
    'DiagnosisRecord': 'Id',
    'RepairAction': 'Id',
    'EvidenceItem': 'Id',
    'QualityReview': 'Id',
    'AuditEntry': 'Id',
    'SyncOperationRecord': 'OperationId',
    'AttachmentUploadSession': 'Id',
}.items():
    start = db_context.index(f'builder.Entity<{entity}>(entity =>')
    next_entity = db_context.find('builder.Entity<', start + 1)
    block = db_context[start: next_entity if next_entity >= 0 else len(db_context)]
    expected = f'entity.Property(item => item.{key}).ValueGeneratedNever();'
    assert expected in block, f'{entity}.{key} must be configured as application-generated'

# Desktop shell jobs run from clean checkouts. Phase 3 makes the desktop package
# depend on the built sync-engine workspace package, so both inherited workflows
# must materialise sync-engine declarations before invoking raw desktop typecheck.
platform_workflow = (ROOT / '.github/workflows/platform-foundation.yml').read_text()
repair_workflow = (ROOT / '.github/workflows/repair-workflows.yml').read_text()
sync_engine_build = 'pnpm --filter @repairflow/sync-engine build'
desktop_typecheck = 'pnpm --filter @repairflow/desktop typecheck'
for workflow_name, workflow_text in (
    ('Platform Foundation', platform_workflow),
    ('Repair Workflows', repair_workflow),
):
    sync_position = workflow_text.find(sync_engine_build)
    desktop_position = workflow_text.find(desktop_typecheck)
    assert sync_position >= 0, f'{workflow_name} must build sync-engine in clean desktop jobs'
    assert desktop_position >= 0, f'{workflow_name} desktop typecheck command is missing'
    assert sync_position < desktop_position, f'{workflow_name} must build sync-engine before desktop typecheck'

readme = (ROOT / 'README.md').read_text()
assert 'Current stage: **Phase 3 - Synchronisation Reliability and Operations**' in readme
assert '| Phase 3 | Offline synchronisation, reliability, security and observability | Complete |' in readme

print('Phase 3 repository validation passed.')
