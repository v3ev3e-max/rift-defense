"""User-authorized sprite-sheet slicing, alpha-preserving fitting, audit provenance."""
from pathlib import Path
import json, shutil, sys
from PIL import Image, ImageChops
import numpy as np
from collections import deque
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/visual-audit'
SOURCE=ROOT/'artifacts/visual-sources'
BACKUP=ROOT/'artifacts/visual-backup'
VERSION=5

def backup(path):
    target=BACKUP/path.relative_to(ROOT)
    if path.exists() and not target.exists():
        target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)

def clean(im):
    im=im.convert('RGBA')
    # Remove only nearly invisible compression fringe, keeping useful generated alpha.
    a=im.getchannel('A').point(lambda x:0 if x<=3 else x)
    im.putalpha(a)
    b=a.getbbox()
    if not b:raise ValueError('Empty generated cell')
    return im.crop(b)

def remove_background(im, chroma=False):
    a=np.array(im.convert('RGBA'))
    rgb=a[:,:,:3].astype(float)
    if chroma:
        green=rgb[:,:,1]-np.maximum(rgb[:,:,0],rgb[:,:,2])
        mask=(green>50)&(rgb[:,:,1]>150)
        a[:,:,3]=np.minimum(a[:,:,3],np.where(mask,0,255).astype('uint8'))
        # Remove green spill in antialiased boundaries; no hero uses green.
        a[:,:,1]=np.minimum(a[:,:,1],np.maximum(rgb[:,:,0],rgb[:,:,2])+15).astype('uint8')
        return Image.fromarray(a)
    # Only boundary-connected near-neutral light background. Enclosed white
    # clothing stays intact. This is used for rejected baked checkerboards.
    candidate=(rgb.min(2)>205)&((rgb.max(2)-rgb.min(2))<20)
    seed=np.zeros(candidate.shape,bool);seed[0,:]=candidate[0,:];seed[-1,:]=candidate[-1,:];seed[:,0]=candidate[:,0];seed[:,-1]=candidate[:,-1]
    bg=seed.copy();q=deque(zip(*np.where(seed)))
    while q:
        y,x=q.popleft()
        for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0<=yy<bg.shape[0] and 0<=xx<bg.shape[1] and candidate[yy,xx] and not bg[yy,xx]:
                bg[yy,xx]=True;q.append((yy,xx))
    a[bg,3]=0
    return Image.fromarray(a)

