import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import type { DayActivity } from './gamification';
import { addClaims, mergeClaims, missionsFor, unclaimedMissions, weekMissions } from './missions';
import { completeLesson, emptyRoot, recordAnswer, recordDailyResult } from './progress';
import { SHIELD_MAX, SHIELD_START, streakAtRisk, streakView } from './streak';

const on: DayActivity = { lessons: 1, answers: 0, xp: 10 };
const none = { current: 0, longest: 0, lastDay: null };

/** Learning on `n` days in a row from `from`. */
function days(from: string, n: number, skip: number[] = []): Record<string, DayActivity> {
  const out: Record<string, DayActivity> = {};
  for (let i = 0; i < n; i++) if (!skip.includes(i)) out[addDays(from, i)] = on;
  return out;
}

describe('Serie mit Schutzschild', () => {
  it('earns a shield after 7 days in a row and uses it for a missed day', () => {
    // 2026-10-19 is a Monday; 7 days in a row, day 8 missed, day 9 learned
    const daily = days('2026-10-19', 9, [7]);
    const v = streakView({ daily, streak: none }, '2026-10-27');
    expect(v.current).toBe(8);
    expect(v.shields).toBe(1); // 7 in a row + week goal (5 days) = 2, one used
  });

  it('counts the weekly goal (5 days) as a shield', () => {
    const v = streakView({ daily: days('2026-10-19', 5), streak: none }, '2026-10-23');
    expect(v.shields).toBe(1);
    expect(v.nextShieldIn).toBe(2);
  });

  it('keeps at most 3 shields', () => {
    const v = streakView({ daily: days('2026-10-19', 40), streak: none }, addDays('2026-10-19', 39));
    expect(v.shields).toBe(SHIELD_MAX);
    expect(v.nextShieldIn).toBeNull();
  });

  it('breaks without shields and has none before the start day', () => {
    const before = addDays(SHIELD_START, -20);
    const daily = days(before, 9, [7]);
    expect(streakView({ daily, streak: none }, addDays(before, 8)).current).toBe(1);
  });

  it('shows the week from Monday and marks shielded days', () => {
    const daily = days('2026-10-19', 9, [7]);
    const v = streakView({ daily, streak: none }, '2026-10-28');
    expect(v.week.map((d) => d.mark)).toEqual(['shield', 'done', 'today', 'future', 'future', 'future', 'future']);
    expect(streakAtRisk(v, '2026-10-28')).toBe(true);
  });

  it('stays the same after a merge of two devices (derived from the days)', () => {
    const a = days('2026-10-19', 3);
    const b = { ...days('2026-10-22', 3) };
    const merged = { ...a, ...b };
    expect(streakView({ daily: merged, streak: none }, '2026-10-24').current).toBe(6);
  });

  it('keeps a longer record from before', () => {
    expect(streakView({ daily: days('2026-10-19', 2), streak: { current: 0, longest: 40, lastDay: null } }, '2026-10-20').longest).toBe(40);
  });
});

describe('Wochenmissionen', () => {
  it('has the shield mission and two different ones every week', () => {
    for (let w = 0; w < 30; w++) {
      const ms = missionsFor(addDays('2026-10-19', 7 * w));
      expect(ms[0].id).toBe('days5');
      expect(ms[1].id).not.toBe(ms[2].id);
      expect(ms[1].xp).toBeGreaterThan(0);
    }
    expect(missionsFor('2026-10-19')).toEqual(missionsFor('2026-10-19'));
  });

  it('counts only this week', () => {
    const daily = { ...days('2026-10-12', 7), ...days('2026-10-19', 2) };
    const wm = weekMissions(daily, '2026-10-20');
    expect(wm.week).toBe('2026-10-19');
    expect(wm.missions[0].progress).toBe(2);
    expect(wm.daysLeft).toBe(6);
  });

  it('pays an XP mission once and keeps the claims small', () => {
    const today = '2026-10-21';
    const def = missionsFor('2026-10-19')[1];
    const field = { lessons3: 'lessons', perfect2: 'perfect', answers150: 'answers', places30: 'places', tempo3: 'tempo', challenge3: 'challenge' }[def.id as string] as keyof DayActivity;
    const daily: Record<string, DayActivity> =
      def.id === 'challenge3'
        ? { '2026-10-19': { ...on, challenge: 1 }, '2026-10-20': { ...on, challenge: 1 }, [today]: { ...on, challenge: 1 } }
        : { [today]: { ...on, [field]: def.goal } };
    const due = unclaimedMissions(daily, undefined, today);
    expect(due.ids).toContain(def.id);
    const claims = addClaims(undefined, due.week, due.ids);
    expect(unclaimedMissions(daily, claims, today).ids).not.toContain(def.id);
    let many = claims;
    for (let w = 1; w < 10; w++) many = addClaims(many, addDays('2026-10-19', 7 * w), ['lessons3']);
    expect(Object.keys(many)).toHaveLength(6);
    expect(mergeClaims({ a: ['lessons3'] }, { a: ['tempo3'] })).toEqual({ a: ['lessons3', 'tempo3'] });
  });

  it('adds the mission XP to the profile when the progress finishes it', () => {
    const now = new Date('2026-10-21T12:00:00').getTime();
    let root = emptyRoot('de', now);
    for (let i = 0; i < 3; i++) root = completeLesson(root, 'ru', `ru-l0${i + 1}`, { correct: 5, total: 5, newItems: [] }, now);
    for (let i = 0; i < 160; i++) root = recordAnswer(root, 'ru', { itemId: 'ru:city:moskva', result: 'C', applySrs: false }, now);
    for (let i = 0; i < 3; i++) root = recordDailyResult(root, 'ru', `2026-10-2${i}`, { c: 10, n: 10, ms: 1 } as never, true, now + i);
    const wm = weekMissions(root.profile.daily, '2026-10-21');
    const claimed = root.profile.missions?.['2026-10-19'] ?? [];
    for (const m of wm.missions.slice(1)) {
      if (m.done) expect(claimed).toContain(m.def.id);
    }
    const lessonsXp = 3 * 10;
    const answersXp = 160 * 2;
    const missionXp = wm.missions.slice(1).filter((m) => m.done).reduce((n, m) => n + m.def.xp, 0);
    expect(root.profile.xp).toBe(lessonsXp + answersXp + missionXp);
    expect(root.profile.daily['2026-10-21'].perfect).toBe(3);
    expect(root.profile.daily['2026-10-21'].places).toBeGreaterThanOrEqual(160);
  });
});
