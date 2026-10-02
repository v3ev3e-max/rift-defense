/** Discrete frame positions; finite playback never wraps into an attack idle. */
export function authoredFrameAt(elapsed:number,duration:number,frames:number){
 if(!Number.isInteger(frames)||frames<1||duration<=0)throw new Error('Invalid authored frame timeline');
 return Math.min(frames-1,Math.floor(Math.max(0,elapsed)/duration*frames));
}
export function authoredFrameKeys(frames:number):Array<Keyframe>{
 if(!Number.isInteger(frames)||frames<1)throw new Error('Invalid authored frame count');
 const keys:Array<Keyframe>=Array.from({length:frames},(_,i)=>({backgroundPosition:`${frames===1?0:i/(frames-1)*100}% 0%`,offset:i/frames,easing:'steps(1,end)'}));
 return [...keys,{...keys[keys.length-1],offset:1}];
}
