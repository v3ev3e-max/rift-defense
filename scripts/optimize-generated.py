from pathlib import Path
from PIL import Image

root=Path('public/assets/generated')
before=after=0
for source in root.rglob('*.png'):
    target=source.with_suffix('.webp')
    before+=source.stat().st_size
    with Image.open(source) as image:
        image.save(target,'WEBP',quality=82,method=6,exact=True)
    after+=target.stat().st_size
print({'files':len(list(root.rglob('*.webp'))),'before':before,'after':after,'saved':before-after})
