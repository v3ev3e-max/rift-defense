from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]
heroes=sorted(p.name for p in (ROOT/'public/assets/heroes').iterdir() if p.is_dir())
failures=[]; warnings=[]; rows=[]
EXPECTED_HERO_COUNT=34
if len(heroes)!=EXPECTED_HERO_COUNT: failures.append(f'Expected {EXPECTED_HERO_COUNT} hero directories, got {len(heroes)}')

for hero_id in heroes:
    required=[]
    required += [(ROOT/'public/assets/heroes'/hero_id/f'frame_{n:02}.png',(160,160)) for n in range(1,4)]
    required += [(ROOT/'public/assets/combat'/hero_id/f'frame_{n:02}.png',(160,160)) for n in range(1,9)]
    required += [(ROOT/'public/assets/combat'/hero_id/f'up6_{n:02}.png',(160,160)) for n in range(1,7)]
    # Legacy defeat sets use 192px while recently authored sets use 160px;
    # BattleScene normalizes both through defeatPoseSize at render time.
    required += [(ROOT/'public/assets/generated/hero-defeat'/hero_id/f'frame_{n:02}.webp',None) for n in range(1,4)]
    required += [(ROOT/'public/assets/effects'/hero_id/f'projectile_{n:02}.png',None) for n in range(1,4)]
    required += [(ROOT/'public/assets/effects'/hero_id/f'impact_{n:02}.png',None) for n in range(1,4)]
    required += [(ROOT/'public/assets/effects'/hero_id/'skill.png',None)]
    required += [(ROOT/'public/assets/illustrations'/f'{hero_id}.webp',None)]
    if not list((ROOT/'public/assets/face-icons').glob(f'{hero_id}.*')): failures.append(f'{hero_id}: missing face icon')
    for path,size in required:
        if not path.exists(): failures.append(f'{hero_id}: missing {path.relative_to(ROOT)}'); continue
        try:
            im=Image.open(path); im.load(); bounds=im.convert('RGBA').getchannel('A').getbbox()
            rows.append({'hero':hero_id,'path':str(path.relative_to(ROOT)),'size':list(im.size),'bounds':bounds})
            if size and im.size!=size: failures.append(f'{hero_id}: wrong canvas {path.name} {im.size}, expected {size}')
            if not bounds: failures.append(f'{hero_id}: empty transparent image {path.name}')
            elif min(bounds[0],bounds[1],im.width-bounds[2],im.height-bounds[3])<2: warnings.append(f'{hero_id}: tight transparent margin {path.name}')
        except Exception as exc: failures.append(f'{hero_id}: unreadable {path.name}: {exc}')

for n in (1,2):
    path=ROOT/f'public/assets/campaign/worldlines/worldline-{n:02}.webp'
    if not path.exists(): failures.append(f'missing worldline key art {n}')
    else:
        im=Image.open(path); im.load()
        if im.size!=(960,320): failures.append(f'worldline {n}: wrong canvas {im.size}')

result={'heroes':len(heroes),'images':len(rows),'failures':failures,'warnings':warnings}
(ROOT/'artifacts/visual-audit/final-measurements.json').write_text(json.dumps({**result,'measurements':rows},indent=2),encoding='utf8')
print(json.dumps(result,indent=2)); raise SystemExit(bool(failures))
