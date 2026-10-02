import {describe,it,expect} from 'vitest';
import {recruitFrameAt,recruitSequences} from '../src/ui/RecruitSpritePlayer';
describe('authored recruitment frame playback',()=>{
 it('covers all six distinct sequences',()=>expect(recruitSequences).toHaveLength(6));
 it('plays exactly eight authored frames then holds the last',()=>{expect(Array.from({length:8},(_,i)=>recruitFrameAt(i*100,800))).toEqual([0,1,2,3,4,5,6,7]);expect(recruitFrameAt(5000,800)).toBe(7);expect(recruitFrameAt(-1,800)).toBe(0);});
 it('only loops when explicitly requested',()=>{expect(recruitFrameAt(800,800,true)).toBe(0);expect(recruitFrameAt(900,800,true)).toBe(1);expect(recruitFrameAt(900,800)).toBe(7);});
});
