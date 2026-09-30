import {test,expect} from '@playwright/test';

test('raid idle stays still, actions finish once, actors stay inside arena',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.evaluate(()=>{const app=(window as any).rift;app.navigate('raid');app.startRaid();clearInterval(app.raidTimer);});
 await page.waitForTimeout(850);
 const heroes=page.locator('.raid-hero-sprite'),boss=page.locator('.raid-boss-main');
 await expect(heroes).toHaveCount(5);await expect(boss).toHaveAttribute('data-pose','idle');
 const before=await heroes.evaluateAll(nodes=>nodes.map(el=>({style:(el as HTMLElement).style.cssText,rect:el.getBoundingClientRect().toJSON(),animations:el.getAnimations().length})));
 await page.waitForTimeout(1100);
 expect(await heroes.evaluateAll(nodes=>nodes.map(el=>({style:(el as HTMLElement).style.cssText,rect:el.getBoundingClientRect().toJSON(),animations:el.getAnimations().length})))).toEqual(before);
 expect(before.every(v=>v.animations===0)).toBe(true);
 await page.locator('[data-action="raid-manual"]').click();
 await expect(heroes.first()).toHaveAttribute('data-pose','skill');
 await page.waitForTimeout(900);await expect(heroes.first()).toHaveAttribute('data-pose','idle');
 await boss.evaluate(el=>el.setAttribute('data-stable','yes'));
 await page.evaluate(()=>{const app=(window as any).rift;app.raidRuntime.time=169;app.tickRaid(500);});
 await expect(boss).toHaveAttribute('data-stable','yes');
 const clipped=await page.locator('.raid-arena').evaluate(arena=>{
  const a=arena.getBoundingClientRect();return [...arena.querySelectorAll('.raid-hero-sprite,.raid-boss-main')].filter(el=>{const b=el.getBoundingClientRect();return b.left<a.left-1||b.right>a.right+1||b.top<a.top-1||b.bottom>a.bottom+1||Math.abs(b.width-b.height)>1;}).map(el=>el.className);
 });expect(clipped).toEqual([]);expect(errors).toEqual([]);
 const feet=await page.locator('.raid-hero-sprite,.raid-boss-main').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect(),id=(el as HTMLElement).dataset.boss;const inset=!id||id==='gale-colossus'?.140625:['void-observer','machine-god'].includes(id)?.119140625:.158203125;return r.bottom-r.height*inset;}));
 expect(Math.max(...feet)-Math.min(...feet)).toBeLessThan(2);
 await page.screenshot({path:`artifacts/raid-one-shot-${info.project.name}.png`});
});

test('all 44 heroes have decodable idle and finite skill tracks',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const load=(path:string)=>import(/* @vite-ignore */path);
  const {heroes}=await load('/src/data/heroes.ts');
  const {playRaidPose}=await load('/src/ui/RaidAnimations.ts');
  const failures:string[]=[];
  for(const hero of heroes){
   const el=document.createElement('span');el.dataset.hero=hero.id;document.body.append(el);
   for(const state of ['idle','attack','skill']){
    const im=new Image();im.src=`/assets/generated/raid-v4/heroes/${hero.id}/${state}.webp`;try{await im.decode();if(im.width/im.height!==({idle:1,attack:8,skill:6} as any)[state])failures.push(hero.id+state);}catch{failures.push(hero.id+state);}
   }
   Object.assign(el.style,{position:'fixed',top:'150px',left:'100px',display:'block',width:'100px',height:'100px'});
   playRaidPose(el,'skill',100);await new Promise(r=>setTimeout(r,300));if(el.dataset.pose!=='idle'||el.getAnimations().length)failures.push(hero.id+' did not return idle');el.remove();
  }return failures;
 });expect(result).toEqual([]);
});
