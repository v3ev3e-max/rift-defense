import {test,expect} from '@playwright/test';

test('AUTO next clears into the following map with the squad deployed and battle started',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="campaign-deploy"]').first().click();
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle'));
 await page.evaluate(()=>{const a=(window as any).rift;const slots=[3,5,0,2,4];['yuria','sera','reina','karin','arin'].forEach((id,i)=>a.placeCampaignHero(id,slots[i]));});
 await page.locator('[data-action="campaign-auto-advance"]').click();
 await expect(page.locator('#campaign-auto-advance-btn')).toHaveAttribute('aria-pressed','true');
 const previousLayout=await page.evaluate(()=>Object.fromEntries((window as any).rift.model.units.map((u:any)=>[u.heroId,u.slot])));
 await page.evaluate(()=>{const a=(window as any).rift;a.model.finish(true);a.updateHud(true);});
 await page.waitForFunction(()=>{const a=(window as any).rift;return a.model?.campaign?.id==='1-2'&&a.model.started===true;},undefined,{timeout:10000});
 const state=await page.evaluate(()=>{const a=(window as any).rift,m=a.model;return {stage:m.campaign.id,started:m.started,placed:m.units.filter((u:any)=>u.slot>=0).length,slots:m.units.map((u:any)=>u.slot),selected:a.save.data.campaign.selected,auto:a.save.data.campaign.autoAdvance};});
 expect(state).toMatchObject({stage:'1-2',started:true,placed:5,selected:'1-2',auto:true});
 expect(await page.evaluate(()=>Object.fromEntries((window as any).rift.model.units.map((u:any)=>[u.heroId,u.slot])))).toEqual(previousLayout);
});

test('AUTO next crosses from region 4 into region 5 and stays enabled',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{const a=(window as any).rift;for(const stage of (await import('/src/data/campaign.ts')).campaignStages.filter((s:any)=>Number(s.id.split('-')[0])<=4))a.save.data.campaign.records[stage.id]={stars:3,time:1,kills:1};a.save.data.campaign.autoAdvance=true;a.save.data.campaign.squad=['yuria','sera','reina','noel','arin'];await a.begin('4-10',true);a.model.autoDeployCampaign();a.model.start();a.updateHud(true);});
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle'));
 await page.evaluate(()=>{const a=(window as any).rift;a.model.finish(true);a.updateHud(true);});
 await page.waitForFunction(()=>{const a=(window as any).rift;return a.model?.campaign?.id==='5-1'&&a.model.started===true;},undefined,{timeout:12_000});
 const state=await page.evaluate(()=>{const a=(window as any).rift;return {stage:a.model.campaign.id,auto:a.save.data.campaign.autoAdvance,placed:a.model.units.filter((u:any)=>u.slot>=0).length};});
 expect(state).toEqual({stage:'5-1',auto:true,placed:5});
});
