import subprocess
"""Register an edited Boss phase PNG with its own foot anchor, without changing pixels."""
import json,sys,shutil,fcntl
from pathlib import Path
from PIL import Image
boss_id,phase,source=sys.argv[1:4];phase=int(phase)
im=Image.open(source)
if im.mode!='RGBA':raise ValueError('Needs original RGBA transparency')
box=im.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox()
if not box or box==(0,0,*im.size):raise ValueError('Needs isolated Boss phase')
x0,y0,x1,y1=box;w,h=im.size
row=dict(id=boss_id,phase=phase,file=f'forms/{boss_id}-{phase}.png',anchor=dict(x=round((x0+x1)/2/w,5),y=round(y1/h,5)),refRadius=round(max(x1-x0,(y1-y0)*.85)/2))
p=Path('src/assets/combat/global')/row['file']
if p.exists():raise ValueError('Refusing to replace '+str(p))
p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,p)
subprocess.run([sys.executable, "scripts/bake-runtime-art.py", str(p)], check=True, capture_output=True)
p=Path('src/data/bossFormArt.generated.json')
with open('/tmp/tomato-sister-boss-form-register.lock','w')as lock:
 fcntl.flock(lock,fcntl.LOCK_EX);rows=json.loads(p.read_text());rows.append(row)
 temp=p.with_suffix('.tmp');temp.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');temp.replace(p)
print(json.dumps(row))
