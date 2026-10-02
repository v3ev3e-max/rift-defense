import {heroById} from '../data/heroes';
import {formationRole} from '../data/combatRoles';
import {ownedSkillImpactPaths} from './OwnedSkillFrames';

/** Art belongs to the caster, never to a shared element/role fallback. */
export function heroSkillEffects(id:string){
 if(!heroById[id])throw new Error(`Unknown skill effect owner: ${id}`);
 const role=formationRole(id);
 return {
  owner:id,
  target:role==='support'?'allies':role==='tank'?'self':'enemy',
  cast:`/assets/effects/${id}/skill.png`,
  projectile:`/assets/generated/raid-v3/heroes/${id}/skill.webp`,
  impact:ownedSkillImpactPaths(id).length?ownedSkillImpactPaths(id):role==='support'||role==='tank'
   ?Array.from({length:4},(_,i)=>`/assets/generated/support-skills/${id}/frame_${String(i+1).padStart(2,'0')}.webp`)
   :[`/assets/effects/${id}/skill.png`],
 } as const;
}
