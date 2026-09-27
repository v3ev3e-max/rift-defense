import {test,expect} from '@playwright/test';

test('Machine God uses its seven-state sprite and artillery lifecycle without clipping',async({page},info)=>{
 await page.clock.setFixedTime(new Date('2026-10-01T12:00:00+09:00'));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(()=>{const app=(window as any).rift;app.save.data.campaign.squad=['yuria','reina','karin','rhea','noel'];app.raidBossIndex=2;app.navigate('raid');app.startRaid();});
 const boss=page.locator('.raid-boss-main');
 await expect(page.locator('.raid-live>header h1')).toHaveText('기계도시의 신핵');
 await expect(boss).toHaveClass(/v3/);
 await expect(boss).toHaveAttribute('style',/raid-v3\/bosses\/machine-god\/prepare\.webp/);
 await expect(page.locator('.raid-boss-projectile')).toHaveAttribute('style',/machine-god\/projectile-lifecycle\.webp/);
 await page.waitForTimeout(2400);await expect(boss).toHaveAttribute('style',/machine-god\/idle\.webp/);
 const clipped=await page.locator('.raid-arena').evaluate(arena=>{const bounds=arena.getBoundingClientRect();return [...arena.querySelectorAll<HTMLElement>('.raid-fighter,.raid-boss-main')].filter(node=>{const rect=node.getBoundingClientRect();return rect.left<bounds.left-1||rect.right>bounds.right+1||rect.top<bounds.top-1||rect.bottom>bounds.bottom+1;}).map(node=>node.className);});
 expect(clipped).toEqual([]);expect(errors).toEqual([]);
 await page.screenshot({path:`artifacts/raid-machine-projectiles-${info.project.name}.png`,fullPage:true});
});
