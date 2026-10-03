// 调试页（J 模块）：实体检查器 · 事件流 · 报错 · 场景栈 / 新手提示队列 · 存档与 localStorage 查看
import Phaser from 'phaser';
import { h, btn, check, num, table, esc } from '../dom';
import type { DevCtx } from '../ctx';
import { logs, logEv, clock, EV_NAME, type EvKind } from '../log';
import { GameScene } from '../../scenes/GameScene';
import { SkillSystem } from '../../systems/SkillSystem';
import { StatusSet } from '../../systems/Status';
import { run } from '../../systems/RunState';
import { save } from '../../systems/Save';
import type { DevBuild } from '../build';
import type { Snapshot } from '../sandbox';

type Fn = (...a: unknown[]) => unknown;
let hooked = false;

/** J2：给游戏的关键方法套一层记录（只在开发者模式下调用一次） */
export function installEventHooks(): void {
  if (hooked) return;
  hooked = true;
  const P = GameScene.prototype as unknown as Record<string, Fn>;
  const wrap = (obj: Record<string, Fn>, name: string, after: (self: unknown, args: unknown[], ret: unknown, before: number) => void) => {
    const orig = obj[name];
    if (typeof orig !== 'function') return;
    obj[name] = function (this: unknown, ...args: unknown[]) {
      const before = run.hp;
      const ret = orig.apply(this, args);
      try {
        after(this, args, ret, before);
      } catch {
        /* 记录失败不影响游戏 */
      }
      return ret;
    };
  };
  wrap(P, 'heal', (_s, a, _r, before) => {
    const d = run.hp - before;
    if (d > 0) logEv('heal', `玩家 +${d.toFixed(1)} 生命（请求 ${Number(a[0]).toFixed(1)}）→ ${Math.ceil(run.hp)}`);
  });
  wrap(P, 'damagePlayer', (_s, a, _r, before) => {
    const d = before - run.hp;
    const src = (a[1] as { def?: { name: string }; boss?: { name: string } } | undefined) ?? null;
    const who = src?.boss?.name ?? src?.def?.name ?? '未知';
    logEv('hurt', d > 0 ? `玩家 -${d.toFixed(1)}（来自 ${who}，原始 ${Number(a[0]).toFixed(1)}）` : `玩家免伤（${who}：闪避 / 无敌 / 护盾）`);
  });
  wrap(P, 'killEnemy', (_s, a) => {
    const e = a[0] as { def?: { name: string }; boss?: { name: string }; maxHp: number };
    logEv('kill', `击杀 ${e.boss?.name ?? e.def?.name ?? '?'}（最大生命 ${e.maxHp}）`);
  });
  wrap(P, 'collect', (_s, a) => {
    const p = a[0] as { kind: string; value?: number };
    logEv('pickup', `拾取 ${p.kind}${p.value ? ' ×' + p.value : ''}`);
  });
  wrap(P, 'damageEnemy', (_s, a) => {
    const e = a[0] as { def?: { name: string }; boss?: { name: string } };
    logEv('dmg', `${e.boss?.name ?? e.def?.name ?? '?'} 受到 ${Number(a[1]).toFixed(1)}`);
  });
  wrap(SkillSystem.prototype as unknown as Record<string, Fn>, 'use', (s) => {
    logEv('skill', `释放技能 ${(s as SkillSystem).skill.name}`);
  });
  wrap(StatusSet.prototype as unknown as Record<string, Fn>, 'apply', (_s, a, ok) => {
    const st = a[0] as { id: string; dur: number; stacks?: number };
    if (ok) logEv('status', `状态 ${st.id} ×${st.stacks ?? 1}（${st.dur}s）`);
  });
}

let evFilter = '';
let inspectOpen = true;

