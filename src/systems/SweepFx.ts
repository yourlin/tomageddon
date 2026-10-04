// 横扫类超武的专属招式：同为 sweep，不同超武打出不同的判定与特效
//   擎天擀面柱：360° 回旋横扫 + 金色冲击环
//   屠龙菜刀：交叉双斩 + 向前飞出的贯穿刀气
//   铸铁壁垒锅：盾形冲击波，扇区内的敌方子弹被拍碎
//   西瓜震地锤：抡起砸地，地裂 + 两圈余震（附带短暂眩晕）
import Phaser from 'phaser';
import type { GameScene, HitInfo } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import { explodeSizeMultiplier } from '../data/balance';
import { tx } from '../i18n';

export type SweepStyle = 'titan' | 'dragon' | 'bastion' | 'quake';

export const SWEEP_STYLE: Record<string, SweepStyle> = {
  titan_pin: 'titan',
  dragon_cleaver: 'dragon',
  iron_bastion_pan: 'bastion',
  melon_quake: 'quake',
};

/** 横扫判定的半角（弧度）；titan 为整圈 */
export function sweepHalfArc(st: SweepStyle | undefined): number {
  switch (st) {
    case 'titan':
      return Math.PI + 0.01;
    case 'dragon':
      return 1.5;
    case 'bastion':
      return 1.4;
    default:
      return 1.25;
  }
}

/** 攻击动画中武器精灵的挥动轨迹：返回挥动角与伸出距离；未定制返回 null 走默认 */
export function sweepPose(st: SweepStyle | undefined, a: number, k: number, range: number): { sw: number; ext: number } | null {
  switch (st) {
    case 'titan': // 绕身一整圈
      return { sw: a + k * Math.PI * 2, ext: range * 0.55 * Math.min(1, k * 4) };
    case 'dragon': // 更宽、更远的一刀
      return { sw: a - 1.6 + k * 3.2, ext: Math.sin(k * Math.PI) * range * 0.7 };
    case 'quake': // 先抡到身后，再加速砸下
      return { sw: a - 2.6 + k * k * 2.6, ext: range * (0.25 + 0.45 * k) };
    default:
      return null;
  }
}

export interface SweepCtx {
  g: GameScene;
  x: number;
  y: number;
  a: number;
  range: number;
  info: HitInfo;
}

export function playSweep(st: SweepStyle, c: SweepCtx): void {
  STYLE_FN[st](c);
}

/** 专属招式的源码（动画墙录像指纹用：招式代码改了就重录） */
export function sweepSource(id: string): string {
  const st = SWEEP_STYLE[id];
  return st ? String(STYLE_FN[st]) + String(sweepPose) + String(sweepHalfArc) : '';
}

/** 一道刀光绕中心旋转后淡出 */
function spinSlash(g: GameScene, x: number, y: number, rot: number, r: number, color: number, turn: number, dur: number): void {
  const img = g.add
    .image(x, y, 'fx_slash')
    .setRotation(rot)
    .setTint(color)
    .setDepth(14000)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setScale((r * 2) / 128)
    .setAlpha(0.95);
  g.tweens.add({ targets: img, rotation: rot + turn, alpha: 0, duration: dur, ease: 'Cubic.easeOut', onComplete: () => img.destroy() });
}

// ---------------- 擎天擀面柱 ----------------
function titan({ g, x, y, a, range }: SweepCtx): void {
  for (let i = 0; i < 3; i++) spinSlash(g, x, y, a + (i * Math.PI * 2) / 3, range * 0.95, i ? 0xffe08a : 0xffffff, Math.PI * 2, 300);
  g.fx.ring(x, y, range * 1.05, 0xffd166, 340, true);
  g.fx.ring(x, y, range * 1.15, 0xffffff, 280);
  g.fx.burst(x, y, 0xfff7e6, 18); // 扬起面粉
  g.shake(0.004, 120);
}

// ---------------- 屠龙菜刀 ----------------
function dragon({ g, x, y, a, range, info }: SweepCtx): void {
  g.fx.slash(x, y, a - 0.4, range, 0xff4d2e, 1.25);
  g.fx.slash(x, y, a + 0.4, range * 0.92, 0xffd166, 1.25);
  // 刀气：向前飞出，贯穿沿途所有敌人（60% 伤害）
  const dist = range * 2.4;
  const wave = g.add
    .image(x + Math.cos(a) * range * 0.4, y + Math.sin(a) * range * 0.4, 'fx_slash')
    .setRotation(a)
    .setTint(0xff3b1f)
    .setDepth(14001)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setScale((range * 1.1) / 128, (range * 1.6) / 128);
  const sx = wave.x,
    sy = wave.y;
  const hitSet = new Set<Enemy>();
  let trail = 0;
  g.tweens.addCounter({
    from: 0,
    to: 1,
    duration: 280,
    ease: 'Quad.easeOut',
    onUpdate: (tw) => {
      const v = tw.getValue() ?? 0;
      wave.setPosition(sx + Math.cos(a) * dist * v, sy + Math.sin(a) * dist * v).setAlpha(1 - v * 0.6);
      for (const e of [...g.grid.query(wave.x, wave.y, 52, g.tmp)]) {
        if (hitSet.has(e)) continue;
        hitSet.add(e);
        g.weaponHit(e, { ...info, dmg: info.dmg * 0.6 }, x, y);
      }
      if (++trail % 3 === 0) g.fx.afterimage(wave, 0xff6b3d);
    },
    onComplete: () => wave.destroy(),
  });
  g.shake(0.005, 110);
}

