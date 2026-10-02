"""Verify packed monster/summon pixels and no cross-owner frame copies."""
import json,hashlib
from pathlib import Path
from PIL import Image
seen={};reports=[]
for root in ['public/assets/generated/monster-actions-v2','public/assets/generated/raid-summon-actions-v2']:
 for manifest in sorted(Path(root).glob('*/manifest.json')):
  data=json.loads(manifest.read_text(encoding='utf-8'))
  for row in data['rows']:
   with Image.open(row['file']) as source:
    image=source.convert('RGBA');assert image.size==(256,256),(row['file'],image.size)
    box=image.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
    assert box and min(box[:2])>=24 and max(box[2:])<=232,(row['file'],box)
    digest=hashlib.sha256(image.tobytes()).hexdigest()
    assert digest==row['sha256'],f'Changed packed pixels {row["file"]}'
    assert digest not in seen,f'Duplicated pixels: {row["file"]} and {seen.get(digest)}'
    seen[digest]=row['file']
  reports.append({'owner':data['owner'],'type':'summon' if 'raid-summon' in root else 'monster','frames':len(data['rows']),'passed':True})
Path('artifacts/monster-actions-v2/pixel-validation.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
print(json.dumps({'owners':len(reports),'distinctFrames':len(seen),'safeMargin':24,'errors':0}))
