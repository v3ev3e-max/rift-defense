from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
GEN=Path(r'C:/Users/PC/.codex/generated_images/01a0bcec-3497-7643-a99a-cfa603eae514')
SOURCES={
 'minseo':'exec-a6ae6f19-2d95-48fb-ac60-58043b80b372.png','daeun':'exec-57f6fd3f-b307-413b-9fbb-03afa4c561ca.png',
 'iris':'exec-19dd1149-69a8-4198-9326-f0fd5f6c12be.png','rook':'exec-ffbb4c83-821b-499a-8832-02a11af1f614.png',
 'freya':'exec-81d13281-9710-45f5-b386-c033c5734e14.png','valen':'exec-8022cbc0-03de-4788-b5cb-70f07339fbda.png',
 'nyx':'exec-4aa39b3a-8453-4d52-8cf1-f8e351da0c3e.png','ciel':'exec-cd59344d-3d3b-4291-8a02-937b508b9bbe.png',
 'eir':'exec-83e80824-bc93-44c7-8a15-917ae7405f6a.png','raon':'exec-23d87734-3a02-4c39-9db9-7632cd944089.png'}
COLORS={'minseo':(245,211,75),'daeun':(255,105,82),'iris':(105,205,255),'rook':(174,108,255),'freya':(95,239,211),'valen':(255,89,65),'nyx':(174,116,255),'ciel':(93,198,255),'eir':(171,170,255),'raon':(255,137,51)}

def contain(im,size,pad=.08):
 a=im.getchannel('A'); box=a.getbbox() or (0,0,*im.size); crop=im.crop(box)
 target=int(size*(1-pad*2)); crop.thumbnail((target,target),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(size,size)); out.alpha_composite(crop,((size-crop.width)//2,(size-crop.height)//2)); return out

def pose(base,frame,count,skill=False,up=False):
 angle=(frame-(count+1)/2)*(1.4 if skill else .7)
 moved=base.rotate(angle,resample=Image.Resampling.BICUBIC,center=(80,120))
 if up:moved=ImageEnhance.Brightness(moved).enhance(.92+frame*.012)
 if skill:moved=ImageEnhance.Contrast(moved).enhance(1+frame*.025)
 return moved

def effect(color,frame,count,size=256):
 out=Image.new('RGBA',(size,size)); d=ImageDraw.Draw(out); cx=cy=size//2
 r=int(size*(.12+.28*frame/count)); alpha=max(35,210-int(130*frame/count))
 for w in range(18,0,-3):d.ellipse((cx-r-w,cy-r-w,cx+r+w,cy+r+w),outline=(*color,max(8,alpha//(20-w))),width=3)
 d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=(*color,alpha),width=8)
 for i in range(6):
  x=cx+((i*37+frame*19)%120)-60;y=cy+((i*53+frame*13)%120)-60;d.ellipse((x-5,y-5,x+5,y+5),fill=(*color,alpha))
 return out.filter(ImageFilter.GaussianBlur(1.2))

for hid,filename in SOURCES.items():
 archived=ROOT/f'public/assets/generated/new-heroes/{hid}-source.png'
 src=Image.open(archived if archived.exists() else GEN/filename).convert('RGBA')
 source_dir=ROOT/'public/assets/generated/new-heroes';source_dir.mkdir(parents=True,exist_ok=True);src.save(source_dir/f'{hid}-source.png',optimize=True)
 illustration=contain(src,1024,.025); illustration.save(ROOT/f'public/assets/illustrations/{hid}.webp','WEBP',quality=90,method=6)
 face=src.crop((int(src.width*.22),int(src.height*.02),int(src.width*.78),int(src.height*.48)));face=contain(face,256,.03);face.save(ROOT/f'public/assets/face-icons/{hid}.webp','WEBP',quality=90,method=6)
 summon=contain(src,512,.045);summon.save(ROOT/f'public/assets/summon-icons/{hid}.webp','WEBP',quality=90,method=6)
 idle=contain(src,160,.1); (ROOT/f'public/assets/heroes/{hid}').mkdir(parents=True,exist_ok=True)
 idle.save(ROOT/f'public/assets/heroes/{hid}.png',optimize=True)
 # Deployment idle is deliberately motionless: no attack/recoil pose may leak
 # into the pre-battle lineup. All three timing frames share the neutral art.
 for f in range(1,4):idle.save(ROOT/f'public/assets/heroes/{hid}/frame_{f:02}.png',optimize=True)
 combat=ROOT/f'public/assets/combat/{hid}';combat.mkdir(parents=True,exist_ok=True)
 for f in range(1,9):pose(idle,f,8).save(combat/f'frame_{f:02}.png',optimize=True)
 for f in range(1,7):
  pose(idle,f,6,up=True).save(combat/f'up6_{f:02}.png',optimize=True)
  pose(idle,f,6,skill=True).save(combat/f'skill_{f:02}.png',optimize=True)
 eff=ROOT/f'public/assets/effects/{hid}';eff.mkdir(parents=True,exist_ok=True);color=COLORS[hid]
 for f in range(1,4):
  effect(color,f,3,128).save(eff/f'projectile_{f:02}.png',optimize=True)
  effect(color,f,3,192).save(eff/f'impact_{f:02}.png',optimize=True)
 effect(color,3,4,256).save(eff/'skill.png',optimize=True)
 defeat=ROOT/f'public/assets/generated/hero-defeat/{hid}';defeat.mkdir(parents=True,exist_ok=True)
 for f in range(1,4):
  down=idle.rotate(18*f,resample=Image.Resampling.BICUBIC);down.putalpha(down.getchannel('A').point(lambda a:int(a*(1-f*.18))));down.save(defeat/f'frame_{f:02}.webp','WEBP',lossless=True,method=6)
 if hid in {'daeun','freya','eir','minseo','valen'}:
  support=ROOT/f'public/assets/generated/support-skills/{hid}';support.mkdir(parents=True,exist_ok=True)
  for f in range(1,5):effect(color,f,4,384).save(support/f'frame_{f:02}.webp','WEBP',lossless=True,method=6)
print('installed',len(SOURCES),'new hero art packs')
