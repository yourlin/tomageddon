// 怪物页扩展（D1–D5、D7、D8）：场上目标实时编辑、Boss 阶段控制、招式时间轴、词缀预设、
// 全类别筛选、刷怪池概率图、强度热力图（击杀所需秒数）
import { h, btn, check, select, num, fmt } from '../dom';
import type { DevCtx } from '../ctx';
import type { Tracked } from '../sandbox';
import { CHAPTERS } from '../../data/chapters';
import { ENEMIES, ENEMY_MAP, type EnemyBehavior } from '../../data/enemies';
import { BOSSES, AFFIXES, AFFIX_IDS, type AffixId, type PatternType } from '../../data/bosses';
import { WEAPON_MAP } from '../../data/weapons';
import { run } from '../../systems/RunState';
import { weaponCalc, PATTERN_NAME, BEHAVIOR_NAME } from '../info';
import { setOverride } from '../overrides';

// ---------------- D5 全类别 ----------------
export const allFilter = { chapter: 0, behavior: '' as '' | EnemyBehavior, pattern: '' as '' | PatternType, kind: '' as '' | 'minion' | 'elite' | 'boss' };

export interface AllRow {
  sel: string;
  id: string;
  boss: boolean;
  name: string;
  chapter: number;
  kind: 'minion' | 'elite' | 'boss';
}
/** 所有章节的小怪 + 精英 + Boss（小怪的章节取首次出现的刷怪池） */
export function allMonsters(q = ''): AllRow[] {
  const firstCh: Record<string, number> = {};
  for (const ch of CHAPTERS) for (const p of ch.pool) firstCh[p.enemy] ??= ch.id;
  const f = allFilter;
  const ok = (name: string, id: string) => !q || name.toLowerCase().includes(q) || id.includes(q);
  const minions: AllRow[] = ENEMIES.filter(
    (d) => (!f.behavior || d.behavior === f.behavior) && !f.pattern && (!f.kind || f.kind === 'minion') && ok(d.name, d.id),
  ).map((d) => ({ sel: d.id, id: d.id, boss: false, name: d.name, chapter: firstCh[d.id] ?? 0, kind: 'minion' }));
  const bosses: AllRow[] = BOSSES.filter(
    (b) =>
      !f.behavior &&
      (!f.pattern || b.patterns.some((p) => p.type === f.pattern) || !!b.phase2?.add.some((p) => p.type === f.pattern)) &&
      (!f.kind || f.kind === (b.elite ? 'elite' : 'boss')) &&
      ok(b.name, b.id),
  ).map((b) => ({ sel: 'b:' + b.id, id: b.id, boss: true, name: b.name, chapter: b.chapter, kind: b.elite ? 'elite' : 'boss' }));
  return [...minions, ...bosses].filter((r) => !f.chapter || r.chapter === f.chapter);
}

export function allFilters(ctx: DevCtx): HTMLElement {
  const f = allFilter;
  return h(
    'div',
    { class: 'row' },
    select(
      [[0, '全部章节'], ...CHAPTERS.map((c): [number, string] => [c.id, `第${c.id}章`])],
      f.chapter,
      (v) => ((f.chapter = Number(v)), ctx.rerender()),
    ),
    select(
      [
        ['', '全部类型'],
        ['minion', '小怪'],
        ['elite', '精英'],
        ['boss', 'Boss'],
      ],
      f.kind,
      (v) => ((f.kind = v as typeof f.kind), ctx.rerender()),
    ),
    select(
      [['', '任意行为'], ...Object.entries(BEHAVIOR_NAME)] as [string, string][],
      f.behavior,
      (v) => ((f.behavior = v as typeof f.behavior), ctx.rerender()),
    ),
    select(
      [['', '任意招式'], ...Object.entries(PATTERN_NAME)] as [string, string][],
      f.pattern,
      (v) => ((f.pattern = v as typeof f.pattern), ctx.rerender()),
    ),
  );
}

// ---------------- D1 / D2 / D3 场上目标 ----------------
const LIVE_FIELDS: [keyof Tracked['e'] & string, string][] = [
  ['hp', '当前生命'],
  ['maxHp', '最大生命'],
  ['dmg', '伤害'],
  ['speed', '速度'],
  ['radius', '半径'],
  ['knockResist', '抗击退'],
];

