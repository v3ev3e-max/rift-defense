import {writeFileSync} from 'node:fs';
import {heroes} from '../src/data/heroes';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {campaignStages,pathExposure} from '../src/data/campaign';
import {stepCombat} from '../src/systems/CombatSystem';
import {stepActions,castAutoSkill} from '../src/systems/ActionCombat';
const rows=[];
for(const h of heroes)for(const targets of [1,3])for(const auto of [false,true]){
 const save=defaultSave();save.equipmentInventory=[];for(const p of Object.values(save.heroes)){p.equipment=[];p.stars=1;}
 const m=new BattleModel(save,()=>.99);m.configureCampaign(campaignStages[0],[h.id]);m.autoSkills=auto;const u=m.units[0];u.x=400;u.y=400;m.start();m.wave.queue=[];
 for(let i=0;i<targets;i++){m.spawn('crawler');const e=m.enemies[i];e.progress=300-i*18;e.x=450+i*18;e.y=400;e.speed=0;e.hp=e.maxHp=1e8;e.armor=0;}
 for(let i=0;i<1800;i++){u.hp=u.maxHp;m.time+=1/60;stepCombat(m,1/60);stepActions(m,1/60);}
 const r=m.records[0];rows.push({id:h.id,grade:h.grade,targets,auto,atk:m.stats(u).atk,speed:m.stats(u).speed,hp:u.maxHp,range:m.stats(u).range,exposure:pathExposure(campaignStages[0],u,m.stats(u).range),dps:r.damage/30,parts:r.parts,casts:r.autoCasts,blockTime:r.blockTime,heal:u.healingDone??0});
}
writeFileSync(process.argv[2]??'artifacts/hero-budget.json',JSON.stringify(rows,null,2));console.table(rows.filter(r=>r.targets===1&&r.auto).map(({id,grade,atk,dps,casts})=>({id,grade,atk,dps,casts})));
