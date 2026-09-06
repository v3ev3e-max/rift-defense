import { describe, it, expect } from "vitest";
import { BattleModel } from "../src/systems/BattleModel";
import { defaultSave, parseSave } from "../src/systems/SaveSystem";
import { seeded } from "../src/utils/random";
import { mergeGroup } from "../src/systems/MergeSystem";
import { heroById } from "../src/data/heroes";
import { evolution } from "../src/entities/HeroUnit";
import { rollTraits } from "../src/systems/TraitSystem";
import { attack, stepCombat } from "../src/systems/CombatSystem";
import { pathLength } from "../src/data/map";
import { traits } from "../src/data/traits";
import type { Build } from "../src/data/types";
const make = (seed = 12) => new BattleModel(defaultSave(), seeded(seed));
describe("battle economy and progression", () => {
  it("summons only from saved deck and never spends unavailable gold", () => {
    const m = make();
    m.save.deck = ["sera"];
    for (let i = 0; i < 9; i++) expect(m.summon()).toBe(true);
    expect(m.gold).toBe(0);
    expect(m.summon()).toBe(false);
    expect(m.units.every((u) => u.heroId === "sera")).toBe(true);
  });
  it("manual three-way merge conserves material, evolves attack structure and caps at five", () => {
    const m = make();
    for (let i = 0; i < 3; i++) m.addUnit("sera", 2);
    const before = m.units.reduce((n, u) => n + 3 ** (u.star - 1), 0);
    expect(m.merge()).toBe(true);
    expect(m.units).toHaveLength(1);
    expect(m.units[0].star).toBe(3);
    expect(m.units.reduce((n, u) => n + 3 ** (u.star - 1), 0)).toBe(before);
    expect(evolution(heroById.sera, 3).pierce).toBe(1);
    m.units = [];
    for (let i = 0; i < 3; i++) m.addUnit("sera", 5);
    expect(m.merge()).toBe(false);
    expect(m.units).toHaveLength(3);
  });
  it("cannot merge different identities or different stars", () => {
    const m = make();
    m.addUnit("sera");
    m.addUnit("sera", 2);
    m.addUnit("luna");
    expect(mergeGroup(m.units)).toHaveLength(0);
  });
  it("fills reserve, rejects overflow and swaps reserve with a board unit", () => {
    const m = make();
    m.gold = 10000;
    for (let i = 0; i < 22; i++) m.summon();
    expect(m.units.filter((u) => u.slot < 0)).toHaveLength(6);
    const gold = m.gold;
    expect(m.summon()).toBe(false);
    expect(m.gold).toBe(gold);
    const reserve = m.units[20];
    expect(m.move(reserve.uid, 0)).toBe(true);
    expect(reserve.slot).toBe(0);
    expect(
      new Set(m.units.filter((u) => u.slot >= 0).map((u) => u.slot)).size,
    ).toBe(16);
  });
  it("research is per class, consumes resources and increases actual DPS", () => {
    const m = make();
    const s = m.addUnit("sera"),
      l = m.addUnit("luna");
    const before = m.stats(s),
      other = m.stats(l);
    expect(m.upgrade("sera")).toBe(true);
    expect(m.gold).toBe(65);
    expect(m.stats(s).atk).toBeGreaterThan(before.atk);
    expect(m.stats(s).speed).toBeGreaterThan(before.speed);
    expect(m.stats(l).atk).toBe(other.atk);
  });
  it("applies a choice exactly once and freezes all simulation while choosing", () => {
    const m = make();
    m.start();
    m.pendingRewards.push("trait");
    m.openReward();
    const time = m.time,
      queue = m.wave.queue.length;
    m.update(0.25);
    expect(m.time).toBe(time);
    expect(m.wave.queue.length).toBe(queue);
    expect(m.choices).toHaveLength(3);
    const c = m.choices[0];
    expect(m.choose(c.id)).toBe(true);
    expect(m.choose(c.id)).toBe(false);
    if (c.build) expect(m.builds[c.build]).toBe(1);
  });
  it("offers sequential build upgrades and rolls jackpot with low probability", () => {
    const m = make(),
      rng = seeded(5);
    let jackpots = 0;
    for (let i = 0; i < 3000; i++) {
      const cs = rollTraits(m.builds, rng);
      expect(new Set(cs.map((c) => c.id)).size).toBe(3);
      expect(cs.filter((c) => c.build).every((c) => c.value === 1)).toBe(true);
      jackpots += cs.filter((c) => c.tier === "JACKPOT").length;
    }
    expect(jackpots).toBeGreaterThan(20);
    expect(jackpots).toBeLessThan(100);
  });
  it("does not leak battle upgrades back into permanent save", () => {
    const save = defaultSave();
    save.heroes.sera.level = 5;
    const m = new BattleModel(save);
    m.addUnit("sera", 5);
    m.research.sera = 8;
    m.builds.burn = 3;
    const next = new BattleModel(save);
    expect(next.builds.burn).toBe(0);
    expect(next.research.sera).toBeUndefined();
    expect(next.addUnit("sera").star).toBe(1);
    expect(next.save.heroes.sera.level).toBe(5);
  });
});
describe("combat and timing", () => {
  it("simulates equal game time at 30/60/120Hz and at x2", () => {
    const simulate = (fps: number, speed: number) => {
      const m = make();
      m.save.deck = ["sera"];
      m.addUnit("sera", 2);
      m.start();
      m.speed = speed;
      for (let i = 0; i < (20 * fps) / speed; i++) m.update(1 / fps);
      return m;
    };
    const a = simulate(60, 1);
    for (const b of [simulate(30, 1), simulate(120, 1), simulate(60, 2)]) {
      expect(b.time).toBeCloseTo(a.time, 6);
      expect(b.kills).toBe(a.kills);
      expect(b.gold).toBe(a.gold);
      expect(b.enemies[4].progress).toBeCloseTo(a.enemies[4].progress, 6);
    }
  });
  it("safely reuses all 120 enemy pool slots", () => {
    const m = make();
    m.wave.start(20);
    for (let i = 0; i < 120; i++) expect(m.spawn("runner")).toBe(true);
    expect(m.spawn("runner")).toBe(false);
    const pooled = m.enemies[0];
    pooled.active = false;
    pooled.burn = 5;
    expect(m.spawn("crawler")).toBe(true);
    expect(m.enemies[0]).toBe(pooled);
    expect(pooled.burn).toBe(0);
  });
  it("loses when the final boss breaches the core, and finishes only once", () => {
    const m = make();
    m.start();
    m.wave.start(30);
    m.wave.queue = [];
    m.spawn("sovereign");
    m.enemies[0].progress = pathLength - 0.1;
    m.update(0.1);
    expect(m.result?.won).toBe(false);
    const result = m.result;
    m.finish(true);
    expect(m.result).toBe(result);
  });
  it("implements rage speed and frost disruption, plus medic recovery", () => {
    const m = make();
    m.wave.start(10);
    m.spawn("ravager");
    const e = m.enemies[0];
    stepCombat(m, 1);
    const normal = e.progress;
    e.hp = e.maxHp * 0.2;
    stepCombat(m, 1);
    expect(e.progress - normal).toBeGreaterThan(normal);
    const u = m.addUnit("sera");
    m.spawn("sovereign");
    const boss = m.enemies[1];
    boss.x = u.x;
    boss.y = u.y;
    boss.attackTimer = 4;
    stepCombat(m, 0.01);
    expect(u.stunned).toBeGreaterThan(0);
    expect(u.hp).toBeLessThan(u.maxHp);
    const medic = m.addUnit("mia");
    m.move(medic.uid, 1);
    medic.x = u.x;
    medic.y = u.y;
    const hp = u.hp;
    boss.active = false;
    stepCombat(m, 0.1);
    expect(u.hp).toBeGreaterThan(hp);
  });
  it.each(["burn", "shock", "bleed", "crit", "blast", "drone"] as Build[])(
    "%s builds change actual combat outcomes",
    (build) => {
      const run = (enabled: boolean) => {
        const m = make();
        m.rng = () => 0;
        m.wave.start(10);
        const u = m.addUnit("sera");
        if (enabled) m.builds[build] = 3;
        for (let i = 0; i < 4; i++) {
          m.spawn("brute");
          const e = m.enemies[i];
          e.x = u.x + 50 + i * 12;
          e.y = u.y;
          e.hp = e.maxHp = 10000;
          e.progress = 300 + i * 12;
        }
        attack(m, u, m.enemies[0]);
        if (build === "drone") {
          u.cooldown = 99;
          u.droneCooldown = 0;
          stepCombat(m, 0.01);
        }
        if (build === "burn" || build === "bleed") stepCombat(m, 0.1);
        return m.enemies.reduce((sum, e) => sum + (e.maxHp - e.hp), 0);
      };
      expect(run(true)).toBeGreaterThan(run(false));
    },
  );
  it("trait and relic rewards are queued rather than overwritten", () => {
    const m = make();
    m.pendingRewards = ["trait", "relic"];
    m.openReward();
    expect(m.choiceKind).toBe("trait");
    m.choose(m.choices[0].id);
    expect(m.choiceKind).toBe("relic");
    expect(m.choices).toHaveLength(3);
    m.choose(m.choices[0].id);
    expect(m.relics).toHaveLength(1);
    expect(m.choices).toHaveLength(0);
  });
});
describe("save validation", () => {
  it("recovers corrupt JSON and validates stale/malformed fields", () => {
    expect(parseSave("{broken").credits).toBe(500);
    const s = parseSave(
      JSON.stringify({
        saveVersion: 1,
        credits: -4,
        deck: ["missing", "sera", "sera"],
        heroes: { sera: { level: 999 } },
        settings: { sound: "false" },
      }),
    );
    expect(s.credits).toBe(0);
    expect(s.deck).toEqual(["sera"]);
    expect(s.heroes.sera.level).toBe(50);
    expect(s.settings.sound).toBe(true);
  });
  it("preserves account progress after serializing and reloading", () => {
    const s = defaultSave();
    s.deck = ["eve", "luna"];
    s.credits = 950;
    s.heroes.eve.level = 8;
    s.bestWave = 30;
    s.cleared = 1;
    s.tutorial = true;
    s.settings.sound = false;
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
});
describe("complete thirty-wave alpha balance", () => {
  it("a level-one recommended deck can finish without debug resources", () => {
    const m = make(28);
    m.save.deck = ["yuria", "sera", "luna", "eve", "lize"];
    const manage = () => {
      if (m.choices.length) {
        const choice =
          m.choices.find((c) => c.build === "drone") ??
          m.choices.find((c) => c.build === "crit") ??
          m.choices.find((c) => c.build) ??
          m.choices[0];
        m.choose(choice.id);
      }
      while (m.merge()) {}
      if (m.units.length < 14) {
        while (m.gold >= m.summonCost && m.units.length < 14) m.summon();
      }
      const classes = [...new Set(m.units.map((u) => u.heroId))];
      for (const id of classes)
        if ((m.research[id] ?? 0) < 6 && m.gold > m.researchCost(id) + 30)
          m.upgrade(id);
      if (m.units.length >= 14 && m.gold >= m.focusCost) {
        const pair = m.units.find(
          (u) =>
            u.star < 5 &&
            m.units.filter((v) => v.heroId === u.heroId && v.star === 1)
              .length === 2,
        );
        if (pair) m.summon(pair.heroId);
        else if (m.units.length < 21) m.summon();
      }
    };
    manage();
    m.start();
    for (let t = 0; t < 1800 * 10 && !m.ended; t++) {
      if (t % 10 === 0) manage();
      m.update(0.1);
    }
    console.log("Balance run", m.result, {
      core: m.core,
      research: m.research,
      units: m.units.map((u) => `${u.heroId}:${u.star}`),
    });
    expect(m.ended).toBe(true);
    expect(m.result?.won).toBe(true);
    expect(m.result?.wave).toBe(30);
    expect(m.result!.time).toBeGreaterThan(600);
    expect(m.result!.time).toBeLessThan(900);
  }, 30000);
});
