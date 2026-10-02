"""Read existing references into an inspection sheet; does not edit game assets."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
rows=json.loads(Path('artifacts/monster-actions-v2/worklist.json').read_text(encoding='utf-8'))
sheet=Image.new('RGB',(1200,((len(rows)+7)//8)*140),(24,30,42));draw=ImageDraw.Draw(sheet)
for i,row in enumerate(rows):
 with Image.open(row['reference']) as source:
  image=source.convert('RGBA');image.thumbnail((110,110))
  x=(i%8)*150;y=(i//8)*140;sheet.paste(image,(x+(150-image.width)//2,y),image)
  draw.text((x+3,y+112),row['id'],fill='white')
sheet.save('artifacts/monster-actions-v2/references.jpg')
