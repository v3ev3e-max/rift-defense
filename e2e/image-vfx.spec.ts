import {test,expect} from '@playwright/test';
test('generated images appear as targeting, projectiles, elemental transfers, corrected slash and zones',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;});
 await page.locator('[data-action="stage"]').first().click();await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const result=await page.evaluate(async()=>{
  const app=(window as any).rift,m=app.model,s=app.game.scene.getScene('Battle');m.update=()=>{};m.units=[];m.enemies.forEach((e:any)=>e.active=false);m.actions.forEach((a:any)=>a.active=false);m.effects.forEach((f:any)=>f.life=0);
  const {attack,stepActions,addZone}=await import('/src/systems/ActionCombat.ts');
  for(const [i,id] of ['noel','sera','karin','adela','belka','neris','ian','luna'].entries()){
   m.selectedSlot=[0,1,2,3,4,9,14,19][i];const u=m.addUnit(id,3);m.spawn('brute');const e=m.enemies[i];e.x=u.x;e.y=Math.max(90,u.y-90);e.hp=e.maxHp=10000;attack(m,u,e);
  }
  stepActions(m,.18);m.selected=0;addZone(m,m.units[5],710,400,65,'water');
  for(const [i,element] of ['water','fire','electric','dark'].entries())m.emit('shot',160,145+i*34,360,145+i*34,0xffffff,{visual:`transfer-${element}`,duration:.5});
  m.emit('shot',180,250,760,250,0x8df4ff,{visual:'sniper-round',duration:.55});
  m.emit('blast',180,250,760,250,0xffffff,{visual:'sniper-muzzle',duration:.24});
  s.update(0,0);app.updateHud(true);
  const textures=['reticle','bullet','slash','lightning','shell','zone','impact'].map(name=>{
   const t=s.textures.get(`vfx-${name}`),source=t.getSourceImage(),canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
   const ctx=canvas.getContext('2d')!;ctx.drawImage(source,0,0);const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;let clear=0,colored=0;
   for(let i=0;i<d.length;i+=4){clear+=Number(d[i+3]===0);colored+=Number(d[i+3]>100);}
   return {name,key:t.key,clear,colored,width:canvas.width,height:canvas.height};
  });
  const visibleSprites=[...s.actionSprites,...s.aimSprites,...s.zoneSprites,...s.fxSprites].filter((sp:any)=>sp.visible);
  const visible=visibleSprites.map((sp:any)=>sp.texture.key);
  const slash=visibleSprites.find((sp:any)=>sp.texture.key.startsWith('slash-anim-'));
  const transferFrames:string[]=[],slashFrames:string[]=[];
  const transferFx=m.effects.find((f:any)=>f.life>0&&f.visual==='transfer-water');
  const slashFx=m.effects.find((f:any)=>f.life>0&&f.visual?.startsWith('slash-'));
  for(const progress of [.01,.26,.51,.76]){
   if(transferFx)transferFx.life=transferFx.duration*(1-progress);
   if(slashFx)slashFx.life=slashFx.duration*(1-progress);
   s.update(0,0);
   transferFrames.push(s.fxSprites.find((sp:any)=>sp.visible&&sp.texture.key.startsWith('transfer-water-'))?.texture.key??'');
   slashFrames.push(s.fxSprites.find((sp:any)=>sp.visible&&sp.texture.key.startsWith('slash-anim-'))?.texture.key??'');
  }
  const muzzleFrames:string[]=[];const muzzleFx=m.effects.find((f:any)=>f.life>0&&f.visual==='sniper-muzzle');
  if(muzzleFx)for(const progress of [.01,.36,.7]){muzzleFx.life=muzzleFx.duration*(1-progress);s.update(0,0);muzzleFrames.push(s.fxSprites.find((sp:any)=>sp.visible&&sp.texture.key.startsWith('sniper-muzzle-'))?.texture.key??'');}
  return {textures,visible,transferFrames,slashFrames,muzzleFrames,slash:slash?{width:slash.displayWidth,height:slash.displayHeight,x:slash.x,y:slash.y}:null};
 });
 for(const t of result.textures){expect(t.key).toBe(`vfx-${t.name}`);expect(t.clear).toBeGreaterThan(100);expect(t.colored).toBeGreaterThan(100);}
 for(const key of ['reticle','shell','zone','impact'])expect(result.visible).toContain(`vfx-${key}`);
 expect(result.visible).toContain('sniper-round-v2');
 expect(result.muzzleFrames).toEqual(['sniper-muzzle-1','sniper-muzzle-2','sniper-muzzle-3']);
 expect(result.visible.some(key=>key.startsWith('slash-anim-'))).toBe(true);
 for(const element of ['water','fire','electric','dark'])expect(result.visible.some(key=>key.startsWith(`transfer-${element}-`))).toBe(true);
 expect(result.transferFrames).toEqual([1,2,3,4].map(n=>`transfer-water-${n}`));
 expect(result.slashFrames).toEqual([1,2,3,4].map(n=>`slash-anim-${n}`));
 expect(result.slash).not.toBeNull();expect(result.slash!.width).toBeLessThanOrEqual(175);expect(result.slash!.height).toBeLessThanOrEqual(205);
 await page.waitForTimeout(100);await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:`artifacts/image-vfx-${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});
