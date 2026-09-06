import { heroById } from "../data/heroes";
import { summonWeights } from "../data/balance";
import { weighted, type RNG } from "../utils/random";
export function drawHero(deck: string[], rng: RNG): string {
  return weighted(deck, (id) => summonWeights[heroById[id].rarity], rng);
}
