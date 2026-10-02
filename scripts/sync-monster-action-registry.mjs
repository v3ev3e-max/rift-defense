// Mechanically derive runtime registration from pixel-validated owned manifests.
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
const validation=JSON.parse(readFileSync('artifacts/monster-actions-v2/pixel-validation.json','utf8'));
const owners=validation.filter(r=>r.type==='monster'&&r.passed).map(r=>r.owner);
const summons=validation.filter(r=>r.type==='summon'&&r.passed).map(r=>r.owner);
const work=JSON.parse(readFileSync('artifacts/monster-actions-v2/worklist.json','utf8'));
const aliases=Object.fromEntries(work.filter(r=>r.id!==r.canonicalOwner&&owners.includes(r.canonicalOwner)).map(r=>[r.id,r.canonicalOwner]));
let path='src/game/MonsterActionAssets.ts',source=readFileSync(path,'utf8');
source=source.replace(/new Set<string>\(\[[^\]]*\]\)/,`new Set<string>(${JSON.stringify(owners)})`);
source=source.replace(/export const monsterRegionalAliases[^;]*;/,`export const monsterRegionalAliases:Record<string,string>=${JSON.stringify(aliases)};`);
writeFileSync(path,source);
path='src/ui/RaidSummonAnimations.ts';source=readFileSync(path,'utf8').replace(/new Set<string>\(\[[^\]]*\]\)/,`new Set<string>(${JSON.stringify(summons)})`);writeFileSync(path,source);
console.log(JSON.stringify({registeredMonsters:owners.length,registeredSummons:summons.length,exactReferenceAliases:Object.keys(aliases).length,pendingDistinctReferences:[...new Set(work.filter(r=>!owners.includes(r.canonicalOwner)).map(r=>r.reference))].length}));
const fallback={};
for(const row of work.filter(r=>!r.area)){
 if(existsSync(`public/assets/generated/enemies/${row.id}.webp`))continue;
 const folder=row.reference.replace(/\.webp$/,'');
 if(!Array.from({length:6},(_,i)=>`${folder}/move/move_${String(i+1).padStart(2,'0')}.webp`).every(existsSync))throw new Error('Incomplete fallback movement '+row.id);
 fallback[row.id]={base:row.reference.slice('public'.length),moveFolder:`${folder.slice('public'.length)}/move`,frames:6,...(existsSync(`${folder}/fire/frame_01.webp`)?{fireFolder:`${folder.slice('public'.length)}/fire`}:{})};
}
writeFileSync('src/game/MonsterFallbackArt.ts',`/** Generated from existing authored references; no appearance-changing fallback. */\nexport const monsterFallbackArt:Record<string,{base:string;moveFolder:string;frames:number;fireFolder?:string}>=${JSON.stringify(fallback,null,2)};\n`);
