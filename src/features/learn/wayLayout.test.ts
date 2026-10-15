import { describe, expect, it } from 'vitest';
import { WAY_ROW, WAY_ROW_NEXT, wayLayout, wayX } from './wayLayout';

describe('learning path as a road', () => {
  const stops = [
    { done: true, next: false },
    { done: true, next: false },
    { done: false, next: true },
    { done: false, next: false },
  ];

  it('stacks the stops, the recommended one taller', () => {
    const l = wayLayout(stops);
    expect(l.heights).toEqual([WAY_ROW, WAY_ROW, WAY_ROW_NEXT, WAY_ROW]);
    expect(l.tops).toEqual([0, WAY_ROW, 2 * WAY_ROW, 2 * WAY_ROW + WAY_ROW_NEXT]);
    expect(l.total).toBe(3 * WAY_ROW + WAY_ROW_NEXT);
  });

  it('draws the travelled road up to the recommended stop and the rest as ahead', () => {
    const l = wayLayout(stops);
    expect(l.travelled.match(/M/g)).toHaveLength(2);
    expect(l.ahead.match(/M/g)).toHaveLength(1);
    // the travelled road ends in the middle of the recommended stop
    expect(l.travelled).toContain(`${l.xs[2]} ${2 * WAY_ROW + WAY_ROW_NEXT / 2}`);
  });

  it('keeps the circles on the left, clear of the names (from 48 %)', () => {
    for (let i = 0; i < 60; i++) {
      expect(wayX(i)).toBeGreaterThanOrEqual(12);
      expect(wayX(i)).toBeLessThanOrEqual(36);
    }
  });

  it('has no road for a single stop and nothing for none', () => {
    expect(wayLayout([{ done: false, next: true }])).toMatchObject({ travelled: '', ahead: '', total: WAY_ROW_NEXT });
    expect(wayLayout([])).toMatchObject({ travelled: '', ahead: '', total: 0 });
  });
});
