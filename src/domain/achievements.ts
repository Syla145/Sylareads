import { SCRIPT_ENTRIES, SCRIPT_LESSONS } from '../content/scripts/data';
import type { CourseIndex } from './courseIndex';
import type { CourseProgress, ProgressRoot } from './progress';
import { normalize } from './normalize';
import type { L10n } from './types';

/**
 * Achievements (Erfolge), grouped: general, one set per course and one secret.
 * Most come in three tiers (Bronze, Silber, Gold). Every condition is a
 * measure "value / target" over stored progress, so the overview can show the
 * next reachable goal with a progress bar. Conditions that need course
 * content (letters, map areas) are measured when that course is loaded;
 * already earned ones are filled in silently when a course is opened.
 */

export type Tier = 1 | 2 | 3;
export type AchievementGroup = 'general' | 'secret' | string; // otherwise a course id

export interface AchievementDef {
  id: string;
  group: AchievementGroup;
  family: string;
  tier?: Tier;
  title: L10n;
  description: L10n;
  /** Progress towards the goal; null when it cannot be measured here (course content missing). */
  measure: (root: ProgressRoot, index: CourseIndex | null) => { value: number; target: number } | null;
}

const TIER_NAMES: Record<Tier, L10n> = {
  1: { de: 'Bronze', en: 'Bronze' },
  2: { de: 'Silber', en: 'Silver' },
  3: { de: 'Gold', en: 'Gold' },
};

/** Review boxes of the level names: Moderate from box 3, Pro from box 5, Expert at box 7. */
const MODERATE = 3;
const PRO = 5;
const EXPERT = 7;

const boxOf = (c: CourseProgress | undefined, id: string) => c?.items[id]?.box ?? 0;
const countAt = (c: CourseProgress | undefined, ids: string[], box: number) => ids.filter((id) => boxOf(c, id) >= box).length;
const m = (value: number, target: number) => ({ value: Math.min(value, target), target });

function tiered(
  group: string,
  family: string,
  title: L10n,
  tiers: [L10n, L10n, L10n],
  measure: (tier: Tier, root: ProgressRoot, index: CourseIndex | null) => { value: number; target: number } | null,
): AchievementDef[] {
  return ([1, 2, 3] as Tier[]).map((tier) => ({
    id: `${group}:${family}:${tier}`,
    group,
    family,
    tier,
    title,
    description: tiers[tier - 1],
    measure: (root, index) => measure(tier, root, index),
  }));
}

function single(group: string, family: string, title: L10n, description: L10n, measure: AchievementDef['measure']): AchievementDef {
  return { id: `${group}:${family}`, group, family, title, description, measure };
}

// ---------------------------------------------------------------- general

const played = (c: CourseProgress | undefined) => Object.values(c?.lessons ?? {}).filter((l) => !l.placed).length;

const GENERAL: AchievementDef[] = [
  single('general', 'first-steps', { de: 'Erste Schritte', en: 'First Steps' }, { de: 'Die erste Lektion abgeschlossen', en: 'Completed your first lesson' }, (root) =>
    m(Object.values(root.courses).some((c) => played(c) > 0) ? 1 : 0, 1),
  ),
  ...tiered(
    'general',
    'streak',
    { de: 'Dranbleiben', en: 'Keep Going' },
    [
      { de: '7 Tage in Folge gelernt', en: 'Learned 7 days in a row' },
      { de: '30 Tage in Folge gelernt', en: 'Learned 30 days in a row' },
      { de: '100 Tage in Folge gelernt', en: 'Learned 100 days in a row' },
    ],
    (tier, root) => m(root.profile.streak.longest, [7, 30, 100][tier - 1]),
  ),
  ...tiered(
    'general',
    'answers',
    { de: 'Vielleser', en: 'Avid Reader' },
    [
      { de: '1.000 Antworten', en: '1,000 answers' },
      { de: '5.000 Antworten', en: '5,000 answers' },
      { de: '10.000 Antworten', en: '10,000 answers' },
    ],
    (tier, root) => m(root.profile.totalAnswers, [1000, 5000, 10000][tier - 1]),
  ),
];

// ---------------------------------------------------------------- secret

/** The Easter egg: typed once as an answer in a lesson. */
export const SECRET_ID = 'secret:syla';
const SECRET_PHRASE = 'Syla ist der beste Geoguessr-Spieler!';
const compact = (s: string) => normalize(s).replace(/[^\p{L}\p{N}]/gu, '');
export const isSecretPhrase = (input: string) => compact(input) === compact(SECRET_PHRASE);

const SECRET: AchievementDef = {
  id: SECRET_ID,
  group: 'secret',
  family: 'syla',
  title: { de: '?', en: '?' },
  description: { de: '?', en: '?' },
  // Only unlocked by the phrase, never by progress.
  measure: (root) => m(root.profile.achievements[SECRET_ID] ? 1 : 0, 1),
};

// ---------------------------------------------------------------- per course

