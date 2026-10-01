// 平衡测试报告生成（HTML + Markdown）
// 单独使用：node scripts/report.mjs [结果文件]   默认读取 scripts/.batch-progress.json 或 scripts/.batch-results.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DOCS = new URL('../docs/', import.meta.url);
const MAX_WAVE = 15;
const TALENT_NAME = { none: '不点（基准）', mid: '中期 40 点', full: '全部 79 点' };

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const avg = (l, k) => (l.length ? l.reduce((a, r) => a + (r[k] ?? 0), 0) / l.length : 0);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const stamp = (d) => d.toLocaleString('zh-CN', { hour12: false });
const p2 = (n) => String(n).padStart(2, '0');
const fileStamp = (d) =>
  `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
const dur = (ms) => {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)} 分 ${s % 60} 秒` : `${s} 秒`;
};

/** 分位数（最近秩） */
function quant(list, q) {
  if (!list.length) return NaN;
  const a = [...list].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.max(0, Math.ceil(q * a.length) - 1))];
}
const fmt = (v) => (Number.isNaN(v) ? '–' : Math.abs(v) >= 100 ? Math.round(v).toString() : (+v.toFixed(1)).toString());
const CHECKPOINTS = [1, 5, 10, 14];
/** 构筑指标：[标题, 取值函数] */
const METRICS = [
  ['累计收入', (w) => w.earned],
  ['持有番茄籽', (w) => w.seeds],
  ['购物花费', (w) => w.spent],
  ['刷新花费', (w) => w.reroll],
  ['刷新次数', (w) => w.rerolls],
  ['等级', (w) => w.lvl],
  ['道具数', (w) => w.items],
  ['稀有+道具', (w) => w.itemRarity[1] + w.itemRarity[2] + w.itemRarity[3]],
  ['史诗+道具', (w) => w.itemRarity[2] + w.itemRarity[3]],
  ['传说道具', (w) => w.itemRarity[3]],
  ['武器数', (w) => w.weapons],
  ['T3+ 武器', (w) => w.wTier[2] + w.wTier[3]],
  ['T4 武器', (w) => w.wTier[3]],
  ['最高打造', (w) => w.forge],
  ['最大生命', (w) => w.stats.maxHp],
  ['全伤害%', (w) => w.stats.damage],
  ['近战%', (w) => w.stats.meleePct],
  ['远程%', (w) => w.stats.rangedPct],
  ['元素%', (w) => w.stats.elementalPct],
  ['攻速%', (w) => w.stats.attackSpeed],
  ['暴击%', (w) => w.stats.crit],
  ['护甲', (w) => w.stats.armor],
  ['闪避%', (w) => w.stats.dodge],
  ['幸运', (w) => w.stats.luck],
  ['收获', (w) => w.stats.harvest],
  ['拾取距离', (w) => w.stats.pickup],
];
/** 第 W 波离店时的快照 */
const snapAt = (r, W) => r.waves?.find((w) => w.wave === W);
/** T4 目标：第 15 波时持有 ≥1 / ≥2 / ≥3 把 T4 的比例 */
const T4_TARGET = [50, 30, 10];

