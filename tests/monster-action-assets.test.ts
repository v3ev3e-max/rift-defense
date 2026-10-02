import {describe,it,expect} from 'vitest';
import {monsterActionOwner,monsterActionPath} from '../src/game/MonsterActionAssets';
describe('monster action ownership',()=>{
 it('finds explicit shared visual aliases without pretending to generate new characters',()=>{
  expect(monsterActionOwner('named_meadow','elite')).toBe('elite');
  expect(monsterActionOwner('crawler')).toBe('crawler');
 });
 it('never mixes a regional creature with a generic design',()=>{
  expect(monsterActionOwner('crawler',undefined,1,true)).not.toBe('crawler');
  expect(monsterActionOwner('crawler',undefined,99,true)).toBeUndefined();
 });
 it('keeps absent authored files out of loading',()=>expect(monsterActionOwner('unmade')).toBeUndefined());
 it('uses owned finite frame paths',()=>expect(monsterActionPath('crawler','hit',3)).toBe('/assets/generated/monster-actions-v2/crawler/hit/frame_03.webp'));
});
