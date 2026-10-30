import runtimeIndex from '../src/data/artRuntime.generated.json';
import { planProjectileArt } from './global-projectile-plan';
// 允许分批制作；--complete 才把任何未完成项视为错误，避免将局部绿灯当作全量完成。
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENEMIES } from '../src/data/enemies';
import { BOSSES } from '../src/data/bosses';
import { WEAPONS } from '../src/data/weapons';
import { EVOLVED_WEAPONS } from '../src/data/evolutions';
import { FUSED_WEAPONS } from '../src/data/recipes';
import { ENTITY_ART } from '../src/data/artManifest';
import { CH1_BOSS_FORMS } from '../src/data/combatArt';
import weapons from '../src/data/weaponArt.generated.json';
import projectiles from '../src/data/projectileArt.generated.json';
import forms from '../src/data/bossFormArt.generated.json';
const errors: string[] = [],
  missing: string[] = [];
const weaponIds = new Set([...WEAPONS, ...EVOLVED_WEAPONS, ...FUSED_WEAPONS].map((w) => w.id));
type CompiledArt = { file: string; sourceWidth: number; sourceHeight: number };
const compiled = runtimeIndex.files as Record<string, CompiledArt>;
const gameFile = (file: string): string | null => {
  const row = compiled[file.replace(/^src\/assets\//, '')];
  return row ? `src/assets/runtime/${row.file}` : null;
};
function png(file: string, bounds?: number[]): void {
  try {
    const key = file.replace(/^src\/assets\//, '');
    const row = compiled[key];
    if (!row) throw Error('not compiled');
    const data = readFileSync(gameFile(file)!);
    if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') throw Error('not WebP');
    if (!data.includes(Buffer.from('ALPH')) && data.toString('ascii', 12, 16) !== 'VP8L') throw Error('no alpha channel');
    if (bounds) {
      const [l, t, r, b] = bounds;
      if (!(l >= 0 && t >= 0 && r > l && b > t && r <= row.sourceWidth && b <= row.sourceHeight))
        throw Error('bounds outside original calibration');
    }
  } catch (e) {
    errors.push(`${file}: ${String(e)}`);
  }
}
for (const [kind, defs] of [
  ['enemy', ENEMIES],
  ['boss', BOSSES],
] as const) {
  for (const d of defs) {
    const art = ENTITY_ART.find((a) => a.kind === kind && a.id === d.id);
    if (!art?.source || !existsSync(gameFile(`src/assets/entities/${kind}/${d.id}/${art.source.file}`) ?? ''))
      missing.push(`${kind}:${d.id}`);
  }
}
const seenWeapons = new Set<string>();
for (const a of weapons) {
  if (!weaponIds.has(a.id) || seenWeapons.has(a.id)) errors.push(`Unknown/duplicate weapon ${a.id}`);
  seenWeapons.add(a.id);
  png(`src/assets/weapons/${a.file}`, a.bounds);
}
for (const id of weaponIds) if (!seenWeapons.has(id)) missing.push(`weapon:${id}`);
const planned = planProjectileArt();
const seenProjectiles = new Set<string>();
for (const a of projectiles as { id: string; key: string; file: string; bounds: number[]; size: number[] }[]) {
  if (seenProjectiles.has(a.key) || !planned.some((j) => j.id === a.id && j.key === a.key))
    errors.push(`Unknown/duplicate projectile ${a.id}`);
  seenProjectiles.add(a.key);
  png(`src/assets/projectiles/${a.file}`, a.bounds);
  if (a.size.length !== 2 || a.size.some((v) => !Number.isInteger(v) || v <= 0 || v > 128)) errors.push(`Projectile size ${a.id}`);
}
for (const a of planned) if (!seenProjectiles.has(a.key)) missing.push(`projectile:${a.id}`);
for (const b of BOSSES)
  for (let i = 1; i < (b.phases?.length ?? 0); i++) {
    const own = (forms as { id: string; phase: number; file: string; refRadius: number; anchor: { x: number; y: number } }[]).find(
      (f) => f.id === b.id && f.phase === i,
    );
    const old = CH1_BOSS_FORMS[b.id]?.[i];
    const form = own ?? old;
    if (!form) missing.push(`phase:${b.id}:${i}`);
    else {
      png(`src/assets/combat/${own ? 'global' : 'ch1'}/${form.file}`);
      if (!(form.refRadius > 0) || form.anchor.x < 0 || form.anchor.x > 1 || form.anchor.y < 0 || form.anchor.y > 1)
        errors.push(`Phase geometry ${b.id}:${i}`);
    }
  }
for (const [dir, rows] of [
  ['weapons', weapons],
  ['projectiles', projectiles],
] as const) {
  const root = resolve(`src/assets/${dir}`);
  if (!existsSync(root)) continue;
  for (const f of readdirSync(root))
    if (f.endsWith('.png') && !(rows as { file: string }[]).some((a) => a.file === f)) errors.push(`Unregistered ${dir}/${f}`);
}
console.log({
  weapons: `${seenWeapons.size}/${weaponIds.size}`,
  projectiles: `${seenProjectiles.size}/${planned.length}`,
  remaining: missing.length,
  errors: errors.length,
});
if (errors.length) console.error(errors.join('\n'));
if (process.argv.includes('--complete') && missing.length) {
  console.error('Not complete:\n' + missing.join('\n'));
  process.exitCode = 1;
}
if (!planned.length) {
  console.error('Projectile scope not planned');
  process.exitCode = 1;
}
if (errors.length) process.exitCode = 1;
