import {test,expect} from '@playwright/test';
test('all salvage grades can be checked and equipped or locked items survive',async({page},info)=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="inventory"]').click();
 await expect(page.locator('[data-salvage-grade]')).toHaveCount(4);
 await expect(page.locator('[data-action="item-salvage-selected"]')).toBeDisabled();
 const expected=await page.evaluate(()=>{
  const a=(window as any).rift,s=a.save.data;
  const first=s.equipmentInventory[0];first.locked=true;
  const held=s.equipmentInventory.find((v:any)=>v.id!==first.id);held.equippedBy='yuria';s.heroes.yuria.equipment=[held.id];
  a.render();return {keep:[first.id,held.id],remove:s.equipmentInventory.filter((v:any)=>!v.locked&&!v.equippedBy).map((v:any)=>v.id)};
 });
 for(const grade of ['B','A','S','SR']){
  await page.locator(`[data-salvage-grade="${grade}"]`).check();
  await expect(page.locator(`[data-salvage-grade="${grade}"]`)).toBeChecked();
 }
 await expect(page.locator('[data-action="item-salvage-selected"]')).toContainText(`${expected.remove.length}개`);
 await page.screenshot({path:`artifacts/salvage-${info.project.name}.png`});
 await page.locator('[data-action="item-salvage-selected"]').click();
 const remaining=await page.evaluate(()=>(window as any).rift.save.data.equipmentInventory.map((v:any)=>v.id));
 for(const id of expected.keep)expect(remaining).toContain(id);
 for(const id of expected.remove)expect(remaining).not.toContain(id);
 const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width+1);
});
