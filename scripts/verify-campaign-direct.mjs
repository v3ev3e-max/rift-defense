import {chromium,webkit} from '@playwright/test';
const only=process.argv[2];
for(const [name,engine,viewport] of [['pc',chromium,{width:1440,height:900}],['short-pc',chromium,{width:1366,height:768}],['android',chromium,{width:412,height:915}],['iphone',webkit,{width:390,height:844}],['small-mobile',chromium,{width:360,height:740}]]){
 if(only&&name!==only)continue;
 const browser=await engine.launch();const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///D:/3V_TD/local-test/index.html');
 await page.locator('[data-action="stage"]').first().click();
 await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();
 await page.screenshot({path:`artifacts/campaign-direct-stages-${name}.png`});
 if(await page.locator('.campaign-stage').count()!==1)throw Error('Duplicate details');
 const visible=async selector=>{const r=await page.locator(selector).boundingBox();if(!r||r.y<0||r.y+r.height>viewport.height)throw Error(name+' inaccessible '+selector+JSON.stringify(r));};
 await visible('.campaign-stage [data-action="campaign-deploy"]');
 await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await page.locator('canvas').waitFor();
 if(name!=='iphone'){const auto=page.locator('[data-action="campaign-auto-deploy"]');await auto.waitFor({timeout:60000});await auto.click();await page.waitForFunction(()=>document.querySelectorAll('.campaign-prep .prep-card.selected').length===5,{timeout:60000});}
 await page.screenshot({path:`artifacts/campaign-direct-formation-${name}.png`});
 if(name!=='iphone')await page.locator('[data-action="campaign-start"]').click();
 await page.waitForTimeout(3000);
 await visible('[data-action="campaign-start"]');
 if(name!=='iphone'){const canvas=await page.locator('canvas').boundingBox();await page.mouse.click(canvas.x+canvas.width*560/800,canvas.y+canvas.height*400/800);await visible('[data-action="deselect"]');await page.locator('[data-action="pause"]').click();await page.locator('[data-action="resume"]').click();}
 if(await page.locator('#shop-shell').count())throw Error('Legacy shop visible');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Horizontal overflow');
 await page.screenshot({path:`artifacts/campaign-direct-${name}.png`,fullPage:true});
 if(errors.length)throw Error(errors.join('\n'));console.log(name,'direct campaign PASS');await browser.close();
}
