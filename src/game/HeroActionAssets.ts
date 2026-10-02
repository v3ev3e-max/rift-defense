import {heroes} from '../data/heroes';

/** Authored v3 actions are complete for the current roster. Keep this explicit
 * so a newly added hero cannot silently fall back to a placeholder animation. */
export const heroActionOwners=new Set(heroes.map(hero=>hero.id));
/** Heroes whose legacy body art used tall illustration proportions. Their v3
 * action sheet is also the canonical SD body source for idle/cast transitions. */
export const normalizedSdHeroOwners=new Set(['eir','ciel','daeun','freya','iris','minseo','nyx','rook','raon','valen','celestia']);
export const heroAttackFrameCount=8;
export function heroAttackFramePath(id:string,frame:number){
 if(!heroActionOwners.has(id))throw new Error(`Missing authored hero action owner: ${id}`);
 return `/assets/generated/hero-attacks-v3/${id}/frame_${String(frame).padStart(2,'0')}.webp`;
}
export function heroAttackSheetPath(id:string){
 if(!heroActionOwners.has(id))throw new Error(`Missing authored hero action owner: ${id}`);
 return `/assets/generated/hero-attacks-v3/${id}/sheet.webp`;
}
