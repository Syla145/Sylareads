/**
 * Own notes per character (Eselsbrücken): a short text the player writes for
 * any item, shown on its learning card, after mistakes and on the letters page.
 * Self-made mnemonics stick better than given ones, and the moment of a mix-up
 * is when one is needed.
 *
 * Stored per course in the progress document (so they sync). A deleted note
 * stays as an empty entry with its time, so the deletion wins over an older
 * copy on another device.
 */

export interface ItemNote {
  /** The text ('' = deleted). */
  t: string;
  /** When it was last changed. */
  at: number;
}

export type NoteMap = Record<string, ItemNote>;

export const NOTE_MAX = 280;

/** Trims, drops control characters except line breaks, at most NOTE_MAX characters. */
export function cleanNote(raw: string): string {
  const s = raw.replace(/\r\n?/g, '\n').replace(/[^\P{C}\n]/gu, '').replace(/\n{3,}/g, '\n\n').trim();
  return [...s].slice(0, NOTE_MAX).join('').trim();
}

/** The note text for an item, or '' if there is none. */
export const noteOf = (notes: NoteMap | undefined, itemId: string): string => notes?.[itemId]?.t ?? '';

/** Sets (or, with empty text, deletes) a note. */
export function withNote(notes: NoteMap | undefined, itemId: string, text: string, now: number): NoteMap {
  return { ...(notes ?? {}), [itemId]: { t: cleanNote(text), at: now } };
}

/** The newer note per item wins. */
export function mergeNotes(a: NoteMap | undefined, b: NoteMap | undefined): NoteMap | undefined {
  if (!a || !b) return a ?? b;
  const out: NoteMap = { ...a };
  for (const [id, n] of Object.entries(b)) if (!out[id] || n.at > out[id].at) out[id] = n;
  return out;
}

/** Reads stored notes defensively (unknown shapes are dropped). */
export function notesOf(raw: unknown): NoteMap | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: NoteMap = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    if (typeof r.t === 'string' && typeof r.at === 'number') out[id] = { t: cleanNote(r.t), at: r.at };
  }
  return Object.keys(out).length ? out : undefined;
}
