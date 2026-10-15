/** Height of one stop in px (the recommended one is taller); the road is drawn on the same grid. */
export const WAY_ROW = 116;
export const WAY_ROW_NEXT = 150;

/** Horizontal position of a circle in % of the width: the road winds on the left, the names stand on the right. */
export const wayX = (i: number) => Math.round((24 + 11 * Math.sin(i * 0.9)) * 10) / 10;

export interface WayLayout {
  tops: number[];
  heights: number[];
  xs: number[];
  total: number;
  /** SVG path of the road already travelled (from finished stops on). */
  travelled: string;
  /** SVG path of the road still ahead. */
  ahead: string;
}

/** Where the stops and the road go. Pure, so it can be tested without a browser. */
export function wayLayout(stops: { done: boolean; next: boolean }[]): WayLayout {
  const heights = stops.map((s) => (s.next ? WAY_ROW_NEXT : WAY_ROW));
  const tops: number[] = [];
  let total = 0;
  for (const h of heights) {
    tops.push(total);
    total += h;
  }
  const xs = stops.map((_, i) => wayX(i));
  const y = (i: number) => tops[i] + heights[i] / 2;
  const segment = (i: number) => {
    const mid = (y(i) + y(i + 1)) / 2;
    return `M${xs[i]} ${y(i)} C ${xs[i]} ${mid}, ${xs[i + 1]} ${mid}, ${xs[i + 1]} ${y(i + 1)}`;
  };
  const between = stops.slice(0, -1);
  const travelled = between.flatMap((s, i) => (s.done ? [segment(i)] : [])).join(' ');
  const ahead = between.flatMap((s, i) => (s.done ? [] : [segment(i)])).join(' ');
  return { tops, heights, xs, total, travelled, ahead };
}
