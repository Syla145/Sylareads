import { addDays, weekStart } from './dates';
import type { DayActivity } from './gamification';
import { dayQualifies, WEEK_DAYS_GOAL } from './streak';

/**
 * Wochenmissionen: three goals per week (Monday to Sunday), the same on
 * every device. The first one is always "learn on 5 days" and gives a
 * shield (counted in streak.ts); two more come from a pool and give XP.
 * Progress is read from the daily activity, so it merges like the streak.
 */
export type MissionId = 'days5' | 'lessons3' | 'perfect2' | 'answers150' | 'places30' | 'tempo3' | 'challenge3';

export interface MissionDef {
  id: MissionId;
  goal: number;
  /** XP on completion; 0 for the shield mission. */
  xp: number;
  measure: (days: (DayActivity | undefined)[]) => number;
}

const sum = (key: keyof DayActivity) => (days: (DayActivity | undefined)[]) => days.reduce((n, d) => n + (d?.[key] ?? 0), 0);

export const SHIELD_MISSION: MissionDef = { id: 'days5', goal: WEEK_DAYS_GOAL, xp: 0, measure: (days) => days.filter(dayQualifies).length };

export const MISSION_POOL: MissionDef[] = [
  { id: 'lessons3', goal: 3, xp: 40, measure: sum('lessons') },
  { id: 'perfect2', goal: 2, xp: 40, measure: sum('perfect') },
  { id: 'answers150', goal: 150, xp: 40, measure: sum('answers') },
  { id: 'places30', goal: 30, xp: 60, measure: sum('places') },
  { id: 'tempo3', goal: 3, xp: 40, measure: sum('tempo') },
  { id: 'challenge3', goal: 3, xp: 40, measure: (days) => days.filter((d) => (d?.challenge ?? 0) > 0).length },
];

/** Small stable hash of the week key (same result on every device). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The three missions of the week that starts on `monday`. */
export function missionsFor(monday: string): MissionDef[] {
  const h = hash(monday);
  const n = MISSION_POOL.length;
  const a = h % n;
  const b = (a + 1 + ((h >>> 8) % (n - 1))) % n;
  return [SHIELD_MISSION, MISSION_POOL[a], MISSION_POOL[b]];
}

export interface MissionStatus {
  def: MissionDef;
  progress: number;
  done: boolean;
}

export interface WeekMissions {
  /** Monday of the week (also the key for claimed rewards). */
  week: string;
  /** Days left including today. */
  daysLeft: number;
  missions: MissionStatus[];
}

export function weekMissions(daily: Record<string, DayActivity>, today: string): WeekMissions {
  const week = weekStart(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i))
    .filter((d) => d <= today)
    .map((d) => daily[d]);
  const missions = missionsFor(week).map((def) => {
    const progress = Math.min(def.goal, def.measure(days));
    return { def, progress, done: progress >= def.goal };
  });
  return { week, daysLeft: 7 - days.length + 1, missions };
}

/** Claimed XP rewards per week (Monday → mission ids). */
export type MissionClaims = Record<string, MissionId[]>;

/**
 * Finished XP missions that have not paid out yet. The caller adds the XP and
 * stores the claims; old weeks are dropped so the record stays small.
 */
export function unclaimedMissions(daily: Record<string, DayActivity>, claims: MissionClaims | undefined, today: string): { week: string; ids: MissionId[]; xp: number } {
  const wm = weekMissions(daily, today);
  const have = new Set(claims?.[wm.week] ?? []);
  const fresh = wm.missions.filter((m) => m.done && m.def.xp > 0 && !have.has(m.def.id));
  return { week: wm.week, ids: fresh.map((m) => m.def.id), xp: fresh.reduce((n, m) => n + m.def.xp, 0) };
}

export function addClaims(claims: MissionClaims | undefined, week: string, ids: MissionId[]): MissionClaims {
  const next: MissionClaims = { ...(claims ?? {}), [week]: [...new Set([...(claims?.[week] ?? []), ...ids])] };
  for (const k of Object.keys(next).sort().slice(0, -6)) delete next[k];
  return next;
}

export function mergeClaims(a: MissionClaims | undefined, b: MissionClaims | undefined): MissionClaims | undefined {
  if (!a && !b) return undefined;
  let out: MissionClaims = { ...(a ?? {}) };
  for (const [week, ids] of Object.entries(b ?? {})) out = addClaims(out, week, ids);
  return out;
}

/** Missions finished between two states (for the result screens). */
export function missionsFinished(before: Record<string, DayActivity>, after: Record<string, DayActivity>, today: string): MissionStatus[] {
  const was = new Set(weekMissions(before, today).missions.filter((m) => m.done).map((m) => m.def.id));
  return weekMissions(after, today).missions.filter((m) => m.done && !was.has(m.def.id));
}

export const MISSION_IDS: MissionId[] = [SHIELD_MISSION.id, ...MISSION_POOL.map((m) => m.id)];
