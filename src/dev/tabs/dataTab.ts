// 数值页（I 模块）：数据表字段临时覆盖 · 覆盖项列表 · 导出补丁 · balance 曲线可视化编辑
import { h, btn, check, select, num, table, fmt } from '../dom';
import type { DevCtx } from '../ctx';
import {
  TABLES,
  overrides,
  numericFields,
  getAt,
  setOverride,
  revertOverride,
  clearOverrides,
  setKeep,
  findOverride,
  exportPatch,
} from '../overrides';
import {
  BALANCE,
  chapterMult,
  growthCurve,
  chapterScale,
  incomeTarget,
  endlessHp,
  dangerMult,
  dangerReward,
  goldReward,
} from '../../data/balance';
import { DANGER_LEVELS, MAX_DANGER } from '../../data/danger';

let tbl = 'weapons';
let rowId = '';
let search = '';
let fieldSearch = '';

/** 小型折线图（SVG），series 每条为 [名称, 颜色, 点列] */
export function lineChart(
  series: [string, string, number[]][],
  opts: { w?: number; h?: number; xLabel?: (i: number) => string } = {},
): SVGSVGElement {
  const W = opts.w ?? 500;
  const H = opts.h ?? 160;
  const pad = 28;
  const all = series.flatMap((s) => s[2]).filter(Number.isFinite);
  const max = Math.max(1e-9, ...all);
  const min = Math.min(0, ...all);
  const n = Math.max(...series.map((s) => s[2].length));
  const x = (i: number) => pad + (i / Math.max(1, n - 1)) * (W - pad - 8);
  const y = (v: number) => H - 16 - ((v - min) / (max - min || 1)) * (H - 26);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));
  svg.setAttribute('class', 'chart');
  const el = (tag: string, attrs: Record<string, string | number>, text?: string) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if (text) e.textContent = text;
    svg.append(e);
    return e;
  };
  el('line', { x1: pad, y1: y(min), x2: W - 8, y2: y(min), stroke: '#6a2e36' });
  el('text', { x: 2, y: y(max) + 4, fill: '#a88f88', 'font-size': 9 }, fmt(max, 2));
  el('text', { x: 2, y: y(min), fill: '#a88f88', 'font-size': 9 }, fmt(min, 2));
  for (let i = 0; i < n; i += Math.max(1, Math.ceil(n / 10)))
    el('text', { x: x(i) - 4, y: H - 3, fill: '#a88f88', 'font-size': 9 }, opts.xLabel ? opts.xLabel(i) : String(i + 1));
  series.forEach(([name, color, pts], si) => {
    el('polyline', {
      points: pts
        .map((v, i) => (Number.isFinite(v) ? `${x(i)},${y(v)}` : ''))
        .filter(Boolean)
        .join(' '),
      fill: 'none',
      stroke: color,
      'stroke-width': 1.6,
    });
    el('text', { x: pad + 4 + si * 90, y: 10, fill: color, 'font-size': 10 }, name);
  });
  return svg;
}

const COLORS = ['#ff6b5e', '#ffd166', '#52ff8a', '#5ec8ff', '#c08bff', '#ff9ad5'];

