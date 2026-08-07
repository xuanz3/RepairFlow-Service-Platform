import { RepairFlowClient } from '@repairflow/api-client';
import type { DeltaPage, RepairCaseDetail, SyncOperationEnvelope } from '@repairflow/contracts';
import {
  applyDeltaPage,
  drainOutbox,
  type OutboxItem,
  type OutboxRepository,
} from '@repairflow/sync-engine';

export interface DesktopSyncOptions {
  baseUrl: string;
  getAccessToken: () => Promise<string | undefined>;
}

export async function queueDesktopOperation(operation: SyncOperationEnvelope): Promise<OutboxItem> {
  const bridge = requireBridge();
  return bridge.queueSyncOperation(operation);
}

export async function runDesktopSyncCycle(options: DesktopSyncOptions): Promise<{
  drain: Awaited<ReturnType<typeof drainOutbox>>;
  delta: DeltaPage;
}> {
  const bridge = requireBridge();
  const client = new RepairFlowClient(options);
  const repository: OutboxRepository = {
    listReady: (now, limit) => bridge.listReadySyncOperations(now, limit),
    save: (item) => bridge.saveSyncOperation(item),
  };
  const drain = await drainOutbox(
    repository,
    {
      send: (operation) => client.applySyncOperation(operation),
      pull: (cursor, limit) => client.pullDelta(cursor, limit),
    },
    new Date(),
  );

  const cursor = await bridge.getSyncCursor();
  const delta = await client.pullDelta(cursor);
  const existing = await bridge.listCases();
  const cases = new Map<string, RepairCaseDetail>();
  for (const summary of existing) {
    const detail = await bridge.getCase(summary.id);
    if (detail) cases.set(summary.id, detail);
  }
  const state = { cursor: cursor ?? 0, cases };
  applyDeltaPage(state, delta);

  for (const change of delta.changes) {
    if (change.deleted) {
      await bridge.deleteCase(change.entityId);
    } else if (change.payload) {
      await bridge.saveCase(change.payload);
    }
  }
  await bridge.recordDelta(delta);
  return { drain, delta };
}

function requireBridge(): NonNullable<Window['repairFlow']> {
  if (!window.repairFlow) throw new Error('RepairFlow desktop bridge is unavailable.');
  return window.repairFlow;
}
