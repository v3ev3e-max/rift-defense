import {writeFileSync,mkdirSync,readFileSync,existsSync} from 'node:fs';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {campaignStages} from '../src/data/campaign';
import {seeded} from '../src/utils/random';
import {makeEquipment,equipItem,heroWeaponGroup} from '../src/data/equipment';
import {heroes} from '../src/data/heroes';
import type {HeroGrade} from '../src/data/types';
import {castManualSkill} from '../src/systems/AutoSkills';

// Fixed input profiles; never tune enemies to the player's currently equipped team.
const starter=['yuria','sera','reina','karin','arin'];
const profiles=[
 {name:'starter-1',squad:starter,stars:1},
 {name:'recommended',squad:starter},
 {name:'no-skills',squad:starter,auto:false},
 {name:'gear-0',squad:starter,gear:0},
 {name:'gear-2',squad:starter,gear:2},
 {name:'gear-5',squad:starter,gear:5},
 {name:'snipers',squad:['arin','noel','elise','vera','celestia']},
 {name:'tanks',squad:['yuria','mia','leon','neris','livia']},
 {name:'two-tanks',squad:['yuria','neris','adela','luna','arin']},
 {name:'no-tank',squad:['reina','sera','luna','adela','arin']},
 {name:'fire',squad:['leon','reina','sera','belka','kairon']},
 {name:'water-electric',squad:['yuria','neris','adela','arin','ian']},
 {name:'three-elements',squad:['yuria','reina','arin','sera','ian']},
 {name:'support',squad:['yuria','mia','reina','karin','arin']},
 {name:'endgame',squad:['astra','ophilia','arden','aurora','celestia'],stars:5,gear:5},
 {name:'growth-no-gear',squad:starter,noGear:true},
 {name:'manual-layout',squad:starter,layout:{yuria:4,karin:1,sera:3,reina:5,arin:0}},
 {name:'manual-skills',squad:starter,auto:false,manual:true,layout:{yuria:4,karin:1,sera:3,reina:5,arin:0}},
] as {name:string;squad:string[];stars?:number;auto?:boolean;gear?:number;noGear?:boolean;manual?:boolean;layout?:Record<string,number>}[];
const output=process.argv[2]??'artifacts/campaign-matrix.json';
const rows:any[]=process.argv.includes('--resume')&&existsSync(output)?JSON.parse(readFileSync(output,'utf8')).rows:[];
const seed=Number(process.argv.find(a=>a.startsWith('--seed='))?.slice(7)??20260913);
const quick=process.argv.includes('--quick');
const selected=process.argv.find(a=>a.startsWith('--stages='))?.slice(9).split(',');
const regions=process.argv.find(a=>a.startsWith('--regions='))?.slice(10).split(',');
for(const stage of campaignStages.filter(s=>(!regions||regions.includes(s.id.split('-')[0]))&&(!selected||selected.includes(s.id))&&(!quick||['1-1','1-10','5-10','6-1','7-1','8-3','8-10'].includes(s.id)))){
 const region=Number(stage.id.split('-')[0]);
 for(const profile of profiles.filter(p=>!process.argv.some(a=>a.startsWith('--profile='))||process.argv.includes('--profile='+p.name))){
  if(rows.some(r=>r.stage===stage.id&&r.profile===profile.name))continue;
  const save=defaultSave();save.equipmentInventory=[];save.campaign!.research={};save.campaign!.fragments={};
  for(const h of Object.values(save.heroes)){h.stars=profile.stars??[1,1,2,2,3,3,4,5][region-1];h.equipment=[];}
  save.campaign!.squad=[...profile.squad];
  const gear=profile.noGear||profile.name==='starter-1'?undefined:profile.gear??(region>=6?region===6?2:region===7?3:5:undefined);
  if(gear!==undefined&&profile.name!=='starter-1')for(const id of profile.squad){
   const rarity:HeroGrade=region<=6?'A':region===7?'S':'SR';
   for(const template of [`${heroWeaponGroup[id]}-0`,'armor-field',`necklace-${heroes.find(h=>h.id===id)!.element}`]){
    const item=makeEquipment(template,rarity,save.equipmentInventory.length,`${id}-${template}`);item.enhance=gear;save.equipmentInventory.push(item);equipItem(save,id,item.id);
   }
  }
  const m=new BattleModel(save,seeded(seed));m.configureCampaign(stage,profile.squad,true);m.autoDeployCampaign();m.autoSkills=profile.auto!==false;
  if(profile.layout)m.deployCampaignLayout(profile.layout);
  const spawned=new Map<number,{kind:string;at:number;hp:number;front:boolean;end?:number;outcome?:string;skillCasts?:number}>();
  const spawn=m.spawn.bind(m);m.spawn=(kind:string)=>{const ok=spawn(kind);if(ok){const e=m.enemies.find(e=>e.active&&e.generation===m.spawnGeneration)!;spawned.set(e.generation!,{kind,at:m.time,hp:e.maxHp,front:false});}return ok;};
  m.start();for(let tick=0;tick<60*600&&!m.ended;tick++){
   if(profile.manual&&tick%15===0)for(const u of m.units)castManualSkill(m,u);
   m.step(1/60);
   for(const e of m.enemies){const r=spawned.get(e.generation!);if(!r)continue;r.skillCasts=e.skillCasts;if(e.active&&e.x<=580)r.front=true;if(!e.active&&r.end===undefined){r.end=m.time;r.outcome=e.hp<=0?'killed':e.progress>=(e.route&&stage.alternate?stage.alternate:stage.map).pathLength?'escaped':'cleared';}}
  }
  rows.push({stage:stage.id,profile:profile.name,stars:save.heroes[profile.squad[0]].stars,gear:gear??null,won:m.result?.won??false,ended:m.ended,core:m.core,time:m.time,wave:m.wave.number,kills:m.kills,frontRate:[...spawned.values()].filter(e=>e.front).length/Math.max(1,spawned.size),enemies:[...spawned.values()],heroes:m.records.map(r=>({...r,buckets:undefined})),reactions:m.reactionCounts,damageTaken:m.units.map(u=>({id:u.heroId,taken:u.damageTaken??0,healed:u.healingDone??0}))});
 }
 console.log(stage.id,rows.filter(r=>r.stage===stage.id).map(r=>`${r.profile}:${r.won?'W':'L'}/${Math.round(r.core)}`).join(' '));
 mkdirSync('artifacts',{recursive:true});writeFileSync(output,JSON.stringify({generatedAt:new Date().toISOString(),seed,rows},null,2));
}
