"""Compile generated actor drawings into one shared, bounded runtime sprite sheet.

Originals and lossless intermediates stay in TOMATO_ART_SOURCE, outside Git.
Publishing the derived WebP uses the existing runtime compiler and index lock.
"""
import argparse
import json
import math
import os
from pathlib import Path
import re
import runpy
import subprocess
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ.get('TOMATO_ART_SOURCE', str(ROOT.parent / 'tomato-sister-art-source'))).resolve()


def calibrate_action(frames, reference_frame, reference_height):
    """One scale for a whole action, fixed feet pivot; never normalize individual poses."""
    def bounds(frame):
        return frame.getchannel('A').point(lambda a: 255 if a >= 32 else 0).getbbox()
    if not 0 <= reference_frame < len(frames) or not 0 < reference_height < frames[0].height:
        raise ValueError('Invalid action calibration reference')
    ref = bounds(frames[reference_frame])
    factor = reference_height / (ref[3] - ref[1])
    width, height = frames[0].size
    pivot_x, pivot_y = width * .5, height * .9
    result = []
    for frame in frames:
        box = bounds(frame)
        projected = (pivot_x + (box[0] - pivot_x) * factor,
                     pivot_y + (box[1] - pivot_y) * factor,
                     pivot_x + (box[2] - pivot_x) * factor,
                     pivot_y + (box[3] - pivot_y) * factor)
        if min(projected[:2]) < 3 or projected[2] > width - 3 or projected[3] > height - 3:
            raise ValueError('Calibrated pose would clip; choose a smaller shared reference height')
        result.append(frame.transform((width, height), Image.Transform.AFFINE,
            (1 / factor, 0, pivot_x * (1 - 1 / factor),
             0, 1 / factor, pivot_y * (1 - 1 / factor)), Image.Resampling.BICUBIC))
    return result, {'referenceFrame': reference_frame, 'referenceHeight': reference_height,
                    'uniformActionScale': factor, 'pivot': [pivot_x, pivot_y]}


def build(plan_path):
    plan = json.loads(plan_path.read_text())
    missing = set(plan.get('requiredActions', [])) - {a['name'] for a in plan['actions']}
    if missing:
        raise ValueError('Required authored actions missing: ' + ', '.join(sorted(missing)))
    kind, actor = plan['kind'], plan['id']
    if kind not in ['char', 'enemy', 'boss'] or not re.fullmatch('[a-z0-9_]+', actor):
        raise ValueError('Invalid actor identity')
    phase = plan.get('phase')
    if phase is not None and (kind != 'boss' or type(phase) is not int or phase < 1):
        raise ValueError('Only Boss phases may specify a positive integer phase')
    skin_id = plan.get('skinId')
    if skin_id is not None and (kind != 'char' or not isinstance(skin_id, str) or not re.fullmatch('[a-z0-9_]+', skin_id) or phase is not None):
        raise ValueError('Only character plans may specify a safe skinId')
    pack = runpy.run_path(str(ROOT / 'scripts/pack-animation-sheet.py'))['pack']
    frame_size, padding = plan.get('frameSize', 256), 4
    if type(frame_size) is not int or frame_size not in (256, 320):
        raise ValueError('High-tier frameSize must be 256 or 320')
    frames, actions, sources = [], {}, []
    for action in plan['actions']:
        name, grid = action['name'], action['grid']
        if name in actions:
            raise ValueError(f'Duplicate action: {name}')
        source = (SOURCE / action['source']).resolve()
        source.relative_to(SOURCE)
        work = SOURCE / 'drafts' / kind / actor
        if skin_id is not None:
            work = work / 'skins' / skin_id
        if phase is not None:
            work = work / 'phases' / str(phase)
        work = work / f'packed-{name}-selected'
        report = pack(source, work, grid, grid, name, True, [('standard', frame_size)])
        sheet = Image.open(work / 'standard' / f'{name}.png').convert('RGBA')
        config = report['tiers']['standard']
        start = len(frames)
        action_frames = []
        for i in range(report['frameCount']):
            stride = frame_size + 2 * padding
            x, y = i % grid * stride + padding, i // grid * stride + padding
            action_frames.append(sheet.crop((x, y, x + frame_size, y + frame_size)))
        calibration = None
        reference_height = action.get("referenceHeight", plan.get("referenceHeight"))
        if reference_height is not None:
            action_frames, calibration = calibrate_action(action_frames, action["referenceFrame"], reference_height)
        frames.extend(action_frames)
        actions[name] = list(range(start, len(frames)))
        sources.append({'action': name, 'source': action['source'], 'sha256': report['sourceSha256'], 'calibration': calibration})
    columns = math.ceil(math.sqrt(len(frames)))
    rows = math.ceil(len(frames) / columns)
    stride = frame_size + padding * 2
    if max(columns, rows) * stride > 2048:
        raise ValueError('Atlas exceeds 2048; split into separately loaded pages')
    atlas = Image.new('RGBA', (columns * stride, rows * stride))
    for i, frame in enumerate(frames):
        atlas.alpha_composite(frame, (i % columns * stride + padding, i // columns * stride + padding))
    target = SOURCE / 'entities' / kind / actor / 'motion.png'
    if skin_id is not None:
        target = target.parent / 'skins' / skin_id / 'motion.png'
    if phase is not None:
        target = target.parent / 'phases' / str(phase) / 'motion.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(target)
    subprocess.run([sys.executable, str(ROOT / 'scripts/bake-runtime-art.py'), str(target)], check=True)
    tiers = {'high': {'file': 'motion.png', 'frameSize': frame_size,
                      'size': list(atlas.size), 'decodedRgbaBytes': atlas.width * atlas.height * 4}}
    for tier, small_size in [('low', 96), ('standard', 128)]:
        small_stride = small_size + padding * 2
        small = Image.new('RGBA', (columns * small_stride, rows * small_stride))
        for i, frame in enumerate(frames):
            resized = frame.resize((small_size, small_size), Image.Resampling.LANCZOS)
            small.alpha_composite(resized, (i % columns * small_stride + padding,
                                            i // columns * small_stride + padding))
        small_target = target.with_name(f'motion-{tier}.png')
        small.save(small_target)
        subprocess.run([sys.executable, str(ROOT / 'scripts/bake-runtime-art.py'), str(small_target)], check=True)
        tiers[tier] = {'file': small_target.name, 'frameSize': small_size, 'size': list(small.size),
                       'decodedRgbaBytes': small.width * small.height * 4}
    result = {'actor': actor, 'skinId': skin_id, 'status': 'compiled-pilot; gameplay and visual QA pending',
              'source': str(target), 'frameCount': len(frames), 'actions': actions,
              'size': list(atlas.size), 'frameSize': frame_size, 'spacing': padding * 2,
              'margin': padding, 'decodedRgbaBytes': atlas.width * atlas.height * 4, 'sources': sources, 'tiers': tiers}
    reports = ROOT / 'reports/art-pilot'
    reports.mkdir(parents=True, exist_ok=True)
    suffix = f'-phase-{phase}' if phase is not None else ''
    if skin_id is not None:
        suffix = f'-skin-{skin_id}'
    (reports / f'{actor}{suffix}-motion-atlas.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan', type=Path)
    args = parser.parse_args()
    print(json.dumps(build(args.plan), indent=2))
