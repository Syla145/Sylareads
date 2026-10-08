import type { CourseIndex } from './courseIndex';
import { accepts } from './evaluate';
import { seededRng, shuffle } from './taskFactory';
import type { Item, PlaceItem } from './types';

/**
 * Daily Challenge and 1v1 duel: 10 place names in the native script, the
 * reading is typed, one try per name. More correct answers win; on a tie the
 * shorter total time wins. The same seed gives everybody the same 10 names.
 */
export const CHALLENGE = {
  count: 10,
  /** Mix by importance: big cities, medium, smaller ones. */
  tiers: [4, 3, 3] as const,
  /** Days of daily results kept in the progress document. */
  keepDays: 30,
  nameMax: 24,
} as const;

/** FNV-1a: a stable number from a seed string. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const dailySeed = (courseId: string, day: string) => `daily:${courseId}:${day}`;

/** A new random duel seed (8 characters, URL-safe). */
export function newDuelSeed(random: () => number = Math.random): string {
  const abc = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => abc[Math.floor(random() * abc.length)]).join('');
}

/** The cities of a course (the challenge pool). */
export const challengePool = (index: CourseIndex): PlaceItem[] => index.byKind.city as PlaceItem[];

/** The 10 names for a seed: 4 important, 3 medium, 3 smaller cities, in shuffled order. */
export function pickChallenge(index: CourseIndex, seed: string): string[] {
  const rng = seededRng(hashSeed(seed));
  const pool = [...challengePool(index)].sort((a, b) => a.id.localeCompare(b.id));
  const chosen: PlaceItem[] = [];
  CHALLENGE.tiers.forEach((n, i) => {
    const tier = (i + 1) as 1 | 2 | 3;
    chosen.push(...shuffle(pool.filter((p) => p.tier === tier), rng).slice(0, n));
  });
  // Too few in a tier: fill up from the rest.
  const rest = shuffle(pool.filter((p) => !chosen.includes(p)), rng);
  while (chosen.length < CHALLENGE.count && rest.length) chosen.push(rest.shift()!);
  return shuffle(chosen, rng)
    .slice(0, CHALLENGE.count)
    .map((p) => p.id);
}

export interface ChallengeAnswer {
  id: string;
  input: string;
  correct: boolean;
  /** Time from showing the name until the answer was sent. */
  ms: number;
}

export interface ChallengeState {
  ids: string[];
  answers: ChallengeAnswer[];
  /** When the current name became visible (null while the result of the last one is shown). */
  shownAt: number | null;
}

export const startChallenge = (ids: string[], now: number): ChallengeState => ({ ids, answers: [], shownAt: now });

export const currentId = (s: ChallengeState): string | undefined => (s.shownAt === null ? undefined : s.ids[s.answers.length]);

export const isFinished = (s: ChallengeState) => s.answers.length >= s.ids.length;

/** Grades the typed reading of the current name; the clock stops until `nextName`. */
export function answerChallenge(s: ChallengeState, index: CourseIndex, input: string, now: number): ChallengeState {
  const id = currentId(s);
  if (!id || s.shownAt === null) return s;
  const item = index.byId.get(id) as Item;
  const answer: ChallengeAnswer = { id, input: input.trim(), correct: accepts(index, item, input), ms: Math.max(0, now - s.shownAt) };
  return { ...s, answers: [...s.answers, answer], shownAt: null };
}

export function nextName(s: ChallengeState, now: number): ChallengeState {
  if (s.shownAt !== null || isFinished(s)) return s;
  return { ...s, shownAt: now };
}

export interface ChallengeScore {
  /** Correct answers. */
  c: number;
  /** Names in the challenge. */
  n: number;
  /** Total answer time. */
  ms: number;
}

export function scoreOf(s: ChallengeState): ChallengeScore {
  return { c: s.answers.filter((a) => a.correct).length, n: s.ids.length, ms: s.answers.reduce((t, a) => t + a.ms, 0) };
}

/** Negative when `a` is better: more correct first, then less time. */
export const compareScores = (a: ChallengeScore, b: ChallengeScore) => b.c - a.c || a.ms - b.ms;

/* ---------- Daily results in the progress document ---------- */

/** One day's daily challenge of a course. `done` is false while it is being played (or was left early). */
export interface DailyResult extends ChallengeScore {
  at: number;
  done: boolean;
}

export type DailyLog = Record<string, DailyResult>;

/** Stores a (partial) result; the attempt keeps its start time. Old days fall out. */
export function recordDaily(log: DailyLog | undefined, day: string, score: ChallengeScore, done: boolean, now: number): DailyLog {
  const prev = log?.[day];
  const next: DailyLog = { ...log, [day]: { ...score, done, at: prev?.at ?? now } };
  const days = Object.keys(next).sort().reverse();
  for (const d of days.slice(CHALLENGE.keepDays)) delete next[d];
  return next;
}

/** Two devices: per day the attempt that started first counts; on equal start the further one. */
export function mergeDaily(a: DailyLog | undefined, b: DailyLog | undefined): DailyLog | undefined {
  if (!a || !b) return a ?? b;
  const out: DailyLog = { ...a };
  for (const [day, r] of Object.entries(b)) {
    const l = out[day];
    if (!l || r.at < l.at || (r.at === l.at && (r.done && !l.done))) out[day] = r;
  }
  return out;
}

export function dailyOf(raw: unknown): DailyLog | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: DailyLog = {};
  for (const [day, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
    out[day] = { c: num(r.c), n: num(r.n) || CHALLENGE.count, ms: num(r.ms), at: num(r.at), done: r.done === true };
  }
  return Object.keys(out).length ? out : undefined;
}

/* ---------- Duel links ---------- */

export interface DuelOffer {
  seed: string;
  /** The challenger's result and name (absent when someone starts a new duel). */
  from?: { name: string; score: ChallengeScore };
}

/** Query string of a duel link: seed, and the sender's name and result. */
export function duelQuery(seed: string, from?: { name: string; score: ChallengeScore }): string {
  const p = new URLSearchParams({ s: seed });
  if (from) {
    p.set('n', from.name.slice(0, CHALLENGE.nameMax));
    p.set('r', String(from.score.c));
    p.set('t', String(Math.round(from.score.ms)));
  }
  return p.toString();
}

/** Reads a duel link defensively (it may have been edited or cut off). */
export function parseDuel(params: URLSearchParams): DuelOffer | null {
  const seed = params.get('s') ?? '';
  if (!/^[a-z0-9]{4,16}$/.test(seed)) return null;
  const name = (params.get('n') ?? '').replace(/[\p{C}]/gu, '').trim().slice(0, CHALLENGE.nameMax);
  const c = Number(params.get('r'));
  const ms = Number(params.get('t'));
  if (!name || !Number.isInteger(c) || c < 0 || c > CHALLENGE.count || !Number.isFinite(ms) || ms <= 0) return { seed };
  return { seed, from: { name, score: { c, n: CHALLENGE.count, ms } } };
}
