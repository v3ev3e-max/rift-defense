import {describe,expect,it} from 'vitest';
import {defaultSave,parseSave} from '../src/systems/SaveSystem';
import {RECRUIT_S_PITY,recruit} from '../src/systems/RecruitSystem';

describe('hero recruitment',()=>{
 it('guarantees A or higher in a ten pull and converts duplicates to fragments',()=>{const s=defaultSave(),result=recruit(s,10,()=>.99);expect(result).toHaveLength(10);expect(result.some(v=>v.grade!=='B')).toBe(true);expect(result.every(v=>!v.newHero&&v.fragments>0)).toBe(true);});
 it('guarantees S or SSR at pity and resets the counter',()=>{const s=defaultSave();s.recruitPity=RECRUIT_S_PITY-1;const [result]=recruit(s,1,()=>.5);expect(['S','SR']).toContain(result.grade);expect(s.recruitPity).toBe(0);});
 it('migrates recruitment progress safely',()=>{const s=defaultSave() as any;delete s.recruitPity;delete s.recruitCount;expect(parseSave(JSON.stringify(s))).toMatchObject({recruitPity:0,recruitCount:0});});
});
