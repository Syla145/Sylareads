import { describe, expect, it } from 'vitest';
import bn from '../content/bn';
import { UPAZILAS } from '../content/bn/upazilas';
import el from '../content/el';
import ru from '../content/ru';
import th from '../content/th';
import { hashKey, sampleSignFor, SHOP_PHONE, showsSign, signFor } from './signs';
import type { PlaceItem } from './types';

const place = (c: { places: PlaceItem[] }, id: string) => c.places.find((p) => p.id === id)!;

describe('sign view', () => {
  it('"mixed" shows about every second task as a sign, deterministically', () => {
    const keys = Array.from({ length: 400 }, (_, i) => `identify-${i}`);
    const shown = keys.filter((k) => showsSign('mixed', k)).length;
    expect(shown).toBeGreaterThan(150);
    expect(shown).toBeLessThan(250);
    expect(keys.every((k) => showsSign('mixed', k) === showsSign('mixed', k))).toBe(true);
    expect(keys.some((k) => showsSign('off', k))).toBe(false);
    expect(keys.every((k) => showsSign('always', k))).toBe(true);
    expect(hashKey('a')).toBe(hashKey('a'));
  });

  it('only places get signs; a task keeps its sign', () => {
    expect(signFor('ru', ru.letters[0], 'k1')).toBeNull();
    const msk = place(ru, 'ru:city:moskva');
    expect(signFor('ru', msk, 'k7')).toEqual(signFor('ru', msk, 'k7'));
    const kinds = new Set(Array.from({ length: 60 }, (_, i) => signFor('ru', msk, `k${i}`)!.kind));
    expect([...kinds].every((k) => ['ru-direction', 'ru-motorway', 'ru-town', 'ru-town-end'].includes(k))).toBe(true);
    expect(kinds.size).toBeGreaterThan(2);
  });

  it('bilingual Greek and Thai signs carry the transliteration as Latin line', () => {
    for (const [c, id] of [[el, el.places[0].id], [th, th.places[0].id]] as const) {
      const p = place(c, id);
      for (let i = 0; i < 20; i++) {
        const s = signFor(c.id, p, `x${i}`)!;
        if (s.kind !== 'th-kmstone') expect(s.latin).toBe(p.translit);
        expect(s.native).toBe(p.native);
      }
    }
  });

  it('Bengali shop signs: the address ends with the district, after one of its upazilas', () => {
    const districts = bn.places.filter((p) => p.regionType === 'district');
    for (const d of districts) {
      const s = signFor('bn', d, `shop-${d.id}`)!;
      expect(s.kind).toBe('bd-shop');
      const parts = s.shop!.address.split(', ');
      expect(parts.at(-1)).toBe(d.native);
      expect(UPAZILAS[d.id]).toContain(parts.at(-2));
      expect(s.shop!.phone).toBe(SHOP_PHONE);
    }
    const division = bn.places.find((p) => p.regionType === 'division')!;
    expect(signFor('bn', division, 'k')).toBeNull();
  });

  it('upazila data: all 64 districts, Bengali names, no Sadar upazila', () => {
    const ids = bn.places.filter((p) => p.regionType === 'district').map((p) => p.id).sort();
    expect(Object.keys(UPAZILAS).sort()).toEqual(ids);
    for (const names of Object.values(UPAZILAS)) {
      expect(names.length).toBeGreaterThanOrEqual(2);
      for (const n of names) {
        expect(n).not.toContain('সদর');
        expect([...n].every((ch) => ch === ' ' || ch === '-' || (ch.codePointAt(0)! >= 0x0980 && ch.codePointAt(0)! <= 0x09ff))).toBe(true);
      }
    }
  });

  it('scripts course: signs only for documented countries, Latin line without notes', () => {
    expect(sampleSignFor('scripts:lao', 'ວຽງຈັນ', 'Viangchan', 'k')).toBeNull();
    const th1 = sampleSignFor('scripts:thai', 'กรุงเทพฯ', 'Krung Thep (Bangkok)', 'k')!;
    expect(th1.latin).toBe('Krung Thep');
    expect(sampleSignFor('scripts:bengali', 'ঢাকা', 'Dhaka', 'k')!.shop!.address.endsWith('ঢাকা')).toBe(true);
  });
});
