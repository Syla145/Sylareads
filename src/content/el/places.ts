import type { L10n, PlaceItem } from '../../domain/types';

/**
 * Greek and Cypriot places by GeoGuessr relevance: regional capitals,
 * destinations on national-road signs, ports and well-known islands.
 * Transliteration follows ELOT 743 as on Greek and Cypriot road signs.
 * Only territory under the control of the Republic of Cyprus is included
 * (Northern Cyprus has no coverage); the Kyrenia district is left out.
 */

const city = (
  slug: string,
  native: string,
  translit: string,
  en: string,
  de: string,
  regionSlug: string,
  tier: 1 | 2 | 3,
  extra: string[] = [],
  hint?: L10n,
  countryId: 'GR' | 'CY' = 'GR',
): PlaceItem => ({
  id: `el:city:${slug}`,
  kind: 'city',
  native,
  translit,
  names: { de, en },
  accepted: [translit, en, de, ...extra],
  countryId,
  regionId: `el:region:${regionSlug}`,
  tier,
  hint,
});

const cy = (slug: string, native: string, translit: string, en: string, de: string, district: string, tier: 1 | 2 | 3, extra: string[] = [], hint?: L10n) =>
  city(slug, native, translit, en, de, district, tier, extra, hint, 'CY');

export const CITIES: PlaceItem[] = [
  city('athina', 'Αθήνα', 'Athina', 'Athens', 'Athen', 'attiki', 1, [], { de: 'Hauptstadt Griechenlands', en: 'Capital of Greece' }),
  city('thessaloniki', 'Θεσσαλονίκη', 'Thessaloniki', 'Thessaloniki', 'Thessaloniki', 'kentriki-makedonia', 1, ['Salonica', 'Saloniki', 'Salonika'], { de: 'Zweitgrößte Stadt, Hafen am Thermaischen Golf', en: 'Second city, port on the Thermaic Gulf' }),
  city('peiraias', 'Πειραιάς', 'Peiraias', 'Piraeus', 'Piräus', 'attiki', 1, ['Pireas', 'Piraeas', 'Piraus'], { de: 'Hafen Athens', en: 'Port of Athens' }),
  city('patra', 'Πάτρα', 'Patra', 'Patras', 'Patras', 'dytiki-ellada', 1, [], { de: 'Fährhafen nach Italien', en: 'Ferry port for Italy' }),
  city('irakleio', 'Ηράκλειο', 'Irakleio', 'Heraklion', 'Heraklion', 'kriti', 1, ['Iraklio', 'Iraklion', 'Heraklio', 'Herakleion'], { de: 'Größte Stadt Kretas', en: 'Largest city on Crete' }),
  city('larisa', 'Λάρισα', 'Larisa', 'Larissa', 'Larisa', 'thessalia', 1),
  city('volos', 'Βόλος', 'Volos', 'Volos', 'Volos', 'thessalia', 1, [], { de: 'Hafen am Pilion', en: 'Port below Mount Pelion' }),
  city('ioannina', 'Ιωάννινα', 'Ioannina', 'Ioannina', 'Ioannina', 'ipeiros', 1, [], { de: 'Hauptstadt des Epirus, am Pamvotida-See', en: 'Capital of Epirus, on Lake Pamvotida' }),
  city('chania', 'Χανιά', 'Chania', 'Chania', 'Chania', 'kriti', 1, ['Hania', 'Khania'], { de: 'Westkreta', en: 'Western Crete' }),
  city('kalamata', 'Καλαμάτα', 'Kalamata', 'Kalamata', 'Kalamata', 'peloponnisos', 1),
  city('kavala', 'Καβάλα', 'Kavala', 'Kavala', 'Kavala', 'anatoliki-makedonia-thraki', 1),
  city('alexandroupoli', 'Αλεξανδρούπολη', 'Alexandroupoli', 'Alexandroupolis', 'Alexandroupoli', 'anatoliki-makedonia-thraki', 1, [], { de: 'Nahe der Grenze zur Türkei', en: 'Near the Turkish border' }),
  city('serres', 'Σέρρες', 'Serres', 'Serres', 'Serres', 'kentriki-makedonia', 2),
  city('xanthi', 'Ξάνθη', 'Xanthi', 'Xanthi', 'Xanthi', 'anatoliki-makedonia-thraki', 2),
  city('komotini', 'Κομοτηνή', 'Komotini', 'Komotini', 'Komotini', 'anatoliki-makedonia-thraki', 2),
  city('katerini', 'Κατερίνη', 'Katerini', 'Katerini', 'Katerini', 'kentriki-makedonia', 2, [], { de: 'Am Fuß des Olymp', en: 'At the foot of Mount Olympus' }),
  city('trikala', 'Τρίκαλα', 'Trikala', 'Trikala', 'Trikala', 'thessalia', 2, [], { de: 'Nahe den Meteora-Klöstern', en: 'Near the Meteora monasteries' }),
  city('karditsa', 'Καρδίτσα', 'Karditsa', 'Karditsa', 'Karditsa', 'thessalia', 3),
  city('lamia', 'Λαμία', 'Lamia', 'Lamia', 'Lamia', 'sterea-ellada', 2, [], { de: 'An der Autobahn Athen–Thessaloniki', en: 'On the Athens–Thessaloniki motorway' }),
  city('chalkida', 'Χαλκίδα', 'Chalkida', 'Chalcis', 'Chalkida', 'sterea-ellada', 2, ['Chalkis', 'Halkida', 'Khalkida'], { de: 'Brücke nach Euböa', en: 'Bridge to Euboea' }),
  city('veroia', 'Βέροια', 'Veroia', 'Veria', 'Veria', 'kentriki-makedonia', 2, ['Verria', 'Veroia']),
  city('kozani', 'Κοζάνη', 'Kozani', 'Kozani', 'Kozani', 'dytiki-makedonia', 2),
  city('florina', 'Φλώρινα', 'Florina', 'Florina', 'Florina', 'dytiki-makedonia', 3, [], { de: 'Nahe der Grenze zu Nordmazedonien', en: 'Near the North Macedonian border' }),
  city('kastoria', 'Καστοριά', 'Kastoria', 'Kastoria', 'Kastoria', 'dytiki-makedonia', 3),
  city('drama', 'Δράμα', 'Drama', 'Drama', 'Drama', 'anatoliki-makedonia-thraki', 2),
  city('agrinio', 'Αγρίνιο', 'Agrinio', 'Agrinio', 'Agrinio', 'dytiki-ellada', 2),
  city('pyrgos', 'Πύργος', 'Pyrgos', 'Pyrgos', 'Pyrgos', 'dytiki-ellada', 3, [], { de: 'Nahe Olympia', en: 'Near Olympia' }),
  city('tripoli', 'Τρίπολη', 'Tripoli', 'Tripoli', 'Tripoli', 'peloponnisos', 2, ['Tripolis'], { de: 'Mitte der Peloponnes', en: 'Centre of the Peloponnese' }),
  city('korinthos', 'Κόρινθος', 'Korinthos', 'Corinth', 'Korinth', 'peloponnisos', 1, [], { de: 'Am Kanal von Korinth', en: 'At the Corinth Canal' }),
  city('nafplio', 'Ναύπλιο', 'Nafplio', 'Nafplio', 'Nafplio', 'peloponnisos', 2, ['Nafplion', 'Nauplia', 'Nauplion']),
  city('sparti', 'Σπάρτη', 'Sparti', 'Sparta', 'Sparta', 'peloponnisos', 2),
  city('rethymno', 'Ρέθυμνο', 'Rethymno', 'Rethymno', 'Rethymno', 'kriti', 2, ['Rethymnon']),
  city('agios-nikolaos', 'Άγιος Νικόλαος', 'Agios Nikolaos', 'Agios Nikolaos', 'Agios Nikolaos', 'kriti', 2, ['Ayios Nikolaos', 'Hagios Nikolaos'], { de: 'Ostkreta', en: 'Eastern Crete' }),
  city('mytilini', 'Μυτιλήνη', 'Mytilini', 'Mytilene', 'Mytilini', 'voreio-aigaio', 2, ['Mitilini'], { de: 'Hauptort von Lesbos', en: 'Main town of Lesbos' }),
  city('preveza', 'Πρέβεζα', 'Preveza', 'Preveza', 'Preveza', 'ipeiros', 3),
  city('igoumenitsa', 'Ηγουμενίτσα', 'Igoumenitsa', 'Igoumenitsa', 'Igoumenitsa', 'ipeiros', 2, [], { de: 'Fährhafen, Startpunkt der Egnatia Odos', en: 'Ferry port, start of the Egnatia Odos' }),
  city('arta', 'Άρτα', 'Arta', 'Arta', 'Arta', 'ipeiros', 3),
  city('mesolongi', 'Μεσολόγγι', 'Mesolongi', 'Missolonghi', 'Messolonghi', 'dytiki-ellada', 3, ['Messolongi', 'Mesolonghi', 'Missolongi']),
  city('thiva', 'Θήβα', 'Thiva', 'Thebes', 'Theben', 'sterea-ellada', 3),
  city('edessa', 'Έδεσσα', 'Edessa', 'Edessa', 'Edessa', 'kentriki-makedonia', 3),

  cy('lefkosia', 'Λευκωσία', 'Lefkosia', 'Nicosia', 'Nikosia', 'lefkosia-district', 1, [], { de: 'Hauptstadt Zyperns', en: 'Capital of Cyprus' }),
  cy('lemesos', 'Λεμεσός', 'Lemesos', 'Limassol', 'Limassol', 'lemesos-district', 1, [], { de: 'Hafenstadt an der Südküste', en: 'Port city on the south coast' }),
  cy('larnaka', 'Λάρνακα', 'Larnaka', 'Larnaca', 'Larnaka', 'larnaka-district', 1, [], { de: 'Wichtigster Flughafen Zyperns', en: 'Main airport of Cyprus' }),
  cy('pafos', 'Πάφος', 'Pafos', 'Paphos', 'Paphos', 'pafos-district', 1),
  cy('agia-napa', 'Αγία Νάπα', 'Agia Napa', 'Ayia Napa', 'Ayia Napa', 'ammochostos-district', 2),
  cy('paralimni', 'Παραλίμνι', 'Paralimni', 'Paralimni', 'Paralimni', 'ammochostos-district', 3),
  cy('protaras', 'Πρωταράς', 'Protaras', 'Protaras', 'Protaras', 'ammochostos-district', 3),
  cy('strovolos', 'Στρόβολος', 'Strovolos', 'Strovolos', 'Strovolos', 'lefkosia-district', 3, [], { de: 'Großer Vorort von Nikosia', en: 'Large suburb of Nicosia' }),
  cy('polis-chrysochous', 'Πόλη Χρυσοχούς', 'Poli Chrysochous', 'Polis', 'Polis', 'pafos-district', 3, ['Polis Chrysochous', 'Poli']),
  cy('platres', 'Πλάτρες', 'Platres', 'Platres', 'Platres', 'lemesos-district', 3, [], { de: 'Bergdorf im Troodos', en: 'Mountain village in the Troodos' }),
];

