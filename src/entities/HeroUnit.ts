import type { Evolution, Hero } from "../data/types";
export interface Unit {
  uid: number;
  heroId: string;
  star: number;
  slot: number;
  hp: number;
  maxHp: number;
  cooldown: number;
  droneCooldown: number;
  shots: number;
  droneShots: number;
  damage: number;
  stunned: number;
  x: number;
  y: number;
}
export function evolution(
  hero: Hero,
  star: number,
): Required<Omit<Evolution, "text">> {
  const r = {
    attack: 0,
    speed: 0,
    pierce: 0,
    chain: 0,
    splash: 0,
    block: 0,
    heal: 0,
    drones: 0,
    ramp: 0,
    crit: 0,
    execute: 0,
    slow: 0,
    gold: 0,
  };
  for (const e of hero.evolution.slice(0, star))
    for (const k of Object.keys(r) as (keyof typeof r)[]) r[k] += e[k] ?? 0;
  return r;
}
