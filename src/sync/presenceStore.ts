import { create } from 'zustand';
import { COURSES } from '../content/registry';
import { SCRIPT_ENTRIES, SCRIPT_LESSONS } from '../content/scripts/data';
import {
  cardOf,
  effectiveShare,
  HEARTBEAT_MS,
  LIST_DAYS,
  publicCourse,
  publicSnapshot,
  sameCard,
  simpleCourse,
  sortPlayers,
  type PlayerCard,
  type PublicCourse,
  type PublicPlayer,
} from '../domain/presence';
import type { ProgressRoot } from '../domain/progress';
import { SCRIPTS_COURSE_ID, scriptsKnown } from '../domain/scriptCourse';
import { loadCourseIndex } from '../features/course/useCourse';
import { useProgress } from '../store/progressStore';
import { currentCloud, useSync } from './syncStore';

/**
 * "Wer ist gerade da". While a signed-in player shares their card, this
 * device keeps it up to date: on start, a little after progress changes and
 * every two minutes while the app is visible (that keeps "gerade aktiv"
 * true). Turning sharing off deletes the card. The list of cards is read only
 * while a page shows it.
 */
export type ListStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PresenceState {
  cards: PlayerCard[];
  status: ListStatus;
  loadedAt: number | null;
  refresh: () => Promise<void>;
}

const CHANGE_DEBOUNCE_MS = 15_000;
const LIST_REFRESH_MS = 60_000;

let lastCard: PublicPlayer | null = null;
let lastWrite = 0;
let writing: Promise<void> | null = null;
let changeTimer: ReturnType<typeof setTimeout> | null = null;

const sharing = () => {
  const { user, lastSyncAt } = useSync.getState();
  const share = effectiveShare(useProgress.getState().root.profile.share, user?.name);
  // Only after the first merge with the cloud copy, so a choice made on another device is known.
  return share.on && share.name && user && lastSyncAt ? { uid: user.uid, name: share.name } : null;
};

/** Card values for every started course (language courses need their content, loaded on demand). */
async function courseCards(root: ProgressRoot): Promise<Record<string, PublicCourse>> {
  const out: Record<string, PublicCourse> = {};
  for (const meta of COURSES) {
    const cp = root.courses[meta.id];
    if (meta.status !== 'available' || !cp || (!Object.keys(cp.items).length && !Object.keys(cp.lessons).length)) continue;
    try {
      out[meta.id] = publicCourse(await loadCourseIndex(meta), root);
    } catch {
      /* content not reachable (offline): leave the course out this time */
    }
  }
  const sc = root.courses[SCRIPTS_COURSE_ID];
  if (sc && Object.keys(sc.items).length) {
    const lessons = SCRIPT_LESSONS.filter((l) => sc.lessons[l.id]).length;
    out[SCRIPTS_COURSE_ID] = simpleCourse(scriptsKnown(sc.items), SCRIPT_ENTRIES.length, lessons, SCRIPT_LESSONS.length);
  }
  return out;
}

/** Writes the own card if it changed or the last write is older than the heartbeat. */
async function publish(force = false): Promise<void> {
  const who = sharing();
  const cloud = currentCloud();
  if (!who || !cloud || document.visibilityState !== 'visible') return;
  if (writing) return writing;
  writing = (async () => {
    try {
      const root = useProgress.getState().root;
      const card = publicSnapshot(root, who.name, await courseCards(root));
      if (!force && sameCard(lastCard, card) && Date.now() - lastWrite < HEARTBEAT_MS - 15_000) return;
      await cloud.publishCard(who.uid, card);
      const first = !lastCard;
      lastCard = card;
      lastWrite = Date.now();
      // A list on screen should show the own card right away.
      if (first && usePresence.getState().loadedAt) void usePresence.getState().refresh();
    } catch {
      /* offline or rules not yet published: try again with the next heartbeat */
    } finally {
      writing = null;
    }
  })();
  return writing;
}

/** Report in right away (e.g. after a finished Daily Challenge). */
export const reportNow = () => publish();

async function unpublish(uid: string) {
  lastCard = null;
  lastWrite = 0;
  try {
    await currentCloud()?.removeCard(uid);
  } catch {
    /* already gone or offline */
  }
}

export const usePresence = create<PresenceState>((set) => ({
  cards: [],
  status: 'idle',
  loadedAt: null,
  refresh: async () => {
    const cloud = currentCloud();
    const user = useSync.getState().user;
    if (!cloud || !user) return;
    set((s) => ({ status: s.loadedAt ? s.status : 'loading' }));
    try {
      const now = Date.now();
      const stored = await cloud.listCards(now - LIST_DAYS * 86_400_000);
      const cards = stored.map((c) => cardOf(c.uid, c.data, c.seen)).filter((c): c is PlayerCard => !!c);
      set({ cards: sortPlayers(cards, user.uid, now), status: 'ready', loadedAt: now });
    } catch {
      set({ status: 'error' });
    }
  },
}));

/** Keeps the list fresh while a component that shows it is mounted (and the app is visible). */
export function watchPlayers(): () => void {
  const tick = () => {
    if (document.visibilityState === 'visible') void usePresence.getState().refresh();
  };
  tick();
  const id = setInterval(tick, LIST_REFRESH_MS);
  document.addEventListener('visibilitychange', tick);
  return () => {
    clearInterval(id);
    document.removeEventListener('visibilitychange', tick);
  };
}

/** Call once at app start (after startSync). */
export function startPresence() {
  const shareOf = (root: ProgressRoot) => effectiveShare(root.profile.share, useSync.getState().user?.name);
  let wasOn = shareOf(useProgress.getState().root).on;

  // Sharing switched off on this device: delete the card right away.
  useProgress.subscribe((s, prev) => {
    if (s.root === prev.root) return;
    const on = shareOf(s.root).on;
    const uid = useSync.getState().user?.uid;
    if (wasOn && !on && uid) void unpublish(uid);
    const nameChanged = shareOf(s.root).name !== shareOf(prev.root).name;
    wasOn = on;
    if (!on) return;
    if (changeTimer) clearTimeout(changeTimer);
    changeTimer = setTimeout(() => void publish(), nameChanged || !shareOf(prev.root).on ? 500 : CHANGE_DEBOUNCE_MS);
  });

  // First merge done or signed in: report in.
  useSync.subscribe((s, prev) => {
    if (s.user && s.lastSyncAt && s.lastSyncAt !== prev.lastSyncAt) void publish();
  });

  setInterval(() => void publish(), HEARTBEAT_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastWrite > HEARTBEAT_MS / 2) void publish();
  });
}
