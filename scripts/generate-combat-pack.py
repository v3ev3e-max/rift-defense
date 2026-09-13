from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math, json, re

ROOT=Path(__file__).resolve().parents[1]
PUB=ROOT/'public'/'assets'
HERO=PUB/'heroes'
OUT=PUB/'combat'
UI=PUB/'ui'
FX=PUB/'effects'/'common'
EN=PUB/'enemies'
for p in (OUT,UI,FX,EN): p.mkdir(parents=True, exist_ok=True)

src=(ROOT/'src'/'data'/'heroes.ts').read_text(encoding='utf-8')
ids=re.findall(r'id: "([a-z0-9_-]+)"',src)
# only first 21 hero ids before non-hero references are encountered
hero_ids=[]
for i in ids:
    if (HERO/i).is_dir() and i not in hero_ids: hero_ids.append(i)
hero_ids=hero_ids[:21]

grades={}
for m in re.finditer(r'id: "([^"]+)"[\s\S]{0,500}?grade: "([^"]+)"',src): grades[m.group(1)]=m.group(2)
elements={}
for m in re.finditer(r'id: "([^"]+)"[\s\S]{0,700}?element: "([^"]+)"',src): elements[m.group(1)]=m.group(2)
range_types={}
for m in re.finditer(r'id: "([^"]+)"[\s\S]{0,500}?rangeType: "([^"]+)"',src): range_types[m.group(1)]=m.group(2)

# Standardize transparent character occupancy: consistent bottom baseline and body height.
def normalize(im:Image.Image, target_h=132, canvas=160):
    im=im.convert('RGBA')
    alpha=im.getchannel('A')
    box=alpha.getbbox()
    out=Image.new('RGBA',(canvas,canvas),(0,0,0,0))
    if not box: return out
    crop=im.crop(box)
    scale=min(target_h/crop.height, 126/max(1,crop.width))
    nw=max(1,round(crop.width*scale)); nh=max(1,round(crop.height*scale))
    crop=crop.resize((nw,nh),Image.Resampling.LANCZOS)
    # keep feet on y=146, centered horizontally
    x=(canvas-nw)//2; y=146-nh
    out.alpha_composite(crop,(x,y))
    return out

# Frames are generated from existing hand-authored 3F poses, but normalized and extended to 8F at 12 FPS.
# The slight offsets improve motion readability without changing character identity.
seq=[0,0,1,1,2,2,1,0]
shifts_ranged=[(0,0),(0,1),(-2,0),(-4,0),(-5,1),(-3,1),(-1,0),(0,0)]
shifts_melee=[(0,0),(1,1),(3,0),(6,-1),(8,0),(5,1),(2,0),(0,0)]
for hid in hero_ids:
    od=OUT/hid; od.mkdir(parents=True, exist_ok=True)
    bases=[]
    for n in (1,2,3):
        p=HERO/hid/f'frame_{n:02}.png'
        bases.append(normalize(Image.open(p)))
    shifts=shifts_melee if range_types.get(hid)=='melee' else shifts_ranged
    for idx,srcidx in enumerate(seq,1):
        frame=Image.new('RGBA',(160,160),(0,0,0,0))
        dx,dy=shifts[idx-1]
        frame.alpha_composite(bases[srcidx],(dx,dy))
        frame.save(od/f'frame_{idx:02}.png',optimize=True)

