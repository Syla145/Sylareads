import type { L10n } from '../../domain/types';

/**
 * Kurs „Schriften erkennen“: an einem Schild sehen, welche Schrift das ist und
 * wo man ist. Die Antwort ist immer der Ort (Land oder Region), der Name der
 * Schrift steht als Info dabei. Nur Länder mit Street View in GeoGuessr.
 *
 * Beispiele sind echte Ortsnamen, so wie sie auf Schildern stehen.
 * Kyrillisch-Varianten und lateinische Sonderzeichen haben nur Beispiele, die
 * ihr Erkennungszeichen enthalten (ein Test prüft das).
 */

export interface ScriptSample {
  native: string;
  /** Bekannter Name in Lateinschrift. */
  latin: string;
}

export interface ScriptFeature {
  text: L10n;
  /** Beispielzeichen, groß neben dem Text gezeigt. */
  mark?: string;
}

export interface ScriptEntry {
  /** Item-ID, z. B. "scripts:lao". */
  id: string;
  /** Name der Schrift (Info). */
  name: L10n;
  /** Die Antwort: wo man ist. */
  where: L10n;
  /** CSS-Schriftfamilie für Beispiele (Klasse script-font-<font>). */
  font: ScriptFont;
  /** Rechts nach links. */
  rtl?: boolean;
  features: ScriptFeature[];
  samples: ScriptSample[];
  /** Schriften, mit denen diese leicht verwechselt wird (bevorzugte Ablenker). */
  confusable: string[];
  /** Einträge, deren Orte sich überschneiden: nie zusammen als Antworten zeigen. */
  overlaps?: string[];
}

export type ScriptFont =
  | 'latin'
  | 'arabic'
  | 'hebrew'
  | 'thai'
  | 'lao'
  | 'khmer'
  | 'devanagari'
  | 'bengali'
  | 'gurmukhi'
  | 'gujarati'
  | 'oriya'
  | 'tibetan'
  | 'georgian'
  | 'tamil'
  | 'telugu'
  | 'kannada'
  | 'malayalam'
  | 'sinhala'
  | 'jp'
  | 'tc'
  | 'kr';

export interface ScriptLesson {
  id: string;
  number: number;
  title: L10n;
  goal: L10n;
  /** Neue Schriften dieser Lektion. */
  newIds: string[];
  /** Schon bekannte Schriften, die zum Vergleich wieder vorkommen. */
  reviewIds?: string[];
}

const id = (s: string) => `scripts:${s}`;

