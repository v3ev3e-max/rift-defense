import { heroById } from "../data/heroes";
import type { Unit } from "../entities/HeroUnit";
export function synergies(units: Unit[]) {
  const counts = { ballistic: 0, arcane: 0, machine: 0 };
  for (const u of units) if (u.slot >= 0) counts[heroById[u.heroId].faction]++;
  return counts;
}
