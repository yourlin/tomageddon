"""Compile mobile delivery tiers; keep original artwork outside the repository."""
import concurrent.futures
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import uuid

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'src/data/artRuntime.generated.json'
RUNTIME = ROOT / 'src/assets/runtime'
SOURCE = Path(os.environ.get('TOMATO_ART_SOURCE', ROOT.parent / 'tomato-sister-art-source'))
QUALITY = 80
POLICY = f'webp-q{QUALITY}-tier-v1'


def tier_limits(path):
    """低 / 标准两档的最长边；高档即主编译图（见 bake-runtime-art.py）"""
    group = path.parts[0]
    if group == 'entities' and not path.stem.startswith('motion'):
        return (256, 512) if path.parts[1] == 'boss' else (192, 384)
    if group == 'weapons':
        return (192, 256)
    if group == 'projectiles':
        return (64, 96)
    if group == 'combat' and 'forms' not in path.parts:
        return (96, 128)
    if group == 'maps' and path.stem != 'thumb':
        # 与 build-scene-art.py 一致：地图物体小图，地面 / 前景大图
        return (96, 128) if 'objects' in path.parts else (768, 1024)
    return None


def compile_row(item):
    key, row = item
    path = Path(key)
    limits = tier_limits(path)
    if not limits:
        return None
    source = SOURCE / key
    # 原画已改但还没重新编译主图时不出分档：否则分档内容和记录的 sourceHash 对不上
    if not source.exists() or hashlib.sha256(source.read_bytes()).hexdigest() != row['sourceHash']:
        return None
    variants = {}
    for tier, limit in zip(('low', 'standard'), limits):
        scale = min(1, limit / max(row['sourceWidth'], row['sourceHeight']))
        width = max(1, round(row['sourceWidth'] * scale))
        height = max(1, round(row['sourceHeight'] * scale))
        file = Path(row['file']).with_name(f'{Path(row["file"]).stem}-{tier}.webp')
        target = RUNTIME / file
        old = row.get('variants', {}).get(tier, {})
        fresh = old.get('sourceHash') == row['sourceHash'] and old.get('width') == width and old.get('height') == height
        if not (target.exists() and fresh and old.get('policy') == POLICY):
            temp = target.with_name(f'.{target.stem}-{uuid.uuid4().hex}.webp')
            try:
                subprocess.run(['cwebp', '-quiet', '-q', str(QUALITY), '-m', '4', '-alpha_q', '100', '-exact',
                                '-resize', str(width), str(height), str(SOURCE / key), '-o', str(temp)],
                               check=True, capture_output=True)
                os.replace(temp, target)
            finally:
                temp.unlink(missing_ok=True)
        variants[tier] = {'file': file.as_posix(), 'width': width, 'height': height,
                          'bytes': target.stat().st_size, 'sourceHash': row['sourceHash'], 'policy': POLICY}
    return key, variants


if __name__ == '__main__':
    index = json.loads(INDEX.read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = [result for result in pool.map(compile_row, index['files'].items()) if result]
    with open('/tmp/tomato-sister-art-runtime.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        index = json.loads(INDEX.read_text())
        for key, variants in results:
            index['files'][key]['variants'] = variants
        temp = INDEX.with_suffix('.tmp')
        temp.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n')
        os.replace(temp, INDEX)
    print(json.dumps({'staticAppearances': len(results), 'deliveryVariants': len(results) * 2}))
