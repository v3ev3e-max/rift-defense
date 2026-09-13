from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
ids=sorted(p.name for p in (ROOT/'public/assets/heroes').iterdir() if p.is_dir())
for start in range(0,len(ids),7):
    canvas=Image.new('RGB',(550,1120),'#243040');d=ImageDraw.Draw(canvas)
    for row,id in enumerate(ids[start:start+7]):
        d.text((2,row*160+70),id,fill='white')
        for f in range(1,4):
            im=Image.open(ROOT/f'public/assets/heroes/{id}/frame_{f:02}.png').convert('RGBA')
            canvas.paste(im,(70+(f-1)*160,row*160),im)
    canvas.save(ROOT/f'artifacts/visual-audit/heroes-{start}.png')
