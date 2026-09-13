import {test,expect} from '@playwright/test';

test('gold recruitment reveals normal, S and SSR presentations without page overflow',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{const a=(window as any).rift;a.save.data.equipmentGold=2000;a.persist();a.render();});
 await page.locator('[data-action="recruit"]').click();
 await expect(page.locator('.recruit-screen')).toBeVisible();
 await page.locator('[data-action="recruit-pull"][data-id="10"]').click();
 await expect(page.locator('.recruit-result-card')).toHaveCount(10);
 await page.locator('[data-action="close-modal"]').click();
 await expect(page.locator('.recruit-status')).toContainText('1,100G');
 await page.evaluate(()=>{const a=(window as any).rift;a.action('dev-recruit','S');});
 await expect(page.locator('.recruit-result-modal')).toHaveClass(/tier-s/);
 await page.locator('[data-action="close-modal"]').click();
 await page.evaluate(()=>{const a=(window as any).rift;a.action('dev-recruit','SR');});
 await expect(page.locator('.recruit-result-modal')).toHaveClass(/tier-ssr/);
 await expect(page.locator('.recruit-result-card')).toContainText('SSR');
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
