import {chromium} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const browser=await chromium.launch();
for(const width of [390,1440]){
const p=await browser.newPage({viewport:{width,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(pathToFileURL(resolve('index.html')).href);await p.locator('[data-action="stage"]').first().click();await p.locator('[data-action="start-battle"]').first().click();await p.locator('canvas').waitFor();
const skip=p.locator('[data-action="tutorial-skip"]');if(await skip.isVisible())await skip.click();
await p.waitForTimeout(1000);const c=p.locator('canvas');const b=await c.boundingBox();
await p.mouse.click(b.x+290/800*b.width,b.y+290/800*b.height);
await p.waitForTimeout(500);await p.screenshot({path:`artifacts/direct-portrait-${width}.png`,fullPage:true});if(errors.length)throw Error(errors.join('\n'));console.log(width,b,'PASS');await p.close();}
await browser.close();
