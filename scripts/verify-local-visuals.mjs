import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch();const results=[];
for(const target of ['index.html','local-test/index.html']) {
 const page=await browser.newPage({viewport:{width:412,height:915}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const id=sessionStorage.getItem('visual-test-hero');if(id)localStorage.setItem('rift-defense-save-v1',JSON.stringify({saveVersion:1,deck:[id],tutorial:true}));});
 await page.goto('file:///D:/3V_TD/'+target);
 const ids=await page.evaluate(()=>Object.keys(window.__RIFT_LOCAL_ASSETS__).filter(p=>/heroes\/[^/]+\/frame_01.png$/.test(p)).map(p=>p.split('/')[3]));
 for(const id of ids){
  await page.evaluate(id=>sessionStorage.setItem('visual-test-hero',id),id);
  await page.reload();await page.waitForFunction(()=>Boolean(window.rift));
  await page.evaluate(id=>{const app=window.rift;app.save.data.campaign.squad=[id];app.save.persist();app.begin('1-1',true);},id);
  await page.locator('canvas').waitFor();await page.locator('#battle-loader').waitFor({state:'detached',timeout:90000});
  await page.evaluate(()=>{const app=window.rift;app.model.autoDeployCampaign();app.model.start();app.updateHud(true);});
  const missing=await page.evaluate(async id=>{
   const keys=[1,2,3].flatMap(f=>[`/assets/heroes/${id}/frame_0${f}.png`,`/assets/effects/${id}/projectile_0${f}.png`,`/assets/effects/${id}/impact_0${f}.png`]);keys.push(`/assets/effects/${id}/skill.png`);
   const missing=[];
   for(const key of keys){const image=new Image();image.src=window.__RIFT_LOCAL_ASSETS__[key];try{await image.decode();}catch{missing.push(key);}}
   return missing;
  },id);
  if(missing.length)throw Error(`${target} ${id}: ${missing}`);
  if(id==='aurora')await page.screenshot({path:`artifacts/visual-audit/direct-${target.replaceAll('/','-')}.png`});
  results.push({target,id,textures:10,missing});
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(`${target}: ${ids.length} heroes, no missing textures or browser errors`);await page.close();
}
await browser.close();writeFileSync('artifacts/visual-audit/direct-html-results.json',JSON.stringify(results,null,2));
