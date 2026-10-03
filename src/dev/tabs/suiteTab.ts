// 测试套件（F1–F6）：「构筑 × 怪物 × 波次」用例存成套件一键重跑（可固定种子），
// 两次运行逐项对比、与回归基线对比、导出 CSV / Markdown、TTK 随波次曲线
import { h, btn, check, select, num, table, fmt } from '../dom';
import type { DevCtx } from '../ctx';
import type { DevBuild } from '../build';
import type { SpawnOpts } from '../sandbox';
import { CHARACTER_MAP } from '../../data/characters';
import { BOSS_MAP } from '../../data/bosses';
import { ENEMY_MAP } from '../../data/enemies';
import { seedRandom, restoreRandom } from '../seed';
import { lineChart } from './dataTab';

export interface SuiteCase {
  build: DevBuild;
  id: string;
  boss: boolean;
  chapterId: number;
  wave: number;
  count: number;
  attack: SpawnOpts['attack'];
  affixes: SpawnOpts['affixes'];
}
export interface CaseResult {
  key: string;
  label: string;
  wave: number;
  ttk: number | null;
  taken: number;
  deaths: number;
  status: 'ok' | 'timeout' | 'aborted' | 'error';
}
export interface SuiteRun {
  t: number;
  suite: string;
  seed: number | null;
  results: CaseResult[];
}

const SUITE_KEY = 'tomageddon_dev_suites';
const RUN_KEY = 'tomageddon_dev_suite_runs';
const BASE_KEY = 'tomageddon_dev_suite_baseline';
const load = <T>(k: string, d: T): T => {
  try {
    return (JSON.parse(localStorage.getItem(k) ?? 'null') as T) ?? d;
  } catch {
    return d;
  }
};
const store = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

let suiteName = '';
let curSuite = '';
let wavesText = '5,10,15';
let useSeed = true;
let seed = 12345;
let timeoutSec = 60;
let threshold = 15;
let cmpA = 0;
let cmpB = 1;
let running: { suite: string; i: number; n: number; stop: boolean } | null = null;

const caseKey = (c: SuiteCase): string =>
  `${c.build.charId}|${c.build.weapons.map((w) => `${w.id}${w.tier}`).join(',')}|L${c.build.level}|${c.boss ? 'b:' : ''}${c.id}|${c.chapterId}-${c.wave}|x${c.count}|${c.attack}|${(c.affixes ?? []).join('+')}`;
const caseLabel = (c: SuiteCase): string =>
  `${CHARACTER_MAP[c.build.charId]?.name} vs ${c.boss ? BOSS_MAP[c.id]?.name : ENEMY_MAP[c.id]?.name}${c.count > 1 ? `×${c.count}` : ''}`;

export function runsOf(suite: string): SuiteRun[] {
  return load<SuiteRun[]>(RUN_KEY, []).filter((r) => r.suite === suite);
}

/** F1：顺序跑完套件里的每个用例（倍速 ×8，超时记为 timeout） */
async function runSuite(ctx: DevCtx, name: string, cases: SuiteCase[]): Promise<void> {
  const sb = ctx.sb;
  const prevSpeed = sb.speed;
  const prevGod = sb.god;
  running = { suite: name, i: 0, n: cases.length, stop: false };
  const results: CaseResult[] = [];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  try {
    for (let i = 0; i < cases.length && !running.stop; i++) {
      running.i = i;
      ctx.rerender();
      const c = cases[i];
      if (useSeed) seedRandom(seed + i);
      ctx.applyNow(c.build);
      for (let k = 0; k < 50 && !sb.running; k++) await sleep(100);
      await sleep(400);
      sb.setSpeed(8);
      sb.god = false;
      if (useSeed) seedRandom(seed + i);
      const err = sb.spawn(c.id, c.boss, {
        chapterId: c.chapterId,
        wave: c.wave,
        count: c.count,
        affixes: c.affixes,
        lock: false,
        attack: c.attack,
        immortal: false,
        test: true,
      });
      const r0 = sb.tests[0];
      const res: CaseResult = { key: caseKey(c), label: caseLabel(c), wave: c.wave, ttk: null, taken: 0, deaths: 0, status: 'error' };
      if (err || !r0) {
        results.push(res);
        continue;
      }
      const start = sb.g.time.now;
      while (!running.stop) {
        await sleep(150);
        if (r0.ttk !== null || r0.aborted) break;
        if (!sb.running || sb.g.time.now - start > timeoutSec * 1000) break;
      }
      res.ttk = r0.ttk;
      res.taken = Math.round(r0.taken);
      res.deaths = r0.deaths;
      res.status = r0.ttk !== null ? 'ok' : r0.aborted ? 'aborted' : 'timeout';
      results.push(res);
    }
  } finally {
    restoreRandom();
    sb.setSpeed(prevSpeed);
    sb.god = prevGod;
    const stopped = running?.stop;
    running = null;
    const all = load<SuiteRun[]>(RUN_KEY, []);
    all.unshift({ t: Date.now(), suite: name, seed: useSeed ? seed : null, results });
    store(RUN_KEY, all.slice(0, 60));
    ctx.toast(`套件「${name}」${stopped ? '已停止' : '跑完'}：${results.filter((r) => r.status === 'ok').length}/${cases.length} 通过`);
    ctx.rerender();
  }
}

