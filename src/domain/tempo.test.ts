import { describe, expect, it } from 'vitest';
import bn from '../content/bn';
import bnMap from '../content/bn/map.json';
import ru from '../content/ru';
import { newlyUnlocked } from './achievements';
import { attachMap, buildIndex } from './courseIndex';
import { mergeRoots } from './merge';
import { emptyCourse, emptyRoot, recordTempo } from './progress';
import type { ItemProgress } from './srs';
import { seededRng } from './taskFactory';
import {
  answerTempo,
  applyTempoSession,
  bestBlitz,
  buildTempoTasks,
  clampFlash,
  clampSeconds,
  endTempo,
  nextTempo,
  pickTempoItems,
  startTempo,
  summarizeTempo,
  tempoOverview,
  tempoPool,
  timeIsUp,
  TEMPO,
  type TempoProgress,
  type TempoState,
} from './tempo';
import type { CourseMap, Item, PlaceItem } from './types';

const ru_ = buildIndex(ru);
const bn_ = attachMap(buildIndex(bn), bnMap as unknown as CourseMap);

const box = (b: number): ItemProgress => ({
  box: b, due: '2026-10-06', last: 1, intro: 1, seen: 1, ok: 1, retry: 0, wrong: 0, lapses: 0, streak: 1, promotedDay: null, days: 1, lastOkDay: null, recent: 'C',
});
const learnedAll = (items: Item[]) => Object.fromEntries(items.map((it) => [it.id, box(2)]));

describe('tempo pool and tasks', () => {
  it('only learned items take part', () => {
    const items = { 'ru:letter:a': box(1), 'ru:letter:b': box(0) };
    expect(tempoPool(ru_, 'letters', items).map((i) => i.id)).toEqual(['ru:letter:a']);
    expect(tempoPool(ru_, 'places', {})).toHaveLength(0);
  });

  it('map content means the 64 districts of Bangladesh', () => {
    const pool = tempoPool(bn_, 'map', learnedAll(bn_.items));
    expect(pool).toHaveLength(64);
    expect(pool.every((p) => bn_.mapShapes.has(p.id))).toBe(true);
  });

  it('letter tasks have four options with different readings, one of them right', () => {
    const rng = seededRng(3);
    const pool = tempoPool(ru_, 'letters', learnedAll(ru_.items));
    const ids = new Set(pool.map((p) => p.id));
    for (const task of buildTempoTasks(ru_, pool, 'letters', ids, rng)) {
      expect(task.options).toHaveLength(4);
      expect(task.options.filter((o) => o === task.itemId)).toHaveLength(1);
      const readings = task.options.map((o) => (ru_.byId.get(o) as { reading: string }).reading);
      expect(new Set(readings).size).toBe(4);
    }
  });

  it('place tasks show the native name and offer four distinct names of the same layer', () => {
    const rng = seededRng(5);
    const pool = tempoPool(bn_, 'places', learnedAll(bn_.items));
    const ids = new Set(pool.map((p) => p.id));
    for (const task of buildTempoTasks(bn_, pool, 'places', ids, rng)) {
      const place = bn_.byId.get(task.itemId) as PlaceItem;
      expect(task.display).toBe(place.native);
      expect(task.options).toHaveLength(4);
      const names = task.options.map((o) => (bn_.byId.get(o) as PlaceItem).names.en.toLowerCase());
      expect(new Set(names).size).toBe(4);
      const layers = new Set(task.options.map((o) => (bn_.byId.get(o) as PlaceItem).regionType ?? 'city'));
      expect(layers.size).toBe(1);
    }
  });

  it('map tasks are answered by a click (no options)', () => {
    const pool = tempoPool(bn_, 'map', learnedAll(bn_.items)).slice(0, 5);
    const tasks = buildTempoTasks(bn_, pool, 'map', new Set(pool.map((p) => p.id)), seededRng(1));
    expect(tasks.every((t) => t.content === 'map' && t.options.length === 0)).toBe(true);
  });

  it('slow items come up more often, and long sessions cycle without direct repeats', () => {
    const pool = tempoPool(ru_, 'letters', learnedAll(ru_.items)).slice(0, 10);
    const slow = pool[0].id;
    const stats: TempoProgress = { items: Object.fromEntries(pool.map((p) => [p.id, { ms: p.id === slow ? 6000 : 800, n: 3, t: 1 }])), days: {}, best: {} };
    let firsts = 0;
    for (let seed = 1; seed <= 200; seed++) if (pickTempoItems(pool, stats, 3, seededRng(seed))[0].id === slow) firsts++;
    expect(firsts).toBeGreaterThan(100);

    const long = pickTempoItems(pool, stats, 95, seededRng(9));
    expect(long).toHaveLength(95);
    for (let i = 1; i < long.length; i++) expect(long[i].id).not.toBe(long[i - 1].id);
  });

  it('settings are clamped to 1–15 s and 0.5–2 s', () => {
    expect(clampSeconds(0)).toBe(TEMPO.defaultS);
    expect(clampSeconds(30)).toBe(15);
    expect(clampSeconds(1)).toBe(1);
    expect(clampFlash(100)).toBe(500);
    expect(clampFlash(1100)).toBe(1000);
    expect(clampFlash(9000)).toBe(2000);
  });
});