export function renderData(ctx: DevCtx): HTMLElement {
  const root = h('div');
  const def = TABLES[tbl];
  const ids = Object.keys(def.rows);
  if (!def.rows[rowId]) rowId = ids[0] ?? '';
  const label = (id: string) => {
    const r = def.rows[id] as { name?: string };
    return id ? `${r?.name ?? id}（${id}）` : 'BALANCE';
  };
  const q = search.trim().toLowerCase();
  const shownIds = ids.filter((id) => !q || label(id).toLowerCase().includes(q));

  // ---------------- 编辑 ----------------
  root.append(
    h('h3', null, 'I1 数值覆盖（只改内存，不写源码）'),
    h(
      'div',
      { class: 'row' },
      select(
        Object.entries(TABLES).map(([k, t]) => [k, t.name]),
        tbl,
        (v) => ((tbl = v), (rowId = ''), ctx.rerender()),
      ),
      ids.length > 1
        ? h('input', {
            placeholder: '搜索条目',
            value: search,
            oninput: (e: Event) => ((search = (e.target as HTMLInputElement).value), redraw()),
          })
        : '',
      ids.length > 1
        ? select(
            shownIds.slice(0, 400).map((id) => [id, label(id)]),
            rowId,
            (v) => ((rowId = v), ctx.rerender()),
          )
        : '',
      h('input', {
        placeholder: '筛选字段',
        value: fieldSearch,
        oninput: (e: Event) => ((fieldSearch = (e.target as HTMLInputElement).value), redraw()),
      }),
    ),
  );
  const row = def.rows[rowId];
  const fields = numericFields(row).filter((p) => !fieldSearch || p.join('.').includes(fieldSearch.trim()));
  const grid = h('div', { class: 'grid' });
  for (const p of fields.slice(0, 300)) {
    const ov = findOverride(tbl, rowId, p);
    const v = getAt(row, p) as number;
    grid.append(
      h(
        'label',
        { class: ov ? 'warn' : '', title: ov ? `原值 ${ov.orig}` : '' },
        p.join('.'),
        num(
          v,
          (nv) => {
            const err = setOverride(tbl, rowId, p, nv);
            if (err) ctx.toast(err, true);
            else ctx.toast(`${label(rowId)} · ${p.join('.')} = ${nv}`);
            ctx.changed();
          },
          { step: Math.abs(v) < 2 && !Number.isInteger(v) ? 0.01 : 1, width: 70 },
        ),
      ),
    );
  }
  root.append(
    fields.length ? grid : h('div', { class: 'muted' }, '这个条目没有数字字段'),
    h(
      'div',
      { class: 'muted' },
      '改完自动重启沙盒；武器 / 怪物数值在下一次生成时生效。章节倍率在启动时派生，曲线参数改动只影响下方预览与新算的数值。',
    ),
  );

  // ---------------- 覆盖项列表 ----------------
  root.append(
    h('h3', null, `I2 当前覆盖项（${overrides.list.length}）`),
    h(
      'div',
      { class: 'row' },
      check('刷新页面后保留', overrides.keep, (v) => setKeep(v)),
      btn('全部还原', () => (clearOverrides(), ctx.changed())),
      btn(
        'I3 复制为代码补丁',
        () =>
          void navigator.clipboard
            ?.writeText(exportPatch())
            .then(() => ctx.toast('已复制补丁片段'))
            .catch(() => ctx.toast('复制失败', true)),
        'pri',
      ),
    ),
    overrides.list.length
      ? table(
          ['表', '条目', '字段', '原值', '新值', ''],
          overrides.list.map((o) => [
            TABLES[o.table].name,
            o.id || 'BALANCE',
            o.path.join('.'),
            String(o.orig),
            h('b', { class: o.value > o.orig ? 'good' : 'bad' }, String(o.value)),
            btn('还原', () => (revertOverride(o), ctx.changed())),
          ]),
          { numeric: [3, 4] },
        )
      : h('div', { class: 'muted' }, '还没有覆盖项'),
    overrides.list.length ? h('textarea', { readOnly: true, value: exportPatch(), style: 'min-height:80px' }) : '',
  );

  // ---------------- I4 曲线 ----------------
  const cc = BALANCE.chapterCurve;
  const param = (path: string[], name: string, step: number) =>
    h(
      'label',
      { class: findOverride('balance', '', path) ? 'warn' : '' },
      name,
      h('input', {
        type: 'range',
        min: step < 0.05 ? 0.3 : 1,
        max: step < 0.05 ? 1.5 : 6,
        step,
        value: String(getAt(BALANCE, path)),
        oninput: (e: Event) => {
          setOverride('balance', '', path, Number((e.target as HTMLInputElement).value));
          drawCurves();
        },
        onchange: () => ctx.changed(false),
      }),
      h('span', { class: 'n' }, fmt(getAt(BALANCE, path) as number, 2)),
    );
  const curves = h('div');
  const drawCurves = () => {
    const chs = Array.from({ length: BALANCE.chapterCount }, (_, i) => i + 1);
    const waves = Array.from({ length: BALANCE.waves.count }, (_, i) => i + 1);
    curves.replaceChildren(
      h(
        'div',
        { class: 'grid' },
        param(['chapterCurve', 'hpEnd'], '章节 HP 终点', 0.1),
        param(['chapterCurve', 'dmgEnd'], '章节伤害终点', 0.1),
        param(['chapterCurve', 'bossHpEnd'], 'Boss HP 终点', 0.1),
        param(['enemyGrowthExp'], '血量成长指数', 0.01),
        param(['enemyDmgGrowthExp'], '伤害成长指数', 0.01),
        param(['enemyDmgScale'], '伤害系数', 0.01),
      ),
      h('div', { class: 'muted small' }, '章节倍率（x = 章节）'),
      lineChart(
        [
          ['HP', COLORS[0], chs.map((c) => chapterMult(c, cc.hpEnd))],
          ['伤害', COLORS[1], chs.map((c) => chapterMult(c, cc.dmgEnd))],
          ['Boss HP', COLORS[2], chs.map((c) => chapterMult(c, cc.bossHpEnd))],
        ],
        { h: 130 },
      ),
      h('div', { class: 'muted small' }, '基础 HP 10、成长 0.5 的小怪在各章 1–15 波的血量'),
      lineChart(
        chs.map((c, i) => [
          `第${c}章`,
          COLORS[i % COLORS.length],
          waves.map((w) => growthCurve(10, 0.5, w) * chapterScale(chapterMult(c, cc.hpEnd), w)),
        ]),
      ),
      h('div', { class: 'muted small' }, '每波番茄籽收入目标 · 无尽 HP 复利（16–40 波）'),
      lineChart([['收入', COLORS[3], waves.map(incomeTarget)]], { h: 110 }),
      lineChart([['无尽 HP', COLORS[4], Array.from({ length: 25 }, (_, i) => endlessHp(i + 16))]], {
        h: 110,
        xLabel: (i) => String(i + 16),
      }),
    );
  };
  drawCurves();
  root.append(h('h3', null, 'I4 平衡曲线（拖动滑块实时预览）'), curves);

  // ---------------- H2 危机曲线 ----------------
  const lv = Array.from({ length: MAX_DANGER + 1 }, (_, i) => i);
  root.append(
    h('h3', null, 'H2 危机等级曲线'),
    lineChart(
      [
        ['敌人 HP', COLORS[0], lv.map((l) => dangerMult(l).hp)],
        ['敌人伤害', COLORS[1], lv.map((l) => dangerMult(l).dmg)],
        ['奖励', COLORS[2], lv.map((l) => dangerReward(l))],
      ],
      { xLabel: (i) => String(i) },
    ),
    table(
      ['级', '规则', 'HP', '伤害', '奖励', '金番茄（通关 W15）'],
      lv.slice(1).map((l) => {
        const d = DANGER_LEVELS[l - 1];
        const m = dangerMult(l);
        return [
          String(l),
          `${d.icon} ${d.name[0]}：${d.desc[0]}`,
          `×${fmt(m.hp, 2)}`,
          `×${fmt(m.dmg, 2)}`,
          `×${fmt(m.reward, 2)}`,
          String(goldReward(15, l, false, true)),
        ];
      }),
      { numeric: [2, 3, 4, 5] },
    ),
  );

  function redraw(): void {
    const el = renderData(ctx);
    root.replaceWith(el);
    const inp = el.querySelectorAll('input');
    // 保持输入框焦点（搜索时）
    for (const i of inp) if ((i.value === search && search) || (i.value === fieldSearch && fieldSearch)) i.focus();
  }
  return root;
}
