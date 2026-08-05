export interface QueueItem {
  reference: string;
  manufacturer: string;
  model: string;
  category: string;
  status: string;
}

export const queueItems: QueueItem[] = [
  {
    reference: 'RF-2608-0001',
    manufacturer: 'Orion Devices',
    model: 'Notebook 14',
    category: 'Laptop',
    status: 'diagnosing',
  },
  {
    reference: 'RF-2608-0002',
    manufacturer: 'Northstar',
    model: 'Slate Pro',
    category: 'Tablet',
    status: 'quality check',
  },
];

export function queueSummary(items: QueueItem[]): string {
  return `${items.length} assigned ${items.length === 1 ? 'case' : 'cases'}`;
}
