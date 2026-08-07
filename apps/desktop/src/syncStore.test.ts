import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { SyncOperationEnvelope } from '@repairflow/contracts';
import { DurableSyncStore } from '../electron/syncStore';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('desktop durable sync store', () => {
  it('survives process-style close and reopen without losing the outbox', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'repairflow-sync-'));
    directories.push(directory);
    const databasePath = path.join(directory, 'sync.sqlite');
    const operation: SyncOperationEnvelope = {
      operationId: '018f0a9b-4b55-7d62-9d10-11c359f9888',
      kind: 'status.update',
      repairCaseId: '018f0a9b-4b55-7d62-9d10-11c359f9777',
      baseVersion: 2,
      payload: { status: 'diagnosing', expectedVersion: 2 },
      createdAt: '2026-08-08T00:00:00.000Z',
    };

    const first = new DurableSyncStore(databasePath);
    const queued = first.queue(operation);
    first.saveSync({ ...queued, status: 'sending', attemptCount: 1 });
    first.setCursor(14);
    first.close();

    const reopened = new DurableSyncStore(databasePath);
    const ready = await reopened.listReady('2999-01-01T00:00:00.000Z', 10);
    expect(ready).toHaveLength(1);
    expect(ready[0]?.operation.operationId).toBe(operation.operationId);
    expect(ready[0]?.status).toBe('retrying');
    expect(ready[0]?.attemptCount).toBe(1);
    expect(reopened.getCursor()).toBe(14);
    reopened.close();
  });
});
