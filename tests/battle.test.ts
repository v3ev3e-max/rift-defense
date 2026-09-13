import {stepActions} from '../src/systems/ActionCombat';
import { describe, it, expect } from "vitest";
import { battleTimeScale, BattleModel } from "../src/systems/BattleModel";
import { defaultSave, parseSave } from "../src/systems/SaveSystem";
import { seeded } from "../src/utils/random";
import { mergeGroup } from "../src/systems/MergeSystem";
import { heroById } from "../src/data/heroes";
import { evolution } from "../src/entities/HeroUnit";
import { rollTraits } from "../src/systems/TraitSystem";
import { attack as queueAttack, stepCombat } from "../src/systems/CombatSystem";
import { pathLength } from "../src/data/map";
import { traits } from "../src/data/traits";
import { BALANCE } from "../src/data/balance";
import type { Build } from "../src/data/types";
const make = (seed = 12) => new BattleModel(defaultSave(), seeded(seed));
describe("battle economy and progression", () => {
  it("buys exact heroes and rejects insufficient gold",()=>{const m=make();m.selectHero("sera");expect(m.summonAt(0)).toBe(true);expect(m.summonAt(1)).toBe(true);expect(m.gold).toBe(25);expect(m.summonAt(2)).toBe(false);expect(m.units.every(u=>u.heroId==="sera")).toBe(true);});
  it("manual two-way merge conserves material, evolves attack structure and caps at five", () => {
    const m = make();
    for (let i = 0; i < 2; i++) m.addUnit("sera", 2);
    const before = m.units.reduce((n, u) => n + 2 ** (u.star - 1), 0);
    expect(m.merge()).toBe(true);
    expect(m.units).toHaveLength(1);
    expect(m.units[0].star).toBe(3);
    expect(m.units.reduce((n, u) => n + 2 ** (u.star - 1), 0)).toBe(before);
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
  it("uses a fixed ten-unit cap and asks the player to merge for space",()=>{const m=make();m.gold=100000;for(let i=0;i<10;i++)expect(m.summonAt(i)).toBe(true);const gold=m.gold;expect(m.summonAt(10)).toBe(false);expect(m.gold).toBe(gold);expect(m.notice).toContain("2인 합성");});
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

    m.builds.burn = 3;
    const next = new BattleModel(save);
    expect(next.builds.burn).toBe(0);
    expect(next.capacity).toBe(10);
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
      for (let i = 0; i < (20 * fps) / battleTimeScale(speed); i++) m.update(1 / fps);
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
  it("safely reuses the capped enemy pool slots", () => {
    const m = make();
    m.wave.start(20);
    for (let i = 0; i < BALANCE.maxEnemies; i++) expect(m.spawn("runner")).toBe(true);
    expect(m.spawn("runner")).toBe(false);
    const pooled = m.enemies[0];
    pooled.active = false;
    pooled.burn = 5;
    pooled.waterMark = 3;
    pooled.vulnerability = 0.2;
    expect(m.spawn("crawler")).toBe(true);
    expect(m.enemies[0]).toBe(pooled);
    expect(pooled.burn).toBe(0);
    expect(pooled.waterMark).toBe(0);
    expect(pooled.vulnerability).toBe(0);
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
  it("implements rage speed and boss disruption", () => {
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
  });
  it("Mia supports attack tempo and clears combat disruption without healer micromanagement", () => {
    const m = make();
    const ally = m.addUnit("sera");
    const before = m.stats(ally);
    const mia = m.addUnit("mia", 3);
    mia.x = ally.x + 20;
    mia.y = ally.y;
    const supported = m.stats(ally);
    expect(supported.atk).toBeGreaterThan(before.atk);
    expect(supported.speed).toBeGreaterThan(before.speed);

    ally.stunned = 2;
    ally.cooldown = 1;
    mia.shots = 5;
    m.spawn("crawler");
    const target = m.enemies.find((e) => e.active)!;
    target.x = mia.x + 30;
    target.y = mia.y;
    target.hp = target.maxHp = 10000;
    attack(m, mia, target);
    expect(ally.stunned).toBeLessThan(2);
    expect(ally.cooldown).toBeLessThanOrEqual(0.04);
  });
  it.each(["burn", "shock", "bleed", "crit", "blast", "drone"] as Build[])(
    "%s builds change actual combat outcomes",
    (build) => {
      const run = (enabled: boolean) => {
        const m = make();
        m.rng = () => 0;
        m.wave.start(10);
        // Phase 14+ elemental protocols require a matching native element.
        const u = m.addUnit(build === "shock" ? "arin" : build === "bleed" ? "karin" : "sera");
        const anchor=m.map.pathPoint(300,{x:0,y:0});
        u.x=anchor.x;u.y=anchor.y+40;
        if (enabled) m.builds[build] = 3;
        for (let i = 0; i < 4; i++) {
          m.spawn("brute");
          const e = m.enemies[i];
          m.map.pathPoint(300+i*12,e);
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
  it("keeps growth choices paused but grants relic rewards immediately", () => {
    const m = make();
    m.pendingRewards = ["trait", "relic"];
    m.openReward();
    expect(m.choiceKind).toBe("trait");
    m.choose(m.choices[0].id);
    expect(m.choices).toHaveLength(0);
    expect(m.relics).toHaveLength(1);
    const before=m.time;m.started=true;m.update(.1);expect(m.time).toBeGreaterThan(before);
  });
});
describe("operator combat identities", () => {
  it("keeps the agreed ranged firearm roles for Reina and Arin", () => {
    expect(heroById.reina.rangeType).toBe("ranged");
    expect(heroById.reina.role).toContain("사수");
    expect(heroById.arin.rangeType).toBe("ranged");
    expect(heroById.arin.role).toContain("관통");
    expect(evolution(heroById.mia, 5).heal).toBe(0);
  });

  it("Karin applies her signature bleed even without the bleed build", () => {
    const m = make();
    m.rng = () => 0.99;
    const u = m.addUnit("karin");
    m.spawn("brute");
    const target = m.enemies[0];
    target.x = u.x + 30;
    target.y = u.y;
    target.hp = target.maxHp = 10000;
    attack(m, u, target);
    expect(m.builds.bleed).toBe(0);
    expect(target.bleed).toBeGreaterThan(0);
  });

  it("Karin pays armor once across her multi-hit combo", () => {
    const dealt=(armor:number)=>{const m=make();m.rng=()=>.99;const u=m.addUnit('karin');u.slot=0;u.x=100;u.y=100;m.spawn('armored');const e=m.enemies[0];e.x=130;e.y=100;e.speed=0;e.armor=armor;e.hp=e.maxHp=10000;queueAttack(m,u,e);stepActions(m,.5);return 10000-e.hp;};
    const unarmored=dealt(0),armored=dealt(12);
    expect(unarmored-armored).toBeGreaterThan(11.5);
    expect(unarmored-armored).toBeLessThan(12.5);
    expect(armored).toBeGreaterThan(2);
  });

  it("Noel deals more base damage to bosses through anti-armor specialization", () => {
    const run = (kind: "brute" | "sovereign") => {
      const m = make();
      m.rng = () => 0.99;
      m.wave.start(30);
      const u = m.addUnit("noel");
      m.spawn(kind);
      const target = m.enemies[0];
      target.x = u.x + 50;
      target.y = u.y;
      target.hp = target.maxHp = 10000;
      target.armor = 20;
      attack(m, u, target);
      return 10000 - target.hp;
    };
    expect(run("sovereign")).toBeGreaterThan(run("brute"));
  });
});

describe("element links and operator grades", () => {
  it("keeps at least two choices in every grade-position line", () => {
    const counts = Object.values(heroById).reduce(
      (acc, h) => ({ ...acc, [h.grade]: acc[h.grade] + 1 }),
      { B: 0, A: 0, S: 0, SR: 0 },
    );
    expect(counts).toEqual({ B: 11, A: 8, S: 8, SR: 7 });
    for (const id of ["yuria", "reina", "arin", "karin", "sera", "luna", "mia", "noel", "ian"])
      expect(heroById[id].grade).toBe("B");
    expect(heroById.leon.grade).toBe("SR");
    for (const id of ["adela", "neris", "belka", "serin", "kyle"])
      expect(heroById[id].grade).toBe("A");
  });

  it("covers all four primary elements across the expanded operator roster", () => {
    const elements = Object.values(heroById).reduce<Record<string, number>>(
      (acc, h) => ((acc[h.element] = (acc[h.element] ?? 0) + 1), acc),
      {},
    );
    expect(elements).toEqual({ water: 10, fire: 9, electric: 9, dark: 6 });
  });

  it("uses grade-based focus summon costs", () => {
    const m = make();
    expect(m.price("reina")).toBe(35);
    expect(m.price("yuria")).toBe(35);
    expect(m.price("adela")).toBe(85);
    expect(m.price("serin")).toBe(90);
  });

  it("water protocol strengthens water control without adding extra enemies", () => {
    const base = make();
    const boosted = make();
    boosted.builds.water = 3;
    const a = base.addUnit("yuria");
    const b = boosted.addUnit("yuria");
    base.spawn("brute");
    boosted.spawn("brute");
    const ea = base.enemies[0], eb = boosted.enemies[0];
    ea.x = a.x + 30; ea.y = a.y; ea.hp = ea.maxHp = 10000;
    eb.x = b.x + 30; eb.y = b.y; eb.hp = eb.maxHp = 10000;
    attack(base, a, ea);
    attack(boosted, b, eb);
    expect(eb.slow).toBeGreaterThan(ea.slow);
  });

  it.each([
    ["conduct", "yuria", "arin"],
    ["overload", "reina", "arin"],
    ["vaporize", "yuria", "reina"],
    ["blackflame", "reina", "karin"],
    ["corrosion", "yuria", "karin"],
    ["voidshock", "arin", "karin"],
  ] as const)("triggers %s from a two-element sequence", (reaction, primerId, triggerId) => {
    const m = make();
    m.rng = () => 0.99;
    const primer = m.addUnit(primerId);
    const trigger = m.addUnit(triggerId);
    m.spawn("brute");
    const target = m.enemies[0];
    target.x = primer.x + 30;
    target.y = primer.y;
    trigger.x = primer.x;
    trigger.y = primer.y;
    target.hp = target.maxHp = 100000;
    attack(m, primer, target);
    attack(m, trigger, target);
    expect(m.reactionCounts[reaction]).toBeGreaterThan(0);
    expect(target.reactionKind).toBe(reaction);
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
  it('migrates independent audio switches and clamps stored volumes',()=>{
    const base=defaultSave(),saved=parseSave(JSON.stringify({...base,settings:{...base.settings,bgm:false,sfx:true,bgmVolume:1.8,sfxVolume:-.4}}));
    expect(saved.settings).toMatchObject({sound:true,bgm:false,sfx:true,bgmVolume:1,sfxVolume:0});
    const legacy=parseSave(JSON.stringify({...base,settings:{sound:false,shake:true,lowEffects:false,battleSpeed:1}}));
    expect(legacy.settings).toMatchObject({sound:false,bgm:true,sfx:true,bgmVolume:.65,sfxVolume:.8});
  });

  it("migrates legacy Eve/Lize progress to Ian/Leon", () => {
    const legacy = defaultSave() as any;
    legacy.heroes.eve = { ...legacy.heroes.ian, level: 9 };
    legacy.heroes.lize = { ...legacy.heroes.leon, level: 7 };
    delete legacy.heroes.ian;
    delete legacy.heroes.leon;
    legacy.deck = ["eve", "lize", "yuria"];
    legacy.heroes.eve.owned = true;
    legacy.heroes.lize.owned = true;
    const migrated = parseSave(JSON.stringify(legacy));
    expect(migrated.heroes.ian.level).toBe(9);
    expect(migrated.heroes.leon.level).toBe(7);
    expect(migrated.deck).toEqual(["ian", "leon", "yuria"]);
  });
  it("preserves account progress after serializing and reloading", () => {
    const s = defaultSave();
    s.deck = ["ian", "luna"];
    s.heroes.ian.owned = true;
    s.heroes.luna.owned = true;
    s.credits = 950;
    s.heroes.ian.level = 8;
    s.bestWave = 30;
    s.cleared = 1;
    s.tutorial = true;
    s.settings.sound = false;
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
});
describe("endless wave progression", () => {
  it("generates and starts waves beyond the old 30-wave cap", () => {
    const m = make(28);
    m.start();
    m.wave.start(31);
    expect(m.wave.number).toBe(31);
    expect(m.wave.queue.length).toBeGreaterThan(0);
    m.wave.start(100);
    expect(m.wave.number).toBe(100);
    expect(m.wave.data.boss).toBeTruthy();
  });
});

function attack(...args:Parameters<typeof queueAttack>){queueAttack(...args);for(let i=0;i<120;i++)stepActions(args[0],1/60);}
