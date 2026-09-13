import {test,expect} from '@playwright/test';

test('cycles the four displayed combat speeds from the new x1 default',async({page})=>{
 test.setTimeout(90000);
 await page.goto('/');
 await page.locator('[data-action="stage"]').first().click();
 await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();
 await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 const speed=page.locator('#speed-btn');
 await expect(speed).toContainText('x1.0');
 for(const expected of ['x1.5','x2.0','x0.75','x1.0']){await speed.click();await expect(speed).toContainText(expected);}
 const mapping=await page.evaluate(()=>{const m=(window as any).rift.model;return {display:m.speed};});
 expect(mapping.display).toBe(1);
 await speed.click();await expect(speed).toContainText('x1.5');
 await page.reload();
 await page.locator('[data-action="stage"]').first().click();
 await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();
 await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await expect(page.locator('#speed-btn')).toContainText('x1.5');
 expect(await page.evaluate(()=>(window as any).rift.model.speed)).toBe(1.5);
 const background=await page.evaluate(()=>{const app=(window as any).rift,m=app.model;m.autoDeployCampaign();m.start();const before=m.time;app.backgroundAt=Date.now()-2000;app.catchUpBackgroundTime();return {before,after:m.time,paused:m.paused};});
 expect(background.paused).toBe(false);
 expect(background.after-background.before).toBeGreaterThanOrEqual(2.9);
});
