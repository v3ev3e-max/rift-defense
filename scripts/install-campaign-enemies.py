from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math, random

SOURCE=Path(r"C:\Users\PC\.codex\generated_images\01a07544-c4a3-75a1-8a61-2124d1422fc4")
OUT=Path(r"D:\3V_TD\public\assets\generated\campaign-enemies")
SHEETS={
 1:("exec-086999ce-870e-4f8f-82db-8c74214ee77d.png",1,1,["crawler"]),
 2:("exec-24667615-1e8a-4e01-b40c-961175d96f24.png",2,1,["crawler","runner"]),
 3:("exec-85425b4e-c126-4317-80a6-940a364ab6a3.png",3,1,["crawler","runner","sprinter"]),
 4:("exec-59769e5b-90e4-4932-9cbf-5357ce50cf08.png",5,1,["crawler","brute","sprinter","armored","ravager"]),
 5:("exec-5f733c4f-2666-4de2-992f-3c023dd8d97d.png",3,1,["crawler","armored","jammer"]),
 6:("exec-693816c7-1ca2-4add-9163-2d02fc94abae.png",4,1,["runner","armored","brute","jammer"]),
 7:("exec-aa59d9de-e53c-4678-94cf-22850ea0c9ed.png",4,1,["sprinter","bulwark","phantom","jammer"]),
 8:("exec-211e76e8-bf15-437e-8c27-d5754360b6b3.png",3,2,["armored","jammer","phantom","bulwark","elite","abyssal"])}
MOVES={1:"exec-8cd825bf-c2b3-45a7-a801-9ee181d5617b.png",2:"exec-2121122a-852e-4255-8661-4efbcd3bd576.png",3:"exec-1e52d1a7-50cd-4c9d-9c4f-8d1c8376c859.png",4:"exec-d4fa8831-adb0-4036-9cb5-e7ffa0eb4207.png",5:"exec-b18403ad-03c2-4fa1-80ff-98b020e6b750.png",6:"exec-479007bd-f69a-4225-b10d-d4173e8905e4.png",7:"exec-a9fbdce9-6b3b-48a1-adec-073037d4c7f8.png",8:"exec-04732265-1264-4781-8008-bf3f6bc9407a.png"}
TRIMS={(4,"crawler"):(0,0,.90,1),(4,"sprinter"):(0,0,.88,1),(7,"phantom"):(.15,0,1,1)}
RANGED={"armored","jammer","phantom"}
PAL={1:((132,255,136),(255,241,133)),2:((76,224,255),(255,137,76)),3:((255,126,74),(82,242,218)),4:((112,218,255),(210,242,255)),5:((32,255,224),(255,57,168)),6:((74,226,255),(230,252,255)),7:((168,91,255),(76,236,255)),8:((255,49,229),(115,55,255))}

def extract(sheet,col,row,cols,rows):
 box=(round(col*sheet.width/cols),round(row*sheet.height/rows),round((col+1)*sheet.width/cols),round((row+1)*sheet.height/rows))
 cell=sheet.crop(box); bbox=cell.getchannel("A").point(lambda v:255 if v>8 else 0).getbbox()
 if not bbox: raise RuntimeError(f"empty sprite {col},{row}")
 return cell.crop(bbox)

