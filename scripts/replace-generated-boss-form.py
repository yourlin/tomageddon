import subprocess
"""Install a reviewed phase revision; retain original PNG pixels and recalibrate geometry."""
import fcntl
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

boss_id, phase_text, source, reason = sys.argv[1:5]
phase = int(phase_text)
im = Image.open(source)
if im.mode != 'RGBA':
    raise ValueError('Revision requires true RGBA transparency')
box = im.getchannel('A').point(lambda a: 255 if a > 64 else 0).getbbox()
if not box or box[0] <= 0 or box[1] <= 0 or box[2] >= im.width or box[3] >= im.height:
    raise ValueError('Revision silhouette must have clear margin on every side')
x0, y0, x1, y1 = box
p = Path('src/data/bossFormArt.generated.json')
with open('/tmp/tomato-sister-boss-form-register.lock', 'w') as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)
    rows = json.loads(p.read_text())
    row = next(r for r in rows if r['id'] == boss_id and r['phase'] == phase)
    target = Path('src/assets/combat/global') / row['file']
    shutil.copy2(source, target)
    subprocess.run([sys.executable, 'scripts/bake-runtime-art.py', str(target)], check=True, capture_output=True)
    row['anchor'] = {'x': round((x0+x1)/2/im.width, 5), 'y': round(y1/im.height, 5)}
    row['refRadius'] = round(max(x1-x0, (y1-y0)*.85)/2)
    temp = p.with_suffix('.tmp')
    temp.write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n')
    temp.replace(p)
record_path = Path(f'reports/art-pilot/generation/phase-{boss_id}-{phase}.json')
record = json.loads(record_path.read_text())
record.setdefault('revisions', []).append({'source': source, 'reason': reason, 'tool': 'built-in image_gen'})
record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(row))
