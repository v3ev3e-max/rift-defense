from __future__ import annotations
from pathlib import Path
from PIL import Image
import hashlib

ROOT=Path(__file__).resolve().parents[1]
V2=ROOT/'public/assets/generated/raid-v2'
COMBAT=ROOT/'public/assets/combat'
FRAME=512

def alpha_crop(path:Path):
    im=Image.open(path).convert('RGBA'); box=im.getchannel('A').getbbox()
    return im.crop(box) if box else im

def pack(paths:list[Path],out:Path,frame=FRAME,margin=.16):
    images=[alpha_crop(p) for p in paths]
    usable=int(frame*(1-margin*2))
    scale=min(usable/max(im.width for im in images),usable/max(im.height for im in images))
    sheet=Image.new('RGBA',(frame*len(images),frame))
    for i,im in enumerate(images):
        im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
        x=i*frame+(frame-im.width)//2; y=frame-int(frame*margin)-im.height
        sheet.alpha_composite(im,(x,max(round(frame*margin),y)))
    out.parent.mkdir(parents=True,exist_ok=True);sheet.save(out,'WEBP',quality=90,method=4)
    return hashlib.sha256(out.read_bytes()).hexdigest()

def main():
    hashes=[]
    for folder in sorted((V2/'bosses').iterdir()):
        if not folder.is_dir(): continue
        for pose,count in [('idle',4),('attack',6),('phase',4),('hit',3)]:
            hashes.append(pack([folder/f'{pose}_{i:02}.webp' for i in range(1,count+1)],folder/f'{pose}-sheet.webp'))
    hero_count=0
    for folder in sorted(COMBAT.iterdir()):
        paths=[folder/f'skill_{i:02}.png' for i in range(1,7)]
        if not all(p.exists() for p in paths): continue
        hashes.append(pack(paths,V2/'heroes'/f'{folder.name}-skill.webp',384,.2));hero_count+=1
    assert hero_count>=44, f'expected all heroes, got {hero_count}'
    assert len(hashes)==len(set(hashes)), 'duplicate raid sprite sheet'
    print(f'raid sprite sheets: {hero_count} heroes + 20 boss actions')

if __name__=='__main__': main()
