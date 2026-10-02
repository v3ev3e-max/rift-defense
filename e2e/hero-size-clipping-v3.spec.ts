import {test,expect} from '@playwright/test';

const squad=['astra','eir','elise','yuria','raon'];
test('mixed roster keeps one SD scale through idle attack and skill',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.evaluate(ids=>{const a=(window as any).rift;a.save.data.deck=ids;a.save.data.campaign.squad=ids;a.save.data.tutorial=true;a.save.persist();a.begin('1-1',true);},squad);
 await page.waitForFunction(()=>{
  const s=(window as any).rift.game?.scene.getScene('Battle');
  return !!s?.ink&&s.activeHeroIds?.size>=5;
 },undefined,{timeout:60_000});
 const result=await page.evaluate(ids=>{
  const a=(window as any).rift,m=a.model,s=a.game.scene.getScene('Battle');a.game.loop.stop();m.paused=true;m.started=true;
  m.units=[];ids.forEach((id:string)=>m.addUnit(id));
  const snapshot=(pose:'idle'|'attack'|'skill')=>{
   for(const u of m.units){u.skillCastAt=pose==='skill'?m.time:-999;if(pose==='attack')u.shots++;}
   if(pose==='attack')s.visualTime+=.01;s.update(0,0);
   return s.heroSprites.slice(0,ids.length).map((sp:any)=>({key:sp.texture.key,w:sp.displayWidth,h:sp.displayHeight,b:sp.getBounds()}));
  };
  return {idle:snapshot('idle'),attack:snapshot('attack'),skill:snapshot('skill')};
 },squad);
 for(const state of ['idle','attack','skill'] as const){
  expect(result[state].map(x=>x.w)).toEqual(Array(5).fill(140));
  expect(result[state].map(x=>x.h)).toEqual(Array(5).fill(140));
  expect(result[state].every(x=>x.key.includes('authored-attack'))).toBe(true);
 }
 await page.screenshot({path:`artifacts/hero-size-clipping/${info.project.name}.png`});
 expect(errors).toEqual([]);
});
