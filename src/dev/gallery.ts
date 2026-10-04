// 开发者「阵列预览」：一屏看到多个对象，便于对比视觉效果
// - 现场阵列（实时）：全部小怪 / 全部精英与 Boss / 同一只怪 × 每种精英词缀，按网格摆在场地上，锁定不动、不攻击、不死
// - 动画墙（录制）：逐个让角色放技能、或逐把武器开火，每个录 12 帧，最后在一张网格里同时循环播放
import Phaser from 'phaser';
import type { DevCtx } from './ctx';
import type { SpawnOpts } from './sandbox';
import { ENEMIES } from '../data/enemies';
import { BOSSES, AFFIX_IDS, AFFIXES, type AffixId } from '../data/bosses';
import { CHARACTERS, type SkillDef } from '../data/characters';
import { STATUSES, type StatusApply } from '../data/statuses';
import { WEAPONS, type WeaponKind } from '../data/weapons';
import { EVOLVED_WEAPONS } from '../data/evolutions';
import { SKILL_TYPE_NAME } from '../data/skills';
import { KIND_NAME } from './info';
import { run } from '../systems/RunState';
import { save } from '../systems/Save';
import { reelFingerprint, loadReel, saveReel } from './reelCache';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------- 现场阵列 ----------------
export type LineupKind = 'minions' | 'bosses' | 'affixes';

function fitArena(ctx: DevCtx): void {
  const sb = ctx.sb;
  const g = sb.g;
  const A = g.arena;
  const cam = g.cameras.main;
  sb.camMode = 'free';
  cam.stopFollow();
  sb.setZoom(Math.min(g.scale.width / (A.width + 80), g.scale.height / (A.height + 80)));
  cam.centerOn(A.centerX, A.centerY);
}

/** 在场地上按网格摆出一组对象；返回实际摆出的数量 */
export function lineup(ctx: DevCtx, kind: LineupKind, baseEnemy?: string): number {
  const sb = ctx.sb;
  if (!sb.running) return 0;
  sb.clear();
  sb.god = true;
  sb.overlay.labels = true;
  const g = sb.g;
  const A = g.arena;
  type Cell = { id: string; boss: boolean; affixes: AffixId[] };
  const cells: Cell[] =
    kind === 'minions'
      ? ENEMIES.map((e) => ({ id: e.id, boss: false, affixes: [] }))
      : kind === 'bosses'
        ? BOSSES.map((b) => ({ id: b.id, boss: true, affixes: [] }))
        : AFFIX_IDS.map((a) => ({ id: baseEnemy ?? ENEMIES[0].id, boss: false, affixes: [a] }));
  const cols = Math.ceil(Math.sqrt(cells.length * (A.width / A.height)));
  const rows = Math.ceil(cells.length / cols);
  const cw = (A.width - 80) / cols,
    ch = (A.height - 80) / rows;
  // 玩家放到角落，免得挡住
  g.player.setPosition(A.x + 30, A.bottom - 30);
  sb.lockPlayer = true;
  sb.playerAnchor = null;
  let n = 0;
  let lastErr = '';
  cells.forEach((c, i) => {
    const x = A.x + 40 + cw * ((i % cols) + 0.5),
      y = A.y + 40 + ch * (Math.floor(i / cols) + 0.5);
    const opts: SpawnOpts = {
      ...ctx.ui.spawn,
      count: 1,
      lock: true,
      attack: 'none',
      immortal: true,
      test: false,
      affixes: c.affixes,
      at: { x, y },
      dist: undefined,
    };
    const err = sb.spawn(c.id, c.boss, opts);
    if (err) {
      n++;
      lastErr = err;
    }
  });
  // 词缀阵列：标签换成词缀名
  if (kind === 'affixes')
    sb.tracked.slice(-cells.length).forEach((t, i) => {
      t.label = `${AFFIXES[cells[i].affixes[0]].name}（${cells[i].affixes[0]}）`;
    });
  fitArena(ctx);
  if (lastErr) console.warn('[阵列]', lastErr);
  return n;
}

