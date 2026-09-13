from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
IDS=['livia','kairon','theria','noxia','aurora','arden']
OUT=ROOT/'artifacts/illustration-audit/reference-six.png'

canvas=Image.new('RGBA',(1200,260),(18,31,44,255));draw=ImageDraw.Draw(canvas)
for i,id in enumerate(IDS):
    image=Image.open(ROOT/f'public/assets/heroes/{id}/frame_01.png').convert('RGBA').resize((200,200),Image.Resampling.NEAREST)
    canvas.alpha_composite(image,(i*200,34))
    draw.text((i*200+8,8),f'{i+1}. {id}',fill='white')
canvas.save(OUT)
