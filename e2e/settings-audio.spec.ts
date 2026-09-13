import {test,expect} from '@playwright/test';

test('audio options independently control, preview and persist BGM and SFX volume',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.locator('[data-action="settings"]').first().click();
 await expect(page.locator('.audio-volume-row')).toHaveCount(2);
 await page.locator('#audio-bgmVolume').fill('35');
 await page.locator('#audio-sfxVolume').fill('72');
 await expect(page.locator('output[for="audio-bgmVolume"]')).toHaveText('35%');
 await expect(page.locator('output[for="audio-sfxVolume"]')).toHaveText('72%');
 await page.locator('[data-action="setting"][data-id="bgm"]').click();
 await expect(page.locator('[data-action="setting"][data-id="bgm"]')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('[data-action="audio-preview"][data-id="bgm"]')).toBeDisabled();
 await expect(page.locator('[data-action="audio-preview"][data-id="sfx"]')).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-action="settings"]').first().click();
 await expect(page.locator('#audio-bgmVolume')).toHaveValue('35');await expect(page.locator('#audio-sfxVolume')).toHaveValue('72');
 await expect(page.locator('[data-action="setting"][data-id="bgm"]')).toHaveAttribute('aria-pressed','false');expect(errors).toEqual([]);
});
