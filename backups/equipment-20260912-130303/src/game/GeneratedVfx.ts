import Phaser from 'phaser';

export const generatedVfxNames=['reticle','bullet','slash','lightning','shell','zone','impact'] as const;

/** Prepare generated art once; never render an opaque preview checkerboard. */
export function prepareGeneratedVfx(scene:Phaser.Scene){
 for(const name of generatedVfxNames){
  const key=`vfx-${name}`;if(scene.textures.exists(key))continue;
  const image=scene.textures.get(`${key}-source`).getSourceImage() as HTMLImageElement;
  const scale=Math.min(1,512/Math.max(image.width,image.height));
  const w=Math.max(1,Math.round(image.width*scale)),h=Math.max(1,Math.round(image.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0,w,h);
  const pixels=ctx.getImageData(0,0,w,h),d=pixels.data;
  // Generated previews may contain neutral gray checker tiles. Keep the colored
  // material and convert neutral surroundings to alpha, including enclosed holes.
  for(let i=0;i<d.length;i+=4){
   const hi=Math.max(d[i],d[i+1],d[i+2]),lo=Math.min(d[i],d[i+1],d[i+2]);
   d[i+3]=Math.round(d[i+3]*Math.min(1,Math.max(0,(hi-lo-18)/25)));
  }
  ctx.putImageData(pixels,0,0);
  let left=w,top=h,right=0,bottom=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>30){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const cw=Math.max(1,right-left+1),ch=Math.max(1,bottom-top+1),pad=8;
  const texture=scene.textures.createCanvas(key,cw+pad*2,ch+pad*2)!;
  texture.context.drawImage(canvas,left,top,cw,ch,pad,pad,cw,ch);texture.refresh();
 }
}
