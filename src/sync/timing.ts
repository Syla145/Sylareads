/**
 * When progress goes online. Every upload costs one Firestore read (merge with
 * the online copy) and one write; the free plan allows 50,000 reads and 20,000
 * writes per day for all players together, so single answers are batched.
 */

/** Wait for a short pause before the first upload. */
const DEBOUNCE_MS = 6000;
/** Between uploads caused by single answers. */
export const ANSWER_INTERVAL_MS = 120_000;
/** After a finished lesson, practice or challenge. */
const MILESTONE_DELAY_MS = 1500;

/** When the next upload should run after a change (ms from now). */
export function uploadDelay(now: number, lastSyncAt: number | null, milestone: boolean): number {
  if (milestone) return MILESTONE_DELAY_MS;
  return lastSyncAt === null ? DEBOUNCE_MS : Math.max(DEBOUNCE_MS, lastSyncAt + ANSWER_INTERVAL_MS - now);
}
