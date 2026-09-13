"""Bake genuine alpha into generated combat VFX; removes preview checker tiles."""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT=Path(__file__).resolve().parents[1]/"public/assets/generated/vfx"
for name in ("reticle","bullet","slash","lightning","shell","zone","impact"):
    source=ROOT/f"{name}.webp"
    rgba=np.array(Image.open(source).convert("RGBA"))
    rgb=rgba[:,:,:3].astype(np.int16)
    chroma=rgb.max(2)-rgb.min(2)
    # Preview backgrounds are neutral gray/white checker tiles. Generated VFX
    # is deliberately cyan, violet, gold or orange, so chroma cleanly separates it.
    keep=np.clip((chroma-14)/26,0,1)
    rgba[:,:,3]=(rgba[:,:,3].astype(float)*keep).astype(np.uint8)
    image=Image.fromarray(rgba,"RGBA")
    box=image.getchannel("A").point(lambda a:255 if a>5 else 0).getbbox()
    if not box: raise RuntimeError(f"alpha cleanup erased {name}")
    image=image.crop(box)
    canvas=Image.new("RGBA",(image.width+24,image.height+24)); canvas.alpha_composite(image,(12,12))
    canvas.save(source,"WEBP",lossless=True,method=6)
    # Keep the PNG twin clean as well. It is retained for asset review tools,
    # even though the game loads the smaller WebP file.
    canvas.save(ROOT/f"{name}.png","PNG",optimize=True)
    print(name,canvas.size,canvas.getchannel("A").getextrema())
