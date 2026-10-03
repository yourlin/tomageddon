// 开发者界面入口（地址加 ?dev 打开）：HTML 面板 + 沙盒战斗画面。
// 面板可拖宽、左右停靠、弹出为独立窗口；页签与筛选状态、宽度、快捷键都记在 localStorage（prefs.ts）
import type Phaser from 'phaser';
import { CSS, h, btn, check, select, esc, fmt } from './dom';
import { devHooks } from './flag';
import { loadCurrent, saveCurrent, applyBuild, type DevBuild } from './build';
import { createSandbox } from './sandbox';
import type { DevCtx, TabId, UiState } from './ctx';
import { renderBuild } from './tabs/buildTab';
import { renderWeapons } from './tabs/weaponsTab';
import { renderSkills } from './tabs/skillsTab';
import { renderMonsters } from './tabs/monstersTab';
import { renderTests, srcName } from './tabs/testsTab';
import { renderItems } from './tabs/itemsTab';
import { renderStatus } from './tabs/statusTab';
import { renderSandbox, takeSnapshot, restoreSnapshot } from './tabs/sandboxTab';
import { renderBatch } from './tabs/batchTab';
import { renderAssets } from './tabs/assetsTab';
import { renderData } from './tabs/dataTab';
import { renderDebug, installEventHooks } from './tabs/debugTab';
import { renderQuick, isTyping, stepChar, stepMonster, switchChar, showMonster, monsterList } from './quick';
import { prefs, savePrefs, rememberUi, keyOf, keyText, type KeyAction } from './prefs';
import { openPalette, openKeyHelp, openModal, type Cmd } from './palette';
import { logs, logOp, installErrorCapture, clock } from './log';
import { initThumbs } from './thumbs';
import { applyOverrides } from './overrides';
import { CHARACTERS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { ALL_ITEMS } from '../data/items';
import { CHAPTERS } from '../data/chapters';
import { run } from '../systems/RunState';
import { save } from '../systems/Save';
import { audio } from '../systems/Audio';

const TABS: [TabId, string, (ctx: DevCtx) => HTMLElement][] = [
  ['build', '构筑', renderBuild],
  ['weapons', '武器', renderWeapons],
  ['skills', '技能', renderSkills],
  ['monsters', '怪物', renderMonsters],
  ['items', '道具', renderItems],
  ['status', '状态', renderStatus],
  ['sandbox', '沙盒', renderSandbox],
  ['tests', '测试', renderTests],
  ['batch', '批量', renderBatch],
  ['data', '数值', renderData],
  ['debug', '调试', renderDebug],
  ['assets', '内容', renderAssets],
];
const MIN_W = 380;
const MAX_W = 1100;

export function installDevPanel(game: Phaser.Game): void {
  const start = () => mount(game);
  if (devHooks.booted) start();
  else devHooks.onBootReady = start;
}

function defaultUi(build: DevBuild): UiState {
  return {
    tab: 'build',
    shopMode: 'catalog',
    shopKind: 'weapon',
    shopSearch: '',
    shopTier: 0,
    shopRarity: -1,
    shelf: null,
    presetName: '',
    pickKey: 'maxHp',
    pickRarity: 0,
    wTier: 0,
    wCls: '',
    wSearch: '',
    wSort: -8,
    mChapter: build.chapterId,
    mWave: build.wave,
    mCat: 'elite',
    mSel: '',
    mSearch: '',
    spawn: {
      chapterId: build.chapterId,
      wave: build.wave,
      count: 1,
      affixes: null,
      lock: false,
      attack: 'ai',
      immortal: false,
      test: true,
    },
    affixMode: 'rule',
  };
}

function mount(game: Phaser.Game): void {
  applyOverrides();
  installEventHooks();
  initThumbs(game);
  const style = h('style', null, CSS);
  document.head.append(style);
  document.title = 'Tomageddon · 开发者界面';
  const root = document.documentElement;
  const stage = document.getElementById('stage')!;
  let collapsed = false;
  let popup: Window | null = null;
  // 让 Phaser 重新量父容器再重排。只调 refresh() 会沿用缓存的旧父容器尺寸，
  // 结果画布仍按旧宽度绘制，被面板挡住（打开面板、浏览器缩放时都会出现）
  const fit = () => {
    (game.scale as unknown as { getParentBounds(): boolean }).getParentBounds();
    game.scale.refresh();
  };
  const layout = () => {
    const docked = !collapsed && !popup;
    const w = docked ? `${prefs.w}px` : '0px';
    root.style.setProperty('--dev-w', w);
    const left = prefs.side === 'left';
    stage.style.left = left ? w : '0';
    stage.style.right = left ? '0' : w;
    panel.classList.toggle('left', left);
    panel.classList.toggle('compact', prefs.compact);
    toggle.classList.toggle('left', left);
    panel.style.display = collapsed && !popup ? 'none' : 'flex';
    toggle.style.display = popup ? 'none' : '';
    toggle.textContent = collapsed ? (left ? '开发者面板 ▶' : '◀ 开发者面板') : left ? '◀' : '▶';
    fit();
  };

  let build: DevBuild = loadCurrent();
  const sb = createSandbox(game, () => build);
  // A2：恢复上次的页签与筛选（货架等临时对象不恢复）
  const ui: UiState = { ...defaultUi(build), ...(prefs.ui ?? {}), shelf: null } as UiState;
  if (!TABS.some(([id]) => id === ui.tab)) ui.tab = 'build';

  // 默认静音（保留原设置，取消静音时恢复；persist 已禁用，不会写进存档）
  const vol = { sfx: save.settings.sfx, music: save.settings.music };
  let muted = false;
  const setMute = (m: boolean) => {
    muted = m;
    save.settings.sfx = m ? 0 : vol.sfx;
    save.settings.music = m ? 0 : vol.music;
    if (m) audio.stopMusic();
  };
  setMute(true);

  let autoRestart = true;
  let dirty = false;
  let restartTimer = 0;
  const doRestart = () => {
    window.clearTimeout(restartTimer);
    dirty = false;
    sb.restart();
    renderCtl();
  };

  // A9：构筑撤销 / 重做（按构筑 JSON 记录，最多 60 步）
  const undoStack: string[] = [];
  const redoStack: string[] = [];
  let lastJson = JSON.stringify(build);
  let applyingHistory = false;
  const pushHistory = () => {
    const now = JSON.stringify(build);
    if (now === lastJson) return;
    if (!applyingHistory) {
      undoStack.push(lastJson);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
    }
    lastJson = now;
  };
  const jump = (from: string[], to: string[], label: string) => {
    const s = from.pop();
    if (!s) return ctx.toast(`没有可${label}的构筑改动`, true);
    to.push(JSON.stringify(build));
    applyingHistory = true;
    build = JSON.parse(s) as DevBuild;
    ui.shelf = null;
    ctx.changed();
    applyingHistory = false;
    ctx.toast(`已${label}（剩余 ${from.length} 步）`);
  };

  const ctx: DevCtx = {
    get build() {
      return build;
    },
    sb,
    ui,
    changed(restart = true) {
      pushHistory();
      saveCurrent(build);
      applyBuild(build, sb.trial);
      if (restart) {
        if (autoRestart) {
          window.clearTimeout(restartTimer);
          restartTimer = window.setTimeout(doRestart, 250);
        } else dirty = true;
      }
      renderCtl();
      renderTab();
    },
    setBuild(b) {
      build = b;
      ui.shelf = null;
      ctx.changed();
    },
    rerender: () => {
      renderQuick(ctx, quick);
      renderTabs();
      renderTab();
    },
    toast(msg, bad = false) {
      logOp(msg, bad);
      toastEl.textContent = msg;
      toastEl.className = bad ? 'bad' : 'good';
      toastEl.style.opacity = '1';
      window.clearTimeout(toastT);
      toastT = window.setTimeout(() => (toastEl.style.opacity = '0'), 2600);
    },
    restoreSnapshot(s) {
      if (JSON.stringify(s.build) !== JSON.stringify(build)) {
        build = JSON.parse(JSON.stringify(s.build)) as DevBuild;
        ui.shelf = null;
        pushHistory();
        saveCurrent(build);
        applyBuild(build, sb.trial);
        sb.pendingSnap = s;
        doRestart();
        renderTab();
      } else sb.applySnapshot(s);
      ctx.toast(`已恢复快照：${s.label}`);
    },
    undo: () => jump(undoStack, redoStack, '撤销'),
    redo: () => jump(redoStack, undoStack, '重做'),
  };
  let toastT = 0;
  sb.onMessage = (m, bad) => ctx.toast(m, bad);

  // J3：报错自动记录当时的构筑与快照
  installErrorCapture(() => ({ build: JSON.stringify(build), snap: sb.running ? JSON.stringify(sb.capture('报错时')) : '' }));
  logs.onError = (e) => ctx.toast(`报错：${e.msg}（调试页查看）`, true);

  // ---------------- 骨架 ----------------
  const toggle = h('button', {
    id: 'dev-toggle',
    onclick: () => {
      collapsed = !collapsed;
      layout();
    },
  });
  const toastEl = h('span', { class: 'toast', title: '点击查看操作日志', onclick: () => openLog() });
  const ctl = h('div', { class: 'ctl' });
  const quick = h('div', { class: 'quick' });
  const live = h('div', { class: 'live' });
  const tabs = h('div', { class: 'tabs' });
  const body = h('div', { class: 'body' });
  // A1：拖动边缘调整宽度
  const grip = h('div', { class: 'grip', title: '拖动调整面板宽度' });
  grip.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = prefs.w;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - x0;
      prefs.w = Math.round(Math.min(MAX_W, Math.max(MIN_W, prefs.side === 'left' ? w0 + dx : w0 - dx)));
      layout();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      savePrefs();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  const panel = h(
    'div',
    { id: 'dev-panel' },
    grip,
    h(
      'div',
      { class: 'hdr' },
      h('b', null, '🍅 开发者界面'),
      toastEl,
      btn('⌕', () => palette(), '', `命令面板（${keyText(prefs.keys.palette)}）`),
      btn('⌨', () => openKeyHelp(panel.ownerDocument), '', `快捷键（${keyText(prefs.keys.help)}）`),
      btn('☰', () => openLog(), '', '操作日志'),
      btn(prefs.side === 'left' ? '停靠右侧' : '停靠左侧', () => {
        prefs.side = prefs.side === 'left' ? 'right' : 'left';
        savePrefs();
        layout();
        renderHdr();
      }),
      btn(prefs.compact ? '宽松' : '紧凑', () => {
        prefs.compact = !prefs.compact;
        savePrefs();
        layout();
        renderHdr();
      }),
      btn('⧉ 弹出', () => popOut(), '', '把面板放进独立窗口（双屏时游戏全屏）'),
      btn('退出到游戏', () => (location.href = location.pathname)),
    ),
    ctl,
    quick,
    live,
    tabs,
    body,
  );
  const hdr = panel.querySelector('.hdr') as HTMLElement;
  // 停靠 / 密度按钮的文字随状态变化：只重建这两个按钮
  function renderHdr(): void {
    const bs = hdr.querySelectorAll('button');
    bs[3].textContent = prefs.side === 'left' ? '停靠右侧' : '停靠左侧';
    bs[4].textContent = prefs.compact ? '宽松' : '紧凑';
  }
  document.body.append(panel, toggle);

  // A7：弹出为独立窗口。节点直接搬过去（事件监听跟着走），关窗时搬回来
  function popOut(): void {
    if (popup) return;
    const w = window.open('', 'tomageddon-dev', `width=${prefs.w + 40},height=900`);
    if (!w) return ctx.toast('浏览器拦截了弹出窗口', true);
    popup = w;
    w.document.title = 'Tomageddon · 开发者面板';
    w.document.head.append(h('style', null, CSS + '#dev-panel{position:static;width:100vw;height:100vh;border:none}#dev-panel .grip{display:none}'));
    w.document.body.style.margin = '0';
    w.document.body.append(panel);
    w.document.addEventListener('keydown', onKey);
    w.addEventListener('beforeunload', () => {
      popup = null;
      document.body.append(panel);
      layout();
    });
    layout();
  }

  // 键盘：只有在文字 / 数字输入框里打字时才关闭游戏键盘（否则 WASD / 空格会被游戏截获）。
  // 点完按钮、复选框、下拉框后立刻交还焦点：否则焦点留在控件上，空格会再次触发按钮、
  // 方向键会改下拉框的值，而点击画布又无法夺回焦点（画布不可聚焦），表现为键盘失灵
  const kb = () => game.input.keyboard;
  const release = () => {
    if (kb()) kb()!.enabled = true;
    for (const s of game.scene.getScenes(true)) s.input.keyboard?.resetKeys();
  };
  panel.addEventListener('focusin', (e) => {
    if (kb() && isTyping(e.target as HTMLElement)) kb()!.enabled = false;
  });
  panel.addEventListener('focusout', release);
  const blurControl = (e: Event) => {
    const t = e.target as HTMLElement;
    // 下拉框只在选完（change）后交还焦点：click 时就失焦会把刚打开的下拉列表关掉
    if (e.type === 'click' && t.tagName === 'SELECT') return;
    if (t instanceof HTMLElement && !isTyping(t) && /^(BUTTON|INPUT|SELECT|A)$/.test(t.tagName)) setTimeout(() => t.blur(), 0);
  };
  panel.addEventListener('click', blurControl);
  panel.addEventListener('change', blurControl);
  // 点到游戏画面时，无论焦点在面板哪里都还给游戏
  stage.addEventListener('pointerdown', () => {
    const a = document.activeElement as HTMLElement | null;
    if (a && panel.contains(a)) a.blur();
    release();
  });

  // ---------------- 快捷键（A4，可在快捷键列表里改绑） ----------------
  const actions: Record<KeyAction, () => void> = {
    charPrev: () => stepChar(ctx, -1),
    charNext: () => stepChar(ctx, 1),
    monPrev: () => stepMonster(ctx, -1),
    monNext: () => stepMonster(ctx, 1),
    palette: () => palette(),
    help: () => openKeyHelp(panel.ownerDocument),
    undo: () => ctx.undo(),
    redo: () => ctx.redo(),
    pause: () => {
      sb.togglePause();
      renderCtl();
    },
    frame: () => sb.frame(1),
    snapshot: () => takeSnapshot(ctx),
    restore: () => restoreSnapshot(ctx),
  };
  function onKey(e: KeyboardEvent): void {
    const doc = (e.target as Node | null)?.ownerDocument ?? document;
    if (isTyping(doc.activeElement) || doc.querySelector('.dev-modal-mask')) return;
    const k = keyOf(e);
    const a = (Object.keys(prefs.keys) as KeyAction[]).find((x) => prefs.keys[x] === k);
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    actions[a]();
  }
  window.addEventListener('keydown', onKey, true);

  // ---------------- 命令面板（A3） ----------------
  function palette(): void {
    const go = (t: TabId) => () => {
      ui.tab = t;
      ctx.rerender();
    };
    const cmds: Cmd[] = [
      ...TABS.map(([id, name]) => ({ group: '页签', name, keys: id, run: go(id) })),
      ...CHARACTERS.map((c) => ({ group: '角色', name: `${c.name}（${c.title}）`, keys: c.id, run: () => switchChar(ctx, c.id) })),
      ...CHAPTERS.flatMap((ch) =>
        (['pool', 'elite', 'boss'] as const).flatMap((cat) => {
          const saved = { c: ui.mChapter, cat: ui.mCat, q: ui.mSearch };
          ui.mChapter = ch.id;
          ui.mCat = cat;
          ui.mSearch = '';
          const list = monsterList(ctx);
          ui.mChapter = saved.c;
          ui.mCat = saved.cat;
          ui.mSearch = saved.q;
          return list.map((m) => ({
            group: `怪物·第${ch.id}章`,
            name: m.name,
            keys: m.id,
            run: () => {
              ui.mChapter = ch.id;
              ui.mCat = cat;
              showMonster(ctx, m);
            },
          }));
        }),
      ),
      ...WEAPONS.map((w) => ({
        group: '武器',
        name: w.name,
        keys: w.id,
        run: () => {
          ui.tab = 'weapons';
          ui.wSearch = w.name;
          ctx.rerender();
        },
      })),
      ...ALL_ITEMS.map((it) => ({
        group: '道具',
        name: it.name,
        keys: it.id,
        run: () => {
          ui.tab = 'items';
          ctx.rerender();
        },
      })),
      { group: '操作', name: '重启沙盒', run: doRestart },
      { group: '操作', name: '清场', run: () => sb.clear() },
      { group: '操作', name: '释放技能', run: () => sb.castSkill() },
      { group: '操作', name: '保存快照', run: () => takeSnapshot(ctx) },
      { group: '操作', name: '恢复最近快照', run: () => restoreSnapshot(ctx) },
      { group: '操作', name: '撤销构筑改动', run: () => ctx.undo() },
      { group: '操作', name: '重做构筑改动', run: () => ctx.redo() },
      { group: '操作', name: '暂停 / 继续', run: actions.pause },
      { group: '操作', name: '弹出为独立窗口', run: popOut },
      { group: '操作', name: '操作日志', run: () => openLog() },
      { group: '操作', name: '快捷键列表', run: actions.help },
    ];
    openPalette(panel.ownerDocument, cmds);
  }

  // ---------------- 操作日志（A10） ----------------
  function openLog(): void {
    openModal(
      panel.ownerDocument,
      h(
        'div',
        null,
        h('h3', null, `操作日志（最近 ${logs.ops.length} 条）`),
        logs.ops.length
          ? h(
              'div',
              { class: 'oplog' },
              ...logs.ops.map((o) => h('div', { class: o.bad ? 'bad' : '' }, h('span', { class: 'muted' }, clock(o.t)), ' ', o.msg)),
            )
          : h('div', { class: 'muted' }, '还没有记录'),
        logs.errors.length ? h('div', { class: 'bad' }, `另有 ${logs.errors.length} 条报错，见「调试」页`) : '',
      ),
    );
  }

  // ---------------- 控制条 ----------------
  function renderCtl(): void {
    renderQuick(ctx, quick);
    ctl.replaceChildren(
      btn(sb.paused ? '▶ 继续' : '⏸ 暂停', actions.pause, '', `快捷键 ${keyText(prefs.keys.pause)}`),
      btn('单步', () => sb.frame(1), '', `暂停并前进 1 帧（${keyText(prefs.keys.frame)}）`),
      h('span', null, '速度 '),
      select(
        [0.25, 0.5, 1, 2, 4, 8].map((n) => [n, `×${n}`]),
        sb.slow < 1 ? sb.slow : sb.speed,
        (v) => {
          const n = Number(v);
          if (n < 1) {
            sb.setSpeed(1);
            sb.setSlow(n);
          } else {
            sb.setSlow(1);
            sb.setSpeed(n);
          }
        },
      ),
      check('无敌', sb.god, (v) => (sb.god = v), '每个模拟步回满生命；关闭后阵亡会原地复活并计数'),
      check('技能无CD', sb.noSkillCd, (v) => (sb.noSkillCd = v)),
      check('自动放技能', save.settings.autoSkill, (v) => (save.settings.autoSkill = v)),
      check('地形机制', sb.opts.terrain, (v) => {
        sb.opts.terrain = v;
        doRestart();
      }),
      check('静音', muted, setMute),
      h('span', { class: 'muted' }, '｜叠加：'),
      check('射程/光环', sb.overlay.range, (v) => (sb.overlay.range = v)),
      check('爆炸半径', sb.overlay.explode, (v) => (sb.overlay.explode = v)),
      check('技能范围', sb.overlay.skill, (v) => (sb.overlay.skill = v)),
      check('拾取', sb.overlay.pickup, (v) => (sb.overlay.pickup = v)),
      check('目标标签', sb.overlay.labels, (v) => (sb.overlay.labels = v)),
      check('碰撞框', sb.overlay.hitbox, (v) => (sb.overlay.hitbox = v)),
      h('span', { class: 'muted' }, '｜'),
      btn('释放技能', () => sb.castSkill()),
      btn('清场', () => sb.clear()),
      btn('重置统计', () => sb.resetMeter()),
      btn('撤销', () => ctx.undo(), '', `${keyText(prefs.keys.undo)}（剩 ${undoStack.length} 步）`),
      btn('重做', () => ctx.redo(), '', `${keyText(prefs.keys.redo)}（剩 ${redoStack.length} 步）`),
      btn(dirty ? '⚠ 应用构筑并重启' : '重启沙盒', doRestart, dirty ? 'hot' : 'pri'),
      check('改动自动重启', autoRestart, (v) => {
        autoRestart = v;
        renderCtl();
      }),
    );
  }

  // ---------------- 实时数据 ----------------
  function renderLive(): void {
    if (!sb.running) {
      live.textContent = '沙盒未运行';
      return;
    }
    const g = sb.g;
    const s = g.stats;
    const now = g.time.now;
    const dur = Math.max(0.001, (now - sb.meterStart) / 1000);
    const srcs = Object.entries(sb.dmgBySrc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k, v]) => `${srcName(k)} ${Math.round((v / Math.max(1, sb.dmgTotal)) * 100)}%`)
      .join('  ');
    const targets = sb.tracked
      .filter((t) => sb.isAlive(t))
      .slice(-4)
      .map((t) => `${t.label} ${Math.ceil(t.e.hp)}/${t.e.maxHp}`)
      .join('  ');
    const lastTest = sb.tests[0];
    const test = lastTest
      ? `测试#${lastTest.id} ${lastTest.label}：${lastTest.aborted ? '中断' : lastTest.ttk === null ? `进行中 ${((now - lastTest.startT) / 1000).toFixed(1)}s` : `TTK ${lastTest.ttk.toFixed(2)}s`}`
      : '';
    let perf = '';
    if (sb.overlay.perf) {
      const p = sb.perfStats();
      perf = `性能 FPS ${p.fps} 帧耗时 ${fmt(p.frameAvg)}/${fmt(p.frameMax)}ms 敌人 ${p.enemies} 弹 ${p.bullets}+${p.enemyBullets} 对象 ${p.objects}`;
    }
    live.innerHTML = esc(
      [
        `${sb.paused ? '⏸ 已暂停' : '▶ 运行中'} ×${sb.slow < 1 ? sb.slow : sb.speed} · ${run.char.name} · 第${run.chapterId}章 第${run.wave}波 · Lv${run.level}${sb.trial ? ' · 【单独试用】' : ''}`,
        `玩家 HP ${Math.ceil(run.hp)}/${s.maxHp}  护甲 ${fmt(s.armor)}  闪避 ${fmt(Math.min(s.dodge, run.dodgeCap))}%  阵亡 ${sb.opts.deaths}  技能 ${g.skill.ready ? '就绪' : g.skill.cd.toFixed(1) + 's'}`,
        `输出 DPS  5s ${Math.round(sb.rate(sb.hits, 5))}  30s ${Math.round(sb.rate(sb.hits, 30))}  平均 ${Math.round(sb.dmgTotal / dur)}  总 ${Math.round(sb.dmgTotal)}（${dur.toFixed(1)}s）`,
        `承伤 DPS  5s ${fmt(sb.rate(sb.taken, 5))}  总 ${Math.round(sb.takenTotal)}  最大单次 ${sb.takenMax}`,
        srcs && `来源 ${srcs}`,
        targets && `目标 ${targets}`,
        test,
        perf,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  // ---------------- 页签 ----------------
  function renderTabs(): void {
    tabs.replaceChildren(
      ...TABS.map(([id, name]) =>
        h(
          'button',
          {
            class: ui.tab === id ? 'on' : '',
            onclick: () => {
              ui.tab = id;
              body.scrollTop = 0;
              renderTabs();
              renderTab();
            },
          },
          name,
        ),
      ),
    );
  }
  function renderTab(): void {
    const scroll = body.scrollTop;
    // 注意：这里不写 run（沙盒运行中写 run 会回满血、清空统计）；构筑改动统一走 ctx.changed()
    const t = TABS.find(([id]) => id === ui.tab) ?? TABS[0];
    let el: HTMLElement;
    try {
      el = t[2](ctx);
    } catch (e) {
      el = h('div', { class: 'bad' }, `页签渲染失败：${e instanceof Error ? e.message : String(e)}`);
      console.error(e);
    }
    body.replaceChildren(el);
    body.scrollTop = scroll;
    rememberUi(ui, scroll);
  }
  body.addEventListener('scroll', () => rememberUi(ui, body.scrollTop));
  sb.onChange = () => {
    if (ui.tab === 'monsters' || ui.tab === 'tests' || ui.tab === 'sandbox') renderTab();
  };

  layout();
  applyBuild(build, sb.trial);
  renderCtl();
  renderTabs();
  renderTab();
  body.scrollTop = prefs.scroll ?? 0;
  sb.restart();
  window.setInterval(renderLive, 250);
  // 浏览器缩放、窗口大小变化、面板展开收起都会改变舞台尺寸：统一监听舞台本身
  new ResizeObserver(fit).observe(stage);
  Object.assign(window, { __devPanel: ctx });
}
