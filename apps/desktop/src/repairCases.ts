import type { RepairCaseSummary } from '@repairflow/contracts';

export const repairCases: RepairCaseSummary[] = [
  {
    id: '0198-0001',
    reference: 'RF-2608-0001',
    customerDisplayName: 'Sample Customer',
    device: {
      id: 'device-0001',
      manufacturer: 'Orion Devices',
      model: 'Notebook 14',
      category: 'Laptop',
      serialNumberMasked: '********0001',
    },
    status: 'diagnosing',
    priority: 'priority',
    updatedAt: '2026-08-05T06:40:00Z',
    version: 3,
  },
  {
    id: '0198-0002',
    reference: 'RF-2608-0002',
    customerDisplayName: 'Example Studio',
    device: {
      id: 'device-0002',
      manufacturer: 'Northstar',
      model: 'Slate Pro',
      category: 'Tablet',
      serialNumberMasked: '********0002',
    },
    status: 'quality-check',
    priority: 'standard',
    updatedAt: '2026-08-05T07:10:00Z',
    version: 8,
  },
  {
    id: '0198-0003',
    reference: 'RF-2608-0003',
    customerDisplayName: 'Generated Customer',
    device: {
      id: 'device-0003',
      manufacturer: 'Aster',
      model: 'Console S',
      category: 'Game console',
      serialNumberMasked: '********0003',
    },
    status: 'ready-for-delivery',
    priority: 'urgent',
    updatedAt: '2026-08-05T07:18:00Z',
    version: 11,
  },
];

export function countOpenCases(cases: RepairCaseSummary[]): number {
  return cases.filter((item) => !['delivered', 'cancelled'].includes(item.status)).length;
}
