// K5 多语言检查：把游戏数据（中文）和英文覆盖表（src/i18n/en/*.ts）逐条对比，
// 列出缺失的英文条目，以及过长（英文长度 > 中文 2.5 倍或 > 120 字符）可能溢出的文本。
// 只覆盖 i18n/apply.ts 写回的数据文本；界面里的 tx('中', 'En') 两种语言写在同一处，不会缺失，不在检查范围。
import { h, btn, select, table } from '../dom';
import type { DevCtx } from '../ctx';
import { lang } from '../../i18n';
import { CHARACTERS } from '../../data/characters';
import { WEAPONS } from '../../data/weapons';
import { EVOLVED_WEAPONS } from '../../data/evolutions';
import { ITEMS, ALL_ITEMS } from '../../data/items';
import { ENEMIES } from '../../data/enemies';
import { BOSSES, AFFIXES } from '../../data/bosses';
import { STATUSES } from '../../data/statuses';
import { CHAPTERS, TERRAIN_INFO } from '../../data/chapters';
import { STAT_INFO } from '../../data/stats';
import { SKILL_TYPE_NAME } from '../../data/skills';
import { RARITY } from '../../data/balance';
import { EN_CHARACTERS } from '../../i18n/en/characters';
import { EN_ITEMS, EN_SERIES } from '../../i18n/en/items';
import { EN_ENEMIES, EN_BOSSES, EN_AFFIXES } from '../../i18n/en/monsters';
import { EN_WEAPONS, EN_WEAPON_TAGS, EN_STATUSES, EN_CHAPTERS, EN_STATS, EN_SKILL_TYPES, EN_RARITY } from '../../i18n/en/misc';

type Issue = 'missing' | 'long' | 'extra';
interface Row {
  cat: string;
  id: string;
  field: string;
  issue: Issue;
  zh: string;
  en: string;
}

const ISSUE_NAME: Record<Issue, string> = { missing: '缺失', long: '过长', extra: '多余' };
const LONG_RATIO = 2.5;
const LONG_MAX = 120;

let filter: '' | Issue = '';
let catFilter = '';
let cache: Row[] | null = null;

