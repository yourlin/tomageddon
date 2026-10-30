// Verify review coverage and invalidate it whenever its compiled source changes.
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const index = read('src/data/artRuntime.generated.json');
const players = read('reports/art-pilot/player-visual-keyframe-review.json');
const bosses = read('reports/art-pilot/boss-visual-keyframe-review.json');
const elites = existsSync('reports/art-pilot/elite-visual-keyframe-review.json')
  ? read('reports/art-pilot/elite-visual-keyframe-review.json').forms
  : [];
const enemies = existsSync('reports/art-pilot/enemy-visual-keyframe-review.json')
  ? read('reports/art-pilot/enemy-visual-keyframe-review.json').forms
  : [];
const skins = existsSync('reports/art-pilot/skin-visual-keyframe-review.json')
  ? read('reports/art-pilot/skin-visual-keyframe-review.json').forms
  : [];
const root = process.env.TOMATO_ART_SOURCE ?? resolve('../tomato-sister-art-source');
const checkSource = process.argv.includes('--source');
const errors = [];
const reviewed = new Set();
let frames = 0;
for (const row of [...players.actors, ...bosses.forms, ...elites, ...enemies, ...skins]) {
  const id = row.actor ?? row.form;
  const key = relative(root, row.sourceAtlas ?? root)
    .split('\\')
    .join('/');
  if (!/^(entities\/(char|boss|enemy)\/).+\/motion\.png$/.test(key)) errors.push(`${id}: invalid review source`);
  if (reviewed.has(key)) errors.push(`${id}: duplicate review source`);
  reviewed.add(key);
  const delivery = index.files[key];
  if (!row.sourceAtlasSha256 || row.sourceAtlasSha256 !== delivery?.sourceHash) errors.push(`${id}: stale or missing source fingerprint`);
  if (row.status?.startsWith('awaiting')) errors.push(`${id}: visual review unfinished`);
  if (row.sheet) {
    if (!existsSync(row.sheet) || createHash('sha256').update(readFileSync(row.sheet)).digest('hex') !== row.reviewSheetSha256)
      errors.push(`${id}: review sheet changed or missing`);
  }
  if (
    checkSource &&
    (!existsSync(row.sourceAtlas) || createHash('sha256').update(readFileSync(row.sourceAtlas)).digest('hex') !== row.sourceAtlasSha256)
  )
    errors.push(`${id}: external compiled atlas changed or missing`);
  frames += row.frames;
}
const expected = Object.keys(index.files).filter((key) => /^entities\/(char|boss|enemy)\/.+\/motion\.png$/.test(key));
for (const key of expected) if (!reviewed.has(key)) errors.push(`Unreviewed atlas: ${key}`);
const result = {
  scope: 'Compiled keyframe review only; continuous playback, performance and final acceptance remain separate gates.',
  players: players.actors.length,
  bossForms: bosses.forms.length,
  elites: elites.length,
  enemies: enemies.length,
  skins: skins.length,
  reviewedAtlases: reviewed.size,
  expectedAtlases: expected.length,
  frames,
  checkedExternalSource: checkSource,
  errors,
};
writeFileSync('reports/art-pilot/animation-review-integrity.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
