"""Add a transparent sampling gutter to runtime animation frames that touch an edge."""
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
TARGETS=[ROOT/"public/assets/generated/support-skills",ROOT/"public/assets/generated/tank-skills"]
changed=0
for root in TARGETS:
    for path in root.rglob("*.webp"):
        if "source" in path.parts: continue
        image=Image.open(path).convert("RGBA")
        box=image.getchannel("A").point(lambda a:255 if a>8 else 0).getbbox()
        if not box: raise RuntimeError(f"empty frame: {path}")
        if box[0]<6 or box[1]<6 or box[2]>image.width-6 or box[3]>image.height-6:
            canvas=Image.new("RGBA",(image.width+24,image.height+24))
            canvas.alpha_composite(image,(12,12))
            canvas.save(path,"WEBP",lossless=True,method=6)
            changed+=1
print(f"added transparent gutters to {changed} animation frames")
