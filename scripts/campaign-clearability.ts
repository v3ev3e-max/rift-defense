import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {campaignStages,campaignRegion} from '../src/data/campaign';
import {campaignRegionBalance} from '../src/data/campaignBalance';
import {campaignGrowthGuide} from '../src/data/campaignGrowthGuide';
import {heroById} from '../src/data/heroes';
import {formationRole,combatRoles} from '../src/data/combatRoles';
import {equipItem,makeEquipment,heroWeaponGroup} from '../src/data/equipment';
import type {HeroGrade} from '../src/data/types';
// @ts-expect-error Node audit runner
import {mkdirSync,writeFileSync} from 'node:fs';

const squads={starter:['yuria','reina','sera','noel','arin'],balanced:['yuria','neris','sera','arin','rhea'],
 sOnly:['gaia','livia','theria','elise','meriel'],sr1:['astra','livia','theria','elise','meriel'],
 sr2:['astra','livia','celestia','theria','meriel'],sr3:['astra','livia','celestia','solara','meriel'],
 sr5:['astra','celestia','solara','aurora','ophilia'],
 sHealer:['gaia','livia','theria','elise','selene'],sMixed:['gaia','livia','kairon','elise','selene'],
 sCaster:['gaia','livia','ciel','theria','selene'],sr1Damage:['gaia','livia','theria','celestia','meriel'],
 sr1Heal:['gaia','livia','theria','elise','ophilia'],sr1Leon:['leon','livia','theria','elise','meriel']};