const region = (
  slug: string,
  native: string,
  translit: string,
  en: string,
  de: string,
  regionType: 'periphery' | 'district' | 'island',
  tier: 1 | 2 | 3,
  extra: string[] = [],
  countryId: 'GR' | 'CY' = 'GR',
  hint?: L10n,
): PlaceItem => ({
  id: `el:region:${slug}`,
  kind: 'region',
  native,
  translit,
  names: { en, de },
  accepted: [translit, en, de, ...extra],
  countryId,
  regionType,
  tier,
  hint,
});

const ISLAND: L10n = { de: 'Insel', en: 'Island' };
const DISTRICT: L10n = { de: 'Bezirk in Zypern', en: 'District of Cyprus' };

export const REGIONS: PlaceItem[] = [
  // The 13 regions (periphereies) of Greece
  region('attiki', 'Αττική', 'Attiki', 'Attica', 'Attika', 'periphery', 1),
  region('kentriki-makedonia', 'Κεντρική Μακεδονία', 'Kentriki Makedonia', 'Central Macedonia', 'Zentralmakedonien', 'periphery', 1),
  region('anatoliki-makedonia-thraki', 'Ανατολική Μακεδονία και Θράκη', 'Anatoliki Makedonia kai Thraki', 'Eastern Macedonia and Thrace', 'Ostmakedonien und Thrakien', 'periphery', 1,
    ['East Macedonia and Thrace', 'Ostmakedonien-Thrakien']),
  region('dytiki-makedonia', 'Δυτική Μακεδονία', 'Dytiki Makedonia', 'Western Macedonia', 'Westmakedonien', 'periphery', 2, ['West Macedonia']),
  region('ipeiros', 'Ήπειρος', 'Ipeiros', 'Epirus', 'Epirus', 'periphery', 1, ['Ipiros']),
  region('thessalia', 'Θεσσαλία', 'Thessalia', 'Thessaly', 'Thessalien', 'periphery', 1),
  region('ionia-nisia', 'Ιόνια Νησιά', 'Ionia Nisia', 'Ionian Islands', 'Ionische Inseln', 'periphery', 2),
  region('dytiki-ellada', 'Δυτική Ελλάδα', 'Dytiki Ellada', 'Western Greece', 'Westgriechenland', 'periphery', 2, ['West Greece']),
  region('sterea-ellada', 'Στερεά Ελλάδα', 'Sterea Ellada', 'Central Greece', 'Mittelgriechenland', 'periphery', 2),
  region('peloponnisos', 'Πελοπόννησος', 'Peloponnisos', 'Peloponnese', 'Peloponnes', 'periphery', 1, ['Peloponnesos']),
  region('voreio-aigaio', 'Βόρειο Αιγαίο', 'Voreio Aigaio', 'North Aegean', 'Nördliche Ägäis', 'periphery', 2),
  region('notio-aigaio', 'Νότιο Αιγαίο', 'Notio Aigaio', 'South Aegean', 'Südliche Ägäis', 'periphery', 2),
  region('kriti', 'Κρήτη', 'Kriti', 'Crete', 'Kreta', 'periphery', 1),

  // Districts of the Republic of Cyprus (without Kyrenia)
  region('lefkosia-district', 'Λευκωσία', 'Lefkosia', 'Nicosia District', 'Bezirk Nikosia', 'district', 1, ['Nicosia', 'Nikosia'], 'CY', DISTRICT),
  region('lemesos-district', 'Λεμεσός', 'Lemesos', 'Limassol District', 'Bezirk Limassol', 'district', 1, ['Limassol'], 'CY', DISTRICT),
  region('larnaka-district', 'Λάρνακα', 'Larnaka', 'Larnaca District', 'Bezirk Larnaka', 'district', 1, ['Larnaca', 'Larnaka'], 'CY', DISTRICT),
  region('pafos-district', 'Πάφος', 'Pafos', 'Paphos District', 'Bezirk Paphos', 'district', 1, ['Paphos', 'Pafos'], 'CY', DISTRICT),
  region('ammochostos-district', 'Αμμόχωστος', 'Ammochostos', 'Famagusta District', 'Bezirk Famagusta', 'district', 2, ['Famagusta'], 'CY', DISTRICT),

  // Islands with Street View coverage
  region('kerkyra', 'Κέρκυρα', 'Kerkyra', 'Corfu', 'Korfu', 'island', 1, [], 'GR', ISLAND),
  region('rodos', 'Ρόδος', 'Rodos', 'Rhodes', 'Rhodos', 'island', 1, [], 'GR', ISLAND),
  region('lesvos', 'Λέσβος', 'Lesvos', 'Lesbos', 'Lesbos', 'island', 2, [], 'GR', ISLAND),
  region('chios', 'Χίος', 'Chios', 'Chios', 'Chios', 'island', 2, [], 'GR', ISLAND),
  region('samos', 'Σάμος', 'Samos', 'Samos', 'Samos', 'island', 2, [], 'GR', ISLAND),
  region('naxos', 'Νάξος', 'Naxos', 'Naxos', 'Naxos', 'island', 2, [], 'GR', ISLAND),
  region('santorini', 'Σαντορίνη', 'Santorini', 'Santorini', 'Santorin', 'island', 1, ['Thira', 'Thera'], 'GR', ISLAND),
  region('mykonos', 'Μύκονος', 'Mykonos', 'Mykonos', 'Mykonos', 'island', 2, [], 'GR', ISLAND),
  region('kefalonia', 'Κεφαλονιά', 'Kefalonia', 'Kefalonia', 'Kefalonia', 'island', 2, ['Cephalonia', 'Kefallonia'], 'GR', ISLAND),
  region('zakynthos', 'Ζάκυνθος', 'Zakynthos', 'Zakynthos', 'Zakynthos', 'island', 2, ['Zante'], 'GR', ISLAND),
  region('evvoia', 'Εύβοια', 'Evvoia', 'Euboea', 'Euböa', 'island', 1, ['Evia', 'Evvia', 'Evoia'], 'GR', ISLAND),
  region('limnos', 'Λήμνος', 'Limnos', 'Lemnos', 'Limnos', 'island', 3, [], 'GR', ISLAND),
  region('kos', 'Κως', 'Kos', 'Kos', 'Kos', 'island', 2, [], 'GR', ISLAND),
  region('thasos', 'Θάσος', 'Thasos', 'Thasos', 'Thasos', 'island', 3, [], 'GR', ISLAND),
];