function check(): Row[] {
  const rows: Row[] = [];
  /** 对比一个字段：英文为空即缺失；否则检查长度 */
  const cmp = (cat: string, id: string, field: string, zh: string | undefined, en: string | undefined) => {
    if (!zh) return;
    if (en === undefined || en === null || en.trim() === '') rows.push({ cat, id, field, issue: 'missing', zh, en: '' });
    else if (en.length > LONG_MAX || en.length > zh.length * LONG_RATIO) rows.push({ cat, id, field, issue: 'long', zh, en });
  };
  /** 英文表里有、数据里没有的 id（多半是改名或删除后遗留） */
  const extra = (cat: string, enKeys: string[], ids: Set<string>) => {
    for (const k of enKeys) if (!ids.has(k)) rows.push({ cat, id: k, field: '—', issue: 'extra', zh: '', en: '数据中不存在该 id' });
  };

  // 角色
  for (const c of CHARACTERS) {
    const e = EN_CHARACTERS[c.id];
    const cat = '角色';
    cmp(cat, c.id, 'name', c.name, e?.name);
    cmp(cat, c.id, 'title', c.title, e?.title);
    cmp(cat, c.id, 'desc', c.desc, e?.desc);
    cmp(cat, c.id, 'skill.name', c.skill.name, e?.skill?.name);
    cmp(cat, c.id, 'skill.desc', c.skill.desc, e?.skill?.desc);
    cmp(cat, c.id, 'talent.name', c.talent.name, e?.talent?.name);
    cmp(cat, c.id, 'talent.desc', c.talent.desc, e?.talent?.desc);
    c.traits.forEach((t, i) => cmp(cat, c.id, `traits[${i}]`, t, e?.traits?.[i]));
    if (e && e.traits.length > c.traits.length)
      rows.push({ cat, id: c.id, field: 'traits', issue: 'extra', zh: `${c.traits.length} 条`, en: `${e.traits.length} 条` });
  }
  extra('角色', Object.keys(EN_CHARACTERS), new Set(CHARACTERS.map((c) => c.id)));

  // 武器（含进化超武）
  const weapons = [...WEAPONS, ...EVOLVED_WEAPONS];
  for (const w of weapons) {
    cmp('武器', w.id, 'name', w.name, EN_WEAPONS[w.id]?.name);
    cmp('武器', w.id, 'desc', w.desc, EN_WEAPONS[w.id]?.desc);
  }
  extra('武器', Object.keys(EN_WEAPONS), new Set(weapons.map((w) => w.id)));
  for (const t of new Set(weapons.flatMap((w) => w.tags))) cmp('武器标签', t, 'tag', t, EN_WEAPON_TAGS[t]);

  // 经典道具
  for (const it of ITEMS) {
    const zhName = it.nameZh ?? it.name;
    cmp('道具', it.id, 'name', zhName, EN_ITEMS[it.id]?.name);
    if (it.desc) cmp('道具', it.id, 'desc', it.desc, EN_ITEMS[it.id]?.desc);
  }
  extra('道具', Object.keys(EN_ITEMS), new Set(ITEMS.map((i) => i.id)));

  // 系列道具：id 形如 <系列id>_<序号>，英文按序号取名字
  const series = new Map<string, { name: string; items: { n: number; id: string; name: string }[] }>();
  for (const it of ALL_ITEMS) {
    const m = /^(.+)_(\d+)$/.exec(it.id);
    if (!it.series || !m) continue;
    const s = series.get(m[1]) ?? { name: it.series, items: [] };
    s.items.push({ n: Number(m[2]), id: it.id, name: it.nameZh ?? it.name });
    series.set(m[1], s);
  }
  for (const [sid, s] of series) {
    const e = EN_SERIES[sid];
    cmp('系列道具', sid, 'series', s.name, e?.name);
    for (const it of s.items) cmp('系列道具', it.id, `items[${it.n}]`, it.name, e?.items?.[it.n]);
  }
  extra('系列道具', Object.keys(EN_SERIES), new Set(series.keys()));

  // 怪物 / 精英 / Boss / 词缀
  for (const e of ENEMIES) {
    cmp('怪物', e.id, 'name', e.name, EN_ENEMIES[e.id]?.name);
    cmp('怪物', e.id, 'desc', e.desc, EN_ENEMIES[e.id]?.desc);
  }
  extra('怪物', Object.keys(EN_ENEMIES), new Set(ENEMIES.map((e) => e.id)));
  for (const b of BOSSES) {
    const cat = b.elite ? '精英' : 'Boss';
    cmp(cat, b.id, 'name', b.name, EN_BOSSES[b.id]?.name);
    cmp(cat, b.id, 'title', b.title, EN_BOSSES[b.id]?.title);
    cmp(cat, b.id, 'desc', b.desc, EN_BOSSES[b.id]?.desc);
  }
  extra('Boss', Object.keys(EN_BOSSES), new Set(BOSSES.map((b) => b.id)));
  for (const a of Object.values(AFFIXES)) {
    const e = (EN_AFFIXES as Partial<typeof EN_AFFIXES>)[a.id];
    cmp('词缀', a.id, 'name', a.name, e?.name);
    cmp('词缀', a.id, 'desc', a.desc, e?.desc);
  }

  // 状态
  for (const s of Object.values(STATUSES)) {
    const e = (EN_STATUSES as Partial<typeof EN_STATUSES>)[s.id];
    cmp('状态', s.id, 'name', s.name, e?.name);
    cmp('状态', s.id, 'desc', s.desc, e?.desc);
    cmp('状态', s.id, 'glyph', s.glyph, e?.glyph);
  }

  // 章节 + 地形说明
  for (const c of CHAPTERS) {
    const e = EN_CHAPTERS[c.id];
    cmp('章节', String(c.id), 'name', c.name, e?.name);
    cmp('章节', String(c.id), 'desc', c.desc, e?.desc);
    (TERRAIN_INFO[c.id] ?? []).forEach((t, i) => cmp('章节', String(c.id), `terrain[${i}]`, t, e?.terrain?.[i]));
  }

  // 属性 / 技能类型 / 稀有度
  for (const [k, v] of Object.entries(STAT_INFO)) cmp('属性', k, 'name', v.name, (EN_STATS as Record<string, string | undefined>)[k]);
  for (const [k, v] of Object.entries(SKILL_TYPE_NAME)) cmp('技能类型', k, 'name', v, EN_SKILL_TYPES[k]);
  RARITY.forEach((r, i) => cmp('稀有度', String(i), 'name', r.name, EN_RARITY[i]));
  return rows;
}

