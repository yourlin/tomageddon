// 平衡测试报告生成（HTML + Markdown）
// 单独使用：node scripts/report.mjs [结果文件] [--checks 检测项.json] [--advice 结论.html]   默认读取 scripts/.batch-progress.json 或 scripts/.batch-results.json
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { chart, chapterFilter, CHART_CSS, CHART_JS } from './report-charts.mjs';
import { fileURLToPath } from 'node:url';

const OUT = new URL('../reports/', import.meta.url);
/** 每章波数：第 1-4 章 15 波，第 5 章 20 波，之后每章 +5，最多 50（与 src/data/balance.ts 的 chapterWaves 保持一致） */
// 与 src/data/balance.ts 的 chapterWaves 一致（第 7 章覆盖为 25 波）
const chapterWaves = (ch) => (ch <= 4 ? 15 : ch === 7 ? 25 : Math.min(50, 20 + (ch - 5) * 5));
const TALENT_NAME = { none: '不点', mid: '中期 40 点', full: '全部 79 点', '20%': '20%（约 16 点，基准）' };

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
  ['累计花费', (w) => w.spentAll ?? w.spent + (w.reroll ?? 0)],
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
  ['超武', (w) => w.supers ?? w.evolved ?? 0],
  ['仓库武器', (w) => w.stored ?? 0],
  ['合成次数', (w) => w.crafts ?? 0],
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
/** T4 目标：本章最后一波时持有 ≥1 / ≥2 / ≥3 把 T4 的比例 */
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

/** 到达本章最后一波（倒数第二波离店）的对局中，T4 武器数分布 */
function t4Dist(runs) {
  const v = runs
    .map((r) => snapAt(r, chapterWaves(r.ch) - 1))
    .filter(Boolean)
    .map((w) => w.wTier[3]);
  const at = (k) => pct(v.filter((x) => x >= k).length, v.length);
  return { n: v.length, ge: [at(1), at(2), at(3)] };
}

