import {it,expect} from 'vitest';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {grantShield,expireShield} from '../src/systems/TimedShield';
import {castAutoSkill,supportBasic,skillDurationSeconds} from '../src/systems/ActionCombat';
it('cannot bank unbounded shields by repeated support basic attacks',()=>{
 const m=new BattleModel(defaultSave()),support=m.addUnit('meriel'),ally=m.addUnit('reina');support.x=ally.x;support.y=ally.y;
 for(let i=0;i<100;i++)supportBasic(m,support);
 expect(ally.guardHp).toBeLessThan(ally.maxHp*.02);expect(ally.guardUntil).toBe(2.2);
});
it('a weaker shield cannot indefinitely extend a stronger skill shield',()=>{
 const m=new BattleModel(defaultSave()),u=m.addUnit('yuria');grantShield(u,u.maxHp*.5,0,5);grantShield(u,u.maxHp*.02,4,5);
 expect(u.guardUntil).toBe(5);expireShield(u,5);expect(u.guardHp).toBe(0);
});
it('tank shields expire at the advertised skill duration and casts do not stack',()=>{
 const m=new BattleModel(defaultSave()),u=m.addUnit('astra');m.start();u.skillCharge=100;castAutoSkill(m,u);const initial=u.guardHp;
 u.skillReadyAt=0;u.skillCharge=100;castAutoSkill(m,u);expect(u.guardHp).toBe(initial);
 m.time=skillDurationSeconds(u.heroId,u.star);const hp=u.hp;m.hurtUnit(u,10);expect(u.guardHp).toBe(0);expect(u.hp).toBeLessThan(hp);
});