export const SCRIPT_ENTRIES: ScriptEntry[] = [
  // ---------------------------------------------------------------- 1 Erster Blick
  {
    id: id('cyrillic'),
    name: { de: 'Kyrillisch', en: 'Cyrillic' },
    where: { de: 'Osteuropa, Balkan, Zentralasien, Mongolei', en: 'Eastern Europe, Balkans, Central Asia, Mongolia' },
    font: 'latin',
    features: [
      { text: { de: 'Sieht aus wie Latein mit „verdrehten“ Buchstaben', en: 'Looks like Latin with “twisted” letters' }, mark: 'И Я Ж Д Л П' },
      { text: { de: 'Falsche Freunde: sehen lateinisch aus, sind es aber nicht', en: 'False friends: they look Latin but are not' }, mark: 'Р Н В С' },
    ],
    samples: [
      { native: 'Москва', latin: 'Moskva' },
      { native: 'Київ', latin: 'Kyiv' },
      { native: 'София', latin: 'Sofia' },
      { native: 'Алматы', latin: 'Almaty' },
    ],
    confusable: [id('greek')],
  },
  {
    id: id('greek'),
    name: { de: 'Griechisch', en: 'Greek' },
    where: { de: 'Griechenland, Zypern', en: 'Greece, Cyprus' },
    font: 'latin',
    features: [
      { text: { de: 'Eckige Sonderformen, die es nur hier gibt', en: 'Angular special shapes found only here' }, mark: 'Σ Ω Θ Ψ λ' },
      { text: { de: 'Akzente auf den Vokalen; kein И, Я, Ж', en: 'Accents on vowels; no И, Я, Ж' }, mark: 'ά ή ώ' },
    ],
    samples: [
      { native: 'Αθήνα', latin: 'Athina' },
      { native: 'Θεσσαλονίκη', latin: 'Thessaloniki' },
      { native: 'Πάτρα', latin: 'Patra' },
      { native: 'Λευκωσία', latin: 'Lefkosia' },
    ],
    confusable: [id('cyrillic')],
  },
  {
    id: id('arabic'),
    name: { de: 'Arabisch', en: 'Arabic' },
    where: { de: 'Arabische Halbinsel, Jordanien, Libanon, Palästina, Tunesien', en: 'Arabian Peninsula, Jordan, Lebanon, Palestine, Tunisia' },
    font: 'arabic',
    rtl: true,
    features: [
      { text: { de: 'Von rechts nach links, die Buchstaben hängen an einer Grundlinie zusammen', en: 'Right to left, letters joined along a baseline' }, mark: 'ـبـ' },
      { text: { de: 'Viele Punkte über und unter der Linie', en: 'Many dots above and below the line' }, mark: 'ث ج ي' },
    ],
    samples: [
      { native: 'عمّان', latin: 'Amman' },
      { native: 'دبي', latin: 'Dubai' },
      { native: 'الدوحة', latin: 'Doha' },
      { native: 'تونس', latin: 'Tunis' },
    ],
    confusable: [id('hebrew')],
  },
  {
    id: id('hebrew'),
    name: { de: 'Hebräisch', en: 'Hebrew' },
    where: { de: 'Israel', en: 'Israel' },
    font: 'hebrew',
    rtl: true,
    features: [
      { text: { de: 'Von rechts nach links, aber jeder Buchstabe steht für sich', en: 'Right to left, but every letter stands alone' }, mark: 'ש ל ם' },
      { text: { de: 'Eckige Blockformen, kaum Punkte, keine Verbindungslinie', en: 'Square block shapes, hardly any dots, no joining line' }, mark: 'א ב ה' },
    ],
    samples: [
      { native: 'ירושלים', latin: 'Yerushalayim' },
      { native: 'תל אביב', latin: 'Tel Aviv' },
      { native: 'חיפה', latin: 'Haifa' },
      { native: 'אילת', latin: 'Eilat' },
    ],
    confusable: [id('arabic')],
  },
  {
    id: id('thai'),
    name: { de: 'Thai', en: 'Thai' },
    where: { de: 'Thailand', en: 'Thailand' },
    font: 'thai',
    features: [
      { text: { de: 'Kleine Schlaufen („Köpfchen“) an fast jedem Zeichen', en: 'Small loops (“heads”) on almost every letter' }, mark: 'ก ข ค ง' },
      { text: { de: 'Zeichen über und unter der Zeile, keine Leerzeichen zwischen Wörtern', en: 'Marks above and below the line, no spaces between words' }, mark: 'ไ ใ ่ ้' },
    ],
    samples: [
      { native: 'กรุงเทพฯ', latin: 'Krung Thep (Bangkok)' },
      { native: 'เชียงใหม่', latin: 'Chiang Mai' },
      { native: 'ภูเก็ต', latin: 'Phuket' },
      { native: 'ขอนแก่น', latin: 'Khon Kaen' },
    ],
    confusable: [id('lao'), id('khmer')],
  },
  {
    id: id('devanagari'),
    name: { de: 'Devanagari (Hindi, Marathi)', en: 'Devanagari (Hindi, Marathi)' },
    where: { de: 'Nord- und Zentralindien, Maharashtra', en: 'North and Central India, Maharashtra' },
    font: 'devanagari',
    features: [
      { text: { de: 'Durchgehende Linie oben, an der die Zeichen hängen', en: 'A continuous line on top that the letters hang from' }, mark: 'नगर' },
      { text: { de: 'Viele senkrechte Striche und eckige Formen', en: 'Many vertical strokes and angular shapes' }, mark: 'ा प ग' },
    ],
    samples: [
      { native: 'नई दिल्ली', latin: 'Nai Dilli (New Delhi)' },
      { native: 'जयपुर', latin: 'Jaipur' },
      { native: 'मुंबई', latin: 'Mumbai' },
      { native: 'लखनऊ', latin: 'Lakhnau (Lucknow)' },
    ],
    confusable: [id('bengali'), id('gurmukhi'), id('gujarati')],
  },

  // ---------------------------------------------------------------- 2 Ostasien
  {
    id: id('japanese'),
    name: { de: 'Japanisch', en: 'Japanese' },
    where: { de: 'Japan', en: 'Japan' },
    font: 'jp',
    features: [
      { text: { de: 'Schriftzeichen gemischt mit einfachen Silbenzeichen – rund (Hiragana) oder eckig (Katakana)', en: 'Characters mixed with simple syllable signs – round (hiragana) or angular (katakana)' }, mark: 'の た ア ン' },
      { text: { de: 'Sieht man の oder ン, ist es Japan', en: 'If you see の or ン, it is Japan' }, mark: 'の ン' },
    ],
    samples: [
      { native: 'さいたま', latin: 'Saitama' },
      { native: 'つくば', latin: 'Tsukuba' },
      { native: 'いわき', latin: 'Iwaki' },
      { native: '南アルプス', latin: 'Minami-Arupusu' },
    ],
    confusable: [id('chinese'), id('korean')],
  },
  {
    id: id('chinese'),
    name: { de: 'Chinesisch (Langzeichen)', en: 'Chinese (traditional)' },
    where: { de: 'Taiwan, Hongkong, Macau', en: 'Taiwan, Hong Kong, Macau' },
    font: 'tc',
    features: [
      { text: { de: 'Nur Schriftzeichen, keine Silbenzeichen dazwischen', en: 'Only characters, no syllable signs in between' }, mark: '北 港' },
      { text: { de: 'Langzeichen mit vielen Strichen', en: 'Traditional characters with many strokes' }, mark: '臺 灣 門' },
    ],
    samples: [
      { native: '臺北', latin: 'Taipei' },
      { native: '高雄', latin: 'Kaohsiung' },
      { native: '香港', latin: 'Hong Kong' },
      { native: '澳門', latin: 'Macau' },
    ],
    confusable: [id('japanese'), id('korean')],
  },
  {
    id: id('korean'),
    name: { de: 'Koreanisch (Hangeul)', en: 'Korean (Hangul)' },
    where: { de: 'Südkorea', en: 'South Korea' },
    font: 'kr',
    features: [
      { text: { de: 'Kreise und gerade Striche', en: 'Circles and straight strokes' }, mark: 'ㅇ ㅎ ㅂ' },
      { text: { de: 'Jeder Block ist eine Silbe aus 2–3 Teilen', en: 'Every block is one syllable made of 2–3 parts' }, mark: '서 울' },
    ],
    samples: [
      { native: '서울', latin: 'Seoul' },
      { native: '부산', latin: 'Busan' },
      { native: '인천', latin: 'Incheon' },
      { native: '대구', latin: 'Daegu' },
    ],
    confusable: [id('japanese'), id('chinese')],
  },

  // ---------------------------------------------------------------- 3 Südostasien
  {
    id: id('lao'),
    name: { de: 'Laotisch', en: 'Lao' },
    where: { de: 'Laos', en: 'Laos' },
    font: 'lao',
    features: [
      { text: { de: 'Wie Thai, aber runder und schlichter – kaum Köpfchen', en: 'Like Thai but rounder and plainer – hardly any loops' }, mark: 'ກ ຂ ຄ' },
      { text: { de: 'Typisch laotisch: ຽ in der Zeile und der kleine Haken unter ຫຼ', en: 'Typically Lao: ຽ in the line and the small hook under ຫຼ' }, mark: 'ຽ ຫຼ' },
    ],
    samples: [
      { native: 'ວຽງຈັນ', latin: 'Viangchan (Vientiane)' },
      { native: 'ຫຼວງພະບາງ', latin: 'Luang Prabang' },
      { native: 'ປາກເຊ', latin: 'Pakse' },
      { native: 'ສະຫວັນນະເຂດ', latin: 'Savannakhet' },
    ],
    confusable: [id('thai'), id('khmer')],
  },
  {
    id: id('khmer'),
    name: { de: 'Khmer', en: 'Khmer' },
    where: { de: 'Kambodscha', en: 'Cambodia' },
    font: 'khmer',
    features: [
      { text: { de: 'Viele kleine „Hütchen“ und Häkchen oben auf den Zeichen', en: 'Many small “hats” and hooks on top of the letters' }, mark: 'ក ព ស' },
      { text: { de: 'Zeichen werden untereinander gestapelt – die Zeile wirkt hoch und dicht', en: 'Letters are stacked below each other – the line looks tall and dense' }, mark: 'ភ្នំ' },
    ],
    samples: [
      { native: 'ភ្នំពេញ', latin: 'Phnom Penh' },
      { native: 'សៀមរាប', latin: 'Siem Reap' },
      { native: 'បាត់ដំបង', latin: 'Battambang' },
      { native: 'កំពត', latin: 'Kampot' },
    ],
    confusable: [id('thai'), id('lao')],
  },

  // ---------------------------------------------------------------- 4 Indien Nord & Bhutan
  {
    id: id('bengali'),
    name: { de: 'Bengalisch', en: 'Bengali' },
    where: { de: 'Bangladesch, Westbengalen, Tripura', en: 'Bangladesh, West Bengal, Tripura' },
    font: 'bengali',
    features: [
      { text: { de: 'Linie oben wie Devanagari, aber mit Lücken', en: 'A top line like Devanagari, but with gaps' }, mark: 'ঢাকা' },
      { text: { de: 'Spitze Dreiecksformen', en: 'Pointed triangular shapes' }, mark: 'ব ক ঝ' },
    ],
    samples: [
      { native: 'ঢাকা', latin: 'Dhaka' },
      { native: 'কলকাতা', latin: 'Kolkata' },
      { native: 'চট্টগ্রাম', latin: 'Chattogram' },
      { native: 'আগরতলা', latin: 'Agartala' },
    ],
    confusable: [id('devanagari'), id('gurmukhi'), id('oriya')],
  },
  {
    id: id('gurmukhi'),
    name: { de: 'Gurmukhi (Punjabi)', en: 'Gurmukhi (Punjabi)' },
    where: { de: 'Punjab (Indien)', en: 'Punjab (India)' },
    font: 'gurmukhi',
    features: [
      { text: { de: 'Linie oben, die Zeichen wirken offen und rund', en: 'A top line; the letters look open and round' }, mark: 'ਪ ਰ ਨ' },
      { text: { de: 'Typisch: ੳ und ਅ, dazu kleine Bögen und Punkte oben', en: 'Typical: ੳ and ਅ, plus small arcs and dots on top' }, mark: 'ੳ ਅ ੰ' },
    ],
    samples: [
      { native: 'ਅੰਮ੍ਰਿਤਸਰ', latin: 'Amritsar' },
      { native: 'ਲੁਧਿਆਣਾ', latin: 'Ludhiana' },
      { native: 'ਜਲੰਧਰ', latin: 'Jalandhar' },
      { native: 'ਪਟਿਆਲਾ', latin: 'Patiala' },
    ],
    confusable: [id('devanagari'), id('bengali'), id('gujarati')],
  },
  {
    id: id('gujarati'),
    name: { de: 'Gujarati', en: 'Gujarati' },
    where: { de: 'Gujarat (Indien)', en: 'Gujarat (India)' },
    font: 'gujarati',
    features: [
      { text: { de: 'Wie Devanagari, aber ohne die Linie oben', en: 'Like Devanagari, but without the top line' }, mark: 'અ ગ દ' },
      { text: { de: 'Runde, geschwungene Zeichen', en: 'Round, curved letters' }, mark: 'સ ર ત' },
    ],
    samples: [
      { native: 'અમદાવાદ', latin: 'Amdavad (Ahmedabad)' },
      { native: 'સુરત', latin: 'Surat' },
      { native: 'વડોદરા', latin: 'Vadodara' },
      { native: 'રાજકોટ', latin: 'Rajkot' },
    ],
    confusable: [id('devanagari'), id('gurmukhi'), id('oriya')],
  },
  {
    id: id('oriya'),
    name: { de: 'Odia', en: 'Odia' },
    where: { de: 'Odisha (Indien)', en: 'Odisha (India)' },
    font: 'oriya',
    features: [
      { text: { de: 'Ein runder „Schirm“ als Bogen oben auf fast jedem Zeichen', en: 'A round “umbrella” arc on top of almost every letter' }, mark: 'ଓ କ ର' },
      { text: { de: 'Keine durchgehende Linie oben', en: 'No continuous top line' }, mark: 'ପୁରୀ' },
    ],
    samples: [
      { native: 'ଭୁବନେଶ୍ୱର', latin: 'Bhubaneswar' },
      { native: 'କଟକ', latin: 'Cuttack' },
      { native: 'ପୁରୀ', latin: 'Puri' },
      { native: 'ରାଉରକେଲା', latin: 'Rourkela' },
    ],
    confusable: [id('bengali'), id('gujarati'), id('malayalam')],
  },
  {
    id: id('tibetan'),
    name: { de: 'Tibetisch (Dzongkha)', en: 'Tibetan (Dzongkha)' },
    where: { de: 'Bhutan', en: 'Bhutan' },
    font: 'tibetan',
    features: [
      { text: { de: 'Die Zeichen hängen an einer Linie oben wie Wimpel', en: 'Letters hang from a top line like pennants' }, mark: 'ཐ ཕ ཁ' },
      { text: { de: 'Ein Punkt zwischen jeder Silbe', en: 'A dot between every syllable' }, mark: '་' },
    ],
    samples: [
      { native: 'ཐིམ་ཕུ', latin: 'Thimphu' },
      { native: 'སྤ་རོ', latin: 'Paro' },
      { native: 'སྤུ་ན་ཁ', latin: 'Punakha' },
    ],
    confusable: [id('devanagari'), id('gurmukhi'), id('bengali')],
  },

  // ---------------------------------------------------------------- 5 Südindien & Sri Lanka
  {
    id: id('tamil'),
    name: { de: 'Tamil', en: 'Tamil' },
    where: { de: 'Tamil Nadu (Indien), Nord- und Ostsri Lanka', en: 'Tamil Nadu (India), northern and eastern Sri Lanka' },
    font: 'tamil',
    features: [
      { text: { de: 'Eckige, kastenförmige Zeichen ohne Linie oben', en: 'Angular, box-like letters without a top line' }, mark: 'க ம ப' },
      { text: { de: 'Punkte oben und viele gleich hohe Zeichen', en: 'Dots on top and many letters of the same height' }, mark: 'ன் ட்' },
    ],
    samples: [
      { native: 'சென்னை', latin: 'Chennai' },
      { native: 'மதுரை', latin: 'Madurai' },
      { native: 'கோயம்புத்தூர்', latin: 'Koyampuththur (Coimbatore)' },
      { native: 'யாழ்ப்பாணம்', latin: 'Yazhpanam (Jaffna)' },
    ],
    confusable: [id('malayalam'), id('telugu'), id('sinhala')],
  },
  {
    id: id('telugu'),
    name: { de: 'Telugu', en: 'Telugu' },
    where: { de: 'Andhra Pradesh, Telangana (Indien)', en: 'Andhra Pradesh, Telangana (India)' },
    font: 'telugu',
    features: [
      { text: { de: 'Runde Zeichen mit einem Häkchen oben wie ein ✓', en: 'Round letters with a tick on top like ✓' }, mark: 'క మ వ' },
      { text: { de: 'Sehr ähnlich wie Kannada – das Häkchen ist der Unterschied', en: 'Very similar to Kannada – the tick is the difference' }, mark: 'త' },
    ],
    samples: [
      { native: 'హైదరాబాద్', latin: 'Haidarabad (Hyderabad)' },
      { native: 'విజయవాడ', latin: 'Vijayawada' },
      { native: 'విశాఖపట్నం', latin: 'Visakhapatnam' },
      { native: 'తిరుపతి', latin: 'Tirupati' },
    ],
    confusable: [id('kannada'), id('malayalam'), id('tamil')],
  },
  {
    id: id('kannada'),
    name: { de: 'Kannada', en: 'Kannada' },
    where: { de: 'Karnataka (Indien)', en: 'Karnataka (India)' },
    font: 'kannada',
    features: [
      { text: { de: 'Wie Telugu, aber oben ein waagrechter, offener Strich statt Häkchen', en: 'Like Telugu, but a flat, open stroke on top instead of a tick' }, mark: 'ಕ ಮ ಬ' },
      { text: { de: 'Häufig in Ortsnamen: ಳ und die Endung ೂರು (-uru)', en: 'Common in place names: ಳ and the ending ೂರು (-uru)' }, mark: 'ಳ ರು' },
    ],
    samples: [
      { native: 'ಬೆಂಗಳೂರು', latin: 'Bengaluru' },
      { native: 'ಮೈಸೂರು', latin: 'Mysuru' },
      { native: 'ಮಂಗಳೂರು', latin: 'Mangaluru' },
      { native: 'ಹುಬ್ಬಳ್ಳಿ', latin: 'Hubballi' },
    ],
    confusable: [id('telugu'), id('malayalam'), id('tamil')],
  },
  {
    id: id('malayalam'),
    name: { de: 'Malayalam', en: 'Malayalam' },
    where: { de: 'Kerala (Indien)', en: 'Kerala (India)' },
    font: 'malayalam',
    features: [
      { text: { de: 'Breite, runde Schleifen – wie eine Kette aus Kreisen', en: 'Wide, round loops – like a chain of circles' }, mark: 'ന മ ര' },
      { text: { de: 'Kein Häkchen oben, oft sehr lange Wörter', en: 'No tick on top, often very long words' }, mark: 'ം' },
    ],
    samples: [
      { native: 'തിരുവനന്തപുരം', latin: 'Thiruvananthapuram' },
      { native: 'കൊച്ചി', latin: 'Kochi' },
      { native: 'കോഴിക്കോട്', latin: 'Kozhikode' },
      { native: 'തൃശ്ശൂർ', latin: 'Thrissur' },
    ],
    confusable: [id('tamil'), id('telugu'), id('kannada'), id('sinhala')],
  },
  {
    id: id('sinhala'),
    name: { de: 'Singhalesisch', en: 'Sinhala' },
    where: { de: 'Sri Lanka', en: 'Sri Lanka' },
    font: 'sinhala',
    features: [
      { text: { de: 'Sehr runde Zeichen mit Bögen, die nach links auslaufen', en: 'Very round letters with curves ending to the left' }, mark: 'ම ක ල' },
      { text: { de: 'Typisch: das Kringel-Zeichen ෙ vor dem Buchstaben und ශ්‍රී (Sri)', en: 'Typical: the curl ෙ before the letter and ශ්‍රී (Sri)' }, mark: 'ෙ ශ්‍රී' },
    ],
    samples: [
      { native: 'කොළඹ', latin: 'Kolamba (Colombo)' },
      { native: 'මහනුවර', latin: 'Mahanuwara (Kandy)' },
      { native: 'ගාල්ල', latin: 'Galla (Galle)' },
      { native: 'අනුරාධපුරය', latin: 'Anuradhapuraya' },
    ],
    confusable: [id('tamil'), id('malayalam')],
  },

  // ---------------------------------------------------------------- 6 Kyrillisch I
  {
    id: id('russian'),
    name: { de: 'Russisch', en: 'Russian' },
    where: { de: 'Russland', en: 'Russia' },
    font: 'latin',
    features: [
      { text: { de: 'ы und э gibt es im Russischen, nicht im Ukrainischen oder Bulgarischen', en: 'Russian has ы and э; Ukrainian and Bulgarian do not' }, mark: 'ы э' },
      { text: { de: 'Kein і, ї, є, und ъ ist selten', en: 'No і, ї, є, and ъ is rare' }, mark: 'ё' },
    ],
    samples: [
      { native: 'Сыктывкар', latin: 'Syktyvkar' },
      { native: 'Электросталь', latin: 'Elektrostal' },
      { native: 'Рыбинск', latin: 'Rybinsk' },
      { native: 'Улан-Удэ', latin: 'Ulan-Ude' },
    ],
    confusable: [id('ukrainian'), id('bulgarian'), id('serbian')],
  },
  {
    id: id('ukrainian'),
    name: { de: 'Ukrainisch', en: 'Ukrainian' },
    where: { de: 'Ukraine', en: 'Ukraine' },
    font: 'latin',
    features: [
      { text: { de: 'Buchstaben mit Punkten oder Strich: і, ї, є, ґ', en: 'Letters with dots or a stroke: і, ї, є, ґ' }, mark: 'і ї є ґ' },
      { text: { de: 'Kein ы, э, ё', en: 'No ы, э, ё' }, mark: 'и і' },
    ],
    samples: [
      { native: 'Київ', latin: 'Kyiv' },
      { native: 'Миколаїв', latin: 'Mykolaiv' },
      { native: 'Ізмаїл', latin: 'Izmail' },
    ],
    confusable: [id('russian'), id('bulgarian'), id('kazakh')],
  },
  {
    id: id('bulgarian'),
    name: { de: 'Bulgarisch', en: 'Bulgarian' },
    where: { de: 'Bulgarien', en: 'Bulgaria' },
    font: 'latin',
    features: [
      { text: { de: 'ъ mitten im Wort, als Vokal', en: 'ъ in the middle of a word, as a vowel' }, mark: 'Тър' },
      { text: { de: 'Kein ы, э, ё, і', en: 'No ы, э, ё, і' }, mark: 'ъ щ' },
    ],
    samples: [
      { native: 'Търговище', latin: 'Targovishte' },
      { native: 'Кърджали', latin: 'Kardzhali' },
      { native: 'Велико Търново', latin: 'Veliko Tarnovo' },
    ],
    confusable: [id('russian'), id('macedonian'), id('serbian')],
  },

  // ---------------------------------------------------------------- 7 Kyrillisch II
  {
    id: id('serbian'),
    name: { de: 'Serbisch', en: 'Serbian' },
    where: { de: 'Serbien, Republika Srpska (Bosnien), Montenegro', en: 'Serbia, Republika Srpska (Bosnia), Montenegro' },
    font: 'latin',
    features: [
      { text: { de: 'ђ, ћ, џ, љ, њ und ј', en: 'ђ, ћ, џ, љ, њ and ј' }, mark: 'ђ ћ џ љ' },
      { text: { de: 'Kein ы, э, й, ъ', en: 'No ы, э, й, ъ' }, mark: 'ј' },
    ],
    samples: [
      { native: 'Ћуприја', latin: 'Ćuprija' },
      { native: 'Параћин', latin: 'Paraćin' },
      { native: 'Ћићевац', latin: 'Ćićevac' },
    ],
    confusable: [id('macedonian'), id('bulgarian'), id('russian')],
    overlaps: [id('croatian')],
  },
  {
    id: id('macedonian'),
    name: { de: 'Mazedonisch', en: 'Macedonian' },
    where: { de: 'Nordmazedonien', en: 'North Macedonia' },
    font: 'latin',
    features: [
      { text: { de: 'ѓ, ќ, ѕ gibt es nur hier', en: 'ѓ, ќ, ѕ exist only here' }, mark: 'ѓ ќ ѕ' },
      { text: { de: 'ј, љ, њ wie im Serbischen, aber nie ђ oder ћ', en: 'ј, љ, њ as in Serbian, but never ђ or ћ' }, mark: 'ј' },
    ],
    samples: [
      { native: 'Ѓорче Петров', latin: 'Gjorče Petrov' },
      { native: 'Ѓавато', latin: 'Gjavato' },
    ],
    confusable: [id('serbian'), id('bulgarian')],
  },
  {
    id: id('kazakh'),
    name: { de: 'Kasachisch', en: 'Kazakh' },
    where: { de: 'Kasachstan', en: 'Kazakhstan' },
    font: 'latin',
    features: [
      { text: { de: 'Buchstaben mit Haken und Strichen', en: 'Letters with hooks and strokes' }, mark: 'қ ғ ң ұ' },
      { text: { de: 'Dazu ә, ө, ү, һ, і', en: 'Plus ә, ө, ү, һ, і' }, mark: 'ә ө' },
    ],
    samples: [
      { native: 'Қарағанды', latin: 'Qaraghandy (Karaganda)' },
      { native: 'Қостанай', latin: 'Qostanai (Kostanay)' },
      { native: 'Қызылорда', latin: 'Qyzylorda' },
      { native: 'Ақтөбе', latin: 'Aqtöbe' },
    ],
    confusable: [id('mongolian'), id('russian'), id('ukrainian')],
  },
  {
    id: id('mongolian'),
    name: { de: 'Mongolisch', en: 'Mongolian' },
    where: { de: 'Mongolei', en: 'Mongolia' },
    font: 'latin',
    features: [
      { text: { de: 'ө und ү, aber kein қ, ғ, ә', en: 'ө and ү, but no қ, ғ, ә' }, mark: 'ө ү' },
      { text: { de: 'Viele doppelte Vokale: аа, ээ, үү (Kirgisistan schreibt ähnlich, hat aber ң)', en: 'Many double vowels: аа, ээ, үү (Kyrgyzstan looks similar but has ң)' }, mark: 'аа ээ' },
    ],
    samples: [
      { native: 'Улаанбаатар', latin: 'Ulaanbaatar' },
      { native: 'Сүхбаатар', latin: 'Sükhbaatar' },
      { native: 'Зүүнхараа', latin: 'Züünkharaa' },
      { native: 'Өндөрхаан', latin: 'Öndörkhaan' },
    ],
    confusable: [id('kazakh'), id('russian')],
  },
  // ---------------------------------------------------------------- 8 Georgien
  {
    id: id('georgian'),
    name: { de: 'Georgisch', en: 'Georgian' },
    where: { de: 'Georgien', en: 'Georgia' },
    font: 'georgian',
    features: [
      { text: { de: 'Runde Buchstaben mit Bögen und Schlaufen, ohne Linie oben und ohne Großbuchstaben', en: 'Round letters with arches and loops, no top line and no capitals' }, mark: 'ა ბ გ' },
      { text: { de: 'Viele Ortsnamen enden auf ი (-i): Tbilisi, Kutaisi', en: 'Many place names end in ი (-i): Tbilisi, Kutaisi' }, mark: 'ი' },
    ],
    samples: [
      { native: 'თბილისი', latin: 'Tbilisi' },
      { native: 'ბათუმი', latin: 'Batumi' },
      { native: 'ქუთაისი', latin: 'Kutaisi' },
      { native: 'რუსთავი', latin: 'Rustavi' },
      { native: 'ზუგდიდი', latin: 'Zugdidi' },
    ],
    confusable: [id('sinhala'), id('malayalam'), id('lao')],
  },

  // ---------------------------------------------------------------- 9 Lateinisch I: Mitteleuropa
  {
    id: id('hungarian'),
    name: { de: 'Ungarisch', en: 'Hungarian' },
    where: { de: 'Ungarn', en: 'Hungary' },
    font: 'latin',
    features: [
      { text: { de: 'ő und ű mit zwei Strichen gibt es nur im Ungarischen', en: 'ő and ű with two strokes exist only in Hungarian' }, mark: 'ő ű' },
      { text: { de: 'Viele Buchstabenpaare: sz, gy, cs, zs, ny', en: 'Many letter pairs: sz, gy, cs, zs, ny' }, mark: 'gy sz' },
    ],
    samples: [
      { native: 'Győr', latin: 'Gyor' },
      { native: 'Kőszeg', latin: 'Koszeg' },
      { native: 'Balatonfűzfő', latin: 'Balatonfuzfo' },
      { native: 'Hódmezővásárhely', latin: 'Hodmezovasarhely' },
      { native: 'Mezőkövesd', latin: 'Mezokovesd' },
    ],
    confusable: [id('czech'), id('slovak'), id('turkish'), id('finnish')],
  },
  {
    id: id('polish'),
    name: { de: 'Polnisch', en: 'Polish' },
    where: { de: 'Polen', en: 'Poland' },
    font: 'latin',
    features: [
      { text: { de: 'ł mit Querstrich und ż mit Punkt gibt es nur im Polnischen', en: 'ł with a bar and ż with a dot exist only in Polish' }, mark: 'ł ż' },
      { text: { de: 'Striche nach oben: ś, ź, ń (statt Häkchen wie š, ž, ň in Tschechien)', en: 'Acute strokes: ś, ź, ń (instead of carons like š, ž, ň in Czechia)' }, mark: 'ś ź ń' },
      { text: { de: 'Dazu ą und ę mit Schwänzchen, und viele cz, sz, rz', en: 'Plus ą and ę with a tail, and many cz, sz, rz' }, mark: 'ą ę' },
    ],
    samples: [
      { native: 'Łódź', latin: 'Lodz' },
      { native: 'Wrocław', latin: 'Wroclaw (Breslau)' },
      { native: 'Białystok', latin: 'Bialystok' },
      { native: 'Gdańsk', latin: 'Gdansk (Danzig)' },
      { native: 'Świnoujście', latin: 'Swinoujscie (Swinemünde)' },
    ],
    confusable: [id('czech'), id('slovak'), id('lithuanian'), id('croatian')],
  },
  {
    id: id('czech'),
    name: { de: 'Tschechisch', en: 'Czech' },
    where: { de: 'Tschechien', en: 'Czechia' },
    font: 'latin',
    features: [
      { text: { de: 'ř, ě und ů mit Ring gibt es nur im Tschechischen', en: 'ř, ě and ů with a ring exist only in Czech' }, mark: 'ř ě ů' },
      { text: { de: 'Häkchen wie in der Slowakei (č, š, ž), aber nie ľ oder ô', en: 'Carons as in Slovakia (č, š, ž), but never ľ or ô' }, mark: 'č š ž' },
    ],
    samples: [
      { native: 'Příbram', latin: 'Pribram' },
      { native: 'Děčín', latin: 'Decin' },
      { native: 'Přerov', latin: 'Prerov' },
      { native: 'České Budějovice', latin: 'Ceske Budejovice (Budweis)' },
      { native: 'Jindřichův Hradec', latin: 'Jindrichuv Hradec' },
    ],
    confusable: [id('slovak'), id('polish'), id('croatian'), id('hungarian')],
  },
  {
    id: id('slovak'),
    name: { de: 'Slowakisch', en: 'Slovak' },
    where: { de: 'Slowakei', en: 'Slovakia' },
    font: 'latin',
    features: [
      { text: { de: 'ľ und ĺ, ŕ und ô gibt es nur im Slowakischen', en: 'ľ and ĺ, ŕ and ô exist only in Slovak' }, mark: 'ľ ô' },
      { text: { de: 'Sonst fast wie Tschechisch, aber ohne ř, ě, ů', en: 'Otherwise much like Czech, but without ř, ě, ů' }, mark: 'ä' },
    ],
    samples: [
      { native: 'Šaľa', latin: 'Sala' },
      { native: 'Stará Ľubovňa', latin: 'Stara Lubovna' },
      { native: 'Veľký Krtíš', latin: 'Velky Krtis' },
      { native: 'Veľké Kapušany', latin: 'Velke Kapusany' },
    ],
    confusable: [id('czech'), id('polish'), id('hungarian'), id('croatian')],
  },

  // ---------------------------------------------------------------- 10 Lateinisch II: Südosteuropa
  {
    id: id('romanian'),
    name: { de: 'Rumänisch', en: 'Romanian' },
    where: { de: 'Rumänien', en: 'Romania' },
    font: 'latin',
    features: [
      { text: { de: 'ă mit Bogen und ț gibt es im Türkischen nicht', en: 'Turkish has neither ă with a breve nor ț' }, mark: 'ă ț' },
      { text: { de: 'ș und ț mit Komma darunter (auf alten Schildern auch ş, ţ), dazu â und î', en: 'ș and ț with a comma below (older signs also ş, ţ), plus â and î' }, mark: 'ș â î' },
      { text: { de: 'Viele Namen enden auf -ești oder -eni', en: 'Many names end in -ești or -eni' }, mark: 'ești' },
    ],
    samples: [
      { native: 'Brașov', latin: 'Brasov (Kronstadt)' },
      { native: 'Timișoara', latin: 'Timisoara' },
      { native: 'Constanța', latin: 'Constanta' },
      { native: 'Pitești', latin: 'Pitesti' },
      { native: 'Bacău', latin: 'Bacau' },
    ],
    confusable: [id('turkish'), id('albanian'), id('portuguese')],
  },
  {
    id: id('turkish'),
    name: { de: 'Türkisch', en: 'Turkish' },
    where: { de: 'Türkei', en: 'Türkiye' },
    font: 'latin',
    features: [
      { text: { de: 'ı ohne Punkt und İ mit Punkt gibt es nur im Türkischen', en: 'Dotless ı and dotted İ exist only in Turkish' }, mark: 'ı İ' },
      { text: { de: 'ğ mit Bogen und ş mit Häkchen', en: 'ğ with a breve and ş with a cedilla' }, mark: 'ğ ş' },
      { text: { de: 'Dazu ç, ö, ü – aber nie ä, ă oder ț', en: 'Plus ç, ö, ü – but never ä, ă or ț' }, mark: 'ç ö ü' },
    ],
    samples: [
      { native: 'Ağrı', latin: 'Agri' },
      { native: 'Muğla', latin: 'Mugla' },
      { native: 'Eskişehir', latin: 'Eskisehir' },
      { native: 'İzmir', latin: 'Izmir' },
      { native: 'Şanlıurfa', latin: 'Sanliurfa' },
      { native: 'Kırıkkale', latin: 'Kirikkale' },
    ],
    confusable: [id('romanian'), id('albanian'), id('hungarian')],
  },
  {
    id: id('croatian'),
    name: { de: 'Kroatisch, Bosnisch (lateinisch)', en: 'Croatian, Bosnian (Latin)' },
    where: { de: 'Kroatien, Bosnien', en: 'Croatia, Bosnia' },
    font: 'latin',
    features: [
      { text: { de: 'đ mit Querstrich gibt es nur hier (Serbien und Montenegro schreiben lateinisch genauso)', en: 'đ with a bar exists only here (Serbia and Montenegro write Latin the same way)' }, mark: 'đ' },
      { text: { de: 'ć mit Strich neben č mit Häkchen, dazu š und ž', en: 'ć with an acute next to č with a caron, plus š and ž' }, mark: 'ć č' },
    ],
    samples: [
      { native: 'Đakovo', latin: 'Djakovo' },
      { native: 'Đurđevac', latin: 'Djurdjevac' },
      { native: 'Ivanić-Grad', latin: 'Ivanic-Grad' },
      { native: 'Bihać', latin: 'Bihac' },
    ],
    confusable: [id('czech'), id('slovak'), id('polish'), id('albanian')],
    overlaps: [id('serbian')],
  },
  {
    id: id('albanian'),
    name: { de: 'Albanisch', en: 'Albanian' },
    where: { de: 'Albanien, Kosovo', en: 'Albania, Kosovo' },
    font: 'latin',
    features: [
      { text: { de: 'ë mit zwei Punkten, oft am Wortende', en: 'ë with two dots, often at the end of a word' }, mark: 'ë' },
      { text: { de: 'Dazu ç, aber keine anderen Häkchen oder Striche', en: 'Plus ç, but no other carons or accents' }, mark: 'ç' },
      { text: { de: 'Viele Buchstabenpaare: sh, gj, xh, dh', en: 'Many letter pairs: sh, gj, xh, dh' }, mark: 'gj sh' },
    ],
    samples: [
      { native: 'Korçë', latin: 'Korca' },
      { native: 'Durrës', latin: 'Durres' },
      { native: 'Vlorë', latin: 'Vlora' },
      { native: 'Shkodër', latin: 'Shkoder' },
      { native: 'Gjirokastër', latin: 'Gjirokaster' },
      { native: 'Gjakovë', latin: 'Gjakova (Kosovo)' },
    ],
    confusable: [id('turkish'), id('romanian'), id('croatian')],
  },

  // ---------------------------------------------------------------- 11 Lateinisch III: Baltikum
  {
    id: id('lithuanian'),
    name: { de: 'Litauisch', en: 'Lithuanian' },
    where: { de: 'Litauen', en: 'Lithuania' },
    font: 'latin',
    features: [
      { text: { de: 'ė mit Punkt, dazu ą, ę, į, ų mit Schwänzchen', en: 'ė with a dot, plus ą, ę, į, ų with a tail' }, mark: 'ė ų į' },
      { text: { de: 'Keine Striche über a, e, i wie in Lettland (ā, ē, ī)', en: 'No bars over a, e, i as in Latvia (ā, ē, ī)' }, mark: 'ū' },
      { text: { de: 'Viele Namen enden auf -ai, -ys, -ė', en: 'Many names end in -ai, -ys, -ė' }, mark: '-ai' },
    ],
    samples: [
      { native: 'Panevėžys', latin: 'Panevezys' },
      { native: 'Kėdainiai', latin: 'Kedainiai' },
      { native: 'Marijampolė', latin: 'Marijampole' },
      { native: 'Ukmergė', latin: 'Ukmerge' },
      { native: 'Plungė', latin: 'Plunge' },
    ],
    confusable: [id('latvian'), id('polish'), id('estonian')],
  },
  {
    id: id('latvian'),
    name: { de: 'Lettisch', en: 'Latvian' },
    where: { de: 'Lettland', en: 'Latvia' },
    font: 'latin',
    features: [
      { text: { de: 'Striche über den Vokalen: ā, ē, ī, ū', en: 'Bars over the vowels: ā, ē, ī, ū' }, mark: 'ā ē ī' },
      { text: { de: 'Kommas unter Konsonanten: ķ, ļ, ņ, dazu ģ', en: 'Commas under consonants: ķ, ļ, ņ, plus ģ' }, mark: 'ķ ļ ņ' },
    ],
    samples: [
      { native: 'Liepāja', latin: 'Liepaja' },
      { native: 'Rēzekne', latin: 'Rezekne' },
      { native: 'Jēkabpils', latin: 'Jekabpils' },
      { native: 'Cēsis', latin: 'Cesis' },
      { native: 'Līvāni', latin: 'Livani' },
    ],
    confusable: [id('lithuanian'), id('estonian'), id('slovak')],
  },
  {
    id: id('estonian'),
    name: { de: 'Estnisch', en: 'Estonian' },
    where: { de: 'Estland', en: 'Estonia' },
    font: 'latin',
    features: [
      { text: { de: 'õ mit Welle gibt es in Finnland nicht', en: 'Finland has no õ with a tilde' }, mark: 'õ' },
      { text: { de: 'Sonst wie Finnisch: ä, ö, ü und viele doppelte Vokale', en: 'Otherwise like Finnish: ä, ö, ü and many double vowels' }, mark: 'ä ü' },
    ],
    samples: [
      { native: 'Võru', latin: 'Voru' },
      { native: 'Põlva', latin: 'Polva' },
      { native: 'Jõhvi', latin: 'Johvi' },
      { native: 'Põltsamaa', latin: 'Poltsamaa' },
    ],
    confusable: [id('finnish'), id('latvian'), id('portuguese')],
  },

  // ---------------------------------------------------------------- 12 Lateinisch IV: Norden
  {
    id: id('norwegian'),
    name: { de: 'Norwegisch, Dänisch', en: 'Norwegian, Danish' },
    where: { de: 'Norwegen, Dänemark', en: 'Norway, Denmark' },
    font: 'latin',
    features: [
      { text: { de: 'ø mit Schrägstrich und æ – Schweden schreibt dafür ö und ä', en: 'ø with a slash and æ – Sweden writes ö and ä instead' }, mark: 'ø æ' },
      { text: { de: 'å gibt es auch in Schweden, allein verrät es nichts', en: 'Sweden has å too, so on its own it gives nothing away' }, mark: 'å' },
    ],
    samples: [
      { native: 'Tromsø', latin: 'Tromso' },
      { native: 'Bodø', latin: 'Bodo' },
      { native: 'Førde', latin: 'Forde' },
      { native: 'Næstved', latin: 'Naestved' },
      { native: 'Køge', latin: 'Koge' },
    ],
    confusable: [id('swedish'), id('icelandic'), id('finnish')],
  },
  {
    id: id('swedish'),
    name: { de: 'Schwedisch', en: 'Swedish' },
    where: { de: 'Schweden', en: 'Sweden' },
    font: 'latin',
    features: [
      { text: { de: 'å zusammen mit ä oder ö', en: 'å together with ä or ö' }, mark: 'å ä ö' },
      { text: { de: 'Nie ø oder æ (Norwegen, Dänemark); Finnland hat in finnischen Namen kein å', en: 'Never ø or æ (Norway, Denmark); Finnish names in Finland have no å' }, mark: 'ö' },
    ],
    samples: [
      { native: 'Västerås', latin: 'Vasteras' },
      { native: 'Mönsterås', latin: 'Monsteras' },
      { native: 'Mörbylånga', latin: 'Morbylanga' },
      { native: 'Övertorneå', latin: 'Overtornea' },
      { native: 'Österåker', latin: 'Osteraker' },
    ],
    confusable: [id('norwegian'), id('finnish'), id('estonian')],
  },
  {
    id: id('finnish'),
    name: { de: 'Finnisch', en: 'Finnish' },
    where: { de: 'Finnland', en: 'Finland' },
    font: 'latin',
    features: [
      { text: { de: 'Viel ä und ö, aber kein å (das steht nur in schwedischen Namen) und kein õ wie in Estland', en: 'Lots of ä and ö, but no å (only in Swedish names) and no õ as in Estonia' }, mark: 'ä ö' },
      { text: { de: 'Doppelte Vokale und Konsonanten: aa, ää, kk, nn – und viele y', en: 'Double vowels and consonants: aa, ää, kk, nn – and many y' }, mark: 'ää y' },
    ],
    samples: [
      { native: 'Jyväskylä', latin: 'Jyvaskyla' },
      { native: 'Hämeenlinna', latin: 'Hameenlinna' },
      { native: 'Seinäjoki', latin: 'Seinajoki' },
      { native: 'Hyvinkää', latin: 'Hyvinkaa' },
      { native: 'Järvenpää', latin: 'Jarvenpaa' },
    ],
    confusable: [id('estonian'), id('swedish'), id('hungarian')],
  },
  {
    id: id('icelandic'),
    name: { de: 'Isländisch', en: 'Icelandic' },
    where: { de: 'Island', en: 'Iceland' },
    font: 'latin',
    features: [
      { text: { de: 'þ (Thorn) gibt es nur im Isländischen', en: 'þ (thorn) exists only in Icelandic' }, mark: 'þ' },
      { text: { de: 'ð mit Querstrich, dazu á, é, í, ó, ú, ý und æ', en: 'ð with a bar, plus á, é, í, ó, ú, ý and æ' }, mark: 'ð' },
      { text: { de: 'Viele Namen enden auf -fjörður, -staðir, -vík', en: 'Many names end in -fjörður, -staðir, -vík' }, mark: '-fjörður' },
    ],
    samples: [
      { native: 'Þorlákshöfn', latin: 'Thorlakshofn' },
      { native: 'Egilsstaðir', latin: 'Egilsstadir' },
      { native: 'Siglufjörður', latin: 'Siglufjordur' },
      { native: 'Sauðárkrókur', latin: 'Saudarkrokur' },
      { native: 'Ísafjörður', latin: 'Isafjordur' },
    ],
    confusable: [id('norwegian'), id('swedish'), id('finnish')],
  },

  // ---------------------------------------------------------------- 13 Lateinisch V: Südwesten
  {
    id: id('portuguese'),
    name: { de: 'Portugiesisch', en: 'Portuguese' },
    where: { de: 'Portugal, Brasilien', en: 'Portugal, Brazil' },
    font: 'latin',
    features: [
      { text: { de: 'ã und õ mit Welle, besonders -ão (São)', en: 'ã and õ with a tilde, especially -ão (São)' }, mark: 'ã' },
      { text: { de: 'ç und â, ê, ô – aber kein ñ (dafür nh: Minho)', en: 'ç and â, ê, ô – but no ñ (nh instead: Minho)' }, mark: 'ç nh' },
    ],
    samples: [
      { native: 'São Paulo', latin: 'Sao Paulo' },
      { native: 'Guimarães', latin: 'Guimaraes' },
      { native: 'Ribeirão Preto', latin: 'Ribeirao Preto' },
      { native: 'Conceição', latin: 'Conceicao' },
      { native: 'São Luís', latin: 'Sao Luis' },
    ],
    confusable: [id('spanish'), id('romanian'), id('estonian')],
  },
  {
    id: id('spanish'),
    name: { de: 'Spanisch', en: 'Spanish' },
    where: { de: 'Spanien, Lateinamerika', en: 'Spain, Latin America' },
    font: 'latin',
    features: [
      { text: { de: 'ñ mit Welle (Portugal schreibt nh)', en: 'ñ with a tilde (Portugal writes nh)' }, mark: 'ñ' },
      { text: { de: 'Akzente á, é, í, ó, ú, aber nie ã oder ç', en: 'Accents á, é, í, ó, ú, but never ã or ç' }, mark: 'á í ó' },
    ],
    samples: [
      { native: 'Logroño', latin: 'Logrono' },
      { native: 'A Coruña', latin: 'A Coruna' },
      { native: 'Viña del Mar', latin: 'Vina del Mar' },
      { native: 'Ñuñoa', latin: 'Nunoa' },
    ],
    confusable: [id('portuguese'), id('romanian'), id('croatian')],
  },
];

