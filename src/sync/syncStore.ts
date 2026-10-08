import { create } from 'zustand';
import { mergeRoots, sameProgress } from '../domain/merge';
import { migrate } from '../store/persistence';
import { useProgress } from '../store/progressStore';
import { loadCloud, type Cloud, type CloudUser } from './cloud';
import { firebaseConfig } from './firebaseConfig';
import { uploadDelay } from './timing';

/**
 * Online progress (optional). The local copy stays the working copy; the
 * cloud copy is merged in on start, when the app comes back to the
 * foreground, right after a finished lesson or practice, when the app is left,
 * and otherwise at most every two minutes while answers come in (that keeps
 * Firebase within its free daily quota). A merge never loses progress from
 * either side (see domain/merge.ts).
 */
export type SyncStatus = 'unconfigured' | 'off' | 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error';

interface SyncState {
  status: SyncStatus;
  user: CloudUser | null;
  lastSyncAt: number | null;
  error: string | null;
  signIn: () => Promise<void>;
  /** Loads Firebase ahead of a sign-in, so the Google window opens directly on the tap (Safari blocks it otherwise). */
  prepare: () => void;
  signOut: () => Promise<void>;
  /** Deletes the online progress, the public card and the account; this browser keeps its progress. */
  deleteAccount: () => Promise<boolean>;
  syncNow: () => Promise<void>;
  /** After reset or import: the local copy replaces the cloud copy instead of being merged. */
  overwriteCloud: () => Promise<void>;
}

const FLAG = 'sylareads.sync';
const FOCUS_INTERVAL_MS = 60_000;

const flag = {
  get: () => {
    try {
      return localStorage.getItem(FLAG) === '1';
    } catch {
      return false;
    }
  },
  set: (on: boolean) => {
    try {
      if (on) localStorage.setItem(FLAG, '1');
      else localStorage.removeItem(FLAG);
    } catch {
      /* private mode: sync just needs a new sign-in next time */
    }
  },
};

let cloud: Cloud | null = null;

/** The loaded Firebase connection (null until someone signed in on this device). */
export const currentCloud = () => cloud;

/** Loads Firebase once and follows the signed-in user (also restores a stored session). */
async function connectCloud(): Promise<Cloud | null> {
  const config = firebaseConfig();
  if (!config) return null;
  if (cloud) return cloud;
  const c = await loadCloud(config);
  if (cloud) return cloud;
  cloud = c;
  c.onUser((user) => {
    useSync.setState({ user });
    if (user) {
      flag.set(true);
      void useSync.getState().syncNow();
    } else {
      flag.set(false);
      useSync.setState({ status: 'signed-out' });
    }
  });
  return c;
}
let applying = false;
let running: Promise<void> | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** The Firestore rules accept one progress upload per 10 seconds per account (tests set 0). */
export const PACING = { pushGapMs: 11_000 };
let lastPushAt = 0;
let retried = false;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pushPaced(c: Cloud, uid: string, data: string) {
  const wait = lastPushAt + PACING.pushGapMs - Date.now();
  if (wait > 0) await sleep(wait);
  await c.push(uid, data);
  lastPushAt = Date.now();
}

const errorCode = (e: unknown) => (e as { code?: string })?.code ?? (e as Error)?.message ?? 'unknown';
const isOffline = (e: unknown) => /unavailable|offline|network/i.test(errorCode(e)) || (typeof navigator !== 'undefined' && !navigator.onLine);

