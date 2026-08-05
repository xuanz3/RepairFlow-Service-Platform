import { describe, expect, it } from 'vitest';
import { createRepairCaseSchema } from '../src/index';

describe('create repair case validation', () => {
  it('accepts a complete generated intake record', () => {
    const result = createRepairCaseSchema.safeParse({
      customerDisplayName: 'Sample Customer',
      manufacturer: 'Orion Devices',
      model: 'Notebook 14',
      category: 'Laptop',
      serialNumber: 'RF-DEMO-0001',
      reportedFault: 'Device does not charge after reconnecting the adapter.',
      priority: 'standard',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an incomplete fault description', () => {
    const result = createRepairCaseSchema.safeParse({
      customerDisplayName: 'Sample Customer',
      manufacturer: 'Orion Devices',
      model: 'Notebook 14',
      category: 'Laptop',
      serialNumber: 'RF-DEMO-0001',
      reportedFault: 'No',
      priority: 'standard',
    });

    expect(result.success).toBe(false);
  });
});
