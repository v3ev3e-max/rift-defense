"""Read-only overview of the portrait assets used by every operator."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
paths=sorted(Path('public/assets/face-icons').glob('*.webp'))
canvas=Image.new('RGB',(1100,((len(paths)+7)//8)*145),(22,35,45))
draw=ImageDraw.Draw(canvas)
for i,path in enumerate(paths):
    redrawn=path.with_name(path.stem+'-face-v2.png')
    selected=redrawn if redrawn.exists() else path.with_suffix('.png') if path.stem in {'hana','celestia'} else path
    with Image.open(selected) as image:
        thumb=ImageOps.contain(image.convert('RGBA'),(124,120))
    x,y=(i%8)*137,(i//8)*145
    canvas.paste(thumb,(x+(124-thumb.width)//2,y),thumb)
    draw.text((x+4,y+123),path.stem,fill='white')
Path('artifacts').mkdir(exist_ok=True)
canvas.save('artifacts/portrait-contact-sheet.jpg')
print(f'{len(paths)} hero face assets decoded')
canvas=Image.new('RGB',(1100,((len(paths)+7)//8)*145),(22,35,45))
draw=ImageDraw.Draw(canvas)
for i,path in enumerate(paths):
    selected=Path('public/assets/illustrations')/(path.stem+('-v2.png' if path.stem in {'rhea','echo','meriel','selene','ophilia'} else '.webp'))
    with Image.open(selected) as image:
        thumb=ImageOps.contain(image.convert('RGBA'),(124,120))
    x,y=(i%8)*137,(i//8)*145
    canvas.paste(thumb,(x+(124-thumb.width)//2,y),thumb)
    draw.text((x+4,y+123),path.stem,fill='white')
canvas.save('artifacts/illustration-contact-sheet.jpg')
print(f'{len(paths)} UI illustration assets decoded')
