import type { BattleModel } from "./BattleModel";
import { heroById } from "../data/heroes";
import { enemies } from "../data/enemies";

import {stepAutoSkills,charge} from "./AutoSkills";
import { attack } from "./ActionCombat";
export { attack } from "./ActionCombat";
import { distance } from "../utils/random";
import type { Enemy } from "../entities/Enemy";
import type { Unit } from "../entities/HeroUnit";
import { applyElementHit, tickElementState } from "./ElementSystem";
import {formationRole} from '../data/combatRoles';
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
export function stepCombat(m: BattleModel, dt: number) {
  const blockedBy=new Map<number,Unit>();
  for(const u of m.units){
    if(u.slot<0||u.hp<=0||formationRole(u.heroId)!=='tank')continue;
    const guardian=m.stats(u);
    const frontline=!!m.campaign&&u.slot===4;
    const cap=(guardian.e.block??0)+(frontline?1:0)+((u.tankBlockUntil??0)>m.time?1:0)+(u.branch==="tempo"?2:0)+(u.ultimate==="tempo"?2:0);
    const tauntRange=frontline?20:guardian.range;
    const candidates=m.enemies.filter(e=>e.active&&!enemies[e.kind].boss&&!blockedBy.has(e.index)&&distance(u,e)<=tauntRange).sort((a,b)=>b.progress-a.progress).slice(0,cap);
    for(const e of candidates)blockedBy.set(e.index,u);
  }
  for (const e of m.enemies) {
    if (!e.active) continue;
    const def = enemies[e.kind];
    tickElementState(e, dt);
    e.slowTime = Math.max(0, e.slowTime - dt);
    if (!e.slowTime) e.slow = 0;
    e.burnTime = Math.max(0, e.burnTime - dt);
    e.bleedTime = Math.max(0, e.bleedTime - dt);
    if (!e.burnTime) e.burn = 0;
    if (!e.bleedTime) e.bleed = 0;
    if (e.burn || e.bleed) {
      const owner = m.units.find((u) => u.uid === e.dotOwner)??m.retiredUnits.get(e.dotOwner);
      m.damageKind="dot";
      m.damage(
        e,
        dt *
          e.dotPower *
          (e.burn *
            0.12 *
            (m.builds.burn >= 2 ? 1.65 : 1) *
            (m.builds.burn >= 3 ? 1.8 : 1) *
            (m.elementUpgrades.fire>=5?1.3:1) +
            e.bleed * 0.065 * (m.builds.bleed >= 3 ? 2 : 1)),
        owner,
        true,
      );
      m.damageKind="basic";
      if (!e.active) continue;
    }
    const blocker=blockedBy.get(e.index),blocked=!!blocker;
    const nearbyTarget=blocker??m.units.filter(u=>u.slot>=0&&u.hp>0&&distance(u,e)<=125).sort((a,b)=>Number((b.tauntUntil??0)>m.time)-Number((a.tauntUntil??0)>m.time)||Number(formationRole(b.heroId)==='tank')-Number(formationRole(a.heroId)==='tank')||distance(a,e)-distance(b,e))[0];
    if(blocker){charge(blocker,dt*5);const r=m.records.find(r=>r.uid===blocker.uid);if(r)r.blockTime+=dt;}
    e.attackTimer += dt;
    e.rangedTimer += dt;
    if(m.campaign){
      if(nearbyTarget&&!def.boss&&!def.ranged&&e.attackTimer>=1.5){m.hurtUnit(nearbyTarget,8+(m.wave.number*.8));e.attackTimer=0;}
      if(def.ranged&&!e.rangedHitAt&&e.rangedTimer>=def.ranged.cooldown){
        const target=m.units.filter(u=>u.slot>=0&&u.hp>0&&distance(u,e)<=def.ranged!.range).sort((a,b)=>{
          const frontline=(u:Unit)=>formationRole(u.heroId)==='tank'&&u.slot===4?1:0;
          return Number((b.tauntUntil??0)>m.time)-Number((a.tauntUntil??0)>m.time)||frontline(b)-frontline(a)||distance(a,e)-distance(b,e);
        })[0];
        if(target){
          const flight=Math.max(.25,distance(e,target)/def.ranged.projectileSpeed);
          e.rangedHitAt=m.time+flight;e.rangedTargetUid=target.uid;e.rangedDamage=def.ranged.damage+m.wave.number*.2;e.rangedTimer=0;e.rangedFiredAt=m.time;
          m.emit('shot',e.x,e.y-8,target.x,target.y-10,def.color,{visual:'enemy-rift-bolt',duration:flight});
          m.onSound?.('attack');
        }
      }
      if(e.rangedHitAt&&m.time>=e.rangedHitAt){
        const target=m.units.find(u=>u.uid===e.rangedTargetUid&&u.slot>=0&&u.hp>0);
        if(target){
          const interceptor=m.units.find(u=>u.heroId==='neris'&&u.slot>=0&&u.hp>0&&(u.projectileGuardUntil??0)>m.time&&(u.projectileGuardHits??0)>0&&distance(u,target)<=m.stats(u).range);
          if(interceptor){interceptor.projectileGuardHits=Math.max(0,(interceptor.projectileGuardHits??0)-1);m.emit('blast',interceptor.x,interceptor.y,interceptor.x,interceptor.y,0x73e9ff,{visual:'tank-guard-hit-neris',duration:.38,radius:50});m.onSound?.('block');}
          else{m.hurtUnit(target,e.rangedDamage??0);m.emit('blast',target.x,target.y,target.x,target.y,def.color,{visual:'enemy-ranged-impact',duration:.38,radius:38});}
        }
        e.rangedHitAt=undefined;e.rangedTargetUid=undefined;e.rangedDamage=undefined;
      }
      if((def.disrupt||def.boss)&&!e.strikeAt&&e.attackTimer>= (def.boss?12:7)){
        const target=m.units.filter(u=>u.slot>=0&&u.hp>0&&(def.boss||distance(u,e)<300)&&m.time-(u.moveReadyAt??0)+10>=3).sort((a,b)=>{
          const taunts=(u:Unit)=>formationRole(u.heroId)==='tank'&&u.slot===4&&distance(u,e)<=45?1:0;
          return Number((b.tauntUntil??0)>m.time)-Number((a.tauntUntil??0)>m.time)||taunts(b)-taunts(a)||distance(a,e)-distance(b,e);
        })[0];
        if(target){e.strikeAt=m.time+2.5;e.strikeX=target.x;e.strikeY=target.y;e.attackTimer=0;}
      }
      if(e.strikeAt&&m.time>=e.strikeAt){for(const u of m.units)if(Math.hypot(u.x-e.strikeX!,u.y-e.strikeY!)<100)m.hurtUnit(u,def.boss?65:24);e.strikeAt=undefined;}
    }
    const pulseBoss = def.boss === "frost" || def.boss === "storm" || def.boss === "void";
    const pulseEvery = def.boss === "storm" ? 3 : def.boss === "void" ? 3.5 : 4;
    if (!m.campaign && (def.disrupt || pulseBoss) && e.attackTimer >= pulseEvery) {
      e.attackTimer = 0;
      if(e.kind==="jammer")for(const v of m.enemies)if(v.active&&distance(v,e)<100){v.waterMark=0;v.fireMark=0;v.electricMark=0;v.darkMark=0;}
      const radius = def.boss === "storm" ? 430 : def.boss === "void" ? 300 : def.boss ? 350 : 210;
      for (const u of m.units)
        if (u.slot >= 0 && distance(u, e) < radius) {
          u.stunned = Math.max(u.stunned, def.boss === "storm" ? 1.6 : def.boss ? 2.5 : 1.5);
          u.hp = Math.max(0, u.hp - (def.boss === "void" ? 30 : def.boss ? 22 : 9));
        }
      const enemyVisual = def.boss ? `enemy-${def.boss}` : "enemy-disrupt";
      m.emit("blast", e.x, e.y, e.x, e.y, def.boss === "storm" ? 0x65d8ff : def.boss === "void" ? 0xd071ff : 0xa39bfa, { visual: enemyVisual, duration: 0.7 });
    }
    const rage =
      def.boss === "rage" ? 1 + Math.floor((1 - e.hp / e.maxHp) * 4) * 0.35 : 1;
    const slowResist = e.kind==="sprinter"?.35:def.boss === "void" ? 0.55 : def.boss === "storm" ? 0.72 : 1;
    const slowCap=def.boss?.30:e.kind==="sprinter"?.35:.55;
    const effectiveSlow=Math.min(slowCap,e.slow*slowResist);
    const controller=m.units.find(u=>u.uid===e.controlOwner);if(controller&&effectiveSlow){const r=m.records.find(r=>r.uid===controller.uid);if(r)r.slowTime+=dt*effectiveSlow;}
    const firingSlow=def.ranged&&e.rangedFiredAt!==undefined&&m.time-e.rangedFiredAt<.32 ? .25 : 1;
    e.progress += dt * e.speed * rage * firingSlow * (blocked ? (m.campaign?0:0.18) : 1-effectiveSlow);
    const route=e.route&&m.campaign?.alternate?m.campaign.alternate:m.map;
    route.pathPoint(e.progress, e);
    if (e.progress >= route.pathLength) {
      m.emit('blast',e.x,e.y,e.x,e.y,def.color,{visual:`enemy-core-${e.kind}`,duration:.5});
      e.active = false;
      if (!m.invincible) m.core = Math.max(0, m.core - def.coreDamage);
      m.onSound?.("core");
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
          {const healed=Math.min(ally.maxHp-ally.hp,s.e.heal*dt);ally.hp+=healed;u.healingDone=(u.healingDone??0)+healed;}
    }
    u.cooldown -= dt;
    u.droneCooldown -= dt;
    if (u.cooldown > 0 && u.droneCooldown > 0) continue;
    let target: Enemy | undefined;
    let targetScore = -Infinity;
    for (const e of m.enemies) {
      if (!e.active || distance(e, u) > s.range) continue;
      // Noel hunts bosses first; Arin slightly prefers armored targets.
      // Everyone else keeps classic TD first-to-core priority.
      const score =
        e.progress + (u.branch==="focus"&&e.hp/e.maxHp<.3?m.map.pathLength:0) +
        (u.heroId === "noel" && enemies[e.kind].boss ? m.map.pathLength * 2 : 0) +
        (u.heroId === "arin" ? e.armor * 18 : 0);
      if (score > targetScore) {
        targetScore = score;
        target = e;
      }
    }
    if (!target) {
      u.cooldown = Math.max(0, u.cooldown);
      u.droneCooldown = Math.max(0, u.droneCooldown);
      continue;
    }
    if (u.cooldown <= 0) {
      if(m.actions.some(a=>a.active&&a.owner===u.uid&&a.kind==="sniper"))continue;
      attack(m, u, target);
      u.cooldown += 1 / s.speed;
    }
  }
  stepAutoSkills(m,dt);
}
