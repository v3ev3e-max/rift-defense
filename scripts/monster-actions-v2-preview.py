"""Contact sheet for all packed frames; inspection only."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
rows=[]
for root in ['public/assets/generated/monster-actions-v2','public/assets/generated/raid-summon-actions-v2']:
 for manifest in sorted(Path(root).glob('*/manifest.json')):
  data=json.loads(manifest.read_text(encoding='utf-8'));rows.append(data)
for page in range((len(rows)+7)//8):
 batch=rows[page*8:(page+1)*8];out=Image.new('RGB',(1280,len(batch)*128),(20,30,38));draw=ImageDraw.Draw(out)
 for y,data in enumerate(batch):
  draw.text((2,y*128+112),data['owner'],fill='white')
  for i,row in enumerate(data['rows']):
   with Image.open(row['file']) as source:
    image=source.convert('RGBA');image.thumbnail((100,100));out.paste(image,(i*104+12,y*128+3),image)
    draw.text((i*104+12,y*128+101),row['state']+str(row['frame']),fill='white')
 out.save(f'artifacts/monster-actions-v2/preview-{page+1:02d}.jpg')
print(f'{len(rows)} owners rendered to inspection contact sheets')
