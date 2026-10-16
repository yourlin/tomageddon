// 武器实战转换率：平衡测试里每把武器「实测 DPS ÷ 纸面单体 DPS」，按武器 × 品质（T1–T4）汇总。
//
// 两步：
//   1. 存档：每次平衡测试结束，把这次的样本汇总成 reports/eff-<时间>-<natural|focus>.json（带数值指纹）
//      natural = 普通平衡测试（bot 自己选武器）；focus = 专项补测（batch.mjs --focus，开局强制给指定武器）
//   2. 合并：把所有存档里「指纹与当前代码一致」的样本按时间衰减加权合并，写 reports/weapon-eff.json，
//      开发者界面「分析」页 E1 / E2 读取（经 vite 插件 /__balance-reports/）
//
// 指纹（src/systems/weaponFingerprint.ts）：global 变了（BALANCE / 怪物 / Boss / 章节）→ 这份存档全部作废；
// 某把武器的定义变了 → 只作废这把武器的样本。改了战斗代码请把 FP_SALT 加 1。
//
// 单次测试的样本来自 bot2.js 每波快照（离开商店时记录）：
//   paperT[id] = 下一波要用的每把武器 [品质, 纸面 DPS]（weaponCalc：单体、全部命中、计暴击，不含 DoT / 群伤）
//   dmgBy[id]  = 到本波为止该武器累计的实际伤害（不计溢出，含它施加的 DoT、爆炸、穿透、分裂等）
//   wl.sec     = 那一波的持续秒数
// 第 k 波实测 = 第 k 波与第 k-1 波快照的 dmgBy 差 ÷ 第 k 波秒数；纸面取第 k-1 波快照（商店买完后的构筑）。
// 同一武器在一波里同时持有不同品质时伤害分不开，这一波跳过（计入 mixed）。
//
// 命令行：
//   node scripts/weapon-eff.mjs                         重新合并（以最新存档的指纹为「当前」）
//   node scripts/weapon-eff.mjs --archive <结果文件>     把一份结果文件补存档（结果里没有指纹时加 --adopt，沿用最新存档的指纹）
//   --half-life <天>  时间衰减半衰期（默认 14）；--max-age <天>  超过这个天数的存档不用（默认 60）
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const OUT_DIR = new URL('../reports/', import.meta.url);
/**
 * 怪物密度分档（那一波每秒出怪数）：转换率强烈依赖密度——群伤、穿透、爆炸在怪多时收益翻倍。
 * 不分档的话，样本多来自前几波（如专项补测）的武器会被系统性低估，所以横向比较用「标准化转换率」：
 * 各档转换率按固定参考比例 DENSITY_MIX 加权（大致是普通测试里三档的波次占比）。
 */
export const DENSITY_EDGES = [4.5, 8];
export const DENSITY_NAMES = ['稀', '中', '密'];
export const DENSITY_MIX = [0.3, 0.45, 0.25];
/** 一档样本少于这么多波时，这一档的转换率不报（标准化时用其余档重新归一） */
const MIN_BUCKET = 3;
const densityOf = (spawned, sec) => {
  const d = spawned / sec;
  return d < DENSITY_EDGES[0] ? 0 : d < DENSITY_EDGES[1] ? 1 : 2;
};
const ARCHIVE_RE = /^eff-(\d{8}-\d{6})-(natural|focus)\.json$/;
const DAY = 86400000;

