import {describe,it,expect} from 'vitest';
import {monsterActionFrame,originMonsterActions} from '../src/game/MonsterAnimations';
import {createEnemy} from '../src/entities/Enemy';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {stepCombat} from '../src/systems/CombatSystem';
import {campaignStages} from '../src/data/campaign';
// @ts-expect-error Node asset verification runtime
import {readFileSync} from 'node:fs';
// @ts-expect-error Node asset verification runtime
import {createHash} from 'node:crypto';

describe('event-driven monster actions',()=>{
 it('plays each event once and never cycles expired or future timestamps',()=>{
  expect([10,10.23,10.45,10.67,11,20].map(t=>monsterActionFrame(t,10,.66,3))).toEqual([1,2,3,0,0,0]);
  expect(monsterActionFrame(9,10,.66,3)).toBe(0);
  expect(monsterActionFrame(10,undefined,.66,3)).toBe(0);
 });
 it('clears action timestamps when reusing an enemy pool entry',()=>{
  const enemy=createEnemy(0);enemy.rangedFiredAt=5;enemy.meleeAttackedAt=6;enemy.abilityCastAt=7;
  Object.assign(enemy,createEnemy(0));
  expect([enemy.rangedFiredAt,enemy.meleeAttackedAt,enemy.abilityCastAt]).toEqual([undefined,undefined,undefined]);
 });
 it('triggers the support pose when a healing ability actually fires',()=>{
  const model=new BattleModel(defaultSave(),()=>.5);model.spawn('coral_singer');model.spawn('crystal_bastion');
  const singer=model.enemies[0],ally=model.enemies[1];ally.hp=ally.maxHp*.5;singer.namedSkillTimer=4.4;model.time=10;
  stepCombat(model,.01);
  expect(ally.hp).toBeGreaterThan(ally.maxHp*.5);expect(singer.abilityCastAt).toBe(10);
  expect(monsterActionFrame(model.time,singer.abilityCastAt,.66,3)).toBe(1);
 });
 it('ships 64 distinct authored poses separate from movement frames',()=>{
  const hashes=new Set<string>();
  for(const [id,area] of Object.entries(originMonsterActions)){
   const root=`public/assets/generated/campaign-enemies/map-${area}/${id}`;
   const movement=new Set(Array.from({length:6},(_,i)=>createHash('sha256').update(readFileSync(`${root}/move/move_${String(i+1).padStart(2,'0')}.webp`)).digest('hex')));
   for(const path of ['attack/frame_01.webp','attack/frame_02.webp','attack/frame_03.webp','hit/frame_01.webp']){
    const hash=createHash('sha256').update(readFileSync(`${root}/${path}`)).digest('hex');
    expect(movement.has(hash),`${id}: ${path}`).toBe(false);expect(hashes.has(hash)).toBe(false);hashes.add(hash);
   }
  }
  expect(hashes.size).toBe(64);
 });
 it('stamps real named and boss pattern events for authored playback',()=>{
  for(const id of ['named_meadow','tempest','ravager']){
   const model=new BattleModel(defaultSave(),()=>.5);
   model.configureCampaign(campaignStages[0],['yuria'],true);model.autoDeployCampaign();
   model.spawn(id);const e=model.enemies.find(v=>v.active&&v.kind===id)!;
   e.hp=e.maxHp=1000000;e.namedSkillTimer=6.5;e.attackTimer=20;model.time=10;
   if(id==='ravager'){e.strikeAt=10;e.strikeX=400;e.strikeY=400;}
   stepCombat(model,.01);
   expect(e.abilityCastAt,id).toBe(10);
   expect(monsterActionFrame(10,e.abilityCastAt,.66,3),id).toBe(1);
  }
 });
});
