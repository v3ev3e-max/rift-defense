from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'artifacts/visual-audit'
ids=sorted(p.name for p in (ROOT/'public/assets/heroes').iterdir() if p.is_dir())
for theme in ('dark','light'):
    for start in range(0,len(ids),7):
        page=Image.new('RGB',(1000,1040),'#202c3c')
        for i,id in enumerate(ids[start:start+7]):
            im=Image.open(out/f'after-{id}-{theme}.png');im.thumbnail((500,260))
            page.paste(im,((i%2)*500,(i//2)*260))
        page.save(out/f'review-{theme}-{start}.jpg',quality=95)
