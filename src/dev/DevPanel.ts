// 开发者界面入口（地址加 ?dev 打开）：右侧 HTML 面板 + 左侧沙盒战斗画面。
// 页签：构筑（等级 / 资金 / 商店模拟 / 预设）· 武器 · 技能 · 怪物 · 测试记录
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
import { run } from '../systems/RunState';
import { save } from '../systems/Save';
import { audio } from '../systems/Audio';

const PANEL_W = 560;
const TABS: [TabId, string][] = [
  ['build', '构筑'],
  ['weapons', '武器'],
  ['skills', '技能'],
  ['monsters', '怪物'],
  ['tests', '测试记录'],
];

export function installDevPanel(game: Phaser.Game): void {
  const start = () => mount(game);
  if (devHooks.booted) start();
  else devHooks.onBootReady = start;
}

function mount(game: Phaser.Game): void {
  document.head.append(h('style', null, CSS));
  document.title = 'Tomageddon · 开发者界面';
  const root = document.documentElement;
  const stage = document.getElementById('stage')!;
  let collapsed = false;
  const layout = () => {
    root.style.setProperty('--dev-w', collapsed ? '0px' : `${PANEL_W}px`);
    stage.style.right = collapsed ? '0' : `${PANEL_W}px`;
    panel.style.display = collapsed ? 'none' : 'flex';
    toggle.textContent = collapsed ? '◀ 开发者面板' : '▶';
    game.scale.refresh();
  };

  let build: DevBuild = loadCurrent();
  const sb = createSandbox(game, () => build);
  const ui: UiState = {
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

  const ctx: DevCtx = {
    get build() {
      return build;
    },
    sb,
    ui,
    changed(restart = true) {
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
      renderTabs();
      renderTab();
    },
    toast(msg, bad = false) {
      toastEl.textContent = msg;
      toastEl.className = bad ? 'bad' : 'good';
      toastEl.style.opacity = '1';
      window.clearTimeout(toastT);
      toastT = window.setTimeout(() => (toastEl.style.opacity = '0'), 2600);
    },
  };
  let toastT = 0;

  // ---------------- 骨架 ----------------
  const toggle = h('button', {
    id: 'dev-toggle',
    onclick: () => {
      collapsed = !collapsed;
      layout();
    },
  });
  const toastEl = h('span', { style: 'transition:opacity .3s;opacity:0;margin-left:6px' });
  const ctl = h('div', { class: 'ctl' });
  const live = h('div', { class: 'live' });
  const tabs = h('div', { class: 'tabs' });
  const body = h('div', { class: 'body' });
  const panel = h(
    'div',
    { id: 'dev-panel' },
    h(
      'div',
      { class: 'hdr' },
      h('b', null, '🍅 开发者界面'),
      toastEl,
      btn('退出到游戏', () => (location.href = location.pathname)),
    ),
    ctl,
    live,
    tabs,
    body,
  );
  document.body.append(panel, toggle);

  // 在面板里打字时关闭游戏键盘（否则 WASD / 空格会被游戏截获）
  const kb = () => game.input.keyboard;
  panel.addEventListener('focusin', (e) => {
    const t = e.target as HTMLElement;
    if (kb() && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) kb()!.enabled = false;
  });
  panel.addEventListener('focusout', () => {
    if (kb()) kb()!.enabled = true;
    for (const s of game.scene.getScenes(true)) s.input.keyboard?.resetKeys();
  });

  // ---------------- 控制条 ----------------
  function renderCtl(): void {
    ctl.replaceChildren(
      btn(sb.paused ? '▶ 继续' : '⏸ 暂停', () => {
        sb.togglePause();
        renderCtl();
      }),
      h('span', null, '速度 '),
      select(
        [1, 2, 4, 8].map((n) => [n, `×${n}`]),
        sb.speed,
        (v) => sb.setSpeed(Number(v)),
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
      h('span', { class: 'muted' }, '｜'),
      btn('释放技能', () => sb.castSkill()),
      btn('清场', () => sb.clear()),
      btn('重置统计', () => sb.resetMeter()),
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
    live.innerHTML = esc(
      [
        `${sb.paused ? '⏸ 已暂停' : '▶ 运行中'} ×${sb.speed} · ${run.char.name} · 第${run.chapterId}章 第${run.wave}波 · Lv${run.level}${sb.trial ? ' · 【单独试用】' : ''}`,
        `玩家 HP ${Math.ceil(run.hp)}/${s.maxHp}  护甲 ${fmt(s.armor)}  闪避 ${fmt(Math.min(s.dodge, run.dodgeCap))}%  阵亡 ${sb.opts.deaths}  技能 ${g.skill.ready ? '就绪' : g.skill.cd.toFixed(1) + 's'}`,
        `输出 DPS  5s ${Math.round(sb.rate(sb.hits, 5))}  30s ${Math.round(sb.rate(sb.hits, 30))}  平均 ${Math.round(sb.dmgTotal / dur)}  总 ${Math.round(sb.dmgTotal)}（${dur.toFixed(1)}s）`,
        `承伤 DPS  5s ${fmt(sb.rate(sb.taken, 5))}  总 ${Math.round(sb.takenTotal)}  最大单次 ${sb.takenMax}`,
        srcs && `来源 ${srcs}`,
        targets && `目标 ${targets}`,
        test,
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
    const el =
      ui.tab === 'build'
        ? renderBuild(ctx)
        : ui.tab === 'weapons'
          ? renderWeapons(ctx)
          : ui.tab === 'skills'
            ? renderSkills(ctx)
            : ui.tab === 'monsters'
              ? renderMonsters(ctx)
              : renderTests(ctx);
    body.replaceChildren(el);
    body.scrollTop = scroll;
  }
  sb.onChange = () => {
    if (ui.tab === 'monsters' || ui.tab === 'tests') renderTab();
  };

  layout();
  applyBuild(build, sb.trial);
  renderCtl();
  renderTabs();
  renderTab();
  sb.restart();
  window.setInterval(renderLive, 250);
  window.addEventListener('resize', () => game.scale.refresh());
  Object.assign(window, { __devPanel: ctx });
}
