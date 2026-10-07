import type { PlaceItem } from '../domain/types';

/** Splits a list into lessons of `size`; a tail shorter than 4 joins the previous lesson. */
export function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  if (out.length > 1 && out[out.length - 1].length < 4) {
    const tail = out.pop()!;
    out[out.length - 1].push(...tail);
  }
  return out;
}

/** Most important places first (tier 1 before 2 …), stable within a tier. */
export const byTier = (list: PlaceItem[]) => [...list].sort((a, b) => a.tier - b.tier);
