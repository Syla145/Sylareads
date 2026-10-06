import type { Item, Lang } from '../../domain/types';
import { placeNames } from '../../i18n';

/**
 * What a tempo answer looks like: the reading of a letter, the known name of a
 * place. Districts use their plain name ("Patuakhali", not "Distrikt Patuakhali"):
 * all options are districts, so the type word would only add reading time.
 */
export function itemAnswer(item: Item, lang: Lang): string {
  if (item.kind === 'letter' || item.kind === 'combo') return item.reading;
  if (item.kind === 'region' && item.regionType === 'district') return item.translit;
  if (item.kind === 'city' || item.kind === 'region') return placeNames(item, lang)[0];
  return item.translit;
}

/** The item in its original script. */
export function itemNative(item: Item): string {
  return item.kind === 'letter' ? item.upper : item.native;
}
