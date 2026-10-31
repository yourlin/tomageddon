import Phaser from 'phaser';
import { tx } from '../i18n';
import { setInputMode } from './InputMode';

/** 手柄菜单导航：十字键 / 左摇杆移动焦点，A 确认，B 返回（ESC / 关闭类按钮 / 点遮罩），右摇杆竖向滚动。
 *  不依赖各场景的实现：直接扫描场景里可交互的对象，按位置做方向导航，确认时发出 pointerup（按钮 / hitArea 都认）。
 *  战斗场景（Game / Hud）不参与，那里的手柄操作由 Controls.readPad 负责。 */
const SKIP = new Set(['Game', 'Hud', 'Boot']);
const DEAD = 0.5;
const REPEAT_FIRST = 380;
const REPEAT = 130;
const BACK_LABEL = /^(关闭|返回|取消|退出|Close|Back|Cancel|Exit)|[×✕]/;

type Obj = Phaser.GameObjects.GameObject & {
  input: Phaser.Types.Input.InteractiveObject;
  parentContainer?: Phaser.GameObjects.Container | null;
  label?: Phaser.GameObjects.Text;
};
interface Cand {
  obj: Obj;
  x: number;
  y: number;
  w: number;
  h: number;
}

function visible(o: Phaser.GameObjects.GameObject): boolean {
  for (let p: Phaser.GameObjects.GameObject | null | undefined = o; p; p = (p as Obj).parentContainer) {
    const v = p as unknown as { visible?: boolean; alpha?: number };
    if (v.visible === false || (v.alpha ?? 1) <= 0) return false;
  }
  return true;
}

/** 世界坐标下的可点击区域（中心 + 宽高） */
function area(o: Obj): { x: number; y: number; w: number; h: number } | null {
  try {
    const hit = o.input.hitArea;
    const t = (
      o as unknown as Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.GetBounds
    ).getWorldTransformMatrix?.();
    if (hit instanceof Phaser.Geom.Rectangle && t) {
      const ox = (o as unknown as { displayOriginX?: number }).displayOriginX ?? 0;
      const oy = (o as unknown as { displayOriginY?: number }).displayOriginY ?? 0;
      const c = t.transformPoint(hit.x + hit.width / 2 - ox, hit.y + hit.height / 2 - oy);
      return { x: c.x, y: c.y, w: hit.width * Math.abs(t.scaleX), h: hit.height * Math.abs(t.scaleY) };
    }
    const b = (o as unknown as Phaser.GameObjects.Components.GetBounds).getBounds();
    return { x: b.centerX, y: b.centerY, w: b.width, h: b.height };
  } catch {
    return null;
  }
}

function walk(list: Phaser.GameObjects.GameObject[], out: Obj[]): void {
  for (const o of list) {
    if (o.input?.enabled) out.push(o as Obj);
    if (o instanceof Phaser.GameObjects.Container) walk(o.list, out);
  }
}

function topLevel(o: Obj): Phaser.GameObjects.GameObject {
  let p: Phaser.GameObjects.GameObject = o;
  while ((p as Obj).parentContainer) p = (p as Obj).parentContainer!;
  return p;
}

interface Scan {
  cands: Cand[];
  backdrop: Obj | null;
}

function scan(scene: Phaser.Scene): Scan {
  const all: Obj[] = [];
  walk(scene.children.list, all);
  const view = scene.cameras.main.worldView;
  const big = view.width * view.height * 0.4;
  const top = scene.children.list;
  let backdrop: Obj | null = null;
  const cands: Cand[] = [];
  for (const o of all) {
    if (!visible(o)) continue;
    const a = area(o);
    if (!a) continue;
    // 全屏透明遮罩：只用来判断弹窗并响应「点空白处关闭」，不当作可选项
    if (a.w * a.h >= big) {
      backdrop = o;
      continue;
    }
    // 弹窗面板用来吸收点击的近乎透明矩形，不是按钮
    const fa = (o as unknown as { fillAlpha?: number }).fillAlpha;
    if (o instanceof Phaser.GameObjects.Rectangle && fa !== undefined && fa <= 0.01) continue;
    // 滚出屏幕的目标不参与选择（用右摇杆滚动列表后再选）
    if (a.x < view.x - 4 || a.x > view.right + 4 || a.y < view.y - 4 || a.y > view.bottom + 4) continue;
    cands.push({ obj: o, ...a });
  }
  if (backdrop) {
    // 有遮罩（弹窗）时只在弹窗里导航：遮罩所在的顶层容器，或显示列表里排在它之后的对象
    const bi = top.indexOf(topLevel(backdrop));
    const keep = cands.filter((c) => top.indexOf(topLevel(c.obj)) >= bi);
    return { cands: keep, backdrop };
  }
  return { cands, backdrop: null };
}