function econTable(runs) {
  const head = CHECKPOINTS.map((W) => `<th class="num" colspan="3">第 ${W} 波后<br><small>P50 · P90 · 范围</small></th>`).join('');
  const rows = METRICS.map(([name, f]) => {
    const cells = CHECKPOINTS.map((W) => {
      const v = runs
        .map((r) => snapAt(r, W))
        .filter(Boolean)
        .map(f)
        .filter((x) => typeof x === 'number');
      return v.length
        ? `<td class="num">${fmt(quant(v, 0.5))}</td><td class="num">${fmt(quant(v, 0.9))}</td><td class="num muted">${fmt(Math.min(...v))}–${fmt(Math.max(...v))}</td>`
        : '<td class="num muted" colspan="3">–</td>';
    }).join('');
    return `<tr><td>${esc(name)}</td>${cells}</tr>`;
  }).join('');
  return `<table class="econ"><thead><tr><th>指标</th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

/** 到达第 15 波（第 14 波离店）的对局中，T4 武器数分布 */
function t4Dist(runs) {
  const v = runs
    .map((r) => snapAt(r, 14))
    .filter(Boolean)
    .map((w) => w.wTier[3]);
  const at = (k) => pct(v.filter((x) => x >= k).length, v.length);
  return { n: v.length, ge: [at(1), at(2), at(3)] };
}

function t4Html(runs) {
  const d = t4Dist(runs);
  if (!d.n) return '<p class="muted">没有对局到达第 15 波</p>';
  const cell = (k) => {
    const diff = d.ge[k] - T4_TARGET[k];
    const cls = Math.abs(diff) <= 8 ? 'good' : Math.abs(diff) <= 15 ? 'warn' : 'bad';
    return `<td class="num"><b>${d.ge[k]}%</b> <span class="badge ${cls}">目标 ${T4_TARGET[k]}%</span></td>`;
  };
  return `<table class="t4"><thead><tr><th>到达第 15 波的对局</th><th class="num">≥1 把 T4</th><th class="num">≥2 把 T4</th><th class="num">≥3 把 T4</th></tr></thead>
    <tbody><tr><td>${d.n} 局</td>${cell(0)}${cell(1)}${cell(2)}</tr></tbody></table>`;
}

/** 按章节、角色聚合 */
function summarize(results, chapters, names) {
  return chapters.map((ch) => {
    const rs = results.filter((r) => r.ch === ch);
    const by = {};
    for (const r of rs) (by[r.charId] ??= []).push(r);
    const rows = Object.entries(by).map(([id, l]) => ({
      id,
      name: names[id] ?? id,
      n: l.length,
      win: l.filter((r) => r.win).length,
      wave: avg(l, 'wave'),
      kills: avg(l, 'kills'),
      items: avg(l, 'items'),
      sec: avg(l, 'sec'),
      timeouts: l.filter((r) => r.timeout).length,
      dmg: l[0].topDmg ?? '',
    }));
    rows.sort((a, b) => b.win / b.n - a.win / a.n || b.wave - a.wave);
    return { ch, n: rs.length, win: rs.filter((r) => r.win).length, wave: avg(rs, 'wave'), rows, runs: rs };
  });
}

export function renderMarkdown(meta, results) {
  const S = summarize(results, meta.chapters, meta.names);
  const lines = [
    '# 平衡测试报告（自动生成）',
    '',
    `> ${stamp(new Date(meta.finishedAt))}${meta.version ? ` · v${meta.version}` : ''} · 每角色每章 ${meta.runs} 局 · 天赋 ${TALENT_NAME[meta.talents ?? 'none'] ?? meta.talents} · ${meta.speed === 'max' ? '极速' : meta.speed + ' 倍速'} · ${meta.complete ? '完整' : `**未完成 ${results.length}/${meta.total}**`} · 机器人：按流派评估购买/升级，采样躲避`,
    '',
  ];
  for (const c of S) {
    if (!c.n) continue;
    lines.push(`## 第 ${c.ch} 章：通关率 ${pct(c.win, c.n)}%（${c.win}/${c.n}），平均到达波次 ${c.wave.toFixed(1)}`, '');
    const d = t4Dist(c.runs);
    if (d.n)
      lines.push(
        `T4 武器（到达第 15 波的 ${d.n} 局）：≥1 把 ${d.ge[0]}% · ≥2 把 ${d.ge[1]}% · ≥3 把 ${d.ge[2]}%（目标 ${T4_TARGET.join(' / ')}%）`,
        '',
      );
    lines.push('| 角色 | 通关 | 平均波次 | 平均击杀 | 平均道具 | 主要受伤来源 |', '| --- | --- | --- | --- | --- | --- |');
    for (const r of c.rows)
      lines.push(`| ${r.name} | ${r.win}/${r.n} | ${r.wave.toFixed(1)} | ${Math.round(r.kills)} | ${r.items.toFixed(0)} | ${r.dmg} |`);
    lines.push('');
  }
  return lines.join('\n');
}

