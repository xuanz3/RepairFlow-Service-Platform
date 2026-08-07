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

function createId(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return randomUuid;
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random()
    .toString(16)
    .slice(2)}`;
}
const actorId = '018f0a9b-4b55-7d62-9d10-11c359f9f101';

export const mobilePreviewCases: RepairCaseDetail[] = [
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

export function createMobileRepairCase(
  input: CreateRepairCaseRequest,
  now = new Date(),
): RepairCaseDetail {
  const id = createId();
  const serial = input.serialNumber.trim();
  return {
    id,
    reference: `RF-${formatReferenceDate(now)}-${id.replaceAll('-', '').slice(0, 6).toUpperCase()}`,
    customerDisplayName: input.customerDisplayName.trim(),
    reportedFault: input.reportedFault.trim(),
    intakeCondition: input.intakeCondition.trim(),
    device: {
      id: createId(),
      manufacturer: input.manufacturer.trim(),
      model: input.model.trim(),
      category: input.category.trim(),
      serialNumberMasked: maskSerial(serial),
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

export function recordMobileDiagnosis(
  repairCase: RepairCaseDetail,
  input: Pick<DiagnosisRecord, 'summary' | 'recommendation' | 'diagnosticCode'>,
  now = new Date(),
): RepairCaseDetail {
  const diagnosis: DiagnosisRecord = {
    id: createId(),
    summary: input.summary.trim(),
    recommendation: input.recommendation.trim(),
    diagnosticCode: input.diagnosticCode?.trim() || undefined,
    createdAt: now.toISOString(),
    actorId,
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

export function addMobileRepairAction(
  repairCase: RepairCaseDetail,
  input: Pick<RepairActionItem, 'title' | 'detail' | 'partNumber'>,
  now = new Date(),
): RepairCaseDetail {
  const action: RepairActionItem = {
    id: createId(),
    title: input.title.trim(),
    detail: input.detail.trim(),
    partNumber: input.partNumber?.trim() || undefined,
    status: 'planned',
    createdAt: now.toISOString(),
    actorId,
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

export function completeMobileRepairAction(
  repairCase: RepairCaseDetail,
  actionId: string,
  now = new Date(),
): RepairCaseDetail {
  const repairActions = repairCase.repairActions.map((item) =>
    item.id === actionId
      ? { ...item, status: 'completed' as const, completedAt: now.toISOString() }
      : item,
  );
  return touch(repairCase, { repairActions }, now);
}

export function attachMobileEvidence(
  repairCase: RepairCaseDetail,
  evidence: EvidenceMetadata,
  now = new Date(),
): RepairCaseDetail {
  return touch(repairCase, { evidence: [evidence, ...repairCase.evidence] }, now);
}

export function transitionMobileRepairCase(
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

export function submitMobileQualityReview(
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
          id: createId(),
          outcome,
          notes: notes.trim(),
          evidenceComplete,
          createdAt: now.toISOString(),
          actorId,
        },
        ...repairCase.qualityReviews,
      ],
    },
    now,
  );
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

function maskSerial(serial: string): string {
  if (serial.length <= 4) return '*'.repeat(serial.length);
  return `${'*'.repeat(serial.length - 4)}${serial.slice(-4)}`;
}

function formatReferenceDate(now: Date): string {
  return `${now.getUTCFullYear().toString().slice(-2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}