// ---------------- 动画墙 ----------------
interface Reel {
  label: string;
  /** 每帧图片地址（WebP data URL） */
  frames: string[];
  /** 效果说明（悬停提示与全屏查看时显示） */
  info?: string;
}

/** 技能效果说明：描述 + 关键参数 */
function skillInfo(sk: SkillDef): string {
  const p: string[] = [`类型 ${sk.type}`, `冷却 ${sk.cd} 秒`];
  if (sk.mult) p.push(`伤害系数 ×${sk.mult}`);
  if (sk.radius) p.push(`半径 ${sk.radius}`);
  if (sk.count) p.push(`数量 ${sk.count}`);
  if (sk.duration) p.push(`持续 ${sk.duration} 秒`);
  if (sk.distance) p.push(`距离 ${sk.distance}`);
  if (sk.heal) p.push(`回复 ${Math.round(sk.heal * 100)}% 生命`);
  const st = (l: StatusApply[]) =>
    l.map((s) => `${STATUSES[s.id]?.name ?? s.id}${s.stacks ? `×${s.stacks}` : ''}（${s.dur} 秒）`).join('、');
  if (sk.status?.length) p.push(`附带 ${st(sk.status)}`);
  if (sk.selfStatus?.length) p.push(`自身获得 ${st(sk.selfStatus)}`);
  return `${sk.desc}\n${p.join(' · ')}`;
}

/** 悬停提示：显示在格子旁边（右侧放不下就放左侧） */
function makeTip(root: HTMLDivElement): { show: (cell: HTMLElement, title: string, body: string) => void; hide: () => void } {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;z-index:2;display:none;max-width:300px;padding:8px 10px;border-radius:6px;background:#2a1418;border:1px solid #c9a227;color:#fff4ea;font:13px/1.55 system-ui;white-space:pre-line;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.6)';
  const t = document.createElement('div');
  t.style.cssText = 'color:#ffd166;font-weight:bold;margin-bottom:4px';
  const b = document.createElement('div');
  el.append(t, b);
  root.append(el);
  return {
    show(cell, title, body) {
      t.textContent = title;
      b.textContent = body || '（暂无说明）';
      el.style.display = 'block';
      const r = cell.getBoundingClientRect();
      const w = el.offsetWidth,
        hgt = el.offsetHeight;
      const right = r.right + 8 + w <= window.innerWidth;
      el.style.left = `${right ? r.right + 8 : Math.max(4, r.left - 8 - w)}px`;
      el.style.top = `${Math.max(4, Math.min(r.top, window.innerHeight - hgt - 4))}px`;
    },
    hide() {
      el.style.display = 'none';
    },
  };
}

const FRAMES = 12;
const FRAME_MS = 110;

function snap(game: Phaser.Game, x: number, y: number, w: number, hgt: number): Promise<string> {
  return new Promise((res) => game.renderer.snapshotArea(x, y, w, hgt, (img) => res((img as HTMLImageElement).src), 'image/webp', 0.85));
}

async function waitScene(ctx: DevCtx): Promise<void> {
  for (let i = 0; i < 60; i++) {
    await sleep(50);
    const g = ctx.sb.g;
    if (ctx.sb.running && g.skill && g.player) return;
  }
}

interface Overlay {
  root: HTMLDivElement;
  status: HTMLDivElement;
  grid: HTMLDivElement;
  tabs: HTMLDivElement;
  hidden: Set<number>;
  close: () => void;
  /** 已录好的录像（下标与格子一致，未录的为 null），供全屏查看左右切换 */
  reels: (Reel | null)[];
  /** 全屏查看第 i 段 */
  view: (i: number) => void;
  tip: ReturnType<typeof makeTip>;
}

