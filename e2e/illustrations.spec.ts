import {test,expect} from '@playwright/test';

test('all operator screens and summon cards use the normalized illustrations',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 const assets=await page.evaluate(async()=>{
  const {heroes}=await import('/src/data/heroes.ts');const load=async(src:string)=>{const image=new Image();image.src=src;await image.decode();return {src:image.src,width:image.naturalWidth,height:image.naturalHeight};};
  return Promise.all(heroes.flatMap((h:any)=>[load(`/assets/illustrations/${h.id}.webp`),load(`/assets/summon-icons/${h.id}.webp`),load(`/assets/face-icons/${h.id}.webp`)]));
 });
 expect(assets).toHaveLength(29*3);
 for(let i=0;i<assets.length;i+=3){expect([assets[i].width,assets[i].height]).toEqual([576,768]);expect([assets[i+1].width,assets[i+1].height]).toEqual([256,256]);expect([assets[i+2].width,assets[i+2].height]).toEqual([256,256]);}
 await page.locator('[data-action="hero"]').first().click();
 await expect(page.locator('[data-hero-card]')).toHaveCount(29);
 await page.locator('[data-action="stage"]').first().click();
 await page.locator('[data-action="campaign-select"][data-id="1-1"]').click();
 await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await expect(page.locator('.prep-roster [data-action="campaign-prep-toggle"]')).toHaveCount(29);
 const sources=await page.locator('.prep-roster img').evaluateAll(images=>images.map(image=>(image as HTMLImageElement).getAttribute('src')));
 expect(sources.every(src=>src?.includes('/assets/face-icons/'))).toBe(true);expect(errors).toEqual([]);
 await page.screenshot({path:`artifacts/illustration-roster-${info.project.name}.png`,fullPage:true});
});

