// Boss 转阶段专属动画用的小工具：碎片飞溅、烟雾、冲击环、升空 / 下潜、飞出的盖子、茧、翅膀、剪影……
// 全部用现有特效贴图（fx_glow / fx_smoke / fx_ring / fx_shadow）与 Graphics 程序绘制，不需要新美术资源。
import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';

const DEPTH = 13990;

/** 碎片飞溅：从 (x, y) 向四周抛出 n 片，带重力下落并淡出 */
export function fling(
  g: GameScene,
  x: number,
  y: number,
  o: { n: number; color: number; size?: number; speed?: number; up?: number; life?: number; shape?: 'chunk' | 'shard' | 'drop' | 'leaf' },
): void {
  const size = o.size ?? 10;
  for (let i = 0; i < o.n; i++) {
    const gr = g.add.graphics().setDepth(DEPTH);
    gr.fillStyle(o.color, 1);
    const s = size * (0.6 + Math.random() * 0.8);
    if (o.shape === 'shard') gr.fillTriangle(-s, s * 0.6, s, s * 0.4, 0, -s);
    else if (o.shape === 'drop') gr.fillEllipse(0, 0, s * 0.8, s * 1.2);
    else if (o.shape === 'leaf') gr.fillEllipse(0, 0, s * 1.4, s * 0.6);
    else gr.fillRoundedRect(-s / 2, -s / 2, s, s * 0.8, s * 0.2);
    gr.lineStyle(2, 0x000000, 0.35).strokeCircle(0, 0, s * 0.2);
    const a = Math.random() * Math.PI * 2,
      v = (o.speed ?? 260) * (0.5 + Math.random() * 0.7);
    const vx = Math.cos(a) * v,
      vy0 = Math.sin(a) * v * 0.6 - (o.up ?? 220);
    const life = (o.life ?? 0.9) * 1000;
    const spin = (Math.random() - 0.5) * 12;
    g.tweens.addCounter({
      from: 0,
      to: life,
      duration: life,
      onUpdate: (tw) => {
        const t = (tw.getValue() ?? 0) / 1000;
        gr.setPosition(x + vx * t, y + vy0 * t + 520 * t * t);
        gr.setRotation(spin * t);
        gr.setAlpha(1 - (t * 1000) / life);
      },
      onComplete: () => gr.destroy(),
    });
  }
}

/** 烟雾：n 团从 (x, y) 附近冒出、上升并散开 */
export function smoke(g: GameScene, x: number, y: number, color: number, n = 6, rise = 120, size = 1): void {
  for (let i = 0; i < n; i++) {
    const im = g.add
      .image(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 30, 'fx_smoke')
      .setDepth(DEPTH)
      .setTint(color)
      .setAlpha(0.75)
      .setScale(0.5 * size);
    g.tweens.add({
      targets: im,
      y: im.y - rise * (0.6 + Math.random() * 0.8),
      x: im.x + (Math.random() - 0.5) * 80,
      scale: (1.4 + Math.random()) * size,
      alpha: 0,
      delay: i * 70,
      duration: 900 + Math.random() * 400,
      onComplete: () => im.destroy(),
    });
  }
}

/** 冲击环：从 (x, y) 依次荡开 n 圈 */
export function rings(g: GameScene, x: number, y: number, color: number, n: number, r: number, gap = 220): void {
  for (let i = 0; i < n; i++) g.time.delayedCall(i * gap, () => g.fx.ring(x, y, r * (1 + i * 0.35), color, 600, i === 0));
}

/** 汇聚：粒子从四周飞向 Boss（蓄势段用） */
export function converge(g: GameScene, e: Enemy, color: number, n = 10, r = 220): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const im = g.add
      .image(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 'fx_glow')
      .setDepth(DEPTH)
      .setTint(color)
      .setScale(0.12)
      .setAlpha(0.9);
    g.tweens.add({
      targets: im,
      x: e.x,
      y: e.y,
      scale: 0.04,
      duration: 500 + Math.random() * 400,
      delay: Math.random() * 300,
      onComplete: () => im.destroy(),
    });
  }
}

/** 升空：Boss 变大变淡（像飞高了），地上留一块影子；dur 秒后落回 */
export function liftOff(g: GameScene, e: Enemy, dur = 1.3): void {
  const rig = e.rig;
  if (!rig) return;
  const sh = g.add
    .image(e.x, e.y + e.radius * 0.8, 'fx_shadow')
    .setDepth(e.y - 1)
    .setScale((e.radius * 2.4) / 64, (e.radius * 0.9) / 32)
    .setAlpha(0.5);
  g.tweens.add({
    targets: rig,
    scaleX: e.baseScale * 1.35,
    scaleY: e.baseScale * 1.35,
    alpha: 0.55,
    duration: 400,
    yoyo: true,
    hold: dur * 1000 - 800,
  });
  g.tweens.add({
    targets: sh,
    scaleX: sh.scaleX * 0.6,
    alpha: 0.25,
    duration: 400,
    yoyo: true,
    hold: dur * 1000 - 800,
    onComplete: () => sh.destroy(),
  });
}

