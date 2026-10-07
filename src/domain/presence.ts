import type { CourseIndex } from './courseIndex';
import { dayKey } from './dates';
import { displayedStreak, levelFromXp } from './gamification';
import type { ProgressRoot } from './progress';
import { courseStats } from './stats';

/**
 * "Wer ist gerade da": an opt-in public card per signed-in player.
 * Only what is listed in PublicPlayer leaves the device; the progress
 * document itself stays private.
 */

/** The player's choice, stored in the progress document (so it follows the account). */
export interface ShareSetting {
  on: boolean;
  name: string;
  /** When the choice was last changed (the newer choice wins when devices merge). */
  at: number;
}

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
  v: 1;
  name: string;
  /** Course of the latest session ('' before the first one). */
  course: string;
  courses: Record<string, PublicCourse>;
  streak: number;
  level: number;
  xp: number;
}

/** A card as read back, with the server's "last seen" time. */
export interface PlayerCard extends PublicPlayer {
  uid: string;
  seen: number;
}

export const NAME_MAX = 24;
/** "Gerade aktiv" means seen within this time; the device reports in at least twice as often. */
const ACTIVE_MS = 5 * 60_000;
export const HEARTBEAT_MS = 2 * 60_000;
/** Cards older than this are not listed. */
export const LIST_DAYS = 7;

/** Trims, collapses spaces, drops control characters and cuts to NAME_MAX characters. */
export function cleanName(raw: string): string {
  const s = [...raw.replace(/[\p{C}]/gu, '').replace(/\s+/g, ' ').trim()];
  return s.slice(0, NAME_MAX).join('').trim();
}

/** A first name from the Google account as the suggested display name. */
export function suggestName(displayName: string | null | undefined): string {
  return cleanName((displayName ?? '').split(' ')[0] ?? '');
}

/** The newer choice wins; equal times keep the local one. */
export function mergeShare(a: ShareSetting | undefined, b: ShareSetting | undefined): ShareSetting | undefined {
  if (!a || !b) return a ?? b;
  return b.at > a.at ? b : a;
}

export function shareOf(raw: unknown): ShareSetting | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.on !== 'boolean' || typeof r.name !== 'string' || typeof r.at !== 'number') return undefined;
  return { on: r.on, name: cleanName(r.name), at: r.at };
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
  return {
    v: 1,
    name: cleanName(name),
    course: currentCourse(root),
    courses,
    streak: displayedStreak(root.profile.streak, today),
    level: levelFromXp(root.profile.xp),
    xp: Math.round(root.profile.xp),
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

/** Reads a stored card defensively (other clients may be older or newer). */
export function cardOf(uid: string, raw: Record<string, unknown>, seen: number): PlayerCard | null {
  if (typeof raw.name !== 'string') return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const courses: Record<string, PublicCourse> = {};
  if (raw.courses && typeof raw.courses === 'object') {
    for (const [id, c] of Object.entries(raw.courses as Record<string, unknown>)) {
      if (!c || typeof c !== 'object') continue;
      const r = c as Record<string, unknown>;
      courses[id] = {
        m: Math.max(0, Math.min(100, num(r.m))),
        l: num(r.l),
        lt: num(r.lt),
        ...(typeof r.ct === 'number' ? { c: num(r.c), ct: num(r.ct) } : {}),
      };
    }
  }
  return {
    v: 1,
    uid,
    seen,
    name: cleanName(raw.name),
    course: typeof raw.course === 'string' ? raw.course : '',
    courses,
    streak: num(raw.streak),
    level: Math.max(1, num(raw.level)),
    xp: num(raw.xp),
  };
}
