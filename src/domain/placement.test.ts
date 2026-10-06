import { describe, expect, it } from 'vitest';
import bn from '../content/bn';
import bnMap from '../content/bn/map.json';
import ru from '../content/ru';
import { newlyUnlocked } from './achievements';
import { attachMap, buildIndex } from './courseIndex';
import { mergeRoots } from './merge';
import { isTricky, LETTERS_SCOPE, passMark, pickTestItems, placementOutcome, placementScope, placementTasks } from './placement';
import { applyPlacement, completeLesson, emptyCourse, emptyRoot } from './progress';
import { advance, createSession, submit } from './sessionEngine';
import type { Result } from './srs';
import { retaskFor, seededRng } from './taskFactory';
import type { CourseMap } from './types';
import { courseStats } from './stats';

const ru_ = buildIndex(ru);
const bn_ = attachMap(buildIndex(bn), bnMap as unknown as CourseMap);
const letters = placementScope(ru_, LETTERS_SCOPE)!;
const answers = (ids: string[], wrong: string[] = []) => Object.fromEntries(ids.map((id) => [id, (wrong.includes(id) ? 'W' : 'C') as Result]));

describe('placement scope and test', () => {
  it('"all letters" means every letter of the alphabet phases', () => {
    expect(letters.itemIds).toHaveLength(33);
    expect(letters.itemIds.every((id) => id.startsWith('ru:letter:'))).toBe(true);
    expect(placementScope(bn_, LETTERS_SCOPE)!.itemIds.every((id) => id.startsWith('bn:letter:'))).toBe(true);
    expect(placementScope(ru_, 'cities')!.itemIds).toHaveLength(100);
    expect(placementScope(ru_, 'nope')).toBeNull();
  });

  it('a test has 20 different items, mostly tricky ones', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ids = pickTestItems(ru_, letters, seededRng(seed));
      expect(new Set(ids).size).toBe(20);
      const tricky = ids.filter((id) => isTricky(ru_, ru_.byId.get(id)!)).length;
      expect(tricky).toBeGreaterThanOrEqual(Math.min(15, letters.itemIds.filter((id) => isTricky(ru_, ru_.byId.get(id)!)).length));
    }
  });

  it('review asks every item once; map areas are found on the map', () => {
    expect(placementTasks(ru_, letters, 'review', seededRng(1))).toHaveLength(33);
    const districts = placementScope(bn_, 'districts')!;
    const tasks = placementTasks(bn_, districts, 'review', seededRng(1));
    expect(tasks).toHaveLength(64);
    expect(tasks.every((t) => t.kind === 'locate')).toBe(true);
  });

  it('wrong answers are not asked again in a placement session', () => {
    const tasks = placementTasks(ru_, letters, 'test', seededRng(4));
    const deps = { rng: seededRng(1), retask: retaskFor(ru_, seededRng(1)) };
    let s = createSession(tasks, 'practice', { noRepeat: true });
    while (s.phase !== 'done') {
      s = submit(s, '', { correct: false }, deps);
      s = advance(s, deps);
    }
    expect(s.outcomes).toHaveLength(20);
    expect(Object.keys(s.first)).toHaveLength(20);
  });
});