/** Course-specific special: a group of reading units, all on Pro. */
const SPECIALS: Record<string, { title: L10n; description: L10n; ids: (index: CourseIndex) => string[] }> = {
  ru: {
    title: { de: 'False Friends gezähmt', en: 'False Friends Tamed' },
    description: { de: 'Alle False Friends auf Pro', en: 'All false friends on Pro' },
    ids: (i) => i.content.letters.filter((l) => l.falseFriend).map((l) => l.id),
  },
  el: {
    title: { de: 'Buchstabenpaare', en: 'Letter Pairs' },
    description: { de: 'Alle Buchstabenpaare (ου, μπ …) auf Pro', en: 'All letter pairs (ου, μπ …) on Pro' },
    ids: (i) => i.content.combos.filter((c) => c.unit).map((c) => c.id),
  },
  th: {
    title: { de: 'Vokalzeichen', en: 'Vowel Signs' },
    description: { de: 'Alle Vokalzeichen auf Pro', en: 'All vowel signs on Pro' },
    ids: (i) => i.content.letters.filter((l) => l.id.startsWith('th:letter:v-')).map((l) => l.id),
  },
  bn: {
    title: { de: 'Ligaturen', en: 'Ligatures' },
    description: { de: 'Alle Ligaturen und Verbindungen auf Pro', en: 'All ligatures and clusters on Pro' },
    ids: (i) => i.content.lessons.filter((l) => l.phaseId === 'clusters').flatMap((l) => l.newIds),
  },
};

const CONTENT_COURSES = ['ru', 'el', 'th', 'bn'] as const;

function courseAchievements(course: string): AchievementDef[] {
  const cp = (root: ProgressRoot) => root.courses[course];
  const list: AchievementDef[] = [
    ...tiered(
      course,
      'alphabet',
      { de: 'Alphabet', en: 'Alphabet' },
      [
        { de: 'Alle Buchstaben kennengelernt', en: 'Met every letter' },
        { de: 'Alle Buchstaben auf Moderate', en: 'All letters on Moderate' },
        { de: 'Alle Buchstaben auf Pro', en: 'All letters on Pro' },
      ],
      (tier, root, index) => {
        if (!index) return null;
        const ids = index.byKind.letter.map((l) => l.id);
        return m(countAt(cp(root), ids, [1, MODERATE, PRO][tier - 1]), ids.length);
      },
    ),
    ...tiered(
      course,
      'cities',
      { de: 'Stadtleser', en: 'City Reader' },
      [
        { de: '10 Städte auf Pro', en: '10 cities on Pro' },
        { de: '50 Städte auf Pro', en: '50 cities on Pro' },
        { de: 'Alle 100 Städte auf Pro', en: 'All 100 cities on Pro' },
      ],
      (tier, root, index) => {
        if (!index) return null;
        const ids = index.byKind.city.map((c) => c.id);
        return m(countAt(cp(root), ids, PRO), tier === 3 ? ids.length : tier === 2 ? 50 : 10);
      },
    ),
    ...tiered(
      course,
      'path',
      { de: 'Lernpfad', en: 'Learning Path' },
      [
        { de: '10 Lektionen abgeschlossen', en: '10 lessons completed' },
        { de: 'Die Hälfte aller Lektionen abgeschlossen', en: 'Half of all lessons completed' },
        { de: 'Alle Lektionen abgeschlossen', en: 'All lessons completed' },
      ],
      (tier, root, index) => {
        if (!index) return null;
        const total = index.content.lessons.length;
        const done = index.content.lessons.filter((l) => cp(root)?.lessons[l.id]).length;
        return m(done, tier === 1 ? Math.min(10, total) : tier === 2 ? Math.ceil(total / 2) : total);
      },
    ),
    ...tiered(
      course,
      'blitz',
      { de: 'Blitz', en: 'Lightning' },
      [
        { de: '15 richtige in einer Blitzrunde', en: '15 right in one Blitz round' },
        { de: '25 richtige in einer Blitzrunde', en: '25 right in one Blitz round' },
        { de: '35 richtige in einer Blitzrunde', en: '35 right in one Blitz round' },
      ],
      (tier, root) => m(Math.max(0, ...Object.values(cp(root)?.tempo?.best ?? {}).map((b) => b.score)), [15, 25, 35][tier - 1]),
    ),
    ...tiered(
      course,
      'flawless',
      { de: 'Fehlerfrei', en: 'Flawless' },
      [
        { de: '1 Lektion ohne Fehler', en: '1 lesson without a mistake' },
        { de: '5 Lektionen ohne Fehler', en: '5 lessons without a mistake' },
        { de: '15 Lektionen ohne Fehler', en: '15 lessons without a mistake' },
      ],
      (tier, root) => m(Object.values(cp(root)?.lessons ?? {}).filter((l) => !l.placed && l.bestTotal > 0 && l.bestCorrect === l.bestTotal).length, [1, 5, 15][tier - 1]),
    ),
  ];
  if (course === 'ru' || course === 'th' || course === 'bn') {
    list.push(
      ...tiered(
        course,
        'map',
        { de: 'Kartenkenner', en: 'Map Master' },
        [
          { de: 'Die Hälfte aller Kartengebiete auf Pro', en: 'Half of all map areas on Pro' },
          { de: 'Alle Kartengebiete auf Pro', en: 'All map areas on Pro' },
          { de: 'Alle Kartengebiete auf Expert', en: 'All map areas on Expert' },
        ],
        (tier, root, index) => {
          if (!index || !index.mapShapes.size) return null;
          const ids = [...index.mapShapes.keys()];
          return m(countAt(cp(root), ids, tier === 3 ? EXPERT : PRO), tier === 1 ? Math.ceil(ids.length / 2) : ids.length);
        },
      ),
    );
  }
  const sp = SPECIALS[course];
  if (sp) {
    list.push(
      single(course, 'special', sp.title, sp.description, (root, index) => {
        if (!index) return null;
        const ids = sp.ids(index);
        return ids.length ? m(countAt(cp(root), ids, PRO), ids.length) : null;
      }),
    );
  }
  return list;
}

