import { describe, expect, it } from 'vitest';
import { countOpenCases, repairCases } from './repairCases';

describe('workshop summary', () => {
  it('counts active cases', () => {
    expect(countOpenCases(repairCases)).toBe(3);
  });
});