type Squad=keyof typeof squads;
interface Profile {id:string;squad:Squad;stars:number;rarity:HeroGrade;enhance:number;full?:boolean;research?:number;growth?:boolean;manual?:boolean}
export const profiles:Profile[]=[
 {id:'tested-guide-growth',squad:'sr1',stars:5,rarity:'SR',enhance:5,full:true,research:10,growth:true},
 {id:'starter-default',squad:'starter',stars:1,rarity:'B',enhance:0},
 {id:'starter-weapon-B5',squad:'starter',stars:1,rarity:'B',enhance:5},
 {id:'balanced-B0',squad:'balanced',stars:1,rarity:'B',enhance:0,full:true},
 ...(['starter','balanced','sOnly','sr1','sr2','sr3','sr5'] as Squad[]).map(squad=>({id:`${squad}-growth`,squad,stars:5,rarity:'SR' as HeroGrade,enhance:5,full:true,research:10,growth:true})),
 ...(['sOnly','sHealer','sMixed','sCaster','sr1','sr1Damage','sr1Heal','sr1Leon','sr2','sr3','sr5'] as Squad[]).map(squad=>({id:`${squad}-max`,squad,stars:5,rarity:'SR' as HeroGrade,enhance:5,full:true,research:10})),
 {id:'sMixed-max-manual',squad:'sMixed',stars:5,rarity:'SR',enhance:5,full:true,research:10,manual:true},
 {id:'sOnly-stars-only',squad:'sOnly',stars:5,rarity:'B',enhance:0,full:true},
 {id:'sOnly-S0',squad:'sOnly',stars:5,rarity:'S',enhance:0,full:true},
 {id:'sOnly-S5',squad:'sOnly',stars:5,rarity:'S',enhance:5,full:true},
 {id:'sOnly-S5-research',squad:'sOnly',stars:5,rarity:'S',enhance:5,full:true,research:10},
 {id:'sr3-max-manual',squad:'sr3',stars:5,rarity:'SR',enhance:5,full:true,research:10,manual:true},
];
function rng(seed:number){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function saveFor(profile:Profile,region:number){
 const save=defaultSave();save.equipmentInventory=[];
 for(const hero of Object.values(save.heroes)){hero.equipment=[];hero.stars=profile.growth?campaignRegionBalance[region-1].stars:profile.stars;}
 let rarity=profile.rarity,enhance=profile.enhance,research=profile.research??0;
 if(profile.growth){rarity=region<=2?'B':region<=4?'A':region<=7?'S':'SR';enhance=region<=2?0:region<=4?2:region<=7?3:5;research=Math.min(10,Math.max(0,region-2));}
 const guide=profile.id==='tested-guide-growth'?campaignGrowthGuide(region):undefined;
 const ids=guide?.squad??squads[profile.squad];save.campaign!.squad=[...ids];
 for(const id of ids){
  const role=formationRole(id),h=heroById[id];
  for(const key of [combatRoles[id].kind,h.element])save.campaign!.research[key]=research;
  const templates=[`${heroWeaponGroup[id]}-${role==='support'?3:role==='sniper'?1:2}`];
  // The actual starting weapons are standard B+0, not optimized variants.
  if(profile.id.startsWith('starter-')&&!profile.full||guide&&!guide.fullEquipment)templates[0]=`${heroWeaponGroup[id]}-0`;
  if(guide?guide.fullEquipment:profile.full)templates.push(role==='tank'?'armor-guardian':'armor-ranged',`necklace-${h.element}`);
  for(const template of templates){const item=makeEquipment(template,rarity,save.equipmentInventory.length,`audit-${id}-${template}`);item.enhance=enhance;save.equipmentInventory.push(item);equipItem(save,id,item.id);}
 }
 return save;
}
export function simulate(profile:Profile,stage:typeof campaignStages[number],seed:number,dt=1/30){
 const save=saveFor(profile,campaignRegion(stage)),ids=save.campaign!.squad,model=new BattleModel(save,rng(seed));model.configureCampaign(stage,ids,true);model.autoDeployCampaign();model.start();
 if(profile.manual)model.autoSkills=false;
 // Rendering-only effects are omitted; all combat, projectile and skill logic runs.
 model.emit=()=>{};let steps=0;
 while(!model.ended&&model.time<900&&steps++<900/dt+100){
  if(profile.manual)for(const unit of model.units)if(unit.hp>0&&(unit.skillCharge??0)>=100)model.manualSkill(unit.uid);
  model.step(dt);
 }
 return {stage:stage.id,profile:profile.id,seed,won:!!model.result?.won,ended:model.ended,core:Math.round(model.core),time:Math.round(model.time),wave:model.wave.number,
  survivors:model.units.filter(u=>u.hp>0).length,damageTaken:Math.round(model.units.reduce((n,u)=>n+(u.damageTaken??0),0)),
  hpRemaining:Math.round(model.units.reduce((n,u)=>n+Math.max(0,u.hp),0)/model.units.reduce((n,u)=>n+u.maxHp,0)*100),
  srCount:ids.filter(id=>heroById[id].grade==='SR').length,squad:ids,stars:save.heroes[ids[0]].stars};
}
export function runAudit(){
// @ts-expect-error Node audit command arguments
const mode=process.argv[2]??'baseline',selected=process.argv[3];
const active=selected?profiles.filter(p=>p.id===selected):mode==='baseline'?profiles.filter(p=>p.id==='starter-default'):profiles;
if(!active.length)throw Error('Unknown profile '+selected);
const regional=mode.startsWith('region')?Number(mode.slice(6)):0;
const stages=regional?campaignStages.filter(s=>campaignRegion(s)===regional):mode==='sweep'||mode==='check'?campaignStages.filter(s=>s.id.endsWith('-10')||['1-5','1-9','4-3','8-3','12-9','16-9'].includes(s.id)):campaignStages;
const seeds=mode==='verify'||mode==='check'||regional?[17,73,211]:[17];
const results=[];mkdirSync('artifacts',{recursive:true});
for(const profile of active){
 for(const stage of stages)for(const seed of seeds)results.push(simulate(profile,stage,seed,mode==='verify'||mode==='check'||regional?1/60:1/30));
 const rows=results.filter(r=>r.profile===profile.id);
 console.log(JSON.stringify({profile:profile.id,battles:rows.length,wins:rows.filter(r=>r.won).length,firstFailure:rows.find(r=>!r.won)?.stage,failed:rows.filter(r=>!r.won).map(r=>r.stage)}));
 writeFileSync(`artifacts/campaign-clearability-${mode}${selected?'-'+selected:''}.json`,JSON.stringify({mode,profiles:active,results},null,2));
}
}
// @ts-expect-error Node audit entry point
if(/campaign-clearability[^/\\]*\.mjs$/.test(process.argv[1]??''))runAudit();