/** J1：把任意对象的字段展开成表格（跳过 Phaser 内部对象，只列一层基本值 + 数组长度） */
function fields(o: unknown): [string, string][] {
  if (!o || typeof o !== 'object') return [];
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    if (k.startsWith('_') || typeof v === 'function') continue;
    if (v === null || ['number', 'string', 'boolean'].includes(typeof v)) out.push([k, typeof v === 'number' ? String(Math.round(v * 100) / 100) : String(v)]);
    else if (Array.isArray(v)) out.push([k, `[${v.length}]`]);
    else if (v instanceof Phaser.GameObjects.GameObject) out.push([k, `<${v.type}>`]);
    else if (typeof v === 'object') {
      const keys = Object.keys(v);
      if (keys.length <= 8 && keys.every((x) => ['number', 'string', 'boolean'].includes(typeof (v as Record<string, unknown>)[x])))
        out.push([k, JSON.stringify(v)]);
      else out.push([k, `{${keys.slice(0, 6).join(', ')}${keys.length > 6 ? '…' : ''}}`]);
    }
  }
  return out;
}

export function renderDebug(ctx: DevCtx): HTMLElement {
  const sb = ctx.sb;
  const root = h('div');

  // ---------------- J1 实体检查器 ----------------
  const sel = sb.selected;
  root.append(
    h('h3', null, 'J1 实体检查器'),
    h('div', { class: 'muted' }, '在画面上左键点选一个敌人（沙盒页「左键点击画面」选「选中 / 拖动目标」）。弹幕和掉落物见下方统计。'),
  );
  if (sel && sb.running && sel.alive) {
    root.append(
      h('div', { class: 'row' }, check('展开全部字段', inspectOpen, (v) => ((inspectOpen = v), ctx.rerender())), btn('刷新', () => ctx.rerender())),
      table(
        ['字段', '值'],
        (inspectOpen ? fields(sel) : fields(sel).filter(([k]) => ['hp', 'maxHp', 'x', 'y', 'speed', 'dmg', 'phase2', 'radius'].includes(k))).map(([k, v]) => [
          k,
          v,
        ]),
      ),
      h('div', { class: 'muted small' }, '状态：' + ((sel as unknown as { status?: StatusSet }).status?.list.map((s) => `${s.id}×${s.stacks}`).join(' ') || '无')),
    );
  } else root.append(h('div', { class: 'muted' }, '未选中'));
  if (sb.running) {
    const g = sb.g as unknown as Record<string, unknown>;
    const count = (k: string) => {
      const v = g[k] as { countActive?: () => number; length?: number } | undefined;
      return v?.countActive ? v.countActive() : Array.isArray(v) ? (v as unknown[]).filter((x) => (x as { alive?: boolean }).alive !== false).length : '—';
    };
    root.append(
      table(
        ['集合', '存活'],
        ['enemies', 'bullets', 'enemyBullets', 'pickups', 'hazards'].map((k) => [k, String(count(k))]),
      ),
      h('div', { class: 'row' }, btn('在控制台打印 GameScene', () => (console.log(sb.g), ctx.toast('已输出到浏览器控制台（F12）')))),
    );
  }

  // ---------------- J2 事件流 ----------------
  const kinds = Object.keys(EV_NAME) as EvKind[];
  const q = evFilter.trim();
  const evs = logs.events.filter((e) => !q || e.text.includes(q)).slice(0, 200);
  root.append(
    h('h3', null, `J2 事件流（${logs.events.length}）`),
    h(
      'div',
      { class: 'row' },
      btn(logs.evPaused ? '▶ 继续记录' : '⏸ 暂停记录', () => ((logs.evPaused = !logs.evPaused), ctx.rerender())),
      btn('清空', () => ((logs.events.length = 0), ctx.rerender())),
      btn('刷新', () => ctx.rerender()),
      ...kinds.map((k) =>
        check(EV_NAME[k], logs.evOn.has(k), (v) => {
          if (v) logs.evOn.add(k);
          else logs.evOn.delete(k);
        }),
      ),
      '伤害采样 1/',
      num(logs.dmgSample, (v) => (logs.dmgSample = v), { min: 1, max: 100, width: 48 }),
      h('input', {
        placeholder: '过滤文字',
        value: evFilter,
        onchange: (e: Event) => ((evFilter = (e.target as HTMLInputElement).value), ctx.rerender()),
      }),
    ),
    h(
      'div',
      { class: 'oplog' },
      ...evs.map((e) => h('div', null, h('span', { class: 'muted' }, `${(e.t / 1000).toFixed(2)} ${EV_NAME[e.kind]}`), ' ', e.text)),
    ),
  );

  // ---------------- J3 报错 ----------------
  root.append(h('h3', null, `J3 报错（${logs.errors.length}）`));
  if (!logs.errors.length) root.append(h('div', { class: 'muted' }, '没有捕获到报错'));
  for (const e of logs.errors)
    root.append(
      h(
        'div',
        { class: 'box' },
        h('div', { class: 'bad' }, `${clock(e.t)} ${e.msg}`),
        e.stack ? h('pre', { class: 'small', style: 'white-space:pre-wrap;margin:2px 0' }, e.stack.split('\n').slice(0, 6).join('\n')) : '',
        h(
          'div',
          { class: 'row' },
          e.build ? btn('载入当时的构筑', () => ctx.setBuild(JSON.parse(e.build) as DevBuild)) : '',
          e.snap && e.snap !== 'null' ? btn('恢复当时的快照', () => ctx.restoreSnapshot(JSON.parse(e.snap) as Snapshot)) : '',
          btn('复制报告', () => void navigator.clipboard?.writeText(`${e.msg}\n${e.stack}\n\nbuild: ${e.build}\n\nsnap: ${e.snap}`).then(() => ctx.toast('已复制'))),
        ),
      ),
    );
  if (logs.errors.length) root.append(btn('清空报错', () => ((logs.errors.length = 0), ctx.rerender())));

  // ---------------- J4 场景栈 ----------------
  const game = sb.game;
  const scenes = game.scene.getScenes(false).map((s) => {
    const st = s.sys.settings.status;
    const name = ['PENDING', 'INIT', 'START', 'LOADING', 'CREATING', 'RUNNING', 'PAUSED', 'SLEEPING', 'SHUTDOWN', 'DESTROYED'][st] ?? String(st);
    return [s.sys.settings.key, name, s.sys.isVisible() ? '可见' : '隐藏'];
  });
  const tips = document.querySelectorAll('.tutorial-tip, [data-tutorial]');
  root.append(
    h('h3', null, 'J4 场景栈'),
    table(['场景', '状态', ''], scenes.filter((s) => s[1] !== 'PENDING' || s[0] === 'Game')),
    h('div', { class: 'muted' }, `页面上的新手提示元素：${tips.length} 个`),
  );

  // ---------------- J5 存档 / localStorage ----------------
  const keys = Object.keys(localStorage).sort();
  root.append(
    h('h3', null, `J5 存档与 localStorage（${keys.length} 项）`),
    h('div', { class: 'muted' }, '开发者模式下存档不写盘（persist 已关闭），这里看到的是内存中的存档与浏览器里的原始数据。'),
    h(
      'details',
      null,
      h('summary', null, '内存中的存档（save）'),
      h('pre', { class: 'small', style: 'white-space:pre-wrap;max-height:300px;overflow:auto' }, esc(JSON.stringify(save, null, 1)).slice(0, 20000)),
    ),
    table(
      ['键', '大小', ''],
      keys.map((k) => {
        const v = localStorage.getItem(k) ?? '';
        return [
          k,
          `${(v.length / 1024).toFixed(1)} KB`,
          btn('复制', () => void navigator.clipboard?.writeText(v).then(() => ctx.toast(`已复制 ${k}`))),
        ];
      }),
      { numeric: [1] },
    ),
  );
  return root;
}
