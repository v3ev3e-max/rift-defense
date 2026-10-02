import {test,expect} from '@playwright/test';
import {profiles,saveFor} from '../scripts/campaign-clearability';

for(const scenario of [{stage:'3-10',profile:'starter-default',win:false},{stage:'16-10',profile:'sr1-growth',win:true}]){
 test(`${scenario.stage} real deployment and equipment ${scenario.profile}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const save=saveFor(profiles.find(p=>p.id===scenario.profile)!,Number(scenario.stage.split('-')[0]));
  // Unlock navigation only; no extra growth, equipment or combat resources.
  for(let region=1;region<=16;region++)for(let stage=1;stage<=10;stage++)save.campaign!.records[`${region}-${stage}`]={stars:1,time:1,kills:1};
  await page.evaluate(({save,stage})=>{const app=(window as any).rift;app.save.data=save;app.begin(stage,true);},{save,stage:scenario.stage});
  await page.waitForFunction(()=>document.querySelector('#battle-loader')?.classList.contains('complete'),null,{timeout:90_000});
  await page.locator('[data-action="campaign-auto-deploy"]').click();
  await page.locator('[data-action="campaign-start"]').click();
  const result=await page.evaluate(()=>{
   const app=(window as any).rift,m=app.model;app.game.loop.stop();let seed=17;
   m.rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   // Same 60Hz combat loop as live play; skip elapsed wall time only.
   m.emit=()=>{};
   while(!m.ended&&m.time<900)m.step(1/60);
   return {won:!!m.result?.won,ended:m.ended,wave:m.wave.number,core:m.core,heroes:m.units.map((u:any)=>u.heroId),equipped:m.units.map((u:any)=>m.save.heroes[u.heroId].equipment.length)};
  });
  expect(result.ended).toBe(true);expect(result.won).toBe(scenario.win);expect(result.heroes).toEqual(save.campaign!.squad);
  expect(result.equipped).toEqual(save.campaign!.squad.map(id=>save.heroes[id].equipment.length));
  expect(errors).toEqual([]);
 });
}
