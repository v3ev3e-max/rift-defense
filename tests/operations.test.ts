import {describe,expect,it} from 'vitest';
import {defaultSave} from '../src/systems/SaveSystem';
import {operationsScreen} from '../src/ui/OperationsUI';
// @ts-expect-error Vitest runs in Node; browser build omits Node typings.
import {statSync} from 'node:fs';

describe('special operations hub',()=>{
 it('exposes all eight additional content modes with actionable entries',()=>{Object.assign(globalThis,{window:{}});const html=operationsScreen(defaultSave());for(const name of ['무한 방어전','속성 균열','영웅 개인 작전','보스 연속 토벌','제약 작전','장비 세트','월드 보스','고난도 세계선'])expect(html).toContain(name);expect((html.match(/data-action="ops-/g)??[]).length).toBe(8);});
 it('ships every operation, rift and boss-gear image as a non-empty asset',()=>{const ops=['infinite','rift','hero','boss-rush','constraint','sets','world-boss','hard-worldline'];for(const id of ops)for(const kind of ['icons','banners'])expect(statSync(`public/assets/generated/operations/${kind}/${id}.webp`).size).toBeGreaterThan(50000);for(const id of ['water','fire','electric','dark'])expect(statSync(`public/assets/generated/operations/rifts/${id}.webp`).size).toBeGreaterThan(100000);for(const id of ['raid-gale-aegis','raid-void-lens','raid-machine-core','raid-solar-sigil','raid-aeon-clock'])expect(statSync(`public/assets/generated/raid-gear/${id}.webp`).size).toBeGreaterThan(100000);});
});
