from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/campaign/lanes/region-lanes-source.png"
OUT = SOURCE.parent

atlas = Image.open(SOURCE).convert("RGBA")
cell_w, cell_h = atlas.width // 3, atlas.height // 4

for index in range(12):
    col, row = index % 3, index // 3
    cell = atlas.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
    alpha = cell.getchannel("A")
    box = alpha.point(lambda value: 255 if value > 20 else 0).getbbox()
    if box is None:
        raise RuntimeError(f"lane {index + 1} is empty")
    # Keep the full horizontal period so the runtime can repeat it along any
    # campaign path, while trimming only unused space above and below.
    top, bottom = max(0, box[1] - 4), min(cell.height, box[3] + 4)
    lane = cell.crop((0, top, cell.width, bottom)).resize((256, 96), Image.Resampling.LANCZOS)
    lane.save(OUT / f"region-{index + 1:02d}.webp", "WEBP", lossless=True, method=6)

print(f"extracted 12 regional lane textures from {atlas.size[0]}x{atlas.size[1]} atlas")
