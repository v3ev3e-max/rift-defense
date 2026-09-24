import { preserveScroll, replacePanel, updatePanel } from './ui/stablePanel';
import {campaignSelect,campaignFormation,campaignBattle,campaignSkillBar,campaignUnit,campaignResult,squadSummary,formationFilter,filterRoster,formationHelp,campaignResearch,campaignPrep,campaignPrepEquipment,campaignPrepSelection,heroCollectionFilter,campaignPrepFilter} from './ui/CampaignUI';
import {campaignStages,stageUnlocked,doctrines,campaignWorldlines} from './data/campaign';
import {priorities} from './data/strategy';
import {waveBrief} from './data/waves';
import "./style.css";
import { SaveSystem,defaultSave,localTestResetSave,STARTER_HERO_IDS } from "./systems/SaveSystem";
import { GameAudio } from "./utils/Audio";
import {assetUrl} from './utils/assets';
import { BATTLE_SPEEDS, BattleModel } from "./systems/BattleModel";
import { mergeGroup } from "./systems/MergeSystem";
import { heroes, heroById } from "./data/heroes";
import {CAMPAIGN_SQUAD_CAP,formationComplete,formationRole} from './data/combatRoles';
import { battleMaps } from "./data/map";
import { BALANCE } from "./data/balance";
import { button, icon, num, portrait, combatPortrait, time, esc } from "./ui/components";
import {
  home,
  heroScreen,
  deckScreen,
  stageScreen,
  resultScreen,
  settingsScreen,
  commanderSettings,
  equipmentShop,
  itemScreen,
  recruitScreen,
  recruitResult,
} from "./ui/screens";
import {
  battleScreen,
  growthPanel,
  shopPanel,
  dpsPanel,
  unitPanel,
  synergyPanel,
  elementUpgradePanel,
  buildPanel,
  rewardModal,

  tacticalModal,
} from "./ui/BattleHUD";
import type Phaser from "phaser";
import {armorCatalog,campaignEquipmentDropChance,campaignEquipmentRarity,enhanceCost,equipmentCraftCost,equipmentSalvageValue,equipmentShopPrice,equipItem,equipped,heroWeaponGroup,makeEquipment,necklaceCatalog,rarityMax,weaponCatalog} from './data/equipment';
import type {EquipmentSlot} from './data/equipment';
import type {HeroGrade} from './data/types';
import {RECRUIT_COST,recruit} from './systems/RecruitSystem';
import {commanderById,commanderPortrait} from './data/commanders';
import {raidScreen,type RaidRuntime} from './ui/RaidUI';
import {RAID_DURATION,raidAutoDamage,raidManualDamage,refreshRaid} from './data/raid';
import {campaignPower} from './systems/CampaignPower';

type Screen =
  "home" | "hero" | "deck" | "stage" | "raid" | "battle" | "result" | "settings" | "shop" | "inventory" | "recruit";
