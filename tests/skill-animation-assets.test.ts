import {describe,expect,it} from 'vitest';
// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {readFileSync,statSync} from 'node:fs';
// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {createHash} from 'node:crypto';
import {heroes} from '../src/data/heroes';

const hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');

describe('character-specific skill animation assets',()=>{
 it('provides three distinct idle frames for every hero',()=>{
  for(const hero of heroes){
   const frames=Array.from({length:3},(_,i)=>hash(`public/assets/heroes/${hero.id}/frame_${String(i+1).padStart(2,'0')}.png`));
   expect(new Set(frames).size,`${hero.id} idle`).toBe(3);
  }
 });
 it('provides six substantial, globally unique skill frames for all 34 heroes',()=>{
  const skillHashes:string[]=[];
  for(const hero of heroes)for(let frame=1;frame<=6;frame++){
   const path=`public/assets/combat/${hero.id}/skill_${String(frame).padStart(2,'0')}.png`;
   expect(statSync(path).size,`${hero.id} skill ${frame}`).toBeGreaterThan(15_000);
   skillHashes.push(hash(path));
  }
  expect(skillHashes).toHaveLength(heroes.length*6);
  expect(new Set(skillHashes).size).toBe(skillHashes.length);
 });

 it('never aliases a skill frame to an idle, basic-attack or north-facing frame',()=>{
  for(const hero of heroes){
   const skill=new Set(Array.from({length:6},(_,i)=>hash(`public/assets/combat/${hero.id}/skill_${String(i+1).padStart(2,'0')}.png`)));
   const ordinary=[
    `public/assets/heroes/${hero.id}/frame_01.png`,
    ...Array.from({length:8},(_,i)=>`public/assets/combat/${hero.id}/frame_${String(i+1).padStart(2,'0')}.png`),
    ...Array.from({length:6},(_,i)=>`public/assets/combat/${hero.id}/up6_${String(i+1).padStart(2,'0')}.png`),
   ].map(hash);
   expect(ordinary.some(value=>skill.has(value)),hero.id).toBe(false);
  }
 });

 it('keeps support travel and impact phases distinct and gives Yuria a separate barrier',()=>{
  for(const id of ['rhea','echo','meriel','selene','ophilia']){
   const paths=['projectile_01.png','projectile_02.png','projectile_03.png','impact_01.png','impact_02.png','impact_03.png'];
   const hashes=paths.map(name=>hash(`public/assets/effects/${id}/${name}`));
   expect(new Set(hashes).size,id).toBe(6);
  }
  expect(hash('public/assets/effects/yuria/barrier.png')).not.toBe(hash('public/assets/effects/yuria/skill.png'));
 });
});
