import {charge} from './AutoSkills';
import {advanceTriple} from './TripleReactions';
import {addZone,reactionShot} from './ActionCombat';
import type { BattleModel } from "./BattleModel";
import type { Element, ElementReaction, HeroGrade } from "../data/types";
import type { Enemy } from "../entities/Enemy";
import type { Unit } from "../entities/HeroUnit";
import { heroById } from "../data/heroes";
import { enemies } from "../data/enemies";
import {gradeCombatBudget} from '../data/strategy';
import {
  elementReactionBonus,
  elementStatusDurationBonus,
  synergyLevel,
} from "./SynergySystem";

export const reactionNames: Record<ElementReaction, string> = {
  conduct: "전도",
  overload: "과부하",
  vaporize: "증발",
  blackflame: "흑염",
  corrosion: "침식",
  voidshock: "공허 감전",
};

export const reactionColors: Record<ElementReaction, number> = {
  conduct: 0x7be9ff,
  overload: 0xff8c59,
  vaporize: 0xd9f6ff,
  blackflame: 0xc05cff,
  corrosion: 0x689dff,
  voidshock: 0xb995ff,
};

const pairs: Record<string, ElementReaction> = {
  "electric|water": "conduct",
  "electric|fire": "overload",
  "fire|water": "vaporize",
  "dark|fire": "blackflame",
  "dark|water": "corrosion",
  "dark|electric": "voidshock",
};

const buildForElement = {
  water: "water",
  fire: "burn",
  electric: "shock",
  dark: "bleed",
} as const;

function markValue(e: Enemy, element: Element) {
  return e[`${element}Mark` as keyof Enemy] as number;
}
function setMark(e: Enemy, element: Element, value: number, time: number) {
  (e as unknown as Record<string, number>)[`${element}Mark`] = value;
  (e as unknown as Record<string, number>)[`${element}Time`] = time;
}
function markTime(e: Enemy, element: Element) {
  return e[`${element}Time` as keyof Enemy] as number;
}

function nearby(
  m: BattleModel,
  origin: Enemy,
  radius: number,
  limit: number,
  fn: (target: Enemy) => void,
) {
  let n = 0;
  for (const e of m.enemies) {
    if (!e.active || e === origin) continue;
    if (Math.hypot(e.x - origin.x, e.y - origin.y) > radius) continue;
    fn(e);
    if (++n >= limit) break;
  }
}

function reactionFor(incoming: Element, target: Enemy) {
  // Fixed priority makes the system deterministic when an enemy carries more
  // than one mark. A hit triggers at most one reaction, preventing effect storms.
  const priority: Element[] = ["electric", "water", "fire", "dark"];
  for (const existing of priority) {
    if (existing === incoming || markValue(target, existing) <= 0) continue;
    const key = [incoming, existing].sort().join("|");
    const reaction = pairs[key];
    if (reaction) return { reaction, existing };
  }
  return undefined;
}

function reactionMultiplier(
  m: BattleModel,
  first: Element,
  second: Element,
  star: number,
  grade: HeroGrade,
) {
  const firstCount = m.synergy[first];
  const secondCount = m.synergy[second];
  const firstBuild = m.builds[buildForElement[first]];
  const secondBuild = m.builds[buildForElement[second]];
  let kyleBonus = 0;
  for (const u of m.units)
    if (u.slot >= 0 && u.hp > 0 && u.heroId === "kyle")
      kyleBonus = Math.max(kyleBonus, 0.06 + (u.star - 1) * 0.015);
  return (
    1 +
    elementReactionBonus(firstCount) +
    elementReactionBonus(secondCount) +
    firstBuild * 0.06 +
    secondBuild * 0.06 +
    m.builds.blast * 0.06 +
    kyleBonus +
    (star - 1) * 0.035 +
    gradeCombatBudget[grade].reaction
  );
}

function recordReaction(m: BattleModel, target: Enemy, reaction: ElementReaction) {
  m.reactionCounts[reaction]++;
  target.reactionKind = reaction;
  target.reactionTime = 0.5;
  const element = reaction === "overload" ? "fire" : reaction === "vaporize" || reaction === "corrosion" ? "water" : reaction === "blackflame" ? "dark" : "electric";
  m.emit("blast", target.x, target.y, target.x, target.y, reactionColors[reaction], { visual: `reaction-${reaction}`, duration: 0.48 });
}