const localTestMode=import.meta.env.DEV||location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname);
class App {
  root = document.querySelector<HTMLDivElement>("#app")!;
  save = new SaveSystem();
  audio = new GameAudio();
  screen: Screen = "home";
  hero = "sera";
  shopRarity:HeroGrade='B';
  shopSlot:'weapon'|'armor'|'necklace'='weapon';
  shopWeaponGroup='rifle';
  itemTab:'inventory'|'craft'|'equipped'='inventory';
  itemSlot:'all'|EquipmentSlot='all';
  itemRarity:'all'|HeroGrade='all';
  itemSelected?:string;
  salvageGrades=new Set<HeroGrade>();
  craftRarity:HeroGrade='B';
  craftSlot:EquipmentSlot='weapon';
  prepEquipmentFilter:'all'|'weapon'|'armor'|'necklace'='all';
  prepStep:'squad'|'placement'|'equipment'='squad';
  model?: BattleModel;
  game?: Phaser.Game;
  lastHud = 0;
  backgroundAt = 0;
  lastRevision = -1;
  modalKey = "";
  modalType = "";
  tutorialStep = 0;
  lastWave = 0;
  resultHandled = false;
  raidBossIndex=0;
  raidRuntime?:RaidRuntime;
  raidTimer=0;
  renderToken = 0;
  renderedScreen?:Screen;
  prepDrag?:{heroId:string;startX:number;startY:number;pointerId:number;source:HTMLElement;active:boolean;ghost?:HTMLElement};
  prepDragScroll=0;
  prepDragScrollTimer=0;
  suppressPrepClickUntil=0;
  constructor() {
    this.audio.configure(this.save.data.settings);
    this.root.addEventListener("click", (e) => {
      if(performance.now()<this.suppressPrepClickUntil){e.preventDefault();e.stopPropagation();return;}
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-action]",
      );
      if (target && !target.hasAttribute("disabled"))
        this.action(target.dataset.action!, target.dataset.id);
    });
    this.root.addEventListener('pointerdown',e=>this.beginPrepDrag(e));
    window.addEventListener('pointermove',e=>this.movePrepDrag(e),{passive:false});
    window.addEventListener('pointerup',e=>this.endPrepDrag(e));
    window.addEventListener('pointercancel',e=>this.endPrepDrag(e));
    window.addEventListener('campaign-unit-reserved',(event)=>{
      const m=this.model;if(!m?.campaign||m.started)return;
      const removed=m.units.find(u=>u.slot<0&&u.uid===(event as CustomEvent<{uid:number}>).detail?.uid);
      if(removed&&this.save.data.campaign){this.save.data.campaign.squad=this.save.data.campaign.squad.filter(id=>id!==removed.heroId);m.save.campaign!.squad=[...this.save.data.campaign.squad];m.syncCampaignSquad(this.save.data.campaign.squad);this.persist();}
      const panel=this.root.querySelector('#campaign-prep');if(panel)replacePanel(panel,campaignPrep(m,this.prepStep));
      this.updateHud(true);this.toast('전장에서 제외하고 편성에서도 해제했습니다.');
    });
    this.root.addEventListener("change", (e) => {
      const el = e.target as HTMLInputElement;
      if(el.id==='equipment-shop-group'){this.shopWeaponGroup=el.value;this.render();}
      if(el.id==='item-craft-group'){this.shopWeaponGroup=el.value;this.render();}
      if(el.dataset.salvageGrade){const grade=el.dataset.salvageGrade as HeroGrade;if(['B','A','S','SR'].includes(grade)){if(el.checked)this.salvageGrades.add(grade);else this.salvageGrades.delete(grade);this.render();}}
      if(el.id==='item-filter-slot'){this.itemSlot=el.value as typeof this.itemSlot;this.render();}
      if(el.id==='item-filter-rarity'){this.itemRarity=el.value as typeof this.itemRarity;this.render();}
      if(el.id==='campaign-grade'||el.id==='campaign-role'){formationFilter[el.id==='campaign-grade'?'grade':'role']=el.value;filterRoster();}
      if(el.id==='hero-grade-filter'||el.id==='hero-role-filter'){
        heroCollectionFilter[el.id==='hero-grade-filter'?'grade':'role']=el.value;
        this.filterHeroCollection();
      }
      if(el.id==='prep-equipment-filter'&&this.model?.campaign&&!this.model.started){this.prepEquipmentFilter=el.value as typeof this.prepEquipmentFilter;this.updateHud(true);}
      if(el.dataset.presetName!==undefined&&this.save.data.campaign){const index=Number(el.dataset.presetName),fallback=`프리셋 ${index+1}`,name=el.value.trim().slice(0,16)||fallback;if(index>=0&&index<3){this.save.data.campaign.deploymentPresetNames[index]=name;if(this.model?.save.campaign)this.model.save.campaign.deploymentPresetNames[index]=name;el.value=name;this.persist();this.toast(`${name} 이름 저장 완료`);}}
      if (el.id === "research-select") this.updateHud(true);
      if (el.id === "save-file" && el.files?.[0]) {
        void el.files[0].text().then((raw) => {
          try {
            this.save.import(raw);
            this.audio.configure(this.save.data.settings);
            this.render();
            this.toast("저장 파일을 가져왔습니다.");
          } catch (err) {
            this.toast(String(err));
          }
        });
      }
    });
    this.root.addEventListener('input',(e)=>{
      const el=e.target as HTMLInputElement;if(el.type!=='range')return;
      const key=el.dataset.audioVolume as 'bgmVolume'|'sfxVolume'|undefined;if(!key)return;
      const value=Math.max(0,Math.min(100,Number(el.value)||0));this.save.data.settings[key]=value/100;
      const output=this.root.querySelector<HTMLOutputElement>(`output[for="${el.id}"]`);if(output)output.value=`${Math.round(value)}%`;
      this.audio.configure(this.save.data.settings);this.persist();
    });
    document.addEventListener("keydown", (e) => this.key(e));
    document.addEventListener("visibilitychange", () => {
      if(document.hidden){this.backgroundAt=Date.now();return;}
      this.catchUpBackgroundTime();
    });
    window.addEventListener("pagehide", () => this.save.persist());
    this.render();
    if (import.meta.env.PROD && "serviceWorker" in navigator)
      window.addEventListener("load", () => {
        void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
      });
    if (import.meta.env.DEV) (window as unknown as { rift: App }).rift = this;
  }
  toast(text: string) {
    let el = document.querySelector<HTMLDivElement>("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      document.body.append(el);
    }
    el.textContent = text;
    el.classList.add("show");
    setTimeout(() => el?.classList.remove("show"), 2800);
  }
  persist() {
    if (!this.save.persist())
      this.toast(
        "브라우저 저장을 사용할 수 없습니다. 설정에서 저장 파일을 백업하세요.",
      );
  }
  navigate(screen: Screen) {
    if(this.raidTimer){clearInterval(this.raidTimer);this.raidTimer=0;}
    if(screen!=='raid')this.raidRuntime=undefined;
    if (this.game) {
      this.game.destroy(true);
      this.game = undefined;
    }
    this.screen = screen;
    this.modalKey = "";
    this.modalType = "";
    this.render();
  }
  render() {
    const keepScroll=this.renderedScreen===this.screen;
    const s = this.save.data;
    this.renderToken++;
    const content =
      this.screen === "home"
        ? home(s)
        : this.screen === "hero"
          ? heroScreen(s, this.hero)
          : this.screen === "deck"
            ? campaignFormation(s)
            : this.screen === 'shop'
              ? equipmentShop(s,this.shopRarity,this.shopSlot,this.shopWeaponGroup)
            : this.screen === 'inventory'
              ? itemScreen(s,this.itemTab,this.itemSlot,this.itemRarity,this.itemSelected,this.craftRarity,this.craftSlot,this.shopWeaponGroup,this.salvageGrades)
            : this.screen === 'recruit'
              ? recruitScreen(s)
            : this.screen === 'raid'
              ? raidScreen(s,this.raidBossIndex,this.raidRuntime)
            : this.screen === "stage"
              ? campaignSelect(s)
              : this.screen === "result" && this.model?.result
                ? (this.model.campaign?campaignResult(this.model.result):resultScreen(this.model.result))
                : this.screen === "settings"
                  ? settingsScreen(s, this.save.available)+commanderSettings(s)
                  : this.model
                    ? (this.model.campaign?campaignBattle(this.model,this.prepStep):battleScreen(this.model))
                    : home(s);
    const testPanel=localTestMode?`<details class="local-test-panel"><summary>LOCAL TEST</summary><div><label>C <input id="dev-credits" type="number" min="0" value="${s.credits}"></label><label>G <input id="dev-equipment-gold" type="number" min="0" value="${s.equipmentGold}"></label><label>재료 <input id="dev-materials" type="number" min="0" value="${s.equipmentMaterials}"></label>${button('재화 적용','dev-currency','compact')}${button('전체 스테이지 해금','dev-unlock','compact')}${button('전체 성장 MAX','dev-max','compact')}${(['B','A','S','SR'] as HeroGrade[]).map(g=>button(`${g} 장비 생성`,'dev-item','compact','',`data-id="${g}"`)).join('')}${(['B','A','S','SR'] as HeroGrade[]).map(g=>button(`${g==='SR'?'SSR':g} 모집 연출`,'dev-recruit','compact','',`data-id="${g}"`)).join('')}${this.model?button('전투 GOLD +1000','debug','compact','',`data-id="gold"`)+button('다음 웨이브','debug','compact','',`data-id="next"`)+button('무적','debug','compact','',`data-id="god"`):''}${button('저장 초기화','dev-reset','compact')}</div></details>`:'';
    const commander=commanderById[s.commanderId];
    const draw=()=>{this.root.innerHTML = `<div class="app-shell ${this.screen === "battle" ? "in-battle" : ""}"><header class="topbar"><button class="brand" data-action="home" aria-label="RIFT DEFENSE 홈"><span class="brand-mark">${icon("bolt")}</span><span>RIFT<span class="brand-thin"> DEFENSE</span><small>TACTICAL SQUAD DEFENSE</small></span></button><button class="commander" data-action="settings" aria-label="지휘관 ${esc(s.commanderName)} 설정"><img class="avatar" src="${assetUrl(commanderPortrait(commander.id))}" alt=""><span><b>${esc(s.commanderName)}</b><small>RIFT RESPONSE DIVISION</small></span></button><div class="top-currencies"><span title="영구 성장에 사용하는 크레딧">${icon("coin")}<b>${num(s.credits)}</b><small>C</small></span><span title="장비 상점 골드">${icon("coin")}<b>${num(s.equipmentGold)}</b><small>G</small></span><span title="클리어 기록 재화">${icon("gem")}<b>${num(s.shards)}</b></span></div>${button("설정", "settings", "icon-only", "settings", 'aria-label="설정" title="설정"')}</header><main id="screen">${content}</main>${testPanel}<div id="modal-layer"></div></div>`;};
    if(keepScroll)preserveScroll(draw);else draw();this.renderedScreen=this.screen;
    this.syncMusic();
    if(this.screen==='deck')filterRoster();
    if(this.screen==='hero')this.filterHeroCollection();
  }
  syncMusic(){
    if(this.screen==='home'||this.screen==='hero'||this.screen==='inventory')this.audio.setMusic('maint');
    else if(this.screen==='recruit')this.audio.setMusic('recruit');
    else if(this.screen==='deck'||(this.screen==='raid'&&!this.raidRuntime))this.audio.setMusic('formation');
    else if(this.screen==='raid'&&this.raidRuntime)this.audio.setMusic('battle2');
    else if(this.screen==='battle'&&this.model?.campaign&&!this.model.started){
      const playingBattle=this.audio.desiredMusic==='battle1'||this.audio.desiredMusic==='battle2';
      const region=Math.max(1,Number(this.model.campaign.id.split('-')[0])||1);
      this.audio.setMusic(playingBattle?(region%2===1?'battle1':'battle2'):'formation');
    }
    else if(this.screen==='battle'&&this.model?.campaign&&this.model.started&&!this.model.ended){
      const region=Math.max(1,Number(this.model.campaign.id.split('-')[0])||1);
      this.audio.setMusic(region%2===1?'battle1':'battle2');
    }
    else this.audio.setMusic();
  }
  filterHeroCollection(){this.root.querySelectorAll<HTMLElement>('[data-hero-card]').forEach(el=>{el.hidden=!(heroCollectionFilter.grade==='all'||el.dataset.grade===heroCollectionFilter.grade)||!(heroCollectionFilter.role==='all'||el.dataset.role===heroCollectionFilter.role);});}
  beginPrepDrag(e:PointerEvent){
    const source=(e.target as HTMLElement).closest<HTMLElement>('[data-drag-hero]');
    if(!source||!this.model?.campaign||this.model.started||this.screen!=='battle'||e.button!==0)return;
    this.prepDrag={heroId:source.dataset.dragHero!,startX:e.clientX,startY:e.clientY,pointerId:e.pointerId,source,active:false};
    try{source.setPointerCapture(e.pointerId);}catch{}
  }
  movePrepDrag(e:PointerEvent){
    const d=this.prepDrag;if(!d||d.pointerId!==e.pointerId)return;
    if(!d.active&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<10)return;
    if(!d.active){
      d.active=true;d.source.classList.add('drag-source');
      const ghost=document.createElement('div');ghost.className='prep-drag-ghost';ghost.setAttribute('aria-label',`${heroById[d.heroId].name} 배치 중`);ghost.innerHTML=`<img src="${assetUrl(`/assets/heroes/${d.heroId}/frame_01.png`)}" alt=""><i></i>`;document.body.append(ghost);d.ghost=ghost;document.body.classList.add('is-prep-dragging');
      this.root.querySelector('#phaser-container')?.classList.add('prep-drop-active');
    }
    e.preventDefault();if(d.ghost){d.ghost.style.left=`${e.clientX}px`;d.ghost.style.top=`${e.clientY}px`;const canvas=this.root.querySelector<HTMLCanvasElement>('#phaser-container canvas'),rect=canvas?.getBoundingClientRect();let valid=false;if(canvas&&rect&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){const x=(e.clientX-rect.left)/rect.width*800,y=(e.clientY-rect.top)/rect.height*800;valid=this.model!.map.slots.some((p,i)=>Math.hypot(p.x-x,p.y-y)<72&&!this.model!.units.some(u=>u.heroId!==d.heroId&&u.slot===i));}d.ghost.classList.toggle('valid',valid);d.ghost.classList.toggle('invalid',!valid);this.root.querySelector('#phaser-container')?.classList.toggle('prep-drop-valid',valid);document.body.classList.toggle('prep-drop-valid',valid);}
  }
  endPrepDrag(e:PointerEvent){
    const d=this.prepDrag;if(!d||d.pointerId!==e.pointerId)return;this.prepDrag=undefined;this.prepDragScroll=0;clearInterval(this.prepDragScrollTimer);this.prepDragScrollTimer=0;
    d.source.classList.remove('drag-source');d.ghost?.remove();document.body.classList.remove('is-prep-dragging','prep-drop-valid');this.root.querySelector('#phaser-container')?.classList.remove('prep-drop-active','prep-drop-valid');
    if(!d.active)return;
    this.suppressPrepClickUntil=performance.now()+350;e.preventDefault();
    const canvas=this.root.querySelector<HTMLCanvasElement>('#phaser-container canvas');if(!canvas)return;
    const rect=canvas.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return;
    const x=(e.clientX-rect.left)/rect.width*800,y=(e.clientY-rect.top)/rect.height*800;
    let slot=-1,dist=72;this.model!.map.slots.forEach((p,i)=>{const v=Math.hypot(p.x-x,p.y-y);if(v<dist){dist=v;slot=i;}});
    if(slot<0){this.toast('배치 패드 위에 놓아주세요.');return;}this.placeCampaignHero(d.heroId,slot);
  }
  placeCampaignHero(heroId:string,slot:number){
    const m=this.model,c=this.save.data.campaign;if(!m?.campaign||m.started||!c||!heroById[heroId]||!this.save.data.heroes[heroId].owned)return false;
    if(!c.squad.includes(heroId)){
      if(c.squad.length>=CAMPAIGN_SQUAD_CAP){this.toast(`편성이 가득 찼습니다. 기존 요원을 해제한 뒤 배치해주세요.`);return false;}
      c.squad=[...c.squad,heroId];m.save.campaign!.squad=[...c.squad];m.syncCampaignSquad(c.squad);this.persist();
    }
    const unit=m.units.find(u=>u.heroId===heroId);if(!unit)return false;
    const moved=m.move(unit.uid,slot);if(!moved){this.toast('이 칸에는 지금 배치할 수 없습니다.');return false;}
    m.selected=0;this.audio.play('summon');
    const panel=this.root.querySelector('#campaign-prep');if(panel)replacePanel(panel,campaignPrep(m,this.prepStep));
    this.updateHud(true);this.toast(`${heroById[heroId].name} 배치 완료`);return true;
  }
  async begin(mapId = this.save.data.campaign!.selected,preserveFormation=false) {
    const stage=campaignStages.find(s=>s.id===mapId);
    if(stage&&!stageUnlocked(stage.id,this.save.data.campaign!.records)){this.toast('이전 스테이지를 먼저 완료하세요.');return;}
    if (this.game) {
      this.game.destroy(true);
      this.game = undefined;
    }
    const campaign=this.save.data.campaign;
    const firstDeployment=!!stage&&stage.id==='1-1'&&!preserveFormation&&!!campaign&&
      Object.keys(campaign.records).length===0&&Object.keys(campaign.lastDeployment).length===0&&
      campaign.squad.length===STARTER_HERO_IDS.length&&campaign.squad.every((id,i)=>id===STARTER_HERO_IDS[i]);
    if(stage&&!preserveFormation&&campaign&&!firstDeployment){campaign.squad=[];this.persist();}
    this.model = new BattleModel(structuredClone(this.save.data), Math.random, battleMaps.find(v=>v.id===mapId)??battleMaps[0]);
    this.model.onSound = (sound) => this.audio.play(sound);
    if(stage){
      this.model.configureCampaign(stage,this.save.data.campaign!.squad,true);
      if(firstDeployment){this.model.autoSkills=false;this.model.autoDeployCampaign();this.save.data.campaign!.lastDeployment=Object.fromEntries(this.model.units.map(u=>[u.heroId,u.slot]));this.persist();}
    }
    else this.model.start();
    this.screen = "battle";
    this.tutorialStep = 0;
    this.lastWave = 0;
    this.resultHandled = false;
    this.lastRevision = -1;
    this.modalKey = "";
    this.modalType = "";
    this.prepStep='placement';
    this.render();
    const token = this.renderToken;
    const model = this.model;
    const loaderStartedAt=performance.now();
    try {
      const { createGame } = await import("./game/GameConfig");
      if (token !== this.renderToken) return;
      let lastLoadPercent=-1,lastLoadGroup='';
      const loadProgress=(progress:number,file:string)=>{
        if(token!==this.renderToken||model!==this.model)return;
        const loader=document.getElementById('battle-loader');if(!loader)return;
        const percent=Math.max(0,Math.min(100,Math.round(progress*100)));
        const group=file.startsWith('map-')?'map':file.startsWith('hero-')?'hero':file.startsWith('enemy-')?'enemy':'effect';
        if(percent===lastLoadPercent&&group===lastLoadGroup)return;lastLoadPercent=percent;lastLoadGroup=group;
        const bar=document.getElementById('battle-loader-bar');if(bar)bar.style.width=`${percent}%`;
        const value=document.getElementById('battle-loader-percent');if(value)value.textContent=`${percent}%`;
        const label=document.getElementById('battle-loader-label');if(label)label.textContent=group==='map'?'전장 배경 구성 중':group==='hero'?'요원 애니메이션 배치 중':group==='enemy'?'적 데이터 탐색 중':'전투 효과 동기화 중';
      };
      const ready=()=>{
        if(token!==this.renderToken||model!==this.model)return;
        const loader=document.getElementById('battle-loader');
        if(loader){
          const bar=loader.querySelector<HTMLElement>('#battle-loader-bar');if(bar)bar.style.width='100%';
          const value=loader.querySelector<HTMLElement>('#battle-loader-percent');if(value)value.textContent='100%';
          const label=loader.querySelector<HTMLElement>('#battle-loader-label');if(label)label.textContent='전장 준비 완료';
          const finish=()=>{if(token!==this.renderToken||model!==this.model||!loader.isConnected)return;loader.classList.add('complete');setTimeout(()=>loader.isConnected&&loader.remove(),360);};
          setTimeout(finish,Math.max(0,650-(performance.now()-loaderStartedAt)));
        }
      };
      this.game = createGame(model, () => this.updateHud(),loadProgress,ready);
      this.updateHud(true);
    } catch (err) {
      this.toast(`전장 로딩 실패: ${String(err)}`);
      this.navigate("stage");
    }
  }
  startRaid(){
    const raid=refreshRaid(this.save.data),squad=this.save.data.campaign?.squad.slice(0,5)??[];
    if(raid.attempts<=0){this.toast('오늘의 레이드 도전 횟수를 모두 사용했습니다.');return;}
    if(squad.length!==5){this.toast('캠페인 편성에서 요원 5명을 선택해주세요.');return;}
    raid.attempts--;const power=campaignPower(this.save.data,campaignStages.find(v=>v.id===this.save.data.campaign?.selected)??campaignStages[0]),bossMaxHp=Math.max(1200000,Math.round(power*RAID_DURATION*1.55));
    this.raidRuntime={bossIndex:this.raidBossIndex,time:RAID_DURATION,damage:0,bossHp:bossMaxHp,bossMaxHp,phase:1,pattern:'전투 개시 · 공격 예고',manualCooldown:0,squadHp:[100,100,100,100,100],summons:0,running:true};this.persist();this.render();
    this.raidTimer=window.setInterval(()=>this.tickRaid(power),1000);
  }
  tickRaid(power:number){const r=this.raidRuntime;if(!r?.running)return;const auto=this.save.data.campaign?.autoSkills!==false,alive=r.squadHp.filter(v=>v>0).length;if(!alive){this.finishRaid();return;}const dealt=raidAutoDamage(power,auto,alive,r.summons);r.damage+=dealt;r.bossHp=Math.max(0,r.bossHp-dealt);r.time=Math.max(0,r.time-1);r.manualCooldown=Math.max(0,r.manualCooldown-1);const ratio=r.bossHp/r.bossMaxHp,newPhase=ratio<=.4?3:ratio<=.7?2:1;if(newPhase!==r.phase){r.phase=newPhase;r.pattern=`PHASE ${newPhase} 전환 · 공격 강화`;this.audio.play('boss');}
    const elapsed=RAID_DURATION-r.time;if(elapsed>0&&elapsed%15===0){const pattern=(elapsed/15-1)%4,damage=4+r.phase*2;if(pattern===0){r.pattern='광역기 · 전 요원 피해';r.squadHp=r.squadHp.map(v=>Math.max(0,v-damage));}else if(pattern===1){r.pattern='전방 파괴 · 선두 요원 집중 피해';r.squadHp[0]=Math.max(0,r.squadHp[0]-damage*2.4);}else if(pattern===2){r.pattern='후열 저격 · 저격수 진형 경고';for(const i of [3,4])r.squadHp[i]=Math.max(0,r.squadHp[i]-damage*1.7);}else{r.pattern='균열 소환 · 소환체가 보스를 보호';r.summons=Math.min(6,r.summons+1);}}
    if(r.time<=0||r.bossHp<=0){this.finishRaid();return;}this.render();
  }
  castRaidManual(){const r=this.raidRuntime;if(!r?.running||r.manualCooldown>0)return;const power=campaignPower(this.save.data,campaignStages.find(v=>v.id===this.save.data.campaign?.selected)??campaignStages[0]),burst=raidManualDamage(power,r.squadHp.filter(v=>v>0).length);r.damage+=burst;r.bossHp=Math.max(0,r.bossHp-burst);r.manualCooldown=12;r.summons=Math.max(0,r.summons-1);r.pattern='수동 집중 스킬 · 소환체 차단 및 약점 타격';this.audio.play('level');if(r.bossHp<=0)this.finishRaid();else this.render();}
  finishRaid(){const r=this.raidRuntime;if(!r)return;if(this.raidTimer){clearInterval(this.raidTimer);this.raidTimer=0;}r.running=false;const raid=refreshRaid(this.save.data),damage=Math.floor(r.damage);raid.dailyBest=Math.max(raid.dailyBest,damage);raid.weeklyBest=Math.max(raid.weeklyBest,damage);raid.weeklyDamage+=damage;let reward='';for(const [i,[target,kind,amount]] of ([[250000,'credits',300],[750000,'materials',15],[1500000,'gold',1000]] as const).entries())if(raid.weeklyDamage>=target&&!raid.claimed.includes(i)){raid.claimed.push(i);if(kind==='credits')this.save.data.credits+=amount;else if(kind==='materials')this.save.data.equipmentMaterials+=amount;else this.save.data.equipmentGold+=amount;reward+=` · ${amount}${kind==='credits'?'C':kind==='gold'?'G':' 재료'}`;}this.persist();this.raidRuntime=undefined;this.render();this.toast(`레이드 종료 · 피해 ${num(damage)}${reward}`);}
  action(action: string, id?: string) {
    this.audio.unlock();
    const m = this.model;
    if (["home", "hero", "deck", "stage", "raid", "settings", "shop", "inventory", "recruit"].includes(action) && !id) {
      if (this.screen === "battle" && m && !m.ended) {
        if(m.campaign&&!m.started){m.paused=false;this.navigate(action as Screen);return;}
        m.paused = true;
        this.showModal(
          `<div class="modal small-modal"><h2>작전을 종료할까요?</h2><p>진행 중인 전투가 패배 처리되고 도달 기록에 따른 보상을 받습니다.</p><div class="modal-actions">${button("계속하기", "resume", "ghost")}${button("작전 종료", "retreat", "primary")}</div></div>`,
          "exit",
        );
        return;
      }
      this.navigate(action as Screen);
      return;
    }
    switch (action) {
      case 'raid-boss':this.raidBossIndex=Math.max(0,Math.min(2,Number(id)||0));this.render();break;
      case 'raid-start':this.startRaid();break;
      case 'raid-auto':if(this.save.data.campaign){this.save.data.campaign.autoSkills=!this.save.data.campaign.autoSkills;this.persist();this.render();}break;
      case 'raid-manual':this.castRaidManual();break;
      case 'raid-retreat':this.finishRaid();break;
      case 'commander-name-save':{
        const input=this.root.querySelector<HTMLInputElement>('#commander-name'),name=input?.value.trim().replace(/\s+/g,' ').slice(0,12)??'';
        if(!name){this.toast('닉네임을 1자 이상 입력해주세요.');input?.focus();break;}
        this.save.data.commanderName=name;this.persist();this.audio.play('click');this.render();this.toast(`${name} 지휘관으로 저장했습니다.`);break;
      }
      case 'commander-select':
        if(id&&commanderById[id]){this.save.data.commanderId=id;this.persist();this.audio.play('click');this.render();this.toast(`${commanderById[id].name} 지휘관을 선택했습니다.`);}
        break;
      case 'recruit-pull':{const count=id==='10'?10:1,cost=count===10?RECRUIT_COST.ten:RECRUIT_COST.one;if(this.save.data.equipmentGold<cost){this.toast(`모집 골드 부족 · ${cost}G 필요`);break;}this.save.data.equipmentGold-=cost;const results=recruit(this.save.data,count);this.persist();this.render();this.audio.play(results.some(v=>v.grade==='SR')?'boss':results.some(v=>v.grade==='S')?'level':'summon');this.showModal(recruitResult(results),'recruit-result');break;}
      case 'item-tab':if(['inventory','craft','equipped'].includes(id??'')){this.itemTab=id as typeof this.itemTab;this.render();}break;
      case 'item-select':if(id){this.itemSelected=id;this.itemTab='inventory';this.render();}break;
      case 'item-craft-slot':if(['weapon','armor','necklace'].includes(id??'')){this.craftSlot=id as EquipmentSlot;this.render();}break;
      case 'item-craft-rarity':if(['B','A','S','SR'].includes(id??'')){this.craftRarity=id as HeroGrade;this.render();}break;
      case 'item-craft':{if(!id)break;const cost=equipmentCraftCost[this.craftRarity],s=this.save.data;if(s.equipmentInventory.length>=100){this.toast('장비 보관함이 가득 찼습니다.');break;}if(s.equipmentMaterials<cost.material||s.equipmentGold<cost.gold){this.toast(`제작 재료 부족 · 재료 ${cost.material} / ${cost.gold}G`);break;}try{const item=makeEquipment(id,this.craftRarity);s.equipmentMaterials-=cost.material;s.equipmentGold-=cost.gold;s.equipmentInventory.push(item);this.itemSelected=item.id;this.itemTab='inventory';this.persist();this.audio.play('summon');this.render();this.toast(`${item.name} 제작 완료`);}catch{this.toast('제작할 수 없는 장비입니다.');}break;}
      case 'item-salvage-all':this.salvageGrades=this.salvageGrades.size===4?new Set():new Set<HeroGrade>(['B','A','S','SR']);this.render();break;
      case 'item-salvage-selected':{const targets=this.save.data.equipmentInventory.filter(v=>this.salvageGrades.has(v.rarity)&&!v.equippedBy&&!v.locked&&!Object.values(this.save.data.heroes).some(h=>h.equipment.includes(v.id)));if(!targets.length){this.toast('선택한 등급에 분해 가능한 장비가 없습니다.');break;}this.save.data.equipmentMaterials+=targets.reduce((n,v)=>n+equipmentSalvageValue(v),0);const ids=new Set(targets.map(v=>v.id));this.save.data.equipmentInventory=this.save.data.equipmentInventory.filter(v=>!ids.has(v.id));if(this.itemSelected&&ids.has(this.itemSelected))this.itemSelected=undefined;this.persist();this.render();this.toast(`${targets.length}개 분해 완료`);break;}
      case 'equipment-shop-rarity':if(['B','A','S','SR'].includes(id??'')){this.shopRarity=id as HeroGrade;this.render();}break;
      case 'equipment-shop-slot':if(['weapon','armor','necklace'].includes(id??'')){this.shopSlot=id as typeof this.shopSlot;this.render();}break;
      case 'equipment-shop-buy':{const price=equipmentShopPrice[this.shopRarity];if(!id)break;if(this.save.data.equipmentInventory.length>=100){this.toast('장비 보관함이 가득 찼습니다.');break;}if(this.save.data.equipmentGold<price){this.toast(`전리품 골드 부족 · ${price}G 필요`);break;}try{const item=makeEquipment(id,this.shopRarity);this.save.data.equipmentGold-=price;this.save.data.equipmentInventory.push(item);this.persist();this.audio.play('summon');this.render();this.toast(`${item.name} · ${item.rarity} 구매 완료`);}catch{this.toast('구매할 수 없는 장비입니다.');}break;}
      case 'campaign-select':
        if(id&&campaignStages.some(s=>s.id===id)){this.save.data.campaign!.selected=id;this.persist();this.render();}break;
      case 'campaign-region':{
        const region=Number(id),first=campaignStages.find(s=>s.id===`${region}-1`);
        if(first){this.save.data.campaign!.selected=first.id;this.persist();this.render();}break;
      }
      case 'campaign-worldline':{
        const worldline=Number(id),region=campaignWorldlines.find(w=>w.id===worldline)?.regions[0]??1,first=campaignStages.find(s=>s.id===`${region}-1`);
        if(first){this.save.data.campaign!.selected=first.id;this.persist();this.render();}break;
      }
      case 'campaign-prep-step':if(m?.campaign&&!m.started&&['squad','placement','equipment'].includes(id??'')){this.prepStep=id as 'squad'|'placement'|'equipment';const panel=this.root.querySelector('#campaign-prep');if(panel)replacePanel(panel,campaignPrep(m,this.prepStep));this.updateHud(true);}break;
      case 'campaign-prep-role':if(m?.campaign&&!m.started&&['tank','support','dealer','sniper'].includes(id??'')){campaignPrepFilter.role=id as typeof campaignPrepFilter.role;const panel=this.root.querySelector('#campaign-prep');if(panel)replacePanel(panel,campaignPrep(m,this.prepStep));}break;
      case 'campaign-doctrine':{
        const d=doctrines.find(d=>d.id===id);if(!d)break;
        this.save.data.campaign!.doctrine=d.id;this.persist();
        if(m?.campaign&&!m.started){m.doctrine=d.id;m.save.campaign!.doctrine=d.id;m.revision++;}
        this.root.querySelectorAll<HTMLElement>('[data-action="campaign-doctrine"]').forEach(el=>{const active=el.dataset.id===id;el.classList.toggle('primary',active);el.classList.toggle('ghost',!active);el.setAttribute('aria-pressed',String(active));});
        this.root.querySelector('#doctrine-description')!.textContent=d.text+' · 2·4·6웨이브 종료 자동 강화';break;
      }
      case 'campaign-help':this.showModal('<div class="modal small-modal">'+formationHelp(this.save.data)+button('닫기','close-modal','primary')+'</div>','campaign-help');break;
      case 'campaign-lab':this.showModal('<div class="modal small-modal">'+campaignResearch(this.save.data)+button('닫기','close-modal','primary')+'</div>','campaign-lab');break;
      case 'campaign-toggle':{
        const c=this.save.data.campaign!;if(!id||!heroById[id])break;
        if(!this.save.data.heroes[id].owned){this.toast('아직 보유하지 않은 요원입니다.');break;}
        if(c.squad.includes(id))c.squad=c.squad.filter(v=>v!==id);
        else {if(c.squad.length>=CAMPAIGN_SQUAD_CAP){this.toast(`출전 요원은 최대 ${CAMPAIGN_SQUAD_CAP}명입니다.`);break;}c.squad=[...c.squad,id];}
        this.persist();
        const summary=this.root.querySelector<HTMLElement>('#squad-summary'),restoreFocus=!!summary?.contains(document.activeElement);
        if(summary)updatePanel(summary,squadSummary(this.save.data));
        if(restoreFocus)summary?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
        this.root.querySelectorAll<HTMLElement>('.campaign-roster [data-action="campaign-toggle"]').forEach(el=>{const selected=c.squad.includes(el.dataset.id!);el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});
        break;
      }
      case 'campaign-prep-toggle':{
        if(!m?.campaign||m.started||!id||!heroById[id])break;
        const c=this.save.data.campaign!;
        if(!this.save.data.heroes[id].owned){this.toast('아직 보유하지 않은 요원입니다.');break;}
        const removing=c.squad.includes(id);
        if(removing)c.squad=c.squad.filter(v=>v!==id);
        else {if(c.squad.length>=CAMPAIGN_SQUAD_CAP){this.toast(`출전 요원은 최대 ${CAMPAIGN_SQUAD_CAP}명입니다.`);break;}c.squad=[...c.squad,id];}
        m.save.campaign!.squad=[...c.squad];m.syncCampaignSquad(c.squad);this.persist();
        if(!removing){const added=m.units.find(u=>u.heroId===id);if(added)m.selected=added.uid;this.toast(`${heroById[id].name} 선택 · 전장의 빈 칸을 누르세요.`);}
        this.root.querySelectorAll<HTMLElement>('.prep-roster [data-action="campaign-prep-toggle"]').forEach(el=>{const active=c.squad.includes(el.dataset.id!);el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
        const selectedStrip=this.root.querySelector<HTMLElement>('.prep-selected');if(selectedStrip)updatePanel(selectedStrip,campaignPrepSelection(m));
        const summaryCount=this.root.querySelector('.campaign-prep details summary b');if(summaryCount)summaryCount.textContent=`${c.squad.length} / ${CAMPAIGN_SQUAD_CAP} · 보유 ${heroes.filter(h=>this.save.data.heroes[h.id].owned).length}`;
        const prepTitle=this.root.querySelector<HTMLElement>('.campaign-prep>header b');if(prepTitle)prepTitle.textContent=`드래그 배치 · ${c.squad.length}/${CAMPAIGN_SQUAD_CAP}`;
        const autoDeploy=this.root.querySelector<HTMLButtonElement>('[data-action="campaign-auto-deploy"]');if(autoDeploy)autoDeploy.disabled=!formationComplete(c.squad);
        this.updateHud(true);break;
      }
      case 'campaign-equipment':if(m?.campaign&&!m.started&&id){this.hero=id;const u=m.units.find(v=>v.heroId===id);if(u)m.selected=u.uid;this.updateHud(true);}break;
      case 'prep-equip':if(m?.campaign&&!m.started&&id&&equipItem(this.save.data,this.hero,id)){this.persist();m.syncPermanentSave(this.save.data);}break;
      case 'prep-unequip':{const item=this.save.data.equipmentInventory.find(v=>v.id===id);if(m?.campaign&&!m.started&&item?.equippedBy){this.save.data.heroes[item.equippedBy].equipment=this.save.data.heroes[item.equippedBy].equipment.filter(v=>v!==item.id);item.equippedBy=undefined;this.persist();m.syncPermanentSave(this.save.data);}break;}
      case 'prep-unequip-all':if(m?.campaign&&!m.started&&id){for(const item of equipped(this.save.data,id)){item.equippedBy=undefined;}this.save.data.heroes[id].equipment=[];this.persist();m.syncPermanentSave(this.save.data);break;}
      case 'prep-enhance':{const item=this.save.data.equipmentInventory.find(v=>v.id===id);if(m?.campaign&&!m.started&&item&&item.enhance<rarityMax[item.rarity]){const cost=enhanceCost(item);if(this.save.data.credits>=cost.gold&&this.save.data.equipmentMaterials>=cost.material){this.save.data.credits-=cost.gold;this.save.data.equipmentMaterials-=cost.material;item.enhance++;this.persist();m.syncPermanentSave(this.save.data);}else this.toast(`강화 재료 부족 · ${Math.ceil(cost.gold)}C / 재료 ${cost.material}`);}break;}
      case 'prep-auto':if(m?.campaign&&!m.started&&id){for(const slot of ['weapon','armor','necklace'] as const){const candidate=this.save.data.equipmentInventory.filter(v=>!v.equippedBy&&v.slot===slot&&(slot!=='weapon'||v.weaponGroup===heroWeaponGroup[id])).sort((a,b)=>({B:0,A:1,S:2,SR:3}[b.rarity]-{B:0,A:1,S:2,SR:3}[a.rarity])||b.enhance-a.enhance)[0];if(candidate)equipItem(this.save.data,id,candidate.id);}this.persist();m.syncPermanentSave(this.save.data);}break;
      case 'campaign-auto-deploy':if(m?.campaign&&!m.started){
        const c=this.save.data.campaign!;
        if(m.units.length<CAMPAIGN_SQUAD_CAP){
          const selected=new Set(m.units.map(u=>u.heroId)),gradePower={B:0,A:1,S:2,SR:3},wanted={tank:1,dealer:2,sniper:1,support:1};
          const counts={tank:0,dealer:0,sniper:0,support:0};for(const heroId of selected)counts[formationRole(heroId)]++;
          const candidates=heroes.filter(h=>this.save.data.heroes[h.id].owned&&!selected.has(h.id)).sort((a,b)=>gradePower[b.grade]-gradePower[a.grade]||this.save.data.heroes[b.id].stars-this.save.data.heroes[a.id].stars||b.atk-a.atk);
          for(const role of ['tank','dealer','sniper','support'] as const)for(const h of candidates)if(selected.size<CAMPAIGN_SQUAD_CAP&&counts[role]<wanted[role]&&!selected.has(h.id)&&formationRole(h.id)===role){selected.add(h.id);counts[role]++;}
          for(const h of candidates)if(selected.size<CAMPAIGN_SQUAD_CAP)selected.add(h.id);
          c.squad=[...selected];m.save.campaign!.squad=[...selected];m.syncCampaignSquad(c.squad);this.persist();
        }
        if(m.autoDeployCampaign()){const panel=this.root.querySelector('#campaign-prep');if(panel)replacePanel(panel,campaignPrep(m,this.prepStep));this.audio.play('summon');this.updateHud(true);this.toast('추천 5인 편성과 배치를 적용했습니다.');}
      }break;
      case 'campaign-preset-save':{
        const index=Number(id),c=this.save.data.campaign;if(!m?.campaign||m.started||!c||!Number.isInteger(index)||index<0||index>2)break;
        const placed=m.units.filter(u=>u.slot>=0);
        if(!formationComplete(m.units.map(u=>u.heroId))||placed.length!==m.units.length){this.toast('요원을 모두 배치한 뒤 프리셋을 저장해주세요.');break;}
        const preset={squad:m.units.map(u=>u.heroId),layout:Object.fromEntries(placed.map(u=>[u.heroId,u.slot]))};
        c.deploymentPresets[index]=preset;m.save.campaign!.deploymentPresets[index]=structuredClone(preset);this.persist();
        const panel=this.root.querySelector('#campaign-prep');if(panel)replacePanel(panel,campaignPrep(m,this.prepStep));this.audio.play('summon');this.toast(`${c.deploymentPresetNames[index]} 저장 완료`);break;
      }
      case 'campaign-preset-load':{
        const index=Number(id),c=this.save.data.campaign;if(!m?.campaign||m.started||!c||!Number.isInteger(index)||index<0||index>2)break;
        const preset=c.deploymentPresets[index];if(!preset)break;
        const squad=preset.squad.filter(heroId=>this.save.data.heroes[heroId]?.owned&&heroById[heroId]).slice(0,CAMPAIGN_SQUAD_CAP);
        if(!formationComplete(squad)){this.toast('현재 사용할 수 없는 요원이 포함된 프리셋입니다.');break;}
        c.squad=[...squad];m.save.campaign!.squad=[...squad];m.syncCampaignSquad(squad);
        if(!m.deployCampaignLayout(preset.layout)){this.toast('이 맵에 프리셋 배치를 적용할 수 없습니다.');break;}
        this.persist();const panel=this.root.querySelector('#campaign-prep');if(panel)replacePanel(panel,campaignPrep(m,this.prepStep));this.audio.play('summon');this.updateHud(true);this.toast(`${c.deploymentPresetNames[index]} 적용 완료`);break;
      }
      case 'campaign-preset-clear':{
        const index=Number(id),c=this.save.data.campaign;if(!c||!Number.isInteger(index)||index<0||index>2)break;
        c.deploymentPresets[index]=null;if(m?.save.campaign)m.save.campaign.deploymentPresets[index]=null;this.persist();
        const panel=this.root.querySelector('#campaign-prep');if(panel&&m)replacePanel(panel,campaignPrep(m,this.prepStep));this.toast(`배치 프리셋 ${index+1} 삭제 완료`);break;
      }
      case 'campaign-deploy':void this.begin(this.save.data.campaign!.selected);break;
      case 'campaign-start':if(m?.campaign){if(!formationComplete(m.units.map(u=>u.heroId)))this.toast(`출전 요원을 1~${CAMPAIGN_SQUAD_CAP}명 선택해주세요.`);else {const placed=m.units.filter(u=>u.slot>=0);if(placed.length===m.units.length&&this.save.data.campaign){this.save.data.campaign.lastDeployment=Object.fromEntries(placed.map(u=>[u.heroId,u.slot]));this.persist();}m.start();this.syncMusic();}}break;
      case 'campaign-research':{
        const c=this.save.data.campaign!;if(!id||!['water','fire','electric','dark','burst','sniper','melee','chain','meteor','drone','support'].includes(id))break;
        const lv=c.research[id]??0,cost=100*(lv+1);if(lv<10&&this.save.data.credits>=cost){this.save.data.credits-=cost;c.research[id]=lv+1;this.persist();this.action('campaign-lab');}break;
      }
      case 'campaign-auto-advance':{
        const enabled=!(this.save.data.campaign?.autoAdvance??false);
        if(this.save.data.campaign)this.save.data.campaign.autoAdvance=enabled;
        if(m?.save.campaign)m.save.campaign.autoAdvance=enabled;
        this.persist();const toggle=document.getElementById('campaign-auto-advance-btn');if(toggle){toggle.classList.toggle('primary',enabled);toggle.classList.toggle('ghost',!enabled);toggle.setAttribute('aria-pressed',String(enabled));}this.updateHud(true);this.toast(enabled?'자동 진행 ON · 클리어 후 다음 지역으로 출격합니다.':'자동 진행 OFF');break;
      }
      case 'campaign-skill-auto':{
        if(!m?.campaign)break;m.autoSkills=!m.autoSkills;
        if(this.save.data.campaign)this.save.data.campaign.autoSkills=m.autoSkills;
        if(m.save.campaign)m.save.campaign.autoSkills=m.autoSkills;
        this.persist();this.updateHud(true);this.toast(m.autoSkills?'AUTO 스킬 ON · 준비 즉시 자동 발동':'AUTO 스킬 OFF · 일러스트를 눌러 수동 발동');break;
      }
      case 'campaign-cast-skill':{
        if(!m?.campaign||!id)break;const unit=m.units.find(u=>u.uid===Number(id));
        if(m.manualSkill(Number(id))){if(!this.save.data.tutorial&&m.campaign.id==='1-1')this.tutorialStep=Math.max(this.tutorialStep,2);this.updateHud(true);}
        else if(unit){const cool=Math.max(0,(unit.skillReadyAt??0)-m.time);this.toast(cool>0?`${heroById[unit.heroId].name} 스킬 쿨타임 ${cool.toFixed(1)}초`:(unit.skillCharge??0)<100?`${heroById[unit.heroId].name} 게이지 충전 ${Math.floor(unit.skillCharge??0)}%`:'현재 사거리 안에 대상이 없습니다.');}
        break;
      }
      case "hero":
        this.hero = id!;
        this.render();
        break;
      case 'hero-star':{const p=this.save.data.heroes[id!],cost=[0,0,5,10,20,35][(p?.stars??0)+1]??999,c=this.save.data.campaign!;if(p&&p.stars<5&&(c.fragments[id!]??0)>=cost){c.fragments[id!]-=cost;p.stars++;this.persist();this.audio.play('level');this.render();}break;}
      case 'equipment-equip':if(id&&equipItem(this.save.data,this.hero,id)){this.persist();this.audio.play('summon');this.render();}break;
      case 'equipment-unequip':{const item=this.save.data.equipmentInventory.find(v=>v.id===id);if(item?.equippedBy){const owner=this.save.data.heroes[item.equippedBy];owner.equipment=owner.equipment.filter(v=>v!==item.id);item.equippedBy=undefined;this.persist();this.render();}break;}
      case 'equipment-enhance':{const item=this.save.data.equipmentInventory.find(v=>v.id===id);if(!item||item.enhance>=rarityMax[item.rarity])break;const cost=enhanceCost(item);if(this.save.data.credits>=cost.gold&&this.save.data.equipmentMaterials>=cost.material){this.save.data.credits-=cost.gold;this.save.data.equipmentMaterials-=cost.material;item.enhance++;this.persist();this.audio.play('level');this.render();}else this.toast(`강화 재료 부족 · ${Math.ceil(cost.gold)}C / 재료 ${cost.material}`);break;}
      case 'equipment-auto':{if(!id)break;for(const slot of ['weapon','armor','necklace'] as const){const candidates=this.save.data.equipmentInventory.filter(v=>!v.equippedBy&&v.slot===slot&&(slot!=='weapon'||v.weaponGroup===heroWeaponGroup[id])).sort((a,b)=>({B:0,A:1,S:2,SR:3}[b.rarity]-{B:0,A:1,S:2,SR:3}[a.rarity])||b.enhance-a.enhance);if(candidates[0])equipItem(this.save.data,id,candidates[0].id);}this.persist();this.render();break;}
      case 'equipment-lock':{const item=this.save.data.equipmentInventory.find(v=>v.id===id);if(item){item.locked=!item.locked;this.persist();this.render();}break;}
      case 'equipment-salvage':{const item=this.save.data.equipmentInventory.find(v=>v.id===id);if(item&&!item.locked&&!item.equippedBy){this.save.data.equipmentMaterials+=equipmentSalvageValue(item);this.save.data.equipmentInventory=this.save.data.equipmentInventory.filter(v=>v!==item);if(this.itemSelected===item.id)this.itemSelected=undefined;this.persist();this.render();}break;}
      case "toggle-deck": {
        const d = this.save.data.deck;
        if (d.includes(id!)) {
          if (d.length === 1) {
            this.toast("최소 1명의 요원이 필요합니다.");
            break;
          }
          this.save.data.deck = d.filter((v) => v !== id);
        } else if (d.length < 10) d.push(id!);
        this.persist();
        this.render();
        break;
      }
      case "deck-all":
        this.save.data.deck = heroes.filter((h) => h.grade === "B").slice(0, 10).map((h) => h.id);
        this.persist();
        this.render();
        break;
      case "deck-recommended":
        this.save.data.deck = ["adela", "neris", "belka", "serin", "kyle"];
        this.persist();
        this.render();
        break;
      case "deck-s":
        this.save.data.deck = ["livia", "kairon", "theria", "noxia"];
        this.persist();
        this.render();
        break;
      case "deck-sr":
        this.save.data.deck = ["aurora", "arden"];
        this.persist();
        this.render();
        break;
      case "start-battle":
        void this.begin(id);
        break;
      case "summon":
        if(m && !m.paused && !m.choices.length) m.selectHero("sera");
        break;
      case "shop-grade": if(m&&id){m.shopGrade=id;m.revision++;}break;
      case "buy-hero": if(m&&id&&!m.choices.length)m.selectHero(id);break;
      case "confirm-slot-summon":
        if (m && m.summonRequestSlot >= 0) {
          const slot = m.summonRequestSlot;
          m.paused = false;
          this.closeModal();
          m.summonAt(slot);
        }
        break;
      case "cancel-slot-summon":
        if (m) {
          m.cancelSummonRequest();
          m.paused = false;
          this.closeModal();
        }
        break;
      case "deselect":
        if(m){m.selected=0;m.mergePreview=false;m.selectedHero="";m.selectedSlot=-1;m.revision++;}
        break;
      case "undo-placement":
        m?.undoPlacement();break;
      case "merge":
        if(m){if(m.mergePreview)m.merge(m.selected||undefined);else {const group=mergeGroup(m.units,m.selectedUnit);if(group.length){m.selected=group[0].uid;m.mergePreview=true;m.revision++;}}}
        break;
      case "merge-selected":
        if(m&&this.modalType==="tactical"){m.paused=false;this.closeModal();}
        if(m && (!m.paused || this.modalType === "tactical") && !m.ended && !m.choices.length && m.selectedUnit) {if(m.mergePreview)m.merge(m.selected);else {m.mergePreview=true;m.revision++;}}
        break;
      case "merge-material": if(m&&id)m.merge(m.selected,Number(id));break;
      case "sell":
        if (m) m.sell(m.selected);
        break;
      case "element-upgrade":
        if(m&&id)m.upgradeElement(id as import('./data/types').Element);
        break;
      case "expand": m?.say(`배치 한도는 ${m.capacity}명으로 고정됩니다. 2인 합성으로 자리를 확보하세요.`); break;
      case "skill": if(m?.selectedUnit){const u=m.selectedUnit;u.priority=priorities[(priorities.indexOf(u.priority??"auto")+1)%priorities.length];m.revision++;}break;
      case "dps": document.getElementById("dps-panel")?.classList.toggle("open"); break;
      case "toggle-panel": if(id){const panel=document.getElementById(id) as HTMLDetailsElement|null;if(panel)panel.open=!panel.open;}break;
      case "speed":
        if (m) {const index=BATTLE_SPEEDS.indexOf(m.speed as typeof BATTLE_SPEEDS[number]);this.setBattleSpeed(BATTLE_SPEEDS[(index+1+BATTLE_SPEEDS.length)%BATTLE_SPEEDS.length]);}
        break;
      case "pause":
        if (m) {
          m.paused = true;
          this.showPause();
        }
        break;
      case "resume":
        if (m) {
          m.paused = false;
          this.closeModal();
        }
        break;
      case "retreat":
        if (m) {
          m.paused = false;
          m.finish(false);
          this.closeModal();
        }
        break;
      case "battle-menu":
        if (m) {
          m.paused = true;
          this.showModal(tacticalModal(m), "tactical");
        }
        break;
      case "close-modal":
        if (m) m.paused = false;
        this.closeModal();
        break;
      case "choice":
        if (m) {
          m.choose(id!);
          this.modalKey = "";
          this.closeModal();
        }
        break;
      case "reroll":
        if (m && m.reroll()) this.modalKey = "";
        break;
      case "reserve":
        if (m) {
          m.selected = Number(id);
          m.revision++;
          m.say("빈 슬롯을 누르면 선택한 대기 요원을 배치합니다.");
          this.updateHud(true);
        }
        break;
      case "debug":
        if (localTestMode) m?.debug(id!);
        break;
      case 'dev-currency':{
        const value=(selector:string,current:number)=>{const n=Number(document.querySelector<HTMLInputElement>(selector)?.value);return Number.isFinite(n)?Math.max(0,Math.floor(n)):current;};
        this.save.data.credits=value('#dev-credits',this.save.data.credits);this.save.data.equipmentGold=value('#dev-equipment-gold',this.save.data.equipmentGold);this.save.data.equipmentMaterials=value('#dev-materials',this.save.data.equipmentMaterials);this.persist();this.render();break;
      }
      case 'dev-unlock':
        for(const stage of campaignStages)this.save.data.campaign!.records[stage.id]??={stars:3,time:0,kills:0};this.persist();this.render();break;
      case 'dev-max':
        for(const hero of heroes){const p=this.save.data.heroes[hero.id];p.owned=true;p.level=50;p.breakthrough=5;p.skillLevel=10;p.stars=5;}for(const key of ['water','fire','electric','dark','burst','sniper','melee','chain','meteor','shell','drone','support','curse'])this.save.data.campaign!.research[key]=10;this.persist();this.render();break;
      case 'dev-item':{
        if(this.save.data.equipmentInventory.length>=100){this.toast('장비 보관함이 가득 찼습니다.');break;}const grade=(['B','A','S','SR'].includes(id??'')?id:'B') as HeroGrade,pool=[...weaponCatalog,...armorCatalog,...necklaceCatalog],template=pool[Math.floor(Math.random()*pool.length)];this.save.data.equipmentInventory.push(makeEquipment(template.id,grade));this.persist();this.render();break;
      }
      case 'dev-recruit':{const grade=(['B','A','S','SR'].includes(id??'')?id:'B') as HeroGrade,results=recruit(this.save.data,1,Math.random,grade);this.persist();this.render();this.audio.play(grade==='SR'?'boss':grade==='S'?'level':'summon');this.showModal(recruitResult(results),'recruit-result');break;}
      case 'dev-reset':
        this.game?.destroy(true);this.game=undefined;this.model=undefined;this.save.data=localTestResetSave();this.audio.configure(this.save.data.settings);this.persist();this.screen='home';this.render();break;
      case "tutorial-skip":
        this.save.data.tutorial = true;
        this.persist();
        break;
      case "tutorial-next":
        this.tutorialStep++;
        break;
      case "tutorial-reset":
        this.save.data.tutorial = false;
        this.persist();
        this.toast("다음 전투에서 작전 안내를 시작합니다.");
        break;
      case "setting": {
        const k = id as 'sound'|'bgm'|'sfx'|'shake'|'lowEffects';
        if(['sound','bgm','sfx','shake','lowEffects'].includes(k))this.save.data.settings[k]=!this.save.data.settings[k];
        this.audio.configure(this.save.data.settings);
        this.persist();
        this.render();
        break;
      }
      case 'audio-preview':
        if(id==='bgm')this.audio.play('boss');else this.audio.play('summon');
        break;
      case "explain":
        this.toast(id ?? "");
        break;
      case "export": {
        const blob = new Blob([JSON.stringify(this.save.data, null, 2)], {
            type: "application/json",
          }),
          url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "rift-defense-save.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        break;
      }
      case "import":
        document.querySelector<HTMLInputElement>("#save-file")?.click();
        break;
    }
    if (this.screen === "battle") this.updateHud(true);
  }
  showModal(html: string, type: string) {
    const layer = document.querySelector<HTMLDivElement>("#modal-layer");
    if (layer) {
      const tutorial=document.getElementById('tutorial-hint');
      if(tutorial){tutorial.innerHTML='';tutorial.removeAttribute('data-step');}
      layer.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true">${html}</div>`;
      this.modalType = type;
      layer
        .querySelector<HTMLButtonElement>("button:not(:disabled)")
        ?.focus({ preventScroll: true });
    }
  }
  closeModal() {
    const layer = document.querySelector("#modal-layer");
    if (layer) layer.innerHTML = "";
    this.modalType = "";
  }
  showPause() {
    if (this.screen !== "battle" || this.model?.choices.length) return;
    this.showModal(
      `<div class="modal small-modal"><span class="eyebrow">TACTICAL PAUSE</span><h2>작전 일시정지</h2><p>잠시 숨을 고르고, 다음 선택을 준비하세요.</p>${button("전투 계속", "resume", "primary large", "play")}${button("작전 종료", "home", "ghost", "home")}</div>`,
      "pause",
    );
  }
  key(e: KeyboardEvent) {
    const modal = document.querySelector("#modal-layer .modal");
    if (e.key === "Tab" && modal) {
      const els = [
        ...modal.querySelectorAll<HTMLElement>(
          "button:not(:disabled), select, input",
        ),
      ];
      if (!els.length) return;
      const first = els[0],
        last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus({preventScroll:true});
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus({preventScroll:true});
      }
      return;
    }
    if (
      this.screen !== "battle" ||
      !this.model ||
      (e.target as HTMLElement).matches("input,select,textarea") ||
      e.repeat
    )
      return;
    const m = this.model;
    if (e.key === "Escape") {
      e.preventDefault();
      if(this.modalType==='battle-result')return;
      if (m.choices.length) return;
      this.action(m.paused ? "resume" : "pause");
      return;
    }
    if (this.modalType || m.paused) return;
    if (e.code === "Space") {
      e.preventDefault();
      this.action("summon");
    }
    if (e.key.toLowerCase() === "m") this.action("merge");
    if (["1","2","3","4"].includes(e.key)) {
      this.setBattleSpeed(BATTLE_SPEEDS[Number(e.key)-1]);
      this.updateHud(true);
    }
  }
  setBattleSpeed(speed:typeof BATTLE_SPEEDS[number]){
    if(!this.model)return;
    this.model.speed=speed;
    this.model.save.settings.battleSpeed=speed;
    this.save.data.settings.battleSpeed=speed;
    this.persist();
  }
  catchUpBackgroundTime(now=Date.now()){
    const m=this.model,startedAt=this.backgroundAt;this.backgroundAt=0;
    if(!m||!startedAt||!m.started||m.paused||m.ended)return;
    let remaining=Math.max(0,(now-startedAt)/1000);
    // Phaser sleeps its renderer in a hidden browser tab. Advance the deterministic
    // simulation on return so combat and timers still reflect the elapsed time.
    while(remaining>0&&!m.ended&&!m.paused){const step=Math.min(.25,remaining);m.update(step);remaining-=step;}
    this.updateHud(true);
  }
  updateHud(force = false) {
    const m = this.model;
    if (!m || this.screen !== "battle") return;
    if (m.ended && m.result) {
      if(this.resultHandled)return;
      this.resultHandled=true;
      const tutorial=document.getElementById('tutorial-hint');
      if(tutorial){tutorial.innerHTML='';tutorial.removeAttribute('data-step');}
      const s = this.save.data;
      if(m.campaign){const c=s.campaign!,id=m.campaign.id,previous=c.records[id];
        if(m.result.won){if(!previous)m.result.credits+=m.campaign.reward;c.records[id]={stars:Math.max(previous?.stars??0,m.result.stars??1),time:Math.min(previous?.time??Infinity,m.result.time),kills:Math.max(previous?.kills??0,m.result.kills)};for(const u of m.units)c.fragments[u.heroId]=Math.min(999,(c.fragments[u.heroId]??0)+1);if(id==='1-3'&&!s.tutorial){s.tutorial=true;this.toast('기초 작전 훈련 완료 · 자유롭게 편성과 장비를 조정할 수 있습니다.');}
          const stageIndex=Math.max(0,campaignStages.findIndex(stage=>stage.id===id)),regionIndex=Math.max(0,Number(id.split('-')[0])-1),boss=(campaignStages[stageIndex]?.waves??0)>=6;
          const materialReward=Math.max(1,Math.floor((regionIndex+1)/2))*(boss?2:1);s.equipmentMaterials+=materialReward;m.result.materials=materialReward;
          if(Math.random()<campaignEquipmentDropChance(boss)){const roll=Math.random(),rarity=campaignEquipmentRarity(regionIndex,boss,roll,s.equipmentPity),pool=[...weaponCatalog,...armorCatalog,...necklaceCatalog],template=pool[Math.floor(Math.random()*pool.length)],drop=makeEquipment(template.id,rarity);s.equipmentPity=rarity==='SR'?0:s.equipmentPity+1;if(s.equipmentPity>=20&&regionIndex>=6){Object.assign(drop,makeEquipment(template.id,'SR',drop.order,drop.id));s.equipmentPity=0;}
            if(drop.rarity==='B'&&s.autoSalvageB){s.equipmentMaterials+=3;m.result.equipmentDrop=`${drop.name} · B 자동 분해 → 재료 3`;}else if(s.equipmentInventory.length<100){s.equipmentInventory.push(drop);m.result.equipmentDrop=`${drop.name} · ${drop.rarity}`;}else{s.equipmentMaterials+=({B:3,A:7,S:15,SR:35}[drop.rarity]);m.result.equipmentDrop='인벤토리 가득 참 · 장비를 강화 재료로 전환';}}
        }
      }
      s.credits += m.result.credits;
      s.equipmentGold+=m.result.equipmentGold;
      s.shards += m.result.won ? 10 : 0;
      s.runs++;
      s.bestWave = Math.max(s.bestWave, m.result.wave);
      s.cleared = Math.max(s.cleared, Number(m.result.won));
      this.persist();
      this.showModal(m.campaign?campaignResult(m.result):resultScreen(m.result),'battle-result');
      if(m.campaign&&m.result.won&&s.campaign?.autoAdvance){
        const next=campaignStages[campaignStages.findIndex(stage=>stage.id===m.campaign!.id)+1];
        if(next){const completedLayout=Object.fromEntries(m.units.map(u=>[u.heroId,u.slot]).filter(([,slot])=>(slot as number)>=0));s.campaign.lastDeployment=completedLayout;s.campaign.selected=next.id;this.persist();setTimeout(async()=>{if(this.screen!=="battle"||this.modalType!=="battle-result"||!this.save.data.campaign?.autoAdvance)return;await this.begin(next.id,true);const nextBattle=this.model;if(nextBattle?.campaign){const restored=nextBattle.deployCampaignLayout(this.save.data.campaign.lastDeployment);if((restored||nextBattle.autoDeployCampaign())){nextBattle.start();this.syncMusic();this.updateHud(true);this.toast(`${next.id} 이전 배치로 자동 출격`);}}},1800);}
      }
      return;
    }
    const now = performance.now();
    if (!force && now - this.lastHud < 120) return;
    this.lastHud = now;
    const text = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el && el.textContent !== value) el.textContent = value;
    };
    text("wave-number", m.campaign?(m.started?`${m.wave.number} / ${m.campaign.waves}`:'배치 준비'):String(Math.max(1, m.wave.number)).padStart(2, "0"));
    text("core-hp", String(Math.ceil(m.core)));
    text("battle-gold", num(m.gold));
    text("enemy-count", `HOSTILES ${String(m.alive).padStart(2, "0")} / ${m.enemyCap}`);
    text("field-time", time(m.time));
    text("wave-preview",waveBrief(m.wave.number+1));
    text("unit-count", `${m.units.filter((u) => u.slot >= 0).length} / 16`);
    const bar = document.getElementById("core-bar");
    if (bar) bar.style.width = `${m.core}%`;
    text("battle-notice", m.noticeTime ? m.notice : "");
    const setBtn = (id: string, label: string, disabled = false) => {
      const el = document.getElementById(id) as HTMLButtonElement | null;
      if (!el) return;
      const span = el.querySelector("span");
      if (span) span.textContent = label;
      el.disabled = disabled;
    };
    setBtn("speed-btn", `x${m.speed.toFixed(m.speed===.75?2:1)}`);
    setBtn('campaign-auto-advance-btn',m.save.campaign?.autoAdvance?'AUTO 다음 ON':'AUTO 다음 OFF');
    setBtn("undo-placement-btn", "배치 되돌리기", !m.lastPlacement || m.time-m.lastPlacement.at>10);
    const shop=document.getElementById("hero-shop");
    if(shop){const html=shopPanel(m);if(shop.dataset.key!==html){updatePanel(shop,html);shop.dataset.key=html;}}
    const elementUpgrades=document.getElementById('element-upgrades');
    if(elementUpgrades){const html=elementUpgradePanel(m);if(elementUpgrades.dataset.key!==html){const wasOpen=elementUpgrades.querySelector('details')?.open??false;updatePanel(elementUpgrades,html);elementUpgrades.dataset.key=html;const details=elementUpgrades.querySelector('details');if(details)details.open=wasOpen;}}
    const dps=document.getElementById("dps-panel");if(dps)updatePanel(dps,dpsPanel(m));
    const growth=document.getElementById("selected-growth");
    if(growth){if(m.campaign&&!m.started&&m.selectedUnit)this.hero=m.selectedUnit.heroId;const html=m.campaign?(m.started?campaignUnit(m):campaignPrepEquipment(m,this.prepEquipmentFilter)):growthPanel(m);const cached=growth as HTMLElement & {renderedGrowth?:string};if(cached.renderedGrowth!==html){updatePanel(growth,html);cached.renderedGrowth=html;}}
    if(m.campaign){
      const skillHost=document.getElementById('campaign-skill-host');if(skillHost){const html=campaignSkillBar(m);if(skillHost.dataset.key!==html){updatePanel(skillHost,html);skillHost.dataset.key=html;}}
      const placed=m.units.filter(u=>u.slot>=0).length,waiting=m.units.length-placed;
      setBtn('campaign-start-btn',m.started?'방어 중':waiting?`배치 ${placed}/${m.units.length}`:formationComplete(m.units.map(u=>u.heroId))?'방어 시작':'요원 선택 필요',m.started||waiting>0||!formationComplete(m.units.map(u=>u.heroId)));
      document.getElementById('campaign-start-btn')?.classList.toggle('battle-running',m.started);
      const prep=document.getElementById('campaign-prep');if(prep)prep.hidden=m.started;
      const prepExit=document.getElementById('campaign-prep-exit');if(prepExit)prepExit.hidden=m.started;
      const growthHost=this.root.querySelector<HTMLElement>('.campaign-battle .growth-host');if(growthHost)growthHost.hidden=false;
      const extra=this.root.querySelector<HTMLElement>('.campaign-battle .campaign-extra');if(extra)extra.hidden=!m.started;
      const count=document.getElementById('prep-count');if(count)count.textContent=`${placed} / ${m.units.length}`;
      const reserve=document.getElementById('campaign-reserve');if(reserve)updatePanel(reserve,m.units.filter(u=>u.slot<0).map(u=>`<button class="prep-unit ${u.uid===m.selected?'selected':''}" data-action="reserve" data-id="${u.uid}">${combatPortrait(u.heroId)}<span><b>${heroById[u.heroId].name}</b><small>선택 후 빈칸 배치</small></span></button>`).join(''));
      const log=document.getElementById('campaign-growth-log');if(log)updatePanel(log,`<small>이번 전투 강화: ${m.chosenTraits.map(c=>c.name).join(' · ')||'없음'}<br>유물: ${m.relics.map(r=>r.name).join(' · ')||'없음'}</small>`);
    }
    const reactions=document.getElementById("synergy-panel");
    if(reactions){const html=synergyPanel(m);if(reactions.dataset.rendered!==html){updatePanel(reactions,html);reactions.dataset.rendered=html;}}
    const panel = document.getElementById("unit-panel");
    if (panel && (force || now % 500 < 150 || m.revision !== this.lastRevision))
      updatePanel(panel,unitPanel(m));
    if (force || m.revision !== this.lastRevision) {
      const synergyEl = document.getElementById("synergy-panel");
      if (synergyEl) updatePanel(synergyEl,synergyPanel(m));
      const buildEl = document.getElementById("build-panel");
      if (buildEl) updatePanel(buildEl,buildPanel(m));
      const reserveEl = document.getElementById("reserve-units");
      if (reserveEl) reserveEl.innerHTML =
        m.units
          .filter((u) => u.slot < 0)
          .map(
            (u) =>
              `<button class="reserve-unit ${u.uid === m.selected ? "selected" : ""}" data-action="reserve" data-id="${u.uid}" title="${heroById[u.heroId].name} ${u.star}성">${combatPortrait(u.heroId)}<span>${heroById[u.heroId].name} ${"★".repeat(u.star)}</span></button>`,
          )
          .join("") || '<span class="muted">소환한 요원이 여기에 대기합니다 · 0 / 6</span>';
      this.lastRevision = m.revision;
    }
    if (m.choices.length) {
      const key = m.choices.map((c) => c.id).join(",") + m.choiceRerolls;
      if (this.modalKey !== key) {
        this.modalKey = key;
        this.showModal(rewardModal(m), "reward");
      }
    }
    // A visibility/orientation pause can occur while the reward dialog is open.
    // Once it closes, surface the pause rather than leaving a frozen battlefield.
    if (!m.choices.length && m.paused && !this.modalType) this.showPause();
    if (
      m.wave.number !== this.lastWave &&
      m.wave.data?.boss &&
      this.save.data.settings.shake
    )
      this.game?.scene.getScene("Battle").cameras.main.shake(180, 0.003);
    this.lastWave = m.wave.number;
    this.updateTutorial();
  }
  updateTutorial() {
    const el = document.getElementById("tutorial-hint"),
      m = this.model;
    if (!el || !m) return;
    if (this.save.data.tutorial) {
      el.innerHTML = "";
      return;
    }
    if(m.campaign){
      const stage=m.campaign.id;
      if(!['1-1','1-2','1-3'].includes(stage)){el.innerHTML='';return;}
      let title='',body='',step='';
      if(stage==='1-1'&&!m.started){title='배치와 드래그';body='주인공 5명이 기본 배치되어 있습니다. 요원 카드를 전장 칸으로 끌어 놓거나, 전장의 요원을 다른 칸으로 드래그해 위치를 바꾸세요. 유리아는 가운데 FRONT, 노엘과 아린은 뒤쪽 위·아래 칸이 안전합니다.';step='1-1-place';}
      else if(stage==='1-1'&&this.tutorialStep<2){
        const ready=m.units.some(u=>u.hp>0&&(u.skillCharge??0)>=100&&m.time>=(u.skillReadyAt??0));
        title=ready?'수동 스킬 사용':'첫 교전';body=ready?'아래 요원 스킬에서 빛나는 얼굴 일러스트를 누르세요. 충전된 요원의 스킬이 즉시 발동합니다.':'오른쪽에서 오는 적을 유리아가 먼저 막고, 후방의 레이나·세라·노엘·아린이 공격합니다. 스킬 게이지가 100%가 될 때까지 전투 흐름을 확인하세요.';step=ready?'1-1-skill':'1-1-fight';
      }else if(stage==='1-1'){title='AUTO 스킬';body='스킬 사용 후 쿨타임이 끝나면 게이지 충전이 시작됩니다. 100%가 되면 AUTO가 자동 사용하며, 직접 타이밍을 정하려면 OFF로 두세요.';step='1-1-auto';}
      else if(stage==='1-2'&&!m.started){title='전열과 후열';body='가운데 FRONT에는 유리아를 두고, 저격수 노엘·아린은 뒤쪽 위·아래에 배치하세요. 레이나와 세라는 남은 후방 칸에 두면 한 명에게 공격이 몰려도 화력을 유지할 수 있습니다.';step='1-2-place';}
      else if(stage==='1-2'){title='위험한 적 우선 대응';body='유리아의 체력이 빠르게 줄면 준비된 방어 스킬을 먼저 사용하세요. 이어서 노엘이나 아린의 스킬로 강한 적을 빠르게 제거하면 전열이 오래 버팁니다.';step='1-2-fight';}
      else if(!m.started){title='배치 확인과 출격';body='1-3에서는 이전 배치를 그대로 쓰거나 직접 드래그해 조정할 수 있습니다. 다섯 명이 모두 칸에 있는지 확인한 뒤 방어 시작을 누르세요.';step='1-3-place';}
      else{title='집중 공격과 자동 전투';body='마지막 웨이브의 네임드 적을 우선 공격합니다. 강한 적이 나타날 때 수동 스킬을 연속 사용하거나 AUTO 스킬을 켜세요. 1-3을 클리어하면 기초 훈련이 끝납니다.';step='1-3-fight';}
      if(el.dataset.step!==step){el.dataset.step=step;el.innerHTML=`<div><b>초보 작전 ${stage} · ${title}</b><p>${body}</p></div>${button('안내 종료','tutorial-skip','compact')}`;}
      return;
    }
    if (this.tutorialStep === 0 && m.summons > 0) this.tutorialStep = 1;
    if (this.tutorialStep === 2 && m.kills > 0) this.tutorialStep = 3;
    if (this.tutorialStep === 3 && m.merged > 0) this.tutorialStep = 4;
    if (this.tutorialStep === 4 && m.units.length>=4) {
      this.save.data.tutorial = true;
      this.persist();
      el.innerHTML = "";
      this.toast("작전 훈련 완료. 이제 당신만의 빌드를 완성하세요.");
      return;
    }
    const tips = [
      [
        "등급 소환",
        "B/A/S/SR 등급을 선택한 뒤 원하는 빈 지형을 누르세요.",
      ],
      [
        "슬롯 배치",
        "요원 선택 후 빈 지형을 누르거나 드래그해 이동하세요. 배치 후 10초 동안 되돌릴 수 있습니다.",
      ],
      [
        "적 처치",
        "웨이브는 자동으로 계속 진행됩니다. 소환과 배치를 전투 중에 빠르게 이어가세요.",
      ],
      ["2인 합성", "같은 요원 ★ 2명을 모아 「합성 가능!」을 누르세요."],
      ["배치 확장", "골드를 모아 배치 한도를 확장하세요. 합성과 스킬에 사용할 조합도 고려하세요."],
    ];
    const [title, body] = tips[Math.min(4, this.tutorialStep)];
    const key = `${this.tutorialStep}`;
    if (el.dataset.step !== key) {
      el.dataset.step = key;
      el.innerHTML = `<div><b>훈련 ${this.tutorialStep + 1}/5 · ${title}</b><p>${body}</p></div>${this.tutorialStep === 1 ? button("다음", "tutorial-next", "compact") : ""}${button("건너뛰기", "tutorial-skip", "compact")}`;
    }
  }
}
new App();



