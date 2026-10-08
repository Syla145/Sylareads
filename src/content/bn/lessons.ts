import type { Lesson, PhaseDef } from '../../domain/types';
import { CITIES, DISTRICT_GROUPS, DIVISIONS } from './places';
import { unitId } from './units';
import { byTier, chunk } from '../lessonHelpers';

export const PHASES: PhaseDef[] = [
  { id: 'principle', title: { de: 'Das Prinzip', en: 'The Principle' } },
  { id: 'consonants', title: { de: 'Konsonanten & Vokalzeichen', en: 'Consonants & Vowel Signs' } },
  { id: 'aspirates', title: { de: 'Behauchte Laute & Rest', en: 'Aspirates & the Rest' } },
  { id: 'vowels', title: { de: 'Zeichen & Vokale', en: 'Marks & Vowels' } },
  { id: 'clusters', title: { de: 'Verbundene Konsonanten', en: 'Joined Consonants' } },
  { id: 'regions', title: { de: 'Divisionen', en: 'Divisions' } },
  { id: 'districts', title: { de: 'Die 64 Distrikte', en: 'The 64 Districts' } },
  { id: 'cities', title: { de: 'Ortsnamen', en: 'Place Names' } },
  { id: 'terms', title: { de: 'GeoGuessr-Begriffe', en: 'GeoGuessr Terms' } },
];

const U = (...s: string[]) => s.map(unitId);
const C = (...s: string[]) => s.map((x) => `bn:combo:${x}`);
const W = (...s: string[]) => s.map((x) => `bn:word:${x}`);
const T = (...s: string[]) => s.map((x) => `bn:term:${x}`);