def contain(sprite,size,margin=12):
 ratio=min((size-margin*2)/sprite.width,(size-margin*2)/sprite.height)
 sprite=sprite.resize((max(1,round(sprite.width*ratio)),max(1,round(sprite.height*ratio))),Image.Resampling.LANCZOS)
 out=Image.new("RGBA",(size,size)); out.alpha_composite(sprite,((size-sprite.width)//2,(size-sprite.height)//2)); return out

def glow(im,xy,r,color):
 layer=Image.new("RGBA",im.size); d=ImageDraw.Draw(layer)
 for mul,a in ((2.5,35),(1.7,70),(1,235)):
  rr=r*mul; d.ellipse((xy[0]-rr,xy[1]-rr,xy[0]+rr,xy[1]+rr),fill=(*color,a))
 im.alpha_composite(layer.filter(ImageFilter.GaussianBlur(r*.35)))

def deaths(body,size,seed):
 rng=random.Random(seed); flash=Image.new("RGBA",body.size,(238,225,255,0)); flash.putalpha(body.getchannel("A").point(lambda a:int(a*.42)))
 result=[Image.alpha_composite(body,flash)]
 for phase in (1,2):
  out=Image.new("RGBA",body.size); strips=7
  for i in range(strips):
   y0=i*size//strips; y1=(i+1)*size//strips; piece=body.crop((0,y0,size,y1))
   piece.putalpha(piece.getchannel("A").point(lambda a:int(a*(.72 if phase==1 else .28))))
   out.alpha_composite(piece,(rng.randint(-5,5)*phase,y0+(i-strips//2)*phase))
  d=ImageDraw.Draw(out)
  for _ in range(10+phase*5):
   x=rng.randint(size//4,size*3//4); y=rng.randint(size//4,size*3//4); r=rng.randint(1,4)
   d.polygon([(x,y-r*2),(x+r,y),(x,y+r*2),(x-r,y)],fill=(188,126,255,180 if phase==1 else 110))
  result.append(out)
 return result

def fire_frames(body,size,area,name):
 primary,secondary=PAL[area]; target=OUT/f"map-{area:02d}"/name/"fire"; target.mkdir(parents=True,exist_ok=True)
 for n in range(1,4):
  im=body.copy(); x=int(size*(.70+.05*n)); y=int(size*(.44-.015*n)); glow(im,(x,y),4+n*3,primary); d=ImageDraw.Draw(im)
  if n>=2:
   d.line((x,y,x+size*(.12+.06*n),y),fill=(*secondary,220),width=max(2,size//55))
   for a in (-.32,.32): d.line((x,y,x+math.cos(a)*size*.13,y+math.sin(a)*size*.13),fill=(*primary,180),width=2)
  im.save(target/f"frame_{n:02d}.webp","WEBP",lossless=True,method=6)

def area_fx(area):
 primary,secondary=PAL[area]; root=OUT/f"map-{area:02d}"/"fx"
 for sub in ("projectile","impact","step"): (root/sub).mkdir(parents=True,exist_ok=True)
 for n in range(1,4):
  im=Image.new("RGBA",(96,48)); d=ImageDraw.Draw(im); tail=12+n*8
  d.polygon([(10,24),(tail,15),(82,20),(92,24),(82,28),(tail,33)],fill=(*primary,80+n*45)); d.line((16,24,87,24),fill=(*secondary,245),width=3+n); glow(im,(82,24),3+n,primary)
  im.save(root/"projectile"/f"frame_{n:02d}.webp","WEBP",lossless=True,method=6)
  hit=Image.new("RGBA",(96,96)); hd=ImageDraw.Draw(hit); radius=13+n*10
  for ray in range(10):
   a=ray*math.tau/10; r2=radius*(1.3 if ray%2 else 1.8)
   hd.line((48+math.cos(a)*8,48+math.sin(a)*8,48+math.cos(a)*r2,48+math.sin(a)*r2),fill=(*primary,210-n*25),width=3)
  hd.ellipse((48-radius,48-radius,48+radius,48+radius),outline=(*secondary,230),width=4)
  hit.filter(ImageFilter.GaussianBlur(.7)).save(root/"impact"/f"frame_{n:02d}.webp","WEBP",lossless=True,method=6)
 for n in range(1,5):
  step=Image.new("RGBA",(96,48)); sd=ImageDraw.Draw(step); rx=14+n*6
  sd.ellipse((48-rx,24-rx*.35,48+rx,24+rx*.35),outline=(*primary,max(25,150-n*25)),width=3)
  for k in range(3):
   x=30+k*18+(n%2)*3; sd.ellipse((x-2,22-k%2*4,x+2,26-k%2*4),fill=(*secondary,max(20,130-n*20)))
  step.save(root/"step"/f"frame_{n:02d}.webp","WEBP",lossless=True,method=6)

count=0
for area,(filename,cols,rows,names) in SHEETS.items():
 sheet=Image.open(SOURCE/filename).convert("RGBA"); movement=Image.open(SOURCE/MOVES[area]).convert("RGBA"); folder=OUT/f"map-{area:02d}"; folder.mkdir(parents=True,exist_ok=True)
 for index,name in enumerate(names):
  sprite=extract(sheet,index%cols,index//cols,cols,rows)
  if (area,name) in TRIMS:
   l,t,r,b=TRIMS[(area,name)]; sprite=sprite.crop((round(sprite.width*l),round(sprite.height*t),round(sprite.width*r),round(sprite.height*b)))
  size=224 if name in {"ravager","abyssal"} else 160; body=contain(sprite,size); body.save(folder/f"{name}.webp","WEBP",lossless=True,method=6)
  move_dir=folder/name/"move"; move_dir.mkdir(parents=True,exist_ok=True); move=[]
  for n in range(6):
   frame=contain(extract(movement,n,index,6,len(names)),size); frame.save(move_dir/f"move_{n+1:02d}.webp","WEBP",lossless=True,method=6); move.append(frame)
  death_dir=folder/name/"death"; death_dir.mkdir(parents=True,exist_ok=True)
  for n,frame in enumerate(deaths(move[2],size,area*100+index),1): frame.save(death_dir/f"frame_{n:02d}.webp","WEBP",lossless=True,method=6)
  if name in RANGED: fire_frames(move[1],size,area,name)
 count+=1
 area_fx(area)
# Remove obsolete transform-generated boss frames and guarantee a transparent
# safety gutter around every regional sprite/effect. This makes clipping
# measurable and prevents WebGL filtering from sampling an edge pixel.
for stale in OUT.rglob("move_0[78].webp"):
 stale.unlink()
for path in OUT.rglob("*.webp"):
 im=Image.open(path).convert("RGBA"); alpha=im.getchannel("A"); box=alpha.point(lambda v:255 if v>8 else 0).getbbox()
 if not box: raise RuntimeError(f"empty output: {path}")
 if box[0]<6 or box[1]<6 or box[2]>im.width-6 or box[3]>im.height-6:
  padded=Image.new("RGBA",(im.width+16,im.height+16)); padded.alpha_composite(im,(8,8)); padded.save(path,"WEBP",lossless=True,method=6)
print(f"installed {count} regional skins with articulated move, fire, death and area FX")
