from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps
import hashlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/assets/generated/raid-v2"
GEN = Path(r"C:/Users/PC/.codex/generated_images/01a0bcec-3497-7643-a99a-cfa603eae514")

BOSSES = {
    "gale-colossus": ("exec-86018bc7-ae92-404e-8284-4c0d0507d248.png", "exec-3b172a72-0b25-4fcd-b7c6-b2c04cdd65db.png"),
    "void-observer": ("exec-07890639-2771-40bf-8bbd-1b38d00c49ec.png", "exec-84d9ee19-cb10-402a-a9e2-9f1a1b37ae2a.png"),
    "machine-god": ("exec-e07b35cf-623c-417e-b591-5c8f1c4147e0.png", "exec-4af826eb-987b-42d4-97bf-7a5194fff6e7.png"),
    "solar-sphinx": ("exec-84df2174-aebb-4c27-ac05-700e4963110e.png", "exec-9adbc795-1d38-49ef-a6ae-566b3f9d14f1.png"),
    "aeon-sovereign": ("exec-1d519e06-7ba5-4ce1-bd10-5b6025fdec81.png", "exec-4d9769d7-2cb9-4595-b1f4-6107a627d79c.png"),
}
SUMMON_ATLAS = GEN / "exec-3a653e95-cc51-486f-894f-3bfd2130005b.png"
VFX_ATLAS = GEN / "exec-ee0fa4cd-b563-46a8-842e-bf270746f4e8.png"
ARENA = GEN / "exec-a7437130-2cd0-49eb-bc83-21ea85b8c0d6.png"
VFX_NAMES = ["cyan-lance", "void-beam", "orange-missile", "solar-arc", "time-slash", "impact-burst", "danger-telegraph", "shield-break", "healing-pulse", "summon-portal", "phase-ring", "enrage-aura"]

