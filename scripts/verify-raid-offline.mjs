import {chromium} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('index.html')).href,{timeout:120000});
 await page.waitForFunction(()=>window.rift,{timeout:120000});
 await page.evaluate(()=>{const app=window.rift;app.navigate('raid');app.startRaid();clearInterval(app.raidTimer);});
 await page.waitForTimeout(1000);
 const result=await page.evaluate(()=>({local:location.pathname.endsWith('/local-test/index.html'),
  actors:[...document.querySelectorAll('.raid-hero-sprite')].map(el=>({pose:el.dataset.pose,embedded:el.style.backgroundImage.includes('data:image/'),running:el.getAnimations().length}))}));
 if(!result.local||result.actors.length!==5||result.actors.some(v=>v.pose!=='idle'||!v.embedded||v.running)||errors.length)throw Error(JSON.stringify({result,errors}));
 console.log('Root index redirects to rebuilt offline index; five embedded, fixed idle actors; no JS errors.');
}finally{await browser.close();}
