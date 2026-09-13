/** Presentation only. These values never enter damage or enemy simulation. */
export const VISUAL_FPS = 12;
export const FRAME_SECONDS = 1 / VISUAL_FPS;
export const ATTACK_FRAMES = 8;
export const ATTACK_SECONDS = ATTACK_FRAMES / VISUAL_FPS;
export function visualFrame(elapsed: number) {
  return Math.min(ATTACK_FRAMES, 1 + Math.floor(Math.max(0, elapsed) * VISUAL_FPS + 1e-7));
}
export const heroVisuals: Record<string, { projectile: number; impact: number; skill: number }> = {
  yuria:{projectile:58,impact:66,skill:116}, reina:{projectile:66,impact:64,skill:112},
  arin:{projectile:84,impact:70,skill:120}, karin:{projectile:66,impact:74,skill:112},
  sera:{projectile:54,impact:58,skill:104}, noel:{projectile:84,impact:64,skill:118},
  luna:{projectile:62,impact:84,skill:126}, mia:{projectile:48,impact:60,skill:108},
  ian:{projectile:48,impact:62,skill:110}, leon:{projectile:60,impact:72,skill:118},
  adela:{projectile:64,impact:76,skill:120}, neris:{projectile:62,impact:80,skill:124},
  belka:{projectile:72,impact:86,skill:126}, serin:{projectile:60,impact:80,skill:120},
  kyle:{projectile:54,impact:70,skill:112}, livia:{projectile:64,impact:88,skill:132},
  kairon:{projectile:76,impact:90,skill:136}, theria:{projectile:70,impact:86,skill:130},
  noxia:{projectile:68,impact:88,skill:132}, aurora:{projectile:74,impact:92,skill:138},
  arden:{projectile:78,impact:94,skill:140},
};
/** Keep the entire rotated rectangle inside the camera, not just its center. */
export function fitVisual(x:number,y:number,width:number,height:number,angle:number,bounds={width:1000,height:580},padding=3) {
  const c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));
  const scale=Math.min(1,(bounds.width-2*padding)/(width*c+height*s),(bounds.height-2*padding)/(width*s+height*c));
  width*=scale;height*=scale;
  const hx=(width*c+height*s)/2,hy=(width*s+height*c)/2;
  return {x:Math.max(padding+hx,Math.min(bounds.width-padding-hx,x)),y:Math.max(padding+hy,Math.min(bounds.height-padding-hy,y)),width,height};
}
