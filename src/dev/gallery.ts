// 开发者「阵列预览」：一屏看到多个对象，便于对比视觉效果
// - 现场阵列（实时）：全部小怪 / 全部精英与 Boss / 同一只怪 × 每种精英词缀，按网格摆在场地上，锁定不动、不攻击、不死
// - 动画墙（录制）：逐个让角色放技能、或逐把武器开火，每个录 12 帧，最后在一张网格里同时循环播放
import Phaser from 'phaser';
import type { DevCtx } from './ctx';
import type { SpawnOpts } from './sandbox';
import { ENEMIES } from '../data/enemies';
import { BOSSES, AFFIX_IDS, AFFIXES, type AffixId } from '../data/bosses';
import { CHARACTERS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { EVOLVED_WEAPONS } from '../data/evolutions';
import { run } from '../systems/RunState';

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
  frames: HTMLImageElement[];
}

const FRAMES = 12;
const FRAME_MS = 110;

function snap(game: Phaser.Game, x: number, y: number, w: number, hgt: number): Promise<HTMLImageElement> {
  return new Promise((res) => game.renderer.snapshotArea(x, y, w, hgt, (img) => res(img as HTMLImageElement)));
}

async function waitScene(ctx: DevCtx): Promise<void> {
  for (let i = 0; i < 60; i++) {
    await sleep(50);
    const g = ctx.sb.g;
    if (ctx.sb.running && g.skill && g.player) return;
  }
}

function overlay(): { root: HTMLDivElement; status: HTMLDivElement; grid: HTMLDivElement; close: () => void } {
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
    'flex:1;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;align-content:start';
  root.append(bar, grid);
  document.body.append(root);
  let closed = false;
  const close = () => {
    closed = true;
    root.remove();
    window.removeEventListener('keydown', onKey, true);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  };
  window.addEventListener('keydown', onKey, true);
  x.onclick = close;
  Object.defineProperty(root, 'closed', { get: () => closed });
  return { root, status, grid, close };
}

function showReels(grid: HTMLDivElement, reels: Reel[]): void {
  grid.innerHTML = '';
  for (const r of reels) {
    const cell = document.createElement('div');
    cell.style.cssText = 'background:#1a0a0c;border:1px solid #5a3a3e;border-radius:6px;overflow:hidden;cursor:zoom-in';
    const img = document.createElement('img');
    img.style.cssText = 'width:100%;display:block;image-rendering:auto';
    const cap = document.createElement('div');
    cap.textContent = r.label;
    cap.style.cssText = 'padding:3px 6px;color:#ffd166';
    cell.append(img, cap);
    cell.onclick = () => {
      const big = cell.style.gridColumn === 'span 3';
      cell.style.gridColumn = big ? '' : 'span 3';
      cell.style.cursor = big ? 'zoom-in' : 'zoom-out';
    };
    grid.append(cell);
    let i = 0;
    if (r.frames.length) img.src = r.frames[0].src;
    const timer = setInterval(() => {
      if (!grid.isConnected) return clearInterval(timer);
      i = (i + 1) % r.frames.length;
      img.src = r.frames[i].src;
    }, FRAME_MS);
  }
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
  const frames: HTMLImageElement[] = [];
  for (let i = 0; i < FRAMES; i++) {
    await sleep(FRAME_MS);
    frames.push(await snap(game, Math.round(W / 2 - w / 2), Math.round(H / 2 - hh / 2), w, hh));
  }
  return { label, frames };
}

/** 在玩家周围摆一圈受击目标（锁定、不攻击、不死） */
function dummies(ctx: DevCtx, n = 10): void {
  const sb = ctx.sb;
  sb.clear();
  const opts: SpawnOpts = {
    ...ctx.ui.spawn,
    count: n,
    lock: true,
    attack: 'none',
    immortal: true,
    test: false,
    affixes: [],
    at: undefined,
    dist: [150, 210, 270],
  };
  sb.spawn(ENEMIES[0].id, false, opts);
}

export type ReelKind = 'skills' | 'weapons' | 'evolved';

/** 动画墙：skills = 每名角色放一次技能；weapons / evolved = 每把（超）武器单独开火 */
export async function reelWall(ctx: DevCtx, kind: ReelKind, filter = ''): Promise<void> {
  const ov = overlay();
  const sb = ctx.sb;
  const before = JSON.parse(JSON.stringify(ctx.build));
  const list =
    kind === 'skills'
      ? CHARACTERS.filter((c) => !filter || c.id.includes(filter) || c.name.includes(filter) || c.skill.type === filter).map((c) => ({
          id: c.id,
          label: `${c.name} · ${c.skill.name}（${c.skill.type}）`,
        }))
      : (kind === 'weapons' ? WEAPONS : EVOLVED_WEAPONS)
          .filter((w) => !filter || w.id.includes(filter) || w.name.includes(filter) || w.kind === filter)
          .map((w) => ({ id: w.id, label: `${w.name}（${w.kind}）` }));
  const reels: Reel[] = [];
  const t0 = Date.now();
  sb.god = true;
  sb.camMode = 'player';
  sb.setZoom(0.85);
  for (let i = 0; i < list.length; i++) {
    if ((ov.root as unknown as { closed: boolean }).closed) break;
    const it = list[i];
    ov.status.textContent = `录制 ${i + 1}/${list.length}：${it.label} · 已用 ${((Date.now() - t0) / 1000).toFixed(0)} 秒（每个约 2 秒）`;
    const b = JSON.parse(JSON.stringify(before));
    if (kind === 'skills') b.charId = it.id;
    else b.weapons = [{ id: it.id, tier: kind === 'evolved' ? 3 : 3 }];
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
    dummies(ctx);
    await sleep(kind === 'skills' ? 150 : 400);
    const reel = await record(
      ctx,
      () => {
        if (kind === 'skills') {
          const g = sb.g;
          g.moveX = 1;
          g.moveY = 0;
          sb.castSkill();
        }
      },
      it.label,
    );
    reels.push(reel);
    showReels(ov.grid, reels);
  }
  ov.status.textContent = `完成：${reels.length} 段 · 用时 ${((Date.now() - t0) / 1000).toFixed(0)} 秒 · 点击格子放大 · 每段 ${FRAMES} 帧循环`;
  ctx.applyNow(before);
  void run;
}
