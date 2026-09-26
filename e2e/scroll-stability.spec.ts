import {test,expect} from '@playwright/test';
test('campaign placement and same-screen UI updates preserve every reading position',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('[data-action="stage"]').first().click();await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const prep=page.locator('.prep-roster');await prep.evaluate(el=>el.scrollTop=el.scrollHeight);
 const beforePrep=await prep.evaluate(el=>el.scrollTop);expect(beforePrep).toBe(0);
 await page.evaluate(()=>(window as any).rift.placeCampaignHero('yuria',0));
 expect(await page.locator('.prep-roster').evaluate(el=>el.scrollTop)).toBe(beforePrep);
 await page.locator('[data-action="campaign-auto-deploy"]').click();
 expect(await page.locator('.prep-roster').evaluate(el=>el.scrollTop)).toBe(beforePrep);
 await page.reload({waitUntil:'domcontentloaded'});errors.splice(0);await page.locator('[data-action="inventory"]').first().click();const vault=page.locator('.item-vault');await expect(vault).toBeVisible();
 await vault.evaluate(el=>el.scrollTop=el.scrollHeight);const beforeVault=await vault.evaluate(el=>el.scrollTop);expect(beforeVault).toBeGreaterThan(0);
 await vault.locator('[data-action="item-select"]').last().click();expect(await page.locator('.item-vault').evaluate(el=>el.scrollTop)).toBe(beforeVault);
 expect(errors).toEqual([]);
});
