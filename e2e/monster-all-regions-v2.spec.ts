import {test,expect} from '@playwright/test';
for(let region=1;region<=16;region++)test(`region ${region} authored actions, hit, death and camera edges`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{const app=(window as any).rift;app.save.data.campaign.squad=[];for(let r=1;r<=16;r++)for(let s=1;s<=10;s++)app.save.data.campaign.records[`${r}-${s}`]={stars:3,time:1,kills:1};});
 for(const sub of [1,5,10]){
  await page.evaluate(async id=>{await(window as any).rift.begin(id,true);},`${region}-${sub}`);
  await page.waitForFunction(()=>document.querySelector('#battle-loader')?.classList.contains('complete'),null,{timeout:60000});
  const result=await page.evaluate(async()=>{
   const app=(window as any).rift,scene=app.game.scene.getScene('Battle'),m=app.model;
   const {campaignEnemyIds}=await import('/src/data/campaign.ts');
   const ids=[...campaignEnemyIds(m.campaign)] as string[];
   app.game.loop.stop();m.paused=true;
   const bad:string[]=[],states:any[]=[];
   for(const id of ids){
    if(!scene.enemyActionOwners[id]){bad.push(`${id}:no-owner`);continue;}
    for(const state of ['attack','hit','death'])for(let n=1;n<=3;n++)if(!scene.textureReady(`enemy-${id}-owned-${state}-${n}`))bad.push(`${id}:${state}:${n}:missing`);
    m.spawn(id);const e=m.enemies.find((v:any)=>v.active&&v.kind===id);e.x=400;e.y=400;
    e.meleeAttackedAt=undefined;e.rangedFiredAt=undefined;e.abilityCastAt=undefined;scene.update(0,0);
    const attack:string[]=[],hit:string[]=[],death:string[]=[];
    e.meleeAttackedAt=100;
    for(const t of [100,100.23,100.45,100.7]){m.time=t;scene.enemyHitUntil[e.index]=0;scene.update(0,0);attack.push(scene.enemySprites[e.index].texture.key);}
    e.meleeAttackedAt=undefined;e.hp-=1;scene.visualTime=200;scene.update(0,0);
    for(const t of [200,200.11,200.21,200.31]){scene.visualTime=t;scene.update(0,0);hit.push(scene.enemySprites[e.index].texture.key);}
    for(const [x,y] of [[1,1],[799,1],[1,799],[799,799]])for(const t of [100,100.23,100.45]){
     e.x=x;e.y=y;e.meleeAttackedAt=100;m.time=t;scene.enemyHitUntil[e.index]=0;scene.update(0,0);
     const b=scene.enemySprites[e.index].getBounds();if(b.left<0||b.top<0||b.right>800||b.bottom>800)bad.push(`${id}:attack-edge`);
    }
    e.meleeAttackedAt=undefined;m.time=201;
    for(const [x,y] of [[1,1],[799,1],[1,799],[799,799]])for(const t of [200,200.11,200.21]){
     e.x=x;e.y=y;scene.visualTime=t;scene.enemyHitUntil[e.index]=200.3;scene.update(0,0);
     const b=scene.enemySprites[e.index].getBounds();if(b.left<0||b.top<0||b.right>800||b.bottom>800)bad.push(`${id}:hit-edge`);
    }
    e.active=false;
    for(const [x,y] of [[1,1],[799,1],[1,799],[799,799]]){
     m.emit('blast',x,y,x,y,0xffffff,{visual:`enemy-death-${id}`,duration:.48});
     const f=m.effects.find((v:any)=>v.life>0&&v.visual===`enemy-death-${id}`);
     if(!f){bad.push(`${id}:no-death-effect`);continue;}
     for(const progress of [.01,.4,.8]){
      f.life=(1-progress)*.48;scene.update(0,0);
      const sprite=scene.fxSprites.find((sp:any)=>sp.visible&&sp.texture.key===`enemy-${id}-owned-death-${1+Math.floor(progress*3)}`);
      if(!sprite){bad.push(`${id}:death-frame`);continue;}
      const b=sprite.getBounds();if(b.left<0||b.top<0||b.right>800||b.bottom>800)bad.push(`${id}:death-edge`);
      if(x===1&&y===1)death.push(sprite.texture.key);
     }
     f.life=0;
    }
    states.push({id,attack,hit,death});
   }
   return {bad,states};
  });
  expect(result.bad).toEqual([]);
  for(const row of result.states){
   expect(row.attack.slice(0,3)).toEqual([1,2,3].map(n=>`enemy-${row.id}-owned-attack-${n}`));
   expect(row.hit.slice(0,3)).toEqual([1,2,3].map(n=>`enemy-${row.id}-owned-hit-${n}`));
   expect(row.death).toEqual([1,2,3].map(n=>`enemy-${row.id}-owned-death-${n}`));
   expect(row.attack[3]).toBe(`enemy-${row.id}-move-1`);expect(row.hit[3]).toBe(`enemy-${row.id}-move-1`);
  }
 }
 expect(errors).toEqual([]);
 await page.screenshot({path:`artifacts/monster-actions-v2/region-${region}-${test.info().project.name}.png`});
});
