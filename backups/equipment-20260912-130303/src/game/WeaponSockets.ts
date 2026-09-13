import type { Point } from '../data/types';
// The idle portraits occupy ~94 source pixels while attack frames occupy
// 126-140. Pose-specific sizes keep the visible character scale constant.
export const HERO_RENDER = {
 size:132, sideSize:94, upSize:132,
 sourceSize:160, originX:80, originY:142, offsetY:16,
};
export function poseSize(id:string,north:boolean,idle=false){return idle?HERO_RENDER.size:north?(['leon','kairon'].includes(id)?96:HERO_RENDER.size):HERO_RENDER.sideSize;}
type Pixel = readonly [number,number];
type Poses = readonly [Pixel,Pixel,Pixel];
/** Pixel coordinates inspected on the actual 160x160 combat textures.
 * Side samples are frames 1,3,5; deterministic recoil offsets reconstruct all 8.
 * North samples are the three separately drawn rear-view poses.
 */
export const muzzlePixels:Record<string,{side:Poses;up:Poses;melee?:boolean;socket:string}>={
 yuria:{side:[[119,91],[126,92],[116,89]],up:[[125,137],[92,17],[81,34]],melee:true,socket:'shield/blade energy'},
 reina:{side:[[138,87],[117,79],[112,91]],up:[[83,31],[80,27],[74,32]],socket:'rifle muzzle'},
 arin:{side:[[139,96],[111,85],[113,98]],up:[[91,30],[90,30],[84,31]],socket:'railgun muzzle'},
 karin:{side:[[127,120],[140,102],[140,104]],up:[[133,139],[94,15],[91,19]],melee:true,socket:'blade tip'},
 sera:{side:[[134,64],[117,62],[109,54]],up:[[104,39],[82,26],[75,42]],socket:'upper pistol muzzle'},
 noel:{side:[[139,98],[116,88],[140,93]],up:[[115,22],[115,23],[115,23]],socket:'sniper muzzle'},
 luna:{side:[[120,65],[100,85],[115,79]],up:[[119,38],[110,39],[116,37]],socket:'staff orb'},
 mia:{side:[[119,70],[116,78],[113,63]],up:[[116,40],[111,37],[112,43]],socket:'held emitter core'},
 ian:{side:[[118,66],[102,84],[124,64]],up:[[107,26],[108,24],[113,32]],socket:'held launcher'},
 leon:{side:[[100,74],[118,69],[118,46]],up:[[114,23],[109,23],[108,23]],socket:'pistol muzzle'},
 adela:{side:[[50,42],[115,71],[107,62]],up:[[110,54],[107,39],[110,44]],socket:'staff gem'},
 neris:{side:[[125,42],[112,83],[114,68]],up:[[115,54],[105,37],[111,45]],socket:'water focus'},
 belka:{side:[[129,112],[99,112],[114,111]],up:[[115,35],[112,34],[115,29]],socket:'heavy gun muzzle'},
 serin:{side:[[30,127],[129,57],[119,82]],up:[[112,48],[109,28],[109,36]],melee:true,socket:'blade tip'},
 kyle:{side:[[107,86],[49,76],[111,70]],up:[[108,44],[100,37],[103,43]],socket:'device emitter'},
 livia:{side:[[129,58],[112,85],[114,66]],up:[[115,72],[61,26],[117,95]],socket:'ice focus'},
 kairon:{side:[[122,78],[113,78],[114,87]],up:[[124,69],[103,64],[121,71]],socket:'cannon muzzle'},
 theria:{side:[[118,65],[111,68],[103,71]],up:[[116,68],[97,33],[118,81]],socket:'staff star'},
 noxia:{side:[[35,130],[137,82],[128,89]],up:[[128,89],[139,105],[141,130]],melee:true,socket:'scythe edge'},
 aurora:{side:[[129,61],[121,66],[121,58]],up:[[121,55],[94,27],[109,69]],socket:'ice staff focus'},
 arden:{side:[[30,121],[115,73],[102,80]],up:[[125,125],[108,28],[120,124]],melee:true,socket:'flame blade tip'},
};
const sequence=[0,0,1,1,2,2,1,0];
const ranged=[[0,0],[0,1],[-2,0],[-4,0],[-5,1],[-3,1],[-1,0],[0,0]];
const melee=[[0,0],[1,1],[3,0],[6,-1],[8,0],[5,1],[2,0],[0,0]];
export function muzzlePixel(id:string,north:boolean,frame:number):Pixel{
 const def=muzzlePixels[id];if(!def)throw Error(`Missing muzzle coordinates: ${id}`);
 if(north)return def.up[Math.max(0,Math.min(2,frame-1))];
 const i=Math.max(0,Math.min(7,frame-1)),pose=sequence[i],sampleIndex=[0,2,4][pose];
 const offsets=def.melee?melee:ranged,p=def.side[pose];
 return [p[0]+offsets[i][0]-offsets[sampleIndex][0],p[1]+offsets[i][1]-offsets[sampleIndex][1]];
}
export function weaponPoint(id:string,position:Point,north:boolean,left:boolean,frame:number):Point{
 const [x,y]=muzzlePixel(id,north,frame),size=poseSize(id,north),
 scale=size/HERO_RENDER.sourceSize;
 return {x:position.x+(north||!left?x-HERO_RENDER.originX:HERO_RENDER.originX-x)*scale,
 y:position.y+HERO_RENDER.offsetY+(y-HERO_RENDER.originY)*scale};
}
/** UID phase keeps the drone stable when another operator merges or is sold. */
export function dronePoint(unit:Point&{uid:number},time:number):Point{
 const angle=time*1.8+unit.uid;return {x:unit.x+Math.cos(angle)*30,y:unit.y-20+Math.sin(angle)*12};
}
/** Shrink at viewport edges without shifting a shot away from its actual muzzle. */
export function fitProjectile(x:number,y:number,width:number,height:number,angle:number,bounds: {width:number;height:number}){
 const c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));
 const hx=(width*c+height*s)/2,hy=(width*s+height*c)/2;
 const scale=Math.max(0,Math.min(1,Math.min(x,bounds.width-x)/Math.max(hx,.001),Math.min(y,bounds.height-y)/Math.max(hy,.001)));
 return {x,y,width:width*scale,height:height*scale};
}
