import { describe, expect, it } from 'vitest';
import { createRepairCaseSchema } from '../src/index';

const completeIntake = {
  customerDisplayName: 'Sample Customer',
  manufacturer: 'Orion Devices',
  model: 'Notebook 14',
  category: 'Laptop',
  serialNumber: 'RF-DEMO-0001',
  reportedFault: 'Device does not charge after reconnecting the adapter.',
  intakeCondition: 'Minor case wear with no visible liquid damage at check-in.',
  priority: 'standard',
} as const;

describe('create repair case validation', () => {
  it('accepts a complete generated intake record', () => {
    const result = createRepairCaseSchema.safeParse(completeIntake);
    expect(result.success).toBe(true);
  });

  it('rejects an incomplete fault description', () => {
    const result = createRepairCaseSchema.safeParse({
      ...completeIntake,
      reportedFault: 'No',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an intake without a recorded device condition', () => {
    const result = createRepairCaseSchema.safeParse({
      customerDisplayName: completeIntake.customerDisplayName,
      manufacturer: completeIntake.manufacturer,
      model: completeIntake.model,
      category: completeIntake.category,
      serialNumber: completeIntake.serialNumber,
      reportedFault: completeIntake.reportedFault,
      priority: completeIntake.priority,
    });
    expect(result.success).toBe(false);
  });
});
