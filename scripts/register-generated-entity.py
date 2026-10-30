import subprocess
"""Copy original imagegen output and measure alpha geometry; does not alter pixels."""
import json, shutil, sys, fcntl
from pathlib import Path
from PIL import Image
kind, entity_id, source = sys.argv[1:4]
im = Image.open(source)
if im.mode != 'RGBA':
    raise ValueError('Generated sprite needs original RGBA transparency')
alpha = im.getchannel('A')
box = alpha.point(lambda a: 255 if a > 64 else 0).getbbox()
if not box or box == (0, 0, *im.size):
    raise ValueError('No isolated transparent sprite')
x0,y0,x1,y1 = box
w,h = im.size
row = dict(kind=kind,id=entity_id,anchor=dict(x=round((x0+x1)/2/w,5),y=round(y1/h,5)),refRadius=round(max(x1-x0,(y1-y0)*0.85)/2))
dest = Path(f'src/assets/entities/{kind}/{entity_id}/body.png')
if dest.exists(): raise ValueError(f'Refusing to replace {dest}')
dest.parent.mkdir(parents=True,exist_ok=True)
shutil.copy2(source,dest)
subprocess.run([sys.executable, "scripts/bake-runtime-art.py", str(dest)], check=True, capture_output=True)
p=Path('src/data/artGlobal.generated.json')
with open('/tmp/tomato-sister-art-register.lock','w') as lock:
    fcntl.flock(lock,fcntl.LOCK_EX)
    rows=json.loads(p.read_text())
    rows.append(row)
    temp=p.with_suffix('.tmp')
    temp.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    temp.replace(p)
print(json.dumps(dict(**row,canvas=im.size,alphaBounds=box)))
