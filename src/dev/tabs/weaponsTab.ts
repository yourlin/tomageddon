// 武器页：所有武器（含进化超武）在当前构筑属性下的伤害 / 冷却 / 射程 / 爆炸半径 / 期望 DPS；可单独试用看特效
import { h, btn, select, table, fmt, hex } from '../dom';
import type { DevCtx } from '../ctx';
import { WEAPON_MAP, TIER_NAMES, type WeaponDef } from '../../data/weapons';
import { RARITY } from '../../data/balance';
import { ITEM_MAP } from '../../data/items';
import { EVOLUTION_OF } from '../../data/evolutions';
import { AURA_LOOK } from '../../systems/AuraFx';
import { run } from '../../systems/RunState';
import { RECIPE_BY_TO, slotLabel } from '../../data/recipes';
import { craftWeapon } from '../build';
import { weaponCalc, KIND_NAME, CLS_NAME } from '../info';
import type { SpawnOpts } from '../sandbox';

const HEAD = ['武器', '类别·方式', '伤害', '冷却', '射程', '爆炸r', '暴击', '期望DPS', '多目标 / 效果', '合成配方', ''];

export function renderWeapons(ctx: DevCtx): HTMLElement {
  const ui = ctx.ui;
  const sb = ctx.sb;
  const root = h('div');
  const tier = ui.wTier;

  if (sb.trial) {
    const t = sb.trial[0];
    root.append(
      h(
        'div',
        { class: 'box warn' },
        `正在单独试用：${WEAPON_MAP[t.id].name} T${t.tier + 1}（其余构筑不变） `,
        btn(
          '退出试用',
          () => {
            sb.trial = null;
            ctx.changed();
          },
          'pri',
        ),
      ),
    );
  }

  // 视觉测试用的靶子：按构筑的章节 / 波次生成
  const dummy = (count: number, attack: SpawnOpts['attack'], lock: boolean, dist?: number[]): SpawnOpts => ({
    chapterId: ctx.build.chapterId,
    wave: ctx.build.wave,
    count,
    affixes: null,
    lock,
    attack,
    immortal: true,
    test: false,
    dist,
  });
  root.append(
    h(
      'div',
      { class: 'row' },
      '品质',
      select(
        TIER_NAMES.map((t, k) => [k, `T${k + 1} ${t}`]),
        tier,
        (v) => ((ui.wTier = Number(v)), ctx.rerender()),
      ),
      '类别',
      select(
        [
          ['', '全部'],
          ['melee', '近战'],
          ['ranged', '远程'],
          ['elemental', '元素'],
          ['aura', '光环'],
          ['evolved', '进化超武'],
          ['t4', '配方·T4'],
          ['super', '配方·超武'],
        ],
        ui.wCls,
        (v) => ((ui.wCls = v), ctx.rerender()),
      ),
      search(ctx),
    ),
    h(
      'div',
      { class: 'row' },
      h('span', { class: 'muted' }, '靶子（锁血）：'),
      btn(
        '木桩群 ×12',
        () => report(ctx, sb.spawn('mold', false, dummy(12, 'none', true, [95, 170, 320]))),
        '',
        '近 / 中 / 远三圈，近战与远程都能打到',
      ),
      btn('移动靶群 ×24', () => report(ctx, sb.spawn('mold', false, dummy(24, 'none', false)))),
      btn('精英木桩', () => report(ctx, sb.spawn('roach_general', true, dummy(1, 'none', true, [120])))),
      btn('清场', () => sb.clear()),
    ),
    h(
      'div',
      { class: 'muted' },
      '数值按当前构筑属性计算（不含战斗中临时增益）；期望 DPS = 单次伤害 × 弹数 × 暴击期望 ÷ 冷却（单体）。点表头排序；「试」= 单独试用，「+」= 免费加入构筑。',
    ),
  );

  const q = ui.wSearch.trim().toLowerCase();
  const defs = Object.values(WEAPON_MAP).filter((d) => {
    if (q && !d.name.toLowerCase().includes(q) && !d.id.includes(q)) return false;
    if (!ui.wCls) return true;
    if (ui.wCls === 'evolved') return !!d.evolvedFrom;
    if (ui.wCls === 't4' || ui.wCls === 'super') return RECIPE_BY_TO[d.id]?.kind === ui.wCls;
    if (ui.wCls === 'aura') return d.kind === 'aura';
    return d.cls === ui.wCls && d.kind !== 'aura';
  });
  const rows = defs.map((d) => {
    const t = Math.max(tier, d.minTier ?? 0);
    const c = weaponCalc(d, t);
    return { d, t, c };
  });
  const keyOf: ((r: (typeof rows)[number]) => number | string)[] = [
    (r) => r.d.name,
    (r) => r.d.cls + r.d.kind,
    (r) => r.c.dmg,
    (r) => r.c.cd,
    (r) => r.c.range,
    (r) => r.c.explode,
    (r) => r.c.critChance,
    (r) => r.c.dps,
    (r) => r.c.effects.length,
    (r) => RECIPE_BY_TO[r.d.id]?.kind ?? '',
    () => 0,
  ];
  const col = Math.min(keyOf.length - 1, Math.abs(ui.wSort) - 1);
  const dir = ui.wSort > 0 ? 1 : -1;
  rows.sort((a, b) => {
    const x = keyOf[col](a),
      y = keyOf[col](b);
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
  });
  const owned = new Set(run.weapons.map((w) => w.id));
  root.append(
    table(
      HEAD,
      rows.map(({ d, t, c }) => [
        nameCell(d, t, owned.has(d.id)),
        h('span', { class: 'nw' }, CLS_NAME[d.cls], ' · ', d.kind === 'aura' ? auraCell(d) : KIND_NAME[d.kind]),
        fmt(c.dmg),
        c.cd.toFixed(2),
        String(Math.round(c.range)),
        c.explode ? String(Math.round(c.explode)) : '',
        `${Math.round(c.critChance * 100)}%×${fmt(c.critMult, 2)}`,
        h('b', null, String(Math.round(c.dps))),
        h('span', { class: 'muted small' }, [c.multi, ...c.effects].filter(Boolean).join('、')),
        recipeCell(d),
        h(
          'span',
          { class: 'nw' },
          btn(
            '试',
            () => {
              sb.trial = [{ id: d.id, tier: t }];
              ctx.changed();
            },
            '',
            '单独试用：只装备这把武器进入沙盒（构筑其余部分不变）',
          ),
          btn(
            '+',
            () => {
              ctx.build.weapons.push({ id: d.id, tier: t });
              ctx.changed();
              ctx.toast(`已加入构筑（免费）：${d.name} T${t + 1}`);
            },
            '',
            '免费加入构筑（不计花费，可超出武器栏）',
          ),
          craftBtn(ctx, d),
        ),
      ]),
      {
        sort: ui.wSort,
        numeric: [2, 3, 4, 5, 6, 7],
        onSort: (i) => {
          ui.wSort = Math.abs(ui.wSort) - 1 === i ? -ui.wSort : -(i + 1);
          ctx.rerender();
        },
      },
    ),
  );
  return root;
}

