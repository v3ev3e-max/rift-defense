import {it,expect} from 'vitest';
// @ts-expect-error Vitest provides Node APIs; the application compiler targets browsers.
import {writeFileSync} from 'node:fs';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {seeded} from '../src/utils/random';
import {purchasePrice} from '../src/data/strategy';
function recruit(m:BattleModel,id:string,copies:number){
 for(let i=0;i<copies;i++){
  const slot=m.map.slots.findIndex((_,i)=>!m.units.some(u=>u.slot===i));m.selectHero(id);if(!m.summonAt(slot))break;
  while(true){const u=m.units.find(u=>u.star<5&&m.units.some(v=>v!==u&&v.heroId===u.heroId&&v.star===u.star));if(!u)break;m.merge(u.uid);while(m.choices.length)m.choose(m.choices.some(c=>c.id==='spread')?'spread':m.choices[0].id);}
 }
}
it('compares equal starting budgets, archetypes, priorities and expanded squads',()=>{
 const results:any[]=[];
 const builds:Record<string,[string,number][]>={'B 성장':[['sera',8],['mia',2]],'A 조합':[['adela',4],['neris',4]],'S 전문':[['kairon',4],['livia',2]],'SR 집중':[['aurora',2]],반응:[['neris',2],['adela',2],['serin',2],['reina',2]],'근접 혼합':[['yuria',4],['noel',4],['leon',2]],드론:[['ian',4],['kyle',2],['mia',4]],저격:[['noel',4],['arin',4],['leon',2]],포격:[['luna',4],['belka',2],['reina',2]],지원:[['sera',4],['mia',4],['leon',4]]};
 for(const [name,plan] of Object.entries(builds))for(const enemy of ['runner','armored','crawler','ravager']){
  const m=new BattleModel(defaultSave(),seeded(923));m.gold=1500;for(const [id,n]of plan)recruit(m,id,n);
  m.start();m.wave.start(20);m.wave.queue=[];m.wave.elapsed=-1000;m.invincible=true;
  for(let i=0;i<8;i++){m.spawn(enemy);const e=m.enemies.filter(e=>e.active).at(-1)!;e.progress=i*20;m.map.pathPoint(e.progress,e);}
  for(let i=0;i<40*60;i++)m.update(1/60);
  results.push({build:name,enemy,spent:m.totalSpent,left:m.gold,units:m.units.length,kills:m.kills,damage:Math.round(Object.values(m.statsDamage).reduce((a,b)=>a+b,0)),skills:m.records.reduce((a,r)=>a+r.autoCasts,0)});
 }
 const bCost=Array.from({length:16},(_,i)=>purchasePrice('sera',i)).reduce((a,b)=>a+b,0);
 const m=new BattleModel(defaultSave(),seeded(93));m.gold=bCost;recruit(m,'sera',16);expect(m.units).toHaveLength(1);expect(m.units[0].star).toBe(5);const bAtk=m.stats(m.units[0]).atk;
 const sr=m.addUnit('aurora',2);expect(bAtk*m.stats(m.units[0]).speed).toBeGreaterThan(m.stats(sr).atk*m.stats(sr).speed);
 for(const r of results){expect(r.spent).toBeLessThanOrEqual(1500);expect(Number.isFinite(r.damage)).toBe(true);}
 expect(results.some(r=>r.kills>0)).toBe(true);
 writeFileSync('artifacts/strategy-balance.json',JSON.stringify({budget:1500,bFiveStarCost:bCost,bFiveStarAttack:bAtk,srTwoStarAttack:m.stats(sr).atk,results},null,2));
 console.log('Budget comparison saved: artifacts/strategy-balance.json', {bCost,bAtk,srAtk:m.stats(sr).atk});
},60000);
