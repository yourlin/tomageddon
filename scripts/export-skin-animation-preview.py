"""Export existing authored atlas frames and whole-sprite mirrors outside the repository."""
import argparse
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'tomato-sister-art-source'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan', type=Path)
    args = parser.parse_args()
    plan = json.loads(args.plan.read_text())
    actor, skin = plan['id'], plan['skinId']
    for value in (actor, skin):
        if not value or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789_' for c in value):
            parser.error('Expected plain character and skin ids')
    atlas = SOURCE / 'entities' / 'char' / actor / 'skins' / skin / 'motion.png'
    image = Image.open(atlas).convert('RGBA')
    count = sum(a['grid'] ** 2 for a in plan['actions'])
    columns = math.ceil(math.sqrt(count))
    frames = [image.crop((4 + i % columns * 264, 4 + i // columns * 264,
                          260 + i % columns * 264, 260 + i // columns * 264)) for i in range(count)]
    output = SOURCE / 'qa' / 'locomotion' / actor / 'skins' / skin
    output.mkdir(parents=True, exist_ok=True)
    sheet = Image.new('RGBA', (max(a['grid'] ** 2 for a in plan['actions']) * 256,
                               len(plan['actions']) * 280), '#dddddd')
    offset = 0
    for row, action in enumerate(plan['actions']):
        sequence = frames[offset:offset + action['grid'] ** 2]
        offset += len(sequence)
        order = action.get('playbackOrder', list(range(len(sequence))))
        if sorted(order) != list(range(len(sequence))):
            raise ValueError(f"Invalid playbackOrder for {action['name']}")
        sequence = [sequence[i] for i in order]
        for col, frame in enumerate(sequence):
            sheet.alpha_composite(frame, (col * 256, row * 280))
        ImageDraw.Draw(sheet).text((0, row * 280 + 256), action['name'], fill='black')
        for direction in ('right', 'left'):
            poses = sequence if direction == 'right' else [ImageOps.mirror(f) for f in sequence]
            for speed, duration in (('normal', 100), ('slow', 250)):
                # Current skin convention: open/open/half/closed; one 100ms full blink per 4s.
                ticks = [poses[0], poses[1]] * 19 + poses[2:4] if action['name'] == 'idle' and speed == 'normal' else poses
                ticks[0].save(output / f"{action['name']}-{direction}-{speed}.webp",
                              save_all=True, append_images=ticks[1:], duration=duration,
                              loop=0, lossless=True)
    sheet.convert('RGB').save(output / 'compiled-contact-sheet.jpg')
    print(output)


if __name__ == '__main__':
    main()
