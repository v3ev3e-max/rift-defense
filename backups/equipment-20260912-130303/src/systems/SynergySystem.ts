import { heroById } from "../data/heroes";
import type { Element } from "../data/types";
import type { Unit } from "../entities/HeroUnit";

export interface SynergyState {
  ballistic: number;
  arcane: number;
  machine: number;
  water: number;
  fire: number;
  electric: number;
  dark: number;
}

export function synergyLevel(count: number) {
  return count >= 6 ? 3 : count >= 4 ? 2 : count >= 2 ? 1 : 0;
}

export function elementAttackBonus(count: number) {
  return [0, 0.05, 0.1, 0.18][synergyLevel(count)];
}

export function elementReactionBonus(count: number) {
  return [0, 0.07, 0.15, 0.25][synergyLevel(count)];
}

export function elementStatusDurationBonus(element: Element, count: number) {
  const level = synergyLevel(count);
  if (!level) return 0;
  if (element === "water") return [0, 0.5, 1, 1.5][level];
  if (element === "dark") return [0, 0.3, 0.6, 1][level];
  return [0, 0.2, 0.45, 0.8][level];
}

export function synergies(units: Unit[]): SynergyState {
  const counts: SynergyState = {
    ballistic: 0,
    arcane: 0,
    machine: 0,
    water: 0,
    fire: 0,
    electric: 0,
    dark: 0,
  };
  for (const u of units) {
    if (u.slot < 0) continue;
    const h = heroById[u.heroId];
    counts[h.faction]++;
    counts[h.element]++;
    if (h.secondaryElement && h.secondaryElement !== h.element) counts[h.secondaryElement]++;
  }
  return counts;
}
