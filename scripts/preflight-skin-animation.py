"""Validate sprite gutters and select one safe shared action height before compiling a skin."""
import argparse
import json
from pathlib import Path
import runpy

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'tomato-sister-art-source'
pack = runpy.run_path(str(ROOT / 'scripts/pack-animation-sheet.py'))['pack']
calibrate = runpy.run_path(str(ROOT / 'scripts/build-animation-atlas.py'))['calibrate_action']


def preflight(plan_path):
    plan = json.loads(plan_path.read_text())
    if plan.get('kind') != 'char' or not plan.get('skinId'):
        raise ValueError('Expected character skin animation plan')
    limits = []
    results = []
    for action in plan['actions']:
        source = (SOURCE / action['source']).resolve()
        source.relative_to(SOURCE.resolve())
        output = source.parent / f"preflight-{action['name']}"
        grid = action['grid']
        try:
            pack(source, output, grid, grid, action['name'], True, [('standard', 256)])
        except ValueError as error:
            raise ValueError(f"{action['name']}: {error}") from error
        image = Image.open(output / f"standard/{action['name']}.png").convert('RGBA')
        frames = [image.crop((4 + i % grid * 264, 4 + i // grid * 264,
                              260 + i % grid * 264, 260 + i // grid * 264)) for i in range(grid * grid)]
        for height in range(min(plan.get('referenceHeight', 160), 160), 59, -1):
            try:
                calibrate(frames, action['referenceFrame'], height)
                limits.append(height)
                results.append({'action': action['name'], 'safeHeight': height})
                break
            except ValueError:
                continue
        else:
            raise ValueError(f"No safe calibration for {action['name']}")
    plan['referenceHeight'] = min(limits)
    plan['status'] = 'gutters and shared action calibration checked; runtime verification pending'
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n')
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan', type=Path)
    print(json.dumps(preflight(parser.parse_args().plan), indent=2))
