import {describe,expect,it} from 'vitest';
import {defaultSave} from '../src/systems/SaveSystem';
import {operationsScreen} from '../src/ui/OperationsUI';

describe('special operations hub',()=>{
 it('exposes all eight additional content modes with actionable entries',()=>{const html=operationsScreen(defaultSave());for(const name of ['무한 방어전','속성 균열','영웅 개인 작전','보스 연속 토벌','제약 작전','장비 세트','월드 보스','고난도 세계선'])expect(html).toContain(name);expect((html.match(/data-action="ops-/g)??[]).length).toBe(8);});
});
