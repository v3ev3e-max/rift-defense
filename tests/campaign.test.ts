import {describe,it,expect} from 'vitest';
import {campaignStages,campaignWave,pathExposure,regionalMidBoss,regionalFinalBoss,frontlineSlots} from '../src/data/campaign';
import {enemies} from '../src/data/enemies';
import {combatRange} from '../src/data/balance';
import {heroes,heroById} from '../src/data/heroes';
import {battleTimeScale,BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {parseSave} from '../src/systems/SaveSystem';
import {formationComplete,formationRole,formationSort} from '../src/data/combatRoles';
describe('campaign foundations',()=>{
 it('returns a deployed operator to reserve before battle without removing the squad member',()=>{
  const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],['yuria'],true);
  const u=m.units[0];expect(m.move(u.uid,0)).toBe(true);expect(u.slot).toBe(0);
  expect(m.reserveCampaignUnit(u.uid)).toBe(true);expect(u.slot).toBe(-1);expect(m.units).toHaveLength(1);
 });
 it('starts the test collection with all operators while keeping the five protagonists together',()=>{const s=defaultSave(),owned=heroes.filter(h=>s.heroes[h.id].owned);expect(owned).toHaveLength(heroes.length);expect(s.campaign!.squad).toEqual(['yuria','reina','sera','noel','arin']);expect(s.campaign!.squad.map(formationRole)).toEqual(['tank','dealer','dealer','sniper','sniper']);expect(formationComplete(s.campaign!.squad)).toBe(true);});
 it('migrates the old Karin starter party to the five-protagonist party',()=>{const s=defaultSave();s.campaign!.squad=['yuria','sera','reina','karin','arin'];expect(parseSave(JSON.stringify(s)).campaign?.squad).toEqual(['yuria','reina','sera','noel','arin']);});
 it('keeps campaign auto advance off by default and migrates the saved toggle',()=>{expect(defaultSave().campaign?.autoAdvance).toBe(false);const saved=defaultSave();saved.campaign!.autoAdvance=true;expect(parseSave(JSON.stringify(saved)).campaign?.autoAdvance).toBe(true);});
 it('assigns and sorts all thirty-four operators by formation position then grade',()=>{const sorted=[...heroes].sort(formationSort);expect(sorted).toHaveLength(34);expect(sorted.every(h=>['tank','dealer','sniper','support'].includes(formationRole(h.id)))).toBe(true);expect(sorted.map(h=>formationRole(h.id))).toEqual([...sorted.map(h=>formationRole(h.id))].sort((a,b)=>({tank:0,dealer:1,sniper:2,support:3}[a]-{tank:0,dealer:1,sniper:2,support:3}[b])));});
 it('provides the designed support grade distribution',()=>{expect(heroes.filter(h=>formationRole(h.id)==='support').map(h=>h.grade).sort()).toEqual(['A','B','B','S','SR']);});
 it('auto-deploys both protagonist snipers on rear pads while Yuria holds FRONT',()=>{const s=defaultSave(),m=new BattleModel(s);m.configureCampaign(campaignStages[0],s.campaign!.squad,true);expect(m.autoDeployCampaign()).toBe(true);expect(m.units.find(u=>u.heroId==='yuria')?.slot).toBe(4);expect(m.units.filter(u=>formationRole(u.heroId)==='sniper').map(u=>u.slot).sort()).toEqual([0,3]);expect(m.units.filter(u=>formationRole(u.heroId)==='dealer').map(u=>u.slot).sort()).toEqual([1,2]);expect(m.units.some(u=>u.slot===5)).toBe(false);});
 it('restores the exact previous deployment for AUTO next instead of recomputing positions',()=>{const s=defaultSave(),layout={yuria:2,reina:1,sera:5,noel:0,arin:3};const m=new BattleModel(s);m.configureCampaign(campaignStages[1],s.campaign!.squad,true);expect(m.deployCampaignLayout(layout)).toBe(true);expect(Object.fromEntries(m.units.map(u=>[u.heroId,u.slot]))).toEqual(layout);});
 it('puts a melee dealer on the upper lane edge inside the FRONT interception point',()=>{const m=new BattleModel(defaultSave());m.configureCampaign(campaignStages[0],['yuria','karin'],true);expect(m.autoDeployCampaign()).toBe(true);const karin=m.units.find(u=>u.heroId==='karin')!,front=campaignStages[0].map.slots[4];expect(karin.slot).toBe(1);expect(Math.hypot(karin.x-front.x,karin.y-front.y)).toBeLessThanOrEqual(m.stats(karin).range);});
 it('migrates squad and records safely while preserving a valid partial free formation',()=>{const s=defaultSave();expect(parseSave(JSON.stringify({...s,campaign:undefined})).campaign?.squad).toHaveLength(5);expect(parseSave(JSON.stringify({...s,campaign:{squad:['sera','sera','missing'],records:{'1-1':{stars:9,time:50,kills:10}}}})).campaign).toMatchObject({squad:['sera'],records:{'1-1':{stars:3}}});});
 it('migrates at most three valid deployment presets with unique heroes and slots',()=>{const s=defaultSave(),p={squad:['yuria','sera'],layout:{yuria:4,sera:1}},saved=parseSave(JSON.stringify({...s,campaign:{...s.campaign,deploymentPresets:[p,{squad:['sera','sera'],layout:{sera:0}},{squad:['yuria','sera'],layout:{yuria:2,sera:2}},p]}}));expect(saved.campaign?.deploymentPresets).toEqual([p,{squad:['sera'],layout:{sera:0}},null]);});
 it('keeps three editable deployment preset names and migrates safe custom names',()=>{const s=defaultSave();expect(s.campaign?.deploymentPresetNames).toEqual(['프리셋 1','프리셋 2','프리셋 3']);const saved=parseSave(JSON.stringify({...s,campaign:{...s.campaign,deploymentPresetNames:['보스 공략','  속공  ','']}}));expect(saved.campaign?.deploymentPresetNames).toEqual(['보스 공략','속공','프리셋 3']);});
 it('allows any unique one-to-five operator composition, including duplicate roles, on six unrestricted pads',()=>{for(const ids of [['arin'],['arin','noel','serin','aurora'],['yuria','mia','leon','neris','livia']]){expect(formationComplete(ids)).toBe(true);const m=new BattleModel(defaultSave());m.configureCampaign(campaignStages[0],ids,true);expect(m.autoDeployCampaign()).toBe(true);expect(new Set(m.units.map(u=>u.slot)).size).toBe(ids.length);expect(m.units.every(u=>u.slot>=0&&m.map.slots[u.slot].type==='any')).toBe(true);}expect(formationComplete([])).toBe(false);expect(formationComplete(['yuria','mia','leon','neris','livia','sera'])).toBe(false);expect(formationComplete(['arin','arin'])).toBe(false);});
 it('prevents a basic 1-1 sniper shot from instantly killing either starting enemy type',()=>{for(const kind of ['crawler','runner']){const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],['arin']);m.start();m.wave.queue=[];m.spawn(kind);const e=m.enemies.find(v=>v.active)!;e.progress=200;m.map.pathPoint(e.progress,e);e.speed=0;for(let i=0;i<120&&e.hp===e.maxHp;i++)m.step(1/60);expect(e.active,kind).toBe(true);expect(e.hp,kind).toBeGreaterThan(0);expect(e.hp,kind).toBeLessThan(e.maxHp);}});
 it('allows maxed operators to overkill opening enemies without an artificial damage cap',()=>{const s=defaultSave();s.heroes.celestia.stars=5;s.campaign!.research.sniper=10;s.campaign!.research.water=10;const m=new BattleModel(s,()=>0);m.configureCampaign(campaignStages[0],['celestia']);m.start();m.wave.queue=[];m.spawn('runner');const e=m.enemies.find(v=>v.active)!;m.damage(e,999999,m.units[0]);expect(e.active).toBe(false);expect(e.hp).toBe(0);});
 it('keeps common enemy health in distinct tactical bands after the opening region',()=>{expect(enemies.runner.hp).toBeGreaterThanOrEqual(85);expect(enemies.crawler.hp).toBeGreaterThan(enemies.runner.hp);expect(enemies.armored.hp).toBeGreaterThan(enemies.jammer.hp);expect(enemies.brute.hp).toBeGreaterThan(enemies.armored.hp);expect(enemies.bulwark.hp).toBeGreaterThan(enemies.brute.hp);expect(enemies.crawler.hp*campaignStages[0].enemyHp).toBeGreaterThanOrEqual(98);});
 it('keeps a defeated operator out for the rest of the battle',()=>{const m=new BattleModel(defaultSave());m.configureCampaign(campaignStages[0],['sera','reina']);m.start();const u=m.units[0],slot=u.slot;m.hurtUnit(u,99999);expect(u.slot).toBe(slot);expect(u.hp).toBe(0);expect(m.effects.some(f=>f.visual===`hero-defeat-${u.heroId}`)).toBe(true);m.time=120;m.step(.01);expect(u.hp).toBe(0);expect(u.slot).toBe(slot);});
 it('restores defeated operators to full health when the next stage begins',()=>{const save=defaultSave(),first=new BattleModel(save);first.configureCampaign(campaignStages[0],['yuria','vera']);first.autoDeployCampaign();first.start();first.hurtUnit(first.units[0],99999);first.hurtUnit(first.units[1],99999);expect(first.units.every(u=>u.hp===0)).toBe(true);const next=new BattleModel(save);next.configureCampaign(campaignStages[1],['yuria','vera'],true);expect(next.units.every(u=>u.hp===u.maxHp&&u.hp>0)).toBe(true);});
 it('forces campaign enemies to defeat the frontline tank and then the remaining squad before reaching the core',()=>{const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],['yuria','sera']);const tank=m.units[0],dealer=m.units[1];m.move(tank.uid,4);m.move(dealer.uid,0);m.start();m.wave.queue=[];m.spawn('crawler');const e=m.enemies.find(v=>v.active)!;e.speed=100;const placeBy=(u:typeof tank)=>{let best=0,min=Infinity,p={x:0,y:0};for(let d=0;d<m.map.pathLength;d+=2){m.map.pathPoint(d,p);const gap=Math.hypot(p.x-u.x,p.y-u.y);if(gap<min){min=gap;best=d;}}e.progress=best;m.map.pathPoint(best,e);};placeBy(tank);const firstProgress=e.progress;for(let i=0;i<120;i++)m.step(1/60);expect(e.progress).toBeCloseTo(firstProgress);expect(tank.hp).toBeLessThan(tank.maxHp);m.hurtUnit(tank,99999);placeBy(dealer);const secondProgress=e.progress;for(let i=0;i<120;i++)m.step(1/60);expect(e.progress).toBeCloseTo(secondProgress);expect(dealer.hp).toBeLessThan(dealer.maxHp);});
 it('maps the four displayed speeds to the new synchronized combat clock',()=>{expect([.75,1,1.5,2].map(battleTimeScale)).toEqual([1,1.5,2.25,3]);const m=new BattleModel(defaultSave());m.configureCampaign(campaignStages[0],['sera']);m.start();m.move(m.units[0].uid,5);m.paused=true;m.update(.2);expect(m.time).toBe(0);m.paused=false;m.speed=2;m.update(.2);expect(m.time).toBeCloseTo(.6);});
 it('restores the last valid battle speed and rejects invalid saved values',()=>{const save=defaultSave();save.settings.battleSpeed=1.5;expect(new BattleModel(save).speed).toBe(1.5);expect(parseSave(JSON.stringify(save)).settings.battleSpeed).toBe(1.5);const raw=JSON.parse(JSON.stringify(save));raw.settings.battleSpeed=9;expect(parseSave(JSON.stringify(raw)).settings.battleSpeed).toBe(1);});
 it.each(campaignStages)('simulates default squad through $id',async(stage)=>{
   {const save=defaultSave();for(const hero of Object.values(save.heroes)){hero.equipment=[];hero.stars=[1,1,2,2,3,3,4,5,5,5,5,5][Number(stage.id.split('-')[0])-1];}const m=new BattleModel(save,()=>.5);m.configureCampaign(stage,m.save.campaign!.squad,true);m.autoDeployCampaign();m.start();
    for(let i=0;i<60*900&&!m.ended;i++){if(m.choices.length)throw Error('Campaign interrupted by choice');m.step(1/60);}
    console.log(stage.id,{won:m.result?.won,core:m.core,time:Math.round(m.time),wave:m.wave.number,kills:m.kills});expect(m.ended).toBe(true);if(Number(stage.id.split('-')[0])<=5)expect(m.result?.won,`${stage.id} must be clearable by the unequipped starter squad`).toBe(true);
   }await new Promise(resolve=>setTimeout(resolve,0));
 },60000);
 it('defines sixteen regions of ten stages with split routes that grow more frequent after area 1',()=>{
  expect(campaignStages).toHaveLength(160);expect(campaignStages[0].id).toBe('1-1');expect(campaignStages.at(-1)?.id).toBe('16-10');
  expect(campaignStages.map(s=>s.waves)).toEqual(Array.from({length:16},()=>[4,4,4,4,6,4,4,4,4,8]).flat());
  expect(campaignStages[0].enemyHp).toBeLessThan(campaignStages.at(-1)!.enemyHp);
  expect(campaignStages[0].enemyAttack).toBeLessThan(campaignStages.at(-1)!.enemyAttack);
  for(let region=1;region<=16;region++){
   const stages=campaignStages.filter(stage=>stage.id.startsWith(`${region}-`));
   expect(stages.every((stage,i)=>i===0||stage.enemyHp>stages[i-1].enemyHp)).toBe(true);
  }
  expect(new Set(campaignStages.map(s=>s.background))).toHaveLength(16);
  const dual=campaignStages.filter(s=>s.alternate);expect(dual.length).toBeGreaterThan(27);expect(dual.map(s=>s.id)).toContain('16-9');
  expect(campaignStages.filter(s=>s.id.startsWith('1-')&&s.alternate)).toHaveLength(0);
  expect(campaignStages.filter(s=>s.id.endsWith('-5')||s.id.endsWith('-10')).every(s=>!s.alternate)).toBe(true);
  for(const s of campaignStages){expect(s.map.slots).toHaveLength(6);expect(new Set(s.map.slots.map(p=>`${p.x},${p.y}`)).size).toBe(6);expect(s.map.path[0].x).toBe(750);expect(s.map.path.at(-1)).toEqual({x:50,y:400});expect(s.map.pathPoint(s.map.pathLength+100,{x:0,y:0})).toEqual(s.map.path.at(-1));if(s.alternate){expect(s.alternate.path[0]).toEqual({x:750,y:Number(s.id.split('-')[0])>=9?440:460});expect(s.alternate.path.at(-1)).toEqual({x:50,y:400});expect(frontlineSlots(s)).toEqual([1,3,4]);}else expect(frontlineSlots(s)).toEqual([4]);}
 });
 it('raises pressure through operations 1-1 to 1-4 and introduces the sprinter in the mixed rush',()=>{
  const opening=campaignStages.slice(0,4).map(stage=>campaignWave(stage,1));
  expect(opening.map(w=>w.enemies.length)).toEqual([11,12,13,14]);
  opening.map(w=>w.interval).forEach((interval,i)=>expect(interval).toBeCloseTo([.98,.945,.91,.875][i]));
  expect(opening.every((wave,i)=>i===0||wave.enemies.length>opening[i-1].enemies.length)).toBe(true);
  expect(opening.every((wave,i)=>i===0||wave.interval<opening[i-1].interval)).toBe(true);
  expect(opening[3].enemies).toContain('sprinter');
 });
 it('uses the same steadily rising regular-operation pressure curve in every region',()=>{
  for(let region=1;region<=16;region++)for(const operations of [[1,2,3,4],[6,7,8,9]]){
   const waves=operations.map(operation=>campaignWave(campaignStages[(region-1)*10+operation-1],1));
   expect(waves.every((wave,i)=>i===0||wave.enemies.length>waves[i-1].enemies.length),`region ${region} counts ${operations}`).toBe(true);
   expect(waves.every((wave,i)=>i===0||wave.interval<waves[i-1].interval),`region ${region} tempo ${operations}`).toBe(true);
  }
 });
 it('alternates enemies across both area-8 lanes and auto-deploys two tanks to separate fronts',()=>{const stage=campaignStages.find(s=>s.id==='8-3')!,m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(stage,['yuria','mia','arin','sera','reina'],true);expect(m.autoDeployCampaign()).toBe(true);expect(m.units.filter(u=>formationRole(u.heroId)==='tank').map(u=>u.slot).sort()).toEqual([1,3]);m.start();m.wave.queue=[];expect(m.spawn('crawler')).toBe(true);expect(m.spawn('runner')).toBe(true);const active=m.enemies.filter(e=>e.active);expect(active.map(e=>e.route).sort()).toEqual([0,1]);expect(new Set(active.map(e=>e.y)).size).toBe(2);});
 it('allows preparation moves and requires ten seconds for both swapped units',()=>{
  const stage=campaignStages[0],m=new BattleModel(defaultSave(),()=>.5,stage.map);m.campaign=stage;
  const a=m.addUnit('sera'),b=m.addUnit('reina');
  expect(m.move(a.uid,5)).toBe(true);expect(a.moveReadyAt).toBe(0);
  m.start();expect(m.move(a.uid,b.slot)).toBe(true);expect(a.moveReadyAt).toBe(10);expect(b.moveReadyAt).toBe(10);
  expect(m.move(a.uid,2)).toBe(false);m.time=9.99;expect(m.move(a.uid,2)).toBe(false);
  m.time=10;expect(m.move(a.uid,2)).toBe(true);expect(a.moveReadyAt).toBe(20);
  expect(m.move(a.uid,2)).toBe(false);expect(a.moveReadyAt).toBe(20);
 });
 it('forms and places the squad on the live map before combat',()=>{
  const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],['sera','reina','arin'],true);
  expect(m.units.every(u=>u.slot<0)).toBe(true);m.start();expect(m.started).toBe(false);
  expect(m.move(m.units[0].uid,0)).toBe(true);const kept=m.units[0];
  expect(m.syncCampaignSquad(['sera','karin'])).toBe(true);expect(m.units.map(u=>u.heroId)).toEqual(['sera','karin']);expect(kept.slot).toBe(0);expect(m.units[1].slot).toBe(-1);
  expect(m.move(m.units[1].uid,1)).toBe(true);m.start();expect(m.started).toBe(true);expect(m.syncCampaignSquad(['sera'])).toBe(false);
 });
 it('finishes after the last wave instead of scheduling another',()=>{
  const stage=campaignStages[0],m=new BattleModel(defaultSave(),()=>.5,stage.map);m.campaign=stage;m.start();m.wave.start(stage.waves);m.wave.queue=[];m.wave.elapsed=999;m.step(1/60);expect(m.result?.won).toBe(true);
 });
 it('ends the stage immediately when the final named or boss objective is defeated',()=>{
  for(const stage of [campaignStages[0],campaignStages[4],campaignStages[9]]){
   const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(stage,['sera']);m.start();m.wave.start(stage.waves);m.objectiveGeneration=0;m.wave.queue=[];
   const objective=m.wave.data.objective!;expect(objective).toBe(stage.waves===8?'gale_colossus':stage.waves===6?'verdant_stalker':'named_meadow');expect(m.spawn(objective)).toBe(true);
   const target=m.enemies.find(e=>e.active)!;expect(target.generation).toBe(m.objectiveGeneration);m.damage(target,target.hp+1,m.units[0]);
   expect(m.result?.won).toBe(true);expect(m.ended).toBe(true);expect(m.alive).toBe(0);
  }
 });
 it('marks every final campaign wave with one regional named, mid-boss or final-boss objective',()=>{const named=['meadow','coast','autumn','snow','lab','cold','abyss','rift','sky','dune','machine','time','sky','dune','machine','time'];for(const stage of campaignStages){const final=campaignWave(stage,stage.waves),region=Number(stage.id.split('-')[0]);expect(final.objective).toBe(stage.waves===8?regionalFinalBoss[region-1]:stage.waves===6?regionalMidBoss[region-1]:`named_${named[region-1]}`);expect(final.objective).toBeTruthy();}});
 it('activates regional named and boss-specific skills during campaign combat',()=>{const named=new BattleModel(defaultSave(),()=>.5);named.configureCampaign(campaignStages[0],['yuria']);named.start();named.wave.queue=[];named.spawn('named_meadow');const elite=named.enemies.find(e=>e.active)!;elite.namedSkillTimer=6.5;const before=elite.progress;named.step(1/60);expect(elite.progress).toBeGreaterThan(before+25);const boss=new BattleModel(defaultSave(),()=>.5);boss.configureCampaign(campaignStages[4],['yuria']);boss.start();boss.wave.queue=[];boss.spawn('frost_howler');const frost=boss.enemies.find(e=>e.active)!;const unit=boss.units[0];frost.x=unit.x;frost.y=unit.y;frost.attackTimer=10;const hp=unit.hp;boss.step(1/60);expect(unit.hp).toBeLessThan(hp);expect(boss.effects.some(f=>f.life>0&&f.visual==='enemy-frost')).toBe(true);});
});

