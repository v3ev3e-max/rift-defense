import {expect,it} from 'vitest';
import {heroes} from '../src/data/heroes';
import {formationRole,supportOperatorIds} from '../src/data/combatRoles';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {castAutoSkill,supportBasic} from '../src/systems/ActionCombat';
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
 expect(supportBasic(m,support)).toBe(true);
 expect(enemy.hp).toBe(before);
 expect((ally.hp>ally.maxHp*.5)||(ally.guardHp??0)>0||(ally.supportAttackUntil??0)>0||(ally.supportSpeedUntil??0)>0).toBe(true);
});

it('shows configured duration and active remaining time in the battle skill UI',()=>{
 (globalThis as unknown as {window:unknown}).window={};
 const m=new BattleModel(defaultSave()),support=m.addUnit('rhea');m.started=true;support.skillCharge=100;
 expect(campaignSkillBar(m)).toContain('지속 4.3초');
 expect(castAutoSkill(m,support)).toBe(true);
 expect(campaignSkillBar(m)).toContain('효과 4.3초');
});

it('gives every support operator a distinct persistent team role',()=>{
 const cast=(id:string)=>{const m=new BattleModel(defaultSave(),()=>.99),support=m.addUnit(id),ally=m.addUnit('yuria');ally.x=support.x+20;ally.y=support.y;ally.hp=ally.maxHp*.5;support.skillCharge=100;expect(castAutoSkill(m,support)).toBe(true);return ally;};
 expect(cast('rhea').supportRegenUntil).toBeGreaterThan(0);
 expect(cast('echo').supportChargeUntil).toBeGreaterThan(0);
 expect(cast('meriel').supportAttackUntil).toBeGreaterThan(0);
 expect(cast('selene').supportCritUntil).toBeGreaterThan(0);
 expect(cast('ophilia').damageReductionUntil).toBeGreaterThan(0);
});
