import {chromium} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const validation=JSON.parse(readFileSync('artifacts/monster-actions-v2/pixel-validation.json','utf8'));
const required=validation.flatMap(row=>row.type==='monster'
 ? ['attack','hit','death'].flatMap(state=>[1,2,3].map(n=>`/assets/generated/monster-actions-v2/${row.owner}/${state}/frame_${String(n).padStart(2,'0')}.webp`))
 : ['move','attack','hit','death'].map(state=>`/assets/generated/raid-summon-actions-v2/${row.owner}/${state}/sheet.webp`));
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:810}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>!!window.rift&&!!window.__RIFT_LOCAL_ASSETS__,null,{timeout:120000});
 const missing=await page.evaluate(paths=>paths.filter(path=>!window.__RIFT_LOCAL_ASSETS__[path]),required);
 if(missing.length)throw new Error('Offline assets missing: '+missing.join(','));
 await page.evaluate(async()=>{
  const app=window.rift;app.save.data.campaign.squad=[];
  for(let r=1;r<=16;r++)for(let s=1;s<=10;s++)app.save.data.campaign.records[`${r}-${s}`]={stars:3,time:1,kills:1};
  await app.begin('8-10',true);
 });
 await page.waitForFunction(()=>{const scene=window.rift.game?.scene.getScene('Battle');return scene?.enemySprites?.length&&scene.textureReady('enemy-armored-owned-death-3');},null,{timeout:120000});
 const actual=await page.evaluate(()=>{
  const app=window.rift,scene=app.game.scene.getScene('Battle'),m=app.model;app.game.loop.stop();m.paused=true;
  m.spawn('armored');const e=m.enemies.find(v=>v.active&&v.kind==='armored');e.x=400;e.y=400;e.meleeAttackedAt=10;
  return [10,10.23,10.45].map(time=>{m.time=time;scene.update(0,0);return scene.enemySprites[e.index].texture.key;});
 });
 if(JSON.stringify(actual)!==JSON.stringify([1,2,3].map(n=>`enemy-armored-owned-attack-${n}`)))throw new Error('Offline playback mismatch '+actual);
 if(errors.length)throw new Error('Offline page errors '+errors.join(','));
 await page.waitForFunction(()=>!document.getElementById('battle-loader'),null,{timeout:5000});
 await page.screenshot({path:'artifacts/monster-actions-v2/offline-battle.png'});
 console.log(JSON.stringify({entry:page.url(),embeddedRequired:required.length,missing:missing.length,actual,pageErrors:errors.length}));
}finally{await browser.close();}
