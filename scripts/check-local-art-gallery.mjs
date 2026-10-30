// Local-only gallery regression; originals and gallery remain outside the Git repository.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = process.env.TOMATO_ART_SOURCE ?? resolve('../tomato-sister-art-source');
const entries = JSON.parse(execFileSync(process.execPath, ['scripts/export-gallery-animation.mjs'], { encoding: 'utf8', maxBuffer: 8e6 }));
const api = vm.runInNewContext(readFileSync(`${root}/_gallery/animation.js`, 'utf8') + ';GalleryAnimation;');
const blink = [];
for (const [id, closed] of [
  ['tomato', [4]],
  ['carrot', [2]],
  ['chili', [1, 2]],
  ['lemon', [1]],
]) {
  const entry = entries[`char/${id}`];
  const animation = { actions: entry.anims, action: 'idle' };
  let closedMilliseconds = 0;
  for (let millisecond = 0; millisecond < 4000; millisecond++)
    if (closed.includes(entry.anims.idle.frames[api.sequenceIndex(animation, (millisecond + 0.5) / 1000)])) closedMilliseconds++;
  assert.equal(closedMilliseconds, 100, `${id}: closed-eye duration changed`);
  blink.push({ actor: id, cycleMilliseconds: 4000, closedMilliseconds });
}
const geometry = JSON.parse(
  execFileSync(
    'python3',
    [
      '-c',
      `
import importlib.util, json, sys
from pathlib import Path
from PIL import Image
root = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location('gallery_build', root / '_gallery/build.py')
gallery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gallery)
gallery.RUNTIME = json.load(sys.stdin)
checks = 0
for key, entry in gallery.RUNTIME.items():
    for tier, size in [('high', entry['source']['frameWidth']), ('standard', 128), ('low', 96)]:
        path = root / 'entities' / key / ('motion.png' if tier == 'high' else 'motion-' + tier + '.png')
        with Image.open(path) as image:
            width, height = image.size
        info = gallery.anim_info(path, width, height, gallery.classify(path))
        assert info and info['fw'] == size and info['fh'] == size, (key, tier, info)
        for action in entry['anims'].values():
            for frame in action['frames']:
                x = info['margin'] + (frame % info['cols']) * (size + info['spacing'])
                y = info['margin'] + (frame // info['cols']) * (size + info['spacing'])
                assert 0 <= x and x + size <= width and 0 <= y and y + size <= height, (key, tier, frame)
        checks += 1
print(json.dumps({'atlases': len(gallery.RUNTIME), 'tierGeometryChecks': checks}))
`,
      root,
    ],
    { input: JSON.stringify(entries), encoding: 'utf8', maxBuffer: 8e6 },
  ),
);
const result = {
  status: 'passed',
  geometry,
  blink,
  scope: 'External local gallery slicing and clock; game continuous-play acceptance is separate.',
};
writeFileSync('reports/art-pilot/local-gallery-regression.json', JSON.stringify(result, null, 2));
console.log(result);