function t4Html(runs) {
  const d = t4Dist(runs);
  if (!d.n) return '<p class="muted">没有对局到达最后一波</p>';
  const cell = (k) => {
    const diff = d.ge[k] - T4_TARGET[k];
    const cls = Math.abs(diff) <= 8 ? 'good' : Math.abs(diff) <= 15 ? 'warn' : 'bad';
    return `<td class="num"><b>${d.ge[k]}%</b> <span class="badge ${cls}">目标 ${T4_TARGET[k]}%</span></td>`;
  };
  return `<table class="t4"><thead><tr><th>到达最后一波的对局</th><th class="num">≥1 把 T4</th><th class="num">≥2 把 T4</th><th class="num">≥3 把 T4</th></tr></thead>
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

/** 检测项配置（scripts/balance-checks.json，可用 --checks 换一份） */
export const DEFAULT_CHECKS = fileURLToPath(new URL('./balance-checks.json', import.meta.url));
export function loadChecks(file = DEFAULT_CHECKS) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).checks.filter((c) => c.enabled !== false) : [];
}

/** v 相对 [lo, hi] 的偏离量（0 = 在范围内） */
const outOf = (v, [lo, hi]) =>
  lo !== null && lo !== undefined && v < lo ? v - lo : hi !== null && hi !== undefined && v > hi ? v - hi : 0;
const fmtRange = ([lo, hi], unit = '') =>
  lo !== null && lo !== undefined && hi !== null && hi !== undefined
    ? `${lo} ~ ${hi}${unit}`
    : lo !== null && lo !== undefined
      ? `≥ ${lo}${unit}`
      : `≤ ${hi}${unit}`;
const pickAdvice = (a, off) => (typeof a === 'string' ? a : off < 0 ? a?.low : a?.high) ?? '';
const median = (l) => quant(l, 0.5);

/**
 * 逐项检测：返回 [{ name, scope, value, target, lv: 'ok' | 'warn' | 'bad', advice }]
 * lv：在范围内为 ok；偏离不超过 warn 为 warn；超过为 bad
 */
export function runChecks(checks, S, results, meta) {
  const out = [];
  const live = S.filter((c) => c.n);
  const rate = (c) => pct(c.win, c.n);
  const lost = (rs) => rs.filter((r) => !r.win && !r.timeout);
  const add = (c, scope, v, range, unit = c.unit ?? '') => {
    const off = outOf(v, range);
    out.push({
      name: c.name,
      scope,
      value: `${fmt(v)}${unit}`,
      target: fmtRange(range, unit),
      lv: off === 0 ? 'ok' : Math.abs(off) <= (c.warn ?? 0) ? 'warn' : 'bad',
      advice: off === 0 ? '' : pickAdvice(c.advice, off),
    });
  };
  const endless = !!meta.endless;
  for (const c of checks) {
    // 每项可用 "endless": false / "chapter": false 限定只在章节模式 / 无尽模式下判定
    if ((endless && c.endless === false) || (!endless && c.chapter === false)) continue;
    switch (c.id) {
      case 'chapterWinRate':
        if (endless) break;
        for (const ch of live) if (c.targets?.[ch.ch]) add(c, `第 ${ch.ch} 章`, rate(ch), c.targets[ch.ch]);
        break;
      case 'difficultyMonotonic':
        if (endless) break;
        for (let i = 1; i < live.length; i++) {
          const up = rate(live[i]) - rate(live[i - 1]);
          out.push({
            name: c.name,
            scope: `第 ${live[i - 1].ch} → ${live[i].ch} 章`,
            value: `${up >= 0 ? '+' : ''}${up} 百分点`,
            target: `≤ +${c.tolerance ?? 0}`,
            lv: up <= (c.tolerance ?? 0) ? 'ok' : 'warn',
            advice: up <= (c.tolerance ?? 0) ? '' : c.advice,
          });
        }
        break;
      case 'deathCliff':
      case 'bossWaveDeaths':
        for (const ch of live) {
          const d = lost(ch.runs);
          if (d.length < (c.minDeaths ?? 1)) continue;
          if (c.id === 'deathCliff') {
            const by = {};
            for (const r of d) by[r.wave] = (by[r.wave] ?? 0) + 1;
            const [w, n] = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
            add(c, `第 ${ch.ch} 章（第 ${w} 波）`, pct(n, d.length), c.range);
          } else {
            const W = chapterWaves(ch.ch);
            const boss = d.filter((r) => (endless ? r.wave % 15 === 0 : r.wave === W)).length;
            add(c, `第 ${ch.ch} 章`, pct(boss, d.length), c.range);
          }
        }
        break;
      case 'topKiller':
        for (const ch of live) {
          const agg = {};
          for (const r of lost(ch.runs))
            // 只统计具体敌人（去掉地形 / 弹幕 / 持续伤害 / 狂暴威压等非敌人来源）
            for (const [k, v] of parseDmg(r.topDmg)) if (!/^(dot|bullet|enrage|hazard|other)/.test(k)) agg[k] = (agg[k] ?? 0) + v;
          const tot = Object.values(agg).reduce((a, b) => a + b, 0);
          if (!tot) continue;
          const [k, v] = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
          add(c, `第 ${ch.ch} 章 · ${k}`, pct(v, tot), c.range);
        }
        break;
      case 'charSpread': {
        if (endless) break;
        const chs = live.filter((ch) => !c.chapters || c.chapters.includes(ch.ch));
        // 每个角色在这些章节里至少 minRuns 局才判定（样本太少时通关率只有 0 / 100%，没有意义）
        const diff = {},
          n = {};
        for (const ch of chs)
          for (const r of ch.rows) {
            (diff[r.id] ??= []).push(pct(r.win, r.n) - rate(ch));
            n[r.id] = (n[r.id] ?? 0) + r.n;
          }
        const ids = Object.keys(diff).filter((id) => n[id] >= (c.minRuns ?? 4));
        if (!ids.length) {
          out.push({
            name: c.name,
            scope: '样本不足',
            value: '–',
            target: `每角色 ≥ ${c.minRuns ?? 4} 局`,
            lv: 'ok',
            advice: '用 --runs 2 以上再看',
          });
          break;
        }
        const avgOf = (id) => Math.round(diff[id].reduce((a, b) => a + b, 0) / diff[id].length);
        const [lo, hi] = c.range;
        for (const [side, pick, sign] of [
          ['偏弱', (v) => v < lo, -1],
          ['偏强', (v) => v > hi, 1],
        ]) {
          const l = ids
            .map((id) => [id, avgOf(id)])
            .filter(([, v]) => pick(v))
            .sort((a, b) => sign * (b[1] - a[1]));
          const off = l.length ? outOf(l[0][1], c.range) : 0;
          out.push({
            name: c.name,
            scope: side,
            value: l.length ? l.map(([id, v]) => `${meta.names?.[id] ?? id} ${v > 0 ? '+' : ''}${v}`).join('、') : '无',
            target: fmtRange(c.range, c.unit),
            lv: !l.length ? 'ok' : Math.abs(off) <= (c.warn ?? 0) ? 'warn' : 'bad',
            advice: l.length ? pickAdvice(c.advice, sign) : '',
          });
        }
        break;
      }
      case 'wave1Drop': {
        if (endless) break;
        const chs = c.chapters ?? [1];
        const v = results
          .filter((r) => chs.includes(r.ch))
          .map((r) => (r.waves?.[0] && r.perSeed ? r.waves[0].kills * r.perSeed : NaN))
          .filter((x) => !Number.isNaN(x));
        if (v.length) add(c, `第 ${chs.join('、')} 章`, median(v), c.range);
        break;
      }
      case 'bankRatio': {
        const v = results
          .map((r) => r.waves?.[r.waves.length - 1])
          .filter((w) => w && w.earned > 0)
          .map((w) => (w.seeds / w.earned) * 100);
        if (v.length) add(c, '中位数', median(v), c.range);
        break;
      }
      case 't4AtEnd': {
        if (endless) break;
        const d = t4Dist(results);
        if (d.n) add(c, `${d.n} 局`, d.ge[0], c.range);
        break;
      }
      case 'statCaps': {
        const v = results.map((r) => r.waves?.[r.waves.length - 1]?.stats).filter(Boolean);
        if (v.length)
          add(c, `${v.length} 局`, pct(v.filter((s) => (s.armor ?? 0) >= 45 || (s.dodge ?? 0) >= 60).length, v.length), c.range);
        break;
      }
      case 't4Wave':
      case 't4Rate':
      case 'superRate':
      case 'craftCount': {
        if (endless) break;
        const rs = results.filter((r) => r.waves?.length);
        if (!rs.length) break;
        if (c.id === 't4Wave') {
          const v = rs.map(T4_AT).filter((x) => x !== null);
          if (v.length) add(c, `${v.length} 局拿到 T4`, median(v), c.range);
        } else if (c.id === 't4Rate') add(c, `${rs.length} 局`, pct(rs.filter((r) => T4_AT(r) !== null).length, rs.length), c.range);
        else if (c.id === 'superRate') add(c, `${rs.length} 局`, pct(rs.filter((r) => SUPER_AT(r) !== null).length, rs.length), c.range);
        else add(c, `${rs.length} 局`, median(rs.map((r) => r.waves[r.waves.length - 1].crafts ?? 0)), c.range);
        break;
      }
      case 'timeouts':
        add(c, `${results.length} 局`, results.filter((r) => r.timeout).length, c.range);
        break;
      case 'endlessReach':
      case 'endlessMedian': {
        if (!endless) break;
        const w = results.map((r) => r.wave ?? 0);
        if (w.length) add(c, `${w.length} 局`, c.id === 'endlessReach' ? Math.max(...w) : median(w), c.range);
        break;
      }
    }
  }
  return out;
}

/** 首次满足条件的波次（没达到时返回 null） */
const firstWave = (r, f) => r.waves?.find((w) => f(w))?.wave ?? null;
const T3_AT = (r) => firstWave(r, (w) => w.wTier[2] + w.wTier[3] >= 1);
const T4_AT = (r) => firstWave(r, (w) => w.wTier[3] >= 1);
const SUPER_AT = (r) => firstWave(r, (w) => (w.supers ?? w.evolved ?? 0) >= 1);

/** 每个角色平均在第几波拿到 T3 / T4 / 超武，以及累计收入与花费 */
function craftProgressHtml(results, names) {
  const by = {};
  for (const r of results) (by[r.charId] ??= []).push(r);
  const rows = Object.entries(by)
    .map(([id, l]) => {
      const pick = (f) => {
        const v = l.map(f).filter((x) => x !== null);
        return { avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null, pct: pct(v.length, l.length) };
      };
      const last = l.map((r) => r.waves?.[r.waves.length - 1]).filter(Boolean);
      return {
        id,
        name: names[id] ?? id,
        n: l.length,
        win: pct(l.filter((r) => r.win).length, l.length),
        t3: pick(T3_AT),
        t4: pick(T4_AT),
        sup: pick(SUPER_AT),
        earned: last.length ? median(last.map((w) => w.earned)) : 0,
        spent: last.length ? median(last.map((w) => w.spentAll ?? w.spent + (w.reroll ?? 0))) : 0,
        crafts: last.length ? median(last.map((w) => w.crafts ?? 0)) : 0,
      };
    })
    .sort((a, b) => (a.t4.avg ?? 99) - (b.t4.avg ?? 99) || b.win - a.win);
  const cell = (x) =>
    x.avg === null ? '<td class="num muted">–</td>' : `<td class="num">${fmt(x.avg)}<small class="muted"> ${x.pct}%</small></td>`;
  return `<p class="lede">「第几波」是平均首次拿到的波次，后面的百分比是有多少局拿到过。累计收入 / 花费取每局最后一次离店时的中位数。</p>
  <div class="scroll"><table class="list"><thead><tr><th>角色</th><th class="num">通关率</th><th class="num">T3</th><th class="num">T4</th><th class="num">超武</th><th class="num">合成次数</th><th class="num">累计收入</th><th class="num">累计花费</th></tr></thead>
  <tbody>${rows
    .map(
      (r) =>
        `<tr><th scope="row">${esc(r.name)}</th><td class="num">${r.win}%</td>${cell(r.t3)}${cell(r.t4)}${cell(r.sup)}<td class="num">${fmt(r.crafts)}</td><td class="num">${fmt(r.earned)}</td><td class="num">${fmt(r.spent)}</td></tr>`,
    )
    .join('')}</tbody></table></div>`;
}

/** 按波次收集每局的本波统计（RunState.waveLog）：{ ...wl, inc }，inc = 本波各来源番茄籽收入。
 *  最后一波（阵亡或通关）没有离店快照，用结算时的快照补上；旧结果没有 wl */
function waveLogs(results) {
  const byWave = {};
  const add = (w) => w.wl && (byWave[w.wave] ??= []).push({ ...w.wl, inc: w.inc ?? {} });
  for (const r of results) {
    const ws = r.waves ?? [];
    ws.forEach(add);
    if (r.final && !ws.some((w) => w.wave === r.final.wave)) add(r.final);
  }
  return byWave;
}

/** 每波统计行（出怪 / 击杀、承伤与各来源实际回血；全部对局的中位数）；少于 5 局的波次不出 */
function sustainRows(results) {
  const byWave = waveLogs(results);
  const waves = Object.keys(byWave)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((w) => byWave[w].length >= 5);
  const h = (l, ...ks) => median(l.map((x) => ks.reduce((a, k) => a + (x.heal[k] ?? 0), 0)));
  return waves.map((w) => {
    const l = byWave[w];
    const heal = median(l.map((x) => Object.values(x.heal).reduce((a, b) => a + b, 0)));
    const taken = median(l.map((x) => x.taken));
    return {
      w,
      n: l.length,
      spawned: median(l.map((x) => x.spawned)),
      killed: median(l.map((x) => x.killed)),
      killPct: median(l.map((x) => (x.spawned ? (x.killed / x.spawned) * 100 : 0))),
      taken,
      ls: h(l, 'lifesteal'),
      regen: h(l, 'regen'),
      item: h(l, 'fruit', 'kill'),
      other: h(l, 'skill', 'talent', 'other'),
      over: median(l.map((x) => x.over)),
      lsOver: median(l.map((x) => x.overBy?.lifesteal ?? 0)),
      // 吸血溢出率：吸血里有多少是满血时浪费的（各局分别算，没吸血的局不计）
      lsOverPct: (() => {
        const ls = (x) => [x.heal.lifesteal ?? 0, x.overBy?.lifesteal ?? 0];
        const v = l.filter((x) => ls(x)[0] + ls(x)[1] > 0).map((x) => (ls(x)[1] / (ls(x)[0] + ls(x)[1])) * 100);
        return v.length ? median(v) : NaN;
      })(),
      cover: median(l.map((x) => (x.taken ? (Object.values(x.heal).reduce((a, b) => a + b, 0) / x.taken) * 100 : 0))),
      heal,
    };
  });
}

/** 精英 / Boss 击杀耗时行：按波次 + 类型汇总 */
function ttkRows(results) {
  const byWave = waveLogs(results);
  const rows = [];
  for (const w of Object.keys(byWave)
    .map(Number)
    .sort((a, b) => a - b)) {
    const logs = byWave[w];
    for (const elite of [true, false]) {
      const list = logs.flatMap((l) => (l.bosses ?? []).filter((b) => b.elite === elite));
      if (list.length < 5) continue;
      const ttk = list.filter((b) => b.ttk !== null).map((b) => b.ttk);
      const names = [...new Set(list.map((b) => b.id))];
      rows.push({
        w,
        elite,
        type: elite ? '精英' : 'Boss',
        names: names.length > 3 ? `${names.slice(0, 3).join('、')} 等 ${names.length} 种` : names.join('、'),
        n: list.length,
        limit: median(logs.map((l) => l.limit)),
        sec: median(logs.map((l) => l.sec)),
        t0: median(list.map((b) => b.t0)),
        p10: ttk.length ? quant(ttk, 0.1) : NaN,
        p50: ttk.length ? median(ttk) : NaN,
        p90: ttk.length ? quant(ttk, 0.9) : NaN,
        killPct: pct(ttk.length, list.length),
        // Boss 波：打到超过时限（进入狂暴加时）的局占比
        over: elite ? null : pct(logs.filter((l) => l.limit && l.sec > l.limit).length, logs.length),
      });
    }
  }
  return rows;
}

/** 每波番茄籽行：理论值、实际掉落、实际捡到与其他收入 */
function seedRows(results) {
  const byWave = waveLogs(results);
  const waves = Object.keys(byWave)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((w) => byWave[w].length >= 5);
  const other = (x) => Object.entries(x.inc).reduce((a, [k, v]) => a + (k === 'pickup' ? 0 : Math.max(0, v)), 0);
  return waves.map((w) => {
    const l = byWave[w];
    return {
      w,
      n: l.length,
      pot: median(l.map((x) => x.seedPot)),
      drop: median(l.map((x) => x.seedDrop)),
      pick: median(l.map((x) => x.inc.pickup ?? 0)),
      other: median(l.map(other)),
      total: median(l.map((x) => (x.inc.pickup ?? 0) + other(x))),
      dropPct: median(l.map((x) => (x.seedPot ? (x.seedDrop / x.seedPot) * 100 : 0))),
      pickPct: median(l.map((x) => (x.seedDrop ? ((x.inc.pickup ?? 0) / x.seedDrop) * 100 : 0))),
    };
  });
}

/** 每波累计收入与累计花费（离店快照的中位数） */
function econRows(results) {
  const byWave = {};
  for (const r of results) for (const w of r.waves ?? []) (byWave[w.wave] ??= []).push(w);
  return Object.keys(byWave)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((w) => byWave[w].length >= 5)
    .map((w) => {
      const l = byWave[w];
      return {
        w,
        n: l.length,
        earned: median(l.map((x) => x.earned)),
        spent: median(l.map((x) => x.spentAll ?? x.spent + (x.reroll ?? 0))),
        seeds: median(l.map((x) => x.seeds)),
      };
    });
}

/** 按章节筛选生成图表数据：{ all: build(全部), '1': build(第 1 章), ... } */
function byChapter(results, build) {
  const out = { all: build(results) };
  for (const c of [...new Set(results.map((r) => r.ch))].sort((a, b) => a - b)) out[c] = build(results.filter((r) => r.ch === c));
  return out;
}
/** 行 → 折线数据：picks = [[系列名, 取值函数], ...]（按顺序占分类色 1、2、3） */
const lineData = (rows, picks) => ({
  x: rows.map((r) => r.w),
  series: picks.map(([name, f], i) => ({
    name,
    slot: i + 1,
    values: rows.map((r) => {
      const v = f(r);
      return Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
    }),
  })),
});
const NO_DATA = '<p class="muted">数据不足（需要用新版机器人重新跑批量测试）</p>';

/** 生存曲线：承伤与回血、吸血溢出率（图）+ 完整数据表 */
function sustainHtml(results) {
  const rows = sustainRows(results);
  if (!rows.length) return NO_DATA;
  const table = `<table class="list"><thead><tr><th class="num">波次</th><th class="num">承伤</th><th class="num">吸血</th><th class="num">再生</th><th class="num">道具</th><th class="num">其他</th><th class="num">溢出</th><th class="num">吸血溢出</th><th class="num">吸血溢出率</th><th class="num">回血 / 承伤</th><th class="num">局数</th></tr></thead>
  <tbody>${rows
    .map(
      (r) =>
        `<tr><th scope="row" class="num">${r.w}</th><td class="num">${fmt(r.taken)}</td><td class="num">${fmt(r.ls)}</td><td class="num">${fmt(r.regen)}</td><td class="num">${fmt(r.item)}</td><td class="num">${fmt(r.other)}</td><td class="num muted">${fmt(r.over)}</td><td class="num">${fmt(r.lsOver)}</td><td class="num">${Number.isNaN(r.lsOverPct) ? '–' : Math.round(r.lsOverPct) + '%'}</td><td class="num">${pct(r.cover, 100)}%</td><td class="num muted">${r.n}</td></tr>`,
    )
    .join('')}</tbody></table>`;
  return `<p class="lede">承伤 = 实际扣掉的生命；回血 = 各来源实际回复的生命（满血时浪费的不算）。两条线贴在一起或回血在上，说明怪物伤害跟不上玩家回复。吸血溢出率 = 吸血里满血时浪费的比例，接近 100% 说明玩家几乎一直满血。均为中位数。</p>
  ${chart({
    title: '每波承伤与回血',
    sub: '中位数，单位：生命',
    datasets: byChapter(results, (rs) =>
      lineData(sustainRows(rs), [
        ['承伤', (r) => r.taken],
        ['回血', (r) => r.heal],
      ]),
    ),
  })}
  ${chart({ title: '吸血溢出率', sub: '吸血里满血时浪费的比例（没吸血的局不计）', fmt: 'pct', datasets: byChapter(results, (rs) => lineData(sustainRows(rs), [['吸血溢出率', (r) => r.lsOverPct]])), table })}`;
}

/** 精英 / Boss 击杀耗时：每波 P10–P90 区间 + P50（图）+ 完整数据表 */
function bossTtkHtml(results) {
  const rows = ttkRows(results);
  if (!rows.length) return NO_DATA;
  const rangeData = (rs) => {
    const rr = ttkRows(rs);
    const x = [...new Set(rr.map((r) => r.w))].sort((a, b) => a - b);
    const ser = (elite, name, slot) => {
      const at = (w) => rr.find((r) => r.w === w && r.elite === elite);
      const g = (w, k) => {
        const r = at(w);
        return r && Number.isFinite(r[k]) ? Math.round(r[k] * 10) / 10 : null;
      };
      return { name, slot, p10: x.map((w) => g(w, 'p10')), p50: x.map((w) => g(w, 'p50')), p90: x.map((w) => g(w, 'p90')) };
    };
    return { x, series: [ser(true, '精英', 1), ser(false, 'Boss', 2)].filter((s) => s.p50.some((v) => v !== null)) };
  };
  const table = `<table class="list"><thead><tr><th class="num">波次</th><th>类型</th><th>出场的怪</th><th class="num">只数</th><th class="num">波次时限</th><th class="num">波次实际</th><th class="num">出场时刻</th><th class="num">耗时 P10</th><th class="num">P50</th><th class="num">P90</th><th class="num">击杀率</th><th class="num">超时局</th></tr></thead>
  <tbody>${rows
    .map(
      (r) =>
        `<tr><th scope="row" class="num">${r.w}</th><td>${r.type}</td><td>${esc(r.names)}</td><td class="num muted">${r.n}</td><td class="num">${fmt(r.limit)}s</td><td class="num">${fmt(r.sec)}s</td><td class="num">${fmt(r.t0)}s</td><td class="num">${fmt(r.p10)}s</td><td class="num"><b>${fmt(r.p50)}s</b></td><td class="num">${fmt(r.p90)}s</td><td class="num">${r.killPct}%</td><td class="num">${r.over === null ? '–' : r.over + '%'}</td></tr>`,
    )
    .join('')}</tbody></table>`;
  return `<p class="lede">每只精英 / Boss 从出场到被击杀的秒数（只算被打死的）：圆点是中位数，竖线是 P10–P90 区间。精英在普通计时波里出场，波次到时还活着就算没打死；Boss 波时限 90 秒，打死才结束。耗时很短 = 可能太弱；没打死或超时多 = 可能太强（击杀率、超时局见数据表）。</p>
  ${chart({ type: 'range', title: '精英与 Boss 击杀耗时', sub: '秒，P50 与 P10–P90', fmt: 'sec', datasets: byChapter(results, rangeData), table })}`;
}

/** 每波番茄籽：理论值 / 掉落 / 捡到（图）+ 完整数据表 */
function seedsHtml(results) {
  const rows = seedRows(results);
  if (!rows.length) return NO_DATA;
  const table = `<table class="list"><thead><tr><th class="num">波次</th><th class="num">理论值</th><th class="num">掉落</th><th class="num">掉落 / 理论</th><th class="num">捡到</th><th class="num">拾取率</th><th class="num">其他收入</th><th class="num">本波总收入</th><th class="num">局数</th></tr></thead>
  <tbody>${rows
    .map(
      (r) =>
        `<tr><th scope="row" class="num">${r.w}</th><td class="num">${fmt(r.pot)}</td><td class="num">${fmt(r.drop)}</td><td class="num">${Math.round(r.dropPct)}%</td><td class="num">${fmt(r.pick)}</td><td class="num">${Math.round(r.pickPct)}%</td><td class="num">${fmt(r.other)}</td><td class="num"><b>${fmt(r.total)}</b></td><td class="num muted">${r.n}</td></tr>`,
    )
    .join('')}</tbody></table>`;
  return `<p class="lede">理论值 = 本波出场的怪全部打死能掉的番茄籽（按出场时的收获加成）；掉落 = 实际击杀掉的；捡到 = 实际拾取的（留在地上的下一波捡起时翻倍，算进下一波）。三条线的差距 = 没打死的怪与没捡的籽。均为中位数。</p>
  ${chart({
    title: '每波番茄籽',
    sub: '中位数',
    datasets: byChapter(results, (rs) =>
      lineData(seedRows(rs), [
        ['理论值', (r) => r.pot],
        ['掉落', (r) => r.drop],
        ['捡到', (r) => r.pick],
      ]),
    ),
    table,
  })}`;
}

/** 经济曲线：累计收入与花费、每波出怪与击杀、击杀率（三张图，单位不同不共轴）+ 数据表 */
function economyHtml(results) {
  const rows = econRows(results);
  if (!rows.length) return '<p class="muted">数据不足</p>';
  const kills = sustainRows(results);
  const kAt = (w) => kills.find((k) => k.w === w);
  const table = `<table class="list"><thead><tr><th class="num">波次</th><th class="num">累计收入</th><th class="num">累计花费</th><th class="num">持有</th><th class="num">花费占比</th><th class="num">出怪</th><th class="num">击杀</th><th class="num">击杀率</th><th class="num">局数</th></tr></thead>
  <tbody>${rows
    .map((r) => {
      const k = kAt(r.w);
      return `<tr><th scope="row" class="num">${r.w}</th><td class="num">${fmt(r.earned)}</td><td class="num">${fmt(r.spent)}</td><td class="num">${fmt(r.seeds)}</td><td class="num">${pct(r.spent, r.earned)}%</td><td class="num">${k ? fmt(k.spawned) : '–'}</td><td class="num">${k ? fmt(k.killed) : '–'}</td><td class="num">${k ? Math.round(k.killPct) + '%' : '–'}</td><td class="num muted">${r.n}</td></tr>`;
    })
    .join('')}</tbody></table>`;
  return `<p class="lede">每波离店时的累计收入与累计花费（番茄籽），每波刷出与击败的怪物数，以及击杀率（击败 ÷ 刷出；波次结束时还活着的怪会被清场，不算击杀）。均为中位数。</p>
  ${chart({
    title: '累计收入与花费',
    sub: '番茄籽，离店时',
    datasets: byChapter(results, (rs) =>
      lineData(econRows(rs), [
        ['累计收入', (r) => r.earned],
        ['累计花费', (r) => r.spent],
      ]),
    ),
  })}
  ${chart({
    title: '每波刷出与击败的怪物',
    sub: '只',
    datasets: byChapter(results, (rs) =>
      lineData(sustainRows(rs), [
        ['刷出', (r) => r.spawned],
        ['击败', (r) => r.killed],
      ]),
    ),
  })}
  ${chart({ title: '击杀率', sub: '击败 ÷ 刷出', fmt: 'pct', datasets: byChapter(results, (rs) => lineData(sustainRows(rs), [['击杀率', (r) => r.killPct]])), table })}`;
}

const LV_CLS = { ok: 'good', warn: 'warn', bad: 'bad' };
const LV_NAME = { ok: '通过', warn: '偏离', bad: '严重' };
function checksHtml(list) {
  if (!list.length) return '<p class="muted">没有启用的检测项</p>';
  const bad = list.filter((x) => x.lv === 'bad').length,
    warn = list.filter((x) => x.lv === 'warn').length;
  const order = { bad: 0, warn: 1, ok: 2 };
  return `<p class="lede">共 ${list.length} 项：<span class="badge bad">严重 ${bad}</span> <span class="badge warn">偏离 ${warn}</span> <span class="badge good">通过 ${list.length - bad - warn}</span>。标准与修改方向在 <code>scripts/balance-checks.json</code>，可增删、改目标或用 <code>--checks</code> 换一份。</p>
  <div class="scroll"><table class="list"><thead><tr><th>结果</th><th>检测项</th><th>范围</th><th class="num">实测</th><th class="num">目标</th><th>修改方向</th></tr></thead><tbody>${[
    ...list,
  ]
    .sort((a, b) => order[a.lv] - order[b.lv])
    .map(
      (a) =>
        `<tr><td style="width:56px"><span class="badge ${LV_CLS[a.lv]}">${LV_NAME[a.lv]}</span></td><th scope="row" style="text-align:left">${esc(a.name)}</th><td>${esc(a.scope)}</td><td class="num">${esc(a.value)}</td><td class="num muted">${esc(a.target)}</td><td class="src">${esc(a.advice)}</td></tr>`,
    )
    .join('')}</tbody></table></div>`;
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
        `T4 武器（到达最后一波的 ${d.n} 局）：≥1 把 ${d.ge[0]}% · ≥2 把 ${d.ge[1]}% · ≥3 把 ${d.ge[2]}%（目标 ${T4_TARGET.join(' / ')}%）`,
        '',
      );
    lines.push('| 角色 | 通关 | 平均波次 | 平均击杀 | 平均道具 | 主要受伤来源 |', '| --- | --- | --- | --- | --- | --- |');
    for (const r of c.rows)
      lines.push(`| ${r.name} | ${r.win}/${r.n} | ${r.wave.toFixed(1)} | ${Math.round(r.kills)} | ${r.items.toFixed(0)} | ${r.dmg} |`);
    lines.push('');
  }
  return lines.join('\n');
}

/** 受伤来源的显示名（topDmg 里的键） */
const SRC_NAME = {
  'bullet/aoe': '子弹与范围伤害',
  'bullet/aoe+stun': '子弹（附眩晕）',
  'bullet/aoe+burn/freeze': '子弹（附灼烧或冰冻）',
  'enrage-pressure': 'Boss 狂暴威压',
};
/** "bullet/aoe:146 dot:#9ef01a:25 霉菌大王:6" -> [[键, 伤害], ...] */
const parseDmg = (s) =>
  String(s ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => {
      const i = p.lastIndexOf(':');
      return i > 0 ? [p.slice(0, i), Number(p.slice(i + 1)) || 0] : [p, 0];
    });
const srcLabel = (k) => {
  if (k.startsWith('dot:')) {
    const col = k.slice(4);
    const sw = /^#[0-9a-f]{3,8}$/i.test(col) ? `<i class="sw" style="background:${col}"></i>` : '';
    return `${sw}持续伤害`;
  }
  return esc(SRC_NAME[k] ?? k);
};
const fmtDmg = (s) =>
  parseDmg(s)
    .map(([k, v]) => `${srcLabel(k)} <b class="n">${v}</b>`)
    .join('，');

/** 存活带：每一格是一波，颜色深浅是死在这一波的局数，最后一格是通关局数 */
function survivalRow(c) {
  const W = chapterWaves(c.ch);
  const deaths = Array(W + 1).fill(0);
  let timeouts = 0;
  for (const r of c.runs) {
    if (r.win) continue;
    if (r.timeout) timeouts++;
    deaths[Math.min(W, Math.max(1, r.wave ?? 1))]++;
  }
  const peak = Math.max(1, ...deaths);
  const cells = [];
  for (let w = 1; w <= W; w++) {
    const n = deaths[w];
    const a = n / peak;
    const boss = w === W;
    const tip = `第 ${w} 波${boss ? '（Boss）' : ''}：阵亡 ${n} 局`;
    cells.push(
      `<div class="c${n ? ' d' : ''}${a > 0.5 ? ' hot' : ''}${boss ? ' boss' : ''}" style="--a:${a.toFixed(3)}" title="${tip}">${n || ''}</div>`,
    );
  }
  const lost = c.n - c.win;
  const worst = deaths
    .map((n, w) => [w, n])
    .filter(([, n]) => n > 0)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 2)
    .sort((x, y) => x[0] - y[0]);
  const note = lost
    ? `阵亡 ${lost} 局，最多死在${worst.map(([w]) => (w === W ? ' Boss 波' : `第 ${w} 波`)).join('和')}${timeouts ? `；其中 ${timeouts} 局超时` : ''}`
    : '全部通关';
  const axis = Array.from({ length: W }, (_, i) => i + 1)
    .map((w) => `<span>${w === 1 || w % 5 === 0 ? w : ''}</span>`)
    .join('');
  const rate = pct(c.win, c.n);
  return `<div class="srow">
      <div class="shead"><span class="chn">第 ${c.ch} 章</span><span class="rate">${rate}<small>%</small></span><span class="sub">${c.win} / ${c.n} 局通关</span></div>
      <div class="strack">
        <div class="cells" style="--w:${W}">${cells.join('')}<div class="c win" style="--p:${rate}" title="通关 ${c.win} 局">${c.win}</div></div>
        <div class="axis" style="--w:${W}">${axis}<span>通关</span></div>
        <p class="note">${note}</p>
      </div>
    </div>`;
}

/** 阵亡局的受伤来源（伤害累计占比） */
function killersHtml(runs) {
  const lost = runs.filter((r) => !r.win);
  if (!lost.length) return '<p class="muted">没有阵亡局</p>';
  const sum = {};
  for (const r of lost) for (const [k, v] of parseDmg(r.topDmg)) sum[k] = (sum[k] ?? 0) + v;
  const total = Object.values(sum).reduce((a, b) => a + b, 0) || 1;
  const top = Object.entries(sum)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return `<ol class="kill">${top
    .map(
      ([k, v]) =>
        `<li><span class="kn">${srcLabel(k)}</span><span class="kb"><i style="width:${((v / top[0][1]) * 100).toFixed(1)}%"></i></span><span class="kv">${pct(v, total)}%</span></li>`,
    )
    .join('')}</ol>`;
}

/** 角色 × 章节通关率矩阵，最弱的排最上面 */
function matrixHtml(S, names) {
  const chs = S.filter((c) => c.n).map((c) => c.ch);
  const ids = [...new Set(S.flatMap((c) => c.rows.map((r) => r.id)))];
  const rows = ids.map((id) => {
    const per = chs.map((ch) => S.find((c) => c.ch === ch).rows.find((r) => r.id === id));
    const n = per.reduce((a, r) => a + (r?.n ?? 0), 0);
    const win = per.reduce((a, r) => a + (r?.win ?? 0), 0);
    return { id, name: names[id] ?? id, per, n, win, rate: n ? win / n : 0 };
  });
  rows.sort((a, b) => a.rate - b.rate || a.name.localeCompare(b.name, 'zh'));
  const cell = (r, ch, name) => {
    if (!r) return '<td class="mc none">–</td>';
    const p = pct(r.win, r.n);
    const W = chapterWaves(ch);
    // 发散色阶：50% 是中性浅色，往下偏紫（难），往上偏绿（易）
    const k = Math.abs(p - 50) / 50;
    const tone = p < 50 ? 'var(--rot)' : 'var(--vine)';
    return `<td class="mc${k > 0.5 ? ' strong' : ''}" style="--k:${k.toFixed(2)};--tone:${tone}" title="${esc(name)}，第 ${ch} 章：通关 ${r.win}/${r.n}，平均到达第 ${r.wave.toFixed(1)} / ${W} 波">${p}</td>`;
  };
  return `<div class="scroll"><table class="mx">
    <thead><tr><th>角色</th><th class="num">总通关率</th>${chs.map((ch) => `<th class="num">第 ${ch} 章</th>`).join('')}</tr></thead>
    <tbody>${rows
      .map(
        (r) =>
          `<tr><th scope="row">${esc(r.name)}</th><td class="num tot">${pct(r.win, r.n)}%<small>${r.win}/${r.n}</small></td>${r.per.map((x, i) => cell(x, chs[i], r.name)).join('')}</tr>`,
      )
      .join('')}</tbody></table></div>`;
}

export function renderHtml(meta, results) {
  const S = summarize(results, meta.chapters, meta.names);
  const live = S.filter((c) => c.n);
  const done = results.length,
    total = meta.total;
  const status = meta.complete
    ? '<span class="badge good">完整</span>'
    : `<span class="badge warn">未完成：${done} / ${total} 局，可续跑</span>`;
  const bar = (v, max, label, tip) =>
    `<div class="bar" title="${esc(tip)}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100)).toFixed(1)}%"></i><span>${label}</span></div>`;
  const chapters = live
    .map((c) => {
      const W = chapterWaves(c.ch);
      return `
  <details class="chd">
    <summary><span>第 ${c.ch} 章详细数据</span><small>${c.n} 局，通关 ${c.win}，共 ${W} 波</small></summary>
    <div class="cols">
      <div><h4>阵亡局的受伤来源</h4>${killersHtml(c.runs)}</div>
      <div><h4>到达最后一波时的 T4 武器</h4>${t4Html(c.runs)}</div>
    </div>
    <h4>各角色</h4>
    <div class="scroll"><table class="list">
      <thead><tr><th>角色</th><th class="w">通关率</th><th class="w">平均到达波次</th><th class="num">击杀</th><th class="num">道具</th><th class="num">用时</th><th>受伤来源（首局）</th></tr></thead>
      <tbody>${c.rows
        .map(
          (r) => `
        <tr><th scope="row">${esc(r.name)}${r.timeouts ? ` <span class="badge warn" title="超时局数">超时 ${r.timeouts}</span>` : ''}</th>
        <td>${bar(r.win, r.n, `${pct(r.win, r.n)}% <em>${r.win}/${r.n}</em>`, `${r.name}：通关 ${r.win}/${r.n}`)}</td>
        <td>${bar(r.wave, W, `${r.wave.toFixed(1)} <em>/ ${W}</em>`, `${r.name}：平均到达第 ${r.wave.toFixed(1)} 波（共 ${W} 波）`)}</td>
        <td class="num">${Math.round(r.kills)}</td><td class="num">${r.items.toFixed(0)}</td><td class="num">${r.sec.toFixed(0)} 秒</td>
        <td class="src">${fmtDmg(r.dmg)}</td></tr>`,
        )
        .join('')}
      </tbody>
    </table></div>
    <details class="eco"><summary>经济与构筑（P50、P90、范围）</summary><div class="scroll">${econTable(c.runs)}</div></details>
  </details>`;
    })
    .join('');
  const detail = results
    .map(
      (r) => `
    <tr><td class="num">${r.ch}</td><th scope="row">${esc(meta.names[r.charId] ?? r.charId)}</th><td class="num">${r.run + 1}</td>
    <td>${r.timeout ? '<span class="badge warn">超时</span>' : r.win ? '<span class="badge good">通关</span>' : '<span class="badge bad">阵亡</span>'}</td>
    <td class="num">${r.wave ?? ''}<small>/${chapterWaves(r.ch)}</small></td><td class="num">${r.level ?? ''}</td><td class="num">${r.kills ?? ''}</td><td class="num">${r.items ?? ''}</td><td class="num">${r.sec ?? ''} 秒</td>
    <td class="src">${esc(String(r.weapons ?? '').replaceAll(',', ', '))}</td><td class="src">${fmtDmg(r.topDmg)}</td></tr>`,
    )
    .join('');
  const facts = [
    meta.version && ['版本', `v${esc(meta.version)}`],
    ['生成于', esc(stamp(new Date(meta.finishedAt)))],
    ['章节', meta.chapters.join('、')],
    ['每角色每章', `${meta.runs} 局`],
    ['天赋', esc(TALENT_NAME[meta.talents ?? 'none'] ?? meta.talents)],
    ['速度', meta.speed === 'max' ? '极速' : `${esc(meta.speed)} 倍速`],
    ['并行', `${esc(meta.workers)} 个`],
    ['用时', dur(meta.elapsedMs)],
    meta.resumed && ['续跑', `${meta.resumed} 次`],
  ].filter(Boolean);

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>平衡测试报告 ${esc(stamp(new Date(meta.finishedAt)))}</title>
<style>
:root{color-scheme:light;
  --ground:#eef2ec;--panel:#fbfcfa;--line:#d6ddd1;--ink:#1d2a1c;--ink2:#4c5948;--muted:#778373;
  --vine:#3b7a37;--rot:#6a3d7a;--track:#e2e8de;--amber:#9a6200;--tomato:#d4402a;
  --sans:"Microsoft YaHei UI","Microsoft YaHei","PingFang SC","Noto Sans SC",system-ui,sans-serif;
  --num:Bahnschrift,"DIN Alternate","Roboto Condensed","Arial Narrow",var(--sans)}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;
  --ground:#121812;--panel:#192019;--line:#2c372a;--ink:#e6eee2;--ink2:#b2bead;--muted:#86937f;
  --vine:#4f9a48;--rot:#9061a3;--track:#232d22;--amber:#e0a23a;--tomato:#ff6a4d}}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font:14px/1.6 var(--sans)}
main{max-width:1180px;margin:0 auto;padding:40px 28px 64px}
:focus-visible{outline:2px solid var(--tomato);outline-offset:2px;border-radius:2px}
small{font-size:12px;color:var(--muted);font-weight:400}
.num,.rate,.n,.kv,.mc,.c{font-family:var(--num);font-variant-numeric:tabular-nums}

header{display:grid;grid-template-columns:1fr auto;gap:8px 24px;align-items:end;padding-bottom:20px;border-bottom:2px solid var(--ink)}
h1{margin:0;font-size:30px;line-height:1.15;font-weight:700;letter-spacing:.02em}
h1 .mark{display:inline-block;width:.62em;height:.62em;border-radius:50%;background:var(--tomato);margin-right:.32em;vertical-align:.04em;box-shadow:inset -.08em -.1em 0 rgba(0,0,0,.18)}
.facts{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:4px 22px;margin:6px 0 0;color:var(--ink2)}
.facts div{display:flex;gap:6px}.facts dt{color:var(--muted)}.facts dd{margin:0}
.badge{display:inline-block;padding:1px 9px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;border:1px solid currentColor;vertical-align:middle}
.good{color:var(--vine)}.warn{color:var(--amber)}.bad{color:var(--rot)}

h2{font-size:19px;margin:44px 0 4px;font-weight:700}
.lede{margin:0 0 18px;color:var(--ink2);max-width:62ch}
h4{font-size:14px;margin:18px 0 8px;color:var(--ink2);font-weight:600}

/* 存活带：页面的主角 */
.legend{display:flex;flex-wrap:wrap;gap:6px 20px;color:var(--ink2);font-size:12px;margin:-6px 0 14px}
.legend i{display:inline-block;width:22px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.srow{display:grid;grid-template-columns:150px 1fr;gap:18px;padding:16px 0;border-top:1px solid var(--line)}
.srow:first-of-type{border-top:0}
.shead{display:grid;grid-template-columns:auto 1fr;align-items:baseline;column-gap:10px}
.chn{grid-column:1/-1;font-weight:600;color:var(--ink2)}
.rate{font-size:44px;line-height:1;font-weight:600;letter-spacing:-.01em}
.rate small{font-size:18px;color:var(--ink2);margin-left:1px}
.sub{grid-column:1/-1;color:var(--muted);font-size:12px;margin-top:4px}
.cells,.axis{display:grid;grid-template-columns:repeat(var(--w),minmax(0,1fr)) 64px;gap:3px}
.c{height:46px;border-radius:3px;background:var(--track);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:var(--ink)}
.c.d{background:color-mix(in oklab,var(--rot) calc(18% + var(--a) * 82%),var(--track))}
.c.hot{color:#fff}
.c.boss{box-shadow:inset 0 -4px 0 var(--tomato)}
.c.win{margin-left:6px;background:var(--vine);color:#fff;font-size:18px}
.axis{margin-top:3px;font:11px/1.4 var(--num);color:var(--muted);text-align:center}
.axis span:last-child{margin-left:6px}
.note{margin:6px 0 0;color:var(--ink2);font-size:13px}
@media (prefers-reduced-motion:no-preference){
  .cells .c{animation:sprout .5s cubic-bezier(.2,.8,.3,1) both;animation-delay:calc(var(--i,0) * 1ms)}
  @keyframes sprout{from{transform:scaleY(.15);opacity:0}}
}

/* 角色矩阵 */
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%}
th,td{padding:6px 10px;text-align:left;vertical-align:middle;border-bottom:1px solid var(--line)}
thead th{font-size:12px;font-weight:600;color:var(--muted);white-space:nowrap;border-bottom:1px solid var(--ink2)}
tbody th{font-weight:500;white-space:nowrap}
.num{text-align:right}
.mx{width:auto}
.mx td,.mx th{border-bottom:0;padding:2px 4px}
.mx tbody th{padding-right:14px}
.mx .tot{padding-right:14px;font-weight:600;white-space:nowrap}
.mx .tot small{margin-left:6px}
.mc{min-width:64px;text-align:center;font-weight:600;color:var(--ink);border-radius:3px;
  background:color-mix(in oklab,var(--tone) calc(12% + var(--k) * 88%),var(--track));border:2px solid var(--ground)}
.mc.strong{color:#fff}
.mc.none{background:transparent;color:var(--muted);font-weight:400}
.mx tbody tr:hover th{color:var(--tomato)}

/* 章节详情 */
.chd{border-top:1px solid var(--line);padding:2px 0}
.chd:last-of-type{border-bottom:1px solid var(--line)}
summary{cursor:pointer;padding:12px 0;font-weight:600;list-style-position:outside}
summary small{margin-left:12px}
.chd[open]{padding-bottom:24px}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:8px 40px}
.kill{list-style:none;margin:0;padding:0}
.kill li{display:grid;grid-template-columns:minmax(9em,auto) 1fr 3.2em;gap:10px;align-items:center;padding:3px 0}
.kb{height:8px;background:var(--track);border-radius:4px;overflow:hidden}
.kb i{display:block;height:100%;background:var(--rot)}
.kv{text-align:right;color:var(--ink2)}
.sw{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:0}
.list td{background:var(--panel)}
.w{width:20%}
.bar{position:relative;height:20px;background:var(--track);border-radius:3px;overflow:hidden;min-width:120px}
.bar i{position:absolute;inset:0 auto 0 0;background:color-mix(in oklab,var(--vine) 70%,var(--track))}
.bar span{position:relative;padding-left:8px;font:600 12px/20px var(--num)}
.bar em{font-style:normal;font-weight:400;color:var(--ink2)}
.src{color:var(--ink2);font-size:12px}
.src .n{color:var(--ink);font-weight:600}
.t4{width:auto}.t4 td,.t4 th{background:var(--panel)}
.econ td,.econ th{padding:3px 8px;font-size:12px;background:var(--panel)}
.econ .muted,.muted{color:var(--muted);font-size:12px}
.eco{margin-top:14px}.eco summary{font-size:13px;color:var(--ink2)}
.runs summary{font-size:16px}
.runs td,.runs th{font-size:12px;padding:4px 8px}

${CHART_CSS}
@media (max-width:720px){
  main{padding:24px 16px 48px}
  header{grid-template-columns:1fr}
  .srow{grid-template-columns:1fr;gap:8px}
  .shead{grid-template-columns:auto auto 1fr}
  .chn,.sub{grid-column:auto}
  .rate{font-size:32px}
  .cells,.axis{grid-template-columns:repeat(var(--w),minmax(0,1fr)) 44px;gap:2px}
  .c{height:36px;font-size:11px}
}
</style></head>
<body><main>
  <header>
    <h1><span class="mark" aria-hidden="true"></span>平衡测试报告</h1>
    <div>${status}</div>
    <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  </header>

  ${
    meta.adviceHtml
      ? `<section class="advice">
    <h2>本次改动、结论与调整建议</h2>
    ${meta.adviceHtml}
  </section>`
      : ''
  }

  <section>
    <h2>检测项</h2>
    ${checksHtml(runChecks(loadChecks(meta.checksFile), S, results, meta))}
  </section>

  <section>
    <h2>合成进度：各角色拿到 T3 / T4 / 超武的波次</h2>
    ${craftProgressHtml(results, meta.names)}
  </section>

  <section>
    <h2>按波次的曲线</h2>
    <p class="lede">下面的经济、生存、击杀耗时与番茄籽图表横轴都是波次，可以按章节筛选（每章波数不同，「全部章节」把各章同一波次合在一起）。鼠标移到图上看每一波的读数，也可以点一下图后用方向键逐波查看。</p>
    ${chapterFilter([...new Set(results.map((r) => r.ch))].sort((a, b) => a - b))}
  </section>

  <section>
    <h2>经济曲线：收入、花费与击杀</h2>
    ${economyHtml(results)}
  </section>

  <section>
    <h2>生存曲线：每波出怪、击杀、承伤与回血</h2>
    ${sustainHtml(results)}
  </section>

  <section>
    <h2>精英与 Boss 击杀耗时</h2>
    ${bossTtkHtml(results)}
  </section>

  <section>
    <h2>每波番茄籽：理论值与实际</h2>
    ${seedsHtml(results)}
  </section>

  <section>
    <h2>每局死在哪一波</h2>
    <p class="lede">每一格是一波，数字是死在这一波的局数，颜色越深死得越多。带红色底线的是 Boss 波，最右边绿色格是通关局数。</p>
    <div class="legend"><span><i style="background:var(--track)"></i>没人死</span><span><i style="background:color-mix(in oklab,var(--rot) 40%,var(--track))"></i>少量阵亡</span><span><i style="background:var(--rot)"></i>本章阵亡最多</span><span><i style="background:var(--vine)"></i>通关</span></div>
    ${live.map(survivalRow).join('') || '<p class="muted">还没有结果</p>'}
  </section>

  <section>
    <h2>角色在各章的通关率</h2>
    <p class="lede">单位是 %，从最弱排到最强。50% 是浅色，越难通关越偏紫，越容易越偏绿。鼠标停在格子上可以看局数和平均到达波次。</p>
    ${matrixHtml(S, meta.names)}
  </section>

  <section>
    <h2>分章详情</h2>
    <p class="lede">阵亡局的受伤来源、T4 武器、每个角色的数据和经济曲线。点章节标题展开。</p>
    ${chapters}
    <details class="chd"><summary><span>全部章节的 T4 武器与经济</span></summary>${t4Html(results)}<div class="scroll">${econTable(results)}</div></details>
  </section>

  <details class="runs"><summary><h2 style="display:inline;margin:0;font-size:inherit">逐局明细</h2><small>${done} 局</small></summary>
    <div class="scroll"><table><thead><tr><th class="num">章</th><th>角色</th><th class="num">局</th><th>结果</th><th class="num">波次</th><th class="num">等级</th><th class="num">击杀</th><th class="num">道具</th><th class="num">用时</th><th>武器</th><th>受伤来源</th></tr></thead>
    <tbody>${detail}</tbody></table></div>
  </details>
</main>
<script src="echarts.min.js"></script>
<script>${CHART_JS}</script>
<script>
  // 存活带的格子按顺序长出来（唯一的入场动画）
  document.querySelectorAll('.cells').forEach((row, ri) =>
    row.querySelectorAll('.c').forEach((c, i) => c.style.setProperty('--i', ri * 60 + i * 18)));

  // 表头点击排序：整列能当数字读就按数值排，否则按文本；再点同一列反向。
  // econ / mx 是「指标在行、章节在列」的转置表，排序没有意义，跳过。
  var numOf = function (txt) {
    var m = String(txt).replace(/[, ]/g, '').match(/-?[0-9]+(?:[.][0-9]+)?/);
    return m ? parseFloat(m[0]) : null;
  };
  document.querySelectorAll('table').forEach(function (tb) {
    if (tb.classList.contains('econ') || tb.classList.contains('mx')) return;
    var body = tb.tBodies[0];
    var head = tb.tHead && tb.tHead.rows[tb.tHead.rows.length - 1];
    if (!body || !head || body.rows.length < 2) return;
    var cells = [].slice.call(head.cells);
    cells.forEach(function (th, i) {
      th.style.cursor = 'pointer';
      th.style.userSelect = 'none';
      th.title = (th.title ? th.title + ' · ' : '') + '点击排序';
      th.addEventListener('click', function () {
        var dir = th.dataset.dir === 'asc' ? -1 : 1;
        cells.forEach(function (o) {
          var old = o.querySelector('.sarw');
          if (old) old.remove();
          if (o !== th) delete o.dataset.dir;
        });
        th.dataset.dir = dir === 1 ? 'asc' : 'desc';
        var arrow = document.createElement('span');
        arrow.className = 'sarw';
        arrow.textContent = dir === 1 ? ' ▲' : ' ▼';
        arrow.style.opacity = '0.7';
        th.appendChild(arrow);
        var txt = function (r) {
          return r.cells[i] ? r.cells[i].textContent.trim() : '';
        };
        var rows = [].slice.call(body.rows);
        var allNum = rows.every(function (r) {
          return numOf(txt(r)) !== null;
        });
        rows.sort(function (a, b) {
          return allNum ? (numOf(txt(a)) - numOf(txt(b))) * dir : txt(a).localeCompare(txt(b), 'zh') * dir;
        });
        rows.forEach(function (r) {
          body.appendChild(r);
        });
      });
    });
  });
</script>
</body></html>`;
}

