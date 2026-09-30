// 技能释放动画：名称横幅 + 光芒 + 镜头冲击 + 按技能形态的专属特效
import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { SkillDef } from '../data/characters';
import { FONT } from './Textures';

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

/** 技能名称横幅：在角色头顶弹出并上浮淡出 */
function banner(g: GameScene, x: number, y: number, name: string, color: number): void {
  const t = g.add
    .text(x, y - 90, name, {
      fontFamily: FONT,
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: hex(color),
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setDepth(12000)
    .setScale(0.3);
  t.setShadow(0, 4, 'rgba(0,0,0,0.5)', 6, true, true);
  g.tweens.add({ targets: t, scale: 1.15, duration: 160, ease: 'Back.easeOut' });
  g.tweens.add({
    targets: t,
    scale: 1,
    y: y - 120,
    alpha: 0,
    delay: 520,
    duration: 420,
    ease: 'Cubic.easeIn',
    onComplete: () => t.destroy(),
  });
}

/** 旋转光芒 + 地面光晕 */
function rays(g: GameScene, x: number, y: number, color: number, r = 150): void {
  const gr = g.add.graphics().setDepth(9).setPosition(x, y).setBlendMode(Phaser.BlendModes.ADD);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    gr.fillStyle(color, 0.35);
    gr.fillTriangle(0, 0, Math.cos(a - 0.1) * r, Math.sin(a - 0.1) * r, Math.cos(a + 0.1) * r, Math.sin(a + 0.1) * r);
  }
  gr.fillStyle(color, 0.35).fillCircle(0, 0, r * 0.45);
  gr.fillStyle(0xffffff, 0.5).fillCircle(0, 0, r * 0.18);
  gr.setScale(0.2);
  g.tweens.add({ targets: gr, scale: 1.25, angle: 50, alpha: 0, duration: 600, ease: 'Cubic.easeOut', onComplete: () => gr.destroy() });
}

/** 冲击波：由内向外的粗环 */
function shockwave(g: GameScene, x: number, y: number, r: number, color: number, delay = 0, width = 14): void {
  const gr = g.add.graphics().setDepth(9).setPosition(x, y).setBlendMode(Phaser.BlendModes.ADD);
  gr.lineStyle(width, color, 0.9).strokeCircle(0, 0, r);
  gr.lineStyle(width * 0.4, 0xffffff, 0.8).strokeCircle(0, 0, r * 0.96);
  gr.setScale(0.1).setAlpha(0);
  g.tweens.add({
    targets: gr,
    scale: 1,
    alpha: { from: 1, to: 0 },
    delay,
    duration: 520,
    ease: 'Quad.easeOut',
    onComplete: () => gr.destroy(),
  });
}

/** 光柱 + 上升光点（跟随玩家，持续 dur 秒） */
function pillar(g: GameScene, color: number, dur: number): void {
  const p = g.player;
  const col = g.add.graphics().setDepth(11500).setBlendMode(Phaser.BlendModes.ADD);
  col.fillStyle(color, 0.28).fillEllipse(0, -60, 90, 190);
  col.fillStyle(0xffffff, 0.22).fillEllipse(0, -60, 36, 170);
  const ring = g.add.graphics().setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
  ring.lineStyle(5, color, 0.8).strokeEllipse(0, 0, 110, 44);
  col.setAlpha(0);
  g.tweens.add({ targets: col, alpha: 1, duration: 180 });
  const follow = () => {
    col.setPosition(p.x, p.y);
    ring.setPosition(p.x, p.y + 18);
  };
  follow();
  const sparks = g.time.addEvent({
    delay: 90,
    repeat: Math.max(1, Math.round((dur * 1000) / 90)),
    callback: () => {
      follow();
      const s = g.add
        .circle(
          p.x + Phaser.Math.Between(-30, 30),
          p.y + Phaser.Math.Between(-10, 20),
          Phaser.Math.Between(3, 6),
          Phaser.Math.RND.pick([color, 0xffffff]),
        )
        .setDepth(11600)
        .setBlendMode(Phaser.BlendModes.ADD);
      g.tweens.add({ targets: s, y: s.y - Phaser.Math.Between(60, 110), alpha: 0, duration: 650, onComplete: () => s.destroy() });
    },
  });
  g.time.delayedCall(dur * 1000, () => {
    sparks.remove();
    g.tweens.add({ targets: [col, ring], alpha: 0, duration: 300, onComplete: () => (col.destroy(), ring.destroy()) });
  });
  g.events.on('update', follow);
  g.time.delayedCall(dur * 1000 + 320, () => g.events.off('update', follow));
}

/** 速度线（冲刺方向） */
function speedLines(g: GameScene, x: number, y: number, a: number, color: number): void {
  for (let i = 0; i < 9; i++) {
    const off = Phaser.Math.Between(-40, 40);
    const len = Phaser.Math.Between(80, 160);
    const lx = x - Math.cos(a) * Phaser.Math.Between(20, 90) - Math.sin(a) * off;
    const ly = y - Math.sin(a) * Phaser.Math.Between(20, 90) + Math.cos(a) * off;
    const ln = g.add.graphics().setDepth(10500).setBlendMode(Phaser.BlendModes.ADD);
    ln.lineStyle(4, i % 3 ? color : 0xffffff, 0.8).lineBetween(0, 0, -Math.cos(a) * len, -Math.sin(a) * len);
    ln.setPosition(lx, ly);
    g.tweens.add({
      targets: ln,
      alpha: 0,
      x: lx - Math.cos(a) * 60,
      y: ly - Math.sin(a) * 60,
      duration: 380,
      onComplete: () => ln.destroy(),
    });
  }
}

/** 召唤法阵 */
function summonCircle(g: GameScene, x: number, y: number, color: number): void {
  const gr = g.add.graphics().setDepth(8).setPosition(x, y).setBlendMode(Phaser.BlendModes.ADD);
  gr.lineStyle(4, color, 0.9).strokeCircle(0, 0, 70);
  gr.lineStyle(2, 0xffffff, 0.7).strokeCircle(0, 0, 56);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    gr.lineBetween(Math.cos(a) * 56, Math.sin(a) * 56, Math.cos(a + 2.1) * 56, Math.sin(a + 2.1) * 56);
  }
  gr.setScale(1, 0.45).setAlpha(0);
  g.tweens.add({ targets: gr, alpha: 1, duration: 150 });
  g.tweens.add({ targets: gr, angle: 180, duration: 1000 });
  g.tweens.add({ targets: gr, alpha: 0, delay: 750, duration: 300, onComplete: () => gr.destroy() });
}

