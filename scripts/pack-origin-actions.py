"""Pack four authored action poses per monster without altering the drawings."""
from pathlib import Path
from PIL import Image
import numpy as np,hashlib,json

ROOT=Path(__file__).resolve().parents[1]
ROSTERS={13:['crystal_bastion','tide_skimmer','prism_cannon','coral_singer'],
14:['lunar_husk','spore_leaper','moon_ray','bloom_keeper'],
15:['stellar_plate','plasma_hound','nova_turret','forge_conductor'],
16:['origin_warden','causal_blade','genesis_eye','fate_weaver']}

def boundaries(density,length):
 result=[0]
 for n in (1,2,3):
  anchor=round(length*n/4);radius=length//12;lo=anchor-radius;hi=anchor+radius
  candidates=np.where(density[lo:hi]==0)[0]+lo
  if not len(candidates):raise ValueError(f'No transparent gutter near {anchor}')
  selected=int(candidates[np.argmin(abs(candidates-anchor))]);left=right=selected
  while left>0 and density[left-1]==0:left-=1
  while right+1<length and density[right+1]==0:right+=1
  result.append((left+right)//2)
 result.append(length);return result

hashes=set();report=[]
for area,ids in ROSTERS.items():
 source=ROOT/f'art-source/campaign-enemies/origin-actions/region-{area}.png'
 sheet=Image.open(source).convert('RGBA');alpha=np.array(sheet.getchannel('A'));mask=alpha>24
 ys=boundaries(mask.sum(1),sheet.height)
 for row,id in enumerate(ids):
  xs=boundaries(mask[ys[row]:ys[row+1]].sum(0),sheet.width)
  frames=[]
  for col in range(4):
   cell=sheet.crop((xs[col],ys[row],xs[col+1],ys[row+1]));a=np.array(cell.getchannel('A'))>24
   if a[0].any() or a[-1].any() or a[:,0].any() or a[:,-1].any():raise ValueError(f'Clipped source {id} pose {col}')
   box=cell.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
   if not box:raise ValueError(f'Empty {id} pose {col}')
   frames.append(cell.crop(box))
  # One scale for the whole action, with fixed floor and horizontal anchor.
  scale=min(138/max(f.width for f in frames),138/max(f.height for f in frames))
  folder=ROOT/f'public/assets/generated/campaign-enemies/map-{area}/{id}'
  for col,frame in enumerate(frames):
   frame=frame.resize((max(1,round(frame.width*scale)),max(1,round(frame.height*scale))),Image.Resampling.LANCZOS)
   out=Image.new('RGBA',(192,192));out.alpha_composite(frame,((192-frame.width)//2,165-frame.height))
   digest=hashlib.sha256(out.tobytes()).hexdigest()
   if digest in hashes:raise ValueError(f'Duplicate authored pose {id} {col}')
   hashes.add(digest);kind='attack' if col<3 else 'hit';n=col+1 if col<3 else 1
   target=folder/kind;target.mkdir(parents=True,exist_ok=True)
   out.save(target/f'frame_{n:02d}.webp','WEBP',lossless=True)
  report.append({'id':id,'area':area,'attackFrames':3,'hitFrames':1,'source':str(source.relative_to(ROOT))})
(ROOT/'artifacts/origin-actions.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(f'Packed {len(report)} monsters, {len(hashes)} unique authored action poses')
