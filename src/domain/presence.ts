import type { CourseIndex } from './courseIndex';
import { dayKey } from './dates';
import { displayedStreak, levelFromXp } from './gamification';
import type { ProgressRoot } from './progress';
import { courseStats } from './stats';
import { cleanName, nameProblem } from './names';

export { cleanName, NAME_MAX, NAME_MIN, NAME_PATTERN, nameProblem, type NameProblem } from './names';

/**
 * "Wer ist gerade da": an opt-in public card per signed-in player.
 * Only what is listed in PublicPlayer leaves the device; the progress
 * document itself stays private. Nobody is shown without saying yes
 * (privacy by default, Art. 25 DSGVO), and never under the Google name.
 */

/** The player's choice, stored in the progress document (so it follows the account). */
export interface ShareSetting {
  on: boolean;
  name: string;
  /** When the choice was last changed (the newer choice wins when devices merge). */
  at: number;
  /** Version of the consent text the player agreed to; older choices count as "off". */
  c?: number;
}

/** Bump when the consent text changes in a way that needs a new yes. */
export const CONSENT_VERSION = 2;

/** Progress in one course as shown on the card. */
export interface PublicCourse {
  /** Mastery in whole percent (0–100). */
  m: number;
  /** Lessons played or placed. */
  l: number;
  /** Lessons in the course. */
  lt: number;
  /** Readable cities (courses with cities only). */
  c?: number;
  ct?: number;
}

/** What other players see (Firestore document players/<uid>, without the server time). */
export interface PublicPlayer {
  /** 2 = written after the consent change (the Firestore rules only accept 2). */
  v: 2;
  name: string;
  /** Course of the latest session ('' before the first one). */
  course: string;
  courses: Record<string, PublicCourse>;
  streak: number;
  level: number;
  xp: number;
  /** Latest finished Daily Challenge per course (Firestore field `tempo`). */
  tempo?: Record<string, PublicDaily>;
}

export interface PublicDaily {
  /** Day (YYYY-MM-DD). */
  d: string;
  c: number;
  n: number;
  ms: number;
}

/** A card as read back, with the server's "last seen" time. */
export interface PlayerCard extends PublicPlayer {
  uid: string;
  seen: number;
}

/** "Gerade aktiv" means seen within this time; the device reports in at least twice as often. */
const ACTIVE_MS = 10 * 60_000;
export const HEARTBEAT_MS = 5 * 60_000;
/** Cards older than this are not listed. */
export const LIST_DAYS = 7;

/** A neutral suggestion such as "Reader 4821", the same for one account on every device. */
export function pseudonym(uid: string): string {
  let h = 0x811c9dc5;
  for (const ch of uid) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `Reader ${1000 + (h % 9000)}`;
}

/** The choice in effect: off unless the player said yes to the current consent text. */
export function effectiveShare(share: ShareSetting | undefined): ShareSetting {
  if (share && share.c === CONSENT_VERSION) return share;
  return { on: false, name: share?.c === CONSENT_VERSION ? share.name : '', at: share?.at ?? 0 };
}

/**
 * Course ids a card may carry (the language courses and the scripts course).
 * firestore.rules accepts only these keys; a test keeps both lists in step
 * with the course register.
 */
export const CARD_COURSES = ['ru', 'el', 'bn', 'th', 'scripts'] as const;
const isCardCourse = (id: string) => (CARD_COURSES as readonly string[]).includes(id);

/** Upper bounds of the numbers on a card (the rules check the same). */
export const CARD_LIMITS = { level: 999, xp: 100_000_000, streak: 100_000 } as const;

/** The newer choice wins; equal times keep the local one. */
export function mergeShare(a: ShareSetting | undefined, b: ShareSetting | undefined): ShareSetting | undefined {
  if (!a || !b) return a ?? b;
  return b.at > a.at ? b : a;
}

export function shareOf(raw: unknown): ShareSetting | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.on !== 'boolean' || typeof r.name !== 'string' || typeof r.at !== 'number') return undefined;
  return { on: r.on, name: cleanName(r.name), at: r.at, ...(typeof r.c === 'number' ? { c: r.c } : {}) };
}

/** Course of the latest session. */
export function currentCourse(root: ProgressRoot): string {
  let best = '';
  let at = 0;
  for (const [id, c] of Object.entries(root.courses)) {
    if ((c.lastSessionAt ?? 0) > at) {
      at = c.lastSessionAt ?? 0;
      best = id;
    }
  }
  return best;
}

const pct = (v: number) => Math.max(0, Math.min(100, Math.round(v * 100)));

/** Card values for a language course. */
export function publicCourse(index: CourseIndex, root: ProgressRoot, today = dayKey()): PublicCourse {
  const cp = root.courses[index.content.id];
  const st = courseStats(index, cp, today);
  const lessons = Object.keys(cp?.lessons ?? {}).filter((id) => index.content.lessons.some((l) => l.id === id)).length;
  return {
    m: pct(st.mastery),
    l: lessons,
    lt: index.content.lessons.length,
    ...(st.citiesTotal > 0 ? { c: st.citiesReadable, ct: st.citiesTotal } : {}),
  };
}

