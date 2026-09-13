from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'public/assets/generated/enemies';OUT=ROOT/'public/assets/generated/enemy-motion'
BOSSES={'sovereign','tempest','abyssal','ravager'}
OUT.mkdir(parents=True,exist_ok=True)
for path in SRC.glob('*.webp'):
    base=Image.open(path).convert('RGBA');base.thumbnail((220,220),Image.Resampling.LANCZOS)
    count=8 if path.stem in BOSSES else 6
    folder=OUT/path.stem;folder.mkdir(exist_ok=True)
    for i in range(count):
        phase=i/count
        sx=1+(0.035 if i%2==0 else -0.025);sy=1/sx
        frame=base.resize((max(1,int(base.width*sx)),max(1,int(base.height*sy))),Image.Resampling.LANCZOS).rotate((-1.4,0,1.4,0,-1,1,0,1)[i%8],Image.Resampling.BICUBIC,expand=True)
        canvas=Image.new('RGBA',(256,256));canvas.alpha_composite(frame,((256-frame.width)//2,(256-frame.height)//2-(2 if i%3==1 else 0)))
        canvas.save(folder/f'move_{i+1:02}.webp','WEBP',quality=90,method=6)
