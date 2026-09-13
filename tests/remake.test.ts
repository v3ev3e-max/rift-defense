import {stepCombat} from '../src/systems/CombatSystem';
import {it,expect} from 'vitest';
import {battleMaps,segmentDistance} from '../src/data/map';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
it.each(battleMaps)('$name excludes road and obstacle footprints across the entire grid',map=>{
 expect(map.slots.length).toBeGreaterThanOrEqual(20);
 for(const p of map.slots){
  for(let i=1;i<map.path.length;i++)expect(segmentDistance(p,map.path[i-1],map.path[i])).toBeGreaterThanOrEqual(53);
  expect(map.obstacles.some(o=>Math.abs(o.x-p.x)<48&&Math.abs(o.y-p.y)<48)).toBe(false);
 }
 expect(map.pathPoint(map.pathLength,{x:0,y:0})).toEqual(map.path.at(-1));
});
it.each(battleMaps)('$name buys on field and moves with free intermission undo',map=>{
 const m=new BattleModel(defaultSave(),()=>.5,map);m.summonAt(0);const u=m.units[0],gold=m.gold;
 expect(u.slot).toBe(0);expect(m.move(u.uid,3)).toBe(true);expect(m.undoPlacement()).toBe(true);expect(u.slot).toBe(0);expect(m.gold).toBe(gold);
 m.start();m.move(u.uid,4);expect(m.move(u.uid,5)).toBe(false);m.intermission=4;expect(m.move(u.uid,5)).toBe(true);
 m.paused=true;expect(m.move(u.uid,6)).toBe(false);
});
it('single path ends without wrapping to entry',()=>{
 const map=battleMaps[0];expect(battleMaps).toHaveLength(1);expect(map.slots).toHaveLength(24);
 expect(map.pathPoint(map.pathLength+1000,{x:0,y:0})).toEqual(map.path.at(-1));expect(map.path.at(-1)).not.toEqual(map.path[0]);
});

it('an enemy damages the core once and is removed at the end',()=>{
 const m=new BattleModel(defaultSave());m.spawn('crawler');const e=m.enemies.find(e=>e.active)!;
 e.progress=m.map.pathLength-1;e.speed=100;
 const hp=m.core;stepCombat(m,.1);expect(e.active).toBe(false);expect(m.core).toBeLessThan(hp);
 const damaged=m.core;stepCombat(m,1);expect(m.core).toBe(damaged);
});
