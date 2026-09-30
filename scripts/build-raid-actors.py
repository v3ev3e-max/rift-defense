"""Pack explicit idle/attack/skill tracks with a shared scale and floor."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
for folder in sorted((ROOT/'public/assets/combat').iterdir()):
 if not (folder/'skill_06.png').exists():continue
 tracks={'idle':[ROOT/f'public/assets/heroes/{folder.name}/frame_01.png'],
         'attack':[folder/f'frame_{i:02}.png' for i in range(1,9)],
         'skill':[folder/f'skill_{i:02}.png' for i in range(1,7)]}
 out=ROOT/f'public/assets/generated/raid-v4/heroes/{folder.name}';out.mkdir(parents=True,exist_ok=True)
 # Source tracks have different native resolutions. Normalize their bounds
 # consistently, keeping each track's own frame-to-frame proportions.
 for state,paths in tracks.items():
  frames=[]
  for p in paths:
   im=Image.open(p).convert('RGBA');frames.append(im.crop(im.getchannel('A').getbbox()))
  scale=min(384*.72/max(im.width for im in frames),384*.72/max(im.height for im in frames))
  sheet=Image.new('RGBA',(384*len(frames),384))
  for i,im in enumerate(frames):
   im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
   sheet.alpha_composite(im,(i*384+(384-im.width)//2,330-im.height))
  sheet.save(out/f'{state}.webp','WEBP',lossless=True,method=4)
print('Packed 44 idle / attack / skill tracks')
