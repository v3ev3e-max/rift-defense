import {describe,expect,it} from 'vitest';
// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {statSync} from 'node:fs';
import type {Unit} from '../src/entities/HeroUnit';
import {heroAuras} from '../src/game/SkillVisuals';
import {heroes} from '../src/data/heroes';

const unit=():Unit=>({uid:1,heroId:'rhea',star:1,slot:0,hp:100,maxHp:100,cooldown:0,droneCooldown:0,shots:0,droneShots:0,damage:0,stunned:0,x:100,y:100});

describe('skill and buff visuals',()=>{
 it('keeps a dedicated skill image for every hero instead of reusing a basic attack',()=>{
  for(const hero of heroes)expect(statSync(`public/assets/effects/${hero.id}/skill.png`).size,hero.id).toBeGreaterThan(5_000);
 });
 it('shows a hero-colored skill aura for every active skill window',()=>{
  const u=unit();u.skillEffectUntil=5;
  expect(heroAuras(u,1,0x123456)).toContainEqual({kind:'skill',color:0x123456,strength:1});
  expect(heroAuras(u,5,0x123456)).toHaveLength(0);
 });

 it('distinguishes healing, haste, offense and guard buffs',()=>{
  const u=unit();u.supportRegenUntil=3;u.supportSpeedUntil=3;u.supportAttackUntil=3;u.damageReductionUntil=3;
  expect(heroAuras(u,1,0xffffff).map(v=>v.kind)).toEqual(['heal','haste','offense','guard']);
 });

 it('removes each persistent aura when its gameplay effect expires',()=>{
  const u=unit();u.supportChargeUntil=2;u.supportCritUntil=4;u.projectileGuardUntil=6;
  expect(heroAuras(u,1,0xffffff).map(v=>v.kind)).toEqual(['haste','offense','guard']);
  expect(heroAuras(u,3,0xffffff).map(v=>v.kind)).toEqual(['offense','guard']);
  expect(heroAuras(u,6,0xffffff)).toEqual([]);
 });
});
