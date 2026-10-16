import type { L10n } from './types';

/**
 * 100 levels and what they bring for the "Wer ist da" card:
 * an emoji with every level, a title every 5 levels (and at level 1),
 * a frame every 10 levels. The player picks freely among the unlocked ones;
 * without a choice the newest unlocked one is shown.
 */
export const MAX_LEVEL = 100;

/** Emoji of level n is EMOJIS[n − 1]: travel, nature, animals, places, the sky. */
export const EMOJIS: readonly string[] = [
  '🧭', '📍', '🗺️', '🚶', '🎒', '🚲', '🛵', '🚗', '🚌', '🚂',
  '🌱', '🌿', '🌵', '🌴', '🌲', '🍁', '🌸', '🌻', '🍄', '🌾',
  '🐌', '🐢', '🦔', '🐿️', '🦊', '🐻', '🐼', '🦁', '🐯', '🐘',
  '🦒', '🦓', '🦘', '🐪', '🦙', '🐧', '🦉', '🦜', '🦩', '🦅',
  '☕', '🍵', '🍜', '🍛', '🥟', '🍣', '🥨', '🧀', '🥭', '🍉',
  '🏕️', '🏖️', '🏜️', '🏝️', '🏔️', '🌋', '🗻', '🏞️', '🌊', '⛰️',
  '🛺', '🚤', '⛵', '🚁', '🛩️', '✈️', '🚀', '🛰️', '🛸', '🎈',
  '🏯', '🏰', '🕌', '🛕', '⛩️', '🗼', '🗽', '🕍', '⛪', '🏛️',
  '📸', '📯', '🔭', '📡', '🧳', '🎫', '🎏', '🏮', '🎑', '🧿',
  '🌅', '🌄', '🌌', '🌠', '🌈', '⚡', '🔥', '💎', '🌍', '👑',
];

/** Titles by the level that unlocks them. */
export const TITLES: readonly { level: number; name: L10n }[] = [
  { level: 1, name: { de: 'Neuling', en: 'Newcomer' } },
  { level: 5, name: { de: 'Schilderleser', en: 'Sign Reader' } },
  { level: 10, name: { de: 'Wegfinder', en: 'Pathfinder' } },
  { level: 15, name: { de: 'Kartenkenner', en: 'Map Reader' } },
  { level: 20, name: { de: 'Spurensucher', en: 'Tracker' } },
  { level: 25, name: { de: 'Grenzgänger', en: 'Border Crosser' } },
  { level: 30, name: { de: 'Ortskundig', en: 'Local Expert' } },
  { level: 35, name: { de: 'Rundreisender', en: 'Tourer' } },
  { level: 40, name: { de: 'Weltenbummler', en: 'Globetrotter' } },
  { level: 45, name: { de: 'Kilometerfresser', en: 'Mile Eater' } },
  { level: 50, name: { de: 'Schriftenkundig', en: 'Script Scholar' } },
  { level: 55, name: { de: 'Kompassnadel', en: 'Compass Needle' } },
  { level: 60, name: { de: 'Pfadfinder', en: 'Trailblazer' } },
  { level: 65, name: { de: 'Gipfelstürmer', en: 'Summit Seeker' } },
  { level: 70, name: { de: 'Kartograf', en: 'Cartographer' } },
  { level: 75, name: { de: 'Meisterleser', en: 'Master Reader' } },
  { level: 80, name: { de: 'Entdecker', en: 'Explorer' } },
  { level: 85, name: { de: 'Fernreisender', en: 'Voyager' } },
  { level: 90, name: { de: 'Polarstern', en: 'Pole Star' } },
  { level: 95, name: { de: 'Weltkenner', en: 'World Knower' } },
  { level: 100, name: { de: 'Legende der Straße', en: 'Legend of the Road' } },
];

/** Frames by the level that unlocks them (the look is in CSS: .frame-<level>). */
export const FRAMES: readonly { level: number; name: L10n }[] = [
  { level: 10, name: { de: 'Bronze', en: 'Bronze' } },
  { level: 20, name: { de: 'Silber', en: 'Silver' } },
  { level: 30, name: { de: 'Gold', en: 'Gold' } },
  { level: 40, name: { de: 'Jade', en: 'Jade' } },
  { level: 50, name: { de: 'Rubin', en: 'Ruby' } },
  { level: 60, name: { de: 'Saphir', en: 'Sapphire' } },
  { level: 70, name: { de: 'Amethyst', en: 'Amethyst' } },
  { level: 80, name: { de: 'Straßenschild', en: 'Road Sign' } },
  { level: 90, name: { de: 'Polarlicht', en: 'Aurora' } },
  { level: 100, name: { de: 'Legende', en: 'Legend' } },
];

export const emojiOf = (level: number) => EMOJIS[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
export const titleOf = (level: number) => TITLES.find((t) => t.level === level);
export const frameOf = (level: number) => FRAMES.find((f) => f.level === level);

/** What reaching `level` brings. */
export function rewardsAt(level: number): { emoji: string; title?: L10n; frame?: L10n } {
  return { emoji: emojiOf(level), title: titleOf(level)?.name, frame: frameOf(level)?.name };
}

/** Chosen look (values are unlock levels; absent = the newest unlocked one). */
export interface Look {
  emoji?: number;
  title?: number;
  /** 0 = no frame on purpose. */
  frame?: number;
  /** When it was chosen (the newer choice wins between devices). */
  at: number;
}

export interface EffectiveLook {
  emoji: number;
  title: number;
  /** 0 = none. */
  frame: number;
}

const newest = (levels: readonly { level: number }[], level: number, none: number) =>
  levels.filter((x) => x.level <= level).reduce((best, x) => Math.max(best, x.level), none);

/** The look shown for a player of `level`: the choice if it is unlocked, else the newest unlocked. */
export function effectiveLook(look: Look | undefined, level: number): EffectiveLook {
  const lv = Math.min(MAX_LEVEL, Math.max(1, level));
  const emoji = look?.emoji && look.emoji >= 1 && look.emoji <= lv ? look.emoji : lv;
  const title = look?.title && titleOf(look.title) && look.title <= lv ? look.title : newest(TITLES, lv, 1);
  const frame = look?.frame === 0 ? 0 : look?.frame && frameOf(look.frame) && look.frame <= lv ? look.frame : newest(FRAMES, lv, 0);
  return { emoji, title, frame };
}

export function mergeLook(a: Look | undefined, b: Look | undefined): Look | undefined {
  if (!a || !b) return a ?? b;
  return b.at > a.at ? b : a;
}

/** Reads a stored look; unknown values are dropped. */
export function lookOf(raw: unknown): Look | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.at !== 'number') return undefined;
  const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : undefined);
  const emoji = int(r.emoji);
  const title = int(r.title);
  const frame = int(r.frame);
  return {
    at: r.at,
    ...(emoji && emoji >= 1 && emoji <= MAX_LEVEL ? { emoji } : {}),
    ...(title && titleOf(title) ? { title } : {}),
    ...(frame === 0 || (frame && frameOf(frame)) ? { frame } : {}),
  };
}

/** Levels reached between two XP totals, with what each brings (for the result screens). */
export function levelsGained(before: number, after: number): number[] {
  const out: number[] = [];
  for (let l = before + 1; l <= Math.min(after, MAX_LEVEL); l++) out.push(l);
  return out;
}
