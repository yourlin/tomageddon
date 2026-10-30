// Export the same authored animation data used by the game for the external gallery.
import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
const data = new URL('../src/data/', import.meta.url);
const entries = {};
const bindings = {};
for (const file of readdirSync(data).filter((n) => n.endsWith('Motion.ts'))) {
  const source = readFileSync(new URL(file, data), 'utf8').replace(/^import .*$/gm, '');
  const js = ts.transpileModule(`const currentGraphicsProfile = () => ({tier:'high',frameSize:256});\n${source}`, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  for (const [name, entry] of Object.entries(mod))
    if (entry?.anims) {
      entries[`${entry.kind}/${entry.id}${entry.skinId ? `/skins/${entry.skinId}` : ''}`] = entry;
      bindings[name] = entry;
    }
}
const phaseSource = readFileSync(new URL('bossMotionForms.ts', data), 'utf8').replace(/^import .*$/gm, '');
const prelude = Object.entries(bindings)
  .map(([name, entry]) => `const ${name}=${JSON.stringify(entry)};`)
  .join('\n');
const phaseJs = ts.transpileModule(prelude + '\n' + phaseSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const phaseModule = await import(`data:text/javascript;base64,${Buffer.from(phaseJs).toString('base64')}`);
for (const form of phaseModule.BOSS_MOTION_FORMS) entries[`boss/${form.id}/phases/${form.phase}`] = form.entry;
process.stdout.write(JSON.stringify(entries));
