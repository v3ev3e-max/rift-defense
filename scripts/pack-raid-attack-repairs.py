"""Pack isolated authored attack grids; reject source-edge clipping before padding."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json

ROOT = Path(__file__).resolve().parents[1]

def gutter(density, center, radius):
    lo, hi = center-radius, center+radius
    candidates = np.where(density[lo:hi] == 0)[0]+lo
    if not len(candidates):
        raise ValueError('No fully transparent source gutter')
    anchor = int(candidates[np.argmin(abs(candidates-center))])
    left = right = anchor
    while left > lo and density[left-1] == 0: left -= 1
    while right+1 < hi and density[right+1] == 0: right += 1
    return (left+right)//2

audit = []
contact = Image.new('RGB', (1200, 400), '#152531')
draw = ImageDraw.Draw(contact)
for row, boss in enumerate(['void-observer', 'machine-god']):
    image = Image.open(ROOT/f'art-source/raid-attack-repairs/{boss}.png').convert('RGBA')
    mask = np.array(image.getchannel('A')) > 24
    middle = gutter(mask.sum(axis=1), image.height//2, image.height//10)
    frames = []
    for top, bottom in [(0, middle), (middle, image.height)]:
        density = mask[top:bottom].sum(axis=0)
        cuts = [0]+[gutter(density, image.width*i//3, image.width//12) for i in (1,2)]+[image.width]
        for left, right in zip(cuts, cuts[1:]):
            cell = image.crop((left, top, right, bottom))
            box = cell.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
            assert box and min(box[0], box[1], cell.width-box[2], cell.height-box[3]) >= 2, (boss, len(frames), box)
            # Retain detached authored eyes/particles, not just the largest component.
            frames.append(cell.crop(box))
    scale = min(512*.72/max(f.width for f in frames), 512*.72/max(f.height for f in frames))
    sheet = Image.new('RGBA', (3072,512))
    for i, frame in enumerate(frames):
        frame = frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
        sheet.alpha_composite(frame,(i*512+(512-frame.width)//2,451-frame.height))
        preview = frame.copy(); preview.thumbnail((190,175))
        contact.paste(preview,(i*200+(200-preview.width)//2,row*200+190-preview.height),preview)
    dest = ROOT/f'public/assets/generated/raid-v4/bosses/{boss}'
    dest.mkdir(parents=True,exist_ok=True)
    sheet.save(dest/'attack.webp',lossless=True)
    draw.text((4,row*200+4),boss,fill='white')
    audit.append({'boss':boss,'frames':6,'baseline':451,'rowGutter':middle,'sourceEdgeCheck':'passed'})
contact.save(ROOT/'artifacts/raid-attack-repairs.png')
(ROOT/'artifacts/raid-attack-repairs.json').write_text(json.dumps(audit,indent=2))
print(json.dumps(audit))
