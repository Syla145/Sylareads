import { describe, expect, it } from 'vitest';
import bn from '../content/bn';
import ru from '../content/ru';
import {
  answerChallenge,
  CHALLENGE,
  compareScores,
  currentId,
  dailyOf,
  dailySeed,
  duelQuery,
  isFinished,
  mergeDaily,
  newDuelSeed,
  nextName,
  parseDuel,
  pickChallenge,
  recordDaily,
  scoreOf,
  startChallenge,
} from './challenge';
import { buildIndex } from './courseIndex';
import { addDays } from './dates';
import { mergeRoots } from './merge';
import { cardOf, publicSnapshot } from './presence';
import { emptyRoot, recordDailyResult } from './progress';
import { seededRng } from './taskFactory';
import type { PlaceItem } from './types';
import { migrate } from '../store/persistence';

const bnIndex = buildIndex(bn);
const ruIndex = buildIndex(ru);

describe('Daily Challenge and duel', () => {
  it('everybody gets the same 10 cities for a seed, mixed by importance', () => {
    const a = pickChallenge(bnIndex, dailySeed('bn', '2026-10-08'));
    expect(a).toEqual(pickChallenge(bnIndex, dailySeed('bn', '2026-10-08')));
    expect(a).toHaveLength(CHALLENGE.count);
    expect(new Set(a).size).toBe(CHALLENGE.count);
    expect(pickChallenge(bnIndex, dailySeed('bn', '2026-10-09'))).not.toEqual(a);
    const tiers = a.map((id) => (bnIndex.byId.get(id) as PlaceItem).tier);
    expect(tiers.filter((t) => t === 1).length).toBe(4);
    expect(a.every((id) => bnIndex.byId.get(id)?.kind === 'city')).toBe(true);
    expect(pickChallenge(ruIndex, 'abcdefgh')).toHaveLength(CHALLENGE.count);
  });

  it('typed answers are graded; time runs only while a name is shown', () => {
    const ids = pickChallenge(ruIndex, 'k3j8sd9a');
    let s = startChallenge(ids, 1000);
    const first = ruIndex.byId.get(currentId(s)!) as PlaceItem;
    s = answerChallenge(s, ruIndex, first.translit, 3500);
    expect(s.answers[0]).toMatchObject({ correct: true, ms: 2500 });
    expect(currentId(s)).toBeUndefined();
    expect(answerChallenge(s, ruIndex, 'x', 9000)).toBe(s);
    s = nextName(s, 10_000);
    s = answerChallenge(s, ruIndex, 'zzz', 11_000);
    expect(s.answers[1].correct).toBe(false);
    for (let i = 2; i < ids.length; i++) s = answerChallenge(nextName(s, 0), ruIndex, '', 100);
    expect(isFinished(s)).toBe(true);
    expect(scoreOf(s)).toEqual({ c: 1, n: 10, ms: 2500 + 1000 + 8 * 100 });
  });

  it('more correct wins, then less time', () => {
    const list = [
      { c: 8, n: 10, ms: 40_000 },
      { c: 9, n: 10, ms: 60_000 },
      { c: 8, n: 10, ms: 30_000 },
    ].sort(compareScores);
    expect(list.map((x) => `${x.c}/${x.ms}`)).toEqual(['9/60000', '8/30000', '8/40000']);
  });

  it('one attempt per day: kept per account, merged by the earlier start', () => {
    let log = recordDaily(undefined, '2026-10-08', { c: 2, n: 10, ms: 5000 }, false, 100);
    log = recordDaily(log, '2026-10-08', { c: 7, n: 10, ms: 31_000 }, true, 900);
    expect(log['2026-10-08']).toEqual({ c: 7, n: 10, ms: 31_000, at: 100, done: true });
    const other = recordDaily(undefined, '2026-10-08', { c: 10, n: 10, ms: 9000 }, true, 500);
    expect(mergeDaily(log, other)!['2026-10-08'].c).toBe(7);
    expect(mergeDaily(other, log)!['2026-10-08'].c).toBe(7);
    let many = log;
    for (let d = 1; d <= 40; d++) many = recordDaily(many, addDays('2026-08-01', d), { c: 1, n: 10, ms: 1 }, true, d);
    expect(Object.keys(many).length).toBeLessThanOrEqual(CHALLENGE.keepDays);
    expect(dailyOf({ '2026-10-08': { c: 3, ms: 'x' }, nope: {} })).toEqual({ '2026-10-08': { c: 3, n: 10, ms: 0, at: 0, done: false } });

    const root = recordDailyResult(emptyRoot('de', 1), 'bn', '2026-10-08', { c: 7, n: 10, ms: 31_000 }, true, 50);
    expect(migrate(JSON.parse(JSON.stringify(root))).courses.bn.daily).toEqual(root.courses.bn.daily);
    expect(mergeRoots(root, emptyRoot('de', 1)).courses.bn.daily).toEqual(root.courses.bn.daily);
  });

  it('the player card carries the latest finished daily per course', () => {
    let root = recordDailyResult(emptyRoot('de', 1), 'bn', '2026-10-07', { c: 9, n: 10, ms: 20_000 }, true, 10);
    root = recordDailyResult(root, 'bn', '2026-10-08', { c: 3, n: 10, ms: 8000 }, false, 20);
    const card = publicSnapshot(root, 'Syla', {}, '2026-10-08');
    expect(card.tempo).toEqual({ bn: { d: '2026-10-07', c: 9, n: 10, ms: 20_000 } });
    expect(cardOf('u', { name: 'Tom', tempo: { bn: { d: '2026-10-08', c: 5, n: 10, ms: 1 }, x: 'bad' } }, 1)!.tempo).toEqual({ bn: { d: '2026-10-08', c: 5, n: 10, ms: 1 } });
  });

  it('duel links carry seed, name and result and are read defensively', () => {
    const seed = newDuelSeed(seededRng(4));
    expect(seed).toMatch(/^[a-z0-9]{8}$/);
    const q = duelQuery(seed, { name: 'Syla', score: { c: 8, n: 10, ms: 31_234.4 } });
    expect(parseDuel(new URLSearchParams(q))).toEqual({ seed, from: { name: 'Syla', score: { c: 8, n: 10, ms: 31_234 } } });
    expect(parseDuel(new URLSearchParams(duelQuery(seed)))).toEqual({ seed });
    expect(parseDuel(new URLSearchParams('s=AB!'))).toBeNull();
    expect(parseDuel(new URLSearchParams(`s=${seed}&n=Tom&r=99&t=5`))).toEqual({ seed });
  });
});
