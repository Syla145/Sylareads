import { tallyFrom } from '../domain/tally';
import { emptyCourse, emptyRoot, SCHEMA_VERSION, type MapLabels, type ProgressRoot, type TempoSettings } from '../domain/progress';
import { clampFlash, clampSeconds } from '../domain/tempo';
import type { Lang } from '../domain/types';
import { shareOf } from '../domain/presence';
import { dailyOf } from '../domain/challenge';
import { notesOf } from '../domain/notes';
import { dayActivityOf, missionClaimsOf, isObj, itemOf, lessonOf, mistakesOf, numberOf, practiceConfigOf, recordOf, tempoOf } from './validate';

/**
 * Persistence: one versioned JSON document in localStorage (a year of daily
 * use is ≈ 500 KB, far below the ~5 MB limit). Every read and write is
 * wrapped, so the app keeps working in memory where storage is blocked.
 *
 * Several tabs share the document: before a tab writes, it merges what
 * another tab wrote in the meantime, and it follows other tabs' writes live
 * (the "storage" event), so no tab overwrites another one's progress.
 */
const STORAGE_KEY = 'sylareads.progress';
const BACKUP_KEY = 'sylareads.backup';
const CORRUPT_PREFIX = `${STORAGE_KEY}.corrupt.`;
/** Set when a tab replaced the document (reset, import, other account): other tabs adopt it instead of merging. */
const REPLACED_KEY = 'sylareads.replacedAt';
/** Set when a tab deleted everything on this device: other tabs reload. */
const WIPED_KEY = 'sylareads.wipedAt';
/** Backups and unreadable copies are removed after this time. */
const KEEP_COPIES_MS = 30 * 24 * 3600 * 1000;

const memory = new Map<string, string>();

function getItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function setItem(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    memory.set(key, value);
    return false;
  }
}

function removeItem(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* blocked */
  }
  memory.delete(key);
}

function storageKeys(): string[] {
  try {
    return Object.keys(window.localStorage);
  } catch {
    return [...memory.keys()];
  }
}

