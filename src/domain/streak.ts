import { addDays, diffDays, weekStart } from './dates';
import type { DayActivity, StreakState } from './gamification';

/**
 * Serie mit Schutzschild. The streak is derived from the daily activity
 * (which merges safely between devices), so it never disagrees across
 * phone and laptop.
 *
 * - A day counts once a lesson was finished or 10 answers were given.
 * - A shield is earned for every 7 days in a row and for learning on 5 days
 *   of a week (Wochenmission); at most 3 are kept.
 * - A missed day uses up a shield automatically; the streak goes on (the
 *   shielded day itself does not add a day).
 * - Shields exist from SHIELD_START on: older gaps stay gaps.
 */
export const SHIELD_START = '2026-10-16';
export const SHIELD_MAX = 3;
export const SHIELD_EVERY = 7;
/** Days of a week that earn the weekly shield. */
export const WEEK_DAYS_GOAL = 5;

export const dayQualifies = (d: DayActivity | undefined) => !!d && (d.lessons >= 1 || d.answers >= 10);

export type DayMark = 'done' | 'shield' | 'missed' | 'today' | 'future' | 'none';

export interface StreakView {
  /** Days in a row, today included once it counts. */
  current: number;
  longest: number;
  shields: number;
  /** Last day that kept the streak alive (learned or shielded). */
  lastDay: string | null;
  todayDone: boolean;
  /** Monday to Sunday of the current week. */
  week: { day: string; mark: DayMark }[];
  /** Days of learning until the next 7-day shield (null at the maximum). */
  nextShieldIn: number | null;
}

export function streakView(profile: { daily: Record<string, DayActivity>; streak: StreakState }, today: string): StreakView {
  const daily = profile.daily;
  const first = Object.keys(daily)
    .filter((d) => d <= today && dayQualifies(daily[d]))
    .sort()[0];
  const marks = new Map<string, DayMark>();
  let current = 0;
  let longest = 0;
  let shields = 0;
  let lastDay: string | null = null;
  let week = '';
  let weekCount = 0;
  const earn = () => {
    shields = Math.min(SHIELD_MAX, shields + 1);
  };

  if (first) {
    for (let d = first; d <= today; d = addDays(d, 1)) {
      if (dayQualifies(daily[d])) {
        current += 1;
        longest = Math.max(longest, current);
        lastDay = d;
        marks.set(d, 'done');
        if (weekStart(d) !== week) {
          week = weekStart(d);
          weekCount = 0;
        }
        weekCount += 1;
        if (d >= SHIELD_START) {
          if (current % SHIELD_EVERY === 0) earn();
          if (weekCount === WEEK_DAYS_GOAL) earn();
        }
      } else if (d === today) {
        marks.set(d, 'today');
      } else if (current > 0 && shields > 0 && d >= SHIELD_START) {
        shields -= 1;
        lastDay = d;
        marks.set(d, 'shield');
      } else {
        current = 0;
        marks.set(d, 'missed');
      }
    }
  }

  const monday = weekStart(today);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    const mark: DayMark = day > today ? 'future' : (marks.get(day) ?? (day === today ? 'today' : 'none'));
    return { day, mark };
  });
  const todayDone = marks.get(today) === 'done';
  return {
    current,
    longest: Math.max(longest, profile.streak.longest),
    shields,
    lastDay,
    todayDone,
    week: weekDays,
    nextShieldIn: shields >= SHIELD_MAX ? null : SHIELD_EVERY - (current % SHIELD_EVERY),
  };
}

/** What is stored in the profile (for achievements, the public card and old app versions). */
export function streakState(view: StreakView): StreakState {
  return { current: view.current, longest: view.longest, lastDay: view.lastDay };
}

/** True when today still has to count to keep the streak (it has days, today is open). */
export function streakAtRisk(view: StreakView, today: string): boolean {
  return view.current > 0 && !view.todayDone && !!view.lastDay && diffDays(view.lastDay, today) === 1;
}