function nameCell(d: WeaponDef, t: number, owned: boolean): HTMLElement {
  const evo = EVOLUTION_OF[d.id];
  const title = [
    d.desc,
    evo ? `进化：T4 + ${ITEM_MAP[evo.item].name} → ${evo.to.name}` : '',
    d.evolvedFrom ? `由 ${WEAPON_MAP[d.evolvedFrom].name} 进化` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return h('span', { title, class: 'nw', style: `color:${RARITY[t].css}` }, (d.evolvedFrom ? '✨' : '') + d.name + (owned ? ' ●' : ''));
}

/** 合成配方：材料武器 + 道具槽；没有配方的基础武器留空 */
function recipeCell(d: WeaponDef): HTMLElement {
  const r = RECIPE_BY_TO[d.id];
  if (!r) return h('span', { class: 'muted small' }, '—');
  const mats = r.from.map(([id, t]) => `${WEAPON_MAP[id]?.name ?? id} T${t + 1}`).join(' + ');
  const items = r.items.map(slotLabel).join('、');
  const tag = { t4: 'T4', super: '超武' }[r.kind];
  return h(
    'span',
    { class: 'small', title: `${mats}\n＋ ${items}` },
    h('span', { class: 'tag' }, tag),
    ' ',
    h('span', { class: 'nw' }, mats),
    h('span', { class: 'muted' }, ` ＋ ${items}`),
  );
}

/** 「合」：按配方补齐材料并合成（按商店价记账） */
function craftBtn(ctx: DevCtx, d: WeaponDef): HTMLElement | string {
  const r = RECIPE_BY_TO[d.id];
  if (!r) return '';
  return btn(
    '合',
    () => {
      const err = craftWeapon(ctx.build, r);
      if (err) ctx.toast(err, true);
      else ctx.toast(`已按配方合成：${d.name}`);
      ctx.changed();
    },
    '',
    '按配方合成：缺的材料武器与道具按商店价自动补齐后合成',
  );
}

function auraCell(d: WeaponDef): HTMLElement {
  const look = AURA_LOOK[d.id] ?? AURA_LOOK[d.evolvedFrom ?? ''];
  return h('span', null, '光环 ', look ? h('span', { class: 'tag', style: `color:${hex(look.color)}` }, look.style) : '');
}

function search(ctx: DevCtx): HTMLInputElement {
  const i = h('input', {
    placeholder: '搜索',
    value: ctx.ui.wSearch,
    onchange: () => {
      ctx.ui.wSearch = i.value;
      ctx.rerender();
    },
  });
  return i;
}

function report(ctx: DevCtx, err: string | null): void {
  if (err) ctx.toast(err, true);
}
