import type {BattleModel} from './BattleModel';
import type {Unit} from '../entities/HeroUnit';
import {combatRoles} from '../data/combatRoles';
import {enemies} from '../data/enemies';
import {castAutoSkill} from './ActionCombat';
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
/** Skill energy cannot accumulate during the post-cast cooldown. */
export function charge(u:Unit,value:number,now=Infinity){
 if(now<(u.skillReadyAt??0))return;
 u.skillCharge=Math.min(100,(u.skillCharge??0)+value*(1+(u.branch==="tempo"?.25:0)+(u.ultimate==="tempo"?.4:0)));
}
export function stepAutoSkills(m:BattleModel,dt:number){
 if(m.paused||m.ended)return;
 for(const u of m.units){if(u.hp<=0||u.slot<0)continue;
  const kind=combatRoles[u.heroId].kind;
  const targets=m.enemies.filter(e=>e.active&&distance(e,u)<=m.stats(u).range);
  if(kind==='support')charge(u,dt*3,m.time);else if(targets.length)charge(u,dt*(kind==='melee'?7:kind==='drone'?4:2),m.time);
  if((u.skillCharge??0)<100){u.skillHeldAt=undefined;continue;}
  u.skillHeldAt??=m.time;
  if(!m.autoSkills||u.priority==='hold'||m.time<(u.skillReadyAt??0)||(kind!=='support'&&!targets.length))continue;
  if(kind==='support'){
   const allies=m.units.filter(v=>v!==u&&v.slot>=0&&v.hp>0&&distance(v,u)<=m.stats(u).range),needsHelp=allies.some(v=>v.hp<v.maxHp*.88||v.stunned>0||v.cooldown>.3);
   if(needsHelp||m.time-u.skillHeldAt>=3)castAutoSkill(m,u);
   continue;
  }
  const preference=u.priority??'auto';
  const crowd=(e:typeof targets[number])=>targets.filter(v=>distance(e,v)<100).length;
  const score=(e:typeof targets[number])=>{
   if(preference==='boss')return Number(!!enemies[e.kind].boss)*1e7+e.hp;
   if(preference==='core')return e.progress;
   if(preference==='fast')return e.speed*100+e.progress;
   if(preference==='cluster')return crowd(e)*1e5+e.progress;
   if(kind==='sniper'){
    if(u.heroId==='arin'){const dx=e.x-u.x,dy=e.y-u.y,len=distance(e,u)||1;return targets.filter(v=>((v.x-u.x)*dx+(v.y-u.y)*dy)>0&&Math.abs((v.x-u.x)*dy-(v.y-u.y)*dx)/len<18).length*1e6+e.progress;}
    return Number(!!enemies[e.kind].boss)*1e7+e.hp;
   }
   if(kind==='drone')return e.speed*100+e.progress;
   return crowd(e)*1e5+e.progress;
  };
  const target=targets.sort((a,b)=>score(b)-score(a))[0];
  const urgent=target.progress>m.map.pathLength*.75||!!enemies[target.kind].boss||!!enemies[target.kind].namedRegion;
  const support=u.heroId==='mia';
  const good=support?m.units.some(v=>v!==u&&distance(v,u)<m.stats(u).range&&(v.hp<v.maxHp*.8||v.stunned>0||v.cooldown>.3)):kind==='sniper'||kind==='drone'||crowd(target)>=3;
  if(good||urgent||m.time-u.skillHeldAt>=3)castAutoSkill(m,u,target);
 }
}

/** Manual and AUTO casts share the same balance, targeting constraints and FX path. */
export function castManualSkill(m:BattleModel,u:Unit){
 if(!m.started||m.paused||m.ended||u.hp<=0||u.slot<0||(u.skillCharge??0)<100||m.time<(u.skillReadyAt??0))return false;
 const targets=m.enemies.filter(e=>e.active&&distance(e,u)<=m.stats(u).range);
 if(combatRoles[u.heroId].kind==='support')return castAutoSkill(m,u);
 if(!targets.length)return false;
 const target=targets.sort((a,b)=>Number(!!enemies[b.kind].boss)-Number(!!enemies[a.kind].boss)||b.progress-a.progress)[0];
 return castAutoSkill(m,u,target);
}
