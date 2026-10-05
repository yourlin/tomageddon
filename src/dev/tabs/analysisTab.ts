// 分析页（E1 / E2 / E3 / E6 / E7）：武器 DPS 曲线、排行、进化路线、词条洗练与打造模拟
import { h, btn, select, num, table, fmt } from '../dom';
import type { DevCtx } from '../ctx';
import { WEAPONS, WEAPON_MAP, TIER_NAMES } from '../../data/weapons';
import { ITEM_MAP } from '../../data/items';
import { EVOLUTIONS } from '../../data/evolutions';
import { WEAPON_AFFIXES, WEAPON_AFFIX_MAP, FORGE } from '../../data/weaponAffixes';
import { run, type OwnedWeapon } from '../../systems/RunState';
import { weaponDamage } from '../../systems/WeaponSystem';
import { rerollAll, forge, forgeCost, affixTotals } from '../../systems/WeaponMods';
import { weaponCalc, CLS_NAME } from '../info';
import { lineChart } from './dataTab';

let wid = WEAPONS[0].id;
let rankCls = '';
let rankTier = 3;
let rollN = 1000;
let rollTierIdx = 3;
let rollRes: { dist: [string, number[]][]; avgDmg: number; best: number } | null = null;
let forgeRes: { level: number; avgCost: number; p50: number; p90: number; avgTries: number }[] | null = null;
let forgeRuns = 2000;

const COLORS = ['#a0a0a0', '#4aa3ff', '#b46bff', '#ff9f1c'];

/** 带打造等级的单体 DPS：在 weaponCalc 的基础上按伤害比例缩放 */
function dpsAt(id: string, tier: number, forgeLv: number): number {
  const d = WEAPON_MAP[id];
  const c = weaponCalc(d, tier);
  if (!forgeLv) return c.dps;
  const w: OwnedWeapon = { id, tier, forge: forgeLv } as OwnedWeapon;
  const base = weaponDamage(d, tier, run.stats);
  const f = weaponDamage(d, tier, run.stats, w);
  return base > 0 ? (c.dps * f) / base : c.dps;
}

