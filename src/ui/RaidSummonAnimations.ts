import {assetUrl} from '../utils/assets';
export const raidSummonOwners=new Set<string>(["aeon-sovereign","gale-colossus","machine-god","solar-sphinx","void-observer"]);
type SummonPose='move'|'attack'|'hit'|'death';
const playback=new WeakMap<HTMLElement,{timers:number[]}>();
const warmed=new Map<string,Promise<void>>();
export function raidSummonPath(id:string,pose:SummonPose){return `/assets/generated/raid-summon-actions-v2/${id}/${pose}/sheet.webp`;}
export function warmRaidSummonAssets(id:string){
 if(!raidSummonOwners.has(id))return Promise.resolve();
 let pending=warmed.get(id);if(pending)return pending;
 pending=Promise.all((['move','attack','hit','death'] as const).map(pose=>new Promise<void>((resolve,reject)=>{
  const image=new Image();image.onload=()=>{if(image.naturalWidth!==768||image.naturalHeight!==256){reject(new Error('Invalid summon sheet '+id));return;}resolve();};image.onerror=()=>reject(new Error('Missing summon sheet '+id));image.src=assetUrl(raidSummonPath(id,pose));
 }))).then(()=>{});warmed.set(id,pending);return pending;
}
export function raidSummonMarkup(id:string,index:number){
 void warmRaidSummonAssets(id).catch(error=>console.warn(error));
 const authored=raidSummonOwners.has(id),path=authored?raidSummonPath(id,'move'):`/assets/generated/raid-v2/summons/${id}.webp`;
 return `<span class="raid-summon" data-summon-boss="${id}" data-summon-index="${index}" style="--summon:${index};background-image:url('${assetUrl(path)}');background-size:${authored?300:100}% 100%" role="img" aria-label="보스 소환체"></span>`;
}
export function playRaidSummon(el:HTMLElement,pose:SummonPose,duration=450,onfinish?:()=>void){
 const previous=playback.get(el);if(previous){previous.timers.forEach(clearTimeout);playback.delete(el);}
 if(!raidSummonOwners.has(el.dataset.summonBoss!)){onfinish?.();return;}
 el.style.backgroundImage=`url("${assetUrl(raidSummonPath(el.dataset.summonBoss!,pose))}")`;
 el.style.backgroundPosition='0% 0%';el.dataset.pose=pose;
 const active={timers:[] as number[]};playback.set(el,active);
 el.dataset.frame='1';
 const finish=()=>{
  if(playback.get(el)!==active)return;
  playback.delete(el);active.timers.forEach(clearTimeout);
  if(pose!=='death'){el.style.backgroundImage=`url("${assetUrl(raidSummonPath(el.dataset.summonBoss!,'move'))}")`;el.style.backgroundPosition='0% 0%';el.dataset.pose='idle';el.dataset.frame='1';}
  onfinish?.();
 };
 // WebKit may throttle RAF while decoding the arena. Schedule each authored
 // frame once instead of jumping over intermediate drawings on a late RAF.
 for(let frame=1;frame<3;frame++)active.timers.push(window.setTimeout(()=>{
  if(playback.get(el)!==active||!el.isConnected)return;
  el.style.backgroundPosition=`${frame*50}% 0%`;el.dataset.frame=String(frame+1);
 },duration*frame/3));
 active.timers.push(window.setTimeout(finish,duration));
}
export function syncRaidSummons(root:HTMLElement,id:string,count:number){
 const arena=root.querySelector<HTMLElement>('.raid-arena');if(!arena)return;
 const active=[...arena.querySelectorAll<HTMLElement>('.raid-summon:not(.dying)')];
 for(const el of active.slice(count)){
  el.classList.add('dying');playRaidSummon(el,'hit',180,()=>playRaidSummon(el,'death',450,()=>el.remove()));
 }
 for(let i=active.length;i<count;i++){
  arena.insertAdjacentHTML('beforeend',raidSummonMarkup(id,i));
  const el=arena.lastElementChild as HTMLElement;playRaidSummon(el,'move',450);
 }
}
export function attackRaidSummons(root:HTMLElement){
 root.querySelectorAll<HTMLElement>('.raid-summon:not(.dying)').forEach(el=>playRaidSummon(el,'attack'));
}
export function despawnRaidSummons(root:HTMLElement){
 root.querySelectorAll<HTMLElement>('.raid-summon:not(.dying)').forEach(el=>{
  el.classList.add('dying');playRaidSummon(el,'death',450,()=>el.remove());
 });
}
