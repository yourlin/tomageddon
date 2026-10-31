"""Pack generated equal-grid drawings into aligned delivery sheets, preserving originals.

This only translates/resamples existing frames for runtime use; it never invents frames.
Use a draft output directory until playback and identity QA have passed.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

from PIL import Image


def gutter_cut(alpha, axis, expected, radius):
    """Find an actual transparent separator near a nominal grid boundary."""
    extent = alpha.width if axis == 'x' else alpha.height
    runs = []
    start = None
    for i in range(max(1, expected - radius), min(extent - 1, expected + radius) + 1):
        stripe = alpha.crop((i, 0, i + 1, alpha.height) if axis == 'x' else (0, i, alpha.width, i + 1))
        if stripe.getbbox() is None:
            if start is None:
                start = i
        elif start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, min(extent - 1, expected + radius) + 1))
    runs = [r for r in runs if r[1] - r[0] >= 4]
    if not runs:
        raise ValueError(f'No clear {axis} gutter near {expected}; inspect overlapping drawings')
    left, right = max(runs, key=lambda r: (r[1] - r[0], -abs((r[0] + r[1]) / 2 - expected)))
    return (left + right) // 2


def pack(source, output, columns=3, rows=3, name='idle', adaptive_gutters=False, tiers=None):
    if not re.fullmatch(r'[a-z][a-z0-9_-]*', name):
        raise ValueError('Animation name must be a simple lowercase identifier')
    original = Image.open(source).convert('RGBA')
    width, height = original.size
    # Generators may return odd dimensions. Pad only transparent pixels, never crop artwork.
    if width % columns or height % rows:
        padded = Image.new('RGBA', (width + (-width % columns), height + (-height % rows)))
        padded.alpha_composite(original)
        original = padded
        width, height = original.size
    cell_w, cell_h = width // columns, height // rows
    frames = []
    bounds = []
    rectangles = []
    alpha = original.getchannel('A').point(lambda a: 255 if a >= 32 else 0)
    ys = [0] + [gutter_cut(alpha, 'y', j * cell_h, cell_h // 4) if adaptive_gutters else j * cell_h
                for j in range(1, rows)] + [height]
    for i in range(columns * rows):
        row, column = divmod(i, columns)
        row_alpha = alpha.crop((0, ys[row], width, ys[row + 1]))
        xs = [0] + [gutter_cut(row_alpha, 'x', j * cell_w, cell_w // 4) if adaptive_gutters else j * cell_w
                    for j in range(1, columns)] + [width]
        rectangle = (xs[column], ys[row], xs[column + 1], ys[row + 1])
        frame = original.crop(rectangle)
        bbox = frame.getchannel('A').point(lambda a: 255 if a >= 32 else 0).getbbox()
        if not bbox:
            raise ValueError(f'Empty frame {i}')
        left, top, right, bottom = bbox
        if left == 0 or top == 0 or right == frame.width or bottom == frame.height:
            raise ValueError(f'Frame {i} touches cell boundary; regenerate before packing')
        frames.append(frame)
        bounds.append(bbox)
        rectangles.append(rectangle)

    # One shared scale preserves the actual breathing / pose differences between drawings.
    span = max(max(b[2] - b[0], b[3] - b[1]) for b in bounds)
    # Trim delivery frames around visible artwork with antialiasing padding, like an
    # atlas packer. Near-transparent noise far out in the source canvas must not
    # force a tiny on-screen character. Original source pixels remain untouched.
    crops = [(max(0, b[0] - 4), max(0, b[1] - 4), min(f.width, b[2] + 4), min(f.height, b[3] + 4))
             for f, b in zip(frames, bounds)]
    scale_limits = [0.78 / span]
    for crop, bbox in zip(crops, bounds):
        center = (bbox[0] + bbox[2]) / 2
        scale_limits.extend([0.48 / max(center - crop[0], crop[2] - center),
                             0.88 / (bbox[3] - crop[1])])
        if crop[3] > bbox[3]:
            scale_limits.append(0.08 / (crop[3] - bbox[3]))
    output.mkdir(parents=True, exist_ok=True)
    report = {'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'sourceSize': [width, height], 'sourceBounds': bounds, 'sourceRectangles': rectangles,
              'extraction': 'transparent-gutters' if adaptive_gutters else 'equal-grid',
              'name': name, 'frameCount': len(frames), 'status': 'packed-draft; playback QA required', 'tiers': {}}
    for tier, size in tiers or [('low', 128), ('standard', 256), ('high', 384)]:
        margin = 4
        stride = size + margin * 2
        sheet = Image.new('RGBA', (columns * stride, rows * stride))
        factor = min(1, size * min(scale_limits))
        baseline = round(size * 0.9)
        transforms = []
        for i, (frame, bbox, crop_box) in enumerate(zip(frames, bounds, crops)):
            left, top, right, bottom = bbox
            cropped = frame.crop(crop_box)
            scaled = cropped.resize((max(1, round(cropped.width * factor)),
                                     max(1, round(cropped.height * factor))), Image.Resampling.LANCZOS)
            dx = round(size / 2 - ((left + right) / 2 - crop_box[0]) * factor)
            dy = round(baseline - (bottom - crop_box[1]) * factor)
            if dx < 0 or dy < 0 or dx + scaled.width > size or dy + scaled.height > size:
                raise ValueError(f'{tier} frame {i} would clip; inspect stray alpha or adjust layout')
            sheet.alpha_composite(scaled, (i % columns * stride + margin + dx,
                                           i // columns * stride + margin + dy))
            transforms.append({'x': dx, 'y': dy, 'scale': factor})
        folder = output / tier
        folder.mkdir(exist_ok=True)
        target = folder / f'{name}.webp'
        sheet.save(folder / f'{name}.png')  # lossless intermediate, outside Git for source builds
        sheet.save(target, 'WEBP', quality=80, method=6, exact=True)
        config = {'file': target.name, 'frameWidth': size, 'frameHeight': size,
                  'margin': margin, 'spacing': margin * 2, 'frames': list(range(len(frames))),
                  'anchor': {'x': 0.5, 'y': baseline / size},
                  'sheetWidth': sheet.width, 'sheetHeight': sheet.height,
                  'decodedRgbaBytes': sheet.width * sheet.height * 4,
                  'downloadBytes': target.stat().st_size, 'transforms': transforms}
        (folder / f'{name}.json').write_text(json.dumps(config, indent=2) + '\n')
        report['tiers'][tier] = config
    (output / 'packing-report.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--columns', type=int, default=3)
    parser.add_argument('--rows', type=int, default=3)
    parser.add_argument('--name', default='idle')
    parser.add_argument('--adaptive-gutters', action='store_true', help='Extract complete figures across imperfect generated grid boundaries')
    args = parser.parse_args()
    if args.columns < 1 or args.rows < 1:
        parser.error('Grid dimensions must be positive')
    print(json.dumps(pack(args.source, args.output, args.columns, args.rows, args.name, args.adaptive_gutters), indent=2))
