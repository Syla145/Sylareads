import type { L10n, PlaceItem } from '../../domain/types';

/**
 * Bangladeshi places. English names follow the official spellings of 2018
 * (Chattogram, Cumilla, Barishal, Jashore, Bogura); the older spellings are
 * accepted as listed variants. German names use the established German form
 * where one exists (Chittagong).
 */

const city = (
  slug: string,
  native: string,
  translit: string,
  en: string,
  de: string,
  division: string,
  tier: 1 | 2 | 3,
  extra: string[] = [],
  hint?: L10n,
): PlaceItem => ({
  id: `bn:city:${slug}`,
  kind: 'city',
  native,
  translit,
  names: { en, de },
  accepted: [translit, en, de, ...extra],
  countryId: 'BD',
  regionId: `bn:region:${division}`,
  tier,
  hint,
});

export const CITIES: PlaceItem[] = [
  city('dhaka', 'ঢাকা', 'Dhaka', 'Dhaka', 'Dhaka', 'dhaka', 1, [], { de: 'Hauptstadt Bangladeschs', en: 'Capital of Bangladesh' }),
  city('chattogram', 'চট্টগ্রাম', 'Chattogram', 'Chattogram', 'Chittagong', 'chattogram', 1, ['Chittagong', 'Chottogram'], { de: 'Größter Hafen des Landes', en: 'The country’s largest port' }),
  city('khulna', 'খুলনা', 'Khulna', 'Khulna', 'Khulna', 'khulna', 1, [], { de: 'Tor zu den Sundarbans', en: 'Gateway to the Sundarbans' }),
  city('rajshahi', 'রাজশাহী', 'Rajshahi', 'Rajshahi', 'Rajshahi', 'rajshahi', 1, [], { de: 'Am Padma, nahe der indischen Grenze', en: 'On the Padma, near the Indian border' }),
  city('sylhet', 'সিলেট', 'Sylhet', 'Sylhet', 'Sylhet', 'sylhet', 1, ['Silet'], { de: 'Teeanbaugebiet im Nordosten', en: 'Tea country in the north-east' }),
  city('barishal', 'বরিশাল', 'Barishal', 'Barishal', 'Barisal', 'barishal', 1, ['Barisal', 'Borishal']),
  city('rangpur', 'রংপুর', 'Rangpur', 'Rangpur', 'Rangpur', 'rangpur', 1, ['Rongpur']),
  city('mymensingh', 'ময়মনসিংহ', 'Mymensingh', 'Mymensingh', 'Mymensingh', 'mymensingh', 1, ['Moymonsingh', 'Maimansingh', 'Mymensing']),
  city('cumilla', 'কুমিল্লা', 'Cumilla', 'Cumilla', 'Comilla', 'chattogram', 1, ['Comilla', 'Kumilla'], { de: 'An der Fernstraße Dhaka–Chattogram', en: 'On the Dhaka–Chattogram highway' }),
  city('gazipur', 'গাজীপুর', 'Gazipur', 'Gazipur', 'Gazipur', 'dhaka', 1, ['Gajipur']),
  city('narayanganj', 'নারায়ণগঞ্জ', 'Narayanganj', 'Narayanganj', 'Narayanganj', 'dhaka', 1, ['Narayangonj']),
  city('coxs-bazar', 'কক্সবাজার', 'Koksbajar', 'Cox’s Bazar', 'Cox’s Bazar', 'chattogram', 1, ['Coxs Bazar', 'Cox Bazar', 'Coxsbazar', 'Koks Bazar'], { de: 'Längster Naturstrand der Welt', en: 'World’s longest natural beach' }),
  city('bogura', 'বগুড়া', 'Bogura', 'Bogura', 'Bogra', 'rajshahi', 1, ['Bogra']),
  city('jashore', 'যশোর', 'Jashore', 'Jashore', 'Jessore', 'khulna', 1, ['Jessore', 'Joshor', 'Jashor']),
  city('dinajpur', 'দিনাজপুর', 'Dinajpur', 'Dinajpur', 'Dinajpur', 'rangpur', 2),
  city('pabna', 'পাবনা', 'Pabna', 'Pabna', 'Pabna', 'rajshahi', 2),
  city('tangail', 'টাঙ্গাইল', 'Tangail', 'Tangail', 'Tangail', 'dhaka', 2),
  city('kushtia', 'কুষ্টিয়া', 'Kushtia', 'Kushtia', 'Kushtia', 'khulna', 2, ['Kustia']),
  city('faridpur', 'ফরিদপুর', 'Faridpur', 'Faridpur', 'Faridpur', 'dhaka', 2, ['Foridpur']),
  city('noakhali', 'নোয়াখালী', 'Noakhali', 'Noakhali', 'Noakhali', 'chattogram', 2),
  city('feni', 'ফেনী', 'Feni', 'Feni', 'Feni', 'chattogram', 2),
  city('brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'Brahmanbaria', 'Brahmanbaria', 'Brahmanbaria', 'chattogram', 2, ['Bramhanbaria']),
  city('sirajganj', 'সিরাজগঞ্জ', 'Sirajganj', 'Sirajganj', 'Sirajganj', 'rajshahi', 2, ['Sirajgonj']),
  city('narsingdi', 'নরসিংদী', 'Narsingdi', 'Narsingdi', 'Narsingdi', 'dhaka', 2, ['Norsingdi']),
  city('jamalpur', 'জামালপুর', 'Jamalpur', 'Jamalpur', 'Jamalpur', 'mymensingh', 2),
  city('naogaon', 'নওগাঁ', 'Naogaon', 'Naogaon', 'Naogaon', 'rajshahi', 2, ['Naoga', 'Nowga']),
  city('chandpur', 'চাঁদপুর', 'Chandpur', 'Chandpur', 'Chandpur', 'chattogram', 2),
  city('satkhira', 'সাতক্ষীরা', 'Satkhira', 'Satkhira', 'Satkhira', 'khulna', 2, ['Shatkhira']),
  city('patuakhali', 'পটুয়াখালী', 'Patuakhali', 'Patuakhali', 'Patuakhali', 'barishal', 2),
  city('moulvibazar', 'মৌলভীবাজার', 'Moulvibazar', 'Moulvibazar', 'Moulvibazar', 'sylhet', 2, ['Moulvi Bazar', 'Maulvibazar', 'Moulavibazar']),
  city('habiganj', 'হবিগঞ্জ', 'Habiganj', 'Habiganj', 'Habiganj', 'sylhet', 2, ['Hobiganj']),
  city('sunamganj', 'সুনামগঞ্জ', 'Sunamganj', 'Sunamganj', 'Sunamganj', 'sylhet', 2, ['Sunamgonj']),
  city('kishoreganj', 'কিশোরগঞ্জ', 'Kishoreganj', 'Kishoreganj', 'Kishoreganj', 'dhaka', 2, ['Kishorganj', 'Kishoregonj']),
  city('netrokona', 'নেত্রকোণা', 'Netrokona', 'Netrokona', 'Netrokona', 'mymensingh', 3, ['Netrakona']),
  city('sherpur', 'শেরপুর', 'Sherpur', 'Sherpur', 'Sherpur', 'mymensingh', 3),
  city('thakurgaon', 'ঠাকুরগাঁও', 'Thakurgaon', 'Thakurgaon', 'Thakurgaon', 'rangpur', 3),
  city('panchagarh', 'পঞ্চগড়', 'Panchagarh', 'Panchagarh', 'Panchagarh', 'rangpur', 3, ['Panchagar', 'Ponchogor'], { de: 'Nördlichster Distrikt', en: 'Northernmost district' }),
  city('lalmonirhat', 'লালমনিরহাট', 'Lalmonirhat', 'Lalmonirhat', 'Lalmonirhat', 'rangpur', 3),
  city('kurigram', 'কুড়িগ্রাম', 'Kurigram', 'Kurigram', 'Kurigram', 'rangpur', 3),
  city('gaibandha', 'গাইবান্ধা', 'Gaibandha', 'Gaibandha', 'Gaibandha', 'rangpur', 3),
  city('nilphamari', 'নীলফামারী', 'Nilphamari', 'Nilphamari', 'Nilphamari', 'rangpur', 3, ['Nilfamari']),
  city('saidpur', 'সৈয়দপুর', 'Saidpur', 'Saidpur', 'Saidpur', 'rangpur', 3, ['Syedpur'], { de: 'Flughafen im Nordwesten', en: 'Airport in the north-west' }),
  city('chapai-nawabganj', 'চাঁপাইনবাবগঞ্জ', 'Chapai Nawabganj', 'Chapai Nawabganj', 'Chapai Nawabganj', 'rajshahi', 3, ['Chapainawabganj', 'Nawabganj']),
  city('natore', 'নাটোর', 'Natore', 'Natore', 'Natore', 'rajshahi', 3, ['Nator']),
  city('magura', 'মাগুরা', 'Magura', 'Magura', 'Magura', 'khulna', 3),
  city('jhenaidah', 'ঝিনাইদহ', 'Jhenaidah', 'Jhenaidah', 'Jhenaidah', 'khulna', 3, ['Jhinaidah', 'Jhenidah']),
  city('bagerhat', 'বাগেরহাট', 'Bagerhat', 'Bagerhat', 'Bagerhat', 'khulna', 3),
  city('bhola', 'ভোলা', 'Bhola', 'Bhola', 'Bhola', 'barishal', 3, [], { de: 'Größte Insel des Landes', en: 'The country’s largest island' }),
  city('rangamati', 'রাঙ্গামাটি', 'Rangamati', 'Rangamati', 'Rangamati', 'chattogram', 3, ['Rangamati']),
  city('mongla', 'মোংলা', 'Mongla', 'Mongla', 'Mongla', 'khulna', 3, [], { de: 'Zweitgrößter Seehafen', en: 'Second seaport' }),
];

const DIVISION: L10n = { de: 'Division (Verwaltungsbezirk)', en: 'Division' };

const division = (slug: string, core: string, translitCore: string, en: string, de: string, extra: string[] = []): PlaceItem => ({
  id: `bn:region:${slug}`,
  kind: 'region',
  native: `${core} বিভাগ`,
  core,
  translit: `${translitCore} Bibhag`,
  names: { en: `${en} Division`, de: `Division ${de}` },
  accepted: [`${translitCore} Bibhag`, translitCore, `${en} Division`, en, `Division ${de}`, de, ...extra],
  countryId: 'BD',
  regionType: 'division',
  tier: 1,
  hint: DIVISION,
});

/** The eight divisions of Bangladesh. */
export const DIVISIONS: PlaceItem[] = [
  division('dhaka', 'ঢাকা', 'Dhaka', 'Dhaka', 'Dhaka'),
  division('chattogram', 'চট্টগ্রাম', 'Chattogram', 'Chattogram', 'Chittagong', ['Chittagong', 'Chittagong Division']),
  division('khulna', 'খুলনা', 'Khulna', 'Khulna', 'Khulna'),
  division('rajshahi', 'রাজশাহী', 'Rajshahi', 'Rajshahi', 'Rajshahi'),
  division('sylhet', 'সিলেট', 'Sylhet', 'Sylhet', 'Sylhet'),
  division('barishal', 'বরিশাল', 'Barishal', 'Barishal', 'Barisal', ['Barisal', 'Barisal Division']),
  division('rangpur', 'রংপুর', 'Rangpur', 'Rangpur', 'Rangpur'),
  division('mymensingh', 'ময়মনসিংহ', 'Mymensingh', 'Mymensingh', 'Mymensingh'),
];
