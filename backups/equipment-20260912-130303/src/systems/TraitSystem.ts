import { traits } from "../data/traits";
import { traitWeights } from "../data/balance";
import type { Build, Choice } from "../data/types";
import { weighted, type RNG } from "../utils/random";
export function rollTraits(builds: Record<Build, number>, rng: RNG): Choice[] {
  const pool = traits.filter(
    (t) => !t.build || t.value === builds[t.build] + 1,
  );
  const result: Choice[] = [];
  // One guaranteed build option keeps early bad rolls playable; jackpot is exactly 1% per remaining slot.
  const buildPool = pool.filter((t) => t.build);
  if (buildPool.length) {
    const focused = buildPool.filter((t) => builds[t.build!] > 0);
    result.push(weighted(focused.length ? focused : buildPool, () => 1, rng));
  }
  while (result.length < 3) {
    const available = pool.filter((t) => !result.includes(t));
    const jackpot = available.find((t) => t.tier === "JACKPOT");
    if (jackpot && rng() < 0.01) {
      result.push(jackpot);
      continue;
    }
    result.push(
      weighted(
        available.filter((t) => t.tier !== "JACKPOT"),
        (t) => traitWeights[t.tier],
        rng,
      ),
    );
  }
  return result;
}
