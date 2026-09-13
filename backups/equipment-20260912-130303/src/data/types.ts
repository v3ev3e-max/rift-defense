export type Build = "burn" | "water" | "shock" | "bleed" | "crit" | "blast" | "drone";
export type Element = "water" | "fire" | "electric" | "dark";
export type HeroGrade = "B" | "A" | "S" | "SR";
export type ElementReaction =
  | "conduct"
  | "overload"
  | "vaporize"
  | "blackflame"
  | "corrosion"
  | "voidshock";
export type Tier = "NORMAL" | "RARE" | "EPIC" | "LEGENDARY" | "JACKPOT";
export interface Evolution {
  text: string;
  attack?: number;
  speed?: number;
  pierce?: number;
  chain?: number;
  splash?: number;
  block?: number;
  heal?: number;
  drones?: number;
  ramp?: number;
  crit?: number;
  execute?: number;
  slow?: number;
  gold?: number;
}
export interface Hero {
  id: string;
  name: string;
  code: string;
  role: string;
  faction: "ballistic" | "arcane" | "machine";
  rangeType: "melee" | "ranged";
  grade: HeroGrade;
  element: Element;
  secondaryElement?: Element;
  color: string;
  hair: string;
  atk: number;
  hp: number;
  speed: number;
  range: number;
  build: Build;
  description: string;
  skill: string;
  evolution: Evolution[];
  asset: { key: string; url?: string; frame?: string; atlas?: string };
}
export interface PermanentHero {
  owned: boolean;
  level: number;
  breakthrough: number;
  skillLevel: number;
  equipment: string[];
  affection: number;
}
export interface SaveData {
  campaign?: {selected:string; doctrine?:string; squad:string[]; records:Record<string,{stars:number;time:number;kills:number}>; research:Record<string,number>; fragments:Record<string,number>};
  saveVersion: 1;
  credits: number;
  shards: number;
  heroes: Record<string, PermanentHero>;
  deck: string[];
  cleared: number;
  bestWave: number;
  runs: number;
  tutorial: boolean;
  settings: { sound: boolean; shake: boolean; lowEffects: boolean };
}
export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  armor: number;
  reward: number;
  color: number;
  coreDamage: number;
  disrupt?: boolean;
  ranged?: {range:number; cooldown:number; damage:number; projectileSpeed:number};
  boss?: "rage" | "frost" | "storm" | "void";
}
export interface Choice {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  build?: Build;
  effect: string;
  value: number;
}
export interface Point {
  x: number;
  y: number;
}
