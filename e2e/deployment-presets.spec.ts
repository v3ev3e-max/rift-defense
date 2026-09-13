import {test,expect} from '@playwright/test';

test('saves, restores and clears three deployment preset slots',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.locator('[data-action="stage"]').first().click();
 await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 await expect(page.locator('.deployment-preset')).toHaveCount(3);
 await page.evaluate(()=>{const a=(window as any).rift;['yuria','sera','reina','karin','arin'].forEach((id,i)=>a.placeCampaignHero(id,i));});
 await page.locator('[data-action="campaign-preset-save"][data-id="0"]').click();
 await expect(page.locator('.deployment-preset').nth(0)).toHaveClass(/saved/);
 await page.locator('[data-action="campaign-prep-toggle"][data-id="yuria"]').click();
 expect(await page.evaluate(()=>(window as any).rift.model.units.length)).toBe(4);
 await page.locator('[data-action="campaign-preset-load"][data-id="0"]').click();
 expect(await page.evaluate(()=>Object.fromEntries((window as any).rift.model.units.map((u:any)=>[u.heroId,u.slot])))).toEqual({yuria:0,sera:1,reina:2,karin:3,arin:4});
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-action="stage"]').first().click();await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 await expect(page.locator('.deployment-preset').nth(0)).toHaveClass(/saved/);
 await page.locator('[data-action="campaign-preset-clear"][data-id="0"]').click();await expect(page.locator('.deployment-preset').nth(0)).toHaveClass(/empty/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});
