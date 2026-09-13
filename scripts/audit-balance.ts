import {writeFileSync} from 'node:fs';
import {battleMaps} from '../src/data/map';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {seeded} from '../src/utils/random';
const rows=[];
const limit=Number(process.argv[3]||20);
const openingOnly=process.argv[4]==='opening-only';
for(const map of battleMaps)for(const seed of [1,2,3]){
 const save=defaultSave();save.tutorial=true;const m=new BattleModel(save,seeded(seed),map);m.start();
 const samples=Array.from({length:150},(_,i)=>map.pathPoint(map.pathLength*i/150,{x:0,y:0}));
 const order=map.slots.map((s,i)=>({i,score:samples.reduce((n,p)=>n+(Math.hypot(p.x-s.x,p.y-s.y)<145?1:0),0)})).sort((a,b)=>b.score-a.score).map(s=>s.i);
 if(process.argv[5]==='inner-first')order.reverse();
 let next=0;const checkpoints=[];
 for(let tick=0;tick<36000&&!m.ended&&m.wave.number<=limit;tick++){
  if(m.choices.length)m.choose(m.choices[0].id);
  if(tick%30===0 && (!openingOnly || tick<270)){
   if(m.units.length>=12)m.merge();
   const slot=order.find(i=>!m.units.some(u=>u.slot===i));
   if(slot!==undefined&&m.units.length<18&&m.gold>=m.summonCost)m.summonAt(slot);
   else if(m.units.length>=18){const id=m.units[next++%m.units.length].heroId;m.upgrade(id);}
  }
  m.update(.1);
  if(checkpoints.at(-1)?.wave!==m.wave.number)checkpoints.push({wave:m.wave.number,core:m.core});
 }
 rows.push({map:map.id,seed,slots:map.slots.length,length:map.pathLength,wave:m.wave.number,core:m.core,time:Math.round(m.time),kills:m.kills,star:m.highestStar,checkpoints});
}
writeFileSync(process.argv[2]||'artifacts/balance-baseline.json',JSON.stringify(rows,null,2));console.log(rows.map(({checkpoints,...r})=>r));
