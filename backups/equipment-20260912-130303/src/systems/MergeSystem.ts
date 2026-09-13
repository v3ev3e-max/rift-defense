import type { Unit } from "../entities/HeroUnit";
export function mergeGroup(units: Unit[], selected?: Unit): Unit[] {
  if (selected && selected.star >= 5) return [];
  const candidates = selected ? [selected] : units;
  for (const u of candidates) {
    if (u.star >= 5) continue;
    const group = units.filter(
      (v) => v.heroId === u.heroId && v.star === u.star,
    );
    if (group.length >= 2)
      return [u, ...group.filter((v) => v !== u).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))].slice(0, 2);
  }
  return [];
}
