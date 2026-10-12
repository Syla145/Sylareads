/**
 * Display names ("Wer ist da" cards, duel links): cleaning and the rules
 * every name must follow. Kept apart so links and cards can check names
 * without loading the rest of the presence logic.
 */

export const NAME_MAX = 24;
export const NAME_MIN = 2;

/** Trims, collapses spaces, drops control characters and cuts to NAME_MAX characters. */
export function cleanName(raw: string): string {
  const s = [...raw.replace(/[\p{C}]/gu, '').replace(/\s+/g, ' ').trim()];
  return s.slice(0, NAME_MAX).join('').trim();
}

export type NameProblem = 'short' | 'chars' | 'blocked';

/** Letters (any script, with their marks), digits, spaces and . _ - ; starts with a letter or digit. firestore.rules checks the same pattern. */
export const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._-]*$/u;

/** Words that make a name unusable: as part of any name (first list) or as a whole word (second list, they hide in harmless words). */
const BLOCKED_ANYWHERE = ['fuck', 'cunt', 'nigg', 'fotze', 'hurensohn', 'wichser', 'schwuchtel', 'faggot', 'hitler', 'missgeburt', 'kanake'];
const BLOCKED_WORDS = ['arsch', 'hure', 'nazi', 'slut', 'whore', 'bitch', 'shit', 'spast', 'neger', 'retard', 'rape', 'porn', 'sex', 'admin', 'moderator', 'sylareads', 'geoguessr'];

const unleet = (s: string) => s.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't');

/** Why a display name can't be used, or null when it is fine. */
export function nameProblem(raw: string): NameProblem | null {
  const name = cleanName(raw);
  if ([...name].length < NAME_MIN) return 'short';
  if (!NAME_PATTERN.test(name)) return 'chars';
  const plain = unleet(name);
  const squashed = plain.replace(/[ ._-]/g, '');
  if (BLOCKED_ANYWHERE.some((w) => squashed.includes(w))) return 'blocked';
  if (plain.split(/[ ._-]+/).some((w) => BLOCKED_WORDS.includes(w))) return 'blocked';
  return null;
}
