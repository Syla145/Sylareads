import { describe, expect, it } from 'vitest';
import { activityOf, HEARTBEAT_MS } from '../domain/presence';
import { ANSWER_INTERVAL_MS, uploadDelay } from './timing';

/** Same rule as syncStore: a change plans an upload unless one is planned; a finished step plans one soon. */
function uploadsDuring(events: { at: number; milestone?: boolean }[]): number[] {
  const uploads: number[] = [];
  let planned: number | null = null;
  for (const e of events) {
    if (planned !== null && planned <= e.at) {
      uploads.push(planned);
      planned = null;
    }
    if (planned !== null && !e.milestone) continue;
    planned = e.at + uploadDelay(e.at, uploads.at(-1) ?? null, !!e.milestone);
  }
  if (planned !== null) uploads.push(planned);
  return uploads;
}

describe('online saving stays within the free quota', () => {
  it('waits briefly at first, then at most every two minutes; a finished step goes up soon', () => {
    expect(uploadDelay(10_000, null, false)).toBe(6000);
    expect(uploadDelay(130_000, 100_000, false)).toBe(ANSWER_INTERVAL_MS - 30_000);
    expect(uploadDelay(130_000, 100_000, true)).toBe(1500);
  });

  it('a 20-minute lesson with an answer every 5 seconds uploads about 11 times instead of 240', () => {
    const answers = Array.from({ length: 240 }, (_, i) => ({ at: i * 5000 }));
    const n = uploadsDuring([...answers, { at: 240 * 5000, milestone: true }]).length;
    expect(n).toBeLessThanOrEqual(12);
    expect(n).toBeGreaterThanOrEqual(10);
  });

  it('the own card reports every 5 minutes and counts as "gerade aktiv" for 10', () => {
    expect(HEARTBEAT_MS).toBe(5 * 60_000);
    const now = Date.parse('2026-10-08T12:00:00Z');
    expect(activityOf(now - 9 * 60_000, now)).toBe('now');
    expect(activityOf(now - 11 * 60_000, now)).toBe('today');
  });
});
