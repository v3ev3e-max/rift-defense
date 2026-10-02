"""Mechanically pack one authored 3x2 effect sheet with hard clipping gates."""
import argparse,hashlib,json
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');args=p.parse_args()
sheet=Image.open(args.source).convert('RGBA');frames=[]
for i in range(6):
 x=i%3;y=i//3
 cell=sheet.crop((round(sheet.width*x/3),round(sheet.height*y/2),round(sheet.width*(x+1)/3),round(sheet.height*(y+1)/2)))
 mask=cell.getchannel('A').point(lambda v:255 if v>24 else 0);box=mask.getbbox()
 if not box:raise ValueError(f'Empty source cell {i+1}')
 if box[0]<8 or box[1]<8 or box[2]>cell.width-8 or box[3]>cell.height-8:raise ValueError(f'Unsafe source cell {i+1}: {box}; regenerate, never crop it away')
 frames.append(cell)
boxes=[f.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox() for f in frames]
union=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
scale=min(192/(union[2]-union[0]),192/(union[3]-union[1]))
folder=Path(args.output);folder.mkdir(parents=True,exist_ok=True);hashes=set();outputs=[]
for i,cell in enumerate(frames):
 frame=cell.crop(union);frame=frame.resize((max(1,round(frame.width*scale)),max(1,round(frame.height*scale))),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(256,256));out.alpha_composite(frame,((256-frame.width)//2,(256-frame.height)//2))
 box=out.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox()
 assert box and box[0]>=24 and box[1]>=24 and box[2]<=232 and box[3]<=232,box
 digest=hashlib.sha256(out.tobytes()).hexdigest()
 assert digest not in hashes,'Duplicate authored frame';hashes.add(digest)
 dest=folder/f'frame_{i+1:02d}.webp';out.save(dest,'WEBP',lossless=True);outputs.append({'file':str(dest),'bbox':box,'sha256':digest})
sheetout=Image.new('RGBA',(256*6,256))
for i,item in enumerate(outputs):
 with Image.open(item['file']) as image:sheetout.alpha_composite(image.convert('RGBA'),(256*i,0))
sheetout.save(folder/'sheet.webp','WEBP',lossless=True)
(folder/'manifest.json').write_text(json.dumps({'source':args.source,'frames':6,'canvas':[256,256],'safeMargin':24,'outputs':outputs},indent=2),encoding='utf-8')
print(f'Packed {len(outputs)} distinct frames, common scale/center, >=24px margin')
