import { describe, expect, it } from 'vitest';
import bn from '../content/bn';
import bnMap from '../content/bn/map.json';
import el from '../content/el';
import elMap from '../content/el/map.json';
import ru from '../content/ru';
import ruMap from '../content/ru/map.json';
import th from '../content/th';
import thMap from '../content/th/map.json';
import { attachMap, buildIndex } from './courseIndex';
import { alphabetStamp, countryPage, newStamps, passSummary, scriptStamps, stampLook, SURE_BOX } from './passport';
import type { ItemProgress } from './srs';
import type { CourseMap } from './types';

const bnIndex = attachMap(buildIndex(bn), bnMap as unknown as CourseMap);
const ruIndex = attachMap(buildIndex(ru), ruMap as unknown as CourseMap);
const thIndex = attachMap(buildIndex(th), thMap as unknown as CourseMap);
const elIndex = attachMap(buildIndex(el), elMap as unknown as CourseMap);

const box = (n: number) => ({ box: n }) as ItemProgress;
const items = (ids: string[], b = SURE_BOX) => Object.fromEntries(ids.map((id) => [id, box(b)]));

describe('Reisepass', () => {
  it('has the 8 divisions and 64 districts of Bangladesh', () => {
    const p = countryPage(bnIndex, {});
    expect(p.countryId).toBe('BD');
    expect(p.groupKind).toBe('division');
    expect(p.areaKind).toBe('district');
    expect(p.stamps).toHaveLength(8);
    expect(p.areas).toHaveLength(64);
    expect(p.stamps.reduce((n, s) => n + s.total, 0)).toBe(64);
    expect(p.stamps.every((s) => s.native && s.name.de)).toBe(true);
  });

  it('stamps a division once all its districts are read reliably', () => {
    const empty = countryPage(bnIndex, {});
    const dhaka = empty.stamps.find((s) => s.id === 'bn:bn:region:dhaka')!;
    const ids = empty.areas.filter((a) => empty.stamps[a.group].id === dhaka.id).map((a) => a.id);
    const almost = countryPage(bnIndex, items(ids.slice(1)));
    expect(almost.stamps.find((s) => s.id === dhaka.id)).toMatchObject({ done: false, sure: ids.length - 1 });
    const lowBox = countryPage(bnIndex, items(ids, SURE_BOX - 1));
    expect(lowBox.stamps.find((s) => s.id === dhaka.id)!.done).toBe(false);
    const full = countryPage(bnIndex, items(ids));
    expect(full.stamps.find((s) => s.id === dhaka.id)!.done).toBe(true);
    expect(newStamps(empty.stamps, full.stamps).map((s) => s.id)).toEqual([dhaka.id]);
  });

  it('uses federal districts for Russia, regions for Thailand and towns for Greece', () => {
    expect(countryPage(ruIndex, {})).toMatchObject({ groupKind: 'federal', countryId: 'RU' });
    expect(countryPage(ruIndex, {}).stamps).toHaveLength(8);
    expect(countryPage(thIndex, {})).toMatchObject({ groupKind: 'thaiRegion', areaKind: 'province', countryId: 'TH' });
    const gr = countryPage(elIndex, {});
    expect(gr).toMatchObject({ groupKind: 'periphery', areaKind: 'city', countryId: 'GR' });
    expect(gr.stamps.length).toBeGreaterThanOrEqual(10);
    expect(gr.areas.every((a) => a.id.startsWith('el:city:'))).toBe(true);
  });

  it('stamps an alphabet once every letter is reliable', () => {
    const name = { de: 'Bengali', en: 'Bengali' };
    const all = bnIndex.content.letters.map((l) => l.id);
    expect(alphabetStamp(bnIndex, items(all.slice(1)), name).done).toBe(false);
    expect(alphabetStamp(bnIndex, items(all), name)).toMatchObject({ done: true, total: all.length });
  });

  it('counts stamps, countries and scripts once each', () => {
    const bnPage = countryPage(bnIndex, items(bnIndex.content.places.map((p) => p.id)));
    const ruPage = countryPage(ruIndex, {});
    const alphabet = { stamp: { ...alphabetStamp(bnIndex, items(bnIndex.content.letters.map((l) => l.id)), { de: 'B', en: 'B' }) }, scriptId: 'scripts:bengali' };
    const scripts = scriptStamps(
      [
        { id: 'scripts:bengali', name: { de: 'Bengali', en: 'Bengali' } },
        { id: 'scripts:lao', name: { de: 'Laotisch', en: 'Lao' } },
      ],
      items(['scripts:bengali']),
    );
    expect(passSummary([bnPage, ruPage], [alphabet], scripts)).toEqual({ stamps: 8 + 1 + 1, countries: 1, scripts: 1 });
  });

  it('tilts every stamp the same way on every visit', () => {
    expect(stampLook('bn:x', 0)).toEqual(stampLook('bn:x', 0));
    for (let i = 0; i < 20; i++) expect(Math.abs(stampLook(`id${i}`, i).rotate)).toBeLessThanOrEqual(10);
  });
});
