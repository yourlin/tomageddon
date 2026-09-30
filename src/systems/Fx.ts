// 视觉特效：伤害数字、粒子、刀光、闪电、预警圈
import Phaser from 'phaser';
import { FONT } from './Textures';
import { save } from './Save';

export class Fx {
  private texts: Phaser.GameObjects.Text[] = [];
  private textIdx = 0;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private lines: Phaser.GameObjects.Graphics;
  private lightning: { pts: { x: number; y: number }[]; t: number; color: number }[] = [];

  constructor(private scene: Phaser.Scene) {
    for (let i = 0; i < 48; i++) {
      const t = scene.add
        .text(0, 0, '', {
          fontFamily: FONT,
          fontSize: '22px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(20000)
        .setVisible(false);
      this.texts.push(t);
    }
    this.emitter = scene.add
      .particles(0, 0, 'fx_spark', {
        speed: { min: 80, max: 260 },
        lifespan: { min: 200, max: 450 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 1, end: 0 },
        emitting: false,
        maxParticles: 400,
      })
      .setDepth(15000);
    this.lines = scene.add.graphics().setDepth(15001);
  }

  number(x: number, y: number, v: number, color = '#ffffff', crit = false): void {
    if (!save.settings.showDmg) return;
    const t = this.texts[this.textIdx];
    this.textIdx = (this.textIdx + 1) % this.texts.length;
    this.scene.tweens.killTweensOf(t);
    t.setText(String(Math.round(v)))
      .setPosition(x + Phaser.Math.Between(-10, 10), y - 20)
      .setColor(crit ? '#ffd23f' : color)
      .setFontSize(crit ? 30 : 22)
      .setVisible(true)
      .setAlpha(1)
      .setScale(crit ? 1.3 : 1);
    this.scene.tweens.add({
      targets: t,
      y: t.y - 36,
      alpha: 0,
      scale: 1,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => t.setVisible(false),
    });
  }

  label(x: number, y: number, s: string, color = '#ffffff'): void {
    const t = this.texts[this.textIdx];
    this.textIdx = (this.textIdx + 1) % this.texts.length;
    this.scene.tweens.killTweensOf(t);
    t.setText(s)
      .setPosition(x, y - 30)
      .setColor(color)
      .setFontSize(22)
      .setVisible(true)
      .setAlpha(1)
      .setScale(1);
    this.scene.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 800, onComplete: () => t.setVisible(false) });
  }

  burst(x: number, y: number, color: number, n = 8): void {
    this.emitter.setParticleTint(color);
    this.emitter.explode(n, x, y);
  }

  ring(x: number, y: number, radius: number, color: number, dur = 300, fill = false): void {
    const img = this.scene.add
      .image(x, y, fill ? 'fx_circle' : 'fx_ring')
      .setTint(color)
      .setDepth(14000)
      .setAlpha(fill ? 0.45 : 0.9)
      .setScale(0.2);
    this.scene.tweens.add({
      targets: img,
      scale: (radius * 2) / 128,
      alpha: 0,
      duration: dur,
      ease: 'Cubic.easeOut',
      onComplete: () => img.destroy(),
    });
  }

