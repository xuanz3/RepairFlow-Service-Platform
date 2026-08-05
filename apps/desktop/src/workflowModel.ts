import type {
  CreateRepairCaseRequest,
  DiagnosisRecord,
  EvidenceMetadata,
  QualityOutcome,
  RepairActionItem,
  RepairCaseDetail,
  RepairCaseStatus,
} from '@repairflow/contracts';
import { canTransitionRepairCase } from '@repairflow/contracts';

export const previewCases: RepairCaseDetail[] = [
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
    intakeCondition:
      'Display glass has no visible cracks. Light frame scuffing at upper-right corner.',
    device: {
      id: '018f0a9b-4b55-7d62-9d10-11c359f9f302',
      manufacturer: 'Northstar',
      model: 'Slate Pro',
      category: 'Tablet',
      serialNumberMasked: '************0002',
      intakeCondition:
        'Display glass has no visible cracks. Light frame scuffing at upper-right corner.',
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

const previewActorId = '018f0a9b-4b55-7d62-9d10-11c359f9f101';

export function createRepairCase(
  input: CreateRepairCaseRequest,
  now = new Date(),
): RepairCaseDetail {
  const id = crypto.randomUUID();
  const serial = input.serialNumber.trim();
  const reference = `RF-${formatReferenceDate(now)}-${id.replaceAll('-', '').slice(0, 6).toUpperCase()}`;

  return {
    id,
    reference,
    customerDisplayName: input.customerDisplayName.trim(),
    reportedFault: input.reportedFault.trim(),
    intakeCondition: input.intakeCondition.trim(),
    device: {
      id: crypto.randomUUID(),
      manufacturer: input.manufacturer.trim(),
      model: input.model.trim(),
      category: input.category.trim(),
      serialNumberMasked: maskSerialNumber(serial),
      intakeCondition: input.intakeCondition.trim(),
    },
    status: 'checked-in',
    priority: input.priority,
    updatedAt: now.toISOString(),
    version: 1,
    repairActions: [],
    evidence: [],
    qualityReviews: [],
  };
}

export function recordDiagnosis(
  repairCase: RepairCaseDetail,
  input: Pick<DiagnosisRecord, 'summary' | 'recommendation' | 'diagnosticCode'>,
  now = new Date(),
): RepairCaseDetail {
  ensureOpen(repairCase);
  const diagnosis: DiagnosisRecord = {
    id: crypto.randomUUID(),
    summary: input.summary.trim(),
    recommendation: input.recommendation.trim(),
    diagnosticCode: input.diagnosticCode?.trim() || undefined,
    createdAt: now.toISOString(),
    actorId: previewActorId,
  };

  return touch(
    repairCase,
    {
      diagnosis,
      status: repairCase.status === 'checked-in' ? 'diagnosing' : repairCase.status,
    },
    now,
  );
}

export function addRepairAction(
  repairCase: RepairCaseDetail,
  input: Pick<RepairActionItem, 'title' | 'detail' | 'partNumber'>,
  now = new Date(),
): RepairCaseDetail {
  ensureOpen(repairCase);
  const action: RepairActionItem = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    detail: input.detail.trim(),
    partNumber: input.partNumber?.trim() || undefined,
    status: 'planned',
    createdAt: now.toISOString(),
    actorId: previewActorId,
  };

  return touch(
    repairCase,
    {
      repairActions: [...repairCase.repairActions, action],
      status: ['checked-in', 'diagnosing', 'awaiting-approval'].includes(repairCase.status)
        ? 'in-repair'
        : repairCase.status,
    },
    now,
  );
}

export function completeRepairAction(
  repairCase: RepairCaseDetail,
  actionId: string,
  now = new Date(),
): RepairCaseDetail {
  const repairActions = repairCase.repairActions.map((item) =>
    item.id === actionId
      ? { ...item, status: 'completed' as const, completedAt: now.toISOString() }
      : item,
  );

  if (!repairActions.some((item) => item.id === actionId)) {
    throw new Error('Repair action was not found.');
  }

  return touch(repairCase, { repairActions }, now);
}

export function addEvidence(
  repairCase: RepairCaseDetail,
  evidence: EvidenceMetadata,
  now = new Date(),
): RepairCaseDetail {
  ensureOpen(repairCase);
  return touch(repairCase, { evidence: [evidence, ...repairCase.evidence] }, now);
}

export function transitionRepairCase(
  repairCase: RepairCaseDetail,
  status: RepairCaseStatus,
  now = new Date(),
): RepairCaseDetail {
  if (!canTransitionRepairCase(repairCase.status, status)) {
    throw new Error(`Transition from ${repairCase.status} to ${status} is not allowed.`);
  }

  if (
    status === 'quality-check' &&
    (repairCase.repairActions.length === 0 ||
      repairCase.repairActions.some((item) => item.status !== 'completed'))
  ) {
    throw new Error('Complete every repair action before quality review.');
  }

  return touch(repairCase, { status }, now);
}

export function submitQualityReview(
  repairCase: RepairCaseDetail,
  outcome: QualityOutcome,
  notes: string,
  evidenceComplete: boolean,
  now = new Date(),
): RepairCaseDetail {
  if (repairCase.status !== 'quality-check') {
    throw new Error('Quality review requires the quality-check workflow state.');
  }

  if (outcome === 'passed' && !evidenceComplete) {
    throw new Error('A passing quality review requires complete evidence.');
  }

  return touch(
    repairCase,
    {
      status: outcome === 'passed' ? 'ready-for-delivery' : 'in-repair',
      qualityReviews: [
        {
          id: crypto.randomUUID(),
          outcome,
          notes: notes.trim(),
          evidenceComplete,
          createdAt: now.toISOString(),
          actorId: previewActorId,
        },
        ...repairCase.qualityReviews,
      ],
    },
    now,
  );
}

export function countOpenCases(cases: ReadonlyArray<{ status: RepairCaseStatus }>): number {
  return cases.filter((item) => !['delivered', 'cancelled'].includes(item.status)).length;
}

function touch(
  repairCase: RepairCaseDetail,
  changes: Partial<RepairCaseDetail>,
  now: Date,
): RepairCaseDetail {
  return {
    ...repairCase,
    ...changes,
    updatedAt: now.toISOString(),
    version: repairCase.version + 1,
  };
}

function ensureOpen(repairCase: RepairCaseDetail): void {
  if (['delivered', 'cancelled'].includes(repairCase.status)) {
    throw new Error('The repair case is closed.');
  }
}

function maskSerialNumber(serial: string): string {
  if (serial.length <= 4) return '*'.repeat(serial.length);
  return `${'*'.repeat(serial.length - 4)}${serial.slice(-4)}`;
}

function formatReferenceDate(now: Date): string {
  const year = now.getUTCFullYear().toString().slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}
