import {chromium,webkit,devices} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
const results=[];
for(const [name,engine,options] of [
 ['pc',chromium,{viewport:{width:1440,height:900}}],
 ['android',chromium,{...devices['Pixel 7'],viewport:{width:412,height:915}}],
 ['iphone',webkit,{...devices['iPhone 13'],viewport:{width:390,height:844}}],
]){
 const browser=await engine.launch(),page=await browser.newPage(options),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('rift-defense-save-v1',JSON.stringify({saveVersion:1,tutorial:true})));
 await page.goto(pathToFileURL(resolve('local-test/index.html')).href);
 await page.locator('[data-action="stage"]').first().click();await page.locator('[data-action="campaign-select"][data-id="1-1"]').click();await page.locator('[data-action="campaign-deploy"]').click();
 await page.locator('#phaser-container canvas').waitFor();await page.locator('[data-action="campaign-auto-deploy"]').click();await page.locator('[data-action="campaign-start"]').click();
 await page.evaluate(()=>{const a=window.rift;if(!a.model.started){a.model.autoDeployCampaign();a.model.start();a.updateHud(true);}});
 await page.waitForFunction(()=>(window).rift?.model?.started===true);await page.waitForTimeout(1800);
 const initialGold='campaign';
 await page.locator('[data-action="dps"]').click();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 if(overflow||errors.length)throw Error(`${name}: ${JSON.stringify({overflow,errors})}`);
 await page.evaluate(()=>{document.querySelectorAll("*").forEach(e=>{if(e.scrollTop)e.scrollTop=0;});window.scrollTo(0,0);});
 await page.screenshot({path:`artifacts/local-combat-${name}.png`,fullPage:true});
 results.push({name,url:page.url(),initialGold,overflow,errors,stage:await page.locator('.battle-top').innerText()});
 console.log(name,'file:// campaign deployment, start, DPS and layout PASS');await browser.close();
}
writeFileSync('artifacts/local-combat-results.json',JSON.stringify(results,null,2));