# shared summon emblems
GRADE_COLORS={'B':(113,151,189),'A':(229,191,114),'S':(186,116,255),'SR':(255,111,216)}
for grade,c in GRADE_COLORS.items():
    im=Image.new('RGBA',(192,192),(0,0,0,0)); d=ImageDraw.Draw(im)
    cx=cy=96
    # soft concentric glow
    for r,a in [(78,20),(66,32),(55,48),(43,70)]:
        glow=Image.new('RGBA',im.size,(0,0,0,0)); gd=ImageDraw.Draw(glow)
        gd.ellipse((cx-r,cy-r,cx+r,cy+r),outline=(*c,a),width=6)
        glow=glow.filter(ImageFilter.GaussianBlur(4))
        im=Image.alpha_composite(im,glow)
    d=ImageDraw.Draw(im)
    d.ellipse((30,30,162,162),outline=(*c,220),width=5)
    d.ellipse((47,47,145,145),outline=(*c,145),width=3)
    # four-point crystal
    pts=[(96,46),(112,80),(146,96),(112,112),(96,146),(80,112),(46,96),(80,80)]
    d.polygon(pts,fill=(*c,88),outline=(*c,245))
    d.line((64,96,128,96),fill=(255,255,255,180),width=2)
    d.line((96,64,96,128),fill=(255,255,255,180),width=2)
    im.save(UI/f'summon_{grade}.png',optimize=True)

# slot summon indicator
im=Image.new('RGBA',(128,128),(0,0,0,0)); d=ImageDraw.Draw(im)
for r,a in [(50,40),(42,75)]: d.ellipse((64-r,64-r,64+r,64+r),outline=(130,245,213,a),width=4)
d.line((64,35,64,93),fill=(190,255,235,240),width=7); d.line((35,64,93,64),fill=(190,255,235,240),width=7)
d.ellipse((51,51,77,77),outline=(255,255,255,210),width=2)
im.save(UI/'summon_slot.png',optimize=True)

