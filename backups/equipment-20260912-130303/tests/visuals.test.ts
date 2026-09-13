import {it,expect} from 'vitest';
import {visualFrame,fitVisual,heroVisuals} from '../src/game/VisualRules';
import {heroes} from '../src/data/heroes';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {stepActions} from '../src/systems/ActionCombat';
import {attack} from '../src/systems/CombatSystem';
import {enemyMotion} from '../src/game/EnemyMotion';
import {dealerFirst,supportOperatorIds} from '../src/data/combatRoles';
it('a full 64-effect pool preserves damage against 42 enemies',()=>{
 const results=[false,true].map(full=>{
  const m=new BattleModel(defaultSave(),()=>.5);const u=m.addUnit('aurora')!;
  for(let i=0;i<42;i++)m.spawn('brute');
  for(const e of m.enemies.filter(e=>e.active)){e.x=u.x+30;e.y=u.y;e.hp=e.maxHp=1e6;}
  if(full)for(let i=0;i<64;i++)m.emit('shot',0,0,100,100,0xffffff);
  for(let i=0;i<12;i++)attack(m,u,m.enemies[0]);
  for(let i=0;i<120;i++)stepActions(m,1/60);
  return {hp:m.enemies.filter(e=>e.active).map(e=>e.hp),alive:m.alive,effects:m.effects.length};
 });
 expect(results[0].alive).toBe(42);expect(results[0].hp[0]).toBeLessThan(1e6);
 expect(results[1]).toEqual(results[0]);expect(results[1].effects).toBe(64);
});
it('has explicit sizes for all operators',()=>expect(Object.keys(heroVisuals).sort()).toEqual(heroes.map(h=>h.id).sort()));
it.each([30,60,120])('shows all three frames at %i render FPS',fps=>{
 const seen=new Set<number>();for(let t=0;t<.25-1e-8;t+=1/fps)seen.add(visualFrame(t));expect([...seen]).toEqual([1,2,3]);
});
it.each([1,2])('keeps FX on real time at speed %i',speed=>{
 const m=new BattleModel(defaultSave());m.speed=speed;m.emit('shot',0,0,100,100,0xffffff,{duration:.17,visual:'sera-projectile'});
 expect(m.effects[0].life).toBe(.25);m.update(1/12);expect(m.effects[0].life).toBeCloseTo(1/6);
 m.paused=true;m.update(.1);expect(m.effects[0].life).toBeCloseTo(1/6);
});
it('contains all rotated rectangle corners without distorting aspect',()=>{
 for(const x of [0,500,1000])for(const y of [0,126,477,580])for(let a=0;a<Math.PI*2;a+=Math.PI/12){
 const r=fitVisual(x,y,84,28,a),c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));
 expect(r.x-(r.width*c+r.height*s)/2).toBeGreaterThanOrEqual(2.999);
 expect(r.x+(r.width*c+r.height*s)/2).toBeLessThanOrEqual(997.001);
 expect(r.y-(r.width*s+r.height*c)/2).toBeGreaterThanOrEqual(2.999);
 expect(r.y+(r.width*s+r.height*c)/2).toBeLessThanOrEqual(577.001);
 expect(r.width/r.height).toBeCloseTo(3);
 }
});
it('gives moving enemies a grounded four-frame gait with stable boss weight',()=>{
 const frames=new Set<number>();
 for(let time=0;time<2;time+=1/60)frames.add(enemyMotion(time,0,60,false,1,0).frame);
 expect([...frames].sort()).toEqual([1,2,3,4]);
 expect(enemyMotion(.2,0,60,false,-1,0).flipX).toBe(true);
 expect(enemyMotion(.2,0,60,false,1,0).flipX).toBe(false);
 const normal=enemyMotion(.37,0,60,false,1,0),boss=enemyMotion(.37,0,60,true,1,0);
 expect(boss.lift).toBeLessThanOrEqual(normal.lift);
 expect(Math.abs(boss.angle)).toBeLessThan(Math.abs(normal.angle));
 expect(enemyMotion(.2,0,60,false,0,0).stepAlpha).toBe(0);
});
it('places damage dealers before support operators in operator lists',()=>{
 const ordered=[...heroes].sort(dealerFirst);
 const firstSupport=ordered.findIndex(h=>supportOperatorIds.has(h.id));
 expect(firstSupport).toBeGreaterThan(0);
 expect(ordered.slice(0,firstSupport).every(h=>!supportOperatorIds.has(h.id))).toBe(true);
 expect(ordered.slice(firstSupport).map(h=>h.id)).toEqual(['yuria','mia','leon','neris','livia']);
});
