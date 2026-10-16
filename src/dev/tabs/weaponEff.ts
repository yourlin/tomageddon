// E1 实战转换率：平衡测试实测 DPS 与纸面单体 DPS 的对比（按 T1–T4）。
// 数据是 scripts/weapon-eff.mjs 合并出的 reports/weapon-eff.json：所有历史平衡测试（普通 + 专项补测）里
// 数值指纹与当时代码一致的样本，按时间衰减加权合并。经 vite 插件 /__balance-reports/ 读取，只在 dev / preview 服务器上可用。
// 浏览器这边再用同一套指纹（systems/weaponFingerprint.ts）和当前代码对一次：合并之后又改过数值的武器，实测数据当作没有。
import { h, btn, table, fmt } from '../dom';
import type { DevCtx } from '../ctx';
import { WEAPON_MAP } from '../../data/weapons';
import { weaponCalc } from '../info';
import { weaponFingerprints, type WeaponFingerprints } from '../../systems/weaponFingerprint';

interface TierEff {
  n: number;
  runs: number;
  sec: number;
  paperDps: number;
  realDps: number;
  eff: number;
  p25: number;
  med: number;
  p75: number;
  /** 其中普通测试 / 专项补测的样本波数 */
  natN: number;
  focusN: number;
  /** 来自几次测试、最新与最早一次的完成时间 */
  files: number;
  newest: number;
  oldest: number;
  /** 按怪物密度（每秒出怪）分三档：样本波数、各档转换率（样本不足为 null） */
  nB?: number[];
  effB?: (number | null)[];
  /** 标准化转换率：三档按固定比例加权，横向比较用它；旧数据没有 */
  std?: number | null;
  stdFull?: boolean;
  /** 密 ÷ 稀 的转换率倍数：越大越吃群伤 */
  slope?: number | null;
  /** 契合 / 不契合角色手上的样本波数与转换率（契合的额外弹丸、穿透、连锁等纸面不算） */
  nFav?: number;
  nNoFav?: number;
  effFav?: number | null;
  effNoFav?: number | null;
  /** 辅助：它施加的易伤让其它武器多打出的伤害 ÷ 纸面伤害（旧数据没有） */
  assist?: number | null;
}

/** 契合收益：契合时转换率 ÷ 不契合时 − 1（两边都有样本才有） */
export const favGain = (t: TierEff): number | null => (t.effFav && t.effNoFav ? t.effFav / t.effNoFav - 1 : null);
interface EffSource {
  file: string;
  kind: 'natural' | 'focus';
  version: string;
  finishedAt: number | null;
  games: number;
  used: boolean;
  reason: string;
}
interface EffData {
  fp: WeaponFingerprints | null;
  version: string;
  finishedAt: number | null;
  chapters: number[];
  games: number;
  halfLife: number;
  maxAge: number;
  density?: { edges: number[]; names: string[]; mix: number[] };
  excludedWeapons: number;
  sources: EffSource[];
  weapons: Record<string, (TierEff | null)[]>;
  /** 按武器的使用统计（不分品质），只取最新一份普通测试 */
  usage: Record<string, WeaponUsage> | null;
  usageFrom: { file: string; games: number; finishedAt: number } | null;
}

export interface WeaponUsage {
  games: number;
  pick: number;
  win: number;
  lift: number;
  share: number;
  waves: number;
}

const URL_EFF = () => `${location.origin}/__balance-reports/weapon-eff.json`;
/** 样本少于这个波数时提示不可靠 */
const FEW = 10;

let data: EffData | null = null;
let error = '';
let loading = false;