export function renderHtml(meta, results) {
  const S = summarize(results, meta.chapters, meta.names);
  const done = results.length,
    total = meta.total;
  const statusBadge = meta.complete
    ? '<span class="badge good">✓ 完整</span>'
    : `<span class="badge warn">⚠ 未完成 ${done}/${total}（可续跑）</span>`;
  const bar = (v, max, label, tip) =>
    `<div class="bar" title="${esc(tip)}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100)).toFixed(1)}%"></i><span>${label}</span></div>`;
  const tiles = S.filter((c) => c.n)
    .map(
      (c) => `
    <div class="tile"><div class="k">第 ${c.ch} 章通关率</div><div class="v">${pct(c.win, c.n)}%</div>
    <div class="s">${c.win}/${c.n} 局 · 平均到达第 ${c.wave.toFixed(1)} 波</div></div>`,
    )
    .join('');
  const chapters = S.filter((c) => c.n)
    .map(
      (c) => `
  <section>
    <h2>第 ${c.ch} 章 <small>${c.n} 局 · 通关 ${c.win}</small></h2>
    <h3>T4 武器分布</h3>${t4Html(c.runs)}
    <details class="eco"><summary>经济与构筑（P50 · P90 · 范围）</summary>${econTable(c.runs)}</details>
    <h3>各角色</h3>
    <table>
      <thead><tr><th>角色</th><th class="w">通关率</th><th class="w">平均波次</th><th class="num">平均击杀</th><th class="num">平均道具</th><th class="num">平均用时</th><th>主要受伤来源（首局）</th></tr></thead>
      <tbody>${c.rows
        .map(
          (r) => `
        <tr><td>${esc(r.name)}${r.timeouts ? ` <span class="badge warn" title="超时局数">⏱ ${r.timeouts}</span>` : ''}</td>
        <td>${bar(r.win, r.n, `${pct(r.win, r.n)}% <em>${r.win}/${r.n}</em>`, `${r.name}：通关 ${r.win}/${r.n}`)}</td>
        <td>${bar(r.wave, MAX_WAVE, r.wave.toFixed(1), `${r.name}：平均到达第 ${r.wave.toFixed(1)} 波（共 ${MAX_WAVE} 波）`)}</td>
        <td class="num">${Math.round(r.kills)}</td><td class="num">${r.items.toFixed(0)}</td><td class="num">${r.sec.toFixed(0)}s</td>
        <td class="muted">${esc(r.dmg)}</td></tr>`,
        )
        .join('')}
      </tbody>
    </table>
  </section>`,
    )
    .join('');
  const detail = results
    .map(
      (r) => `
    <tr><td>${r.ch}</td><td>${esc(meta.names[r.charId] ?? r.charId)}</td><td class="num">${r.run + 1}</td>
    <td>${r.timeout ? '<span class="badge warn">⏱ 超时</span>' : r.win ? '<span class="badge good">✓ 通关</span>' : '<span class="badge bad">✗ 阵亡</span>'}</td>
    <td class="num">${r.wave ?? ''}</td><td class="num">${r.level ?? ''}</td><td class="num">${r.kills ?? ''}</td><td class="num">${r.items ?? ''}</td><td class="num">${r.sec ?? ''}s</td>
    <td class="muted">${esc(r.weapons)}</td><td class="muted">${esc(r.topDmg)}</td></tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>平衡测试报告 ${esc(stamp(new Date(meta.finishedAt)))}</title>
<style>
.viz-root{color-scheme:light;--surface:#fcfcfb;--panel:#ffffff;--line:#e4e3df;--text:#0b0b0b;--text2:#52514e;--muted:#7a7974;--series:#2a78d6;--track:#eeede9;--good:#0ca30c;--warn:#b77900;--bad:#d03b3b}
@media (prefers-color-scheme:dark){.viz-root{color-scheme:dark;--surface:#1a1a19;--panel:#222220;--line:#383835;--text:#ffffff;--text2:#c3c2b7;--muted:#9a998f;--series:#3987e5;--track:#2e2e2b;--good:#0ca30c;--warn:#fab219;--bad:#e66767}}
*{box-sizing:border-box}body{margin:0}
.viz-root{background:var(--surface);color:var(--text);font:14px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;padding:28px;min-height:100vh}
h1{margin:0 0 6px;font-size:24px}h2{font-size:18px;margin:28px 0 10px}h2 small{color:var(--muted);font-weight:normal;font-size:13px;margin-left:8px}
.meta{color:var(--text2);display:flex;flex-wrap:wrap;gap:6px 18px;margin-bottom:18px}
.tiles{display:flex;flex-wrap:wrap;gap:12px}
.tile{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 18px;min-width:180px}
.tile .k{color:var(--text2);font-size:13px}.tile .v{font-size:32px;font-weight:700;line-height:1.2}.tile .s{color:var(--muted);font-size:12px}
table{border-collapse:collapse;width:100%;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
th,td{padding:7px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
th{color:var(--text2);font-weight:600;font-size:13px;white-space:nowrap}tbody tr:hover{background:var(--track)}
.num{text-align:right;font-variant-numeric:tabular-nums}.muted{color:var(--muted);font-size:12px}.w{width:22%}
.bar{position:relative;height:20px;background:var(--track);border-radius:4px;overflow:hidden}
.bar i{position:absolute;inset:0 auto 0 0;background:var(--series);border-radius:0 4px 4px 0;opacity:.85}
.bar span{position:relative;padding-left:8px;font-size:12px;font-weight:600;line-height:20px;color:var(--text);text-shadow:0 0 3px var(--surface)}
.bar em{font-style:normal;font-weight:normal;color:var(--text2)}
.badge{display:inline-block;padding:0 8px;border-radius:10px;font-size:12px;border:1px solid currentColor;white-space:nowrap}
.good{color:var(--good)}.warn{color:var(--warn)}.bad{color:var(--bad)}
h3{font-size:15px;margin:16px 0 8px;color:var(--text2)}.econ td,.econ th{padding:4px 8px;font-size:12px}.t4{width:auto}.eco{margin:12px 0}
details{margin-top:28px}summary{cursor:pointer;font-weight:600;font-size:16px}
</style></head>
<body><div class="viz-root">
  <h1>平衡测试报告 ${statusBadge}</h1>
  <div class="meta">
    ${meta.version ? `<span>游戏版本：v${esc(meta.version)}</span>` : ''}
    <span>生成时间：${esc(stamp(new Date(meta.finishedAt)))}</span>
    <span>章节：${meta.chapters.join(' / ')}</span>
    <span>每角色每章 ${meta.runs} 局</span>
    <span>天赋预设：${TALENT_NAME[meta.talents ?? 'none'] ?? meta.talents}</span><span>${meta.speed === 'max' ? '极速' : meta.speed + ' 倍速'} · 最多 ${meta.workers} 并行</span>
    <span>完成 ${done}/${total} 局</span><span>累计用时 ${dur(meta.elapsedMs)}</span>
    ${meta.resumed ? `<span>续跑 ${meta.resumed} 次</span>` : ''}
  </div>
  <div class="tiles">${tiles || '<div class="tile"><div class="k">暂无结果</div></div>'}</div>
  <section><h2>全部章节 · T4 武器分布</h2>${t4Html(results)}
  <details class="eco" open><summary>全部章节 · 经济与构筑（P50 · P90 · 范围）</summary>${econTable(results)}</details></section>
  ${chapters}
  <details><summary>逐局明细（${done} 局）</summary>
    <table><thead><tr><th>章</th><th>角色</th><th class="num">局</th><th>结果</th><th class="num">波次</th><th class="num">等级</th><th class="num">击杀</th><th class="num">道具</th><th class="num">用时</th><th>武器</th><th>主要受伤来源</th></tr></thead>
    <tbody>${detail}</tbody></table>
  </details>
</div></body></html>`;
}

/** 写出报告：docs/reports/balance-<时间>.html（存档）+ docs/BALANCE_REPORT.html/.md（最新） */
export function writeReports(meta, results) {
  const reports = new URL('reports/', DOCS);
  mkdirSync(reports, { recursive: true });
  const html = renderHtml(meta, results);
  const file = new URL(`balance-${fileStamp(new Date(meta.startedAt))}${meta.complete ? '' : '-partial'}.html`, reports);
  writeFileSync(file, html);
  writeFileSync(new URL('BALANCE_REPORT.html', DOCS), html);
  writeFileSync(new URL('BALANCE_REPORT.md', DOCS), renderMarkdown(meta, results));
  return fileURLToPath(file);
}

// 直接运行：从进度文件或结果文件重新生成报告
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const src =
    process.argv[2] ??
    ['./.batch-progress.json', './.batch-results.json'].map((p) => fileURLToPath(new URL(p, import.meta.url))).find(existsSync);
  if (!src) {
    console.error('找不到结果文件');
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(src, 'utf8'));
  // 兼容旧格式（纯数组）
  const results = Array.isArray(data) ? data.map((r, i) => ({ run: 0, ...r, i })) : data.results;
  const meta = Array.isArray(data)
    ? {
        chapters: [...new Set(results.map((r) => r.ch))],
        runs: 1,
        speed: '?',
        workers: '?',
        total: results.length,
        complete: true,
        elapsedMs: 0,
        names: {},
        startedAt: Date.now(),
        finishedAt: Date.now(),
      }
    : { ...data.meta, finishedAt: data.meta.finishedAt ?? Date.now(), complete: data.results.length >= data.meta.total };
  console.log('报告：' + writeReports(meta, results));
}
