import { describe, expect, it } from 'vitest';
import bn from '../content/bn';
import {
  answerChallenge,
  canResume,
  dailyAnswers,
  dailyOf,
  dailySeed,
  isFinished,
  leaveChallenge,
  mergeDaily,
  pickChallenge,
  recordDaily,
  resumeChallenge,
  scoreOf,
  startChallenge,
} from '../domain/challenge';
import { buildIndex } from '../domain/courseIndex';
import { emptyCourse, emptyRoot } from '../domain/progress';
import { parsePracticeParams } from '../features/practice/config';

/*
 * Step 1 of the overhaul ("nothing gets lost"): two tabs, broken data,
 * full storage, backups, the paused daily challenge and capped links.
 * localStorage and the storage event are simulated (tests run in Node).
 */

class FakeStorage {
  map = new Map<string, string>();
  quota = Infinity;
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    const size = [...this.map.entries()].reduce((n, [key, val]) => n + (key === k ? 0 : val.length), 0) + v.length;
    if (size > this.quota) throw new Error('QuotaExceededError');
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  get length() {
    return this.map.size;
  }
}

const storage = new FakeStorage();
// Object.keys(localStorage) lists the stored keys in browsers.
const storageProxy = new Proxy(storage, {
  ownKeys: (t) => [...t.map.keys()],
  getOwnPropertyDescriptor: (t, k) => (typeof k === 'string' && t.map.has(k) ? { enumerable: true, configurable: true, value: t.map.get(k) } : undefined),
});
const listeners = new Map<string, ((e: unknown) => void)[]>();
const fakeWindow = {
  localStorage: storageProxy,
  addEventListener: (type: string, fn: (e: unknown) => void) => listeners.set(type, [...(listeners.get(type) ?? []), fn]),
  location: { reload: () => undefined },
};
Object.assign(globalThis, { window: fakeWindow, document: { addEventListener: () => undefined, visibilityState: 'visible' }, sessionStorage: new FakeStorage() });

const KEY = 'sylareads.progress';
/** Another tab writes: storage changes and this tab gets the "storage" event. */
function otherTabWrites(key: string, value: string) {
  storage.setItem(key, value);
  for (const fn of listeners.get('storage') ?? []) fn({ key, newValue: value });
}

const { migrate, installFlushHandlers, flush, readBackup, wipeDevice, corruptCopy } = await import('./persistence');
const { useProgress } = await import('./progressStore');
installFlushHandlers();

const withLesson = (xp: number) => {
  const r = emptyRoot('de', 1);
  r.profile.xp = xp;
  r.courses.bn = { ...emptyCourse(1), lastSessionAt: 5, xp, lessons: { 'bn-l01': { completedAt: 5, times: 1, bestCorrect: 20, bestTotal: 24 } } };
  return r;
};

