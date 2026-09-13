import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const groups=[['yuria','reina','arin','karin','sera'],['noel','luna','mia','ian','leon'],['adela','neris','belka','serin','kyle'],['livia','kairon','theria','noxia','aurora'],['arden']];
const browser=await chromium.launch();const page=await browser.newPage();
for(let g=0;g<groups.length;g++){
 const src='data:image/png;base64,'+readFileSync(`artifacts/up-attack-sources/atlas-${g+1}.png`).toString('base64');
 const result=await page.evaluate(async({src,rows,g})=>{
 const im=new Image();im.src=src;await im.decode();
 const bands=[[0,315,615,954,1287,1619],[0,328,646,965,1273,1619],[0,317,628,939,1275,1619],[0,320,616,943,1258,1619]];
 const cuts=g<4?bands[g].map(y=>y/1619):[0,1];
 const output=[];
 for(let row=0;row<rows;row++){
 const frames=[];
 for(let col=0;col<3;col++){
 const x=Math.round(im.width*col/3),y=Math.round(im.height*cuts[row]);const w=Math.round(im.width*(col+1)/3)-x,h=Math.round(im.height*cuts[row+1])-y;
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(im,x,y,w,h,0,0,w,h);const d=ctx.getImageData(0,0,w,h);
 let left=w,right=0,top=h,bottom=0;
 for(let i=0;i<d.data.length;i+=4){const r=d.data[i],green=d.data[i+1],b=d.data[i+2];
 // Decode the uniform magenta matte emitted by imagegen to runtime alpha.
 if(r>150&&b>150&&green<100&&Math.min(r,b)-green>100){d.data[i+3]=0;continue;}
 const px=(i/4)%w,py=Math.floor(i/4/w);left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
 }
 ctx.putImageData(d,0,0);frames.push({c,left,right,top,bottom,w,h});
 }
 const scale=Math.min(...frames.map(f=>Math.min(140/(f.right-f.left+1),136/(f.bottom-f.top+1))));
 for(const f of frames){const out=document.createElement('canvas');out.width=out.height=160;const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;const w=(f.right-f.left+1)*scale,h=(f.bottom-f.top+1)*scale;ctx.drawImage(f.c,f.left,f.top,f.right-f.left+1,f.bottom-f.top+1,(160-w)/2,146-h,w,h);output.push(out.toDataURL());}
 }return output;
 },{src,rows:groups[g].length,g});
 for(let row=0;row<groups[g].length;row++){const dir=`public/assets/combat/${groups[g][row]}`;mkdirSync(dir,{recursive:true});for(let f=0;f<3;f++)writeFileSync(`${dir}/up_0${f+1}.png`,Buffer.from(result[row*3+f].split(',')[1],'base64'));}
}
await browser.close();console.log('63 north-facing frames extracted to 160x160 RGBA; consistent scale within each sequence.');
