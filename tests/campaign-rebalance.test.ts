import {it,expect} from 'vitest';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {campaignStages,campaignWave} from '../src/data/campaign';
import {stepCombat} from '../src/systems/CombatSystem';
import {enemies} from '../src/data/enemies';
import {seeded} from '../src/utils/random';
import {castManualSkill,stepAutoSkills} from '../src/systems/AutoSkills';
import {heroes} from '../src/data/heroes';
import {combatRoles,formationRole} from '../src/data/combatRoles';
it('fails when the final objective escapes instead of awarding a false victory',()=>{
 const m=new BattleModel(defaultSave());m.configureCampaign(campaignStages[0],['yuria']);m.start();m.wave.start(4);m.wave.queue=[];m.spawn('named_meadow');const e=m.enemies.find(e=>e.active)!;e.progress=m.map.pathLength;e.speed=0;m.step(1/60);expect(m.result?.won).toBe(false);expect(m.core).toBeGreaterThan(0);
});
it('opening AUTO uses the tank and beats the same formation with skills disabled',()=>{
 const run=(auto:boolean)=>{const s=defaultSave();for(const h of Object.values(s.heroes)){h.stars=1;h.equipment=[];}const m=new BattleModel(s,seeded(20260913));m.configureCampaign(campaignStages[0],s.campaign!.squad,true);m.autoDeployCampaign();m.autoSkills=auto;m.start();for(let i=0;i<12000&&!m.ended;i++)m.step(1/60);return m;};
 const on=run(true),off=run(false);expect(on.result?.won).toBe(true);expect(on.time).toBeLessThanOrEqual(off.time+.1);expect(on.records.reduce((n,r)=>n+r.autoCasts,0)).toBeGreaterThan(0);expect(on.records.find(r=>r.heroId==='yuria')!.blockTime).toBeGreaterThan(5);expect(on.units.find(u=>u.heroId==='yuria')!.damageTaken).toBeGreaterThan(0);
});
it('manual skills keep charge when no valid target exists or the operator is returning',()=>{
 const m=new BattleModel(defaultSave());m.configureCampaign(campaignStages[0],['arin']);m.start();m.wave.queue=[];const u=m.units[0];u.skillCharge=100;expect(castManualSkill(m,u)).toBe(false);expect(u.skillCharge).toBe(100);u.hp=0;expect(castManualSkill(m,u)).toBe(false);
});
it('keeps campaign health identical when equipment is refreshed',()=>{
 const save=defaultSave();save.heroes.yuria.stars=4;const m=new BattleModel(save);m.configureCampaign(campaignStages[0],['yuria']);const hp=m.units[0].maxHp;m.syncPermanentSave(save);expect(m.units[0].maxHp).toBeCloseTo(hp);
});
it('named skills are not reset by their normal melee attack',()=>{
 const m=new BattleModel(defaultSave(),()=>.99);m.configureCampaign(campaignStages[0],['yuria']);m.start();m.spawn('named_meadow');const e=m.enemies.find(e=>e.active)!;const u=m.units[0];e.progress=350;e.speed=0;e.hp=e.maxHp=1e8;u.x=400;u.y=400;u.cooldown=u.droneCooldown=100;
 for(let i=0;i<420;i++){m.time+=1/60;u.hp=u.maxHp;stepCombat(m,1/60);}expect(e.skillCasts).toBeGreaterThanOrEqual(1);
});
it('uses regional boss health and gives each boss a visible ranged second attack',()=>{
 for(const stage of campaignStages.filter(s=>s.waves>4)){const m=new BattleModel(defaultSave());m.configureCampaign(stage,['yuria']);m.start();m.wave.start(stage.waves);const id=campaignWave(stage,stage.waves).boss!;m.spawn(id);const e=m.enemies.find(e=>e.active)!,region=Number(stage.id.split('-')[0]);expect(e.maxHp).toBeCloseTo(enemies[id].hp*stage.enemyHp*(stage.waves===6?.9:region===1?.36:region===2?.5:region===8?.95:region===7?.75:region>=9?.55:.66));expect(enemies[id].ranged).toBeTruthy();}
});
it('late ordinary operations actually spawn their regional special enemies',()=>{
 for(const stage of campaignStages.filter(s=>s.id.endsWith('-4'))){const pool=new Set([1,2,3,4].flatMap(n=>campaignWave(stage,n).enemies));for(const enemy of stage.enemies)expect(pool.has(enemy),stage.id+' '+enemy).toBe(true);}
});
it('raises area 1 health and attack every operation while introducing tactical enemy roles',()=>{
 const area=campaignStages.slice(0,10);
 for(let i=1;i<area.length;i++){
  expect(area[i].enemyHp/area[i-1].enemyHp).toBeCloseTo(1.05,2);
  expect(area[i].enemyAttack/area[i-1].enemyAttack).toBeCloseTo(1.035,2);
 }
 expect(campaignWave(area[2],1).enemies).toContain('brute');
 expect(campaignWave(area[3],1).enemies).toContain('armored');
});
it('keeps effective enemy health rising at every region boundary',()=>{
 const openings=campaignStages.filter(stage=>stage.id.endsWith('-1'));
 const effective=(stage:typeof campaignStages[number])=>stage.enemies.reduce((sum,id)=>sum+enemies[id].hp,0)/stage.enemies.length*stage.enemyHp;
 for(let i=1;i<openings.length;i++)expect(effective(openings[i]),`${openings[i-1].id} -> ${openings[i].id}`).toBeGreaterThan(effective(openings[i-1]));
});
it.each(heroes)('$id casts through its own combat effect key',hero=>{
 const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],[hero.id],true);m.autoDeployCampaign();m.start();m.wave.queue=[];m.spawn('crawler');
 const u=m.units[0],e=m.enemies.find(v=>v.active)!;e.x=u.x+20;e.y=u.y;e.speed=0;e.hp=e.maxHp=1e8;u.skillCharge=100;
 expect(castManualSkill(m,u),hero.id).toBe(true);
 expect(u.skillCastAt,`${hero.id} manual animation timestamp`).toBe(m.time);
 const defensive=formationRole(hero.id)==='tank'||combatRoles[hero.id].kind==='support';
 expect(m.effects.some(f=>f.visual===(defensive?`support-skill-${hero.id}`:`${hero.id}-skill`)),hero.id).toBe(true);
});
it.each(heroes)('$id AUTO path starts its dedicated skill animation',hero=>{
 const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],[hero.id],true);m.autoDeployCampaign();m.start();m.wave.queue=[];m.spawn('crawler');
 const u=m.units[0],e=m.enemies.find(v=>v.active)!;e.x=u.x+10;e.y=u.y;e.speed=0;e.hp=e.maxHp=1e8;u.skillCharge=100;u.skillHeldAt=m.time-4;m.autoSkills=true;
 stepAutoSkills(m,0);
 expect(u.skillCastAt,`${hero.id} AUTO animation timestamp`).toBe(m.time);
});
it('both forward tanks can actually intercept their separate dual-lane paths',()=>{
 const stage=campaignStages.find(s=>s.id==='8-3')!,m=new BattleModel(defaultSave());m.configureCampaign(stage,['yuria','neris'],true);m.autoDeployCampaign();m.start();m.wave.queue=[];
 for(const kind of ['crawler','crawler'])m.spawn(kind);
 for(const e of m.enemies.filter(e=>e.active)){e.progress=255;(e.route?stage.alternate!:stage.map).pathPoint(e.progress,e);e.hp=e.maxHp=1e7;}
 for(let i=0;i<60;i++)m.step(1/60);
 expect(m.records.every(r=>r.blockTime>.5)).toBe(true);
});
it('assigns each forward tank only to its own route when dual lanes overlap',()=>{
 const stage=campaignStages.find(s=>s.id==='8-3')!,m=new BattleModel(defaultSave());m.configureCampaign(stage,['yuria','neris'],true);m.autoDeployCampaign();m.start();m.wave.queue=[];
 for(const kind of ['crawler','crawler'])m.spawn(kind);
 const active=m.enemies.filter(e=>e.active);active[0].route=0;active[1].route=1;
 for(const e of active){e.x=495;e.y=400;e.speed=0;e.hp=e.maxHp=1e7;}
 stepCombat(m,1/60);
 expect(m.records.find(r=>r.heroId==='yuria')!.blockTime).toBeGreaterThan(0);
 expect(m.records.find(r=>r.heroId==='neris')!.blockTime).toBeGreaterThan(0);
});
it('does not let a charger phase through an active tank block',()=>{
 const stage=campaignStages.find(s=>s.id==='9-1')!,m=new BattleModel(defaultSave());m.configureCampaign(stage,['yuria'],true);m.autoDeployCampaign();m.start();m.wave.queue=[];m.spawn('sky_lancer');
 const u=m.units[0],e=m.enemies.find(e=>e.active)!;e.x=u.x;e.y=u.y;e.speed=0;e.hp=e.maxHp=1e7;e.progress=100;e.namedSkillTimer=enemies.sky_lancer.charge!.interval;
 stepCombat(m,1/60);
 expect(e.progress).toBe(100);
 expect(m.records[0].blockTime).toBeGreaterThan(0);
});
