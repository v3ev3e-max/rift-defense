import { heroes } from "../data/heroes";
import type { SaveData } from "../data/types";
import {CAMPAIGN_SQUAD_CAP} from '../data/combatRoles';
import {armorCatalog,equipItem,heroWeaponGroup,makeEquipment,necklaceCatalog,rarityMax,weaponCatalog,type EquipmentItem} from '../data/equipment';
export const SAVE_KEY = "rift-defense-save-v1";
const LEGACY_HERO_IDS: Record<string, string> = { eve: "ian", lize: "leon" };
export const STARTER_HERO_IDS=['yuria','reina','sera','noel','arin'];
const LEGACY_STARTER_HERO_IDS=['yuria','sera','reina','karin','arin'];
export function validCampaignSquad(ids:string[],owned:Set<string>){
  const result=[...new Set(ids)].filter(id=>owned.has(id)&&!!heroes.find(h=>h.id===id)).slice(0,CAMPAIGN_SQUAD_CAP);
  return result;
}
export function defaultSave(): SaveData {
  const data:SaveData={
    saveVersion: 1,
    credits: 500,
    equipmentGold:0,
    shards: 0,
    heroes: Object.fromEntries(
      heroes.map((h) => [
        h.id,
        {
          owned: true,
          level: 1,
          breakthrough: 0,
          skillLevel: 1,
          equipment: [],
          affection: 0,
          stars:1,
        },
      ]),
    ),
    deck: [...STARTER_HERO_IDS],
    cleared: 0,
    bestWave: 0,
    runs: 0,
    tutorial: false,
    settings: { sound: true, bgm:true, sfx:true, bgmVolume:.65, sfxVolume:.8, shake: false, lowEffects: false, battleSpeed:1 },
    campaign:{selected:'1-1',doctrine:'rapid',autoAdvance:false,autoSkills:true,squad:[...STARTER_HERO_IDS],lastDeployment:{},deploymentPresetNames:['프리셋 1','프리셋 2','프리셋 3'],deploymentPresets:[null,null,null],records:{},research:{},fragments:{}},
    equipmentInventory:[],equipmentMaterials:30,autoSalvageB:false,equipmentPity:0,recruitPity:0,recruitCount:0,
  };
  for(const [i,id] of STARTER_HERO_IDS.entries()){const template=weaponCatalog.find(v=>v.weaponGroup===heroWeaponGroup[id])!;const item=makeEquipment(template.id,'B',i+1,`starter-${id}`);data.equipmentInventory.push(item);equipItem(data,id,item.id);}
  data.equipmentInventory.push(makeEquipment('armor-field','B',20,'starter-armor'),makeEquipment('necklace-fire','B',21,'starter-necklace'));
  grantTestCollection(data);
  return data;
}
/** Local QA reset intentionally starts with an empty item economy. */
export function localTestResetSave():SaveData{
  const data=defaultSave();
  data.equipmentInventory=[];
  data.equipmentMaterials=0;
  data.equipmentGold=0;
  data.shards=0;
  for(const hero of Object.values(data.heroes))hero.equipment=[];
  return data;
}
function grantTestCollection(data:SaveData){
  for(const h of heroes)data.heroes[h.id].owned=true;
  const catalog=[...weaponCatalog,...armorCatalog,...necklaceCatalog];
  for(const template of catalog){const id=`test-SR-${template.id}`;if(!data.equipmentInventory.some(v=>v.templateId===template.id))data.equipmentInventory.push(makeEquipment(template.id,'SR',data.equipmentInventory.length+100,id));}
}
const integer = (x: unknown, fallback: number, max = 1e9) =>
  typeof x === "number" && Number.isFinite(x)
    ? Math.min(max, Math.max(0, Math.floor(x)))
    : fallback;
