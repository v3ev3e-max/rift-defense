import {test,expect} from '@playwright/test';

test('classic operations load only their wave roster and play owned frames',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const {battleMaps}=await import('/src/data/map.ts');
  await (window as any).rift.begin(battleMaps[0].id);
 });
 // Classic battles do not render the campaign preparation loader.
 await page.waitForFunction(()=>{
  const scene=(window as any).rift.game?.scene.getScene('Battle');
  return scene?.enemySprites?.length&&scene.textureReady('enemy-abyssal-owned-death-3');
 },null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const {classicEnemyIds}=await import('/src/data/waves.ts');
  const app=(window as any).rift,m=app.model,scene=app.game.scene.getScene('Battle');app.game.loop.stop();m.paused=true;
  const bad:string[]=[];
  for(const id of classicEnemyIds){
   if(!scene.enemyActionOwners[id])bad.push(`${id}:owner`);
   for(const state of ['attack','hit','death'])for(let frame=1;frame<=3;frame++)if(!scene.textureReady(`enemy-${id}-owned-${state}-${frame}`))bad.push(`${id}:${state}:${frame}`);
   m.spawn(id);const e=m.enemies.find((v:any)=>v.active&&v.kind===id);
   if(!e){bad.push(`${id}:spawn`);continue;}
   e.x=400;e.y=400;e.abilityCastAt=undefined;e.rangedFiredAt=undefined;e.meleeAttackedAt=100;
   for(const [i,time] of [100,100.23,100.45].entries()){
    m.time=time;scene.enemyHitUntil[e.index]=0;scene.update(0,0);
    if(scene.enemySprites[e.index].texture.key!==`enemy-${id}-owned-attack-${i+1}`)bad.push(`${id}:attack-playback`);
   }
   e.meleeAttackedAt=undefined;m.time=201;scene.update(0,0);e.hp-=1;scene.visualTime=200;scene.update(0,0);
   for(const [i,time] of [200,200.11,200.21].entries()){
    scene.visualTime=time;scene.update(0,0);
    if(scene.enemySprites[e.index].texture.key!==`enemy-${id}-owned-hit-${i+1}`)bad.push(`${id}:hit-playback`);
   }
   e.active=false;
   for(const [x,y] of [[1,1],[799,1],[1,799],[799,799]]){
    m.emit('blast',x,y,x,y,0xffffff,{visual:`enemy-death-${id}`,duration:.48});
    const effect=m.effects.find((v:any)=>v.life>0&&v.visual===`enemy-death-${id}`);
    if(!effect){bad.push(`${id}:death-event`);continue;}
    for(const progress of [.01,.4,.8]){
     effect.life=(1-progress)*.48;scene.update(0,0);
     const sprite=scene.fxSprites.find((sp:any)=>sp.visible&&sp.texture.key===`enemy-${id}-owned-death-${1+Math.floor(progress*3)}`);
     if(!sprite){bad.push(`${id}:death-playback`);continue;}
     const b=sprite.getBounds();if(b.left<0||b.top<0||b.right>800||b.bottom>800)bad.push(`${id}:death-edge`);
    }
    effect.life=0;
   }
  }
  return {bad,count:classicEnemyIds.size,loaded:Object.keys(scene.enemyActionOwners).length};
 });
 expect(result.count).toBe(13);expect(result.loaded).toBe(result.count);expect(result.bad).toEqual([]);expect(errors).toEqual([]);
});
