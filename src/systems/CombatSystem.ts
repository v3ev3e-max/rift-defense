import type { BattleModel } from "./BattleModel";
import { heroById } from "../data/heroes";
import { enemies } from "../data/enemies";
import { pathPoint, pathLength } from "../data/map";
import { distance } from "../utils/random";
import type { Enemy } from "../entities/Enemy";
import type { Unit } from "../entities/HeroUnit";
function adjacent(
  m: BattleModel,
  e: Enemy,
  range: number,
  limit: number,
  fn: (v: Enemy) => void,
) {
  let n = 0;
  for (const other of m.enemies)
    if (other.active && other !== e && distance(other, e) < range) {
      fn(other);
      if (++n >= limit) break;
    }
}
export function attack(m: BattleModel, u: Unit, target: Enemy) {
  const h = heroById[u.heroId],
    s = m.stats(u),
    b = m.builds,
    luck = m.bonuses.luck ?? 0;
  u.shots++;
  const crit = m.rng() < s.crit;
  const amount =
    Math.max(2, s.atk - target.armor) *
    (crit ? 2 + (b.crit ? 0.25 : 0) : 1) *
    (target.bleed > 0 && b.bleed >= 2 ? 1.25 : 1);
  const color = parseInt(h.color.slice(1), 16);
  m.emit("shot", u.x, u.y, target.x, target.y, crit ? 0xffdd83 : color);
  const tx = target.x,
    ty = target.y;
  if (s.e.slow) {
    target.slow = Math.max(target.slow, s.e.slow);
    target.slowTime = 2;
  }
  if (b.burn && m.rng() < 0.25 + luck) {
    target.burn = Math.min(8, target.burn + 1);
    target.burnTime = 4;
    target.dotPower = Math.max(target.dotPower, s.atk);
    target.dotOwner = u.uid;
    if (b.burn >= 2 && target.burn >= 4) {
      target.burn = 0;
      m.emit("blast", tx, ty, tx, ty, 0xff966b);
      adjacent(m, target, b.burn >= 3 ? 120 : 85, 120, (e) =>
        m.damage(e, s.atk * (b.burn >= 3 ? 2.8 : 1.6), u, true),
      );
    }
  }
  if (b.bleed) {
    target.bleed = Math.min(
      b.bleed >= 3 ? 12 : 6,
      target.bleed + (crit && b.bleed >= 2 ? 3 : 1),
    );
    target.bleedTime = 5;
    target.dotPower = Math.max(target.dotPower, s.atk);
    target.dotOwner = u.uid;
  }
  if (s.e.splash)
    adjacent(m, target, s.e.splash, 120, (e) =>
      m.damage(e, amount * 0.65, u, true),
    );
  if (s.e.pierce)
    adjacent(m, target, 150, s.e.pierce, (e) =>
      m.damage(e, amount * 0.75, u, true),
    );
  if (s.e.chain)
    adjacent(m, target, 210, s.e.chain, (e) => {
      m.emit("shot", tx, ty, e.x, e.y, color);
      m.damage(e, amount * 0.6, u, true);
    });
  if (b.shock && m.rng() < 0.25 + luck)
    adjacent(m, target, 200, b.shock >= 2 ? 4 : 2, (e) => {
      m.emit("shot", tx, ty, e.x, e.y, 0x8fdfff);
      if (b.shock >= 2) {
        e.slow = 0.25;
        e.slowTime = b.shock >= 3 ? 3 : 1.5;
      }
      m.damage(e, amount * (b.shock >= 3 ? 1.1 : 0.6), u, true);
    });
  if (b.blast && m.rng() < 0.2 + luck) {
    m.emit("blast", tx, ty, tx, ty, 0xffbf79);
    adjacent(m, target, 65, 120, (e) => m.damage(e, amount * 0.8, u, true));
    if (b.blast >= 2)
      adjacent(m, target, 180, 2, (e) => m.damage(e, amount * 0.5, u, true));
  }
  if (crit && (b.crit >= 2 || m.bonuses.bullet))
    adjacent(m, target, 260, 1, (e) => {
      m.emit("shot", tx, ty, e.x, e.y, 0xffeaae);
      m.damage(e, amount * (b.crit >= 3 ? 1.12 : 0.7), u, true);
    });
  const execute =
    s.e.execute &&
    target.hp / target.maxHp < s.e.execute &&
    !enemies[target.kind].boss;
  m.damage(target, execute ? target.hp : amount, u);
}
export function stepCombat(m: BattleModel, dt: number) {
  for (const e of m.enemies) {
    if (!e.active) continue;
    const def = enemies[e.kind];
    e.slowTime = Math.max(0, e.slowTime - dt);
    if (!e.slowTime) e.slow = 0;
    e.burnTime = Math.max(0, e.burnTime - dt);
    e.bleedTime = Math.max(0, e.bleedTime - dt);
    if (!e.burnTime) e.burn = 0;
    if (!e.bleedTime) e.bleed = 0;
    if (e.burn || e.bleed) {
      const owner = m.units.find((u) => u.uid === e.dotOwner);
      m.damage(
        e,
        dt *
          e.dotPower *
          (e.burn *
            0.12 *
            (m.builds.burn >= 2 ? 1.65 : 1) *
            (m.builds.burn >= 3 ? 1.8 : 1) +
            e.bleed * 0.065 * (m.builds.bleed >= 3 ? 2 : 1)),
        owner,
        true,
      );
      if (!e.active) continue;
    }
    let blocked = false;
    for (const u of m.units) {
      if (u.slot < 0 || u.hp <= 0 || heroById[u.heroId].id !== "yuria")
        continue;
      const cap = m.stats(u).e.block;
      let count = 0;
      for (const v of m.enemies) {
        if (v === e) break;
        if (v.active && distance(u, v) < 140) count++;
      }
      if (count < cap && distance(u, e) < 140) {
        blocked = true;
        u.hp = Math.max(0, u.hp - dt * (def.boss ? 45 : 8));
        break;
      }
    }
    e.attackTimer += dt;
    if ((def.disrupt || def.boss === "frost") && e.attackTimer >= 4) {
      e.attackTimer = 0;
      for (const u of m.units)
        if (u.slot >= 0 && distance(u, e) < (def.boss ? 350 : 210)) {
          u.stunned = 2.5;
          u.hp = Math.max(0, u.hp - (def.boss ? 22 : 9));
        }
      m.emit("blast", e.x, e.y, e.x, e.y, 0xa39bfa);
    }
    const rage =
      def.boss === "rage" ? 1 + Math.floor((1 - e.hp / e.maxHp) * 4) * 0.35 : 1;
    e.progress += dt * e.speed * (1 - e.slow) * rage * (blocked ? 0.12 : 1);
    pathPoint(e.progress, e);
    if (e.progress >= pathLength) {
      e.active = false;
      if (!m.invincible) m.core = Math.max(0, m.core - def.coreDamage);
      m.say(`방어선 돌파 · CORE −${def.coreDamage}`);
    }
  }
  for (const u of m.units) {
    if (u.slot < 0) continue;
    u.stunned = Math.max(0, u.stunned - dt);
    if (u.hp <= 0) {
      u.cooldown += dt;
      if (u.cooldown >= 7) {
        u.hp = u.maxHp * 0.6;
        u.cooldown = 0;
      }
      continue;
    }
    const s = m.stats(u);
    if (s.e.heal) {
      for (const ally of m.units)
        if (ally.slot >= 0 && ally.hp > 0 && distance(u, ally) < s.range)
          ally.hp = Math.min(ally.maxHp, ally.hp + s.e.heal * dt);
    }
    u.cooldown -= dt;
    u.droneCooldown -= dt;
    if (u.cooldown > 0 && u.droneCooldown > 0) continue;
    let target: Enemy | undefined;
    for (const e of m.enemies)
      if (
        e.active &&
        distance(e, u) <= s.range &&
        (!target || e.progress > target.progress)
      )
        target = e;
    if (!target) {
      u.cooldown = Math.max(0, u.cooldown);
      u.droneCooldown = Math.max(0, u.droneCooldown);
      continue;
    }
    if (u.cooldown <= 0) {
      attack(m, u, target);
      u.cooldown += 1 / s.speed;
      m.onSound?.("attack");
    }
    const drones = s.e.drones + (m.builds.drone ? 1 : 0);
    if (drones && u.droneCooldown <= 0) {
      u.droneCooldown = 1 / (1 + (m.builds.drone >= 2 ? 0.35 : 0));
      if (!target.active) continue;
      const damage =
        s.atk *
        0.38 *
        drones *
        (m.builds.drone >= 2 ? 1.3 : 1) *
        (m.synergy.machine >= 3 ? 1.2 : 1);
      m.emit("shot", u.x + 25, u.y - 30, target.x, target.y, 0xffd984);
      u.droneShots++;
      if (m.builds.drone >= 3 && u.droneShots % 4 === 0) {
        m.emit("blast", target.x, target.y, target.x, target.y, 0xffd984);
        adjacent(m, target, 90, 120, (e) => m.damage(e, damage * 2, u, true));
      }
      m.damage(target, damage, u, true);
    }
  }
}