/** 下潜：Boss 压扁、变透明，像钻进地下 / 沉入酱池；dur 秒后冒出 */
export function submerge(g: GameScene, e: Enemy, color: number, dur = 1.2): void {
  const rig = e.rig;
  if (!rig) return;
  fling(g, e.x, e.y + e.radius * 0.6, { n: 10, color, size: 12, up: 160, shape: 'chunk' });
  g.tweens.add({ targets: rig, scaleY: e.baseScale * 0.2, alpha: 0.1, duration: 350, yoyo: true, hold: dur * 1000 - 700 });
  g.time.delayedCall(dur * 1000 - 350, () => {
    if (!e.alive) return;
    fling(g, e.x, e.y + e.radius * 0.6, { n: 12, color, size: 12, up: 260, shape: 'chunk' });
    rings(g, e.x, e.y, color, 2, e.radius * 1.6);
  });
}

/** 飞出的盖子 / 帽子：一个旋转的圆片从 Boss 头顶飞出去 */
export function popLid(g: GameScene, e: Enemy, color: number, w = 1.2): void {
  const gr = g.add.graphics().setDepth(DEPTH);
  const r = e.radius * w;
  gr.fillStyle(color, 1).fillEllipse(0, 0, r * 2, r * 0.5);
  gr.lineStyle(4, 0x000000, 0.4).strokeEllipse(0, 0, r * 2, r * 0.5);
  gr.fillStyle(0xffffff, 0.35).fillEllipse(-r * 0.3, -r * 0.08, r * 0.8, r * 0.14);
  gr.setPosition(e.x, e.y - e.radius);
  const dir = Math.random() < 0.5 ? -1 : 1;
  g.tweens.add({
    targets: gr,
    x: e.x + dir * (260 + Math.random() * 120),
    y: e.y - e.radius - 260,
    rotation: dir * 8,
    alpha: 0,
    duration: 1100,
    ease: 'Quad.easeOut',
    onComplete: () => gr.destroy(),
  });
}

/** 茧 / 外壳：盖住 Boss 的椭圆，蓄势段逐渐显现，返回破壳函数（碎成碎片） */
export function shell(g: GameScene, e: Enemy, color: number, cracks = true): () => void {
  const gr = g.add.graphics().setDepth(e.y + 2);
  const draw = (k: number) => {
    gr.clear();
    gr.fillStyle(color, 0.9 * k).fillEllipse(0, 0, e.radius * 2.6, e.radius * 2.9);
    gr.lineStyle(5, 0x000000, 0.35 * k).strokeEllipse(0, 0, e.radius * 2.6, e.radius * 2.9);
    if (cracks && k > 0.6) {
      gr.lineStyle(3, 0xffffff, (k - 0.6) * 2);
      gr.lineBetween(-e.radius * 0.4, -e.radius * 0.9, 0, -e.radius * 0.2).lineBetween(0, -e.radius * 0.2, e.radius * 0.35, e.radius * 0.5);
    }
  };
  draw(0);
  gr.setPosition(e.x, e.y);
  g.tweens.addCounter({ from: 0, to: 1, duration: 1100, onUpdate: (tw) => draw(tw.getValue() ?? 0) });
  return () => {
    fling(g, e.x, e.y, { n: 16, color, size: 16, speed: 340, shape: 'shard' });
    gr.destroy();
  };
}

/** 翅膀：Boss 两侧扇动的半透明椭圆，dur 秒后消失 */
export function wings(g: GameScene, e: Enemy, color: number, dur = 1.4): void {
  for (const side of [-1, 1]) {
    const gr = g.add.graphics().setDepth(e.y - 1);
    gr.fillStyle(color, 0.55).fillEllipse(side * e.radius * 1.1, -e.radius * 0.3, e.radius * 1.6, e.radius * 0.8);
    gr.lineStyle(2, 0xffffff, 0.6).strokeEllipse(side * e.radius * 1.1, -e.radius * 0.3, e.radius * 1.6, e.radius * 0.8);
    gr.setPosition(e.x, e.y);
    g.tweens.add({ targets: gr, scaleY: 0.3, duration: 90, yoyo: true, repeat: Math.floor((dur * 1000) / 180) });
    g.tweens.add({ targets: gr, alpha: 0, delay: dur * 1000 - 200, duration: 200, onComplete: () => gr.destroy() });
  }
}

/** 光线：从 Boss 身上的裂缝射出 n 道光 */
export function rays(g: GameScene, e: Enemy, color: number, n = 6, len = 260): void {
  const gr = g.add.graphics().setDepth(DEPTH).setPosition(e.x, e.y).setBlendMode(Phaser.BlendModes.ADD);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    gr.fillStyle(color, 0.55);
    gr.fillTriangle(0, 0, Math.cos(a - 0.08) * len, Math.sin(a - 0.08) * len, Math.cos(a + 0.08) * len, Math.sin(a + 0.08) * len);
  }
  gr.setScale(0.2);
  g.tweens.add({ targets: gr, scale: 1, alpha: 0, rotation: 0.4, duration: 700, onComplete: () => gr.destroy() });
}