def fit(im,size,maxsize,foot=False,fixedscale=None):
    im=clean(im)
    scale=fixedscale or min(maxsize[0]/im.width,maxsize[1]/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',size)
    x=(size[0]-im.width)//2;y=142-im.height if foot else (size[1]-im.height)//2
    if foot:
        # Foot anchor from the lowest 12%: exclude the horizontal weapon and hair.
        a=im.getchannel('A').point(lambda v:255 if v>8 else 0);b=a.getbbox()
        bottom=a.crop((0,max(0,b[3]-12),im.width,b[3])).getbbox()
        if bottom:x=round(80-(bottom[0]+bottom[2])/2)
    canvas.alpha_composite(im,(x,y))
    return canvas

def save(im,path):
    backup(path);path.parent.mkdir(parents=True,exist_ok=True);im.save(path,optimize=True)

def prepare(entry):
    id=entry['id'];kind=entry['kind'];src=Path(entry['source'].split(' as ')[-1])
    SOURCE.mkdir(parents=True,exist_ok=True)
    original=SOURCE/f'{id}-{kind}.png'
    shutil.copy2(src,original)
    im=Image.open(original).convert('RGBA')
    if entry.get('black'):
        arr=np.array(im);v=arr[:,:,:3].max(2).astype(float);alpha=np.maximum(0,(v-8)/247)
        arr[:,:,:3]=np.minimum(255,arr[:,:,:3]/np.maximum(alpha[:,:,None],.01)).astype('uint8')
        arr[:,:,3]=(alpha*255).astype('uint8');im=Image.fromarray(arr)
    elif entry.get('chroma') or im.getchannel('A').getextrema()[0]==255:
        im=remove_background(im,entry.get('chroma',False))
    folder=ROOT/'public/assets'/('heroes' if kind=='hero' else 'effects')/id
    if kind=='hero':
        if im.width/im.height<1.8:raise ValueError(f'{id}: invalid horizontal sheet')
        energy=np.array(im.getchannel('A')).sum(axis=0)
        cuts=[0]
        for fraction in (1/3,2/3):
            lo=round(im.width*(fraction-.065));hi=round(im.width*(fraction+.065))
            smooth=np.convolve(energy,np.ones(5)/5,mode='same')
            cuts.append(lo+int(np.argmin(smooth[lo:hi])))
        cuts.append(im.width)
        cells=[clean(im.crop((cuts[i],0,cuts[i+1],im.height))) for i in range(3)]
        # One scale per sequence prevents shrinking the body during a wider
        # attack. Only position changes to keep the foot anchor stationary.
        scale=min(144/max(c.width for c in cells),94/max(c.height for c in cells))
        # Fit relative to planted feet, not the full silhouette center.
        # Use the same scale for all three frames and keep both weapon sides.
        for cell in cells:
            a=cell.getchannel('A').point(lambda v:255 if v>8 else 0)
            foot=a.crop((0,max(0,cell.height-round(12/scale)),cell.width,cell.height)).getbbox()
            anchor=(foot[0]+foot[2])/2
            scale=min(scale,71/max(anchor,cell.width-anchor))
        for i,cell in enumerate(cells):
            frame=fit(cell,(160,160),(144,112),True,scale)
            save(frame,folder/f'frame_{i+1:02}.png')
            if i==0:save(frame,folder.parent/f'{id}.png')
    else:
        if abs(im.width/im.height-1)>.2:raise ValueError(f'{id}: invalid square FX sheet')
        # Generated grids can be uneven. Cut in the darkest gap between rows,
        # rather than slicing a tall skill's tip into the impact above it.
        energy=np.array(im.getchannel('A')).sum(axis=1)
        cuts=[0]
        for fraction in (1/3,2/3):
            lo=round(im.height*(fraction-.075));hi=round(im.height*(fraction+.075))
            smooth=np.convolve(energy,np.ones(9)/9,mode='same')
            cuts.append(lo+int(np.argmin(smooth[lo:hi])))
        cuts.append(im.height)
        for row in range(3):
            for col in range(3):
                cell=im.crop((round(col*im.width/3),cuts[row],round((col+1)*im.width/3),cuts[row+1]))
                if row==0:
                    save(fit(cell,(384,128),(320,84)),folder/f'projectile_{col+1:02}.png')
                elif row==1:
                    frame=fit(cell,(256,256),(208,208));save(frame,folder/f'impact_{col+1:02}.png')
                    if col==1 and (folder/'impact.png').exists():save(frame,folder/'impact.png')
                elif col==1:
                    skill=fit(cell,(384,384),(304,304));save(skill,folder/'skill.png')
                    if id=='yuria':save(skill,folder/'barrier.png')
    return {'id':id,'kind':kind,'source':str(original.relative_to(ROOT)),'prompt':entry['prompt'],'method':'built-in image_gen; alpha-preserving uniform fit'}

if __name__=='__main__':
    manifest=json.loads((OUT/'generation-manifest.json').read_text(encoding='utf8'))
    manifest += [json.loads(p.read_text(encoding='utf8')) for p in sorted(OUT.glob('generated-*.json'))]
    replacements=[json.loads(p.read_text(encoding='utf8')) for p in sorted(OUT.glob('replacement-*.json'))]
    replaced={(e['id'],e['kind']) for e in replacements}
    manifest=[e for e in manifest if (e['id'],e['kind']) not in replaced]+replacements
    donepath=OUT/'prepared.json'
    done=json.loads(donepath.read_text()) if donepath.exists() else []
    for entry in manifest:
        if any(d['id']==entry['id'] and d['kind']==entry['kind'] and d.get('input')==entry['source'] and d.get('version')==VERSION for d in done):continue
        done=[d for d in done if not(d['id']==entry['id'] and d['kind']==entry['kind'])]
        prepared=prepare(entry);prepared['input']=entry['source'];prepared['version']=VERSION;done.append(prepared);donepath.write_text(json.dumps(done,indent=2),encoding='utf8')
        print('prepared',entry['id'],entry['kind'])
