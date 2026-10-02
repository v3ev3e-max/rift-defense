/** Only validated, authored assets enter this registry. Missing owners stay explicit. */
export const ownedSkillFrames:Record<string,{impactFrames:number;folder:string}>={
 reina:{impactFrames:6,folder:'/assets/generated/hero-skill-v2/reina/impact'},
};
export function ownedSkillImpactPaths(id:string){
 const art=ownedSkillFrames[id];
 return art?Array.from({length:art.impactFrames},(_,i)=>`${art.folder}/frame_${String(i+1).padStart(2,'0')}.webp`):[];
}
