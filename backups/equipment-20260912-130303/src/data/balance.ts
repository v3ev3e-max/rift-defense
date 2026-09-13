import {CELL} from './map';
export const BALANCE = {
  summonCost: 30,
  focusCost: 45,
  maxStars: 5,
  maxUnits: 22,
  maxEnemies: 48,
  // Hard cap for endless mode: keeps combat/render cost bounded even at very high waves.
  maxEffects: 64,
  waveDuration: 21,
  fixedStep: 1 / 60,
  initialGold: 90,
  coreHp: 100,
  researchBase: 25,
  maxResearch: 15,
};
export const summonWeights = { B: 86, A: 10, S: 3, SR: 1 };
export const traitWeights = {
  NORMAL: 50,
  RARE: 30,
  EPIC: 15,
  LEGENDARY: 4,
  JACKPOT: 1,
};

/** Shared attack/support radius in the portrait battlefield's world units. */
export function combatRange(base: number, bonus = 0) {
  const native=Math.max(90,base*0.65);
  return native+Math.min(CELL,native*Math.max(0,bonus));
}
/** Non-tank melee units can reach across the nearest lane edge, but remain shorter than every ranged operator. */
export const MELEE_STRIKE_RANGE = 120;
// Equal unimpeded travel time across maps; turns and placement still matter.
export const REFERENCE_PATH_LENGTH = 1820;
