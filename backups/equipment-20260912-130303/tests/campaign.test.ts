import {describe,it,expect} from 'vitest';
import {campaignStages,pathExposure} from '../src/data/campaign';
import {combatRange} from '../src/data/balance';
import {heroes,heroById} from '../src/data/heroes';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {parseSave} from '../src/systems/SaveSystem';
import {formationComplete,formationRole,formationSort} from '../src/data/combatRoles';
describe('campaign foundations',()=>{
 it('starts a collection account with one B tank, three B dealers and one B sniper',()=>{const s=defaultSave(),owned=heroes.filter(h=>s.heroes[h.id].owned);expect(owned.map(h=>h.id).sort()).toEqual(['arin','karin','reina','sera','yuria']);expect(owned.every(h=>h.grade==='B')).toBe(true);expect(s.campaign!.squad.map(formationRole)).toEqual(['tank','dealer','dealer','dealer','sniper']);expect(formationComplete(s.campaign!.squad)).toBe(true);});
 it('assigns and sorts all twenty-one operators by formation position then grade',()=>{const sorted=[...heroes].sort(formationSort);expect(sorted).toHaveLength(21);expect(sorted.every(h=>['tank','dealer','sniper'].includes(formationRole(h.id)))).toBe(true);expect(sorted.map(h=>formationRole(h.id))).toEqual([...sorted.map(h=>formationRole(h.id))].sort((a,b)=>({tank:0,dealer:1,sniper:2}[a]-{tank:0,dealer:1,sniper:2}[b])));});
 it('auto-deploys tank to FRONT, sniper to A and three dealers while leaving one move slot',()=>{const s=defaultSave(),m=new BattleModel(s);m.configureCampaign(campaignStages[0],s.campaign!.squad,true);expect(m.autoDeployCampaign()).toBe(true);expect(m.units.find(u=>formationRole(u.heroId)==='tank')?.slot).toBe(4);expect(m.units.find(u=>formationRole(u.heroId)==='sniper')?.slot).toBe(5);expect(m.units.filter(u=>formationRole(u.heroId)==='dealer').map(u=>u.slot).sort()).toEqual([0,1,2]);expect(m.units.some(u=>u.slot===3)).toBe(false);});
 it('migrates squad and records safely',()=>{const s=defaultSave();expect(parseSave(JSON.stringify({...s,campaign:undefined})).campaign?.squad).toHaveLength(5);expect(parseSave(JSON.stringify({...s,campaign:{squad:['sera','sera','missing'],records:{'1-1':{stars:9,time:50,kills:10}}}})).campaign).toMatchObject({squad:['yuria','sera','reina','karin','arin'],records:{'1-1':{stars:3}}});});
 it('returns a defeated operator to reserve after 20 seconds when the old pad is occupied',()=>{const m=new BattleModel(defaultSave());m.configureCampaign(campaignStages[0],['sera','reina']);m.start();const u=m.units[0];const slot=u.slot;m.hurtUnit(u,99999);expect(u.slot).toBe(-1);expect(m.effects.some(f=>f.visual===`hero-defeat-${u.heroId}`)).toBe(true);expect(m.move(m.units[1].uid,slot)).toBe(true);m.time=19.9;m.step(.01);expect(u.hp).toBe(0);m.time=20;m.step(.01);expect(u.hp).toBe(u.maxHp);expect(u.slot).toBe(-1);expect(m.move(u.uid,3)).toBe(true);});
 it('freezes movement countdown during pause and accelerates at x2',()=>{const m=new BattleModel(defaultSave());m.configureCampaign(campaignStages[0],['sera']);m.start();m.move(m.units[0].uid,5);m.paused=true;m.update(.2);expect(m.time).toBe(0);m.paused=false;m.speed=2;m.update(.2);expect(m.time).toBeCloseTo(.4);});
 it('simulates default squad through each finite stage',()=>{
   for(const stage of campaignStages){const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(stage,m.save.campaign!.squad);m.start();
    for(let i=0;i<60*900&&!m.ended;i++){if(m.choices.length)throw Error('Campaign interrupted by choice');m.step(1/60);}
    console.log(stage.id,{won:m.result?.won,core:m.core,time:Math.round(m.time),wave:m.wave.number,kills:m.kills});expect(m.ended).toBe(true);
   }
 },30000);
 it('defines four stages with six distinct pads and one right-to-left path',()=>{
  expect(campaignStages.map(s=>s.id)).toEqual(['1-1','1-2','1-3','1-4','2-1','2-2','2-3','2-4','3-1','3-2','3-3','3-4']);
  for(const s of campaignStages){expect(s.map.slots).toHaveLength(6);expect(new Set(s.map.slots.map(p=>`${p.x},${p.y}`)).size).toBe(6);expect(s.map.path).toEqual([{x:750,y:400},{x:50,y:400}]);expect(s.map.pathPoint(s.map.pathLength+100,{x:0,y:0})).toEqual(s.map.path.at(-1));}
 });
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
 it('ranged enemies show travel, hit on arrival and let the FRONT tank intercept',()=>{const m=new BattleModel(defaultSave(),()=>.5);m.configureCampaign(campaignStages[2],['yuria','sera']);const tank=m.units[0],dealer=m.units[1];m.move(tank.uid,4);m.move(dealer.uid,1);m.start();m.wave.queue=[];m.spawn('jammer');const e=m.enemies.find(e=>e.active)!;e.progress=0;e.speed=0;e.rangedTimer=2.4;const tankHp=tank.hp,dealerHp=dealer.hp;m.step(1/60);expect(m.effects.some(f=>f.life>0&&f.visual==='enemy-rift-bolt')).toBe(true);expect(tank.hp).toBe(tankHp);for(let i=0;i<50;i++)m.step(1/60);expect(tank.hp).toBeLessThan(tankHp);expect(dealer.hp).toBe(dealerHp);expect(m.effects.some(f=>f.life>0&&f.visual==='enemy-ranged-impact')).toBe(true);});
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
  const save=defaultSave();save.campaign!.doctrine='guard';const m=new BattleModel(save);m.configureCampaign(campaignStages[0],['yuria']);m.start();
  for(const n of [2,2,4,6]){m.wave.start(n);m.wave.queue=[];m.wave.elapsed=999;m.intermission=0;m.enemies.forEach(e=>e.active=false);m.step(.01);expect(m.choices).toHaveLength(0);}
  expect(m.doctrineLevel).toBe(4);expect(m.chosenTraits).toHaveLength(3);expect(save.campaign!.doctrine).toBe('guard');
  const next=new BattleModel(save);next.configureCampaign(campaignStages[0],['yuria']);expect(next.doctrineLevel).toBe(1);
 });
 it('compares all three doctrines with the same default squad without intervention',()=>{
  for(const doctrine of ['rapid','focus','guard']){
   const save=defaultSave();save.campaign!.doctrine=doctrine;const m=new BattleModel(save,()=>.5);m.configureCampaign(campaignStages[3],save.campaign!.squad);m.start();
   for(let i=0;i<60*900&&!m.ended;i++){if(m.choices.length)throw Error('choice');m.step(1/60);}
   console.log('doctrine',doctrine,{core:m.core,time:Math.round(m.time),won:m.result?.won,kills:m.kills});
   expect(m.ended).toBe(true);expect(m.doctrineLevel).toBe(4);
  }
 },30000);
});
