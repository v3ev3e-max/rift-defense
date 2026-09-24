import {describe,expect,it} from 'vitest';
import {commanders,commanderPortrait,defaultCommanderId} from '../src/data/commanders';
import {defaultSave,parseSave} from '../src/systems/SaveSystem';

describe('test commander roster',()=>{
  it('provides eight women and two men with usable portrait assets',()=>{
    expect(commanders).toHaveLength(10);
    expect(commanders.filter(v=>v.gender==='female')).toHaveLength(8);
    expect(commanders.filter(v=>v.gender==='male')).toHaveLength(2);
    expect(new Set(commanders.map(v=>commanderPortrait(v.id))).size).toBe(10);
  });
  it('persists a valid selection and safely migrates older saves',()=>{
    const save=defaultSave();save.commanderId='commander-10';
    expect(parseSave(JSON.stringify(save)).commanderId).toBe('commander-10');
    delete (save as Partial<typeof save>).commanderId;
    expect(parseSave(JSON.stringify(save)).commanderId).toBe(defaultCommanderId);
  });
});