describe('placement outcome', () => {
  it('18 of 20 passes: everything familiar, wrong ones at box 1, lessons with a wrong item stay open', () => {
    const asked = pickTestItems(ru_, letters, seededRng(2));
    const o = placementOutcome(letters, 'test', answers(asked, asked.slice(0, 2)), () => 0);
    expect(passMark(20)).toBe(18);
    expect(o).toMatchObject({ passed: true, correct: 18, total: 20 });
    expect(Object.keys(o.boxes)).toHaveLength(33);
    expect(o.boxes[asked[0]]).toBe(1);
    expect(o.boxes[asked[5]]).toBe(3);
    const open = letters.lessons.filter((l) => l.newIds.some((id) => asked.slice(0, 2).includes(id))).map((l) => l.id);
    for (const id of open) expect(o.placedLessons).not.toContain(id);
    expect(o.placedLessons.length).toBe(letters.lessons.length - open.length);
  });

  it('17 of 20 does not pass: only right answers become "learning", untested items stay', () => {
    const asked = pickTestItems(ru_, letters, seededRng(2));
    const o = placementOutcome(letters, 'test', answers(asked, asked.slice(0, 3)), () => 0);
    expect(o.passed).toBe(false);
    expect(Object.keys(o.boxes)).toHaveLength(17);
    expect(Object.values(o.boxes).every((b) => b === 2)).toBe(true);
  });

  it('review: a lesson is skipped when all its letters were known', () => {
    const first = letters.lessons[0];
    const o = placementOutcome(letters, 'review', answers(letters.itemIds, letters.lessons[1].newIds.slice(0, 1)), () => 0);
    expect(o.placedLessons).toContain(first.id);
    expect(o.placedLessons).not.toContain(letters.lessons[1].id);
  });
});

describe('placement in the progress document', () => {
  const asked = letters.itemIds;
  const outcome = placementOutcome(letters, 'review', answers(asked), () => 0);

  it('raises boxes, never lowers them, and keeps played lessons', () => {
    const root = emptyRoot('de', 1000);
    root.courses.ru = emptyCourse(1000);
    const strong = asked[0];
    root.courses.ru.items[strong] = { box: 6, due: '2026-12-01', last: 1, intro: 1, seen: 9, ok: 9, retry: 0, wrong: 0, lapses: 0, streak: 9, promotedDay: null, days: 6, lastOkDay: null, recent: 'CCCCC' };
    const played = letters.lessons[0].id;
    root.courses.ru.lessons[played] = { completedAt: 5, times: 1, bestCorrect: 9, bestTotal: 10 };
    const after = applyPlacement(root, 'ru', outcome, Date.UTC(2026, 9, 6, 10));
    expect(after.courses.ru.items[strong].box).toBe(6);
    expect(after.courses.ru.items[asked[5]]).toMatchObject({ box: 2, due: '2026-10-07' });
    expect(after.courses.ru.lessons[played]).toEqual({ completedAt: 5, times: 1, bestCorrect: 9, bestTotal: 10 });
    expect(after.courses.ru.lessons[letters.lessons[1].id]).toMatchObject({ placed: true });
  });

  it('"continue" leads to the first lesson after the alphabet; letters count as known', () => {
    const after = applyPlacement(emptyRoot('de', 1000), 'ru', outcome);
    const stats = courseStats(ru_, after.courses.ru);
    const firstOpen = ru_.content.lessons.find((l) => !letters.lessons.includes(l))!;
    expect(stats.recommendation).toEqual({ kind: 'lesson', lessonId: firstOpen.id });
    expect(stats.lettersLearned).toBe(33);
    expect(stats.citiesReadable).toBeGreaterThan(50);
  });

  it('placing lessons unlocks no lesson achievements', () => {
    const after = applyPlacement(emptyRoot('de', 1000), 'ru', outcome);
    const ids = newlyUnlocked(after, 'ru', ru_);
    expect(ids).not.toContain('first-steps');
    expect(ids).toContain('full-alphabet');
  });

  it('a played lesson replaces a placed one, also across devices', () => {
    const lessonId = letters.lessons[1].id;
    const placed = applyPlacement(emptyRoot('de', 1000), 'ru', outcome, 2000);
    const played = completeLesson(placed, 'ru', lessonId, { correct: 8, total: 10, newItems: [] }, 3000);
    expect(played.courses.ru.lessons[lessonId].placed).toBeUndefined();
    const other = applyPlacement(emptyRoot('de', 1000), 'ru', outcome, 2500);
    for (const m of [mergeRoots(played, other), mergeRoots(other, played)]) {
      expect(m.courses.ru.lessons[lessonId]).toMatchObject({ bestCorrect: 8, bestTotal: 10 });
      expect(m.courses.ru.lessons[lessonId].placed).toBeUndefined();
      expect(m.courses.ru.lessons[letters.lessons[2].id].placed).toBe(true);
    }
  });
});
