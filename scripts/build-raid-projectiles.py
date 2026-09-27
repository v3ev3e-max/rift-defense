from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageEnhance
import hashlib

ROOT=Path(__file__).resolve().parents[1]
GEN=Path(r'C:/Users/PC/.codex/generated_images/01a0bcec-3497-7643-a99a-cfa603eae514')
OUT=ROOT/'public/assets/generated/raid-v3'
EFFECTS=ROOT/'public/assets/effects'
GALE={
 'idle':'exec-3fa172cd-5e69-4b6e-ac4a-8836f03eca4a.png',
 'prepare':'exec-73e93748-a7fe-47cc-8e5d-0ef1b12fbb6c.png',
 'attack':'exec-6200d817-88f9-4c2b-a4f1-543f16611cf5.png',
 'pattern':'exec-420ffc44-51ef-4f67-bcd6-dad81190efba.png',
 'hit':'exec-b2864407-aa40-46f8-83ba-a23b4a9f617f.png',
 'phase':'exec-10a24c32-5795-4463-8be8-b6242bb0f7e5.png',
 'death':'exec-e1a27351-fdd5-4a10-8f4e-0bc4fe2d8ec7.png',
}
VOID={
 'idle':'exec-5dae507c-83a0-4ad7-b07e-47d275b7c69b.png',
 'prepare':'exec-a92a93e2-2128-4658-a572-9f733f93d790.png',
 'attack':'exec-fed8c229-26e0-4641-9fb3-2cfe27899ff7.png',
 'pattern':'exec-ca45670a-05e6-4a47-9e69-f38616e6554c.png',
 'hit':'exec-ee1dff71-71d9-4fd6-98b2-e22d721586d2.png',
 'phase':'exec-7844ea46-5d2d-4b0d-a28a-c09ab7c1437f.png',
 'death':'exec-fbe65bce-4176-4b42-b2c5-aab3bc538c8f.png',
}
MACHINE={
 'idle':'exec-1a62a677-363b-4252-8a42-fd0a61acd730.png',
 'prepare':'exec-13593c36-92a4-447c-a498-6273eaa8d33d.png',
 'attack':'exec-5bccec0b-8c5e-4c2f-917a-ce3bb0828a1a.png',
 'pattern':'exec-43035f27-2e19-4a62-8ef4-5699fe1e84e6.png',
 'hit':'exec-1fdac7fc-c930-4b8e-962a-81e05f19edd2.png',
 'phase':'exec-7c8d2ecb-a6a6-4d7e-ad75-1d629c9cc142.png',
 'death':'exec-aa38322a-e938-47aa-869b-69a4e2d34a02.png',
}
BOSSES={
 'gale-colossus':(GALE,'exec-049492da-36f0-4564-945d-5d025b75641c.png'),
 'void-observer':(VOID,'exec-4404aec8-3649-4f41-b5da-a8643495fe07.png'),
 'machine-god':(MACHINE,'exec-2725a644-d904-44a5-9795-c7c7914d7565.png'),
}

def crop(im:Image.Image):
 im=im.convert('RGBA');box=im.getchannel('A').getbbox();return im.crop(box) if box else im

def sheet(images:list[Image.Image],out:Path,size=512,margin=.12):
 images=[crop(v) for v in images];usable=int(size*(1-margin*2));scale=min(usable/max(v.width for v in images),usable/max(v.height for v in images))
 dst=Image.new('RGBA',(size*len(images),size))
 for i,im in enumerate(images):
  im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
  dst.alpha_composite(im,(i*size+(size-im.width)//2,(size-im.height)//2))
 out.parent.mkdir(parents=True,exist_ok=True);dst.save(out,'WEBP',quality=90,method=4)
 return hashlib.sha256(out.read_bytes()).hexdigest()

def split(path:Path,count:int):
 im=Image.open(path).convert('RGBA');w=im.width/count
 return [im.crop((round(i*w),0,round((i+1)*w),im.height)) for i in range(count)]

def skill_frames(path:Path):
 src=crop(Image.open(path));frames=[]
 for scale,bright,angle in [(.84,.8,-4),(.94,1,0),(1.0,1.25,4),(.9,.92,0)]:
  im=ImageEnhance.Brightness(src).enhance(bright);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS).rotate(angle,Image.Resampling.BICUBIC,expand=True);frames.append(im)
 return frames

def main():
 hashes=[]
 for boss,(states,projectile) in BOSSES.items():
  for state,file in states.items():hashes.append(sheet(split(GEN/file,6),OUT/'bosses'/boss/f'{state}.webp'))
  hashes.append(sheet(split(GEN/projectile,4),OUT/'bosses'/boss/'projectile-lifecycle.webp',384,.16))
 heroes=0
 for folder in sorted(EFFECTS.iterdir()):
  if not folder.is_dir() or not (folder/'projectile_01.png').exists():continue
  dest=OUT/'heroes'/folder.name
  hashes.append(sheet([Image.open(folder/f'projectile_{i:02}.png') for i in range(1,4)],dest/'basic.webp',256,.18))
  hashes.append(sheet(skill_frames(folder/'skill.png'),dest/'skill.webp',320,.14))
  hashes.append(sheet([Image.open(folder/f'impact_{i:02}.png') for i in range(1,4)],dest/'impact.webp',256,.14));heroes+=1
 assert heroes==44,heroes
 assert len(hashes)==len(set(hashes)),'shared projectile/animation sheet detected'
 print(f'raid-v3: {len(BOSSES)} bosses with 7 states + projectile lifecycle; {heroes} unique hero projectile sets')

if __name__=='__main__':main()
