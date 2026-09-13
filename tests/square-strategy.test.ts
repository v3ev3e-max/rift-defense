import {it,expect} from 'vitest';
import {MAP,CELL,battleMaps,segmentDistance} from '../src/data/map';
import {combatRange} from '../src/data/balance';
import {heroById} from '../src/data/heroes';
import {getWave,waveBrief} from '../src/data/waves';
it('square cells give outer melee and inner sniper different roles',()=>{
 const m=battleMaps[0],nearest=(p:any)=>Math.min(...m.path.slice(1).map((v,i)=>segmentDistance(p,m.path[i],v)));
 expect(MAP.width).toBe(MAP.height);expect(CELL).toBe(110);expect(m.slots).toHaveLength(24);
 const melee=combatRange(heroById.yuria.range),sniper=combatRange(heroById.noel.range);
 expect(m.slots.some(p=>nearest(p)<melee)).toBe(true);
 expect(m.slots.some(p=>nearest(p)>melee&&nearest(p)<sniper)).toBe(true);
 expect(m.slots.some(p=>p.x===400&&p.y===400)).toBe(false);
});
it('seven-type waves keep mixed enemies instead of repeating one type',()=>{
 for(const n of [31,32,33,34,36,37,38,39])expect(new Set(getWave(n).enemies).size).toBeGreaterThanOrEqual(7);
 expect(waveBrief(20)).toContain('보스');expect(waveBrief(16)).toContain('장갑');expect(waveBrief(11)).toContain('교란');
});
