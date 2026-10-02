import {describe,it,expect} from 'vitest';
import {authoredFrameKeys,authoredFrameAt} from '../src/game/AuthoredFrames';
describe('finite authored sprite sheets',()=>{
 it('plays all three impact frames in discrete order and holds the last',()=>{
  const keys=authoredFrameKeys(3);
  expect(keys.map(k=>k.backgroundPosition)).toEqual(['0% 0%','50% 0%','100% 0%','100% 0%']);
  expect(keys.map(k=>k.offset)).toEqual([0,1/3,2/3,1]);
  expect(keys.every(k=>k.easing==='steps(1,end)')).toBe(true);
 });
 it('keeps single frame poses still',()=>expect(authoredFrameKeys(1).map(k=>k.backgroundPosition)).toEqual(['0% 0%','0% 0%']));
 it('rejects impossible sheet sizes',()=>{for(const n of [0,-1,1.5,NaN])expect(()=>authoredFrameKeys(n)).toThrow();});
 it('selects discrete RAF frames without wrapping',()=>expect([0,200,400,600,1000].map(t=>authoredFrameAt(t,600,3))).toEqual([0,1,2,2,2]));
});
