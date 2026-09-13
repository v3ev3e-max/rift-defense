import {it,expect} from 'vitest';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {reactionShot,attack,stepActions} from '../src/systems/ActionCombat';
it('a recycled reaction projectile becomes a normal attack with normal damage attribution',()=>{
 const m=new BattleModel(defaultSave(),()=>.99),u=m.addUnit('sera');m.spawn('brute');const e=m.enemies[0];e.hp=e.maxHp=100000;e.x=u.x+40;e.y=u.y;
 reactionShot(m,u,u,e,10,0,'electric');stepActions(m,.3);expect(m.actions[0].active).toBe(false);
 attack(m,u,e);expect(m.actions[0].reactionOnly).toBe(false);stepActions(m,.3);expect(m.records[0].parts.basic).toBeGreaterThan(0);
});
