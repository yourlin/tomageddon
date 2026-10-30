import runtimeIndex from '../src/data/artRuntime.generated.json';
// 外部美术清单校验与覆盖报告：npm run check:art [-- --report]
// 读取 src/assets/entities、src/assets/maps 下的文件（图片尺寸、图集 JSON），对照 src/data/artManifest.ts 检查：
// 未知实体 / 皮肤 / 变体、重复条目、缺文件、精灵表切分与帧范围、图集帧名与旋转打包、未登记文件。
// --report 额外列出每章依赖的每个实体用的是精确素材 / 复用 / 程序化回退。有 error 时退出码为 1。
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ENTITY_ART, MAP_ART, ART_SCHEMA_VERSION } from '../src/data/artManifest';
import { validateArt, chapterCoverage, chooseArt, type ArtFileInfo } from '../src/systems/ArtResolve';
import { CHAPTERS } from '../src/data/chapters';
import { CHARACTERS } from '../src/data/characters';
import { SKINS_OF } from '../src/data/skins';

const ROOT = join(import.meta.dirname, '..', 'src', 'assets');

/** 读图片尺寸（PNG / WebP / JPEG 头部） */
export function imageSize(b: Buffer): { width: number; height: number } | null {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8L') {
      const v = b.readUInt32LE(21);
      return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) return null;
      const m = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

const files = new Map<string, ArtFileInfo>();
const warnAlpha: string[] = [];
for (const [rel, row] of Object.entries(runtimeIndex.files)) {
  if (!rel.startsWith('entities/') && !rel.startsWith('maps/')) continue;
  const abs = join(ROOT, 'runtime', row.file);
  if (!existsSync(abs)) continue;
  const b = readFileSync(abs),
    size = imageSize(b);
  const info: ArtFileInfo = size ?? {};
  files.set(rel, info);
  if (rel.startsWith('entities/') && !b.includes(Buffer.from('ALPH')) && b.toString('ascii', 12, 16) !== 'VP8L') warnAlpha.push(rel);
}

const diags = validateArt(files);
for (const p of warnAlpha) diags.push({ level: 'warn', where: p, msg: 'PNG 没有透明通道（战斗实体不能带底色 / 棋盘格）' });
const errors = diags.filter((d) => d.level === 'error');
const warns = diags.filter((d) => d.level === 'warn');

console.log(
  `美术清单 schema v${ART_SCHEMA_VERSION}：${ENTITY_ART.length} 个实体条目、${MAP_ART.length} 张地图，扫描到 ${files.size} 个文件`,
);
for (const d of errors) console.log(`  ✗ ${d.where}：${d.msg}`);
for (const d of warns) console.log(`  ! ${d.where}：${d.msg}`);

// 覆盖概览
const fileSet = new Set(files.keys());
const charRows = CHARACTERS.flatMap((c) => [
  { kind: 'char' as const, id: c.id },
  ...SKINS_OF[c.id].map((s) => ({ kind: 'char' as const, id: c.id, skinId: s.id })),
]);
const charArt = charRows.filter((v) => chooseArt(v, 'body', ENTITY_ART, fileSet)).length;
console.log(`\n角色外观：${charArt} / ${charRows.length}（含皮肤）有外部素材，其余为程序化 Rig`);
const report = process.argv.includes('--report');
for (const ch of CHAPTERS) {
  const rows = chapterCoverage(ch.id, ENTITY_ART, fileSet);
  const n = (k: 'exact' | 'reuse') => rows.filter((r) => r.body === k).length;
  const map = MAP_ART.some((m) => m.ch === ch.id) ? '外部地图' : '程序地图';
  console.log(
    `第 ${ch.id} 章：${rows.length} 个外观，精确素材 ${n('exact')}、复用 ${n('reuse')}、程序化 ${rows.length - n('exact') - n('reuse')}；${map}`,
  );
  if (report)
    for (const r of rows) {
      const name = `${r.ident.kind}:${r.ident.id}${r.ident.variant ? `:${r.ident.variant}` : ''}`;
      console.log(`    ${r.body.padEnd(5)} 头像 ${r.portrait.padEnd(5)} ${name}${r.anims.length ? `  动作：${r.anims.join(' ')}` : ''}`);
    }
}
console.log(errors.length ? `\n${errors.length} 个错误、${warns.length} 个警告` : `\n通过（${warns.length} 个警告）`);
process.exit(errors.length ? 1 : 0);
