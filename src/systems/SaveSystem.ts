import { heroes } from "../data/heroes";
import type { SaveData } from "../data/types";
export const SAVE_KEY = "rift-defense-save-v1";
export function defaultSave(): SaveData {
  return {
    saveVersion: 1,
    credits: 500,
    shards: 0,
    heroes: Object.fromEntries(
      heroes.map((h) => [
        h.id,
        {
          level: 1,
          breakthrough: 0,
          skillLevel: 1,
          equipment: [],
          affection: 0,
        },
      ]),
    ),
    deck: heroes.map((h) => h.id),
    cleared: 0,
    bestWave: 0,
    runs: 0,
    tutorial: false,
    settings: { sound: true, shake: false, lowEffects: false },
  };
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
    d.shards = integer(s.shards, 0);
    d.cleared = integer(s.cleared, 0, 1);
    d.bestWave = integer(s.bestWave, 0, 30);
    d.runs = integer(s.runs, 0);
    d.tutorial = s.tutorial === true;
    for (const h of heroes) {
      const p = s.heroes?.[h.id];
      if (p)
        d.heroes[h.id] = {
          level: Math.max(1, integer(p.level, 1, 50)),
          breakthrough: integer(p.breakthrough, 0, 5),
          skillLevel: Math.max(1, integer(p.skillLevel, 1, 10)),
          equipment: Array.isArray(p.equipment)
            ? p.equipment
                .filter((x: unknown) => typeof x === "string")
                .slice(0, 4)
            : [],
          affection: integer(p.affection, 0, 100),
        };
    }
    if (Array.isArray(s.deck)) {
      const deck = [
        ...new Set<string>(
          s.deck.filter(
            (id: unknown) =>
              typeof id === "string" && heroes.some((h) => h.id === id),
          ),
        ),
      ].slice(0, 10);
      if (deck.length) d.deck = deck;
    }
    if (s.settings)
      for (const k of ["sound", "shake", "lowEffects"] as const)
        if (typeof s.settings[k] === "boolean") d.settings[k] = s.settings[k];
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
