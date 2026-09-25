import {describe,expect,it} from 'vitest';
import {defaultSave,parseSave} from '../src/systems/SaveSystem';
import {RAID_DAILY_ATTEMPTS,raidAutoDamage,raidManualDamage,raidRank,refreshRaid,weeklyRaidBosses} from '../src/data/raid';
import {raidScreen} from '../src/ui/RaidUI';
// @ts-expect-error Vitest runs in Node; the browser build intentionally omits Node typings.
import {statSync} from 'node:fs';

describe('weekly boss raid',()=>{
 it('rotates exactly three bosses and resets daily attempts without erasing weekly damage',()=>{
  const save=defaultSave(),day=new Date('2026-09-25T00:00:00Z');refreshRaid(save,day);save.raid.attempts=0;save.raid.weeklyDamage=345678;
  refreshRaid(save,new Date('2026-09-26T00:00:00Z'));expect(save.raid.attempts).toBe(RAID_DAILY_ATTEMPTS);expect(save.raid.weeklyDamage).toBe(345678);expect(new Set(weeklyRaidBosses(day).map(v=>v.id)).size).toBe(3);
 });
 it('migrates old saves and renders five-member 180-second entry rules',()=>{
  Object.assign(globalThis,{window:{}});const save=defaultSave(),raw=JSON.parse(JSON.stringify(save));delete raw.raid;const migrated=parseSave(JSON.stringify(raw));expect(migrated.raid.attempts).toBe(3);expect(raidScreen(migrated)).toContain('제한 시간 180초');expect(raidScreen(migrated)).toContain('레이드 시작');
 });
 it('assigns increasing weekly ranks',()=>{expect(['브론즈','실버','골드','플래티넘','다이아']).toEqual([0,350000,800000,1500000,2500000].map(raidRank));});
 it('makes manual timing meaningfully stronger than AUTO alone',()=>{const power=1000,autoOnly=raidAutoDamage(power,true)*180,manual=autoOnly+raidManualDamage(power)*15;expect(manual).toBeGreaterThan(autoOnly*1.6);});
 it('settles the previous weekly rank on rollover',()=>{const save=defaultSave();save.raid.week='2026-W01';save.raid.weeklyBest=1600000;const before=save.credits;refreshRaid(save,new Date('2026-09-25T00:00:00Z'));expect(save.credits).toBe(before+800);expect(save.raid.lastSettlement).toContain('플래티넘');});
 it('ships non-empty raid boss action and projectile atlases',()=>{for(const file of ['raid-boss-actions.png','raid-pattern-vfx.png'])expect(statSync(`public/assets/generated/raid-bosses/${file}`).size).toBeGreaterThan(500000);});
});
