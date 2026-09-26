import {test,expect} from '@playwright/test';

test('all operator screens and summon cards use the normalized illustrations',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 const assets=await page.evaluate(async()=>{
  const {heroes}=await import('/src/data/heroes.ts');const renewed=new Set(['rhea','echo','meriel','selene','ophilia']);const load=async(src:string)=>{const image=new Image();image.src=src;await image.decode();return {src:image.src,width:image.naturalWidth,height:image.naturalHeight};};
  return Promise.all(heroes.flatMap((h:any)=>[load(`/assets/illustrations/${h.id}${renewed.has(h.id)?'-v2.png':'.webp'}`),load(renewed.has(h.id)?`/assets/illustrations/${h.id}-v2.png`:`/assets/summon-icons/${h.id}.webp`),load(`/assets/face-icons/${h.id}.${h.id==='hana'||h.id==='celestia'?'png':'webp'}`)]));
 });
 expect(assets.length%3).toBe(0);
 for(let i=0;i<assets.length;i+=3){expect(assets[i].width).toBeGreaterThanOrEqual(576);expect(assets[i].height).toBeGreaterThanOrEqual(768);if(assets[i+1].src.includes('-v2.png')){expect(assets[i+1].width).toBeGreaterThanOrEqual(576);}else{expect(assets[i+1].width).toBe(assets[i+1].height);expect(assets[i+1].width).toBeGreaterThanOrEqual(256);}expect(assets[i+2].width).toBe(assets[i+2].height);expect(assets[i+2].width).toBeGreaterThanOrEqual(256);}
 await page.locator('[data-action="hero"]').first().click();
 await expect(page.locator('[data-hero-card]')).toHaveCount(34);
 await page.evaluate(()=>(window as any).rift.navigate('stage'));
 await page.locator('[data-action="campaign-select"][data-id="1-1"]').click();
 await page.locator('.campaign-stage [data-action="campaign-deploy"]').click();
 await page.locator('[data-action="campaign-prep-role"][data-id="support"]').click();
 await expect(page.locator('.prep-roster [data-action="campaign-prep-toggle"]')).toHaveCount(5);
 const sources=await page.locator('.prep-roster img').evaluateAll(images=>images.map(image=>(image as HTMLImageElement).getAttribute('src')));
 expect(sources.every(src=>src?.includes('-v2.png'))).toBe(true);expect(errors).toEqual([]);
 await page.screenshot({path:`artifacts/illustration-roster-${info.project.name}.png`,fullPage:true});
});

