import { describe, expect, it } from 'vitest';
import { migrate } from '../store/persistence';
import { mergeRoots } from './merge';
import { cleanNote, mergeNotes, NOTE_MAX, noteOf, notesOf, withNote } from './notes';
import { emptyCourse, emptyRoot } from './progress';

describe('Eselsbrücken', () => {
  it('cleans text: keeps line breaks, drops control characters, limits the length', () => {
    expect(cleanNote('  ব wie Beutel\r\n\r\n\r\n→ b \u0007 ')).toBe('ব wie Beutel\n\n→ b');
    expect([...cleanNote('x'.repeat(400))].length).toBe(NOTE_MAX);
  });

  it('set, read and delete; a deletion wins over an older note from another device', () => {
    const a = withNote(undefined, 'bn:letter:ba', 'Beutel', 10);
    expect(noteOf(a, 'bn:letter:ba')).toBe('Beutel');
    const deleted = withNote(a, 'bn:letter:ba', '', 20);
    expect(noteOf(deleted, 'bn:letter:ba')).toBe('');
    expect(noteOf(mergeNotes(a, deleted), 'bn:letter:ba')).toBe('');
    expect(noteOf(mergeNotes(deleted, a), 'bn:letter:ba')).toBe('');
    const other = withNote(undefined, 'bn:letter:ra', 'Punkt unten', 5);
    expect(Object.keys(mergeNotes(a, other)!).sort()).toEqual(['bn:letter:ba', 'bn:letter:ra']);
  });

  it('notes survive merging two devices and reloading', () => {
    const r1 = emptyRoot('de', 1);
    r1.courses.bn = { ...emptyCourse(1), notes: withNote(undefined, 'bn:letter:ba', 'Beutel', 10) };
    const r2 = emptyRoot('de', 1);
    r2.courses.bn = { ...emptyCourse(1), notes: withNote(undefined, 'bn:letter:ra', 'Punkt', 11) };
    const merged = mergeRoots(r1, r2);
    expect(noteOf(merged.courses.bn.notes, 'bn:letter:ra')).toBe('Punkt');
    expect(noteOf(migrate(JSON.parse(JSON.stringify(merged))).courses.bn.notes, 'bn:letter:ba')).toBe('Beutel');
    expect(notesOf({ x: { t: 5 } })).toBeUndefined();
  });
});
