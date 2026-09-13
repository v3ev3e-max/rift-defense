"""Install the generated three-stage directional sniper muzzle flash."""
from pathlib import Path
from PIL import Image

SOURCE=Path(r"C:\Users\PC\.codex\generated_images\01a07544-c4a3-75a1-8a61-2124d1422fc4\exec-221d53a9-46f5-4267-be57-6617eaf87809.png")
OUT=Path(r"D:\3V_TD\public\assets\generated\sniper-muzzle")
OUT.mkdir(parents=True,exist_ok=True)
sheet=Image.open(SOURCE).convert("RGBA")
(OUT/"source.png").write_bytes(SOURCE.read_bytes())
cells=[]
for index in range(3):
    cell=sheet.crop((round(index*sheet.width/3),0,round((index+1)*sheet.width/3),sheet.height))
    box=cell.getchannel("A").point(lambda a:255 if a>5 else 0).getbbox()
    if not box: raise RuntimeError(f"empty muzzle frame {index+1}")
    cells.append(cell.crop(box))
scale=min(332/max(c.width for c in cells),112/max(c.height for c in cells))
for index,cell in enumerate(cells,1):
    cell=cell.resize((max(1,round(cell.width*scale)),max(1,round(cell.height*scale))),Image.Resampling.LANCZOS)
    canvas=Image.new("RGBA",(360,136))
    canvas.alpha_composite(cell,(12,(136-cell.height)//2))
    canvas.save(OUT/f"frame_{index:02d}.webp","WEBP",lossless=True,method=6)
print("installed 3 directional sniper muzzle frames")
