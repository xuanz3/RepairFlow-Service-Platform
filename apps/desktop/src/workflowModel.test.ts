import { describe, expect, it } from 'vitest';
import {
  addEvidence,
  addRepairAction,
  completeRepairAction,
  createRepairCase,
  recordDiagnosis,
  submitQualityReview,
  transitionRepairCase,
} from './workflowModel';

describe('desktop workflow model', () => {
  it('runs intake through diagnosis, repair and quality', () => {
    const intake = createRepairCase(
      {
        customerDisplayName: 'Generated Customer',
        manufacturer: 'Orion',
        model: 'Notebook 14',
        category: 'Laptop',
        serialNumber: 'SERIAL-0001',
        reportedFault: 'Device does not charge under load.',
        intakeCondition: 'No visible impact damage.',
        priority: 'priority',
      },
      new Date('2026-08-05T10:00:00Z'),
    );

    const diagnosed = recordDiagnosis(
      intake,
      {
        summary: 'Charging fault reproduced.',
        recommendation: 'Replace the daughterboard.',
        diagnosticCode: 'PWR-INT',
      },
      new Date('2026-08-05T10:10:00Z'),
    );

    const planned = addRepairAction(
      diagnosed,
      {
        title: 'Replace daughterboard',
        detail: 'Disconnect battery and replace board.',
        partNumber: 'OR-DB-01',
      },
      new Date('2026-08-05T10:20:00Z'),
    );

    const completed = completeRepairAction(
      planned,
      planned.repairActions[0]!.id,
      new Date('2026-08-05T10:30:00Z'),
    );

    const withEvidence = addEvidence(
      completed,
      {
        id: 'evidence-1',
        fileName: 'repair.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 1200,
        kind: 'repair',
        createdAt: '2026-08-05T10:35:00Z',
      },
      new Date('2026-08-05T10:35:00Z'),
    );

    const inQuality = transitionRepairCase(
      withEvidence,
      'quality-check',
      new Date('2026-08-05T10:40:00Z'),
    );

    const ready = submitQualityReview(
      inQuality,
      'passed',
      'Functional checks passed.',
      true,
      new Date('2026-08-05T10:50:00Z'),
    );

    expect(ready.status).toBe('ready-for-delivery');
    expect(ready.version).toBe(7);
    expect(ready.diagnosis?.diagnosticCode).toBe('PWR-INT');
    expect(ready.repairActions[0]?.status).toBe('completed');
    expect(ready.evidence).toHaveLength(1);
    expect(ready.qualityReviews).toHaveLength(1);
  });

  it('blocks quality handoff while actions remain incomplete', () => {
    const intake = createRepairCase({
      customerDisplayName: 'Generated Customer',
      manufacturer: 'Northstar',
      model: 'Slate',
      category: 'Tablet',
      serialNumber: 'SERIAL-0002',
      reportedFault: 'Touch input is intermittent.',
      intakeCondition: 'No visible glass damage.',
      priority: 'standard',
    });

    const planned = addRepairAction(intake, {
      title: 'Replace digitiser',
      detail: 'Replace display digitiser assembly.',
    });

    expect(() => transitionRepairCase(planned, 'quality-check')).toThrow(
      'Complete every repair action',
    );
  });
});
