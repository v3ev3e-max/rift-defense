import type { Point } from '../data/types';
// The idle portraits occupy ~94 source pixels while attack frames occupy
// 126-140. Pose-specific sizes keep the visible character scale constant.
export const HERO_RENDER = {
 size:132, sideSize:94, upSize:132,
 sourceSize:160, originX:80, originY:142, offsetY:16,
};
const oversizedAddedHeroes=new Set(['gaia','astra','solara','zion','vera','elise','celestia']);
const normalizedDefeatHeroes=new Set(['astra','celestia','echo','elise','gaia','hana','meriel','ophilia','rhea','selene','solara','vera','zion']);
const NORMALIZED_ASSET_SCALE=.925;
const regeneratedTankSprites=new Set(['yuria','mia','leon','neris','livia','hana','gaia','astra']);
/** The six late-added SD sets fill almost the entire 160px source canvas while the
 * established cast occupies roughly 94px idle / 126px attack. Pose-specific
 * display sizes normalize their visible bodies without resampling the artwork. */
export function poseSize(id:string,north:boolean,idle=false){
 if(regeneratedTankSprites.has(id))return idle?142:150;
 if(id==='ophilia')return 86;
 if(id==='hana')return idle?90:north?120/NORMALIZED_ASSET_SCALE:90/NORMALIZED_ASSET_SCALE;
 if(id==='celestia')return 94;
 if(id==='solara')return idle?86:north?96:80;
 if(id==='vera')return idle?86:80;
 if(id==='astra')return idle?86:north?118:84;
 if(oversizedAddedHeroes.has(id))return idle?86:north?118:80;
 return idle?HERO_RENDER.size:north?(['leon','kairon'].includes(id)?96:HERO_RENDER.size):HERO_RENDER.sideSize;
}
export type HeroVisualPose='idle'|'attack'|'up'|'skill';
/** Keep animation state selection independent from attack cooldowns. An attack
 * pose may only remain visible while its actual animation window is active. */
export function heroVisualPose(attacking:boolean,skillCasting:boolean,north:boolean):HeroVisualPose{
 if(skillCasting)return 'skill';
 if(!attacking)return 'idle';
 return north?'up':'attack';
}
/** Skill sheets use a common 384px canvas and already contain generous safe
 * gutters. A fixed footprint prevents large-pose heroes from being enlarged
 * past the battlefield edge while keeping every hero at the same visual scale. */
