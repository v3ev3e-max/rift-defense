from collections import deque
from pathlib import Path
from PIL import Image

SOURCE = Path(r"C:\Users\PC\.codex\generated_images\01a07544-c4a3-75a1-8a61-2124d1422fc4")
ROOT = Path(r"D:\3V_TD\public\assets\generated")

ASSETS = {
    "drone/body.png": "exec-8e660b3c-4d7e-4288-acca-8388f1981f3d.png",
    "drone/projectile.png": "exec-9e304ecb-a7a1-4cf5-8873-1ad29d247ee3.png",
    "drone/impact.png": "exec-17945ec7-e2d6-4c10-90dd-ffbcd832d870.png",
    "drone/overcharge.png": "exec-32e7bec5-b5aa-427c-ab7e-82935dea6d1a.png",
    "enemies/crawler.png": "exec-657702c9-e3cc-4720-806c-a18ad745c3ef.png",
    "enemies/runner.png": "exec-c7d865ef-aa34-4440-987e-f4c7619cd990.png",
    "enemies/brute.png": "exec-db20c5e7-b293-401a-86b7-3b5e17b960a7.png",
    "enemies/armored.png": "exec-c1a2a7eb-fb2c-48b0-8add-89e433e531a7.png",
    "enemies/jammer.png": "exec-7e80c2c1-1e52-422b-81a1-5c7756366650.png",
    "enemies/bulwark.png": "exec-9a458ccc-95ae-45de-bc38-0bcc853c1209.png",
    "enemies/sprinter.png": "exec-c0942770-b172-4342-93a3-1061967e8b80.png",
    "enemies/phantom.png": "exec-8d644423-d8ea-4eea-949d-f36552e2ba7f.png",
    "enemies/elite.png": "exec-204af901-8654-4f2a-b26d-66e9f4e820c7.png",
    "enemies/ravager.png": "exec-09ac9a53-9a85-411c-9861-c126d56b7938.png",
    "enemies/sovereign.png": "exec-c3f10b03-600c-43f4-8e12-cf8cd89c8516.png",
    "enemies/tempest.png": "exec-bc2ea876-76c6-4578-9008-b4c9810139b1.png",
    "enemies/abyssal.png": "exec-7cebfc8c-2323-44a2-b485-04f7b525cef2.png",
    "enemy-effects/rage.png": "exec-204204e9-66ad-4614-9ff5-c4a038421d47.png",
    "enemy-effects/frost.png": "exec-69c812f9-2e26-478d-bfcb-b9fa0184202c.png",
    "enemy-effects/storm.png": "exec-c9eec161-89df-45cb-9288-9ba472964c85.png",
    "enemy-effects/void.png": "exec-440fbd56-ba8d-4e1d-8944-c55607cda071.png",
    "enemy-effects/disrupt.png": "exec-61bc0df5-e359-41a6-a139-f433be6852dc.png",
    "status/burn.png": "exec-7373a0b2-f3d9-4db9-ad1a-b50a64a88b04.png",
    "status/bleed.png": "exec-d05a839f-25c1-4b49-95ca-f5c0f04d4fa4.png",
    "status/slow.png": "exec-c8f8e2e2-4811-4959-b2d2-eb83af26c727.png",
    "status/armor-break.png": "exec-6ea34569-c4cb-4ea2-bea9-d6ce8e64674d.png",
}

def remove_edge_background(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load(); w, h = im.size
    corners = [px[0,0], px[w-1,0], px[0,h-1], px[w-1,h-1]]
    dark = sum(max(c[:3]) < 55 for c in corners) >= 3
    def bg(x, y):
        r,g,b,a = px[x,y]
        if a < 20: return True
        spread = max(r,g,b)-min(r,g,b)
        return (max(r,g,b) < 58) if dark else (spread < 38 and max(r,g,b) > 92)
    seen = bytearray(w*h); q = deque()
    for x in range(w): q.append((x,0)); q.append((x,h-1))
    for y in range(h): q.append((0,y)); q.append((w-1,y))
    while q:
        x,y=q.popleft(); idx=y*w+x
        if seen[idx] or not bg(x,y): continue
        seen[idx]=1; px[x,y]=(px[x,y][0],px[x,y][1],px[x,y][2],0)
        if x: q.append((x-1,y))
        if x+1<w: q.append((x+1,y))
        if y: q.append((x,y-1))
        if y+1<h: q.append((x,y+1))
    return im

def normalize(im: Image.Image, target: int, crop=None) -> Image.Image:
    if crop: im=im.crop(crop)
    if max(im.size) > 768:
        scale = 768 / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    im=remove_edge_background(im)
    bbox=im.getchannel("A").getbbox()
    if not bbox: raise RuntimeError("empty alpha")
    im=im.crop(bbox)
    side=max(im.size); pad=max(8, round(side*.09)); canvas=Image.new("RGBA",(side+pad*2,side+pad*2))
    canvas.alpha_composite(im,((canvas.width-im.width)//2,(canvas.height-im.height)//2))
    return canvas.resize((target,target),Image.Resampling.LANCZOS)

for relative, source in ASSETS.items():
    im=Image.open(SOURCE/source)
    crop=None
    if relative == "enemies/jammer.png":
        w,h=im.size; crop=(int(w*.29),int(h*.03),int(w*.71),int(h*.97))
    size=512 if relative.startswith("enemies/") or relative=="drone/body.png" else 256
    out=ROOT/relative; out.parent.mkdir(parents=True,exist_ok=True)
    normalize(im,size,crop).save(out,optimize=True)
    print(relative)