const core: Omit<Lesson, 'number'>[] = [
  {
    id: 'bn-l01', phaseId: 'principle', type: 'letters',
    title: { de: 'Konsonant + Vokal', en: 'Consonant + Vowel' },
    goal: {
      de: 'Jeder Konsonant trägt einen eingebauten Vokal: gesprochen eher o, in Ortsnamen a geschrieben (রংপুর = Rangpur). ◌া ist immer a: কা = ka.',
      en: 'Every consonant carries a built-in vowel: spoken more like o, written a in place names (রংপুর = Rangpur). ◌া is always a: কা = ka.',
    },
    newIds: U('ka', 'na', 'ma', 'la', 'ra', 'k-aa'),
    wordIds: W('nam', 'lal', 'kal', 'mala', 'kola'),
  },
  {
    id: 'bn-l02', phaseId: 'principle', type: 'letters',
    title: { de: 'Vokal links vom Konsonanten', en: 'Vowel Left of the Consonant' },
    goal: { de: '◌ি steht links, wird aber nach dem Konsonanten gelesen. Und: ব und র unterscheidet nur ein Punkt.', en: '◌ি is written on the left but read after the consonant. And: only a dot separates ব from র.' },
    newIds: U('ba', 'pa', 'ga', 'ta', 'k-i'),
    wordIds: [...W('baba', 'pani', 'gan', 'tal', 'bil')],
  },
  {
    id: 'bn-l03', phaseId: 'consonants', type: 'letters',
    title: { de: 'Häufige Konsonanten', en: 'Common Consonants' },
    goal: { de: 'দ, স, শ, জ, চ und das lange ◌ী – danach liest du নদী (Fluss) und বরিশাল.', en: 'দ, স, শ, জ, চ and the long ◌ী – afterwards you can read নদী (river) and বরিশাল.' },
    newIds: U('da', 'sa', 'sha', 'ja', 'ca', 'k-ii'),
    wordIds: [...W('cha', 'jomi', 'sat', 'dam', 'shila'), ...T('nodi')],
  },
  {
    id: 'bn-l04', phaseId: 'consonants', type: 'letters',
    title: { de: 'u-Laute', en: 'u Sounds' },
    goal: { de: 'ট, ড, হ, য় und die u-Zeichen unter dem Konsonanten. Danach: রাজশাহী, দিনাজপুর.', en: 'ট, ড, হ, য় and the u signs below the consonant. Afterwards: রাজশাহী, দিনাজপুর.' },
    newIds: U('tta', 'dda', 'ha', 'yya', 'k-u', 'k-uu'),
    wordIds: [...W('taka', 'dur', 'pukur', 'dak'), ...T('hat')],
  },
  {
    id: 'bn-l05', phaseId: 'consonants', type: 'letters',
    title: { de: 'Vokale, die umklammern', en: 'Vowels That Wrap Around' },
    goal: { de: '◌ে und ◌ৈ stehen links, ◌ো und ◌ৌ umklammern den Konsonanten. সিলেট = Sylhet.', en: '◌ে and ◌ৈ sit on the left, ◌ো and ◌ৌ wrap around the consonant. সিলেট = Sylhet.' },
    newIds: U('k-e', 'k-oi', 'k-o', 'k-ou', 'k-ri'),
    wordIds: [...W('desh', 'mela', 'tel', 'nouka', 'krishi'), ...T('road', 'setu')],
  },
  {
    id: 'bn-l06', phaseId: 'aspirates', type: 'letters',
    title: { de: 'Behauchte Laute I', en: 'Aspirates I' },
    goal: { de: 'খ, ঘ, ছ, ঝ, ঠ, ঢ – das h macht den Unterschied: ঢাকা = Dhaka, খুলনা = Khulna.', en: 'খ, ঘ, ছ, ঝ, ঠ, ঢ – the h makes the difference: ঢাকা = Dhaka, খুলনা = Khulna.' },
    newIds: U('kha', 'gha', 'cha', 'jha', 'ttha', 'ddha'),
    wordIds: W('ghor', 'khal', 'machh', 'thik'),
  },
  {
    id: 'bn-l07', phaseId: 'aspirates', type: 'letters',
    title: { de: 'Behauchte Laute II', en: 'Aspirates II' },
    goal: { de: 'থ, ধ, ফ, ভ sowie য (j) und ণ (n).', en: 'থ, ধ, ফ, ভ plus য (j) and ণ (n).' },
    newIds: U('tha', 'dha', 'pha', 'bha', 'ya', 'nna'),
    wordIds: [...W('dhan', 'phol', 'bhat', 'jog'), ...T('thana')],
  },
  {
    id: 'bn-l08', phaseId: 'aspirates', type: 'letters',
    title: { de: 'Letzte Konsonanten', en: 'Last Consonants' },
    goal: { de: 'ষ, ঙ, ঞ, ড়, ঢ়, ৎ – danach sind alle Konsonanten da. বগুড়া = Bogura.', en: 'ষ, ঙ, ঞ, ড়, ঢ়, ৎ – all consonants complete. বগুড়া = Bogura.' },
    newIds: U('ssa', 'nga', 'nya', 'rra', 'rha', 'khanda-ta'),
    wordIds: W('bari', 'gari', 'para', 'shat'),
  },
  {
    id: 'bn-l09', phaseId: 'vowels', type: 'letters',
    title: { de: 'Zusatzzeichen', en: 'Extra Marks' },
    goal: { de: '◌ং = ng, ◌ঁ = nasal, ◌্ = kein Vokal. রংপুর = Rangpur, চাঁদপুর = Chandpur.', en: '◌ং = ng, ◌ঁ = nasal, ◌্ = no vowel. রংপুর = Rangpur, চাঁদপুর = Chandpur.' },
    newIds: U('anusvar', 'bisarga', 'chandrabindu', 'hasanta'),
    wordIds: W('bangla', 'rong', 'chand', 'ga-village'),
  },
  {
    id: 'bn-l10', phaseId: 'vowels', type: 'letters',
    title: { de: 'Vokale am Wortanfang I', en: 'Word-initial Vowels I' },
    goal: { de: 'Am Wortanfang stehen Vokale als eigene Buchstaben: আম, এক, উপজেলা.', en: 'At the start of a word, vowels are letters of their own: আম, এক, উপজেলা.' },
    newIds: U('v-o', 'v-aa', 'v-i', 'v-u', 'v-e', 'v-oo'),
    wordIds: W('am', 'ek', 'it', 'onek', 'ojon'),
  },
  {
    id: 'bn-l11', phaseId: 'cities', type: 'letters',
    title: { de: 'Seltene Vokale am Wortanfang', en: 'Rare Word-initial Vowels' },
    goal: { de: 'ঈ, ঊ, ঋ, ঐ, ঔ – selten, aber dann wichtig.', en: 'ঈ, ঊ, ঋ, ঐ, ঔ – rare, but important when they appear.' },
    newIds: U('v-ii', 'v-uu', 'v-ri', 'v-oi', 'v-ou'),
    wordIds: W('id', 'rin', 'usha', 'oushodh'),
  },
  {
    id: 'bn-l12', phaseId: 'clusters', type: 'combos',
    title: { de: 'Phala und Reph', en: 'Phala and Reph' },
    goal: { de: 'r, y und b hängen sich an andere Konsonanten: গ্রাম = gram, পূর্ব = purbo.', en: 'r, y and b attach to other consonants: গ্রাম = gram, পূর্ব = purbo.' },
    newIds: C('raphala', 'yaphala', 'baphala', 'reph'),
  },
  {
    id: 'bn-l13', phaseId: 'clusters', type: 'combos',
    title: { de: 'Konjunkte I', en: 'Conjuncts I' },
    goal: { de: 'Zwei Konsonanten verschmelzen zu einem Zeichen: চট্টগ্রাম, কুমিল্লা, কক্সবাজার.', en: 'Two consonants merge into one sign: চট্টগ্রাম, কুমিল্লা, কক্সবাজার.' },
    newIds: C('tt', 'll', 'ks', 'nj', 'ngg', 'kkh'),
  },
  {
    id: 'bn-l14', phaseId: 'clusters', type: 'combos',
    title: { de: 'Konjunkte II', en: 'Conjuncts II' },
    goal: { de: 'Die übrigen Konjunkte aus den Ortsnamen dieses Kurses.', en: 'The remaining conjuncts from this course’s place names.' },
    newIds: C('sht', 'hm', 'ndh', 'nch', 'st', 'sk'),
  },
  {
    id: 'bn-l15', phaseId: 'clusters', type: 'combos',
    title: { de: 'Ortsnamen-Endungen', en: 'Place-Name Endings' },
    goal: { de: '-পুর, -গঞ্জ, -বাজার, -হাট, -গ্রাম, -খালী – erkennen statt buchstabieren.', en: '-পুর, -গঞ্জ, -বাজার, -হাট, -গ্রাম, -খালী – recognise them instead of spelling them out.' },
    newIds: C('suf-pur', 'suf-ganj', 'suf-bazar', 'suf-hat', 'suf-gram', 'suf-khali'),
  },
  {
    id: 'bn-l16', phaseId: 'terms', type: 'vocab',
    title: { de: 'Englische Lehnwörter', en: 'English Loanwords' },
    goal: { de: 'Viele Schilder schreiben englische Wörter in Bengali-Schrift: রোড = road.', en: 'Many signs write English words in Bengali script: রোড = road.' },
    newIds: T('road', 'station', 'college', 'school', 'bank', 'hotel', 'pharmacy', 'bus'),
  },
  {
    id: 'bn-l17', phaseId: 'terms', type: 'vocab',
    title: { de: 'Straße & Verwaltung', en: 'Roads & Administration' },
    goal: { de: 'সড়ক, জেলা, উপজেলা – auf fast jedem Wegweiser.', en: 'সড়ক, জেলা, উপজেলা – on almost every direction sign.' },
    newIds: T('sorok', 'mohasorok', 'setu', 'jela', 'upojela', 'bibhag', 'union', 'pourashava'),
  },
  {
    id: 'bn-l18', phaseId: 'terms', type: 'vocab',
    title: { de: 'Orte & Richtungen', en: 'Places & Directions' },
    goal: { de: 'Fluss, Dorf, Markt – und die vier Himmelsrichtungen.', en: 'River, village, market – and the four directions.' },
    newIds: T('nodi', 'gram', 'bazar', 'hat', 'uttor', 'dokkhin', 'purbo', 'poshchim'),
  },
  {
    id: 'bn-l19', phaseId: 'terms', type: 'vocab',
    title: { de: 'Am Straßenrand', en: 'By the Roadside' },
    goal: { de: 'Moschee, Tempel, Krankenhaus, Polizei – was man auf Street View ständig sieht.', en: 'Mosque, temple, hospital, police – what you keep seeing on Street View.' },
    newIds: T('moshjid', 'mondir', 'hashpatal', 'thana', 'madrasa', 'police', 'dokan', 'pump'),
  },
];

