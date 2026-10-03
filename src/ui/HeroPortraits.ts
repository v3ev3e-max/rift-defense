/** One face-only source for every roster, HUD and result portrait. */
export const redrawnFacePortraits=new Set(['minseo','daeun','iris','rook','freya','valen','nyx','ciel','eir','raon']);
export function heroPortraitPath(id:string){
 if(redrawnFacePortraits.has(id))return `/assets/face-icons/${id}-face-v2.png`;
 return `/assets/face-icons/${id}.${id==='hana'||id==='celestia'?'png':'webp'}`;
}