function play(mode: 'timer' | 'blitz' | 'flash', answers: (string | null)[], step = 1000, limitMs = 5000): TempoState {
  const pool = tempoPool(ru_, 'letters', learnedAll(ru_.items)).slice(0, 8);
  const tasks = buildTempoTasks(ru_, pool, 'letters', new Set(pool.map((p) => p.id)), seededRng(2));
  let now = 0;
  let s = startTempo(mode, tasks, now, { limitMs });
  for (const a of answers) {
    now += step;
    const task = s.tasks[s.index];
    const pick = a === 'right' ? task.itemId : a === 'wrong' ? task.options.find((o) => o !== task.itemId)! : null;
    s = answerTempo(s, pick, now);
    s = nextTempo(s, now);
  }
  return s;
}

describe('tempo session engine', () => {
  it('measures each answer from the moment the task appeared', () => {
    const s = play('timer', ['right', 'wrong', 'right'], 1200);
    expect(s.answers.map((a) => a.ms)).toEqual([1200, 1200, 1200]);
    expect(s.answers.map((a) => a.correct)).toEqual([true, false, true]);
  });

  it('a timeout counts as the full limit and as not correct', () => {
    const s = play('timer', [null], 7000, 3000);
    expect(s.answers[0]).toMatchObject({ timeout: true, correct: false, ms: 3000, pickedId: null });
  });

  it('knows when the time per task is up', () => {
    const s = startTempo('timer', play('timer', []).tasks, 0, { limitMs: 2000 });
    expect(timeIsUp(s, 1999)).toBe(false);
    expect(timeIsUp(s, 2000)).toBe(true);
  });

  it('a Blitz round ends after 60 seconds', () => {
    const tasks = play('blitz', []).tasks;
    let s = startTempo('blitz', tasks, 0);
    expect(s.endsAt).toBe(TEMPO.blitzMs);
    s = answerTempo(s, tasks[0].itemId, 59_000);
    s = nextTempo(s, 61_000);
    expect(s.phase).toBe('done');
    expect(timeIsUp(startTempo('blitz', tasks, 0), 60_000)).toBe(true);
  });

  it('ending early keeps the answers given so far', () => {
    let s = startTempo('blitz', play('blitz', []).tasks, 0);
    s = answerTempo(s, s.tasks[0].itemId, 500);
    s = nextTempo(s, 500);
    s = endTempo(s);
    expect(s.phase).toBe('done');
    expect(summarizeTempo(s)).toMatchObject({ answered: 1, correct: 1 });
  });

  it('the summary averages correct answers only; flash mode is not timed', () => {
    const s = play('timer', ['right', 'wrong', 'right', null], 1000, 5000);
    expect(summarizeTempo(s)).toMatchObject({ answered: 4, correct: 2, timeouts: 1, avgMs: 1000 });
    expect(summarizeTempo(s).mistakes).toHaveLength(2);
    expect(summarizeTempo(play('flash', ['right'])).avgMs).toBeNull();
  });
});