/** True when this browser can store anything at all (false in sandboxed previews). */
const storageWorks = (() => {
  try {
    const k = 'sylareads.probe';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
})();

function defaultLang(): Lang {
  try {
    return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Brings any stored or imported document to the current schema. Unknown,
 * missing or broken fields fall back to defaults or are dropped, so a partly
 * broken file never crashes the app. Future schema versions add one step per
 * version here.
 */
export function migrate(raw: unknown): ProgressRoot {
  if (!isObj(raw)) throw new Error('not-an-object');
  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version > SCHEMA_VERSION) throw new Error('newer-version');
  const settings = isObj(raw.settings) ? raw.settings : {};
  const uiLang: Lang = settings.uiLang === 'de' || settings.uiLang === 'en' ? settings.uiLang : defaultLang();
  const base = emptyRoot(uiLang, typeof raw.createdAt === 'number' ? raw.createdAt : Date.now());
  const profile = isObj(raw.profile) ? raw.profile : {};
  const streak = isObj(profile.streak) ? profile.streak : {};
  const courses = recordOf(raw.courses, (c): ProgressRoot['courses'][string] | undefined => {
    if (!isObj(c)) return undefined;
    const empty = emptyCourse(typeof c.startedAt === 'number' ? c.startedAt : Date.now());
    const mistakes = mistakesOf(c.mistakes);
    const daily = dailyOf(c.daily);
    const notes = notesOf(c.notes);
    return {
      ...empty,
      lastSessionAt: typeof c.lastSessionAt === 'number' ? c.lastSessionAt : null,
      xp: numberOf(c.xp) ?? 0,
      lessons: recordOf(c.lessons, lessonOf),
      items: recordOf(c.items, itemOf),
      confusions: recordOf(c.confusions, numberOf),
      recent: typeof c.recent === 'string' ? c.recent.slice(-200) : '',
      lastPracticeConfig: practiceConfigOf(c.lastPracticeConfig),
      ...(isObj(c.tempo) ? { tempo: tempoOf(c.tempo) } : {}),
      ...(mistakes ? { mistakes } : {}),
      ...(daily ? { daily } : {}),
      ...(notes ? { notes } : {}),
    };
  });
  const labels = (v: unknown): MapLabels | undefined => (v === 'native' || v === 'latin' || v === 'none' ? v : undefined);
  const tempo = isObj(settings.tempo) ? tempoSettingsOf(settings.tempo) : undefined;
  const signView = settings.signView === 'off' || settings.signView === 'mixed' || settings.signView === 'always' ? settings.signView : undefined;
  const share = shareOf(profile.share);
  const tally = tallyFrom(profile.tally);
  const missions = missionClaimsOf(profile.missions);
  return {
    ...base,
    settings: { uiLang, mapLabels: labels(settings.mapLabels), taskMapLabels: labels(settings.taskMapLabels), ...(tempo ? { tempo } : {}), ...(signView ? { signView } : {}), ...(settings.askMeaning === true ? { askMeaning: true } : {}) },
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    lastExportAt: typeof raw.lastExportAt === 'number' ? raw.lastExportAt : null,
    profile: {
      xp: numberOf(profile.xp) ?? 0,
      streak: {
        current: numberOf(streak.current) ?? 0,
        longest: numberOf(streak.longest) ?? 0,
        lastDay: typeof streak.lastDay === 'string' ? streak.lastDay : null,
      },
      daily: recordOf(profile.daily, dayActivityOf),
      achievements: recordOf(profile.achievements, numberOf),
      totalAnswers: numberOf(profile.totalAnswers) ?? 0,
      ...(tally ? { tally } : {}),
      ...(share ? { share } : {}),
      ...(missions ? { missions } : {}),
    },
    courses,
  };
}

function tempoSettingsOf(t: Record<string, unknown>): TempoSettings {
  const content = t.content === 'letters' || t.content === 'places' || t.content === 'map' ? t.content : undefined;
  return { seconds: clampSeconds(Number(t.seconds)), flashMs: clampFlash(Number(t.flashMs)), ...(content ? { content } : {}) };
}

/* ---------- Reading and writing ---------- */

/**
 * Why the stored progress could not be used:
 * - corrupt: unreadable (a copy is kept and can be downloaded),
 * - newer: written by a newer version of the app (nothing is written until it is reloaded),
 * - full: the browser storage is full, progress is only kept until the page is closed.
 */
export type StorageProblem = 'corrupt' | 'newer' | 'full' | null;

/** The text this tab last read or wrote (another value in storage = another tab wrote). */
let lastText: string | null = null;
let lastReplaced: string | null = null;
/** Data from a newer app version: never overwrite it. */
let blocked = false;
let problemListener: ((p: StorageProblem) => void) | null = null;

/** Called for another tab's progress: returns what this tab should keep (and write, if different). */
type ForeignHandler = (foreign: ProgressRoot, replaced: boolean, fromOtherTab: boolean) => ProgressRoot;
let foreignHandler: ForeignHandler | null = null;

export function onStorageProblem(fn: (p: StorageProblem) => void) {
  problemListener = fn;
}

export function onForeignProgress(fn: ForeignHandler) {
  foreignHandler = fn;
}

const parse = (text: string): ProgressRoot | null => {
  try {
    return migrate(JSON.parse(text));
  } catch {
    return null;
  }
};

export function loadRoot(): { root: ProgressRoot; problem: StorageProblem } {
  cleanupCopies();
  const text = getItem(STORAGE_KEY);
  lastText = text;
  lastReplaced = getItem(REPLACED_KEY);
  if (!text) return { root: emptyRoot(defaultLang()), problem: null };
  try {
    return { root: migrate(JSON.parse(text)), problem: null };
  } catch (e) {
    if ((e as Error).message === 'newer-version') {
      // An older app version must not overwrite progress it cannot read.
      blocked = true;
      return { root: emptyRoot(defaultLang()), problem: 'newer' };
    }
    // Keep the unreadable document instead of silently overwriting it.
    setItem(`${CORRUPT_PREFIX}${Date.now()}`, text);
    return { root: emptyRoot(defaultLang()), problem: 'corrupt' };
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: ProgressRoot | null = null;

export function saveRoot(root: ProgressRoot, immediate = false) {
  pending = root;
  if (immediate) return flush();
  if (timer) return;
  timer = setTimeout(flush, 500);
}

export function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  let root = pending;
  pending = null;
  if (!root || blocked) return;
  // Another tab wrote since this one last read: merge (or adopt) that first.
  const stored = getItem(STORAGE_KEY);
  if (foreignHandler && stored !== null && stored !== lastText) {
    const foreign = parse(stored);
    const replaced = getItem(REPLACED_KEY);
    if (foreign) root = foreignHandler(foreign, replaced !== lastReplaced, false);
    lastReplaced = replaced;
  }
  write(root);
}

function write(root: ProgressRoot) {
  const text = JSON.stringify(root);
  let ok = setItem(STORAGE_KEY, text);
  if (!ok && storageWorks) {
    // Full: make room by dropping the old copies, then try once more.
    for (const k of storageKeys()) if (k.startsWith(CORRUPT_PREFIX) || k === BACKUP_KEY) removeItem(k);
    ok = setItem(STORAGE_KEY, text);
  }
  // Without any storage (sandbox) the copy in memory is the stored one.
  if (ok || !storageWorks) lastText = text;
  if (storageWorks) problemListener?.(ok ? null : 'full');
}

/** Follows the writes of other tabs. Call once at app start. */
export function installFlushHandlers() {
  try {
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === WIPED_KEY && e.newValue) {
        window.location.reload();
        return;
      }
      if (e.key !== STORAGE_KEY || !e.newValue || e.newValue === lastText || blocked) return;
      const foreign = parse(e.newValue);
      const replaced = getItem(REPLACED_KEY);
      const isReplace = replaced !== lastReplaced;
      lastReplaced = replaced;
      lastText = e.newValue;
      if (!foreign || !foreignHandler) return;
      const keep = foreignHandler(foreign, isReplace, true);
      // This tab had changes the other one did not have yet: write the merged document.
      if (keep !== foreign) saveRoot(keep);
    });
    navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    /* non-browser environment */
  }
}

