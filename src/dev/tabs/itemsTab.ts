// 道具页：所有道具的稀有度 / 效果 / 价格 / 持有上限，一键免费加入构筑（遵守上限）
import { h, btn, select, table } from '../dom';
import type { DevCtx } from '../ctx';
import { ALL_ITEMS, ITEM_MAP, type ItemDef } from '../../data/items';
import { RARITY } from '../../data/balance';
import { describeItem } from '../../data/describe';
import { itemPrice } from '../build';

// 页签筛选状态（模块级，不放进 UiState）
let search = '';
let rarity = -1; // -1 = 全部
let ownedOnly = false;
let sort = 2; // 列号 + 1，负数降序；默认按稀有度升序

const HEAD = ['道具', 'id', '稀有度', '效果', '基础价', '当前售价', '上限', '持有', ''];

export function renderItems(ctx: DevCtx): HTMLElement {
  const b = ctx.build;
  const root = h('div');

  // ---------------- 持有汇总 ----------------
  const owned = Object.entries(b.items).filter(([id, n]) => ITEM_MAP[id] && n > 0);
  const total = owned.reduce((a, [, n]) => a + n, 0);
  const byRarity = RARITY.map((_, r) => owned.filter(([id]) => ITEM_MAP[id].rarity === r).reduce((a, [, n]) => a + n, 0));
  root.append(
    h('h3', null, `当前构筑持有道具（${owned.length} 种 / ${total} 件）`),
    h(
      'div',
      { class: 'row muted' },
      ...RARITY.map((r, i) => h('span', { style: `color:${r.css}` }, `${r.name} ${byRarity[i]}`)),
      owned.length
        ? btn(
            '清空道具',
            () => {
              b.items = {};
              ctx.changed();
              ctx.toast('已清空构筑中的全部道具');
            },
            '',
            '移除构筑中的全部道具（不退款）',
          )
        : '',
    ),
  );
  if (!owned.length) root.append(h('div', { class: 'muted' }, '无'));
  else
    root.append(
      h(
        'div',
        null,
        ...owned
          .sort((x, y) => ITEM_MAP[y[0]].rarity - ITEM_MAP[x[0]].rarity || ITEM_MAP[x[0]].name.localeCompare(ITEM_MAP[y[0]].name))
          .map(([id, n]) => {
            const it = ITEM_MAP[id];
            return h(
              'span',
              { class: 'tag', title: describeItem(it).join('，') },
              h('span', { style: `color:${RARITY[it.rarity].css}` }, it.name),
              n > 1 ? ` ×${n}` : '',
              it.max ? h('span', { class: 'muted' }, `/${it.max}`) : '',
            );
          }),
      ),
    );

  // ---------------- 筛选 ----------------
  const input = h('input', {
    placeholder: '搜索名称 / id / 效果',
    value: search,
    onchange: () => {
      search = input.value;
      ctx.rerender();
    },
  });
  root.append(
    h('h3', null, `全部道具（${ALL_ITEMS.length}）`),
    h(
      'div',
      { class: 'row' },
      input,
      select(
        [[-1, '全部稀有度'], ...RARITY.map((r, i): [number, string] => [i, r.name])],
        rarity,
        (v) => ((rarity = Number(v)), ctx.rerender()),
      ),
      h(
        'label',
        { class: 'chk' },
        h('input', {
          type: 'checkbox',
          checked: ownedOnly,
          onchange: (e: Event) => ((ownedOnly = (e.target as HTMLInputElement).checked), ctx.rerender()),
        }),
        '只看已持有',
      ),
    ),
    h(
      'div',
      { class: 'muted' },
      '「加入构筑」免费添加 1 个（不计花费、不记账，遵守持有上限）；「-1」移除 1 个（不退款）。当前售价按构筑波次与已有折扣计算。点表头排序。',
    ),
  );

  // ---------------- 列表 ----------------
  const q = search.trim().toLowerCase();
  const rows = ALL_ITEMS.filter((it) => {
    if (rarity >= 0 && it.rarity !== rarity) return false;
    if (ownedOnly && !b.items[it.id]) return false;
    if (!q) return true;
    return it.name.toLowerCase().includes(q) || it.id.toLowerCase().includes(q) || describeItem(it).join(' ').toLowerCase().includes(q);
  }).map((it) => ({ it, desc: describeItem(it), price: itemPrice(b, it), n: b.items[it.id] ?? 0 }));

  type Row = (typeof rows)[number];
  const keyOf: ((r: Row) => number | string)[] = [
    (r) => r.it.name,
    (r) => r.it.id,
    (r) => r.it.rarity,
    (r) => r.desc.join('，'),
    (r) => r.it.price,
    (r) => r.price,
    (r) => r.it.max ?? Infinity,
    (r) => r.n,
    () => 0,
  ];
  const col = Math.min(keyOf.length - 1, Math.abs(sort) - 1);
  const dir = sort > 0 ? 1 : -1;
  rows.sort((a, b2) => {
    const x = keyOf[col](a),
      y = keyOf[col](b2);
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
    return c * dir || a.it.name.localeCompare(b2.it.name);
  });

  root.append(
    table(
      HEAD,
      rows.map(({ it, desc, price, n }) => {
        const full = !!it.max && n >= it.max;
        const add = btn(
          full ? '已满' : '加入构筑',
          () => addItem(ctx, it),
          '',
          it.max ? `免费加入 1 个（上限 ${it.max}）` : '免费加入 1 个',
        );
        add.disabled = full;
        const sub = btn('-1', () => removeItem(ctx, it), '', '移除 1 个（不退款）');
        sub.disabled = n <= 0;
        return [
          h('span', { class: 'nw', style: `color:${RARITY[it.rarity].css}`, title: it.series ? `系列：${it.series}` : '' }, it.name),
          h('span', { class: 'muted small' }, it.id),
          h('span', { class: 'nw', style: `color:${RARITY[it.rarity].css}` }, RARITY[it.rarity].name),
          h('span', { class: 'small' }, desc.join('，') || h('span', { class: 'muted' }, '—')),
          String(it.price),
          String(price),
          it.max ? String(it.max) : h('span', { class: 'muted' }, '∞'),
          n ? h('b', { class: full ? 'warn' : 'good' }, String(n)) : h('span', { class: 'muted' }, '0'),
          h('span', { class: 'nw' }, add, sub),
        ];
      }),
      {
        sort,
        numeric: [4, 5, 6, 7],
        onSort: (i) => {
          sort = Math.abs(sort) - 1 === i ? -sort : i + 1;
          ctx.rerender();
        },
      },
    ),
  );
  if (!rows.length) root.append(h('div', { class: 'muted' }, '没有符合条件的道具'));
  return root;
}

/** 免费加入 1 个（不扣钱、不记账），遵守 max 上限 */
function addItem(ctx: DevCtx, it: ItemDef): void {
  const b = ctx.build;
  const n = b.items[it.id] ?? 0;
  if (it.max && n >= it.max) {
    ctx.toast(`${it.name} 已达持有上限 ${it.max}`, true);
    return;
  }
  b.items[it.id] = n + 1;
  ctx.changed();
  ctx.toast(`已加入构筑（免费）：${it.name} ×${n + 1}`);
}

function removeItem(ctx: DevCtx, it: ItemDef): void {
  const b = ctx.build;
  const n = b.items[it.id] ?? 0;
  if (n <= 0) return;
  if (n <= 1) delete b.items[it.id];
  else b.items[it.id] = n - 1;
  ctx.changed();
  ctx.toast(`已移除：${it.name}（剩 ${n - 1}）`);
}