// ---------------- 铸铁壁垒锅 ----------------
function bastion({ g, x, y, a, range }: SweepCtx): void {
  g.fx.slash(x, y, a, range * 0.95, 0xd9e2ec, 1.1);
  // 盾形冲击波
  const half = 1.3;
  const gr = g.add.graphics().setDepth(14000).setPosition(x, y).setBlendMode(Phaser.BlendModes.ADD);
  gr.lineStyle(12, 0x9fb3c8, 0.9)
    .beginPath()
    .arc(0, 0, range * 0.6, a - half, a + half)
    .strokePath();
  gr.lineStyle(4, 0xffffff, 0.9)
    .beginPath()
    .arc(0, 0, range * 0.58, a - half, a + half)
    .strokePath();
  g.tweens.add({ targets: gr, scale: 1.7, alpha: 0, duration: 300, ease: 'Cubic.easeOut', onComplete: () => gr.destroy() });
  g.fx.burst(x + Math.cos(a) * range * 0.6, y + Math.sin(a) * range * 0.6, 0xffe08a, 10);
  // 壁垒：拍碎扇区内的敌方子弹
  let blocked = 0;
  const r2 = (range * 1.05) ** 2;
  for (const b of g.enemyBullets) {
    if (!b.alive) continue;
    const dx = b.x - x,
      dy = b.y - y;
    if (dx * dx + dy * dy > r2 || Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - a)) > half + 0.1) continue;
    g.fx.burst(b.x, b.y, 0xffffff, 4);
    b.kill();
    blocked++;
  }
  if (blocked) g.fx.label(x + Math.cos(a) * 50, y + Math.sin(a) * 50, tx('铛！', 'CLANG!'), '#cfe8ff');
  g.shake(0.003, 90);
}

// ---------------- 西瓜震地锤 ----------------
function quake({ g, x, y, a, range, info }: SweepCtx): void {
  const ix = x + Math.cos(a) * range * 0.7,
    iy = y + Math.sin(a) * range * 0.7;
  const base = (info.effect?.explode ?? 120) * explodeSizeMultiplier(g.stats.explodeSize);
  // 地裂纹（画在地面层）
  const cr = g.add.graphics().setDepth(1).setPosition(ix, iy);
  cr.lineStyle(4, 0x3d2b1f, 0.85);
  for (let i = 0; i < 8; i++) {
    let ang = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
    let px = 0,
      py = 0;
    cr.beginPath().moveTo(0, 0);
    const len = base * (0.9 + Math.random() * 0.5);
    for (let s = 1; s <= 4; s++) {
      ang += Phaser.Math.FloatBetween(-0.35, 0.35);
      px += Math.cos(ang) * (len / 4);
      py += Math.sin(ang) * (len / 4);
      cr.lineTo(px, py);
    }
    cr.strokePath();
  }
  g.tweens.add({ targets: cr, alpha: 0, delay: 500, duration: 700, onComplete: () => cr.destroy() });
  g.fx.splat(ix, iy, 0xff4d6d, base * 0.45);
  g.fx.burst(ix, iy, 0xff4d6d, 16); // 瓜汁
  g.fx.burst(ix, iy, 0x222222, 10); // 瓜子
  g.shake(0.012, 240);
  // 两圈余震：只伤外环里的敌人，并短暂震倒
  let inner = base;
  for (let k = 1; k <= 2; k++) {
    const outer = base * (1 + 0.5 * k);
    const rIn = inner;
    g.time.delayedCall(150 * k, () => {
      g.fx.ring(ix, iy, outer, 0xff8fa3, 320, true);
      g.fx.ring(ix, iy, outer * 1.05, 0x7bd389, 280);
      g.shake(0.006, 120);
      for (const e of [...g.grid.query(ix, iy, outer, g.tmp)]) {
        if (Phaser.Math.Distance.Between(e.x, e.y, ix, iy) < rIn * 0.8) continue;
        g.weaponHit(e, { ...info, dmg: info.dmg * 0.4, effect: { stun: 0.3 }, explosion: true }, ix, iy);
      }
    });
    inner = outer;
  }
}

// 函数声明会提升，这里引用后面定义的招式函数没有问题
const STYLE_FN: Record<SweepStyle, (c: SweepCtx) => void> = { titan, dragon, bastion, quake };
