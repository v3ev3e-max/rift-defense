import {test,expect} from '@playwright/test';
const ids=['yuria','reina','arin','karin','sera','noel','luna','mia','ian','leon','adela','neris','belka','serin','kyle','livia','kairon','theria','noxia','aurora','arden'];
for(const id of ids)test(`${id} actual combat textures, animation and bounds`,async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.evaluate(id=>{const a=(window as any).rift;a.save.data.deck=[id];a.save.data.campaign.squad=[id];a.save.data.tutorial=true;a.save.persist();a.begin('1-1',true);},id);
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const result=await page.evaluate(async id=>{
  const a=(window as any).rift,m=a.model,s=a.game.scene.getScene('Battle');a.game.loop.stop();s.callback=()=>{};m.paused=true;
  m.units=[];const u=m.addUnit(id);m.enemies.forEach((e:any)=>e.active=false);m.spawn('brute');const e=m.enemies[0];e.x=u.x+35;e.y=u.y;e.hp=e.maxHp=1e8;
  const combat=await import('/src/systems/CombatSystem.ts');const {stepActions,castAutoSkill}=await import('/src/systems/ActionCombat.ts');
  const missing:string[]=[];for(const kind of ['hero','projectile','impact','skill'])for(const f of kind==='skill'?[1]:[1,2,3]){
   const key=kind==='hero'?`hero-${id}-anim-${f}`:kind==='skill'?`fx-${id}-skill`:`fx-${id}-${kind}-${f}`;if(!s.textures.exists(key))missing.push(key);
  }
  let skill=false,reaction=false;
  for(let n=0;n<30;n++){
   m.effects.forEach((f:any)=>f.life=0);e.waterMark=e.fireMark=e.electricMark=e.darkMark=1;
   m.actions.forEach((a:any)=>a.active=false);combat.attack(m,u,e);for(let i=0;i<70;i++)stepActions(m,1/60);u.skillCharge=100;u.skillReadyAt=0;m.paused=false;castAutoSkill(m,u,e);m.paused=true;skill ||= m.effects.some((f:any)=>f.life>0&&(f.visual===`${id}-skill`||f.visual===`support-skill-${id}`));
   reaction ||= Object.values(m.reactionCounts).some((n:any)=>n>0);s.update(0,0);
  }
  const heroFrames:string[]=[];u.skillCastAt=-999;s.update(0,0);u.shots++;s.visualTime+=1;
  s.update(0,0);heroFrames.push(s.heroSprites[0].texture.key);
  for(let i=0;i<7;i++){s.visualTime+=.084;s.update(0,0);heroFrames.push(s.heroSprites[0].texture.key);}
  const frames:string[]=[];m.effects.forEach((f:any)=>f.life=0);m.emit('shot',0,0,800,800,0xffffff,{visual:`${id}-projectile`,duration:.25});
  const fx=m.effects.find((f:any)=>f.life>0);let inside=true,ratio=true;
  for(const elapsed of [0,.084,.168]){fx.life=.25-elapsed;s.update(0,0);const p=s.fxSprites.find((p:any)=>p.visible);frames.push(p.texture.key);const b=p.getBounds();inside&&=b.left>=0&&b.top>=0&&b.right<=800&&b.bottom<=800;ratio&&=Math.abs(p.scaleX-p.scaleY)<1e-6;}
  for(const [x,y] of [[0,0],[0,126],[500,300],[800,477],[800,800]]){
   m.effects.forEach((f:any)=>f.life=0);m.emit('blast',x,y,x,y,0xffffff,{visual:`${id}-skill`,duration:.5});s.update(0,0);const p=s.fxSprites.find((p:any)=>p.visible),b=p.getBounds();inside&&=b.left>=0&&b.top>=0&&b.right<=800&&b.bottom<=800;
  }
  m.effects.forEach((f:any)=>f.life=0);m.emit('blast',e.x,e.y,e.x,e.y,0xffffff,{visual:`${id}-skill`,duration:.5});s.update(0,0);
  a.game.renderer.preRender();a.game.scene.render(a.game.renderer);a.game.renderer.postRender();
  // Let WebKit composite a normal RAF frame; manual WebGL draws alone can
  // produce a blank screenshot although scene objects and textures are valid.
  a.game.loop.wake();
  return {missing,skill,reaction,frames,heroFrames,inside,ratio};
 },id);
 expect(result.missing).toEqual([]);expect(result.skill).toBe(true);expect(result.reaction).toBe(true);
 expect(result.frames).toEqual([1,2,3].map(f=>`fx-${id}-projectile-${f}`));expect(result.inside).toBe(true);expect(result.ratio).toBe(true);
 expect(result.heroFrames).toEqual([1,2,3,4,5,6,7,8].map(f=>`hero-${id}-anim-${f}`));
 await page.waitForTimeout(120);
 await page.screenshot({path:`artifacts/visual-audit/combat-${info.project.name}-${id}.png`});expect(errors).toEqual([]);
});
