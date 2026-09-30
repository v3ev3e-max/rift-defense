"""Install unique Region 13-16 monsters from authored 2x2 roster sheets."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance
import numpy as np, math, random, json, hashlib

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art-source/campaign-enemies/regions-13-16'
OUT=ROOT/'public/assets/generated/campaign-enemies'
ROSTERS={
 13:['crystal_bastion','tide_skimmer','prism_cannon','coral_singer'],
 14:['lunar_husk','spore_leaper','moon_ray','bloom_keeper'],
 15:['stellar_plate','plasma_hound','nova_turret','forge_conductor'],
 16:['origin_warden','causal_blade','genesis_eye','fate_weaver'],
}
RANGED={'prism_cannon','moon_ray','nova_turret','genesis_eye'}
PALETTE={13:((80,226,255),(205,255,244)),14:((202,154,255),(190,255,168)),15:((255,118,54),(255,218,112)),16:((255,105,210),(255,226,177))}

def gutter(density,center,radius):
 lo=max(0,center-radius);hi=min(len(density),center+radius);part=density[lo:hi]
 low=part.min();points=np.where(part==low)[0]+lo;anchor=int(points[np.argmin(abs(points-center))])
 left=right=anchor
 while left>lo and density[left-1]==low:left-=1
 while right+1<hi and density[right+1]==low:right+=1
 return (left+right)//2

def extract(sheet):
 alpha=np.array(sheet.getchannel('A'));mask=alpha>24
 row=gutter(mask.sum(1),sheet.height//2,sheet.height//8);result=[]
 if mask[row].any() or mask[0].any() or mask[-1].any():raise ValueError('occupied horizontal source boundary')
 for top,bottom in [(0,row),(row,sheet.height)]:
  column=gutter(mask[top:bottom].sum(0),sheet.width//2,sheet.width//8)
  if mask[top:bottom,column].any() or mask[top:bottom,0].any() or mask[top:bottom,-1].any():raise ValueError('occupied vertical source boundary')
  for left,right in [(0,column),(column,sheet.width)]:
   cell=sheet.crop((left,top,right,bottom));box=cell.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
   if not box:raise ValueError('empty roster cell')
   result.append(cell.crop(box))
 return result

def contain(sprite,size=192,margin=.14):
 scale=min(size*(1-margin*2)/sprite.width,size*(1-margin*2)/sprite.height)
 sprite=sprite.resize((round(sprite.width*scale),round(sprite.height*scale)),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(size,size));out.alpha_composite(sprite,((size-sprite.width)//2,round(size*.86)-sprite.height));return out

def motion(body,phase):
 # Six restrained locomotion poses; the silhouette stays intact and grounded.
 angle=[0,-1.3,-.6,.7,1.2,.4][phase];sy=[1,.975,.955,.97,1,.985][phase]
 box=body.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();actor=body.crop(box)
 actor=actor.resize((actor.width,max(1,round(actor.height*sy))),Image.Resampling.LANCZOS).rotate(angle,Image.Resampling.BICUBIC,expand=True)
 return contain(actor,body.width,.14)

def deaths(body,seed):
 rng=random.Random(seed);frames=[]
 for phase,alpha in enumerate((1,.65,.25)):
  out=Image.new('RGBA',body.size)
  for i in range(8):
   y0=i*body.height//8;y1=(i+1)*body.height//8;piece=body.crop((0,y0,body.width,y1))
   piece.putalpha(piece.getchannel('A').point(lambda a:round(a*alpha)))
   out.alpha_composite(piece,(rng.randint(-3,3)*phase,y0+(i-4)*phase))
  frames.append(out)
 return frames

def fire(body,color):
 frames=[]
 for phase in range(3):
  out=body.copy();d=ImageDraw.Draw(out);x=round(out.width*.26);y=round(out.height*.48);r=5+phase*4
  d.ellipse((x-r,y-r,x+r,y+r),fill=(*color,210));
  if phase>0:d.polygon([(x-r,y),(x-20-phase*9,y-r//2),(x-20-phase*9,y+r//2)],fill=(*color,170))
  frames.append(out)
 return frames

def area_fx(area):
 primary,secondary=PALETTE[area];root=OUT/f'map-{area:02d}'/'fx'
 for sub in ('projectile','impact','step'):(root/sub).mkdir(parents=True,exist_ok=True)
 for n in range(1,4):
  shot=Image.new('RGBA',(96,48));d=ImageDraw.Draw(shot);d.polygon([(8,24),(35+n*8,14),(90,24),(35+n*8,34)],fill=(*primary,100+n*45));d.line((14,24,88,24),fill=(*secondary,245),width=2+n)
  shot.save(root/'projectile'/f'frame_{n:02d}.webp','WEBP',lossless=True)
  # Longest ray plus stroke must remain inside the 8px transparent gutter.
  hit=Image.new('RGBA',(96,96));d=ImageDraw.Draw(hit);r=8+n*5
  for ray in range(12):
   a=ray*math.tau/12;d.line((48+math.cos(a)*5,48+math.sin(a)*5,48+math.cos(a)*r*1.5,48+math.sin(a)*r*1.5),fill=(*primary,210),width=3)
  d.ellipse((48-r,48-r,48+r,48+r),outline=(*secondary,235),width=4);hit.save(root/'impact'/f'frame_{n:02d}.webp','WEBP',lossless=True)
 for n in range(1,5):
  step=Image.new('RGBA',(96,48));d=ImageDraw.Draw(step);rx=12+n*5;d.ellipse((48-rx,20,48+rx,28),outline=(*primary,150-n*22),width=3);step.save(root/'step'/f'frame_{n:02d}.webp','WEBP',lossless=True)

audit=[]
for area,names in ROSTERS.items():
 frames=extract(Image.open(SOURCE/f'region-{area}.png').convert('RGBA'));folder=OUT/f'map-{area:02d}';folder.mkdir(parents=True,exist_ok=True)
 for index,(name,source) in enumerate(zip(names,frames)):
  body=contain(source);body.save(folder/f'{name}.webp','WEBP',lossless=True)
  move=folder/name/'move';death=folder/name/'death';move.mkdir(parents=True,exist_ok=True);death.mkdir(parents=True,exist_ok=True)
  motions=[motion(body,i) for i in range(6)]
  for i,image in enumerate(motions,1):image.save(move/f'move_{i:02d}.webp','WEBP',lossless=True)
  for i,image in enumerate(deaths(motions[2],area*10+index),1):image.save(death/f'frame_{i:02d}.webp','WEBP',lossless=True)
  if name in RANGED:
   target=folder/name/'fire';target.mkdir(parents=True,exist_ok=True)
   for i,image in enumerate(fire(motions[1],PALETTE[area][0]),1):image.save(target/f'frame_{i:02d}.webp','WEBP',lossless=True)
  audit.append({'area':area,'id':name,'sourceHash':hashlib.sha256(source.tobytes()).hexdigest(),'frames':10+(3 if name in RANGED else 0)})
 area_fx(area)
(ROOT/'artifacts').mkdir(exist_ok=True);(ROOT/'artifacts/origin-region-enemies.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Installed {len(audit)} unique Region 13-16 enemies')
