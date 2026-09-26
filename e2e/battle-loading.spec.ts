import {expect,test} from '@playwright/test';

test('전장 이미지가 준비될 때까지 로딩 화면을 유지한다',async({page},testInfo)=>{
  await page.route('**/assets/campaign/**',async route=>{
    await new Promise(resolve=>setTimeout(resolve,180));
    await route.continue();
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.locator('[data-action="stage"]').first().click();
  await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();
  await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();

  const loader=page.locator('#battle-loader');
  await expect(loader).toBeVisible();
  await expect(loader.locator('img')).toHaveAttribute('src',/assets\/lab\/core\.png/);
  await expect.poll(()=>loader.locator('img').evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true);
  await expect(page.locator('.battle-stage-shell > #phaser-container')).toHaveCount(1);
  await page.screenshot({path:`artifacts/battle-loading-${testInfo.project.name}.png`});

  await expect(page.locator('#phaser-container canvas')).toBeVisible({timeout:60_000});
  await expect(loader).toBeHidden({timeout:60_000});
  const size=await page.locator('#phaser-container canvas').boundingBox();
  expect(size?.width).toBeGreaterThan(300);
  expect(size?.height).toBeGreaterThan(300);

  await page.evaluate(()=>{const app=(window as any).rift;app.model.start();app.updateHud(true);});
  const cards=page.locator('.campaign-skill-card');
  await expect(cards).toHaveCount(5);
  const coverage=await cards.evaluateAll(nodes=>nodes.map(card=>{const box=card.getBoundingClientRect(),image=card.querySelector('img')!.getBoundingClientRect();return {width:image.width/box.width,height:image.height/box.height};}));
  for(const ratio of coverage){expect(ratio.width).toBeGreaterThan(.55);expect(ratio.height).toBeGreaterThan(.8);}
  await expect.poll(()=>page.evaluate(()=>{const app=(window as any).rift,scene=app.game.scene.getScene('Battle');return {full:app.model.units.every((u:any)=>u.hp===u.maxHp),visible:scene.heroHealthFrames.filter((v:any)=>v.visible).length,texture:scene.heroHealthFrames[0]?.texture.key};})).toEqual({full:true,visible:5,texture:'hero-health-frame'});
  const damageState=await page.evaluate(async()=>{const app=(window as any).rift,scene=app.game.scene.getScene('Battle'),unit=app.model.units[0],before=scene.heroHealthHitUntil[0]??0;app.model.hurtUnit(unit,unit.maxHp*.35);await new Promise(resolve=>setTimeout(resolve,80));return {actual:unit.hp,trail:scene.heroVisualHp[0],flashing:(scene.heroHealthHitUntil[0]??0)>before};});
  expect(damageState.trail).toBeGreaterThan(damageState.actual);
  expect(damageState.flashing).toBe(true);
});
