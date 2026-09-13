import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:810}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve('local-test/index.html')).href);
const ids=['verdant_stalker','coral_mauler','thorn_matriarch','frost_howler','security_exarch','cryo_hunter','phase_reaper','rift_executioner','gale_colossus','leviathan','ancient_treant','glacial_tyrant','reactor_behemoth','absolute_zero','void_observer','rift_sovereign'];
const failures=await page.evaluate(async ids=>{const result=[];for(const id of ids){const src=window.__RIFT_LOCAL_ASSETS__?.[`/assets/generated/enemies/${id}.webp`],img=new Image();img.src=src??'';try{await img.decode();}catch{}if(!src?.startsWith('data:image/webp;base64,')||img.naturalWidth!==512||img.naturalHeight!==512)result.push({id,embedded:!!src,width:img.naturalWidth,height:img.naturalHeight});}return result;},ids);
await browser.close();
if(errors.length||failures.length){console.error({errors,failures});process.exit(1);}
console.log('16/16 direct-open campaign boss previews decoded at 512x512');
