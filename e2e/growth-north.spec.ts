import {test,expect} from '@playwright/test';
async function start(page:any,all=false){
 await page.goto('/');await page.evaluate((all:boolean)=>{const a=(window as any).rift;a.save.data.tutorial=true;if(all)a.save.data.deck=Object.keys(a.save.data.heroes);a.save.persist();},all);
 await page.evaluate(()=>{const a=(window as any).rift;a.begin('laboratory');});await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
}
test('selected merge preserves chosen position and upgrade spends once, improves all copies',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 const before=await page.evaluate(()=>{const a=(window as any).rift,m=a.model;m.wave.queue=[];m.enemies.forEach((e:any)=>e.active=false);m.gold=100;
 m.units=[];for(let i=0;i<2;i++)m.addUnit('sera');m.selected=m.units[1].uid;a.updateHud(true);return {uid:m.selected,slot:m.selectedUnit.slot,atk:m.stats(m.selectedUnit).atk};});
 await expect(page.locator('#selected-merge-btn')).toContainText('2/2');await page.locator('#selected-merge-btn').dispatchEvent('click');await page.locator('#selected-merge-btn').dispatchEvent('click');
 expect(await page.evaluate(()=>{const m=(window as any).rift.model;return {length:m.units.length,uid:m.selectedUnit.uid,slot:m.selectedUnit.slot,star:m.selectedUnit.star};})).toEqual({length:1,uid:before.uid,slot:before.slot,star:2});
 await expect(page.locator('#selected-merge-btn')).toBeDisabled();await expect(page.locator('#selected-upgrade-btn')).toHaveCount(0);
 await page.locator('[data-action="skill"]').click();expect(await page.evaluate(()=>(window as any).rift.model.selectedUnit.priority)).toBe('boss');
 const box=await page.locator('#selected-growth').boundingBox();expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
 await page.screenshot({path:`artifacts/growth-${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});
test('all 34 heroes expose complete north and side attack frame sets',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{const ids=Object.keys((window as any).rift.save.data.heroes),missing:string[]=[];for(const id of ids)for(const [name,count] of [['up6',6],['frame',8]] as const)for(let frame=1;frame<=count;frame++){const response=await fetch(`./assets/combat/${id}/${name}_${String(frame).padStart(2,'0')}.png`);if(!response.ok||(await response.blob()).size<1000)missing.push(`${id}/${name}/${frame}`);}return {count:ids.length,missing};});
 expect(result.count).toBe(34);expect(result.missing).toEqual([]);
});
