import { DatabaseSync } from 'node:sqlite';
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

export class DurableSyncStore implements OutboxRepository {
  private readonly database: DatabaseSync;

  public constructor(databasePath: string) {
    this.database = new DatabaseSync(databasePath, {
      enableForeignKeyConstraints: true,
      timeout: 5000,
    });
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS sync_outbox (
        operation_id TEXT PRIMARY KEY,
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
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sync_conflicts (
        operation_id TEXT PRIMARY KEY,
        receipt_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    this.database
      .prepare(
        `
      UPDATE sync_outbox
      SET status = 'retrying', next_attempt_at = ?,
          last_error = 'Application restarted while the operation was in flight.'
      WHERE status = 'sending'
    `,
      )
      .run(new Date().toISOString());
  }

  public queue(operation: SyncOperationEnvelope): OutboxItem {
    assertOperation(operation);
    const item: OutboxItem = {
      operation,
      status: 'pending',
      attemptCount: 0,
      nextAttemptAt: operation.createdAt,
    };
    this.saveSync(item);
    return item;
  }

  public async listReady(now: string, limit: number): Promise<OutboxItem[]> {
    return this.listReadySync(now, limit);
  }

  public async save(item: OutboxItem): Promise<void> {
    this.saveSync(item);
  }

  public listReadySync(now: string, limit = 25): OutboxItem[] {
    const rows = this.database
      .prepare(
        `
        SELECT operation_json, status, attempt_count, next_attempt_at, last_error, receipt_json
        FROM sync_outbox
        WHERE status IN ('pending', 'retrying') AND next_attempt_at <= ?
        ORDER BY next_attempt_at ASC
        LIMIT ?
      `,
      )
      .all(now, Math.max(1, Math.min(limit, 100))) as unknown as OutboxRow[];
    return rows.map(toOutboxItem);
  }

  public saveSync(item: OutboxItem): void {
    assertOperation(item.operation);
    this.database
      .prepare(
        `
      INSERT INTO sync_outbox (
        operation_id, status, attempt_count, next_attempt_at, last_error, receipt_json, operation_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(operation_id) DO UPDATE SET
        status = excluded.status,
        attempt_count = excluded.attempt_count,
        next_attempt_at = excluded.next_attempt_at,
        last_error = excluded.last_error,
        receipt_json = excluded.receipt_json,
        operation_json = excluded.operation_json
    `,
      )
      .run(
        item.operation.operationId,
        item.status,
        item.attemptCount,
        item.nextAttemptAt,
        item.lastError ?? null,
        item.receipt ? JSON.stringify(item.receipt) : null,
        JSON.stringify(item.operation),
      );

    if (item.status === 'conflict' && item.receipt) {
      this.database
        .prepare(
          `
        INSERT INTO sync_conflicts (operation_id, receipt_json, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT(operation_id) DO UPDATE SET
          receipt_json = excluded.receipt_json,
          created_at = excluded.created_at
      `,
        )
        .run(item.operation.operationId, JSON.stringify(item.receipt), new Date().toISOString());
    }
  }

  public getCursor(): number | undefined {
    const row = this.database.prepare("SELECT value FROM sync_state WHERE key = 'cursor'").get() as
      | { value: string }
      | undefined;
    if (!row) return undefined;
    const value = Number(row.value);
    return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  }

  public setCursor(cursor: number): void {
    if (!Number.isSafeInteger(cursor) || cursor < 0)
      throw new RangeError('Sync cursor is invalid.');
    this.database
      .prepare(
        `
      INSERT INTO sync_state (key, value) VALUES ('cursor', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
      )
      .run(String(cursor));
  }

  public recordDelta(page: DeltaPage): void {
    this.setCursor(page.nextCursor);
  }

  public summary(): { pending: number; conflicts: number; failed: number; cursor?: number } {
    const count = (status: string) => {
      const row = this.database
        .prepare('SELECT COUNT(*) AS count FROM sync_outbox WHERE status = ?')
        .get(status) as { count: number };
      return Number(row.count);
    };
    return {
      pending: count('pending') + count('retrying') + count('sending'),
      conflicts: count('conflict'),
      failed: count('failed'),
      cursor: this.getCursor(),
    };
  }

  public close(): void {
    this.database.close();
  }
}

function toOutboxItem(row: OutboxRow): OutboxItem {
  return {
    operation: JSON.parse(row.operation_json) as SyncOperationEnvelope,
    status: row.status,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at,
    lastError: row.last_error ?? undefined,
    receipt: row.receipt_json ? (JSON.parse(row.receipt_json) as SyncOperationReceipt) : undefined,
  };
}

function assertOperation(operation: SyncOperationEnvelope): void {
  if (!operation.operationId || operation.operationId.length > 80) {
    throw new TypeError('Sync operation id is invalid.');
  }
  if (!operation.kind || operation.kind.length > 80) {
    throw new TypeError('Sync operation kind is invalid.');
  }
  if (!operation.createdAt || Number.isNaN(Date.parse(operation.createdAt))) {
    throw new TypeError('Sync operation timestamp is invalid.');
  }
}
