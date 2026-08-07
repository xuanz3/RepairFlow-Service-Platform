export const repairCaseStatuses = [
  'checked-in',
  'diagnosing',
  'awaiting-approval',
  'in-repair',
  'quality-check',
  'ready-for-delivery',
  'delivered',
  'cancelled',
] as const;

export type RepairCaseStatus = (typeof repairCaseStatuses)[number];

export const repairPriorities = ['standard', 'priority', 'urgent'] as const;
export type RepairPriority = (typeof repairPriorities)[number];

export const repairRoles = ['admin', 'intake', 'technician', 'quality', 'viewer'] as const;
export type RepairRole = (typeof repairRoles)[number];

export const repairActionStatuses = ['planned', 'in-progress', 'completed', 'blocked'] as const;
export type RepairActionStatus = (typeof repairActionStatuses)[number];

export const qualityOutcomes = ['passed', 'returned-to-repair'] as const;
export type QualityOutcome = (typeof qualityOutcomes)[number];

export const evidenceKinds = ['intake', 'diagnosis', 'repair', 'quality', 'delivery'] as const;
export type EvidenceKind = (typeof evidenceKinds)[number];

export interface DeviceSummary {
  id: string;
  manufacturer: string;
  model: string;
  category: string;
  serialNumberMasked: string;
  intakeCondition?: string;
}

export interface EvidenceMetadata {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256?: string;
  localUri?: string;
  kind: EvidenceKind;
  note?: string;
  createdAt: string;
}

export interface DiagnosisRecord {
  id: string;
  summary: string;
  recommendation: string;
  diagnosticCode?: string;
  createdAt: string;
  actorId: string;
}

export interface RepairActionItem {
  id: string;
  title: string;
  detail: string;
  partNumber?: string;
  status: RepairActionStatus;
  createdAt: string;
  completedAt?: string;
  actorId: string;
}

export interface QualityReview {
  id: string;
  outcome: QualityOutcome;
  notes: string;
  evidenceComplete: boolean;
  createdAt: string;
  actorId: string;
}

export interface RepairCaseSummary {
  id: string;
  reference: string;
  customerDisplayName: string;
  device: DeviceSummary;
  status: RepairCaseStatus;
  priority: RepairPriority;
  assignedTechnicianId?: string;
  updatedAt: string;
  version: number;
}

export interface RepairCaseDetail extends RepairCaseSummary {
  reportedFault: string;
  intakeCondition: string;
  diagnosis?: DiagnosisRecord;
  repairActions: RepairActionItem[];
  evidence: EvidenceMetadata[];
  qualityReviews: QualityReview[];
}

export interface CreateRepairCaseRequest {
  customerDisplayName: string;
  manufacturer: string;
  model: string;
  category: string;
  serialNumber: string;
  reportedFault: string;
  intakeCondition: string;
  priority: RepairPriority;
}

export interface RecordDiagnosisRequest {
  summary: string;
  recommendation: string;
  diagnosticCode?: string;
  expectedVersion: number;
}

export interface CreateRepairActionRequest {
  title: string;
  detail: string;
  partNumber?: string;
  expectedVersion: number;
}

export interface CompleteRepairActionRequest {
  expectedVersion: number;
}

export interface CreateEvidenceRequest {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256?: string;
  kind: EvidenceKind;
  note?: string;
  expectedVersion: number;
}

export interface SubmitQualityReviewRequest {
  outcome: QualityOutcome;
  notes: string;
  evidenceComplete: boolean;
  expectedVersion: number;
}

export interface UpdateRepairStatusRequest {
  status: RepairCaseStatus;
  expectedVersion: number;
  note?: string;
}

export interface HealthResponse {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
}

const transitions: Readonly<Record<RepairCaseStatus, readonly RepairCaseStatus[]>> = {
  'checked-in': ['diagnosing', 'cancelled'],
  diagnosing: ['awaiting-approval', 'in-repair', 'cancelled'],
  'awaiting-approval': ['in-repair', 'cancelled'],
  'in-repair': ['quality-check', 'cancelled'],
  'quality-check': ['in-repair', 'ready-for-delivery'],
  'ready-for-delivery': ['delivered', 'in-repair'],
  delivered: [],
  cancelled: [],
};

export function canTransitionRepairCase(
  current: RepairCaseStatus,
  next: RepairCaseStatus,
): boolean {
  return transitions[current].includes(next);
}