/** Card values for a course without a CourseIndex (the scripts course): share of items known. */
export function simpleCourse(known: number, total: number, lessons: number, lessonsTotal: number): PublicCourse {
  return { m: total ? pct(known / total) : 0, l: lessons, lt: lessonsTotal };
}

/** The public card. `courses` holds the started courses the caller could compute. */
export function publicSnapshot(root: ProgressRoot, name: string, courses: Record<string, PublicCourse>, today = dayKey()): PublicPlayer {
  const tempo: Record<string, PublicDaily> = {};
  for (const [id, cp] of Object.entries(root.courses)) {
    if (!isCardCourse(id)) continue;
    const day = Object.keys(cp.daily ?? {})
      .filter((d) => cp.daily![d].done)
      .sort()
      .pop();
    if (day) {
      const r = cp.daily![day];
      tempo[id] = { d: day, c: r.c, n: r.n, ms: Math.round(r.ms) };
    }
  }
  return {
    ...(Object.keys(tempo).length ? { tempo } : {}),
    v: 2,
    name: cleanName(name),
    course: isCardCourse(currentCourse(root)) ? currentCourse(root) : '',
    courses: Object.fromEntries(Object.entries(courses).filter(([id]) => isCardCourse(id))),
    streak: Math.min(CARD_LIMITS.streak, displayedStreak(root.profile.streak, today)),
    level: Math.min(CARD_LIMITS.level, levelFromXp(root.profile.xp)),
    xp: Math.min(CARD_LIMITS.xp, Math.max(0, Math.round(root.profile.xp))),
  };
}

/** Same card content (ignoring order), so an unchanged card is not written again. */
export const sameCard = (a: PublicPlayer | null, b: PublicPlayer) => !!a && stable(a) === stable(b);

function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${k}:${stable((v as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

export type Activity = 'now' | 'today' | 'week';

/** How recently a player was seen. */
export function activityOf(seen: number, now: number): Activity | null {
  const ago = now - seen;
  if (ago < ACTIVE_MS) return 'now';
  if (dayKey(new Date(seen)) === dayKey(new Date(now))) return 'today';
  if (ago < LIST_DAYS * 86_400_000) return 'week';
  return null;
}

/** Cards from the database, cleaned: unknown shapes dropped, own card first, then by last seen. */
export function sortPlayers(cards: PlayerCard[], me: string | null, now: number): PlayerCard[] {
  return cards
    .filter((c) => c.name && activityOf(c.seen, now) !== null)
    .sort((a, b) => (a.uid === me ? -1 : b.uid === me ? 1 : b.seen - a.seen));
}

/**
 * Reads a stored card defensively. Cards are written by other people's
 * devices (or by anyone who talks to Firebase directly), so everything is
 * checked again here: a name that breaks the name rules hides the card,
 * unknown courses are left out and all numbers stay in their range.
 */
export function cardOf(uid: string, raw: Record<string, unknown>, seen: number): PlayerCard | null {
  if (typeof raw.name !== 'string') return null;
  const name = cleanName(raw.name);
  if (nameProblem(name)) return null;
  const num = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0);
  const entries = (v: unknown) => (v && typeof v === 'object' ? Object.entries(v as Record<string, unknown>).filter(([id]) => isCardCourse(id)) : []);
  const courses: Record<string, PublicCourse> = {};
  for (const [id, c] of entries(raw.courses)) {
    if (!c || typeof c !== 'object') continue;
    const r = c as Record<string, unknown>;
    const lt = num(r.lt, 500);
    courses[id] = {
      m: num(r.m, 100),
      l: Math.min(num(r.l, 500), lt || 500),
      lt,
      ...(typeof r.ct === 'number' ? { c: Math.min(num(r.c, 5000), num(r.ct, 5000)), ct: num(r.ct, 5000) } : {}),
    };
  }
  const tempo: Record<string, PublicDaily> = {};
  for (const [id, t] of entries(raw.tempo)) {
    if (!t || typeof t !== 'object') continue;
    const r = t as Record<string, unknown>;
    if (typeof r.d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.d)) continue;
    const n = num(r.n, 10) || 10;
    tempo[id] = { d: r.d, c: Math.min(num(r.c, 10), n), n, ms: num(r.ms, 3_600_000) };
  }
  const course = typeof raw.course === 'string' && isCardCourse(raw.course) ? raw.course : '';
  return {
    ...(Object.keys(tempo).length ? { tempo } : {}),
    v: 2,
    uid,
    seen,
    name,
    course,
    courses,
    streak: num(raw.streak, CARD_LIMITS.streak),
    level: Math.max(1, num(raw.level, CARD_LIMITS.level)),
    xp: num(raw.xp, CARD_LIMITS.xp),
  };
}
