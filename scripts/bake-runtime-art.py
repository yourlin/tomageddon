"""Compile delivery copies of generated art; original PNGs remain unchanged."""
import concurrent.futures
import fcntl
import hashlib
import json
import os
import re
from pathlib import Path
import struct
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/assets'
SOURCE = Path(os.environ.get('TOMATO_ART_SOURCE', str(ROOT.parent / 'tomato-sister-art-source')))
INDEX = ROOT / 'src/data/artRuntime.generated.json'
GROUPS = ('entities', 'maps', 'combat', 'weapons', 'projectiles', 'comics', 'cover')
QUALITY = 80
POLICY = f'webp-q{QUALITY}-owner-layout-v2'


def delivery_limit(relative, width, height):
    """高画质下载图的最长边：按游戏里最终绘制的尺寸定，超出部分不会被用到"""
    group = relative.parts[0]
    if group == 'weapons':
        return 320  # 武器图会被重绘进 256 宽的画布
    if group == 'projectiles':
        return 128  # 弹体画布最大 64×64
    if group == 'combat' and 'forms' not in relative.parts:
        return 160  # 战斗弹体在屏幕上只有几十像素
    return max(width, height)


def delivery_path(relative):
    parts = relative.parts
    group, name = parts[0], relative.stem
    if group == 'entities':
        if len(parts) >= 6 and parts[1] == 'char' and parts[3] == 'skins':
            return Path(*parts[:5], 'standard', *parts[5:]).with_suffix('.webp')
        if len(parts) >= 6 and parts[1] == 'boss' and parts[3] == 'phases':
            return Path(*parts[:5], 'standard', *parts[5:]).with_suffix('.webp')
        return Path(*parts[:3], 'base', 'standard', *parts[3:]).with_suffix('.webp')
    if group == 'weapons':
        return Path('weapons', name, 'standard', 'held.webp')
    if group == 'projectiles':
        if name.startswith('player_'):
            return Path('weapons', name[7:], 'standard', 'projectile.webp')
        if name.startswith('mine_'):
            return Path('weapons', name[5:], 'standard', 'mine.webp')
        if name.startswith('enemy_'):
            owner = name[6:]
            kind = 'enemy' if (SOURCE / 'entities/enemy' / owner).exists() else 'boss'
            return Path('entities', kind, owner, 'base', 'standard', 'projectiles', 'primary.webp')
        return Path('effects', 'shared', name.removeprefix('legacy_'), 'standard', 'projectile.webp')
    if group == 'combat':
        phase = re.fullmatch(r'(.+)-(\d+)', name) if 'forms' in parts else None
        if phase:
            return Path('entities', 'boss', phase[1], 'phase-' + phase[2], 'standard', 'body.webp')
        return Path('effects', parts[1], name, 'standard', 'projectile.webp')
    if group == 'comics':
        return Path('story', name, 'standard', 'comic.webp')
    if group == 'cover':
        return Path('cover', name, 'standard', 'background.webp')
    return Path(*parts[:-1], 'standard', parts[-1]).with_suffix('.webp')


def compile_one(path):
    path = Path(path).absolute()
    try:
        relative = path.relative_to(ASSETS)
    except ValueError:
        relative = path.relative_to(SOURCE)
    data = path.read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError(f'Expected PNG: {path}')
    width, height = struct.unpack('>II', data[16:24])
    source_hash = hashlib.sha256(data).hexdigest()
    compiled = delivery_path(relative)
    target = ASSETS / 'runtime' / compiled
    policy = POLICY
    limit = delivery_limit(relative, width, height)
    ratio = min(1, limit / max(width, height))
    out_width, out_height = max(1, round(width * ratio)), max(1, round(height * ratio))
    with open('/tmp/tomato-sister-art-runtime.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        index = json.loads(INDEX.read_text()) if INDEX.exists() else {'version': 1, 'files': {}}
        old = index['files'].get(relative.as_posix())
    if old and old.get('sourceHash') == source_hash and old.get('policy') == policy and target.exists():
        return old['sourceBytes'], old['bytes']
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_name(f'.{target.stem}-{uuid.uuid4().hex}.webp')
    command = ['cwebp', '-quiet', '-q', str(QUALITY), '-m', '4', '-alpha_q', '100', '-exact']
    if ratio < 1:
        command += ['-resize', str(out_width), str(out_height)]
    command += [str(path), '-o', str(temp)]
    try:
        subprocess.run(command, check=True, capture_output=True)
        os.replace(temp, target)
    finally:
        temp.unlink(missing_ok=True)
    row = {'file': compiled.as_posix(), 'sourceHash': source_hash,
           'sourceWidth': width, 'sourceHeight': height, 'width': out_width, 'height': out_height,
           'sourceBytes': len(data), 'bytes': target.stat().st_size, 'policy': policy}
    with open('/tmp/tomato-sister-art-runtime.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        index = json.loads(INDEX.read_text()) if INDEX.exists() else {'version': 1, 'files': {}}
        index['files'][relative.as_posix()] = row
        index['files'] = dict(sorted(index['files'].items()))
        temp_index = INDEX.with_suffix('.tmp')
        temp_index.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n')
        os.replace(temp_index, INDEX)
    return row['sourceBytes'], row['bytes']


if __name__ == '__main__':
    if sys.argv[1:] == ['--all']:
        paths = [p for group in GROUPS for p in (SOURCE / group).rglob('*.png')]
    else:
        paths = [Path(p) for p in sys.argv[1:]]
    if not paths:
        raise SystemExit('Pass original PNG paths or --all')
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        sizes = list(pool.map(compile_one, paths))
    subprocess.run([sys.executable, str(ROOT / 'scripts/bake-static-art-tiers.py')], check=True)
    print(json.dumps({'files': len(sizes), 'originalBytes': sum(a for a, _ in sizes), 'runtimeBytes': sum(b for _, b in sizes)}))
