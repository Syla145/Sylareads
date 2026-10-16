import type { CourseIndex } from './courseIndex';
import type { ItemProgress } from './srs';
import type { L10n, PlaceItem } from './types';

/**
 * Reisepass: stamps for what you can read reliably ("sicher" = box 3 or
 * higher, as for cities and map areas elsewhere).
 *
 * - Country pages: one stamp per group of areas (division, federal district,
 *   region of Thailand; for Greece the regions with their towns). A stamp
 *   comes once every area of the group is read reliably. Every area is a dot.
 * - Scripts: one stamp per course alphabet (all letters reliable) and one per
 *   script of "Schriften erkennen".
 */
export const SURE_BOX = 3;

type Items = Record<string, ItemProgress | undefined>;
const sure = (items: Items, id: string) => (items[id]?.box ?? 0) >= SURE_BOX;

export interface Stamp {
  id: string;
  native?: string;
  name: L10n;
  done: boolean;
  sure: number;
  total: number;
}

/** What the dots on a country page stand for. */
export type AreaKind = 'district' | 'province' | 'region' | 'city';
/** What the stamps on a country page stand for. */
export type GroupKind = 'division' | 'federal' | 'thaiRegion' | 'periphery';

export interface CountryPage {
  courseId: string;
  countryId: string;
  groupKind: GroupKind;
  areaKind: AreaKind;
  stamps: Stamp[];
  /** One dot per area, in stamp order; `group` is the index of its stamp (for the ink colour). */
  areas: { id: string; sure: boolean; group: number }[];
}

/**
 * Greece: the map areas are the 13 regions themselves, so the pass keeps one
 * stamp per region with its towns as dots (more to collect than 7 groups).
 */
function townMode(index: CourseIndex): boolean {
  const first = index.mapShapes.keys().next().value;
  if (!first) return true;
  const item = index.byId.get(first);
  return item?.kind === 'region' && item.regionType === 'periphery';
}

function groupKindOf(index: CourseIndex): GroupKind {
  const first = index.mapShapes.values().next().value;
  if (!first || townMode(index)) return 'periphery';
  if (first.group?.startsWith('ru:')) return 'federal';
  if (first.group?.startsWith('th:')) return 'thaiRegion';
  return 'division';
}

function areaKindOf(index: CourseIndex): AreaKind {
  const first = index.mapShapes.keys().next().value;
  if (!first || townMode(index)) return 'city';
  const item = index.byId.get(first);
  if (item?.kind === 'region' && item.regionType === 'district') return 'district';
  if (item?.kind === 'region' && item.regionType === 'province') return 'province';
  return 'region';
}

export function countryPage(index: CourseIndex, items: Items): CountryPage {
  const courseId = index.content.id;
  const places = index.content.places;
  const countryId = places[0]?.countryId ?? '';
  const groups: { id: string; native?: string; name: L10n; members: string[] }[] = [];

  if (index.map && index.mapShapes.size && !townMode(index)) {
    // Areas of the course map, grouped as on the map.
    const byGroup = new Map<string, string[]>();
    for (const shape of index.mapShapes.values()) {
      if (!shape.group) continue;
      byGroup.set(shape.group, [...(byGroup.get(shape.group) ?? []), shape.id]);
    }
    for (const g of index.map.groups) {
      const members = byGroup.get(g.id);
      if (!members?.length) continue;
      const item = index.byId.get(g.id) as PlaceItem | undefined;
      const name = item?.names ?? g.name;
      if (!name) continue;
      groups.push({ id: g.id, native: item ? (item.core ?? item.native) : g.native, name, members });
    }
  } else {
    // No map (Greece): the regions with their towns.
    for (const r of places) {
      if (r.kind !== 'region') continue;
      const members = places.filter((c) => c.kind === 'city' && c.regionId === r.id).map((c) => c.id);
      if (members.length) groups.push({ id: r.id, native: r.native, name: r.names, members });
    }
  }

  const stamps = groups.map((g): Stamp => {
    const n = g.members.filter((id) => sure(items, id)).length;
    return { id: `${courseId}:${g.id}`, native: g.native, name: g.name, done: n === g.members.length, sure: n, total: g.members.length };
  });
  const areas = groups.flatMap((g, i) => g.members.map((id) => ({ id, sure: sure(items, id), group: i })));
  return { courseId, countryId, groupKind: groupKindOf(index), areaKind: areaKindOf(index), stamps, areas };
}

/** The alphabet of a course: stamped once every letter is read reliably. */
export function alphabetStamp(index: CourseIndex, items: Items, name: L10n): Stamp {
  const letters = index.content.letters;
  const n = letters.filter((l) => sure(items, l.id)).length;
  const sample = letters.slice(0, 3).map((l) => l.upper).join('');
  return { id: `${index.content.id}:alphabet`, native: sample, name, done: letters.length > 0 && n === letters.length, sure: n, total: letters.length };
}

/** One stamp per script of "Schriften erkennen". */
export function scriptStamps(entries: { id: string; name: L10n; sample?: string }[], items: Items): Stamp[] {
  return entries.map((e) => {
    const done = sure(items, e.id);
    return { id: e.id, native: e.sample, name: e.name, done, sure: done ? 1 : 0, total: 1 };
  });
}

export interface PassSummary {
  stamps: number;
  countries: number;
  scripts: number;
}

/**
 * Totals on the cover. A course alphabet and the same script in
 * "Schriften erkennen" count once as a script (`alphabetScript` links them).
 */
export function passSummary(pages: CountryPage[], alphabets: { stamp: Stamp; scriptId: string }[], scripts: Stamp[]): PassSummary {
  const countryStamps = pages.reduce((n, p) => n + p.stamps.filter((s) => s.done).length, 0);
  const countries = new Set(pages.filter((p) => p.stamps.some((s) => s.done)).map((p) => p.countryId)).size;
  const known = new Set(scripts.filter((s) => s.done).map((s) => s.id));
  for (const a of alphabets) if (a.stamp.done) known.add(a.scriptId);
  const stamps = countryStamps + alphabets.filter((a) => a.stamp.done).length + scripts.filter((s) => s.done).length;
  return { stamps, countries, scripts: known.size };
}

/** Stamps that are done in `after` but not in `before` (for the result screens). */
export function newStamps(before: Stamp[], after: Stamp[]): Stamp[] {
  const was = new Set(before.filter((s) => s.done).map((s) => s.id));
  return after.filter((s) => s.done && !was.has(s.id));
}

/** Small deterministic tilt and shape per stamp, so the page looks hand-stamped. */
export function stampLook(id: string, i: number): { rotate: number; shape: 'round' | 'square' | 'double' } {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0;
  return { rotate: (h % 21) - 10, shape: (['round', 'square', 'double'] as const)[(h >>> 5) % 3 === 0 ? 2 : i % 2] };
}
