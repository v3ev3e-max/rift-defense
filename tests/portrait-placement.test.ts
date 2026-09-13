import {it,expect} from 'vitest';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {battleMaps,CELL,segmentDistance} from '../src/data/map';
import {combatRange} from '../src/data/balance';
import {heroById} from '../src/data/heroes';
it.each(battleMaps)('$name: direct summon, occupied rejection, move and bounded range',map=>{
 const m=new BattleModel(defaultSave(),()=>.5,map); const gold=m.gold;
 expect(map.slots.length).toBeGreaterThan(15);
 expect(m.summonAt(0)).toBe(true);expect(m.units[0].slot).toBe(0);expect(m.gold).toBeLessThan(gold);
 const after=m.gold;expect(m.summonAt(0)).toBe(false);expect(m.gold).toBe(after);
 expect(m.move(m.units[0].uid,1)).toBe(true);expect(m.units[0].slot).toBe(1);expect(m.stats(m.units[0]).range).toBeLessThanOrEqual(combatRange(heroById[m.units[0].heroId].range)+CELL);
 for(const p of map.slots)for(let i=1;i<map.path.length;i++)expect(segmentDistance(p,map.path[i-1],map.path[i])).toBeGreaterThanOrEqual(65);
});