def genuine_alpha(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    alpha = im.getchannel("A")
    lo, hi = alpha.getextrema()
    # Image generators sometimes return nominal alpha (254) over an opaque backdrop.
    if lo < 8 and sum(1 for v in alpha.resize((64, 64)).getdata() if v < 16) > 256:
        return im
    rgb = im.convert("RGB")
    # Conservative border-connected background removal for the gold solar render.
    px = rgb.load(); w, h = rgb.size
    mask = Image.new("L", (w, h), 255); mp = mask.load()
    seen = bytearray(w * h); stack = []
    for x in range(w): stack.extend(((x, 0), (x, h - 1)))
    for y in range(h): stack.extend(((0, y), (w - 1, y)))
    while stack:
        x, y = stack.pop(); k = y * w + x
        if seen[k]: continue
        seen[k] = 1; r, g, b = px[x, y]
        gold_bg = r > 55 and r > b * 1.35 and g > b * 0.75 and abs(r-g) < 150
        dark_bg = max(r, g, b) < 80
        if not (gold_bg or dark_bg): continue
        mp[x, y] = 0
        if x: stack.append((x-1, y))
        if x+1 < w: stack.append((x+1, y))
        if y: stack.append((x, y-1))
        if y+1 < h: stack.append((x, y+1))
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    im.putalpha(ImageChops.multiply(alpha, mask))
    return im

def normalize(path: Path, size=1024, margin=.1) -> Image.Image:
    im = genuine_alpha(Image.open(path))
    box = im.getchannel("A").getbbox()
    if box: im = im.crop(box)
    max_side = int(size * (1 - margin * 2))
    im.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size))
    canvas.alpha_composite(im, ((size-im.width)//2, (size-im.height)//2))
    return canvas

def shifted(im: Image.Image, scale: float, x: int, y: int, angle: float = 0) -> Image.Image:
    frame = im.resize((int(im.width*scale), int(im.height*scale)), Image.Resampling.LANCZOS)
    if angle: frame = frame.rotate(angle, Image.Resampling.BICUBIC, expand=False)
    canvas = Image.new("RGBA", im.size)
    canvas.alpha_composite(frame, ((im.width-frame.width)//2+x, (im.height-frame.height)//2+y))
    return canvas

def save_webp(im: Image.Image, path: Path, quality=90):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=4)

def make_boss_pack(boss_id: str, idle_path: Path, attack_path: Path):
    idle, attack = normalize(idle_path), normalize(attack_path)
    folder = OUT / "bosses" / boss_id
    save_webp(idle, OUT / "bosses" / f"{boss_id}.webp")
    for i, (s,x,y,a) in enumerate([(1,0,0,0),(.99,-3,3,-.4),(1.01,2,-3,.3),(.998,1,1,.15)], 1):
        save_webp(shifted(idle,s,x,y,a), folder/f"idle_{i:02}.webp")
    for i, (s,x,y,a) in enumerate([(.92,-30,15,-2),(.96,-18,5,-1),(1.0,0,0,0),(1.035,16,-8,1),(1.01,7,-2,.5),(.95,-12,8,-.7)], 1):
        save_webp(shifted(attack,s,x,y,a), folder/f"attack_{i:02}.webp")
    tint = Image.new("RGBA", idle.size, (110,170,255,0)); tint.putalpha(idle.getchannel("A").point(lambda a:int(a*.28)))
    phased = Image.alpha_composite(idle, tint)
    for i, s in enumerate((.94,.98,1.02,1.0), 1): save_webp(shifted(phased,s,0,0), folder/f"phase_{i:02}.webp")
    hit = ImageEnhance.Brightness(idle).enhance(1.45)
    for i, x in enumerate((-12,10,0), 1): save_webp(shifted(hit,1,x,0), folder/f"hit_{i:02}.webp")
    bg = Image.open(ARENA).convert("RGB").resize((640,360),Image.Resampling.LANCZOS).convert("RGBA")
    art = idle.copy(); art.thumbnail((340,340),Image.Resampling.LANCZOS); bg.alpha_composite(art,(300+(340-art.width)//2,10+(340-art.height)//2))
    save_webp(bg, OUT/"cards"/f"{boss_id}.webp", 90)

def split_atlas(path: Path, cols: int, rows: int, names, folder: str, size: int):
    atlas = Image.open(path).convert("RGBA"); cw, ch = atlas.width/cols, atlas.height/rows
    for i, name in enumerate(names):
        x, y = i%cols, i//cols
        cell = atlas.crop((round(x*cw),round(y*ch),round((x+1)*cw),round((y+1)*ch)))
        box=cell.getchannel("A").getbbox(); cell=cell.crop(box) if box else cell
        cell.thumbnail((int(size*.84),int(size*.84)),Image.Resampling.LANCZOS)
        out=Image.new("RGBA",(size,size)); out.alpha_composite(cell,((size-cell.width)//2,(size-cell.height)//2))
        save_webp(out,OUT/folder/f"{name}.webp")

def main():
    save_webp(ImageOps.fit(Image.open(ARENA).convert("RGB"),(1600,900),method=Image.Resampling.LANCZOS),OUT/"arena.webp",90)
    for boss_id,(idle,attack) in BOSSES.items(): make_boss_pack(boss_id,GEN/idle,GEN/attack)
    split_atlas(SUMMON_ATLAS,5,1,list(BOSSES),"summons",320)
    split_atlas(VFX_ATLAS,4,3,VFX_NAMES,"vfx",384)
    files=sorted(OUT.rglob("*.webp"))
    unique_targets=[p for p in files if not (p.parent.name == "bosses" and p.stem in BOSSES)]
    hashes={hashlib.sha256(p.read_bytes()).hexdigest() for p in unique_targets}
    assert len(files)==1+5*(1+4+6+4+3+1)+5+12, (len(files),"asset count")
    assert len(hashes)==len(unique_targets), "duplicate raid animation/effect image detected"
    for p in files:
        im=Image.open(p)
        if p.name != "arena.webp" and "cards" not in p.parts:
            assert im.mode=="RGBA" and im.getchannel("A").getextrema()[0] < 16, f"missing transparency: {p}"
    print(f"raid-v2: {len(files)} unique images built")

if __name__ == "__main__": main()
