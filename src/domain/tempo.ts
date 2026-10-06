import type { CourseIndex } from './courseIndex';
import { placeLayer } from './courseIndex';
import { dayKey } from './dates';
import type { ItemProgress } from './srs';
import { shuffle, type Rng } from './taskFactory';
import { taskKey } from './tasks';
import type { Item, LetterItem, PlaceItem } from './types';

/**
 * "Lesen auf Zeit": reading under time pressure. Tempo sessions never change
 * the learning boxes (slow reading is not punished while learning); they keep
 * their own reading times per item, per day and the best Blitz scores.
 */

export type TempoMode = 'timer' | 'blitz' | 'flash';
export type TempoContent = 'letters' | 'places' | 'map';

export const TEMPO = {
  /** Time per task (timer mode), seconds. */
  minS: 1,
  maxS: 15,
  defaultS: 5,
  /** Blitz round length. */
  blitzMs: 60_000,
  /** How long the name is visible (flash mode), milliseconds. */
  flashMin: 500,
  flashMax: 2000,
  flashStep: 250,
  flashDefault: 1000,
  /** Tasks per timer / flash session. */
  count: 20,
  /** Tasks prepared for a Blitz round (more than anyone answers in 60 s). */
  blitzTasks: 150,
  /** Learned items needed before a content can be trained. */
  minPool: 4,
} as const;

export const clampSeconds = (s: number) => Math.min(TEMPO.maxS, Math.max(TEMPO.minS, Math.round(s) || TEMPO.defaultS));
export const clampFlash = (ms: number) => {
  const v = Math.round((Number(ms) || TEMPO.flashDefault) / TEMPO.flashStep) * TEMPO.flashStep;
  return Math.min(TEMPO.flashMax, Math.max(TEMPO.flashMin, v));
};

// ---------------------------------------------------------------- tasks

export interface TempoTask {
  key: string;
  itemId: string;
  content: TempoContent;
  /** What is shown (letter or name in the original script). */
  display: string;
  /** Item ids of the four options, in display order (none for map tasks: the answer is a click). */
  options: string[];
}

type Items = Record<string, ItemProgress | undefined>;
const learned = (items: Items, id: string) => (items[id]?.box ?? 0) >= 1;

/** Learned items of a content. Tempo trains reading speed, so only known items take part. */
export function tempoPool(index: CourseIndex, content: TempoContent, items: Items): Item[] {
  if (content === 'letters') return index.byKind.letter.filter((l): l is LetterItem => l.kind === 'letter' && !l.functionChoice && learned(items, l.id));
  if (content === 'map') return [...index.mapShapes.keys()].filter((id) => learned(items, id)).map((id) => index.byId.get(id)!);
  return [...index.byKind.city, ...index.byKind.region].filter((p) => learned(items, p.id));
}

export function tempoContents(index: CourseIndex): TempoContent[] {
  return index.mapShapes.size ? ['letters', 'places', 'map'] : ['letters', 'places'];
}

/** Content of an item when a session is started from a list of ids. */
export function contentOfItem(index: CourseIndex, item: Item, preferMap: boolean): TempoContent {
  if (item.kind === 'letter') return 'letters';
  return preferMap && index.mapShapes.has(item.id) ? 'map' : 'places';
}

/**
 * Picks items for a session: slow items come up more often (weight grows with
 * the square of the reading time), unmeasured ones a little more than average.
 * Longer sessions than the pool cycle through it without direct repeats.
 */
export function pickTempoItems(pool: Item[], stats: TempoProgress | undefined, count: number, rng: Rng): Item[] {
  if (!pool.length) return [];
  const known = pool.map((it) => stats?.items[it.id]?.ms).filter((ms): ms is number => typeof ms === 'number').sort((a, b) => a - b);
  const median = known.length ? known[Math.floor(known.length / 2)] : 2000;
  const weight = (it: Item) => {
    const ms = stats?.items[it.id]?.ms ?? median * 1.25;
    return (ms / 1000) ** 2 + 0.05;
  };
  const out: Item[] = [];
  while (out.length < count) {
    const left = [...pool];
    const round: Item[] = [];
    while (left.length && out.length + round.length < count) {
      const total = left.reduce((s, it) => s + weight(it), 0);
      let r = rng() * total;
      let i = left.findIndex((it) => (r -= weight(it)) < 0);
      if (i < 0) i = left.length - 1;
      round.push(left.splice(i, 1)[0]);
    }
    // no item twice in a row across rounds
    if (out.length && round.length > 1 && round[0] === out[out.length - 1]) [round[0], round[1]] = [round[1], round[0]];
    out.push(...round);
  }
  return out;
}

