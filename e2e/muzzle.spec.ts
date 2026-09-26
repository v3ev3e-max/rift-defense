import {test,expect} from '@playwright/test';
test('all rendered launch poses use weapon or drone sockets and preserve flight origins',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;a.save.persist();});
 await page.evaluate(()=>(window as any).rift.begin('1-1'));await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const result=await page.evaluate(async()=>{
 const app=(window as any).rift,m=app.model,s=app.game.scene.getScene('Battle');app.game.loop.stop();s.callback=()=>{};
 const {attack}=await import('/src/systems/ActionCombat.ts'),{weaponPoint,dronePoint}=await import('/src/game/WeaponSockets.ts'),{heroes}=await import('/src/data/heroes.ts');
 const failures:string[]=[];let checked=0;
 for(const h of heroes)for(const direction of ['left','right','up']){
 m.units=[];m.actions.forEach((a:any)=>a.active=false);const u=m.addUnit(h.id);m.enemies.forEach((e:any)=>e.active=false);m.spawn('brute');const e=m.enemies[0];e.hp=e.maxHp=1e8;e.x=u.x+(direction==='left'?-90:direction==='right'?90:0);e.y=u.y-(direction==='up'?90:0);
 s.update(0,0);attack(m,u,e);s.update(0,0);const a=m.actions.find((a:any)=>a.active)!;
 const p=a.kind==='drone'?dronePoint(u,m.time):weaponPoint(h.id,u,!!u.facingUp,!!u.facingLeft,1);
 if(Math.hypot(a.x-p.x,a.y-p.y)>.01)failures.push(h.id+'/'+direction);
 if(!Number.isFinite(s.heroSprites[0].displayWidth)||s.heroSprites[0].displayWidth<70||s.heroSprites[0].displayWidth>160)failures.push(h.id+'/size');
 const origin=[a.x,a.y];u.x+=100;s.update(0,0);if(a.x!==origin[0]||a.y!==origin[1])failures.push(h.id+'/moving');checked++;
 }
 return {checked,expected:heroes.length*3,failures};});
 expect(result.checked).toBe(result.expected);expect(result.failures).toEqual([]);expect(errors).toEqual([]);
});
test('rapid gunfire hides projectiles and renders only target impacts',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;});
 await page.evaluate(()=>(window as any).rift.begin('1-1'));await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const result=await page.evaluate(async()=>{const app=(window as any).rift,m=app.model,s=app.game.scene.getScene('Battle');app.game.loop.stop();s.callback=()=>{};m.update=()=>{};m.units=[];m.enemies.forEach((e:any)=>e.active=false);m.actions.forEach((a:any)=>a.active=false);
  const {attack,stepActions}=await import('/src/systems/ActionCombat.ts');m.selectedSlot=0;const u=m.addUnit('sera');m.spawn('sprinter');const e=m.enemies.find((v:any)=>v.active);e.progress=150;m.map.pathPoint(e.progress,e);e.hp=e.maxHp=1e8;attack(m,u,e);s.update(0,0);
  const hiddenBefore=m.actions.filter((v:any)=>v.active&&v.kind==='burst').every((a:any)=>!s.actionSprites[m.actions.indexOf(a)].visible&&!s.aimSprites[m.actions.indexOf(a)].visible);stepActions(m,.15);s.update(0,0);
  const visible=s.fxSprites.filter((sp:any)=>sp.visible).map((sp:any)=>sp.texture.key);app.game.loop.wake();return {hiddenBefore,visible};});
 expect(result.hiddenBefore).toBe(true);expect(result.visible.some((key:string)=>key.startsWith('fx-sera-impact-'))).toBe(true);expect(errors).toEqual([]);
 await page.waitForTimeout(100);await page.screenshot({path:`artifacts/bullet-flight-${info.project.name}.png`});
});
test('Serin curse beam provides all three dedicated projectile frames',async({page})=>{
 await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;});
 await page.evaluate(()=>(window as any).rift.begin('1-1'));await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const frames=await page.evaluate(()=>{const app=(window as any).rift,s=app.game.scene.getScene('Battle');app.game.loop.stop();return [1,2,3].map(n=>{const key=`fx-serin-projectile-${n}`,source=s.textures.get(key).getSourceImage();return {key,width:source.width,height:source.height};});});
 expect(frames.map((frame:any)=>frame.key)).toEqual(['fx-serin-projectile-1','fx-serin-projectile-2','fx-serin-projectile-3']);expect(frames.every((frame:any)=>frame.width>0&&frame.height>0)).toBe(true);
});
