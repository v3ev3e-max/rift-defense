import {test,expect} from '@playwright/test';

test('direct-open enemies walk on the path with contact frames and hit recoil',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///D:/3V_TD/local-test/index.html');
 await expect(page.locator('[data-action="stage"]').first()).toBeVisible();
 await page.screenshot({path:`artifacts/enemy-motion-direct-${info.project.name}.png`});
 await page.goto('/');
 await page.waitForFunction(()=>!!(window as any).rift?.save);
 await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;a.save.persist();});
 await page.locator('[data-action="stage"]').first().click();
 await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();
 await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const result=await page.evaluate(()=>{
  const a=(window as any).rift,m=a.model,s=a.game.scene.getScene('Battle');a.game.loop.stop();s.callback=()=>{};m.paused=true;
  m.enemies.forEach((e:any)=>e.active=false);m.spawn('crawler');const e=m.enemies.find((v:any)=>v.active);
  e.progress=200;m.map.pathPoint(e.progress,e);e.hp=e.maxHp=100;
  const frames:string[]=[];let grounded=true;
  for(let i=0;i<180;i++){s.visualTime=i/60;s.update(0,0);const body=s.enemySprites[e.index],shadow=s.enemyShadowSprites[e.index],step=s.enemyStepSprites[e.index];frames.push(step.texture.key);grounded&&=body.visible&&shadow.visible&&step.visible&&Math.abs(shadow.x-e.x)<.01&&shadow.y>e.y;}
  s.enemyVisualHp[e.index]=100;e.hp=75;s.update(0,0);const hitTint=s.enemySprites[e.index].tintTopLeft;
  a.game.loop.wake();
  return {frames:[...new Set(frames)],grounded,hitTint,bodyY:s.enemySprites[e.index].y,pathY:e.y};
 });
 expect(result.frames.sort()).toEqual(['enemy-step-1','enemy-step-2','enemy-step-3','enemy-step-4']);
 expect(result.grounded).toBe(true);expect(result.hitTint).not.toBe(0xffffff);
 expect(Math.abs(result.bodyY-result.pathY)).toBeLessThan(4);
 expect(errors).toEqual([]);
 await page.waitForTimeout(120);
 await page.screenshot({path:`artifacts/enemy-motion-combat-${info.project.name}.png`});
});
