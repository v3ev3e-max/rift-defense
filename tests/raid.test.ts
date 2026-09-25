import {describe,expect,it} from 'vitest';
import {defaultSave,parseSave} from '../src/systems/SaveSystem';
import {RAID_DAILY_ATTEMPTS,raidAutoDamage,raidBossMaxHp,raidBossTuning,raidDropEligible,raidManualDamage,raidPatternDamage,raidRank,refreshRaid,weeklyRaidBosses} from '../src/data/raid';
import {equipItem,makeEquipment,raidEquipmentBonus,raidEquipmentCatalog} from '../src/data/equipment';
import {raidScreen} from '../src/ui/RaidUI';
// @ts-expect-error Vitest runs in Node; the browser build intentionally omits Node typings.
import {statSync} from 'node:fs';

describe('weekly boss raid',()=>{
 it('rotates exactly three bosses and resets daily attempts without erasing weekly damage',()=>{
  const save=defaultSave(),day=new Date('2026-09-25T00:00:00Z');refreshRaid(save,day);save.raid.attempts=0;save.raid.weeklyDamage=345678;
  refreshRaid(save,new Date('2026-09-26T00:00:00Z'));expect(save.raid.attempts).toBe(RAID_DAILY_ATTEMPTS);expect(save.raid.weeklyDamage).toBe(345678);expect(new Set(weeklyRaidBosses(day).map(v=>v.id)).size).toBe(3);
 });
 it('migrates old saves and renders five-member 180-second entry rules',()=>{
  Object.assign(globalThis,{window:{}});const save=defaultSave(),raw=JSON.parse(JSON.stringify(save));delete raw.raid;const migrated=parseSave(JSON.stringify(raw)),html=raidScreen(migrated);expect(migrated.raid.attempts).toBe(3);expect(html).toContain('제한 시간 180초');expect(html).toContain('레이드 시작');expect(html).toContain('보스 전용 장비');expect(html).toContain('거신의 풍압 장갑');
 });
 it('assigns increasing weekly ranks',()=>{expect(['브론즈','실버','골드','플래티넘','다이아']).toEqual([0,350000,800000,1500000,2500000].map(raidRank));});
 it('makes manual timing meaningfully stronger than AUTO alone',()=>{const power=1000,autoOnly=raidAutoDamage(power,true)*180,manual=autoOnly+raidManualDamage(power)*15;expect(manual).toBeGreaterThan(autoOnly*1.6);});
 it('settles the previous weekly rank on rollover',()=>{const save=defaultSave();save.raid.week='2026-W01';save.raid.weeklyBest=1600000;const before=save.credits;refreshRaid(save,new Date('2026-09-25T00:00:00Z'));expect(save.credits).toBe(before+800);expect(save.raid.lastSettlement).toContain('플래티넘');});
 it('ships non-empty raid boss action and projectile atlases',()=>{for(const file of ['raid-boss-actions.png','raid-pattern-vfx.png'])expect(statSync(`public/assets/generated/raid-bosses/${file}`).size).toBeGreaterThan(500000);});
 it('raises boss durability, attack and tempo through the boss roster',()=>{const ids=Object.keys(raidBossTuning) as (keyof typeof raidBossTuning)[];const hp=ids.map(id=>raidBossMaxHp(5000,id)),attack=ids.map(id=>raidPatternDamage(3,id));expect(hp).toEqual([...hp].sort((a,b)=>a-b));expect(attack).toEqual([...attack].sort((a,b)=>a-b));expect(ids.map(id=>raidBossTuning[id].tempo)).toEqual([12,11,12,10,9]);});
 it('applies equipped boss gear to real raid formulas',()=>{const save=defaultSave();save.equipmentInventory=[];const ids=save.campaign!.squad.slice(0,2),solar=makeEquipment('raid-solar-sigil','SR',1,'solar'),voidLens=makeEquipment('raid-void-lens','SR',2,'void');save.equipmentInventory.push(solar,voidLens);equipItem(save,ids[0],solar.id);equipItem(save,ids[1],voidLens.id);const b=raidEquipmentBonus(save,ids);expect(b.damage).toBe(.12);expect(b.manual).toBe(.2);expect(raidManualDamage(1000,5,b.damage,b.manual)).toBeGreaterThan(raidManualDamage(1000));expect(raidEquipmentCatalog).toHaveLength(5);});
 it('drops boss gear only after meaningful damage and guarantees a kill drop',()=>{expect(raidDropEligible(.34,0)).toBe(false);expect(raidDropEligible(.35,.29)).toBe(true);expect(raidDropEligible(.35,.31)).toBe(false);expect(raidDropEligible(1,.99)).toBe(true);});
});
