import {test,expect} from '@playwright/test';

test('owned monster attacks, hit frames and camera edges in real battle scene',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const app=(window as any).rift;
  for(let i=1;i<=10;i++)app.save.data.campaign.records[`1-${i}`]={stars:3,time:1,kills:1};
  await app.begin('1-4',true);
 });
 await page.waitForFunction(()=>document.querySelector('#battle-loader')?.classList.contains('complete'),null,{timeout:60000});
 const result=await page.evaluate(()=>{
  const app=(window as any).rift,scene=app.game.scene.getScene('Battle'),m=app.model;
  app.game.loop.stop();m.paused=true;m.time=10;m.spawn('named_meadow');
  const e=m.enemies.find((v:any)=>v.active&&v.kind==='named_meadow');e.x=400;e.y=400;
  scene.update(0,0);e.meleeAttackedAt=10;
  const attack:string[]=[],hit:string[]=[],clipped:string[]=[];
  for(const t of [10,10.23,10.45,10.7]){m.time=t;scene.enemyHitUntil[e.index]=0;scene.update(0,0);attack.push(scene.enemySprites[e.index].texture.key);}
  e.meleeAttackedAt=undefined;e.hp-=1;scene.visualTime=20;scene.update(0,0);
  for(const t of [20,20.11,20.21,20.31]){scene.visualTime=t;scene.update(0,0);hit.push(scene.enemySprites[e.index].texture.key);}
  for(const [x,y] of [[1,1],[799,1],[1,799],[799,799]])for(const t of [10,10.23,10.45]){
   e.x=x;e.y=y;m.time=t;e.meleeAttackedAt=10;scene.enemyHitUntil[e.index]=0;scene.update(0,0);
   const b=scene.enemySprites[e.index].getBounds();if(b.left<0||b.top<0||b.right>800||b.bottom>800)clipped.push(`${x},${y},${t}`);
  }
  return {attack,hit,clipped};
 });
 expect(result.attack.slice(0,3)).toEqual([1,2,3].map(n=>`enemy-named_meadow-owned-attack-${n}`));
 expect(result.attack[3]).toBe('enemy-named_meadow-move-1');
 expect(result.hit.slice(0,3)).toEqual([1,2,3].map(n=>`enemy-named_meadow-owned-hit-${n}`));
 expect(result.hit[3]).toBe('enemy-named_meadow-move-1');expect(result.clipped).toEqual([]);expect(errors).toEqual([]);
 await page.screenshot({path:`artifacts/monster-actions-v2/battle-${test.info().project.name}.png`});
});

test('all five raid summons play finite authored states without CSS bobbing or clipping',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(async()=>{
  // Exercise the same runtime component and styles used by the live raid.
  const {syncRaidSummons,playRaidSummon,raidSummonOwners,warmRaidSummonAssets}=await import('/src/ui/RaidSummonAnimations.ts');
  await Promise.all([...raidSummonOwners].map(warmRaidSummonAssets));
  const root=document.createElement('section');root.className='raid-live';
  root.style.cssText='position:fixed;inset:80px 8px 80px;z-index:9999;background:#142532;display:block';
  root.innerHTML=`<div class="raid-boss-stage" style="height:100%"><div class="raid-arena" style="height:${Math.max(160,window.innerHeight-180)}px;min-height:0"></div></div>`;document.body.append(root);
  const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));const bad:string[]=[],seen:any[]=[];
  for(const id of raidSummonOwners){
   root.querySelector('.raid-arena')!.innerHTML='';syncRaidSummons(root,id,6);await wait(550);
   const el=root.querySelector('.raid-summon') as HTMLElement;
   for(const pose of ['move','attack','hit','death'] as const){
    const frames=new Set<string>();
    const observer=new MutationObserver(()=>frames.add(el.dataset.frame??''));
    observer.observe(el,{attributes:true,attributeFilter:['data-frame']});
    await new Promise<void>(resolve=>{playRaidSummon(el,pose,600,resolve);frames.add(el.dataset.frame??'');});
    observer.disconnect();
    if(!['1','2','3'].every(frame=>frames.has(frame)))bad.push(`${id}:${pose}:missing-frames:${[...frames].join(',')}`);
    const arena=root.querySelector('.raid-arena')!.getBoundingClientRect();
    for(const child of root.querySelectorAll('.raid-summon')){const b=child.getBoundingClientRect();if(b.left<arena.left||b.top<arena.top||b.right>arena.right||b.bottom>arena.bottom)bad.push(`${id}:${pose}:clipped`);}
    seen.push({id,pose,frames:[...frames]});await wait(60);
   }
   if(getComputedStyle(el).animationName!=='none')bad.push(`${id}:css-loop`);
  }
  root.remove();return {bad,seen,count:raidSummonOwners.size};
 });
 expect(result.count).toBe(5);expect(result.seen).toHaveLength(20);expect(result.bad).toEqual([]);
});

test('summon frame bounds survive compact portrait, landscape and low desktop height',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 for(const viewport of [{width:360,height:640},{width:844,height:390},{width:1280,height:560}]){
  await page.setViewportSize(viewport);
  const bad=await page.evaluate(async()=>{
   const {raidSummonMarkup,raidSummonOwners,warmRaidSummonAssets,playRaidSummon}=await import('/src/ui/RaidSummonAnimations.ts');
   await Promise.all([...raidSummonOwners].map(warmRaidSummonAssets));
   const root=document.createElement('section');root.className='raid-live';
   root.style.cssText='position:fixed;inset:40px 4px;display:block;z-index:9999';
   root.innerHTML=`<div class="raid-arena" style="height:${window.innerHeight-82}px;min-height:0">${[...raidSummonOwners].map((id,i)=>raidSummonMarkup(id,i)).join('')}</div>`;
   document.body.append(root);const bad:string[]=[];
   const arena=root.firstElementChild!.getBoundingClientRect();
   for(const el of root.querySelectorAll<HTMLElement>('.raid-summon'))for(const pose of ['move','attack','hit','death'] as const){
    playRaidSummon(el,pose,60);
    await new Promise(r=>setTimeout(r,70));
    const b=el.getBoundingClientRect();if(b.left<arena.left||b.right>arena.right||b.top<arena.top||b.bottom>arena.bottom)bad.push(`${el.dataset.summonBoss}:${pose}`);
   }
   root.remove();return bad;
  });
  expect(bad,JSON.stringify(viewport)).toEqual([]);
 }
});
