import {test,expect} from '@playwright/test';

test('item menu crafts, filters and manages equipment without horizontal overflow',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{const app=(window as any).rift;app.save.data.equipmentGold=500;app.save.data.equipmentMaterials=100;app.persist();app.render();});
 await page.evaluate(()=>{(window as any).rift.navigate('inventory');});
 await expect(page.locator('.item-screen')).toBeVisible();
 await expect(page.locator('.item-wallet')).toContainText('500G');
 await page.locator('[data-action="item-tab"][data-id="craft"]').click();
 await page.locator('[data-action="item-craft-slot"][data-id="armor"]').click();
 await page.locator('[data-action="item-craft-rarity"][data-id="A"]').click();
 await expect(page.locator('.craft-card')).toHaveCount(4);
 await page.locator('[data-action="item-craft"]').first().click();
 await expect(page.locator('.item-detail')).toContainText('A');
 await expect(page.locator('.item-wallet')).toContainText('430G');
 await page.locator('#item-filter-slot').selectOption('armor');
 await expect(page.locator('.item-vault-row').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
});
