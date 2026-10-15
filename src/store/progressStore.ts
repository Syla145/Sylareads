import type { ChallengeScore, DailyAnswer } from '../domain/challenge';
import { cleanName, CONSENT_VERSION } from '../domain/presence';
import { create } from 'zustand';
import { newlyUnlocked, SECRET_ID } from '../domain/achievements';
import type { CourseIndex } from '../domain/courseIndex';
import type { PlacementOutcome } from '../domain/placement';
import {
  applyPlacement,
  completeLesson,
  completePractice,
  emptyCourse,
  emptyRoot,
  recordAnswer,
  recordDailyResult,
  recordIntro,
  recordTempo,
  unlockAchievements,
  type AnswerInput,
  type MapLabels,
  type PracticeConfigStored,
  type ProgressRoot,
  type TempoSettings,
} from '../domain/progress';
import type { SignView } from '../domain/signs';
import type { TempoContent, TempoState } from '../domain/tempo';
import type { Lang } from '../domain/types';
import { backupCurrent, dropBackup, loadRoot, markReplaced, onForeignProgress, onStorageProblem, readBackup, saveRoot, type StorageProblem } from './persistence';
import { withNote } from '../domain/notes';
import { mergeRoots, sameProgress } from '../domain/merge';
import { setTallyDevice } from '../domain/tally';

interface ProgressState {
  root: ProgressRoot;
  /** Something is wrong with the stored progress on this device (shown as a banner). */
  storageProblem: StorageProblem;
  /** Counts finished steps (lesson, practice, challenge, settings): online saving uploads soon after one. */
  milestones: number;
  setLang: (lang: Lang) => void;
  setMapLabels: (which: 'mapLabels' | 'taskMapLabels', value: MapLabels) => void;
  startCourse: (courseId: string) => void;
  intro: (courseId: string, itemId: string) => void;
  answer: (courseId: string, a: AnswerInput) => void;
  finishLesson: (
    courseId: string,
    lessonId: string,
    info: { correct: number; total: number; newItems: { itemId: string; solid: boolean }[] },
    index: CourseIndex | null,
  ) => string[];
  finishPractice: (courseId: string, answered: number, index: CourseIndex | null) => string[];
  savePracticeConfig: (courseId: string, config: PracticeConfigStored) => void;
  finishPlacement: (courseId: string, outcome: PlacementOutcome, index: CourseIndex) => string[];
  setTempoSettings: (patch: Partial<TempoSettings>) => void;
  setSignView: (view: SignView) => void;
  setAskMeaning: (on: boolean) => void;
  /** Own note (Eselsbrücke) for an item; empty text deletes it. */
  setNote: (courseId: string, itemId: string, text: string) => void;
  /** Daily Challenge: saved after every answer (with the answers while it can still go on). */
  saveDaily: (courseId: string, day: string, score: ChallengeScore, done: boolean, ans?: DailyAnswer[]) => void;
  /** Opt-in public card for "Wer ist gerade da". */
  setShare: (on: boolean, name: string) => void;
  /** Easter egg; true when it was new. */
  unlockSecret: () => boolean;
  /** Fills in achievements already earned (silently, e.g. when a course is opened). */
  syncAchievements: (courseId: string, index: CourseIndex | null) => void;
  finishTempo: (courseId: string, s: TempoState, content: TempoContent, index: CourseIndex) => { unlocked: string[]; newBest: boolean; prevBest: number };
  replaceAll: (root: ProgressRoot) => void;
  /** Brings back the state saved before the last reset or import (the current one becomes the backup). */
  restoreBackup: () => boolean;
  /** Progress merged with the cloud copy (no backup: nothing is lost by a merge). */
  applyMerged: (root: ProgressRoot) => void;
  markExported: () => void;
  reset: () => void;
}

export const DEFAULT_TEMPO: TempoSettings = { seconds: 5, flashMs: 1000 };

const loaded = loadRoot();

