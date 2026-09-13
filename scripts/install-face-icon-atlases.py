from pathlib import Path
from PIL import Image
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public/assets/face-icons"
BACKUP = ROOT / "public/assets/face-icons-pre-closeup-20260910"
SOURCES = [
    (Path(r"C:\Users\PC\.codex\generated_images\01a07544-c4a3-75a1-8a61-2124d1422fc4\exec-e0cc6814-992f-4995-9bf5-df796b21790d.png"), ["adela","arden","arin","aurora","belka","ian","kairon"]),
    (Path(r"C:\Users\PC\.codex\generated_images\01a07544-c4a3-75a1-8a61-2124d1422fc4\exec-1094d5a1-18b7-4c1a-b54b-d057298093a4.png"), ["karin","kyle","leon","livia","luna","mia","neris"]),
    (Path(r"C:\Users\PC\.codex\generated_images\01a07544-c4a3-75a1-8a61-2124d1422fc4\exec-502c48ab-8a10-49e3-9f72-0f0e1f276f73.png"), ["noel","noxia","reina","sera","serin","theria","yuria"]),
]

BACKUP.mkdir(parents=True, exist_ok=True)
for old in DEST.glob("*.webp"):
    target = BACKUP / old.name
    if not target.exists():
        shutil.copy2(old, target)

for source, names in SOURCES:
    atlas = Image.open(source).convert("RGB")
    cell_w, cell_h = atlas.width / 4, atlas.height / 2
    for index, name in enumerate(names):
        col, row = index % 4, index // 4
        box = (
            round(col * cell_w), round(row * cell_h),
            round((col + 1) * cell_w), round((row + 1) * cell_h),
        )
        icon = atlas.crop(box).resize((256, 256), Image.Resampling.LANCZOS)
        icon.save(DEST / f"{name}.webp", "WEBP", quality=92, method=6)

print("Installed 21 close-up face icons; originals backed up at", BACKUP)
