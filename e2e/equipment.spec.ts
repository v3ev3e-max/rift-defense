import {test,expect} from '@playwright/test';

test('permanent stars and three-slot equipment remain usable without horizontal overflow',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{(window as any).rift.navigate('hero');});
 await expect(page.locator('.equipment-screen')).toBeVisible();
 await expect(page.locator('.equipment-slots .equip-slot')).toHaveCount(3);
 await page.locator('.equipment-screen details').click();
 const armor=page.locator('.equipment-item').filter({hasText:'전술 방호복'});
 await expect(armor).toBeVisible();await armor.locator('[data-action="equipment-equip"]').click();
 await expect(page.locator('.equip-slot.filled')).toHaveCount(2);
 const before=await page.locator('.top-currencies').textContent();
 await page.locator('.equip-slot.filled').filter({hasText:'전술 방호복'}).locator('[data-action="equipment-enhance"]').click();
 await expect(page.locator('.equip-slot.filled').filter({hasText:'전술 방호복 · B +1'})).toBeVisible();
 expect(await page.locator('.top-currencies').textContent()).not.toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
});
test('opens equipment from live-map preparation and equips without leaving the battlefield',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.locator('[data-action="campaign-deploy"]').first().click();
 await page.evaluate(()=>{const a=(window as any).rift;a.placeCampaignHero('sera',0);const u=a.model.units.find((v:any)=>v.heroId==='sera');a.model.selected=u.uid;a.updateHud(true);});
 await expect(page.locator('.prep-bag')).toContainText('세라');
 await expect(page.locator('.prep-bag-slot')).toHaveCount(3);
 await page.locator('[data-action="prep-auto"]').click();
 const armor=page.locator('.prep-bag-slot').nth(1);await expect(armor).not.toContainText('비어 있음');
 const before=await armor.textContent();await armor.locator('[data-action="prep-enhance"]').click();
 await expect(page.locator('.prep-bag-slot').nth(1)).not.toHaveText(before??'');
 await expect(page.locator('.prep-bag-slot').nth(1)).toContainText('+1');
 await expect(page.locator('#phaser-container canvas')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
});
