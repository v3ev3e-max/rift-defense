import {test,expect} from '@playwright/test';

test('all primary menus share one fixed viewport with internal scrolling only',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 for(const screen of ['home','hero','deck','stage','inventory','settings']){
  await page.evaluate((name)=>{const app=(window as any).rift;app.navigate(name);},screen);
  const dimensions=await page.evaluate(()=>{const shell=document.querySelector('.app-shell')!.getBoundingClientRect(),screen=document.querySelector('#screen')!.getBoundingClientRect(),section=document.querySelector('#screen>section')!.getBoundingClientRect();return {doc:document.documentElement.scrollHeight,view:innerHeight,shellTop:shell.top,shellBottom:shell.bottom,screenTop:screen.top,screenBottom:screen.bottom,sectionTop:section.top,sectionBottom:section.bottom,horizontal:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1};});
  expect(dimensions.doc,screen).toBeLessThanOrEqual(dimensions.view+1);
  expect(dimensions.shellTop,screen).toBeGreaterThanOrEqual(0);
  expect(dimensions.shellBottom,screen).toBeLessThanOrEqual(dimensions.view+1);
  expect(dimensions.sectionTop,screen).toBeGreaterThanOrEqual(dimensions.screenTop-1);
  expect(dimensions.sectionBottom,screen).toBeLessThanOrEqual(dimensions.screenBottom+1);
  expect(dimensions.horizontal,screen).toBe(true);
  if(screen==='home'){
   const heroLayout=await page.evaluate(()=>{const title=document.querySelector('.home-copy h1')!.getBoundingClientRect(),actions=document.querySelector('.home-actions')!.getBoundingClientRect();return {titleBottom:title.bottom,actionsTop:actions.top,actionsBottom:actions.bottom,screenBottom:document.querySelector('#screen')!.getBoundingClientRect().bottom};});
   expect(heroLayout.titleBottom,'home title must not overlap its actions').toBeLessThanOrEqual(heroLayout.actionsTop+1);
   expect(heroLayout.actionsBottom,'home actions must remain visible').toBeLessThanOrEqual(heroLayout.screenBottom+1);
  }
 }
 await page.evaluate(()=>{const app=(window as any).rift;app.navigate('inventory');});
 await page.screenshot({path:`artifacts/ui-viewport-items-${testInfo.project.name}.png`});
 expect(errors).toEqual([]);
});
