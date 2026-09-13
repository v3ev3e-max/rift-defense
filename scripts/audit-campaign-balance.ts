import {writeFileSync} from 'node:fs';
import {heroes} from '../src/data/heroes';
import {enemies} from '../src/data/enemies';
import {campaignStages,campaignWave} from '../src/data/campaign';
import {combatRoles,formationRole} from '../src/data/combatRoles';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {stepCombat} from '../src/systems/CombatSystem';
import {stepActions} from '../src/systems/ActionCombat';

const heroRows=heroes.map(h=>{
 const save=defaultSave();for(const p of Object.values(save.heroes))p.equipment=[];
 const m=new BattleModel(save,()=>.99);m.configureCampaign(campaignStages[0],[h.id]);
 const u=m.units[0];u.star=1;u.x=400;u.y=400;u.slot=0;u.cooldown=0;
 m.wave.number=1;m.wave.queue=[];m.wave.elapsed=-999;m.spawn('crawler');
 const e=m.enemies.find(v=>v.active)!;e.x=450;e.y=400;e.speed=0;e.progress=300;e.hp=e.maxHp=1e9;e.armor=0;
 const dt=1/60;for(let i=0;i<60*30;i++){e.progress=300;m.time+=dt;stepCombat(m,dt);stepActions(m,dt);}
 const r=m.records[0];
 return {id:h.id,name:h.name,grade:h.grade,position:formationRole(h.id),attack:combatRoles[h.id].name,atk:+m.stats(u).atk.toFixed(2),speed:+m.stats(u).speed.toFixed(2),hp:+u.maxHp.toFixed(1),range:+m.stats(u).range.toFixed(0),dps:+(r.damage/30).toFixed(2),basic:+(r.parts.basic/30).toFixed(2),skill:+(r.parts.skill/30).toFixed(2),other:+((r.damage-r.parts.basic-r.parts.skill)/30).toFixed(2),casts:r.autoCasts};
});
const stages=campaignStages.map(s=>{const objective=campaignWave(s,s.waves).objective!,def=enemies[objective],region=Number(s.id.split('-')[0]);const waveScale=(n:number)=>1+(n-1)*.095+Math.pow(Math.max(0,n-12),1.55)*.018;return {stage:s.id,waves:s.waves,hpScale:s.enemyHp,attackScale:s.enemyAttack,speedScale:s.enemySpeed,first:s.enemies.slice(0,2).map(id=>({id,hp:+(enemies[id].hp*s.enemyHp).toFixed(0)})),objective,objectiveSkill:def.namedSkill??def.boss,objectiveHp:def.boss?2200+region*200:+(def.hp*waveScale(s.waves)*s.enemyHp).toFixed(0)};});
const simulations=campaignStages.map(stage=>{const save=defaultSave();for(const p of Object.values(save.heroes))p.equipment=[];const m=new BattleModel(save,()=>.5);m.configureCampaign(stage,save.campaign!.squad);m.start();for(let i=0;i<60*900&&!m.ended;i++)m.step(1/60);return {stage:stage.id,squad:save.campaign!.squad.length,won:!!m.result?.won,core:Math.ceil(m.core),time:+m.time.toFixed(1),wave:m.wave.number,kills:m.kills,livingUnits:m.units.filter(u=>u.hp>0).length,breached:m.enemies.filter(e=>e.active).map(e=>e.kind)};});
const report={generatedAt:new Date().toISOString(),formationSize:5,heroes:heroRows.sort((a,b)=>b.dps-a.dps),stages,simulations,enemies:Object.values(enemies).map(e=>({id:e.id,hp:e.hp,armor:e.armor,speed:e.speed,ranged:e.ranged,boss:e.boss,namedSkill:e.namedSkill,coreDamage:e.coreDamage}))};
writeFileSync('artifacts/campaign-balance-audit.json',JSON.stringify(report,null,2));
console.table(report.heroes);
console.table(stages.filter(s=>s.stage.endsWith('-1')||s.stage.endsWith('-4')));
console.table(simulations);
