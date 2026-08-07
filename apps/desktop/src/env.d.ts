/// <reference types="vite/client" />

import type { EvidenceMetadata, RepairCaseDetail, RepairCaseSummary } from '@repairflow/contracts';

declare global {
  interface Window {
    repairFlow?: {
      platform: string;
      version: string;
      listCases: () => Promise<RepairCaseSummary[]>;
      getCase: (id: string) => Promise<RepairCaseDetail | undefined>;
      saveCase: (repairCase: RepairCaseDetail) => Promise<RepairCaseDetail>;
      resetPreview: () => Promise<RepairCaseSummary[]>;
      selectEvidenceFile: () => Promise<EvidenceMetadata | null>;
    };
  }
}

export {};
