import { contextBridge, ipcRenderer } from 'electron';
import type { EvidenceMetadata, RepairCaseDetail, RepairCaseSummary } from '@repairflow/contracts';

contextBridge.exposeInMainWorld('repairFlow', {
  platform: process.platform,
  version: '0.3.0',
  listCases: (): Promise<RepairCaseSummary[]> => ipcRenderer.invoke('workflow:list'),
  getCase: (id: string): Promise<RepairCaseDetail | undefined> =>
    ipcRenderer.invoke('workflow:get', id),
  saveCase: (repairCase: RepairCaseDetail): Promise<RepairCaseDetail> =>
    ipcRenderer.invoke('workflow:save', repairCase),
  resetPreview: (): Promise<RepairCaseSummary[]> => ipcRenderer.invoke('workflow:reset'),
  selectEvidenceFile: (): Promise<EvidenceMetadata | null> =>
    ipcRenderer.invoke('workflow:select-evidence'),
});
