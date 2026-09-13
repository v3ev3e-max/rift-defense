import {expect,it} from 'vitest';
import {heroes} from '../src/data/heroes';
import {formationRole,supportOperatorIds} from '../src/data/combatRoles';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {castAutoSkill} from '../src/systems/ActionCombat';

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
