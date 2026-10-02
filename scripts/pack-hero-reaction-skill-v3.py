"""Pack a 3x3 authored sheet: hit frames in row 1, skill VFX in rows 2-3."""
import argparse,hashlib,json
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');a=p.parse_args()
sheet=Image.open(a.source).convert('RGBA');cw=sheet.width//3;ch=sheet.height//3;side=max(cw,ch)
folder=Path(a.output);folder.mkdir(parents=True,exist_ok=True)
groups={'hit':range(3),'skill':range(3,9)};all_hashes=set();manifest={}
for state,indexes in groups.items():
 target=folder/state;target.mkdir(exist_ok=True);raw=[]
 for idx in indexes:
  x=idx%3;y=idx//3;cell=sheet.crop((x*cw,y*ch,(x+1)*cw,(y+1)*ch))
  square=Image.new('RGBA',(side,side));square.alpha_composite(cell,((side-cw)//2,(side-ch)//2));raw.append(square.resize((256,256),Image.Resampling.LANCZOS))
 scale=.90;outputs=[]
 for n,source in enumerate(raw,1):
  resized=source.resize((round(256*scale),round(256*scale)),Image.Resampling.LANCZOS);out=Image.new('RGBA',(256,256));out.alpha_composite(resized,((256-resized.width)//2,(256-resized.height)//2))
  px=out.load()
  for yy in range(256):
   for xx in range(256):
    if px[xx,yy][3]==0:px[xx,yy]=(0,0,0,0)
  box=out.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox()
  if not box or min(box[0],box[1],256-box[2],256-box[3])<12:raise ValueError(f'{state} frame {n} unsafe: {box}')
  digest=hashlib.sha256(out.tobytes()).hexdigest()
  if digest in all_hashes:raise ValueError(f'duplicate frame {state}/{n}')
  all_hashes.add(digest);dest=target/f'frame_{n:02d}.webp';out.save(dest,'WEBP',lossless=True,exact=True);outputs.append({'file':dest.name,'bbox':box,'sha256':digest})
 strip=Image.new('RGBA',(256*len(raw),256))
 for n in range(1,len(raw)+1):
  with Image.open(target/f'frame_{n:02d}.webp') as im:strip.alpha_composite(im.convert('RGBA'),((n-1)*256,0))
 strip.save(target/'sheet.webp','WEBP',lossless=True,exact=True);manifest[state]=outputs
(folder/'manifest.json').write_text(json.dumps({'source':a.source,'canvas':[256,256],'groups':manifest},indent=2),encoding='utf-8')
print('packed hit3 + skill6')
