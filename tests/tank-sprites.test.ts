// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {existsSync,readFileSync,statSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const tanks=['yuria','mia','leon','neris','livia','hana','gaia','astra'];
const frames=[
 ...Array.from({length:3},(_,i)=>`assets/heroes/{id}/frame_${String(i+1).padStart(2,'0')}.png`),
 ...Array.from({length:8},(_,i)=>`assets/combat/{id}/frame_${String(i+1).padStart(2,'0')}.png`),
 ...Array.from({length:6},(_,i)=>`assets/combat/{id}/up6_${String(i+1).padStart(2,'0')}.png`),
];

describe('regenerated tank SD sprites',()=>{
 it.each(tanks)('%s has complete 384px idle and attack animation sets',id=>{
  for(const pattern of frames){
   const path=`public/${pattern.replace('{id}',id)}`;
   expect(existsSync(path),path).toBe(true);
   expect(statSync(path).size,path).toBeGreaterThan(10_000);
   const png=readFileSync(path);
   expect(png.subarray(1,4).toString(),path).toBe('PNG');
   expect(png.readUInt32BE(16),path).toBe(384);
   expect(png.readUInt32BE(20),path).toBe(384);
  }
 });

 it('does not restore the retired common sword and shield overlay',()=>{
  expect(existsSync('public/assets/ui/tank-sword-shield.png')).toBe(false);
  const scene=readFileSync('src/game/BattleScene.ts','utf8');
  expect(scene).not.toContain('tank-sword-shield');
  expect(scene).not.toContain('heroTankEquipment');
 });
});
