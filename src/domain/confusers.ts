import type { CourseIndex } from './courseIndex';
import { nativeOf } from './courseIndex';
import type { CourseProgress } from './progress';
import { shuffle, type Rng } from './taskFactory';
import { taskKey, type Task } from './tasks';
import type { ComboItem, Item, LetterItem } from './types';

/**
 * Verwechsler-Runde: characters you actually mixed up (Sylareads counts every
 * answer that was right for a different item) and the fixed look-alike pairs
 * of a course (ব/র, ড/ড় …), asked against each other.
 */
export const CONFUSERS = {
  maxPairs: 6,
  /** A recorded mix-up weighs more than a fixed pair. */
  recordedWeight: 3,
} as const;

export interface ConfuserPair {
  a: string;
  b: string;
  /** How often they were mixed up (both directions). */
  mixed: number;
  /** One of the course's fixed look-alike pairs. */
  fixed: boolean;
}

type Readable = LetterItem | ComboItem;

const readable = (it: Item | undefined): it is Readable => !!it && (it.kind === 'letter' || it.kind === 'combo');
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Pairs to practise, most important first. Only pairs that differ in reading (otherwise there is nothing to tell apart). */
export function confuserPairs(index: CourseIndex, cp: CourseProgress | undefined): ConfuserPair[] {
  const items = cp?.items ?? {};
  const pairs = new Map<string, ConfuserPair>();
  const add = (a: string, b: string, mixed: number, fixed: boolean) => {
    const x = index.byId.get(a);
    const y = index.byId.get(b);
    if (a === b || !readable(x) || !readable(y) || x.reading === y.reading) return;
    const key = pairKey(a, b);
    const p = pairs.get(key) ?? { a: key.split('|')[0], b: key.split('|')[1], mixed: 0, fixed: false };
    pairs.set(key, { ...p, mixed: p.mixed + mixed, fixed: p.fixed || fixed });
  };
  for (const [key, n] of Object.entries(cp?.confusions ?? {})) {
    const [a, b] = key.split('>');
    if (a && b && n > 0) add(a, b, n, false);
  }
  // Fixed look-alikes once both characters were introduced.
  for (const set of index.content.contrastSets) {
    const known = set.itemIds.filter((id) => (items[id]?.box ?? 0) >= 1);
    for (let i = 0; i < known.length; i++) for (let j = i + 1; j < known.length; j++) add(known[i], known[j], 0, true);
  }
  const weight = (p: ConfuserPair) => p.mixed * CONFUSERS.recordedWeight + (p.fixed ? 1 : 0);
  return [...pairs.values()].sort((p, q) => weight(q) - weight(p) || p.a.localeCompare(q.a));
}

/** Character shown → pick its reading out of the pair. */
function readingTask(item: Readable, other: Readable, rng: Rng): Task {
  return {
    key: taskKey('confuser'),
    kind: 'choice',
    itemId: item.id,
    question: 'reading',
    display: nativeOf(item),
    options: shuffle(
      [
        { label: item.reading, correct: true, itemId: item.id },
        { label: other.reading, correct: false, itemId: other.id },
      ],
      rng,
    ),
  };
}

/** Reading shown → pick the character out of the pair. */
function glyphTask(item: Readable, other: Readable, rng: Rng): Task {
  return {
    key: taskKey('confuser'),
    kind: 'choice',
    itemId: item.id,
    question: 'glyph',
    display: item.reading,
    options: shuffle(
      [
        { label: nativeOf(item), correct: true, itemId: item.id },
        { label: nativeOf(other), correct: false, itemId: other.id },
      ],
      rng,
    ),
  };
}

/** A round: per pair both characters by reading and one the other way round; the same pair never twice in a row. */
export function buildConfuserRound(index: CourseIndex, cp: CourseProgress | undefined, rng: Rng): Task[] {
  const pairs = confuserPairs(index, cp).slice(0, CONFUSERS.maxPairs);
  const groups = pairs.map((p) => {
    const a = index.byId.get(p.a) as Readable;
    const b = index.byId.get(p.b) as Readable;
    const [g1, g2] = rng() < 0.5 ? [a, b] : [b, a];
    return [readingTask(a, b, rng), readingTask(b, a, rng), glyphTask(g1, g2, rng)];
  });
  return spread(groups, rng);
}

/** Interleaves the groups so that two tasks of the same pair are not next to each other (when possible). */
function spread(groups: Task[][], rng: Rng): Task[] {
  const queues = groups.map((g) => shuffle(g, rng));
  const out: Task[] = [];
  let last = -1;
  while (queues.some((q) => q.length)) {
    const open = queues.map((q, i) => (q.length ? i : -1)).filter((i) => i >= 0);
    const choices = open.filter((i) => i !== last);
    // Prefer the fullest queue so no pair is left alone at the end.
    const pool = choices.length ? choices : open;
    const max = Math.max(...pool.map((i) => queues[i].length));
    const best = pool.filter((i) => queues[i].length === max);
    const i = best[Math.floor(rng() * best.length)];
    out.push(queues[i].shift()!);
    last = i;
  }
  return out;
}
