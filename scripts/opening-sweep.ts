import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {campaignStages,campaignWave} from '../src/data/campaign';
import {seeded} from '../src/utils/random';
for(const count of [1,2,3,4])for(const auto of [true,false]){
 const s=defaultSave();for(const h of Object.values(s.heroes))h.equipment=[];
 const stage=campaignStages[0],m=new BattleModel(s,seeded(20260913));m.configureCampaign(stage,s.campaign!.squad,true);m.autoDeployCampaign();m.autoSkills=auto;
 m.wave.provider=n=>{const w=campaignWave(stage,n);return {...w,enemies:[...Array(count).fill('sprinter'),...w.enemies]};};
 m.start();for(let i=0;i<24000&&!m.ended;i++)m.step(1/60);
 console.log(JSON.stringify({count,auto,won:m.result?.won,core:m.core,time:m.time}));
}
