// E2 武器强弱榜：纸面 DPS 与实际 DPS（当前构筑 × 平衡测试实测转换率）同图对比，
// 再补上平衡测试里的使用率、通关率差、伤害占比，以及冷却、射程、价格、性价比，供调数值参考。
import { h, select } from '../dom';
import type { DevCtx } from '../ctx';
import { WEAPON_MAP, TIER_PRICE_MULT, type WeaponDef } from '../../data/weapons';
import { weaponCalc } from '../info';
import { weaponIcon } from '../thumbs';
import { weaponCat, type WeaponCat } from '../weaponPicker';
import { effData, effOf, effVal, effTotal, favGain, useOf, effSourceNote, type TierEff, type WeaponUsage } from './weaponEff';

type Style = '' | 'melee' | 'ranged' | 'elemental' | 'aura';
type SortKey = 'paper' | 'real' | 'eff' | 'slope' | 'fav' | 'pick' | 'lift' | 'share' | 'value';

let tier = 3;
let style: Style = '';
let cat: WeaponCat = '';
let sortBy: SortKey = 'real';

const TIER_COLORS = ['#a0a0a0', '#4aa3ff', '#b46bff', '#ff9f1c'];
const REAL = '#3ddc97';
/** 实测样本少于这个波数、使用少于这个局数时提示不可靠，也不进概览 */
const FEW_WAVES = 10;
const FEW_GAMES = 20;

const STYLE_NAME: Record<Style, string> = { '': '全部', melee: '近战', ranged: '远程', elemental: '元素', aura: '光环' };
const CAT_NAME: Record<WeaponCat, string> = { '': '全部', base: '基础', fused: 'T4 合成', super: '✨超武' };
const SORT_NAME: Record<SortKey, string> = {
  paper: '按纸面 DPS',
  real: '按实际 DPS',
  eff: '按转换率',
  slope: '按吃密度程度',
  fav: '按契合收益',
  pick: '按使用率',
  lift: '按通关率差',
  share: '按伤害占比',
  value: '按性价比',
};

/** 流派：光环单独一类（不再算进它的 cls），其余按武器类别 */
const styleOf = (d: WeaponDef): Exclude<Style, ''> => (d.kind === 'aura' ? 'aura' : d.cls);

