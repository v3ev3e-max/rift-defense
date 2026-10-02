import {it,expect} from 'vitest';
import {profiles,simulate} from '../scripts/campaign-clearability';
import {campaignStages} from '../src/data/campaign';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
it('unspent promotion fragments do not change combat attack power',()=>{
 const save=defaultSave();const before=new BattleModel(save);before.configureCampaign(campaignStages[0],['yuria']);const attack=before.stats(before.units[0]).atk;
 save.campaign!.fragments.yuria=999;const after=new BattleModel(save);after.configureCampaign(campaignStages[0],['yuria']);
 expect(after.stats(after.units[0]).atk).toBe(attack);
});
it('starting B+0 weapons clear the first boss but require growth at 3-10',()=>{
 const profile=profiles.find(p=>p.id==='starter-default')!;
 expect(simulate(profile,campaignStages.find(s=>s.id==='1-10')!,17,1/60).won).toBe(true);
 expect(simulate(profile,campaignStages.find(s=>s.id==='3-10')!,17,1/60).won).toBe(false);
},60_000);
it.each([17,73,211])('one SR with a grown mixed-role squad clears the final boss with seed %s',seed=>{
 const result=simulate(profiles.find(p=>p.id==='sr1-growth')!,campaignStages.at(-1)!,seed,1/60);
 expect(result.srCount).toBe(1);expect(result.ended).toBe(true);expect(result.won).toBe(true);
},60_000);
