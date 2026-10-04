// 沙盒页：慢放 / 单步、镜头、点击放置与传送、玩家锁定、地形机制开关、真实刷怪、
// 快照与回放、刷怪剧本、碰撞框与性能叠加层
import { h, btn, check, select, num, table, fmt } from '../dom';
import { lineup, reelWall, type LineupKind } from '../gallery';
import { clearReels } from '../reelCache';
import type { DevCtx } from '../ctx';
import { TERRAIN_MECHS, Terrain } from '../../systems/Terrain';
import { CHAPTERS } from '../../data/chapters';
import { CHARACTER_MAP } from '../../data/characters';
import type { Snapshot } from '../sandbox';
import { monsterList } from '../quick';

const SNAP_KEY = 'tomageddon_dev_snaps';
const SCRIPT_KEY = 'tomageddon_dev_scripts';

export function loadSnaps(): Snapshot[] {
  try {
    return JSON.parse(localStorage.getItem(SNAP_KEY) ?? '[]') as Snapshot[];
  } catch {
    return [];
  }
}
export function saveSnaps(list: Snapshot[]): void {
  localStorage.setItem(SNAP_KEY, JSON.stringify(list.slice(0, 30)));
}
function loadScripts(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SCRIPT_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

let scriptSrc = '# 秒数 怪物id 数量 [b=精英/Boss]\n0 mold 12\n3 mold 12\n6 roach_general 1 b\n';
let scriptName = '';
let rewindSec = 5;

/** 保存当前沙盒为快照（同时写入 localStorage） */
export function takeSnapshot(ctx: DevCtx, label = ''): void {
  const s = ctx.sb.capture(label || `${CHARACTER_MAP[ctx.build.charId].name} · ${new Date().toLocaleTimeString()}`);
  if (!s) return ctx.toast('沙盒未运行', true);
  const list = loadSnaps();
  list.unshift(s);
  saveSnaps(list);
  ctx.toast(`已保存快照（${s.enemies.length} 个目标）`);
  ctx.rerender();
}

export function restoreSnapshot(ctx: DevCtx, s: Snapshot | undefined = loadSnaps()[0]): void {
  if (!s) return ctx.toast('还没有快照', true);
  ctx.restoreSnapshot(s);
}

export function renderSandbox(ctx: DevCtx): HTMLElement {
  const sb = ctx.sb;
  const root = h('div');

  // ---------------- 阵列预览：一屏看多个 ----------------
  const fq = h('input', { placeholder: '筛选（id / 名字 / 类型，可留空）', style: 'width:220px' }) as HTMLInputElement;
  const go = (kind: LineupKind) => {
    const fail = lineup(ctx, kind, ctx.ui.mSel && !ctx.ui.mSel.startsWith('b:') ? ctx.ui.mSel : undefined);
    ctx.toast(fail ? `已摆出，但有 ${fail} 个因敌人池已满未生成` : '已摆出阵列（锁定、不攻击、不死）');
    ctx.rerender();
  };
  root.append(
    h('h3', null, '阵列预览（一屏看多个）'),
    h(
      'div',
      { class: 'row' },
      btn('小怪阵列', () => go('minions'), '', '每种小怪一只，网格排列'),
      btn('精英 / Boss 阵列', () => go('bosses')),
      btn('词缀阵列', () => go('affixes'), '', '用怪物页当前选中的小怪（未选则第一只），每种词缀一只，便于看词缀装饰'),
      btn('清空', () => (sb.clear(), (sb.lockPlayer = false), ctx.rerender())),
    ),
    h(
      'div',
      { class: 'row' },
      fq,
      btn(
        '技能动画墙',
        () => void reelWall(ctx, 'skills', fq.value.trim()),
        'pri',
        '逐个角色放技能并录制，最后同屏循环播放（每个约 2 秒）',
      ),
      btn('武器动画墙', () => void reelWall(ctx, 'weapons', fq.value.trim()), '', '每把武器（T4）单独开火录制'),
      btn('超武动画墙', () => void reelWall(ctx, 'evolved', fq.value.trim())),
      btn('强制重录技能墙', () => void reelWall(ctx, 'skills', fq.value.trim(), true), '', '忽略缓存，按筛选条件重新录制技能动画墙'),
      btn('清除录像缓存', () => void clearReels().then((n) => ctx.toast(`已清除 ${n} 段动画墙录像`))),
    ),
    h(
      'div',
      { class: 'muted' },
      '动画墙录像缓存在浏览器里（不进仓库），角色技能数据或专属演出代码没变就直接播放，只重录改过的；改了公共特效代码请点「强制重录技能墙」。录制会临时切换构筑，录完自动恢复；可按 Esc 中止。',
    ),
  );

  // ---------------- 时间 ----------------
  root.append(
    h('h3', null, '时间控制'),
    h(
      'div',
      { class: 'row' },
      '慢放',
      select(
        [0.1, 0.25, 0.5, 1].map((v) => [v, v === 1 ? '正常' : `×${v}`]),
        sb.slow,
        (v) => (sb.setSlow(Number(v)), ctx.rerender()),
      ),
      h('span', { class: 'muted' }, '（加速请用顶部「速度」，慢放只在速度 ×1 时生效）'),
    ),
    h(
      'div',
      { class: 'row' },
      btn(sb.paused ? '▶ 继续' : '⏸ 暂停', () => (sb.togglePause(), ctx.rerender())),
      btn('单步 1 帧', () => sb.frame(1), '', '暂停并前进 1/60 秒'),
      btn('前进 6 帧（0.1 秒）', () => sb.frame(6)),
      btn('前进 30 帧（0.5 秒）', () => sb.frame(30)),
    ),
  );

  // ---------------- 镜头与鼠标 ----------------
  root.append(
    h('h3', null, '镜头与鼠标'),
    h(
      'div',
      { class: 'row' },
      '镜头',
      select(
        [
          ['player', '跟随玩家'],
          ['target', '跟随最近生成的目标'],
          ['free', '自由镜头'],
        ],
        sb.camMode,
        (v) => ((sb.camMode = v as typeof sb.camMode), sb.applyCamera(), ctx.rerender()),
      ),
      '缩放',
      select(
        [0.4, 0.6, 0.8, 1, 1.25, 1.5, 2, 3].map((v) => [v, `×${v}`]),
        [0.4, 0.6, 0.8, 1, 1.25, 1.5, 2, 3].reduce((a, b) => (Math.abs(b - sb.zoom) < Math.abs(a - sb.zoom) ? b : a)),
        (v) => (sb.setZoom(Number(v)), ctx.rerender()),
      ),
      btn('复位', () => {
        sb.zoom = 1;
        sb.camMode = 'player';
        sb.applyCamera();
        ctx.rerender();
      }),
    ),
    h('div', { class: 'muted' }, '滚轮缩放 · 右键 / 中键拖动平移（切到自由镜头）'),
    h(
      'div',
      { class: 'row' },
      '左键点击画面',
      select(
        [
          ['none', '选中 / 拖动目标'],
          ['spawn', '在点击处生成当前怪物'],
          ['teleport', '传送玩家'],
        ],
        sb.placeMode,
        (v) => {
          sb.placeMode = v as typeof sb.placeMode;
          syncPlace(ctx);
          ctx.rerender();
        },
      ),
      check('锁定玩家位置', sb.lockPlayer, (v) => (sb.lockPlayer = v)),
    ),
    sb.placeMode === 'spawn'
      ? h(
          'div',
          { class: sb.placeSel ? 'muted' : 'warn' },
          sb.placeSel
            ? `点击生成：${monsterList(ctx).find((m) => m.sel === ctx.ui.mSel)?.name ?? sb.placeSel.id}（使用怪物页的数量 / 攻击 / 锁血设置）`
            : '先在顶部快捷栏或怪物页选中一个怪物',
        )
      : '',
  );

  // ---------------- 地形与刷怪 ----------------
  const ch = CHAPTERS[ctx.build.chapterId - 1];
  root.append(
    h('h3', null, `地形与刷怪（${ch.name}）`),
    h(
      'div',
      { class: 'row' },
      check('启用地形机制', sb.opts.terrain, (v) => ((sb.opts.terrain = v), sb.restart(), ctx.rerender())),
      ...(TERRAIN_MECHS[ch.id] ?? []).map(([k, name]) =>
        check(name, !Terrain.off.has(k), (v) => {
          if (v) Terrain.off.delete(k);
          else Terrain.off.add(k);
        }),
      ),
    ),
    h(
      'div',
      { class: 'row' },
      check('真实刷怪', !!sb.opts.waves, (v) => (sb.opts.waves = v), '按本章、构筑波次的刷怪池持续出怪（不计时、不结算、不掉落）'),
      h('span', { class: 'muted' }, '章节与波次在「构筑」页设置'),
    ),
  );

  // ---------------- 快照 ----------------
  const snaps = loadSnaps();
  root.append(
    h('h3', null, `快照（${snaps.length}）`),
    h(
      'div',
      { class: 'row' },
      btn('保存快照', () => takeSnapshot(ctx), 'pri', '构筑 + 玩家位置与生命 + 场上目标（快捷键 F6）'),
      btn('恢复最近快照', () => restoreSnapshot(ctx), '', '快捷键 F7'),
      btn('清空快照', () => (saveSnaps([]), ctx.rerender())),
    ),
    snaps.length
      ? table(
          ['时间', '名称', '目标', ''],
          snaps.map((s, i) => [
            new Date(s.t).toLocaleString(),
            s.label,
            String(s.enemies.length),
            h(
              'span',
              null,
              btn('恢复', () => restoreSnapshot(ctx, s)),
              btn('复制', () => void navigator.clipboard?.writeText(JSON.stringify(s)).then(() => ctx.toast('已复制快照 JSON'))),
              btn('删', () => {
                snaps.splice(i, 1);
                saveSnaps(snaps);
                ctx.rerender();
              }),
            ),
          ]),
        )
      : h('div', { class: 'muted' }, '还没有快照：复现 bug 时先保存一份，改代码后一键回到同一场面'),
    h(
      'div',
      { class: 'row' },
      btn(
        '从剪贴板导入快照',
        () =>
          void navigator.clipboard
            ?.readText()
            .then((t) => {
              const s = JSON.parse(t) as Snapshot;
              if (!s.build || !s.enemies) throw new Error('bad');
              snaps.unshift(s);
              saveSnaps(snaps);
              ctx.rerender();
            })
            .catch(() => ctx.toast('剪贴板里不是快照 JSON', true)),
      ),
    ),
  );

  // ---------------- 回放 ----------------
  root.append(
    h('h3', null, `回放（已记录 ${sb.timeline.length} 秒）`),
    h(
      'div',
      { class: 'row' },
      '回到',
      num(rewindSec, (v) => (rewindSec = v), { min: 1, max: 30, width: 50 }),
      '秒前',
      btn('回放', () => {
        const err = sb.rewind(rewindSec);
        if (err) ctx.toast(err, true);
        ctx.rerender();
      }),
      ...[1, 3, 10].map((s) => btn(`-${s}s`, () => (sb.rewind(s), ctx.rerender()))),
    ),
    h('div', { class: 'muted' }, '每秒记录一次玩家与目标的位置和生命，最多 30 秒；回放后自动暂停。技能冷却、弹幕和地面效果不回退。'),
  );

  // ---------------- 剧本 ----------------
  const scripts = loadScripts();
  const ta = h('textarea', { value: scriptSrc, oninput: () => (scriptSrc = ta.value) });
  const name = h('input', { placeholder: '剧本名', value: scriptName, oninput: () => (scriptName = name.value) });
  root.append(
    h('h3', null, '刷怪剧本'),
    ta,
    h(
      'div',
      { class: 'row' },
      btn(
        '运行',
        () => {
          const { lines, err } = sb.parseScript(scriptSrc);
          if (err) return ctx.toast(err, true);
          const e2 = sb.runScript(lines, { ...ctx.ui.spawn, chapterId: ctx.ui.mChapter, wave: ctx.ui.mWave });
          if (e2) return ctx.toast(e2, true);
          ctx.toast(`剧本开始：${lines.length} 条`);
        },
        'pri',
      ),
      btn('停止', () => sb.stopScript()),
      name,
      btn('保存', () => {
        if (!scriptName.trim()) return ctx.toast('先填剧本名', true);
        scripts[scriptName.trim()] = scriptSrc;
        localStorage.setItem(SCRIPT_KEY, JSON.stringify(scripts));
        ctx.rerender();
      }),
      ...Object.keys(scripts).map((k) =>
        h(
          'span',
          { class: 'tag' },
          h('a', { onclick: () => ((scriptSrc = scripts[k]), (scriptName = k), ctx.rerender()) }, k),
          ' ',
          h(
            'a',
            {
              onclick: () => {
                delete scripts[k];
                localStorage.setItem(SCRIPT_KEY, JSON.stringify(scripts));
                ctx.rerender();
              },
            },
            '×',
          ),
        ),
      ),
    ),
    h('div', { class: 'muted' }, '数值按怪物页的章节 / 波次缩放；攻击方式、锁血等沿用怪物页的生成选项'),
  );

  // ---------------- 叠加层与性能 ----------------
  root.append(
    h('h3', null, '叠加层与性能'),
    h(
      'div',
      { class: 'row' },
      check(
        '碰撞框 / 弹道',
        sb.overlay.hitbox,
        (v) => (sb.overlay.hitbox = v),
        '绿：玩家 · 红：敌人与敌方子弹 · 蓝：玩家子弹（线段为 0.25 秒内的路径）',
      ),
      check('性能数据', sb.overlay.perf, (v) => ((sb.overlay.perf = v), ctx.rerender()), '在实时数据栏显示实体数、对象池与帧耗时'),
    ),
  );
  if (sb.overlay.perf && sb.running) {
    const p = sb.perfStats();
    root.append(
      table(
        ['指标', '数值'],
        [
          ['FPS / 平均帧耗时 / 最大帧耗时', `${p.fps} / ${fmt(p.frameAvg)}ms / ${fmt(p.frameMax)}ms`],
          ['敌人（存活 / 池）', `${p.enemies} / ${p.enemyPool}`],
          ['玩家子弹（存活 / 池）', `${p.bullets} / ${p.bulletPool}`],
          ['敌方子弹（存活 / 池）', `${p.enemyBullets} / ${p.enemyBulletPool}`],
          ['掉落物 / 地面效果', `${p.pickups} / ${p.hazards}`],
          ['场景对象总数', String(p.objects)],
        ],
      ),
    );
  }
  return root;
}

/** 放置模式下，点击生成的是快捷栏 / 怪物页当前选中的怪物 */
export function syncPlace(ctx: DevCtx): void {
  const m = monsterList(ctx).find((x) => x.sel === ctx.ui.mSel);
  ctx.sb.placeSel = m
    ? { id: m.id, boss: m.boss, opts: { ...ctx.ui.spawn, chapterId: ctx.ui.mChapter, wave: ctx.ui.mWave, test: false } }
    : null;
}