const ttkS = (r: CaseResult | undefined): string => (!r ? '—' : r.ttk !== null ? r.ttk.toFixed(2) : r.status);

/** F2 / F6：两次运行逐项对比；变化超过阈值高亮 */
function compare(a: SuiteRun, b: SuiteRun): HTMLElement {
  const mb = new Map(b.results.map((r) => [r.key, r]));
  return table(
    ['用例', '波次', `TTK ${new Date(b.t).toLocaleTimeString()}`, `TTK ${new Date(a.t).toLocaleTimeString()}`, '变化', '承伤 前→后'],
    a.results.map((r) => {
      const o = mb.get(r.key);
      const d = r.ttk !== null && o?.ttk ? ((r.ttk - o.ttk) / o.ttk) * 100 : null;
      const hot = d !== null && Math.abs(d) >= threshold;
      return [
        r.label,
        `W${r.wave}`,
        ttkS(o),
        ttkS(r),
        d === null ? '' : h('b', { class: hot ? (d < 0 ? 'good' : 'bad') : 'muted' }, `${d > 0 ? '+' : ''}${fmt(d)}%`),
        `${o?.taken ?? '—'} → ${r.taken}`,
      ];
    }),
    { numeric: [2, 3, 4] },
  );
}

/** F3 */
function toCsv(run: SuiteRun): string {
  const head = 'label,wave,ttk,taken,deaths,status';
  return [head, ...run.results.map((r) => [`"${r.label}"`, r.wave, r.ttk ?? '', r.taken, r.deaths, r.status].join(','))].join('\n');
}
function toMd(run: SuiteRun): string {
  return [
    `### ${run.suite} · ${new Date(run.t).toLocaleString()}${run.seed !== null ? ` · 种子 ${run.seed}` : ''}`,
    '',
    '| 用例 | 波次 | TTK(s) | 承伤 | 阵亡 | 状态 |',
    '|---|---:|---:|---:|---:|---|',
    ...run.results.map((r) => `| ${r.label} | ${r.wave} | ${r.ttk?.toFixed(2) ?? ''} | ${r.taken} | ${r.deaths} | ${r.status} |`),
  ].join('\n');
}

