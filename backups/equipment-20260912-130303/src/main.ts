import { updatePanel } from './ui/stablePanel';
import {campaignSelect,campaignFormation,campaignBattle,campaignUnit,campaignResult,squadSummary,formationFilter,filterRoster,formationHelp,campaignResearch} from './ui/CampaignUI';
import {campaignStages,stageUnlocked,doctrines} from './data/campaign';
import {priorities} from './data/strategy';
import {waveBrief} from './data/waves';
import "./style.css";
import { SaveSystem } from "./systems/SaveSystem";
import { GameAudio } from "./utils/Audio";
import { BattleModel } from "./systems/BattleModel";
import { mergeGroup } from "./systems/MergeSystem";
import { heroes, heroById } from "./data/heroes";
import {formationRole,formationSlots,orderFormation,formationComplete} from './data/combatRoles';
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

type Screen =
  "home" | "hero" | "deck" | "stage" | "battle" | "result" | "settings";
class App {
  root = document.querySelector<HTMLDivElement>("#app")!;
  save = new SaveSystem();
  audio = new GameAudio();
  screen: Screen = "home";
  hero = "sera";
  model?: BattleModel;
  game?: Phaser.Game;
  lastHud = 0;
  lastRevision = -1;
  modalKey = "";
  modalType = "";
  tutorialStep = 0;
  lastWave = 0;
  renderToken = 0;
  constructor() {
    this.audio.enabled = this.save.data.settings.sound;
    this.root.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-action]",
      );
      if (target && !target.hasAttribute("disabled"))
        this.action(target.dataset.action!, target.dataset.id);
    });
    this.root.addEventListener("change", (e) => {
      const el = e.target as HTMLInputElement;
      if(el.id==='campaign-grade'||el.id==='campaign-role'){formationFilter[el.id==='campaign-grade'?'grade':'role']=el.value;filterRoster();}
      if (el.id === "research-select") this.updateHud(true);
      if (el.id === "save-file" && el.files?.[0]) {
        void el.files[0].text().then((raw) => {
          try {
            this.save.import(raw);
            this.render();
            this.toast("저장 파일을 가져왔습니다.");
          } catch (err) {
            this.toast(String(err));
          }
        });
      }
    });
    document.addEventListener("keydown", (e) => this.key(e));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.model && !this.model.ended) {
        this.model.paused = true;
        this.showPause();
      }
    });
    window.addEventListener("pagehide", () => this.save.persist());
    this.render();
    if (import.meta.env.PROD && "serviceWorker" in navigator)
      window.addEventListener("load", () => {
        void navigator.serviceWorker.register("/sw.js").catch(() => {});
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
    const s = this.save.data;
    this.renderToken++;
    const content =
      this.screen === "home"
        ? home(s)
        : this.screen === "hero"
          ? heroScreen(s, this.hero)
          : this.screen === "deck"
            ? campaignFormation(s)
            : this.screen === "stage"
              ? campaignSelect(s)
              : this.screen === "result" && this.model?.result
                ? (this.model.campaign?campaignResult(this.model.result):resultScreen(this.model.result))
                : this.screen === "settings"
                  ? settingsScreen(s, this.save.available)
                  : this.model
                    ? (this.model.campaign?campaignBattle(this.model):battleScreen(this.model))
                    : home(s);
    this.root.innerHTML = `<div class="app-shell ${this.screen === "battle" ? "in-battle" : ""}"><header class="topbar"><button class="brand" data-action="home" aria-label="RIFT DEFENSE 홈"><span class="brand-mark">${icon("bolt")}</span><span>RIFT<span class="brand-thin"> DEFENSE</span><small>TACTICAL RANDOM DEFENSE</small></span></button><div class="commander"><span class="avatar">C</span><span><b>지휘관</b><small>RIFT RESPONSE DIVISION</small></span></div><div class="top-currencies"><span title="영구 성장에 사용하는 크레딧">${icon("coin")}<b>${num(s.credits)}</b><small>C</small></span><span title="클리어 기록 재화 · 알파 버전에서는 사용하지 않습니다">${icon("gem")}<b>${num(s.shards)}</b></span></div>${button("설정", "settings", "icon-only", "settings", 'aria-label="설정" title="설정"')}</header><main id="screen">${content}</main>${
      this.screen !== "battle"
        ? `<nav class="bottom-nav" aria-label="주 메뉴">${[
            ["home", "HOME", "작전 본부"],
            ["hero", "HERO", "요원"],
            ["deck", "DECK", "덱 편성"],
            ["stage", "BATTLE", "출격"],
            ["shop", "SHOP", "준비 중"],
          ]
            .map(
              ([id, en, ko]) =>
                `<button data-action="${id==='deck'?'campaign-deploy':id}" class="nav-item ${this.screen === id ? "active" : ""}" ${id === "shop" ? "disabled" : ""}>${icon(id === "stage" ? "battle" : id)}<span>${en}<small>${id==='deck'?'실전 배치':ko}</small></span>${this.screen === id ? "<i></i>" : ""}</button>`,
            )
            .join(
              "",
            )}<span class="nav-server"><i class="live-dot"></i> ${this.save.available ? "LOCAL / CONNECTED" : "LOCAL / UNSAVED"}</span></nav>`
        : ""
    }<div id="modal-layer"></div></div>`;
    if(this.screen==='deck')filterRoster();
  }
  async begin(mapId = this.save.data.campaign!.selected) {
    const stage=campaignStages.find(s=>s.id===mapId);
    if(stage&&!stageUnlocked(stage.id,this.save.data.campaign!.records)){this.toast('이전 스테이지를 먼저 완료하세요.');return;}
    if (this.game) {
      this.game.destroy(true);
      this.game = undefined;
    }
    this.model = new BattleModel(structuredClone(this.save.data), Math.random, battleMaps.find(v=>v.id===mapId)??battleMaps[0]);
    this.model.onSound = (sound) => this.audio.play(sound);
    if(stage)this.model.configureCampaign(stage,this.save.data.campaign!.squad,true);
    else this.model.start();
    this.screen = "battle";
    this.tutorialStep = 0;
    this.lastWave = 0;
    this.lastRevision = -1;
    this.modalKey = "";
    this.modalType = "";
    this.render();
    const token = this.renderToken;
    const model = this.model;
    try {
      const { createGame } = await import("./game/GameConfig");
      if (token !== this.renderToken) return;
      this.game = createGame(model, () => this.updateHud());
      this.updateHud(true);
    } catch (err) {
      this.toast(`전장 로딩 실패: ${String(err)}`);
      this.navigate("stage");
    }
  }
  action(action: string, id?: string) {
    this.audio.unlock();
    const m = this.model;
    if (["home", "hero", "deck", "stage", "settings"].includes(action) && !id) {
      if (this.screen === "battle" && m && !m.ended) {
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
      case 'campaign-select':
        if(id&&campaignStages.some(s=>s.id===id)){this.save.data.campaign!.selected=id;this.persist();this.render();}break;
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
        else {const role=formationRole(id),limit=formationSlots.filter(v=>v===role).length,current=c.squad.filter(v=>formationRole(v)===role).length;if(current>=limit){this.toast(`${role==='tank'?'탱커':role==='sniper'?'저격수':'딜러'} 자리를 먼저 비워주세요.`);break;}c.squad=orderFormation([...c.squad,id]);}
        this.persist();
        const summary=this.root.querySelector<HTMLElement>('#squad-summary'),restoreFocus=!!summary?.contains(document.activeElement);
        if(summary)summary.innerHTML=squadSummary(this.save.data);
        if(restoreFocus)summary?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
        this.root.querySelectorAll<HTMLElement>('.campaign-roster [data-action="campaign-toggle"]').forEach(el=>{const selected=c.squad.includes(el.dataset.id!);el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});
        break;
      }
      case 'campaign-prep-toggle':{
        if(!m?.campaign||m.started||!id||!heroById[id])break;
        const c=this.save.data.campaign!;
        if(!this.save.data.heroes[id].owned){this.toast('아직 보유하지 않은 요원입니다.');break;}
        if(c.squad.includes(id))c.squad=c.squad.filter(v=>v!==id);
        else {const role=formationRole(id),limit=formationSlots.filter(v=>v===role).length,current=c.squad.filter(v=>formationRole(v)===role).length;if(current>=limit){this.toast(`${role==='tank'?'탱커':role==='sniper'?'저격수':'딜러'} 자리를 먼저 비워주세요.`);break;}c.squad=orderFormation([...c.squad,id]);}
        m.save.campaign!.squad=[...c.squad];m.syncCampaignSquad(c.squad);this.persist();
        this.root.querySelectorAll<HTMLElement>('.prep-roster [data-action="campaign-prep-toggle"]').forEach(el=>{const active=c.squad.includes(el.dataset.id!);el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
        const summary=this.root.querySelector('.campaign-prep details summary');if(summary)summary.textContent=`출전 요원 변경 · ${c.squad.length}/5`;
        this.updateHud(true);break;
      }
      case 'campaign-auto-deploy':if(m?.autoDeployCampaign()){this.audio.play('summon');this.updateHud(true);}break;
      case 'campaign-deploy':void this.begin(this.save.data.campaign!.selected);break;
      case 'campaign-start':if(m?.campaign){if(!formationComplete(m.units.map(u=>u.heroId)))this.toast('탱커 1 · 딜러 3 · 저격수 1을 편성해주세요.');else m.start();}break;
      case 'campaign-research':{
        const c=this.save.data.campaign!;if(!id||!['water','fire','electric','dark','burst','sniper','melee','chain','meteor','drone','support'].includes(id))break;
        const lv=c.research[id]??0,cost=100*(lv+1);if(lv<10&&this.save.data.credits>=cost){this.save.data.credits-=cost;c.research[id]=lv+1;this.persist();this.action('campaign-lab');}break;
      }
      case "hero":
        this.hero = id!;
        this.render();
        break;
      case "hero-upgrade":
        if (this.save.upgrade(id!)) {
          this.audio.play("level");
          this.render();
        }
        break;
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
        if (m) m.speed = m.speed === 1 ? 2 : 1;
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
        if (import.meta.env.DEV) m?.debug(id!);
        break;
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
        const k = id as keyof typeof this.save.data.settings;
        this.save.data.settings[k] = !this.save.data.settings[k];
        this.audio.enabled = this.save.data.settings.sound;
        this.persist();
        this.render();
        break;
      }
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
      layer.innerHTML = `<div class="modal-backdrop">${html}</div>`;
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
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
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
    if (e.key === "1" || e.key === "2") {
      m.speed = Number(e.key);
      this.updateHud(true);
    }
  }
  updateHud(force = false) {
    const m = this.model;
    if (!m || this.screen !== "battle") return;
    if (m.ended && m.result) {
      const s = this.save.data;
      if(m.campaign){const c=s.campaign!,id=m.campaign.id,previous=c.records[id];
        if(m.result.won){if(!previous)m.result.credits+=m.campaign.reward;c.records[id]={stars:Math.max(previous?.stars??0,m.result.stars??1),time:Math.min(previous?.time??Infinity,m.result.time),kills:Math.max(previous?.kills??0,m.result.kills)};for(const u of m.units)c.fragments[u.heroId]=Math.min(999,(c.fragments[u.heroId]??0)+1);}
      }
      s.credits += m.result.credits;
      s.shards += m.result.won ? 10 : 0;
      s.runs++;
      s.bestWave = Math.max(s.bestWave, m.result.wave);
      s.cleared = Math.max(s.cleared, Number(m.result.won));
      this.persist();
      this.navigate("result");
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
    setBtn("speed-btn", `x${m.speed}`);
    setBtn("undo-placement-btn", "배치 되돌리기", !m.lastPlacement || m.time-m.lastPlacement.at>10);
    const shop=document.getElementById("hero-shop");
    if(shop){const html=shopPanel(m);if(shop.dataset.key!==html){updatePanel(shop,html);shop.dataset.key=html;}}
    const elementUpgrades=document.getElementById('element-upgrades');
    if(elementUpgrades){const html=elementUpgradePanel(m);if(elementUpgrades.dataset.key!==html){const wasOpen=elementUpgrades.querySelector('details')?.open??false;updatePanel(elementUpgrades,html);elementUpgrades.dataset.key=html;const details=elementUpgrades.querySelector('details');if(details)details.open=wasOpen;}}
    const dps=document.getElementById("dps-panel");if(dps)updatePanel(dps,dpsPanel(m));
    const growth=document.getElementById("selected-growth");
    if(growth){const html=m.campaign?campaignUnit(m):growthPanel(m);const cached=growth as HTMLElement & {renderedGrowth?:string};if(cached.renderedGrowth!==html){updatePanel(growth,html);cached.renderedGrowth=html;}}
    if(m.campaign){
      const placed=m.units.filter(u=>u.slot>=0).length,waiting=m.units.length-placed;
      setBtn('campaign-start-btn',m.started?'방어 중':waiting?`배치 ${placed}/${m.units.length}`:formationComplete(m.units.map(u=>u.heroId))?'방어 시작':'포지션 편성 필요',m.started||waiting>0||!formationComplete(m.units.map(u=>u.heroId)));
      const prep=document.getElementById('campaign-prep');if(prep)prep.hidden=m.started;
      const growthHost=this.root.querySelector<HTMLElement>('.campaign-battle .growth-host');if(growthHost)growthHost.hidden=!m.started;
      const extra=this.root.querySelector<HTMLElement>('.campaign-battle .campaign-extra');if(extra)extra.hidden=!m.started;
      const count=document.getElementById('prep-count');if(count)count.textContent=`${placed} / ${m.units.length}`;
      const reserve=document.getElementById('campaign-reserve');if(reserve)updatePanel(reserve,m.units.filter(u=>u.slot<0).map(u=>`<button class="prep-unit ${u.uid===m.selected?'selected':''}" data-action="reserve" data-id="${u.uid}" ${u.returnAt?'disabled':''}>${combatPortrait(u.heroId)}<span><b>${heroById[u.heroId].name}</b><small>${u.returnAt?`복귀 ${Math.ceil(u.returnAt-m.time)}초`:'선택 후 빈칸 배치'}</small></span></button>`).join(''));
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

