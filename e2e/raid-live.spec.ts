import {test,expect} from '@playwright/test';

test('boss raid renders a visible animated arena and advances combat',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(()=>{const app=(window as any).rift;app.navigate('raid');app.startRaid();});
 const boss=page.locator('.raid-boss-main');await expect(boss).toBeVisible();
 await expect(page.locator('.raid-fighter')).toHaveCount(5);
 const size=await boss.boundingBox();expect(size?.width).toBeGreaterThan(120);expect(size?.height).toBeGreaterThan(160);
 const before=await page.locator('.raid-boss-hp em').textContent();
 await page.waitForTimeout(1200);
 const after=await page.locator('.raid-boss-hp em').textContent();expect(after).not.toBe(before);
 await expect(page.locator('.raid-damage-pop')).toBeVisible();expect(errors).toEqual([]);
 await page.screenshot({path:`artifacts/raid-live-${info.project.name}.png`,fullPage:true});
});
