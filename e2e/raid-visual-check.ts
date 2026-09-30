import {expect,type Page} from '@playwright/test';
export async function checkBossStates(page:Page,id:string){
 await page.goto('/');
 const result=await page.evaluate(async id=>{
  const load=(p:string)=>import(/* @vite-ignore */p);
  const {playRaidPose,bossSprite}=await load('/src/ui/RaidAnimations.ts');
  const el=document.createElement('span');el.dataset.boss=id;
  Object.assign(el.style,{position:'fixed',display:'block',width:'200px',height:'200px',left:'100px',top:'150px'});document.body.append(el);
  const failures:string[]=[];
  for(const state of ['prepare','attack','pattern','hit','phase','death']){
   const sprite=bossSprite(id,state),im=new Image();im.src=sprite.url;
   try{await im.decode();if(im.width/im.height!==sprite.frames)failures.push(state+' dimensions');}catch{failures.push(state+' missing');}
   playRaidPose(el,state,100);if(el.dataset.pose!==state)failures.push(state+' not started');
   await new Promise(r=>setTimeout(r,350));
   if(el.dataset.pose!==(state==='death'?'death':'idle'))failures.push(state+' did not finish');
   if(el.getAnimations().some(a=>a.playState==='running'))failures.push(state+' still running');
  }
  el.remove();return failures;
 },id);expect(result).toEqual([]);
}
