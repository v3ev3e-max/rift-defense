import type { BattleModel } from "./BattleModel";
import { heroById } from "../data/heroes";
import { enemies } from "../data/enemies";

import {stepAutoSkills,charge} from "./AutoSkills";
import { attack, supportBasic } from "./ActionCombat";
export { attack } from "./ActionCombat";
import { distance } from "../utils/random";
import type { Enemy } from "../entities/Enemy";
import type { Unit } from "../entities/HeroUnit";
import { applyElementHit, tickElementState } from "./ElementSystem";
import {combatRoles,formationRole} from '../data/combatRoles';
import {isFrontlineSlot} from '../data/campaign';
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
function tankCoversRoute(m:BattleModel,u:Unit,e:Enemy){
  if(!m.campaign?.alternate)return true;
  // The two forward pads belong to their visible route. The centre pad is the
  // deliberate flex position and may intercept either lane.
  if(u.slot===1)return (e.route??0)===0;
  if(u.slot===3)return (e.route??0)===1;
  return true;
}
export function stepCombat(m: BattleModel, dt: number) {
  const blockedBy=new Map<number,Unit>();
  for(const u of m.units){
    if(u.slot<0||u.hp<=0||formationRole(u.heroId)!=='tank')continue;
    const guardian=m.stats(u);
    const frontline=!!m.campaign&&isFrontlineSlot(m.campaign,u.slot);
    const cap=(guardian.e.block??0)+(frontline?1:0)+((u.tankBlockUntil??0)>m.time?1:0)+(u.branch==="tempo"?2:0)+(u.ultimate==="tempo"?2:0);
    // Split-route pads sit about 100 px from their lane centre. Give each
    // frontline tank enough reach to claim its own lane without pulling the
    // opposite route across the formation.
    const tauntRange=frontline?(m.campaign?.alternate?110:20):guardian.range;
    const candidates=m.enemies.filter(e=>e.active&&!enemies[e.kind].boss&&!blockedBy.has(e.index)&&tankCoversRoute(m,u,e)&&distance(u,e)<=tauntRange).sort((a,b)=>b.progress-a.progress);
    let remaining=cap;
    for(const e of candidates){const cost=m.campaign?(e.kind==='sprinter'?3:e.kind==='runner'?2:1):1;if(remaining>=cost){blockedBy.set(e.index,u);remaining-=cost;}}
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
    const blocker=blockedBy.get(e.index);
    const living=m.units.filter(u=>u.slot>=0&&u.hp>0);
    const lineTank=m.campaign?living.filter(u=>formationRole(u.heroId)==='tank'&&isFrontlineSlot(m.campaign,u.slot)&&tankCoversRoute(m,u,e)&&Math.abs(u.y-e.y)<=90).sort((a,b)=>distance(a,e)-distance(b,e))[0]:undefined;
    const rangedFieldTarget=def.ranged&&!lineTank?living.filter(u=>formationRole(u.heroId)!=='tank'||!isFrontlineSlot(m.campaign,u.slot)).sort((a,b)=>Number((b.tauntUntil??0)>m.time)-Number((a.tauntUntil??0)>m.time)||distance(a,e)-distance(b,e))[0]:undefined;
    const campaignTarget=m.campaign?(lineTank??rangedFieldTarget??living.sort((a,b)=>{
      const priority=(u:Unit)=>Number((u.tauntUntil??0)>m.time)*100+Number(formationRole(u.heroId)==='tank'&&isFrontlineSlot(m.campaign,u.slot))*20+Number(formationRole(u.heroId)==='tank')*10+u.x/100;
      return priority(b)-priority(a)||distance(a,e)-distance(b,e);
    })[0]):undefined;
    const rangedMode=!!def.ranged&&!lineTank;
    // A lane tank only stops an enemy once both sides can trade melee blows.
    // Using the old generic 135 range let enemies hit Yuria outside her sword range.
    const engagementRange=rangedMode?def.ranged!.range:lineTank?Math.min(110,m.stats(lineTank).range):135;
    const engaged=!!campaignTarget&&distance(campaignTarget,e)<=engagementRange;
    const blocked=!!blocker||!!m.campaign&&engaged;
    const nearbyTarget=blocker??(engaged?campaignTarget:undefined)??m.units.filter(u=>u.slot>=0&&u.hp>0&&distance(u,e)<=125).sort((a,b)=>Number((b.tauntUntil??0)>m.time)-Number((a.tauntUntil??0)>m.time)||Number(formationRole(b.heroId)==='tank')-Number(formationRole(a.heroId)==='tank')||distance(a,e)-distance(b,e))[0];
    const activeBlocker=blocker??(engaged?lineTank:undefined);
    if(activeBlocker){charge(activeBlocker,dt*5,m.time);const r=m.records.find(r=>r.uid===activeBlocker.uid);if(r)r.blockTime+=dt;}
    e.attackTimer += dt;
    e.namedSkillTimer += dt;
    if(def.charge&&e.namedSkillTimer>=def.charge.interval){
      // A completed charge may close open ground, but cannot phase through a
      // tank that is already blocking or trading melee attacks with it.
      if(!blocked)e.progress+=def.charge.distance;
      e.namedSkillTimer=0;m.emit('blast',e.x,e.y,e.x,e.y,def.color,{visual:'enemy-rage',duration:.45,radius:70});
    }
    if(def.support&&e.namedSkillTimer>=def.support.interval){for(const ally of m.enemies)if(ally.active&&Math.hypot(ally.x-e.x,ally.y-e.y)<=def.support.radius)ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*def.support.heal);e.namedSkillTimer=0;m.emit('blast',e.x,e.y,e.x,e.y,def.color,{visual:'enemy-disrupt',duration:.55,radius:def.support.radius});}
    // Ranged enemies begin aiming only after reaching their engagement line.
    // This prevents a whole spawn group from banking cooldown off-screen and
    // firing into the frontline on the first frame that it becomes targetable.
    e.rangedTimer = def.ranged&&m.campaign&&(!rangedMode||!engaged)?0:e.rangedTimer+dt;
    if(m.campaign){
      const campaignAttack=m.campaign.enemyAttack*(def.boss?.4:1);
      if(nearbyTarget&&!def.boss&&(!def.ranged||!!lineTank)&&e.attackTimer>=1.5){m.hurtUnit(nearbyTarget,(8+(m.wave.number*.8))*campaignAttack);e.attackTimer=0;}
      if(rangedMode&&!e.rangedHitAt&&e.rangedTimer>=def.ranged!.cooldown){
        const target=m.campaign?(engaged?campaignTarget:undefined):m.units.filter(u=>u.slot>=0&&u.hp>0&&distance(u,e)<=def.ranged!.range).sort((a,b)=>{
           const frontline=(u:Unit)=>formationRole(u.heroId)==='tank'&&isFrontlineSlot(m.campaign,u.slot)?1:0;
          return Number((b.tauntUntil??0)>m.time)-Number((a.tauntUntil??0)>m.time)||frontline(b)-frontline(a)||distance(a,e)-distance(b,e);
        })[0];
        if(target){
          const flight=Math.max(.25,distance(e,target)/def.ranged!.projectileSpeed);
          e.rangedHitAt=m.time+flight;e.rangedTargetUid=target.uid;e.rangedDamage=(def.ranged!.damage+m.wave.number*.2)*campaignAttack;e.rangedTimer=0;e.rangedFiredAt=m.time;
          m.emit('shot',e.x,e.y-8,target.x,target.y-10,def.color,{visual:'enemy-rift-bolt',duration:flight});
          m.onSound?.('attack');
        }
      }
      if(e.rangedHitAt&&m.time>=e.rangedHitAt){
        const target=m.units.find(u=>u.uid===e.rangedTargetUid&&u.slot>=0&&u.hp>0);
        if(target){
          const interceptor=m.units.find(u=>['neris','hana'].includes(u.heroId)&&u.slot>=0&&u.hp>0&&(u.projectileGuardUntil??0)>m.time&&(u.projectileGuardHits??0)>0&&distance(u,target)<=m.stats(u).range);
          if(interceptor){interceptor.projectileGuardHits=Math.max(0,(interceptor.projectileGuardHits??0)-1);m.emit('blast',interceptor.x,interceptor.y,interceptor.x,interceptor.y,0x73e9ff,{visual:'tank-guard-hit-neris',duration:.38,radius:50});m.onSound?.('block');}
          else{m.hurtUnit(target,e.rangedDamage??0);m.emit('blast',target.x,target.y,target.x,target.y,def.color,{visual:'enemy-ranged-impact',duration:.38,radius:38});}
        }
        e.rangedHitAt=undefined;e.rangedTargetUid=undefined;e.rangedDamage=undefined;
      }
      if(def.namedSkill&&e.namedSkillTimer>=6.5){
        const living=m.units.filter(u=>u.slot>=0&&u.hp>0),nearest=living.sort((a,b)=>distance(a,e)-distance(b,e))[0],far=living.sort((a,b)=>distance(b,e)-distance(a,e))[0];
        if(def.namedSkill==='rush'&&!blocked)e.progress+=30;
        else if(def.namedSkill==='mend')e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.1);
        else if(def.namedSkill==='root'&&nearest)nearest.stunned=Math.max(nearest.stunned,1.4);
        else if(def.namedSkill==='frostbite'){for(const u of living)if(distance(u,e)<260){m.hurtUnit(u,10*campaignAttack);u.stunned=Math.max(u.stunned,.5);}}
        else if(def.namedSkill==='barrage'&&far)m.hurtUnit(far,16*campaignAttack);
        else if(def.namedSkill==='jam'){for(const u of living)u.cooldown=Math.max(u.cooldown,.7);}
        else if(def.namedSkill==='drain'&&nearest){const dealt=14*campaignAttack;m.hurtUnit(nearest,dealt);e.hp=Math.min(e.maxHp,e.hp+dealt*3);}
        else if(def.namedSkill==='collapse'){for(const u of living)m.hurtUnit(u,12*campaignAttack);}
        else if(def.namedSkill==='gale'){for(const u of living){u.stunned=Math.max(u.stunned,.65);m.hurtUnit(u,8*campaignAttack);}}
        else if(def.namedSkill==='mirage')e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.16);
        else if(def.namedSkill==='repair'){for(const ally of m.enemies)if(ally.active&&distance(ally,e)<220)ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*.14);}
        else if(def.namedSkill==='rewind'){e.progress=Math.max(0,e.progress-45);e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.1);}
        m.emit('blast',e.x,e.y,e.x,e.y,def.color,{visual:`enemy-${def.namedSkill==='rush'?'rage':'disrupt'}`,duration:.7,radius:170});
        e.namedSkillTimer=0;e.skillCasts++;
      }
      if((def.disrupt||def.boss==='rage')&&!e.strikeAt&&e.attackTimer>= (def.boss?(def.bossTier==='mid'?10:12):7)){
        const target=m.units.filter(u=>u.slot>=0&&u.hp>0&&(def.boss||distance(u,e)<300)&&m.time-(u.moveReadyAt??0)+10>=3).sort((a,b)=>{
           const taunts=(u:Unit)=>formationRole(u.heroId)==='tank'&&isFrontlineSlot(m.campaign,u.slot)&&distance(u,e)<=45?1:0;
          return Number((b.tauntUntil??0)>m.time)-Number((a.tauntUntil??0)>m.time)||taunts(b)-taunts(a)||distance(a,e)-distance(b,e);
        })[0];
        if(target){e.strikeAt=m.time+2.5;e.strikeX=target.x;e.strikeY=target.y;e.attackTimer=0;e.skillCasts++;}
      }
      if(e.strikeAt&&m.time>=e.strikeAt){for(const u of m.units)if(Math.hypot(u.x-e.strikeX!,u.y-e.strikeY!)<100)m.hurtUnit(u,(def.boss?(m.campaign?38:65):24)*campaignAttack);e.strikeAt=undefined;}
    }
    const pulseBoss = def.boss === "frost" || def.boss === "storm" || def.boss === "void";
    const pulseEvery = m.campaign&&def.bossTier==='mid'?10:def.boss === "storm" ? 3 : def.boss === "void" ? 3.5 : 4;
    if ((!m.campaign&&def.disrupt||pulseBoss) && e.attackTimer >= pulseEvery) {
      e.attackTimer = 0;
      e.skillCasts++;
      if(e.kind==="jammer")for(const v of m.enemies)if(v.active&&distance(v,e)<100){v.waterMark=0;v.fireMark=0;v.electricMark=0;v.darkMark=0;}
      const radius = def.boss === "storm" ? 430 : def.boss === "void" ? 300 : def.boss ? 350 : 210;
      for (const u of m.units)
        if (u.slot >= 0 && distance(u, e) < radius) {
          const campaignBossScale=m.campaign?.08:1;
          if(!m.campaign)u.stunned = Math.max(u.stunned, (def.boss === "storm" ? 1.6 : def.boss ? 2.5 : 1.5)*campaignBossScale);
          m.hurtUnit(u,(def.boss === "void" ? 30 : def.boss ? 22 : 9)*campaignBossScale*(m.campaign?.enemyAttack??1));
        }
      const enemyVisual = def.boss ? `enemy-${def.boss}` : "enemy-disrupt";
      m.emit("blast", e.x, e.y, e.x, e.y, def.boss === "storm" ? 0x65d8ff : def.boss === "void" ? 0xd071ff : 0xa39bfa, { visual: enemyVisual, duration: 0.7 });
    }
    const rage =
      def.boss === "rage" ? 1 + Math.floor((1 - e.hp / e.maxHp) * 4) * (m.campaign?.12:.35) : 1;
    const slowResist = e.kind==="sprinter"?.35:def.boss === "void" ? 0.55 : def.boss === "storm" ? 0.72 : 1;
    const slowCap=def.boss?.30:e.kind==="sprinter"?.35:.55;
    const effectiveSlow=Math.min(slowCap,e.slow*slowResist);
    const controller=m.units.find(u=>u.uid===e.controlOwner);if(controller&&effectiveSlow){const r=m.records.find(r=>r.uid===controller.uid);if(r)r.slowTime+=dt*effectiveSlow;}
    const firingSlow=def.ranged&&e.rangedFiredAt!==undefined&&m.time-e.rangedFiredAt<.32 ? .25 : 1;
    e.progress += dt * e.speed * rage * firingSlow * (blocked ? (m.campaign?0:0.18) : 1-effectiveSlow);
    const route=e.route&&m.campaign?.alternate?m.campaign.alternate:m.map;
    route.pathPoint(e.progress, e);
    if (e.progress >= route.pathLength) {
      if(def.boss)m.onSound?.('boss-end');
      m.emit('blast',e.x,e.y,e.x,e.y,def.color,{visual:`enemy-core-${e.kind}`,duration:.5});
      e.active = false;
      const coreDamage=m.campaign&&['crawler','runner'].includes(e.kind)?5:def.coreDamage;
      if (!m.invincible) m.core = Math.max(0, m.core - coreDamage);
      m.onSound?.("core");
      m.say(`방어선 돌파 · CORE −${coreDamage}`);
      if(m.campaign&&e.generation===m.objectiveGeneration){m.say('목표 몬스터 돌파 · 작전 실패');m.finish(false);return;}
    }
  }
  for (const u of m.units) {
    if (u.slot < 0) continue;
    u.stunned = Math.max(0, u.stunned - dt);
    if (u.hp <= 0) {
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
    if(combatRoles[u.heroId].kind==='support'){
      if(u.cooldown<=0&&supportBasic(m,u))u.cooldown+=1/m.stats(u).speed;
      continue;
    }
    let target: Enemy | undefined;
    let targetScore = -Infinity;
    for (const e of m.enemies) {
      if (!e.active || distance(e, u) > s.range) continue;
      // Noel hunts bosses first; Arin slightly prefers armored targets.
      // Everyone else keeps classic TD first-to-core priority.
      const score =
        e.progress + (u.branch==="focus"&&e.hp/e.maxHp<.3?m.map.pathLength:0) +
        (m.campaign&&e.generation===m.objectiveGeneration?m.map.pathLength*4:0) +
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