function letterOptions(index: CourseIndex, letter: LetterItem, poolIds: Set<string>, rng: Rng): string[] {
  const usable = (l: Item | undefined): l is LetterItem => !!l && l.kind === 'letter' && !l.functionChoice && l.id !== letter.id;
  const contrast = shuffle((index.contrastOf.get(letter.id) ?? []).map((id) => index.byId.get(id)).filter(usable), rng);
  const all = index.byKind.letter.filter(usable);
  const known = shuffle(all.filter((l) => poolIds.has(l.id)), rng);
  const readings = new Set([letter.reading]);
  const out: string[] = [];
  for (const l of [...contrast, ...known, ...shuffle(all, rng)]) {
    if (out.length >= 3) break;
    if (out.includes(l.id) || readings.has(l.reading)) continue;
    readings.add(l.reading);
    out.push(l.id);
  }
  return out;
}

function placeOptions(index: CourseIndex, place: PlaceItem, poolIds: Set<string>, rng: Rng): string[] {
  const layer = placeLayer(place);
  const sameLayer = [...index.byKind.city, ...index.byKind.region].filter((p) => p.id !== place.id && placeLayer(p) === layer) as PlaceItem[];
  const looks = shuffle((index.lookalikes.get(place.id) ?? []).slice(0, 6), rng).map((id) => index.byId.get(id) as PlaceItem);
  const names = new Set([place.names.de, place.names.en, place.translit].map((n) => n.toLowerCase()));
  const out: string[] = [];
  for (const p of [...looks, ...shuffle(sameLayer.filter((p) => poolIds.has(p.id)), rng), ...shuffle(sameLayer, rng)]) {
    if (out.length >= 3) break;
    if (out.includes(p.id)) continue;
    const own = [p.names.de, p.names.en].map((n) => n.toLowerCase());
    if (own.some((n) => names.has(n))) continue; // two options must never read the same
    own.forEach((n) => names.add(n));
    out.push(p.id);
  }
  return out;
}

export function tempoTask(index: CourseIndex, item: Item, content: TempoContent, poolIds: Set<string>, rng: Rng): TempoTask {
  const key = taskKey('tempo');
  if (item.kind === 'letter') {
    const options = shuffle([item.id, ...letterOptions(index, item, poolIds, rng)], rng);
    return { key, itemId: item.id, content: 'letters', display: rng() < 0.5 ? item.upper : item.lower, options };
  }
  const place = item as PlaceItem;
  if (content === 'map' && index.mapShapes.has(place.id)) return { key, itemId: place.id, content: 'map', display: place.native, options: [] };
  return { key, itemId: place.id, content: 'places', display: place.native, options: shuffle([place.id, ...placeOptions(index, place, poolIds, rng)], rng) };
}

export function buildTempoTasks(index: CourseIndex, items: Item[], content: TempoContent, poolIds: Set<string>, rng: Rng): TempoTask[] {
  return items.map((it) => tempoTask(index, it, content, poolIds, rng));
}

// ---------------------------------------------------------------- session engine

export interface TempoAnswer {
  itemId: string;
  /** Picked item id; null when the time ran out. */
  pickedId: string | null;
  correct: boolean;
  /** Time from showing the task to the answer (capped at the limit). */
  ms: number;
  timeout: boolean;
}

export interface TempoState {
  mode: TempoMode;
  tasks: TempoTask[];
  index: number;
  phase: 'answer' | 'feedback' | 'done';
  /** Clock value when the current task appeared. */
  shownAt: number;
  /** Time limit per task (timer mode). */
  limitMs: number | null;
  /** End of a Blitz round. */
  endsAt: number | null;
  answers: TempoAnswer[];
}