async function load(ctx: DevCtx): Promise<void> {
  loading = true;
  error = '';
  ctx.rerender();
  try {
    const r = await fetch(URL_EFF(), { cache: 'no-store' });
    if (r.status === 404) throw new Error('还没有 weapon-eff.json');
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(`HTTP ${r.status}`);
    data = (await r.json()) as EffData;
  } catch (e) {
    data = null;
    error = (e as Error).message;
  }
  loading = false;
  ctx.rerender();
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** 给其它区块（E2 排行）用：按需触发读取，返回已加载的数据和状态 */
export function effData(ctx: DevCtx): { data: EffData | null; error: string; loading: boolean } {
  if (!data && !loading && !error) void load(ctx);
  return { data, error, loading };
}

/** 某把武器某个品质的实测记录（没有样本时为 null） */
export const effOf = (id: string, tier: number): TierEff | null => (data && !staleOf(id) ? (data.weapons[id]?.[tier] ?? null) : null);

/** 用于换算「实际 DPS」的转换率：有标准化值用标准化值（不受样本来自哪些波次影响），否则用原始值 */
export const effVal = (t: TierEff): number => t.std ?? t.eff;

/** 含辅助的转换率：自身（标准化）+ 易伤辅助。估算「实际 DPS」用它，带易伤的光环才不会被低估 */
export const effTotal = (t: TierEff): number => effVal(t) + (t.assist ?? 0);

/** 密度分档说明，例如「稀 <4.5 / 中 4.5–8 / 密 ≥8 只每秒」 */
export function densityText(): string {
  const d = data?.density;
  if (!d) return '';
  return `${d.names[0]} <${d.edges[0]} / ${d.names[1]} ${d.edges[0]}–${d.edges[1]} / ${d.names[2]} ≥${d.edges[1]} 只每秒，参考比例 ${d.mix.map((x) => Math.round(x * 100)).join(' : ')}`;
}

/** 某把武器的使用统计（使用率、胜率差、伤害占比） */
export const useOf = (id: string): WeaponUsage | null => (data && !staleOf(id) ? (data.usage?.[id] ?? null) : null);

/** 合并数据之后，当前代码又改过的数值：'global' = 全局数值变了（全部作废），'weapon' = 只有这把武器变了 */
export function staleOf(id?: string): '' | 'global' | 'weapon' {
  if (!data?.fp) return '';
  const cur = weaponFingerprints();
  if (data.fp.global !== cur.global) return 'global';
  if (id && data.fp.weapons[id] !== undefined && data.fp.weapons[id] !== cur.weapons[id]) return 'weapon';
  return '';
}

const dateOf = (t: number | null | undefined) => (t ? new Date(t).toLocaleString('zh-CN', { hour12: false }) : '?');

/** 数据来源一行说明 + 可展开的测试清单（E1 / E2 共用） */
export function effSourceNote(): HTMLElement | null {
  if (!data) return null;
  const used = data.sources.filter((s) => s.used);
  const nat = used.filter((s) => s.kind === 'natural').length;
  const foc = used.length - nat;
  const list = h(
    'details',
    { style: 'margin-top:2px' },
    h(
      'summary',
      null,
      `合并了 ${used.length}/${data.sources.length} 次测试（普通 ${nat} · 补测 ${foc}），共 ${data.games} 局，最新 ${dateOf(data.finishedAt)}`,
    ),
    ...data.sources
      .slice()
      .reverse()
      .map((s) =>
        h(
          'div',
          { style: s.used ? '' : 'opacity:.55' },
          `${s.used ? '✓' : '✗'} ${dateOf(s.finishedAt)} · ${s.kind === 'focus' ? '专项补测' : '普通测试'} · v${s.version} · ${s.games} 局${s.used ? '' : ` · 未使用：${s.reason}`}`,
        ),
      ),
    h(
      'div',
      null,
      `只合并数值指纹与当时代码一致的样本；越旧权重越低（半衰期 ${data.halfLife} 天，超过 ${data.maxAge} 天不用）。`,
      data.excludedWeapons ? `另有 ${data.excludedWeapons} 份武器样本因这把武器的数值改过而被排除。` : '',
    ),
  );
  const stale = staleOf();
  // 合并之后又改了哪几章：只有在这几章采到的样本过期，提示重跑这几章
  const curCh = weaponFingerprints().chapters ?? {};
  const changedCh = data.fp?.chapters ? Object.keys(curCh).filter((c) => data?.fp?.chapters?.[c] !== curCh[c]) : [];
  return h(
    'div',
    { class: 'muted small' },
    stale === 'global'
      ? h(
          'div',
          { style: 'color:#ff9f1c' },
          '⚠ 合并之后全局数值（BALANCE / 怪物 / Boss）又改过：下面的实测数据都已过期，请重跑平衡测试和专项补测。',
        )
      : changedCh.length
        ? h(
            'div',
            { style: 'color:#ff9f1c' },
            `⚠ 合并之后第 ${changedCh.join('、')} 章又改过：在这几章采到的样本已过期，重跑这几章的测试后会自动替换。`,
          )
        : null,
    list,
  );
}

export type { TierEff };

/** 分组柱状图：每个品质两根柱（纸面 / 实测），实测柱上标转换率 */
function barChart(rows: { label: string; paper: number; real: number; eff: number; few: boolean }[]): SVGSVGElement {
  const W = 500;
  const H = 170;
  const pad = 30;
  const top = 18;
  const bottom = 18;
  const max = Math.max(1e-9, ...rows.flatMap((r) => [r.paper, r.real]));
  const y = (v: number) => H - bottom - (v / max) * (H - top - bottom);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('style', `max-width:${W}px;height:auto;display:block`);
  svg.setAttribute('class', 'chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    rows.map((r) => `${r.label} 纸面 ${Math.round(r.paper)} 实测 ${Math.round(r.real)} 转换率 ${pct(r.eff)}`).join('；'),
  );
  const el = (tag: string, attrs: Record<string, string | number>, text?: string) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if (text) e.textContent = text;
    svg.append(e);
    return e;
  };
  el('line', { x1: pad, y1: y(0), x2: W - 8, y2: y(0), stroke: '#6a2e36' });
  el('text', { x: 2, y: y(max) + 4, fill: '#a88f88', 'font-size': 9 }, fmt(max, 0));
  el('text', { x: 2, y: y(0), fill: '#a88f88', 'font-size': 9 }, '0');
  el('rect', { x: pad + 4, y: 3, width: 9, height: 9, fill: '#5b8def' });
  el('text', { x: pad + 16, y: 11, fill: '#a88f88', 'font-size': 10 }, '纸面 DPS');
  el('rect', { x: pad + 80, y: 3, width: 9, height: 9, fill: '#ff9f1c' });
  el('text', { x: pad + 92, y: 11, fill: '#a88f88', 'font-size': 10 }, '实测 DPS（标注转换率）');
  const slot = (W - pad - 8) / Math.max(1, rows.length);
  const bw = Math.min(46, slot * 0.32);
  rows.forEach((r, i) => {
    const cx = pad + slot * (i + 0.5);
    const op = r.few ? 0.45 : 1;
    el('rect', { x: cx - bw - 2, y: y(r.paper), width: bw, height: y(0) - y(r.paper), fill: '#5b8def', opacity: op });
    el('rect', { x: cx + 2, y: y(r.real), width: bw, height: y(0) - y(r.real), fill: '#ff9f1c', opacity: op });
    el(
      'text',
      { x: cx + 2 + bw / 2, y: Math.max(top + 8, y(r.real) - 3), fill: '#ffd28a', 'font-size': 10, 'text-anchor': 'middle' },
      pct(r.eff),
    );
    el('text', { x: cx, y: H - 4, fill: '#a88f88', 'font-size': 10, 'text-anchor': 'middle' }, r.few ? `${r.label}（样本少）` : r.label);
  });
  return svg;
}

