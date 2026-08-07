import type { EvidenceMetadata, RepairCaseDetail, RepairCaseSummary } from '@repairflow/contracts';
import { previewCases } from './workflowModel';

const fallbackKey = 'repairflow.desktop.preview.v1';

export const workflowRepository = {
  async list(): Promise<RepairCaseSummary[]> {
    if (window.repairFlow?.listCases) return window.repairFlow.listCases();
    return loadFallback().map(toSummary);
  },

  async get(id: string): Promise<RepairCaseDetail | undefined> {
    if (window.repairFlow?.getCase) return window.repairFlow.getCase(id);
    return loadFallback().find((item) => item.id === id);
  },

  async save(repairCase: RepairCaseDetail): Promise<RepairCaseDetail> {
    if (window.repairFlow?.saveCase) return window.repairFlow.saveCase(repairCase);
    const cases = loadFallback();
    const index = cases.findIndex((item) => item.id === repairCase.id);
    if (index >= 0) cases[index] = repairCase;
    else cases.unshift(repairCase);
    window.localStorage.setItem(fallbackKey, JSON.stringify(cases));
    return repairCase;
  },

  async reset(): Promise<RepairCaseSummary[]> {
    if (window.repairFlow?.resetPreview) return window.repairFlow.resetPreview();
    window.localStorage.setItem(fallbackKey, JSON.stringify(previewCases));
    return previewCases.map(toSummary);
  },

  async selectEvidence(): Promise<EvidenceMetadata | null> {
    if (window.repairFlow?.selectEvidenceFile) return window.repairFlow.selectEvidenceFile();
    return {
      id: crypto.randomUUID(),
      fileName: 'browser-preview-evidence.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 128000,
      kind: 'repair',
      note: 'Generated browser preview evidence.',
      createdAt: new Date().toISOString(),
    };
  },
};

function loadFallback(): RepairCaseDetail[] {
  const stored = window.localStorage.getItem(fallbackKey);
  if (stored) return JSON.parse(stored) as RepairCaseDetail[];
  window.localStorage.setItem(fallbackKey, JSON.stringify(previewCases));
  return structuredClone(previewCases);
}

function toSummary(item: RepairCaseDetail): RepairCaseSummary {
  return {
    id: item.id,
    reference: item.reference,
    customerDisplayName: item.customerDisplayName,
    device: item.device,
    status: item.status,
    priority: item.priority,
    assignedTechnicianId: item.assignedTechnicianId,
    updatedAt: item.updatedAt,
    version: item.version,
  };
}
