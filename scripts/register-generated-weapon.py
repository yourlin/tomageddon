import subprocess
"""Keep original generated PNG; record visible bounds for in-engine layout."""
import json, shutil, sys, fcntl
from pathlib import Path
from PIL import Image
weapon_id, cls, source = sys.argv[1:4]
im=Image.open(source)
if im.mode!='RGBA':raise ValueError('Needs RGBA transparency')
box=im.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox()
if not box or box==(0,0,*im.size):raise ValueError('Needs isolated weapon')
p=Path(f'src/assets/weapons/{weapon_id}.png')
if p.exists():raise ValueError('Refusing to replace '+str(p))
p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,p)
subprocess.run([sys.executable, "scripts/bake-runtime-art.py", str(p)], check=True, capture_output=True)
p=Path('src/data/weaponArt.generated.json')
with open('/tmp/tomato-sister-weapon-register.lock','w') as lock:
    fcntl.flock(lock,fcntl.LOCK_EX)
    rows=json.loads(p.read_text())
    row=dict(id=weapon_id,file=f'{weapon_id}.png',cls=cls,bounds=box)
    rows.append(row)
    temp=p.with_suffix('.tmp')
    temp.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    temp.replace(p)
print(json.dumps(row))
