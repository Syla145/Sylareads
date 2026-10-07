import { UPAZILAS } from '../content/bn/upazilas';
import { pick, seededRng, type Rng } from './taskFactory';
import type { Item, PlaceItem } from './types';

/**
 * Schildansicht: which sign shows a place name. Pure and deterministic per
 * task (seeded by the task key), so a task keeps its sign while it is shown.
 * Only sign types whose look is documented for the country are used; other
 * items keep the plain plate.
 */

export type SignView = 'off' | 'mixed' | 'always';

export type SignKind =
  | 'ru-direction'
  | 'ru-motorway'
  | 'ru-town'
  | 'ru-town-end'
  | 'gr-direction'
  | 'gr-town'
  | 'th-direction'
  | 'th-kmstone'
  | 'bd-shop';

export interface ShopText {
  name: string;
  offer: string;
  owner: string;
  address: string;
  phone: string;
}

export interface SignSpec {
  kind: SignKind;
  native: string;
  latin?: string;
  km?: number;
  arrow?: 'left' | 'right' | 'up';
  road?: number;
  sideKm?: number;
  shop?: ShopText;
}

/** Stable 32-bit hash of a task key. */
export function hashKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** "Gemischt": about every second task is a sign. */
export function showsSign(view: SignView, key: string): boolean {
  return view === 'always' || (view === 'mixed' && hashKey(`${key}#view`) % 2 === 0);
}

const SHOPS: { name: string; offer: string }[] = [
  { name: 'মায়ের দোয়া স্টোর', offer: 'এখানে মুদি মালামাল পাওয়া যায়' },
  { name: 'মদিনা ফার্মেসী', offer: 'এখানে সকল প্রকার ঔষধ পাওয়া যায়' },
  { name: 'বিসমিল্লাহ ট্রেডার্স', offer: 'এখানে রড, সিমেন্ট ও টিন পাওয়া যায়' },
  { name: 'জননী বস্ত্রালয়', offer: 'এখানে শাড়ি, লুঙ্গি ও থান কাপড় পাওয়া যায়' },
  { name: 'ভাই ভাই টেলিকম', offer: 'এখানে মোবাইল রিচার্জ করা হয়' },
  { name: 'সততা হার্ডওয়্যার', offer: 'এখানে সকল প্রকার হার্ডওয়্যার পাওয়া যায়' },
];
const OWNERS = ['প্রোঃ মোঃ আব্দুল করিম', 'প্রোঃ মোঃ রফিকুল ইসলাম', 'প্রোঃ শ্রী সুবল চন্দ্র দাস', 'প্রোঃ মোঃ জাহাঙ্গীর আলম'];
const STREETS = ['স্টেশন রোড', 'কলেজ রোড', 'বাজার রোড', 'হাসপাতাল রোড', 'মেইন রোড', 'বড় বাজার', 'নতুন বাজার', 'পুরাতন বাজার', 'বাসস্ট্যান্ড', 'চৌরাস্তা মোড়'];
/** A placeholder, never a real number. */
export const SHOP_PHONE = 'মোবাঃ ০১৭০০-০০০০০০';
const THAI_ROADS = [1, 2, 3, 4, 11, 12, 21, 22, 24, 32, 101, 117, 304, 401];

const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const arrow = (rng: Rng) => pick(['left', 'right', 'up'] as const, rng)!;

/** Shop address ending with the place: "<street>, <upazila>, <district>" (districts) or "<street>, <town>". */
export function shopFor(place: PlaceItem, rng: Rng): ShopText {
  const shop = pick(SHOPS, rng)!;
  const upazilas = UPAZILAS[place.id];
  const address = upazilas?.length ? `${pick(STREETS, rng)}, ${pick(upazilas, rng)}, ${place.native}` : `${pick(STREETS, rng)}, ${place.native}`;
  return { ...shop, owner: pick(OWNERS, rng)!, address, phone: SHOP_PHONE };
}

/** Bilingual signs show the Latin name as on the sign: the transliteration. */
const latinOf = (p: PlaceItem) => p.translit;

/**
 * The sign for a place in a course, or null where no documented sign fits
 * (letters, words; Bengali divisions keep the plate as well).
 */
export function signFor(courseId: string, item: Item | undefined, key: string): SignSpec | null {
  if (!item || (item.kind !== 'city' && item.kind !== 'region')) return null;
  const rng = seededRng(hashKey(key));
  const place = item;
  const city = place.kind === 'city';
  switch (courseId) {
    case 'ru': {
      if (!city) return { kind: 'ru-direction', native: place.native, arrow: arrow(rng) };
      const r = rng();
      if (r < 0.4) return { kind: 'ru-direction', native: place.native, km: int(rng, 3, 480), arrow: arrow(rng) };
      if (r < 0.55) return { kind: 'ru-motorway', native: place.native, km: int(rng, 20, 900), arrow: arrow(rng) };
      return { kind: r < 0.85 ? 'ru-town' : 'ru-town-end', native: place.native };
    }
    case 'el':
      return city && rng() < 0.5
        ? { kind: 'gr-town', native: place.native, latin: latinOf(place) }
        : { kind: 'gr-direction', native: place.native, latin: latinOf(place), km: int(rng, 2, 240) };
    case 'th':
      return rng() < 0.6
        ? { kind: 'th-direction', native: place.native, latin: latinOf(place), km: int(rng, 2, 400), arrow: arrow(rng) }
        : { kind: 'th-kmstone', native: place.native, road: pick(THAI_ROADS, rng), km: int(rng, 5, 900), sideKm: int(rng, 1, 120) };
    case 'bn':
      if (place.kind === 'region' && place.regionType !== 'district') return null;
      return { kind: 'bd-shop', native: place.native, shop: shopFor(place, rng) };
    default:
      return null;
  }
}

/** Signs in the scripts course: only for scripts whose country's signs are documented. */
export function sampleSignFor(scriptId: string, native: string, latin: string, key: string): SignSpec | null {
  const rng = seededRng(hashKey(key));
  const plainLatin = latin.replace(/\s*\(.*\)\s*$/, '');
  switch (scriptId) {
    case 'scripts:greek':
      return rng() < 0.5 ? { kind: 'gr-town', native, latin: plainLatin } : { kind: 'gr-direction', native, latin: plainLatin, km: int(rng, 2, 240) };
    case 'scripts:thai':
      return { kind: 'th-direction', native, latin: plainLatin, km: int(rng, 2, 400), arrow: arrow(rng) };
    case 'scripts:russian':
      return rng() < 0.5 ? { kind: 'ru-direction', native, km: int(rng, 3, 480), arrow: arrow(rng) } : { kind: 'ru-town', native };
    case 'scripts:bengali': {
      const shop = pick(SHOPS, rng)!;
      return { kind: 'bd-shop', native, shop: { ...shop, owner: pick(OWNERS, rng)!, address: `${pick(STREETS, rng)}, ${native}`, phone: SHOP_PHONE } };
    }
    default:
      return null;
  }
}
