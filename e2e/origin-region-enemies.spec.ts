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
 expect(errors).toEqual([]);
});
