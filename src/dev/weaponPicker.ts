// 可视化武器选择器：当前武器卡片 + 展开后的图标网格，可按标签（多选取交集）和名称筛选。
// 筛选只重画网格，不触发整页 rerender，搜索框不会丢焦点；选中后才回调 onPick。
import { h, btn, chip } from './dom';
import type { DevCtx } from './ctx';
import { WEAPON_MAP, type WeaponDef } from '../data/weapons';
import { TAGS, TAG_MAP, weaponTags, type TagKind } from '../data/weaponTags';
import { weaponIcon } from './thumbs';

export type WeaponCat = '' | 'base' | 'fused' | 'super';

export interface PickerState {
  open: boolean;
  q: string;
  tags: Set<string>;
  /** 类别筛选：'' 全部；超武可以单独看 */
  cat: WeaponCat;
}

export const pickerState = (): PickerState => ({ open: false, q: '', tags: new Set(), cat: '' });

/** 超武 = 进化武器（evolvedFrom）；T4 合成 = 配方融合武器（只在 T4 出现）；其余为基础武器 */
export const weaponCat = (d: WeaponDef): Exclude<WeaponCat, ''> => (d.evolvedFrom ? 'super' : (d.minTier ?? 0) >= 3 ? 'fused' : 'base');
const CAT_NAME: Record<WeaponCat, string> = { '': '全部', base: '基础武器', fused: 'T4 合成', super: '✨超武' };

const KIND_NAME: Record<TagKind, string> = { theme: '主题', element: '元素', mechanic: '机制', type: '类型' };
const KIND_ORDER: TagKind[] = ['theme', 'element', 'mechanic', 'type'];

const tagText = (t: string): string => `${TAG_MAP[t]?.icon ?? ''}${t}`;

function matches(d: WeaponDef, st: PickerState): boolean {
  if (st.cat && weaponCat(d) !== st.cat) return false;
  const tags = weaponTags(d);
  for (const t of st.tags) if (!tags.includes(t)) return false;
  const q = st.q.trim().toLowerCase();
  return !q || `${d.name}${d.id}${tags.join('')}`.toLowerCase().includes(q);
}

export function weaponPicker(
  ctx: DevCtx,
  st: PickerState,
  value: string,
  onPick: (id: string) => void,
  list: WeaponDef[] = Object.values(WEAPON_MAP),
): HTMLElement {
  const game = ctx.sb.game;
  const cur = WEAPON_MAP[value];

  const head = h(
    'div',
    { style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap' },
    weaponIcon(game, value, 36),
    h('b', null, `${cur?.evolvedFrom ? '✨' : ''}${cur?.name ?? value}`),
    h('span', { class: 'muted small' }, cur ? weaponTags(cur).map(tagText).join(' ') : ''),
    btn(st.open ? '收起 ▴' : '选择武器 ▾', () => ((st.open = !st.open), ctx.rerender())),
  );
  if (!st.open) return h('div', { style: 'margin:4px 0' }, head);

  // 只列出这批武器里实际出现过的标签，并标出各自的武器数
  const count = new Map<string, number>();
  for (const d of list) for (const t of weaponTags(d)) count.set(t, (count.get(t) ?? 0) + 1);

  const grid = h('div', { class: 'cgrid', style: 'max-height:420px;overflow:auto' });
  const stat = h('span', { class: 'muted small' });
  const draw = () => {
    const shown = list.filter((d) => matches(d, st));
    stat.textContent = `${shown.length} / ${list.length} 把`;
    grid.replaceChildren(
      ...(shown.length
        ? shown.map((d) => {
            const pick = () => {
              st.open = false;
              onPick(d.id);
            };
            return h(
              'a',
              {
                class: d.id === value ? 'on' : '',
                role: 'button',
                tabindex: 0,
                title: `${d.name}\n${weaponTags(d).map(tagText).join(' ')}${d.desc ? `\n${d.desc}` : ''}`,
                onclick: pick,
                onkeydown: (e: KeyboardEvent) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  pick();
                },
              },
              weaponIcon(game, d.id, 44),
              h('div', { class: 'small' }, `${d.evolvedFrom ? '✨' : ''}${d.name}`),
            );
          })
        : [h('div', { class: 'muted small' }, '没有同时带这些标签的武器')]),
    );
  };

  const search = h('input', { type: 'search', placeholder: '搜索名称或标签', value: st.q, style: 'min-width:160px' });
  search.addEventListener('input', () => ((st.q = search.value), draw()));

  const groups = KIND_ORDER.map((k) => {
    const tags = TAGS.filter((t) => t.kind === k && count.has(t.id));
    if (!tags.length) return null;
    return h(
      'div',
      { style: 'display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:4px' },
      h('span', { class: 'muted small', style: 'width:2.5em' }, KIND_NAME[k]),
      ...tags.map((t) =>
        chip(
          `${tagText(t.id)} ${count.get(t.id)}`,
          st.tags.has(t.id),
          (on) => (on ? st.tags.add(t.id) : st.tags.delete(t.id), draw()),
          `只看带「${t.id}」标签的武器（多选取交集）`,
        ),
      ),
    );
  });

  const tools = h(
    'div',
    { style: 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px' },
    search,
    btn('清除筛选', () => {
      st.q = '';
      st.tags.clear();
      st.cat = '';
      ctx.rerender();
    }),
    stat,
  );

  // 类别：单选（超武可以单独看）
  const catCount = { '': list.length, base: 0, fused: 0, super: 0 } as Record<WeaponCat, number>;
  for (const d of list) catCount[weaponCat(d)]++;
  const catBtns = (['', 'base', 'fused', 'super'] as WeaponCat[]).map((c) => {
    const b = h(
      'button',
      { class: st.cat === c ? 'chip on' : 'chip', 'aria-pressed': String(st.cat === c), title: `只看${CAT_NAME[c]}` },
      `${CAT_NAME[c]} ${catCount[c]}`,
    );
    b.addEventListener('click', () => {
      st.cat = c;
      for (const x of catBtns) {
        const on = x === b;
        x.classList.toggle('on', on);
        x.setAttribute('aria-pressed', String(on));
      }
      draw();
    });
    return b;
  });
  const catRow = h(
    'div',
    { style: 'display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:4px' },
    h('span', { class: 'muted small', style: 'width:2.5em' }, '类别'),
    ...catBtns,
  );

  draw();
  return h('div', { style: 'margin:4px 0;padding:8px;border:1px solid var(--ln);border-radius:6px' }, head, tools, catRow, ...groups, grid);
}
