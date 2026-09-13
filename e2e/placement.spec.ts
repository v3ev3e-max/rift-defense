import {test,expect} from '@playwright/test';
test('exact purchase, field movement and undo without reserve',async({page,isMobile},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;a.save.persist();});
 await page.locator('[data-action="stage"]').first().click();await page.locator('[data-action="start-battle"]').click();await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 await page.evaluate(()=>{const m=(window as any).rift.model;m.started=false;});
 const press=async(x:number,y:number)=>{await page.locator('canvas').scrollIntoViewIfNeeded();const b=(await page.locator('canvas').boundingBox())!;if(isMobile)await page.touchscreen.tap(b.x+x/800*b.width,b.y+y/800*b.height);else await page.mouse.click(b.x+x/800*b.width,b.y+y/800*b.height);};
 await page.locator('[data-action="buy-hero"][data-id="reina"]').click();await press(290,90);expect(await page.evaluate(()=>(window as any).rift.model.units.length)).toBe(0);
 await press(290,180);expect(await page.evaluate(()=>{const m=(window as any).rift.model;return [m.units[0].heroId,m.units[0].slot,m.gold];})).toEqual(['reina',1,55]);
 await press(290,150);await press(400,180);expect(await page.evaluate(()=>(window as any).rift.model.units[0].slot)).toBe(2);
 await page.locator('#undo-placement-btn').click();expect(await page.evaluate(()=>(window as any).rift.model.units[0].slot)).toBe(1);
 expect(await page.locator('.reserve-unit').count()).toBe(0);expect(errors).toEqual([]);
 await page.evaluate(()=>{document.querySelectorAll('*').forEach(e=>{if(e.scrollTop)e.scrollTop=0;});window.scrollTo(0,0);});
 await page.screenshot({path:`artifacts/strategy-placement-${info.project.name}.png`,fullPage:true});
});
