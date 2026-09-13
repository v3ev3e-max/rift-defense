import {chromium,webkit} from '@playwright/test';
import {readFileSync} from 'node:fs';
const ids=[...readFileSync('src/data/heroes.ts','utf8').matchAll(/id: "(\w+)"/g)].map(m=>m[1]);
for(const [name,engine,url,viewport] of [
 ['pc',chromium,'http://127.0.0.1:5173',{width:1440,height:900}],
 ['mobile',chromium,'http://127.0.0.1:5173',{width:412,height:915}],
 ['iphone',webkit,'http://127.0.0.1:5173',{width:390,height:844}],
 ['direct',chromium,'file:///D:/3V_TD/local-test/index.html',{width:1440,height:900}]
]){
 const browser=await engine.launch();const page=await browser.newPage({viewport});const errors=[];
 try{
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(ids=>localStorage.setItem('rift-defense-save-v1',JSON.stringify({saveVersion:1,deck:ids,tutorial:true})),ids);
  await page.goto(url);await page.locator('[data-action="stage"]').first().click();await page.locator('[data-action="start-battle"]').click();
  await page.locator('#focus-btn').click();await page.locator('.focus-modal').waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.focus-grid img')].every(i=>i.complete&&i.naturalWidth));
  const metrics=await page.locator('.focus-grid img').evaluateAll(imgs=>imgs.map(i=>({width:i.naturalWidth,height:i.naturalHeight,w:i.getBoundingClientRect().width,h:i.getBoundingClientRect().height,fit:getComputedStyle(i).objectFit,cls:i.className})));
  if(metrics.length!==10||metrics.some(i=>i.width!==160||i.height!==160||Math.abs(i.w-i.h)>.1||i.fit!=='contain'||i.cls!=='recruit-portrait'))throw Error(JSON.stringify(metrics));
  if(errors.length)throw Error(errors.join('\n'));
  await page.screenshot({path:`artifacts/recruitment-${name}.png`});
  console.log(`${name}: 10 deck SD previews loaded, square, undistorted; no browser errors`);
 }finally{await browser.close();}
}
