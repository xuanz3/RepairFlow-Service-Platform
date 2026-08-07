#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def text(path): return (ROOT / path).read_text()

upload = text('apps/api/src/RepairFlow.Api/AttachmentUploadService.cs')
assert '50L * 1024 * 1024' in text('apps/api/src/RepairFlow.Domain/AttachmentUploadSession.cs')
assert 'MaximumChunkSize = 1024 * 1024' in upload
assert 'Path.GetFileName(fileName)' in upload
assert 'CryptographicOperations.FixedTimeEquals' in upload
assert 'Convert.FromHexString' in upload
assert 'FileShare.None' in upload
assert '.part' in upload and '.bin' in upload

sync_endpoints = text('apps/api/src/RepairFlow.Api/SyncEndpoints.cs')
for policy in ['RepairTeam', 'AdminOnly']:
    assert f'RequireAuthorization("{policy}")' in sync_endpoints

upload_endpoints = text('apps/api/src/RepairFlow.Api/AttachmentUploadEndpoints.cs')
assert 'RequireAuthorization("RepairTeam")' in upload_endpoints

program = text('apps/api/src/RepairFlow.Api/Program.cs')
assert 'RequireRole("Admin")' in program
coordinator = text('apps/api/src/RepairFlow.Application/SyncCoordinator.cs')
repository = text('apps/api/src/RepairFlow.Infrastructure/Persistence/SyncRepository.cs')
assert 'existing.ActorId != actorId' in coordinator
assert 'pg_advisory_xact_lock' in repository
assert 'AddOpenTelemetry()' in program

desktop = text('apps/desktop/electron/main.ts')
for boundary in ['contextIsolation: true', 'nodeIntegration: false', 'sandbox: true']:
    assert boundary in desktop
assert "ipcMain.handle('sync:" in desktop
assert 'ipcRenderer' not in text('apps/desktop/src/syncRuntime.ts')

for store in ['apps/desktop/electron/syncStore.ts', 'apps/mobile/src/mobileSyncStore.ts']:
    content = text(store).lower()
    assert 'access_token' not in content and 'refresh_token' not in content and 'password' not in content

assert '.repairflow/' in text('.gitignore')
print('Phase 3 security and reliability boundary validation passed.')
