"""Recover original six-pose strips; never recrop the damaged runtime cells.

User-requested deterministic sprite extraction. Alpha-empty gutters define
frames, not equal-width cells (the generated poses have unequal widths).
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib
import numpy as np
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[1]
def runs(values):
 result=[];start=None
 for i,v in enumerate([*values,False]):
  if v and start is None:start=i
  elif not v and start is not None:result.append((start,i));start=None
 return result

def inspect():
 files=json.loads((ROOT/'artifacts/raid-source-audit/files.json').read_text())
 ids=[h['id'] for h in json.loads((ROOT/'artifacts/hero-skill-specs.json').read_text(encoding='utf-8'))]
 for id,p in zip(ids,files[27:61]):
  im=Image.open(p).convert('RGBA');a=im.getchannel('A')
  occupied=[a.crop((x,0,x+1,im.height)).getextrema()[1]>16 for x in range(im.width)]
  spans=[(l,r) for l,r in runs(occupied) if r-l>30]
  print(id,im.size,spans)
def extract(im):
 a=np.array(im.getchannel('A'));h,w=a.shape
 # Effects can touch between poses. Locate the narrowest alpha valley near
 # each inter-character gutter, instead of cutting through a head or body.
 windows=[(.115,.18),(.27,.35),(.43,.51),(.65,.73),(.82,.9)]
 density=(a>32).sum(axis=0)
 cuts=[0]
 for lo,hi in windows:
  l,r=int(w*lo),int(w*hi);cuts.append(l+int(np.argmin(density[l:r])))
 cuts.append(w);frames=[]
 for left,right in zip(cuts,cuts[1:]):
  cell=np.array(im.crop((left,0,right,h)))
  labels,count=ndimage.label(cell[:,:,3]>16)
  sizes=np.bincount(labels.ravel());sizes[0]=0
  main=int(sizes.argmax());mask=labels==main
  # Preserve nearby small effect particles, but remove disconnected strips
  # belonging to an adjacent pose. A single body remains in each output.
  near=ndimage.binary_dilation(mask,iterations=8)
  for label in range(1,count+1):
   if label!=main and np.any(near & (labels==label)):
    mask|=labels==label
  cell[:,:,3]=np.where(ndimage.binary_dilation(mask,iterations=1),cell[:,:,3],0)
  frames.append(Image.fromarray(cell))
 return frames,cuts

def pack(frames,size=384,margin=.14):
 cropped=[im.crop(im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()) for im in frames]
 scale=min(size*(1-margin*2)/max(im.width for im in cropped),size*(1-margin*2)/max(im.height for im in cropped))
 result=[]
 for im in cropped:
  im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
  out=Image.new('RGBA',(size,size));out.alpha_composite(im,((size-im.width)//2,round(size*(1-margin))-im.height));result.append(out)
 return result

def main():
 (ROOT/'artifacts').mkdir(exist_ok=True)
 archive=ROOT/'art-source/hero-skills'
 ids=[p.stem for p in archive.glob('*.webp')]
 audit=[];contact=Image.new('RGB',(1152,44*110),'#152531');draw=ImageDraw.Draw(contact)
 for row,folder in enumerate(sorted((ROOT/'public/assets/combat').iterdir())):
  if not (folder/'skill_06.png').exists():continue
  hid=folder.name;cuts=[]
  if hid in ids:
   source=archive/f'{hid}.webp'
   frames,cuts=extract(Image.open(source).convert('RGBA'))
   # These source strips contain five actor poses and one isolated projectile.
   # Hold the firing pose during projectile travel; never replace the actor
   # with that projectile. This is timing, not an invented sixth pose.
   if hid in ('elise','celestia'):frames[3]=frames[2].copy()
  else:
   legacy=ROOT/'art-source/hero-skill-legacy'/hid;legacy.mkdir(parents=True,exist_ok=True)
   for i in range(1,7):
    source=legacy/f'skill_{i:02}.png'
    if not source.exists():Image.open(folder/source.name).save(source)
   frames=[Image.open(legacy/f'skill_{i:02}.png').convert('RGBA') for i in range(1,7)]
  for i in range(6):
   override=ROOT/f'art-source/hero-skill-overrides/{hid}-{i+1:02}.png'
   if override.exists():
    replacement=Image.open(override).convert('RGBA');replacement=replacement.crop(replacement.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox())
    old=frames[i].getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();height=old[3]-old[1]
    replacement=replacement.resize((round(replacement.width*height/replacement.height),height),Image.Resampling.LANCZOS)
    frames[i]=replacement
  frames=pack(frames)
  for i,im in enumerate(frames,1):
   im.save(folder/f'skill_{i:02}.png',optimize=True)
   thumb=im.copy();thumb.thumbnail((100,100));contact.paste(thumb,(90+(i-1)*174,row*110),thumb)
  draw.text((2,row*110+40),hid,fill='white')
  audit.append({'hero':hid,'sourceCuts':cuts,'frameHashes':[hashlib.sha256(im.tobytes()).hexdigest() for im in frames]})
 (ROOT/'artifacts/raid-skill-repair.json').write_text(json.dumps(audit,indent=2))
 for n in range(4):contact.crop((0,n*1210,1152,min((n+1)*1210,contact.height))).save(ROOT/f'artifacts/raid-skill-review-{n}.png')
 print('Re-extracted and packed',len(audit),'heroes')
if __name__=='__main__':main()
