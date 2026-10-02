import {test,expect} from '@playwright/test';

const rosters:Record<string,string[]>={
 '13-1':['crystal_bastion','tide_skimmer','prism_cannon','coral_singer'],
 '14-1':['lunar_husk','spore_leaper','moon_ray','bloom_keeper'],
 '15-1':['stellar_plate','plasma_hound','nova_turret','forge_conductor'],
 '16-1':['origin_warden','causal_blade','genesis_eye','fate_weaver'],
};
for(const [stage,ids] of Object.entries(rosters))test(`${stage} loads its own complete monster textures`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{const app=(window as any).rift;for(let region=1;region<=16;region++)for(let stage=1;stage<=10;stage++)app.save.data.campaign.records[`${region}-${stage}`]={stars:3,time:1,kills:1};});
 await page.evaluate(stage=>(window as any).rift.begin(stage,true),stage);
 await page.waitForFunction(()=>{const app=(window as any).rift,scene=app.game?.scene.getScene('Battle');return scene?.textures?.exists('enemy-step-4')&&document.querySelector('#battle-loader')?.classList.contains('complete');},null,{timeout:60_000});
 const state=await page.evaluate(ids=>{const scene=(window as any).rift.game.scene.getScene('Battle');return ids.map(id=>({id,base:scene.textures.exists(`enemy-${id}`),move:[1,2,3,4,5,6].every(n=>scene.textures.exists(`enemy-${id}-move-${n}`)),fire:!['prism_cannon','moon_ray','nova_turret','genesis_eye'].includes(id)||[1,2,3].every(n=>scene.textures.exists(`enemy-${id}-fire-${n}`))}));},ids);
 expect(state).toEqual(ids.map(id=>({id,base:true,move:true,fire:true})));
 // Force edge positions and actual render states, not only file existence.
 const clipped=await page.evaluate(ids=>{
  const app=(window as any).rift,scene=app.game.scene.getScene('Battle'),m=app.model;
  app.game.loop.stop();m.paused=true;
  const bad:string[]=[];
  for(const id of ids){
   m.spawn(id);const enemy=m.enemies.find((e:any)=>e.active&&e.kind===id);
   for(const [x,y] of [[1,1],[799,1],[1,799],[799,799]]){
    enemy.x=x;enemy.y=y;enemy.rangedFiredAt=m.time;
    scene.update(0,0);
    const rect=scene.enemySprites[enemy.index].getBounds();
    if(rect.left<0||rect.top<0||rect.right>800||rect.bottom>800)bad.push(id+' '+x+','+y);
   }
   enemy.active=false;
  }
  return bad;
 },ids);
 expect(clipped).toEqual([]);
 const actions=await page.evaluate(ids=>{
  const app=(window as any).rift,scene=app.game.scene.getScene('Battle'),m=app.model,results:any[]=[];
  for(const id of ids){
   m.spawn(id);const e=m.enemies.find((enemy:any)=>enemy.active&&enemy.kind===id);
   e.x=400;e.y=400;e.meleeAttackedAt=undefined;e.rangedFiredAt=undefined;e.abilityCastAt=undefined;
   const ranged=['prism_cannon','moon_ray','nova_turret','genesis_eye'].includes(id);
   const support=['coral_singer','bloom_keeper','forge_conductor','fate_weaver'].includes(id);
   e[ranged?'rangedFiredAt':support?'abilityCastAt':'meleeAttackedAt']=10;
   const keys:string[]=[];
   for(const time of [10,10.23,10.45,10.67,12]){
    m.time=time;scene.enemyHitUntil[e.index]=0;scene.update(0,0);keys.push(scene.enemySprites[e.index].texture.key);
   }
   e.hp-=1;scene.visualTime+=1;scene.update(0,0);const hurt=scene.enemySprites[e.index].texture.key;
   scene.visualTime+=.31;scene.update(0,0);const recovered=scene.enemySprites[e.index].texture.key;
   results.push({id,keys,hurt,recovered,owned:!!scene.enemyActionOwners[id]});e.active=false;
  }
  return results;
 },ids);
 expect(actions).toEqual(ids.map((id,i)=>({id,owned:actions[i].owned,keys:[1,2,3].map(n=>`enemy-${id}-${['coral_singer','bloom_keeper','forge_conductor','fate_weaver'].includes(id)?'support':`${actions[i].owned?'owned-':''}attack`}-${n}`).concat([`enemy-${id}-move-1`,`enemy-${id}-move-1`]),hurt:`enemy-${id}-${actions[i].owned?'owned-hit-1':'hit'}`,recovered:`enemy-${id}-move-1`})));
 expect(errors).toEqual([]);
});
