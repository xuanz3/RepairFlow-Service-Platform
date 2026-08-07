import { describe, expect, it } from 'vitest';
import {
  addMobileRepairAction,
  attachMobileEvidence,
  completeMobileRepairAction,
  createMobileRepairCase,
  recordMobileDiagnosis,
  submitMobileQualityReview,
  transitionMobileRepairCase,
} from './workflowModel';

describe('mobile workflow model', () => {
  it('preserves a complete local repair workflow', () => {
    const intake = createMobileRepairCase({
      customerDisplayName: 'Mobile Test',
      manufacturer: 'Orion',
      model: 'Notebook 14',
      category: 'Laptop',
      serialNumber: 'MOBILE-0001',
      reportedFault: 'Charging is intermittent.',
      intakeCondition: 'No visible impact damage.',
      priority: 'priority',
    });

    const diagnosed = recordMobileDiagnosis(intake, {
      summary: 'Charging fault reproduced.',
      recommendation: 'Replace charging board.',
    });

    const planned = addMobileRepairAction(diagnosed, {
      title: 'Replace charging board',
      detail: 'Disconnect battery and replace board.',
    });

    const completed = completeMobileRepairAction(planned, planned.repairActions[0]!.id);
    const evidenced = attachMobileEvidence(completed, {
      id: 'evidence-1',
      fileName: 'repair.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 1200,
      sha256: 'a'.repeat(64),
      kind: 'repair',
      createdAt: new Date().toISOString(),
    });
    const quality = transitionMobileRepairCase(evidenced, 'quality-check');
    const ready = submitMobileQualityReview(quality, 'passed', 'All checks passed.', true);

    expect(ready.status).toBe('ready-for-delivery');
    expect(ready.version).toBe(7);
    expect(ready.evidence[0]?.sha256).toHaveLength(64);
  });

  it('rejects a passing review without evidence confirmation', () => {
    const repairCase = {
      ...createMobileRepairCase({
        customerDisplayName: 'Mobile Test',
        manufacturer: 'Northstar',
        model: 'Slate',
        category: 'Tablet',
        serialNumber: 'MOBILE-0002',
        reportedFault: 'Touch input fails.',
        intakeCondition: 'No visible glass damage.',
        priority: 'standard',
      }),
      status: 'quality-check' as const,
    };

    expect(() => submitMobileQualityReview(repairCase, 'passed', 'Checks passed.', false)).toThrow(
      'requires complete evidence',
    );
  });
});
