"""Structural pixel checks, not a claim of semantic character recognition.

Detect edge contact, large detached fragments, duplicate actor-sized islands,
and cross-character exact copies. Contact sheets remain the visual review.
"""
from pathlib import Path
import hashlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[1]
def check(im):
 a=np.array(im.getchannel('A'));mask=a>24
 ys,xs=np.where(mask)
 if not len(xs):return ['empty']
 errors=[];h,w=mask.shape
 if min(xs.min(),ys.min(),w-1-xs.max(),h-1-ys.max())<w*.10:errors.append('unsafe margin')
 labels,count=ndimage.label(mask);sizes=np.bincount(labels.ravel());sizes[0]=0
 large=sorted(sizes[1:],reverse=True)
 if len(large)>1 and large[1]>max(120,large[0]*.20):errors.append('large detached fragment / possible duplicate')
 return errors

def main():
 failures=[];owners={};count=0
 for folder in sorted((ROOT/'public/assets/generated/raid-v4/heroes').iterdir()):
  for path in sorted(folder.glob('*.webp')):
   sheet=Image.open(path).convert('RGBA');size=sheet.height
   assert sheet.width%size==0,path
   for i in range(sheet.width//size):
    im=sheet.crop((i*size,0,(i+1)*size,size));count+=1
    # Attack sources predate this repair. Margin checks apply to all tracks;
    # connected-component quality gating applies to repaired skill cells.
    errors=check(im)
    if path.stem!='skill':errors=[e for e in errors if e=='unsafe margin']
    # Ian's third skill pose has four authored drones separated from his body.
    if folder.name=='ian' and path.stem=='skill' and i==2:
     errors=[e for e in errors if 'detached' not in e]
    if errors:failures.append(f'{folder.name}/{path.stem}/{i+1}: {errors}')
    digest=hashlib.sha256(im.tobytes()).hexdigest()
    if digest in owners and owners[digest]!=folder.name:failures.append(f'cross-hero duplicate: {folder.name} / {owners[digest]}')
    owners[digest]=folder.name
 for path in (ROOT/'public/assets/generated/raid-v4/bosses').rglob('*.webp'):
  sheet=Image.open(path).convert('RGBA');size=sheet.height
  assert sheet.width==size*6,path
  for i in range(6):
   im=sheet.crop((i*size,0,(i+1)*size,size));count+=1
   errors=[e for e in check(im) if e in ('empty','unsafe margin')]
   if errors:failures.append(f'{path.parent.name}/{path.stem}/{i+1}: {errors}')
 # Verify the detector rejects a clipped image and two detached bodies.
 bad=Image.new('RGBA',(100,100));bad.paste((255,255,255,255),(0,20,40,80));assert check(bad)
 bad=Image.new('RGBA',(100,100));bad.paste((255,255,255,255),(15,20,40,80));bad.paste((255,255,255,255),(60,20,85,80));assert any('duplicate' in e for e in check(bad))
 print(f'Pixel audit: {count} cells, {len(failures)} failures')
 for failure in failures:print(failure)
 if failures:raise SystemExit(1)
if __name__=='__main__':main()
