export type RNG = () => number;
export function seeded(seed: number): RNG {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function weighted<T>(
  items: T[],
  weight: (item: T) => number,
  rng: RNG,
): T {
  let n = rng() * items.reduce((a, v) => a + weight(v), 0);
  for (const v of items) {
    n -= weight(v);
    if (n < 0) return v;
  }
  return items[items.length - 1];
}
export const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.hypot(a.x - b.x, a.y - b.y);