# element FX icons/projectiles/impacts
ELEM={'fire':(255,105,73),'water':(85,201,255),'electric':(255,224,84),'dark':(175,106,255)}
for name,c in ELEM.items():
    # projectile
    im=Image.new('RGBA',(128,64),(0,0,0,0)); d=ImageDraw.Draw(im)
    for i in range(7):
        a=max(20,120-i*15); x=20+i*8
        d.ellipse((x,20-i//2,x+44,44+i//2),fill=(*c,a))
    d.ellipse((70,16,118,48),fill=(*c,230),outline=(255,255,255,190),width=2)
    im=im.filter(ImageFilter.GaussianBlur(1.2)); im.save(FX/f'{name}_projectile.png',optimize=True)
    # impact
    im=Image.new('RGBA',(128,128),(0,0,0,0)); d=ImageDraw.Draw(im)
    for r,a in [(48,40),(36,75),(23,135)]: d.ellipse((64-r,64-r,64+r,64+r),outline=(*c,a),width=6)
    for k in range(8):
        a=math.tau*k/8; r1=18; r2=55
        d.line((64+math.cos(a)*r1,64+math.sin(a)*r1,64+math.cos(a)*r2,64+math.sin(a)*r2),fill=(*c,180),width=4)
    d.ellipse((49,49,79,79),fill=(255,255,255,170))
    im=im.filter(ImageFilter.GaussianBlur(0.8)); im.save(FX/f'{name}_impact.png',optimize=True)
    # mark
    im=Image.new('RGBA',(64,64),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.ellipse((8,8,56,56),outline=(*c,230),width=4); d.ellipse((20,20,44,44),fill=(*c,190)); d.ellipse((27,27,37,37),fill=(255,255,255,220))
    im.save(FX/f'{name}_mark.png',optimize=True)

# class-specific readable FX
class_fx={'ballistic':((255,214,124),'cross'),'arcane':((197,124,255),'burst'),'machine':((104,229,214),'drone'),'melee':((255,118,150),'slash')}
for name,(c,kind) in class_fx.items():
    im=Image.new('RGBA',(128,128),(0,0,0,0)); d=ImageDraw.Draw(im)
    if kind=='cross':
        d.line((18,64,110,64),fill=(*c,230),width=7); d.ellipse((75,48,111,80),outline=(255,255,255,200),width=3)
    elif kind=='burst':
        for k in range(10):
            a=math.tau*k/10; d.line((64+math.cos(a)*18,64+math.sin(a)*18,64+math.cos(a)*52,64+math.sin(a)*52),fill=(*c,185),width=5)
        d.ellipse((38,38,90,90),outline=(*c,230),width=4)
    elif kind=='drone':
        d.rounded_rectangle((35,45,93,83),10,fill=(*c,175),outline=(255,255,255,220),width=3); d.line((20,64,108,64),fill=(*c,180),width=4)
    else:
        d.arc((8,8,120,120),205,335,fill=(*c,245),width=10); d.arc((20,16,118,116),205,330,fill=(255,255,255,170),width=3)
    im=im.filter(ImageFilter.GaussianBlur(.5)); im.save(FX/f'class_{name}.png',optimize=True)

# Enemy silhouettes: larger and category-distinct instead of runtime 32x32 boxes.
ENEMY_COLORS={
'crawler':(212,134,200),'runner':(255,182,90),'brute':(163,141,224),'armored':(130,155,187),'jammer':(105,195,213),
'bulwark':(119,144,170),'sprinter':(255,207,102),'phantom':(125,217,255),'elite':(246,120,145),
'ravager':(255,131,107),'sovereign':(163,144,255),'tempest':(101,216,255),'abyssal':(208,113,255)}
bosses={'ravager','sovereign','tempest','abyssal'}
for eid,c in ENEMY_COLORS.items():
    size=128 if eid in bosses else 96
    im=Image.new('RGBA',(size,size),(0,0,0,0)); d=ImageDraw.Draw(im)
    cx=size//2; ground=int(size*.84)
    if eid in bosses:
        d.ellipse((cx-34,ground-76,cx+34,ground-8),fill=(13,20,34,245),outline=(*c,245),width=5)
        d.polygon([(cx-50,ground-40),(cx-22,ground-55),(cx-14,ground-12)],fill=(*c,185))
        d.polygon([(cx+50,ground-40),(cx+22,ground-55),(cx+14,ground-12)],fill=(*c,185))
        d.polygon([(cx-28,ground-77),(cx,ground-100),(cx+28,ground-77)],fill=(*c,215))
        d.ellipse((cx-8,ground-55,cx+8,ground-39),fill=(255,255,255,220))
    else:
        bulky=eid in {'brute','armored','bulwark','elite'}
        fast=eid in {'runner','sprinter'}
        w=44 if bulky else 34; h=55 if bulky else 48
        d.rounded_rectangle((cx-w//2,ground-h,cx+w//2,ground),9,fill=(12,19,31,245),outline=(*c,235),width=4)
        d.ellipse((cx-18,ground-h-18,cx+18,ground-h+17),fill=(*c,205),outline=(235,245,255,180),width=2)
        if fast:
            d.polygon([(cx-24,ground-28),(cx-46,ground-8),(cx-17,ground-14)],fill=(*c,190)); d.polygon([(cx+24,ground-28),(cx+46,ground-8),(cx+17,ground-14)],fill=(*c,190))
        elif eid in {'jammer','phantom'}:
            d.arc((cx-34,ground-h-30,cx+34,ground-h+38),200,340,fill=(*c,190),width=5)
        else:
            d.rectangle((cx-w//2-8,ground-h+10,cx-w//2+4,ground-10),fill=(*c,175)); d.rectangle((cx+w//2-4,ground-h+10,cx+w//2+8,ground-10),fill=(*c,175))
        d.ellipse((cx-7,ground-h-9,cx+7,ground-h+3),fill=(255,255,255,210))
    im.save(EN/f'{eid}.png',optimize=True)

manifest={
 'heroes':hero_ids,
 'frames_per_hero':8,
 'visual_fps':12,
 'grades':grades,
 'elements':elements,
 'generated':['ui/summon_B.png','ui/summon_A.png','ui/summon_S.png','ui/summon_SR.png','ui/summon_slot.png'],
 'enemy_count':len(ENEMY_COLORS)
}
(ROOT/'COMBAT_ASSET_PACK.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'generated combat pack for {len(hero_ids)} heroes')
