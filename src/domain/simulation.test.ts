import { describe, expect, it } from 'vitest';
import bn from '../content/bn';
import el from '../content/el';
import th from '../content/th';
import ru from '../content/ru';
import bnMap from '../content/bn/map.json';
import { attachMap, buildIndex, readingOf, type CourseIndex } from './courseIndex';
import { evaluateTyped } from './evaluate';
import { buildLesson, finalRoundTasks } from './lessonBuilder';
import { buildPractice, SMART_PRACTICE } from './practiceBuilder';
import { advance, createSession, currentTask, submit, type SessionMode } from './sessionEngine';
import { applyAnswer, introduce, type ItemProgress } from './srs';
import { retaskFor, seededRng } from './taskFactory';
import type { Task } from './tasks';
import type { CourseMap } from './types';


/** The answer a perfect learner would give. */
function rightAnswer(index: CourseIndex, task: Task): string {
  const item = index.byId.get(task.itemId)!;
  if (task.kind === 'identify') return (item as { names: { en: string } }).names.en;
  if (task.kind === 'meaning') return (item as { meaning: { en: string[] } }).meaning.en[0];
  return readingOf(index, item);
}

function simulate(index: CourseIndex, tasks: Task[], mode: SessionMode, errorRate: number, seed: number) {
  const rng = seededRng(seed);
  const deps = { rng, retask: retaskFor(index, rng), finalRound: finalRoundTasks(index, rng) };
  let s = createSession(tasks, mode);
  let guard = 0;
  while (s.phase !== 'done' && guard++ < 500) {
    const task = currentTask(s)!;
    if (task.kind === 'intro' || s.phase === 'feedback') {
      s = advance(s, deps);
      continue;
    }
    const wrong = rng() < errorRate;
    if (task.kind === 'choice') {
      const i = task.options.findIndex((o) => (wrong ? !o.correct : o.correct));
      s = submit(s, '', { correct: task.options[i].correct }, deps, i);
    } else if (task.kind === 'locate') {
      // A click on the map: the right area, or a different one.
      const other = [...index.mapShapes.keys()].find((id) => id !== task.itemId)!;
      const clicked = wrong ? other : task.itemId;
      s = submit(s, clicked, { correct: !wrong, confusedWith: wrong ? clicked : undefined }, deps);
    } else {
      const answer = wrong ? 'qqq' : rightAnswer(index, task);
      const ev = evaluateTyped(index, task, answer);
      expect(ev.correct, `${task.itemId} "${answer}"`).toBe(!wrong);
      s = submit(s, answer, ev, deps);
    }
  }
  expect(s.phase).toBe('done');
  return s;
}

describe.each([ru, el, th, bn])('end-to-end simulation $id', (course) => {
  const index = buildIndex(course);
  it('every lesson can be completed, with and without mistakes', () => {
    for (const lesson of course.lessons) {
      simulate(index, buildLesson(index, lesson, {}, seededRng(lesson.number)), 'learn', 0, 1);
      const s = simulate(index, buildLesson(index, lesson, {}, seededRng(lesson.number + 100)), 'learn', 0.3, lesson.number);
      // the session stays bounded even with many mistakes
      expect(s.tasks.length).toBeLessThan(80);
    }
  });

  it('practice works for a learner who finished half the lessons', () => {
    const items: Record<string, ItemProgress> = {};
    const today = '2026-10-05';
    for (const lesson of course.lessons.slice(0, 15)) {
      for (const id of lesson.newIds) items[id] = applyAnswer(introduce(undefined, today, 0), 'C', today, 0);
    }
    for (const mode of [SMART_PRACTICE, { ...SMART_PRACTICE, weakOnly: true }, { ...SMART_PRACTICE, categories: ['cities' as const], scope: 'all' as const }]) {
      const tasks = buildPractice(index, mode, { items, confusedTwice: new Set(), today }, seededRng(9));
      expect(tasks.length).toBeGreaterThan(0);
      simulate(index, tasks, 'practice', 0.25, 4);
    }
  });
});

describe('Bangladesh districts on the map', () => {
  const index = attachMap(buildIndex(bn), bnMap as CourseMap);
  const districtLessons = bn.lessons.filter((l) => l.id.startsWith('bn-district-'));

  it('has a map area for every district and nothing else', () => {
    expect(index.mapShapes.size).toBe(64);
    for (const id of index.mapShapes.keys()) expect(id.startsWith('bn:district:'), id).toBe(true);
    expect(districtLessons.flatMap((l) => l.newIds).sort()).toEqual([...index.mapShapes.keys()].sort());
  });

  it('teaches districts with map tasks: find, read, recognise', () => {
    for (const lesson of districtLessons) {
      const tasks = buildLesson(index, lesson, {}, seededRng(lesson.number));
      const kinds = new Set(tasks.map((t) => (t.kind === 'choice' ? `choice:${t.question}` : t.kind)));
      expect([...kinds].sort()).toEqual(['choice:map', 'identify', 'intro', 'locate']);
      simulate(index, tasks, 'learn', 0, 1);
      simulate(index, buildLesson(index, lesson, {}, seededRng(lesson.number + 7)), 'learn', 0.35, lesson.number);
    }
  });

  it('offers neighbouring districts as choices for a highlighted area', () => {
    const tasks = buildLesson(index, districtLessons[0], {}, seededRng(3)).filter((t) => t.kind === 'choice');
    for (const t of tasks) {
      if (t.kind !== 'choice') continue;
      expect(t.options).toHaveLength(4);
      expect(t.options.filter((o) => o.correct)).toHaveLength(1);
      for (const o of t.options) expect(index.mapShapes.has(o.itemId!), o.itemId).toBe(true);
    }
  });

  it('practises only districts when asked to', () => {
    const today = '2026-10-05';
    const items: Record<string, ItemProgress> = {};
    for (const id of districtLessons[0].newIds) items[id] = applyAnswer(introduce(undefined, today, 0), 'C', today, 0);
    const config = { ...SMART_PRACTICE, categories: ['regions' as const], scope: 'all' as const, layer: 'district' as const, count: 25 };
    const tasks = buildPractice(index, config, { items, confusedTwice: new Set(), today }, seededRng(5));
    expect(tasks.length).toBeGreaterThan(0);
    for (const t of tasks) expect(t.itemId.startsWith('bn:district:'), t.itemId).toBe(true);
    expect(tasks.some((t) => t.kind === 'locate')).toBe(true);
    simulate(index, tasks, 'practice', 0.3, 8);
  });
});