export function renderSuites(ctx: DevCtx): HTMLElement {
  const suites = load<Record<string, SuiteCase[]>>(SUITE_KEY, {});
  const names = Object.keys(suites);
  if (!suites[curSuite]) curSuite = names[0] ?? '';
  const cases = suites[curSuite] ?? [];
  const root = h('div');
  const ui = ctx.ui;
  const sel = ui.mSel;
  const nameIn = h('input', { placeholder: '新套件名', value: suiteName, oninput: () => (suiteName = nameIn.value), style: 'width:120px' });
  const wavesIn = h('input', { value: wavesText, oninput: () => (wavesText = wavesIn.value), style: 'width:90px', title: '逗号分隔的波次' });

  root.append(
    h('h3', null, 'F1 测试套件'),
    h(
      'div',
      { class: 'row' },
      names.length ? select(names.map((n) => [n, `${n}（${suites[n].length}）`]), curSuite, (v) => ((curSuite = v), ctx.rerender())) : h('span', { class: 'muted' }, '还没有套件'),
      nameIn,
      btn('新建', () => {
        const n = suiteName.trim();
        if (!n) return ctx.toast('先填套件名', true);
        suites[n] ??= [];
        store(SUITE_KEY, suites);
        curSuite = n;
        ctx.rerender();
      }),
      curSuite ? btn('删除套件', () => (delete suites[curSuite], store(SUITE_KEY, suites), ctx.rerender())) : '',
    ),
    curSuite
      ? h(
          'div',
          { class: 'row' },
          '加入用例：当前构筑 × 怪物页选中的',
          h('b', null, sel ? (sel.startsWith('b:') ? BOSS_MAP[sel.slice(2)]?.name : ENEMY_MAP[sel]?.name) ?? sel : '（未选）'),
          `（×${ui.spawn.count}，第${ui.mChapter}章）波次`,
          wavesIn,
          btn('加入', () => {
            if (!sel) return ctx.toast('先在怪物页或快捷栏选中一个怪物', true);
            const waves = wavesText
              .split(/[,，\s]+/)
              .map(Number)
              .filter((w) => w >= 1 && w <= 60);
            if (!waves.length) return ctx.toast('波次格式：5,10,15', true);
            for (const w of waves)
              suites[curSuite].push({
                build: { ...JSON.parse(JSON.stringify(ctx.build)), wave: w },
                id: sel.replace(/^b:/, ''),
                boss: sel.startsWith('b:'),
                chapterId: ui.mChapter,
                wave: w,
                count: ui.spawn.count,
                attack: ui.spawn.attack,
                affixes: ui.affixMode === 'rule' ? null : ui.affixMode === 'none' ? [] : [...(ui.spawn.affixes ?? [])],
              });
            store(SUITE_KEY, suites);
            ctx.rerender();
          }),
        )
      : '',
    h(
      'div',
      { class: 'row' },
      check('F4 固定随机种子', useSeed, (v) => (useSeed = v), '每个用例用 种子+序号 重置 Math.random，同样的代码跑出同样的结果'),
      num(seed, (v) => (seed = v), { width: 80 }),
      '超时(模拟秒)',
      num(timeoutSec, (v) => (timeoutSec = v), { min: 5, max: 600, width: 54 }),
      running
        ? btn(`■ 停止（${running.i + 1}/${running.n}）`, () => running && (running.stop = true), 'hot')
        : btn('▶ 运行套件', () => (cases.length ? void runSuite(ctx, curSuite, cases) : ctx.toast('套件里没有用例', true)), 'pri'),
    ),
  );
  if (cases.length)
    root.append(
      table(
        ['#', '用例', '章/波', '构筑', ''],
        cases.map((c, i) => [
          String(i + 1),
          caseLabel(c),
          `${c.chapterId}/${c.wave}`,
          h('span', { class: 'muted small' }, `Lv${c.build.level} ${c.build.weapons.length} 武器 ${Object.values(c.build.items).reduce((a, n) => a + n, 0)} 道具`),
          btn('删', () => (cases.splice(i, 1), store(SUITE_KEY, suites), ctx.rerender())),
        ]),
      ),
    );

  // ---------------- 运行记录 / 对比 ----------------
  const runs = runsOf(curSuite);
  const base = load<Record<string, SuiteRun>>(BASE_KEY, {})[curSuite];
  if (runs.length) {
    const opt = runs.map((r, i): [number, string] => [i, `${new Date(r.t).toLocaleString()}${r.seed !== null ? ` 种子${r.seed}` : ''}`]);
    cmpA = Math.min(cmpA, runs.length - 1);
    cmpB = Math.min(cmpB, runs.length - 1);
    const last = runs[0];
    root.append(
      h('h3', null, `运行记录（${runs.length}）`),
      h(
        'div',
        { class: 'row' },
        'F3 导出最近一次',
        btn('CSV', () => void navigator.clipboard?.writeText(toCsv(last)).then(() => ctx.toast('已复制 CSV'))),
        btn('Markdown', () => void navigator.clipboard?.writeText(toMd(last)).then(() => ctx.toast('已复制 Markdown'))),
        btn('F6 设为回归基线', () => {
          const all = load<Record<string, SuiteRun>>(BASE_KEY, {});
          all[curSuite] = last;
          store(BASE_KEY, all);
          ctx.toast('已把最近一次运行设为基线');
          ctx.rerender();
        }),
        btn('清空记录', () => (store(RUN_KEY, load<SuiteRun[]>(RUN_KEY, []).filter((r) => r.suite !== curSuite)), ctx.rerender())),
      ),
      table(
        ['用例', '波次', 'TTK', '承伤', '阵亡', '状态'],
        last.results.map((r) => [r.label, `W${r.wave}`, ttkS(r), String(r.taken), String(r.deaths), h('span', { class: r.status === 'ok' ? 'good' : 'bad' }, r.status)]),
        { numeric: [2, 3, 4] },
      ),
    );
    if (base) root.append(h('h3', null, `F6 与回归基线对比（基线 ${new Date(base.t).toLocaleString()}）`), compare(last, base));
    if (runs.length > 1)
      root.append(
        h('h3', null, 'F2 两次运行对比'),
        h(
          'div',
          { class: 'row' },
          '后',
          select(opt, cmpA, (v) => ((cmpA = Number(v)), ctx.rerender())),
          '前',
          select(opt, cmpB, (v) => ((cmpB = Number(v)), ctx.rerender())),
          '高亮阈值 ±',
          num(threshold, (v) => ((threshold = v), ctx.rerender()), { min: 1, max: 100, width: 46 }),
          '%',
        ),
        compare(runs[cmpA], runs[cmpB]),
      );
    // F5：同一用例（去掉波次）随波次的 TTK 曲线
    const series = new Map<string, Map<number, number>>();
    for (const r of last.results) {
      if (r.ttk === null) continue;
      if (!series.has(r.label)) series.set(r.label, new Map());
      series.get(r.label)!.set(r.wave, r.ttk);
    }
    const waves = [...new Set(last.results.map((r) => r.wave))].sort((a, b) => a - b);
    const COLORS = ['#ff6b5e', '#ffd166', '#52ff8a', '#5ec8ff', '#c08bff', '#ff9ad5'];
    if (waves.length > 1 && series.size)
      root.append(
        h('h3', null, 'F5 TTK 随波次变化（最近一次运行）'),
        lineChart(
          [...series].slice(0, 6).map(([label, m], i) => [label, COLORS[i], waves.map((w) => m.get(w) ?? NaN)]),
          { xLabel: (i) => `W${waves[i]}` },
        ),
      );
  }
  return root;
}
