import {stepActions} from '../src/systems/ActionCombat';
import { describe, it, expect } from 'vitest';
import { heroes, heroById } from '../src/data/heroes';
import { drawHero } from '../src/systems/SummonSystem';
import { seeded } from '../src/utils/random';
import { BattleModel } from '../src/systems/BattleModel';
import { defaultSave } from '../src/systems/SaveSystem';
import { attack as queueAttack } from '../src/systems/CombatSystem';
import { applyElementHit } from '../src/systems/ElementSystem';
import { getWave } from '../src/data/waves';
import { enemies } from '../src/data/enemies';
import type { HeroGrade } from '../src/data/types';

describe('Phase 16 contracts',()=>{
 it('all21 exact purchases are independent of random seed and saved deck',()=>{for(const h of heroes){const m=new BattleModel(defaultSave(),()=>.99);m.gold=1000;m.selectHero(h.id);expect(m.summonAt(0)).toBe(true);expect(m.units[0].heroId).toBe(h.id);}});
 it.each([['aurora','water','electric','conduct'],['arden','fire','dark','blackflame']] as const)('%s alternates actual attacks and contributes both synergies',(id,first,second,reaction)=>{
  const m=new BattleModel(defaultSave(),()=>.99);const u=m.addUnit(id);m.spawn('brute');const e=m.enemies[0];e.hp=e.maxHp=100000;e.x=u.x+20;e.y=u.y;
  expect(m.synergy[first]).toBe(1);expect(m.synergy[second]).toBe(1);
  attack(m,u,e);expect(e[`${first}Mark`]).toBe(1);expect(m.reactionCounts[reaction]).toBe(0);
  attack(m,u,e);expect(e[`${second}Mark`]).toBe(1);expect(e[`${first}Mark`]).toBe(0);expect(m.reactionCounts[reaction]).toBe(1);
  attack(m,u,e);expect(e[`${first}Mark`]).toBe(1);expect(m.reactionCounts[reaction]).toBe(2);
 });
 it('resolves at most one reaction per hit even with multiple existing marks',()=>{
  const m=new BattleModel(defaultSave());const u=m.addUnit('aurora');m.spawn('brute');const e=m.enemies[0];e.hp=e.maxHp=100000;e.fireMark=e.darkMark=e.electricMark=1;
  applyElementHit(m,u,e,100,'water');expect(Object.values(m.reactionCounts).reduce((a,b)=>a+b,0)).toBe(1);expect(e.waterMark).toBe(1);
 });
 it('renders the passive electric mark transfer instead of applying invisible damage',()=>{
  const m=new BattleModel(defaultSave());const u=m.addUnit('adela');m.spawn('brute');m.spawn('brute');const [a,b]=m.enemies;a.hp=b.hp=a.maxHp=b.maxHp=100000;a.x=200;a.y=200;b.x=260;b.y=200;
  applyElementHit(m,u,a,100,'electric');applyElementHit(m,u,a,100,'electric');applyElementHit(m,u,a,100,'electric');
  expect(m.effects.some(f=>f.life>0&&f.visual==='transfer-electric'&&f.x===a.x&&f.tx===b.x)).toBe(true);
 });
 it('charges the agreed focus costs through the summon transaction',()=>{
  const m=new BattleModel(defaultSave());m.save.deck=['sera','adela','livia','aurora'];m.gold=1000;
  for(const [id,cost] of [['sera',30],['adela',85],['livia',190],['aurora',450]] as const){const before=m.gold;m.selectHero(id);expect(m.summonAt(m.units.length)).toBe(true);expect(before-m.gold).toBe(cost);}
  expect(heroById.serin.name).toBe('세린');
 });
 it('continues past checkpoints and rotates all four bosses without invalid enemy IDs',()=>{
  for(const n of [31,50,51,100,1000,10001]){const w=getWave(n);expect(w.number).toBe(n);expect(w.enemies.length).toBeGreaterThan(0);expect(w.enemies.every(id=>!!enemies[id])).toBe(true);}
  expect([10,20,30,40,50,100].map(n=>getWave(n).boss)).toEqual(['ravager','sovereign','tempest','abyssal','ravager','sovereign']);
  expect(getWave(55).elite).toBe(true);expect(getWave(50).elite).toBe(false);
  const m=new BattleModel(defaultSave(),()=>.99);m.start();m.wave.start(31);m.wave.queue=[];m.wave.elapsed=22;m.step(1/60);expect(m.intermission).toBe(4);for(let i=0;i<250;i++)m.step(1/60);expect(m.wave.number).toBe(32);expect(m.ended).toBe(false);
 });
});

function attack(...args:Parameters<typeof queueAttack>){queueAttack(...args);for(let i=0;i<120;i++)stepActions(args[0],1/60);}
