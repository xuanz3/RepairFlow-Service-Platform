import * as SQLite from 'expo-sqlite';
import type { DeltaPage, SyncOperationEnvelope, SyncOperationReceipt } from '@repairflow/contracts';
import type { OutboxItem, OutboxRepository } from '@repairflow/sync-engine';

interface OutboxRow {
  operation_json: string;
  status: OutboxItem['status'];
  attempt_count: number;
  next_attempt_at: string;
  last_error: string | null;
  receipt_json: string | null;
}

let databasePromise: ReturnType<typeof SQLite.openDatabaseAsync> | undefined;

export async function queueMobileSyncOperation(
  operation: SyncOperationEnvelope,
): Promise<OutboxItem> {
  const item: OutboxItem = {
    operation,
    status: 'pending',
    attemptCount: 0,
    nextAttemptAt: operation.createdAt,
  };
  await saveMobileOutboxItem(item);
  return item;
}

export async function listReadyMobileOutbox(now: string, limit: number): Promise<OutboxItem[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<OutboxRow>(
    `SELECT operation_json, status, attempt_count, next_attempt_at, last_error, receipt_json
     FROM sync_outbox
     WHERE status IN ('pending', 'retrying') AND next_attempt_at <= ?
     ORDER BY next_attempt_at ASC
     LIMIT ?`,
    now,
    Math.max(1, Math.min(limit, 100)),
  );
  return rows.map((row) => ({
    operation: JSON.parse(row.operation_json) as SyncOperationEnvelope,
    status: row.status,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at,
    lastError: row.last_error ?? undefined,
    receipt: row.receipt_json ? (JSON.parse(row.receipt_json) as SyncOperationReceipt) : undefined,
  }));
}

export async function saveMobileOutboxItem(item: OutboxItem): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO sync_outbox (
      operation_id, status, attempt_count, next_attempt_at, last_error, receipt_json, operation_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(operation_id) DO UPDATE SET
      status = excluded.status,
      attempt_count = excluded.attempt_count,
      next_attempt_at = excluded.next_attempt_at,
      last_error = excluded.last_error,
      receipt_json = excluded.receipt_json,
      operation_json = excluded.operation_json`,
    item.operation.operationId,
    item.status,
    item.attemptCount,
    item.nextAttemptAt,
    item.lastError ?? null,
    item.receipt ? JSON.stringify(item.receipt) : null,
    JSON.stringify(item.operation),
  );

  if (item.status === 'conflict' && item.receipt) {
    await database.runAsync(
      `INSERT INTO sync_conflicts (operation_id, receipt_json, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(operation_id) DO UPDATE SET
         receipt_json = excluded.receipt_json,
         created_at = excluded.created_at`,
      item.operation.operationId,
      JSON.stringify(item.receipt),
      new Date().toISOString(),
    );
  }
}

export const mobileOutboxRepository: OutboxRepository = {
  listReady: listReadyMobileOutbox,
  save: saveMobileOutboxItem,
};

export async function getMobileSyncCursor(): Promise<number | undefined> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_state WHERE key = 'cursor'",
  );
  if (!row) return undefined;
  const value = Number(row.value);
  return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

export async function recordMobileDelta(page: DeltaPage): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO sync_state (key, value) VALUES ('cursor', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    String(page.nextCursor),
  );
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= SQLite.openDatabaseAsync('repairflow-sync.db');
  const database = await databasePromise;
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    CREATE TABLE IF NOT EXISTS sync_outbox (
      operation_id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      attempt_count INTEGER NOT NULL,
      next_attempt_at TEXT NOT NULL,
      last_error TEXT,
      receipt_json TEXT,
      operation_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS ix_sync_outbox_ready
      ON sync_outbox(status, next_attempt_at);
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_conflicts (
      operation_id TEXT PRIMARY KEY NOT NULL,
      receipt_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  await database.runAsync(
    `UPDATE sync_outbox
     SET status = 'retrying', next_attempt_at = ?,
         last_error = 'Application restarted while the operation was in flight.'
     WHERE status = 'sending'`,
    new Date().toISOString(),
  );
  return database;
}