export const useSync = create<SyncState>((set, get) => {
  const config = firebaseConfig();

  const sync = async (overwrite: boolean) => {
    const { user } = get();
    if (!cloud || !user) return;
    set({ status: 'syncing', error: null });
    try {
      const local = useProgress.getState().root;
      if (overwrite) {
        await pushPaced(cloud, user.uid, JSON.stringify(local));
      } else {
        const raw = await cloud.pull(user.uid);
        const remote = raw ? migrate(JSON.parse(raw)) : null;
        const merged = remote ? mergeRoots(local, remote) : local;
        if (!sameProgress(merged, local)) {
          applying = true;
          useProgress.getState().applyMerged(merged);
          applying = false;
        }
        if (!remote || !sameProgress(merged, remote)) await pushPaced(cloud, user.uid, JSON.stringify(merged));
      }
      retried = false;
      set({ status: 'synced', lastSyncAt: Date.now() });
    } catch (e) {
      applying = false;
      // Another device of this account uploaded a moment ago (the rules allow one upload per 10 s): try once more shortly.
      if (errorCode(e) === 'permission-denied' && !retried) {
        retried = true;
        lastPushAt = Date.now();
        set({ status: 'syncing' });
        setTimeout(() => void get().syncNow(), PACING.pushGapMs);
        return;
      }
      if (isOffline(e)) set({ status: 'offline' });
      else set({ status: 'error', error: errorCode(e) });
    }
  };

  const run = (overwrite: boolean) => {
    // One sync at a time; a request during a running sync runs right after it.
    const next = (running ?? Promise.resolve()).then(() => sync(overwrite));
    running = next.finally(() => {
      if (running === next) running = null;
    });
    return next;
  };

  return {
    status: config ? 'off' : 'unconfigured',
    user: null,
    lastSyncAt: null,
    error: null,
    prepare: () => {
      connectCloud().catch(() => {});
    },
    signIn: async () => {
      set({ error: null });
      try {
        // Already loaded: open the window without any await before it.
        if (cloud) await cloud.signIn();
        else await (await connectCloud())?.signIn();
      } catch (e) {
        set({ status: 'error', error: errorCode(e) });
      }
    },
    signOut: async () => {
      await get().syncNow();
      await cloud?.signOut();
      flag.set(false);
      set({ user: null, status: 'signed-out', lastSyncAt: null });
    },
    deleteAccount: async () => {
      const { user } = get();
      if (!cloud || !user) return false;
      if (timer) clearTimeout(timer);
      timer = null;
      set({ error: null });
      try {
        await running;
        await cloud.deleteAccount(user.uid);
        // The yes to "Wer ist da" belonged to this account.
        const share = useProgress.getState().root.profile.share;
        if (share?.on) useProgress.getState().setShare(false, share.name);
        flag.set(false);
        set({ user: null, status: 'signed-out', lastSyncAt: null });
        return true;
      } catch (e) {
        set({ status: 'error', error: errorCode(e) });
        return false;
      }
    },
    syncNow: () => {
      // A sync now carries every pending change: drop a planned one.
      if (timer) clearTimeout(timer);
      timer = null;
      return run(false);
    },
    overwriteCloud: () => run(true),
  };
});

/** Starts sync for returning users and keeps the cloud copy up to date. Call once at app start. */
export function startSync() {
  const config = firebaseConfig();
  if (!config) return;
  if (flag.get()) {
    useSync.setState({ status: 'syncing' });
    connectCloud().catch(() => useSync.setState({ status: 'offline' }));
  } else {
    useSync.setState({ status: 'signed-out' });
  }

  // After progress changes: soon after a finished step, otherwise at most every two minutes.
  useProgress.subscribe((s, prev) => {
    if (applying || s.root === prev.root || !useSync.getState().user) return;
    const milestone = s.milestones !== prev.milestones;
    if (timer && !milestone) return; // an upload is already planned and will carry this change
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void useSync.getState().syncNow();
    }, uploadDelay(Date.now(), useSync.getState().lastSyncAt, milestone));
  });

  const onForeground = () => {
    const { user, lastSyncAt } = useSync.getState();
    if (user && document.visibilityState === 'visible' && Date.now() - (lastSyncAt ?? 0) > FOCUS_INTERVAL_MS) void useSync.getState().syncNow();
  };
  const onHide = () => {
    // Leaving the app: upload what is pending right away.
    if (document.visibilityState === 'hidden' && timer && useSync.getState().user) {
      clearTimeout(timer);
      timer = null;
      void useSync.getState().syncNow();
    }
  };
  document.addEventListener('visibilitychange', onForeground);
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('online', () => useSync.getState().user && void useSync.getState().syncNow());
}