export function parseSave(raw: string | null): SaveData {
  const d = defaultSave();
  if (!raw) return d;
  try {
    const s = JSON.parse(raw);
    if (s.saveVersion !== 1) return d;
    d.credits = integer(s.credits, 500);
    d.equipmentGold=integer(s.equipmentGold,0,99999999);
    d.shards = integer(s.shards, 0);
    d.cleared = integer(s.cleared, 0, 1);
    d.bestWave = integer(s.bestWave, 0, 999999);
    d.runs = integer(s.runs, 0);
    d.tutorial = s.tutorial === true;
    if(s.campaign){
      const c=d.campaign!;
      c.doctrine=['rapid','focus','guard'].includes(s.campaign.doctrine??'')?s.campaign.doctrine:'rapid';
      c.autoAdvance=s.campaign.autoAdvance===true;
      c.autoSkills=s.campaign.autoSkills!==false;
      if(Array.isArray(s.campaign.deploymentPresetNames))for(let i=0;i<3;i++){const name=s.campaign.deploymentPresetNames[i];if(typeof name==='string'&&name.trim())c.deploymentPresetNames[i]=name.trim().slice(0,16);}
      if(s.campaign.lastDeployment&&typeof s.campaign.lastDeployment==='object')for(const [heroId,slot] of Object.entries(s.campaign.lastDeployment))if(heroes.some(h=>h.id===heroId)&&integer(slot,-1,5)>=0)c.lastDeployment[heroId]=integer(slot,0,5);
      if(Array.isArray(s.campaign.deploymentPresets))for(let i=0;i<3;i++){
        const raw=s.campaign.deploymentPresets[i];if(!raw||!Array.isArray(raw.squad)||!raw.layout||typeof raw.layout!=='object')continue;
        const squad=[...new Set<string>(raw.squad.filter((id:unknown):id is string=>typeof id==='string'&&heroes.some(h=>h.id===id)))].slice(0,CAMPAIGN_SQUAD_CAP),layout:Record<string,number>={},used=new Set<number>();
        for(const id of squad){const slot=raw.layout[id];if(!Number.isInteger(slot)||slot<0||slot>5||used.has(slot))continue;layout[id]=slot;used.add(slot);}
        if(squad.length&&squad.every(id=>layout[id]!==undefined))c.deploymentPresets[i]={squad,layout};
      }
      const stageIds=Array.from({length:8},(_,region)=>Array.from({length:10},(_,stage)=>`${region+1}-${stage+1}`)).flat();
      if(stageIds.includes(s.campaign.selected))c.selected=s.campaign.selected;
      for(const id of stageIds){const r=s.campaign.records?.[id];if(r&&integer(r.stars,0,3)>0)c.records[id]={stars:integer(r.stars,0,3),time:integer(r.time,0),kills:integer(r.kills,0)};}
      for(const [key,value] of Object.entries(s.campaign.research??{}))if(/^(water|fire|electric|dark|burst|sniper|melee|chain|meteor|shell|drone|support|curse)$/.test(key))c.research[key]=integer(value,0,10);
      for(const h of heroes)if(s.campaign.fragments?.[h.id]!==undefined)c.fragments[h.id]=integer(s.campaign.fragments[h.id],0,999);
    }
    for (const h of heroes) {
      const legacyId = Object.entries(LEGACY_HERO_IDS).find(([, next]) => next === h.id)?.[0];
      const p = s.heroes?.[h.id] ?? (legacyId ? s.heroes?.[legacyId] : undefined);
      if (p)
        d.heroes[h.id] = {
          owned: true,
          level: Math.max(1, integer(p.level, 1, 50)),
          breakthrough: integer(p.breakthrough, 0, 5),
          skillLevel: Math.max(1, integer(p.skillLevel, 1, 10)),
          equipment: Array.isArray(p.equipment)
            ? p.equipment
                .filter((x: unknown) => typeof x === "string")
                .slice(0, 4)
            : [],
          affection: integer(p.affection, 0, 100),
          stars:Math.max(1,integer(p.stars??p.breakthrough+1,1,5)),
        };
    }
    d.equipmentMaterials=integer(s.equipmentMaterials,30,999999);
    d.autoSalvageB=s.autoSalvageB===true;d.equipmentPity=integer(s.equipmentPity,0,100);
    d.recruitPity=integer(s.recruitPity,0,29);d.recruitCount=integer(s.recruitCount,0,999999);
    const hadEquipmentInventory=Array.isArray(s.equipmentInventory);
    if(hadEquipmentInventory){
      const seen=new Set<string>();d.equipmentInventory=[];
      for(const raw of s.equipmentInventory){if(!raw||typeof raw.id!=='string'||seen.has(raw.id))continue;try{const base=makeEquipment(String(raw.templateId),(['B','A','S','SR'].includes(raw.rarity)?raw.rarity:'B'),integer(raw.order,Date.now()),raw.id) as EquipmentItem;base.enhance=integer(raw.enhance,0,rarityMax[base.rarity]);base.locked=raw.locked===true;d.equipmentInventory.push(base);seen.add(base.id);}catch{}}
      for(const h of heroes)d.heroes[h.id].equipment=[];
      for(const raw of s.equipmentInventory){if(typeof raw?.equippedBy==='string'){const item=d.equipmentInventory.find(v=>v.id===raw.id);if(item&&d.heroes[raw.equippedBy])equipItem(d,raw.equippedBy,item.id);}}
    }
    if(!hadEquipmentInventory)for(const [index,h] of heroes.entries())if(d.heroes[h.id].owned&&!d.heroes[h.id].equipment.some(id=>d.equipmentInventory.find(v=>v.id===id)?.slot==='weapon')){const existing=d.equipmentInventory.find(v=>v.equippedBy===h.id&&v.slot==='weapon');if(existing)equipItem(d,h.id,existing.id);else{const template=weaponCatalog.find(v=>v.weaponGroup===heroWeaponGroup[h.id])!;const item=makeEquipment(template.id,'B',Date.now()+index,`basic-${h.id}-${Date.now()}`);d.equipmentInventory.push(item);equipItem(d,h.id,item.id);}}
    const owned=new Set(heroes.filter(h=>d.heroes[h.id].owned).map(h=>h.id));
    if(Array.isArray(s.campaign?.squad)){
      const savedSquad=s.campaign.squad.map((id:string)=>LEGACY_HERO_IDS[id]??id);
      d.campaign!.squad=validCampaignSquad(savedSquad.length===LEGACY_STARTER_HERO_IDS.length&&savedSquad.every((id:string,i:number)=>id===LEGACY_STARTER_HERO_IDS[i])?STARTER_HERO_IDS:savedSquad,owned);
    }
    if (Array.isArray(s.deck)) {
      const deck = [
        ...new Set<string>(
          s.deck
            .filter((id: unknown): id is string => typeof id === "string")
            .map((id: string) => LEGACY_HERO_IDS[id] ?? id)
            .filter((id: string) => heroes.some((h) => h.id === id)&&d.heroes[id].owned),
        ),
      ].slice(0, 10);
      if (deck.length) d.deck = deck;
    }
    if (s.settings)
      for (const k of ["sound", "bgm", "sfx", "shake", "lowEffects"] as const)
        if (typeof s.settings[k] === "boolean") d.settings[k] = s.settings[k];
    if(typeof s.settings?.bgmVolume==='number'&&Number.isFinite(s.settings.bgmVolume))d.settings.bgmVolume=Math.max(0,Math.min(1,s.settings.bgmVolume));
    if(typeof s.settings?.sfxVolume==='number'&&Number.isFinite(s.settings.sfxVolume))d.settings.sfxVolume=Math.max(0,Math.min(1,s.settings.sfxVolume));
    if ([.75,1,1.5,2].includes(s.settings?.battleSpeed)) d.settings.battleSpeed=s.settings.battleSpeed;
    return d;
  } catch {
    return d;
  }
}
export class SaveSystem {
  data: SaveData;
  available = true;
  constructor() {
    try {
      this.data = parseSave(localStorage.getItem(SAVE_KEY));
    } catch {
      this.data = defaultSave();
      this.available = false;
    }
  }
  persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      this.available = true;
    } catch {
      this.available = false;
    }
    return this.available;
  }
  upgrade(id: string) {
    const h = this.data.heroes[id];
    const cost = h.level * 60;
    if (h.level >= 50 || this.data.credits < cost) return false;
    this.data.credits -= cost;
    h.level++;
    this.persist();
    return true;
  }
  import(raw: string) {
    const obj = JSON.parse(raw);
    if (obj.saveVersion !== 1 || !obj.heroes || !Array.isArray(obj.deck))
      throw new Error("지원하지 않는 저장 파일입니다.");
    this.data = parseSave(raw);
    this.persist();
  }
}
