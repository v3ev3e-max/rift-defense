import {describe,expect,it} from 'vitest';
import {heroes} from '../src/data/heroes';
import {heroActionOwners,heroAttackFrameCount,heroAttackFramePath,heroAttackSheetPath} from '../src/game/HeroActionAssets';

describe('authored hero attack registry',()=>{
 it('covers the complete roster without a placeholder fallback',()=>{
  expect(heroActionOwners.size).toBe(heroes.length);
  expect([...heroActionOwners].sort()).toEqual(heroes.map(h=>h.id).sort());
 });
 it('uses eight owned frames and one owned raid sheet',()=>{
  expect(heroAttackFrameCount).toBe(8);
  for(const hero of heroes){
   expect(heroAttackFramePath(hero.id,1)).toContain(`/hero-attacks-v3/${hero.id}/frame_01.webp`);
   expect(heroAttackSheetPath(hero.id)).toContain(`/hero-attacks-v3/${hero.id}/sheet.webp`);
  }
 });
});
