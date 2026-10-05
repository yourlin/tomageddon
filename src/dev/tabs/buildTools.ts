// 构筑页的扩展工具（C1–C4、C6、C7）：A/B 对比、典型构筑、从存档导入、属性来源分解、分享码、天赋树编辑
import { h, btn, select, table, fmt } from '../dom';
import type { DevCtx } from '../ctx';
import { CHARACTER_MAP } from '../../data/characters';
import { WEAPON_MAP } from '../../data/weapons';
import { ITEM_MAP } from '../../data/items';
import { STAT_INFO, STAT_ORDER, type StatKey } from '../../data/stats';
import { TALENT_NODES, BRANCHES, type BranchId } from '../../data/talentTree';
import { run } from '../../systems/RunState';
import { save, type RunRecord } from '../../systems/Save';
import { weaponCalc } from '../info';
import {
  applyBuild,
  newBuild,
  sanitize,
  rollShelf,
  rerollShelf,
  buyWeapon,
  buyItem,
  combineWeapon,
  canCombine,
  money,
  expectedBudget,
  autoLevelPicks,
  savedTalents,
  type DevBuild,
} from '../build';

const B_KEY = 'tomageddon_dev_build_b';
let branch: BranchId = 'might';

interface Measure {
  stats: Record<StatKey, number>;
  dps: number;
  weapons: { name: string; dps: number }[];
}

/** 把构筑写进 run 量一次属性与期望 DPS，再恢复当前构筑（保留沙盒里的生命） */
export function measure(ctx: DevCtx, b: DevBuild): Measure {
  const hp = run.hp;
  const dmgBy = { ...run.dmgBy };
  applyBuild(b);
  const stats = { ...run.stats } as unknown as Record<StatKey, number>;
  const weapons = run.weapons.map((w) => ({
    name: `${WEAPON_MAP[w.id].name}T${w.tier + 1}`,
    dps: weaponCalc(WEAPON_MAP[w.id], w.tier).dps,
  }));
  applyBuild(ctx.build, ctx.sb.trial);
  run.hp = Math.min(hp, run.stats.maxHp);
  run.dmgBy = dmgBy;
  return { stats, dps: weapons.reduce((a, w) => a + w.dps, 0), weapons };
}

const clone = (b: DevBuild): DevBuild => JSON.parse(JSON.stringify(b)) as DevBuild;
export const loadB = (): DevBuild | null => {
  try {
    const s = localStorage.getItem(B_KEY);
    return s ? sanitize(JSON.parse(s)) : null;
  } catch {
    return null;
  }
};
const saveB = (b: DevBuild | null) => (b ? localStorage.setItem(B_KEY, JSON.stringify(b)) : localStorage.removeItem(B_KEY));

/** C2：按角色 + 波次生成「正常玩家此时大概的构筑」：逐波按期望收入逛随机商店，优先契合武器、合成同名，其余买道具 */
export function typicalBuild(charId: string, chapterId: number, wave: number, rng = Math.random): DevBuild {
  const b = newBuild(charId);
  b.chapterId = chapterId;
  const fav = new Set(CHARACTER_MAP[charId].favored);
  for (let w = 2; w <= wave; w++) {
    b.wave = w;
    b.budget = expectedBudget(b);
    let shelf = rollShelf(b);
    for (let r = 0; r < 3; r++) {
      applyBuild(b);
      const offers = shelf.offers
        .map((o, i) => ({ o, i }))
        .filter(({ o }) => !o.sold && o.price <= money(b))
        .sort((x, y) => score(b, y.o, fav) - score(b, x.o, fav));
      for (const { o } of offers) {
        if (o.price > money(b) || score(b, o, fav) <= 0) continue;
        const err = o.kind === 'weapon' ? buyWeapon(b, o.id, o.tier) : buyItem(b, o.id);
        if (!err) o.sold = true;
      }
      for (let i = 0; i < b.weapons.length; i++) if (canCombine(b, i)) combineWeapon(b, i);
      // 钱还多时刷新一次货架（与真实玩家相似）
      if (money(b) < 40 || rng() < 0.5) break;
      const next = rerollShelf(b, shelf);
      if (next.err) break;
      shelf = next.shelf;
    }
  }
  b.wave = wave;
  b.budget = expectedBudget(b);
  // 经验：大约每波 1.3 级（与机器人对局的平均到达等级接近）
  b.level = Math.round((wave - 1) * 1.3);
  autoLevelPicks(b);
  return b;
}
function score(b: DevBuild, o: { kind: string; id: string; tier: number }, fav: Set<string>): number {
  if (o.kind === 'weapon') {
    const same = b.weapons.some((w) => w.id === o.id && w.tier === o.tier);
    if (same) return 5;
    if (b.weapons.length >= run.maxWeapons) return 0;
    return fav.has(o.id) ? 4 : 1.5 + o.tier;
  }
  const it = ITEM_MAP[o.id];
  return 1 + it.rarity * 0.6;
}