export function heroVisualSize(id:string,north:boolean,pose:HeroVisualPose){
 return pose==='skill'?160:poseSize(id,north,pose==='idle');
}
export function defeatPoseSize(id:string){
 const base=id==='hana'?112:oversizedAddedHeroes.has(id)?108:HERO_RENDER.size;
 return normalizedDefeatHeroes.has(id)?base/NORMALIZED_ASSET_SCALE:base;
}
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
 mia:{side:[[119,70],[116,78],[113,63]],up:[[116,40],[111,37],[112,43]],melee:true,socket:'nano core emitter'},
 ian:{side:[[118,66],[102,84],[124,64]],up:[[107,26],[108,24],[113,32]],socket:'held launcher'},
 leon:{side:[[100,74],[118,69],[118,46]],up:[[114,23],[109,23],[108,23]],melee:true,socket:'resonance field emitter'},
 adela:{side:[[50,42],[115,71],[107,62]],up:[[110,54],[107,39],[110,44]],socket:'staff gem'},
 neris:{side:[[125,42],[112,83],[114,68]],up:[[115,54],[105,37],[111,45]],melee:true,socket:'tidal shield spear edge'},
 belka:{side:[[129,112],[99,112],[114,111]],up:[[115,35],[112,34],[115,29]],socket:'heavy gun muzzle'},
 serin:{side:[[30,127],[129,57],[119,82]],up:[[112,48],[109,28],[109,36]],melee:true,socket:'blade tip'},
 kyle:{side:[[107,86],[49,76],[111,70]],up:[[108,44],[100,37],[103,43]],socket:'device emitter'},
 livia:{side:[[129,58],[112,85],[114,66]],up:[[115,72],[61,26],[117,95]],melee:true,socket:'frost focus'},
 kairon:{side:[[122,78],[113,78],[114,87]],up:[[124,69],[103,64],[121,71]],socket:'cannon muzzle'},
 theria:{side:[[118,65],[111,68],[103,71]],up:[[116,68],[97,33],[118,81]],socket:'staff star'},
 noxia:{side:[[35,130],[137,82],[128,89]],up:[[128,89],[139,105],[141,130]],melee:true,socket:'scythe edge'},
 aurora:{side:[[129,61],[121,66],[121,58]],up:[[121,55],[94,27],[109,69]],socket:'ice staff focus'},
 arden:{side:[[30,121],[115,73],[102,80]],up:[[125,125],[108,28],[120,124]],melee:true,socket:'flame blade tip'},
 hana:{side:[[42,112],[48,104],[44,110]],up:[[96,42],[94,38],[96,40]],melee:true,socket:'mace edge'},
 zion:{side:[[152,103],[152,98],[152,135]],up:[[125,8],[124,28],[129,8]],socket:'thermal rifle muzzle'},
 gaia:{side:[[148,95],[150,83],[152,144]],up:[[85,8],[104,8],[55,8]],melee:true,socket:'lightning lance tip'},
 elise:{side:[[146,98],[152,86],[152,147]],up:[[75,28],[86,8],[93,18]],socket:'cryo rifle muzzle'},
 vera:{side:[[152,113],[152,86],[152,127]],up:[[84,30],[78,8],[66,8]],socket:'void rail-bow muzzle'},
 astra:{side:[[152,111],[152,93],[152,107]],up:[[78,37],[83,8],[73,8]],melee:true,socket:'energy sword edge'},
 solara:{side:[[152,63],[152,74],[152,85]],up:[[75,34],[92,17],[87,10]],socket:'plasma emitter'},
 celestia:{side:[[144,100],[152,89],[152,89]],up:[[117,9],[80,14],[79,9]],socket:'anti-rift rail muzzle'},
 rhea:{side:[[120,72],[116,76],[118,70]],up:[[98,38],[94,35],[96,38]],socket:'medical emitter'},
 echo:{side:[[122,70],[118,76],[120,68]],up:[[103,40],[100,36],[102,39]],socket:'relay drone'},
 meriel:{side:[[121,67],[117,73],[119,65]],up:[[105,37],[102,34],[104,37]],socket:'choir focus'},
 selene:{side:[[124,66],[119,72],[121,64]],up:[[106,35],[103,32],[105,35]],socket:'eclipse focus'},
 ophilia:{side:[[126,64],[121,70],[123,62]],up:[[108,34],[105,31],[107,34]],socket:'sanctum focus'},
};
const sequence=[0,0,1,1,2,2,1,0];
const ranged=[[0,0],[0,1],[-2,0],[-4,0],[-5,1],[-3,1],[-1,0],[0,0]];
const melee=[[0,0],[1,1],[3,0],[6,-1],[8,0],[5,1],[2,0],[0,0]];
export function muzzlePixel(id:string,north:boolean,frame:number):Pixel{
 const def=muzzlePixels[id];if(!def)throw Error(`Missing muzzle coordinates: ${id}`);
 if(north){const p=def.up[Math.max(0,Math.min(2,frame-1))];return id==='hana'?[80+(p[0]-80)*NORMALIZED_ASSET_SCALE,142+(p[1]-142)*NORMALIZED_ASSET_SCALE]:p;}
 const i=Math.max(0,Math.min(7,frame-1)),pose=sequence[i],sampleIndex=[0,2,4][pose];
 const offsets=def.melee?melee:ranged,p=def.side[pose];
 const point:[number,number]=[p[0]+offsets[i][0]-offsets[sampleIndex][0],p[1]+offsets[i][1]-offsets[sampleIndex][1]];
 return id==='hana'?[80+(point[0]-80)*NORMALIZED_ASSET_SCALE,142+(point[1]-142)*NORMALIZED_ASSET_SCALE]:point;
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