export function renderI18n(ctx: DevCtx): HTMLElement {
  const root = h('div');
  const rows = (cache ??= check());
  const cats = [...new Set(rows.map((r) => r.cat))];
  if (catFilter && !cats.includes(catFilter)) catFilter = '';
  const n = (i: Issue) => rows.filter((r) => r.issue === i).length;
  const shown = rows.filter((r) => (!filter || r.issue === filter) && (!catFilter || r.cat === catFilter));
  const redraw = () => root.replaceWith(renderI18n(ctx));

  root.append(
    lang === 'en'
      ? h(
          'div',
          { class: 'warn' },
          '当前语言是英文：数据对象已被英文覆盖表写回，「中文」列实际是英文，检查结果无效。请用 ?dev&lang=zh 打开后再检查。',
        )
      : '',
    h(
      'div',
      { class: 'row' },
      h('span', null, `缺失 ${n('missing')} · 过长 ${n('long')} · 多余 ${n('extra')}`),
      select(
        [
          ['', '全部问题'],
          ['missing', '只看缺失'],
          ['long', '只看过长'],
          ['extra', '只看多余'],
        ],
        filter,
        (v) => {
          filter = v as '' | Issue;
          redraw();
        },
      ),
      select(
        [['', '全部分类'], ...cats.map((c): [string, string] => [c, `${c}（${rows.filter((r) => r.cat === c).length}）`])],
        catFilter,
        (v) => {
          catFilter = v;
          redraw();
        },
      ),
      btn('重新检查', () => {
        cache = null;
        redraw();
      }),
      btn('切换到英文界面', () => {
        const u = new URL(location.href);
        u.searchParams.set('lang', 'en');
        location.href = u.toString();
      }),
      btn('切换到中文界面', () => {
        const u = new URL(location.href);
        u.searchParams.set('lang', 'zh');
        location.href = u.toString();
      }),
    ),
    h(
      'div',
      { class: 'muted small' },
      `过长：英文长度 > 中文 ${LONG_RATIO} 倍或 > ${LONG_MAX} 字符（可能在卡片 / 按钮中溢出）。多余：英文表中有但数据中已不存在的 id。切换语言会重新加载页面。`,
    ),
    shown.length
      ? table(
          ['分类', 'id', '字段', '问题', '中文', '英文', '长度'],
          shown
            .slice(0, 500)
            .map((r) => [
              r.cat,
              h('span', { class: 'nw' }, r.id),
              h('span', { class: 'muted nw' }, r.field),
              h('span', { class: r.issue === 'missing' ? 'bad' : 'warn' }, ISSUE_NAME[r.issue]),
              r.zh,
              r.en ? r.en : h('span', { class: 'muted' }, '（无）'),
              r.issue === 'long' ? `${r.en.length}/${r.zh.length}` : '',
            ]),
          { numeric: [6] },
        )
      : h('div', { class: 'good' }, '没有发现问题'),
    shown.length > 500 ? h('div', { class: 'muted' }, `只显示前 500 条（共 ${shown.length} 条）`) : '',
  );
  return root;
}
