import {assetUrl} from '../utils/assets';
import {heroSkillEffects} from '../game/HeroSkillEffects';

export type RaidPose = 'idle'|'prepare'|'attack'|'skill'|'pattern'|'hit'|'phase'|'death';
const active = new WeakMap<HTMLElement, {animation: Animation; priority: number}>();
const priorities: Record<RaidPose,number> = {idle:0,prepare:1,attack:2,skill:3,pattern:3,hit:3.5,phase:4,death:5};
export function bossSprite(id:string, pose:RaidPose) {
 const modern=['gale-colossus','void-observer','machine-god'].includes(id);
 const state=pose==='skill'?'attack':pose;
 if(id==='gale-colossus')return {url:assetUrl(`/assets/generated/raid-v4/bosses/${id}/${state}.webp`),frames:6};
 if(modern)return {url:assetUrl(`/assets/generated/${state==='attack'?'raid-v4':'raid-v3'}/bosses/${id}/${state}.webp`),frames:6};
 const fallback=state==='prepare'?'attack':state==='pattern'?'attack':state==='death'?'idle':state;
 return {url:assetUrl(`/assets/generated/raid-v2/bosses/${id}/${fallback}-sheet.webp`),frames:fallback==='attack'?6:fallback==='hit'?3:4};
}
function paint(el:HTMLElement,pose:RaidPose){
 const id=el.dataset.hero??el.dataset.boss!;
 const sprite=el.dataset.hero?{url:assetUrl(`/assets/generated/raid-v4/heroes/${id}/${pose==='hit'||pose==='death'?'idle':pose}.webp`),frames:pose==='skill'?6:pose==='attack'?8:1}:bossSprite(id,pose);
 el.style.backgroundImage=`url("${sprite.url}")`;
 el.style.backgroundSize=`${sprite.frames*100}% 100%`;
 el.style.backgroundPosition='0% 0%';el.dataset.pose=pose;
 return sprite.frames;
}
/** No timer-driven idle animation. Each event owns one finite playback. */
export function playRaidPose(el:HTMLElement|null,pose:RaidPose,duration=600){
 if(!el||el.dataset.pose==='death')return;
 const previous=active.get(el);
 if(previous&&previous.priority>priorities[pose])return;
 previous?.animation.cancel();
 const frames=paint(el,pose);
 if(pose==='idle'){active.delete(el);return;}
 const keyframes:Array<Keyframe>=Array.from({length:frames},(_,i)=>({backgroundPosition:`${frames===1?0:i/(frames-1)*100}% 0%`,offset:i/frames,easing:'steps(1,end)'}));
 keyframes.push({...keyframes[keyframes.length-1],offset:1});
 if(pose==='hit')keyframes.forEach((k,i)=>k.filter=i%2?'brightness(1)':'brightness(1.8)');
 if(pose==='death')keyframes.forEach((k,i)=>k.opacity=String(1-i/Math.max(1,keyframes.length-1)));
 const animation=el.animate(keyframes,{duration,iterations:1,fill:'forwards'});
 active.set(el,{animation,priority:priorities[pose]});
 const finish=()=>{if(active.get(el)?.animation!==animation)return;active.delete(el);animation.cancel();if(pose==='death')el.style.opacity='0';else paint(el,'idle');};
 // WebKit can postpone finish events while decoding large sheets. A bounded
 // fallback must still release the pose, without touching a newer event.
 const deadline=window.setTimeout(finish,duration+50);
 animation.onfinish=()=>{clearTimeout(deadline);finish();};
}
export function raidHeroActions(root:HTMLElement,skill=false){
 const actors=[...root.querySelectorAll<HTMLElement>('.raid-fighter:not(.down) .raid-hero-sprite')];
 actors.forEach((el,i)=>{
  if((active.get(el)?.priority??0)>priorities[skill?'skill':'attack'])return;
  playRaidPose(el,skill?'skill':'attack',skill?780:460);
  if(skill){
   const effect=heroSkillEffects(el.dataset.hero!);
   const targets=effect.target==='allies'?actors:effect.target==='self'?[el]:[root.querySelector<HTMLElement>('.raid-boss-main')].filter((v):v is HTMLElement=>!!v);
   targets.forEach(target=>skillEffect(root,el,target,effect));
   return;
  }
  const support=el.parentElement?.classList.contains('support');
  const target=support?actors[(i+1)%actors.length]:root.querySelector<HTMLElement>('.raid-boss-main');
  if(target)fly(root,el,target,assetUrl(`/assets/generated/raid-v3/heroes/${el.dataset.hero}/${skill?'skill':'basic'}.webp`),skill?4:3,assetUrl(`/assets/generated/raid-v3/heroes/${el.dataset.hero}/impact.webp`));
 });
}
function skillEffect(root:HTMLElement,source:HTMLElement,target:HTMLElement,effect:ReturnType<typeof heroSkillEffects>){
 const arena=root.querySelector<HTMLElement>('.raid-arena');if(!arena)return;
 const bounds=arena.getBoundingClientRect(),rect=target.getBoundingClientRect();
 const size=Math.min(140,bounds.width*.22,bounds.height*.45);
 const x=Math.max(size/2,Math.min(bounds.width-size/2,rect.left-bounds.left+rect.width/2));
 const y=Math.max(size/2,Math.min(bounds.height-size/2,rect.top-bounds.top+rect.height*.65));
 if(effect.target==='enemy')fly(root,source,target,assetUrl(effect.projectile),4);
 const node=document.createElement('span');node.className='raid-owned-skill-effect';node.dataset.skillOwner=effect.owner;
 Object.assign(node.style,{position:'absolute',pointerEvents:'none',zIndex:'7',left:`${x-size/2}px`,top:`${y-size/2}px`,width:`${size}px`,height:`${size}px`,backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center',opacity:'0'});
 arena.append(node);
 const delay=effect.target==='enemy'?480:0;
 const timers:number[]=[];
 effect.impact.forEach((path,i)=>timers.push(window.setTimeout(()=>{if(node.isConnected)node.style.backgroundImage=`url("${assetUrl(path)}")`;},delay+i*180)));
 const animation=node.animate([{opacity:0,transform:'scale(.72)'},{opacity:.95,transform:'scale(1)',offset:.25},{opacity:0,transform:'scale(1.12)'}],{delay,duration:720,fill:'both'});
 const cleanup=()=>{timers.forEach(clearTimeout);node.remove();};
 animation.onfinish=cleanup;animation.oncancel=cleanup;
 window.setTimeout(cleanup,delay+800);
}
export function raidBossAction(root:HTMLElement,pose:RaidPose,duration=700){
 const boss=root.querySelector<HTMLElement>('.raid-boss-main');playRaidPose(boss,pose,duration);
 if(boss&&(pose==='attack'||pose==='pattern')){
  const id=boss.dataset.boss!;
  if(['gale-colossus','void-observer','machine-god'].includes(id)){
   root.querySelectorAll<HTMLElement>('.raid-fighter:not(.down) .raid-hero-sprite').forEach(target=>fly(root,boss,target,assetUrl(`/assets/generated/raid-v3/bosses/${id}/projectile-lifecycle.webp`),4));
  }
 }
}
function fly(root:HTMLElement,source:HTMLElement,target:HTMLElement,url:string,frames:number,impact?:string){
 const arena=root.querySelector<HTMLElement>('.raid-arena');if(!arena)return;
 const bounds=arena.getBoundingClientRect(),from=source.getBoundingClientRect(),to=target.getBoundingClientRect();
 const size=Math.min(72,Math.max(24,bounds.width*.065));
 const center=(r:DOMRect)=>({x:Math.max(size/2,Math.min(bounds.width-size/2,r.left-bounds.left+r.width*.5)),y:Math.max(size/2,Math.min(bounds.height-size/2,r.top-bounds.top+r.height*.55))});
 const a=center(from),b=center(to),node=document.createElement('span');node.className='raid-event-projectile';
 Object.assign(node.style,{position:'absolute',pointerEvents:'none',zIndex:'6',width:`${size}px`,height:`${size}px`,left:`${a.x-size/2}px`,top:`${a.y-size/2}px`,backgroundImage:`url("${url}")`,backgroundSize:`${frames*100}% 100%`,backgroundRepeat:'no-repeat'});
 arena.append(node);
 const flight=node.animate([{transform:'translate(0,0)',backgroundPosition:'0% 0%'},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px)`,backgroundPosition:'100% 0%'}],{duration:480,easing:'linear',fill:'forwards'});
 // Frame changes are discrete; movement remains smooth.
 node.animate(Array.from({length:frames+1},(_,i)=>({backgroundPosition:`${Math.min(i,frames-1)/(frames-1)*100}% 0%`,offset:i/frames,easing:'steps(1,end)'})),{duration:480,fill:'forwards'});
 flight.onfinish=()=>{
  if(!node.isConnected){node.remove();return;}
  if(impact){node.style.backgroundImage=`url("${impact}")`;node.style.backgroundSize='300% 100%';}
  const end=node.animate([{opacity:1},{opacity:0}],{duration:180});end.onfinish=()=>node.remove();
 };
}
