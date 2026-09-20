import { BALANCE, combatRange, REFERENCE_PATH_LENGTH, MELEE_STRIKE_RANGE, DEALER_BASE_RANGE, SNIPER_BASE_RANGE } from "../data/balance";
import type {CampaignStage} from '../data/campaign';
import {campaignRegion,campaignWave,frontlineSlots} from '../data/campaign';
import {campaignVanguardHealth} from '../data/campaignBalance';
import { heroes, heroById, elementNames } from "../data/heroes";
import { enemies } from "../data/enemies";
import { battleMaps, CELL, type BattleMap } from "../data/map";
import type { Build, Choice, Element, ElementReaction, HeroGrade, SaveData } from "../data/types";
import {elementUpgradeCost,elementUpgradeMax} from '../data/elementUpgrades';
import { createEnemy, type Enemy } from "../entities/Enemy";
import { evolution, type Unit } from "../entities/HeroUnit";

import { mergeGroup } from "./MergeSystem";
import { rollTraits } from "./TraitSystem";
import { rollRelics } from "./RelicSystem";
import { WaveSystem } from "./WaveSystem";
import { stepCombat } from "./CombatSystem";
import {blankAction,blankZone,stepActions} from './ActionCombat';
import {castManualSkill} from './AutoSkills';
import {newRecord,recentDps,accumulateRecord,type CombatRecord,type DamageKind} from './CombatLedger';
import {CAMPAIGN_SQUAD_CAP,combatRoles,formationComplete,formationRole} from '../data/combatRoles';
import {purchasePrice,growthOptions,activeLinks,gradeBasePower,gradeStarGrowth} from '../data/strategy';
import { elementAttackBonus, synergies } from "./SynergySystem";
import type { RNG } from "../utils/random";
import { recommendedEnemyCap } from "../utils/performance";
import {equipmentBonus} from '../data/equipment';
import {campaignStarAttack,campaignStarHealth,campaignHeroOutput} from '../data/campaignBalance';

