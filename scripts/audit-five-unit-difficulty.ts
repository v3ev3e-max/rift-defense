import {writeFileSync} from 'node:fs';
import {campaignStages} from '../src/data/campaign';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';

const rows=[];
for(const stage of campaignStages){
 const save=defaultSave();
 for(const hero of Object.values(save.heroes)){hero.equipment=[];hero.stars=1;}
 save.campaign!.research={};
 const m=new BattleModel(save,()=>.5);
 m.configureCampaign(stage,save.campaign!.squad,true);
 m.autoDeployCampaign();
 let spawnedHp=0,objectiveHp=0,spawned=0;
 const original=m.spawn.bind(m);
 m.spawn=(kind:string)=>{const before=new Set(m.enemies.filter(e=>e.active).map(e=>e.generation));original(kind);const fresh=m.enemies.filter(e=>e.active&&!before.has(e.generation));for(const e of fresh){spawnedHp+=e.maxHp;spawned++;if(m.wave.data.objective===kind)objectiveHp=Math.max(objectiveHp,e.maxHp);}};
 m.start();
 for(let i=0;i<60*900&&!m.ended;i++)m.step(1/60);
 const damage=m.records.reduce((n,r)=>n+r.damage,0),averageDps=damage/Math.max(1,m.time);
 rows.push({stage:stage.id,waves:stage.waves,won:!!m.result?.won,core:Math.ceil(m.core),time:+m.time.toFixed(1),spawned,spawnedHp:Math.round(spawnedHp),objectiveHp:Math.round(objectiveHp),damage:Math.round(damage),averageDps:+averageDps.toFixed(1),hpPerDpsSecond:+(spawnedHp/Math.max(1,averageDps)).toFixed(1),living:m.units.filter(u=>u.hp>0).length});
}
writeFileSync('artifacts/five-unit-difficulty.json',JSON.stringify(rows,null,2));
for(const region of Array.from({length:8},(_,i)=>i+1)){
 const set=rows.filter(r=>r.stage.startsWith(region+'-'));
 console.log(JSON.stringify({region,wins:set.filter(r=>r.won).length,avgCore:Math.round(set.reduce((n,r)=>n+r.core,0)/set.length),avgDps:Math.round(set.reduce((n,r)=>n+r.averageDps,0)/set.length),avgSpawnedHp:Math.round(set.reduce((n,r)=>n+r.spawnedHp,0)/set.length),minTime:Math.min(...set.map(r=>r.time)),maxTime:Math.max(...set.map(r=>r.time)),boss:set.at(-1)}));
}
