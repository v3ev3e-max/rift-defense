from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/ui/generated'
OUT.mkdir(parents=True,exist_ok=True)

frame=Image.open(r'C:\Users\PC\.codex\generated_images\01a07544-c4a3-75a1-8a61-2124d1422fc4\exec-4bd2c753-8d04-41ee-9760-9fd800f68326.png').convert('RGB')
frame.resize((768,1152),Image.Resampling.LANCZOS).save(OUT/'laboratory-frame.webp','WEBP',quality=88,method=6)

panel=Image.open(r'C:\Users\PC\.codex\generated_images\01a07544-c4a3-75a1-8a61-2124d1422fc4\exec-740b50a5-2aee-45f0-b238-6af5e2992b77.png').convert('RGB')
panel.resize((512,512),Image.Resampling.LANCZOS).save(OUT/'panel-surface.webp','WEBP',quality=86,method=6)

atlas=Image.open(r'C:\Users\PC\.codex\generated_images\01a07544-c4a3-75a1-8a61-2124d1422fc4\exec-6740b072-71b8-483b-89b9-9da229a8fe3f.png').convert('RGB')
boxes={
 'button-neutral.webp':(44,174,585,422),
 'button-active.webp':(670,174,1212,422),
 'button-upgrade.webp':(44,800,585,1047),
 'button-fusion.webp':(670,800,1212,1047),
}
for name,box in boxes.items():
    im=atlas.crop(box).resize((540,248),Image.Resampling.LANCZOS)
    im.save(OUT/name,'WEBP',quality=90,method=6)
print('Installed UI frame, panel surface and four button plates in',OUT)