const cityLessons: Omit<Lesson, 'number'>[] = chunk(byTier(CITIES), 9).map((group, i) => ({
  id: `bn-city-${i + 1}`,
  phaseId: 'cities',
  type: 'places',
  title: { de: `Städte ${i + 1}`, en: `Cities ${i + 1}` },
  goal: {
    de: i === 0 ? 'Die wichtigsten Städte Bangladeschs.' : 'Weitere Distriktstädte von Wegweisern.',
    en: i === 0 ? 'Bangladesh’s most important cities.' : 'More district towns from direction signs.',
  },
  newIds: group.map((p) => p.id),
}));

const divisionLesson: Omit<Lesson, 'number'> = {
  id: 'bn-divisions',
  phaseId: 'regions',
  type: 'places',
  title: { de: 'Die acht Divisionen', en: 'The Eight Divisions' },
  goal: {
    de: 'Jede Division trägt den Namen ihrer Hauptstadt. বিভাগ (bibhag) heißt Division. Der eingebaute Vokal heißt in Namen a: রংপুর = Rangpur, বরিশাল = Barishal.',
    en: 'Each division is named after its capital. বিভাগ (bibhag) means division. The built-in vowel is written a in names: রংপুর = Rangpur, বরিশাল = Barishal.',
  },
  newIds: DIVISIONS.map((d) => d.id),
};

