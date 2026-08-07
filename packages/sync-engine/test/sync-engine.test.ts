import { describe, expect, it } from 'vitest';
import type {
  DeltaPage,
  RepairCaseDetail,
  SyncOperationEnvelope,
  SyncOperationReceipt,
} from '@repairflow/contracts';
import {
  applyDeltaPage,
  createOutboxItem,
  createUploadPlan,
  drainOutbox,
  nextUploadChunk,
  resumeUpload,
  retryDelayMs,
  type OutboxItem,
  type OutboxRepository,
  type SyncTransport,
} from '../src/index';

const repairCase = (version: number): RepairCaseDetail => ({
  id: 'case-1',
  reference: 'RF-TEST-1',
  customerDisplayName: 'Reliability Test',
  reportedFault: 'Synthetic fault.',
  intakeCondition: 'Synthetic intake condition.',
  device: {
    id: 'device-1',
    manufacturer: 'Example',
    model: 'Unit',
    category: 'Test',
    serialNumberMasked: '********0001',
  },
  status: 'checked-in',
  priority: 'standard',
  updatedAt: '2026-08-08T00:00:00.000Z',
  version,
  repairActions: [],
  evidence: [],
  qualityReviews: [],
});

class MemoryOutbox implements OutboxRepository {
  public readonly items = new Map<string, OutboxItem>();

  public async listReady(now: string): Promise<OutboxItem[]> {
    return [...this.items.values()].filter(
      (item) => ['pending', 'retrying'].includes(item.status) && item.nextAttemptAt <= now,
    );
  }

  public async save(item: OutboxItem): Promise<void> {
    this.items.set(item.operation.operationId, structuredClone(item));
  }
}

const operation: SyncOperationEnvelope = {
  operationId: '018f0a9b-4b55-7d62-9d10-11c359f9001',
  kind: 'status.update',
  repairCaseId: 'case-1',
  baseVersion: 1,
  payload: { status: 'diagnosing', expectedVersion: 1 },
  createdAt: '2026-08-08T00:00:00.000Z',
};

describe('reliable synchronisation engine', () => {
  it('uses deterministic bounded exponential retry delays', () => {
    expect(retryDelayMs(1)).toBe(1_000);
    expect(retryDelayMs(4)).toBe(8_000);
    expect(retryDelayMs(20)).toBe(60_000);
  });

  it('retains an offline operation for a later retry', async () => {
    const repository = new MemoryOutbox();
    await repository.save(createOutboxItem(operation));
    const transport: SyncTransport = {
      send: async () => {
        throw new Error('offline');
      },
      pull: async () => ({ nextCursor: 0, hasMore: false, snapshot: false, changes: [] }),
    };

    const summary = await drainOutbox(repository, transport, new Date('2026-08-08T00:00:00Z'));
    const saved = repository.items.get(operation.operationId);
    expect(summary.retried).toBe(1);
    expect(saved?.status).toBe('retrying');
    expect(saved?.attemptCount).toBe(1);
  });

  it('accepts replay receipts as completed operations', async () => {
    const repository = new MemoryOutbox();
    await repository.save(createOutboxItem(operation));
    const receipt: SyncOperationReceipt = {
      operationId: operation.operationId,
      status: 'replayed',
      serverVersion: 2,
      repairCase: repairCase(2),
    };
    const transport: SyncTransport = {
      send: async () => receipt,
      pull: async () => ({ nextCursor: 0, hasMore: false, snapshot: false, changes: [] }),
    };

    const summary = await drainOutbox(repository, transport, new Date('2026-08-08T00:00:00Z'));
    expect(summary.completed).toBe(1);
    expect(repository.items.get(operation.operationId)?.status).toBe('completed');
  });

  it('applies newer deltas and deletion tombstones', () => {
    const state = { cursor: 0, cases: new Map([['case-1', repairCase(1)]]) };
    const update: DeltaPage = {
      nextCursor: 2,
      hasMore: false,
      snapshot: false,
      changes: [
        {
          cursor: 1,
          entityType: 'repair-case',
          entityId: 'case-1',
          version: 2,
          deleted: false,
          changedAt: '2026-08-08T00:01:00Z',
          payload: repairCase(2),
        },
      ],
    };
    expect(applyDeltaPage(state, update).applied).toBe(1);
    expect(state.cases.get('case-1')?.version).toBe(2);

    const tombstone: DeltaPage = {
      nextCursor: 3,
      hasMore: false,
      snapshot: false,
      changes: [
        {
          cursor: 3,
          entityType: 'repair-case',
          entityId: 'case-1',
          version: 3,
          deleted: true,
          changedAt: '2026-08-08T00:02:00Z',
        },
      ],
    };
    expect(applyDeltaPage(state, tombstone).tombstones).toBe(1);
    expect(state.cases.has('case-1')).toBe(false);
  });

  it('resumes uploads from the exact committed byte offset', () => {
    const plan = createUploadPlan(700_000, 262_144);
    expect(nextUploadChunk(plan, 0)?.length).toBe(262_144);
    expect(nextUploadChunk(plan, 262_144)?.offset).toBe(262_144);
    expect(nextUploadChunk(plan, 700_000)).toBeUndefined();
  });
  it('does not let a stale tombstone delete a newer local version', () => {
    const newer = repairCase(8);
    const state = { cursor: 10, cases: new Map([[newer.id, newer]]) };
    const result = applyDeltaPage(state, {
      nextCursor: 11,
      hasMore: false,
      snapshot: false,
      changes: [
        {
          cursor: 11,
          entityType: 'repair-case',
          entityId: newer.id,
          version: 7,
          deleted: true,
          changedAt: '2026-08-08T00:03:00Z',
        },
      ],
    });
    expect(result.ignored).toBe(1);
    expect(state.cases.get(newer.id)?.version).toBe(8);
  });

  it('resumes an attachment from the server committed offset', async () => {
    const totalBytes = 10;
    const source = new Uint8Array(totalBytes).map((_, index) => index);
    let receivedBytes = 4;
    const session = {
      sessionId: 'session-1',
      repairCaseId: 'case-1',
      evidenceId: 'evidence-1',
      fileName: 'evidence.bin',
      contentType: 'application/octet-stream',
      totalBytes,
      receivedBytes,
      sha256: '0'.repeat(64),
      chunkSize: 3,
      state: 'active' as const,
      expiresAt: '2026-08-09T00:00:00Z',
    };
    const completed = await resumeUpload(
      session,
      async (offset, length) => source.slice(offset, offset + length),
      {
        uploadChunk: async (_sessionId, offset, chunk) => {
          expect(offset).toBe(receivedBytes);
          receivedBytes += chunk.byteLength;
          return { ...session, receivedBytes };
        },
        completeUpload: async () => ({
          ...session,
          receivedBytes: totalBytes,
          state: 'completed' as const,
        }),
      },
    );
    expect(completed.state).toBe('completed');
    expect(receivedBytes).toBe(totalBytes);
  });
});
