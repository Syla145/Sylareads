import type { CourseIndex } from './courseIndex';
import type { Result } from './srs';
import { identifyTask, locateTask, readTask, shuffle, type Rng } from './taskFactory';
import type { Task } from './tasks';
import type { Item, Lesson, PlaceItem } from './types';

/**
 * Einstufung ("Kann ich schon"): learners who already read a script take over
 * what they know instead of clicking through every lesson.
 *
 * - review: every item of the scope once; known items become "learning" (box 2).
 * - test:   20 tasks, three quarters of them tricky items; from 18 / 20 on
 *           everything counts as "familiar" (box 3) and the lessons are skipped.
 *
 * Placement only ever raises progress. It never lowers a box or replaces a
 * lesson record.
 */

export type PlacementMode = 'review' | 'test';

/** "letters" = all phases that consist of letter lessons only; otherwise a phase id. */
export const LETTERS_SCOPE = 'letters';

export const PLACEMENT = {
  testSize: 20,
  /** Share of tricky items in a test. */
  hardShare: 0.75,
  /** Share of right answers needed to count as "sure" (18 of 20). */
  passShare: 0.9,
  reviewBox: 2,
  sureBox: 3,
} as const;

export interface PlacementScope {
  id: string;
  lessons: Lesson[];
  /** Items taught in these lessons, in lesson order. */
  itemIds: string[];
}

const lessonIds = (l: Lesson) => (l.newIds.length ? l.newIds : l.reviewIds ?? []);

export function placementScope(index: CourseIndex, scopeId: string): PlacementScope | null {
  const { phases, lessons } = index.content;
  const phaseIds =
    scopeId === LETTERS_SCOPE
      ? phases.filter((p) => {
          const list = lessons.filter((l) => l.phaseId === p.id);
          return list.length > 0 && list.every((l) => l.type === 'letters');
        }).map((p) => p.id)
      : phases.some((p) => p.id === scopeId)
        ? [scopeId]
        : [];
  const scoped = lessons.filter((l) => phaseIds.includes(l.phaseId));
  const itemIds = [...new Set(scoped.flatMap((l) => l.newIds))].filter((id) => index.byId.has(id));
  return itemIds.length ? { id: scopeId, lessons: scoped, itemIds } : null;
}

/** Items that are easy to get wrong: false friends, look-alikes, contrast pairs, digraph units, lesser-known places. */
export function isTricky(index: CourseIndex, item: Item): boolean {
  switch (item.kind) {
    case 'letter':
      return !!item.falseFriend || !!item.looksLike || !!item.functionChoice || (index.contrastOf.get(item.id)?.length ?? 0) > 0;
    case 'combo':
      return !!item.unit;
    case 'city':
    case 'region':
      return item.tier >= 2;
    default:
      return Array.from(item.native).length >= 6;
  }
}

/** Test items: up to 15 tricky ones, the rest a sample of all others (all items if the scope is small). */
export function pickTestItems(index: CourseIndex, scope: PlacementScope, rng: Rng, size: number = PLACEMENT.testSize): string[] {
  if (scope.itemIds.length <= size) return shuffle(scope.itemIds, rng);
  const items = scope.itemIds.map((id) => index.byId.get(id)!);
  const hard = shuffle(items.filter((it) => isTricky(index, it)), rng);
  const easy = shuffle(items.filter((it) => !isTricky(index, it)), rng);
  const nHard = Math.min(hard.length, Math.round(size * PLACEMENT.hardShare));
  const picked = [...hard.slice(0, nHard), ...easy.slice(0, size - nHard)];
  if (picked.length < size) picked.push(...hard.slice(nHard, nHard + size - picked.length));
  return shuffle(picked, rng).map((it) => it.id);
}

/** One typed task per item (map areas are found on the map). No learning cards: this is about what is already known. */
export function placementTask(index: CourseIndex, item: Item, rng: Rng): Task {
  if (item.kind === 'city' || item.kind === 'region') {
    return index.mapShapes.has(item.id) ? locateTask(item as PlaceItem) : identifyTask(item as PlaceItem);
  }
  return readTask(item, rng);
}

export function placementTasks(index: CourseIndex, scope: PlacementScope, mode: PlacementMode, rng: Rng): Task[] {
  const ids = mode === 'test' ? pickTestItems(index, scope, rng) : scope.itemIds;
  return ids.map((id) => placementTask(index, index.byId.get(id)!, rng));
}

export const passMark = (total: number) => Math.ceil(total * PLACEMENT.passShare);

export interface PlacementOutcome {
  mode: PlacementMode;
  correct: number;
  total: number;
  passed: boolean;
  /** New minimum box per item (only raised, see applyPlacement). */
  boxes: Record<string, number>;
  /** Items answered wrong. */
  wrong: string[];
  /** Lessons whose items are all known afterwards. */
  placedLessons: string[];
}

/**
 * Turns the first answer per item into boxes.
 * - Test passed: every item of the scope is familiar (box 3); wrong answers box 1, due at once.
 * - Test not passed, or review: right answers box 2; the rest stays as it is.
 * `currentBox` is the box before placement; lessons count as placed when all
 * their items end up at box 2 or higher.
 */
export function placementOutcome(
  scope: PlacementScope,
  mode: PlacementMode,
  first: Record<string, Result>,
  currentBox: (id: string) => number,
): PlacementOutcome {
  const asked = Object.keys(first);
  const correct = asked.filter((id) => first[id] === 'C').length;
  const total = asked.length;
  const passed = mode === 'test' && total > 0 && correct >= passMark(total);
  const wrong = asked.filter((id) => first[id] !== 'C');
  const boxes: Record<string, number> = {};
  if (passed) {
    for (const id of scope.itemIds) boxes[id] = first[id] && first[id] !== 'C' ? 1 : PLACEMENT.sureBox;
  } else {
    for (const id of asked) if (first[id] === 'C') boxes[id] = PLACEMENT.reviewBox;
  }
  const after = (id: string) => Math.max(currentBox(id), boxes[id] ?? 0);
  const placedLessons = scope.lessons.filter((l) => lessonIds(l).length > 0 && lessonIds(l).every((id) => after(id) >= 2)).map((l) => l.id);
  return { mode, correct, total, passed, boxes, wrong, placedLessons };
}