/** Tells other tabs that the next write replaces the document (they adopt it instead of merging). */
export function markReplaced() {
  lastReplaced = String(Date.now());
  setItem(REPLACED_KEY, lastReplaced);
}

/* ---------- Export, import, backups ---------- */

export function exportJson(root: ProgressRoot): string {
  return JSON.stringify({ app: 'sylareads', exportedAt: new Date().toISOString(), ...root }, null, 2);
}

export interface ImportPreview {
  root: ProgressRoot;
  courses: number;
  xp: number;
  lessons: number;
}

export function parseImport(text: string): ImportPreview {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('invalid-json');
  }
  if (!isObj(data) || (data.app !== undefined && data.app !== 'sylareads') || !('courses' in data)) throw new Error('not-sylareads');
  const root = migrate(data);
  return {
    root,
    courses: Object.keys(root.courses).length,
    xp: root.profile.xp,
    lessons: Object.values(root.courses).reduce((s, c) => s + Object.keys(c.lessons).length, 0),
  };
}

/** Keeps the current state as a backup (30 days) before a reset or import replaces it. */
export function backupCurrent(root: ProgressRoot) {
  if (!Object.keys(root.courses).length && !root.profile.xp) return;
  setItem(BACKUP_KEY, JSON.stringify({ backupAt: Date.now(), root }));
}

export interface Backup {
  at: number;
  root: ProgressRoot;
}

export function readBackup(): Backup | null {
  const text = getItem(BACKUP_KEY);
  if (!text) return null;
  try {
    const data = JSON.parse(text) as unknown;
    if (isObj(data) && typeof data.backupAt === 'number') return { at: data.backupAt, root: migrate(data.root) };
    return { at: Date.now(), root: migrate(data) };
  } catch {
    return null;
  }
}

export function dropBackup() {
  removeItem(BACKUP_KEY);
}

/** The newest unreadable copy (to download it), if any. */
export function corruptCopy(): { at: number; text: string } | null {
  const keys = storageKeys()
    .filter((k) => k.startsWith(CORRUPT_PREFIX))
    .sort();
  const key = keys[keys.length - 1];
  const text = key ? getItem(key) : null;
  return key && text ? { at: Number(key.slice(CORRUPT_PREFIX.length)) || 0, text } : null;
}

/** Old backups and unreadable copies go after 30 days; only the newest unreadable copy is kept. */
function cleanupCopies(now = Date.now()) {
  const keys = storageKeys();
  const corrupt = keys.filter((k) => k.startsWith(CORRUPT_PREFIX)).sort();
  corrupt.forEach((k, i) => {
    const at = Number(k.slice(CORRUPT_PREFIX.length)) || 0;
    if (i < corrupt.length - 1 || now - at > KEEP_COPIES_MS) removeItem(k);
  });
  const backup = getItem(BACKUP_KEY);
  if (backup) {
    try {
      const data = JSON.parse(backup) as unknown;
      if (!isObj(data) || typeof data.backupAt !== 'number') {
        // A backup from before backups had a date: it expires 30 days from now.
        setItem(BACKUP_KEY, JSON.stringify({ backupAt: now, root: data }));
      } else if (now - data.backupAt > KEEP_COPIES_MS) removeItem(BACKUP_KEY);
    } catch {
      removeItem(BACKUP_KEY);
    }
  }
  if (getItem(WIPED_KEY)) removeItem(WIPED_KEY);
}

/** Deletes everything Sylareads stored in this browser (progress, backups, settings, names) and tells other tabs. */
export function wipeDevice() {
  if (timer) clearTimeout(timer);
  timer = null;
  pending = null;
  blocked = true; // nothing may be written after this
  for (const k of storageKeys()) if (k.startsWith('sylareads.')) removeItem(k);
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  setItem(WIPED_KEY, String(Date.now()));
}
