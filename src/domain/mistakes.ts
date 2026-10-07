import { addDays } from './dates';

/**
 * Fehler-Review: which items were answered wrong on a day, so they can be
 * practised again at the end of the day ("Heute falsch → Genau diese üben").
 *
 * Kept per course and day for one week. Only real mistakes count: wrong
 * answers in lessons, practice and tempo picks. Placement answers ("I don't
 * know this yet") and tempo timeouts (too slow, not wrong) are not mistakes.
 */

export interface MistakeEntry {
  /** Wrong answers on that day. */
  n: number;
  /** Right answers since the last wrong one (> 0 = fixed again). */
  ok: number;
  /** Time of the last wrong answer (epoch ms), for the order of the list. */
  last: number;
}

/** day (YYYY-MM-DD) → item id → entry */
export type MistakeLog = Record<string, Record<string, MistakeEntry>>;

const KEEP_MISTAKE_DAYS = 7;

/** Records one graded answer. Right answers only count for items already wrong that day. */
export function logAnswer(log: MistakeLog | undefined, itemId: string, wrong: boolean, today: string, now: number): MistakeLog | undefined {
  const day = log?.[today];
  const entry = day?.[itemId];
  if (!wrong && !entry) return log;
  const next: MistakeEntry = wrong ? { n: (entry?.n ?? 0) + 1, ok: 0, last: now } : { ...entry!, ok: entry!.ok + 1 };
  const out: MistakeLog = { ...(log ?? {}), [today]: { ...(day ?? {}), [itemId]: next } };
  const oldest = addDays(today, -(KEEP_MISTAKE_DAYS - 1));
  for (const d of Object.keys(out)) if (d < oldest) delete out[d];
  return out;
}

export interface MistakeItem {
  id: string;
  n: number;
  fixed: boolean;
}

/** Items of one day: still-wrong ones first, then the most recent first. */
export function mistakesOn(log: MistakeLog | undefined, day: string): MistakeItem[] {
  return Object.entries(log?.[day] ?? {})
    .map(([id, e]) => ({ id, n: e.n, fixed: e.ok > 0, last: e.last }))
    .sort((a, b) => Number(a.fixed) - Number(b.fixed) || b.last - a.last)
    .map(({ id, n, fixed }) => ({ id, n, fixed }));
}

/** The list to review: today's mistakes, or yesterday's while today has none yet. */
export function reviewList(log: MistakeLog | undefined, today: string): { when: 'today' | 'yesterday'; items: MistakeItem[] } | null {
  const todays = mistakesOn(log, today);
  if (todays.length) return { when: 'today', items: todays };
  const yesterdays = mistakesOn(log, addDays(today, -1));
  return yesterdays.length ? { when: 'yesterday', items: yesterdays } : null;
}

/** Merge of two devices: per day and item the larger counts, the later time. */
export function mergeMistakes(a: MistakeLog | undefined, b: MistakeLog | undefined): MistakeLog | undefined {
  if (!a || !b) return a ?? b;
  const out: MistakeLog = { ...a };
  for (const [day, items] of Object.entries(b)) {
    const merged = { ...(out[day] ?? {}) };
    for (const [id, e] of Object.entries(items)) {
      const x = merged[id];
      merged[id] = !x ? e : x.last === e.last ? { n: Math.max(x.n, e.n), ok: Math.max(x.ok, e.ok), last: x.last } : x.last > e.last ? { ...x, n: Math.max(x.n, e.n) } : { ...e, n: Math.max(x.n, e.n) };
    }
    out[day] = merged;
  }
  return out;
}
