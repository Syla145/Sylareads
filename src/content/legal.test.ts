import { describe, expect, it } from 'vitest';
import { FEEDBACK_URL, OPERATOR, REPO_URL } from './legal';

describe('legal pages', () => {
  it('contact data is complete, and the sample address is gone once the placeholder flag is off', () => {
    expect(OPERATOR.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
    expect(OPERATOR.name && OPERATOR.street && OPERATOR.city).toBeTruthy();
    expect(FEEDBACK_URL.startsWith(REPO_URL)).toBe(true);
    if (!OPERATOR.placeholder) {
      expect(OPERATOR.name).not.toBe('Max Mustermann');
      expect(OPERATOR.email).not.toContain('example.com');
    }
  });
});
