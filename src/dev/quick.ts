// 快捷栏：常驻在面板顶部，不用切页签就能换角色、逐个浏览怪物。
// 快捷键见 prefs.ts（默认 [ / ] 换角色，, / . 换怪物），由 DevPanel 统一分发
import { h, btn, select } from './dom';
import type { DevCtx } from './ctx';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { ENEMIES, ENEMY_MAP } from '../data/enemies';
import { elitePool, bossPool } from '../data/bosses';
import type { AttackMode } from './sandbox';
import { thumb } from './thumbs';
import { prefs, keyText } from './prefs';
import { openModal } from './palette';
import { allMonsters } from './tabs/monsterTools';

/** 浏览怪物时生成的目标怎么行动：正常攻击（看招式）/ 木桩 / 只手动触发 */
let viewMode: AttackMode = 'ai';

/** 切换角色：武器仍是旧角色的初始武器时，一并换成新角色的初始武器 */
export function switchChar(ctx: DevCtx, id: string): void {
  const b = ctx.build;
  if (!CHARACTER_MAP[id] || id === b.charId) return;
  const old = CHARACTER_MAP[b.charId].startWeapons;
  const same = b.weapons.length === old.length && b.weapons.every((w, i) => w.id === old[i] && w.tier === 0);
  b.charId = id;
  if (same) b.weapons = CHARACTER_MAP[id].startWeapons.map((wid) => ({ id: wid, tier: 0 }));
  ctx.changed();
}

export function stepChar(ctx: DevCtx, delta: number): void {
  const n = CHARACTERS.length;
  const i = CHARACTERS.findIndex((c) => c.id === ctx.build.charId);
  switchChar(ctx, CHARACTERS[(i + delta + n) % n].id);
}

export interface Monster {
  /** 与 ui.mSel 相同的写法：小怪为 id，精英 / Boss 为 b:id */
  sel: string;
  id: string;
  boss: boolean;
  name: string;
}

/** 当前怪物页筛选条件（章节、列表类别、搜索词）下的怪物序列 */
export function monsterList(ctx: DevCtx): Monster[] {
  const ui = ctx.ui;
  const ch = CHAPTERS[ui.mChapter - 1];
  const q = ui.mSearch.trim().toLowerCase();
  const ok = (name: string, id: string) => !q || name.toLowerCase().includes(q) || id.includes(q);
  if (ui.mCat === 'all') return allMonsters(q);
  if (ui.mCat === 'pool' || ui.mCat === 'minion') {
    const ids = ui.mCat === 'pool' ? [...new Set(ch.pool.map((p) => p.enemy))] : ENEMIES.map((d) => d.id);
    return ids
      .map((id) => ENEMY_MAP[id])
      .filter((d) => d && ok(d.name, d.id))
      .map((d) => ({ sel: d.id, id: d.id, boss: false, name: d.name }));
  }
  const list = ui.mCat === 'elite' ? elitePool(ui.mChapter) : bossPool(ui.mChapter);
  return list.filter((b) => ok(b.name, b.id)).map((b) => ({ sel: 'b:' + b.id, id: b.id, boss: true, name: b.name }));
}

/** 清场后生成下一个（或上一个）怪物，并在怪物页展开它的详情 */
export function stepMonster(ctx: DevCtx, delta: number): void {
  const list = monsterList(ctx);
  if (!list.length) return ctx.toast('当前筛选下没有怪物', true);
  const i = list.findIndex((m) => m.sel === ctx.ui.mSel);
  const m = list[i < 0 ? (delta > 0 ? 0 : list.length - 1) : (i + delta + list.length) % list.length];
  showMonster(ctx, m);
}

export function showMonster(ctx: DevCtx, m: Monster): void {
  const ui = ctx.ui;
  ui.mSel = m.sel;
  ui.tab = 'monsters';
  ctx.sb.clear();
  const err = ctx.sb.spawn(m.id, m.boss, {
    ...ui.spawn,
    chapterId: ui.mChapter,
    wave: ui.mWave,
    count: 1,
    attack: viewMode,
    lock: true,
    immortal: true,
    test: false,
    // 近一点生成，方便看清外形与近身招式
    dist: [200, 220],
  });
  if (err) ctx.toast(err, true);
  ctx.rerender();
}

