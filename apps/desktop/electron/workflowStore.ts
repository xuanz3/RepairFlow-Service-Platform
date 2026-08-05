import { DatabaseSync } from 'node:sqlite';
import type { RepairCaseDetail, RepairCaseSummary } from '@repairflow/contracts';

const validStatuses = new Set([
  'checked-in',
  'diagnosing',
  'awaiting-approval',
  'in-repair',
  'quality-check',
  'ready-for-delivery',
  'delivered',
  'cancelled',
]);
const validPriorities = new Set(['standard', 'priority', 'urgent']);

interface WorkflowRow {
  payload_json: string;
}

const previewCases: RepairCaseDetail[] = [
  {
    id: '018f0a9b-4b55-7d62-9d10-11c359f9f201',
    reference: 'RF-2608-0001',
    customerDisplayName: 'Sample Customer',
    reportedFault: 'Notebook does not charge consistently after the adapter is reconnected.',
    intakeCondition: 'Minor wear on the lower case. Charging port is visually intact.',
    device: {
      id: '018f0a9b-4b55-7d62-9d10-11c359f9f301',
      manufacturer: 'Orion Devices',
      model: 'Notebook 14',
      category: 'Laptop',
      serialNumberMasked: '************0001',
      intakeCondition: 'Minor wear on the lower case. Charging port is visually intact.',
    },
    status: 'quality-check',
    priority: 'priority',
    updatedAt: '2026-08-05T09:00:00.000Z',
    version: 6,
    diagnosis: {
      id: '018f0a9b-4b55-7d62-9d10-11c359f9f401',
      summary: 'Intermittent power delivery was reproduced under connector movement.',
      recommendation: 'Replace the USB-C daughterboard and run a 30-minute load test.',
      diagnosticCode: 'PWR-USB-C-INT',
      createdAt: '2026-08-05T06:00:00.000Z',
      actorId: '018f0a9b-4b55-7d62-9d10-11c359f9f101',
    },
    repairActions: [
      {
        id: '018f0a9b-4b55-7d62-9d10-11c359f9f501',
        title: 'Replace USB-C daughterboard',
        detail: 'Disconnect battery, replace board and inspect connector seating.',
        partNumber: 'OR-USB14-DB01',
        status: 'completed',
        createdAt: '2026-08-05T07:00:00.000Z',
        completedAt: '2026-08-05T08:00:00.000Z',
        actorId: '018f0a9b-4b55-7d62-9d10-11c359f9f101',
      },
    ],
    evidence: [
      {
        id: '018f0a9b-4b55-7d62-9d10-11c359f9f601',
        fileName: 'charging-port-before.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 248100,
        kind: 'diagnosis',
        note: 'Connector condition before replacement.',
        createdAt: '2026-08-05T08:10:00.000Z',
      },
    ],
    qualityReviews: [],
  },
  {
    id: '018f0a9b-4b55-7d62-9d10-11c359f9f202',
    reference: 'RF-2608-0002',
    customerDisplayName: 'Example Studio',
    reportedFault: 'Tablet display intermittently loses touch input near the lower edge.',
    intakeCondition: 'Display glass has no visible cracks. Light frame scuffing at upper-right corner.',
    device: {
      id: '018f0a9b-4b55-7d62-9d10-11c359f9f302',
      manufacturer: 'Northstar',
      model: 'Slate Pro',
      category: 'Tablet',
      serialNumberMasked: '************0002',
      intakeCondition: 'Display glass has no visible cracks. Light frame scuffing at upper-right corner.',
    },
    status: 'checked-in',
    priority: 'standard',
    updatedAt: '2026-08-05T08:00:00.000Z',
    version: 1,
    repairActions: [],
    evidence: [],
    qualityReviews: [],
  },
];

export class LocalWorkflowStore {
  private readonly database: DatabaseSync;

  public constructor(databasePath: string) {
    this.database = new DatabaseSync(databasePath, {
      enableForeignKeyConstraints: true,
      timeout: 5000,
    });
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS workflow_cases (
        id TEXT PRIMARY KEY,
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
    this.seed();
  }

  public list(): RepairCaseSummary[] {
    const rows = this.database
      .prepare('SELECT payload_json FROM workflow_cases ORDER BY updated_at DESC')
      .all() as unknown as WorkflowRow[];

    return rows.map((row) => this.toSummary(JSON.parse(row.payload_json) as RepairCaseDetail));
  }

  public get(id: string): RepairCaseDetail | undefined {
    const row = this.database
      .prepare('SELECT payload_json FROM workflow_cases WHERE id = ?')
      .get(id) as WorkflowRow | undefined;

    return row ? (JSON.parse(row.payload_json) as RepairCaseDetail) : undefined;
  }

  public save(repairCase: RepairCaseDetail): RepairCaseDetail {
    assertRepairCaseDetail(repairCase);
    const statement = this.database.prepare(`
      INSERT INTO workflow_cases (
        id, reference, status, priority, updated_at, version, payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        reference = excluded.reference,
        status = excluded.status,
        priority = excluded.priority,
        updated_at = excluded.updated_at,
        version = excluded.version,
        payload_json = excluded.payload_json
    `);

    statement.run(
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

  public reset(): RepairCaseSummary[] {
    this.database.exec('DELETE FROM workflow_cases;');
    this.seed();
    return this.list();
  }

  public close(): void {
    this.database.close();
  }

  private seed(): void {
    const count = this.database
      .prepare('SELECT COUNT(*) AS count FROM workflow_cases')
      .get() as { count: number };

    if (Number(count.count) > 0) return;

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      for (const repairCase of previewCases) this.save(repairCase);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
  }

  private toSummary(item: RepairCaseDetail): RepairCaseSummary {
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
}


function assertRepairCaseDetail(value: unknown): asserts value is RepairCaseDetail {
  if (!value || typeof value !== 'object') {
    throw new TypeError('Repair workflow payload must be an object.');
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length > 80) {
    throw new TypeError('Repair workflow payload has an invalid id.');
  }
  if (typeof candidate.reference !== 'string' || candidate.reference.length > 32) {
    throw new TypeError('Repair workflow payload has an invalid reference.');
  }
  if (typeof candidate.status !== 'string' || !validStatuses.has(candidate.status)) {
    throw new TypeError('Repair workflow payload has an invalid status.');
  }
  if (typeof candidate.priority !== 'string' || !validPriorities.has(candidate.priority)) {
    throw new TypeError('Repair workflow payload has an invalid priority.');
  }
  if (!Number.isInteger(candidate.version) || Number(candidate.version) < 1) {
    throw new TypeError('Repair workflow payload has an invalid version.');
  }
  for (const field of ['repairActions', 'evidence', 'qualityReviews'] as const) {
    if (!Array.isArray(candidate[field])) {
      throw new TypeError(`Repair workflow payload is missing ${field}.`);
    }
  }
}
