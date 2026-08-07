import type { DeltaPage, RepairCaseDetail, SyncConflict } from '@repairflow/contracts';

export interface DeltaState {
  cursor: number;
  cases: Map<string, RepairCaseDetail>;
}

export interface DeltaApplyResult {
  cursor: number;
  applied: number;
  ignored: number;
  tombstones: number;
}

export function applyDeltaPage(state: DeltaState, page: DeltaPage): DeltaApplyResult {
  let applied = 0;
  let ignored = 0;
  let tombstones = 0;

  for (const change of page.changes) {
    const existing = state.cases.get(change.entityId);
    if (existing && existing.version > change.version) {
      ignored += 1;
      continue;
    }

    if (change.deleted) {
      state.cases.delete(change.entityId);
      tombstones += 1;
      applied += 1;
      continue;
    }

    if (!change.payload) {
      ignored += 1;
      continue;
    }

    state.cases.set(change.entityId, change.payload);
    applied += 1;
  }

  state.cursor = Math.max(state.cursor, page.nextCursor);
  return { cursor: state.cursor, applied, ignored, tombstones };
}

export function conflictSummary(conflict: SyncConflict): string {
  const fields = conflict.differences.map((item) => item.field).join(', ');
  return fields
    ? `Server version ${conflict.serverVersion} differs in ${fields}.`
    : `Server version ${conflict.serverVersion} differs from the local base.`;
}
