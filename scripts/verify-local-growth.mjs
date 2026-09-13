import {chromium,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
const browser=await chromium.launch();
for(const width of [390,1440]){
 const p=await browser.newPage({viewport:{width,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(resolve('index.html')).href);await p.locator('[data-action="stage"]').first().click();await p.locator('[data-action="start-battle"]').first().click();await p.locator('canvas').waitFor();
 const skip=p.locator('[data-action="tutorial-skip"]');if(await skip.isVisible())await skip.click();await p.waitForTimeout(700);
 const box=await p.locator('canvas').boundingBox();const click=()=>p.mouse.click(box.x+290/800*box.width,box.y+290/800*box.height);
 await click();await p.waitForTimeout(150);await click();await expect(p.locator('#selected-upgrade-btn')).toBeEnabled();await p.locator('#selected-upgrade-btn').click();await expect(p.locator('.growth-identity')).toContainText('Lv.1');
 await p.locator('#selected-growth').screenshot({path:`artifacts/local-growth-${width}.png`});expect(errors).toEqual([]);console.log(width,'file:// summon → select → upgrade PASS');await p.close();
}await browser.close();