export function renderQuick(ctx: DevCtx, el: HTMLElement): void {
  const ui = ctx.ui;
  const list = monsterList(ctx);
  const cur = list.find((m) => m.sel === ui.mSel);
  const pos = cur ? `${list.indexOf(cur) + 1}/${list.length}` : `—/${list.length}`;
  const seg = (v: typeof ui.mCat, label: string) =>
    btn(
      label,
      () => {
        ui.mCat = v;
        ui.mSel = '';
        ctx.rerender();
      },
      ui.mCat === v ? 'on' : '',
    );
  const k = (a: Parameters<typeof keyText>[0]) => keyText(a);
  // 怪物缩略图条：当前筛选下的全部怪物，点哪个生成哪个
  const strip = h(
    'div',
    { class: 'strip' },
    ...list.map((m) =>
      h(
        'a',
        { class: m.sel === ui.mSel ? 'on' : '', title: m.name, onclick: () => showMonster(ctx, m) },
        thumb(m.boss ? 'boss' : 'enemy', m.id, 30),
      ),
    ),
  );
  el.replaceChildren(
    h(
      'div',
      { class: 'row' },
      h('b', { class: 'nw' }, '角色'),
      thumb('char', ctx.build.charId, 26),
      btn('◀', () => stepChar(ctx, -1), '', `上一个角色（${k(prefs.keys.charPrev)}）`),
      select(
        CHARACTERS.map((c) => [c.id, `${c.name}（${c.title}）`]),
        ctx.build.charId,
        (v) => switchChar(ctx, v),
      ),
      btn('▶', () => stepChar(ctx, 1), '', `下一个角色（${k(prefs.keys.charNext)}）`),
      btn('▦ 网格选择', () => openCharGrid(ctx, el.ownerDocument)),
      h('span', { class: 'muted small' }, `${k(prefs.keys.charPrev)} ${k(prefs.keys.charNext)} 切换`),
    ),
    h(
      'div',
      { class: 'row' },
      h('b', { class: 'nw' }, '怪物'),
      select(
        CHAPTERS.map((c) => [c.id, `第${c.id}章`]),
        ui.mChapter,
        (v) => ((ui.mChapter = Number(v)), (ui.mSel = ''), ctx.rerender()),
      ),
      h(
        'span',
        { class: 'seg' },
        seg('pool', '刷怪池'),
        seg('minion', '全部小怪'),
        seg('elite', '精英'),
        seg('boss', 'Boss'),
        seg('all', '全类别'),
      ),
      select(
        [
          ['ai', '正常攻击'],
          ['none', '木桩'],
          ['manual', '手动招式'],
        ],
        viewMode,
        (v) => (viewMode = v as AttackMode),
      ),
    ),
    strip,
    h(
      'div',
      { class: 'row' },
      btn('◀', () => stepMonster(ctx, -1), '', `清场并生成上一个（${k(prefs.keys.monPrev)}）`),
      h('b', { class: 'cur' }, cur ? cur.name : '（未选择）'),
      h('span', { class: 'muted' }, pos),
      btn('▶', () => stepMonster(ctx, 1), '', `清场并生成下一个（${k(prefs.keys.monNext)}）`),
      cur ? btn('重新生成', () => showMonster(ctx, cur)) : '',
      h('span', { class: 'muted small' }, `${k(prefs.keys.monPrev)} ${k(prefs.keys.monNext)} 切换 · 生成在玩家附近、锁血锁位`),
    ),
  );
}

/** 角色网格选择器：头像 + 名称，可搜索 */
function openCharGrid(ctx: DevCtx, doc: Document): void {
  const grid = h('div', { class: 'cgrid' });
  const input = h('input', { placeholder: '搜索角色名 / 称号 / id' });
  let close = () => {};
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    grid.replaceChildren(
      ...CHARACTERS.filter((c) => !q || `${c.name}${c.title}${c.id}`.toLowerCase().includes(q)).map((c) =>
        h(
          'a',
          {
            class: c.id === ctx.build.charId ? 'on' : '',
            onclick: () => {
              close();
              switchChar(ctx, c.id);
            },
          },
          thumb('char', c.id, 56),
          h('div', null, c.name),
          h('div', { class: 'muted small' }, c.title),
        ),
      ),
    );
  };
  input.addEventListener('input', draw);
  draw();
  close = openModal(doc, h('div', null, input, grid));
  input.focus();
}

/** 输入框（文字 / 数字）有焦点时不响应快捷键 */
export const isTyping = (el: Element | null): boolean =>
  !!el &&
  (el.tagName === 'TEXTAREA' ||
    (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'range', 'color'].includes((el as HTMLInputElement).type)));
