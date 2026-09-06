export interface Enemy {
  index: number;
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
});
