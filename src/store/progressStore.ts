import { create } from 'zustand';
import { newlyUnlocked } from '../domain/achievements';
import type { CourseIndex } from '../domain/courseIndex';
import type { PlacementOutcome } from '../domain/placement';
import {
  applyPlacement,
  completeLesson,
  completePractice,
  emptyCourse,
  emptyRoot,
  recordAnswer,
  recordIntro,
  recordTempo,
  unlockAchievements,
  type AnswerInput,
  type MapLabels,
  type PracticeConfigStored,
  type ProgressRoot,
  type TempoSettings,
} from '../domain/progress';
import type { TempoContent, TempoState } from '../domain/tempo';
import type { Lang } from '../domain/types';
import { backupCurrent, clearAll, loadRoot, saveRoot } from './persistence';

interface ProgressState {
  root: ProgressRoot;
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
  finishTempo: (courseId: string, s: TempoState, content: TempoContent, index: CourseIndex) => { unlocked: string[]; newBest: boolean; prevBest: number };
  replaceAll: (root: ProgressRoot) => void;
  /** Progress merged with the cloud copy (no backup: nothing is lost by a merge). */
  applyMerged: (root: ProgressRoot) => void;
  markExported: () => void;
  reset: () => void;
}

export const DEFAULT_TEMPO: TempoSettings = { seconds: 5, flashMs: 1000 };

export const useProgress = create<ProgressState>((set, get) => {
  const commit = (root: ProgressRoot, immediate = false) => {
    set({ root });
    saveRoot(root, immediate);
  };
  const unlock = (courseId: string, index: CourseIndex | null) => {
    const ids = newlyUnlocked(get().root, courseId, index);
    if (ids.length) commit(unlockAchievements(get().root, ids), true);
    return ids;
  };
  return {
    root: loadRoot(),
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
      commit(root, true);
    },
    applyMerged: (root) => commit(root, true),
    markExported: () => commit({ ...get().root, lastExportAt: Date.now() }, true),
    reset: () => {
      backupCurrent(get().root);
      clearAll();
      commit(emptyRoot(get().root.settings.uiLang), true);
    },
  };
});
