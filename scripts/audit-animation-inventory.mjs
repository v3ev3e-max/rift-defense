import {build} from 'esbuild';
import {existsSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('artifacts/animation-inventory',{recursive:true});
await build({stdin:{contents:`export {heroes} from './src/data/heroes'; export {enemies} from './src/data/enemies'; export {formationRole} from './src/data/combatRoles'; export {originMonsterActions} from './src/game/MonsterAnimations';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'artifacts/animation-inventory/catalog.mjs'});
const {heroes,enemies,formationRole,originMonsterActions}=await import('../artifacts/animation-inventory/catalog.mjs');
const seq=(folder,prefix,count,ext)=>Array.from({length:count},(_,i)=>`${folder}/${prefix}${String(i+1).padStart(2,'0')}.${ext}`);
const heroRows=heroes.map(h=>{
 const groups={idle:seq(`heroes/${h.id}`,'frame_',3,'png'),attack:seq(`combat/${h.id}`,'frame_',8,'png'),skill:seq(`combat/${h.id}`,'skill_',6,'png'),up:seq(`combat/${h.id}`,'up6_',6,'png'),death:seq(`generated/hero-defeat/${h.id}`,'frame_',3,'webp'),projectile:seq(`effects/${h.id}`,'projectile_',3,'png'),impact:seq(`effects/${h.id}`,'impact_',3,'png')};
 if(['support','tank'].includes(formationRole(h.id)))groups.skillImpact=seq(`generated/support-skills/${h.id}`,'frame_',4,'webp');
 return {id:h.id,name:h.name,role:formationRole(h.id),groups,missing:Object.values(groups).flat().filter(p=>!existsSync(`public/assets/${p}`)),raidMissing:['idle','attack','skill'].filter(s=>!existsSync(`public/assets/generated/raid-v4/heroes/${h.id}/${s}.webp`)),staticSkillImpact:!groups.skillImpact};
});
const enemyRows=Object.values(enemies).map(e=>{
 const visual=e.visualId??e.id;
 const folders=Array.from({length:16},(_,i)=>`generated/campaign-enemies/map-${String(i+1).padStart(2,'0')}/${visual}`).filter(p=>existsSync(`public/assets/${p}.webp`));
 return {id:e.id,name:e.name,visual,boss:!!e.boss,ranged:!!e.ranged,folders,attack:!!originMonsterActions[e.id]||visual==='brute',fire:folders.some(p=>existsSync(`public/assets/${p}/fire`)),hitPose:!!originMonsterActions[e.id],death:folders.some(p=>existsSync(`public/assets/${p}/death`)),move:folders.length?folders.every(p=>seq(p+'/move','move_',6,'webp').every(f=>existsSync('public/assets/'+f))):seq(`generated/enemy-motion/${visual}`,'move_',e.boss?8:6,'webp').every(f=>existsSync('public/assets/'+f))};
});
const walk=(p)=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${p}/${e.name}`):[`${p}/${e.name}`]);
const images=walk('public/assets').filter(p=>/\.(png|webp|jpg|jpeg|gif)$/i.test(p));
writeFileSync('artifacts/animation-inventory/catalog.json',JSON.stringify({heroes:heroRows,enemies:enemyRows,images},null,2));
console.log(JSON.stringify({images:images.length,heroes:heroRows.length,heroMissing:heroRows.filter(h=>h.missing.length||h.raidMissing.length),staticSkillImpact:heroRows.filter(h=>h.staticSkillImpact).length,enemies:enemyRows.length,enemyMoveMissing:enemyRows.filter(e=>!e.move).map(e=>e.id),enemyAttackOrFireMissing:enemyRows.filter(e=>!e.attack&&!e.fire).length,enemyHitPoseMissing:enemyRows.filter(e=>!e.hitPose).length,enemyRegionalDeathMissing:enemyRows.filter(e=>!e.death).length},null,2));