/** All times are passed in (performance.now() in the app), so the engine stays pure and testable. */
export function startTempo(mode: TempoMode, tasks: TempoTask[], now: number, opts: { limitMs?: number } = {}): TempoState {
  return {
    mode,
    tasks,
    index: 0,
    phase: tasks.length ? 'answer' : 'done',
    shownAt: now,
    limitMs: mode === 'timer' ? (opts.limitMs ?? TEMPO.defaultS * 1000) : null,
    endsAt: mode === 'blitz' ? now + TEMPO.blitzMs : null,
    answers: [],
  };
}

export const currentTempoTask = (s: TempoState): TempoTask | undefined => s.tasks[s.index];

/** Answer the current task; `pickedId === null` means the time ran out. */
export function answerTempo(s: TempoState, pickedId: string | null, now: number): TempoState {
  const task = currentTempoTask(s);
  if (!task || s.phase !== 'answer') return s;
  const timeout = pickedId === null;
  const raw = Math.max(0, Math.round(now - s.shownAt));
  const ms = s.limitMs !== null ? Math.min(raw, s.limitMs) : raw;
  const answer: TempoAnswer = { itemId: task.itemId, pickedId, correct: pickedId === task.itemId, ms: timeout && s.limitMs !== null ? s.limitMs : ms, timeout };
  return { ...s, phase: 'feedback', answers: [...s.answers, answer] };
}

export function nextTempo(s: TempoState, now: number): TempoState {
  if (s.phase === 'done') return s;
  const index = s.index + 1;
  const over = index >= s.tasks.length || (s.endsAt !== null && now >= s.endsAt);
  return { ...s, index, phase: over ? 'done' : 'answer', shownAt: now };
}

/** Ends the session at once (the Blitz clock ran out). An unanswered task does not count. */
export function endTempo(s: TempoState): TempoState {
  return s.phase === 'done' ? s : { ...s, phase: 'done' };
}

export function timeIsUp(s: TempoState, now: number): boolean {
  if (s.phase !== 'answer') return false;
  if (s.limitMs !== null) return now - s.shownAt >= s.limitMs;
  return s.endsAt !== null && now >= s.endsAt;
}

export interface TempoSummary {
  answered: number;
  correct: number;
  timeouts: number;
  /** Mean time of correct answers (null in flash mode or without correct answers). */
  avgMs: number | null;
  fastest: TempoAnswer | null;
  /** Items answered wrong or too slowly, in order, without repeats. */
  mistakes: string[];
}

export function summarizeTempo(s: TempoState): TempoSummary {
  const right = s.answers.filter((a) => a.correct);
  const timed = s.mode !== 'flash' && right.length > 0;
  return {
    answered: s.answers.length,
    correct: right.length,
    timeouts: s.answers.filter((a) => a.timeout).length,
    avgMs: timed ? Math.round(right.reduce((sum, a) => sum + a.ms, 0) / right.length) : null,
    fastest: timed ? right.reduce((best, a) => (a.ms < best.ms ? a : best)) : null,
    mistakes: [...new Set(s.answers.filter((a) => !a.correct).map((a) => a.itemId))],
  };
}

// ---------------------------------------------------------------- stored reading times

export interface TempoItemStat {
  /** Smoothed reading time in ms (recent answers count more). */
  ms: number;
  /** Measurements so far. */
  n: number;
  /** Last measurement (epoch ms). */
  t: number;
}

/** Sum and count of correct timed answers on one day. */
export interface TempoDay {
  ms: number;
  n: number;
}

export interface TempoBest {
  score: number;
  at: number;
}

export interface TempoProgress {
  items: Record<string, TempoItemStat>;
  /** content → day → totals (letters are read faster than places, so they are kept apart). */
  days: Record<string, Record<string, TempoDay>>;
  /** "blitz:<content>" → best score. */
  best: Record<string, TempoBest>;
}

export const emptyTempo = (): TempoProgress => ({ items: {}, days: {}, best: {} });
export const blitzKey = (content: TempoContent) => `blitz:${content}`;