export function liveEditor(ctx: DevCtx, t: Tracked): HTMLElement {
  const e = t.e;
  const sb = ctx.sb;
  const box = h('div', { class: 'box' });
  const rec = e as unknown as Record<string, number>;
  box.append(
    h('b', null, 'D1 场上目标实时编辑（只改这一只，不改数据表）'),
    h(
      'div',
      { class: 'grid' },
      ...LIVE_FIELDS.map(([k, name]) =>
        h(
          'label',
          null,
          name,
          num(Math.round(rec[k] * 100) / 100, (v) => ((rec[k] = v), k === 'maxHp' && e.hp > v && (e.hp = v), ctx.rerender()), {
            width: 70,
            step: k === 'knockResist' ? 0.05 : 1,
          }),
        ),
      ),
    ),
  );
  if (t.boss && e.boss) {
    const b = e.boss;
    const setPct = (p: number) => {
      e.hp = Math.max(1, Math.round(e.maxHp * p));
      ctx.rerender();
    };
    box.append(
      h('b', null, 'D2 阶段控制'),
      h(
        'div',
        { class: 'row' },
        '血量',
        ...[0.9, 0.75, 0.5, 0.3, 0.1].map((p) => btn(`${p * 100}%`, () => setPct(p))),
        b.phase2 && !e.phase2 ? btn(`进入二阶段（≤${Math.round(b.phase2.at * 100)}%）`, () => (sb.phase2(t), ctx.rerender()), 'pri') : '',
        e.phase2 ? h('span', { class: 'warn' }, '已在二阶段') : '',
        e.enraged
          ? h('span', { class: 'bad' }, '狂暴中')
          : btn('触发狂暴', () => {
              e.enraged = true;
              e.status.apply({ id: 'enrage', dur: 999 });
              ctx.rerender();
            }, '', '与 Boss 波倒计时结束相同：冷却减半、附加狂暴状态'),
      ),
    );
    // D3：招式时间轴
    const cdMult = (e.phase2 && b.phase2 ? b.phase2.cdMult : 1) * (e.enraged ? 0.5 : 1);
    const NS = 'http://www.w3.org/2000/svg';
    const W = 480;
    const rowH = 16;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(e.patterns.length * rowH + 4));
    svg.setAttribute('class', 'chart');
    e.patterns.forEach((p, i) => {
      const full = p.cd * cdMult;
      const left = Math.max(0, e.patternT[i] ?? 0);
      const frac = full > 0 ? 1 - left / full : 1;
      const y = i * rowH + 2;
      const bg = document.createElementNS(NS, 'rect');
      bg.setAttribute('x', '130');
      bg.setAttribute('y', String(y));
      bg.setAttribute('width', String(W - 200));
      bg.setAttribute('height', '11');
      bg.setAttribute('fill', '#2a1216');
      const fg = document.createElementNS(NS, 'rect');
      fg.setAttribute('x', '130');
      fg.setAttribute('y', String(y));
      fg.setAttribute('width', String((W - 200) * Math.min(1, frac)));
      fg.setAttribute('height', '11');
      fg.setAttribute('fill', left < 0.6 ? '#ff3b30' : '#ffd166');
      const tx = document.createElementNS(NS, 'text');
      tx.setAttribute('x', '2');
      tx.setAttribute('y', String(y + 10));
      tx.setAttribute('fill', '#f3e6e0');
      tx.setAttribute('font-size', '10');
      tx.textContent = `${i + 1}. ${PATTERN_NAME[p.type] ?? p.type}`;
      const tv = document.createElementNS(NS, 'text');
      tv.setAttribute('x', String(W - 64));
      tv.setAttribute('y', String(y + 10));
      tv.setAttribute('fill', '#a88f88');
      tv.setAttribute('font-size', '10');
      tv.textContent = `${left.toFixed(1)}/${full.toFixed(1)}s`;
      svg.append(bg, fg, tx, tv);
    });
    box.append(
      h('b', null, `D3 招式时间轴（冷却倍率 ×${fmt(cdMult, 2)}）`),
      svg,
      h(
        'div',
        { class: 'row' },
        btn('刷新', () => ctx.rerender()),
        h('span', { class: 'muted' }, '红色 = 0.6 秒内出招。招式冷却可在「数值」页的精英 / Boss 表里改 patterns.N.cd，下面也可以直接改：'),
      ),
      h(
        'div',
        { class: 'grid' },
        ...b.patterns.map((p, i) =>
          h(
            'label',
            null,
            `${i + 1}.${PATTERN_NAME[p.type]} CD`,
            num(p.cd, (v) => (setOverride('bosses', b.id, ['patterns', String(i), 'cd'], v), ctx.toast(`已覆盖 ${b.name} 招式 ${i + 1} 冷却 = ${v}`), ctx.rerender()), {
              width: 54,
              step: 0.1,
            }),
          ),
        ),
      ),
    );
  }
  return box;
}