/** 全屏雷电 */
function screenBolts(g: GameScene, color: number): void {
  const cam = g.cameras.main;
  for (let i = 0; i < 6; i++) {
    g.time.delayedCall(i * 70, () => {
      const x = cam.worldView.x + Phaser.Math.Between(60, cam.worldView.width - 60);
      const pts = [{ x: x + Phaser.Math.Between(-80, 80), y: cam.worldView.y - 20 }];
      for (let k = 1; k <= 6; k++) pts.push({ x: x + Phaser.Math.Between(-60, 60), y: cam.worldView.y + (cam.worldView.height * k) / 6 });
      g.fx.bolt(pts, color);
    });
  }
}

/** 技能释放总入口：通用表现 + 形态专属表现 */
export function castFx(g: GameScene, sk: SkillDef, dur = 0, dashAngle = 0): void {
  const p = g.player;
  banner(g, p.x, p.y, sk.name, sk.color);
  rays(g, p.x, p.y, sk.color);
  // 镜头冲击：轻微推近再回弹 + 技能色闪屏
  const cam = g.cameras.main;
  g.tweens.add({ targets: cam, zoom: cam.zoom * 1.05, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
  cam.flash(110, (sk.color >> 16) & 255, (sk.color >> 8) & 255, sk.color & 255, false);
  switch (sk.type) {
    case 'nova':
    case 'heal':
    case 'curse':
    case 'field':
      shockwave(g, p.x, p.y, sk.radius ?? 180, sk.color);
      shockwave(g, p.x, p.y, (sk.radius ?? 180) * 0.7, 0xffffff, 120, 8);
      break;
    case 'buff':
    case 'ghost':
      pillar(g, sk.color, Math.max(1.2, dur));
      break;
    case 'dash':
      speedLines(g, p.x, p.y, dashAngle, sk.color);
      break;
    case 'screen':
      screenBolts(g, sk.color);
      break;
    case 'clone':
      summonCircle(g, p.x, p.y, sk.color);
      break;
    default:
      // ring / barrage / missile / strikes：枪口闪光
      g.fx.burst(p.x, p.y, sk.color, 18);
      shockwave(g, p.x, p.y, 90, sk.color, 0, 8);
  }
}

/** 吸取回复：从命中的敌人向玩家拉出生命线 */
export function drainLines(g: GameScene, from: { x: number; y: number }[], color = 0x52ff8a): void {
  const p = g.player;
  for (const e of from.slice(0, 10)) {
    const ln = g.add.graphics().setDepth(10500).setBlendMode(Phaser.BlendModes.ADD);
    ln.lineStyle(4, color, 0.8).lineBetween(e.x, e.y, p.x, p.y);
    g.tweens.add({ targets: ln, alpha: 0, duration: 420, onComplete: () => ln.destroy() });
    const orb = g.add.circle(e.x, e.y, 6, color).setDepth(10600).setBlendMode(Phaser.BlendModes.ADD);
    g.tweens.add({ targets: orb, x: p.x, y: p.y, duration: 380, ease: 'Quad.easeIn', onComplete: () => orb.destroy() });
  }
}
