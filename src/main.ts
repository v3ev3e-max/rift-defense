import "./style.css";
import { SaveSystem } from "./systems/SaveSystem";
import { GameAudio } from "./utils/Audio";
import { BattleModel } from "./systems/BattleModel";
import { mergeGroup } from "./systems/MergeSystem";
import { heroes, heroById } from "./data/heroes";
import { button, icon, num, portrait, time, esc } from "./ui/components";
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
  unitPanel,
  synergyPanel,
  buildPanel,
  rewardModal,
  focusModal,
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
    window
      .matchMedia("(orientation: portrait) and (max-width: 900px)")
      .addEventListener("change", (event) => {
        if (
          event.matches &&
          this.screen === "battle" &&
          this.model &&
          !this.model.ended
        ) {
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
            ? deckScreen(s)
            : this.screen === "stage"
              ? stageScreen(s)
              : this.screen === "result" && this.model?.result
                ? resultScreen(this.model.result)
                : this.screen === "settings"
                  ? settingsScreen(s, this.save.available)
                  : this.model
                    ? battleScreen(this.model)
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
                `<button data-action="${id}" class="nav-item ${this.screen === id ? "active" : ""}" ${id === "shop" ? "disabled" : ""}>${icon(id === "stage" ? "battle" : id)}<span>${en}<small>${ko}</small></span>${this.screen === id ? "<i></i>" : ""}</button>`,
            )
            .join(
              "",
            )}<span class="nav-server"><i class="live-dot"></i> ${this.save.available ? "LOCAL / CONNECTED" : "LOCAL / UNSAVED"}</span></nav>`
        : ""
    }<div id="modal-layer"></div></div>`;
  }
  async begin() {
    if (this.game) {
      this.game.destroy(true);
      this.game = undefined;
    }
    this.model = new BattleModel(structuredClone(this.save.data));
    this.model.onSound = (sound) => this.audio.play(sound);
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
        this.save.data.deck = heroes.map((h) => h.id);
        this.persist();
        this.render();
        break;
      case "deck-recommended":
        this.save.data.deck = ["yuria", "sera", "luna", "eve", "lize"];
        this.persist();
        this.render();
        break;
      case "start-battle":
        void this.begin();
        break;
      case "summon":
        if (m && !m.paused && !m.choices.length) {
          const training = !this.save.data.tutorial && m.summons < 3;
          const preferred = m.save.deck.includes("sera")
            ? "sera"
            : m.save.deck[0];
          if (training) {
            const draw = m.rng;
            m.rng = () => 0;
            const deck = m.save.deck;
            m.save.deck = [preferred];
            m.summon();
            m.save.deck = deck;
            m.rng = draw;
          } else m.summon();
        }
        break;
      case "wave-start":
        m?.start();
        break;
      case "merge":
        m?.merge();
        break;
      case "merge-selected":
        m?.merge(m.selected);
        break;
      case "sell":
        if (m) m.sell(m.selected);
        break;
      case "research":
        if (m)
          m.upgrade(
            (document.querySelector("#research-select") as HTMLSelectElement)
              .value,
          );
        break;
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
      case "focus":
        if (m) {
          m.paused = true;
          this.showModal(focusModal(m), "focus");
        }
        break;
      case "focus-pick":
        if (m && m.summon(id)) {
          m.paused = false;
          this.closeModal();
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
    text("wave-number", String(Math.max(1, m.wave.number)).padStart(2, "0"));
    text("core-hp", String(Math.ceil(m.core)));
    text("battle-gold", num(m.gold));
    text("enemy-count", `HOSTILES ${String(m.alive).padStart(2, "0")} / 120`);
    text("field-time", time(m.time));
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
    setBtn(
      "summon-btn",
      `랜덤 소환 · ${m.summonCost}`,
      m.gold < m.summonCost || m.units.length >= 22,
    );
    setBtn(
      "focus-btn",
      `확정 소환 · ${m.focusCost}`,
      m.gold < m.focusCost || m.units.length >= 22,
    );
    setBtn(
      "merge-btn",
      mergeGroup(m.units).length ? "합성 가능!" : "3중 합성",
      !mergeGroup(m.units).length,
    );
    const waveBtn = document.getElementById("wave-start-btn");
    if (waveBtn) waveBtn.hidden = m.started;
    const select =
      document.querySelector<HTMLSelectElement>("#research-select");
    if (select) {
      const id = select.value,
        lv = m.research[id] ?? 0;
      setBtn(
        "research-btn",
        `연구 Lv.${lv} · ${lv >= 15 ? "MAX" : num(m.researchCost(id)) + " G"}`,
        lv >= 15 || m.gold < m.researchCost(id),
      );
    }
    const panel = document.getElementById("unit-panel");
    if (panel && (force || now % 500 < 150 || m.revision !== this.lastRevision))
      panel.innerHTML = unitPanel(m);
    if (force || m.revision !== this.lastRevision) {
      document.getElementById("synergy-panel")!.innerHTML = synergyPanel(m);
      document.getElementById("build-panel")!.innerHTML = buildPanel(m);
      document.getElementById("reserve-units")!.innerHTML =
        m.units
          .filter((u) => u.slot < 0)
          .map(
            (u) =>
              `<button class="reserve-unit ${u.uid === m.selected ? "selected" : ""}" data-action="reserve" data-id="${u.uid}" title="${heroById[u.heroId].name} ${u.star}성">${portrait(u.heroId)}<span>${"★".repeat(u.star)}</span></button>`,
          )
          .join("") || '<span class="muted">대기석 0 / 6</span>';
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
    if (this.tutorialStep === 4 && Object.values(m.research).some((n) => n > 0))
      this.tutorialStep = 5;
    if (this.tutorialStep === 5 && m.chosenTraits.length > 0) {
      this.save.data.tutorial = true;
      this.persist();
      el.innerHTML = "";
      this.toast("작전 훈련 완료. 이제 당신만의 빌드를 완성하세요.");
      return;
    }
    const tips = [
      [
        "랜덤 소환",
        "하단 랜덤 소환을 누르세요. 훈련 중 첫 3회는 같은 요원이 확정 등장합니다.",
      ],
      [
        "슬롯 배치",
        "요원을 드래그하거나, 요원 선택 후 빈 슬롯을 눌러 이동하세요.",
      ],
      [
        "적 처치",
        "요원을 더 소환한 뒤 「웨이브 시작」을 누르세요. 사거리 안 적을 자동 공격합니다.",
      ],
      ["3중 합성", "같은 요원 ★ 3명을 모아 「합성 가능!」을 누르세요."],
      ["전투 연구", "오른쪽에서 직업을 고른 뒤 연구 버튼을 눌러 강화하세요."],
      [
        "특성 선택",
        "3웨이브를 돌파하면 전투가 멈춥니다. 특성 하나를 선택하세요.",
      ],
    ];
    const [title, body] = tips[Math.min(5, this.tutorialStep)];
    const key = `${this.tutorialStep}`;
    if (el.dataset.step !== key) {
      el.dataset.step = key;
      el.innerHTML = `<div><b>훈련 ${this.tutorialStep + 1}/6 · ${title}</b><p>${body}</p></div>${this.tutorialStep === 1 ? button("다음", "tutorial-next", "compact") : ""}${button("건너뛰기", "tutorial-skip", "compact")}`;
    }
  }
}
new App();
