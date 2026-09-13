export interface EnemyMotion {
  frame: number;
  flipX: boolean;
  angle: number;
  scaleX: number;
  scaleY: number;
  lift: number;
  shadowScale: number;
  stepAlpha: number;
}

export function enemyMotion(time:number,index:number,speed:number,boss:boolean,dx:number,dy:number):EnemyMotion {
  const cadence=Math.max(2.4,Math.min(6.2,speed/13))*(boss?.58:1);
  const cycle=(time*cadence+index*.73)%(Math.PI*2);
  const contact=Math.abs(Math.cos(cycle));
  const stride=Math.sin(cycle);
  const moving=Math.hypot(dx,dy)>.01;
  return {
    frame:1+Math.floor(((cycle+Math.PI*2)%(Math.PI*2))/(Math.PI*.5))%4,
    flipX:moving&&Math.abs(dx)>=Math.abs(dy)&&dx<0,
    angle:moving ? Math.sin(cycle)*(boss?.45:1.2) : 0,
    scaleX:1+(contact-.5)*(boss?.018:.035),
    scaleY:1-(contact-.5)*(boss?.024:.045),
    lift:moving ? Math.max(0,stride)*(boss?.45:1.1) : 0,
    shadowScale:1-(1-contact)*(boss?.035:.08),
    stepAlpha:moving ? .12+contact*(boss?.22:.32) : 0,
  };
}
