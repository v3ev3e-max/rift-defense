import {test,expect} from '@playwright/test';

test('selected operators show complete combat information in deployment and battle',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="campaign-deploy"]').first().click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 await page.evaluate(()=>{const app=(window as any).rift,m=app.model;m.autoDeployCampaign();m.selected=m.units[0].uid;app.updateHud(true);});
 const intel=page.locator('.operator-intel');await expect(intel).toBeVisible();await expect(intel).toContainText('스킬·고유 능력');await expect(intel).toContainText('기본 전투');await expect(intel).toContainText('고유 능력');await expect(intel.locator('.operator-star-effects span')).toHaveCount(5);
 await page.evaluate(()=>{const app=(window as any).rift,m=app.model;m.start();m.selected=m.units[0].uid;m.units[0].skillCharge=64;m.units[0].skillEffectDuration=5;m.units[0].skillEffectUntil=m.time+3;app.updateHud(true);});
 await expect(page.locator('.operator-intel')).toContainText('충전 64%');await expect(page.locator('.operator-intel')).toContainText('효과 3.0초');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});
