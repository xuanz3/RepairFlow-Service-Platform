import { describe, expect, it } from 'vitest';
import { createOutboxItem } from '@repairflow/sync-engine';
import { recoverInterruptedSend, restoreOutboxItem } from './mobileSyncState';

const operation = {
  operationId: '018f0a9b-4b55-7d62-9d10-11c359f9a901',
  kind: 'diagnosis.record' as const,
  repairCaseId: '018f0a9b-4b55-7d62-9d10-11c359f9f201',
  baseVersion: 4,
  payload: { summary: 'Reproduced after restart.' },
  createdAt: '2026-08-08T00:00:00.000Z',
};

describe('mobile sync restart recovery', () => {
  it('round-trips a durable operation without changing its stable id', () => {
    const item = createOutboxItem(operation);
    const restored = restoreOutboxItem(JSON.stringify(item));
    expect(restored.operation.operationId).toBe(operation.operationId);
    expect(restored.status).toBe('pending');
  });

  it('moves an interrupted in-flight operation back to retrying', () => {
    const sending = { ...createOutboxItem(operation), status: 'sending' as const, attemptCount: 1 };
    const recovered = recoverInterruptedSend(sending, '2026-08-08T00:01:00.000Z');
    expect(recovered.status).toBe('retrying');
    expect(recovered.attemptCount).toBe(1);
    expect(recovered.operation.operationId).toBe(operation.operationId);
  });
});
