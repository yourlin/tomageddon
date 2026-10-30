import subprocess
"""Register original generated projectile art and its gameplay texture layout."""
import json,sys,shutil,fcntl
from pathlib import Path
from PIL import Image
job_path,source=sys.argv[1:3]
job=json.load(open(job_path));im=Image.open(source)
if im.mode!='RGBA':raise ValueError('Needs RGBA transparency')
box=im.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox()
if not box or box==(0,0,*im.size):raise ValueError('Needs isolated projectile')
p=Path(f"src/assets/projectiles/{job['id']}.png")
if p.exists():raise ValueError('Refusing to replace '+str(p))
p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,p)
subprocess.run([sys.executable, "scripts/bake-runtime-art.py", str(p)], check=True, capture_output=True)
row={k:job[k] for k in ['id','key','size','spin','color']};row.update(file=p.name,bounds=box)
p=Path('src/data/projectileArt.generated.json')
with open('/tmp/tomato-sister-projectile-register.lock','w')as lock:
 fcntl.flock(lock,fcntl.LOCK_EX);rows=json.loads(p.read_text());rows.append(row)
 temp=p.with_suffix('.tmp');temp.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');temp.replace(p)
print(json.dumps(row))
