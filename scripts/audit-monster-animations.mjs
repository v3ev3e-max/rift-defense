import {build} from 'esbuild';
import {writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {originMonsterActions} from '../src/game/MonsterAnimations.ts';
mkdirSync('artifacts',{recursive:true});
await build({entryPoints:['src/data/enemies.ts'],bundle:true,platform:'node',format:'esm',outfile:'artifacts/audit-enemies.mjs'});
const {enemies}=await import('../artifacts/audit-enemies.mjs');
const rows=Object.values(enemies).map(def=>{
 const visual=def.visualId??def.id;
 const folders=Array.from({length:16},(_,i)=>`public/assets/generated/campaign-enemies/map-${String(i+1).padStart(2,'0')}/${visual}`).filter(path=>existsSync(`${path}.webp`));
 return {id:def.id,name:def.name,visual,ranged:!!def.ranged,boss:!!def.boss,
  regionalArt:folders.map(path=>path.split('/').at(-2)),
  attack:!!originMonsterActions[def.id]||folders.some(path=>existsSync(`${path}/attack`)),
  fire:folders.some(path=>existsSync(`${path}/fire`)),
  hit:!!originMonsterActions[def.id],death:folders.some(path=>existsSync(`${path}/death`)),
  authoredActions:originMonsterActions[def.id]?4:visual==='brute'?6:0};
});
writeFileSync('docs/monster-animation-audit.json',JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify({enemies:rows.length,attack:rows.filter(r=>r.attack).length,fire:rows.filter(r=>r.fire).length,hit:rows.filter(r=>r.hit).length,regionalDeath:rows.filter(r=>r.death).length}));
