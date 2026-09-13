import {expect,it} from 'vitest';
// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {mkdirSync,writeFileSync} from 'node:fs';
import {BattleModel} from '../src/systems/BattleModel';
import {heroes,heroById} from '../src/data/heroes';
import {defaultSave} from '../src/systems/SaveSystem';
import {seeded} from '../src/utils/random';
import {copiesForStar,investmentForStar} from '../src/data/strategy';
import {elementUpgradeCosts,elementUpgradeMax} from '../src/data/elementUpgrades';
import {gradeCombatBudget} from '../src/data/strategy';
import {attack,stepActions} from '../src/systems/ActionCombat';
import {stepCombat} from '../src/systems/CombatSystem';

const make=()=>new BattleModel(defaultSave(),seeded(709));

it('exports every grade and star upgrade value with cost and raw DPS',()=>{
 const rows=heroes.flatMap(hero=>Array.from({length:5},(_,i)=>{
  const star=i+1,m=make(),u=m.addUnit(hero.id,star),s=m.stats(u);
  return {id:hero.id,name:hero.name,grade:hero.grade,star,copies:copiesForStar(star),investment:investmentForStar(hero.id,star),attack:+s.atk.toFixed(2),attacksPerSecond:+s.speed.toFixed(3),rawDps:+(s.atk*s.speed).toFixed(2),range:+s.range.toFixed(1),crit:+s.crit.toFixed(3),block:s.e.block,slow:+s.e.slow.toFixed(3)};
 }));
 for(const hero of heroes){const own=rows.filter(r=>r.id===hero.id);for(let i=1;i<own.length;i++){expect(own[i].rawDps).toBeGreaterThan(own[i-1].rawDps);expect(own[i].investment).toBeGreaterThan(own[i-1].investment);}}
 const gradeOne=Object.fromEntries(['B','A','S','SR'].map(g=>[g,rows.filter(r=>r.grade===g&&r.star===1).reduce((n,r)=>n+r.rawDps,0)/rows.filter(r=>r.grade===g&&r.star===1).length]));
 expect(gradeOne.A).toBeGreaterThan(gradeOne.B);expect(gradeOne.S).toBeGreaterThan(gradeOne.A);expect(gradeOne.SR).toBeGreaterThan(gradeOne.S);
 mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/upgrade-balance.json',JSON.stringify({generated:'2026-09-09',capacity:10,gradeOneAverageRawDps:gradeOne,rows},null,2));
});
it('uses one five-step battle upgrade per element without increasing range',()=>{
 const m=new BattleModel(defaultSave());m.gold=9999;
 const fire=m.addUnit('reina'),electric=m.addUnit('arin'),dark=m.addUnit('karin'),water=m.addUnit('yuria');
 const before={fire:m.stats(fire),electric:m.stats(electric),dark:m.stats(dark),water:m.stats(water)};
 const spent=elementUpgradeCosts.reduce((a,b)=>a+b,0);
 for(const element of ['water','fire','electric','dark'] as const)for(let i=0;i<elementUpgradeMax;i++)expect(m.upgradeElement(element)).toBe(true);
 expect(m.gold).toBe(9999-spent*4);expect(m.upgradeElement('fire')).toBe(false);
 expect(m.stats(fire).atk).toBeGreaterThan(before.fire.atk);expect(m.stats(electric).speed).toBeGreaterThan(before.electric.speed);
 expect(m.stats(dark).crit).toBeGreaterThan(before.dark.crit);expect(m.stats(water).atk).toBeGreaterThan(before.water.atk);
 for(const [key,u] of Object.entries({fire,electric,dark,water}))expect(m.stats(u).range,key).toBe(before[key as keyof typeof before].range);
});

it('assigns each grade a distinct combat budget and gives A a combination premium',()=>{
 expect(gradeCombatBudget.B.label).toContain('성장');expect(gradeCombatBudget.A.reaction).toBe(.10);expect(gradeCombatBudget.S.base).toBeGreaterThan(gradeCombatBudget.A.base);expect(gradeCombatBudget.SR.base).toBeGreaterThan(gradeCombatBudget.S.base);
});

it('Yuria uses bounded non-stacking slow and exclusive block assignments',()=>{
 const m=make(),a=m.addUnit('yuria',5),b=m.addUnit('yuria',5);a.x=b.x=300;a.y=b.y=300;
 m.spawn('crawler');const e=m.enemies[0];e.x=310;e.y=300;e.hp=e.maxHp=100000;
 attack(m,a,e);for(let i=0;i<20;i++)stepActions(m,.05);const once=e.slow;
 attack(m,b,e);for(let i=0;i<20;i++)stepActions(m,.05);
 expect(once).toBeCloseTo(.395,3);expect(e.slow).toBeCloseTo(once,3);
 const before=e.progress;stepCombat(m,.1);expect(e.progress-before).toBeCloseTo(e.speed*.1*.18,4);
 m.spawn('ravager');const boss=m.enemies[1];boss.x=310;boss.y=300;boss.slow=.9;boss.slowTime=2;const bossBefore=boss.progress;stepCombat(m,.1);expect(boss.progress-bossBefore).toBeGreaterThanOrEqual(boss.speed*.1*.7);
});

it('all relics auto-apply without a reward choice and golden bullet deals its stated extra hit',()=>{
 const m=make();for(let i=0;i<6;i++){expect(m.grantAutomaticRelic()).toBe(true);expect(m.choices).toHaveLength(0);}expect(new Set(m.relics.map(r=>r.id)).size).toBe(6);
 const bullet=make();bullet.bonuses.bullet=1;bullet.rng=()=>0;const u=bullet.addUnit('sera');bullet.spawn('brute');const e=bullet.enemies[0];e.x=u.x+20;e.y=u.y;e.hp=e.maxHp=100000;attack(bullet,u,e);for(let i=0;i<30;i++)stepActions(bullet,.05);const withBullet=100000-e.hp;
 const plain=make();plain.rng=()=>0;const p=plain.addUnit('sera');plain.spawn('brute');const pe=plain.enemies[0];pe.x=p.x+20;pe.y=p.y;pe.hp=pe.maxHp=100000;attack(plain,p,pe);for(let i=0;i<30;i++)stepActions(plain,.05);expect(withBullet).toBeGreaterThan((100000-pe.hp)*1.6);
});
