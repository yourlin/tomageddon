// 验证构建产物没有携带原画；无需访问仓库外的原画目录。
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const directory = resolve(process.argv[2] ?? 'dist');
const index = JSON.parse(readFileSync('src/data/artRuntime.generated.json', 'utf8'));
const originalHashes = new Set(Object.values(index.files).map((row) => row.sourceHash));
const errors = [];
let files = 0;
let bytes = 0;
let webpFiles = 0;
function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      errors.push(`Published symbolic link: ${file}`);
      continue;
    }
    if (entry.isDirectory()) {
      visit(file);
      continue;
    }
    const data = readFileSync(file);
    files++;
    bytes += data.length;
    if (extname(file).toLowerCase() === '.webp') webpFiles++;
    if (originalHashes.has(createHash('sha256').update(data).digest('hex'))) errors.push(`Published original artwork: ${file}`);
    if (/\.(psd|psb|kra|xcf|blend|aseprite)$/i.test(file)) errors.push(`Published editable art source: ${file}`);
  }
}
if (!existsSync(join(directory, 'index.html'))) errors.push('Missing release index.html');
else visit(directory);
if (!webpFiles) errors.push('No compiled WebP game resources in release');
console.log(JSON.stringify({ directory, files, bytes, webpFiles, errors }, null, 2));
if (errors.length) process.exitCode = 1;