export function applyElementHit(
  m: BattleModel,
  unit: Unit,
  target: Enemy,
  baseDamage: number,
  forcedElement?: Element,
) {
  if (!target.active) return;
  const hero = heroById[unit.heroId];
  const incoming =
    forcedElement ??
    (hero.secondaryElement && unit.shots % 2 === 0
      ? hero.secondaryElement
      : hero.element);
  const duration =
    4 + elementStatusDurationBonus(incoming, m.synergy[incoming]);
  const found = reactionFor(incoming, target);

  if (!found) {
    const next = Math.min(3, markValue(target, incoming) + 1);
    setMark(target, incoming, next, duration);
    applyElementPassive(m, unit, target, incoming, next, baseDamage);
    return;
  }

  const { reaction, existing } = found;
  // Dual-element Arden supplies both marks by himself. Only three of each five
  // alternating hits may complete a self reaction, keeping team reactions valuable.
  if(unit.heroId==='arden'&&unit.shots%5<2){setMark(target,incoming,1,duration);return;}
  const mult = reactionMultiplier(m, incoming, existing, unit.star, hero.grade);
  setMark(target, existing, 0, 0);
  // The incoming element remains as the next link starter. This creates a
  // readable alternating-combo rhythm without allowing one mark to react forever.
  setMark(target, incoming, 1, duration);
  recordReaction(m, target, reaction);m.lastReaction=reactionNames[reaction];charge(unit,8);
  advanceTriple(m,unit,target,incoming,existing,baseDamage);
  const record=m.records.find(r=>r.uid===unit.uid);if(record)record.reactions++;
  const previousKind=m.damageKind;m.damageKind="reaction";

  const electricLevel = synergyLevel(m.synergy.electric);
  const waterLevel = synergyLevel(m.synergy.water);
  const darkLevel = synergyLevel(m.synergy.dark);

  if (reaction === "conduct") {
    m.damage(target, baseDamage * 0.38 * mult, unit, true);
    target.slow = Math.max(target.slow, 0.18 + waterLevel * 0.035);
    target.slowTime = Math.max(target.slowTime, 1.3 + waterLevel * 0.2);
    let arcIndex=0,arcOrigin={x:target.x,y:target.y};
    nearby(m, target, 185, 3 + electricLevel, (e) => {
      e.slow = Math.max(e.slow, 0.14 + waterLevel * 0.025);
      e.slowTime = Math.max(e.slowTime, 1.1);
      reactionShot(m,unit,arcOrigin,e,baseDamage*.42*mult,arcIndex++*.08,"electric");arcOrigin={x:e.x,y:e.y};
    });
  } else if (reaction === "overload") {
    target.slow=Math.max(target.slow,.95);target.slowTime=Math.max(target.slowTime,.25);
    m.damage(target, baseDamage * 0.62 * mult, unit, true);
    target.armorBreak = Math.max(target.armorBreak, 0.16 + electricLevel * 0.025);
    target.armorBreakTime = Math.max(target.armorBreakTime, 2.2);
    nearby(m, target, 100 + m.builds.blast * 8, 5, (e) => {
      e.armorBreak = Math.max(e.armorBreak, 0.12);
      e.armorBreakTime = Math.max(e.armorBreakTime, 1.8);
      m.damage(e, baseDamage * 0.55 * mult, unit, true);
    });
  } else if (reaction === "vaporize") {
    target.armorBreak=Math.max(target.armorBreak,.25);
    target.armorBreakTime=Math.max(target.armorBreakTime,3);
    nearby(m,target,90,5,e=>m.damage(e,baseDamage*.4*mult,unit,true));
    const bossScale = enemies[target.kind].boss ? 0.72 : 1;
    m.damage(target, baseDamage * 0.95 * mult * bossScale, unit, true);
    target.slow = Math.max(target.slow, 0.12 + waterLevel * 0.025);
    target.slowTime = Math.max(target.slowTime, 0.8);
  } else if (reaction === "blackflame") {
    const ardenScale=unit.heroId==='arden'?.6:1;
    m.damage(target, baseDamage * 0.42 * mult*ardenScale, unit, true);
    target.burn = Math.min(10, target.burn + 2 + Math.floor(m.builds.burn / 2));
    target.burnTime = Math.max(target.burnTime, 5);
    target.dotPower = Math.max(target.dotPower, baseDamage * 1.05*ardenScale);
    target.dotOwner = unit.uid;
    target.vulnerability = Math.max(target.vulnerability, 0.07 + darkLevel * 0.025);
    target.vulnerabilityTime = Math.max(target.vulnerabilityTime, 4);
  } else if (reaction === "corrosion") {
    addZone(m,unit,target.x,target.y,85,"corrosion");
    m.damage(target, baseDamage * 0.28 * mult, unit, true);
    target.armorBreak = Math.max(target.armorBreak, 0.24 + darkLevel * 0.025);
    target.armorBreakTime = Math.max(target.armorBreakTime, 3.2);
    target.slow = Math.max(target.slow, 0.23 + waterLevel * 0.035);
    target.slowTime = Math.max(target.slowTime, 2.2);
  } else if (reaction === "voidshock") {
    target.slow=Math.max(target.slow,.9);target.slowTime=Math.max(target.slowTime,.35);
    m.damage(target, baseDamage * 0.35 * mult, unit, true);
    target.vulnerability = Math.max(target.vulnerability, 0.09 + darkLevel * 0.03);
    target.vulnerabilityTime = Math.max(target.vulnerabilityTime, 3.2);
    let arcIndex=0,arcOrigin={x:target.x,y:target.y};
    nearby(m, target, 205, 2 + electricLevel, (e) => {
      e.vulnerability = Math.max(e.vulnerability, 0.05 + darkLevel * 0.015);
      e.vulnerabilityTime = Math.max(e.vulnerabilityTime, 2.4);
      reactionShot(m,unit,arcOrigin,e,baseDamage*.34*mult,arcIndex++*.08,"dark");arcOrigin={x:e.x,y:e.y};
    });
  }

  m.damageKind=previousKind;
  applyElementPassive(m, unit, target, incoming, 1, baseDamage);
}

