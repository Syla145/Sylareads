import { describe, expect, it } from 'vitest';
import bn from '../content/bn';
import { buildConfuserRound, confuserPairs, CONFUSERS } from './confusers';
import { buildIndex } from './courseIndex';
import { emptyCourse } from './progress';
import { emptyProgress } from './srs';
import { seededRng } from './taskFactory';

const index = buildIndex(bn);
const id = (slug: string) => index.content.letters.find((l) => l.id.endsWith(`:${slug}`))!.id;
const learned = (...slugs: string[]) => Object.fromEntries(slugs.map((s) => [id(s), { ...emptyProgress(), box: 2 }]));

describe('Verwechsler-Runde', () => {
  it('fixed look-alike pairs appear once both characters were introduced', () => {
    const cp = { ...emptyCourse(1), items: learned('ba') };
    expect(confuserPairs(index, cp)).toHaveLength(0);
    const cp2 = { ...emptyCourse(1), items: learned('ba', 'ra') };
    const pairs = confuserPairs(index, cp2);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ mixed: 0, fixed: true });
    expect([pairs[0].a, pairs[0].b].sort()).toEqual([id('ba'), id('ra')].sort());
  });

  it('recorded mix-ups come first; pairs with the same reading are left out', () => {
    const cp = {
      ...emptyCourse(1),
      items: learned('ba', 'ra', 'sha', 'ssa'),
      confusions: { [`${id('ka')}>${id('pha')}`]: 2, [`${id('pha')}>${id('ka')}`]: 1 },
    };
    const pairs = confuserPairs(index, cp);
    expect(pairs[0]).toMatchObject({ mixed: 3, fixed: false });
    expect(pairs.some((p) => [p.a, p.b].includes(id('sha')) && [p.a, p.b].includes(id('ssa')))).toBe(false);
  });

  it('a round asks each pair three times, both ways, never the same pair twice in a row', () => {
    const cp = { ...emptyCourse(1), items: learned('ba', 'ra', 'dda', 'rra', 'ya', 'yya', 'tta', 'ttha') };
    const tasks = buildConfuserRound(index, cp, seededRng(5));
    const pairs = confuserPairs(index, cp).slice(0, CONFUSERS.maxPairs);
    expect(tasks).toHaveLength(pairs.length * 3);
    const pairOf = (t: (typeof tasks)[number]) => pairs.findIndex((p) => p.a === t.itemId || p.b === t.itemId);
    for (let i = 1; i < tasks.length; i++) expect(pairOf(tasks[i])).not.toBe(pairOf(tasks[i - 1]));
    for (const t of tasks) {
      expect(t.kind).toBe('choice');
      if (t.kind === 'choice') {
        expect(t.options).toHaveLength(2);
        expect(t.options.filter((o) => o.correct)).toHaveLength(1);
      }
    }
    expect(tasks.some((t) => t.kind === 'choice' && t.question === 'glyph')).toBe(true);
  });
});
