export interface Enemy {
  route?:number;
  strikeAt?:number;
  strikeX?:number;
  strikeY?:number;
  controlOwner?:number;
  shieldHits?:number;
  doomOwner?:number;
  doomPower?:number;
  index: number;
  generation?:number;
  active: boolean;
  kind: string;
  hp: number;
  maxHp: number;
  armor: number;
  speed: number;
  progress: number;
  x: number;
  y: number;
  burn: number;
  burnTime: number;
  bleed: number;
  bleedTime: number;
  dotPower: number;
  dotOwner: number;
  slow: number;
  slowTime: number;
  attackTimer: number;
  namedSkillTimer:number;
  skillCasts:number;
  rangedTimer: number;
  rangedHitAt?: number;
  rangedTargetUid?: number;
  rangedDamage?: number;
  rangedFiredAt?: number;
  waterMark: number;
  waterTime: number;
  fireMark: number;
  fireTime: number;
  electricMark: number;
  electricTime: number;
  darkMark: number;
  darkTime: number;
  armorBreak: number;
  armorBreakTime: number;
  vulnerability: number;
  vulnerabilityTime: number;
  reactionKind: string;
  reactionTime: number;
}
export const createEnemy = (index: number): Enemy => ({
  index,
  active: false,
  kind: "crawler",
  hp: 0,
  maxHp: 0,
  armor: 0,
  speed: 0,
  progress: 0,
  x: 0,
  y: 0,
  burn: 0,
  burnTime: 0,
  bleed: 0,
  bleedTime: 0,
  dotPower: 0,
  dotOwner: 0,
  slow: 0,
  slowTime: 0,
  attackTimer: 0,
  namedSkillTimer:0,
  skillCasts:0,
  rangedTimer: 0,
  waterMark: 0,
  waterTime: 0,
  fireMark: 0,
  fireTime: 0,
  electricMark: 0,
  electricTime: 0,
  darkMark: 0,
  darkTime: 0,
  armorBreak: 0,
  armorBreakTime: 0,
  vulnerability: 0,
  vulnerabilityTime: 0,
  reactionKind: "",
  reactionTime: 0,
});
