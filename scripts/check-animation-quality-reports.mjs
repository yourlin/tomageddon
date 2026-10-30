// Reconcile prior browser viewport checks with the CURRENT compiled atlas geometry.
// This does not rerun the browser or turn mobile emulation into physical-device evidence.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const entries = JSON.parse(execFileSync(process.execPath, ['scripts/export-gallery-animation.mjs'], { encoding: 'utf8', maxBuffer: 8e6 }));
const indexText = readFileSync('src/data/artRuntime.generated.json', 'utf8');
const index = JSON.parse(indexText).files;
const cases = ['phone-low', 'phone-standard', 'desktop-high', 'ultrawide-high'];
const checked = [],
  reports = new Set();
for (const [identity, entry] of Object.entries(entries)) {
  if (entry.skinId) continue; // Skin-specific three-tier playback/lifecycle is checked separately.
  const phase = Number(identity.match(/\/phases\/(\d+)$/)?.[1] ?? 0);
  // Boss phase runs also load/check the base atlas, and supersede older base-only runs.
  const path = `reports/art-pilot/${entry.id === 'tomato' ? '' : entry.id + '-'}${entry.kind === 'boss' ? 'phase-' : ''}graphics-quality-native.json`;
  const report = JSON.parse(readFileSync(path, 'utf8'));
  assert.equal(report.status, 'passed', path);
  reports.add(path);
  for (const name of cases) {
    const sample = report.results.find((r) => r.name === name);
    assert.ok(sample, `${identity}:${name} missing viewport`);
    const tier = name === 'phone-low' ? 'low' : name === 'phone-standard' ? 'standard' : 'high';
    const geometry = phase ? sample.phaseChecks?.find((r) => r.phase === phase) : sample;
    const suffix = tier === 'high' ? '' : `-${tier}`;
    const file = `entities/${identity}/motion${suffix}.png`;
    const current = index[file];
    assert.ok(current && geometry, `${identity}:${name} missing atlas/phase`);
    assert.deepEqual(geometry.textureSize, [current.width, current.height], `${identity}:${name} stale atlas size`);
    assert.equal(geometry.frameWidth, tier === 'high' ? entry.source.frameWidth : tier === 'low' ? 96 : 128);
    assert.ok(sample.canvas[0] <= 2560 && sample.canvas[1] <= 1440, `${identity}:${name} exceeds QHD`);
    assert.ok(
      Math.abs(sample.pointer.x - sample.expectedPointer[0]) < 1 && Math.abs(sample.pointer.y - sample.expectedPointer[1]) < 1,
      `${identity}:${name} pointer mapping`,
    );
    const motionRequests = sample.imageRequests.filter((u) => /\/motion(?:-low|-standard)?\.webp/.test(u));
    assert.ok(motionRequests.length, `${identity}:${name} no motion request`);
    assert.ok(
      motionRequests.every((u) => u.endsWith(`/motion${suffix}.webp`)),
      `${identity}:${name} mixed tiers`,
    );
    checked.push({ identity, viewport: name, tier, textureSize: geometry.textureSize, frameWidth: geometry.frameWidth });
  }
}
assert.equal(checked.length, 376);
writeFileSync(
  'reports/art-pilot/animation-quality-report-audit.json',
  JSON.stringify(
    {
      status: 'passed',
      runtimeIndexSha256: createHash('sha256').update(indexText).digest('hex'),
      scope:
        'Existing native-browser reports reconciled against current compiled geometry and QHD/pointer/tier invariants. Not fresh playback, pixel-sharpness or physical-phone acceptance.',
      appearances: Object.keys(entries).length,
      browserReports: reports.size,
      checked,
    },
    null,
    2,
  ),
);
console.log(
  `Verified ${checked.length} appearance/viewport records across ${reports.size} browser reports against current atlas geometry.`,
);
