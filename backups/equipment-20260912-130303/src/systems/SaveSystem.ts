import { heroes } from "../data/heroes";
import type { SaveData } from "../data/types";
import {formationRole,formationSlots} from '../data/combatRoles';
export const SAVE_KEY = "rift-defense-save-v1";
const LEGACY_HERO_IDS: Record<string, string> = { eve: "ian", lize: "leon" };
export const STARTER_HERO_IDS=['yuria','sera','reina','karin','arin'];
export function validCampaignSquad(ids:string[],owned:Set<string>){
  const pool=[...new Set(ids)].filter(id=>owned.has(id)&&!!heroes.find(h=>h.id===id));
  const result:string[]=[];
  for(const role of formationSlots){
    const id=pool.find(id=>formationRole(id)===role&&!result.includes(id))??STARTER_HERO_IDS.find(id=>formationRole(id)===role&&!result.includes(id));
    if(id)result.push(id);
  }
  return result;
}
export function defaultSave(): SaveData {
  return {
    saveVersion: 1,
    credits: 500,
    shards: 0,
    heroes: Object.fromEntries(
      heroes.map((h) => [
        h.id,
        {
          owned: STARTER_HERO_IDS.includes(h.id),
          level: 1,
          breakthrough: 0,
          skillLevel: 1,
          equipment: [],
          affection: 0,
        },
      ]),
    ),
    deck: [...STARTER_HERO_IDS],
    cleared: 0,
    bestWave: 0,
    runs: 0,
    tutorial: false,
    settings: { sound: true, shake: false, lowEffects: false },
    campaign:{selected:'1-1',doctrine:'rapid',squad:[...STARTER_HERO_IDS],records:{},research:{},fragments:{}},
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
    d.bestWave = integer(s.bestWave, 0, 999999);
    d.runs = integer(s.runs, 0);
    d.tutorial = s.tutorial === true;
    if(s.campaign){
      const c=d.campaign!;
      c.doctrine=['rapid','focus','guard'].includes(s.campaign.doctrine??'')?s.campaign.doctrine:'rapid';
      if(['1-1','1-2','1-3','1-4'].includes(s.campaign.selected))c.selected=s.campaign.selected;
      for(const id of ['1-1','1-2','1-3','1-4']){const r=s.campaign.records?.[id];if(r&&integer(r.stars,0,3)>0)c.records[id]={stars:integer(r.stars,0,3),time:integer(r.time,0),kills:integer(r.kills,0)};}
      for(const [key,value] of Object.entries(s.campaign.research??{}))if(/^(water|fire|electric|dark|burst|sniper|melee|chain|meteor|shell|drone|support|curse)$/.test(key))c.research[key]=integer(value,0,10);
      for(const h of heroes)if(s.campaign.fragments?.[h.id]!==undefined)c.fragments[h.id]=integer(s.campaign.fragments[h.id],0,999);
    }
    for (const h of heroes) {
      const legacyId = Object.entries(LEGACY_HERO_IDS).find(([, next]) => next === h.id)?.[0];
      const p = s.heroes?.[h.id] ?? (legacyId ? s.heroes?.[legacyId] : undefined);
      if (p)
        d.heroes[h.id] = {
          owned: p.owned===true || STARTER_HERO_IDS.includes(h.id),
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
    const owned=new Set(heroes.filter(h=>d.heroes[h.id].owned).map(h=>h.id));
    if(Array.isArray(s.campaign?.squad))d.campaign!.squad=validCampaignSquad(s.campaign.squad.map((id:string)=>LEGACY_HERO_IDS[id]??id),owned);
    if (Array.isArray(s.deck)) {
      const deck = [
        ...new Set<string>(
          s.deck
            .filter((id: unknown): id is string => typeof id === "string")
            .map((id: string) => LEGACY_HERO_IDS[id] ?? id)
            .filter((id: string) => heroes.some((h) => h.id === id)&&d.heroes[id].owned),
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
