import { describe, expect, it } from 'vitest';
import ru from '../content/ru';
import { buildIndex } from './courseIndex';
import { mergeRoots } from './merge';
import { logAnswer, mergeMistakes, mistakesOn, reviewList, type MistakeLog } from './mistakes';
import { emptyCourse, emptyRoot, recordAnswer, recordTempo } from './progress';
import { seededRng } from './taskFactory';
import { migrate } from '../store/persistence';
import { answerTempo, buildTempoTasks, nextTempo, startTempo, tempoPool } from './tempo';

const T = '2026-10-06';
const at = (h: number) => Date.UTC(2026, 9, 6, h);

describe('mistake log', () => {
  it('counts wrong answers per day; a later right answer marks the item fixed', () => {
    let log = logAnswer(undefined, 'a', true, T, 1);
    log = logAnswer(log, 'a', true, T, 2);
    log = logAnswer(log, 'b', true, T, 3);
    log = logAnswer(log, 'a', false, T, 4);
    expect(mistakesOn(log, T)).toEqual([
      { id: 'b', n: 1, fixed: false },
      { id: 'a', n: 2, fixed: true },
    ]);
    // wrong again: open again
    log = logAnswer(log, 'a', true, T, 5);
    expect(mistakesOn(log, T)[0]).toEqual({ id: 'a', n: 3, fixed: false });
  });

  it('right answers alone leave no trace', () => {
    expect(logAnswer(undefined, 'a', false, T, 1)).toBeUndefined();
  });

  it('keeps one week', () => {
    let log: MistakeLog | undefined;
    for (let d = 1; d <= 10; d++) log = logAnswer(log, 'a', true, `2026-10-${String(d).padStart(2, '0')}`, d);
    expect(Object.keys(log!).sort()).toEqual(['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']);
  });

  it('shows yesterday until something goes wrong today', () => {
    const log = logAnswer(undefined, 'a', true, '2026-10-05', 1);
    expect(reviewList(log, T)).toEqual({ when: 'yesterday', items: [{ id: 'a', n: 1, fixed: false }] });
    expect(reviewList(logAnswer(log, 'b', true, T, 2), T)?.when).toBe('today');
    expect(reviewList(log, '2026-10-08')).toBeNull();
  });

  it('merges two devices', () => {
    const a = logAnswer(logAnswer(undefined, 'x', true, T, 10), 'y', true, T, 11);
    const b = logAnswer(logAnswer(undefined, 'x', true, T, 20), 'x', true, T, 21);
    const m = mergeMistakes(a, b)!;
    expect(m[T].x).toEqual({ n: 2, ok: 0, last: 21 });
    expect(m[T].y).toEqual({ n: 1, ok: 0, last: 11 });
  });
});

describe('mistakes in the progress document', () => {
  it('lessons and practice log mistakes; placement answers do not', () => {
    let root = emptyRoot('de', 1);
    root = recordAnswer(root, 'ru', { itemId: 'ru:letter:v', result: 'W', applySrs: true }, at(9));
    root = recordAnswer(root, 'ru', { itemId: 'ru:letter:r', result: 'W', applySrs: false, logMistake: false }, at(9));
    root = recordAnswer(root, 'ru', { itemId: 'ru:letter:v', result: 'C', applySrs: true }, at(10));
    expect(mistakesOn(root.courses.ru.mistakes, T)).toEqual([{ id: 'ru:letter:v', n: 1, fixed: true }]);
  });

  it('tempo: wrong picks are mistakes, timeouts are not', () => {
    const index = buildIndex(ru);
    const items = Object.fromEntries(index.byKind.letter.map((l) => [l.id, { box: 2 } as never]));
    const pool = tempoPool(index, 'letters', items).slice(0, 6);
    const tasks = buildTempoTasks(index, pool, 'letters', new Set(pool.map((p) => p.id)), seededRng(3));
    let s = startTempo('timer', tasks, 0, { limitMs: 3000 });
    const wrongPick = tasks[0].options.find((o) => o !== tasks[0].itemId)!;
    s = nextTempo(answerTempo(s, wrongPick, 500), 500);
    s = nextTempo(answerTempo(s, null, 4000), 4000);
    const root = emptyRoot('de', 1);
    root.courses.ru = emptyCourse(1);
    const { root: after } = recordTempo(root, 'ru', s, 'letters', at(12));
    expect(mistakesOn(after.courses.ru.mistakes, T).map((m) => m.id)).toEqual([tasks[0].itemId]);
  });

  it('survives syncing between devices', () => {
    const a = recordAnswer(emptyRoot('de', 1), 'ru', { itemId: 'ru:letter:v', result: 'W', applySrs: true }, at(9));
    const b = recordAnswer(emptyRoot('de', 1), 'ru', { itemId: 'ru:letter:n', result: 'W', applySrs: true }, at(10));
    const ids = mistakesOn(mergeRoots(a, b).courses.ru.mistakes, T).map((m) => m.id).sort();
    expect(ids).toEqual(['ru:letter:n', 'ru:letter:v']);
  });

  it('is kept when the stored document is loaded again', () => {
    const a = recordAnswer(emptyRoot('de', 1), 'ru', { itemId: 'ru:letter:v', result: 'W', applySrs: true }, at(9));
    const loaded = migrate(JSON.parse(JSON.stringify(a)));
    expect(loaded.courses.ru.mistakes).toEqual(a.courses.ru.mistakes);
  });
});