export function renderAnalysis(ctx: DevCtx): HTMLElement {
  const root = h('div');
  const def = WEAPON_MAP[wid] ?? WEAPONS[0];
  const minT = def.minTier ?? 0;

  // ---------------- E1 ----------------
  const tiers = [0, 1, 2, 3].filter((t) => t >= minT);
  root.append(
    h('h3', null, 'E1 武器 DPS 曲线（当前构筑属性）'),
    h(
      'div',
      { class: 'row' },
      select(
        Object.values(WEAPON_MAP).map((w) => [w.id, `${w.evolvedFrom ? '✨' : ''}${w.name}`]),
        wid,
        (v) => ((wid = v), ctx.rerender()),
      ),
    ),
    h('div', { class: 'muted small' }, '品质 T1–T4（x = 品质）'),
    lineChart([['DPS', '#ff6b5e', tiers.map((t) => dpsAt(wid, t, 0))]], { h: 120, xLabel: (i) => `T${tiers[i] + 1}` }),
    h('div', { class: 'muted small' }, `T4 打造 +0 ~ +${FORGE.maxLevel}（每级伤害 +${Math.round(FORGE.dmgPerLevel * 100)}%）`),
    lineChart([['DPS', '#ff9f1c', Array.from({ length: FORGE.maxLevel + 1 }, (_, f) => dpsAt(wid, 3, f))]], {
      h: 120,
      xLabel: (i) => `+${i}`,
    }),
    table(
      ['品质', '伤害', '冷却', '期望 DPS'],
      tiers.map((t) => {
        const c = weaponCalc(def, t);
        return [`T${t + 1} ${TIER_NAMES[t]}`, fmt(c.dmg), c.cd.toFixed(2), String(Math.round(c.dps))];
      }),
      { numeric: [1, 2, 3] },
    ),
  );

  // ---------------- E2 ----------------
  const ranked = Object.values(WEAPON_MAP)
    .filter((d) => !d.evolvedFrom && (!rankCls || (rankCls === 'aura' ? d.kind === 'aura' : d.cls === rankCls)))
    .map((d) => ({ d, dps: weaponCalc(d, Math.max(rankTier, d.minTier ?? 0)).dps }))
    .sort((a, b) => b.dps - a.dps);
  const max = Math.max(1, ...ranked.map((r) => r.dps));
  root.append(
    h('h3', null, 'E2 武器排行（单体期望 DPS）'),
    h(
      'div',
      { class: 'row' },
      select(
        [0, 1, 2, 3].map((t) => [t, `T${t + 1}`]),
        rankTier,
        (v) => ((rankTier = Number(v)), ctx.rerender()),
      ),
      select(
        [
          ['', '全部流派'],
          ['melee', CLS_NAME.melee],
          ['ranged', CLS_NAME.ranged],
          ['elemental', CLS_NAME.elemental],
          ['aura', '光环'],
        ],
        rankCls,
        (v) => ((rankCls = v), ctx.rerender()),
      ),
      h('span', { class: 'muted' }, `${ranked.length} 把；单体 DPS 不反映群伤，光环 / 穿透类会被低估`),
    ),
    h(
      'div',
      null,
      ...ranked.map((r, i) =>
        h(
          'div',
          { class: 'bar', title: r.d.desc },
          h('span', { class: 'bl' }, `${i + 1}. ${r.d.name}`),
          h('span', { class: 'bb', style: `width:${(r.dps / max) * 100}%;background:${COLORS[rankTier]}` }),
          h('span', { class: 'bv' }, String(Math.round(r.dps))),
        ),
      ),
    ),
  );

  // ---------------- E3 ----------------
  root.append(
    h('h3', null, `E3 进化路线（${EVOLUTIONS.length}）`),
    table(
      ['进化前 (T4)', '需要道具', '进化后', 'DPS 前', 'DPS 后', '倍率'],
      EVOLUTIONS.map((e) => {
        const a = weaponCalc(WEAPON_MAP[e.from], 3).dps;
        const b = weaponCalc(e.to, 3).dps;
        return [
          WEAPON_MAP[e.from].name,
          ITEM_MAP[e.item]?.name ?? e.item,
          h('span', { title: e.to.desc }, '✨' + e.to.name),
          String(Math.round(a)),
          String(Math.round(b)),
          h('b', { class: b / a >= 1.3 ? 'good' : b / a < 1.1 ? 'warn' : '' }, `×${fmt(b / Math.max(1, a), 2)}`),
        ];
      }),
      { numeric: [3, 4, 5] },
    ),
  );

  // ---------------- E6 ----------------
  root.append(
    h('h3', null, 'E6 词条洗练模拟'),
    h(
      'div',
      { class: 'row' },
      select(
        [
          [2, 'T3（1 条）'],
          [3, 'T4（2 条）'],
        ],
        rollTierIdx,
        (v) => (rollTierIdx = Number(v)),
      ),
      '次数',
      num(rollN, (v) => (rollN = v), { min: 100, max: 100000, step: 100, width: 80 }),
      btn(
        '洗练',
        () => {
          const counts: Record<string, number[]> = Object.fromEntries(WEAPON_AFFIXES.map((a) => [a.id, [0, 0, 0, 0]]));
          let dmgSum = 0;
          let best = 0;
          const luck = run.stats.luck;
          for (let i = 0; i < rollN; i++) {
            const w = { id: wid, tier: rollTierIdx } as OwnedWeapon;
            rerollAll(w, luck);
            for (const a of w.affixes ?? []) counts[a.id][a.tier - 1]++;
            const t = affixTotals(w).dmg;
            dmgSum += t;
            best = Math.max(best, t);
          }
          rollRes = { dist: Object.entries(counts), avgDmg: dmgSum / rollN, best };
          ctx.rerender();
        },
        'pri',
      ),
      h('span', { class: 'muted' }, `按当前幸运 ${fmt(run.stats.luck)} 计算`),
    ),
  );
  if (rollRes) {
    const slots = rollTierIdx >= 3 ? 2 : 1;
    root.append(
      table(
        ['词条', 'I', 'II', 'III', 'IV', '出现率'],
        rollRes.dist.map(([id, c]) => {
          const tot = c.reduce((a, b) => a + b, 0);
          return [
            WEAPON_AFFIX_MAP[id as keyof typeof WEAPON_AFFIX_MAP].name[0].replace('{v}', '…'),
            ...c.map((x) => `${fmt((x / Math.max(1, tot)) * 100)}%`),
            `${fmt((tot / (rollN * slots)) * 100)}%`,
          ];
        }),
        { numeric: [1, 2, 3, 4, 5] },
      ),
      h('div', { class: 'muted' }, `伤害词条期望 +${fmt(rollRes.avgDmg)}%，最好一次 +${fmt(rollRes.best)}%`),
    );
  }

  // ---------------- E7 ----------------
  root.append(
    h('h3', null, `E7 打造模拟（${def.name} T4，+0 → +${FORGE.maxLevel}）`),
    h(
      'div',
      { class: 'row' },
      '模拟次数',
      num(forgeRuns, (v) => (forgeRuns = v), { min: 100, max: 20000, step: 100, width: 80 }),
      btn(
        '模拟',
        () => {
          const per: number[][] = Array.from({ length: FORGE.maxLevel }, () => []);
          const tries: number[][] = Array.from({ length: FORGE.maxLevel }, () => []);
          for (let r = 0; r < forgeRuns; r++) {
            const w = { id: wid, tier: 3, forge: 0 } as OwnedWeapon;
            let cost = 0;
            let n = 0;
            while ((w.forge ?? 0) < FORGE.maxLevel) {
              const lv = w.forge ?? 0;
              cost += forgeCost(w);
              n++;
              if (forge(w)) {
                per[lv].push(cost);
                tries[lv].push(n);
              }
            }
          }
          const q = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(a.length * p)] ?? 0;
          forgeRes = per.map((a, i) => ({
            level: i + 1,
            avgCost: a.reduce((x, y) => x + y, 0) / a.length,
            p50: q(a, 0.5),
            p90: q(a, 0.9),
            avgTries: tries[i].reduce((x, y) => x + y, 0) / tries[i].length,
          }));
          ctx.rerender();
        },
        'pri',
      ),
    ),
  );
  if (forgeRes)
    root.append(
      table(
        ['到达', '成功率', '累计花费 均值', '中位', '90%', '累计次数'],
        forgeRes.map((r) => [
          `+${r.level}`,
          `${Math.round(FORGE.chance[Math.min(r.level - 1, FORGE.chance.length - 1)] * 100)}%`,
          String(Math.round(r.avgCost)),
          String(Math.round(r.p50)),
          String(Math.round(r.p90)),
          fmt(r.avgTries),
        ]),
        { numeric: [1, 2, 3, 4, 5] },
      ),
    );
  return root;
}
