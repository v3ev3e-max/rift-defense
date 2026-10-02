import {assetUrl} from '../utils/assets';
export const recruitSequences=['arrival','turn','sr-charge','ssr-crack','sr-reveal','ssr-reveal'] as const;
export type RecruitSequence=typeof recruitSequences[number];
export const recruitFrameUrl=(name:RecruitSequence,frame:number)=>assetUrl(`/assets/ui/recruit/animations/${name}/frame_${String(frame+1).padStart(2,'0')}.webp`);
export function recruitFrameAt(elapsed:number,duration:number,loop=false){
 const progress=loop?Math.max(0,elapsed)%duration:Math.min(Math.max(0,elapsed),duration);
 return Math.min(7,Math.floor(progress/duration*8));
}
const cache=new Map<string,Promise<HTMLImageElement>>();
export function preloadRecruitSprites(){return Promise.all(recruitSequences.flatMap(name=>Array.from({length:8},(_,i)=>{
 const url=recruitFrameUrl(name,i);let p=cache.get(url);if(!p){p=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{cache.delete(url);reject(new Error(`모집 이미지 로드 실패: ${name} ${i+1}`));};image.src=url;});cache.set(url,p);}return p;
})));}
/** Authored raster frame playback only: no CSS/Web Animations or synthesized tween frames. */
export class RecruitSpritePlayer{
 private playing=new Map<HTMLImageElement,()=>void>();
 reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 stop(image:HTMLImageElement){this.playing.get(image)?.();}
 play(image:HTMLImageElement,name:RecruitSequence,duration:number,loop=false,done?:()=>void){
  this.stop(image);let raf=0,cancelled=false,last=-1;const start=performance.now();
  const stop=()=>{cancelled=true;cancelAnimationFrame(raf);this.playing.delete(image);};this.playing.set(image,stop);
  const draw=(frame:number)=>{if(last===frame)return;last=frame;image.src=recruitFrameUrl(name,frame);image.dataset.sequence=name;image.dataset.frame=String(frame);};
  if(this.reduced){draw(7);stop();done?.();return;}
  const tick=(now:number)=>{if(cancelled)return;draw(recruitFrameAt(now-start,duration,loop));if(!loop&&now-start>=duration){stop();done?.();}else raf=requestAnimationFrame(tick);};tick(start);
 }
 clear(){for(const stop of [...this.playing.values()])stop();}
}
