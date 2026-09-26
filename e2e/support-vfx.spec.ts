import {test,expect} from '@playwright/test';

test('all five support skills load and animate their generated four-frame images',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{const app=(window as any).rift;app.save.data.campaign.squad=['rhea','echo','meriel','selene','ophilia'];app.save.persist();app.begin('1-1',true);});
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const result=await page.evaluate(()=>{const app=(window as any).rift,m=app.model,scene=app.game.scene.getScene('Battle'),ids=['rhea','echo','meriel','selene','ophilia'];m.update=()=>{};m.autoDeployCampaign();m.effects.forEach((f:any)=>f.life=0);ids.forEach((id:string,index:number)=>m.emit('blast',180+index*105,400,180+index*105,400,0xffffff,{visual:`support-skill-${id}`,duration:.9,radius:55}));const hero=m.units[0];hero.skillEffectDuration=5;hero.skillEffectUntil=m.time+5;scene.update(0,0);return {missing:ids.flatMap((id:string)=>[1,2,3,4].filter(frame=>!scene.textures.exists(`support-skill-${id}-${frame}`)).map(frame=>`${id}-${frame}`)),gaugeTexture:scene.textures.exists('skill-duration-gauge'),gaugeVisible:scene.heroSkillDurationGauges.some((sprite:any)=>sprite.visible),visible:scene.fxSprites.filter((sprite:any)=>sprite.visible).map((sprite:any)=>sprite.texture.key)};});
 expect(result.missing).toEqual([]);expect(result.gaugeTexture).toBe(true);expect(result.gaugeVisible).toBe(true);for(const id of ['rhea','echo','meriel','selene','ophilia'])expect(result.visible).toContain(`support-skill-${id}-1`);expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
});
