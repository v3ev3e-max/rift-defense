import type { BattleModel } from "../systems/BattleModel";
import { heroes, heroById, buildNames, factionNames } from "../data/heroes";
import { mergeGroup } from "../systems/MergeSystem";
import { button, icon, portrait, num } from "./components";
export function battleScreen(m: BattleModel) {
  return `<section class="battle-screen"><div class="battle-top"><div class="battle-location"><small>OPERATION 01</small><b>침묵의 교차로</b></div><div class="wave-hud"><small>WAVE</small><b id="wave-number">01</b><span>/ 30</span></div><div class="core-hud">${icon("shield")}<div><span>CORE <b id="core-hp">100</b></span><div class="hp-track"><i id="core-bar"></i></div></div></div><div class="battle-gold">${icon("coin")}<b id="battle-gold">${m.gold}</b><small>GOLD</small></div><div class="battle-top-buttons">${button("x1", "speed", "compact", "", 'id="speed-btn"')}${button("일시정지", "pause", "icon-only", "pause", 'aria-label="일시정지"')}</div></div><div class="battle-body"><div class="field-wrap"><div class="field-caption"><span><i class="live-dot"></i> LIVE TACTICAL VIEW</span><span id="enemy-count">HOSTILES 00 / 120</span></div><div id="phaser-container"></div><div id="battle-notice" class="battle-notice"></div><div class="field-bottom"><span>RIFT → ROUTE → CORE</span><span id="field-time">00:00</span><span>고정 전장 / 드래그로 배치</span></div><div id="tutorial-hint" class="tutorial-hint"></div></div><aside class="battle-sidebar"><div class="sidebar-heading"><span>OPERATOR STATUS</span><span id="unit-count">00 / 16</span></div><div id="unit-panel"></div><div class="research-panel"><div><span>${icon("science")}전투 연구</span><small>ATK · ASPD · CRIT</small></div><select id="research-select" aria-label="연구할 직업">${heroes.map((h) => `<option value="${h.id}">${h.role}</option>`).join("")}</select>${button("연구 Lv.0 · 25 G", "research", "research-button", "", 'id="research-btn"')}</div><div class="synergy-panel" id="synergy-panel"></div><div class="build-panel" id="build-panel"></div></aside></div><div class="battle-toolbar"><div class="reserve"><small>RESERVE</small><div id="reserve-units"></div></div><div class="battle-actions">${button("확정 소환 · 25", "focus", "ghost", "hero", 'id="focus-btn"')}${button("3중 합성", "merge", "ghost", "merge", 'id="merge-btn"')}${button("랜덤 소환 · 10", "summon", "primary", "bolt", 'id="summon-btn"')}${button("웨이브 시작", "wave-start", "primary", "play", 'id="wave-start-btn"')}</div></div>${
    import.meta.env.DEV
      ? `<details class="debug-panel"><summary>DEV</summary><div>${[
          ["gold", "GOLD +1000"],
          ["next", "웨이브 +1"],
          ["boss", "즉시 보스"],
          ["all", "모든 영웅"],
          ["stars", "모두 ★5"],
          ["god", "무적"],
          ["speed", "x5"],
        ]
          .map(([id, label]) =>
            button(label, "debug", "compact", "", `data-id="${id}"`),
          )
          .join("")}</div></details>`
      : ""
  }</section>`;
}
export function unitPanel(m: BattleModel) {
  const u = m.selectedUnit;
  if (!u)
    return `<div class="empty-selection">${icon("hero")}<h3>요원 선택</h3><p>전장의 요원을 선택하면<br>능력과 합성 정보를 확인합니다.</p><small>첫 소환 후 웨이브를 시작하세요.</small></div>`;
  const h = heroById[u.heroId],
    s = m.stats(u);
  return `<div class="unit-title" style="--hero-color:${h.color}">${portrait(h.id)}<div><small>${h.role} / ${u.slot < 0 ? "대기석" : "배치 중"}</small><h3>${h.name} <span>${"★".repeat(u.star)}</span></h3><small>${u.hp <= 0 ? "회복 중 · 7초 후 복귀" : `HP ${Math.ceil(u.hp)} / ${Math.ceil(u.maxHp)}`}</small></div></div><div class="unit-stats"><span>ATK <b>${Math.round(s.atk)}</b></span><span>ASPD <b>${s.speed.toFixed(2)}</b></span><span>RANGE <b>${Math.round(s.range)}</b></span></div><p class="unit-skill">${h.evolution
    .slice(0, u.star)
    .map((e) => e.text)
    .join(
      " · ",
    )}</p><div class="unit-actions">${button("합성", "merge-selected", "compact", "merge", `${mergeGroup(m.units, u).length ? "" : "disabled"}`)}${button(`판매 +${Math.floor(5 * Math.pow(3, u.star - 1))}`, "sell", "compact", "", "")}</div>`;
}
export function synergyPanel(m: BattleModel) {
  return `<small>ACTIVE SYNERGIES</small>${Object.entries(m.synergy)
    .map(([k, n]) => {
      const effect =
        k === "ballistic"
          ? "전체 공속 +10%"
          : k === "arcane"
            ? "위상 피해 +15%"
            : "드론 피해 +20%";
      return `<button class="synergy ${n >= 3 ? "active" : ""}" title="${effect}" data-action="explain" data-id="${factionNames[k as keyof typeof factionNames]} 3기 배치 시 ${effect}">${factionNames[k as keyof typeof factionNames]} <b>${n}/3</b></button>`;
    })
    .join("")}`;
}
export function buildPanel(m: BattleModel) {
  return `<small>BUILD / RELICS</small><div>${
    Object.entries(m.builds)
      .filter(([, v]) => v)
      .map(
        ([k, v]) =>
          `<span class="build-chip">${buildNames[k as keyof typeof buildNames]} ${v}</span>`,
      )
      .join("") || '<span class="muted">3웨이브마다 특성 선택</span>'
  }${m.relics.map((r) => `<button class="relic-chip" title="${r.description}" data-action="explain" data-id="${r.name} · ${r.description}">${r.name}</button>`).join("")}</div>`;
}
export function rewardModal(m: BattleModel) {
  return `<div class="modal reward-modal" role="dialog" aria-modal="true" aria-label="${m.choiceKind === "trait" ? "특성" : "유물"} 선택"><span class="eyebrow">${m.choiceKind === "trait" ? "PROTOCOL AWAKENING" : "RELIC DISCOVERED"} / TIME PAUSED</span><h2>${m.choiceKind === "trait" ? "다음 진화를 선택하세요" : "균열 속 유물을 발견했습니다"}</h2><p>세 가지 가능성. 당신의 선택이 전투를 바꿉니다.</p><div class="choice-grid">${m.choices.map((c, i) => `<button class="choice-card tier-${c.tier}" data-action="choice" data-id="${c.id}"><span class="choice-number">0${i + 1}</span><span class="choice-tier">${c.tier}</span><div class="choice-icon">${icon(c.build === "drone" ? "settings" : c.build === "crit" ? "battle" : m.choiceKind === "relic" ? "gem" : "bolt")}</div><h3>${c.name}</h3><p>${c.description}</p><span class="choice-select">선택하기 ${icon("arrow")}</span></button>`).join("")}</div><div class="reward-bottom"><span>이 효과는 이번 작전에만 적용됩니다.</span>${button(`새로고침 · ${20 * (m.choiceRerolls + 1)} G`, "reroll", "ghost", "", `${m.gold < 20 * (m.choiceRerolls + 1) ? "disabled" : ""}`)}</div></div>`;
}
export function focusModal(m: BattleModel) {
  return `<div class="modal focus-modal" role="dialog" aria-modal="true" aria-label="확정 소환"><div class="modal-heading"><div><span class="eyebrow">TACTICAL RECRUITMENT</span><h2>확정 소환 <small>${m.focusCost} GOLD</small></h2></div>${button("닫기", "close-modal", "icon-only", "close", 'aria-label="닫기"')}</div><p>운을 기다릴지, 필요한 합성 재료를 확보할지 선택하세요. 전투가 일시정지됩니다.</p><div class="focus-grid">${m.save.deck.map((id) => `<button data-action="focus-pick" data-id="${id}" ${m.gold < m.focusCost ? "disabled" : ""}>${portrait(id)}<b>${heroById[id].name}</b><small>${m.units.filter((u) => u.heroId === id && u.star === 1).length}명 ★ 보유</small></button>`).join("")}</div></div>`;
}
