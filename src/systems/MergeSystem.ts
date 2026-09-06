import type { Unit } from "../entities/HeroUnit";
export function mergeGroup(units: Unit[], selected?: Unit): Unit[] {
  if (selected && selected.star >= 5) return [];
  const candidates = selected ? [selected] : units;
  for (const u of candidates) {
    if (u.star >= 5) continue;
    const group = units.filter(
      (v) => v.heroId === u.heroId && v.star === u.star,
    );
    if (group.length >= 3)
      return [u, ...group.filter((v) => v !== u)].slice(0, 3);
  }
  return [];
}
