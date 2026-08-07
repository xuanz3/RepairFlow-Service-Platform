#!/usr/bin/env node
import { performance } from 'node:perf_hooks';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {
  applyDeltaPage,
  createOutboxItem,
  drainOutbox,
} from '../../packages/sync-engine/dist/index.js';

class MemoryOutbox {
  constructor(items) {
    this.items = new Map(items.map((item) => [item.operation.operationId, item]));
  }
  async listReady(now, limit) {
    return [...this.items.values()]
      .filter((item) => item.nextAttemptAt <= now && ['pending', 'retrying'].includes(item.status))
      .slice(0, limit);
  }
  async save(item) {
    this.items.set(item.operation.operationId, item);
  }
}

const count = 1000;
const now = new Date('2026-08-08T00:00:00.000Z');
const operations = Array.from({ length: count }, (_, index) =>
  createOutboxItem({
    operationId: `00000000-0000-7000-8000-${String(index).padStart(12, '0')}`,
    kind: 'status.update',
    repairCaseId: '018f0a9b-4b55-7d62-9d10-11c359f9f201',
    baseVersion: 1,
    payload: { status: 'diagnosing', expectedVersion: 1 },
    createdAt: now.toISOString(),
  }),
);
const repository = new MemoryOutbox(operations);
const transport = {
  send: async (operation) => ({
    operationId: operation.operationId,
    status: 'applied',
    serverVersion: 2,
  }),
  pull: async () => ({ cursor: 0, nextCursor: 0, snapshot: false, changes: [] }),
};

const outboxStart = performance.now();
let processed = 0;
while (processed < count) {
  const result = await drainOutbox(repository, transport, now, 100);
  processed += result.completed;
  if (result.attempted === 0) break;
}
const outboxMs = performance.now() - outboxStart;
assert.equal(processed, count);

const cases = new Map();
const changes = Array.from({ length: count }, (_, index) => ({
  cursor: index + 1,
  entityType: 'repair-case',
  entityId: `00000000-0000-7000-9000-${String(index).padStart(12, '0')}`,
  version: 1,
  deleted: false,
  changedAt: now.toISOString(),
  payload: {
    id: `00000000-0000-7000-9000-${String(index).padStart(12, '0')}`,
    reference: `RF-PERF-${index}`,
    customerDisplayName: 'Generated performance case',
    device: {
      id: `00000000-0000-7000-a000-${String(index).padStart(12, '0')}`,
      manufacturer: 'Generated',
      model: 'Device',
      category: 'Test',
      serialNumberMasked: '********0000',
    },
    status: 'checked-in',
    priority: 'standard',
    updatedAt: now.toISOString(),
    version: 1,
    reportedFault: 'Generated performance fixture.',
    intakeCondition: 'Generated fixture.',
    repairActions: [],
    evidence: [],
    qualityReviews: [],
  },
}));
const deltaStart = performance.now();
const delta = applyDeltaPage(
  { cursor: 0, cases },
  { cursor: 0, nextCursor: count, snapshot: false, changes },
);
const deltaMs = performance.now() - deltaStart;
assert.equal(delta.applied, count);

const budgetMs = 1500;
assert.ok(
  outboxMs < budgetMs,
  `Outbox processing exceeded ${budgetMs}ms: ${outboxMs.toFixed(1)}ms`,
);
assert.ok(deltaMs < budgetMs, `Delta application exceeded ${budgetMs}ms: ${deltaMs.toFixed(1)}ms`);
const report = {
  generatedAt: new Date().toISOString(),
  runtime: process.version,
  operations: count,
  outboxMs: Number(outboxMs.toFixed(2)),
  deltaMs: Number(deltaMs.toFixed(2)),
  budgetMs,
  passed: true,
};
const output =
  process.env.PHASE3_METRICS_OUTPUT ||
  path.join(os.tmpdir(), 'repairflow-phase3-sync-performance.json');
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `Phase 3 sync performance passed: outbox=${report.outboxMs}ms delta=${report.deltaMs}ms budget=${budgetMs}ms`,
);
console.log(`Metrics report: ${output}`);
