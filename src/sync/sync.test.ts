import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCourse, emptyRoot } from '../domain/progress';
import { useProgress } from '../store/progressStore';

// A fake cloud: one stored document per user, sign-in calls the auth listener.
const db = new Map<string, string>();
let nextUid = 'u1';
let pullDelay = 0;
let reauthFails = false;
// The flag and the owner of this device's progress live in localStorage.
const ls = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: { getItem: (k: string) => ls.get(k) ?? null, setItem: (k: string, v: string) => ls.set(k, v), removeItem: (k: string) => ls.delete(k) },
});
let listener: ((u: { uid: string; name: string; email: string } | null) => void) | null = null;
const pushes: string[] = [];
vi.mock('./firebaseConfig', () => ({ firebaseConfig: () => ({ apiKey: 'k', authDomain: 'd', projectId: 'p', appId: 'a' }) }));
vi.mock('./cloud', () => ({
  loadCloud: async () => ({
    onUser: (cb: typeof listener) => {
      listener = cb;
      return () => {};
    },
    signIn: async () => listener?.({ uid: nextUid, name: 'Syla', email: 's@example.org' }),
    signOut: async () => listener?.(null),
    reauth: async () => {
      if (reauthFails) throw Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' });
    },
    pull: async (uid: string) => {
      if (pullDelay) await new Promise((r) => setTimeout(r, pullDelay));
      return db.get(uid) ?? null;
    },
    push: async (uid: string, data: string) => {
      pushes.push(data);
      db.set(uid, data);
    },
    deleteAccount: async (uid: string) => {
      db.delete(uid);
      listener?.(null);
    },
  }),
}));

const { useSync, PACING } = await import('./syncStore');
PACING.pushGapMs = 0;
const settle = () => new Promise((r) => setTimeout(r, 20));

describe('online progress', () => {
  beforeEach(() => {
    db.clear();
    pushes.length = 0;
  });

  it('merges the online copy into this device on sign-in and uploads the result', async () => {
    const online = emptyRoot('de', 1);
    online.courses.bn = emptyCourse(1);
    online.courses.bn.lessons['bn-l01'] = { completedAt: 5, times: 1, bestCorrect: 20, bestTotal: 24 };
    online.profile.xp = 300;
    db.set('u1', JSON.stringify(online));

    const local = emptyRoot('de', 2);
    local.courses.ru = emptyCourse(2);
    local.profile.xp = 40;
    useProgress.getState().applyMerged(local);

    await useSync.getState().signIn();
    await settle();
    await useSync.getState().syncNow();

    const root = useProgress.getState().root;
    expect(Object.keys(root.courses).sort()).toEqual(['bn', 'ru']);
    expect(root.profile.xp).toBe(300);
    expect(useSync.getState().status).toBe('synced');
    expect(JSON.parse(db.get('u1')!).courses.ru).toBeDefined();
  });

  it('does not upload when nothing changed', async () => {
    await useSync.getState().syncNow();
    const before = pushes.length;
    await useSync.getState().syncNow();
    expect(pushes.length).toBe(before);
  });

  it('replaces the online copy after a reset instead of merging it back', async () => {
    useProgress.getState().reset();
    await useSync.getState().overwriteCloud();
    expect(Object.keys(JSON.parse(db.get('u1')!).courses)).toEqual([]);
    await useSync.getState().syncNow();
    expect(Object.keys(useProgress.getState().root.courses)).toEqual([]);
  });

  it('deleting the account removes the online copy, keeps this browser and withdraws the card', async () => {
    await useSync.getState().signIn();
    await settle();
    useProgress.getState().setShare(true, 'Syla');
    await useSync.getState().syncNow();
    expect(db.has('u1')).toBe(true);
    expect(await useSync.getState().deleteAccount()).toBe(true);
    expect(db.has('u1')).toBe(false);
    expect(useSync.getState().user).toBeNull();
    expect(useProgress.getState().root.profile.share?.on).toBe(false);
  });

  it('answers given while the online copy is downloading are kept (Z3)', async () => {
    nextUid = 'u1';
    await useSync.getState().signIn();
    await settle();
    await useSync.getState().syncNow();
    pullDelay = 50;
    const running = useSync.getState().syncNow();
    await new Promise((r) => setTimeout(r, 10));
    useProgress.getState().answer('bn', { itemId: 'bn:x', result: 'C', applySrs: true });
    await running;
    pullDelay = 0;
    expect(useProgress.getState().root.courses.bn?.items['bn:x']).toBeDefined();
    expect(JSON.parse(db.get('u1')!).courses.bn.items['bn:x']).toBeDefined();
  });

  it('a cancelled Google confirmation deletes nothing (S2)', async () => {
    await useSync.getState().syncNow();
    expect(db.has('u1')).toBe(true);
    reauthFails = true;
    expect(await useSync.getState().deleteAccount()).toBe(false);
    reauthFails = false;
    expect(db.has('u1')).toBe(true);
    expect(useSync.getState().user?.uid).toBe('u1');
    expect(useSync.getState().paused).toBe(false);
  });

  it("another account on this device: asks first and never takes over the other's card (S1)", async () => {
    nextUid = 'u1';
    await useSync.getState().signIn();
    await settle();
    useProgress.getState().setShare(true, 'Anna');
    await useSync.getState().syncNow();
    await useSync.getState().signOut(); // keep the progress on this device
    expect(useProgress.getState().root.profile.xp).toBeGreaterThan(0);

    db.set('u2', JSON.stringify({ ...useProgress.getState().root, courses: {}, profile: { ...useProgress.getState().root.profile, xp: 5, share: undefined } }));
    const pushesBefore = pushes.length;
    nextUid = 'u2';
    await useSync.getState().signIn();
    await settle();
    expect(useSync.getState().status).toBe('choose');
    expect(pushes.length).toBe(pushesBefore); // nothing uploaded before the choice

    await useSync.getState().resolveOwner('merge');
    expect(useSync.getState().status).toBe('synced');
    const online = JSON.parse(db.get('u2')!);
    expect(online.courses.bn).toBeDefined();
    expect(online.profile.share).toBeUndefined();
    expect(useProgress.getState().root.profile.share).toBeUndefined();
  });

  it('or starts from the online progress only, keeping the other one as a backup', async () => {
    await useSync.getState().signOut();
    nextUid = 'u3';
    db.set('u3', JSON.stringify({ ...useProgress.getState().root, courses: {}, profile: { ...useProgress.getState().root.profile, xp: 7 } }));
    await useSync.getState().signIn();
    await settle();
    expect(useSync.getState().status).toBe('choose');
    await useSync.getState().resolveOwner('online');
    expect(useProgress.getState().root.profile.xp).toBe(7);
    expect(Object.keys(useProgress.getState().root.courses)).toEqual([]);
  });
});
