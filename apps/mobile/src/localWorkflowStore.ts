import * as SQLite from 'expo-sqlite';
import type { RepairCaseDetail, RepairCaseSummary } from '@repairflow/contracts';
import { mobilePreviewCases } from './workflowModel';

interface WorkflowRow {
  payload_json: string;
}

let databasePromise: ReturnType<typeof SQLite.openDatabaseAsync> | undefined;

export async function listLocalRepairCases(): Promise<RepairCaseSummary[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<WorkflowRow>(
    'SELECT payload_json FROM workflow_cases ORDER BY updated_at DESC',
  );
  return rows.map((row) => toSummary(JSON.parse(row.payload_json) as RepairCaseDetail));
}

export async function getLocalRepairCase(id: string): Promise<RepairCaseDetail | undefined> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<WorkflowRow>(
    'SELECT payload_json FROM workflow_cases WHERE id = ?',
    id,
  );
  return row ? (JSON.parse(row.payload_json) as RepairCaseDetail) : undefined;
}

export async function saveLocalRepairCase(repairCase: RepairCaseDetail): Promise<RepairCaseDetail> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO workflow_cases (
      id, reference, status, priority, updated_at, version, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      reference = excluded.reference,
      status = excluded.status,
      priority = excluded.priority,
      updated_at = excluded.updated_at,
      version = excluded.version,
      payload_json = excluded.payload_json`,
    repairCase.id,
    repairCase.reference,
    repairCase.status,
    repairCase.priority,
    repairCase.updatedAt,
    repairCase.version,
    JSON.stringify(repairCase),
  );
  return repairCase;
}

export async function deleteLocalRepairCase(id: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.runAsync('DELETE FROM workflow_cases WHERE id = ?', id);
  return result.changes > 0;
}

export async function resetLocalRepairCases(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM workflow_cases;');
  await seed(database);
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= SQLite.openDatabaseAsync('repairflow-workflows.db');
  const database = await databasePromise;
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS workflow_cases (
      id TEXT PRIMARY KEY NOT NULL,
      reference TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL,
      payload_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS ix_workflow_cases_status_updated
      ON workflow_cases(status, updated_at DESC);
  `);
  await seed(database);
  return database;
}

async function seed(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM workflow_cases',
  );
  if (Number(row?.count ?? 0) > 0) return;

  await database.execAsync('BEGIN IMMEDIATE;');
  try {
    for (const repairCase of mobilePreviewCases) {
      await database.runAsync(
        `INSERT INTO workflow_cases (
          id, reference, status, priority, updated_at, version, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        repairCase.id,
        repairCase.reference,
        repairCase.status,
        repairCase.priority,
        repairCase.updatedAt,
        repairCase.version,
        JSON.stringify(repairCase),
      );
    }
    await database.execAsync('COMMIT;');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
}

function toSummary(item: RepairCaseDetail): RepairCaseSummary {
  return {
    id: item.id,
    reference: item.reference,
    customerDisplayName: item.customerDisplayName,
    device: item.device,
    status: item.status,
    priority: item.priority,
    assignedTechnicianId: item.assignedTechnicianId,
    updatedAt: item.updatedAt,
    version: item.version,
  };
}
