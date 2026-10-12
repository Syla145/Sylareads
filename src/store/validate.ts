import type { DayActivity } from '../domain/gamification';
import type { MistakeEntry, MistakeLog } from '../domain/mistakes';
import type { LessonRecord, PracticeConfigStored } from '../domain/progress';
import type { ItemProgress } from '../domain/srs';
import type { TempoProgress } from '../domain/tempo';

/**
 * Defensive readers for the records inside a stored or imported progress
 * document. A broken entry (null, wrong type, edited by hand) is repaired or
 * dropped, so it can never crash a page or travel to other devices.
 */

type Json = Record<string, unknown>;
export const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null);
/** Plain own keys only (no "__proto__" tricks). */
const entries = (v: unknown): [string, unknown][] => (isObj(v) ? Object.entries(v).filter(([k]) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype') : []);

/** Builds a record from the valid entries; `read` returns undefined to drop one. */
export function recordOf<T>(raw: unknown, read: (v: unknown) => T | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of entries(raw)) {
    const r = read(v);
    if (r !== undefined) out[k] = r;
  }
  return out;
}

export function lessonOf(v: unknown): LessonRecord | undefined {
  if (!isObj(v) || typeof v.completedAt !== 'number' || !Number.isFinite(v.completedAt)) return undefined;
  return {
    completedAt: v.completedAt,
    times: Math.max(1, num(v.times, 1)),
    bestCorrect: Math.max(0, num(v.bestCorrect)),
    bestTotal: Math.max(0, num(v.bestTotal)),
    ...(v.placed === true ? { placed: true } : {}),
  };
}

export function itemOf(v: unknown): ItemProgress | undefined {
  if (!isObj(v)) return undefined;
  return {
    box: Math.min(7, Math.max(0, Math.round(num(v.box)))),
    due: strOrNull(v.due),
    last: numOrNull(v.last),
    intro: numOrNull(v.intro),
    seen: num(v.seen),
    ok: num(v.ok),
    retry: num(v.retry),
    wrong: num(v.wrong),
    lapses: num(v.lapses),
    streak: num(v.streak),
    promotedDay: strOrNull(v.promotedDay),
    days: num(v.days),
    lastOkDay: strOrNull(v.lastOkDay),
    recent: typeof v.recent === 'string' ? v.recent.slice(-5) : '',
  };
}

export function practiceConfigOf(v: unknown): PracticeConfigStored | undefined {
  if (!isObj(v)) return undefined;
  return {
    categories: Array.isArray(v.categories) ? v.categories.filter((c): c is string => typeof c === 'string').slice(0, 20) : [],
    weakOnly: v.weakOnly === true,
    scope: v.scope === 'all' ? 'all' : 'learned',
    prioritizeWeak: v.prioritizeWeak !== false,
    count: Math.min(50, Math.max(5, Math.round(num(v.count, 20)))),
  };
}

export const numberOf =(v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

export function dayActivityOf(v: unknown): DayActivity | undefined {
  if (!isObj(v)) return undefined;
  return { lessons: num(v.lessons), answers: num(v.answers), xp: num(v.xp) };
}

function mistakeOf(v: unknown): MistakeEntry | undefined {
  if (!isObj(v)) return undefined;
  return { n: num(v.n), ok: num(v.ok), last: num(v.last) };
}

export function mistakesOf(v: unknown): MistakeLog | undefined {
  const out = recordOf(v, (day) => (isObj(day) ? recordOf(day, mistakeOf) : undefined));
  return Object.keys(out).length ? out : undefined;
}

export function tempoOf(t: Json): TempoProgress {
  return {
    items: recordOf(t.items, (v) => (isObj(v) ? { ms: num(v.ms), n: num(v.n), t: num(v.t) } : undefined)),
    days: recordOf(t.days, (d) => (isObj(d) ? recordOf(d, (x) => (isObj(x) ? { ms: num(x.ms), n: num(x.n) } : undefined)) : undefined)),
    best: recordOf(t.best, (v) => (isObj(v) ? { score: num(v.score), at: num(v.at) } : undefined)),
  };
}
