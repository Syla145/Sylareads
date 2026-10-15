/**
 * XP and the answer count across devices. Two devices that learn between two
 * syncs (say, offline on the train) both add XP; taking the larger number when
 * merging would lose one device's share. So each device keeps its own counter
 * (`dev`), and the shared past before this existed sits in `base`:
 *
 *   total = base + sum of all device counters
 *
 * Merging takes per field the larger base and, per device, the larger counter
 * (a device's counter only ever grows on that device). The device id lives
 * only in this browser (not in the progress document).
 */

export interface Counts {
  xp: number;
  answers: number;
}

export interface Tally {
  base: Counts;
  dev: Record<string, Counts>;
}

let device = 'local';
/** Set once at start (store); tests use the default. */
export const setTallyDevice = (id: string) => {
  device = id;
};

/**
 * The tally of a profile. Older documents without one start with their totals
 * as base; a document an older app version kept counting in (totals larger
 * than the tally) moves the difference into the base, so nothing is lost.
 */
export function tallyOf(t: Tally | undefined, xp: number, answers: number): Tally {
  if (!t) return { base: { xp, answers }, dev: {} };
  const sum = totals(t);
  if (xp <= sum.xp && answers <= sum.answers) return t;
  return { ...t, base: { xp: t.base.xp + Math.max(0, xp - sum.xp), answers: t.base.answers + Math.max(0, answers - sum.answers) } };
}

export function totals(t: Tally): Counts {
  let xp = t.base.xp;
  let answers = t.base.answers;
  for (const c of Object.values(t.dev)) {
    xp += c.xp;
    answers += c.answers;
  }
  return { xp, answers };
}

/** Adds to this device's counter. */
export function bump(t: Tally, xp: number, answers: number): Tally {
  const own = t.dev[device] ?? { xp: 0, answers: 0 };
  return { ...t, dev: { ...t.dev, [device]: { xp: own.xp + xp, answers: own.answers + answers } } };
}

export function mergeTally(a: Tally, b: Tally): Tally {
  const dev: Record<string, Counts> = { ...a.dev };
  for (const [id, c] of Object.entries(b.dev)) {
    const o = dev[id];
    dev[id] = o ? { xp: Math.max(o.xp, c.xp), answers: Math.max(o.answers, c.answers) } : c;
  }
  return { base: { xp: Math.max(a.base.xp, b.base.xp), answers: Math.max(a.base.answers, b.base.answers) }, dev };
}

/** Reads a stored tally defensively; anything odd: none (the totals become the base again). */
export function tallyFrom(raw: unknown): Tally | undefined {
  const counts = (v: unknown): Counts | null => {
    if (!v || typeof v !== 'object') return null;
    const r = v as Record<string, unknown>;
    const ok = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
    return ok(r.xp) && ok(r.answers) ? { xp: r.xp as number, answers: r.answers as number } : null;
  };
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const base = counts(r.base);
  if (!base || !r.dev || typeof r.dev !== 'object') return undefined;
  const dev: Record<string, Counts> = {};
  for (const [id, v] of Object.entries(r.dev as Record<string, unknown>).slice(0, 50)) {
    const c = counts(v);
    if (c && id.length <= 40 && id !== '__proto__') dev[id] = c;
  }
  return { base, dev };
}
