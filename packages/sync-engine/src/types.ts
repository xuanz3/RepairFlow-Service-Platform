import type { DeltaPage, SyncOperationEnvelope, SyncOperationReceipt } from '@repairflow/contracts';

export type OutboxStatus = 'pending' | 'sending' | 'retrying' | 'conflict' | 'failed' | 'completed';

export interface OutboxItem {
  operation: SyncOperationEnvelope;
  status: OutboxStatus;
  attemptCount: number;
  nextAttemptAt: string;
  lastError?: string;
  receipt?: SyncOperationReceipt;
}

export interface OutboxRepository {
  listReady(now: string, limit: number): Promise<OutboxItem[]>;
  save(item: OutboxItem): Promise<void>;
}

export interface SyncTransport {
  send(operation: SyncOperationEnvelope): Promise<SyncOperationReceipt>;
  pull(cursor?: number, limit?: number): Promise<DeltaPage>;
}

export interface DrainSummary {
  attempted: number;
  completed: number;
  conflicts: number;
  retried: number;
  failed: number;
}
