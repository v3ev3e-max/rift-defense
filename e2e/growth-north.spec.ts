import {test,expect} from '@playwright/test';
async function start(page:any,all=false){
 await page.goto('/');await page.evaluate((all:boolean)=>{const a=(window as any).rift;a.save.data.tutorial=true;if(all)a.save.data.deck=Object.keys(a.save.data.heroes);a.save.persist();},all);
 await page.locator('[data-action="stage"]').first().click();await page.locator('[data-action="start-battle"]').first().click();await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
}
test('selected merge preserves chosen position and upgrade spends once, improves all copies',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 const before=await page.evaluate(()=>{const a=(window as any).rift,m=a.model;m.wave.queue=[];m.enemies.forEach((e:any)=>e.active=false);m.gold=100;
 m.units=[];for(let i=0;i<2;i++)m.addUnit('sera');m.selected=m.units[1].uid;a.updateHud(true);return {uid:m.selected,slot:m.selectedUnit.slot,atk:m.stats(m.selectedUnit).atk};});
 await expect(page.locator('#selected-merge-btn')).toContainText('2/2');await page.locator('#selected-merge-btn').click();await page.locator('#selected-merge-btn').click();
 expect(await page.evaluate(()=>{const m=(window as any).rift.model;return {length:m.units.length,uid:m.selectedUnit.uid,slot:m.selectedUnit.slot,star:m.selectedUnit.star};})).toEqual({length:1,uid:before.uid,slot:before.slot,star:2});
 await expect(page.locator('#selected-merge-btn')).toBeDisabled();await expect(page.locator('#selected-upgrade-btn')).toHaveCount(0);
 await page.locator('[data-action="skill"]').click();expect(await page.evaluate(()=>(window as any).rift.model.selectedUnit.priority)).toBe('boss');
 const box=await page.locator('#selected-growth').boundingBox();expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
 await page.screenshot({path:`artifacts/growth-${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});
test('all 21 heroes render north attack poses and return to side attack',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page,true);
 const results=await page.evaluate(async()=>{
 const a=(window as any).rift,m=a.model,s=a.game.scene.getScene('Battle');a.game.loop.stop();m.paused=true;const {attack}=await import('/src/systems/CombatSystem.ts');const out=[];
 for(const id of m.save.deck){m.units=[];const u=m.addUnit(id);u.x=290;u.y=400;m.enemies.forEach((e:any)=>e.active=false);m.spawn('brute');const e=m.enemies[0];e.hp=e.maxHp=1e9;e.x=u.x;e.y=u.y-70;s.update(0,0);s.visualTime+=1;attack(m,u,e);s.update(0,0);
 const keys=[s.heroSprites[0].texture.key];for(const dt of [.18,.18]){s.visualTime+=dt;s.update(0,0);keys.push(s.heroSprites[0].texture.key);}
 e.x=u.x+70;e.y=u.y;s.visualTime+=1;attack(m,u,e);s.update(0,0);out.push({id,keys,side:s.heroSprites[0].texture.key,flip:s.heroSprites[0].flipX});}
 a.game.loop.wake();return out;
 });
 expect(results).toHaveLength(21);for(const r of results){expect(r.keys).toEqual([1,2,3].map(n=>`hero-${r.id}-up-${n}`));expect(r.side).toContain(`hero-${r.id}-anim-`);expect(r.flip).toBe(false);}
 expect(errors).toEqual([]);
});
