import { BALANCE } from "../data/balance";
import { heroById } from "../data/heroes";
import { enemies } from "../data/enemies";
import { slots } from "../data/map";
import type { Build, Choice, SaveData } from "../data/types";
import { createEnemy, type Enemy } from "../entities/Enemy";
import { evolution, type Unit } from "../entities/HeroUnit";
import { drawHero } from "./SummonSystem";
import { mergeGroup } from "./MergeSystem";
import { rollTraits } from "./TraitSystem";
import { rollRelics } from "./RelicSystem";
import { WaveSystem } from "./WaveSystem";
import { stepCombat } from "./CombatSystem";
import { synergies } from "./SynergySystem";
import type { RNG } from "../utils/random";
export interface FX {
  type: "shot" | "blast" | "heal" | "merge" | "spawn";
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: number;
  life: number;
}
export interface BattleResult {
  won: boolean;
  time: number;
  kills: number;
  highestStar: number;
  credits: number;
  gold: number;
  wave: number;
  builds: Record<Build, number>;
  mvp: string;
}
export class BattleModel {
  units: Unit[] = [];
  enemies: Enemy[] = Array.from({ length: BALANCE.maxEnemies }, (_, i) =>
    createEnemy(i),
  );
  effects: FX[] = Array.from({ length: 100 }, () => ({
    type: "shot",
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    color: 0xffffff,
    life: 0,
  }));
  wave = new WaveSystem();
  gold = BALANCE.initialGold;
  core = BALANCE.coreHp;
  time = 0;
  kills = 0;
  earned = 0;
  highestStar = 1;
  selected = 0;
  selectedSlot = -1;
  speed = 1;
  paused = false;
  started = false;
  invincible = false;
  ended = false;
  result?: BattleResult;
  builds: Record<Build, number> = {
    burn: 0,
    shock: 0,
    bleed: 0,
    crit: 0,
    blast: 0,
    drone: 0,
  };
  research: Record<string, number> = {};
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
  ) {}
  get alive() {
    return this.enemies.reduce((n, e) => n + Number(e.active), 0);
  }
  get summonCost() {
    return Math.ceil(BALANCE.summonCost * (this.bonuses.jackpot ? 0.85 : 1));
  }
  get focusCost() {
    return Math.ceil(BALANCE.focusCost * (this.bonuses.jackpot ? 0.85 : 1));
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
    this.started = true;
    this.wave.start(1);
    this.say("WAVE 01 · 균열 반응 감지");
  }
  summon(focus?: string) {
    const cost = focus ? this.focusCost : this.summonCost;
    if (focus && !this.save.deck.includes(focus)) return false;
    if (this.gold < cost) {
      this.say("골드가 부족합니다.");
      return false;
    }
    if (this.units.length >= BALANCE.maxUnits) {
      this.say("배치와 대기석이 가득 찼습니다. 합성하거나 판매하세요.");
      return false;
    }
    this.gold -= cost;
    const id = focus ?? drawHero(this.save.deck, this.rng);
    this.addUnit(id);
    this.summons++;
    this.onSound?.("summon");
    return true;
  }
  addUnit(id: string, star = 1) {
    const h = heroById[id];
    const accepts = (i: number) =>
      slots[i] && (slots[i].type === "any" || slots[i].type === h.rangeType);
    const available = slots.findIndex(
      (_, i) => accepts(i) && !this.units.some((u) => u.slot === i),
    );
    const preferred =
      this.selectedSlot >= 0 &&
      accepts(this.selectedSlot) &&
      !this.units.some((u) => u.slot === this.selectedSlot)
        ? this.selectedSlot
        : available;
    const hp =
      h.hp *
      (1 + 0.04 * (this.save.heroes[id]?.level - 1 || 0)) *
      Math.pow(1.65, star - 1);
    const p = slots[preferred] ?? { x: -100, y: -100 };
    const u: Unit = {
      uid: this.uid++,
      heroId: id,
      star,
      slot: preferred,
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
    this.selected = u.uid;
    this.selectedSlot = -1;
    this.highestStar = Math.max(this.highestStar, star);
    this.refresh();
    return u;
  }
  move(uid: number, slot: number) {
    const u = this.units.find((u) => u.uid === uid);
    if (!u || !slots[slot]) return false;
    const accepts = (index: number, heroId: string) =>
      index < 0 ||
      slots[index].type === "any" ||
      slots[index].type === heroById[heroId].rangeType;
    if (!accepts(slot, u.heroId)) return false;
    const dest = this.units.find((v) => v.slot === slot);
    if (dest && !accepts(u.slot, dest.heroId)) return false;
    if (dest) {
      dest.slot = u.slot;
      Object.assign(dest, slots[dest.slot] ?? { x: -100, y: -100 });
    }
    u.slot = slot;
    Object.assign(u, slots[slot]);
    this.refresh();
    return true;
  }
  merge(uid?: number) {
    const target = uid ? this.units.find((u) => u.uid === uid) : undefined;
    const group = mergeGroup(this.units, target);
    if (group.length < 3) {
      this.say("같은 영웅 · 같은 단계 3명이 필요합니다.");
      return false;
    }
    const survivor = group[0];
    survivor.star++;
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
      `${heroById[survivor.heroId].name} ${"★".repeat(survivor.star)} · ${heroById[survivor.heroId].evolution[survivor.star - 1].text}`,
    );
    this.refresh();
    return true;
  }
  sell(uid: number) {
    const u = this.units.find((u) => u.uid === uid);
    if (!u) return;
    this.gold += Math.floor(5 * Math.pow(3, u.star - 1));
    this.units = this.units.filter((v) => v !== u);
    this.selected = 0;
    this.refresh();
  }
  researchCost(id: string) {
    return Math.floor(
      BALANCE.researchBase * Math.pow(1.5, this.research[id] ?? 0),
    );
  }
  upgrade(id: string) {
    if (!heroById[id] || (this.research[id] ?? 0) >= BALANCE.maxResearch)
      return false;
    const cost = this.researchCost(id);
    if (this.gold < cost) {
      this.say("연구 골드가 부족합니다.");
      return false;
    }
    this.gold -= cost;
    this.research[id] = (this.research[id] ?? 0) + 1;
    this.onSound?.("level");
    this.refresh();
    return true;
  }
  stats(u: Unit) {
    const h = heroById[u.heroId],
      e = evolution(h, u.star),
      lv = this.save.heroes[u.heroId]?.level ?? 1,
      r = this.research[u.heroId] ?? 0;
    const support = this.units.some(
      (v) =>
        v.slot >= 0 &&
        v.hp > 0 &&
        v.heroId === "lize" &&
        Math.hypot(v.x - u.x, v.y - u.y) < 260,
    )
      ? 0.12
      : 0;
    return {
      atk:
        h.atk *
        (1 + 0.04 * (lv - 1)) *
        Math.pow(2.15, u.star - 1) *
        (1 + e.attack) *
        (1 + 0.08 * r) *
        (1 +
          (this.bonuses.ascend ?? 0) +
          (this.bonuses.jackpot ? 0.25 : 0) +
          (h.rangeType === "ranged" ? (this.bonuses.ranged ?? 0) : 0)) *
        (h.faction === "arcane" && this.synergy.arcane >= 3 ? 1.15 : 1),
      speed:
        h.speed *
        (1 + e.speed + Math.min(0.7, u.shots * e.ramp)) *
        (1 +
          0.035 * r +
          (this.bonuses.speed ?? 0) +
          (this.bonuses.jackpot ? 0.2 : 0) +
          support +
          (this.synergy.ballistic >= 3 ? 0.1 : 0) +
          (u.hp < u.maxHp * 0.5 ? (this.bonuses.berserk ?? 0) : 0)) *
        (u.stunned > 0 ? 0.55 : 1),
      range:
        h.range *
        (1 + (this.bonuses.range ?? 0) + (this.bonuses.ascend ? 0.15 : 0)),
      crit: Math.min(
        0.85,
        0.06 +
          e.crit +
          r * 0.01 +
          (this.builds.crit ? 0.15 : 0) +
          (this.builds.crit >= 3 ? 0.2 : 0) +
          (this.bonuses.luck ?? 0),
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
      ? 1
      : 1 + (n - 1) * 0.105 + Math.pow(Math.max(0, n - 12), 1.65) * 0.022;
    Object.assign(e, createEnemy(e.index), {
      active: true,
      kind,
      hp: def.hp * scale * (this.bonuses.greed ? 1.1 : 1),
      maxHp: def.hp * scale * (this.bonuses.greed ? 1.1 : 1),
      armor: def.armor,
      speed: def.speed,
      x: 0,
      y: 126,
    });
    return true;
  }
  emit(
    type: FX["type"],
    x: number,
    y: number,
    tx: number,
    ty: number,
    color: number,
  ) {
    const f = this.effects.find((v) => v.life <= 0);
    if (f)
      Object.assign(f, {
        type,
        x,
        y,
        tx,
        ty,
        color,
        life: type === "shot" ? 0.15 : 0.4,
      });
  }
  award(amount: number) {
    const value = Math.round(amount * (1 + (this.bonuses.greed ?? 0)));
    this.gold += value;
    this.earned += value;
  }
  damage(e: Enemy, amount: number, owner?: Unit, secondary = false) {
    if (!e.active) return;
    const real = Math.min(e.hp, Math.max(1, amount));
    e.hp -= real;
    if (owner) {
      owner.damage += real;
      this.statsDamage[owner.heroId] =
        (this.statsDamage[owner.heroId] ?? 0) + real;
    }
    if (e.hp <= 0) {
      e.active = false;
      this.kills++;
      this.award(
        enemies[e.kind].reward +
          (owner ? evolution(heroById[owner.heroId], owner.star).gold : 0),
      );
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
  choose(id: string) {
    const c = this.choices.find((t) => t.id === id);
    if (!c) return false;
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
    const cost = 20 * (this.choiceRerolls + 1);
    if (!this.choices.length || this.gold < cost) return false;
    this.gold -= cost;
    this.choiceRerolls++;
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
      won,
      time: this.time,
      kills: this.kills,
      highestStar: this.highestStar,
      credits: Math.floor(
        this.kills * 1.5 + this.wave.number * 12 + (won ? 500 : 50),
      ),
      gold: this.earned,
      wave: this.wave.number,
      builds: { ...this.builds },
      mvp,
    };
    this.onSound?.(won ? "victory" : "defeat");
    this.revision++;
  }
  update(deltaSeconds: number) {
    if (this.paused || this.choices.length || this.ended) return;
    this.accumulator += Math.min(deltaSeconds, 0.25) * this.speed;
    while (this.accumulator >= BALANCE.fixedStep) {
      this.accumulator -= BALANCE.fixedStep;
      this.step(BALANCE.fixedStep);
      if (this.ended || this.choices.length) {
        this.accumulator = 0;
        break;
      }
    }
  }
  step(dt: number) {
    for (const fx of this.effects) fx.life = Math.max(0, fx.life - dt);
    this.noticeTime = Math.max(0, this.noticeTime - dt);
    if (!this.started) return;
    this.time += dt;
    if (this.intermission > 0) {
      this.intermission -= dt;
      if (this.intermission <= 0) {
        this.wave.start(this.wave.number + 1);
        if (this.wave.data.boss) {
          this.say(`BOSS WAVE · ${enemies[this.wave.data.boss].name}`);
          this.onSound?.("boss");
        } else
          this.say(
            `WAVE ${String(this.wave.number).padStart(2, "0")} · 경계 유지`,
          );
      }
      return;
    }
    this.wave.elapsed += dt;
    this.wave.spawnTimer -= dt;
    if (
      this.wave.queue.length &&
      this.wave.spawnTimer <= 0 &&
      this.alive < BALANCE.maxEnemies
    ) {
      this.spawn(this.wave.queue.shift()!);
      this.wave.spawnTimer += this.wave.data.interval;
    }
    stepCombat(this, dt);
    if (this.core <= 0 && !this.invincible) {
      this.finish(false);
      return;
    }
    if (
      !this.wave.queue.length &&
      !this.alive &&
      this.wave.elapsed >= BALANCE.waveDuration
    ) {
      this.award(this.wave.data.reward);
      this.core = Math.min(100, this.core + (this.bonuses.regen ?? 0));
      if (this.wave.number >= 30) {
        this.finish(true);
        return;
      }
      this.intermission = 2;
      if (this.wave.number % 3 === 0) this.pendingRewards.push("trait");
      if (this.wave.data.elite) this.pendingRewards.push("relic");
      if (this.rng() < 0.03) {
        this.award(60);
        this.say("희귀 이벤트 · 잊힌 보급상자 GOLD +60");
      }
      this.openReward();
      this.refresh();
    }
  }
  debug(action: string) {
    if (action === "gold") this.gold += 1000;
    if (action === "next") {
      if (this.wave.number >= 30) {
        this.finish(true);
        return;
      }
      this.started = true;
      this.wave.start(Math.max(1, this.wave.number + 1));
      this.enemies.forEach((e) => (e.active = false));
      this.intermission = 0;
    }
    if (action === "boss") {
      this.started = true;
      this.wave.start(30);
      this.enemies.forEach((e) => (e.active = false));
      this.intermission = 0;
      this.say("BOSS WAVE · 영하의 군주");
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
    if (action === "speed") this.speed = this.speed === 5 ? 1 : 5;
    this.refresh();
  }
}
