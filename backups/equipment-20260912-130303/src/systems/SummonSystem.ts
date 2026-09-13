import { heroById } from "../data/heroes";
import { summonWeights } from "../data/balance";
import { weighted, type RNG } from "../utils/random";
import type { HeroGrade } from "../data/types";

// Grade is rolled first, then one operator inside that grade is chosen.
// This keeps B/A/S/SR rates stable even when the roster grows. Missing grades are
// automatically ignored and the remaining rates are normalized.
export function drawHero(deck: string[], rng: RNG): string {
  const available = deck.filter((id) => heroById[id]);
  if (!available.length) throw new Error("소환 가능한 요원이 없습니다.");
  const grades = (["B", "A", "S", "SR"] as HeroGrade[]).filter((grade) =>
    available.some((id) => heroById[id].grade === grade),
  );
  const grade = weighted(grades, (g) => summonWeights[g], rng);
  const pool = available.filter((id) => heroById[id].grade === grade);
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}
