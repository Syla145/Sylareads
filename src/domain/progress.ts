import type { ShareSetting } from './presence';
import { dayKey } from './dates';
import { updateStreak, xpForResult, XP, type DayActivity, type StreakState } from './gamification';
import { logAnswer, type MistakeLog } from './mistakes';
import type { PlacementOutcome } from './placement';
import { applyAnswer, introduce, raiseTo, settleNewItem, type ItemProgress, type Result } from './srs';
import type { SignView } from './signs';
import { applyTempoSession, type TempoContent, type TempoProgress, type TempoState } from './tempo';
import type { Lang } from './types';

/**
 * Persisted progress: one JSON document (spec section 13). Weak flags,
 * mastery states and levels are always computed, never stored.
 */
export const SCHEMA_VERSION = 1;

export interface LessonRecord {
  completedAt: number;
  times: number;
  bestCorrect: number;
  bestTotal: number;
  /** Skipped through placement ("Kann ich schon"), not played. */
  placed?: boolean;
}

export interface PracticeConfigStored {
  categories: string[];
  weakOnly: boolean;
  scope: 'learned' | 'all';
  prioritizeWeak: boolean;
  count: number;
}

export interface CourseProgress {
  startedAt: number;
  lastSessionAt: number | null;
  xp: number;
  lessons: Record<string, LessonRecord>;
  items: Record<string, ItemProgress>;
  /** "idA>idB" → how often idA was answered with idB's answer. */
  confusions: Record<string, number>;
  /** Last 200 graded results (C/R/W) for the accuracy figure. */
  recent: string;
  lastPracticeConfig?: PracticeConfigStored;
  /** Wrong answers per day (last week) for the Fehler-Review. */
  mistakes?: MistakeLog;
  /** Reading times and best scores from "Lesen auf Zeit" (absent until the first tempo session). */
  tempo?: TempoProgress;
}

export interface Profile {
  xp: number;
  streak: StreakState;
  daily: Record<string, DayActivity>;
  achievements: Record<string, number>;
  totalAnswers: number;
  /** Opt-in public card for "Wer ist gerade da" (absent = never chosen). */
  share?: ShareSetting;
}

/** How places are labelled on maps: native script, Latin script, or not at all. */
export type MapLabels = 'native' | 'latin' | 'none';

export interface Settings {
  uiLang: Lang;
  /** Labels on the explore map. */
  mapLabels?: MapLabels;
  /** Labels around the target in map tasks (off by default, the target itself is never labelled). */
  taskMapLabels?: MapLabels;
  /** Tempo settings of this device. */
  tempo?: TempoSettings;
  /** Schildansicht: names on drawn signs (default "mixed"). */
  signView?: SignView;
}

export interface TempoSettings {
  /** Seconds per task in timer mode (1–15). */
  seconds: number;
  /** How long a name is visible in flash mode, ms (500–2000). */
  flashMs: number;
  content?: TempoContent;
}

export interface ProgressRoot {
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
  lastExportAt: number | null;
  settings: Settings;
  profile: Profile;
  courses: Record<string, CourseProgress>;
}

export function emptyRoot(uiLang: Lang, now = Date.now()): ProgressRoot {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    lastExportAt: null,
    settings: { uiLang },
    profile: { xp: 0, streak: { current: 0, longest: 0, lastDay: null }, daily: {}, achievements: {}, totalAnswers: 0 },
    courses: {},
  };
}

export function emptyCourse(now = Date.now()): CourseProgress {
  return { startedAt: now, lastSessionAt: null, xp: 0, lessons: {}, items: {}, confusions: {}, recent: '' };
}

function withCourse(root: ProgressRoot, courseId: string, now: number, fn: (c: CourseProgress) => CourseProgress): ProgressRoot {
  const course = root.courses[courseId] ?? emptyCourse(now);
  return { ...root, updatedAt: now, courses: { ...root.courses, [courseId]: fn(course) } };
}