// ---------------------------------------------------------------- scripts course

const lessonIds = (...nums: number[]) => SCRIPT_LESSONS.filter((l) => nums.includes(l.number)).flatMap((l) => l.newIds);
const SCRIPTS: AchievementDef[] = [
  ...tiered(
    'scripts',
    'spotter',
    { de: 'Schriftkenner', en: 'Script Spotter' },
    [
      { de: '10 Schriften auf Pro', en: '10 scripts on Pro' },
      { de: '20 Schriften auf Pro', en: '20 scripts on Pro' },
      { de: `Alle ${SCRIPT_ENTRIES.length} Schriften auf Pro`, en: `All ${SCRIPT_ENTRIES.length} scripts on Pro` },
    ],
    (tier, root) => m(countAt(root.courses.scripts, SCRIPT_ENTRIES.map((e) => e.id), PRO), [10, 20, SCRIPT_ENTRIES.length][tier - 1]),
  ),
  single('scripts', 'cyrillic', { de: 'Kyrillisch-Detektiv', en: 'Cyrillic Detective' }, { de: 'Alle Kyrillisch-Varianten auf Pro', en: 'All Cyrillic variants on Pro' }, (root) => {
    const ids = lessonIds(6, 7);
    return m(countAt(root.courses.scripts, ids, PRO), ids.length);
  }),
  single('scripts', 'india', { de: 'Indien-Kenner', en: 'India Expert' }, { de: 'Alle Schriften Indiens und Sri Lankas auf Pro', en: 'All scripts of India and Sri Lanka on Pro' }, (root) => {
    const ids = [...lessonIds(4, 5), 'scripts:devanagari'].filter((id) => id !== 'scripts:tibetan');
    return m(countAt(root.courses.scripts, ids, PRO), ids.length);
  }),
];

export const ACHIEVEMENTS: AchievementDef[] = [...GENERAL, ...CONTENT_COURSES.flatMap(courseAchievements), ...SCRIPTS, SECRET];
const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
export const achievementById = (id: string) => BY_ID.get(id);

/** Achievements that can be decided while this course is open (plus the general ones). */
function relevant(courseId: string): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.group === 'general' || a.group === courseId);
}

const reached = (r: { value: number; target: number } | null) => !!r && r.target > 0 && r.value >= r.target;

export function newlyUnlocked(root: ProgressRoot, courseId: string, index: CourseIndex | null): string[] {
  return relevant(courseId)
    .filter((a) => !root.profile.achievements[a.id] && reached(a.measure(root, index)))
    .map((a) => a.id);
}

/** Next goals of a course: unreached achievements with progress, the closest first. */
export function nextGoals(root: ProgressRoot, courseId: string, index: CourseIndex | null, n = 2): { def: AchievementDef; value: number; target: number }[] {
  const open = ACHIEVEMENTS.filter((a) => a.group === courseId && !root.profile.achievements[a.id]);
  // per family only the lowest open tier
  const firstOfFamily = open.filter((a) => !open.some((b) => b.family === a.family && (b.tier ?? 0) < (a.tier ?? 0)));
  return firstOfFamily
    .map((def) => ({ def, r: def.measure(root, index) }))
    .filter((x): x is { def: AchievementDef; r: { value: number; target: number } } => !!x.r && x.r.value > 0 && x.r.value < x.r.target)
    .sort((a, b) => b.r.value / b.r.target - a.r.value / a.r.target)
    .slice(0, n)
    .map(({ def, r }) => ({ def, ...r }));
}

/** "Stadtleser Silber" / "?" */
export function achievementTitle(def: AchievementDef, lang: 'de' | 'en'): string {
  return def.tier ? `${def.title[lang]} ${TIER_NAMES[def.tier][lang]}` : def.title[lang];
}