const quantile = (sorted, q) => {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * (i - lo);
};
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const stamp = (t) => {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

// ---------------- 1. 单次测试 → 存档 ----------------

/** 把一次平衡测试的结果汇总成存档对象（不含合并逻辑） */
export function summarizeRun(meta, results, kind = meta.mode === 'focus' ? 'focus' : 'natural') {
  const samples = {};
  let waves = 0;
  let mixed = 0;
  let legacy = 0;
  for (const r of results) {
    const snaps = [...(r.waves ?? []), ...(r.final ? [r.final] : [])];
    for (let i = 1; i < snaps.length; i++) {
      const prev = snaps[i - 1];
      const cur = snaps[i];
      const sec = cur.wl?.sec ?? 0;
      if (cur.wave !== prev.wave + 1 || !(sec > 0) || !prev.dmgBy || !cur.dmgBy) continue;
      if (!prev.paperT) {
        legacy++;
        continue;
      }
      waves++;
      for (const [id, copies] of Object.entries(prev.paperT)) {
        const tier = copies[0][0];
        if (copies.some((c) => c[0] !== tier)) {
          mixed++;
          continue;
        }
        const paper = copies.reduce((s, c) => s + c[1], 0);
        const dmg = (cur.dmgBy[id] ?? 0) - (prev.dmgBy[id] ?? 0);
        // 辅助伤害：它施加的易伤让别的武器多打出的伤害（旧快照没有，计 0）
        const ast = Math.max(0, (cur.assistBy?.[id] ?? 0) - (prev.assistBy?.[id] ?? 0));
        if (!(paper > 0) || dmg < 0) continue;
        // 键带上章节：改了某一章的定义时，只作废在这一章采到的样本（合并时再按 武器@品质 汇总）
        const k = r.ch ? `${id}@${tier}@c${r.ch}` : `${id}@${tier}`;
        const a = (samples[k] ??= {
          n: 0,
          sec: 0,
          copySec: 0,
          paper: 0,
          dmg: 0,
          effs: [],
          runs: [],
          b: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          f: [0, 0, 0],
          nf: [0, 0, 0],
          ast: 0,
          astKnown: 0,
        });
        a.ast += ast;
        if (cur.assistBy) a.astKnown++;
        // 契合 / 非契合：[波数, 纸面伤害, 实测伤害]（旧快照没有契合标记，两边都不计）
        const fav = copies[0][2];
        if (fav !== undefined) {
          const fk = a[fav ? 'f' : 'nf'];
          fk[0]++;
          fk[1] += paper * sec;
          fk[2] += dmg;
        }
        // 按密度分档：[波数, 纸面伤害, 实测伤害]
        const bk = a.b[densityOf(cur.wl.spawned ?? 0, sec)];
        bk[0]++;
        bk[1] += paper * sec;
        bk[2] += dmg;
        a.n++;
        a.sec += sec;
        a.copySec += sec * copies.length;
        a.paper += paper * sec;
        a.dmg += dmg;
        a.effs.push(r3(dmg / (paper * sec)));
        const rk = r.key ?? `${r.charId}-${r.ch}-${r.run}`;
        if (a.runs.at(-1) !== rk) a.runs.push(rk);
      }
    }
  }
  for (const a of Object.values(samples)) {
    a.runs = new Set(a.runs).size;
    a.sec = Math.round(a.sec);
    a.copySec = Math.round(a.copySec);
    a.paper = Math.round(a.paper);
    a.dmg = Math.round(a.dmg);
    a.b = a.b.map(([n, p, d]) => [n, Math.round(p), Math.round(d)]);
    a.f = a.f.map(Math.round);
    a.ast = Math.round(a.ast);
    a.nf = a.nf.map(Math.round);
  }
  return {
    kind,
    version: meta.version ?? '?',
    startedAt: meta.startedAt ?? null,
    finishedAt: meta.finishedAt ?? Date.now(),
    complete: meta.complete ?? true,
    chapters: meta.chapters ?? [],
    fp: meta.fp ?? null,
    games: results.length,
    waves,
    mixed,
    legacy,
    samples,
    // 使用统计只对普通测试有意义（专项补测是强制给的武器）
    usage: kind === 'natural' ? usageOf(results) : null,
  };
}

/** 按武器的使用统计：用过它的局数、通关率差（相对同章节平均）、伤害占比、平均持有波数 */
function usageOf(results) {
  const chWin = new Map();
  for (const r of results) {
    const c = chWin.get(r.ch) ?? { n: 0, w: 0 };
    c.n++;
    c.w += r.win ? 1 : 0;
    chWin.set(r.ch, c);
  }
  const usage = new Map();
  for (const r of results) {
    const snaps = [...(r.waves ?? []), ...(r.final ? [r.final] : [])];
    const held = new Set(snaps.flatMap((s) => Object.keys(s.paperT ?? s.paper ?? {})));
    if (!held.size) continue;
    const dmgBy = (r.final ?? snaps.at(-1))?.dmgBy ?? {};
    const weaponTotal = [...held].reduce((s, id) => s + (dmgBy[id] ?? 0), 0);
    const base = chWin.get(r.ch);
    const baseRate = base.w / base.n;
    for (const id of held) {
      const u = usage.get(id) ?? { games: 0, wins: 0, lift: 0, share: 0, waves: 0 };
      u.games++;
      u.wins += r.win ? 1 : 0;
      u.lift += (r.win ? 1 : 0) - baseRate;
      u.share += weaponTotal > 0 ? (dmgBy[id] ?? 0) / weaponTotal : 0;
      u.waves += snaps.filter((s) => (s.paperT ?? s.paper)?.[id]).length;
      usage.set(id, u);
    }
  }
  const out = {};
  for (const [id, u] of usage)
    out[id] = {
      games: u.games,
      pick: r2(u.games / Math.max(1, results.length)),
      win: r2(u.wins / u.games),
      lift: r2(u.lift / u.games),
      share: r2(u.share / u.games),
      waves: r2(u.waves / u.games),
    };
  return out;
}

/** 写存档，返回文件名 */
export function writeArchive(archive, outDir = OUT_DIR) {
  mkdirSync(outDir, { recursive: true });
  const name = `eff-${stamp(archive.startedAt ?? archive.finishedAt)}-${archive.kind}.json`;
  writeFileSync(new URL(name, outDir), JSON.stringify(archive));
  return name;
}

// ---------------- 2. 合并所有存档 ----------------

export function listArchives(outDir = OUT_DIR) {
  if (!existsSync(outDir)) return [];
  return readdirSync(outDir)
    .filter((f) => ARCHIVE_RE.test(f))
    .sort()
    .map((file) => ({ file, ...JSON.parse(readFileSync(new URL(file, outDir), 'utf8')) }));
}

/**
 * 合并：只用指纹与 fp（当前代码）一致的样本；越旧权重越低（半衰期 halfLife 天），超过 maxAge 天的不用。
 * fp 缺省时用最新一份带指纹的存档。
 */
export function mergeArchives({ fp, halfLife = 14, maxAge = 60, now = Date.now(), outDir = OUT_DIR } = {}) {
  const archives = listArchives(outDir);
  const cur = fp ?? [...archives].reverse().find((a) => a.fp)?.fp ?? null;
  const acc = new Map();
  const sources = [];
  let excludedWeapons = 0;
  let excludedChapters = 0;
  for (const a of archives) {
    const age = (now - (a.finishedAt ?? now)) / DAY;
    const src = { file: a.file, kind: a.kind, version: a.version, finishedAt: a.finishedAt, games: a.games, used: false, reason: '' };
    sources.push(src);
    if (!a.fp || !cur) src.reason = '没有数值指纹';
    else if (a.fp.global !== cur.global) src.reason = '全局数值（BALANCE / 怪物 / Boss）已改动';
    else if (age > maxAge) src.reason = `超过 ${maxAge} 天`;
    if (src.reason) continue;
    src.used = true;
    const w = 0.5 ** (Math.max(0, age) / halfLife);
    for (const [rawK, s] of Object.entries(a.samples)) {
      // 键：武器@品质@c章节（旧存档没有章节段）
      const [id, tier, chPart] = rawK.split('@');
      const ch = chPart?.slice(1);
      if (a.fp.weapons[id] !== cur.weapons[id]) {
        excludedWeapons++;
        continue;
      }
      if (ch && cur.chapters && a.fp.chapters?.[ch] !== cur.chapters[ch]) {
        excludedChapters++;
        continue;
      }
      const k = `${id}@${tier}`;
      const m = acc.get(k) ?? {
        n: 0,
        runs: 0,
        sec: 0,
        copySec: 0,
        paper: 0,
        dmg: 0,
        effs: [],
        natN: 0,
        focusN: 0,
        files: 0,
        newest: 0,
        oldest: Infinity,
        b: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        f: [0, 0, 0],
        nf: [0, 0, 0],
        ast: 0,
        astN: 0,
        astPaper: 0,
      };
      // 辅助伤害只用记录了它的存档（旧存档没有，不能当 0 算进比例）
      if (s.astKnown) {
        m.ast += s.ast * w;
        m.astN += s.astKnown;
        m.astPaper += s.paper * w;
      }
      // 旧存档没有分档 / 契合数据：只计入总数
      (s.b ?? []).forEach(([bn, bp, bd], i) => {
        m.b[i][0] += bn;
        m.b[i][1] += bp * w;
        m.b[i][2] += bd * w;
      });
      for (const key of ['f', 'nf']) {
        const [fn, fp, fd] = s[key] ?? [0, 0, 0];
        m[key][0] += fn;
        m[key][1] += fp * w;
        m[key][2] += fd * w;
      }
      m.n += s.n;
      m.runs += s.runs;
      m.sec += s.sec;
      m.copySec += s.copySec * w;
      m.paper += s.paper * w;
      m.dmg += s.dmg * w;
      for (const e of s.effs) m.effs.push(e);
      m[a.kind === 'focus' ? 'focusN' : 'natN'] += s.n;
      // 同一份存档按章节拆成了多条样本：只算一次测试
      if (m.lastFile !== a.file) {
        m.files++;
        m.lastFile = a.file;
      }
      m.newest = Math.max(m.newest, a.finishedAt ?? 0);
      m.oldest = Math.min(m.oldest, a.finishedAt ?? 0);
      acc.set(k, m);
    }
  }
  const weapons = {};
  for (const [k, m] of acc) {
    const id = k.slice(0, k.lastIndexOf('@'));
    const t = Number(k.slice(k.lastIndexOf('@') + 1));
    const effs = m.effs.sort((x, y) => x - y);
    // 各密度档转换率（样本不足的档为 null）与标准化转换率
    const effB = m.b.map(([bn, bp, bd]) => (bn >= MIN_BUCKET && bp > 0 ? r2(bd / bp) : null));
    const mix = effB.reduce((s, e, i) => s + (e === null ? 0 : DENSITY_MIX[i]), 0);
    const std = mix > 0 ? r2(effB.reduce((s, e, i) => s + (e === null ? 0 : e * DENSITY_MIX[i]), 0) / mix) : null;
    (weapons[id] ??= [null, null, null, null])[t] = {
      n: m.n, // 样本波数
      runs: m.runs, // 来自几局
      sec: Math.round(m.sec),
      paperDps: r2(m.paper / m.copySec), // 每把的平均纸面 DPS（时长 × 时间衰减加权）
      realDps: r2(m.dmg / m.copySec), // 每把的平均实测 DPS
      eff: r2(m.dmg / m.paper), // 转换率 = 实测总伤害 ÷ 纸面总伤害（加权）
      p25: r2(quantile(effs, 0.25)),
      med: r2(quantile(effs, 0.5)),
      p75: r2(quantile(effs, 0.75)),
      natN: m.natN, // 其中普通测试的样本波数
      focusN: m.focusN, // 其中专项补测的样本波数
      files: m.files, // 来自几次测试
      newest: m.newest,
      oldest: m.oldest,
      nB: m.b.map(([bn]) => bn), // 各密度档样本波数
      effB, // 各密度档转换率（稀 / 中 / 密）
      std, // 标准化转换率：各档按 DENSITY_MIX 加权；横向比较武器用这个
      stdFull: effB.every((e) => e !== null), // 三档都有样本（否则标准化值只用了部分档）
      slope: effB[0] && effB[2] ? r2(effB[2] / effB[0]) : null, // 密 ÷ 稀：越大越吃群伤
      // 辅助：它施加的易伤让其它武器多打出的伤害 ÷ 纸面（只算记录了辅助伤害的样本）；含辅助 = 转换率 + 辅助
      assist: m.astN >= MIN_BUCKET && m.astPaper > 0 ? r2(m.ast / m.astPaper) : null,
      nFav: m.f[0], // 契合角色手上的样本波数
      nNoFav: m.nf[0],
      effFav: m.f[0] >= MIN_BUCKET && m.f[1] > 0 ? r2(m.f[2] / m.f[1]) : null, // 契合时的转换率
      effNoFav: m.nf[0] >= MIN_BUCKET && m.nf[1] > 0 ? r2(m.nf[2] / m.nf[1]) : null, // 不契合时的转换率
    };
  }
  // 使用统计：取最新一份可用的普通测试（不同测试之间 bot 的选择环境不同，不混合）
  const latestNatural = [...archives].reverse().find((a) => a.kind === 'natural' && sources.find((s) => s.file === a.file)?.used);
  const used = sources.filter((s) => s.used);
  return {
    fp: cur,
    version: used.at(-1)?.version ?? archives.at(-1)?.version ?? '?',
    finishedAt: used.at(-1)?.finishedAt ?? null,
    complete: true,
    chapters: [...new Set(archives.filter((a) => sources.find((s) => s.file === a.file)?.used).flatMap((a) => a.chapters))].sort(),
    games: used.reduce((s, x) => s + x.games, 0),
    halfLife,
    maxAge,
    density: { edges: DENSITY_EDGES, names: DENSITY_NAMES, mix: DENSITY_MIX },
    excludedWeapons,
    excludedChapters,
    sources,
    weapons,
    usage: latestNatural?.usage ?? null,
    usageFrom: latestNatural ? { file: latestNatural.file, games: latestNatural.games, finishedAt: latestNatural.finishedAt } : null,
  };
}

/** 合并并写 reports/weapon-eff.json */
export function writeMerged(opts = {}) {
  const outDir = opts.outDir ?? OUT_DIR;
  const merged = mergeArchives(opts);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(new URL('weapon-eff.json', outDir), JSON.stringify(merged));
  return merged;
}

/** 平衡测试结束时调用：存档本次结果，再重新合并 */
export function archiveAndMerge(meta, results, opts = {}) {
  const archive = summarizeRun(meta, results);
  const file = writeArchive(archive, opts.outDir);
  const merged = writeMerged({ ...opts, fp: meta.fp ?? undefined });
  return { file, archive, merged };
}

export function describeMerged(m) {
  const combos = Object.values(m.weapons).flat().filter(Boolean).length;
  const used = m.sources.filter((s) => s.used).length;
  return `weapon-eff.json：${Object.keys(m.weapons).length} 把武器、${combos} 个武器×品质有样本；合并了 ${used}/${m.sources.length} 次测试（${m.games} 局）${
    m.excludedWeapons ? `，${m.excludedWeapons} 份武器样本因数值改动被排除` : ''
  }${m.excludedChapters ? `，${m.excludedChapters} 份样本因所在章节改动被排除` : ''}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const flag = (k) => {
    const i = process.argv.indexOf(`--${k}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const opts = { halfLife: Number(flag('half-life') ?? 14), maxAge: Number(flag('max-age') ?? 60) };
  const src = flag('archive');
  if (src) {
    if (!existsSync(src)) {
      console.error(`找不到结果文件：${src}`);
      process.exit(1);
    }
    const data = JSON.parse(readFileSync(src, 'utf8'));
    const meta = { ...data.meta, complete: data.results.length >= (data.meta.total ?? 0) };
    if (!meta.fp && process.argv.includes('--adopt')) {
      meta.fp = [...listArchives()].reverse().find((a) => a.fp)?.fp ?? null;
      if (!meta.fp) {
        console.error('--adopt：还没有带指纹的存档可沿用');
        process.exit(1);
      }
      console.log('结果里没有指纹，沿用最新存档的指纹（仅在这份结果之后没改过数值时才正确）');
    }
    const a = summarizeRun(meta, data.results);
    console.log(`存档：${writeArchive(a)}（${a.games} 局，${a.waves} 个波次样本${a.legacy ? `，${a.legacy} 个旧格式波次无法使用` : ''}）`);
  }
  console.log(describeMerged(writeMerged(opts)));
}