export const SCRIPT_LESSONS: ScriptLesson[] = [
  {
    id: 'scripts-l1',
    number: 1,
    title: { de: 'Erster Blick', en: 'First Look' },
    goal: { de: 'Sechs Schriften, die man auf den ersten Blick unterscheiden kann.', en: 'Six scripts you can tell apart at first glance.' },
    newIds: [id('cyrillic'), id('greek'), id('arabic'), id('hebrew'), id('thai'), id('devanagari')],
  },
  {
    id: 'scripts-l2',
    number: 2,
    title: { de: 'Ostasien', en: 'East Asia' },
    goal: { de: 'Japan, Taiwan/Hongkong oder Korea?', en: 'Japan, Taiwan/Hong Kong or Korea?' },
    newIds: [id('japanese'), id('chinese'), id('korean')],
  },
  {
    id: 'scripts-l3',
    number: 3,
    title: { de: 'Südostasien', en: 'Southeast Asia' },
    goal: { de: 'Thailand, Laos oder Kambodscha?', en: 'Thailand, Laos or Cambodia?' },
    newIds: [id('lao'), id('khmer')],
    reviewIds: [id('thai')],
  },
  {
    id: 'scripts-l4',
    number: 4,
    title: { de: 'Nordindien, Bangladesch, Bhutan', en: 'North India, Bangladesh, Bhutan' },
    goal: { de: 'Schriften mit und ohne Linie oben.', en: 'Scripts with and without a top line.' },
    newIds: [id('bengali'), id('gurmukhi'), id('gujarati'), id('oriya'), id('tibetan')],
    reviewIds: [id('devanagari')],
  },
  {
    id: 'scripts-l5',
    number: 5,
    title: { de: 'Südindien und Sri Lanka', en: 'South India and Sri Lanka' },
    goal: { de: 'Die runden Schriften des Südens.', en: 'The round scripts of the south.' },
    newIds: [id('tamil'), id('telugu'), id('kannada'), id('malayalam'), id('sinhala')],
  },
  {
    id: 'scripts-l6',
    number: 6,
    title: { de: 'Kyrillisch I: Russland, Ukraine, Bulgarien', en: 'Cyrillic I: Russia, Ukraine, Bulgaria' },
    goal: { de: 'Einzelne Buchstaben verraten das Land.', en: 'Single letters give away the country.' },
    newIds: [id('russian'), id('ukrainian'), id('bulgarian')],
  },
  {
    id: 'scripts-l7',
    number: 7,
    title: { de: 'Kyrillisch II: Balkan, Kasachstan, Mongolei', en: 'Cyrillic II: Balkans, Kazakhstan, Mongolia' },
    goal: { de: 'Sonderbuchstaben von Serbien bis zur Mongolei.', en: 'Special letters from Serbia to Mongolia.' },
    newIds: [id('serbian'), id('macedonian'), id('kazakh'), id('mongolian')],
    reviewIds: [id('russian'), id('bulgarian')],
  },  {
    id: 'scripts-l8',
    number: 8,
    title: { de: 'Georgien', en: 'Georgia' },
    goal: { de: 'Die runde Schrift aus dem Kaukasus – seit 2026 in Street View.', en: 'The round script of the Caucasus – on Street View since 2026.' },
    newIds: [id('georgian')],
    reviewIds: [id('greek'), id('cyrillic'), id('sinhala')],
  },
  {
    id: 'scripts-l9',
    number: 9,
    title: { de: 'Lateinisch I: Mitteleuropa', en: 'Latin I: Central Europe' },
    goal: { de: 'Ungarn, Polen, Tschechien oder Slowakei? Ein Sonderzeichen reicht.', en: 'Hungary, Poland, Czechia or Slovakia? One special letter is enough.' },
    newIds: [id('hungarian'), id('polish'), id('czech'), id('slovak')],
  },
  {
    id: 'scripts-l10',
    number: 10,
    title: { de: 'Lateinisch II: Südosteuropa', en: 'Latin II: Southeast Europe' },
    goal: { de: 'Rumänien, Türkei, Kroatien oder Albanien?', en: 'Romania, Türkiye, Croatia or Albania?' },
    newIds: [id('romanian'), id('turkish'), id('croatian'), id('albanian')],
    reviewIds: [id('czech')],
  },
  {
    id: 'scripts-l11',
    number: 11,
    title: { de: 'Lateinisch III: Baltikum', en: 'Latin III: The Baltics' },
    goal: { de: 'Litauen, Lettland oder Estland?', en: 'Lithuania, Latvia or Estonia?' },
    newIds: [id('lithuanian'), id('latvian'), id('estonian')],
    reviewIds: [id('polish')],
  },
  {
    id: 'scripts-l12',
    number: 12,
    title: { de: 'Lateinisch IV: Norden', en: 'Latin IV: The North' },
    goal: { de: 'ø oder ö, å oder nicht: Skandinavien, Finnland, Island.', en: 'ø or ö, å or not: Scandinavia, Finland, Iceland.' },
    newIds: [id('norwegian'), id('swedish'), id('finnish'), id('icelandic')],
    reviewIds: [id('estonian')],
  },
  {
    id: 'scripts-l13',
    number: 13,
    title: { de: 'Lateinisch V: Südwesten', en: 'Latin V: The Southwest' },
    goal: { de: 'Portugal und Brasilien oder Spanien und Lateinamerika?', en: 'Portugal and Brazil or Spain and Latin America?' },
    newIds: [id('portuguese'), id('spanish')],
    reviewIds: [id('romanian'), id('turkish')],
  },
];
