import {describe,it,expect} from 'vitest';
import {enemies} from '../src/data/enemies';
import {campaignStages,campaignEnemyIds,campaignRegion} from '../src/data/campaign';
import {enemyVisualContext} from '../src/game/RegionalEnemyArt';
import {monsterActionOwner,monsterActionPath,monsterActionOwners} from '../src/game/MonsterActionAssets';
import {raidSummonOwners,raidSummonPath} from '../src/ui/RaidSummonAnimations';
import {classicEnemyIds,getWave} from '../src/data/waves';
// @ts-expect-error Node asset verification runtime
import {existsSync,readFileSync} from 'node:fs';
// @ts-expect-error Node asset verification runtime
import {createHash} from 'node:crypto';
describe('complete monster animation coverage',()=>{
 it('preloads the complete endless roster without 80 unused campaign definitions',()=>{
  expect(classicEnemyIds.size).toBe(13);
  for(const n of [1,3,6,10,11,16,21,25,31,40,41,51,60,100,1000,9999]){
   const wave=getWave(n);for(const id of [...wave.enemies,...(wave.boss?[wave.boss]:[])])expect(classicEnemyIds.has(id),`${n}:${id}`).toBe(true);
  }
 });
 it('browser matrix plus endless roster covers all enemy definitions',()=>{
  const covered=new Set(classicEnemyIds);
  for(const stage of campaignStages.filter(s=>[1,5,10].includes(Number(s.id.split('-')[1]))))for(const id of campaignEnemyIds(stage))covered.add(id);
  expect([...covered].sort()).toEqual(Object.keys(enemies).sort());
 });
 it('registers attack/hit/death for every classic enemy definition',()=>{
  for(const def of Object.values(enemies))expect(monsterActionOwner(def.id,def.visualId),def.id).toBeTruthy();
 });
 it('covers every real stage spawn without borrowing the wrong regional design',()=>{
  const seen=new Set<string>();
  for(const stage of campaignStages)for(const id of campaignEnemyIds(stage)){
   const def=enemies[id],context=enemyVisualContext(def,campaignRegion(stage),true);
   const owner=monsterActionOwner(id,def.visualId,context.artArea,context.regional&&context.visualId!=='elite');
   expect(owner,`${stage.id} ${id}`).toBeTruthy();
   if(!owner||seen.has(owner))continue;seen.add(owner);
   for(const state of ['attack','hit','death'] as const)for(let frame=1;frame<=3;frame++)expect(existsSync('public'+monsterActionPath(owner,state,frame))).toBe(true);
  }
 });
 it('ships distinct encoded frames across all authored owners',()=>{
  const hashes=new Set<string>();
  for(const owner of monsterActionOwners)for(const state of ['attack','hit','death'] as const)for(let frame=1;frame<=3;frame++){
   const path='public'+monsterActionPath(owner,state,frame),hash=createHash('sha256').update(readFileSync(path)).digest('hex');
   expect(hashes.has(hash),path).toBe(false);hashes.add(hash);
  }
 });
 it('ships all five summon motion states',()=>{
  expect(raidSummonOwners.size).toBe(5);
  for(const id of raidSummonOwners)for(const state of ['move','attack','hit','death'] as const)expect(existsSync('public'+raidSummonPath(id,state))).toBe(true);
 });
});