function addDaily(profile: Profile, today: string, delta: Partial<DayActivity>): Profile {
  const d = profile.daily[today] ?? { lessons: 0, answers: 0, xp: 0 };
  const next: DayActivity = {
    lessons: d.lessons + (delta.lessons ?? 0),
    answers: d.answers + (delta.answers ?? 0),
    xp: d.xp + (delta.xp ?? 0),
  };
  const daily = { ...profile.daily, [today]: next };
  // keep the last 400 days
  const keys = Object.keys(daily).sort();
  if (keys.length > 400) for (const k of keys.slice(0, keys.length - 400)) delete daily[k];
  const streak = updateStreak(profile.streak, today, next);
  return { ...profile, daily, streak };
}

function addXp(root: ProgressRoot, courseId: string, xp: number, today: string, extra: Partial<DayActivity> = {}): ProgressRoot {
  const profile = addDaily({ ...root.profile, xp: root.profile.xp + xp }, today, { ...extra, xp });
  const course = root.courses[courseId];
  return { ...root, profile, courses: course ? { ...root.courses, [courseId]: { ...course, xp: course.xp + xp } } : root.courses };
}

/** First learning card of an item seen. */
export function recordIntro(root: ProgressRoot, courseId: string, itemId: string, now = Date.now()): ProgressRoot {
  const today = dayKey(new Date(now));
  return withCourse(root, courseId, now, (c) => ({ ...c, items: { ...c.items, [itemId]: introduce(c.items[itemId], today, now) } }));
}

export interface AnswerInput {
  itemId: string;
  result: Result;
  /** Update long-term SRS state (first graded answer of the session, not a new lesson item). */
  applySrs: boolean;
  confusedWith?: string;
  /** false: not a mistake for the Fehler-Review (placement answers). */
  logMistake?: boolean;
}

export function recordAnswer(root: ProgressRoot, courseId: string, a: AnswerInput, now = Date.now()): ProgressRoot {
  const today = dayKey(new Date(now));
  let next = withCourse(root, courseId, now, (c) => {
    const items = a.applySrs ? { ...c.items, [a.itemId]: applyAnswer(c.items[a.itemId], a.result, today, now) } : c.items;
    const confusions = a.confusedWith
      ? { ...c.confusions, [`${a.itemId}>${a.confusedWith}`]: (c.confusions[`${a.itemId}>${a.confusedWith}`] ?? 0) + 1 }
      : c.confusions;
    const mistakes = a.logMistake === false ? c.mistakes : logAnswer(c.mistakes, a.itemId, a.result === 'W', today, now);
    return { ...c, items, confusions, recent: (c.recent + a.result).slice(-200), lastSessionAt: now, ...(mistakes ? { mistakes } : {}) };
  });
  next = { ...next, profile: { ...next.profile, totalAnswers: next.profile.totalAnswers + 1 } };
  return addXp(next, courseId, xpForResult(a.result), today, { answers: 1 });
}

/** End of a lesson: settle new items (box 2 if their last answer was right, else 1) and add the bonus. */
export function completeLesson(
  root: ProgressRoot,
  courseId: string,
  lessonId: string,
  info: { correct: number; total: number; newItems: { itemId: string; solid: boolean }[] },
  now = Date.now(),
): ProgressRoot {
  const today = dayKey(new Date(now));
  let next = withCourse(root, courseId, now, (c) => {
    const items = { ...c.items };
    for (const n of info.newItems) items[n.itemId] = settleNewItem(items[n.itemId], n.solid, today, now);
    const prev = c.lessons[lessonId];
    const better = !prev || info.correct / Math.max(1, info.total) >= prev.bestCorrect / Math.max(1, prev.bestTotal);
    const record: LessonRecord = {
      completedAt: now,
      times: (prev?.times ?? 0) + 1,
      bestCorrect: better ? info.correct : prev!.bestCorrect,
      bestTotal: better ? info.total : prev!.bestTotal,
    };
    return { ...c, items, lessons: { ...c.lessons, [lessonId]: record }, lastSessionAt: now };
  });
  const perfect = info.total > 0 && info.correct === info.total;
  next = addXp(next, courseId, XP.lessonComplete + (perfect ? XP.lessonPerfect : 0), today, { lessons: 1 });
  return next;
}

