import {test,expect} from '@playwright/test';

test('all 44 operators use decoded square face portraits across roster and preparation',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 const assets=await page.evaluate(async()=>{
  const {heroes}=await import('/src/data/heroes.ts');const {heroPortraitPath}=await import('/src/ui/HeroPortraits.ts');const load=async(src:string)=>{const image=new Image();image.src=src;await image.decode();return {src:image.src,width:image.naturalWidth,height:image.naturalHeight};};
  return Promise.all(heroes.map((h:any)=>load(heroPortraitPath(h.id))));
 });
 expect(assets).toHaveLength(44);
 for(const asset of assets){expect(asset.width).toBe(asset.height);expect(asset.width).toBeGreaterThanOrEqual(256);expect(asset.src).toContain('/assets/face-icons/');}
 await page.locator('[data-action="hero"]').first().click();
 await expect(page.locator('[data-hero-card]')).toHaveCount(44);
 const cards=await page.locator('[data-hero-card] img').evaluateAll(images=>images.map(image=>(image as HTMLImageElement).getAttribute('src')));
 expect(cards.every(src=>src?.includes('/assets/face-icons/'))).toBe(true);
 if((page.viewportSize()?.width??1440)<=760){
  const roster=await page.locator('.hero-grid').boundingBox();const detail=await page.locator('.hero-detail').boundingBox();
  expect(roster).not.toBeNull();expect(detail).not.toBeNull();expect(detail!.y).toBeGreaterThanOrEqual(roster!.y+roster!.height);
 }
 await page.screenshot({path:`artifacts/face-collection-${info.project.name}.png`,fullPage:true});
 await page.evaluate(()=>(window as any).rift.navigate('stage'));
 await page.locator('[data-action="campaign-select"][data-id="1-1"]').click();
 await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await page.locator('[data-action="campaign-prep-role"][data-id="support"]').click();
 await expect(page.locator('.prep-roster [data-action="campaign-prep-toggle"]')).toHaveCount(8);
 const sources=await page.locator('.prep-roster img').evaluateAll(images=>images.map(image=>(image as HTMLImageElement).getAttribute('src')));
 expect(sources.every(src=>src?.includes('/assets/face-icons/'))).toBe(true);expect(errors).toEqual([]);
 await page.screenshot({path:`artifacts/illustration-roster-${info.project.name}.png`,fullPage:true});
});

