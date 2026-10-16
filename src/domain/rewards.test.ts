import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { levelFromXp, levelProgress, xpForLevel } from './gamification';
import { cardOf, publicSnapshot } from './presence';
import { emptyRoot } from './progress';
import { EMOJIS, effectiveLook, FRAMES, levelsGained, lookOf, MAX_LEVEL, mergeLook, rewardsAt, TITLES } from './rewards';

describe('100 Level und Belohnungen', () => {
  it('has 100 different emojis, a title at 1 and every 5 levels, a frame every 10', () => {
    expect(EMOJIS).toHaveLength(MAX_LEVEL);
    expect(new Set(EMOJIS).size).toBe(MAX_LEVEL);
    expect(TITLES.map((t) => t.level)).toEqual([1, ...Array.from({ length: 20 }, (_, i) => (i + 1) * 5)]);
    expect(FRAMES.map((f) => f.level)).toEqual(Array.from({ length: 10 }, (_, i) => (i + 1) * 10));
    expect(new Set(TITLES.map((t) => t.name.de)).size).toBe(TITLES.length);
    expect(rewardsAt(20)).toMatchObject({ emoji: EMOJIS[19], title: { de: 'Spurensucher' }, frame: { de: 'Silber' } });
    expect(rewardsAt(7).title).toBeUndefined();
  });

  it('ends at level 100 (247 500 XP)', () => {
    expect(xpForLevel(100)).toBe(247_500);
    expect(levelFromXp(247_499)).toBe(99);
    expect(levelFromXp(10_000_000)).toBe(100);
    expect(levelProgress(10_000_000)).toEqual({ level: 100, into: 0, span: 0 });
    expect(levelsGained(98, 100)).toEqual([99, 100]);
  });

  it('shows the newest unlocked rewards unless something unlocked was chosen', () => {
    expect(effectiveLook(undefined, 1)).toEqual({ emoji: 1, title: 1, frame: 0 });
    expect(effectiveLook(undefined, 27)).toEqual({ emoji: 27, title: 25, frame: 20 });
    expect(effectiveLook({ emoji: 3, title: 10, frame: 10, at: 1 }, 27)).toEqual({ emoji: 3, title: 10, frame: 10 });
    expect(effectiveLook({ frame: 0, at: 1 }, 27).frame).toBe(0);
    // not unlocked yet (e.g. from a device with more XP than this one): newest instead
    expect(effectiveLook({ emoji: 50, title: 50, frame: 50, at: 1 }, 27)).toEqual({ emoji: 27, title: 25, frame: 20 });
  });

  it('reads, merges and cleans a stored look', () => {
    expect(lookOf({ at: 5, emoji: 3, title: 7, frame: 15 })).toEqual({ at: 5, emoji: 3 });
    expect(lookOf({ at: 5, frame: 0 })).toEqual({ at: 5, frame: 0 });
    expect(lookOf({ emoji: 3 })).toBeUndefined();
    expect(mergeLook({ at: 1, emoji: 2 }, { at: 2, emoji: 9 })).toEqual({ at: 2, emoji: 9 });
  });

  it('puts the look on the card and reads only what the level allows', () => {
    const root = emptyRoot('de');
    root.profile.xp = xpForLevel(23);
    root.profile.look = { at: 1, emoji: 5, title: 15 };
    const card = publicSnapshot(root, 'Josef', {});
    expect(card).toMatchObject({ level: 23, emoji: 5, title: 15, frame: 20 });
    const read = cardOf('u1', { ...card, emoji: 90, title: 95, frame: 100 } as unknown as Record<string, unknown>, Date.now());
    expect(read).toMatchObject({ emoji: 23, title: 20, frame: 20 });
    const old = cardOf('u2', { name: 'Alt', level: 12 }, Date.now());
    expect(old?.frame).toBeUndefined();
    expect(old?.emoji).toBe(12);
  });

  it('has Firestore rules that allow exactly these fields', () => {
    const rules = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');
    for (const key of ["'emoji'", "'title'", "'frame'"]) expect(rules).toContain(key);
    expect(rules).toContain('d.title % 5 == 0');
    expect(rules).toContain('d.frame % 10 == 0');
    expect(rules).toContain('goodLook(request.resource.data)');
  });
});
