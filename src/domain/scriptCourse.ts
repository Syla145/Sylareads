import { SCRIPT_ENTRIES, SCRIPT_LESSONS, type ScriptEntry, type ScriptLesson, type ScriptSample } from '../content/scripts/data';
import { dayKey } from './dates';
import { isDue, isWeak, priority, type ItemProgress, type Result } from './srs';
import { pick, shuffle, type Rng } from './taskFactory';
import { taskKey } from './tasks';

/**
 * Kurs „Schriften erkennen“: logic without React. Progress lives in the normal
 * progress document under the course id "scripts" (items "scripts:<name>"),
 * so SRS, XP, streak, the Fehler-Review and online sync work as everywhere.
 */

export const SCRIPTS_COURSE_ID = 'scripts';
export const SCRIPT_BY_ID = new Map(SCRIPT_ENTRIES.map((e) => [e.id, e]));

export type ScriptTask =
  | { key: string; kind: 'intro'; itemId: string }
  /** A name on a sign: where are you? Options are script ids (labelled with their places). */
  | { key: string; kind: 'where'; itemId: string; sample: ScriptSample; options: string[] }
  /** Several names: which one is from <place>? Options are script ids, each shown with one sample. */
  | { key: string; kind: 'pick'; itemId: string; options: { itemId: string; sample: ScriptSample }[] };

export type GradedScriptTask = Exclude<ScriptTask, { kind: 'intro' }>;

type Items = Record<string, ItemProgress | undefined>;

const entry = (id: string) => SCRIPT_BY_ID.get(id)!;

/**
 * Distractors, most useful first: confusable scripts, then scripts of the same
 * lesson (the same family), known ones before unknown ones; unrelated known
 * scripts only when nothing else is left.
 */
function distractors(target: ScriptEntry, pool: Set<string>, rng: Rng, n: number): string[] {
  const lesson = SCRIPT_LESSONS.find((l) => l.newIds.includes(target.id));
  const family = new Set([...(lesson?.newIds ?? []), ...(lesson?.reviewIds ?? [])]);
  // Never two answers for the same place (e.g. Serbian Cyrillic next to Croatian Latin).
  const clash = (id: string) => id === target.id || !!target.overlaps?.includes(id) || !!entry(id).overlaps?.includes(target.id);
  const all = SCRIPT_ENTRIES.map((e) => e.id).filter((id) => !clash(id));
  const rank = (id: string) =>
    (target.confusable.includes(id) ? 0 : family.has(id) ? 2 : 4) + (pool.has(id) ? 0 : 1) + (!target.confusable.includes(id) && !family.has(id) && !pool.has(id) ? 2 : 0);
  return shuffle(all, rng)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, n);
}

function whereTask(id: string, pool: Set<string>, rng: Rng): GradedScriptTask {
  const e = entry(id);
  return { key: taskKey('sw'), kind: 'where', itemId: id, sample: pick(e.samples, rng)!, options: shuffle([id, ...distractors(e, pool, rng, 3)], rng) };
}

function pickTask(id: string, pool: Set<string>, rng: Rng): GradedScriptTask {
  const e = entry(id);
  const ids = shuffle([id, ...distractors(e, pool, rng, 2)], rng);
  return { key: taskKey('sp'), kind: 'pick', itemId: id, options: ids.map((x) => ({ itemId: x, sample: pick(entry(x).samples, rng)! })) };
}

/** A fresh task of the same kind for re-asking (another sample, other options). */
export function retask(task: GradedScriptTask, pool: Set<string>, rng: Rng): GradedScriptTask {
  return task.kind === 'where' ? whereTask(task.itemId, pool, rng) : pickTask(task.itemId, pool, rng);
}

const learnedIds = (items: Items) => SCRIPT_ENTRIES.map((e) => e.id).filter((id) => (items[id]?.box ?? 0) >= 1);

/** Pool for options in a lesson: everything known plus this lesson's scripts. */
export function lessonPool(lesson: ScriptLesson, items: Items): Set<string> {
  return new Set([...learnedIds(items), ...lesson.newIds, ...(lesson.reviewIds ?? [])]);
}

/**
 * A lesson: every new script is introduced and asked once at once; then a mixed
 * block with both task kinds per new script and one question per review script.
 * Scripts already learned elsewhere skip their card.
 */
export function buildScriptLesson(lesson: ScriptLesson, items: Items, rng: Rng): ScriptTask[] {
  const pool = lessonPool(lesson, items);
  const tasks: ScriptTask[] = [];
  for (const id of lesson.newIds) {
    if ((items[id]?.box ?? 0) === 0) tasks.push({ key: taskKey('si'), kind: 'intro', itemId: id });
    tasks.push(whereTask(id, pool, rng));
  }
  const block: ScriptTask[] = [
    ...lesson.newIds.flatMap((id) => [whereTask(id, pool, rng), pickTask(id, pool, rng)]),
    ...(lesson.reviewIds ?? []).map((id) => whereTask(id, pool, rng)),
  ];
  return [...tasks, ...spread(shuffle(block, rng))];
}