  slash(x: number, y: number, angle: number, radius: number, color = 0xffffff, stretch = 1): void {
    const img = this.scene.add
      .image(x, y, 'fx_slash')
      .setRotation(angle)
      .setTint(color)
      .setDepth(14000)
      .setScale(((radius * 2) / 128) * stretch, (radius * 2) / 128)
      .setAlpha(0.9);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: 180, onComplete: () => img.destroy() });
  }

  bolt(pts: { x: number; y: number }[], color: number): void {
    this.lightning.push({ pts, t: 0.18, color });
  }

  /** 预警圈：windup 秒后回调 */
  telegraphCircle(x: number, y: number, radius: number, windup: number, color = 0xff3b30, cb?: () => void): void {
    const outer = this.scene.add
      .image(x, y, 'fx_ring')
      .setTint(color)
      .setAlpha(0.8)
      .setDepth(3)
      .setScale((radius * 2) / 128);
    const inner = this.scene.add.image(x, y, 'fx_circle').setTint(color).setAlpha(0.25).setDepth(3).setScale(0);
    this.scene.tweens.add({
      targets: inner,
      scale: (radius * 2) / 128,
      duration: windup * 1000,
      onComplete: () => {
        outer.destroy();
        inner.destroy();
        cb?.();
      },
    });
  }

  telegraphLine(x: number, y: number, dx: number, dy: number, len: number, width: number, dur: number): void {
    const g = this.scene.add.graphics().setDepth(3);
    g.fillStyle(0xff3b30, 0.25);
    const ang = Math.atan2(dy, dx);
    g.setPosition(x, y).setRotation(ang);
    g.fillRect(0, -width, len, width * 2);
    this.scene.tweens.add({ targets: g, alpha: 0.05, duration: dur * 1000, onComplete: () => g.destroy() });
  }

  private splats: Phaser.GameObjects.Image[] = [];
  private splatIdx = 0;

  /** 地面汁液残留 */
  splat(x: number, y: number, color: number, size: number): void {
    let img = this.splats[this.splatIdx];
    if (!img) {
      img = this.scene.add.image(0, 0, 'fx_splat0').setDepth(0.5);
      this.splats.push(img);
    }
    this.splatIdx = (this.splatIdx + 1) % 90;
    this.scene.tweens.killTweensOf(img);
    img
      .setTexture(`fx_splat${Math.floor(Math.random() * 3)}`)
      .setPosition(x, y)
      .setTint(color)
      .setAlpha(0.75)
      .setRotation(Math.random() * 6)
      .setScale(((size * 2.6) / 128) * 0.4)
      .setVisible(true);
    this.scene.tweens.add({ targets: img, scale: (size * 2.6) / 128, duration: 140, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: img, alpha: 0, delay: 5000, duration: 2500, onComplete: () => img.setVisible(false) });
  }

  hit(x: number, y: number, rot: number, crit: boolean): void {
    const img = this.scene.add
      .image(x, y, 'fx_hit')
      .setDepth(15000)
      .setRotation(rot)
      .setScale(crit ? 0.9 : 0.55)
      .setTint(crit ? 0xffd23f : 0xffffff);
    this.scene.tweens.add({ targets: img, scale: img.scale * 1.5, alpha: 0, duration: 140, onComplete: () => img.destroy() });
  }

  explosion(x: number, y: number, r: number, color: number): void {
    const flash = this.scene.add
      .image(x, y, 'fx_glow')
      .setDepth(14001)
      .setTint(0xfff3b0)
      .setScale((r * 2.2) / 128)
      .setAlpha(0.9);
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: flash.scale * 1.2, duration: 180, onComplete: () => flash.destroy() });
    this.ring(x, y, r, color, 320, true);
    this.ring(x, y, r * 1.1, 0xffffff, 260);
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2,
        d = Math.random() * r * 0.6;
      const sm = this.scene.add
        .image(x + Math.cos(a) * d, y + Math.sin(a) * d, 'fx_smoke')
        .setDepth(14000)
        .setAlpha(0.7)
        .setScale(0.3)
        .setTint(0x8d8d8d);
      this.scene.tweens.add({
        targets: sm,
        y: sm.y - 30,
        scale: 0.8 + Math.random() * 0.4,
        alpha: 0,
        duration: 600 + Math.random() * 300,
        onComplete: () => sm.destroy(),
      });
    }
    this.burst(x, y, color, 14);
  }

  thrust(x: number, y: number, a: number, range: number): void {
    const img = this.scene.add.image(x, y, 'fx_streak').setOrigin(0, 0.5).setRotation(a).setDepth(14000).setAlpha(0.9);
    img.setScale(range / 128, 0.7);
    this.scene.tweens.add({ targets: img, alpha: 0, scaleY: 0.1, duration: 160, onComplete: () => img.destroy() });
  }

  beam(x: number, y: number, a: number, len: number, w: number, color: number): void {
    const img = this.scene.add.image(x, y, 'fx_beam').setOrigin(0, 0.5).setRotation(a).setDepth(14500).setTint(color);
    img.setScale(len / 128, (w * 2.4) / 64);
    const core = this.scene.add.image(x, y, 'fx_beam').setOrigin(0, 0.5).setRotation(a).setDepth(14501);
    core.setScale(len / 128, (w * 0.9) / 64);
    this.scene.tweens.add({
      targets: [img, core],
      alpha: 0,
      scaleY: 0.05,
      duration: 380,
      ease: 'Quad.easeIn',
      onComplete: () => {
        img.destroy();
        core.destroy();
      },
    });
  }

  nova(x: number, y: number, r: number, color: number): void {
    this.ring(x, y, r, color, 450, true);
    this.ring(x, y, r, 0xffffff, 450);
    const g = this.scene.add.image(x, y, 'fx_glow').setDepth(13999).setTint(color).setScale(0.2).setAlpha(0.8);
    this.scene.tweens.add({ targets: g, scale: (r * 2.4) / 128, alpha: 0, duration: 500, onComplete: () => g.destroy() });
    this.burst(x, y, color, 20);
  }

  afterimage(target: { x: number; y: number }, color: number): void {
    const img = this.scene.add
      .image(target.x, target.y, 'fx_glow')
      .setDepth(target.y - 1)
      .setTint(color)
      .setScale(0.5)
      .setAlpha(0.6);
    this.scene.tweens.add({ targets: img, alpha: 0, scale: 0.2, duration: 250, onComplete: () => img.destroy() });
  }

  update(dt: number): void {
    const g = this.lines;
    g.clear();
    for (const l of this.lightning) {
      l.t -= dt;
      if (l.t <= 0) continue;
      g.lineStyle(5, l.color, Math.min(1, l.t * 8));
      g.beginPath();
      g.moveTo(l.pts[0].x, l.pts[0].y);
      for (let i = 1; i < l.pts.length; i++) {
        const a = l.pts[i - 1],
          b = l.pts[i];
        const mx = (a.x + b.x) / 2 + Phaser.Math.Between(-14, 14),
          my = (a.y + b.y) / 2 + Phaser.Math.Between(-14, 14);
        g.lineTo(mx, my);
        g.lineTo(b.x, b.y);
      }
      g.strokePath();
      g.lineStyle(2, 0xffffff, Math.min(1, l.t * 8));
      g.beginPath();
      g.moveTo(l.pts[0].x, l.pts[0].y);
      for (let i = 1; i < l.pts.length; i++) g.lineTo(l.pts[i].x, l.pts[i].y);
      g.strokePath();
    }
    this.lightning = this.lightning.filter((l) => l.t > 0);
  }
}
