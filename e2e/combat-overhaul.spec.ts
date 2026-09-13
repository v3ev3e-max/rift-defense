import {test,expect} from '@playwright/test';
test('new combat, skill controls, capacity and responsive statistics',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;a.save.persist();});
 await page.locator('[data-action="stage"]').first().click();await page.locator('[data-action="start-battle"]').click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const result=await page.evaluate(async()=>{
  const a=(window as any).rift,m=a.model,s=a.game.scene.getScene('Battle');a.game.loop.stop();s.callback=()=>{};m.units=[];m.gold=2000;
  const {attack,stepActions}=await import('/src/systems/ActionCombat.ts');
  const ids=['sera','noel','karin','luna','adela','ian'];for(const id of ids)m.addUnit(id,3);
  m.enemies.forEach((e:any)=>e.active=false);
  for(let i=0;i<12;i++){m.spawn('brute');const e=m.enemies[i];e.progress=120+i*35;m.map.pathPoint(e.progress,e);e.hp=e.maxHp=100000;}
  for(const u of m.units){const e=m.enemies.reduce((a:any,b:any)=>b.active&&Math.hypot(b.x-u.x,b.y-u.y)<Math.hypot(a.x-u.x,a.y-u.y)?b:a,m.enemies[0]);attack(m,u,e);}
  const actionKinds=[...new Set(m.actions.filter((v:any)=>v.active).map((v:any)=>v.kind))];
  m.time+=.3;stepActions(m,.3);m.selected=m.units[3].uid;m.units[3].skillCharge=100;s.update(0,0);a.updateHud(true);
  const alpha=s.textures.get('meteor-alpha').context.getImageData(0,0,256,358).data;let clear=0,opaque=0;for(let i=3;i<alpha.length;i+=4){clear+=Number(alpha[i]===0);opaque+=Number(alpha[i]>200);}
  return {actionKinds,clear,opaque,visibleDrones:s.actionSprites.filter((v:any)=>v.visible&&v.texture.key==='drone-body').length};
 });
 expect(result.actionKinds).toHaveLength(6);expect(result.visibleDrones).toBeGreaterThan(0);expect(result.clear).toBeGreaterThan(40000);expect(result.opaque).toBeGreaterThan(5000);
 await expect(page.locator('[data-action="upgrade-selected"]')).toHaveCount(0);
 await page.locator('[data-action="dps"]').click();await expect(page.locator('#dps-panel')).toBeVisible();
 expect(await page.evaluate(()=>(window as any).rift.model.capacity)).toBe(10);
 await expect(page.locator('#expand-btn')).toBeHidden();
 await page.locator('[data-action="skill"]').click();expect(await page.evaluate(()=>(window as any).rift.model.selectedUnit.priority)).toBe('boss');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.evaluate(()=>{const a=(window as any).rift;a.model.update=()=>{};a.game.loop.wake();a.updateHud(true);});await page.waitForTimeout(100);
 await page.screenshot({path:`artifacts/combat-overhaul-${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});
