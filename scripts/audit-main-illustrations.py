from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
IDS=['yuria','reina','arin','karin','sera','noel','luna','mia','ian','leon','adela','neris','belka','serin','kyle','livia','kairon','theria','noxia','aurora','arden']
PNG={'yuria','reina','arin','karin','sera','adela','neris','belka','serin','kyle','livia','kairon','theria','noxia','aurora','arden'}
OUT=ROOT/'artifacts/illustration-audit'

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    canvas=Image.new('RGB',(1200,1600),'#101a27');draw=ImageDraw.Draw(canvas)
    for i,id in enumerate(IDS):
        col=i%4;row=i//4;x=col*300;y=row*260
        path=ROOT/'public/assets/illustrations'/f'{id}.webp'
        im=Image.open(path).convert('RGBA')
        thumb=Image.new('RGBA',(270,220),(28,43,58,255))
        copy=im.copy();copy.thumbnail((260,210),Image.Resampling.LANCZOS)
        thumb.alpha_composite(copy,((270-copy.width)//2,210-copy.height))
        canvas.paste(thumb.convert('RGB'),(x+15,y+26))
        draw.text((x+18,y+5),f'{i+1:02} {id}  {im.width}x{im.height}',fill='#d7fff2')
    canvas.save(OUT/'main-illustrations.jpg',quality=92)
    icons=Image.new('RGB',(1000,750),'#101a27');icon_draw=ImageDraw.Draw(icons)
    for i,id in enumerate(IDS):
        x=(i%7)*142;y=(i//7)*250
        source=Image.open(ROOT/f'public/assets/summon-icons/{id}.webp').convert('RGBA').resize((132,190),Image.Resampling.LANCZOS)
        tile=Image.new('RGBA',source.size,(28,43,58,255));tile.alpha_composite(source)
        icons.paste(tile.convert('RGB'),(x+5,y+25));icon_draw.text((x+6,y+5),f'{i+1:02} {id}',fill='#d7fff2')
    icons.save(OUT/'summon-icons.jpg',quality=92)
    faces=Image.new('RGB',(1000,750),'#101a27');face_draw=ImageDraw.Draw(faces)
    for i,id in enumerate(IDS):
        x=(i%7)*142;y=(i//7)*250
        source=Image.open(ROOT/f'public/assets/face-icons/{id}.webp').convert('RGBA').resize((132,190),Image.Resampling.LANCZOS)
        tile=Image.new('RGBA',source.size,(28,43,58,255));tile.alpha_composite(source)
        faces.paste(tile.convert('RGB'),(x+5,y+25));face_draw.text((x+6,y+5),f'{i+1:02} {id}',fill='#d7fff2')
    faces.save(OUT/'face-icons.jpg',quality=92)

if __name__=='__main__':main()
