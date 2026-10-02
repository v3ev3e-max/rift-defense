"""Read-only validation of authored recruitment images; never synthesizes art."""
from pathlib import Path
from PIL import Image
import hashlib

root = Path(__file__).resolve().parents[1] / 'public/assets/ui/recruit'
seen = set()
for name in ['backdrop', 'card-normal', 'card-sr', 'card-ssr', 'reveal-sr', 'reveal-ssr']:
    path = root / f'{name}.png'
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest not in seen, f'Duplicate artwork: {name}'
    seen.add(digest)
    with Image.open(path) as image:
        assert min(image.size) >= 900
        if name != 'backdrop':
            assert image.mode == 'RGBA', f'Missing alpha: {name}'
            alpha = image.getchannel('A')
            assert alpha.getextrema()[0] == 0
            borders = [(0, 0, image.width, 1), (0, image.height-1, image.width, image.height), (0, 0, 1, image.height), (image.width-1, 0, image.width, image.height)]
            assert max(alpha.crop(box).getextrema()[1] for box in borders) <= 8, f'Visible edge clipping: {name}'
        print(f'{name}: {image.size}, {image.mode}, unique sha256 {digest[:12]} OK')

frames = sorted((root/'animations').glob('*/frame_*.webp'))
assert len(frames) == 48, f'Expected 48 authored animation frames, got {len(frames)}'
pixels=set()
for path in frames:
    with Image.open(path).convert('RGBA') as image:
        assert image.size==(512,512)
        alpha=image.getchannel('A')
        assert max(alpha.crop(box).getextrema()[1] for box in [(0,0,512,24),(0,488,512,512),(0,0,24,512),(488,0,512,512)])==0, f'Unsafe frame margin: {path}'
        digest=hashlib.sha256(image.tobytes()).hexdigest()
        assert digest not in pixels, f'Duplicate static frame: {path}'
        pixels.add(digest)
print('48 distinct authored frames: RGBA, 512x512, safe transparent margins OK')
