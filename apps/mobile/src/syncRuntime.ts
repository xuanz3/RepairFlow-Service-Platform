import { RepairFlowClient } from '@repairflow/api-client';
import type { RepairCaseDetail, SyncOperationEnvelope } from '@repairflow/contracts';
import { applyDeltaPage, drainOutbox } from '@repairflow/sync-engine';
import {
  deleteLocalRepairCase,
  getLocalRepairCase,
  listLocalRepairCases,
  saveLocalRepairCase,
} from './localWorkflowStore';
import {
  getMobileSyncCursor,
  mobileOutboxRepository,
  queueMobileSyncOperation,
  recordMobileDelta,
} from './mobileSyncStore';

export interface MobileSyncOptions {
  baseUrl: string;
  getAccessToken: () => Promise<string | undefined>;
}

export function queueMobileOperation(operation: SyncOperationEnvelope) {
  return queueMobileSyncOperation(operation);
}

export async function runMobileSyncCycle(options: MobileSyncOptions) {
  const client = new RepairFlowClient(options);
  const drain = await drainOutbox(
    mobileOutboxRepository,
    {
      send: (operation) => client.applySyncOperation(operation),
      pull: (cursor, limit) => client.pullDelta(cursor, limit),
    },
    new Date(),
  );

  const cursor = await getMobileSyncCursor();
  const delta = await client.pullDelta(cursor);
  const summaries = await listLocalRepairCases();
  const cases = new Map<string, RepairCaseDetail>();
  for (const summary of summaries) {
    const detail = await getLocalRepairCase(summary.id);
    if (detail) cases.set(summary.id, detail);
  }
  const state = { cursor: cursor ?? 0, cases };
  applyDeltaPage(state, delta);

  for (const change of delta.changes) {
    if (change.deleted) {
      await deleteLocalRepairCase(change.entityId);
    } else if (change.payload) {
      await saveLocalRepairCase(change.payload);
    }
  }
  await recordMobileDelta(delta);
  return { drain, delta };
}
