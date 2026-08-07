#!/usr/bin/env node
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createOutboxItem, drainOutbox } from '../../packages/sync-engine/dist/index.js';

class JsonOutbox {
  constructor(file) {
    this.file = file;
  }
  async load() {
    try {
      return JSON.parse(await readFile(this.file, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }
  async saveAll(items) {
    await writeFile(this.file, JSON.stringify(items, null, 2));
  }
  async listReady(now, limit) {
    return (await this.load())
      .filter(
        (item) =>
          ['pending', 'retrying', 'sending'].includes(item.status) && item.nextAttemptAt <= now,
      )
      .slice(0, limit);
  }
  async save(item) {
    const items = await this.load();
    const index = items.findIndex(
      (entry) => entry.operation.operationId === item.operation.operationId,
    );
    if (index >= 0) items[index] = item;
    else items.push(item);
    await this.saveAll(items);
  }
}

const temp = await mkdtemp(path.join(os.tmpdir(), 'repairflow-phase3-'));
const outboxFile = path.join(temp, 'outbox.json');
const repository = new JsonOutbox(outboxFile);
const operation = {
  operationId: '018f0a9b-4b55-7d62-9d10-11c359f9a999',
  kind: 'status.update',
  repairCaseId: '018f0a9b-4b55-7d62-9d10-11c359f9f201',
  baseVersion: 6,
  payload: { status: 'ready-for-delivery', expectedVersion: 6 },
  createdAt: '2026-08-08T00:00:00.000Z',
};
await repository.save(createOutboxItem(operation));

// Offline/service failure keeps committed work and schedules retry.
let calls = 0;
await drainOutbox(
  repository,
  {
    send: async () => {
      calls += 1;
      throw new Error('service unavailable');
    },
    pull: async () => {
      throw new Error('offline');
    },
  },
  new Date('2026-08-08T00:00:00.000Z'),
);
let persisted = (await repository.load())[0];
assert.equal(persisted.status, 'retrying');
assert.equal(persisted.operation.operationId, operation.operationId);

// Simulate process termination by constructing a new repository over the same file.
const restarted = new JsonOutbox(outboxFile);
persisted.nextAttemptAt = '2026-08-08T00:00:01.000Z';
await restarted.save(persisted);
await drainOutbox(
  restarted,
  {
    send: async (value) => ({
      operationId: value.operationId,
      status: 'replayed',
      serverVersion: 7,
    }),
    pull: async () => ({ cursor: 0, nextCursor: 0, snapshot: false, changes: [] }),
  },
  new Date('2026-08-08T00:00:02.000Z'),
);
persisted = (await restarted.load())[0];
assert.equal(persisted.status, 'completed');
assert.equal(persisted.receipt.status, 'replayed');
assert.equal(calls, 1);

// Explicit conflicts are durable and are not silently retried.
const conflictOperation = {
  ...operation,
  operationId: '018f0a9b-4b55-7d62-9d10-11c359f9a998',
  baseVersion: 2,
};
await restarted.save(createOutboxItem(conflictOperation));
await drainOutbox(
  restarted,
  {
    send: async (value) => ({
      operationId: value.operationId,
      status: 'conflict',
      serverVersion: 9,
      conflict: {
        repairCaseId: value.repairCaseId,
        baseVersion: 2,
        serverVersion: 9,
        differences: [{ field: 'aggregateVersion', localValue: '2', serverValue: '9' }],
      },
    }),
    pull: async () => ({ cursor: 0, nextCursor: 0, snapshot: false, changes: [] }),
  },
  new Date('2026-08-08T00:00:03.000Z'),
);
const conflicted = (await restarted.load()).find(
  (item) => item.operation.operationId === conflictOperation.operationId,
);
assert.equal(conflicted.status, 'conflict');
assert.equal(conflicted.receipt.conflict.serverVersion, 9);

// Expired authentication keeps work durable until a refreshed token can replay it.
const authOperation = { ...operation, operationId: '018f0a9b-4b55-7d62-9d10-11c359f9a997' };
await restarted.save(createOutboxItem(authOperation));
await drainOutbox(
  restarted,
  {
    send: async () => {
      throw new Error('401 token expired');
    },
    pull: async () => {
      throw new Error('token expired');
    },
  },
  new Date('2026-08-08T00:00:04.000Z'),
);
let authItem = (await restarted.load()).find(
  (item) => item.operation.operationId === authOperation.operationId,
);
assert.equal(authItem.status, 'retrying');
authItem.nextAttemptAt = '2026-08-08T00:00:05.000Z';
await restarted.save(authItem);
await drainOutbox(
  restarted,
  {
    send: async (value) => ({
      operationId: value.operationId,
      status: 'applied',
      serverVersion: 8,
    }),
    pull: async () => ({ cursor: 0, nextCursor: 0, snapshot: false, changes: [] }),
  },
  new Date('2026-08-08T00:00:06.000Z'),
);
authItem = (await restarted.load()).find(
  (item) => item.operation.operationId === authOperation.operationId,
);
assert.equal(authItem.status, 'completed');

console.log('Phase 3 controlled failure recovery scenarios passed.');
