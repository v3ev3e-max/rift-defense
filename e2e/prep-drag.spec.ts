import {test,expect} from '@playwright/test';

test('drags a roster hero onto a pad and drags the deployed hero back to reserve',async({page},testInfo)=>{
 await page.goto('/');await page.evaluate(()=>{const a=(window as any).rift;a.save.data.tutorial=true;a.save.data.campaign.squad=['yuria'];a.save.persist();a.begin('1-1');});
 await page.waitForFunction(()=>!!(window as any).rift.game?.scene.getScene('Battle')?.ink);
 const card=page.locator('[data-drag-hero="yuria"]').last(),canvas=page.locator('#phaser-container canvas');
 const mobile=(page.viewportSize()?.width??1000)<600,webkitTouch=testInfo.project.name==='iphone-webkit';if(mobile&&!webkitTouch)await card.scrollIntoViewIfNeeded();
 const portrait=card.locator('img'),cb=await portrait.boundingBox();let field=await canvas.boundingBox();expect(cb&&field).toBeTruthy();
 const target={x:field!.x+field!.width*375/800,y:field!.y+field!.height*300/800};
 if(webkitTouch){
  await portrait.dispatchEvent('pointerdown',{pointerId:7,pointerType:'touch',button:0,clientX:cb!.x+10,clientY:cb!.y+10});
  await page.evaluate(({x,y})=>window.dispatchEvent(new PointerEvent('pointermove',{pointerId:7,pointerType:'touch',button:0,clientX:x,clientY:y,bubbles:true,cancelable:true})),target);
  await page.evaluate(({x,y})=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:7,pointerType:'touch',button:0,clientX:x,clientY:y,bubbles:true,cancelable:true})),target);
 }else{
  await page.mouse.move(cb!.x+cb!.width/2,cb!.y+cb!.height/2);await page.mouse.down();
  if(mobile){await page.mouse.move(cb!.x+cb!.width/2,30,{steps:10});await page.waitForTimeout(1400);field=await canvas.boundingBox();target.x=field!.x+field!.width*375/800;target.y=field!.y+field!.height*300/800;}
  await page.mouse.move(target.x,target.y,{steps:12});await page.mouse.up();
 }
 await expect.poll(()=>page.evaluate(()=>(window as any).rift.model.units.find((u:any)=>u.heroId==='yuria').slot)).toBe(0);
 const panel=await page.locator('#campaign-prep').boundingBox();expect(panel).toBeTruthy();
 if(webkitTouch)await page.evaluate(({x,y})=>{const a=(window as any).rift,s=a.game.scene.getScene('Battle'),u=a.model.units.find((v:any)=>v.heroId==='yuria'),sp=s.heroSprites[a.model.units.indexOf(u)],pointer={event:new PointerEvent('pointerup',{clientX:x,clientY:y}),worldX:u.x,worldY:u.y};s.input.emit('dragstart',pointer,sp);s.input.emit('dragend',pointer,sp);},{x:panel!.x+panel!.width/2,y:panel!.y+panel!.height/2});
 else {await page.mouse.move(target.x,target.y);await page.mouse.down();await page.mouse.move(panel!.x+panel!.width/2,panel!.y+panel!.height/2,{steps:14});await page.mouse.up();}
 await expect.poll(()=>page.evaluate(()=>(window as any).rift.model.units.some((u:any)=>u.heroId==='yuria'))).toBe(false);
 expect(await page.evaluate(()=>(window as any).rift.save.data.campaign.squad)).not.toContain('yuria');
});