/** Avoids the same script twice in a row where possible. */
function spread(tasks: ScriptTask[]): ScriptTask[] {
  const out = [...tasks];
  for (let i = 1; i < out.length; i++) {
    if (out[i].itemId !== out[i - 1].itemId) continue;
    const j = out.findIndex((t, k) => k > i && t.itemId !== out[i - 1].itemId);
    if (j > 0) [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Practice: learned scripts by SRS priority (due and weak first), both task kinds mixed. */
export function buildScriptPractice(items: Items, count: number, rng: Rng, today = dayKey(), only?: string[]): GradedScriptTask[] {
  const learned = only?.length ? only.filter((id) => SCRIPT_BY_ID.has(id)) : learnedIds(items);
  if (!learned.length) return [];
  const pool = new Set(learnedIds(items).concat(learned));
  const score = (id: string) => priority(items[id], today, isWeak(items[id]), rng()) + (isDue(items[id], today) ? 1 : 0);
  const ranked = [...learned].sort((a, b) => score(b) - score(a));
  const chosen: string[] = [];
  while (chosen.length < count) chosen.push(...ranked.slice(0, Math.min(ranked.length, count - chosen.length)));
  return spread(shuffle(chosen, rng).map((id, i) => (i % 3 === 2 ? pickTask(id, pool, rng) : whereTask(id, pool, rng)))) as GradedScriptTask[];
}

export const nextScriptLesson = (lessons: Record<string, unknown> | undefined) => SCRIPT_LESSONS.find((l) => !lessons?.[l.id]);

// ---------------------------------------------------------------- session engine

export interface ScriptAnswer {
  itemId: string;
  result: Result;
  /** Script id chosen instead (confusion). */
  pickedId?: string;
}

export interface ScriptSessionState {
  tasks: ScriptTask[];
  index: number;
  phase: 'answer' | 'feedback' | 'done';
  answers: ScriptAnswer[];
  /** First graded result per script in this session. */
  first: Record<string, Result>;
  reasked: string[];
  lastPicked: string | null;
  plannedGraded: number;
}

export function startScriptSession(tasks: ScriptTask[]): ScriptSessionState {
  return {
    tasks,
    index: 0,
    phase: tasks.length ? 'answer' : 'done',
    answers: [],
    first: {},
    reasked: [],
    lastPicked: null,
    plannedGraded: tasks.filter((t) => t.kind !== 'intro').length,
  };
}

/** Answers the current task with a script id. A wrong answer comes back once, three tasks later, with another sample. */
export function answerScript(s: ScriptSessionState, pickedId: string | null, again: (t: GradedScriptTask) => GradedScriptTask): ScriptSessionState {
  const task = s.tasks[s.index];
  if (!task || task.kind === 'intro' || s.phase !== 'answer') return s;
  const correct = pickedId === task.itemId;
  const result: Result = correct ? 'C' : 'W';
  const next: ScriptSessionState = {
    ...s,
    phase: 'feedback',
    lastPicked: pickedId,
    answers: [...s.answers, { itemId: task.itemId, result, ...(pickedId && !correct ? { pickedId } : {}) }],
    first: s.first[task.itemId] ? s.first : { ...s.first, [task.itemId]: result },
  };
  if (!correct && !s.reasked.includes(task.itemId)) {
    const tasks = [...s.tasks];
    tasks.splice(Math.min(s.index + 4, tasks.length), 0, again(task));
    next.tasks = tasks;
    next.reasked = [...s.reasked, task.itemId];
  }
  return next;
}

export function nextScript(s: ScriptSessionState): ScriptSessionState {
  const index = s.index + 1;
  return { ...s, index, phase: index >= s.tasks.length ? 'done' : 'answer', lastPicked: null };
}

export function scriptScore(s: ScriptSessionState): { correct: number; total: number } {
  return { correct: s.answers.filter((a) => a.result === 'C').length, total: s.answers.length };
}

/** New scripts of a lesson that were never answered wrong count as solid (box 2). */
export function solidNew(s: ScriptSessionState, newIds: string[]): { itemId: string; solid: boolean }[] {
  return newIds
    .filter((id) => s.answers.some((a) => a.itemId === id))
    .map((id) => ({ itemId: id, solid: !s.answers.some((a) => a.itemId === id && a.result === 'W') }));
}

/** Scripts recognised reliably (box ≥ 3). */
export const scriptsKnown = (items: Items) => SCRIPT_ENTRIES.filter((e) => (items[e.id]?.box ?? 0) >= 3).length;
export const scriptsStarted = (items: Items) => SCRIPT_ENTRIES.filter((e) => (items[e.id]?.box ?? 0) >= 1).length;
