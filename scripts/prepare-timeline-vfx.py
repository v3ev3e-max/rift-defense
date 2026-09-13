from pathlib import Path
from PIL import Image
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(r'C:/Users/PC/.codex/generated_images/01a07544-c4a3-75a1-8a61-2124d1422fc4/exec-de06476b-19ec-43b6-aec0-a366af1ac536.png')
OUT=ROOT/'public/assets/generated/luna-meteor'

def clear_checker(im:Image.Image):
    a=np.asarray(im.convert('RGBA')).copy();rgb=a[:,:,:3].astype(np.int16)
    neutral=(rgb.max(2)-rgb.min(2)<18)&(rgb.mean(2)>78)&(rgb.mean(2)<245)
    a[:,:,3]=np.where(neutral,0,a[:,:,3]).astype(np.uint8)
    return Image.fromarray(a,'RGBA')

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    sheet=clear_checker(Image.open(SOURCE));cw=sheet.width//4;ch=sheet.height//3
    names=['circle','meteor','impact']
    for row,name in enumerate(names):
        for col in range(4):
            frame=sheet.crop((col*cw,row*ch,(col+1)*cw,(row+1)*ch))
            box=frame.getchannel('A').getbbox()
            if box: frame=frame.crop(box)
            frame.thumbnail((236,236),Image.Resampling.LANCZOS)
            canvas=Image.new('RGBA',(256,256));canvas.alpha_composite(frame,((256-frame.width)//2,(256-frame.height)//2))
            canvas.save(OUT/f'{name}_{col+1:02}.webp','WEBP',quality=92,method=6)

if __name__=='__main__':main()