function overlay(): Overlay {
  document.getElementById('dev-gallery')?.remove();
  const root = document.createElement('div');
  root.id = 'dev-gallery';
  root.style.cssText =
    'position:fixed;inset:0;z-index:20000;background:rgba(10,4,6,.94);color:#fff4ea;font:13px system-ui;display:flex;flex-direction:column;padding:10px;gap:8px';
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:12px;align-items:center';
  const status = document.createElement('div');
  status.style.flex = '1';
  const x = document.createElement('button');
  x.textContent = '关闭（Esc）';
  x.style.cssText = 'padding:4px 12px;cursor:pointer';
  bar.append(status, x);
  const grid = document.createElement('div');
  grid.style.cssText =
    'flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));grid-auto-rows:max-content;gap:8px;align-content:start';
  // 分类筛选标签（由 reelWall 填充）
  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:none;gap:6px;flex-wrap:wrap;align-items:center';
  root.append(bar, tabs, grid);
  document.body.append(root);
  const reels: (Reel | null)[] = [];
  /** 被分类标签隐藏的格子下标（全屏查看左右切换时跳过） */
  const hidden = new Set<number>();
  const shown = (i: number) => !!reels[i] && !hidden.has(i);
  const tip = makeTip(root);
  grid.addEventListener('scroll', () => tip.hide());

  // ---- 全屏查看：点击格子打开；← → 切换，空格暂停，Esc / 点击空白处关闭 ----
  const vw = document.createElement('div');
  vw.style.cssText =
    'position:absolute;inset:0;z-index:1;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(0,0,0,.94);cursor:zoom-out;padding:16px;box-sizing:border-box';
  const vImg = document.createElement('img');
  vImg.style.cssText = 'flex:1;min-height:0;max-width:100%;width:100%;object-fit:contain;image-rendering:auto;cursor:default';
  const vCap = document.createElement('div');
  vCap.style.cssText = 'color:#ffd166;font-size:16px';
  const vInfo = document.createElement('div');
  vInfo.style.cssText = 'color:#fff4ea;font-size:14px;line-height:1.6;white-space:pre-line;text-align:center;max-width:900px';
  const vHint = document.createElement('div');
  vHint.style.cssText = 'color:#b89a9e';
  vw.append(vImg, vCap, vInfo, vHint);
  root.append(vw);
  let cur = -1,
    frame = 0,
    paused = false,
    vTimer = 0;
  const draw = () => {
    const r = reels[cur];
    if (!r) return;
    vImg.src = r.frames[frame];
    const n = reels.filter((_, i) => shown(i)).length;
    const k = reels.slice(0, cur + 1).filter((_, i) => shown(i)).length;
    vCap.textContent = `${r.label}（${k}/${n}）`;
    vInfo.textContent = r.info ?? '';
    vHint.textContent = `第 ${frame + 1}/${r.frames.length} 帧${paused ? ' · 已暂停' : ''} · ← → 切换 · 空格暂停 · 暂停时 , . 逐帧 · Esc 或点击空白处返回`;
  };
  const view = (i: number) => {
    if (!reels[i]) return;
    cur = i;
    frame = 0;
    paused = false;
    vw.style.display = 'flex';
    window.clearInterval(vTimer);
    vTimer = window.setInterval(() => {
      const r = reels[cur];
      if (paused || !r) return;
      frame = (frame + 1) % r.frames.length;
      draw();
    }, FRAME_MS);
    draw();
  };
  const unview = () => {
    cur = -1;
    vw.style.display = 'none';
    window.clearInterval(vTimer);
  };
  const step = (d: number) => {
    // 跳过还没录好的格子
    for (let j = 1; j <= reels.length; j++) {
      const i = (cur + d * j + reels.length * j) % reels.length;
      if (shown(i)) return view(i);
    }
  };
  vw.onclick = (e) => {
    if (e.target !== vImg) unview();
  };
  vImg.onclick = () => ((paused = !paused), draw());

  let closed = false;
  const close = () => {
    closed = true;
    unview();
    root.remove();
    window.removeEventListener('keydown', onKey, true);
  };
  const onKey = (e: KeyboardEvent) => {
    const viewing = cur >= 0;
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (viewing) unview();
      else close();
      return;
    }
    if (!viewing) return;
    const r = reels[cur];
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') step(e.key === 'ArrowRight' ? 1 : -1);
    else if (e.key === ' ') paused = !paused;
    else if ((e.key === ',' || e.key === '.') && r) {
      paused = true;
      frame = (frame + (e.key === '.' ? 1 : r.frames.length - 1)) % r.frames.length;
    } else return;
    e.preventDefault();
    e.stopPropagation();
    draw();
  };
  window.addEventListener('keydown', onKey, true);
  x.onclick = close;
  Object.defineProperty(root, 'closed', { get: () => closed });
  return { root, status, grid, tabs, hidden, close, reels, view, tip };
}