export function completePractice(root: ProgressRoot, courseId: string, answered: number, now = Date.now()): ProgressRoot {
  if (answered < 10) return root;
  return addXp(root, courseId, XP.practiceComplete, dayKey(new Date(now)));
}

/**
 * End of a tempo session. Learning boxes stay untouched (slow reading is never
 * punished while learning); reading times, best scores, confusions, XP and the
 * daily activity are recorded.
 */
export function recordTempo(
  root: ProgressRoot,
  courseId: string,
  s: TempoState,
  content: TempoContent,
  now = Date.now(),
): { root: ProgressRoot; newBest: boolean; prevBest: number } {
  const answered = s.answers.length;
  const { tempo, newBest, prevBest } = applyTempoSession(root.courses[courseId]?.tempo, s, content, now);
  if (!answered) return { root, newBest: false, prevBest };
  const today = dayKey(new Date(now));
  let next = withCourse(root, courseId, now, (c) => {
    const confusions = { ...c.confusions };
    let mistakes = c.mistakes;
    for (const a of s.answers) {
      if (a.timeout) continue; // too slow is not wrong
      mistakes = logAnswer(mistakes, a.itemId, !a.correct, today, now);
      if (a.correct || !a.pickedId) continue;
      const key = `${a.itemId}>${a.pickedId}`;
      confusions[key] = (confusions[key] ?? 0) + 1;
    }
    return { ...c, tempo, confusions, lastSessionAt: now, ...(mistakes ? { mistakes } : {}) };
  });
  next = { ...next, profile: { ...next.profile, totalAnswers: next.profile.totalAnswers + answered } };
  const correct = s.answers.filter((a) => a.correct).length;
  const xp = correct * XP.tempoCorrect + (answered >= 10 ? XP.practiceComplete : 0);
  return { root: addXp(next, courseId, xp, today, { answers: answered }), newBest, prevBest };
}

/**
 * End of a placement: raises items to the boxes of the outcome and marks the
 * lessons whose items are all known as placed. Existing lesson records stay.
 */
export function applyPlacement(root: ProgressRoot, courseId: string, outcome: PlacementOutcome, now = Date.now()): ProgressRoot {
  const today = dayKey(new Date(now));
  const next = withCourse(root, courseId, now, (c) => {
    const items = { ...c.items };
    for (const [id, box] of Object.entries(outcome.boxes)) items[id] = raiseTo(items[id], box, today, now);
    const lessons = { ...c.lessons };
    for (const id of outcome.placedLessons) {
      if (!lessons[id]) lessons[id] = { completedAt: now, times: 0, bestCorrect: 0, bestTotal: 0, placed: true };
    }
    return { ...c, items, lessons, lastSessionAt: now };
  });
  return outcome.total >= 10 ? addXp(next, courseId, XP.practiceComplete, today) : next;
}

/** Lessons actually played (placed ones do not count for achievements). */
export const playedLessons = (c: CourseProgress | undefined) => Object.values(c?.lessons ?? {}).filter((l) => !l.placed).length;

export function unlockAchievements(root: ProgressRoot, ids: string[], now = Date.now()): ProgressRoot {
  if (!ids.length) return root;
  const achievements = { ...root.profile.achievements };
  for (const id of ids) if (!achievements[id]) achievements[id] = now;
  return { ...root, profile: { ...root.profile, achievements } };
}

/** Items involved in a confusion that happened at least twice. */
export function confusedTwiceSet(c: CourseProgress | undefined): Set<string> {
  const out = new Set<string>();
  if (!c) return out;
  for (const [pair, n] of Object.entries(c.confusions)) {
    if (n < 2) continue;
    const [a, b] = pair.split('>');
    out.add(a);
    out.add(b);
  }
  return out;
}