/** 写出报告：reports/balance-<时间>.html（存档）+ reports/BALANCE_REPORT.html/.md（最新）；reports/ 不进仓库 */
export function writeReports(meta, results) {
  const reports = OUT;
  mkdirSync(reports, { recursive: true });
  const html = renderHtml(meta, results);
  const file = new URL(`balance-${fileStamp(new Date(meta.startedAt))}${meta.complete ? '' : '-partial'}.html`, reports);
  writeFileSync(file, html);
  // 图表库：复制到报告目录，报告用相对路径加载（离线可打开；只在缺失或版本变化时复制）
  const lib = new URL('../node_modules/echarts/dist/echarts.min.js', import.meta.url);
  const dst = new URL('echarts.min.js', reports);
  if (existsSync(lib) && (!existsSync(dst) || readFileSync(dst).length !== readFileSync(lib).length)) copyFileSync(lib, dst);
  writeFileSync(new URL('BALANCE_REPORT.html', OUT), html);
  writeFileSync(new URL('BALANCE_REPORT.md', OUT), renderMarkdown(meta, results));
  return fileURLToPath(file);
}

// 直接运行：从进度文件或结果文件重新生成报告
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const flag = (k) => {
    const i = process.argv.indexOf(`--${k}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const advice = flag('advice') ? readFileSync(flag('advice'), 'utf8') : '';
  const checksFile = flag('checks');
  const pos = process.argv.slice(2).filter((x, i, l) => !x.startsWith('--') && !l[i - 1]?.startsWith('--'));
  const src =
    pos[0] ?? ['./.batch-progress.json', './.batch-results.json'].map((p) => fileURLToPath(new URL(p, import.meta.url))).find(existsSync);
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
  console.log('报告：' + writeReports({ ...meta, adviceHtml: advice, ...(checksFile ? { checksFile } : {}) }, results));
}
