"""Mechanically extract authored imagegen frames; no invented/interpolated art."""
from pathlib import Path
from PIL import Image
import hashlib

ROOT = Path(__file__).resolve().parents[1]
NAMES = ['arrival','turn','sr-charge','ssr-crack','sr-reveal','ssr-reveal']
seen=set()
failures=[]
for name in NAMES:
    sheet=Image.open(ROOT/f'art-source/recruit-animation/{name}.png').convert('RGBA')
    frames=[]
    for i in range(8):
        x=i%4;y=i//4
        cell=sheet.crop((round(sheet.width*x/4),round(sheet.height*y/2),round(sheet.width*(x+1)/4),round(sheet.height*(y+1)/2)))
        a=cell.getchannel('A')
        edge=max(a.crop(box).getextrema()[1] for box in [(0,0,cell.width,1),(0,cell.height-1,cell.width,cell.height),(0,0,1,cell.height),(cell.width-1,0,cell.width,cell.height)])
        print(name,i+1,'edge alpha',edge)
        if edge>24:failures.append(f'{name} {i+1} ({edge})')
        frames.append(cell)
    if any(v.startswith(name+' ') for v in failures):continue
    # Remove only shared excess transparent gutter, never zoom individual poses.
    # One union crop keeps every frame anchored and all effects visible.
    boxes=[f.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox() for f in frames]
    assert all(boxes),f'Empty authored frame: {name}'
    union=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
    frames=[f.crop(union) for f in frames]
    # Uniform scale for each sheet, not independent bounding-box zooms.
    scale=min(448/max(f.width for f in frames),448/max(f.height for f in frames))
    for i,frame in enumerate(frames):
        frame=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
        out=Image.new('RGBA',(512,512));out.alpha_composite(frame,((512-frame.width)//2,(512-frame.height)//2))
        digest=hashlib.sha256(out.tobytes()).hexdigest()
        assert digest not in seen,f'Duplicate frame {name} {i}'
        seen.add(digest)
        folder=ROOT/f'public/assets/ui/recruit/animations/{name}';folder.mkdir(parents=True,exist_ok=True)
        out.save(folder/f'frame_{i+1:02d}.webp','WEBP',lossless=True)
if failures:raise ValueError('Clipped/overlapping authored frames: '+', '.join(failures))
print(f'{len(seen)} distinct authored frames packed with 32px safety margin')
