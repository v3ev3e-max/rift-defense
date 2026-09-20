import {test,expect} from '@playwright/test';

test('deployment action is immediately visible for normal and boss stages',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="stage"]').first().click();
 const assertVisible=async()=>{const button=page.locator('.campaign-stage [data-action="campaign-deploy"]');await expect(button).toBeVisible();const box=await button.boundingBox();expect(box).not.toBeNull();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(await page.evaluate(()=>innerHeight));expect(await page.locator('.campaign-stage').evaluate(el=>el.scrollTop)).toBe(0);};
 await assertVisible();
 await page.evaluate(()=>{const app=(window as any).rift;app.save.data.campaign.selected='3-10';app.render();});
 await expect(page.locator('.campaign-stage h2')).toContainText('FINAL BOSS');
 await assertVisible();
});
