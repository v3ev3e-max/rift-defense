from collections import deque
from pathlib import Path
from PIL import Image
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
GENERATED=Path(r'C:/Users/PC/.codex/generated_images/01a07544-c4a3-75a1-8a61-2124d1422fc4/exec-1a8723ed-59da-4500-b66d-4ba79c814500.png')
NOXIA_REGEN=Path(r'C:/Users/PC/.codex/generated_images/01a07544-c4a3-75a1-8a61-2124d1422fc4/exec-d1a9244c-afd8-48b7-8d4c-082bb084170d.png')
IDS=['yuria','reina','arin','karin','sera','noel','luna','mia','ian','leon','adela','neris','belka','serin','kyle','livia','kairon','theria','noxia','aurora','arden']
REGENERATED=['livia','kairon','theria','noxia','aurora','arden']
PAINTED_BUSTS={'noel','luna','mia','ian','leon','adela','neris','belka','serin','kyle'}
PNG={'yuria','reina','arin','karin','sera','adela','neris','belka','serin','kyle','livia','kairon','theria','noxia','aurora','arden'}
OUT=ROOT/'public/assets/illustrations'
ICON_OUT=ROOT/'public/assets/summon-icons'
FACE_OUT=ROOT/'public/assets/face-icons'

def remove_connected_checker(image:Image.Image)->Image.Image:
    rgba=np.asarray(image.convert('RGBA')).copy();arr=rgba[:,:,:3];original_alpha=rgba[:,:,3]
    hi=arr.max(2);lo=arr.min(2);lum=arr.mean(2)
    candidate=(original_alpha<10)|((hi-lo<22)&(lum>72)&(lum<252))
    h,w=candidate.shape;outside=np.zeros((h,w),dtype=bool);queue=deque()
    for x in range(w):
        if candidate[0,x]:outside[0,x]=1;queue.append((0,x))
        if candidate[h-1,x]:outside[h-1,x]=1;queue.append((h-1,x))
    for y in range(h):
        if candidate[y,0]:outside[y,0]=1;queue.append((y,0))
        if candidate[y,w-1]:outside[y,w-1]=1;queue.append((y,w-1))
    while queue:
        y,x=queue.popleft()
        for ny,nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0<=ny<h and 0<=nx<w and candidate[ny,nx] and not outside[ny,nx]:outside[ny,nx]=1;queue.append((ny,nx))
    rgba[:,:,3]=np.where(outside,0,original_alpha).astype(np.uint8)
    return Image.fromarray(rgba,'RGBA')

def remove_checker_tiles(image:Image.Image)->Image.Image:
    rgba=np.asarray(image.convert('RGBA')).copy();rgb=rgba[:,:,:3].astype(np.int16)
    # Image generators sometimes bake the transparency preview into the pixels.
    # Remove only neutral mid/high gray tiles; violet art and skin remain intact.
    neutral=(rgb.max(2)-rgb.min(2)<13)&(rgb.mean(2)>118)
    rgba[:,:,3]=np.where(neutral,0,rgba[:,:,3]).astype(np.uint8)
    return remove_connected_checker(Image.fromarray(rgba,'RGBA'))

def normalize(image:Image.Image)->Image.Image:
    image=image.convert('RGBA');box=image.getchannel('A').getbbox()
    if box:image=image.crop(box)
    image.thumbnail((552,744),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(576,768));canvas.alpha_composite(image,((576-image.width)//2,768-image.height))
    return canvas

def main():
    OUT.mkdir(parents=True,exist_ok=True);ICON_OUT.mkdir(parents=True,exist_ok=True);FACE_OUT.mkdir(parents=True,exist_ok=True)
    cleaned=ROOT/'artifacts/illustration-audit/generated-six-clean-v2.png'
    if cleaned.exists():sheet=Image.open(cleaned).convert('RGBA')
    else:
        sheet=remove_connected_checker(Image.open(GENERATED));cleaned.parent.mkdir(parents=True,exist_ok=True);sheet.save(cleaned)
    cell=sheet.width//6
    generated={id:sheet.crop((i*cell,0,sheet.width if i==5 else (i+1)*cell,sheet.height)) for i,id in enumerate(REGENERATED)}
    for id in IDS:
        if id=='noxia':image=remove_checker_tiles(Image.open(NOXIA_REGEN))
        elif id in generated:image=generated[id]
        else:
            ext='png' if id in PNG else 'jpg';image=Image.open(ROOT/f'public/assets/portraits/{id}.{ext}')
            if ext=='png':image=remove_connected_checker(image)
        illustration=normalize(image);illustration.save(OUT/f'{id}.webp','WEBP',quality=92,method=6)
        alpha=illustration.getchannel('A');box=alpha.getbbox() or (0,0,576,768)
        if box==(0,0,576,768):crop=illustration.crop((0,0,576,576))
        else:
            left,top,right,bottom=box;w=right-left;h=bottom-top;size=min(576,max(int(w*.92),int(h*.55)))
            cx=(left+right)//2;cy=top+int(size*.48);x0=max(0,min(576-size,cx-size//2));y0=max(0,min(768-size,cy-size//2));crop=illustration.crop((x0,y0,x0+size,y0+size))
        crop.resize((256,256),Image.Resampling.LANCZOS).save(ICON_OUT/f'{id}.webp','WEBP',quality=92,method=6)
        if id in PAINTED_BUSTS:
            crop.resize((256,256),Image.Resampling.LANCZOS).save(FACE_OUT/f'{id}.webp','WEBP',quality=94,method=6)
            continue
        if id=='noxia':
            illustration.crop((190,95,370,275)).resize((256,256),Image.Resampling.LANCZOS).save(FACE_OUT/f'{id}.webp','WEBP',quality=94,method=6)
            continue
        alpha=illustration.getchannel('A');box=alpha.getbbox() or (0,0,576,768)
        left,top,right,bottom=box
        if box==(0,0,576,768):
            # Existing painted busts fill the canvas: use the upper portrait area.
            face=illustration.crop((64,24,512,472))
        else:
            # Transparent full-body art: the head sits near the top of its silhouette.
            width=right-left;height=bottom-top;size=max(138,min(240,int(max(width*.45,height*.22))))
            cx=(left+right)//2;cy=top+int(size*.48)
            x0=max(0,min(576-size,cx-size//2));y0=max(0,min(768-size,cy-size//2))
            face=illustration.crop((x0,y0,x0+size,y0+size))
        face.resize((256,256),Image.Resampling.LANCZOS).save(FACE_OUT/f'{id}.webp','WEBP',quality=94,method=6)

if __name__=='__main__':main()
