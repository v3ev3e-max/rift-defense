import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';

mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
for(const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
 const page=await browser.newPage({viewport});
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('[data-action="raid"]').click();
 await page.locator('.raid-screen').waitFor();
 const select=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,bosses:document.querySelectorAll('[data-action="raid-boss"]').length,squad:document.querySelectorAll('.raid-squad>span').length}));
 if(select.overflow||select.bosses!==3||select.squad!==5)throw new Error(`${name} raid select failed: ${JSON.stringify(select)}`);
 await page.locator('[data-action="raid-start"]').click();
 await page.locator('.raid-live').waitFor();
 const live=await page.evaluate(()=>{const actions=document.querySelector('.raid-live-actions')?.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,hp:!!document.querySelector('.raid-boss-hp'),heroes:document.querySelectorAll('.raid-live-squad>div').length,manual:!!document.querySelector('[data-action="raid-manual"]'),actionsBottom:Math.round(actions?.bottom??9999),viewport:innerHeight};});
 if(live.overflow||!live.hp||live.heroes!==5||!live.manual||live.actionsBottom>live.viewport+2)throw new Error(`${name} live raid failed: ${JSON.stringify(live)}`);
 await page.locator('[data-action="raid-manual"]').click();
 if(!await page.getByText(/수동 스킬 12초/).count())throw new Error(`${name} manual cooldown missing`);
 await page.screenshot({path:`artifacts/raid-${name}.png`,fullPage:false});
 console.log(name,{select,live});
 await page.close();
}
await browser.close();
