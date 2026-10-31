"""Pack generated scene layers, retaining originals outside Git; no gameplay geometry edits."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import runpy
import subprocess
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(os.environ.get('TOMATO_ART_SOURCE',ROOT.parent/'tomato-sister-art-source')).resolve()

def build(plan_path):
    plan=json.loads(plan_path.read_text())
    ch=plan['chapter'];directory=SOURCE/'maps'/f'ch{ch}'
    ground=Image.open(SOURCE/plan['ground']).convert('RGBA')
    width,height=ground.size
    left,top,right,bottom=plan['playablePixelRect']
    world=plan['arenaSize']
    sx,sy=(right-left)/world[0],(bottom-top)/world[1]
    foreground=Image.new('RGBA',ground.size)
    compiled=[]
    for obj in plan['obstacles']:
        im=Image.open(SOURCE/obj['source']).convert('RGBA')
        box=im.getchannel('A').point(lambda a:255 if a>=32 else 0).getbbox()
        if not box:raise ValueError('Empty obstacle sprite')
        im=im.crop(box)
        if obj['kind']=='rect':
            size=(max(1,round(obj['w']*sx)),max(1,round(obj['h']*sy)))
            cx,cy=left+(obj['x']+obj['w']/2)*sx,top+(obj['y']+obj['h']/2)*sy
        else:
            diameter=2*obj['radius']
            factor=diameter/max(im.size)
            size=(max(1,round(im.width*factor*sx)),max(1,round(im.height*factor*sy)))
            cx,cy=left+obj['x']*sx,top+obj['y']*sy
        im=im.resize(size,Image.Resampling.LANCZOS)
        foreground.alpha_composite(im,(round(cx-size[0]/2),round(cy-size[1]/2)))
        compiled.append({**obj,'centerPixel':[cx,cy],'sizePixels':list(size)})
    ground.save(directory/'ground.png')
    if compiled:foreground.save(directory/'foreground.png')
    thumb=ground.copy();thumb.alpha_composite(foreground);thumb.thumbnail((256,256),Image.Resampling.LANCZOS);thumb.save(directory/'thumb.png')
    compile_one=runpy.run_path(str(ROOT/'scripts/bake-runtime-art.py'))['compile_one']
    names=['ground',*(['foreground'] if compiled else [])]
    for name, definition in plan.get('objects',{}).items():
        im=Image.open(SOURCE/definition['source']).convert('RGBA')
        box=im.getchannel('A').point(lambda a:255 if a>=32 else 0).getbbox()
        if not box:raise ValueError('Empty environment object')
        cw,chh=definition.get('canvas',[256,256])
        if min(cw,chh)<=16 or max(cw,chh)>2048:raise ValueError('Invalid packed object canvas')
        if definition.get('tile',False):
            # Repeating materials must fill the canvas: padding creates visible seams.
            packed=im.resize((cw,chh),Image.Resampling.LANCZOS)
        else:
            im=im.crop(box);im.thumbnail((cw-16,chh-16),Image.Resampling.LANCZOS)
            packed=Image.new('RGBA',(cw,chh));packed.alpha_composite(im,((cw-im.width)//2,(chh-im.height)//2))
        target=directory/'objects'/f'{name}.png';target.parent.mkdir(parents=True,exist_ok=True);packed.save(target)
        names.append(f'objects/{name}')
    for name in [*names,'thumb']:compile_one(directory/f'{name}.png')
    index_path=ROOT/'src/data/artRuntime.generated.json'
    variants={}
    for name in names:
        w0,h0=Image.open(directory/f'{name}.png').size
        limits=[('low',96),('standard',128)] if name.startswith('objects/') else [('low',768),('standard',1024)]
        for tier,cap in limits:
            ratio=min(1,cap/max(w0,h0));w,h=round(w0*ratio),round(h0*ratio)
            base=Path(name)
            file=Path('maps')/f'ch{ch}'/base.parent/'standard'/f'{base.name}-{tier}.webp'
            target=ROOT/'src/assets/runtime'/file
            subprocess.run(['cwebp','-quiet','-q','80','-m','4','-alpha_q','100','-exact','-resize',str(w),str(h),str(directory/f'{name}.png'),'-o',str(target)],check=True)
            variants.setdefault(name,{})[tier]={'file':file.as_posix(),'width':w,'height':h,'bytes':target.stat().st_size}
    with open('/tmp/tomato-sister-art-runtime.lock','w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        index=json.loads(index_path.read_text())
        for name,tiers in variants.items():
            row=index['files'][f'maps/ch{ch}/{name}.png']
            for variant in tiers.values():variant['sourceHash']=row['sourceHash']
            row['variants']=tiers
        temp=index_path.with_suffix('.scene.tmp')
        temp.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
        os.replace(temp,index_path)
    report={'chapter':ch,'dimensions':[width,height],'source':str(directory),'obstacles':compiled,'world':{'x':(width/2-left)/sx,'y':(height/2-top)/sy,'w':width/sx,'h':height/sy},'variants':variants,'status':'compiled; native collision/visual review pending'}
    report_path=ROOT/'reports/art-pilot'/f'scene-ch{ch}-compile.json';report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report['world']))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('plan',type=Path);args=parser.parse_args();build(args.plan)
