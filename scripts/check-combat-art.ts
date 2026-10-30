import runtimeIndex from '../src/data/artRuntime.generated.json';
// 校验战斗附加素材的文件、透明通道、尺寸与锚点（无 Phaser / 浏览器依赖）。
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CH1_PROJECTILES, CH1_BOSS_FORMS } from '../src/data/combatArt';

const root = resolve(import.meta.dirname, '../src/assets/runtime');
const compiled = runtimeIndex.files as Record<string, { file: string; width: number; height: number }>;
const assets = [...Object.values(CH1_PROJECTILES), ...Object.values(CH1_BOSS_FORMS).flatMap((forms) => Object.values(forms))];
const used = new Set<string>();
const failures: string[] = [];
for (const a of assets) {
  try {
    const entry = compiled[`combat/ch1/${a.file}`];
    if (!entry) throw Error('未编译游戏资源');
    const image = readFileSync(resolve(root, entry.file));
    if (image.toString('ascii', 0, 4) !== 'RIFF' || image.toString('ascii', 8, 12) !== 'WEBP') throw Error('不是 WebP');
    if (!image.includes(Buffer.from('ALPH')) && image.toString('ascii', 12, 16) !== 'VP8L') throw Error('缺少透明通道');
    const width = entry.width,
      height = entry.height;
    if (width <= 0 || height <= 0 || a.refRadius <= 0 || a.refRadius > Math.max(width, height)) throw Error('参考半径 / 尺寸不合法');
    if (a.anchor.x < 0 || a.anchor.x > 1 || a.anchor.y < 0 || a.anchor.y > 1) throw Error('锚点越界');
    if (used.has(a.file)) throw Error('重复文件');
    used.add(a.file);
  } catch (e) {
    failures.push(`${a.file}: ${(e as Error).message}`);
  }
}
for (const key of Object.keys(compiled)) {
  if (key.startsWith('combat/ch1/') && !used.has(key.slice('combat/ch1/'.length))) failures.push(`未登记文件 ${key}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(`战斗美术通过：${Object.keys(CH1_PROJECTILES).length} 种弹体、6 张 Boss 阶段形态，0 个缺失文件。`);
