from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'public'/'assets'/'generated'/'tank-skills'/'source'
OUT=ROOT/'public'/'assets'/'generated'/'tank-skills'

for hero in ('yuria','mia','leon','neris','livia'):
    sheet=Image.open(SOURCE/f'{hero}.png').convert('RGBA')
    frame_width=sheet.width//3
    target=OUT/hero;target.mkdir(parents=True,exist_ok=True)
    for frame in range(3):
        image=sheet.crop((frame*frame_width,0,(frame+1)*frame_width,sheet.height))
        box=image.getchannel('A').getbbox()
        if not box:raise RuntimeError(f'empty frame: {hero} {frame+1}')
        image=image.crop(box)
        ratio=min(232/image.width,232/image.height)
        image=image.resize((max(1,round(image.width*ratio)),max(1,round(image.height*ratio))),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',(256,256),(0,0,0,0))
        canvas.alpha_composite(image,((256-image.width)//2,(256-image.height)//2))
        canvas.save(target/f'frame_{frame+1:02}.webp','WEBP',lossless=True,quality=95)

print('installed 15 tank skill VFX frames')