/** 上次在每种动画墙里选中的分类，重新打开时沿用 */
const lastTab: Partial<Record<ReelKind, string>> = {};

/** 动画墙顶部的分类标签：「全部」+ 每个分类一个，点击只显示该分类的格子 */
function setupTabs(ov: Overlay, kind: ReelKind, cats: string[], cells: HTMLElement[], name: (c: string) => string): void {
  const order = [...new Set(cats)];
  if (order.length < 2) return;
  const btns = new Map<string, HTMLButtonElement>();
  const pick = (key: string) => {
    lastTab[kind] = key;
    ov.tip.hide();
    ov.hidden.clear();
    cats.forEach((c, i) => {
      const on = !key || c === key;
      cells[i].style.display = on ? '' : 'none';
      if (!on) ov.hidden.add(i);
    });
    for (const [k, b] of btns) {
      const on = k === key;
      b.style.background = on ? '#c9a227' : '#2a1418';
      b.style.color = on ? '#1a0a0c' : '#fff4ea';
      b.style.fontWeight = on ? 'bold' : 'normal';
    }
    ov.grid.scrollTop = 0;
  };
  const mk = (key: string, text: string) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.style.cssText = 'padding:3px 10px;cursor:pointer;border:1px solid #c9a227;border-radius:12px;font:13px system-ui';
    b.onclick = () => pick(key);
    btns.set(key, b);
    ov.tabs.append(b);
  };
  const label = document.createElement('span');
  label.textContent = '分类：';
  label.style.color = '#b89a9e';
  ov.tabs.append(label);
  mk('', `全部（${cats.length}）`);
  for (const c of order) mk(c, `${name(c)}（${cats.filter((x) => x === c).length}）`);
  ov.tabs.style.display = 'flex';
  const last = lastTab[kind];
  pick(last && order.includes(last) ? last : '');
}

/** 网格里的一格：先占位，录像到了再开始循环播放；点击全屏查看 */
interface Slot {
  cell: HTMLDivElement;
  play: (r: Reel, note?: string) => void;
}

function makeSlot(ov: Overlay, index: number, label: string, info: string): Slot {
  const grid = ov.grid;
  ov.reels[index] = null;
  const cell = document.createElement('div');
  cell.style.cssText = 'background:#1a0a0c;border:1px solid #5a3a3e;border-radius:6px;overflow:hidden;cursor:default';
  const img = document.createElement('img');
  img.style.cssText = 'width:100%;display:block;aspect-ratio:560/400;image-rendering:auto;background:#120607';
  const cap = document.createElement('div');
  cap.textContent = `${label} · 待录制`;
  cap.style.cssText = 'padding:3px 6px;color:#8a6a6e';
  cell.append(img, cap);
  cell.onclick = () => (ov.tip.hide(), ov.view(index));
  cell.onmouseenter = () => ov.tip.show(cell, label, info);
  cell.onmouseleave = () => ov.tip.hide();
  grid.append(cell);
  return {
    cell,
    play(r, note = '') {
      r.info ??= info;
      ov.reels[index] = r;
      cell.style.cursor = 'zoom-in';
      cap.textContent = r.label + note;
      cap.style.color = '#ffd166';
      let i = 0;
      img.src = r.frames[0];
      const timer = setInterval(() => {
        if (!grid.isConnected) return clearInterval(timer);
        i = (i + 1) % r.frames.length;
        img.src = r.frames[i];
      }, FRAME_MS);
    },
  };
}