export function renderWeaponEff(ctx: DevCtx, wid: string): HTMLElement {
  if (!data && !loading && !error) void load(ctx);
  const head = h(
    'div',
    { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px' },
    h('b', null, '实战转换率（平衡测试实测 ÷ 纸面）'),
    btn(loading ? '读取中…' : '重新读取', () => void load(ctx), '', '平衡测试跑完后点这里读最新数据'),
  );
  if (error)
    return h(
      'div',
      null,
      head,
      h(
        'div',
        { class: 'muted small' },
        `读不到实测数据（${error}）。数据只在 npm run dev / preview 的服务器上提供；先跑一次平衡测试（npm run balance），`,
        '或用 node scripts/weapon-eff.mjs 从上次结果重新生成。',
      ),
    );
  if (!data) return h('div', null, head, h('div', { class: 'muted small' }, '读取中…'));

  const meta = effSourceNote();
  const stale = staleOf(wid);
  if (stale === 'weapon')
    return h(
      'div',
      null,
      head,
      meta,
      h(
        'div',
        { class: 'small', style: 'margin-top:4px;color:#ff9f1c' },
        '这把武器的数值在最近一次合并之后改过，旧的实测已作废。可以用 node scripts/batch.mjs --focus ' + wid + ' 单独补测。',
      ),
    );
  const def = WEAPON_MAP[wid];
  const rows = [0, 1, 2, 3].map((i) => ({ i, t: effOf(wid, i) })).filter((x): x is { i: number; t: TierEff } => !!x.t);
  if (!rows.length)
    return h(
      'div',
      null,
      head,
      meta,
      h(
        'div',
        { class: 'muted small', style: 'margin-top:4px' },
        `还没有这把武器的实测样本。用 node scripts/batch.mjs --focus ${wid} 补测，或 --focus auto 一次补齐所有缺样本的武器。`,
      ),
    );

  const chart = barChart(rows.map(({ i, t }) => ({ label: `T${i + 1}`, paper: t.paperDps, real: t.realDps, eff: t.eff, few: t.n < FEW })));
  const tbl = table(
    ['品质', '纸面', '实测', '转换率', '标准化', '辅助', '稀 / 中 / 密', '契合 / 不契合', '样本 波/局', '补测', '当前构筑预估'],
    rows.map(({ i, t }) => [
      `T${i + 1}`,
      String(Math.round(t.paperDps)),
      String(Math.round(t.realDps)),
      pct(t.eff),
      t.std != null ? `${pct(t.std)}${t.stdFull ? '' : '*'}` : '—',
      t.assist != null ? (t.assist >= 0.005 ? `+${pct(t.assist)}` : '0') : '—',
      t.effB ? t.effB.map((e) => (e === null ? '—' : pct(e))).join(' / ') : '—',
      t.effFav != null || t.effNoFav != null
        ? `${t.effFav != null ? pct(t.effFav) : '—'} / ${t.effNoFav != null ? pct(t.effNoFav) : '—'}`
        : '—',
      `${t.n}/${t.runs}${t.n < FEW ? ' ⚠' : ''}`,
      t.focusN ? pct(t.focusN / t.n) : '—',
      def ? String(Math.round(weaponCalc(def, i).dps * effTotal(t))) : '-',
    ]),
    { numeric: [1, 2, 3, 4, 5, 8, 9, 10] },
  );
  return h(
    'div',
    null,
    head,
    meta,
    chart,
    tbl,
    h(
      'div',
      { class: 'muted small' },
      '纸面 = 测试中 bot 构筑下的单体期望 DPS（全部命中、计暴击）；实测 = 那一波这把武器实际造成的伤害 ÷ 波次时长，',
      '含 DoT、穿透、分裂、群伤、爆炸，也扣掉了打空、闪避、护甲、无敌和没有目标的空档，不计溢出伤害。',
      '转换率 = 实测总伤害 ÷ 纸面总伤害（受样本来自哪些波次影响）；标准化 = 按怪物密度分三档（',
      densityText(),
      '）分别算转换率再按参考比例加权，横向比较武器用它，* = 有一档样本不足、只用了其余档。',
      '辅助 = 它施加的易伤（受到伤害提高）让其它武器多打出的伤害 ÷ 它的纸面伤害；DoT 本来就记在施加者名下，已含在转换率里。',
      '「当前构筑预估」= 上方当前构筑的纸面 DPS ×（标准化转换率 + 辅助）。单位都是 DPS；⚠ = 样本不足 10 波。',
      '契合 / 不契合 = 持有角色契合与不契合这把武器时的转换率：纸面只算了契合的 +10% 伤害，额外弹丸、穿透、连锁、连击、范围都体现在这里的差距上。',
      '同一波同时持有不同品质的同名武器时这一波不计入。「补测」= 样本里来自专项补测（开局强制给这把武器）的比例。',
    ),
  );
}
