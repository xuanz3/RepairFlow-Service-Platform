import type { OutboxItem } from '@repairflow/sync-engine';

const statuses = new Set(['pending', 'sending', 'retrying', 'conflict', 'failed', 'completed']);

export function restoreOutboxItem(serialized: string): OutboxItem {
  const value = JSON.parse(serialized) as Partial<OutboxItem>;
  if (!value.operation || typeof value.operation.operationId !== 'string') {
    throw new TypeError('Persisted sync operation is missing a stable operation id.');
  }
  if (!value.status || !statuses.has(value.status)) {
    throw new TypeError('Persisted sync operation has an invalid status.');
  }
  if (!Number.isInteger(value.attemptCount) || Number(value.attemptCount) < 0) {
    throw new TypeError('Persisted sync operation has an invalid attempt count.');
  }
  if (typeof value.nextAttemptAt !== 'string') {
    throw new TypeError('Persisted sync operation is missing its retry timestamp.');
  }
  return value as OutboxItem;
}

export function recoverInterruptedSend(item: OutboxItem, now: string): OutboxItem {
  if (item.status !== 'sending') return item;
  return {
    ...item,
    status: 'retrying',
    nextAttemptAt: now,
    lastError: 'Application restarted while the operation was in flight.',
  };
}
