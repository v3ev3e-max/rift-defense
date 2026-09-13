import {BattleModel} from './BattleModel';
import {defaultSave} from './SaveSystem';
import {campaignStages,pathExposure,type CampaignStage} from '../data/campaign';
import {campaignRegionBalance} from '../data/campaignBalance';
import {combatRoles,formationRole} from '../data/combatRoles';
import {heroes} from '../data/heroes';
import {equipItem,makeEquipment,heroWeaponGroup} from '../data/equipment';
import type {SaveData,HeroGrade} from '../data/types';
import {campaignCombatBudget} from '../data/campaignCombatBudget';

/** An estimate, not a guaranteed win: range exposure and role utility have explicit budgets. */
export function campaignPower(save:SaveData,stage:CampaignStage=campaignStages[0]){
 const model=new BattleModel(save,()=>.5);model.configureCampaign(stage,save.campaign?.squad??[],true);model.autoDeployCampaign();
 return Math.round(model.units.reduce((total,u)=>{
  const stats=model.stats(u),budget=campaignCombatBudget[u.heroId];
  const exposure=Math.max(...pathExposure(stage,u,stats.range),0)/stage.map.pathLength;
  // Measured single-target and three-target output includes windup, DOT and reactions.
  // A mixed encounter spends 65% of its time against one target, 35% against a crowd.
  const measured=budget?(.65*budget.singleDps+.35*budget.crowdDps)*(stats.atk/budget.attack)*(stats.speed/budget.speed):stats.atk*stats.speed;
  const dps=measured*(.55+.45*exposure);
  const defense=u.maxHp*(formationRole(u.heroId)==='tank'?.18:.025)+stats.e.block*22+stats.e.heal*12;
  return total+dps*2+defense;
 },0));
}
const recommendations=new Map<string,number>();
export function recommendedCampaignPower(stage:CampaignStage){
 if(recommendations.has(stage.id))return recommendations.get(stage.id)!;
 const region=Number(stage.id.split('-')[0]),save=defaultSave();save.equipmentInventory=[];
 for(const h of Object.values(save.heroes)){h.stars=campaignRegionBalance[region-1].stars;h.equipment=[];}
 if(region>=6)for(const id of save.campaign!.squad){
  const rarity:HeroGrade=region===6?'A':region===7?'S':'SR';
  for(const template of [`${heroWeaponGroup[id]}-0`,'armor-field',`necklace-${heroes.find(h=>h.id===id)!.element}`]){
   const item=makeEquipment(template,rarity,save.equipmentInventory.length,`${id}-${template}`);item.enhance=region===6?2:region===7?3:5;save.equipmentInventory.push(item);equipItem(save,id,item.id);
  }
 }
 const power=Math.round(campaignPower(save,stage)*(1+(Number(stage.id.split('-')[1])-1)*.008));recommendations.set(stage.id,power);return power;
}