describe('stored reading times', () => {
  it('smooths reading times and records the day only for correct answers', () => {
    const s = play('timer', ['right', 'wrong', null], 2000, 4000);
    const { tempo } = applyTempoSession(undefined, s, 'letters', Date.UTC(2026, 9, 6, 10));
    const [a, b, c] = s.answers;
    expect(tempo.items[a.itemId].ms).toBe(2000);
    expect(tempo.items[b.itemId]).toBeUndefined(); // wrong answers measure nothing
    expect(tempo.items[c.itemId].ms).toBe(4000); // too slow = the full limit
    expect(Object.values(tempo.days.letters)).toEqual([{ ms: 2000, n: 1 }]);

    const again = applyTempoSession(tempo, play('timer', ['right'], 1000), 'letters', Date.UTC(2026, 9, 7, 10)).tempo;
    expect(again.items[a.itemId]).toMatchObject({ ms: Math.round(2000 * 0.65 + 1000 * 0.35), n: 2 });
  });

  it('flash sessions do not change reading times', () => {
    const { tempo } = applyTempoSession(undefined, play('flash', ['right', 'right']), 'letters');
    expect(tempo.items).toEqual({});
  });

  it('keeps the best Blitz score per content', () => {
    const first = applyTempoSession(undefined, play('blitz', ['right', 'right', 'wrong']), 'letters');
    expect(first).toMatchObject({ newBest: true, prevBest: 0 });
    expect(bestBlitz(first.tempo, 'letters')).toBe(2);
    const worse = applyTempoSession(first.tempo, play('blitz', ['right']), 'letters');
    expect(worse.newBest).toBe(false);
    expect(bestBlitz(worse.tempo, 'letters')).toBe(2);
    expect(bestBlitz(worse.tempo, 'places')).toBe(0);
  });

  it('overview: mean, slowest first, daily trend', () => {
    const pool = tempoPool(ru_, 'letters', learnedAll(ru_.items)).slice(0, 3);
    const tp: TempoProgress = {
      items: { [pool[0].id]: { ms: 900, n: 1, t: 1 }, [pool[1].id]: { ms: 3100, n: 1, t: 1 } },
      days: { letters: { '2026-10-01': { ms: 6200, n: 2 }, '2026-10-05': { ms: 2800, n: 2 } } },
      best: {},
    };
    const o = tempoOverview(pool, tp, 'letters');
    expect(o).toMatchObject({ avgMs: 2000, measured: 2 });
    expect(o.slowest[0]).toEqual({ id: pool[1].id, ms: 3100 });
    expect(o.trend).toEqual([{ day: '2026-10-01', ms: 3100 }, { day: '2026-10-05', ms: 1400 }]);
  });
});

describe('tempo in the progress document', () => {
  it('records XP, answers and confusions, but never touches learning boxes', () => {
    const root = emptyRoot('de', 1000);
    root.courses.ru = emptyCourse(1000);
    const s = play('timer', ['right', 'wrong', 'right'], 1000);
    for (const a of s.answers) root.courses.ru.items[a.itemId] = box(3);
    const { root: after } = recordTempo(root, 'ru', s, 'letters', Date.UTC(2026, 9, 6, 10));
    for (const a of s.answers) expect(after.courses.ru.items[a.itemId]).toEqual(box(3));
    expect(after.profile.totalAnswers).toBe(3);
    expect(after.profile.xp).toBe(2); // 1 XP per correct answer, no bonus under 10 answers
    const wrong = s.answers[1];
    expect(after.courses.ru.confusions[`${wrong.itemId}>${wrong.pickedId}`]).toBe(1);
    expect(after.courses.ru.recent).toBe(''); // tempo does not change the accuracy figure
  });

  it('merges tempo data from two devices', () => {
    const a = emptyRoot('de', 1000);
    const b = emptyRoot('de', 1000);
    a.courses.bn = { ...emptyCourse(1000), tempo: { items: { x: { ms: 1500, n: 2, t: 100 } }, days: { map: { '2026-10-05': { ms: 3000, n: 2 } } }, best: { 'blitz:map': { score: 12, at: 1 } } } };
    b.courses.bn = { ...emptyCourse(1000), tempo: { items: { x: { ms: 900, n: 5, t: 200 }, y: { ms: 2000, n: 1, t: 50 } }, days: { map: { '2026-10-05': { ms: 4000, n: 4 } } }, best: { 'blitz:map': { score: 9, at: 2 } } } };
    for (const m of [mergeRoots(a, b), mergeRoots(b, a)]) {
      expect(m.courses.bn.tempo).toEqual({
        items: { x: { ms: 900, n: 5, t: 200 }, y: { ms: 2000, n: 1, t: 50 } },
        days: { map: { '2026-10-05': { ms: 4000, n: 4 } } },
        best: { 'blitz:map': { score: 12, at: 1 } },
      });
    }
    expect(mergeRoots(emptyRoot('de', 1), emptyRoot('de', 1)).courses).toEqual({});
  });

  it('30 correct answers in a Blitz round unlock "Lightning Reader"', () => {
    const root = emptyRoot('de', 1000);
    root.courses.ru = { ...emptyCourse(1000), tempo: { items: {}, days: {}, best: { 'blitz:letters': { score: 30, at: 1 } } } };
    expect(newlyUnlocked(root, 'ru', ru_)).toContain('blitz-30');
  });
});
