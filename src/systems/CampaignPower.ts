import {BattleModel} from './BattleModel';
import {defaultSave} from './SaveSystem';
import {campaignStages,pathExposure,type CampaignStage} from '../data/campaign';
import {campaignRegionBalance} from '../data/campaignBalance';
import {combatRoles,formationRole} from '../data/combatRoles';
import {heroes} from '../data/heroes';
import {equipItem,makeEquipment,heroWeaponGroup} from '../data/equipment';
import type {SaveData,HeroGrade} from '../data/types';
import {campaignCombatBudget} from '../data/campaignCombatBudget';
import {campaignGrowthGuide} from '../data/campaignGrowthGuide';

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
 const region=Number(stage.id.split('-')[0]),guide=campaignGrowthGuide(region),save=defaultSave();save.equipmentInventory=[];
 save.campaign!.squad=guide.squad;
 for(const h of Object.values(save.heroes)){h.stars=guide.stars;h.equipment=[];}
 for(const id of save.campaign!.squad){
  const hero=heroes.find(h=>h.id===id)!,role=formationRole(id);
  for(const key of [combatRoles[id].kind,hero.element])save.campaign!.research[key]=guide.research;
  const templates=[`${heroWeaponGroup[id]}-${!guide.fullEquipment?0:role==='support'?3:role==='sniper'?1:2}`];
  if(guide.fullEquipment)templates.push(role==='tank'?'armor-guardian':'armor-ranged',`necklace-${hero.element}`);
  for(const template of templates){
   const item=makeEquipment(template,guide.rarity,save.equipmentInventory.length,`${id}-${template}`);item.enhance=guide.enhance;save.equipmentInventory.push(item);equipItem(save,id,item.id);
  }
 }
 const power=Math.round(campaignPower(save,stage)*(1+(Number(stage.id.split('-')[1])-1)*.02));recommendations.set(stage.id,power);return power;
}