describe('campaign reach and doctrines',()=>{
 it('gives every stage six unrestricted pads and keeps all five core positions in sniper reach of the frontline',()=>{
  for(const stage of campaignStages){
   expect(stage.map.slots.map(p=>p.type)).toEqual(['any','any','any','any','any','any']);
   const front=stage.map.slots[4],held={x:front.x+20,y:front.y},sniperRange=combatRange(heroById.arin.range);
   expect(stage.map.slots.filter(p=>Math.hypot(p.x-held.x,p.y-held.y)<=sniperRange).length,stage.id).toBeGreaterThanOrEqual(4);
   expect(Math.hypot(stage.map.slots[5].x-held.x,stage.map.slots[5].y-held.y),stage.id+' sniper A').toBeLessThanOrEqual(sniperRange);
  }
 });
 it('allows any operator on the frontline and makes a frontline Yuria taunt special attacks',()=>{
  const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],['yuria','sera']);
  const y=m.units.find(u=>u.heroId==='yuria')!,s=m.units.find(u=>u.heroId==='sera')!;
  expect(m.move(s.uid,4)).toBe(true);expect(m.move(y.uid,4)).toBe(true);expect(m.move(s.uid,2)).toBe(true);m.start();m.wave.queue=[];
  m.spawn('ravager');const boss=m.enemies.find(e=>e.active)!;boss.x=y.x+20;boss.y=y.y;boss.attackTimer=20;m.step(1/60);
  expect(boss.strikeX).toBe(y.x);expect(boss.strikeY).toBe(y.y);
 });
 it('lets regular monsters attack nearby dealers and snipers when no tank intercepts them',()=>{const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],['sera']);const u=m.units[0];m.move(u.uid,1);m.start();m.wave.queue=[];m.spawn('crawler');const e=m.enemies.find(e=>e.active)!;e.x=u.x;e.y=400;e.attackTimer=2;const hp=u.hp;m.step(1/60);expect(u.hp).toBeLessThan(hp);});
 it('gives non-tank melee dealers lane-edge reach without approaching ranged distance',()=>{const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],['karin']);const u=m.units[0];m.move(u.uid,0);m.start();m.wave.queue=[];m.spawn('crawler');const e=m.enemies.find(e=>e.active)!;e.progress=750-u.x;m.map.pathPoint(e.progress,e);e.speed=0;e.hp=e.maxHp=100000;for(let i=0;i<120;i++)m.step(1/60);expect(m.stats(u).range).toBe(120);expect(m.stats(u).range).toBeLessThan(combatRange(heroById.sera.range));expect(m.records[0].damage).toBeGreaterThan(0);});
 it('lets both auto-deployed ranged dealers hit an enemy held by the frontline tank',()=>{const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],['yuria','reina','sera'],true);expect(m.autoDeployCampaign()).toBe(true);const tank=m.units.find(u=>u.heroId==='yuria')!,enemy={x:tank.x+100,y:tank.y};for(const id of ['reina','sera']){const dealer=m.units.find(u=>u.heroId===id)!;expect(m.stats(dealer).range,id).toBeGreaterThanOrEqual(Math.hypot(dealer.x-enemy.x,dealer.y-enemy.y));}});
 it('lets every sniper cover the frontline interception point from the rear pads',()=>{for(const stage of campaignStages)for(const id of ['arin','noel','serin','aurora']){const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(stage,[id],true);const u=m.units[0];for(const slot of [0,1,2,3,5]){const entry=stage.map.slots[stage.alternate?(slot===2||slot===3?3:1):4];expect(m.stats(u).range,`${stage.id} ${id} slot ${slot}`).toBeGreaterThanOrEqual(Math.hypot(stage.map.slots[slot].x-entry.x,stage.map.slots[slot].y-entry.y));}}});
 it('makes a rear-corner sniper acquire enemies at the frontline',()=>{for(const id of ['arin','noel','serin','aurora']){const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],[id]);const u=m.units[0];m.start();m.wave.queue=[];m.spawn('crawler');const e=m.enemies.find(v=>v.active)!;e.progress=200;m.map.pathPoint(e.progress,e);e.speed=0;e.hp=e.maxHp=100000;for(let i=0;i<120;i++)m.step(1/60);expect(m.records[0].damage,id).toBeGreaterThan(0);}});
 it('makes ranged enemies approach and melee a tank that blocks their lane',()=>{const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[2],['yuria','sera']);const tank=m.units[0],dealer=m.units[1];m.move(tank.uid,4);m.move(dealer.uid,1);m.start();m.wave.queue=[];m.spawn('jammer');const e=m.enemies.find(e=>e.active)!;let best=0,min=Infinity,p={x:0,y:0};for(let d=0;d<m.map.pathLength;d+=2){m.map.pathPoint(d,p);const gap=Math.hypot(p.x-tank.x,p.y-tank.y);if(gap<min){min=gap;best=d;}}e.progress=best;m.map.pathPoint(best,e);e.speed=0;e.rangedTimer=99;e.attackTimer=2;const tankHp=tank.hp,dealerHp=dealer.hp;m.step(1/60);expect(e.rangedTimer).toBe(0);expect(m.effects.some(f=>f.life>0&&f.visual==='enemy-rift-bolt')).toBe(false);expect(tank.hp).toBeLessThan(tankHp);expect(dealer.hp).toBe(dealerHp);});
 it('lets Yuria counterattack every enemy held at her frontline',()=>{const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[0],['yuria']);const yuria=m.units[0];m.move(yuria.uid,4);m.start();m.wave.queue=[];m.spawn('jammer');const e=m.enemies.find(v=>v.active)!;e.hp=e.maxHp=100000;e.speed=85;for(let i=0;i<600&&(m.records[0].damage===0||(yuria.damageTaken??0)===0);i++)m.step(1/60);expect(Math.hypot(yuria.x-e.x,yuria.y-e.y)).toBeLessThanOrEqual(m.stats(yuria).range);expect(m.records[0].damage).toBeGreaterThan(0);expect(yuria.damageTaken??0).toBeGreaterThan(0);});
 it('lets ranged enemies shoot an off-lane dealer only from a distance where the dealer retaliates',()=>{const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[2],['sera']);const dealer=m.units[0];m.move(dealer.uid,1);m.start();m.wave.queue=[];m.spawn('jammer');const e=m.enemies.find(e=>e.active)!;let best=0,min=Infinity,p={x:0,y:0};for(let d=0;d<m.map.pathLength;d+=2){m.map.pathPoint(d,p);const gap=Math.hypot(p.x-dealer.x,p.y-dealer.y);if(gap<min){min=gap;best=d;}}e.progress=best;m.map.pathPoint(best,e);e.speed=0;e.hp=e.maxHp=100000;const hp=dealer.hp;for(let i=0;i<240;i++)m.step(1/60);expect(dealer.hp).toBeLessThan(hp);expect(m.records[0].damage).toBeGreaterThan(0);expect(m.effects.some(f=>f.life>0&&f.visual==='enemy-ranged-impact')).toBe(true);});
 it('Yuria and Karin damage enemies from the frontline; Yuria blocks and takes damage',()=>{
  for(const stage of campaignStages)for(const hero of ['yuria','karin']){
   for(const [slot,p] of stage.map.slots.map((p,slot)=>[slot,p] as const).filter(([slot])=>slot===4)){
    const range=combatRange(heroById[hero].range);
    const routeIndex=pathExposure(stage,p,range).findIndex(v=>v>=70);if(routeIndex<0)continue;
    const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(stage,[hero]);const u=m.units[0];m.move(u.uid,slot);m.start();m.wave.queue=[];
    m.spawn('crawler');const e=m.enemies.find(e=>e.active)!;e.route=routeIndex;
    const route=routeIndex?stage.alternate!:stage.map;
    let nearest=0,min=Infinity;const q={x:0,y:0};
    for(let d=0;d<route.pathLength;d+=2){route.pathPoint(d,q);const distance=Math.hypot(q.x-p.x,q.y-p.y);if(distance<min){min=distance;nearest=d;}}
    e.progress=slot===4?Math.max(0,nearest-15):nearest;route.pathPoint(e.progress,e);e.hp=e.maxHp=100000;
    for(let i=0;i<180;i++)m.step(1/60);
    expect(m.records[0].damage,stage.id+hero+slot).toBeGreaterThan(0);
    if(hero==='yuria'){expect(m.records[0].blockTime).toBeGreaterThan(1);expect(u.damageTaken).toBeGreaterThan(0);}
   }
  }
 });
 it('applies growth exactly once per scheduled wave and keeps the saved doctrine isolated',()=>{
  const save=defaultSave();save.campaign!.doctrine='guard';const m=new BattleModel(save);m.configureCampaign(campaignStages[9],['yuria']);m.start();
  for(const n of [2,2,4,6]){m.wave.start(n);m.wave.queue=[];m.wave.elapsed=999;m.intermission=0;m.enemies.forEach(e=>e.active=false);m.step(.01);expect(m.choices).toHaveLength(0);}
  expect(m.doctrineLevel).toBe(4);expect(m.chosenTraits).toHaveLength(3);expect(save.campaign!.doctrine).toBe('guard');
  const next=new BattleModel(save);next.configureCampaign(campaignStages[9],['yuria']);expect(next.doctrineLevel).toBe(1);
 });
 it('compares all three doctrines with the same default squad without intervention',()=>{
  for(const doctrine of ['rapid','focus','guard']){
   const save=defaultSave();save.campaign!.doctrine=doctrine;const m=new BattleModel(save,()=>.5);m.configureCampaign(campaignStages[9],save.campaign!.squad);m.start();
   for(let i=0;i<60*900&&!m.ended;i++){if(m.choices.length)throw Error('choice');m.step(1/60);}
   console.log('doctrine',doctrine,{core:m.core,time:Math.round(m.time),won:m.result?.won,kills:m.kills});
   expect(m.ended).toBe(true);expect(m.doctrineLevel).toBe(4);
  }
 },30000);
});
