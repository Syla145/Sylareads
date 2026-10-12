import { describe, expect, it } from 'vitest';
import { COURSES } from '../content/registry';
import { parseDuel } from './challenge';
import { SCRIPTS_COURSE_ID } from './scriptCourse';
import ru from '../content/ru';
import { buildIndex } from './courseIndex';
import { mergeRoots } from './merge';
import {
  activityOf,
  CARD_COURSES,
  CARD_LIMITS,
  cardOf,
  cleanName,
  CONSENT_VERSION,
  effectiveShare,
  currentCourse,
  mergeShare,
  NAME_MAX,
  publicCourse,
  publicSnapshot,
  sameCard,
  simpleCourse,
  sortPlayers,
  nameProblem,
  pseudonym,
  type PlayerCard,
} from './presence';
import { emptyCourse, emptyRoot } from './progress';
import { migrate } from '../store/persistence';

const index = buildIndex(ru);
const T0 = Date.UTC(2026, 9, 7, 10, 0, 0);

describe('Wer ist gerade da', () => {
  it('cleans names: spaces, control characters, length', () => {
    expect(cleanName('  Syla   der  Große \u0007 ')).toBe('Syla der Große');
    expect([...cleanName('x'.repeat(40))].length).toBe(NAME_MAX);
    expect(cleanName('\n\t')).toBe('');
  });

  it('nobody is shown without saying yes to the current consent; old choices count as off', () => {
    expect(effectiveShare(undefined)).toEqual({ on: false, name: '', at: 0 });
    expect(effectiveShare({ on: true, name: 'Josef', at: 5 }).on).toBe(false);
    expect(effectiveShare({ on: true, name: 'Syla', at: 5, c: CONSENT_VERSION })).toEqual({ on: true, name: 'Syla', at: 5, c: CONSENT_VERSION });
  });

  it('suggests a neutral name that is the same for one account everywhere', () => {
    expect(pseudonym('abc')).toMatch(/^Reader \d{4}$/);
    expect(pseudonym('abc')).toBe(pseudonym('abc'));
    expect(nameProblem(pseudonym('xyz'))).toBeNull();
  });

  it('display names: length, characters, blocked words without false alarms', () => {
    expect(nameProblem('Syla')).toBeNull();
    expect(nameProblem('Ана-Мария')).toBeNull();
    expect(nameProblem('ทวีศักดิ์')).toBeNull();
    expect(nameProblem('Marschall')).toBeNull();
    expect(nameProblem('Sussex')).toBeNull();
    expect(nameProblem('x')).toBe('short');
    expect(nameProblem('<b>hi</b>')).toBe('chars');
    expect(nameProblem('-dash')).toBe('chars');
    expect(nameProblem('F u c k')).toBe('blocked');
    expect(nameProblem('sh1t happens')).toBe('blocked');
    expect(nameProblem('GeoGuessr')).toBe('blocked');
  });

  it('the newer sharing choice wins on both devices and survives a reload', () => {
    const a = emptyRoot('de', T0);
    const b = emptyRoot('de', T0);
    a.profile.share = { on: true, name: 'Syla', at: T0 };
    b.profile.share = { on: false, name: 'Syla', at: T0 + 1000 };
    expect(mergeRoots(a, b).profile.share?.on).toBe(false);
    expect(mergeRoots(b, a).profile.share?.on).toBe(false);
    expect(mergeShare(undefined, a.profile.share)).toEqual(a.profile.share);
    expect(migrate(JSON.parse(JSON.stringify(a))).profile.share).toEqual(a.profile.share);
    expect(migrate({ schemaVersion: 1, profile: { share: { on: 'yes' } } }).profile.share).toBeUndefined();
    expect('share' in mergeRoots(emptyRoot('de', T0), emptyRoot('de', T0)).profile).toBe(false);
  });

  it('the card shows the latest course and its progress', () => {
    const root = emptyRoot('de', T0);
    root.courses.ru = { ...emptyCourse(T0), lastSessionAt: T0 + 5000, lessons: { 'ru-l01': { completedAt: T0, times: 1, bestCorrect: 9, bestTotal: 10 } } };
    root.courses.el = { ...emptyCourse(T0), lastSessionAt: T0 };
    root.profile.xp = 130;
    expect(currentCourse(root)).toBe('ru');
    const ruCard = publicCourse(index, root, '2026-10-07');
    expect(ruCard.l).toBe(1);
    expect(ruCard.lt).toBe(ru.lessons.length);
    expect(ruCard.m).toBeGreaterThanOrEqual(0);
    expect(ruCard.ct).toBeGreaterThan(0);
    const snap = publicSnapshot(root, '  Syla ', { ru: ruCard, scripts: simpleCourse(14, 28, 3, 7) }, '2026-10-07');
    expect(snap).toMatchObject({ v: 2, name: 'Syla', course: 'ru', streak: 0, xp: 130 });
    expect(snap.courses.scripts).toEqual({ m: 50, l: 3, lt: 7 });
    expect(snap.level).toBeGreaterThanOrEqual(2);
    expect(sameCard(snap, { ...snap, courses: { scripts: snap.courses.scripts, ru: snap.courses.ru } })).toBe(true);
    expect(sameCard(snap, { ...snap, streak: 1 })).toBe(false);
    expect(sameCard(null, snap)).toBe(false);
  });

  it('activity: now, today, this week, then hidden', () => {
    const now = Date.parse('2026-10-07T15:00:00');
    expect(activityOf(now - 60_000, now)).toBe('now');
    expect(activityOf(now - 3 * 3600_000, now)).toBe('today');
    expect(activityOf(now - 2 * 86_400_000, now)).toBe('week');
    expect(activityOf(now - 9 * 86_400_000, now)).toBeNull();
  });

  it('reads stored cards defensively and lists the own card first', () => {
    const now = T0;
    const raw = { name: 'Tom', course: 'bn', courses: { bn: { m: 140, l: 3, lt: 41, c: 5, ct: 100 }, bad: 'x' }, streak: 'x', level: 0 };
    const card = cardOf('u2', raw, now - 1000)!;
    expect(card.courses.bn.m).toBe(100);
    expect(card.courses.bad).toBeUndefined();
    expect(card.streak).toBe(0);
    expect(card.level).toBe(1);
    expect(cardOf('u3', { course: 'ru' }, now)).toBeNull();
    const old: PlayerCard = { ...card, uid: 'u4', seen: now - 30 * 86_400_000 };
    const me: PlayerCard = { ...card, uid: 'me', seen: now - 5 * 3600_000 };
    const other: PlayerCard = { ...card, uid: 'u5', seen: now - 10 };
    expect(sortPlayers([card, old, other, me], 'me', now).map((c) => c.uid)).toEqual(['me', 'u5', 'u2']);
  });

  it('cards that break the rules: hidden by name, unknown courses dropped, numbers in range (S4)', () => {
    const seen = T0;
    expect(cardOf('a', { name: 'fuck_you_all' }, seen)).toBeNull();
    expect(cardOf('b', { name: 'Admin Sylareads' }, seen)).toBeNull();
    expect(cardOf('c', { name: '<img src=x>' }, seen)).toBeNull();
    const card = cardOf(
      'd',
      {
        name: 'Tom',
        course: 'Schreib mir: evil@example.com',
        courses: { bn: { m: 99, l: 1e21, lt: -3 }, 'Besucht meine Seite': { m: 1, l: 1, lt: 1 } },
        tempo: { bn: { d: '2026-10-12', c: 99, n: 10, ms: 1e12 }, evil: { d: '2026-10-12', c: 1, n: 10, ms: 1 } },
        level: 1e300,
        xp: 9007199254740991,
        streak: 9007199254740991,
      },
      seen,
    )!;
    expect(card.course).toBe('');
    expect(Object.keys(card.courses)).toEqual(['bn']);
    expect(card.courses.bn.lt).toBe(0);
    expect(card.courses.bn.l).toBeLessThanOrEqual(500);
    expect(Object.keys(card.tempo ?? {})).toEqual(['bn']);
    expect(card.tempo!.bn.c).toBe(10);
    expect(card.tempo!.bn.ms).toBe(3_600_000);
    expect(card.level).toBe(CARD_LIMITS.level);
    expect(card.xp).toBe(CARD_LIMITS.xp);
    expect(card.streak).toBe(CARD_LIMITS.streak);
  });

  it('the card course list matches the courses of the app', () => {
    expect([...CARD_COURSES].sort()).toEqual([...COURSES.map((c) => c.id), SCRIPTS_COURSE_ID].sort());
  });

  it('duel links: a blocked name shows as someone, an absurd time is ignored (S11)', () => {
    expect(parseDuel(new URLSearchParams('s=abcd2345&n=Hitler&r=5&t=30000'))?.from?.name).toBe('');
    expect(parseDuel(new URLSearchParams('s=abcd2345&n=Josef!&r=5&t=30000'))?.from?.name).toBe('Josef!');
    expect(parseDuel(new URLSearchParams('s=abcd2345&n=Josef&r=5&t=99999999999'))?.from).toBeUndefined();
  });
});
