import {test,expect} from '@playwright/test';
test('all21 rendered launch poses use weapon or drone sockets and preserve flight origins',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;a.save.persist();});
 await page.evaluate(()=>(window as any).rift.begin('1-1'));await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const result=await page.evaluate(async()=>{
 const app=(window as any).rift,m=app.model,s=app.game.scene.getScene('Battle');app.game.loop.stop();s.callback=()=>{};
 const {attack}=await import('/src/systems/ActionCombat.ts'),{weaponPoint,dronePoint,poseSize}=await import('/src/game/WeaponSockets.ts'),{heroes}=await import('/src/data/heroes.ts');
 const failures:string[]=[];let checked=0;
 for(const h of heroes)for(const direction of ['left','right','up']){
 m.units=[];m.actions.forEach((a:any)=>a.active=false);const u=m.addUnit(h.id);m.enemies.forEach((e:any)=>e.active=false);m.spawn('brute');const e=m.enemies[0];e.hp=e.maxHp=1e8;e.x=u.x+(direction==='left'?-90:direction==='right'?90:0);e.y=u.y-(direction==='up'?90:0);
 s.update(0,0);attack(m,u,e);s.update(0,0);const a=m.actions.find((a:any)=>a.active)!;
 const p=a.kind==='drone'?dronePoint(u,m.time):weaponPoint(h.id,u,!!u.facingUp,!!u.facingLeft,1);
 if(Math.hypot(a.x-p.x,a.y-p.y)>.01)failures.push(h.id+'/'+direction);
 if(Math.abs(s.heroSprites[0].displayWidth-poseSize(h.id,direction==='up'))>.01)failures.push(h.id+'/size');
 const origin=[a.x,a.y];u.x+=100;s.update(0,0);if(a.x!==origin[0]||a.y!==origin[1])failures.push(h.id+'/moving');checked++;
 }
 return {checked,failures};});
 expect(result.checked).toBe(63);expect(result.failures).toEqual([]);expect(errors).toEqual([]);
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
test('Serin curse beam animates through all three projectile frames',async({page})=>{
 await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;});
 await page.evaluate(()=>(window as any).rift.begin('1-1'));await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const frames=await page.evaluate(async()=>{const app=(window as any).rift,m=app.model,s=app.game.scene.getScene('Battle');app.game.loop.stop();s.callback=()=>{};m.units=[];m.enemies.forEach((e:any)=>e.active=false);m.actions.forEach((a:any)=>a.active=false);const {attack,stepActions}=await import('/src/systems/ActionCombat.ts');const u=m.addUnit('serin');m.spawn('brute');const e=m.enemies.find((v:any)=>v.active);e.x=u.x+100;e.y=u.y;e.hp=e.maxHp=1e8;attack(m,u,e);stepActions(m,.2);const fx=m.effects.find((f:any)=>f.visual==='serin-projectile'),out:string[]=[];for(const progress of [.05,.4,.75]){fx.life=fx.duration*(1-progress);s.update(0,0);out.push(s.fxSprites.find((sp:any)=>sp.visible&&sp.texture.key.startsWith('fx-serin-projectile-'))?.texture.key??'');}return out;});
 expect(frames).toEqual(['fx-serin-projectile-1','fx-serin-projectile-2','fx-serin-projectile-3']);
});
