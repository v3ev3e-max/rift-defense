from PIL import Image,ImageDraw
from pathlib import Path
root=Path(__file__).resolve().parents[1]
ids=['yuria','reina','arin','karin','sera','noel','luna','mia','ian','leon','adela','neris','belka','serin','kyle','livia','kairon','theria','noxia','aurora','arden']
for start in range(0,21,7):
    sheet=Image.new('RGB',(1400,270),'#202936');draw=ImageDraw.Draw(sheet)
    for i,id in enumerate(ids[start:start+7]):
        folder=root/'public/assets/portraits'
        p=folder/(id+'.jpg')
        if not p.exists():p=folder/(id+'.png')
        im=Image.open(p).convert('RGBA');im.thumbnail((190,240))
        sheet.paste(im,(i*200+(200-im.width)//2,25),im);draw.text((i*200+10,5),id,fill='white')
    sheet.save(root/f'artifacts/visual-audit/references-{start}.png')
