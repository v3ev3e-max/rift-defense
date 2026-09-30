from pathlib import Path
from PIL import Image, ImageDraw
import json
root=Path(__file__).resolve().parents[1]
source=Path(r'C:/Users/PC/.codex/generated_images/01a0bcec-3497-7643-a99a-cfa603eae514')
files=sorted(source.glob('*.png'),key=lambda p:p.stat().st_mtime)
out=root/'artifacts/raid-source-audit';out.mkdir(parents=True,exist_ok=True)
(out/'files.json').write_text(json.dumps([str(p) for p in files]),encoding='utf8')
for page in range((len(files)+31)//32):
 canvas=Image.new('RGB',(1200,1200),'#152531');draw=ImageDraw.Draw(canvas)
 for n,p in enumerate(files[page*32:(page+1)*32]):
  im=Image.open(p).convert('RGBA');im.thumbnail((290,125));x=(n%4)*300;y=(n//4)*150
  canvas.paste(im,(x,y),im);draw.text((x+3,y+127),f'{page*32+n}: {p.name[5:13]}',fill='white')
 canvas.save(out/f'page-{page}.jpg')
print(len(files))
