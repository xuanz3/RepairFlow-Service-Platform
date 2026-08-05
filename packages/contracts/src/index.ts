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

export interface DeviceSummary {
  id: string;
  manufacturer: string;
  model: string;
  category: string;
  serialNumberMasked: string;
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
