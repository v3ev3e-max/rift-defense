import {it,expect} from 'vitest';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {battleMaps,CELL} from '../src/data/map';
import {heroes} from '../src/data/heroes';
import {stepCombat,attack} from '../src/systems/CombatSystem';
import {combatRange,MELEE_STRIKE_RANGE,DEALER_BASE_RANGE,SNIPER_BASE_RANGE} from '../src/data/balance';
import {combatRoles,formationRole} from '../src/data/combatRoles';
it.each(heroes)('$id retains a bounded range after range upgrades',h=>{
 const m=new BattleModel(defaultSave());const u=m.addUnit(h.id);const base=m.stats(u).range;
 const role=formationRole(h.id),kind=combatRoles[h.id].kind;
 const expected=role==='sniper'?Math.max(SNIPER_BASE_RANGE,combatRange(h.range)):role==='dealer'&&kind!=='melee'?Math.max(DEALER_BASE_RANGE,combatRange(h.range)):kind==='melee'&&role!=='tank'?Math.max(MELEE_STRIKE_RANGE,combatRange(h.range)):combatRange(h.range);
 expect(base).toBeGreaterThanOrEqual(90);expect(base).toBe(expected);
 m.bonuses.range=.4;m.bonuses.ascend=.2;expect(m.stats(u).range).toBeGreaterThanOrEqual(base);expect(m.stats(u).range).toBeLessThanOrEqual(base+CELL);
 m.bonuses.range=100;expect(m.stats(u).range).toBe(base+CELL);
 m.bonuses.range=0;m.bonuses.ascend=0;u.star=5;
 expect(m.stats(u).range).toBe(base);
});
it.each(['mia','leon','kyle'])('%s support stops at its displayed attack radius',id=>{
 const m=new BattleModel(defaultSave());const ally=m.addUnit('reina');ally.x=0;ally.y=0;const support=m.addUnit(id);support.y=0;support.x=1000;const plain=m.stats(ally);support.x=m.stats(support).range+1;
 expect(m.stats(ally).atk).toBe(plain.atk);expect(m.stats(ally).speed).toBe(plain.speed);
 support.x-=2;expect(m.stats(ally).speed).toBeGreaterThan(plain.speed);
});
it('Kyle cannot refresh allies outside his displayed radius',()=>{
 const m=new BattleModel(defaultSave());const k=m.addUnit('kyle'),a=m.addUnit('reina');k.x=0;k.y=0;a.x=m.stats(k).range+1;a.y=0;a.cooldown=3;
 m.spawn('brute');const e=m.enemies[0];e.hp=e.maxHp=1e6;e.x=20;e.y=0;k.shots=5;attack(m,k,e);expect(a.cooldown).toBe(3);
});
it('guardian cannot block outside its displayed radius',()=>{
 for(const inside of [false,true]){
 const m=new BattleModel(defaultSave());m.wave.start(1);const u=m.addUnit('yuria');m.spawn('crawler');const e=m.enemies[0];e.progress=300;m.map.pathPoint(300,e);
 u.x=e.x;u.y=e.y+m.stats(u).range+(inside?-2:2);u.cooldown=u.droneCooldown=100;
 const speed=e.speed;stepCombat(m,.01);expect(e.progress-300).toBeCloseTo(speed*.01*(inside?.18:1),4);
 }
});
it.each(['crawler','runner','ravager','sovereign'])('%s has equal base traversal time across all maps',kind=>{
 const times=battleMaps.map(map=>{const m=new BattleModel(defaultSave(),()=>.5,map);m.wave.start(20);m.spawn(kind);return map.pathLength/m.enemies[0].speed;});
 for(const t of times)expect(t).toBeCloseTo(times[0],8);
});
