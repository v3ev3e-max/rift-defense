import {chromium,webkit,devices,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const rows=[];
for(const [name,engine,options] of [['PC',chromium,{viewport:{width:1440,height:810}}],['Android',chromium,devices['Pixel 7']],['iPhone',webkit,devices['iPhone 13']]]){
 const browser=await engine.launch(),p=await browser.newPage(options);
 await p.goto('http://127.0.0.1:5173');await p.locator('[data-action="stage"]').first().click();await p.locator('[data-action="start-battle"]').click();await p.waitForFunction(()=>!!window.rift.game?.scene.getScene('Battle')?.ink);await p.locator('[data-action="tutorial-skip"]').click();
 const result=await p.evaluate(()=>{const a=window.rift,m=a.model,s=a.game.scene.getScene('Battle');const empty=document.querySelector('#selected-growth').getBoundingClientRect().height; m.summonAt(0);m.selected=m.units[0].uid;a.updateHud(true);s.update(0,0);const c=document.querySelector('canvas').getBoundingClientRect();const panel=document.querySelector('#selected-growth').getBoundingClientRect();return {viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,canvasRatio:c.width/c.height,heightDelta:panel.height-empty,selectedPad:s.selectedPad.visible,missing:['pad','selected','entry','core'].filter(n=>!s.textures.exists('lab-'+n))};});
 expect(result.overflow).toBe(false);expect(result.canvasRatio).toBeCloseTo(1,3);expect(result.heightDelta).toBeLessThanOrEqual(1);expect(result.selectedPad).toBe(true);expect(result.missing).toEqual([]);
 rows.push({name,...result});await browser.close();
}writeFileSync('artifacts/lab-layout.json',JSON.stringify(rows,null,2));console.log(rows);
