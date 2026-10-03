// 状态效果页：所有 buff / debuff 的每层数值、叠层上限、描述；可直接施加给玩家或离玩家最近的目标
import { h, btn, select, num, table, fmt, hex } from '../dom';
import type { DevCtx } from '../ctx';
import { STATUSES, type StatusDef, type StatusId, type StatusApply } from '../../data/statuses';
import type { Tracked } from '../sandbox';

// 页签筛选 / 施加参数（模块级，不放进 UiState）
let search = '';
let kind: '' | 'buff' | 'debuff' = '';
let sort = 0; // 0 = 定义顺序；否则列号 + 1，负数降序
let dur = 5; // 施加持续时间（秒）
let stacks = 1; // 每次施加层数
let value = 0; // value 字段：护盾值 / 覆盖每层持续伤害（0 = 不填）

const HEAD = ['状态', '类型', '叠层上限', '每层效果', '描述', '玩家', '目标', ''];

/** 每层数值 → 文字 */
function effectText(d: StatusDef): string {
  const pct = (v: number | undefined, name: string) => (v ? `${name} ${v > 0 ? '+' : ''}${fmt(v)}%` : '');
  const flat = (v: number | undefined, name: string) => (v ? `${name} ${v > 0 ? '+' : ''}${fmt(v)}` : '');
  return [
    d.dps ? `持续伤害 ${fmt(d.dps)}/秒` : '',
    pct(d.speed, '移速'),
    pct(d.attackSpeed, '攻速'),
    pct(d.dmgDealt, '造成伤害'),
    pct(d.dmgTaken, '受到伤害'),
    flat(d.armor, '护甲'),
    pct(d.crit, '暴击'),
    pct(d.dodge, '闪避'),
    pct(d.range, '射程'),
    flat(d.luck, '幸运'),
    pct(d.lifeSteal, '吸血'),
    d.regen ? `回复 ${fmt(d.regen)}/秒` : '',
    d.reflect ? `反弹 ${fmt(d.reflect)}` : '',
    d.disable ? '无法行动' : '',
    d.noHeal ? '无法回复' : '',
    d.noAttack ? '无法攻击' : '',
    d.confuse ? '方向紊乱' : '',
    d.immune ? '免疫伤害' : '',
  ]
    .filter(Boolean)
    .join('，');
}