function applyElementPassive(
  m: BattleModel,
  unit: Unit,
  target: Enemy,
  element: Element,
  stacks: number,
  baseDamage: number,
  forcedElement?: Element,
) {
  if (element === "fire") {
    const level=m.elementUpgrades.fire;
    target.burn = Math.min(10, Math.max(target.burn, stacks + m.builds.burn));
    target.burnTime = Math.max(target.burnTime, 4 + m.builds.burn * 0.4+level*.12);
    target.dotPower = Math.max(target.dotPower, baseDamage * (0.75 + m.builds.burn * 0.12+(level>=2?.18:0)));
    target.dotOwner = unit.uid;
    if(level>=3)nearby(m,target,72,2,e=>m.damage(e,baseDamage*.08,unit,true));
  } else if (element === "water") {
    const level=m.elementUpgrades.water;
    target.slow = Math.max(target.slow, 0.08 + stacks * 0.035 + m.builds.water * 0.035+level*.006);
    target.slowTime = Math.max(target.slowTime, 1.4 + m.builds.water * 0.25+(level>=2?.35:0));
  } else if (element === "dark") {
    const darkLevel = synergyLevel(m.synergy.dark);
    target.vulnerability = Math.max(
      target.vulnerability,
      0.025 * stacks + darkLevel * 0.018 + m.builds.bleed * 0.015+m.elementUpgrades.dark*.01,
    );
    target.vulnerabilityTime = Math.max(target.vulnerabilityTime, 4.2);
  } else if (element === "electric" && stacks >= 3) {
    // Three charge stacks arc once, then collapse to one stack. Bounded to one
    // extra target so rapid-fire electric heroes cannot create quadratic work.
    const level=m.elementUpgrades.electric;
    nearby(m, target, 170, 1 + Number(synergyLevel(m.synergy.electric) >= 2)+Number(level>=3), (e) => {
      m.damage(e, baseDamage * (0.22 + m.builds.shock * 0.05+(level>=2?.15:0)+(level>=5?.2:0)), unit, true);
      m.emit('shot',target.x,target.y,e.x,e.y,0x7be9ff,{visual:'transfer-electric',duration:.26});
    });
    setMark(target, "electric", 1, markTime(target, "electric"));
  }
}

export function tickElementState(e: Enemy, dt: number) {
  for (const element of ["water", "fire", "electric", "dark"] as Element[]) {
    const timeKey = `${element}Time` as keyof Enemy;
    const markKey = `${element}Mark` as keyof Enemy;
    const next = Math.max(0, (e[timeKey] as number) - dt);
    (e as unknown as Record<string, number>)[timeKey] = next;
    if (!next) (e as unknown as Record<string, number>)[markKey] = 0;
  }
  e.armorBreakTime = Math.max(0, e.armorBreakTime - dt);
  if (!e.armorBreakTime) e.armorBreak = 0;
  e.vulnerabilityTime = Math.max(0, e.vulnerabilityTime - dt);
  if (!e.vulnerabilityTime) e.vulnerability = 0;
  e.reactionTime = Math.max(0, e.reactionTime - dt);
  if (!e.reactionTime) e.reactionKind = "";
}
