import {it,expect} from 'vitest';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {attack} from '../src/systems/CombatSystem';
it('faces the actual shot target and holds horizontal direction for vertical shots',()=>{
 const m=new BattleModel(defaultSave());const u=m.addUnit('sera');m.spawn('brute');const e=m.enemies[0];e.hp=e.maxHp=1e8;e.y=u.y;
 e.x=u.x-40;attack(m,u,e);expect(u.facingLeft).toBe(true);
 e.x=u.x+40;attack(m,u,e);expect(u.facingLeft).toBe(false);
 e.x=u.x;e.y=u.y-80;attack(m,u,e);expect(u.facingLeft).toBe(false);expect(u.facingUp).toBe(true);
 e.y=u.y+80;attack(m,u,e);expect(u.facingUp).toBe(false);
});
