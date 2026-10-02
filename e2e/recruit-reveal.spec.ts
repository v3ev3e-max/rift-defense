import {test,expect} from '@playwright/test';
test('paid recruitment commits once and restores styles',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{const a=(window as any).rift;a.save.data.equipmentGold=2000;a.persist();a.render();});
 await page.locator('[data-action="recruit"]').click();
 const before=await page.evaluate(()=>({body:document.body.getAttribute('style'),html:document.documentElement.getAttribute('style'),y:scrollY}));
 await page.locator('[data-action="recruit-pull"][data-id="10"]').click();
 await expect(page.locator('.reveal-card')).toHaveCount(10);
 expect(await page.evaluate(()=>document.querySelectorAll('.reveal-card:not(:disabled)').length)).toBe(0);
 await page.evaluate(()=>(window as any).rift.action('recruit-pull','10'));
 expect(await page.evaluate(()=>(window as any).rift.save.data.equipmentGold)).toBe(1100);
 await page.locator('[data-reveal="skip"]').click();
 await expect(page.locator('.reveal-card.revealed')).toHaveCount(10);
 await page.locator('[data-reveal="close"]').click();
 expect(await page.evaluate(()=>({body:document.body.getAttribute('style'),html:document.documentElement.getAttribute('style'),y:scrollY}))).toEqual(before);
});
test('SR gold and SSR prism reveal for three seconds',async({page},info)=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 for(const [grade,tier] of [['S','sr'],['SR','ssr']] as const){
  await page.evaluate(g=>(window as any).rift.action('dev-recruit',g),grade);
  await expect(page.locator(`.settled .reveal-${tier}`)).toBeVisible();
  await page.locator('[data-card="0"]').click();
  await expect(page.locator(`.focus-${tier}`)).toBeVisible();
  await expect(page.locator('.reveal-hero small')).toHaveText(tier.toUpperCase());
  await page.waitForTimeout(650);
  const fx=page.locator('.reveal-fx-image');
  await expect(fx).toHaveAttribute('data-sequence',`${tier}-reveal`);
  const beforeFrame=await fx.getAttribute('data-frame');
  await page.waitForTimeout(450);
  expect(await fx.getAttribute('data-frame')).not.toBe(beforeFrame);
  expect(await fx.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth===512)).toBe(true);
  expect(await fx.evaluate(img=>getComputedStyle(img).animationName)).toBe('none');
  expect(await page.locator('.reveal-hero img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  expect(await page.locator('.reveal-hero img').evaluate(img=>{const r=img.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
  await page.screenshot({path:`artifacts/recruit-${tier}-${info.project.name}.png`});
  await expect(page.locator('.reveal-focus')).toBeHidden({timeout:4500});
  await page.locator('[data-reveal="close"]').click();
 }
});
test('ten-card combinations fit portrait landscape and short viewports',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 for(const grades of [Array(10).fill('B'),['S',...Array(9).fill('A')],Array(10).fill('S'),['SR',...Array(9).fill('B')],['S','SR',...Array(8).fill('A')],Array(10).fill('SR')]){
  await page.evaluate(async gs=>{const {heroes}=await import('/src/data/heroes.ts');const a=(window as any).rift;a.showRecruit(gs.map((g:string)=>({hero:heroes.find((h:any)=>h.grade===g),grade:g,displayGrade:g==='SR'?'SSR':g==='S'?'SR':g,newHero:false,fragments:1})));},grades);
  await expect(page.locator('.settled')).toBeVisible();
  for(const size of [{width:390,height:844},{width:844,height:390},{width:640,height:320}]){
   await page.setViewportSize(size);
   expect(await page.evaluate(()=>{const root=document.querySelector('.recruit-reveal')!;return root.scrollWidth<=root.clientWidth+1&&root.scrollHeight<=root.clientHeight+1&&Array.from(root.querySelectorAll('.reveal-card,footer button')).every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;});})).toBe(true);
  }
  await page.locator('[data-reveal="skip"]').click();
  await expect(page.locator('.reveal-card.revealed')).toHaveCount(10);
  await page.locator('[data-reveal="close"]').click();
 }
});
test('queued reveal, interrupt, reduced motion and navigation cleanup',async({page},info)=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(async()=>{const {heroes}=await import('/src/data/heroes.ts');(window as any).rift.showRecruit(['S','SR',...Array(8).fill('B')].map(g=>({hero:heroes.find((h:any)=>h.grade===g),grade:g,displayGrade:g==='SR'?'SSR':g==='S'?'SR':g,newHero:false,fragments:1})));});
 await expect(page.locator('.settled')).toBeVisible();
 await page.screenshot({path:`artifacts/recruit-ten-${info.project.name}.png`});
 await page.locator('[data-reveal="all"]').click();
 await expect(page.locator('.focus-sr')).toBeVisible();
 await expect(page.locator('.focus-ssr')).toBeVisible({timeout:4500});
 await page.locator('[data-reveal="skip"]').click();
 await expect(page.locator('.reveal-card.revealed')).toHaveCount(10);
 await page.waitForTimeout(3200);
 await expect(page.locator('.reveal-focus')).toBeHidden();
 await page.evaluate(()=>(window as any).rift.render());
 await expect(page.locator('.recruit-reveal')).toHaveCount(0);
 expect(await page.evaluate(()=>document.body.style.position)).not.toBe('fixed');
 expect(await page.evaluate(()=>(window as any).rift.modalType)).not.toBe('recruit-result');
});
