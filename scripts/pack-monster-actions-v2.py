"""Pack authored 3x3 monster action sheets, never synthesize missing poses."""
import argparse,hashlib,json
from pathlib import Path
from PIL import Image
import numpy as np
parser=argparse.ArgumentParser();parser.add_argument('id');parser.add_argument('source');parser.add_argument('--summon',action='store_true');args=parser.parse_args()
states=['move','attack','hit','death'] if args.summon else ['attack','hit','death'];row_count=len(states)
source=Path(args.source);sheet=Image.open(source).convert('RGBA');cells=[]
alpha=np.array(sheet.getchannel('A'))>24
def gutters(density,length,count=3):
 result=[0]
 for n in range(1,count):
  anchor=round(length*n/count);radius=length//(count*3);lo=max(1,anchor-radius);hi=min(length-1,anchor+radius)
  blank=np.where(density[lo:hi]==0)[0]+lo
  if not len(blank):raise ValueError(f'No transparent separator near {anchor}; regenerate overlapping source')
  pos=int(blank[np.argmin(abs(blank-anchor))]);left=right=pos
  while left>0 and density[left-1]==0:left-=1
  while right+1<length and density[right+1]==0:right+=1
  result.append((left+right)//2)
 return result+[length]
ys=gutters(alpha.sum(1),sheet.height,row_count)
for i in range(row_count*3):
 x=i%3;y=i//3;xs=gutters(alpha[ys[y]:ys[y+1]].sum(0),sheet.width)
 cell=sheet.crop((xs[x],ys[y],min(sheet.width,xs[x+1]+1),min(sheet.height,ys[y+1]+1)))
 mask=cell.getchannel('A').point(lambda a:255 if a>24 else 0);box=mask.getbbox()
 if not box:raise ValueError(f'{args.id} empty cell {i+1}')
 # A real transparent separator proves nothing crosses the source cell.
 # Runtime frames get a larger 32px margin after one shared scale.
 if box[0]<1 or box[1]<1 or box[2]>cell.width-1 or box[3]>cell.height-1:raise ValueError(f'{args.id} clipped source cell {i+1}: {box}')
 cells.append(cell)
boxes=[c.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox() for c in cells]
scale=min(192/max(b[2]-b[0] for b in boxes),192/max(b[3]-b[1] for b in boxes));rows=[];hashes=set()
folder=Path('public/assets/generated/raid-summon-actions-v2' if args.summon else 'public/assets/generated/monster-actions-v2')/args.id
for i,cell in enumerate(cells):
 state=states[i//3];n=i%3+1
 frame=cell.crop(boxes[i]);frame=frame.resize((max(1,round(frame.width*scale)),max(1,round(frame.height*scale))),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(256,256));out.alpha_composite(frame,((256-frame.width)//2,224-frame.height))
 pixels=np.array(out);pixels[pixels[:,:,3]==0,:3]=0;out=Image.fromarray(pixels)
 box=out.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
 assert box and min(box[:2])>=24 and max(box[2:])<=232,(args.id,state,n,box)
 digest=hashlib.sha256(out.tobytes()).hexdigest()
 assert digest not in hashes,f'Duplicate drawing {args.id} {state} {n}';hashes.add(digest)
 dest=folder/state/f'frame_{n:02d}.webp';dest.parent.mkdir(parents=True,exist_ok=True);out.save(dest,'WEBP',lossless=True,exact=True)
 rows.append({'state':state,'frame':n,'file':str(dest),'bbox':box,'sha256':digest})
(folder/'manifest.json').write_text(json.dumps({'owner':args.id,'source':str(source),'canvas':[256,256],'anchor':[128,224],'safeMargin':24,'rows':rows},indent=2),encoding='utf-8')
for state in states:
 sprite=Image.new('RGBA',(768,256))
 for i in range(3):
  with Image.open(folder/state/f'frame_{i+1:02d}.webp') as image:sprite.alpha_composite(image.convert('RGBA'),(i*256,0))
 sprite.save(folder/state/'sheet.webp','WEBP',lossless=True)
print(f'{args.id}: {row_count*3} unique authored frames, source edge and >=24px output margins passed')
