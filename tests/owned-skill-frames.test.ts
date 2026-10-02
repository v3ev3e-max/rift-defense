import {describe,it,expect} from 'vitest';
import {ownedSkillImpactPaths} from '../src/game/OwnedSkillFrames';
import {heroSkillEffects} from '../src/game/HeroSkillEffects';
describe('validated owned skill frames',()=>{
 it('connects Reina six authored impact frames to raid and campaign metadata',()=>{
  const paths=ownedSkillImpactPaths('reina');expect(paths).toHaveLength(6);
  expect(heroSkillEffects('reina').impact).toEqual(paths);
  expect(new Set(paths).size).toBe(6);
 });
 it('does not pretend unfinished owners have new authored art',()=>expect(ownedSkillImpactPaths('arin')).toEqual([]));
});