describe('broken entries are repaired or dropped (Z2)', () => {
  it('a null lesson, items of the wrong type and prototype tricks never reach the app', () => {
    const raw = JSON.parse(
      JSON.stringify({
        schemaVersion: 1,
        courses: {
          bn: {
            startedAt: 1,
            lessons: { 'bn-l01': null, 'bn-l02': { completedAt: 7, times: 'x', bestCorrect: 3, bestTotal: 4 } },
            items: { a: null, b: { box: 99, seen: 'many', due: 5, recent: 'CCCCCCCC' } },
            confusions: { 'a>b': 2, 'c>d': 'x' },
            lastPracticeConfig: { categories: 'letters', count: 9999 },
          },
          ru: null,
        },
        profile: { xp: 'lots', daily: { '2026-10-01': null }, achievements: { x: 5, y: null } },
      }).replace('"bn-l02"', '"__proto__":{"polluted":true},"bn-l02"'),
    );
    const root = migrate(raw);
    const bnCourse = root.courses.bn!;
    expect(Object.keys(bnCourse.lessons)).toEqual(['bn-l02']);
    expect(bnCourse.lessons['bn-l02'].times).toBe(1);
    expect(Object.keys(bnCourse.items)).toEqual(['b']);
    expect(bnCourse.items.b.box).toBe(7);
    expect(bnCourse.items.b.seen).toBe(0);
    expect(bnCourse.items.b.due).toBeNull();
    expect(bnCourse.items.b.recent).toBe('CCCCC');
    expect(bnCourse.confusions).toEqual({ 'a>b': 2 });
    expect(bnCourse.lastPracticeConfig).toMatchObject({ categories: [], count: 50 });
    expect(root.courses.ru).toBeUndefined();
    expect(root.profile.xp).toBe(0);
    expect(root.profile.daily).toEqual({});
    expect(root.profile.achievements).toEqual({ x: 5 });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('two tabs (Z1)', () => {
  it('a write from another tab is merged in, never overwritten', () => {
    // This tab changes a setting while another tab has finished a lesson.
    otherTabWrites(KEY, JSON.stringify(withLesson(117)));
    expect(useProgress.getState().root.courses.bn?.lessons['bn-l01']).toBeDefined();
    useProgress.getState().setSignView('always');
    const stored = JSON.parse(storage.getItem(KEY)!);
    expect(stored.profile.xp).toBe(117);
    expect(stored.courses.bn.lessons['bn-l01']).toBeDefined();
    expect(stored.settings.signView).toBe('always');
  });

  it('also when the storage event was missed (merged right before writing)', () => {
    const other = withLesson(150);
    other.courses.bn!.lessons['bn-l02'] = { completedAt: 9, times: 1, bestCorrect: 5, bestTotal: 5 };
    storage.setItem(KEY, JSON.stringify(other)); // no event
    useProgress.getState().setMapLabels('mapLabels', 'native');
    flush();
    const stored = JSON.parse(storage.getItem(KEY)!);
    expect(stored.courses.bn.lessons['bn-l02']).toBeDefined();
    expect(stored.settings.mapLabels).toBe('native');
    expect(useProgress.getState().root.profile.xp).toBe(150);
  });

  it('a reset in another tab is adopted, not merged away', () => {
    storage.setItem('sylareads.replacedAt', String(Date.now()));
    otherTabWrites(KEY, JSON.stringify(emptyRoot('de', 2)));
    expect(useProgress.getState().root.profile.xp).toBe(0);
    expect(useProgress.getState().root.courses.bn).toBeUndefined();
  });
});

describe('backups (Z5)', () => {
  it('reset keeps a dated backup that can be restored', () => {
    useProgress.getState().applyMerged(withLesson(80));
    useProgress.getState().reset();
    expect(useProgress.getState().root.profile.xp).toBe(0);
    const backup = readBackup();
    expect(backup?.root.profile.xp).toBe(80);
    expect(Date.now() - backup!.at).toBeLessThan(5000);
    expect(useProgress.getState().restoreBackup()).toBe(true);
    expect(useProgress.getState().root.profile.xp).toBe(80);
  });
});

describe('full storage (Z4)', () => {
  it('says so instead of failing silently, after making room', () => {
    storage.setItem('sylareads.progress.corrupt.1', 'x'.repeat(50));
    storage.quota = 10;
    useProgress.getState().setSignView('mixed');
    expect(useProgress.getState().storageProblem).toBe('full');
    expect(storage.getItem('sylareads.progress.corrupt.1')).toBeNull();
    storage.quota = Infinity;
    useProgress.getState().setSignView('off');
    expect(useProgress.getState().storageProblem).toBeNull();
  });
});

describe('everything on this device (S8)', () => {
  it('wipeDevice removes all Sylareads keys', () => {
    storage.setItem('sylareads.duelName', 'Syla');
    storage.setItem('other.app', 'stays');
    expect(corruptCopy()).toBeNull();
    wipeDevice();
    expect([...storage.map.keys()].filter((k) => k.startsWith('sylareads.') && k !== 'sylareads.wipedAt')).toEqual([]);
    expect(storage.getItem('other.app')).toBe('stays');
  });
});

describe('paused daily challenge (L1, Z8)', () => {
  const index = buildIndex(bn);
  const ids = pickChallenge(index, dailySeed('bn', '2026-10-12'));

  it('leaving counts the visible name and keeps the answers to go on', () => {
    let s = startChallenge(ids, 0);
    s = answerChallenge(s, index, 'dhaka', 1000);
    expect(s.shownAt).toBeNull();
    // the next name is visible when the player leaves
    s = { ...s, shownAt: 2000 };
    const left = leaveChallenge(s, index, 2500);
    expect(left.answers).toHaveLength(2);
    expect(left.answers[1].correct).toBe(false);
    const log = recordDaily(undefined, '2026-10-12', scoreOf(left), false, 10, dailyAnswers(left));
    const r = dailyOf(JSON.parse(JSON.stringify(log)))!['2026-10-12'];
    expect(canResume(r, ids.length)).toBe(true);
    const again = resumeChallenge(ids, r.ans!, 5000);
    expect(again.answers).toHaveLength(2);
    expect(again.shownAt).toBe(5000);
    expect(scoreOf(again)).toEqual(scoreOf(left));
  });

  it('a finished attempt drops its answers; old paused attempts without answers count as finished', () => {
    const done = recordDaily(undefined, 'd', { c: 3, n: 10, ms: 9 }, true, 1, [[1, 5, 'x']]);
    expect(done.d.ans).toBeUndefined();
    expect(canResume({ c: 1, n: 10, ms: 5, at: 1, done: false }, 10)).toBe(false);
  });

  it('two devices: the further attempt of the same start wins', () => {
    const a = recordDaily(undefined, 'd', { c: 1, n: 10, ms: 5 }, false, 1, [[1, 5, 'a']]);
    const b = recordDaily(undefined, 'd', { c: 2, n: 10, ms: 9 }, false, 1, [[1, 5, 'a'], [1, 4, 'b']]);
    expect(mergeDaily(a, b)!.d.ans).toHaveLength(2);
    expect(mergeDaily(b, a)!.d.ans).toHaveLength(2);
    expect(isFinished(resumeChallenge(ids, Array.from({ length: 10 }, () => [1, 1, 'x'] as [1, number, string]), 0))).toBe(true);
  });
});

describe('links that were edited (S7)', () => {
  it('caps the size of a practice session', () => {
    const r = parsePracticeParams(new URLSearchParams('lesson=bn-l01&n=50000000'));
    expect(r).toEqual({ kind: 'lesson', lessonId: 'bn-l01', count: 50 });
    const ids = parsePracticeParams(new URLSearchParams(`ids=${Array.from({ length: 500 }, (_, i) => `x${i % 300}`).join(',')}`));
    expect(ids.kind === 'ids' && ids.ids.length).toBe(100);
  });
});
