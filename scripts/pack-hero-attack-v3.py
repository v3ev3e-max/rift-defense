"""Pack a transparent 4x2 authored hero attack sheet without scaling frames independently."""
import argparse, hashlib, json
from pathlib import Path
from PIL import Image

p=argparse.ArgumentParser()
p.add_argument('source')
p.add_argument('output')
a=p.parse_args()
sheet=Image.open(a.source).convert('RGBA')
folder=Path(a.output);folder.mkdir(parents=True,exist_ok=True)
cell_w=sheet.width//4;cell_h=sheet.height//2
side=max(cell_w,cell_h)
raw=[]
for i in range(8):
 x=i%4;y=i//4
 cell=sheet.crop((x*cell_w,y*cell_h,(x+1)*cell_w,(y+1)*cell_h))
 square=Image.new('RGBA',(side,side))
 square.alpha_composite(cell,((side-cell_w)//2,side-cell_h))
 raw.append(square.resize((256,256),Image.Resampling.LANCZOS))
# Apply one shared reduction when any authored effect approaches a cell edge.
# The same transform on all eight cells preserves apparent character scale.
boxes=[im.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox() for im in raw]
scale=min(1,min(min(232/max(1,b[2]-b[0]),232/max(1,b[3]-b[1])) for b in boxes if b))
scale=min(scale,.90)
outputs=[];hashes=set()
for i,source in enumerate(raw):
 if scale<1:
  resized=source.resize((round(256*scale),round(256*scale)),Image.Resampling.LANCZOS)
  out=Image.new('RGBA',(256,256));out.alpha_composite(resized,((256-resized.width)//2,(256-resized.height)//2))
 else:out=source
 # Transparent RGB is normalized so decoded-pixel hashes are meaningful.
 px=out.load()
 for yy in range(256):
  for xx in range(256):
   if px[xx,yy][3]==0:px[xx,yy]=(0,0,0,0)
 mask=out.getchannel('A').point(lambda v:255 if v>24 else 0);box=mask.getbbox()
 if not box:raise ValueError(f'empty frame {i+1}')
 if box[0]<12 or box[1]<12 or box[2]>244 or box[3]>244:
  raise ValueError(f'unsafe authored frame {i+1}: {box}')
 digest=hashlib.sha256(out.tobytes()).hexdigest()
 if digest in hashes:raise ValueError(f'duplicate authored frame {i+1}')
 hashes.add(digest)
 dest=folder/f'frame_{i+1:02d}.webp';out.save(dest,'WEBP',lossless=True,exact=True)
 outputs.append({'file':dest.name,'bbox':box,'sha256':digest})
strip=Image.new('RGBA',(2048,256))
for i in range(8):
 with Image.open(folder/f'frame_{i+1:02d}.webp') as im:strip.alpha_composite(im.convert('RGBA'),(i*256,0))
strip.save(folder/'sheet.webp','WEBP',lossless=True,exact=True)
(folder/'manifest.json').write_text(json.dumps({'source':a.source,'frames':8,'canvas':[256,256],'outputs':outputs},indent=2),encoding='utf-8')
print(f'packed 8 distinct frames to {folder}')