/** 录一段：以玩家为中心截取 520×380 的区域 */
async function record(ctx: DevCtx, act: () => void, label: string): Promise<Reel> {
  const g = ctx.sb.g;
  const game = ctx.sb.game;
  const W = g.scale.width,
    H = g.scale.height;
  const w = 560,
    hh = 400;
  act();
  const frames: string[] = [];
  for (let i = 0; i < FRAMES; i++) {
    await sleep(FRAME_MS);
    frames.push(await snap(game, Math.round(W / 2 - w / 2), Math.round(H / 2 - hh / 2), w, hh));
  }
  return { label, frames };
}

/** 在玩家周围摆一圈受击目标（不攻击、不死；lock = 原地不动，否则会走向玩家，用来踩地雷） */
function dummies(ctx: DevCtx, n = 10, dist = [150, 210, 270], lock = true): void {
  const sb = ctx.sb;
  sb.clear();
  const opts: SpawnOpts = {
    ...ctx.ui.spawn,
    count: n,
    lock,
    attack: 'none',
    immortal: true,
    test: false,
    affixes: [],
    at: undefined,
    dist,
  };
  sb.spawn(ENEMIES[0].id, false, opts);
}

export type ReelKind = 'skills' | 'weapons' | 'evolved';

/** 动画墙：skills = 每名角色放一次技能；weapons / evolved = 每把（超）武器单独开火。
 *  录好的录像缓存在浏览器 IndexedDB 里（不进仓库），数据或演出代码没变就直接播放，只重录变了的；force = 全部重录 */
