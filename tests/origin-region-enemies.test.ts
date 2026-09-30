import {describe,it,expect} from 'vitest';
import {enemies} from '../src/data/enemies';
// @ts-expect-error Node test runtime
import {existsSync,readFileSync} from 'node:fs';
// @ts-expect-error Node test runtime
import {createHash} from 'node:crypto';

const rosters:Record<number,string[]>={
 13:['crystal_bastion','tide_skimmer','prism_cannon','coral_singer'],
 14:['lunar_husk','spore_leaper','moon_ray','bloom_keeper'],
 15:['stellar_plate','plasma_hound','nova_turret','forge_conductor'],
 16:['origin_warden','causal_blade','genesis_eye','fate_weaver'],
};
describe('origin worldline regional monsters',()=>{
 it('uses sixteen unique identities without legacy visual aliases',()=>{
  const hashes:string[]=[];
  for(const [area,ids] of Object.entries(rosters))for(const id of ids){
   expect(enemies[id].visualId).toBeUndefined();
   const base=`public/assets/generated/campaign-enemies/map-${area}/${id}`;
   expect(existsSync(`${base}.webp`)).toBe(true);
   for(let n=1;n<=6;n++)expect(existsSync(`${base}/move/move_${String(n).padStart(2,'0')}.webp`)).toBe(true);
   for(let n=1;n<=3;n++)expect(existsSync(`${base}/death/frame_${String(n).padStart(2,'0')}.webp`)).toBe(true);
   if(enemies[id].ranged)for(let n=1;n<=3;n++)expect(existsSync(`${base}/fire/frame_${String(n).padStart(2,'0')}.webp`)).toBe(true);
   hashes.push(createHash('sha256').update(readFileSync(`${base}.webp`)).digest('hex'));
  }
  expect(new Set(hashes).size).toBe(16);
 });
 it('provides distinct region projectile, impact and step effects',()=>{
  const hashes:string[]=[];
  for(const area of Object.keys(rosters))for(const [type,count] of [['projectile',3],['impact',3],['step',4]] as const)for(let n=1;n<=count;n++){
   const path=`public/assets/generated/campaign-enemies/map-${area}/fx/${type}/frame_${String(n).padStart(2,'0')}.webp`;
   expect(existsSync(path)).toBe(true);hashes.push(createHash('sha256').update(readFileSync(path)).digest('hex'));
  }
  expect(new Set(hashes).size).toBe(hashes.length);
 });
});