interface Row {
  d: WeaponDef;
  t: number;
  paper: number;
  real: number | null;
  e: TierEff | null;
  u: WeaponUsage | null;
  cd: number;
  range: number;
  price: number;
  value: number;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const signed = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}`;

function key(r: Row): number {
  switch (sortBy) {
    case 'paper':
      return r.paper;
    case 'real':
      return r.real ?? -1;
    case 'eff':
      return r.e ? effVal(r.e) : -1;
    case 'slope':
      return r.e?.slope ?? -1;
    case 'fav':
      return r.e ? (favGain(r.e) ?? -9) : -9;
    case 'pick':
      return r.u?.pick ?? -1;
    case 'lift':
      return r.u && r.u.games >= FEW_GAMES ? r.u.lift : -9;
    case 'share':
      return r.u?.share ?? -1;
    case 'value':
      return r.value;
  }
}

/** 单选胶囊行 */
function chips<T extends string>(label: string, opts: [T, string][], cur: T, onPick: (v: T) => void): HTMLElement {
  return h(
    'div',
    { style: 'display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:4px' },
    h('span', { class: 'muted small', style: 'width:2.5em' }, label),
    ...opts.map(([v, text]) =>
      h('button', { class: v === cur ? 'chip on' : 'chip', 'aria-pressed': String(v === cur), onclick: () => onPick(v) }, text),
    ),
  );
}

/** 概览里的一组「名字 数值」 */
function topList(title: string, rows: Row[], fmtv: (r: Row) => string): HTMLElement | null {
  if (!rows.length) return null;
  return h(
    'div',
    { class: 'small', style: 'margin:2px 0' },
    h('span', { class: 'muted' }, `${title}：`),
    rows.map((r) => `${r.d.name} ${fmtv(r)}`).join('、'),
  );
}

export function renderWeaponRank(ctx: DevCtx): HTMLElement {
  const eff = effData(ctx);
  const game = ctx.sb.game;

  const all: Row[] = Object.values(WEAPON_MAP).map((d) => {
    // T4 合成和超武只有 T4，固定按 T4 算
    const t = d.evolvedFrom || (d.minTier ?? 0) >= 3 ? 3 : Math.max(tier, d.minTier ?? 0);
    const c = weaponCalc(d, t);
    const e = effOf(d.id, t);
    const real = e ? c.dps * effTotal(e) : null;
    const price = Math.round(d.price * TIER_PRICE_MULT[t]);
    return {
      d,
      t,
      paper: c.dps,
      real,
      e,
      u: useOf(d.id),
      cd: c.cd,
      range: c.range,
      price,
      value: ((real ?? c.dps) / Math.max(1, price)) * 100,
    };
  });
  const inCat = all.filter((r) => !cat || weaponCat(r.d) === cat);
  const rows = inCat.filter((r) => !style || styleOf(r.d) === style).sort((a, b) => key(b) - key(a) || b.paper - a.paper);

  const styleCount = (s: Style) => inCat.filter((r) => !s || styleOf(r.d) === s).length;
  const catCount = (c: WeaponCat) => all.filter((r) => !c || weaponCat(r.d) === c).length;

  const controls = h(
    'div',
    null,
    h(
      'div',
      { class: 'row' },
      select(
        [0, 1, 2, 3].map((t) => [t, `T${t + 1}`]),
        tier,
        (v) => ((tier = Number(v)), ctx.rerender()),
      ),
      select(Object.entries(SORT_NAME) as [SortKey, string][], sortBy, (v) => ((sortBy = v as SortKey), ctx.rerender())),
      h('span', { class: 'muted' }, `${rows.length} 把`),
    ),
    chips<Style>(
      '流派',
      (['', 'melee', 'ranged', 'elemental', 'aura'] as Style[]).map((s) => [s, `${STYLE_NAME[s]} ${styleCount(s)}`]),
      style,
      (v) => ((style = v), ctx.rerender()),
    ),
    chips<WeaponCat>(
      '类别',
      (['', 'base', 'fused', 'super'] as WeaponCat[]).map((c) => [c, `${CAT_NAME[c]} ${catCount(c)}`]),
      cat,
      (v) => ((cat = v), ctx.rerender()),
    ),
  );

  // ---------- 概览：只用样本足够的武器 ----------
  const solidE = rows.filter((r) => r.e && r.e.n >= FEW_WAVES);
  const solidU = rows.filter((r) => r.u && r.u.games >= FEW_GAMES);
  const effs = solidE.map((r) => effVal(r.e!)).sort((a, b) => a - b);
  const medEff = effs.length ? effs[Math.floor(effs.length / 2)] : 0;
  const by = (list: Row[], f: (r: Row) => number) => [...list].sort((a, b) => f(b) - f(a));
  const summary = eff.data
    ? h(
        'div',
        { style: 'margin:6px 0;padding:6px 8px;border:1px solid var(--ln);border-radius:6px' },
        effSourceNote(),
        h(
          'div',
          { class: 'muted small' },
          `这一组 ${rows.length} 把，${rows.filter((r) => r.e).length} 把有 T${tier + 1} 实测，`,
          `转换率中位 ${effs.length ? pct(medEff) : '-'}（样本 ≥${FEW_WAVES} 波的 ${effs.length} 把）；`,
          eff.data.usageFrom
            ? `使用率 / 通关率差 / 伤害占比来自 ${new Date(eff.data.usageFrom.finishedAt).toLocaleString('zh-CN', { hour12: false })} 的普通测试（${eff.data.usageFrom.games} 局）`
            : '还没有普通测试的使用统计',
        ),
        topList('实际最强', by(solidE, (r) => r.real ?? 0).slice(0, 3), (r) => String(Math.round(r.real ?? 0))),
        topList('实际最弱', by(solidE, (r) => -(r.real ?? 0)).slice(0, 3), (r) => String(Math.round(r.real ?? 0))),
        topList('纸面低估最多', by(solidE, (r) => effVal(r.e!)).slice(0, 3), (r) => pct(effVal(r.e!))),
        topList('纸面高估最多', by(solidE, (r) => -effVal(r.e!)).slice(0, 3), (r) => pct(effVal(r.e!))),
        topList('用了更容易通关', by(solidU, (r) => r.u!.lift).slice(0, 3), (r) => signed(r.u!.lift)),
        topList('用了更容易翻车', by(solidU, (r) => -r.u!.lift).slice(0, 3), (r) => signed(r.u!.lift)),
      )
    : h(
        'div',
        { class: 'muted small', style: 'margin:6px 0' },
        eff.loading ? '实测数据读取中…' : `读不到实测数据（${eff.error}），下面只有纸面数值`,
      );

  const legend = h(
    'div',
    { class: 'muted small', style: 'display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;margin:2px 0 4px' },
    h(
      'span',
      null,
      h('span', { style: `display:inline-block;width:10px;height:7px;background:${TIER_COLORS[tier]};margin-right:4px` }),
      '纸面 DPS',
    ),
    h('span', null, h('span', { style: `display:inline-block;width:10px;height:7px;background:${REAL};margin-right:4px` }), '实际 DPS'),
    h('span', null, '⚠ = 样本少，柱子变淡'),
  );

  const max = Math.max(1, ...rows.flatMap((r) => [r.paper, r.real ?? 0]));
  const list = h(
    'div',
    null,
    ...rows.map((r, i) => {
      const few = !!r.e && r.e.n < FEW_WAVES;
      const tip = [
        r.d.desc,
        r.e
          ? `T${r.t + 1} 标准化转换率 ${pct(effVal(r.e))}（原始 ${pct(r.e.eff)}，中位 ${pct(r.e.med)}，${pct(r.e.p25)}–${pct(r.e.p75)}）` +
            (r.e.effB ? `；稀 / 中 / 密 ${r.e.effB.map((x) => (x === null ? '—' : pct(x))).join(' / ')}` : '') +
            `；样本 ${r.e.n} 波 / ${r.e.runs} 局；测试中纸面 ${Math.round(r.e.paperDps)} → 实测 ${Math.round(r.e.realDps)}`
          : `这次平衡测试里没有 T${r.t + 1} 的实测样本`,
        r.u
          ? `用过它的局 ${r.u.games}（${pct(r.u.pick)}），通关率 ${pct(r.u.win)}（比同章节平均 ${signed(r.u.lift)} 个百分点），平均持有 ${r.u.waves} 波，占武器总伤害 ${pct(r.u.share)}`
          : '平衡测试里 bot 没用过它',
      ].join('\n');
      const metrics = [
        r.e ? `转换 ${pct(effVal(r.e))}${few ? '⚠' : ''}` : null,
        r.e?.assist && r.e.assist >= 0.005 ? `辅助+${pct(r.e.assist)}` : null,
        r.e?.slope ? `密度×${r.e.slope}` : null,
        r.e && favGain(r.e) !== null ? `契合${signed(favGain(r.e)!)}%` : null,
        r.u ? `使用 ${pct(r.u.pick)}` : null,
        r.u ? `通关 ${signed(r.u.lift)}${r.u.games < FEW_GAMES ? '⚠' : ''}` : null,
        r.u ? `伤害占比 ${pct(r.u.share)}` : null,
        `冷却 ${r.cd.toFixed(2)}s`,
        `射程 ${Math.round(r.range)}`,
        `价 ${r.price}`,
        `性价比 ${r.value.toFixed(1)}`,
      ]
        .filter(Boolean)
        .join(' · ');
      return h(
        'div',
        { title: tip, style: 'margin:3px 0;padding-bottom:3px;border-bottom:1px solid var(--ln)' },
        h(
          'div',
          { class: 'bar' },
          h('span', { class: 'muted small', style: 'width:2.2em;text-align:right;flex:none' }, String(i + 1)),
          weaponIcon(game, r.d.id, 18),
          h('span', { class: 'bl', style: 'width:118px' }, `${r.d.evolvedFrom ? '✨' : ''}${r.d.name}`),
          h(
            'span',
            { style: 'flex:1;display:flex;flex-direction:column;gap:1px;min-width:0' },
            h('span', { class: 'bb', style: `height:6px;width:${(r.paper / max) * 100}%;background:${TIER_COLORS[r.t]}` }),
            r.real !== null
              ? h('span', { class: 'bb', style: `height:6px;width:${(r.real / max) * 100}%;background:${REAL};opacity:${few ? 0.45 : 1}` })
              : h('span', { style: 'height:6px' }),
          ),
          h(
            'span',
            { class: 'bv', style: 'width:86px;text-align:right;flex:none' },
            `${Math.round(r.paper)} → ${r.real !== null ? Math.round(r.real) : '—'}`,
          ),
        ),
        h('div', { class: 'muted small', style: 'padding-left:calc(2.2em + 30px)' }, metrics),
      );
    }),
  );

  return h(
    'div',
    null,
    h('h3', null, 'E2 武器强弱榜（纸面 vs 实际 + 实战数据）'),
    controls,
    summary,
    legend,
    list,
    h(
      'div',
      { class: 'muted small', style: 'margin-top:6px' },
      '纸面 = 当前构筑的单体期望 DPS；实际 = 纸面 ×（平衡测试实测的标准化转换率 + 易伤辅助）。标准化 = 按怪物密度分档加权；同一套属性才能比。',
      '密度× = 怪多时的转换率 ÷ 怪少时的转换率，越大越依赖群伤，越接近 1 越像单体武器；契合 ± = 契合角色手上比不契合时转换率高多少。',
      '使用 = 平衡测试里用过它的局占比；通关 = 用过它的局的通关率减去同章节平均（百分点，bot 会挑强武器，有选择偏差，只作参考）；',
      '伤害占比 = 用过它的局里它占武器总伤害的比例；价 = 基础价格（不含波次涨价）；性价比 = 每 100 金币买到的实际 DPS（没实测时用纸面）。',
      'T4 合成和超武只有 T4，固定按 T4 显示。',
    ),
  );
}
