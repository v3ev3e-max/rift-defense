import {chromium, webkit} from '@playwright/test';
import {readFileSync} from 'node:fs';

const ids=[...readFileSync('src/data/heroes.ts','utf8').matchAll(/id: "(\w+)"/g)].map(m=>m[1]);
for(const [name,engine,viewport] of [
  ['desktop',chromium,{width:1440,height:1000}],
  ['android',chromium,{width:412,height:915}],
  ['iphone',webkit,{width:390,height:844}],
]){
  const browser=await engine.launch();
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(ids=>localStorage.setItem('rift-defense-save-v1',JSON.stringify({saveVersion:1,deck:ids,tutorial:true})),ids);
  await page.goto('file:///D:/3V_TD/local-test/index.html');
  await page.locator('[data-action="stage"]').first().click();
  await page.locator('[data-action="start-battle"]').click();
  await page.locator('[data-action="toggle-panel"][data-id="shop-shell"]').click();
  await page.locator('[data-action="shop-grade"][data-id="ALL"]').click();
  const icons=page.locator('.shop-card .recruit-portrait');
  await icons.first().waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.shop-card .recruit-portrait')].every(i=>i.complete&&i.naturalWidth));
  const metrics=await icons.evaluateAll(imgs=>imgs.map(i=>({w:i.naturalWidth,h:i.naturalHeight,fit:getComputedStyle(i).objectFit})));
  if(metrics.length!==21||metrics.some(i=>i.w!==256||i.h!==256||i.fit!=='cover'))throw Error(JSON.stringify(metrics));
  if(errors.length)throw Error(errors.join('\n'));
  await page.locator('#shop-shell').scrollIntoViewIfNeeded();
  await page.screenshot({path:`artifacts/face-icons-${name}.png`,fullPage:true});
  console.log(`${name}: all 21 close-up portraits loaded at 256x256 with cover crop`);
  await browser.close();
}
