import { describe, expect, it } from 'vitest';
import ru from '../content/ru';
import { buildIndex, readingOf } from './courseIndex';
import { evaluateTyped } from './evaluate';
import { buildLesson, finalRoundTasks } from './lessonBuilder';
import { buildPractice, SMART_PRACTICE } from './practiceBuilder';
import { advance, createSession, currentTask, submit, type SessionMode } from './sessionEngine';
import { applyAnswer, introduce, type ItemProgress } from './srs';
import { retaskFor, seededRng } from './taskFactory';
import type { Task } from './tasks';

const index = buildIndex(ru);

/** The answer a perfect learner would give. */
function rightAnswer(task: Task): string {
  const item = index.byId.get(task.itemId)!;
  if (task.kind === 'identify') return (item as { names: { en: string } }).names.en;
  if (task.kind === 'meaning') return (item as { meaning: { en: string[] } }).meaning.en[0];
  return readingOf(index, item);
}

function simulate(tasks: Task[], mode: SessionMode, errorRate: number, seed: number) {
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
    } else {
      const answer = wrong ? 'qqq' : rightAnswer(task);
      const ev = evaluateTyped(index, task, answer);
      expect(ev.correct, `${task.itemId} "${answer}"`).toBe(!wrong);
      s = submit(s, answer, ev, deps);
    }
  }
  expect(s.phase).toBe('done');
  return s;
}

describe('end-to-end simulation', () => {
  it('every lesson can be completed, with and without mistakes', () => {
    for (const lesson of ru.lessons) {
      simulate(buildLesson(index, lesson, {}, seededRng(lesson.number)), 'learn', 0, 1);
      const s = simulate(buildLesson(index, lesson, {}, seededRng(lesson.number + 100)), 'learn', 0.3, lesson.number);
      // the session stays bounded even with many mistakes
      expect(s.tasks.length).toBeLessThan(80);
    }
  });

  it('practice works for a learner who finished half the lessons', () => {
    const items: Record<string, ItemProgress> = {};
    const today = '2026-10-05';
    for (const lesson of ru.lessons.slice(0, 15)) {
      for (const id of lesson.newIds) items[id] = applyAnswer(introduce(undefined, today, 0), 'C', today, 0);
    }
    for (const mode of [SMART_PRACTICE, { ...SMART_PRACTICE, weakOnly: true }, { ...SMART_PRACTICE, categories: ['cities' as const], scope: 'all' as const }]) {
      const tasks = buildPractice(index, mode, { items, confusedTwice: new Set(), today }, seededRng(9));
      expect(tasks.length).toBeGreaterThan(0);
      simulate(tasks, 'practice', 0.25, 4);
    }
  });
});
