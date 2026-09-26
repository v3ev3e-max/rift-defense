import {test,expect} from '@playwright/test';

test('enemy bodies leave the entry rift cleanly and every loaded kind has a valid movement texture',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;a.save.persist();a.begin('1-1');});
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const result=await page.evaluate(()=>{
  const a=(window as any).rift,m=a.model,s=a.game.scene.getScene('Battle');a.game.loop.stop();m.update=()=>{};
  const missing:string[]=[];
  for(const [id,count] of Object.entries(s.enemyMoveFrames) as [string,number][])for(let f=1;f<=count;f++)if(!s.textures.exists(`enemy-${id}-move-${f}`))missing.push(`${id}-${f}`);
  m.enemies.forEach((e:any)=>e.active=false);const ids=['crawler','runner','armored','jammer','named_meadow','verdant_stalker','gale_colossus'];
  ids.forEach((id,i)=>{m.spawn(id);const e=m.enemies.findLast((v:any)=>v.active&&!v.__placed);e.__placed=true;e.progress=70+i*64;m.map.pathPoint(e.progress,e);e.speed=0;e.hp=e.maxHp=99999;});
  s.update(0,0);
  const visible=s.enemySprites.filter((sp:any)=>sp.visible).map((sp:any)=>({key:sp.texture.key,x:sp.x,y:sp.y,w:sp.displayWidth,h:sp.displayHeight}));
  return {missing,visible,entryX:m.map.path[0].x};
 });
 expect(errors).toEqual([]);expect(result.missing).toEqual([]);expect(result.visible).toHaveLength(7);
 expect(result.visible.every((v:any)=>v.key.length>0&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x<800&&v.w>0&&v.h>0)).toBe(true);
 await page.screenshot({path:'artifacts/enemy-entry-fixed.png'});
});
