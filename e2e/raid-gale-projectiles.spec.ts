import {test,expect} from '@playwright/test';

test('Gale raid uses dedicated boss states and per-hero projectile lifecycles',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(()=>{const app=(window as any).rift;app.save.data.campaign.squad=['yuria','reina','karin','rhea','noel'];app.raidBossIndex=1;app.navigate('raid');app.startRaid();});
 const boss=page.locator('.raid-boss-main');await expect(boss).toHaveAttribute('style',/raid-v3\/bosses\/gale-colossus\/prepare\.webp/);
 await expect(page.locator('.raid-hero-projectile.skill')).toHaveCount(5);
 await expect(page.locator('.raid-hero-projectile.basic')).toHaveCount(4);
 await expect(page.locator('.raid-fighter.support .raid-hero-projectile.basic')).toHaveCount(0);
 await expect(page.locator('.raid-boss-projectile')).toBeVisible();
 const unique=await page.locator('.raid-hero-projectile.skill').evaluateAll(nodes=>new Set(nodes.map(v=>(v as HTMLElement).style.getPropertyValue('--projectile'))).size);expect(unique).toBe(5);
 await page.waitForTimeout(2400);await expect(boss).toHaveAttribute('style',/raid-v3\/bosses\/gale-colossus\/idle\.webp/);
 const clipped=await page.locator('.raid-arena').evaluate(arena=>{
  const bounds=arena.getBoundingClientRect();
  return [...arena.querySelectorAll<HTMLElement>('.raid-fighter,.raid-boss-main')].flatMap(node=>{
   const rect=node.getBoundingClientRect();
   return rect.left<bounds.left-1||rect.right>bounds.right+1||rect.top<bounds.top-1||rect.bottom>bounds.bottom+1
    ?[{className:node.className,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,arena:{left:bounds.left,right:bounds.right,top:bounds.top,bottom:bounds.bottom}}]:[];
  });
 });
 expect(clipped).toEqual([]);
 expect(errors).toEqual([]);await page.screenshot({path:`artifacts/raid-gale-projectiles-${info.project.name}.png`,fullPage:true});
});
