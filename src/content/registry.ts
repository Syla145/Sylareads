import type { CountryDef, CourseMeta } from '../domain/types';

export const COUNTRIES: Record<string, CountryDef> = {
  RU: { id: 'RU', name: { de: 'Russland', en: 'Russia' } },
  GR: { id: 'GR', name: { de: 'Griechenland', en: 'Greece' } },
  BD: { id: 'BD', name: { de: 'Bangladesch', en: 'Bangladesh' } },
  IN: { id: 'IN', name: { de: 'Indien', en: 'India' } },
  TH: { id: 'TH', name: { de: 'Thailand', en: 'Thailand' } },
};

/** Courses shown on the home page. A course links one script, one language and its countries. */
export const COURSES: CourseMeta[] = [
  {
    id: 'ru',
    slug: 'russian',
    name: { de: 'Russian Cyrillic', en: 'Russian Cyrillic' },
    scriptId: 'Cyrl',
    languageId: 'ru',
    countryIds: ['RU'],
    sampleGlyphs: 'А Б В Г Д',
    fontClass: 'font-native-latin',
    status: 'available',
    hasMap: true,
    load: () => import('./ru').then((m) => m.default),
  },
  {
    id: 'el',
    slug: 'greek',
    name: { de: 'Greek', en: 'Greek' },
    scriptId: 'Grek',
    languageId: 'el',
    countryIds: ['GR'],
    sampleGlyphs: 'Α Β Γ Δ Ε',
    fontClass: 'font-native-latin',
    status: 'available',
    load: () => import('./el').then((m) => m.default),
  },
  {
    id: 'bn',
    slug: 'bengali',
    name: { de: 'Bengali', en: 'Bengali' },
    scriptId: 'Beng',
    languageId: 'bn',
    countryIds: ['BD'],
    sampleGlyphs: 'অ আ ই ঈ',
    fontClass: 'font-native-bengali',
    status: 'available',
    hasMap: true,
    load: () => import('./bn').then((m) => m.default),
  },
  {
    id: 'th',
    slug: 'thai',
    name: { de: 'Thai', en: 'Thai' },
    scriptId: 'Thai',
    languageId: 'th',
    countryIds: ['TH'],
    sampleGlyphs: 'ก ข ค ง',
    fontClass: 'font-native-thai',
    status: 'available',
    hasMap: true,
    load: () => import('./th').then((m) => m.default),
  },
];

export const courseBySlug = (slug: string | undefined) => COURSES.find((c) => c.slug === slug);
