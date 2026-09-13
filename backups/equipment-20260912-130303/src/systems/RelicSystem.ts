import { relics } from "../data/relics";
import { weighted, type RNG } from "../utils/random";
export function rollRelics(owned: string[], rng: RNG) {
  const pool = relics.filter((r) => !owned.includes(r.id));
  const choices = [];
  while (choices.length < 3 && pool.length) {
    const choice = weighted(pool, () => 1, rng);
    choices.push(choice);
    pool.splice(pool.indexOf(choice), 1);
  }
  return choices;
}
