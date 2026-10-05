/**
 * Content model. Content is static, versioned data per course; progress
 * references it only through stable ids of the form `<course>:<kind>:<slug>`.
 * Script, language and country are separate entities; a course links them.
 */

export type Lang = 'de' | 'en';
export type L10n = { de: string; en: string };

export type ItemKind = 'letter' | 'combo' | 'word' | 'element' | 'term' | 'city' | 'region';

/** Practice categories as shown in the UI. */
export type Category = 'letters' | 'combos' | 'words' | 'terms' | 'cities' | 'regions';

export const CATEGORY_KINDS: Record<Category, ItemKind[]> = {
  letters: ['letter'],
  combos: ['combo'],
  words: ['word', 'element'],
  terms: ['term'],
  cities: ['city'],
  regions: ['region'],
};

export function categoryOf(kind: ItemKind): Category {
  switch (kind) {
    case 'letter':
      return 'letters';
    case 'combo':
      return 'combos';
    case 'word':
    case 'element':
      return 'words';
    case 'term':
      return 'terms';
    case 'city':
      return 'cities';
    case 'region':
      return 'regions';
  }
}

export interface ScriptDef {
  id: string; // ISO 15924, e.g. Cyrl
  name: L10n;
  type: 'alphabet' | 'abugida';
}

export interface LanguageDef {
  id: string; // ISO 639-1
  name: L10n;
  scriptId: string;
}

export interface CountryDef {
  id: string; // ISO 3166-1 alpha-2
  name: L10n;
}

interface ItemBase {
  id: string;
  kind: ItemKind;
}

export interface LetterItem extends ItemBase {
  kind: 'letter';
  upper: string;
  lower: string;
  /** Canonical reading shown in feedback. */
  reading: string;
  /** All accepted readings (already lower case, includes `reading`). */
  accepted: string[];
  mnemonic: L10n;
  /** Short explanation shown after an error or on the intro card. */
  note?: L10n;
  falseFriend?: boolean;
  /** Latin letter it is easily confused with (shown as a warning). */
  looksLike?: string;
  /** Letters without a sound of their own are asked as a function question. */
  functionChoice?: { correct: L10n; wrong: L10n[] };
}

export interface ComboItem extends ItemBase {
  kind: 'combo';
  /** Native spelling; a leading hyphen marks a suffix (e.g. "-ск"). */
  native: string;
  reading: string;
  note?: L10n;
}

export type TermCategory = 'road' | 'settlement' | 'nature' | 'transport' | 'direction' | 'element' | 'everyday';

export interface WordItem extends ItemBase {
  kind: 'word' | 'element' | 'term';
  native: string;
  translit: string;
  /** Extra explicitly accepted readings beyond the rule-based transliteration. */
  extra?: string[];
  /** Meanings; the first entry is displayed, all entries are accepted in meaning tasks. */
  meaning: { de: string[]; en: string[] };
  abbr?: string[];
  category?: TermCategory;
  countryIds?: string[];
}

export interface PlaceItem extends ItemBase {
  kind: 'city' | 'region';
  native: string;
  /** Region name without the type word (e.g. "Новосибирская"), also matched by transliteration. */
  core?: string;
  translit: string;
  names: L10n;
  /** Explicit, reviewed list of accepted answers (in addition to names, translit and rule-based readings). */
  accepted: string[];
  countryId: string;
  regionId?: string;
  regionType?: 'oblast' | 'krai' | 'republic' | 'okrug' | 'federal-city';
  tier: 1 | 2 | 3;
  hint?: L10n;
  tags?: string[];
}

export type Item = LetterItem | ComboItem | WordItem | PlaceItem;

export interface ContrastSet {
  id: string;
  /** Item ids of letters that are easily confused. */
  itemIds: string[];
  note: L10n;
}

export type LessonType = 'letters' | 'review' | 'combos' | 'vocab' | 'places';

export interface PhaseDef {
  id: string;
  title: L10n;
}

export interface Lesson {
  id: string;
  number: number;
  phaseId: string;
  type: LessonType;
  title: L10n;
  goal: L10n;
  /** Items introduced in this lesson. */
  newIds: string[];
  /** Items explicitly revised (review lessons). */
  reviewIds?: string[];
  /** Words preferred for the word phase. Picked automatically when absent. */
  wordIds?: string[];
  /** Review lessons: show letters in lower case. */
  lowercase?: boolean;
}

/** A segment of a transliteration: all accepted Latin spellings for one native piece. */
export type Segment = { alts: string[]; index: number };

export interface CourseContent {
  id: string;
  letters: LetterItem[];
  combos: ComboItem[];
  words: WordItem[];
  places: PlaceItem[];
  contrastSets: ContrastSet[];
  phases: PhaseDef[];
  lessons: Lesson[];
  /** Rule-based segmentation of a native string into transliteration alternatives. */
  segments: (native: string) => Segment[];
  /** Letter ids required to decode a native string. */
  requiredLetters: (native: string) => string[];
  /** Feature flags for the course (e.g. upper/lower case). */
  hasCase: boolean;
}

export interface CourseMeta {
  id: string;
  slug: string;
  name: L10n;
  scriptId: string;
  languageId: string;
  countryIds: string[];
  sampleGlyphs: string;
  /** Font role used for the course's native text. */
  fontClass: 'font-native-latin' | 'font-native-bengali' | 'font-native-thai';
  status: 'available' | 'soon';
  load?: () => Promise<CourseContent>;
}
