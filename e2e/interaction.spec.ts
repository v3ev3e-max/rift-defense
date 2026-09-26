import {test,expect} from '@playwright/test';
test('click opens controls, drag merges, damage pool and front idle work',async({page},info)=>{
 await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;a.save.data.deck=Object.keys(a.save.data.heroes);a.save.persist();a.begin('laboratory');});await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const units=await page.evaluate(()=>{const a=(window as any).rift,m=a.model;m.units=[];for(let i=0;i<2;i++)m.addUnit('sera');m.selected=0;a.updateHud(true);return m.units.map((u:any)=>({uid:u.uid,x:u.x,y:u.y,slot:u.slot}));});
 await page.locator('canvas').scrollIntoViewIfNeeded();let box=(await page.locator('canvas').boundingBox())!;
 const pos=(u:any)=>({x:box.x+u.x/800*box.width,y:box.y+(u.y-30)/800*box.height});let a=pos(units[0]),b=pos(units[1]);
 await page.evaluate((uid)=>{const app=(window as any).rift;app.model.selected=uid;app.updateHud(true);},units[0].uid);await expect(page.locator('#selected-merge-btn')).toBeVisible();await expect(page.locator('#selected-merge-btn')).toBeEnabled();
 await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:15});await page.mouse.up();
 expect(await page.evaluate(()=>{const m=(window as any).rift.model;return {count:m.units.length,uid:m.units[0].uid,star:m.units[0].star};})).toEqual({count:1,uid:units[1].uid,star:2});
 const beforeSell=await page.evaluate(()=>{const a=(window as any).rift,m=a.model;a.game.loop.stop();m.units[0].investment=100;m.selected=m.units[0].uid;a.updateHud(true);return {gold:m.gold,count:m.units.length};});
 await expect(page.locator('#selected-sell-btn')).toHaveText('판매 +35G');await page.locator('#selected-sell-btn').click();
 expect(await page.evaluate(()=>{const m=(window as any).rift.model;return {gold:m.gold,count:m.units.length,selected:m.selected};})).toEqual({gold:beforeSell.gold+35,count:0,selected:0});
 const result=await page.evaluate(async()=>{const a=(window as any).rift,m=a.model,s=a.game.scene.getScene('Battle');a.game.loop.stop();s.callback=()=>{};const {attack}=await import('/src/systems/CombatSystem.ts');const missing:string[]=[];
 for(const id of m.save.deck)for(let frame=1;frame<=3;frame++){const response=await fetch(`/assets/heroes/${id}/frame_${String(frame).padStart(2,'0')}.png`);if(!response.ok||(await response.blob()).size<1000)missing.push(`${id}-${frame}`);}
 m.units=[];const u=m.addUnit('sera');m.enemies.forEach((e:any)=>e.active=false);m.spawn('brute');const e=m.enemies.find((e:any)=>e.active);e.hp=e.maxHp=1e9;e.x=u.x;e.y=u.y-100;s.update(0,0);attack(m,u,e);s.update(0,0);s.visualTime+=1.01;s.update(0,0);const idleTexture=s.heroSprites[0].texture.key,idleFlipped=s.heroSprites[0].flipX;
 m.damageNumbers.forEach((n:any)=>n.life=0);for(let i=0;i<30;i++)m.damage(e,37);s.update(0,0);return {missing,idleTexture,idleFlipped,labels:s.damageLabels.length,visible:s.damageLabels.filter((l:any)=>l.visible).length,text:s.damageLabels.filter((l:any)=>l.visible).map((l:any)=>l.text)};});
 expect(result.missing).toEqual([]);expect(result.idleTexture).toMatch(/^hero-sera-idle-/);expect(result.idleFlipped).toBe(false);expect(result.labels).toBe(16);expect(result.visible).toBeLessThanOrEqual(16);expect(result.text).toContain('37');expect(result.text).not.toContain('0');
 await page.screenshot({path:`artifacts/interaction-${info.project.name}.png`});
});
