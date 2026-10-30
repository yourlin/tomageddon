// Timing regression for the closed drawings identified during compiled-keyframe review.
// This checks clocks and sequences, not whether a newly drawn eye is visually correct.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

const entries = JSON.parse(execFileSync(process.execPath, ['scripts/export-gallery-animation.mjs'], { encoding: 'utf8', maxBuffer: 8e6 }));
const source = ts.createSourceFile('ArtResolve.ts', readFileSync('src/systems/ArtResolve.ts', 'utf8'), ts.ScriptTarget.Latest, true);
const declarations = source.statements.filter(
  (node) =>
    (ts.isFunctionDeclaration(node) && node.name?.text === 'frameIndexAt') ||
    (ts.isVariableStatement(node) && node.declarationList.declarations.some((d) => d.name.getText(source) === 'animLoops')),
);
assert.equal(declarations.length, 2);
const printer = ts.createPrinter();
const js = ts.transpileModule(declarations.map((n) => printer.printNode(ts.EmitHint.Unspecified, n, source)).join('\n'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { frameIndexAt } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const checked = [],
  excluded = [];
for (const [identity, entry] of Object.entries(entries)) {
  if (entry.id === 'mole_general') {
    excluded.push({ identity, reason: 'Opaque sunglasses conceal the eyes; the nod is not counted as a visible blink.' });
    continue;
  }
  const closed = entry.kind === 'char' ? ({ tomato: [4], chili: [1, 2], lemon: [1] }[entry.id] ?? [2]) : [2];
  const idle = entry.anims.idle;
  assert.equal(idle.frames.length / (idle.fps ?? 10), 4, `${identity}: idle period`);
  let closedMilliseconds = 0,
    episodes = 0,
    previousClosed = false;
  for (let ms = 0; ms < 4000; ms++) {
    const isClosed = closed.includes(idle.frames[frameIndexAt(idle, 'idle', (ms + 0.5) / 1000)]);
    if (isClosed) closedMilliseconds++;
    if (isClosed && !previousClosed) episodes++;
    previousClosed = isClosed;
  }
  assert.equal(closedMilliseconds, 100, `${identity}: fully closed duration`);
  assert.equal(episodes, 1, `${identity}: blink episodes`);
  checked.push({ identity, closedFrames: closed, closedMilliseconds, episodes, periodMilliseconds: 4000 });
}
assert.equal(checked.length, 91);
assert.equal(excluded.length, 3);
writeFileSync(
  'reports/art-pilot/animation-blink-timing.json',
  JSON.stringify(
    {
      status: 'passed',
      scope:
        'Runtime frameIndexAt and authored idle sequences; closed-frame identities from prior visual review. Not a new eye-shape review or live-rendered duration measurement.',
      checked,
      excluded,
    },
    null,
    2,
  ),
);
console.log(`Verified100ms blink once per4s for ${checked.length} appearances; ${excluded.length} opaque-sunglasses forms excluded.`);
