import {test,expect} from '@playwright/test';

test('mobile deployment keeps the start action visible and starts with operator info open',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='desktop-chromium','mobile regression');
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="campaign-deploy"]').first().click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 await page.locator('[data-action="campaign-auto-deploy"]').click();
 const start=page.locator('#campaign-start-btn');await expect(start).toBeEnabled();await expect(start).toBeVisible();
 await page.evaluate(()=>{const app=(window as any).rift,m=app.model;m.selected=m.units[0].uid;app.updateHud(true);});
 await expect(page.locator('.operator-intel')).toBeVisible();
 const box=await start.boundingBox();expect(box).not.toBeNull();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(await page.evaluate(()=>innerHeight));
 await start.click();await expect.poll(()=>page.evaluate(()=>(window as any).rift.model.started)).toBe(true);
 expect(errors).toEqual([]);
});
