"""Extract six isolated grid poses using alpha gutters, not nominal cells."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
from scipy import ndimage
import json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art-source/raid-gale-v4'
DEST=ROOT/'public/assets/generated/raid-v4/bosses/gale-colossus'
DEST.mkdir(parents=True,exist_ok=True)

def gutter(density,center,radius):
 lo=max(0,center-radius);hi=min(len(density),center+radius)
 part=density[lo:hi];lowest=part.min();candidates=np.where(part==lowest)[0]+lo
 anchor=int(candidates[np.argmin(abs(candidates-center))]);left=anchor;right=anchor
 while left>lo and density[left-1]==lowest:left-=1
 while right+1<hi and density[right+1]==lowest:right+=1
 return (left+right)//2

tracks={};audit=[]
for path in sorted(SOURCE.glob('*.png')):
 im=Image.open(path).convert('RGBA');a=np.array(im.getchannel('A'));mask=a>24
 mid=gutter(mask.sum(axis=1),im.height//2,im.height//10)
 frames=[]
 for top,bottom in [(0,mid),(mid,im.height)]:
  density=mask[top:bottom].sum(axis=0)
  cuts=[0]+[gutter(density,round(im.width*i/3),im.width//12) for i in (1,2)]+[im.width]
  for left,right in zip(cuts,cuts[1:]):
   pixels=np.array(im.crop((left,top,right,bottom)))
   labels,n=ndimage.label(pixels[:,:,3]>24);sizes=np.bincount(labels.ravel());sizes[0]=0
   body=labels==sizes.argmax();near=ndimage.binary_dilation(body,iterations=8)
   for label in range(1,n+1):
    if np.any(near&(labels==label)):body|=labels==label
   pixels[:,:,3]=np.where(ndimage.binary_dilation(body,iterations=2),pixels[:,:,3],0)
   cell=Image.fromarray(pixels);bbox=cell.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox()
   if not bbox:raise ValueError(f'empty {path}')
   safe=min(bbox[0],bbox[1],cell.width-bbox[2],cell.height-bbox[3])>=1
   if not safe:print('REJECT',path.stem,len(frames),bbox,'cell',cell.size,'crop',left,top,right,bottom)
   frames.append((cell.crop(bbox),safe))
 # Never pack an outer-edge-truncated pose. Hold the last intact pose instead;
 # this is recorded explicitly, not presented as six newly authored frames.
 good=[i for i,(_,safe) in enumerate(frames) if safe]
 if not good:raise ValueError(f'no safe poses in {path}')
 mapping=[i if safe else min(good,key=lambda j:abs(j-i)) for i,(_,safe) in enumerate(frames)]
 tracks[path.stem]=[frames[i][0] for i in mapping]
 audit.append({'state':path.stem,'poseMapping':mapping,'rowGutter':mid})
 print(path.stem,'mapping',mapping)
tracks['idle']=[tracks['prepare'][0]]*6
# One shared pixel scale across states prevents action/idle size pumping.
images=[im for frames in tracks.values() for im in frames]
scale=min(512*.72/max(im.width for im in images),512*.72/max(im.height for im in images))
contact=Image.new('RGB',(900,len(tracks)*150),'#152531');draw=ImageDraw.Draw(contact)
for row,(state,frames) in enumerate(tracks.items()):
 sheet=Image.new('RGBA',(512*6,512))
 for i,im in enumerate(frames):
  im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
  sheet.alpha_composite(im,(i*512+(512-im.width)//2,440-im.height))
  thumb=im.copy();thumb.thumbnail((115,130));contact.paste(thumb,(85+i*132,row*150+140-thumb.height),thumb)
 draw.text((2,row*150+65),state,fill='white')
 sheet.save(DEST/f'{state}.webp','WEBP',lossless=True)
(ROOT/'artifacts').mkdir(exist_ok=True)
(ROOT/'artifacts/gale-v4-audit.json').write_text(json.dumps(audit,indent=2))
contact.save(ROOT/'artifacts/gale-v4-review.png')
