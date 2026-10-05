import { describe, expect, it } from 'vitest';
import { buildIndex } from '../domain/courseIndex';
import { accepts } from '../domain/evaluate';
import { normalize } from '../domain/normalize';
import ru from './ru';

/**
 * Content validation (spec section 14). These tests are the quality gate for
 * every course: they run in CI before each deployment.
 */
const courses = [ru];

describe.each(courses)('course $id', (course) => {
  const index = buildIndex(course);

  it('has unique ids', () => {
    const ids = index.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has 33 letters (Russian)', () => {
    if (course.id === 'ru') expect(course.letters).toHaveLength(33);
  });

  it('resolves every reference', () => {
    for (const l of course.lessons) {
      for (const id of [...l.newIds, ...(l.reviewIds ?? []), ...(l.wordIds ?? [])]) expect(index.byId.has(id), `${l.id} → ${id}`).toBe(true);
    }
    for (const s of course.contrastSets) for (const id of s.itemIds) expect(index.byId.has(id), `${s.id} → ${id}`).toBe(true);
    for (const p of course.places) if (p.regionId) expect(index.byId.has(p.regionId), `${p.id} → ${p.regionId}`).toBe(true);
  });

  it('teaches every letter exactly once in the lesson path', () => {
    const taught = course.lessons.filter((l) => l.type === 'letters').flatMap((l) => l.newIds);
    expect(new Set(taught).size).toBe(taught.length);
    expect(taught.sort()).toEqual(course.letters.map((l) => l.id).sort());
  });

  it('can decode every word and place with the course letters', () => {
    const letters = new Set(course.letters.map((l) => l.id));
    for (const it of index.items) {
      for (const req of index.required.get(it.id) ?? []) expect(letters.has(req), it.id).toBe(true);
    }
  });

  it('accepts the stored transliteration of every word through the reading rules', () => {
    for (const w of course.words) expect(accepts(index, w, w.translit), `${w.id} ${w.translit}`).toBe(true);
    for (const c of course.combos) expect(accepts(index, c, c.reading), `${c.id} ${c.reading}`).toBe(true);
  });

  it('accepts the names and transliteration of every place', () => {
    for (const p of course.places) {
      for (const a of [p.names.de, p.names.en, p.translit, ...p.accepted]) expect(accepts(index, p, a), `${p.id} ${a}`).toBe(true);
    }
  });

  it('has no answer that identifies two places of the same kind', () => {
    for (const kind of ['city', 'region'] as const) {
      const seen = new Map<string, string>();
      for (const p of course.places.filter((x) => x.kind === kind)) {
        for (const a of new Set([p.names.de, p.names.en, p.translit, ...p.accepted].map(normalize))) {
          expect(seen.get(a) ?? p.id, `"${a}" used by ${seen.get(a)} and ${p.id}`).toBe(p.id);
          seen.set(a, p.id);
        }
      }
    }
  });

  it('has 50 cities and German and English texts everywhere', () => {
    expect(course.places.filter((p) => p.kind === 'city')).toHaveLength(50);
    for (const l of course.letters) expect(l.mnemonic.de && l.mnemonic.en, l.id).toBeTruthy();
    for (const w of course.words) expect(w.meaning.de.length && w.meaning.en.length, w.id).toBeTruthy();
    for (const l of course.lessons) expect(l.title.de && l.title.en && l.goal.de && l.goal.en, l.id).toBeTruthy();
  });
});
