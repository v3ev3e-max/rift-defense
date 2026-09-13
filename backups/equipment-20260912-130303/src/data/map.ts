import type { Point } from './types';
export const MAP = {width:800,height:800};
export const CELL = 110;
export interface Slot extends Point {type:'any'|'melee'|'ranged'}
export function segmentDistance(p:Point,a:Point,b:Point) {
 const dx=b.x-a.x,dy=b.y-a.y;
 const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
function field(id:string,name:string,description:string,points:number[][],obstacles:Point[],tint:number){
 const path=points.map(([y,x])=>({x,y}));
 obstacles=obstacles.map(({x,y})=>({x:y,y:x}));
 const segments=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.y-path[i].y));
 const slots:Slot[]=[];
 for(let row=0;row<5;row++)for(let col=0;col<5;col++){
  if(row===2&&col===2)continue;
  slots.push({x:180+col*CELL,y:180+row*CELL,type:'any'});
 }
 const pathLength=segments.reduce((a,b)=>a+b,0);
 const pathPoint=(distance:number,out:Point)=>{
  for(let i=0;i<segments.length;i++){
   if(distance<=segments[i]){const t=Math.max(0,distance)/segments[i];out.x=path[i].x+(path[i+1].x-path[i].x)*t;out.y=path[i].y+(path[i+1].y-path[i].y)*t;return out;}
   distance-=segments[i];
  }Object.assign(out,path[path.length-1]);return out;
 };
 return {id,name,description,path,segments,pathLength,pathPoint,slots,obstacles,tint};
}
export const battleMaps=[field('laboratory','청록 연구시설','외곽은 근거리 · 안쪽은 장거리 · 빈칸 이동으로 방어선 재편',[[90,90],[90,710],[710,710],[710,90],[190,90]],[],0xffffff)];
export type BattleMap = typeof battleMaps[number];
export const {path,slots,segments,pathLength,pathPoint}=battleMaps[0];
