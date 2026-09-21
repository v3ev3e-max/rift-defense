import {expect,it} from 'vitest';
import {heroes} from '../src/data/heroes';
import {formationRole,supportOperatorIds} from '../src/data/combatRoles';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {castAutoSkill,skillCooldownSeconds,skillDurationSeconds,stepActions,supportBasic} from '../src/systems/ActionCombat';
import {campaignSkillBar} from '../src/ui/CampaignUI';

const supportIds=['rhea','echo','meriel','selene','ophilia'];

it('registers the requested B2 A1 S1 SR1 support roster',()=>{
 expect([...supportOperatorIds]).toEqual(supportIds);
 expect(supportIds.map(id=>formationRole(id))).toEqual(Array(5).fill('support'));
 expect(supportIds.map(id=>heroes.find(h=>h.id===id)!.grade).sort()).toEqual(['A','B','B','S','SR']);
});

it('casts support healing and the authored skill effect',()=>{
 const m=new BattleModel(defaultSave(),()=>.99),support=m.addUnit('rhea'),ally=m.addUnit('yuria');
 m.spawn('brute');const target=m.enemies[0];target.x=support.x+40;target.y=support.y;ally.hp=ally.maxHp*.4;support.skillCharge=100;
 expect(castAutoSkill(m,support,target)).toBe(true);
 expect(ally.hp).toBeGreaterThan(ally.maxHp*.4);
 expect(m.effects.some(f=>f.visual==='support-skill-rhea')).toBe(true);
});

it.each(supportIds)('%s replaces enemy basic damage with ally support',id=>{
 const m=new BattleModel(defaultSave(),()=>.99),support=m.addUnit(id),ally=m.addUnit('yuria');
 m.spawn('brute');const enemy=m.enemies[0],before=enemy.hp;ally.x=support.x+20;ally.y=support.y;ally.hp=ally.maxHp*.5;
 const shots=support.shots;
 expect(supportBasic(m,support)).toBe(true);
 expect(enemy.hp).toBe(before);
 expect(support.shots).toBe(shots+1);
 expect(support.lastAttackAt).toBe(m.time);
 expect((ally.hp>ally.maxHp*.5)||(ally.guardHp??0)>0||(ally.supportAttackUntil??0)>0||(ally.supportSpeedUntil??0)>0).toBe(true);
});

it('shows configured duration and active remaining time in the battle skill UI',()=>{
 (globalThis as unknown as {window:unknown}).window={};
 const m=new BattleModel(defaultSave()),support=m.addUnit('rhea');m.started=true;support.skillCharge=100;
 expect(campaignSkillBar(m)).toContain('지속 6.4초');
 expect(castAutoSkill(m,support)).toBe(true);
 expect(campaignSkillBar(m)).toContain('효과 6.4초');
});

it('keeps support burst values below the former overpowered caps',()=>{
 const cast=(id:string)=>{const m=new BattleModel(defaultSave(),()=>.99),support=m.addUnit(id),ally=m.addUnit('yuria');support.star=5;ally.x=support.x+20;ally.y=support.y;ally.hp=ally.maxHp*.4;support.skillCharge=100;const before=ally.hp;expect(castAutoSkill(m,support)).toBe(true);return {m,support,ally,heal:(ally.hp-before)/ally.maxHp};};
 const rhea=cast('rhea');expect(rhea.heal).toBeLessThanOrEqual(.10);expect(rhea.ally.supportRegenRate).toBeCloseTo(.01);
 const echo=cast('echo');expect(echo.ally.supportSpeedBonus).toBeLessThanOrEqual(.16);expect(echo.ally.skillCharge).toBeLessThanOrEqual(10);
 const meriel=cast('meriel');expect(meriel.ally.guardHp!/meriel.ally.maxHp).toBeLessThanOrEqual(.101);expect(meriel.ally.supportAttackBonus).toBeLessThanOrEqual(.14);
 const selene=cast('selene');expect(selene.ally.supportAttackBonus).toBeLessThanOrEqual(.13);expect(selene.ally.supportCritBonus).toBeLessThanOrEqual(.11);
 const ophilia=cast('ophilia');expect(ophilia.heal).toBeLessThanOrEqual(.14);expect(ophilia.ally.guardHp!/ophilia.ally.maxHp).toBeLessThanOrEqual(.096);
});

it('gives every support a cooldown substantially longer than its persistent effect',()=>{
 const expected:Record<string,number>={rhea:22,echo:20,meriel:22,selene:20,ophilia:30};
 for(const id of supportIds)for(const star of [1,5]){
  expect(skillCooldownSeconds(id),id).toBe(expected[id]);
  expect(skillCooldownSeconds(id)-skillDurationSeconds(id,star),`${id} ★${star}`).toBeGreaterThanOrEqual(12);
 }
});

it('delivers healer recovery over time and stops exactly when its duration ends',()=>{
 const m=new BattleModel(defaultSave(),()=>.99),support=m.addUnit('rhea'),ally=m.addUnit('yuria');support.star=5;ally.x=support.x+20;ally.y=support.y;ally.hp=ally.maxHp*.4;support.skillCharge=100;
 const before=ally.hp;expect(castAutoSkill(m,support)).toBe(true);const afterCast=ally.hp,duration=skillDurationSeconds('rhea',5);
 expect((afterCast-before)/ally.maxHp).toBeCloseTo(.1);
 for(let elapsed=0;elapsed<duration;elapsed+=.1){m.time+=.1;stepActions(m,.1);}
 const afterDuration=ally.hp;expect(afterDuration).toBeGreaterThan(afterCast);expect((afterDuration-afterCast)/ally.maxHp).toBeLessThanOrEqual(.081);
 m.time+=1;stepActions(m,1);expect(ally.hp).toBeCloseTo(afterDuration);
 expect(support.skillReadyAt!-m.time).toBeGreaterThan(12);
});

it('gives every support operator a distinct persistent team role',()=>{
 const cast=(id:string)=>{const m=new BattleModel(defaultSave(),()=>.99),support=m.addUnit(id),ally=m.addUnit('yuria');ally.x=support.x+20;ally.y=support.y;ally.hp=ally.maxHp*.5;support.skillCharge=100;expect(castAutoSkill(m,support)).toBe(true);return ally;};
 expect(cast('rhea').supportRegenUntil).toBeGreaterThan(0);
 expect(cast('echo').supportChargeUntil).toBeGreaterThan(0);
 expect(cast('meriel').supportAttackUntil).toBeGreaterThan(0);
 expect(cast('selene').supportCritUntil).toBeGreaterThan(0);
 expect(cast('ophilia').damageReductionUntil).toBeGreaterThan(0);
});
