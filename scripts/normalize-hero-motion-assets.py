"""Add safe transparent gutters without changing the in-game silhouette size.

The source art is scaled around its render anchor. WeaponSockets compensates
with the reciprocal display scale, so animation placement remains unchanged.
The operation is intentionally one-shot: already padded files are skipped.
"""
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SCALE=.925
MARGIN=5
DEFEAT_HEROES={'astra','celestia','echo','elise','gaia','hana','meriel','ophilia','rhea','selene','solara','vera','zion'}

def bounds(image:Image.Image):
    return image.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()

def touches(image:Image.Image):
    box=bounds(image)
    return bool(box and min(box[0],box[1],image.width-box[2],image.height-box[3])<2)

def anchored_scale(image:Image.Image,anchor):
    width,height=image.size
    resized=image.resize((round(width*SCALE),round(height*SCALE)),Image.Resampling.LANCZOS)
    x=round(anchor[0]-anchor[0]*SCALE)
    y=round(anchor[1]-anchor[1]*SCALE)
    canvas=Image.new('RGBA',image.size)
    canvas.alpha_composite(resized,(x,y))
    return canvas

changed=[]
hana=ROOT/'public/assets/combat/hana'
hana_paths=[hana/f'frame_{n:02}.png' for n in range(1,9)]+[hana/f'up6_{n:02}.png' for n in range(1,7)]
if any(touches(Image.open(path).convert('RGBA')) for path in hana_paths):
    for path in hana_paths:
        anchored_scale(Image.open(path).convert('RGBA'),(80,142)).save(path,optimize=True)
        changed.append(path)

for hero in DEFEAT_HEROES:
    paths=sorted((ROOT/'public/assets/generated/hero-defeat'/hero).glob('frame_*.webp'))
    if any(touches(Image.open(path).convert('RGBA')) for path in paths):
        for path in paths:
            anchored_scale(Image.open(path).convert('RGBA'),(80,80)).save(path,'WEBP',quality=95,method=6)
            changed.append(path)

for path in changed:
    image=Image.open(path).convert('RGBA');box=bounds(image)
    if not box or min(box[0],box[1],image.width-box[2],image.height-box[3])<MARGIN:
        raise RuntimeError(f'normalization failed: {path} {box}')
print(f'normalized {len(changed)} hero motion frames')