/** This browser's id for the XP counters (tally.ts); never synced. */
function deviceId(): string {
  const key = 'sylareads.device';
  try {
    let id = localStorage.getItem(key);
    if (!id || !/^[a-z0-9]{6,20}$/.test(id)) {
      id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'local';
  }
}
setTallyDevice(deviceId());

export const useProgress = create<ProgressState>((set, get) => {
  const commit = (root: ProgressRoot, immediate = false, milestone = immediate) => {
    set(milestone ? { root, milestones: get().milestones + 1 } : { root });
    saveRoot(root, immediate);
  };
  const unlock = (courseId: string, index: CourseIndex | null) => {
    const ids = newlyUnlocked(get().root, courseId, index);
    if (ids.length) commit(unlockAchievements(get().root, ids), true);
    return ids;
  };
  return {
    root: loaded.root,
    storageProblem: loaded.problem,
    milestones: 0,
    setLang: (uiLang) => commit({ ...get().root, settings: { ...get().root.settings, uiLang } }, true),
    setMapLabels: (which, value) => commit({ ...get().root, settings: { ...get().root.settings, [which]: value } }, true),
    startCourse: (courseId) => {
      const root = get().root;
      if (!root.courses[courseId]) commit({ ...root, courses: { ...root.courses, [courseId]: emptyCourse() } }, true);
    },
    intro: (courseId, itemId) => commit(recordIntro(get().root, courseId, itemId)),
    answer: (courseId, a) => commit(recordAnswer(get().root, courseId, a)),
    finishLesson: (courseId, lessonId, info, index) => {
      commit(completeLesson(get().root, courseId, lessonId, info), true);
      return unlock(courseId, index);
    },
    finishPractice: (courseId, answered, index) => {
      commit(completePractice(get().root, courseId, answered), true);
      return unlock(courseId, index);
    },
    savePracticeConfig: (courseId, config) => {
      const root = get().root;
      const course = root.courses[courseId] ?? emptyCourse();
      commit({ ...root, courses: { ...root.courses, [courseId]: { ...course, lastPracticeConfig: config } } });
    },
    finishPlacement: (courseId, outcome, index) => {
      commit(applyPlacement(get().root, courseId, outcome), true);
      return unlock(courseId, index);
    },
    unlockSecret: () => {
      if (get().root.profile.achievements[SECRET_ID]) return false;
      commit(unlockAchievements(get().root, [SECRET_ID]), true);
      return true;
    },
    syncAchievements: (courseId, index) => {
      const ids = newlyUnlocked(get().root, courseId, index);
      if (ids.length) commit(unlockAchievements(get().root, ids), true);
    },
    setNote: (courseId, itemId, text) => {
      const root = get().root;
      const course = root.courses[courseId] ?? emptyCourse();
      const now = Date.now();
      commit({ ...root, updatedAt: now, courses: { ...root.courses, [courseId]: { ...course, notes: withNote(course.notes, itemId, text, now) } } }, true);
    },
    saveDaily: (courseId, day, score, done, ans) => commit(recordDailyResult(get().root, courseId, day, score, done, Date.now(), ans), true, done),
    setShare: (on, name) => {
      const root = get().root;
      const share = { on, name: cleanName(name), at: Date.now(), c: CONSENT_VERSION };
      commit({ ...root, updatedAt: share.at, profile: { ...root.profile, share } }, true);
    },
    setSignView: (signView) => commit({ ...get().root, settings: { ...get().root.settings, signView } }, true),
    setAskMeaning: (on) => {
      const { askMeaning: _old, ...rest } = get().root.settings;
      void _old;
      commit({ ...get().root, settings: on ? { ...rest, askMeaning: true } : rest }, true);
    },
    setTempoSettings: (patch) => {
      const root = get().root;
      const tempo = { ...DEFAULT_TEMPO, ...root.settings.tempo, ...patch };
      commit({ ...root, settings: { ...root.settings, tempo } }, true);
    },
    finishTempo: (courseId, s, content, index) => {
      const r = recordTempo(get().root, courseId, s, content);
      commit(r.root, true);
      return { unlocked: unlock(courseId, index), newBest: r.newBest, prevBest: r.prevBest };
    },
    replaceAll: (root) => {
      backupCurrent(get().root);
      markReplaced();
      commit(root, true);
    },
    restoreBackup: () => {
      const backup = readBackup();
      if (!backup) return false;
      const current = get().root;
      dropBackup();
      backupCurrent(current);
      markReplaced();
      commit({ ...backup.root, settings: current.settings }, true);
      return true;
    },
    applyMerged: (root) => commit(root, true, false),
    markExported: () => commit({ ...get().root, lastExportAt: Date.now() }, true),
    reset: () => {
      backupCurrent(get().root);
      markReplaced();
      commit(emptyRoot(get().root.settings.uiLang), true);
    },
  };
});

onStorageProblem((storageProblem) => {
  if (useProgress.getState().storageProblem !== storageProblem) useProgress.setState({ storageProblem });
});

/**
 * Another tab of this app wrote progress. A replaced document (reset, import)
 * is adopted as it is; otherwise both are merged so nothing learned in either
 * tab is lost. Settings: those of the tab that changed something last.
 */
onForeignProgress((foreign, replaced, fromOtherTab) => {
  const current = useProgress.getState().root;
  if (replaced) {
    useProgress.setState({ root: foreign });
    return foreign;
  }
  const merged = { ...mergeRoots(current, foreign), settings: fromOtherTab ? foreign.settings : current.settings };
  const keep = sameProgress(merged, foreign) && JSON.stringify(merged.settings) === JSON.stringify(foreign.settings) ? foreign : merged;
  if (!sameProgress(keep, current) || keep.settings !== current.settings) useProgress.setState({ root: keep });
  return keep;
});
