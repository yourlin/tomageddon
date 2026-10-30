import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const index = JSON.parse(readFileSync('src/data/artRuntime.generated.json', 'utf8'));
const sourceRoot = process.env.TOMATO_ART_SOURCE ?? resolve('../tomato-sister-art-source');
const checkSource = process.argv.includes('--source');
const errors = [],
  totals = {},
  seen = new Set();
for (const [key, row] of Object.entries(index.files)) {
  const group = key.split('/')[0];
  totals[group] ??= { files: 0, originalBytes: 0, runtimeBytes: 0 };
  const target = join('src/assets/runtime', row.file);
  if (seen.has(row.file)) errors.push(`Duplicate runtime destination: ${row.file}`);
  seen.add(row.file);
  if (!existsSync(target)) {
    errors.push(`Missing delivery file: ${target}`);
    continue;
  }
  const data = readFileSync(target);
  if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP' || data.length !== row.bytes)
    errors.push(`Invalid delivery file: ${target}`);
  if (row.width <= 0 || row.height <= 0 || row.sourceWidth <= 0 || row.sourceHeight <= 0) errors.push(`Invalid delivery geometry: ${key}`);
  if (checkSource) {
    const source = join(sourceRoot, key);
    if (!existsSync(source)) errors.push(`Missing external original: ${source}`);
    else if (createHash('sha256').update(readFileSync(source)).digest('hex') !== row.sourceHash) errors.push(`Stale runtime copy: ${key}`);
  }
  for (const [tier, variant] of Object.entries(row.variants ?? {})) {
    const file = join('src/assets/runtime', variant.file);
    if (!['low', 'standard'].includes(tier)) errors.push(`Unknown tier: ${key}/${tier}`);
    if (seen.has(variant.file)) errors.push(`Duplicate runtime destination: ${variant.file}`);
    seen.add(variant.file);
    if (!existsSync(file)) {
      errors.push(`Missing tier: ${file}`);
      continue;
    }
    const bytes = readFileSync(file);
    if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP' || bytes.length !== variant.bytes)
      errors.push(`Invalid tier: ${file}`);
    if (
      variant.sourceHash !== row.sourceHash ||
      !(variant.width > 0 && variant.height > 0) ||
      variant.width > row.sourceWidth ||
      variant.height > row.sourceHeight
    )
      errors.push(`Stale or invalid tier geometry: ${key}/${tier}`);
    totals[group].runtimeBytes += bytes.length;
  }
  totals[group].files++;
  totals[group].originalBytes += row.sourceBytes;
  totals[group].runtimeBytes += data.length;
}
if (!seen.size) errors.push('No compiled game resources');
console.log(JSON.stringify({ sourceRequired: checkSource, totals, errors }, null, 2));
if (errors.length) process.exitCode = 1;
