import type { L10n } from '../../domain/types';

/**
 * Kurs „Schriften erkennen“: an einem Schild sehen, welche Schrift das ist und
 * wo man ist. Die Antwort ist immer der Ort (Land oder Region), der Name der
 * Schrift steht als Info dabei. Nur Länder mit Street View in GeoGuessr.
 *
 * Beispiele sind echte Ortsnamen, so wie sie auf Schildern stehen.
 * Kyrillisch-Varianten haben nur Beispiele, die ihr Erkennungszeichen enthalten.
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
  },
];
