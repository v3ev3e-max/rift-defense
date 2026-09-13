import {activeLinks,links,growthName,priorityNames,priceFactors,gradeCombatBudget} from '../data/strategy';
import {combatRoles,dealerFirst,formationRole} from "../data/combatRoles";
import {CELL} from '../data/map';
import {combatRange,MELEE_STRIKE_RANGE} from '../data/balance';
import type { BattleModel } from "../systems/BattleModel";
import { heroes, heroById, buildNames, elementColors, elementNames, gradeNames, heroElementName } from "../data/heroes";
import { mergeGroup } from "../systems/MergeSystem";
import { button, icon, portrait, combatPortrait, num } from "./components";
import {elementUpgradeCost,elementUpgradeInfo,elementUpgradeMax} from '../data/elementUpgrades';
import type {Element} from '../data/types';
export function battleScreen(m: BattleModel) {
  return `<section class="battle-screen compact-battle"><div class="battle-top compact-top"><div class="wave-hud"><small>WAVE</small><b id="wave-number">01</b><span>∞</span></div><div class="core-hud">${icon("shield")}<div><span>CORE <b id="core-hp">100</b></span><div class="hp-track"><i id="core-bar"></i></div></div></div><div class="battle-gold">${icon("coin")}<b id="battle-gold">${m.gold}</b><small>GOLD</small></div><div class="battle-top-buttons">${button("x1", "speed", "compact", "", 'id="speed-btn"')}${button("일시정지", "pause", "icon-only", "pause", 'aria-label="일시정지"')}</div></div><div class="compact-field"><div class="field-wrap"><div class="field-caption"><span><i class="live-dot"></i> ${m.map.name}</span><span id="enemy-count">HOSTILES 00 / ${m.enemyCap}</span></div><div id="phaser-container"></div><div id="battle-notice" class="battle-notice"></div><div class="field-bottom"><span>AUTO WAVE · 5 ELITE · 10 BOSS</span><span id="field-time">00:00</span></div><div id="tutorial-hint" class="tutorial-hint"></div></div></div><div id="wave-preview" class="wave-preview"></div><div class="compact-status"><div id="synergy-panel" class="synergy-panel compact-synergy"></div><div class="reserve"><small>RESERVE</small><div id="reserve-units"></div></div></div><nav class="compact-actions" aria-label="전투 기능">${button("소환","toggle-panel","ghost","hero",'data-id="shop-shell"')}${button("속성 강화","toggle-panel","ghost","bolt",'data-id="element-shell"')}${button("DPS","dps","ghost")}${button("전술","battle-menu","ghost","settings",'id="tactical-btn"')}</nav><div id="element-upgrades">${elementUpgradePanel(m)}</div><div class="placement-help">빈칸: 구매·이동 · 요원 두 번 누르기: 합성 ${button("선택 해제","deselect","ghost")} ${button("되돌리기","undo-placement","ghost","",'id="undo-placement-btn"')}</div><div class="growth-host"><div id="selected-growth" class="selected-growth">${growthPanel(m)}</div></div><details id="shop-shell" class="grade-summon-actions hero-shop-shell"><summary>영웅 소환</summary><div id="hero-shop">${shopPanel(m)}</div></details><div id="dps-panel" class="dps-panel"></div>${
    (import.meta.env.DEV||location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname))
      ? `<details class="debug-panel"><summary>DEV</summary><div>${[
          ["gold", "GOLD +1000"],
          ["next", "웨이브 +1"],
          ["boss", "다음 보스"],
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
export function elementUpgradePanel(m:BattleModel){
 const keys:Element[]=['water','fire','electric','dark'];
 return `<details id="element-shell" class="element-upgrade-panel"><summary>속성 강화</summary><small>같은 속성 전체 적용 · 사거리 증가 없음</small><div>${keys.map(k=>{const level=m.elementUpgrades[k],max=level>=elementUpgradeMax,cost=elementUpgradeCost(level),info=elementUpgradeInfo[k];return `<button class="element-upgrade element-${k}" data-action="element-upgrade" data-id="${k}" ${max||m.gold<cost?'disabled':''} title="${info.stages.map((v,i)=>`${i+1}단계 ${v}`).join(' · ')}"><span>${info.name} <b>Lv.${level}</b></span><small>${info.summary}</small><strong>${max?'MAX':`${cost}G`}</strong></button>`}).join('')}</div></details>`;
}
export function tacticalModal(m: BattleModel) {
  return `<div class="modal tactical-modal" role="dialog" aria-modal="true" aria-label="전술 메뉴"><div class="modal-heading"><div><span class="eyebrow">TACTICAL MENU</span><h2>전술 관리</h2></div>${button("닫기", "close-modal", "icon-only", "close", 'aria-label="닫기"')}</div><div class="tactical-grid"><section><small>SELECTED OPERATOR</small><div id="unit-panel">${unitPanel(m)}</div></section><section><small>BUILD / RELICS</small><div id="build-panel" class="build-panel">${buildPanel(m)}</div></section></div></div>`;
}
export function shopPanel(m:BattleModel){
 const list=heroes.filter(h=>m.shopGrade==='ALL'||h.grade===m.shopGrade).sort((a,b)=>dealerFirst(a,b)||Number(m.save.deck.includes(b.id))-Number(m.save.deck.includes(a.id)));
 return `<div class="shop-filters">${['B','A','S','SR','ALL'].map(g=>button(g==='ALL'?'전체':g,'shop-grade',m.shopGrade===g?'primary':'ghost','',`data-id="${g}"`)).join('')}</div><p class="shop-mode">${m.selectedUnit?`이동 모드 · ${heroById[m.selectedUnit.heroId].name} 선택 · 빈칸 이동`:m.selectedHero?`${heroById[m.selectedHero].name} 선택 · ${m.price(m.selectedHero)}G · 빈칸 구매`:'영웅 카드를 선택하세요'} ${button('취소','deselect','compact')}</p><div class="shop-cards">${list.map(h=>`<button class="shop-card ${m.selectedHero===h.id?'selected':''}" data-action="buy-hero" data-id="${h.id}" ${m.gold<m.price(h.id)?'disabled':''}>${combatPortrait(h.id)}<span><b>${h.name} · ${h.grade}</b><small>${heroElementName(h)} · ${combatRoles[h.id].name}</small><strong>${m.price(h.id)}G</strong><small>${links.filter(l=>l.ids.includes(h.id)).map(l=>'추천 조합: '+l.ids.map(id=>heroById[id].name).join(' + ')).join(' · ')||gradeCombatBudget[h.grade].label}</small></span></button>`).join('')}</div><small>반복 정가 B ×${priceFactors.B.toFixed(2)} / A ×${priceFactors.A.toFixed(2)} / S ×${priceFactors.S.toFixed(2)} / SR ×${priceFactors.SR.toFixed(2)} · A급은 속성 반응 +10%</small>`;
}
export function unitPanel(m: BattleModel) {
  const u = m.selectedUnit;
  if (!u)
    return `<div class="empty-selection">${icon("hero")}<h3>요원 선택</h3><p>전장의 요원을 선택하면<br>능력과 합성 정보를 확인합니다.</p><small>첫 소환 후 웨이브를 시작하세요.</small></div>`;
  const h = heroById[u.heroId],
    s = m.stats(u);
  const baseRange=combatRoles[h.id].kind==='melee'&&formationRole(h.id)!=='tank'?Math.max(MELEE_STRIKE_RANGE,combatRange(h.range)):combatRange(h.range);
  const refund=Math.floor((u.investment??0)*.35);
  return `<div class="unit-title" style="--hero-color:${h.color}">${portrait(h.id)}<div><small>${gradeNames[h.grade]} · ${heroElementName(h)} / ${h.role} / ${u.slot < 0 ? "대기석" : "배치 중"}</small><h3>${h.name} <span>${"★".repeat(u.star)}</span></h3><small>${u.hp <= 0 ? "전투 불능 · 이번 전투 복귀 불가" : `HP ${Math.ceil(u.hp)} / ${Math.ceil(u.maxHp)}`}</small></div></div><div class="unit-stats"><span>ATK <b>${Math.round(s.atk)}</b></span><span>ASPD <b>${s.speed.toFixed(2)}</b></span><span>RANGE <b>${(baseRange/CELL).toFixed(1)}칸 + ${((s.range-baseRange)/CELL).toFixed(1)}칸</b></span></div><p class="unit-signature"><b>${combatRoles[h.id].name}</b> ${combatRoles[h.id].stages[u.star-1]}</p><p class="unit-skill">${combatRoles[h.id].stages.slice(0,u.star).map((text,i)=>`${i+1}★ ${text}`).join(' · ')}</p><div class="unit-actions">${button("합성", "merge-selected", "compact", "merge", `${mergeGroup(m.units, u).length ? "" : "disabled"}`)}${button(refund?`판매 +${refund}G`:"판매", "sell", "compact", "", "")}</div>`;
}
export function synergyPanel(m: BattleModel) {
  const keys = ["water", "fire", "electric", "dark"] as const;
  const effects = {
    water: "2/4/6: 감속·상태 지속 강화",
    fire: "2/4/6: 화염·반응 피해 강화",
    electric: "2/4/6: 연쇄·반응 피해 강화",
    dark: "2/4/6: 저주·피해 증폭 강화",
  } as const;
  return `<small>최근 ${m.lastReaction||"반응 대기"} · 지역 반응 ${Math.max(...m.tripleMeters.map(t=>m.time-t.last<=8?t.count:0))}/6</small><small>${activeLinks(m.units).map(l=>l.ids.map(id=>heroById[id].name).join(" + ")+" · 조합 활성").join(" · ")}</small>${keys
    .map((k) => {
      const n = m.synergy[k];
      const next = n < 2 ? 2 : n < 4 ? 4 : n < 6 ? 6 : 6;
      return `<button class="synergy element-synergy ${n >= 2 ? "active" : ""}" style="--element-color:${elementColors[k]}" title="${effects[k]}" data-action="explain" data-id="${elementNames[k]} 속성 · ${effects[k]}">${elementNames[k]} <b>${n}/${next}</b></button>`;
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
      .join("") || '<span class="muted">3·5성 합성 시 성장 선택</span>'
  }${m.relics.map((r) => `<button class="relic-chip" title="${r.description}" data-action="explain" data-id="${r.name} · ${r.description}">${r.name}</button>`).join("")}</div>`;
}
export function rewardModal(m: BattleModel) {
  return `<div class="modal reward-modal" role="dialog" aria-modal="true" aria-label="${m.choiceKind === "trait" ? "특성" : "유물"} 선택"><span class="eyebrow">${m.choiceKind === "trait" ? "PROTOCOL AWAKENING" : "RELIC DISCOVERED"} / TIME PAUSED</span><h2>${m.choiceKind === "trait" ? (m.growthUid ? "영웅 성장 분기 선택" : "특성 선택") : "균열 속 유물을 발견했습니다"}</h2><p>세 가지 가능성. 당신의 선택이 전투를 바꿉니다.</p><div class="choice-grid">${m.choices.map((c, i) => `<button class="choice-card tier-${c.tier}" data-action="choice" data-id="${c.id}"><span class="choice-number">0${i + 1}</span><span class="choice-tier">${c.tier}</span><div class="choice-icon">${icon(c.build === "drone" ? "settings" : c.build === "crit" ? "battle" : m.choiceKind === "relic" ? "gem" : "bolt")}</div><h3>${c.name}</h3><p>${c.description}</p><span class="choice-select">선택하기 ${icon("arrow")}</span></button>`).join("")}</div><div class="reward-bottom"><span>이 효과는 이번 작전에만 적용됩니다.</span>${button(`새로고침 · ${20 * (m.choiceRerolls + 1)} G`, "reroll", "ghost", "", `${m.gold < 20 * (m.choiceRerolls + 1) ? "disabled" : ""}`)}</div></div>`;
}

export function dpsPanel(m:BattleModel){return '<b>최근 10초 DPS / 처치 / 누적 피해</b>'+m.ranking().slice(0,10).map(r=>`<div class="dps-row"><span>${heroById[r.heroId].name} ${'★'.repeat(r.star)}</span><b>${r.dps.toFixed(1)}</b><span>${r.kills}킬</span><span>${num(r.damage)}</span></div>`).join('');}
export function growthPanel(m:BattleModel){
 const u=m.selectedUnit;if(!u)return '<p class="growth-empty">요원을 누르면 합성·판매·공격 설정이 표시됩니다.</p>';
 const role=combatRoles[u.heroId],r=m.ranking().find(r=>r.uid===u.uid),count=m.units.filter(v=>v.heroId===u.heroId&&v.star===u.star).length,total=Object.values(m.statsDamage).reduce((s,r)=>s+r,0);
 const refund=Math.floor((u.investment??0)*.35);
 return `<div class="growth-identity">${combatPortrait(u.heroId)}<div><b>${heroById[u.heroId].name} ${'★'.repeat(u.star)} · ${role.name}</b><small>${r?.kills??0}킬 · DPS ${(r?.dps??0).toFixed(1)} · 사거리 ${(m.stats(u).range/CELL).toFixed(1)}칸</small><small>${role.stages[u.star-1]} · ${growthName(u)}</small></div></div>${m.mergePreview?`<p class="merge-preview">${u.star+1}★ 합성 · 재료를 선택하세요.</p>`:""}<div class="growth-buttons">${button('닫기','deselect','compact')}${button(u.star>=5?'합성 MAX':m.mergePreview?`합성 확정`:`합성 ${count}/2`,'merge-selected','compact','merge',`id="selected-merge-btn" ${count<2||u.star>=5?'disabled':''}`)}${button(refund?`판매 +${refund}G`:'판매','sell','compact','',`id="selected-sell-btn"`)}${button(priorityNames[u.priority??'auto'],'skill','compact')}</div>`;
}