const districtLessons: Omit<Lesson, 'number'>[] = DISTRICT_GROUPS.map((g) => ({
  id: `bn-district-${g.id}`,
  phaseId: 'districts',
  type: 'places',
  title: g.title,
  goal: {
    de: `${g.slugs.length} Distrikte lesen und auf der Karte finden. Jeder Distrikt heißt wie seine Hauptstadt.`,
    en: `Read ${g.slugs.length} districts and find them on the map. Each district is named after its main town.`,
  },
  newIds: g.slugs.map((s) => `bn:district:${s}`),
}));

// The letters the divisions and districts need come first (all letter and
// cluster lessons except the rare word-initial vowels), then divisions, the
// 64 districts and the cities: those narrow down the location most. The rare
// vowels (needed by one city) come right before the cities, the GeoGuessr
// terms (road, bridge, mosque …) last. A test checks that every place lesson
// only uses letters taught before it.
const byId = (id: string) => core.find((l) => l.id === id)!;
const isTerm = (l: Omit<Lesson, 'number'>) => l.phaseId === 'terms';
const letters = core.filter((l) => !isTerm(l) && l.id !== 'bn-l11');
export const LESSONS: Lesson[] = [...letters, divisionLesson, ...districtLessons, byId('bn-l11'), ...cityLessons, ...core.filter(isTerm)].map((l, i) => ({
  ...l,
  number: i + 1,
}));
