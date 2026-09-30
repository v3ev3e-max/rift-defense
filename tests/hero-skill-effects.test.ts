import {describe,it,expect} from 'vitest';
import {heroes} from '../src/data/heroes';
import {formationRole} from '../src/data/combatRoles';
import {heroSkillEffects} from '../src/game/HeroSkillEffects';
// @ts-expect-error Node test runtime
import {readFileSync,existsSync} from 'node:fs';
// @ts-expect-error Node test runtime
import {createHash} from 'node:crypto';
describe('caster-owned skill artwork',()=>{
 it('covers every hero with existing personal art and no basic impact fallback',()=>{
  expect(heroes).toHaveLength(44);
  const owners=new Map<string,string>();
  for(const hero of heroes){
   const fx=heroSkillEffects(hero.id);
   for(const path of [fx.cast,fx.projectile,...fx.impact]){
    expect(path).toContain(`/${hero.id}/`);
    expect(existsSync(`public${path}`)).toBe(true);
    expect(path).not.toMatch(/\/impact(?:_|\.)/);
    const hash=createHash('sha256').update(readFileSync(`public${path}`)).digest('hex');
    expect(owners.get(hash)??hero.id).toBe(hero.id);owners.set(hash,hero.id);
   }
  }
 });
 it('sends support to allies and defensive tanks to themselves',()=>{
  for(const hero of heroes){
   const role=formationRole(hero.id);
   expect(heroSkillEffects(hero.id).target).toBe(role==='support'?'allies':role==='tank'?'self':'enemy');
  }
  expect(()=>heroSkillEffects('missing')).toThrow();
 });
});