function pick(cands: Cand[], from: { x: number; y: number }, dx: number, dy: number, exclude?: Obj): Cand | null {
  let best: Cand | null = null;
  let bestScore = Infinity;
  for (const c of cands) {
    if (c.obj === exclude) continue;
    const vx = c.x - from.x;
    const vy = c.y - from.y;
    const along = vx * dx + vy * dy;
    if (along <= 1) continue;
    const across = Math.abs(vx * dy - vy * dx);
    // 沿方向的距离为主，偏离方向的代价加倍：同一行 / 列的按钮优先
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

export function installPadNav(game: Phaser.Game): void {
  let focus: Obj | null = null;
  let last = { x: 0, y: 0 };
  let shown = false;
  let ringScene: Phaser.Scene | null = null;
  let ring: Phaser.GameObjects.Graphics | null = null;
  let hint: Phaser.GameObjects.Text | null = null;
  const down: Record<string, boolean> = {};
  const nextRepeat: Record<string, number> = {};

  const edge = (key: string, now: boolean, t: number, repeat = false): boolean => {
    const was = down[key];
    down[key] = now;
    if (!now) return false;
    if (!was) {
      nextRepeat[key] = t + REPEAT_FIRST;
      return true;
    }
    if (repeat && t >= nextRepeat[key]) {
      nextRepeat[key] = t + REPEAT;
      return true;
    }
    return false;
  };

  const targetScene = (): Phaser.Scene | null => {
    const act = game.scene.getScenes(true).filter((s) => !SKIP.has(s.scene.key));
    // 最上层：渲染顺序里排最后、且确有可交互对象的场景
    for (let i = act.length - 1; i >= 0; i--) if (scan(act[i]).cands.length) return act[i];
    return null;
  };

  const hide = () => {
    shown = false;
    ring?.clear();
    hint?.setVisible(false);
  };
  window.addEventListener('mousemove', hide);
  window.addEventListener('pointerdown', hide);

  const drawRing = (scene: Phaser.Scene, c: Cand | null) => {
    if (ringScene !== scene || !ring || !ring.scene) {
      ring?.destroy();
      ring = scene.add.graphics().setDepth(100000);
      ringScene = scene;
    }
    ring.clear();
    if (!hint || !hint.scene || hint.scene !== scene) {
      hint?.destroy();
      const v = scene.cameras.main.worldView;
      hint = scene.add
        .text(v.centerX, v.bottom - 8, tx('方向键 / 左摇杆：选择　A：确认　B：返回', 'D-pad / Left stick: select   A: confirm   B: back'), {
          fontSize: '16px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
        })
        .setOrigin(0.5, 1)
        .setDepth(100000)
        .setAlpha(0.75);
    }
    hint.setVisible(!!c && shown);
    if (!c || !shown) return;
    const pulse = 0.65 + 0.35 * Math.sin(scene.time.now / 150);
    const pad = 5;
    ring.lineStyle(4, 0xffd166, pulse).strokeRoundedRect(c.x - c.w / 2 - pad, c.y - c.h / 2 - pad, c.w + pad * 2, c.h + pad * 2, 12);
    ring
      .lineStyle(2, 0x000000, 0.6)
      .strokeRoundedRect(c.x - c.w / 2 - pad - 2, c.y - c.h / 2 - pad - 2, c.w + pad * 2 + 4, c.h + pad * 2 + 4, 14);
  };

  const fire = (o: Obj) => {
    try {
      o.emit('pointerdown');
      o.emit('pointerup');
    } catch (e) {
      console.warn('[padnav] 触发失败', e);
    }
  };

  const back = (scene: Phaser.Scene, s: Scan) => {
    const kb = scene.input.keyboard;
    if (kb && kb.listenerCount('keydown-ESC') > 0) {
      kb.emit('keydown-ESC');
      return;
    }
    if (s.backdrop) {
      s.backdrop.emit('pointerdown');
      return;
    }
    const key = scene.scene.key;
    const re = key === 'Pause' ? /^(继续|Resume)|关闭|Close/ : BACK_LABEL;
    const hit = s.cands.find((c) => re.test(c.obj.label?.text ?? ''));
    if (hit) fire(hit.obj);
  };

  game.events.on(Phaser.Core.Events.PRE_STEP, (t: number) => {
    const pads = (typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []) as (Gamepad | null)[];
    const p = pads.find((x) => x && x.connected);
    if (!p) return;
    if (p.buttons.some((x) => x.pressed) || p.axes.some((a) => Math.abs(a) > DEAD)) setInputMode('pad');
    const b = (i: number) => !!p.buttons[i]?.pressed;
    const ax = p.axes[0] ?? 0;
    const ay = p.axes[1] ?? 0;
    const left = b(14) || ax < -DEAD;
    const right = b(15) || ax > DEAD;
    const up = b(12) || ay < -DEAD;
    const downD = b(13) || ay > DEAD;
    const dirs: [string, boolean, number, number][] = [
      ['L', left, -1, 0],
      ['R', right, 1, 0],
      ['U', up, 0, -1],
      ['D', downD, 0, 1],
    ];
    const moves = dirs.filter(([k, on]) => edge(k, on, t, true));
    const okA = edge('A', b(0), t);
    const okB = edge('B', b(1), t) || edge('S', b(9), t);
    const sy = p.axes[3] ?? 0;
    if (!moves.length && !okA && !okB && Math.abs(sy) < 0.3) return;

    const scene = targetScene();
    if (!scene) return;
    shown = true;
    const s = scan(scene);
    if (okB) {
      back(scene, s);
      return;
    }
    if (Math.abs(sy) >= 0.3) {
      const ptr = scene.input.activePointer;
      scene.input.emit('wheel', ptr, [], 0, sy * 40, 0);
    }
    let cur = s.cands.find((c) => c.obj === focus) ?? null;
    if (!cur) {
      // 焦点丢失（界面重建）：选离上次位置最近的；第一次选面积最大的（菜单里的主按钮、商店里的货架卡片），面积相近取靠上的
      const ref = last.x || last.y ? last : null;
      cur = ref
        ? ([...s.cands].sort((a, c) => Math.hypot(a.x - ref.x, a.y - ref.y) - Math.hypot(c.x - ref.x, c.y - ref.y))[0] ?? null)
        : ([...s.cands].sort((a, c) => (Math.abs(a.w * a.h - c.w * c.h) > 400 ? c.w * c.h - a.w * a.h : a.y - c.y))[0] ?? null);
      focus = cur?.obj ?? null;
      if (cur) last = { x: cur.x, y: cur.y };
      // 第一次按键只亮起焦点框，不同时移动 / 确认
      return;
    }
    if (!cur) return;
    for (const [, , dx, dy] of moves) {
      const n = pick(s.cands, cur, dx, dy);
      if (n) {
        cur = n;
        focus = n.obj;
        last = { x: n.x, y: n.y };
      }
    }
    if (okA) fire(cur.obj);
  });

  // 每帧画焦点框（焦点对象被销毁 / 隐藏时自动清掉，下次按键重新选）
  game.events.on(Phaser.Core.Events.POST_STEP, () => {
    if (!shown || !focus) {
      ring?.clear();
      hint?.setVisible(false);
      return;
    }
    const scene = game.scene.getScenes(true).find((s) => s.children.exists(topLevel(focus!)));
    if (!scene || !focus.active || !visible(focus)) {
      ring?.clear();
      hint?.setVisible(false);
      return;
    }
    const a = area(focus);
    if (a) drawRing(scene, { obj: focus, ...a });
  });
}

/** 调试用：当前场景里手柄能选中的目标数量（用来检查各界面是否都能用手柄操作） */
export function padNavTargets(scene: Phaser.Scene): number {
  return scan(scene).cands.length;
}
