"""Check every installed regional actor AND effect, including final hit frames."""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
failures=[]
count=0
for region in range(13,17):
    paths=list((ROOT/f'public/assets/generated/campaign-enemies/map-{region}').rglob('*.webp'))
    assert len(paths)==69,(region,len(paths))
    for path in paths:
        image=Image.open(path).convert('RGBA')
        alpha=np.array(image.getchannel('A'))
        ys,xs=np.where(alpha>8)
        if not len(xs):
            failures.append(f'{path}: empty');continue
        margin=min(xs.min(),ys.min(),image.width-1-xs.max(),image.height-1-ys.max())
        # Narrow projectile images retain at least four pixels; square hit
        # bursts and every body pose require eight pixels on every edge.
        required=4 if image.width!=image.height else 8
        if margin<required:failures.append(f'{path}: {margin}px < {required}px')
        count+=1
print(f'Region 13-16 pixel audit: {count} images, {len(failures)} failures')
for failure in failures:print(failure)
raise SystemExit(bool(failures))
