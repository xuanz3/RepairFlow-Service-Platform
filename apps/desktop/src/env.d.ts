/// <reference types="vite/client" />

import type {
  DeltaPage,
  EvidenceMetadata,
  RepairCaseDetail,
  RepairCaseSummary,
  SyncOperationEnvelope,
} from '@repairflow/contracts';
import type { OutboxItem } from '@repairflow/sync-engine';

declare global {
  interface Window {
    repairFlow?: {
      platform: string;
      version: string;
      listCases: () => Promise<RepairCaseSummary[]>;
      getCase: (id: string) => Promise<RepairCaseDetail | undefined>;
      saveCase: (repairCase: RepairCaseDetail) => Promise<RepairCaseDetail>;
      deleteCase: (id: string) => Promise<boolean>;
      resetPreview: () => Promise<RepairCaseSummary[]>;
      selectEvidenceFile: () => Promise<EvidenceMetadata | null>;
      queueSyncOperation: (operation: SyncOperationEnvelope) => Promise<OutboxItem>;
      listReadySyncOperations: (now: string, limit: number) => Promise<OutboxItem[]>;
      saveSyncOperation: (item: OutboxItem) => Promise<void>;
      getSyncCursor: () => Promise<number | undefined>;
      setSyncCursor: (cursor: number) => Promise<void>;
      recordDelta: (page: DeltaPage) => Promise<void>;
      getSyncSummary: () => Promise<{
        pending: number;
        conflicts: number;
        failed: number;
        cursor?: number;
      }>;
    };
  }
}

export {};
