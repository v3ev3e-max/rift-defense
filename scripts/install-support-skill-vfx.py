from pathlib import Path
from PIL import Image

ROOT=Path(__file__).parents[1]
source=ROOT/'public/assets/generated/support-skills/source/support-skill-atlas-v2.png'
image=Image.open(source).convert('RGBA')
heroes=['yuria','mia','leon','neris','livia']
width,height=image.size
cell_width,cell_height=width//4,height//5
output=source.parents[1]
for row,hero in enumerate(heroes):
    target=output/hero
    target.mkdir(parents=True,exist_ok=True)
    for column in range(4):
        right=(column+1)*cell_width if column<3 else width
        bottom=(row+1)*cell_height if row<4 else height
        frame=image.crop((column*cell_width,row*cell_height,right,bottom))
        frame.resize((256,256),Image.Resampling.LANCZOS).save(target/f'frame_{column+1:02}.webp','WEBP',lossless=True,quality=95)
print(f'{image.size}, alpha={image.getextrema()[3]}, created={len(heroes)*4}')