/** C3：把存档里的进行中对局 / 历史记录转换为构筑 */
function fromSavedRun(): DevBuild | null {
  try {
    const d = JSON.parse(localStorage.getItem('tomato_sister_run_v1') ?? 'null') as {
      charId: string;
      chapterId: number;
      wave: number;
      level: number;
      seeds: number;
      weapons: { id: string; tier: number; affixes?: []; forge?: number }[];
      items: Record<string, number>;
      levelMods: Record<string, number>;
    } | null;
    if (!d || !CHARACTER_MAP[d.charId]) return null;
    const b = newBuild(d.charId);
    b.chapterId = d.chapterId;
    b.wave = d.wave + 1;
    b.weapons = d.weapons.map((w) => ({ id: w.id, tier: w.tier, affixes: w.affixes, forge: w.forge }));
    b.items = { ...d.items };
    // 存档的 levelMods 已包含升级成长与加点：直接作为额外属性，等级记 0 避免重复
    b.level = 0;
    b.extraMods = { ...d.levelMods };
    b.budget = d.seeds;
    b.ignoreBudget = true;
    return b;
  } catch {
    return null;
  }
}
function fromRecord(r: RunRecord): DevBuild {
  const b = newBuild(r.charId);
  b.chapterId = r.chapterId;
  b.wave = Math.min(r.wave, 40);
  b.level = r.level;
  b.weapons = r.weapons.map((w) => ({ id: w.id, tier: w.tier, forge: w.forge }));
  b.budget = 0;
  b.ignoreBudget = true;
  autoLevelPicks(b);
  return b;
}

/** C6：构筑分享码（与 1.4.0 构筑分享码同一格式：TMB1. + base64(JSON)） */
export function buildCode(b: DevBuild): string {
  const slim = {
    c: b.charId,
    ch: b.chapterId,
    w: b.wave,
    l: b.level,
    t: b.talents,
    ws: b.weapons,
    it: b.items,
    lp: b.levelPicks,
    x: b.extraMods,
  };
  return 'TMB1.' + btoa(unescape(encodeURIComponent(JSON.stringify(slim))));
}
export function parseBuildCode(code: string): DevBuild | null {
  try {
    const m = /^TMB1\.(.+)$/.exec(code.trim());
    if (!m) return null;
    const s = JSON.parse(decodeURIComponent(escape(atob(m[1])))) as Record<string, unknown>;
    if (!CHARACTER_MAP[s.c as string]) return null;
    return sanitize({
      ...newBuild(s.c as string),
      chapterId: s.ch as number,
      wave: s.w as number,
      level: s.l as number,
      talents: s.t as DevBuild['talents'],
      weapons: s.ws as DevBuild['weapons'],
      items: s.it as DevBuild['items'],
      levelPicks: (s.lp as DevBuild['levelPicks']) ?? [],
      extraMods: (s.x as DevBuild['extraMods']) ?? {},
      ignoreBudget: true,
      budget: 0,
    });
  } catch {
    return null;
  }
}

/** C4：属性来源分解。逐项去掉某个来源重新计算，差值即该来源的贡献 */
function breakdown(ctx: DevCtx): Record<StatKey, Record<string, number>> {
  const b = ctx.build;
  const full = measure(ctx, b).stats;
  const parts: [string, DevBuild][] = [
    ['道具', { ...clone(b), items: {} }],
    ['升级', { ...clone(b), level: 0, levelPicks: [] }],
    ['天赋', { ...clone(b), talents: 'none' }],
    ['开发者', { ...clone(b), extraMods: {} }],
    ['武器词条/套装', { ...clone(b), weapons: b.weapons.map((w) => ({ id: w.id, tier: 0 })) }],
  ];
  const out = {} as Record<StatKey, Record<string, number>>;
  for (const k of STAT_ORDER) out[k] = {};
  let rest = { ...full };
  for (const [name, nb] of parts) {
    const s = measure(ctx, nb).stats;
    for (const k of STAT_ORDER) {
      const d = full[k] - s[k];
      if (Math.abs(d) > 1e-6) out[k][name] = d;
      rest = { ...rest, [k]: rest[k] - d };
    }
  }
  for (const k of STAT_ORDER) if (Math.abs(rest[k]) > 1e-6) out[k]['角色 / 基础'] = rest[k];
  return out;
}
let bd: Record<StatKey, Record<string, number>> | null = null;
let bdKey = '';

