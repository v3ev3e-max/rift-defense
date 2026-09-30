import {test,expect} from '@playwright/test';
test('all hero skill effects resolve to their own artwork and clean up',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const load=(p:string)=>import(/* @vite-ignore */p);
  const {heroes}=await load('/src/data/heroes.ts');
  const {formationRole}=await load('/src/data/combatRoles.ts');
  const {heroSkillEffects}=await load('/src/game/HeroSkillEffects.ts');
  const {raidHeroActions}=await load('/src/ui/RaidAnimations.ts');
  const root=document.createElement('div');
  root.innerHTML='<div class="raid-arena" style="position:fixed;width:320px;height:400px;left:0;top:0"><span class="raid-boss-main" style="display:block;width:100px;height:100px"></span></div>';
  document.body.append(root);
  const failures:string[]=[];
  for(const h of heroes){
   const fx=heroSkillEffects(h.id);
   for(const path of [...fx.impact,fx.projectile]){const im=new Image();im.src=path;try{await im.decode();}catch{failures.push(path);}}
   const fighter=document.createElement('div');fighter.className=`raid-fighter ${formationRole(h.id)}`;
   fighter.innerHTML=`<span class="raid-hero-sprite" data-hero="${h.id}" style="display:block;width:60px;height:60px"></span>`;
   root.querySelector('.raid-arena')!.append(fighter);
   raidHeroActions(root,true);
   if(!root.querySelector(`[data-skill-owner="${h.id}"]`))failures.push(h.id+' missing effect');
   fighter.remove();
  }
  await new Promise(r=>setTimeout(r,1500));
  if(root.querySelector('.raid-owned-skill-effect'))failures.push('effect leaked');
  root.remove();return failures;
 });
 expect(result).toEqual([]);
});
