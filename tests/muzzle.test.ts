import {attack as launchAttack,stepActions} from '../src/systems/ActionCombat';
import {it,expect} from 'vitest';
import {heroes} from '../src/data/heroes';
import {muzzlePixels,muzzlePixel,weaponPoint,dronePoint,fitProjectile,poseSize,defeatPoseSize} from '../src/game/WeaponSockets';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {stepCombat} from '../src/systems/CombatSystem';
it('covers all operator identities and every texture pose within 160px',()=>{
 expect(Object.keys(muzzlePixels).sort()).toEqual(heroes.map(h=>h.id).sort());
 for(const h of heroes)for(const up of [false,true])for(let frame=1;frame<=(up?3:8);frame++){
 const [x,y]=muzzlePixel(h.id,up,frame);expect(x).toBeGreaterThan(0);expect(x).toBeLessThan(160);expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(160);
 const p={x:290,y:450},r=weaponPoint(h.id,p,up,false,frame),l=weaponPoint(h.id,p,up,true,frame);expect(l.y).toBe(r.y);expect(up?l.x+r.x-2*r.x:l.x+r.x-580).toBeCloseTo(0);
 }
});
it('keeps Kairon north attack at the same visible scale as side attack',()=>{
 const sideVisibleHeight=132*poseSize('kairon',false)/160;
 const northVisibleHeight=135*poseSize('kairon',true)/160;
 expect(Math.abs(northVisibleHeight-sideVisibleHeight)).toBeLessThan(4);
});
it('normalizes every late-added operator across idle, side, north and defeat poses',()=>{
 for(const id of ['gaia','astra','solara','zion','vera','elise','celestia']){
 expect(poseSize(id,false,true),`${id} idle`).toBe(id==='celestia'?94:86);
 expect(poseSize(id,false,false),`${id} side`).toBe(id==='celestia'?94:id==='astra'?84:80);
 expect(poseSize(id,true,false),`${id} north`).toBe(id==='celestia'?94:id==='solara'?96:id==='vera'?80:118);
  expect(defeatPoseSize(id),`${id} defeat`).toBe(108);
 }
 expect(poseSize('reina',false,true)).toBe(132);
 expect(poseSize('reina',false,false)).toBe(94);
 expect(poseSize('reina',true,false)).toBe(132);
 expect(defeatPoseSize('reina')).toBe(132);
});
it('normalizes Hana pose heights to the established cast without changing her source frames',()=>{
 expect(poseSize('hana',false,true)).toBe(90);
 expect(poseSize('hana',false,false)).toBe(90);
 expect(poseSize('hana',true,false)).toBe(120);
 expect(defeatPoseSize('hana')).toBe(112);
});
it('effect reuse clears operator source metadata for chain and other effects',()=>{
 const m=new BattleModel(defaultSave());m.emit('shot',0,0,10,10,0,{sourceUid:1,sourceHero:'sera',sourceNorth:true});const f=m.effects[0];f.originResolved=true;f.life=0;
 m.emit('shot',123,234,50,50,0);expect(f.sourceUid).toBeUndefined();expect(f.sourceHero).toBeUndefined();expect(f.originResolved).toBe(false);expect(f.x).toBe(123);expect(f.y).toBe(234);
});
it('drone projectiles originate from the same orbit position rendered for that UID',()=>{
 const m=new BattleModel(defaultSave());const u=m.addUnit('ian');m.builds.drone=1;m.time=1.7;m.spawn('brute');const e=m.enemies[0];e.progress=300;m.map.pathPoint(300,e);u.x=e.x;u.y=e.y+50;u.cooldown=99;u.droneCooldown=0;e.hp=e.maxHp=1e6;
 const p=dronePoint(u,m.time);launchAttack(m,u,e);const f=m.actions.find(f=>f.active&&f.kind==='drone')!;expect(f.x).toBeCloseTo(p.x);expect(f.y).toBeCloseTo(p.y);expect(f.owner).toBe(u.uid);
});
it('viewport fitting preserves the muzzle and aspect ratio',()=>{
 const r=fitProjectile(4,10,84,28,.6,{width:580,height:1000});expect(r.x).toBe(4);expect(r.y).toBe(10);expect(r.width/r.height).toBeCloseTo(3);expect(r.width).toBeLessThan(84);
});
it('resolves rapid gunfire as hitscan without changing its locked target',()=>{
 const m=new BattleModel(defaultSave());const u=m.addUnit('sera');m.spawn('brute');const e=m.enemies[0];e.x=u.x+120;e.y=u.y+70;e.hp=e.maxHp=1e6;
 launchAttack(m,u,e);const bullets=m.actions.filter(a=>a.active&&a.kind==='burst'),endpoints=bullets.map(a=>[a.tx,a.ty]);
 e.x+=80;e.y-=100;stepActions(m,.03);
 expect(bullets.map(a=>[a.tx,a.ty])).toEqual(endpoints);
});