export function renderBuildTools(ctx: DevCtx): HTMLElement {
  const b = ctx.build;
  const root = h('div');

  // ---------------- C4 ----------------
  const key = JSON.stringify(b);
  root.append(
    h('h3', null, 'C4 属性来源分解'),
    h(
      'div',
      { class: 'row' },
      btn('计算', () => {
        bd = breakdown(ctx);
        bdKey = key;
        ctx.rerender();
      }),
      h(
        'span',
        { class: 'muted' },
        '逐项去掉道具 / 升级 / 天赋 / 开发者属性 / 武器品质重算；剩余部分归为角色与基础。悬停「最终属性」也可看到。',
      ),
    ),
  );
  if (bd && bdKey === key)
    root.append(
      table(
        ['属性', '来源'],
        STAT_ORDER.filter((k) => Object.keys(bd![k]).length).map((k) => [
          h('span', { style: `color:${STAT_INFO[k].color}` }, STAT_INFO[k].name),
          Object.entries(bd![k])
            .map(([n, v]) => `${n} ${v > 0 ? '+' : ''}${fmt(v)}`)
            .join('　'),
        ]),
      ),
    );

  // ---------------- C1 ----------------
  const B = loadB();
  root.append(
    h('h3', null, 'C1 构筑对比（A = 当前，B = 暂存）'),
    h(
      'div',
      { class: 'row' },
      btn('把当前存为 B', () => (saveB(clone(b)), ctx.toast('已暂存为 B'), ctx.rerender())),
      B ? btn('A ⇄ B 互换', () => (saveB(clone(b)), ctx.setBuild(B))) : '',
      B ? btn('清除 B', () => (saveB(null), ctx.rerender())) : '',
    ),
  );
  if (B) {
    const ma = measure(ctx, b);
    const mb = measure(ctx, B);
    const rows = STAT_ORDER.filter((k) => ma.stats[k] !== mb.stats[k]).map((k) => {
      const d = ma.stats[k] - mb.stats[k];
      return [
        STAT_INFO[k].name,
        fmt(mb.stats[k]),
        fmt(ma.stats[k]),
        h('b', { class: d > 0 ? 'good' : 'bad' }, `${d > 0 ? '+' : ''}${fmt(d)}`),
      ];
    });
    const dd = ma.dps - mb.dps;
    root.append(
      h(
        'div',
        { class: 'box' },
        h('div', null, `B：${CHARACTER_MAP[B.charId].name} W${B.wave} Lv${B.level} · ${mb.weapons.map((w) => w.name).join('/')}`),
        h(
          'div',
          null,
          `期望 DPS 合计  B ${Math.round(mb.dps)} → A ${Math.round(ma.dps)}  `,
          h(
            'b',
            { class: dd >= 0 ? 'good' : 'bad' },
            `${dd >= 0 ? '+' : ''}${Math.round(dd)}（${fmt((dd / Math.max(1, mb.dps)) * 100)}%）`,
          ),
        ),
        rows.length ? table(['属性', 'B', 'A', 'A−B'], rows, { numeric: [1, 2, 3] }) : h('div', { class: 'muted' }, '属性完全相同'),
      ),
    );
  }

  // ---------------- C2 / C3 ----------------
  const recs = save.history.slice(0, 15);
  root.append(
    h('h3', null, 'C2 典型构筑 · C3 从存档导入'),
    h(
      'div',
      { class: 'row' },
      btn(
        `生成典型构筑（${CHARACTER_MAP[b.charId].name} 第${b.chapterId}章 W${b.wave}）`,
        () => {
          const nb = typicalBuild(b.charId, b.chapterId, b.wave);
          nb.talents = b.talents;
          nb.talentMap = b.talentMap;
          ctx.setBuild(nb);
          ctx.toast('已生成典型构筑（逐波按期望收入逛随机商店）');
        },
        'pri',
        '用当前角色 / 章节 / 波次；每次结果随机',
      ),
      btn('载入进行中的对局', () => {
        const nb = fromSavedRun();
        if (!nb) return ctx.toast('存档里没有进行中的对局', true);
        ctx.setBuild(nb);
      }),
    ),
    recs.length
      ? h(
          'div',
          { class: 'row' },
          '历史记录',
          select(
            recs.map((r, i) => [
              i,
              `${new Date(r.t).toLocaleDateString()} ${CHARACTER_MAP[r.charId]?.name ?? r.charId} 第${r.chapterId}章 W${r.wave} ${r.win ? '胜' : '负'}`,
            ]),
            0,
            (v) => ctx.setBuild(fromRecord(recs[Number(v)])),
          ),
          h('span', { class: 'muted' }, '选中即载入（历史记录只存武器，道具无法还原）'),
        )
      : h('div', { class: 'muted' }, '存档里没有历史记录'),
  );

  // ---------------- C6 ----------------
  const codeIn = h('input', { placeholder: '粘贴 TMB1. 开头的分享码', style: 'flex:1' });
  root.append(
    h('h3', null, 'C6 构筑分享码'),
    h(
      'div',
      { class: 'row' },
      btn('复制当前构筑分享码', () => void navigator.clipboard?.writeText(buildCode(b)).then(() => ctx.toast('已复制分享码'))),
      codeIn,
      btn('载入', () => {
        const nb = parseBuildCode(codeIn.value);
        if (!nb) return ctx.toast('分享码无效', true);
        ctx.setBuild(nb);
      }),
    ),
  );

  // ---------------- C7 ----------------
  const map = b.talents === 'custom' ? (b.talentMap ?? {}) : null;
  const nodes = TALENT_NODES.filter((n) => n.branch === branch);
  const spentPts = map ? Object.values(map).reduce((a, v) => a + v, 0) : 0;
  root.append(
    h('h3', null, 'C7 天赋树编辑'),
    h(
      'div',
      { class: 'row' },
      map
        ? h('span', null, `自定义天赋 · 已投入 ${spentPts} 点`)
        : btn('切换为自定义天赋（从存档天赋开始）', () => {
            b.talents = 'custom';
            b.talentMap = savedTalents();
            ctx.changed();
          }),
      map ? btn('清空', () => ((b.talentMap = {}), ctx.changed())) : '',
      map ? btn('全满', () => ((b.talentMap = Object.fromEntries(TALENT_NODES.map((n) => [n.id, n.max]))), ctx.changed())) : '',
      h(
        'span',
        { class: 'seg' },
        ...BRANCHES.map((br) => btn(br.name[0], () => ((branch = br.id), ctx.rerender()), branch === br.id ? 'on' : '')),
      ),
    ),
  );
  if (map)
    root.append(
      table(
        ['天赋', '等级', '效果', ''],
        nodes.map((n) => {
          const lv = map[n.id] ?? 0;
          const parentOk = !n.parent || (map[n.parent] ?? 0) > 0;
          const set = (v: number) => {
            const m = { ...map };
            if (v <= 0) delete m[n.id];
            else m[n.id] = Math.min(n.max, v);
            b.talentMap = m;
            ctx.changed();
          };
          return [
            h(
              'span',
              {
                class: parentOk ? '' : 'muted',
                title: n.parent ? `前置：${TALENT_NODES.find((x) => x.id === n.parent)?.name[0]}` : '核心',
              },
              `${n.icon} ${n.name[0]}`,
            ),
            h('b', { class: lv >= n.max ? 'good' : lv ? 'warn' : 'muted' }, `${lv}/${n.max}`),
            h('span', { class: 'muted small' }, n.desc[0].replace('{v}', fmt(n.val * Math.max(1, lv)))),
            h(
              'span',
              { class: 'nw' },
              btn('−', () => set(lv - 1)),
              btn('+', () => set(lv + 1)),
              btn('满', () => set(n.max)),
            ),
          ];
        }),
      ),
      h('div', { class: 'muted' }, '不校验前置与点数上限，方便测试任意组合；灰色名字表示前置未点。'),
    );
  return root;
}
