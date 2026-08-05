import { describe, expect, it } from 'vitest';
import { canTransitionRepairCase } from '../src/index';

describe('repair workflow contract', () => {
  it('allows a checked-in case to enter diagnosis', () => {
    expect(canTransitionRepairCase('checked-in', 'diagnosing')).toBe(true);
  });

  it('prevents a delivered case from returning to repair', () => {
    expect(canTransitionRepairCase('delivered', 'in-repair')).toBe(false);
  });
});