/** 屏幕闪色（受「屏幕震动」开关影响的强烈效果改为轻微） */
export function flash(g: GameScene, color: number, dur = 250, times = 1): void {
  const c = Phaser.Display.Color.IntegerToColor(color);
  for (let i = 0; i < times; i++) g.time.delayedCall(i * (dur + 120), () => g.cameras.main.flash(dur, c.red, c.green, c.blue, true));
}

/** 扫描线：一道发光横线从场地上方扫到下方（工厂主脑「协议启动」） */
export function scanline(g: GameScene, color: number, dur = 900): void {
  const A = g.arena;
  const gr = g.add.graphics().setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD);
  gr.fillStyle(color, 0.5).fillRect(A.left - 200, -8, A.width + 400, 16);
  gr.fillStyle(color, 0.15).fillRect(A.left - 200, -60, A.width + 400, 120);
  gr.y = A.top - 60;
  g.tweens.add({ targets: gr, y: A.bottom + 60, duration: dur, ease: 'Sine.easeInOut', onComplete: () => gr.destroy() });
}

/** 横扫浪潮：一道色带从场地一侧扫到另一侧（番茄酱海怪的酱浪） */
export function waveSweep(g: GameScene, color: number, fromLeft = true, dur = 1000): void {
  const A = g.arena;
  const w = 260;
  const gr = g.add.graphics().setDepth(0.85);
  gr.fillStyle(color, 0.75).fillRect(-w / 2, A.top - 200, w, A.height + 400);
  gr.fillStyle(0xffffff, 0.25).fillRect(w / 2 - 30, A.top - 200, 30, A.height + 400);
  gr.x = fromLeft ? A.left - w : A.right + w;
  g.tweens.add({
    targets: gr,
    x: fromLeft ? A.centerX : A.centerX,
    duration: dur,
    ease: 'Sine.easeOut',
    onComplete: () => g.tweens.add({ targets: gr, alpha: 0, duration: 300, onComplete: () => gr.destroy() }),
  });
}

/** 剪影：Boss 身后依次闪过一组贴图（腐烂之王身后的前代 Boss） */
export function silhouettes(g: GameScene, e: Enemy, keys: string[], color = 0x4a148c): void {
  keys.forEach((k, i) => {
    if (!g.textures.exists(k)) return;
    const a = -Math.PI / 2 + (i - (keys.length - 1) / 2) * 0.55;
    const im = g.add
      .image(e.x + Math.cos(a) * e.radius * 2.2, e.y + Math.sin(a) * e.radius * 1.6, k)
      .setDepth(e.y - 2)
      .setTintFill(color)
      .setAlpha(0)
      .setScale((e.radius * 2.2) / Math.max(1, g.textures.get(k).getSourceImage().width));
    g.tweens.add({ targets: im, alpha: 0.7, delay: i * 180, duration: 300, yoyo: true, hold: 500, onComplete: () => im.destroy() });
  });
}

/** 飞出的球：从 Boss 头顶抛出、弹一下、滚到 (tx, ty)（冰淇淋暴君掉球） */
export function lobBall(g: GameScene, e: Enemy, tx: number, ty: number, r: number, color: number, dur = 1100): void {
  const gr = g.add.graphics().setDepth(DEPTH);
  gr.fillStyle(color, 1).fillCircle(0, 0, r);
  gr.fillStyle(0xffffff, 0.5).fillCircle(-r * 0.35, -r * 0.35, r * 0.25);
  gr.lineStyle(4, 0x000000, 0.25).strokeCircle(0, 0, r);
  const x0 = e.x,
    y0 = e.y - e.radius * 1.4;
  g.tweens.addCounter({
    from: 0,
    to: 1,
    duration: dur,
    onUpdate: (tw) => {
      const k = tw.getValue() ?? 0;
      const hop = Math.sin(k * Math.PI) * 180 + (k > 0.7 ? Math.sin(((k - 0.7) / 0.3) * Math.PI) * 30 : 0);
      gr.setPosition(x0 + (tx - x0) * k, y0 + (ty - y0) * k - hop);
      gr.setRotation(k * 6);
    },
    onComplete: () => {
      fling(g, tx, ty, { n: 8, color, size: 10, up: 120, shape: 'drop' });
      gr.destroy();
    },
  });
}

/** 剪刀：两片刀刃在 Boss 身前合拢（枯萎园丁「咔嚓」） */
export function snip(g: GameScene, e: Enemy, color = 0xb0bec5): void {
  for (const side of [-1, 1]) {
    const gr = g.add.graphics().setDepth(DEPTH).setPosition(e.x, e.y);
    gr.fillStyle(color, 1).fillTriangle(0, -6, e.radius * 2.2, -2, 0, 8);
    gr.lineStyle(2, 0x37474f, 1).strokeTriangle(0, -6, e.radius * 2.2, -2, 0, 8);
    gr.setRotation(side * 0.7);
    g.tweens.add({
      targets: gr,
      rotation: 0,
      duration: 180,
      delay: 200,
      ease: 'Back.easeIn',
      onComplete: () => g.tweens.add({ targets: gr, alpha: 0, duration: 300, onComplete: () => gr.destroy() }),
    });
  }
}
