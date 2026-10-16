import type { Result } from './srs';

/** XP measures activity, never skill (spec section 10). */
export const XP = {
  correct: 2,
  retry: 1,
  wrong: 0,
  lessonComplete: 5,
  lessonPerfect: 5,
  practiceComplete: 3,
  /** Per correct answer in a tempo session (they come fast, so less than in practice). */
  tempoCorrect: 1,
} as const;

export function xpForResult(r: Result): number {
  return r === 'C' ? XP.correct : r === 'R' ? XP.retry : XP.wrong;
}

/** Total XP needed to reach level n: 25 · n · (n − 1). */
export function xpForLevel(level: number): number {
  return 25 * level * (level - 1);
}

/** Level 100 is the last one (247 500 XP). */
export const LEVEL_CAP = 100;

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < LEVEL_CAP && xpForLevel(level + 1) <= xp) level++;
  return level;
}

/** Progress inside the current level; at level 100 the bar stays full (`span` 0 = done). */
export function levelProgress(xp: number): { level: number; into: number; span: number } {
  const level = levelFromXp(xp);
  if (level >= LEVEL_CAP) return { level, into: 0, span: 0 };
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, into: xp - base, span: next - base };
}

export interface DayActivity {
  lessons: number;
  answers: number;
  xp: number;
  /** Lessons finished without a mistake (Wochenmissionen). */
  perfect?: number;
  /** Place names read correctly. */
  places?: number;
  /** Tempo rounds of at least 10 names. */
  tempo?: number;
  /** Daily challenge finished (0 or 1). */
  challenge?: number;
}

export interface StreakState {
  current: number;
  longest: number;
  lastDay: string | null;
}
