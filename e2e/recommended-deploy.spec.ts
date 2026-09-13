import {test,expect} from '@playwright/test';

test('recommended deploy fills a partial squad to five and places every operator',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.locator('[data-action="stage"]').first().click();
 await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 await page.locator('[data-action="campaign-prep-toggle"][data-id="yuria"]').click();
 await page.locator('[data-action="deselect"]').click();
 await page.locator('[data-action="campaign-auto-deploy"]').click();
 const result=await page.evaluate(()=>{const m=(window as any).rift.model;return {count:m.units.length,placed:m.units.filter((u:any)=>u.slot>=0).length,unique:new Set(m.units.map((u:any)=>u.slot)).size,ids:m.units.map((u:any)=>u.heroId)};});
 expect(result.count).toBe(5);expect(result.placed).toBe(5);expect(result.unique).toBe(5);expect(result.ids).toContain('yuria');
 await expect(page.locator('[data-action="campaign-start"]')).toBeEnabled();expect(errors).toEqual([]);
});
