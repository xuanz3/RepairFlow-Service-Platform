import { contextBridge, ipcRenderer } from 'electron';
import type {
  DeltaPage,
  EvidenceMetadata,
  RepairCaseDetail,
  RepairCaseSummary,
  SyncOperationEnvelope,
} from '@repairflow/contracts';
import type { OutboxItem } from '@repairflow/sync-engine';

contextBridge.exposeInMainWorld('repairFlow', {
  platform: process.platform,
  version: '0.6.0',
  listCases: (): Promise<RepairCaseSummary[]> => ipcRenderer.invoke('workflow:list'),
  getCase: (id: string): Promise<RepairCaseDetail | undefined> =>
    ipcRenderer.invoke('workflow:get', id),
  saveCase: (repairCase: RepairCaseDetail): Promise<RepairCaseDetail> =>
    ipcRenderer.invoke('workflow:save', repairCase),
  deleteCase: (id: string): Promise<boolean> => ipcRenderer.invoke('workflow:delete', id),
  resetPreview: (): Promise<RepairCaseSummary[]> => ipcRenderer.invoke('workflow:reset'),
  selectEvidenceFile: (): Promise<EvidenceMetadata | null> =>
    ipcRenderer.invoke('workflow:select-evidence'),
  queueSyncOperation: (operation: SyncOperationEnvelope): Promise<OutboxItem> =>
    ipcRenderer.invoke('sync:queue', operation),
  listReadySyncOperations: (now: string, limit: number): Promise<OutboxItem[]> =>
    ipcRenderer.invoke('sync:list-ready', now, limit),
  saveSyncOperation: (item: OutboxItem): Promise<void> => ipcRenderer.invoke('sync:save', item),
  getSyncCursor: (): Promise<number | undefined> => ipcRenderer.invoke('sync:get-cursor'),
  setSyncCursor: (cursor: number): Promise<void> => ipcRenderer.invoke('sync:set-cursor', cursor),
  recordDelta: (page: DeltaPage): Promise<void> => ipcRenderer.invoke('sync:record-delta', page),
  getSyncSummary: (): Promise<{
    pending: number;
    conflicts: number;
    failed: number;
    cursor?: number;
  }> => ipcRenderer.invoke('sync:summary'),
});
