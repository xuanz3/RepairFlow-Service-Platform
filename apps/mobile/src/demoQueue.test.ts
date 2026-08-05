import { describe, expect, it } from 'vitest';
import { queueItems, queueSummary } from './demoQueue';

describe('mobile queue summary', () => {
  it('uses a plural label for the generated queue', () => {
    expect(queueSummary(queueItems)).toBe('2 assigned cases');
  });
});
