// 光环武器的动态效果：呼吸的底层光晕 + 反向旋转的双层环 + 环绕粒子 + 每次结算时的冲击波
import Phaser from 'phaser';
import { EXTRA_AURA_LOOK } from '../data/gearExtra';

export type AuraStyle = 'petal' | 'wind' | 'ember' | 'blood' | 'spark';

/** 各光环武器的颜色与粒子风格 */
export const AURA_LOOK: Record<string, { color: number; style: AuraStyle }> = {
  garlic_aura: { color: 0xc8f7c5, style: 'petal' },
  whisk_spin: { color: 0xf1faee, style: 'wind' },
  curry_aura: { color: 0xffb347, style: 'ember' },
  vampire_garlic: { color: 0xd00000, style: 'blood' },
};

/** 光环用的程序化纹理（首次使用时生成） */
function ensureTextures(scene: Phaser.Scene): void {
  const tex = scene.textures;
  if (!tex.exists('fx_aura_glow')) {
    const c = tex.createCanvas('fx_aura_glow', 128, 128)!;
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(0.65, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.92, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    c.refresh();
  }
  if (!tex.exists('fx_aura_dash')) {
    const c = tex.createCanvas('fx_aura_dash', 128, 128)!;
    const ctx = c.getContext();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    // 12 段虚线弧 + 每段之间的菱形符文
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(64, 64, 52, a0 + 0.08, a0 + 0.38);
      ctx.stroke();
      const a = a0 + 0.46,
        x = 64 + Math.cos(a) * 52,
        y = 64 + Math.sin(a) * 52;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x + 3, y);
      ctx.lineTo(x, y + 4);
      ctx.lineTo(x - 3, y);
      ctx.closePath();
      ctx.fill();
    }
    c.refresh();
  }
  if (!tex.exists('fx_aura_mote')) {
    const c = tex.createCanvas('fx_aura_mote', 16, 16)!;
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
  if (!tex.exists('fx_aura_petal')) {
    const c = tex.createCanvas('fx_aura_petal', 16, 10)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(8, 5, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    c.refresh();
  }
  if (!tex.exists('fx_aura_streak')) {
    const c = tex.createCanvas('fx_aura_streak', 32, 6)!;
    const ctx = c.getContext();
    const g = ctx.createLinearGradient(0, 0, 32, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 1, 32, 4);
    c.refresh();
  }
}

interface Mote {
  img: Phaser.GameObjects.Image;
  a: number;
  r: number;
  sp: number;
  ph: number;
}

export class AuraFx {
  private glow: Phaser.GameObjects.Image;
  private ring: Phaser.GameObjects.Image;
  private dash: Phaser.GameObjects.Image;
  private motes: Mote[] = [];
  private t = 0;
  private R = 100;
  private x = 0;
  private y = 0;

  constructor(
    private scene: Phaser.Scene,
    private color: number,
    private style: AuraStyle,
  ) {
    ensureTextures(scene);
    const add = (key: string, alpha: number) =>
      scene.add.image(0, 0, key).setTint(color).setAlpha(alpha).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    this.glow = add('fx_aura_glow', 0.3);
    this.ring = add('fx_ring', 0.28);
    this.dash = add('fx_aura_dash', 0.24);
    const n = style === 'wind' ? 10 : style === 'ember' ? 12 : 9;
    const key = style === 'petal' || style === 'blood' ? 'fx_aura_petal' : style === 'wind' ? 'fx_aura_streak' : 'fx_aura_mote';
    for (let i = 0; i < n; i++) {
      const img = scene.add
        .image(0, 0, key)
        .setTint(i % 3 === 0 ? 0xffffff : color)
        .setDepth(2)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.motes.push({
        img,
        a: (i / n) * Math.PI * 2,
        r: Phaser.Math.FloatBetween(0.55, 0.95),
        sp: Phaser.Math.FloatBetween(0.8, 1.6),
        ph: Math.random() * 6,
      });
    }
  }

  update(x: number, y: number, R: number, dt: number): void {
    this.t += dt;
    this.x = x;
    this.y = y;
    this.R = R;
    const t = this.t;
    const breathe = 1 + Math.sin(t * 2.4) * 0.03;
    const k = (R * 2) / 128;
    this.glow
      .setPosition(x, y)
      .setScale(k * breathe)
      .setAlpha(0.22 + Math.sin(t * 2.4) * 0.06);
    this.ring
      .setPosition(x, y)
      .setScale(k)
      .setRotation(this.ring.rotation + dt * 0.6);
    this.dash
      .setPosition(x, y)
      .setScale(k * 0.86)
      .setRotation(this.dash.rotation - dt * 1.1);
    const dir = this.style === 'wind' ? 2.6 : 1;
    for (const m of this.motes) {
      m.a += dt * m.sp * dir * (0.9 + Math.sin(t * 1.3 + m.ph) * 0.3);
      let rr = m.r * R;
      let mx = x + Math.cos(m.a) * rr,
        my = y + Math.sin(m.a) * rr;
      if (this.style === 'ember') {
        // 火星：一边绕圈一边往上飘，到顶后回到底部
        m.ph += dt * 0.8;
        const rise = (m.ph % 1) * R * 0.5;
        rr = m.r * R * (1 - (m.ph % 1) * 0.3);
        mx = x + Math.cos(m.a) * rr;
        my = y + Math.sin(m.a) * rr - rise;
        m.img.setAlpha(1 - (m.ph % 1)).setScale(0.6 + (1 - (m.ph % 1)) * 0.5);
      } else {
        m.img.setAlpha(0.45 + Math.sin(t * 4 + m.ph) * 0.3).setScale(this.style === 'wind' ? 1.1 : 0.8 + Math.sin(t * 3 + m.ph) * 0.2);
      }
      m.img.setPosition(mx, my).setRotation(m.a + Math.PI / 2 + (this.style === 'wind' ? Math.PI / 2 : 0));
    }
  }

  /** 每次结算伤害：冲击波 + 环闪亮；hitPoints 为命中的敌人位置（最多取 6 个冒火花） */
  pulse(hitPoints: { x: number; y: number }[]): void {
    const s = this.scene;
    const w = s.add
      .image(this.x, this.y, 'fx_ring')
      .setTint(this.color)
      .setDepth(2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(((this.R * 2) / 128) * 0.3)
      .setAlpha(0.55);
    s.tweens.add({ targets: w, scale: (this.R * 2) / 128, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => w.destroy() });
    this.ring.setAlpha(0.6);
    s.tweens.add({ targets: this.ring, alpha: 0.28, duration: 300 });
    for (const p of hitPoints.slice(0, 6)) {
      const sp = s.add.image(p.x, p.y, 'fx_aura_mote').setTint(this.color).setDepth(3).setBlendMode(Phaser.BlendModes.ADD).setScale(1.4);
      s.tweens.add({ targets: sp, scale: 0.2, alpha: 0, y: p.y - 14, duration: 260, onComplete: () => sp.destroy() });
    }
  }

  destroy(): void {
    this.glow.destroy();
    this.ring.destroy();
    this.dash.destroy();
    for (const m of this.motes) m.img.destroy();
  }
}

// 1.4.0 G5：新光环武器的外观
Object.assign(AURA_LOOK, EXTRA_AURA_LOOK);
