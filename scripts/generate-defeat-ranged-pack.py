from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'public'/'assets'

def fit(im,size,scale=1.0,dx=0,dy=0,angle=0):
    im=im.convert('RGBA')
    box=im.getchannel('A').getbbox()
    out=Image.new('RGBA',(size,size),(0,0,0,0))
    if not box:return out
    crop=im.crop(box)
    ratio=min(size*.78/crop.width,size*.78/crop.height)*scale
    crop=crop.resize((max(1,round(crop.width*ratio)),max(1,round(crop.height*ratio))),Image.Resampling.LANCZOS)
    if angle:crop=crop.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    out.alpha_composite(crop,((size-crop.width)//2+dx,(size-crop.height)//2+dy))
    return out

# Preserve every operator's exact source appearance while baking three distinct fall poses.
hero_root=ASSETS/'heroes'
defeat_root=ASSETS/'generated'/'hero-defeat'
for hero_dir in sorted(p for p in hero_root.iterdir() if p.is_dir() and (p/'frame_01.png').exists()):
    source=Image.open(hero_dir/'frame_01.png')
    target=defeat_root/hero_dir.name;target.mkdir(parents=True,exist_ok=True)
    for frame,(angle,scale,dx,dy,alpha) in enumerate([(-12,.96,0,1,255),(-52,.87,5,4,238),(-86,.80,8,7,205)],1):
        image=fit(source,192,scale,dx,dy,angle)
        a=image.getchannel('A').point(lambda v:v*alpha//255);image.putalpha(a)
        image.save(target/f'frame_{frame:02}.webp','WEBP',lossless=True,quality=95)

# Ranged enemies get baked charge/recoil poses rather than runtime-only deformation.
fire_root=ASSETS/'generated'/'enemy-fire'
colors={'armored':(112,220,255,230),'jammer':(211,102,255,235),'phantom':(134,211,255,235)}
for kind,color in colors.items():
    source=Image.open(ASSETS/'generated'/'enemy-motion'/kind/'move_01.webp')
    target=fire_root/kind;target.mkdir(parents=True,exist_ok=True)
    for frame,(scale,dx) in enumerate([(1,0),(.94,-5),(.9,-9)],1):
        image=fit(source,256,scale,dx,0,0)
        glow=Image.new('RGBA',image.size,(0,0,0,0));draw=ImageDraw.Draw(glow)
        radius=12+frame*8;cx=72-frame*4;cy=116
        draw.ellipse((cx-radius,cy-radius,cx+radius,cy+radius),outline=color,width=3)
        glow=glow.filter(ImageFilter.GaussianBlur(1.2))
        image=Image.alpha_composite(glow,image)
        image.save(target/f'frame_{frame:02}.webp','WEBP',lossless=True,quality=95)

# Bake a three-frame hostile bolt and three-frame arrival burst from the generated transparent source.
source=Image.open(ASSETS/'generated'/'enemy-projectiles'/'rift_bolt.png').convert('RGBA')
box=source.getchannel('A').getbbox();source=source.crop(box)
projectile_root=ASSETS/'generated'/'enemy-projectiles';impact_root=ASSETS/'generated'/'enemy-ranged-impact'
impact_root.mkdir(parents=True,exist_ok=True)
for frame,brightness in enumerate((.86,1.12,.96),1):
    bolt=ImageEnhance.Brightness(source).enhance(brightness)
    canvas=Image.new('RGBA',(256,96),(0,0,0,0));ratio=min(236/bolt.width,78/bolt.height)
    bolt=bolt.resize((round(bolt.width*ratio),round(bolt.height*ratio)),Image.Resampling.LANCZOS)
    canvas.alpha_composite(bolt,((256-bolt.width)//2,(96-bolt.height)//2))
    canvas.save(projectile_root/f'rift_bolt_{frame:02}.webp','WEBP',lossless=True,quality=95)
    impact=Image.new('RGBA',(128,128),(0,0,0,0));draw=ImageDraw.Draw(impact);r=(22,38,55)[frame-1]
    draw.ellipse((64-r,64-r,64+r,64+r),outline=(238,115,255,(255,220,130)[frame-1]),width=(10,7,4)[frame-1])
    draw.line((64-r,64,64+r,64),fill=(255,230,255,180),width=3);draw.line((64,64-r,64,64+r),fill=(142,232,255,170),width=3)
    impact=impact.filter(ImageFilter.GaussianBlur((.3,.7,1.1)[frame-1]))
    impact.save(impact_root/f'frame_{frame:02}.webp','WEBP',lossless=True,quality=95)

print('generated',len(list(defeat_root.glob('*/frame_*.webp'))),'hero defeat frames, 9 enemy fire frames, 6 projectile/impact frames')
