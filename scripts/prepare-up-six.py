from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]/'public/assets/combat'
for hero in ROOT.iterdir():
    if not hero.is_dir(): continue
    a,b,c=[Image.open(hero/f'up_{i:02}.png').convert('RGBA') for i in range(1,4)]
    frames=[a,Image.blend(a,b,.5),b,Image.blend(b,c,.5),c,Image.blend(c,a,.55)]
    for i,frame in enumerate(frames,1):frame.save(hero/f'up6_{i:02}.png')
