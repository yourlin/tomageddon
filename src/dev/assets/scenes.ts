// K6 UI 场景直达：停掉沙盒（Game / Hud 等）后直接打开任意界面场景（使用当前构筑写入的 run），
// 「返回沙盒」停掉所有界面场景并重启沙盒。
import { h, btn, check } from '../dom';
import type { DevCtx } from '../ctx';
import { run } from '../../systems/RunState';
import { save } from '../../systems/Save';

interface Jump {
  key: string;
  name: string;
  tip: string;
  /** 打开前的准备，返回场景 data；返回字符串表示无法打开（原因） */
  prep?: () => object | string | undefined;
  /** 叠加在沙盒之上（不停止 Game） */
  overlay?: boolean;
}

/** 跳转前要不要先把待选升级补到至少 1 次（升级场景没有待选项时会直接跳去商店） */
let ensureLevelUp = true;

const JUMPS: Jump[] = [
  { key: 'Menu', name: '主菜单', tip: 'Menu' },
  { key: 'CharSelect', name: '选角', tip: 'CharSelect' },
  { key: 'Shop', name: '商店', tip: 'Shop（重新进货，使用当前构筑的武器 / 道具 / 资金）', prep: () => ({ keep: false }) },
  {
    key: 'LevelUp',
    name: '升级',
    tip: 'LevelUp（选完全部待选升级 / 宝箱后会进入商店）',
    prep: () => {
      if (ensureLevelUp && run.pendingLevelUps <= 0) run.pendingLevelUps = 1;
      return undefined;
    },
  },
  {
    key: 'Result',
    name: '结算·胜利',
    tip: 'Result { win: true }：counted=true 跳过通关计数与成就累加；已有历史记录时 recorded=true 不新增记录',
    prep: () => ({ win: true, counted: true, recorded: save.history.length > 0 }),
  },
  {
    key: 'Result',
    name: '结算·失败',
    tip: 'Result { win: false }：counted=true 跳过死亡计数；已有历史记录时 recorded=true 不新增记录',
    prep: () => ({ win: false, counted: true, recorded: save.history.length > 0 }),
  },
  {
    key: 'RunStats',
    name: '本局数据',
    tip: 'RunStats { record: 最近一条历史记录 }',
    prep: () => (save.history[0] ? { record: save.history[0] } : '还没有历史记录（先打开一次「结算」生成一条）'),
  },
  { key: 'Codex', name: '图鉴', tip: 'Codex' },
  { key: 'Achievements', name: '成就', tip: 'Achievements' },
  { key: 'TalentTree', name: '天赋树', tip: 'TalentTree' },
  { key: 'Challenge', name: '挑战', tip: 'Challenge' },
  { key: 'History', name: '历史记录', tip: 'History' },
  { key: 'Changelog', name: '更新日志', tip: 'Changelog' },
  { key: 'Settings', name: '设置', tip: 'Settings（从主菜单进入的样式）' },
  { key: 'Pause', name: '暂停菜单（叠加）', tip: 'Pause：暂停 Game / Hud 后叠加打开，不停止沙盒', overlay: true },
];

/** 沙盒本身的场景：返回沙盒时由 sb.restart() 重新拉起 */
const SANDBOX_KEYS = new Set(['Boot', 'Game']);

function stopOthers(ctx: DevCtx, keep: Set<string>): void {
  const sm = ctx.sb.game.scene;
  for (const s of sm.getScenes(false)) {
    const k = s.sys.settings.key;
    if (keep.has(k)) continue;
    if (sm.isActive(k) || sm.isPaused(k) || sm.isSleeping(k)) sm.stop(k);
  }
}

export function renderScenes(ctx: DevCtx): HTMLElement {
  const sm = ctx.sb.game.scene;
  const root = h('div');
  const redraw = () => root.replaceWith(renderScenes(ctx));

  const go = (j: Jump) => {
    const data = j.prep?.();
    if (typeof data === 'string') return ctx.toast(data, true);
    if (j.overlay) {
      if (!ctx.sb.running) return ctx.toast('沙盒未运行', true);
      if (sm.isActive('Game')) sm.pause('Game');
      if (sm.isActive('Hud')) sm.pause('Hud');
      sm.run(j.key, data);
    } else {
      // 停掉 Game / Hud 及其他所有场景（同 sandbox.restart() 的停止方式，但覆盖全部场景）
      stopOthers(ctx, new Set(['Boot']));
      sm.start(j.key, data);
    }
    ctx.toast(`已打开 ${j.key}`);
    window.setTimeout(redraw, 100);
  };

  const back = () => {
    stopOthers(ctx, SANDBOX_KEYS);
    ctx.sb.restart();
    ctx.toast('已返回沙盒');
    window.setTimeout(redraw, 100);
  };

  const all = sm.getScenes(false).map((s) => s.sys.settings.key);
  const state = (k: string) =>
    sm.isActive(k)
      ? h('span', { class: 'good' }, '运行')
      : sm.isPaused(k)
        ? h('span', { class: 'warn' }, '暂停')
        : sm.isSleeping(k)
          ? h('span', { class: 'warn' }, '休眠')
          : h('span', { class: 'muted' }, '—');

  root.append(
    h(
      'div',
      { class: 'row' },
      btn('↩ 返回沙盒', back, 'pri', '停止所有界面场景并重启沙盒（ctx.sb.restart）'),
      check('升级场景至少 1 次待选', ensureLevelUp, (v) => (ensureLevelUp = v)),
      btn('刷新状态', redraw),
    ),
    h(
      'div',
      { class: 'row' },
      ...JUMPS.map((j) => {
        const exists = all.includes(j.key);
        const b = btn(j.name, () => go(j), '', exists ? j.tip : `场景 ${j.key} 不存在`);
        b.disabled = !exists;
        return b;
      }),
    ),
    h(
      'div',
      { class: 'muted small' },
      '直达会停止沙盒（Game / Hud）；界面使用当前构筑写入的 run。开发者模式不写存档，结算等场景里的计数只留在内存。界面里的「开始下一波 / 再来一局」会进入沙盒模式的战斗。',
    ),
    h('h3', null, `全部场景（${all.length}）`),
    h('div', { class: 'row' }, ...all.map((k) => h('span', { class: 'tag', title: k }, `${k} `, state(k)))),
  );
  return root;
}
