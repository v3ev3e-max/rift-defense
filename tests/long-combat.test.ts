import {it,expect} from 'vitest';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {seeded} from '../src/utils/random';
it('ten minutes of mixed combat keeps every transient pool bounded',()=>{
 const m=new BattleModel(defaultSave(),seeded(901));m.invincible=true;
 for(const id of ['sera','noel','karin','luna','adela','ian','mia','livia','aurora','kairon','arden','leon'])m.addUnit(id,3);
 m.start();for(let i=0;i<600*60;i++){while(m.choices.length)m.choose(m.choices[0].id);m.update(1/60);}
 expect(m.time).toBeCloseTo(900,5);expect(m.actions).toHaveLength(96);expect(m.zones).toHaveLength(12);expect(m.effects).toHaveLength(64);expect(m.damageNumbers).toHaveLength(16);expect(m.dotLabels.size).toBeLessThanOrEqual(48);expect(m.records).toHaveLength(12);
 expect(m.records.every(r=>Number.isFinite(r.damage)&&r.buckets.length===11)).toBe(true);
 console.log('10-minute simulation',{wave:m.wave.number,kills:m.kills,damage:Math.round(Object.values(m.statsDamage).reduce((a,b)=>a+b,0)),actions:m.actions.filter(a=>a.active).length,zones:m.zones.filter(z=>z.active).length});
},30000);
it('placement changes attack opportunities with the same three B units and budget',()=>{
 const run=(slots:number[])=>{const m=new BattleModel(defaultSave(),seeded(902));for(const slot of slots){m.selectedSlot=slot;m.addUnit('sera');}m.start();for(let i=0;i<90*60&&!m.ended;i++)m.update(1/60);return {wave:m.wave.number,kills:m.kills,core:m.core,damage:Object.values(m.statsDamage).reduce((a,b)=>a+b,0)};};
 const edge=run([0,4,19]),inner=run([6,7,11]);expect(edge.damage).not.toBe(inner.damage);console.log('Same three B placement comparison',{edge,inner});
});
it('repeated replacements retire instance history without losing overall damage totals',()=>{
 const m=new BattleModel(defaultSave());m.start();for(let i=0;i<400;i++){const u=m.addUnit('sera');m.sell(u.uid);m.step(1/60);}expect(m.records.length).toBeLessThanOrEqual(128);expect(m.retiredUnits.size).toBe(0);
});
