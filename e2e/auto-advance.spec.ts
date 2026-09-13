import {test,expect} from '@playwright/test';

test('AUTO next clears into the following map with the squad deployed and battle started',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="campaign-deploy"]').first().click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle'));
 await page.evaluate(()=>{const a=(window as any).rift;const slots=[3,5,0,2,4];['yuria','sera','reina','karin','arin'].forEach((id,i)=>a.placeCampaignHero(id,slots[i]));});
 await page.locator('[data-action="campaign-auto-advance"]').click();
 await expect(page.locator('#campaign-auto-advance-btn')).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>{const a=(window as any).rift;a.model.finish(true);a.updateHud(true);});
 await page.waitForFunction(()=>{const a=(window as any).rift;return a.model?.campaign?.id==='1-2'&&a.model.started===true;},undefined,{timeout:10000});
 const state=await page.evaluate(()=>{const a=(window as any).rift,m=a.model;return {stage:m.campaign.id,started:m.started,placed:m.units.filter((u:any)=>u.slot>=0).length,slots:m.units.map((u:any)=>u.slot),selected:a.save.data.campaign.selected,auto:a.save.data.campaign.autoAdvance};});
 expect(state).toEqual({stage:'1-2',started:true,placed:5,slots:[3,5,0,2,4],selected:'1-2',auto:true});
});
