"""Compile mobile delivery tiers; keep original artwork outside the repository."""
import concurrent.futures
import fcntl
import json
import os
from pathlib import Path
import subprocess
import uuid

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'src/data/artRuntime.generated.json'
RUNTIME = ROOT / 'src/assets/runtime'
SOURCE = Path(os.environ.get('TOMATO_ART_SOURCE', ROOT.parent / 'tomato-sister-art-source'))


def compile_row(item):
    key, row = item
    path = Path(key)
    if path.parts[0] != 'entities' or path.stem.startswith('motion'):
        return None
    limits = (256, 512) if path.parts[1] == 'boss' else (192, 384)
    variants = {}
    for tier, limit in zip(('low', 'standard'), limits):
        scale = min(1, limit / max(row['sourceWidth'], row['sourceHeight']))
        width = max(1, round(row['sourceWidth'] * scale))
        height = max(1, round(row['sourceHeight'] * scale))
        file = Path(row['file']).with_name(f'{Path(row["file"]).stem}-{tier}.webp')
        target = RUNTIME / file
        old = row.get('variants', {}).get(tier, {})
        if not (target.exists() and old.get('sourceHash') == row['sourceHash'] and old.get('width') == width and old.get('height') == height):
            temp = target.with_name(f'.{target.stem}-{uuid.uuid4().hex}.webp')
            try:
                subprocess.run(['cwebp', '-quiet', '-q', '92', '-m', '4', '-alpha_q', '100', '-exact',
                                '-resize', str(width), str(height), str(SOURCE / key), '-o', str(temp)],
                               check=True, capture_output=True)
                os.replace(temp, target)
            finally:
                temp.unlink(missing_ok=True)
        variants[tier] = {'file': file.as_posix(), 'width': width, 'height': height,
                          'bytes': target.stat().st_size, 'sourceHash': row['sourceHash']}
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