export async function reelWall(ctx: DevCtx, kind: ReelKind, filter = '', force = false): Promise<void> {
  const ov = overlay();
  const sb = ctx.sb;
  const before = JSON.parse(JSON.stringify(ctx.build));
  const list =
    kind === 'skills'
      ? CHARACTERS.filter((c) => !filter || c.id.includes(filter) || c.name.includes(filter) || c.skill.type === filter).map((c) => ({
          id: c.id,
          cat: c.skill.type as string,
          label: `${c.name} · ${c.skill.name}（${c.skill.type}）`,
          info: skillInfo(c.skill),
        }))
      : (kind === 'weapons' ? WEAPONS : EVOLVED_WEAPONS)
          .filter((w) => !filter || w.id.includes(filter) || w.name.includes(filter) || w.kind === filter)
          .map((w) => ({ id: w.id, cat: w.kind as string, label: `${w.name}（${w.kind}）`, info: w.desc }));
  const t0 = Date.now();
  // 先把所有格子摆出来，有缓存的立刻开始播放
  const slots = list.map((it, i) => makeSlot(ov, i, it.label, it.info));
  setupTabs(
    ov,
    kind,
    list.map((it) => it.cat),
    slots.map((s) => s.cell),
    (c) => (kind === 'skills' ? SKILL_TYPE_NAME[c] : KIND_NAME[c as WeaponKind]) ?? c,
  );
  const todo: number[] = [];
  const fps = list.map((it) => reelFingerprint(kind, it.id));
  ov.status.textContent = '读取录像缓存…';
  const cached = await Promise.all(list.map((it, i) => (force ? null : loadReel(`${kind}:${it.id}`, fps[i]))));
  cached.forEach((c, i) => (c ? slots[i].play({ label: list[i].label, frames: c.frames }, ' · 缓存') : todo.push(i)));
  const hit = list.length - todo.length;
  if (!todo.length) {
    ov.status.textContent = `全部 ${list.length} 段来自缓存 · 点击格子全屏查看 · 悬停看效果说明 · 每段 ${FRAMES} 帧循环`;
    return;
  }
  sb.god = true;
  sb.camMode = 'player';
  sb.setZoom(0.85);
  // 录制期间关掉自动放技能：否则角色技能会抢先打木桩，盖住武器效果、也让技能墙放两次
  const autoSkill = save.settings.autoSkill;
  save.settings.autoSkill = false;
  // 木桩头顶的名称 / 血量标签会挡住画面，录制时先关掉
  const labels = sb.overlay.labels;
  sb.overlay.labels = false;
  try {
    await recordAll();
  } finally {
    save.settings.autoSkill = autoSkill;
    sb.overlay.labels = labels;
  }
  async function recordAll(): Promise<void> {
    let done = 0;
    for (const i of todo) {
      if ((ov.root as unknown as { closed: boolean }).closed) break;
      const it = list[i];
      const el = (Date.now() - t0) / 1000;
      const eta = done ? (el / done) * (todo.length - done) : todo.length * 2.4;
      ov.status.textContent = `缓存 ${hit} 段 · 录制 ${done + 1}/${todo.length}：${it.label} · 已用 ${el.toFixed(0)} 秒 · 预计还需 ${eta.toFixed(0)} 秒`;
      const b = JSON.parse(JSON.stringify(before));
      if (kind === 'skills') b.charId = it.id;
      else b.weapons = [{ id: it.id, tier: 3 }];
      ctx.applyNow(b);
      await waitScene(ctx);
      await sleep(300);
      // 玩家放回场地中央、解锁，镜头立即对准（录制区域是画面中心）
      sb.lockPlayer = false;
      sb.playerAnchor = null;
      sb.camMode = 'player';
      {
        const g = sb.g;
        g.player.setPosition(g.arena.centerX, g.arena.centerY);
        sb.applyCamera();
        g.cameras.main.centerOn(g.player.x, g.player.y);
      }
      const wdef = kind === 'skills' ? undefined : (WEAPONS.find((w) => w.id === it.id) ?? EVOLVED_WEAPONS.find((w) => w.id === it.id));
      // 地雷要等敌人踩上去才炸：让木桩走向玩家
      if (kind === 'skills') dummies(ctx);
      else dummies(ctx, 10, weaponDist(it.id), wdef?.kind !== 'mine');
      await sleep(kind === 'skills' ? 150 : 400);
      const reel = await record(
        ctx,
        () => {
          if (kind !== 'skills') {
            // 木桩就位后让武器立刻开火，不必等开局的冷却
            for (const w of sb.g.weapons.list) w.cd = Math.min(w.cd, 0.05);
            return;
          }
          {
            const g = sb.g;
            g.moveX = 1;
            g.moveY = 0;
            sb.castSkill();
          }
        },
        it.label,
      );
      slots[i].play(reel, ' · 新录');
      void saveReel(`${kind}:${it.id}`, { fp: fps[i], label: it.label, frames: reel.frames });
      done++;
    }
    ov.status.textContent = `完成：缓存 ${hit} 段 + 新录 ${done} 段 · 用时 ${((Date.now() - t0) / 1000).toFixed(0)} 秒 · 点击格子全屏查看 · 悬停看效果说明 · 每段 ${FRAMES} 帧循环`;
    ctx.applyNow(before);
  }
  void run;
}

/** 武器动画墙的木桩距离：摆在武器射程内（近战 / 光环贴身，远程不超过 270） */
function weaponDist(id: string): number[] {
  const def = WEAPONS.find((w) => w.id === id) ?? EVOLVED_WEAPONS.find((w) => w.id === id);
  const d = Math.max(60, Math.min(270, (def?.range ?? 200) * 0.9));
  return [Math.round(d * 0.55), Math.round(d * 0.78), Math.round(d)];
}
