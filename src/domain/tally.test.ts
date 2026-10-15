import { describe, expect, it } from 'vitest';
import { mergeRoots } from './merge';
import { emptyRoot, recordAnswer } from './progress';
import { setTallyDevice, tallyFrom } from './tally';

describe('XP across devices (tally)', () => {
  it('two devices learning between syncs add up instead of losing one side', () => {
    const now = Date.UTC(2026, 9, 15, 10);
    // Shared past: an old document without tally (1000 XP).
    let shared = emptyRoot('de', now);
    shared = { ...shared, profile: { ...shared.profile, xp: 1000, totalAnswers: 500 } };

    setTallyDevice('phone');
    let phone = shared;
    for (let i = 0; i < 10; i++) phone = recordAnswer(phone, 'bn', { itemId: 'bn:x', result: 'C', applySrs: true }, now + i);
    setTallyDevice('laptop');
    let laptop = shared;
    for (let i = 0; i < 5; i++) laptop = recordAnswer(laptop, 'bn', { itemId: 'bn:y', result: 'C', applySrs: true }, now + i);
    setTallyDevice('local');

    const gainPhone = phone.profile.xp - 1000;
    const gainLaptop = laptop.profile.xp - 1000;
    expect(gainPhone).toBeGreaterThan(0);
    const a = mergeRoots(phone, laptop);
    const b = mergeRoots(laptop, phone);
    expect(a.profile.xp).toBe(1000 + gainPhone + gainLaptop);
    expect(a.profile.totalAnswers).toBe(515);
    expect(b.profile.xp).toBe(a.profile.xp);
    // Syncing again changes nothing.
    expect(mergeRoots(a, b).profile.xp).toBe(a.profile.xp);
  });

  it('reads stored tallies defensively', () => {
    expect(tallyFrom({ base: { xp: 5, answers: 2 }, dev: { a: { xp: 1, answers: 1 }, b: { xp: -1, answers: 0 } } })).toEqual({ base: { xp: 5, answers: 2 }, dev: { a: { xp: 1, answers: 1 } } });
    expect(tallyFrom({ base: 'x' })).toBeUndefined();
    expect(tallyFrom(null)).toBeUndefined();
  });
});
