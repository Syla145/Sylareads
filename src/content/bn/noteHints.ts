import type { L10n } from '../../domain/types';
import { unitId } from './units';

/**
 * Suggested Eselsbrücken for every Bengali letter, vowel sign and mark. They
 * are offered next to the player's own note ("Vorschlag · Übernehmen") and
 * only become a note when taken over, so everyone keeps the ones that work
 * for them. Shape first, then a word or a place from the course as anchor;
 * look-alikes name the detail that tells them apart.
 */
const H: Record<string, [de: string, en: string]> = {
  // Vowels at the start of a word
  'v-o': ['Eine ৩ (Bengali-Drei) mit Stange rechts – „oh, eine Drei!“ → o', 'A ৩ (Bengali three) with a stick on the right – “oh, a three!” → o'],
  'v-aa': ['অ plus Strich ◌া: o + a = a', 'অ plus the stroke ◌া: o + a = a'],
  'v-i': ['Wie eine 2 mit Kringel oben – i wie Igel mit Ringelschwanz', 'Like a 2 with a curl on top – i, like a hedgehog with a curly tail'],
  'v-ii': ['ই mit zusätzlichem Schnörkel oben – auch i, nur „länger“', 'ই with an extra flourish on top – also i, just “longer”'],
  'v-u': ['Wie eine Schnecke, die oben einen Fühler hebt – u wie Uhu', 'Like a snail lifting a feeler – u'],
  'v-uu': ['উ mit einem Bogen mehr links – auch u', 'উ with one more loop on the left – also u'],
  'v-ri': ['Wie ঝ (jh) mit Haken rechts oben – ri wie Rikscha', 'Like ঝ (jh) with a hook top right – ri as in rickshaw'],
  'v-e': ['Wie ein Stuhl, auf dem jemand sitzt – e wie Ente', 'Like someone sitting on a chair – e'],
  'v-oi': ['এ mit Kringel oben – „oi!“ ruft der Kringel', 'এ with a curl on top – the curl shouts “oi!”'],
  'v-oo': ['Wie eine 3 mit Häkchen oben, ohne Stange (anders als অ) – o', 'Like a 3 with a little hook on top, no stick (unlike অ) – o'],
  'v-ou': ['ও mit Schnörkel oben – „au!“ → ou', 'ও with a flourish on top – “ow!” → ou'],

  // Consonants
  ka: ['Rechts ein Knoten, links ein Bein schräg nach unten – K wie Knoten (কুমিল্লা = Cumilla)', 'A knot on the right, a leg slanting down-left – k for knot (কুমিল্লা = Cumilla)'],
  kha: ['Links ein offener Haken, rechts eine Stange – kh wie Kleiderhaken (খুলনা = Khulna). থ hat links eine geschlossene Schlaufe.', 'An open hook on the left, a pole on the right – kh, a coat hook (খুলনা = Khulna). থ has a closed loop on the left.'],
  ga: ['Ein Pfosten mit Arm nach links – g wie Galgen (গাজীপুর = Gazipur)', 'A post with an arm to the left – g for gallows (গাজীপুর = Gazipur)'],
  gha: ['Zwei Spitzen oben, Bauch unten – gh wie Gießkanne', 'Two points on top, a belly below – gh like a watering can'],
  nga: ['Ein Kringel mit Schwänzchen rechts – ng wie Kringel (টাঙ্গাইল = Tangail)', 'A curl with a little tail on the right – ng, a curl (টাঙ্গাইল = Tangail)'],
  ca: ['Wie ein Stuhl von der Seite: Lehne links, Sitz unten – ch wie Chair (চাঁদপুর = Chandpur)', 'Like a chair seen from the side – ch for chair (চাঁদপুর = Chandpur)'],
  cha: ['Zwei Schlaufen übereinander mit Schwanz – chh: doppeltes ch, doppelte Schlaufe', 'Two loops stacked with a tail – chh: double ch, double loop'],
  ja: ['Oben zwei Zacken, links unten ein Bauch – j wie Jacke mit Kapuze (জামালপুর = Jamalpur)', 'Two prongs on top, a belly bottom left – j, a jacket with a hood (জামালপুর = Jamalpur)'],
  jha: ['Wie ein Kamm mit Bauch – jh wie Jhenaidah (ঝিনাইদহ)', 'Like a comb with a belly – jh as in Jhenaidah (ঝিনাইদহ)'],
  nya: ['Zwei Bögen wie ein Schnurrbart mit Haken – n, fast nur in ঞ্জ (-ganj)', 'Two arches like a moustache with a hook – n, almost only in ঞ্জ (-ganj)'],
  tta: ['Oben ein Häkchen, unten ein offener Bogen – t wie Tangail (টাঙ্গাইল). ঠ ist unten geschlossen.', 'A little hook on top, an open curve below – t as in Tangail (টাঙ্গাইল). ঠ is closed below.'],
  ttha: ['Wie ট, aber unten ein geschlossener Kreis – th: mehr Luft im runden Bauch (ঠাকুরগাঁও = Thakurgaon)', 'Like ট, but closed into a circle below – th: more air in the round belly (ঠাকুরগাঁও = Thakurgaon)'],
  dda: ['Ein liegender Bogen mit Haken – d wie Dach. Mit Punkt (ড়) wird es r.', 'A lying curve with a hook – d. With a dot (ড়) it becomes r.'],
  ddha: ['Wie ড mit einem Zipfel unten links – dh wie Dhaka (ঢাকা)', 'Like ড with a tip bottom left – dh as in Dhaka (ঢাকা)'],
  nna: ['Wie eine Gabel mit Bauch – n wie in Narayanganj (নারায়ণগঞ্জ), klingt wie ন', 'Like a fork with a belly – n as in Narayanganj (নারায়ণগঞ্জ), sounds like ন'],
  ta: ['Wie eine liegende Welle mit Schwanz – t wie Tsunami', 'Like a lying wave with a tail – t for tsunami'],
  tha: ['Links eine geschlossene Schlaufe, rechts eine Stange – th wie Thana (থানা = Polizeiwache). খ ist links offen.', 'A closed loop on the left, a pole on the right – th as in thana (থানা = police station). খ is open on the left.'],
  da: ['Ein Dach mit Haken nach unten – d wie Dach (দিনাজপুর = Dinajpur)', 'A roof with a hook hanging down – d (দিনাজপুর = Dinajpur)'],
  dha: ['Wie eine Brezel an einem Stab – dh (গাইবান্ধা = Gaibandha)', 'Like a pretzel on a stick – dh (গাইবান্ধা = Gaibandha)'],
  na: ['Ein Häuschen mit Kringel unten links – n wie Natore (নাটোর). ল hat oben einen Bogen mehr.', 'A little house with a curl bottom left – n as in Natore (নাটোর). ল has one more curve on top.'],
  pa: ['Wie eine Pfeife: Kopf links, Stiel rechts – p (পাবনা = Pabna)', 'Like a pipe: bowl left, stem right – p (পাবনা = Pabna)'],
  pha: ['প mit einem Kringel mehr rechts – ph, das p mit Puste (ফেনী = Feni)', 'প with an extra curl on the right – ph, the p with a puff (ফেনী = Feni)'],
  ba: ['Ein Dreieck an einer Stange, ohne Punkt – b wie Banner (বরিশাল = Barishal). Mit Punkt unten ist es র (r).', 'A triangle on a pole, no dot – b for banner (বরিশাল = Barishal). With a dot below it is র (r).'],
  bha: ['Wie ein Bauch mit Gürtelschnalle – bh wie Bhola (ভোলা)', 'Like a belly with a belt buckle – bh as in Bhola (ভোলা)'],
  ma: ['Links oben ein geschlossener Kringel – m wie Mund zu (মাগুরা = Magura). স ist links offen.', 'A closed curl top left – m, mouth shut (মাগুরা = Magura). স is open on the left.'],
  ya: ['Wie ব mit gespaltenem Kopf – j wie Jashore (যশোর). Mit Punkt (য়) wird es y.', 'Like ব with a split head – j as in Jashore (যশোর). With a dot (য়) it becomes y.'],
  ra: ['ব mit Punkt unten – r wie Rad: der Punkt rollt (রংপুর = Rangpur)', 'ব with a dot below – r for roll: the dot is a wheel (রংপুর = Rangpur)'],
  la: ['Wie ন mit einer Locke oben – l wie Locke (লালমনিরহাট = Lalmonirhat)', 'Like ন with a lock of hair on top – l for lock (লালমনিরহাট = Lalmonirhat)'],
  sha: ['Drei Bögen wie eine Schaumkrone – sh wie Schaum (শেরপুর = Sherpur)', 'Three arches like a crest of foam – sh (শেরপুর = Sherpur)'],
  ssa: ['Ein Dreieck mit einem Schwert quer durch – sh wie Schwert', 'A triangle with a sword through it – sh for sword'],
  sa: ['Links ein offener Bogen wie ein Schlitz – s wie Schlitz (সিলেট = Sylhet). ম ist links geschlossen.', 'An open curve on the left like a slot – s for slot (সিলেট = Sylhet). ম is closed on the left.'],
  ha: ['Wie eine 2 mit Schwänzchen unten – h wie Haken (হবিগঞ্জ = Habiganj)', 'Like a 2 with a little tail below – h for hook (হবিগঞ্জ = Habiganj)'],
  rra: ['ড mit Punkt – r (বগুড়া = Bogura)', 'ড with a dot – r (বগুড়া = Bogura)'],
  rha: ['ঢ mit Punkt – rh, selten', 'ঢ with a dot – rh, rare'],
  yya: ['য mit Punkt – y: der Punkt sagt „yes“', 'য with a dot – y: the dot says “yes”'],
  'khanda-ta': ['Ein kleiner Schnörkel ohne Stange – t am Wortende', 'A small squiggle without a pole – t at the end of a word'],

  // Vowel signs
  'k-aa': ['Senkrechter Strich rechts – a wie aufrecht', 'An upright stroke on the right – a'],
  'k-i': ['Steht links, obwohl man es danach spricht; der Haken zeigt nach rechts auf den Konsonanten – i', 'Stands on the left although it is said after; its hook points right to the consonant – i'],
  'k-ii': ['Spiegelbild von ি, steht rechts – auch i', 'Mirror image of ি, stands on the right – also i'],
  'k-u': ['Kringel unten – u wie unten', 'A curl below – u for under'],
  'k-uu': ['Anderer Kringel unten – auch u, wieder unten', 'A different curl below – also u, under again'],
  'k-ri': ['Kleiner Haken unten links – ri', 'A small hook below on the left – ri'],
  'k-e': ['Steht links wie ein kleines Häkchen – e wie eher (kommt vorher)', 'Stands on the left like a little hook – e for early (it comes first)'],
  'k-oi': ['ে mit Kringel oben – oi', 'ে with a curl on top – oi'],
  'k-o': ['ে links und া rechts umklammern den Konsonanten wie Ohrenschützer – o', 'ে on the left and া on the right hug the consonant like earmuffs – o'],
  'k-ou': ['Wie ো, rechts mit Schwänzchen – „au, die Ohrenschützer zwicken“ → ou', 'Like ো, with a little tail on the right – “ow, the earmuffs pinch” → ou'],

  // Marks
  anusvar: ['Ein Kreis mit Schweif dahinter – ng wie Ring (রংপুর = Rangpur)', 'A circle with a tail behind – ng as in ring (রংপুর = Rangpur)'],
  bisarga: ['Zwei Punkte wie ein Doppelpunkt – h: kurz ausatmen', 'Two dots like a colon – h: a short breath out'],
  chandrabindu: ['Mondsichel mit Punkt oben – der Vokal geht durch die Nase', 'A crescent moon with a dot on top – the vowel goes through the nose'],
  hasanta: ['Kleiner Schrägstrich unten – Stopp: hier kein Vokal', 'A small slash below – stop: no vowel here'],
};

export const NOTE_HINTS: Record<string, L10n> = Object.fromEntries(Object.entries(H).map(([slug, [de, en]]) => [unitId(slug), { de, en }]));
