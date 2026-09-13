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
 await page.goto(pathToFileURL(resolve('index.html')).href);
 await page.locator('[data-action="stage"]').first().click();await page.locator('[data-action="start-battle"]').click();
 await page.locator('canvas').waitFor();await page.waitForTimeout(1800);
 for(let i=0;i<3;i++){
  await page.locator('[data-action="buy-hero"][data-id="'+['sera','karin','leon'][i]+'"]').click();
  const canvas=page.locator('canvas');await canvas.scrollIntoViewIfNeeded();const r=await canvas.boundingBox();
  const x=r.x+r.width*(180+i*110)/800,y=r.y+r.height*180/800;
  if(options.isMobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
  await page.waitForFunction(expected=>document.getElementById("expand-btn").textContent.includes(`배치 ${expected}/6`),i+1);
 }
 const direct=await browser.newPage(options);await direct.goto(pathToFileURL(resolve('local-test/index.html')).href);await direct.locator('[data-action="stage"]').first().click();await direct.locator('[data-action="start-battle"]').click();await direct.locator('canvas').waitFor();await direct.close();await page.bringToFront();if(await page.locator('[data-action="resume"]').count())await page.locator('[data-action="resume"]').click();
 const initialGold=(await page.locator('#battle-gold').textContent()).trim();
 await page.waitForTimeout(6500);
 // Resume before inspecting a unit: paused combat deliberately disallows placement.
 await page.locator('canvas').scrollIntoViewIfNeeded();const r=await page.locator('canvas').boundingBox();
 const x=r.x+r.width*180/800,y=r.y+r.height*150/800;
 if(options.isMobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
 await page.locator('#selected-growth .growth-identity').waitFor();
 await page.locator('[data-action="dps"]').click();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 if(overflow||errors.length)throw Error(`${name}: ${JSON.stringify({overflow,errors})}`);
 await page.evaluate(()=>{document.querySelectorAll("*").forEach(e=>{if(e.scrollTop)e.scrollTop=0;});window.scrollTo(0,0);});
 await page.screenshot({path:`artifacts/local-combat-${name}.png`,fullPage:true});
 results.push({name,url:page.url(),initialGold,overflow,errors,statistics:await page.locator('#selected-growth').innerText()});
 console.log(name,'file:// opening three summons, touch/selection, DPS and layout PASS');await browser.close();
}
writeFileSync('artifacts/local-combat-results.json',JSON.stringify(results,null,2));
