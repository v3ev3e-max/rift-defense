import {test,expect} from '@playwright/test';

test('mobile deployment keeps a large map and a visible tappable hero roster',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.evaluate(()=>{const app=(window as any).rift;app.save.data.tutorial=true;app.save.data.campaign.squad=[];app.save.persist();app.begin('1-1');});
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const map=await page.locator('.battle-stage-shell').boundingBox();
 expect(map).toBeTruthy();
 expect(map!.width).toBeGreaterThanOrEqual(380);
 expect(map!.height/map!.width).toBeGreaterThan(.95);
 const roster=page.locator('.prep-roster');
 await expect(roster).toBeVisible();
 const tabsBottom=await page.locator('.prep-role-tabs').evaluate(el=>el.getBoundingClientRect().bottom);
 const rosterTop=await roster.evaluate(el=>el.getBoundingClientRect().top);
 const presetsTop=await page.locator('.deployment-preset-panel').evaluate(el=>el.getBoundingClientRect().top);
 expect(rosterTop).toBeGreaterThanOrEqual(tabsBottom-1);
 expect(presetsTop).toBeGreaterThan(rosterTop);
 const tank=page.locator('[data-action="campaign-prep-toggle"][data-id="yuria"]');
 await tank.scrollIntoViewIfNeeded();
 await expect(tank).toBeVisible();
 expect(await page.evaluate(()=>(window as any).rift.model.units.some((u:any)=>u.heroId==='yuria'))).toBe(false);
 await tank.click();
 expect(await page.evaluate(()=>(window as any).rift.model.units.some((u:any)=>u.heroId==='yuria'))).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
