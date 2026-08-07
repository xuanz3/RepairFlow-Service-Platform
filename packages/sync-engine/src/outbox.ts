import type { SyncOperationEnvelope } from '@repairflow/contracts';
import type { DrainSummary, OutboxItem, OutboxRepository, SyncTransport } from './types.js';

const DEFAULT_BASE_DELAY_MS = 1_000;
const DEFAULT_MAX_DELAY_MS = 60_000;
const MAX_RETRY_ATTEMPTS = 8;

export function createOutboxItem(operation: SyncOperationEnvelope): OutboxItem {
  return {
    operation,
    status: 'pending',
    attemptCount: 0,
    nextAttemptAt: operation.createdAt,
  };
}

export function retryDelayMs(
  attemptCount: number,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
): number {
  const safeAttempt = Math.max(1, Math.floor(attemptCount));
  return Math.min(maxDelayMs, baseDelayMs * 2 ** (safeAttempt - 1));
}

export async function drainOutbox(
  repository: OutboxRepository,
  transport: SyncTransport,
  now: Date,
  limit = 25,
): Promise<DrainSummary> {
  const ready = await repository.listReady(now.toISOString(), limit);
  const summary: DrainSummary = {
    attempted: 0,
    completed: 0,
    conflicts: 0,
    retried: 0,
    failed: 0,
  };

  for (const item of ready) {
    summary.attempted += 1;
    const sending: OutboxItem = {
      ...item,
      status: 'sending',
      attemptCount: item.attemptCount + 1,
      lastError: undefined,
    };
    await repository.save(sending);

    try {
      const receipt = await transport.send(item.operation);
      if (receipt.status === 'conflict') {
        await repository.save({ ...sending, status: 'conflict', receipt });
        summary.conflicts += 1;
      } else {
        await repository.save({ ...sending, status: 'completed', receipt });
        summary.completed += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown synchronisation failure.';
      if (sending.attemptCount >= MAX_RETRY_ATTEMPTS) {
        await repository.save({ ...sending, status: 'failed', lastError: message });
        summary.failed += 1;
        continue;
      }

      const nextAttemptAt = new Date(
        now.getTime() + retryDelayMs(sending.attemptCount),
      ).toISOString();
      await repository.save({
        ...sending,
        status: 'retrying',
        nextAttemptAt,
        lastError: message,
      });
      summary.retried += 1;
    }
  }

  return summary;
}
