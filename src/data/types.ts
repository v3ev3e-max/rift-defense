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
  stars: number;
}
export interface SaveData {
  commanderId:string;
  commanderName:string;
    raid:{day:string;week:string;attempts:number;dailyBest:number;weeklyDamage:number;weeklyBest:number;claimed:number[];lastSettlement:string};
  campaign?: {selected:string; doctrine?:string; autoAdvance:boolean; autoSkills:boolean; squad:string[]; lastDeployment:Record<string,number>; deploymentPresetNames:string[]; deploymentPresets:Array<{squad:string[];layout:Record<string,number>}|null>; records:Record<string,{stars:number;time:number;kills:number}>; research:Record<string,number>; fragments:Record<string,number>};
  operations:{riftBest:number;constraintBest:number;hardBest:number;lastDaily:string};
  saveVersion: 1;
  credits: number;
  equipmentGold:number;
  shards: number;
  heroes: Record<string, PermanentHero>;
  deck: string[];
  cleared: number;
  bestWave: number;
  runs: number;
  tutorial: boolean;
  settings: { sound: boolean; bgm: boolean; sfx: boolean; bgmVolume:number; sfxVolume:number; shake: boolean; lowEffects: boolean; battleSpeed:number };
  equipmentInventory: import('./equipment').EquipmentItem[];
  equipmentMaterials:number;
  autoSalvageB:boolean;
  equipmentPity:number;
  recruitPity:number;
  recruitCount:number;
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
  bossTier?: "mid" | "final";
  namedRegion?: number;
  namedSkill?: "rush"|"mend"|"root"|"frostbite"|"barrage"|"jam"|"drain"|"collapse"|"gale"|"mirage"|"repair"|"rewind";
  archetype?: "bruiser"|"charger"|"ranged"|"support";
  support?: {interval:number;heal:number;radius:number};
  charge?: {interval:number;distance:number};
  visualId?: string;
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
