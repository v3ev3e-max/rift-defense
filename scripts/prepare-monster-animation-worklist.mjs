import {build} from 'esbuild';
import {existsSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
mkdirSync('artifacts/monster-actions-v2',{recursive:true});
await build({entryPoints:['src/data/enemies.ts'],bundle:true,platform:'node',format:'esm',outfile:'artifacts/monster-actions-v2/enemies.mjs'});
const {enemies}=await import('../artifacts/monster-actions-v2/enemies.mjs');
const rows=Object.values(enemies).map(e=>{
 const candidates=[`public/assets/generated/enemies/${e.visualId??e.id}.webp`,...Array.from({length:16},(_,i)=>`public/assets/generated/campaign-enemies/map-${String(i+1).padStart(2,'0')}/${e.visualId??e.id}.webp`)];
 const reference=candidates.find(existsSync);
 if(!reference)throw new Error('No reference for '+e.id);
 return {id:e.id,name:e.name,visualId:e.visualId??e.id,reference,ranged:!!e.ranged,boss:!!e.boss,status:existsSync(`public/assets/generated/monster-actions-v2/${e.id}/manifest.json`)?'packed':'pending'};
});
const unique=[...new Map(rows.map(r=>[r.visualId,{...r,id:r.visualId}])).values()];
const source=readFileSync('src/game/RegionalEnemyArt.ts','utf8');
for(const match of source.matchAll(/(\d+):new Set\(\[([^\]]+)\]\)/g)){
 const area=Number(match[1]);
 for(const name of match[2].matchAll(/'([^']+)'/g)){
  const visual=name[1];if(visual==='elite')continue;
  const base=rows.find(r=>r.visualId===visual);if(!base)throw new Error('Unknown regional visual '+visual);
  const id=`${visual}-map-${String(area).padStart(2,'0')}`,reference=`public/assets/generated/campaign-enemies/map-${String(area).padStart(2,'0')}/${visual}.webp`;
  if(!existsSync(reference))throw new Error('Missing regional reference '+reference);
  unique.push({...base,id,reference,area,status:existsSync(`public/assets/generated/monster-actions-v2/${id}/manifest.json`)?'packed':'pending'});
 }
}
unique.forEach(r=>r.status=existsSync(`public/assets/generated/monster-actions-v2/${r.id}/manifest.json`)?'packed':'pending');
const owners=new Map();
unique.forEach(r=>{if(!owners.has(r.reference))owners.set(r.reference,r.id);r.canonicalOwner=owners.get(r.reference);r.status=existsSync(`public/assets/generated/monster-actions-v2/${r.canonicalOwner}/manifest.json`)?'packed':'pending';});
writeFileSync('artifacts/monster-actions-v2/worklist.json',JSON.stringify(unique,null,2));
console.log(JSON.stringify({definitions:rows.length,visualWorkItems:unique.length,packed:unique.filter(r=>r.status==='packed').length}));
