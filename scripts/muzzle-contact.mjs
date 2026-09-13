import {muzzlePixel} from '../artifacts/muzzle-audit/sockets.mjs';
import {chromium} from '@playwright/test';import {readFileSync} from 'node:fs';
const ids=['yuria','reina','arin','karin','sera','noel','luna','mia','ian','leon','adela','neris','belka','serin','kyle','livia','kairon','theria','noxia','aurora','arden'];
const browser=await chromium.launch();const p=await browser.newPage({viewport:{width:1230,height:1460},deviceScaleFactor:1});
for(let group=0;group<3;group++){
let html='<style>body{margin:0;background:#203142;color:white;font:12px monospace}.row{display:flex;height:205px}.name{width:72px} .cell{position:relative;width:160px;height:160px;border:1px solid #536273;margin-top:20px;background:repeating-linear-gradient(0deg,transparent 0 19px,#ffffff24 19px 20px),repeating-linear-gradient(90deg,transparent 0 19px,#ffffff24 19px 20px)}img{width:160px;height:160px;image-rendering:pixelated}small{position:absolute;top:-17px}</style>';
for(const id of ids.slice(group*7,group*7+7)){html+=`<div class=row><b class=name>${id}</b>`;for(const name of ['frame_01','frame_03','frame_05','frame_07','up_01','up_02','up_03']){const [mx,my]=muzzlePixel(id,name.startsWith('up'),Number(name.slice(-2)));html+=`<div class=cell><small>${name}</small><img src="data:image/png;base64,${readFileSync(`public/assets/combat/${id}/${name}.png`).toString('base64')}"><i style="position:absolute;left:${mx-4}px;top:${my-4}px;width:8px;height:8px;border:1px solid #ff3030;border-radius:50%;box-shadow:0 0 0 1px white"></i></div>`;}html+='</div>';}
await p.setContent(html);await p.screenshot({path:`artifacts/muzzle-audit/sockets-${group}.png`});}
await browser.close();
