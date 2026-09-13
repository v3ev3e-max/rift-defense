"""Read-only asset measurements and contact sheets; never changes source PNGs."""
from pathlib import Path
import json, sys
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts' / 'visual-audit'
OUT.mkdir(parents=True, exist_ok=True)

def measure(path):
    im = Image.open(path).convert('RGBA')
    alpha = im.getchannel('A')
    box = alpha.point(lambda a: 255 if a > 8 else 0).getbbox()
    return {'path': str(path.relative_to(ROOT)).replace('\\','/'), 'size': list(im.size),
            'bounds': list(box) if box else None,
            'contentSize': [box[2]-box[0],box[3]-box[1]] if box else [0,0],
            'center': [(box[0]+box[2])/2,(box[1]+box[3])/2] if box else None,
            'edge': bool(box and (box[0]==0 or box[1]==0 or box[2]==im.width or box[3]==im.height))}

def sheet(hero, theme, dest):
    files = [ROOT/'public/assets/heroes'/hero/f'frame_{i:02}.png' for i in range(1,4)]
    files += [ROOT/'public/assets/effects'/hero/f'projectile_{i:02}.png' for i in range(1,4)]
    files += [ROOT/'public/assets/effects'/hero/f'impact_{i:02}.png' for i in range(1,4)]
    files += [ROOT/'public/assets/effects'/hero/'skill.png']
    canvas=Image.new('RGB',(1000,520), '#151b26' if theme=='dark' else '#fafafa')
    d=ImageDraw.Draw(canvas)
    for i,p in enumerate(files):
        x=(i%5)*200;y=(i//5)*250
        for yy in range(y+30,y+230,16):
            for xx in range(x,x+200,16):
                shades=('#202c3c','#374455') if theme=='dark' else ('#ffffff','#d5dbe2')
                d.rectangle((xx,yy,min(xx+15,x+199),min(yy+15,y+229)),fill=shades[((xx-x)//16+(yy-y-30)//16)%2])
        d.text((x+4,y+8),f'{hero}: {p.parent.parent.name}/{p.name}',fill='#78b6c8')
        if p.exists():
            im=Image.open(p).convert('RGBA');im.thumbnail((184,184))
            canvas.paste(im,(x+(200-im.width)//2,y+30+(200-im.height)//2),im)
        else:d.text((x+12,y+100),'MISSING',fill='#ee4444')
    canvas.save(dest)

if __name__=='__main__':
    phase=sys.argv[1] if len(sys.argv)>1 else 'before'
    rows=[measure(p) for folder in ('heroes','effects') for p in sorted((ROOT/'public/assets'/folder).rglob('*.png'))]
    (OUT/f'{phase}.json').write_text(json.dumps(rows,indent=2),encoding='utf8')
    for hero in sorted(p.name for p in (ROOT/'public/assets/heroes').iterdir() if p.is_dir()):
        for theme in ('dark','light'):sheet(hero,theme,OUT/f'{phase}-{hero}-{theme}.png')
    print(json.dumps({'phase':phase,'files':len(rows),'edgeContact':sum(r['edge'] for r in rows)}))
