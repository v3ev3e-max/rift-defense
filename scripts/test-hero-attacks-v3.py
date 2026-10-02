"""Validate every authored hero attack frame for clipping and accidental reuse."""
import hashlib, json
from pathlib import Path
from PIL import Image

root=Path('public/assets/generated/hero-attacks-v3')
owners=sorted(p.name for p in root.iterdir() if p.is_dir())
errors=[];global_hashes={};rows=[]
for owner in owners:
 local=[]
 for frame in range(1,9):
  path=root/owner/f'frame_{frame:02d}.webp'
  if not path.exists():errors.append(f'{owner}: missing {path.name}');continue
  with Image.open(path) as source:
   image=source.convert('RGBA');image.load()
  if image.size!=(256,256):errors.append(f'{owner}/{frame}: {image.size}')
  box=image.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox()
  if not box or min(box[0],box[1],256-box[2],256-box[3])<12:errors.append(f'{owner}/{frame}: unsafe {box}')
  digest=hashlib.sha256(image.tobytes()).hexdigest();local.append(digest)
  previous=global_hashes.get(digest)
  if previous:errors.append(f'cross-owner duplicate: {previous} = {owner}/{frame}')
  global_hashes[digest]=f'{owner}/{frame}'
 if len(set(local))!=8:errors.append(f'{owner}: duplicate action frames')
 manifest=root/owner/'manifest.json'
 if not manifest.exists():errors.append(f'{owner}: missing manifest')
 rows.append({'owner':owner,'frames':len(local),'unique':len(set(local))})
result={'owners':len(owners),'frames':sum(x['frames'] for x in rows),'errors':errors,'rows':rows}
Path('artifacts').mkdir(exist_ok=True)
Path('artifacts/hero-attacks-v3-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'owners':result['owners'],'frames':result['frames'],'errors':len(errors)},ensure_ascii=False))
if errors:raise SystemExit('\n'.join(errors[:30]))