/** Weight of a new measurement in the smoothed reading time. */
const ALPHA = 0.35;
const KEEP_DAYS = 120;

/**
 * Folds a finished session into the stored reading times. Correct answers and
 * timeouts (as the full limit) measure speed; wrong answers measure nothing.
 * Flash sessions only train recognition and are not timed.
 */
export function applyTempoSession(tp: TempoProgress | undefined, s: TempoState, content: TempoContent, now = Date.now()): { tempo: TempoProgress; newBest: boolean; prevBest: number } {
  const tempo: TempoProgress = { items: { ...(tp?.items ?? {}) }, days: { ...(tp?.days ?? {}) }, best: { ...(tp?.best ?? {}) } };
  if (s.mode !== 'flash') {
    const today = dayKey(new Date(now));
    const days = { ...(tempo.days[content] ?? {}) };
    for (const a of s.answers) {
      if (!a.correct && !a.timeout) continue;
      const prev = tempo.items[a.itemId];
      tempo.items[a.itemId] = { ms: prev ? Math.round(prev.ms * (1 - ALPHA) + a.ms * ALPHA) : a.ms, n: (prev?.n ?? 0) + 1, t: now };
      if (a.correct) {
        const d = days[today] ?? { ms: 0, n: 0 };
        days[today] = { ms: d.ms + a.ms, n: d.n + 1 };
      }
    }
    const keys = Object.keys(days).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete days[k];
    if (keys.length) tempo.days[content] = days;
  }
  const prevBest = tempo.best[blitzKey(content)]?.score ?? 0;
  let newBest = false;
  if (s.mode === 'blitz') {
    const score = s.answers.filter((a) => a.correct).length;
    if (score > prevBest) {
      tempo.best[blitzKey(content)] = { score, at: now };
      newBest = true;
    }
  }
  return { tempo, newBest, prevBest };
}

export function mergeTempo(a: TempoProgress | undefined, b: TempoProgress | undefined): TempoProgress | undefined {
  if (!a || !b) return a ?? b;
  const items = { ...a.items };
  for (const [id, v] of Object.entries(b.items)) {
    const x = items[id];
    items[id] = !x || v.t > x.t || (v.t === x.t && v.n > x.n) ? v : x;
  }
  const days: TempoProgress['days'] = { ...a.days };
  for (const [content, byDay] of Object.entries(b.days)) {
    const merged = { ...(days[content] ?? {}) };
    for (const [day, v] of Object.entries(byDay)) if (!merged[day] || v.n > merged[day].n) merged[day] = v;
    days[content] = merged;
  }
  const best = { ...a.best };
  for (const [k, v] of Object.entries(b.best)) if (!best[k] || v.score > best[k].score) best[k] = v;
  return { items, days, best };
}

// ---------------------------------------------------------------- figures for the tempo page

export interface TempoOverview {
  /** Mean of the smoothed reading times of measured items in this content. */
  avgMs: number | null;
  measured: number;
  /** Slowest measured items, slowest first. */
  slowest: { id: string; ms: number }[];
  /** Daily mean of correct answers, oldest first (last 14 days with data). */
  trend: { day: string; ms: number }[];
}

export function tempoOverview(pool: Item[], tp: TempoProgress | undefined, content: TempoContent, slowCount = 5): TempoOverview {
  const measured = pool.map((it) => ({ id: it.id, ms: tp?.items[it.id]?.ms })).filter((x): x is { id: string; ms: number } => typeof x.ms === 'number');
  const byDay = tp?.days[content] ?? {};
  const trend = Object.keys(byDay)
    .sort()
    .slice(-14)
    .filter((d) => byDay[d].n > 0)
    .map((day) => ({ day, ms: Math.round(byDay[day].ms / byDay[day].n) }));
  return {
    avgMs: measured.length ? Math.round(measured.reduce((s, x) => s + x.ms, 0) / measured.length) : null,
    measured: measured.length,
    slowest: [...measured].sort((a, b) => b.ms - a.ms).slice(0, slowCount),
    trend,
  };
}

export const bestBlitz = (tp: TempoProgress | undefined, content: TempoContent) => tp?.best[blitzKey(content)]?.score ?? 0;