function operatorCombatRange(id:string,bonus:number,inCampaign:boolean){
  const native=combatRange(heroById[id].range),role=formationRole(id),kind=combatRoles[id].kind;
  if(role==='sniper'){const base=Math.max(inCampaign?300:SNIPER_BASE_RANGE,native);return base+Math.min(CELL,base*Math.max(0,bonus));}
  if(role==='dealer'&&kind!=='melee'){const base=Math.max(DEALER_BASE_RANGE,native);return base+Math.min(CELL,base*Math.max(0,bonus));}
  if(kind==='melee'&&role!=='tank')return Math.max(MELEE_STRIKE_RANGE,native)+Math.min(CELL,combatRange(heroById[id].range,bonus)-native);
  return combatRange(heroById[id].range,bonus);
}
export interface FX {
  type: "shot" | "blast" | "heal" | "merge" | "spawn";
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: number;
  life: number;
  duration: number;
  visual?: string;
  radius?:number;
  fps?: number;
  sourceUid?: number;
  sourceHero?: string;
  sourceNorth?: boolean;
  sourceLeft?: boolean;
  originResolved?: boolean;
}
export interface BattleResult {
  stageId?:string;
  stars?:number;
  casualties?:{name:string;damage:number;healing:number}[];
  won: boolean;
  time: number;
  kills: number;
  highestStar: number;
  credits: number;
  gold: number;
  wave: number;
  builds: Record<Build, number>;
  reactions: Record<ElementReaction, number>;
  mvp: string;
  strategy?: {spent:number;remaining:number;triples:Record<string,number>;links:Record<string,number>;investments:{heroId:string;gold:number}[];support:{heroId:string;block:number;slow:number;damage:number}[]};
  ranking?: {heroId:string;star:number;kills:number;damage:number;dps:number}[];
  equipmentDrop?:string;
  materials?:number;
  equipmentGold:number;
}
export const BATTLE_SPEEDS=[.75,1,1.5,2] as const;
/** Display speed to simulation-time multiplier. x0.75 preserves the former x1. */
export function battleTimeScale(speed:number){return speed===.75?1:speed*1.5;}
export class BattleModel {
  autoSkills=true;
  campaign?:CampaignStage;
  roleUpgrades:Record<string,number>={};
  doctrine='rapid';
  doctrineLevel=1;
  rewardedCampaignWaves=new Set<number>();
  configureCampaign(stage:CampaignStage,squad:string[],reserve=false){
    this.campaign=stage;this.map=stage.map;this.wave.provider=n=>campaignWave(stage,n);this.selectedHero='';
    this.autoSkills=this.save.campaign?.autoSkills!==false;
    this.doctrine=['rapid','focus','guard'].includes(this.save.campaign?.doctrine??'')?this.save.campaign!.doctrine!:'rapid';
    for(const id of [...new Set(squad)].filter(id=>!!heroById[id]).slice(0,CAMPAIGN_SQUAD_CAP))this.addUnit(id,1,reserve);
    this.selected=0;this.say('요원을 배치한 뒤 방어 시작을 누르세요.');
  }
  manualSkill(uid:number){const unit=this.units.find(u=>u.uid===uid);return !!unit&&castManualSkill(this,unit);}
  syncCampaignSquad(squad:string[]){
    if(!this.campaign||this.started)return false;
    const ids=[...new Set(squad)].filter(id=>!!heroById[id]).slice(0,CAMPAIGN_SQUAD_CAP);
    const keep=new Set(ids);
    const removed=new Set(this.units.filter(u=>!keep.has(u.heroId)).map(u=>u.uid));
    this.units=this.units.filter(u=>keep.has(u.heroId));
    this.records=this.records.filter(r=>!removed.has(r.uid));
    for(const id of ids)if(!this.units.some(u=>u.heroId===id))this.addUnit(id,1,true);
    this.selected=0;this.refresh();return true;
  }
  autoDeployCampaign(){
    if(!this.campaign||this.started||!formationComplete(this.units.map(u=>u.heroId)))return false;
    for(const u of this.units){u.slot=-1;u.x=-100;u.y=-100;u.moveReadyAt=0;}
    const deploymentPriority=(id:string)=>formationRole(id)==='tank'?0:combatRoles[id].kind==='melee'?1:formationRole(id)==='support'?3:formationRole(id)==='sniper'?4:2;
    const used=new Set<number>(),deployment=[...this.units].sort((a,b)=>deploymentPriority(a.heroId)-deploymentPriority(b.heroId)),tankCount=deployment.filter(u=>formationRole(u.heroId)==='tank').length,front=this.campaign.alternate&&tankCount>1?frontlineSlots(this.campaign):[4];
    for(const u of deployment){const role=formationRole(u.heroId),melee=combatRoles[u.heroId].kind==='melee',dual=!!this.campaign.alternate,preferences=role==='tank'?[...front,5,1,3,2,0,4]:role==='support'?[3,0,2,5,1,4]:role==='sniper'?[0,dual?2:3,2,5,1,4]:melee?(dual?[5,2,0,4,1,3]:[1,5,2,4,0,3]):(dual?[5,2,0,4,1,3]:[1,2,5,0,3,4]),slot=preferences.find(v=>!used.has(v));if(slot===undefined)return false;used.add(slot);u.slot=slot;Object.assign(u,this.map.slots[slot]);}
    this.selected=0;this.lastPlacement=undefined;this.say('추천 배치 완료 · 선택한 역할 조합에 맞춰 배치했습니다. 모든 칸은 직접 변경할 수 있습니다.');this.refresh();return true;
  }
  deployCampaignLayout(layout:Record<string,number>){
    if(!this.campaign||this.started||!formationComplete(this.units.map(u=>u.heroId)))return false;
    const used=new Set<number>();
    for(const u of this.units){const slot=layout[u.heroId];if(!Number.isInteger(slot)||slot<0||slot>=this.map.slots.length||used.has(slot))return false;used.add(slot);}
    for(const u of this.units){u.slot=layout[u.heroId];Object.assign(u,this.map.slots[u.slot]);u.moveReadyAt=0;u.readyNotified=false;}
    this.selected=0;this.lastPlacement=undefined;this.say('이전 배치 복원 완료');this.refresh();return true;
  }
  reserveCampaignUnit(uid:number){
    if(!this.campaign||this.started)return false;
    const u=this.units.find(v=>v.uid===uid);if(!u||u.slot<0)return false;
    this.lastPlacement={uid:u.uid,from:u.slot,to:-1,at:this.time};
    u.slot=-1;u.x=-100;u.y=-100;u.moveReadyAt=0;u.readyNotified=false;
    if(this.selected===uid)this.selected=0;
    this.say(`${heroById[u.heroId].name} 배치 해제 · 대기 상태`);this.refresh();return true;
  }
  hurtUnit(u:Unit,amount:number){
    if(u.hp<=0||u.slot<0)return;
    if(this.campaign&&this.doctrine==='guard')amount*=1-this.doctrineLevel*.05;
    if((u.damageReductionUntil??0)>this.time)amount*=.72;
    const absorbed=Math.min(u.guardHp??0,amount);
    if(absorbed>0){u.guardHp=Math.max(0,(u.guardHp??0)-absorbed);amount-=absorbed;this.emit('blast',u.x,u.y,u.x,u.y,0x9fffea,{visual:`tank-guard-hit-${u.heroId}`,duration:.32,radius:34});}
    if(amount<=0)return;
    const damage=Math.min(u.hp,amount);u.hp-=damage;u.damageTaken=(u.damageTaken??0)+damage;
    this.emit('blast',u.x,u.y,u.x,u.y,0xff8f8f,{visual:'enemy-disrupt',duration:.3,radius:22});
    if(u.hp<=0){const x=u.x,y=u.y;this.emit('blast',x,y,x,y,0xffa0b8,{visual:`hero-defeat-${u.heroId}`,duration:.72,sourceHero:u.heroId});this.say(`${heroById[u.heroId].name} 전투 불능 · 이번 전투에는 복귀하지 않습니다`);this.refresh();}
  }
  purchaseCounts:Record<string,number>={};
  selectedHero='sera';
  shopGrade='B';
  totalSpent=0;
  growthUid=0;
  mergePreview=false;
  tripleMeters=Array.from({length:16},()=>({mask:0,count:0,last:0}));
  tripleCounts:Record<string,number>={};
  linkCounts:Record<string,number>={};
  lastReaction='';
  price(id:string){return purchasePrice(id,this.purchaseCounts[id]??0);}
  selectHero(id:string){if(!heroById[id])return;this.mergePreview=false;this.selectedHero=id;this.selected=0;this.say(`${heroById[id].name} · ${this.price(id)}G · 빈칸을 누르면 구매 / 선택 해제로 취소`);}
  openGrowth(u:Unit){this.growthUid=u.uid;this.choiceKind="trait";this.choiceRerolls=0;this.choices=this.rollGrowth(u);this.revision++;}
  rollGrowth(u:Unit){const pool=growthOptions(u.heroId,u.star);for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,3);}
  actions=Array.from({length:96},blankAction);
  zones=Array.from({length:12},blankZone);
  records:CombatRecord[]=[];
  archivedRecords:Record<string,CombatRecord>={};
  attackElement:Element|undefined;
  retiredUnits=new Map<number,Unit>();
  dotLabels=new Map<number,{value:number;x:number;y:number;until:number}>();
  damageKind:DamageKind='basic';
  get capacity(){return this.campaign?5:10;}
  spawnGeneration=0;
  objectiveGeneration=0;
  ranking(){return [...this.records,...Object.values(this.archivedRecords)].map(r=>({...r,dps:recentDps(r,this.time)})).sort((a,b)=>b.dps-a.dps||b.damage-a.damage);}
  units: Unit[] = [];
  damageNumbers=Array.from({length:16},()=>({enemyIndex:-1,x:0,y:0,value:0,life:0,critical:false}));
  enemies: Enemy[] = Array.from({ length: BALANCE.maxEnemies }, (_, i) =>
    createEnemy(i),
  );
  enemyCap = Math.min(BALANCE.maxEnemies, recommendedEnemyCap());
  effects: FX[] = Array.from({ length: BALANCE.maxEffects }, () => ({
    type: "shot",
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    color: 0xffffff,
    life: 0,
    duration: 0,
    visual: undefined,
    fps: 12,
  }));
  wave = new WaveSystem();
  gold = BALANCE.initialGold;
  core = BALANCE.coreHp;
  time = 0;
  kills = 0;
  earned = 0;
  equipmentGoldEarned=0;
  highestStar = 1;
  selected = 0;
  selectedSlot = -1;
  summonRequestSlot = -1;
  lastPlacement?: {uid:number;from:number;to:number;at:number;swapped?:number};
  placeSelected(slot:number) {
    if (!this.selectedUnit) { this.say("먼저 소환하거나 대기석 요원을 선택하세요."); return false; }
    return this.move(this.selected,slot);
  }
  requestSummonAt(slot:number) {
    if (this.paused || this.ended || this.choices.length || !this.map.slots[slot]) return false;
    if (this.units.some((u) => u.slot === slot)) return false;
    this.selectedSlot = slot;
    this.summonRequestSlot = slot;
    this.say(`빈 슬롯 ${slot + 1} · ${this.selectedHero}등급 소환 확인`);
    return true;
  }
  cancelSummonRequest() {
    this.summonRequestSlot = -1;
    this.selectedSlot = -1;
    this.revision++;
  }
  summonAt(slot:number) {
    if(this.campaign){this.say('편성한 요원을 선택해 이동하세요.');return false;}
    if (this.paused || this.ended || this.choices.length || !this.map.slots[slot]) return false;
    if (this.units.some((u) => u.slot === slot)) return false;
    const slotType = this.map.slots[slot].type;
    const id=this.selectedHero,h=heroById[id];
    if(!h){this.say('구매 패널에서 영웅을 먼저 선택하세요.');return false;}
    if(slotType!=='any'&&h.rangeType!==slotType)return false;
    const cost=this.price(id);
    if (this.gold < cost) { this.say(`${h.name} 구매 골드가 부족합니다.`); return false; }
    if (this.units.length >= this.capacity) { this.say(`배치 한도 ${this.capacity}명입니다. 2인 합성으로 자리를 확보하세요.`); return false; }
    this.gold -= cost;
    this.totalSpent+=cost;this.purchaseCounts[id]=(this.purchaseCounts[id]??0)+1;
    this.selectedSlot = slot;
    const unit = this.addUnit(id, 1, false);
    unit.investment=cost;
    this.summonRequestSlot = -1;
    this.summons++;
    this.onSound?.("summon");
    this.say(`${heroById[id].grade} · ${heroById[id].name} 소환 완료`);
    return !!unit;
  }
  undoPlacement() {
    if(this.campaign&&this.started)return false;
    const p=this.lastPlacement;
    if(!p || this.time-p.at>10 || this.paused || this.ended || this.choices.length)return false;
    const u=this.units.find(u=>u.uid===p.uid);
    if(!u || u.slot!==p.to)return false;
    if(p.from<0 && !p.swapped && this.units.filter(v=>v.slot<0).length>=6)return false;
    const other=p.swapped ? this.units.find(u=>u.uid===p.swapped) : undefined;
    if(p.swapped && (!other || other.slot!==p.from))return false;
    if(p.from>=0 && this.units.some(v=>v!==u&&v!==other&&v.slot===p.from))return false;
    u.moveReadyAt=0;if(other)other.moveReadyAt=0;u.slot=p.from;Object.assign(u,this.map.slots[p.from]??{x:-100,y:-100});
    if(other){other.slot=p.to;Object.assign(other,this.map.slots[p.to]);}
    this.lastPlacement=undefined;this.refresh();return true;
  }
  speed: number;
  paused = false;
  started = false;
  invincible = false;
  ended = false;
  result?: BattleResult;
  builds: Record<Build, number> = {
    burn: 0,
    water: 0,
    shock: 0,
    bleed: 0,
    crit: 0,
    blast: 0,
    drone: 0,
  };
  elementUpgrades:Record<Element,number>={water:0,fire:0,electric:0,dark:0};
  upgradeElement(element:Element){
    const level=this.elementUpgrades[element];
    if(level>=elementUpgradeMax){this.say('이미 최대 속성 강화 단계입니다.');return false;}
    const cost=elementUpgradeCost(level);
    if(this.gold<cost){this.say(`GOLD 부족 · ${cost}G 필요`);return false;}
    this.gold-=cost;this.totalSpent+=cost;this.elementUpgrades[element]=level+1;
    for(const u of this.units)if(heroById[u.heroId].element===element&&u.slot>=0)this.emit('blast',u.x,u.y,u.x,u.y,parseInt(heroById[u.heroId].color.slice(1),16),{visual:`element-upgrade-${element}`,duration:.55,radius:62});
    this.onSound?.('level');this.say(`${elementNames[element]} 속성 강화 Lv.${level+1}`);this.refresh();return true;
  }
  reactionCounts: Record<ElementReaction, number> = {
    conduct: 0,
    overload: 0,
    vaporize: 0,
    blackflame: 0,
    corrosion: 0,
    voidshock: 0,
  };
  bonuses: Record<string, number> = {};
  chosenTraits: Choice[] = [];
  relics: Choice[] = [];
  choices: Choice[] = [];
  choiceKind: "trait" | "relic" = "trait";
  pendingRewards: ("trait" | "relic")[] = [];
  choiceRerolls = 0;
  statsDamage: Record<string, number> = {};
  uid = 1;
  revision = 0;
  accumulator = 0;
  intermission = 0;
  summons = 0;
  merged = 0;
  notice = "소환 후 작전을 시작하세요.";
  noticeTime = 5;
  synergy = synergies([]);
  onSound?: (sound: string) => void;
  constructor(
    public save: SaveData,
    public rng: RNG = Math.random,
    public map: BattleMap = battleMaps[0],
  ) {this.speed=BATTLE_SPEEDS.includes(save.settings.battleSpeed as typeof BATTLE_SPEEDS[number])?save.settings.battleSpeed:1;}
  syncPermanentSave(save:SaveData){this.save=structuredClone(save);for(const u of this.units){const ratio=u.maxHp?u.hp/u.maxHp:1,h=heroById[u.heroId],gear=equipmentBonus(this.save,u.heroId),stars=this.save.heroes[u.heroId]?.stars??1;u.star=this.campaign?stars:u.star;u.maxHp=(h.hp+gear.hp)*(1+.08*(stars-1))*(this.campaign?campaignStarHealth(stars)/(1+.08*(stars-1)):Math.pow(1.65,u.star-1));u.hp=Math.max(1,u.maxHp*ratio);}this.refresh();}
  get alive() {
    return this.enemies.reduce((n, e) => n + Number(e.active), 0);
  }
  get selectedUnit() {
    return this.units.find((u) => u.uid === this.selected);
  }
  say(text: string) {
    this.notice = text;
    this.noticeTime = 4;
    this.revision++;
  }
  refresh() {
    this.synergy = synergies(this.units);
    this.revision++;
  }
  start() {
    if (this.started) return;
    if(this.campaign&&this.units.some(u=>u.slot<0)){this.say('선택한 요원을 모두 배치해주세요.');return;}
    this.started = true;
    this.wave.start(1);
    this.wave.spawnTimer = 2.5;
    this.say("WAVE 01 · 자동 방어 개시");
  }
  addUnit(id: string, star = 1, reserve = false) {
    const h = heroById[id];
    if(this.campaign)star=this.save.heroes[id]?.stars??1;
    const accepts = (i: number) =>
      this.map.slots[i] && (this.map.slots[i].type === "any" || this.map.slots[i].type === h.rangeType);
    const available = this.map.slots.findIndex(
      (_, i) => accepts(i) && !this.units.some((u) => u.slot === i),
    );
    const preferred =
      this.selectedSlot >= 0 &&
      accepts(this.selectedSlot) &&
      !this.units.some((u) => u.slot === this.selectedSlot)
        ? this.selectedSlot
        : available;
    const gear=equipmentBonus(this.save,id);
    const hp =
      (h.hp+gear.hp) *
      (1+.08*((this.save.heroes[id]?.stars??1)-1)) *
      (this.campaign?campaignStarHealth(star)/(1+.08*(star-1)):Math.pow(1.65, star - 1));
    const placement = reserve ? -1 : preferred;
    const p = this.map.slots[placement] ?? { x: -100, y: -100 };
    const u: Unit = {
      uid: this.uid++,
      heroId: id,
      star,
      slot: placement,
      hp,
      maxHp: hp,
      cooldown: 0,
      droneCooldown: 0.5,
      shots: 0,
      droneShots: 0,
      damage: 0,
      stunned: 0,
      x: p.x,
      y: p.y,
    };
    this.units.push(u);
    this.records.push(newRecord(u.uid,id,star,this.time));
    if (placement >= 0)
      this.emit("spawn", p.x, p.y, p.x, p.y, 0xffffff, { visual: `summon-${h.grade}`, duration: 0.72 });
    this.selected = u.uid;
    this.selectedSlot = -1;
    this.highestStar = Math.max(this.highestStar, star);
    this.refresh();
    return u;
  }
  move(uid: number, slot: number) {
    const u = this.units.find((u) => u.uid === uid);
    if (this.paused || this.choices.length || this.ended) return false;
    if (!u || !this.map.slots[slot]) return false;
    if (u.slot === slot || u.hp <= 0) return false;
    if(this.campaign && this.started && this.time<(u.moveReadyAt??0)){this.say(`이동 ${(u.moveReadyAt!-this.time).toFixed(1)}초`);return false;}
    if(this.started&&this.intermission<=0&&this.time<(u.moveReadyAt??0)){this.say(`재배치 대기 ${Math.ceil((u.moveReadyAt??0)-this.time)}초`);return false;}
    const accepts = (index: number, heroId: string) =>
      index < 0 ||
      this.map.slots[index].type === "any" ||
      this.map.slots[index].type === heroById[heroId].rangeType;
    if (!accepts(slot, u.heroId)) return false;
    const dest = this.units.find((v) => v.slot === slot);
    if(this.campaign && dest && (dest.hp<=0 || (this.started && this.time<(dest.moveReadyAt??0))))return false;
    if(dest&&this.started&&this.intermission<=0&&this.time<(dest.moveReadyAt??0))return false;
    if (dest && !accepts(u.slot, dest.heroId)) return false;
    if (dest) {
      dest.slot = u.slot;
      Object.assign(dest, this.map.slots[dest.slot] ?? { x: -100, y: -100 });
    }
    this.lastPlacement = {uid:u.uid, from:u.slot, to:slot, at:this.time, swapped:dest?.uid};
    u.slot = slot;
    u.moveReadyAt=this.started&&this.intermission<=0?this.time+6:0;if(dest)dest.moveReadyAt=u.moveReadyAt;
    if(this.campaign){u.moveReadyAt=this.started?this.time+10:0;if(dest)dest.moveReadyAt=u.moveReadyAt;}
    u.readyNotified=false;if(dest)dest.readyNotified=false;
    Object.assign(u, this.map.slots[slot]);
    this.refresh();
    return true;
  }
  merge(uid?: number, materialUid?:number) {
    if(this.campaign)return false;
    if(this.paused||this.ended||this.choices.length)return false;
    const target = uid ? this.units.find((u) => u.uid === uid) : undefined;
    const material=materialUid?this.units.find(u=>u.uid===materialUid):undefined;
    if(target && target.star>=5){this.say("이미 최대 합성 단계입니다.");return false;}
    if(materialUid&&(!target||!material||material===target||material.heroId!==target.heroId||material.star!==target.star)){this.say("합성 불가 · 같은 영웅과 같은 별이 필요합니다.");return false;}
    const ordered=material?[material,...this.units.filter(u=>u!==material)]:this.units;
    const group = target&&material?[target,material]:mergeGroup(ordered, target);
    if (group.length < 2) {
      this.say("같은 영웅 · 같은 별 2명이 필요합니다.");
      return false;
    }
    const survivor = group[0];
    this.lastPlacement = undefined;this.mergePreview=false;
    survivor.star++;
    const record=this.records.find(r=>r.uid===survivor.uid);if(record)record.star=survivor.star;
    for(const u of group.slice(1)){
      survivor.investment=(survivor.investment??0)+(u.investment??0);survivor.damage+=u.damage;
      const old=this.records.find(r=>r.uid===u.uid);
      if(record&&old){record.damage+=old.damage;record.kills+=old.kills;record.reactions+=old.reactions;
        for(const k of Object.keys(record.parts) as DamageKind[])record.parts[k]+=old.parts[k];
        for(const b of old.buckets){const dest=record.buckets[((b.second%11)+11)%11];if(dest.second===b.second)dest.value+=b.value;else if(b.second>dest.second)Object.assign(dest,b);}
        for(const k of ['autoCasts','linkCasts','tripleReactions','blockTime','slowTime','supportDamage'] as const)record[k]+=old[k];
      }
      this.records=this.records.filter(r=>r.uid!==u.uid);
      for(const a of this.actions)if(a.active&&a.owner===u.uid){a.owner=survivor.uid;if(a.source)a.source={...a.source,uid:survivor.uid};}
      for(const z of this.zones)if(z.active&&z.owner===u.uid)z.owner=survivor.uid;
      for(const e of this.enemies){if(e.dotOwner===u.uid)e.dotOwner=survivor.uid;if(e.doomOwner===u.uid)e.doomOwner=survivor.uid;if(e.controlOwner===u.uid)e.controlOwner=survivor.uid;}
      this.retiredUnits.delete(u.uid);
    }
    survivor.maxHp *= 1.65;
    survivor.hp = survivor.maxHp;
    survivor.shots = 0;
    survivor.droneShots = 0;
    this.units = this.units.filter((u) => !group.slice(1).includes(u));
    this.selected = survivor.uid;
    this.highestStar = Math.max(this.highestStar, survivor.star);
    this.merged++;
    this.emit(
      "merge",
      survivor.x,
      survivor.y,
      survivor.x,
      survivor.y,
      0x9cf8d4,
    );
    this.onSound?.("merge");
    this.say(
      `${heroById[survivor.heroId].name} ${"★".repeat(survivor.star)} · ${combatRoles[survivor.heroId].stages[survivor.star-1]}`,
    );
    this.refresh();
    if(survivor.star===3||survivor.star===5)this.openGrowth(survivor);
    return true;
  }
  sell(uid: number) {
    if(this.campaign)return;
    const u = this.units.find((u) => u.uid === uid);
    if (!u) return;
    this.gold += Math.floor((u.investment??0)*.35);
    this.retiredUnits.set(u.uid,u);
    this.units = this.units.filter((v) => v !== u);
    this.selected = 0;
    this.refresh();
  }
  stats(u: Unit) {
    const h = heroById[u.heroId],
      e = evolution(h, u.star),
      gear=equipmentBonus(this.save,u.heroId),permanentStars=this.save.heroes[u.heroId]?.stars??1;
    // Support auras use the strongest nearby source instead of stacking copies.
    // This keeps duplicate support summons useful for positioning without making
    // endless-wave attack speed grow without a ceiling.
    let miaAtk = 0,
      miaSpeed = 0,
      leonAtk = 0,
      leonSpeed = 0,
      kyleSpeed = 0;
    for (const v of this.units) {
      if (v.uid === u.uid || v.slot < 0 || v.hp <= 0) continue;
      const d = Math.hypot(v.x - u.x, v.y - u.y);
      const auraRange = operatorCombatRange(v.heroId,(this.bonuses.range ?? 0) + (this.bonuses.ascend ? 0.15 : 0),!!this.campaign);
      if (v.heroId === "mia" && d <= auraRange) {
        miaAtk = Math.max(miaAtk, 0.05 + (v.star - 1) * 0.018);
        miaSpeed = Math.max(miaSpeed, 0.05 + (v.star - 1) * 0.012);
      }
      if (v.heroId === "leon" && d <= auraRange) {
        leonSpeed = Math.max(leonSpeed, 0.08 + (v.star - 1) * 0.015);
        if (v.star >= 4) leonAtk = Math.max(leonAtk, 0.06 + (v.star - 4) * 0.03);
      }
      if (v.heroId === "kyle" && d <= auraRange) {
        kyleSpeed = Math.max(kyleSpeed, 0.04 + (v.star - 1) * 0.012);
      }
    }
    const elementLevel=this.elementUpgrades[h.element];
    return {
      atk:
        (h.atk+gear.attack) * gradeBasePower[h.grade] * (1+(this.roleUpgrades[combatRoles[u.heroId].kind]??0)*.12+(this.campaign?(this.save.campaign?.research[combatRoles[u.heroId].kind]??0)*.03+(this.save.campaign?.research[h.element]??0)*.03+(this.save.campaign?.fragments[u.heroId]??0)*.005:0)) *
        (1 + .08*(permanentStars-1)) * (1+gear.elementDamage) * (this.campaign?(campaignHeroOutput[u.heroId]??1):1) *
        (this.campaign?campaignStarAttack(u.star)/(1+.08*(permanentStars-1)):Math.pow(gradeStarGrowth[h.grade], u.star - 1)) *
        (1 + e.attack) *
        (1 +
          (this.bonuses.ascend ?? 0) +
          (this.bonuses.jackpot ? 0.25 : 0) +
          (h.rangeType === "ranged" ? (this.bonuses.ranged ?? 0) : 0) +
          miaAtk +
          leonAtk +
          (h.element==='fire'?elementLevel*.07:h.element==='water'?elementLevel*.05:h.element==='dark'?elementLevel*.06:elementLevel*.03)) *
        (h.faction === "arcane" && this.synergy.arcane >= 3 ? 1.15 : 1) *
        (1 + elementAttackBonus(Math.max(this.synergy[h.element], h.secondaryElement ? this.synergy[h.secondaryElement] : 0))) *
        (1+((u.supportAttackUntil??0)>this.time?(u.supportAttackBonus??0):0)),
      speed:
        h.speed *
        (this.campaign&&this.doctrine==='rapid'?1+this.doctrineLevel*.06:1) *
        (1 + e.speed + (u.branch==="tempo"?.22:0) + (u.ultimate==="tempo"?.35:0) + (u.branch==="focus"&&combatRoles[u.heroId].kind==="burst"?(u.heat??0)*.035:0) + Math.min(0.7, u.shots * e.ramp)) *
        (1 +
          (this.bonuses.speed ?? 0) + gear.speed +
          (this.bonuses.jackpot ? 0.2 : 0) +
          miaSpeed +
          leonSpeed +
          kyleSpeed +
          (h.element==='electric'?elementLevel*.04:0) +
          (this.synergy.ballistic >= 3 ? 0.1 : 0) +
          (u.hp < u.maxHp * 0.5 ? (this.bonuses.berserk ?? 0) : 0)) *
        (u.stunned > 0 ? 0.55 : 1) *
        (1+((u.supportSpeedUntil??0)>this.time?(u.supportSpeedBonus??0):0)),
      range: operatorCombatRange(u.heroId,(this.bonuses.range??0)+(this.bonuses.ascend?0.15:0),!!this.campaign),
      crit: Math.min(
        0.85,
        0.06 +
          e.crit +
          (this.builds.crit ? 0.15 : 0) +
          (this.builds.crit >= 3 ? 0.2 : 0) +
          (h.element==='dark'?elementLevel*.04:0) +
          (this.bonuses.luck ?? 0)+gear.crit,
      ),
      e,
    };
  }
  spawn(kind: string) {
    const e = this.enemies.find((e) => !e.active);
    if (!e) return false;
    const def = enemies[kind],
      n = this.wave.number;
    const scale = def.boss
      ? 0.72 + n * 0.055 + Math.pow(Math.max(0, n - 10), 1.32) * 0.012
      : 1 + (n - 1) * 0.095 + Math.pow(Math.max(0, n - 12), 1.55) * 0.018;
    Object.assign(e, createEnemy(e.index), {
      generation:++this.spawnGeneration,
      active: true,
      kind,
      hp: def.hp * scale * (this.bonuses.greed ? 1.1 : 1),
      maxHp: def.hp * scale * (this.bonuses.greed ? 1.1 : 1),
      armor: def.armor + Math.floor(Math.max(0, n - 20) / 15) * (def.boss ? 2 : 1),
      speed: def.speed * (this.map.pathLength / REFERENCE_PATH_LENGTH) * (1 + Math.min(def.boss ? 0.22 : 0.32, Math.max(0, n - 20) * 0.004)),
      x: this.map.path[0].x,
      y: this.map.path[0].y,
    });
    if(this.campaign){
      e.hp*=this.campaign.enemyHp;e.maxHp=e.hp;e.speed=def.speed*this.campaign.enemySpeed;
      if(def.namedRegion)e.speed*=.55;
      if(kind==='sprinter'){e.hp*=campaignVanguardHealth[campaignRegion(this.campaign)-1];e.maxHp=e.hp;}
      if(def.boss){const region=campaignRegion(this.campaign),bossScale=def.bossTier==='mid'?.9:region===1?.36:region===2?.5:region===8?.95:region===7?.75:region>=9?.55:.66;e.hp=def.hp*this.campaign.enemyHp*bossScale;e.maxHp=e.hp;e.speed*=def.bossTier==='mid'?.25:.21;}
      e.route=this.campaign.alternate?this.spawnGeneration%2:0;
      const route=e.route?this.campaign.alternate!:this.map;Object.assign(e,route.path[0]);
      if(this.wave.data.objective===kind&&!this.objectiveGeneration){this.objectiveGeneration=e.generation??0;this.say(`${this.wave.data.boss?'BOSS':'NAMED'} · ${this.wave.data.objectiveName??def.name} 출현 · 집중 공격`);}
    }
    if (def.boss)
      this.emit("spawn", e.x, e.y, e.x, e.y, def.color, { visual: `enemy-${def.boss}`, duration: 0.9 });
    return true;
  }
  emit(
    type: FX["type"],
    x: number,
    y: number,
    tx: number,
    ty: number,
    color: number,
    extra: Partial<Pick<FX, "visual" | "duration" | "radius" | "fps" | "sourceUid" | "sourceHero" | "sourceNorth" | "sourceLeft">> = {},
  ) {
    const f = this.effects.find((v) => v.life <= 0);
    if (f) {
      const duration = Math.max(0.25, extra.duration ?? (type === "shot" ? 0.25 : 0.5));
      Object.assign(f, {
        type,
        x,
        y,
        tx,
        ty,
        color,
        life: duration,
        duration,
        visual: extra.visual,
        radius:extra.radius,
        fps: extra.fps ?? 12,
        sourceUid: extra.sourceUid, sourceHero: extra.sourceHero,
        sourceNorth: extra.sourceNorth, sourceLeft: extra.sourceLeft,
        originResolved: false,
      });
    }
  }
  award(amount: number) {
    const value = Math.round(amount * (1 + (this.bonuses.greed ?? 0)));
    this.gold += value;
    this.earned += value;
  }
  showDamage(value:number,x:number,y:number,critical=false){
    if(value<.5)return;
    const n=this.damageNumbers.find(n=>n.life<=0);if(!n)return;
    Object.assign(n,{value,x:x+((this.damageNumbers.indexOf(n)%3)-1)*14,y:y-25,life:.65,critical});
  }
  damage(e: Enemy, amount: number, owner?: Unit, secondary = false, critical=false) {
    if(this.campaign&&this.doctrine==='focus'&&owner)amount*=1+this.doctrineLevel*(.05+(enemies[e.kind]?.boss ? .03 : 0));
    if (!e.active) return;
    if(!Number.isFinite(amount)||amount<=0)return;
    if(critical&&!secondary)this.onSound?.('critical');
    const phase=e.kind==="phantom"&&e.progress>this.map.pathLength*.25&&e.progress<this.map.pathLength*.5?.6:1;
    let applied=Math.max(0,amount*phase*(1+e.vulnerability));
    const real = Math.min(e.hp, applied);
    e.hp -= real;
    if(this.damageKind==='dot'){
      const key=e.generation??e.index, pending=this.dotLabels.get(key);
      if(pending){pending.value+=real;pending.x=e.x;pending.y=e.y;}
      else this.dotLabels.set(key,{value:real,x:e.x,y:e.y,until:this.time+.4});
    }else this.showDamage(real,e.x,e.y,critical);
    if (owner) {
      const record=this.records.find(r=>r.uid===owner.uid);
      if(record){record.damage+=real;record.parts[this.damageKind]+=real;const second=Math.floor(this.time),bucket=record.buckets[second%11];if(bucket.second!==second){bucket.second=second;bucket.value=0;}bucket.value+=real;}
      const support=this.units.filter(v=>v!==owner&&["leon","mia"].includes(v.heroId)&&Math.hypot(v.x-owner.x,v.y-owner.y)<=combatRange(heroById[v.heroId].range)).sort((a,b)=>b.star-a.star)[0];if(support){const sr=this.records.find(r=>r.uid===support.uid);if(sr)sr.supportDamage+=real*.08;}
      owner.damage += real;
      this.statsDamage[owner.heroId] =
        (this.statsDamage[owner.heroId] ?? 0) + real;
    }
    if (e.hp <= 0) {
      if(enemies[e.kind].boss)this.onSound?.('boss-end');
      this.emit('blast',e.x,e.y,e.x,e.y,enemies[e.kind].color,{visual:`enemy-death-${e.kind}`,duration:.48});
      e.active = false;
      this.kills++;
      this.equipmentGoldEarned+=enemies[e.kind].boss?25:Math.max(1,Math.ceil(enemies[e.kind].reward/6));
      if(e.doomPower){const blast=e.doomPower;e.doomPower=0;const source=this.units.find(u=>u.uid===e.doomOwner)??this.retiredUnits.get(e.doomOwner??0);const previous=this.damageKind;this.damageKind="reaction";for(const other of this.enemies)if(other.active&&Math.hypot(other.x-e.x,other.y-e.y)<110){other.doomPower=0;this.damage(other,blast,source,true);}this.damageKind=previous;this.emit("blast",e.x,e.y,e.x,e.y,0xff6655,{visual:"reaction-overload"});}
      if(e.kind==="runner")for(const other of this.enemies)if(other.active&&Math.hypot(other.x-e.x,other.y-e.y)<100)other.speed=Math.min(other.speed*1.1,enemies[other.kind].speed*2);
      if(owner){const r=this.records.find(r=>r.uid===owner.uid);if(r)r.kills++;}
      this.award(
        enemies[e.kind].reward +
          (owner ? evolution(heroById[owner.heroId], owner.star).gold : 0),
      );
      if(this.campaign&&e.generation===this.objectiveGeneration){this.wave.queue=[];for(const other of this.enemies)if(other!==e)other.active=false;this.say(`${this.wave.data.objectiveName??enemies[e.kind].name} 격파 · 작전 완료`);this.finish(true);return;}
      if (
        !secondary &&
        this.builds.blast >= 3 &&
        this.rng() < 0.3 + (this.bonuses.luck ?? 0)
      ) {
        this.emit("blast", e.x, e.y, e.x, e.y, 0xffb778);
        for (const other of this.enemies)
          if (other.active && Math.hypot(other.x - e.x, other.y - e.y) < 90)
            this.damage(other, amount * 0.6, owner, true);
      }
    }
  }
  openReward() {
    const kind = this.pendingRewards.shift();
    if (!kind) return;
    if(kind === "relic") {
      this.grantAutomaticRelic();
      this.openReward();
      return;
    }
    this.choiceKind = kind;
    this.choiceRerolls = 0;
    this.choices =
      kind === "trait"
        ? rollTraits(this.builds, this.rng)
        : rollRelics(
            this.relics.map((r) => r.id),
            this.rng,
          );
    this.revision++;
  }
  grantAutomaticRelic() {
    const relic=rollRelics(this.relics.map(r=>r.id),this.rng)[0];
    if(!relic){this.award(75);this.say("균열 유물 수집 완료 · 잔향 GOLD +75");return false;}
    this.relics.push(relic);
    this.bonuses[relic.effect]=(this.bonuses[relic.effect]??0)+relic.value;
    this.onSound?.("relic");
    this.say(`균열 유물 자동 획득 · ${relic.name}`);
    this.refresh();
    return true;
  }
  choose(id: string) {
    const c = this.choices.find((t) => t.id === id);
    if (!c) return false;
    if(c.effect.startsWith('campaign-')){
      const [kind,key]=c.effect.split(':');
      if(kind==='campaign-element')this.elementUpgrades[key as Element]=Math.min(elementUpgradeMax,this.elementUpgrades[key as Element]+1);
      else this.roleUpgrades[key]=(this.roleUpgrades[key]??0)+1;
      this.chosenTraits.push(c);this.choices=[];this.intermission=.05;this.refresh();return true;
    }
    if(this.growthUid){const u=this.units.find(u=>u.uid===this.growthUid);if(!u)return false;if(u.star===5)u.ultimate=id;else u.branch=id;this.growthUid=0;this.choices=[];this.refresh();return true;}
    if (this.choiceKind === "relic") this.relics.push(c);
    else this.chosenTraits.push(c);
    if (c.build) this.builds[c.build] = c.value;
    else if (c.effect === "gold") this.award(c.value);
    else if (c.effect === "repair")
      this.core = Math.min(100, this.core + c.value);
    else this.bonuses[c.effect] = (this.bonuses[c.effect] ?? 0) + c.value;
    this.choices = [];
    this.onSound?.("level");
    this.openReward();
    this.refresh();
    return true;
  }
  reroll() {
    if(this.campaign)return false;
    const cost = 20 * (this.choiceRerolls + 1);
    if (!this.choices.length || this.gold < cost) return false;
    this.gold -= cost;
    this.totalSpent+=cost;
    this.choiceRerolls++;
    if(this.growthUid){const u=this.units.find(u=>u.uid===this.growthUid);if(u)this.choices=this.rollGrowth(u);this.revision++;return true;}
    this.choices =
      this.choiceKind === "trait"
        ? rollTraits(this.builds, this.rng)
        : rollRelics(
            this.relics.map((r) => r.id),
            this.rng,
          );
    this.revision++;
    return true;
  }
  finish(won: boolean) {
    if (this.ended) return;
    this.ended = true;
    const mvp =
      Object.entries(this.statsDamage).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "";
    this.result = {
      stageId:this.campaign?.id,
      stars:this.campaign&&won?(this.core>=90?3:this.core>=50?2:1):0,
      casualties:this.units.map(u=>({name:heroById[u.heroId].name,damage:u.damageTaken??0,healing:u.healingDone??0})),
      won,
      time: this.time,
      kills: this.kills,
      highestStar: this.highestStar,
      credits: Math.floor(
        this.kills * 1.5 + this.wave.number * 12 + (won ? 500 : 50),
      ),
      gold: this.earned,
      equipmentGold:this.equipmentGoldEarned,
      wave: this.wave.number,
      builds: { ...this.builds },
      reactions: { ...this.reactionCounts },
      mvp,
      ranking:this.ranking().slice().sort((a,b)=>b.damage-a.damage),
      strategy:{spent:this.totalSpent,remaining:this.gold,triples:{...this.tripleCounts},links:{...this.linkCounts},investments:Object.keys(this.purchaseCounts).map(id=>({heroId:id,gold:Array.from({length:this.purchaseCounts[id]},(_,i)=>purchasePrice(id,i)).reduce((a,b)=>a+b,0)})).sort((a,b)=>b.gold-a.gold),support:[...this.records,...Object.values(this.archivedRecords)].map(r=>({heroId:r.heroId,block:r.blockTime,slow:r.slowTime,damage:r.supportDamage})).sort((a,b)=>(b.block+b.slow+b.damage/100)-(a.block+a.slow+a.damage/100))},
    };
    this.onSound?.('boss-end');
    this.onSound?.(won ? "victory" : "defeat");
    this.revision++;
  }
  update(deltaSeconds: number) {
    if (this.paused || this.choices.length || this.ended) return;
    const scaledDelta=Math.min(deltaSeconds,0.25)*battleTimeScale(this.speed);
    // Combat, displayed timers and their matching visual timelines share one clock.
    for (const fx of this.effects) fx.life = Math.max(0, fx.life - scaledDelta);
    this.accumulator += scaledDelta;
    while (this.accumulator + 1e-9 >= BALANCE.fixedStep) {
      this.accumulator -= BALANCE.fixedStep;
      this.step(BALANCE.fixedStep);
      if (this.ended || this.choices.length) {
        this.accumulator = 0;
        break;
      }
    }
  }
  step(dt: number) {
    this.noticeTime = Math.max(0, this.noticeTime - dt);
    if (!this.started) return;
    this.time += dt;
    if(this.campaign)for(const u of this.units){
      if(!u.readyNotified&&u.moveReadyAt&&this.time>=u.moveReadyAt){u.readyNotified=true;if(u.slot>=0)this.emit('spawn',u.x,u.y,u.x,u.y,0x99ffdf,{duration:.4,radius:35});}
    }
    stepActions(this,dt);
    for(const [uid] of this.retiredUnits)if(!this.enemies.some(e=>e.active&&e.dotOwner===uid&&(e.burn||e.bleed))&&!this.actions.some(a=>a.active&&a.owner===uid)&&!this.zones.some(z=>z.active&&z.owner===uid))this.retiredUnits.delete(uid);
    if(this.records.length>128){const keep=new Set([...this.units.map(u=>u.uid),...this.retiredUnits.keys()]);this.records=this.records.filter((r,i)=>{if(i>=this.records.length-100||keep.has(r.uid))return true;const archived=this.archivedRecords[r.heroId]??=newRecord(-heroes.findIndex(h=>h.id===r.heroId)-1,r.heroId,r.star,r.born);accumulateRecord(archived,r);return false;});}
    for(const n of this.damageNumbers)n.life=Math.max(0,n.life-dt);
    for(const [key,n] of this.dotLabels)if(this.time>=n.until){this.showDamage(n.value,n.x,n.y);this.dotLabels.delete(key);}
    if (this.intermission > 0) {
      this.intermission -= dt;
      if (this.intermission <= 0) {
        this.wave.start(this.wave.number + 1);
        this.objectiveGeneration=0;
        if (this.wave.data.boss) {
          this.say(`BOSS WAVE ${this.wave.number} · ${enemies[this.wave.data.boss].name}`);
          this.onSound?.("boss");
        } else
          this.say(
            `WAVE ${String(this.wave.number).padStart(2, "0")} · ${this.wave.data.phase}`,
          );
      }
      return;
    }
    this.wave.elapsed += dt;
    this.wave.spawnTimer -= dt;
    if (
      this.wave.queue.length &&
      this.wave.spawnTimer <= 0 &&
      this.alive < this.enemyCap
    ) {
      this.spawn(this.wave.queue.shift()!);
      this.wave.spawnTimer += this.wave.data.interval;
    }
    stepCombat(this, dt);
    if(this.ended)return;
    if(this.started&&this.units.some(u=>u.slot>=0)&&this.units.filter(u=>u.slot>=0).every(u=>u.hp<=0)){
      this.say('출전 요원 전원 전투 불능 · 작전 실패');
      this.finish(false);
      return;
    }
    if (this.core <= 0 && !this.invincible) {
      this.finish(false);
      return;
    }
    if (
      !this.wave.queue.length &&
      !this.alive
    ) {
      if(this.campaign && this.wave.number>=this.campaign.waves){this.finish(true);return;}
      this.award(this.wave.data.reward);
      this.core = Math.min(100, this.core + (this.bonuses.regen ?? 0));
      this.intermission = .01;
      if(this.campaign&&!this.rewardedCampaignWaves.has(this.wave.number)){
        this.rewardedCampaignWaves.add(this.wave.number);
        if([2,4,6].includes(this.wave.number)){
          this.doctrineLevel=Math.min(4,this.doctrineLevel+1);
          const name=this.doctrine==='rapid'?'연사 지원':this.doctrine==='focus'?'집중 타격':'방어 지원';
          this.chosenTraits.push({id:`doctrine-${this.wave.number}`,name:`${name} ${this.doctrineLevel}단계`,description:'자동 강화 · 이번 전투 한정',tier:'RARE',effect:'doctrine',value:this.doctrineLevel});
          this.say(`${name} ${this.doctrineLevel}단계 · 자동 강화`);
        }
        if(this.doctrine==='guard'){
          this.core=Math.min(100,this.core+2);
          for(const u of this.units)if(u.hp>0)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.1);
        }
      }
      // Periodic trait/evolution selection removed; merge and gold upgrades remain.
      if (this.wave.data.elite) this.grantAutomaticRelic();
      if (this.rng() < 0.03) {
        this.award(60);
        this.say("희귀 이벤트 · 잊힌 보급상자 GOLD +60");
      }
      this.refresh();
    }
  }
  debug(action: string) {
    if (action === "gold") this.gold += 1000;
    if (action === "next") {
      this.started = true;
      this.wave.start(Math.max(1, this.wave.number + 1));
      this.enemies.forEach((e) => (e.active = false));
      this.intermission = 0;
    }
    if (action === "boss") {
      this.started = true;
      const target = Math.max(10, Math.ceil(Math.max(1, this.wave.number) / 10) * 10);
      this.wave.start(target);
      this.enemies.forEach((e) => (e.active = false));
      this.intermission = 0;
      this.say(`BOSS WAVE · ${enemies[this.wave.data.boss!].name}`);
    }
    if (action === "all")
      for (const id of Object.keys(heroById))
        if (this.units.length < 22) this.addUnit(id);
    if (action === "stars")
      for (const u of this.units) {
        u.star = 5;
        u.maxHp = heroById[u.heroId].hp * 8;
        u.hp = u.maxHp;
        this.highestStar = 5;
      }
    if (action === "god") this.invincible = !this.invincible;
    if(action==="speed"){const index=BATTLE_SPEEDS.indexOf(this.speed as typeof BATTLE_SPEEDS[number]);this.speed=BATTLE_SPEEDS[(index+1+BATTLE_SPEEDS.length)%BATTLE_SPEEDS.length];}
    this.refresh();
  }
}
