import {chromium,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
const browser=await chromium.launch();
for(const width of [390,1440]){
 const p=await browser.newPage({viewport:{width,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(resolve('local-test/index.html')).href);await p.locator('[data-action="stage"]').first().click();await p.locator('[data-action="campaign-select"][data-id="1-1"]').click();await p.locator('[data-action="campaign-deploy"]').click();await p.locator('canvas').waitFor();
 await p.locator('[data-action="campaign-auto-deploy"]').click();await expect(p.locator('[data-action="campaign-start"]')).toBeEnabled();
 await p.locator('[data-action="campaign-prep-role"][data-id="support"]').click();await expect(p.locator('.prep-roster [data-action="campaign-prep-toggle"]')).toHaveCount(5);
 await p.locator('#campaign-prep').screenshot({path:`artifacts/local-growth-${width}.png`});expect(errors).toEqual([]);console.log(width,'file:// deployment, role tabs and start readiness PASS');await p.close();
}await browser.close();