/** 离玩家最近的存活目标 */
function nearestTarget(ctx: DevCtx): Tracked | null {
  const sb = ctx.sb;
  const p = sb.g.player;
  if (!p) return null;
  let best: Tracked | null = null;
  let bd = Infinity;
  for (const t of sb.tracked) {
    if (!sb.isAlive(t)) continue;
    const d = (t.e.x - p.x) ** 2 + (t.e.y - p.y) ** 2;
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best;
}

function mkApply(id: StatusId): StatusApply {
  const a: StatusApply = { id, dur, stacks };
  if (value > 0) a.value = value;
  return a;
}

function applyToPlayer(ctx: DevCtx, d: StatusDef): void {
  const sb = ctx.sb;
  if (!sb.running) return ctx.toast('沙盒未运行', true);
  const g = sb.g;
  const before = g.pstatus.stacks(d.id);
  g.applyPlayerStatus([mkApply(d.id)]);
  const after = g.pstatus.stacks(d.id);
  if (g.pstatus.has(d.id) && (after > before || before > 0)) ctx.toast(`玩家获得 ${d.name}（${after} 层）`);
  else ctx.toast(`${d.name} 未生效（波次结束 / 无敌免疫减益 / 控制免疫期）`, true);
  ctx.rerender();
}

function applyToTarget(ctx: DevCtx, d: StatusDef): void {
  if (!ctx.sb.running) return ctx.toast('沙盒未运行', true);
  const t = nearestTarget(ctx);
  if (!t) return ctx.toast('没有存活的目标（先在怪物页生成）', true);
  const ok = t.e.status.apply(mkApply(d.id));
  if (ok) ctx.toast(`${t.label} 获得 ${d.name}（${t.e.status.stacks(d.id)} 层）`);
  else ctx.toast(`${t.label} 未获得 ${d.name}（控制抗性 / 免疫）`, true);
  ctx.rerender();
}

export function renderStatus(ctx: DevCtx): HTMLElement {
  const sb = ctx.sb;
  const running = sb.running;
  const root = h('div');
  const target = running ? nearestTarget(ctx) : null;

  // ---------------- 施加参数 ----------------
  const input = h('input', {
    placeholder: '搜索名称 / id / 描述',
    value: search,
    onchange: () => {
      search = input.value;
      ctx.rerender();
    },
  });
  root.append(
    h('h3', null, '施加参数'),
    h(
      'div',
      { class: 'row' },
      '持续时间',
      num(dur, (v) => ((dur = v), ctx.rerender()), { min: 0.1, max: 600, step: 0.5, width: 60 }),
      '秒 · 层数',
      num(stacks, (v) => ((stacks = Math.round(v)), ctx.rerender()), { min: 1, max: 99, width: 48 }),
      'value',
      num(value, (v) => ((value = v), ctx.rerender()), { min: 0, max: 99999, step: 1, width: 64 }),
      h('span', { class: 'muted small' }, '（护盾值 / 覆盖每层持续伤害，0 = 不填）'),
    ),
    h(
      'div',
      { class: running ? 'muted' : 'warn' },
      running
        ? `最近目标：${target ? `${target.label} HP ${Math.ceil(target.e.hp)}/${target.e.maxHp}` : '无（先在怪物页生成）'}。` +
            '玩家施加走 GameScene.applyPlayerStatus（控制类最长 0.8 秒并有 1.5 秒免疫、无敌时跳过减益）；' +
            '目标施加走 Enemy.status.apply（精英 / Boss 有控制抗性）。层数不超过叠层上限。'
        : '沙盒未运行，施加按钮已禁用。',
    ),
    h(
      'div',
      { class: 'row' },
      input,
      select(
        [
          ['', '全部'],
          ['buff', '增益'],
          ['debuff', '减益'],
        ],
        kind,
        (v) => ((kind = v as typeof kind), ctx.rerender()),
      ),
      running
        ? btn('清除玩家全部状态', () => {
            sb.g.pstatus.clear();
            ctx.toast('已清除玩家全部状态');
            ctx.rerender();
          })
        : '',
      running && target
        ? btn('清除目标全部状态', () => {
            target.e.status.clear();
            ctx.toast(`已清除 ${target.label} 的全部状态`);
            ctx.rerender();
          })
        : '',
    ),
  );

  // ---------------- 列表 ----------------
  const q = search.trim().toLowerCase();
  const defs = Object.values(STATUSES).filter((d) => {
    if (kind && d.kind !== kind) return false;
    if (!q) return true;
    return d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q);
  });
  const rows = defs.map((d) => ({
    d,
    eff: effectText(d),
    p: running ? sb.g.pstatus.get(d.id) : undefined,
    t: target?.e.status.get(d.id),
  }));
  type Row = (typeof rows)[number];
  const keyOf: ((r: Row) => number | string)[] = [
    (r) => r.d.name,
    (r) => r.d.kind,
    (r) => r.d.maxStacks,
    (r) => r.eff,
    (r) => r.d.desc,
    (r) => r.p?.stacks ?? 0,
    (r) => r.t?.stacks ?? 0,
    () => 0,
  ];
  if (sort) {
    const col = Math.min(keyOf.length - 1, Math.abs(sort) - 1);
    const dir = sort > 0 ? 1 : -1;
    rows.sort((a, b) => {
      const x = keyOf[col](a),
        y = keyOf[col](b);
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }
  const cur = (e: Row['p']) =>
    e ? h('span', { class: 'nw good' }, `${e.stacks}层 ${e.t.toFixed(1)}s`) : h('span', { class: 'muted' }, '—');

  root.append(
    table(
      HEAD,
      rows.map((r) => {
        const { d } = r;
        const toP = btn('施加给玩家', () => applyToPlayer(ctx, d));
        toP.disabled = !running;
        const toT = btn('施加给最近的目标', () => applyToTarget(ctx, d), '', target ? target.label : '没有存活的目标');
        toT.disabled = !running || !target;
        return [
          h(
            'span',
            { class: 'nw', title: d.id },
            h('span', { class: 'tag', style: `color:${hex(d.color)}` }, d.glyph),
            h('span', { style: `color:${hex(d.color)}` }, d.name),
            h('span', { class: 'muted small' }, ` ${d.id}`),
          ),
          h('span', { class: d.kind === 'buff' ? 'good' : 'bad' }, d.kind === 'buff' ? '增益' : '减益'),
          String(d.maxStacks),
          h('span', { class: 'small' }, r.eff || h('span', { class: 'muted' }, '—')),
          h('span', { class: 'muted small' }, d.desc),
          cur(r.p),
          cur(r.t),
          h('span', { class: 'nw' }, toP, toT),
        ];
      }),
      {
        sort: sort || undefined,
        numeric: [2],
        onSort: (i) => {
          sort = Math.abs(sort) - 1 === i ? -sort : i + 1;
          ctx.rerender();
        },
      },
    ),
  );
  if (!rows.length) root.append(h('div', { class: 'muted' }, '没有符合条件的状态'));
  root.append(
    h(
      'div',
      { class: 'muted small' },
      `数值为每层效果（共 ${Object.keys(STATUSES).length} 种）；「玩家 / 目标」列为刷新页签时的层数与剩余时间。持续时间由施加方决定（状态定义本身无默认时长），上方参数统一设定。`,
    ),
  );
  return root;
}