// ---------------- D4 词缀预设 ----------------
const AFFIX_KEY = 'tomageddon_dev_affix_presets';
const loadAffixPresets = (): Record<string, AffixId[]> => {
  try {
    return JSON.parse(localStorage.getItem(AFFIX_KEY) ?? '{}') as Record<string, AffixId[]>;
  } catch {
    return {};
  }
};
let affixName = '';
export function affixPresets(ctx: DevCtx): HTMLElement {
  const sp = ctx.ui.spawn;
  const all = loadAffixPresets();
  const name = h('input', { placeholder: '词缀组合名', value: affixName, oninput: () => (affixName = name.value), style: 'width:110px' });
  const use = (list: AffixId[]) => {
    ctx.ui.affixMode = 'pick';
    sp.affixes = [...list];
    ctx.rerender();
  };
  return h(
    'div',
    { class: 'row' },
    'D4 词缀组合',
    btn('全词缀（压力测试）', () => use(AFFIX_IDS), 'hot', AFFIX_IDS.map((a) => AFFIXES[a].name).join('、')),
    ...Object.entries(all).map(([k, list]) =>
      h(
        'span',
        { class: 'tag', title: list.map((a) => AFFIXES[a].name).join('、') },
        h('a', { onclick: () => use(list) }, k),
        ' ',
        h(
          'a',
          {
            onclick: () => {
              delete all[k];
              localStorage.setItem(AFFIX_KEY, JSON.stringify(all));
              ctx.rerender();
            },
          },
          '×',
        ),
      ),
    ),
    name,
    btn('保存当前组合', () => {
      if (!affixName.trim() || !sp.affixes?.length) return ctx.toast('先选「指定词缀」并勾选，再填名称', true);
      all[affixName.trim()] = [...sp.affixes];
      localStorage.setItem(AFFIX_KEY, JSON.stringify(all));
      ctx.rerender();
    }),
  );
}

// ---------------- D7 刷怪池概率 ----------------
const POOL_COLORS = ['#ff6b5e', '#ffd166', '#52ff8a', '#5ec8ff', '#c08bff', '#ff9ad5', '#ff9f1c', '#7fffd4', '#d4a373', '#a0a0ff', '#e0e0e0', '#8fbc8f'];
export function poolChart(chapterId: number): HTMLElement {
  const ch = CHAPTERS[chapterId - 1];
  const ids = [...new Set(ch.pool.map((p) => p.enemy))];
  const waves = Array.from({ length: 20 }, (_, i) => i + 1);
  const box = h('div');
  const legend = h(
    'div',
    { class: 'row small' },
    ...ids.map((id, i) => h('span', { style: `color:${POOL_COLORS[i % POOL_COLORS.length]}` }, `■ ${ENEMY_MAP[id]?.name ?? id}`)),
  );
  const grid = h('div', { style: 'display:flex;gap:2px;align-items:flex-end;height:120px' });
  for (const w of waves) {
    const act = ch.pool.filter((p) => w >= p.from && (!p.to || w <= p.to));
    const tot = act.reduce((a, p) => a + p.weight, 0) || 1;
    const col = h('div', { style: 'flex:1;display:flex;flex-direction:column-reverse;height:100%', title: `W${w}` });
    for (const p of act) {
      const i = ids.indexOf(p.enemy);
      col.append(
        h('div', {
          style: `height:${(p.weight / tot) * 100}%;background:${POOL_COLORS[i % POOL_COLORS.length]}`,
          title: `W${w} ${ENEMY_MAP[p.enemy]?.name}：${fmt((p.weight / tot) * 100)}%`,
        }),
      );
    }
    grid.append(col);
  }
  box.append(
    h('h3', null, `D7 刷怪池概率（${ch.name}，W1–W20，悬停看百分比）`),
    grid,
    h('div', { class: 'row small muted', style: 'justify-content:space-between' }, 'W1', 'W10', 'W20'),
    legend,
  );
  return box;
}

// ---------------- D8 热力图 ----------------
/** 当前构筑的合计单体期望 DPS（用于估算击杀秒数） */
export function buildDps(): number {
  return run.weapons.reduce((a, w) => a + weaponCalc(WEAPON_MAP[w.id], w.tier).dps, 0);
}
export let heatMode: 'raw' | 'ttk' = 'ttk';
export const setHeatMode = (m: 'raw' | 'ttk'): void => {
  heatMode = m;
};
export function heatColor(sec: number): string {
  // 0.5 秒 → 绿，3 秒 → 黄，10 秒以上 → 红（对数插值）
  const t = Math.min(1, Math.max(0, Math.log(Math.max(0.01, sec) / 0.5) / Math.log(20)));
  const r = Math.round(t < 0.5 ? 82 + (255 - 82) * t * 2 : 255);
  const g = Math.round(t < 0.5 ? 255 - (255 - 209) * t * 2 : 209 - (209 - 59) * (t - 0.5) * 2);
  const b = Math.round(t < 0.5 ? 138 - (138 - 102) * t * 2 : 102 - (102 - 48) * (t - 0.5) * 2);
  return `rgb(${r},${g},${b})`;
}
export function heatToggle(ctx: DevCtx): HTMLElement {
  return h(
    'span',
    null,
    check('热力图：按当前构筑击杀所需秒数着色', heatMode === 'ttk', (v) => (setHeatMode(v ? 'ttk' : 'raw'), ctx.rerender())),
    h('span', { class: 'muted' }, ` 构筑合计单体 DPS ${Math.round(buildDps())}`),
  );
}
