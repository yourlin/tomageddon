// 光环武器的动态效果。每把光环武器一套主题：
//   底层若隐若现的光晕/纹理层（多频正弦叠加的闪烁 + 旋转）
//   + 常驻环绕物（刀片、蝙蝠、盐晶……）
//   + 按速率持续生成的粒子（雾、火星、蒸汽、血滴、碎屑……，带淡入淡出）
//   + 每次结算时的冲击波与命中点特效（吸血回流、盐晶迸裂等）
// 所有纹理都在首次使用时程序化生成；粒子图片走对象池，不会每帧创建/销毁。
import Phaser from 'phaser';
import { EXTRA_AURA_LOOK } from '../data/gearExtra';

/** 新主题（按武器设计）+ 旧的通用风格（保留兼容，映射到相近主题） */
export type AuraStyle =
  'garlic' | 'vampire' | 'whisk' | 'curry' | 'blender' | 'tornado' | 'salt' | 'petal' | 'wind' | 'ember' | 'blood' | 'spark';

/** 各光环武器的颜色与主题 */
export const AURA_LOOK: Record<string, { color: number; style: AuraStyle }> = {
  garlic_aura: { color: 0xc8f7c5, style: 'garlic' },
  whisk_spin: { color: 0xf1faee, style: 'whisk' },
  curry_aura: { color: 0xffb347, style: 'curry' },
  vampire_garlic: { color: 0xd00000, style: 'vampire' },
};

const LEGACY: Partial<Record<AuraStyle, AuraStyle>> = {
  petal: 'garlic',
  wind: 'whisk',
  ember: 'curry',
  blood: 'vampire',
  spark: 'salt',
};

// ---------------------------------------------------------------- 纹理

type Ctx = CanvasRenderingContext2D;

function paint(scene: Phaser.Scene, key: string, w: number, h: number, fn: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const c = scene.textures.createCanvas(key, w, h)!;
  fn(c.getContext());
  c.refresh();
}

function radial(ctx: Ctx, x: number, y: number, r: number, stops: [number, string][]): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ensureTextures(scene: Phaser.Scene): void {
  // 底层光晕：中心近乎透明，边缘最亮
  paint(scene, 'fx_aura_glow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(0.65, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.92, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  // 虚线符文环
  paint(scene, 'fx_aura_dash', 128, 128, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(64, 64, 52, a0 + 0.08, a0 + 0.38);
      ctx.stroke();
      const a = a0 + 0.46,
        x = 64 + Math.cos(a) * 52,
        y = 64 + Math.sin(a) * 52;
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x + 3, y);
      ctx.lineTo(x, y + 4);
      ctx.lineTo(x - 3, y);
      ctx.closePath();
      ctx.fill();
    }
  });
  // 波浪环（大蒜的气味波、咖喱的热浪）
  paint(scene, 'fx_aura_wave', 128, 128, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      const r = 54 + Math.sin(a * 9) * 3.5 + Math.sin(a * 4 + 1) * 1.5;
      const x = 64 + Math.cos(a) * r,
        y = 64 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  // 打蛋器钢丝：4 个穿过中心的细长椭圆
  paint(scene, 'fx_aura_wire', 128, 128, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(64, 64, 58, 16, (i / 4) * Math.PI, 0, Math.PI * 2);
      ctx.stroke();
    }
    radial(ctx, 64, 64, 10, [
      [0, 'rgba(255,255,255,0.9)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
  });
  // 刀光残影：三段由亮到暗的弧
  paint(scene, 'fx_aura_arc', 128, 128, (ctx) => {
    for (let k = 0; k < 3; k++) {
      const a0 = (k / 3) * Math.PI * 2;
      for (let i = 0; i < 24; i++) {
        const u = i / 24;
        ctx.strokeStyle = `rgba(255,255,255,${(0.85 * (1 - u)).toFixed(3)})`;
        ctx.lineWidth = 5 - u * 3;
        ctx.beginPath();
        ctx.arc(64, 64, 50, a0 - u * 1.4 - 0.07, a0 - u * 1.4);
        ctx.stroke();
      }
    }
  });
  // 龙卷旋臂：三条对数螺线
  paint(scene, 'fx_aura_spiral', 128, 128, (ctx) => {
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const a0 = (k / 3) * Math.PI * 2;
      let px = 64,
        py = 64;
      for (let i = 1; i <= 60; i++) {
        const u = i / 60;
        const r = 6 + u * 54;
        const a = a0 + u * Math.PI * 1.6;
        const x = 64 + Math.cos(a) * r,
          y = 64 + Math.sin(a) * r;
        ctx.strokeStyle = `rgba(255,255,255,${(0.2 + 0.7 * Math.sin(u * Math.PI)).toFixed(3)})`;
        ctx.lineWidth = 1 + 3.5 * u * (1 - u) * 4 * 0.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        px = x;
        py = y;
      }
    }
  });
  // 六边形结界：外沿一圈六边形蜂窝
  paint(scene, 'fx_aura_hex', 128, 128, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    const hex = (cx: number, cy: number, s: number, rot: number) => {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = rot + (i / 6) * Math.PI * 2;
        const x = cx + Math.cos(a) * s,
          y = cy + Math.sin(a) * s;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      hex(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54, 9, a);
      if (i % 2 === 0) hex(64 + Math.cos(a + Math.PI / n) * 42, 64 + Math.sin(a + Math.PI / n) * 42, 6, a);
    }
  });
  // 通用光点
  paint(scene, 'fx_aura_mote', 16, 16, (ctx) =>
    radial(ctx, 8, 8, 8, [
      [0, 'rgba(255,255,255,1)'],
      [0.4, 'rgba(255,255,255,0.7)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
  );
  paint(scene, 'fx_aura_petal', 16, 10, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(8, 5, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // 风痕：纹理朝 +x，头亮尾暗
  paint(scene, 'fx_aura_streak', 32, 6, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 32, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 1, 32, 4);
  });
  // 雾团：几个错位的柔光斑叠成不规则的一团
  paint(scene, 'fx_aura_mist', 64, 64, (ctx) => {
    const blobs: [number, number, number][] = [
      [32, 32, 22],
      [22, 28, 15],
      [42, 26, 14],
      [38, 40, 16],
      [24, 40, 12],
    ];
    for (const [x, y, r] of blobs)
      radial(ctx, x, y, r, [
        [0, 'rgba(255,255,255,0.32)'],
        [1, 'rgba(255,255,255,0)'],
      ]);
  });
  // 蒜瓣：弯月形，带一道高光
  paint(scene, 'fx_aura_clove', 14, 18, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(7, 1);
    ctx.quadraticCurveTo(14, 9, 9, 17);
    ctx.quadraticCurveTo(3, 15, 3, 9);
    ctx.quadraticCurveTo(3, 4, 7, 1);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(6, 4);
    ctx.quadraticCurveTo(5, 10, 7, 15);
    ctx.stroke();
  });
  // 蝙蝠剪影（朝 +x 飞）
  paint(scene, 'fx_aura_bat', 16, 28, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.beginPath();
    ctx.moveTo(12, 14);
    ctx.lineTo(8, 1);
    ctx.lineTo(7, 6);
    ctx.lineTo(4, 4);
    ctx.lineTo(5, 9);
    ctx.lineTo(1, 9);
    ctx.lineTo(5, 14);
    ctx.lineTo(1, 19);
    ctx.lineTo(5, 19);
    ctx.lineTo(4, 24);
    ctx.lineTo(7, 22);
    ctx.lineTo(8, 27);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(11, 14, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // 血滴（尖端朝 +x）
  paint(scene, 'fx_aura_drop', 14, 8, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.beginPath();
    ctx.moveTo(14, 4);
    ctx.quadraticCurveTo(6, 0, 3, 1.5);
    ctx.arc(4, 4, 3, -Math.PI / 2, Math.PI / 2, true);
    ctx.quadraticCurveTo(6, 8, 14, 4);
    ctx.fill();
  });
  // 泡沫
  paint(scene, 'fx_aura_bubble', 14, 14, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(7, 7, 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(5, 5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  });
  // 蒸汽：一缕 S 形的柔光
  paint(scene, 'fx_aura_steam', 18, 40, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 5;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(9, 38);
    ctx.bezierCurveTo(1, 28, 17, 18, 9, 8);
    ctx.quadraticCurveTo(6, 4, 9, 2);
    ctx.stroke();
  });
  // 破壁机刀片：弯刃（沿 +x 方向）
  paint(scene, 'fx_aura_blade', 44, 14, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.quadraticCurveTo(20, 0, 44, 3);
    ctx.quadraticCurveTo(24, 7, 6, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(0, 6, 8, 5);
  });
  // 盐晶：立体菱形
  paint(scene, 'fx_aura_shard', 12, 18, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(12, 7);
    ctx.lineTo(6, 18);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(12, 7);
    ctx.lineTo(6, 7);
    ctx.closePath();
    ctx.fill();
  });
  // 四芒星闪光
  paint(scene, 'fx_aura_star', 24, 24, (ctx) => {
    radial(ctx, 12, 12, 6, [
      [0, 'rgba(255,255,255,1)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(13.2, 10.8);
    ctx.lineTo(24, 12);
    ctx.lineTo(13.2, 13.2);
    ctx.lineTo(12, 24);
    ctx.lineTo(10.8, 13.2);
    ctx.lineTo(0, 12);
    ctx.lineTo(10.8, 10.8);
    ctx.closePath();
    ctx.fill();
  });
}

// ---------------------------------------------------------------- 主题描述

const TAU = Math.PI * 2;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: T[]): T => arr[(Math.random() * arr.length) | 0];
/** 多频正弦叠加的伪噪声，取值约 -1..1：用来做"若隐若现" */
const noise = (t: number, seed: number) =>
  (Math.sin(t + seed) + Math.sin(t * 1.73 + seed * 2.1) * 0.6 + Math.sin(t * 2.91 + seed * 3.7) * 0.4) / 2;
/** 心跳：每 1.1 秒"咚-咚"两下 */
const heartbeat = (t: number) => {
  const u = t % 1.1;
  return Math.exp(-((u - 0.05) ** 2) / 0.003) + 0.6 * Math.exp(-((u - 0.28) ** 2) / 0.003);
};

interface Layer {
  key: string;
  /** 直径相对光环直径的比例 */
  size: number;
  alpha: number;
  /** 闪烁幅度 0..1 与频率 */
  wob?: number;
  wf?: number;
  /** 旋转速度 rad/s */
  spin?: number;
  tint?: number;
  normal?: boolean;
  /** 随心跳脉动 */
  beat?: boolean;
  /** 尺寸呼吸幅度 */
  breathe?: number;
}

/** 粒子初始参数。位置用极坐标（相对中心，半径为光环半径 R 的比例），尺寸按 R 缩放 */
interface PInit {
  key: string;
  a: number;
  r: number;
  /** 角速度 rad/s、径向速度 R/s、竖直漂移 R/s（负数向上） */
  va?: number;
  vr?: number;
  vy?: number;
  /** 寿命秒；<=0 为常驻环绕物 */
  life: number;
  alpha: number;
  scale: number;
  scaleEnd?: number;
  /** 'pop'：尺寸先放大后缩小（闪光） */
  pop?: boolean;
  /** 朝向：沿切线 / 指向圆心 / 自转 / 固定 */
  rot?: 'tangent' | 'in' | 'spin' | 'fixed';
  spin?: number;
  tint: number;
  normal?: boolean;
  /** 闪烁幅度 0..1 */
  flicker?: number;
  /** 扑翼频率（蝙蝠） */
  flap?: number;
}

interface Emitter {
  /** 每秒生成数（R=100 时；随半径缩放） */
  rate: number;
  max: number;
  spawn: (c: number) => PInit;
}

interface Theme {
  layers: Layer[];
  orbit?: { n: number; init: (i: number, n: number, c: number) => PInit };
  emitters: Emitter[];
  /** 冲击波纹理与方向（向内=吸力） */
  wave: string;
  inward?: boolean;
  /** 命中点特效 */
  hit: (fx: AuraFx, p: { x: number; y: number }, c: number) => void;
}

const THEMES: Record<'garlic' | 'vampire' | 'whisk' | 'curry' | 'blender' | 'tornado' | 'salt', Theme> = {
  // 大蒜光环：淡绿色的蒜味雾气缓缓翻涌，蒜瓣在雾里漂浮打转，气味波一圈圈若隐若现
  garlic: {
    layers: [
      { key: 'fx_aura_glow', size: 1, alpha: 0.2, wob: 0.35, wf: 0.9, breathe: 0.03 },
      { key: 'fx_aura_wave', size: 0.98, alpha: 0.22, wob: 0.7, wf: 1.3, spin: 0.15 },
      { key: 'fx_aura_wave', size: 0.68, alpha: 0.14, wob: 0.8, wf: 1.7, spin: -0.25 },
    ],
    emitters: [
      {
        rate: 6,
        max: 14,
        spawn: (c) => ({
          key: 'fx_aura_mist',
          a: rnd(0, TAU),
          r: rnd(0.25, 0.9),
          va: rnd(-0.15, 0.15),
          vr: 0.05,
          life: rnd(1.8, 3),
          alpha: 0.5,
          scale: rnd(0.7, 1.1),
          scaleEnd: 1.4,
          rot: 'spin',
          spin: rnd(-0.4, 0.4),
          tint: c,
        }),
      },
      {
        rate: 2.5,
        max: 8,
        spawn: (c) => ({
          key: 'fx_aura_clove',
          a: rnd(0, TAU),
          r: rnd(0.3, 0.95),
          va: rnd(0.3, 0.6),
          vy: -0.12,
          life: rnd(2, 3),
          alpha: 0.75,
          scale: 0.9,
          scaleEnd: 0.6,
          rot: 'spin',
          spin: rnd(-2, 2),
          tint: pick([0xffffff, 0xf6fff0, c]),
        }),
      },
      {
        rate: 8,
        max: 16,
        spawn: (c) => ({
          key: 'fx_aura_mote',
          a: rnd(0, TAU),
          r: rnd(0.5, 1),
          va: 0.4,
          vy: -0.3,
          life: 1.2,
          alpha: 0.6,
          scale: 0.5,
          scaleEnd: 0.1,
          tint: c,
          flicker: 0.5,
        }),
      },
    ],
    wave: 'fx_aura_wave',
    hit: (fx, p, c) => fx.burst(p.x, p.y, 'fx_aura_mist', 1, [c], { dist: 6, dur: 420, scale: 0.6, scaleEnd: 1.2, alpha: 0.6 }),
  },
  // 吸血鬼大蒜：暗红血雾随心跳搏动，蝙蝠绕圈扑翼，血滴从外圈被吸向中心；命中时血流回流到玩家
  vampire: {
    layers: [
      { key: 'fx_aura_glow', size: 1, alpha: 0.26, wob: 0.2, wf: 0.8, beat: true, tint: 0xb00020 },
      { key: 'fx_aura_dash', size: 0.88, alpha: 0.2, wob: 0.5, wf: 1.1, spin: -0.5, tint: 0xff4d6d },
      { key: 'fx_ring', size: 1, alpha: 0.18, beat: true, spin: 0.3 },
    ],
    orbit: {
      n: 5,
      init: (i, n) => ({
        key: 'fx_aura_bat',
        a: (i / n) * TAU + rnd(-0.2, 0.2),
        r: rnd(0.62, 0.9),
        va: rnd(0.9, 1.3),
        life: 0,
        alpha: 0.85,
        scale: rnd(0.8, 1.1),
        rot: 'tangent',
        tint: 0x1a0005,
        normal: true,
        flap: rnd(11, 15),
        flicker: 0.25,
      }),
    },
    emitters: [
      {
        rate: 4,
        max: 10,
        spawn: () => ({
          key: 'fx_aura_mist',
          a: rnd(0, TAU),
          r: rnd(0.3, 0.95),
          va: rnd(-0.2, 0.2),
          life: rnd(1.6, 2.6),
          alpha: 0.35,
          scale: rnd(0.8, 1.2),
          scaleEnd: 1.5,
          rot: 'spin',
          spin: rnd(-0.3, 0.3),
          tint: 0x6a040f,
          normal: true,
        }),
      },
      {
        rate: 7,
        max: 14,
        spawn: () => ({
          key: 'fx_aura_drop',
          a: rnd(0, TAU),
          r: rnd(0.85, 1),
          va: 0.3,
          vr: -0.55,
          life: rnd(1.1, 1.5),
          alpha: 0.85,
          scale: 0.9,
          scaleEnd: 0.4,
          rot: 'in',
          tint: pick([0xff2a3d, 0xd00000, 0xff758f]),
        }),
      },
    ],
    wave: 'fx_ring',
    hit: (fx, p) => fx.siphon(p.x, p.y, 0xff2a3d),
  },
  // 旋风打蛋器：钢丝圈高速旋转，风痕沿切线甩出，奶油泡沫被搅起
  whisk: {
    layers: [
      { key: 'fx_aura_glow', size: 1, alpha: 0.14, wob: 0.3, wf: 1.2 },
      { key: 'fx_aura_wire', size: 0.95, alpha: 0.32, wob: 0.3, wf: 2, spin: 7 },
      { key: 'fx_aura_wire', size: 0.6, alpha: 0.2, wob: 0.4, wf: 2.4, spin: -5 },
    ],
    emitters: [
      {
        rate: 14,
        max: 20,
        spawn: (c) => ({
          key: 'fx_aura_streak',
          a: rnd(0, TAU),
          r: rnd(0.4, 1),
          va: rnd(3, 4.5),
          vr: -0.05,
          life: rnd(0.4, 0.7),
          alpha: 0.6,
          scale: 1,
          scaleEnd: 0.6,
          rot: 'tangent',
          tint: c,
        }),
      },
      {
        rate: 5,
        max: 12,
        spawn: () => ({
          key: 'fx_aura_bubble',
          a: rnd(0, TAU),
          r: rnd(0.2, 0.8),
          va: 2,
          vr: 0.3,
          life: rnd(0.6, 1.1),
          alpha: 0.7,
          scale: 0.6,
          scaleEnd: 1.1,
          tint: 0xffffff,
          flicker: 0.3,
        }),
      },
    ],
    wave: 'fx_aura_wire',
    hit: (fx, p) => fx.burst(p.x, p.y, 'fx_aura_bubble', 3, [0xffffff], { dist: 16, dur: 300, scale: 0.5, scaleEnd: 1.1 }),
  },
  // 咖喱光环：热浪扭动，火星与香料碎屑往上飘，蒸汽一缕缕升起
  curry: {
    layers: [
      { key: 'fx_aura_glow', size: 1, alpha: 0.26, wob: 0.45, wf: 1.6, breathe: 0.04 },
      { key: 'fx_ring', size: 1, alpha: 0.18, wob: 0.6, wf: 3 },
      { key: 'fx_aura_wave', size: 0.9, alpha: 0.16, wob: 0.5, wf: 2.2, spin: 0.4, tint: 0xff7b00 },
    ],
    emitters: [
      {
        rate: 12,
        max: 22,
        spawn: () => ({
          key: 'fx_aura_mote',
          a: rnd(0, TAU),
          r: rnd(0.2, 1),
          va: rnd(-0.3, 0.3),
          vy: -0.55,
          life: rnd(0.8, 1.4),
          alpha: 0.9,
          scale: 0.7,
          scaleEnd: 0.15,
          tint: pick([0xffd166, 0xff7b00, 0xff4800]),
          flicker: 0.4,
        }),
      },
      {
        rate: 3,
        max: 7,
        spawn: () => ({
          key: 'fx_aura_steam',
          a: rnd(0, TAU),
          r: rnd(0.2, 0.8),
          vy: -0.35,
          life: rnd(1.4, 2.2),
          alpha: 0.3,
          scale: 0.8,
          scaleEnd: 1.3,
          rot: 'fixed',
          tint: 0xfff1d6,
        }),
      },
      {
        rate: 4,
        max: 10,
        spawn: () => ({
          key: 'fx_aura_mote',
          a: rnd(0, TAU),
          r: rnd(0.3, 0.9),
          va: 0.8,
          vy: -0.1,
          life: 1.5,
          alpha: 0.9,
          scale: 0.3,
          tint: 0xa63c06,
          normal: true,
        }),
      },
    ],
    wave: 'fx_aura_wave',
    hit: (fx, p) =>
      fx.burst(p.x, p.y, 'fx_aura_mote', 4, [0xffd166, 0xff7b00], { dist: 18, rise: 14, dur: 380, scale: 0.8, scaleEnd: 0.1 }),
  },
  // 破壁机：四片弯刃高速旋转，刀光残影成圈，金属火花沿切线飞出
  blender: {
    layers: [
      { key: 'fx_aura_glow', size: 1, alpha: 0.12, wob: 0.3, wf: 1 },
      { key: 'fx_aura_arc', size: 0.95, alpha: 0.42, wob: 0.25, wf: 3, spin: 9 },
      { key: 'fx_ring', size: 1, alpha: 0.14, wob: 0.4, wf: 1.5 },
    ],
    orbit: {
      n: 4,
      init: (i, n) => ({
        key: 'fx_aura_blade',
        a: (i / n) * TAU,
        r: 0.76,
        va: 9,
        life: 0,
        alpha: 0.9,
        scale: 1,
        rot: 'tangent',
        tint: 0xf8f9fa,
        flicker: 0.25,
      }),
    },
    emitters: [
      {
        rate: 10,
        max: 16,
        spawn: () => ({
          key: 'fx_aura_streak',
          a: rnd(0, TAU),
          r: rnd(0.75, 0.95),
          va: 9,
          vr: 0.9,
          life: 0.3,
          alpha: 0.9,
          scale: 0.5,
          scaleEnd: 0.2,
          rot: 'tangent',
          tint: pick([0xffffff, 0xffe066]),
        }),
      },
    ],
    wave: 'fx_ring',
    hit: (fx, p) => fx.burst(p.x, p.y, 'fx_aura_star', 1, [0xffffff], { dist: 0, dur: 200, scale: 0.4, scaleEnd: 1.2, spin: 2 }),
  },
  // 龙卷破壁机：紫色旋臂卷成漩涡，碎屑被一圈圈吸进去，冲击波向内收缩
  tornado: {
    layers: [
      { key: 'fx_aura_glow', size: 1, alpha: 0.2, wob: 0.4, wf: 1.2 },
      { key: 'fx_aura_spiral', size: 1, alpha: 0.32, wob: 0.35, wf: 1.8, spin: 4 },
      { key: 'fx_aura_spiral', size: 0.7, alpha: 0.24, wob: 0.4, wf: 2.3, spin: 6.5, tint: 0xe0aaff },
      { key: 'fx_aura_arc', size: 0.9, alpha: 0.28, wob: 0.3, wf: 3, spin: 9 },
    ],
    orbit: {
      n: 3,
      init: (i, n) => ({
        key: 'fx_aura_blade',
        a: (i / n) * TAU,
        r: 0.52,
        va: 10,
        life: 0,
        alpha: 0.85,
        scale: 0.85,
        rot: 'tangent',
        tint: 0xf3e8ff,
        flicker: 0.3,
      }),
    },
    emitters: [
      {
        rate: 14,
        max: 26,
        spawn: (c) => ({
          key: pick(['fx_aura_mote', 'fx_aura_petal', 'fx_aura_streak']),
          a: rnd(0, TAU),
          r: rnd(0.9, 1.05),
          va: rnd(2.5, 4),
          vr: -0.9,
          life: rnd(0.7, 1.1),
          alpha: 0.8,
          scale: 0.7,
          scaleEnd: 0.3,
          rot: 'tangent',
          tint: pick([c, 0xffffff, 0x9d4edd]),
        }),
      },
      {
        rate: 8,
        max: 12,
        spawn: (c) => ({
          key: 'fx_aura_streak',
          a: rnd(0, TAU),
          r: rnd(0.85, 1),
          va: 3.5,
          life: rnd(0.4, 0.6),
          alpha: 0.55,
          scale: 1.1,
          scaleEnd: 0.7,
          rot: 'tangent',
          tint: c,
        }),
      },
    ],
    wave: 'fx_ring',
    inward: true,
    hit: (fx, p, c) =>
      fx.burst(p.x, p.y, 'fx_aura_streak', 3, [c, 0xffffff], { dist: 14, dur: 260, scale: 0.7, scaleEnd: 0.2, tangent: true }),
  },
  // 海盐结界：六边形结界忽明忽暗，盐晶环绕自转，盐粒飘落、星芒闪烁；命中时盐晶迸裂
  salt: {
    layers: [
      { key: 'fx_aura_glow', size: 1, alpha: 0.14, wob: 0.4, wf: 1, tint: 0xcaf0f8 },
      { key: 'fx_aura_hex', size: 1, alpha: 0.3, wob: 0.85, wf: 2.2, spin: 0.1 },
      { key: 'fx_aura_dash', size: 0.82, alpha: 0.16, wob: 0.5, wf: 1.4, spin: -0.4, tint: 0x90e0ef },
    ],
    orbit: {
      n: 8,
      init: () => ({
        key: 'fx_aura_shard',
        a: rnd(0, TAU),
        r: rnd(0.6, 0.9),
        va: rnd(0.6, 1),
        life: 0,
        alpha: 0.85,
        scale: rnd(0.8, 1.2),
        rot: 'spin',
        spin: rnd(1, 3),
        tint: pick([0xffffff, 0xcaf0f8, 0x90e0ef]),
        flicker: 0.5,
      }),
    },
    emitters: [
      {
        rate: 6,
        max: 10,
        spawn: () => ({
          key: 'fx_aura_star',
          a: rnd(0, TAU),
          r: rnd(0.2, 1),
          life: rnd(0.4, 0.6),
          alpha: 1,
          scale: 0.9,
          pop: true,
          rot: 'spin',
          spin: 1.5,
          tint: 0xffffff,
        }),
      },
      {
        rate: 6,
        max: 12,
        spawn: () => ({
          key: 'fx_aura_mote',
          a: rnd(0, TAU),
          r: rnd(0.4, 1),
          va: 0.5,
          vy: 0.15,
          life: 1.2,
          alpha: 0.7,
          scale: 0.3,
          tint: 0xe0fbfc,
          flicker: 0.4,
        }),
      },
    ],
    wave: 'fx_aura_hex',
    hit: (fx, p) =>
      fx.burst(p.x, p.y, 'fx_aura_shard', 3, [0xffffff, 0xcaf0f8], { dist: 20, dur: 320, scale: 0.7, scaleEnd: 0.2, spin: 6 }),
  },
};

// ---------------------------------------------------------------- 运行时

interface Particle extends Required<Omit<PInit, 'scaleEnd' | 'pop' | 'flap' | 'normal'>> {
  img: Phaser.GameObjects.Image;
  age: number;
  ph: number;
  ry: number;
  scaleEnd: number;
  pop: boolean;
  flap: number;
  /** 来源发射器下标，常驻环绕物为 -1 */
  src: number;
}

/** 粒子数量上限，防止多把光环 + 大半径 + 高倍速时堆积 */
const MAX_PARTICLES = 80;

export class AuraFx {
  private theme: Theme;
  private layers: { img: Phaser.GameObjects.Image; spec: Layer; seed: number }[] = [];
  private parts: Particle[] = [];
  private pool: Phaser.GameObjects.Image[] = [];
  private acc: number[];
  private live: number[];
  private flash = 0;
  private t = 0;
  private R = 100;
  private x = 0;
  private y = 0;

  constructor(
    private scene: Phaser.Scene,
    private color: number,
    style: AuraStyle,
  ) {
    ensureTextures(scene);
    const key = (LEGACY[style] ?? style) as keyof typeof THEMES;
    this.theme = THEMES[key] ?? THEMES.salt;
    this.layers = this.theme.layers.map((spec, i) => ({
      spec,
      seed: i * 1.7 + Math.random() * 6,
      img: scene.add
        .image(0, 0, spec.key)
        .setTint(spec.tint ?? color)
        .setAlpha(0)
        .setDepth(1)
        .setBlendMode(spec.normal ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD),
    }));
    this.acc = this.theme.emitters.map(() => Math.random());
    this.live = this.theme.emitters.map(() => 0);
    const o = this.theme.orbit;
    if (o) for (let i = 0; i < o.n; i++) this.spawn(o.init(i, o.n, color), -1);
  }

  /** 光环当前半径换算的粒子尺寸系数（夹紧，避免大半径时粒子过大） */
  private get k(): number {
    return Phaser.Math.Clamp(this.R / 100, 0.7, 1.6);
  }

  private take(key: string): Phaser.GameObjects.Image {
    const img = this.pool.pop() ?? this.scene.add.image(0, 0, key).setDepth(2);
    return img.setTexture(key).setVisible(true).setRotation(0);
  }

  private spawn(p: PInit, emitter: number): void {
    const img = this.take(p.key)
      .setTint(p.tint)
      .setBlendMode(p.normal ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD)
      .setAlpha(0);
    this.parts.push({
      img,
      key: p.key,
      a: p.a,
      r: p.r,
      va: p.va ?? 0,
      vr: p.vr ?? 0,
      vy: p.vy ?? 0,
      life: p.life,
      alpha: p.alpha,
      scale: p.scale,
      scaleEnd: p.scaleEnd ?? p.scale,
      pop: !!p.pop,
      rot: p.rot ?? 'fixed',
      spin: p.spin ?? 0,
      tint: p.tint,
      flicker: p.flicker ?? 0,
      flap: p.flap ?? 0,
      age: 0,
      ph: Math.random() * TAU,
      ry: 0,
      src: emitter,
    });
    if (emitter >= 0) this.live[emitter]++;
  }

  update(x: number, y: number, R: number, dt: number): void {
    this.t += dt;
    this.x = x;
    this.y = y;
    this.R = R;
    const t = this.t;
    this.flash = Math.max(0, this.flash - dt * 3.5);

    // 底层：闪烁、呼吸、心跳、旋转
    const beat = heartbeat(t);
    for (const L of this.layers) {
      const s = L.spec;
      let a = s.alpha * (1 + (s.wob ?? 0) * noise(t * (s.wf ?? 1), L.seed));
      if (s.beat) a *= 0.7 + beat * 0.8;
      a *= 1 + this.flash * 1.4;
      const sc = ((R * 2 * s.size) / 128) * (1 + (s.breathe ?? 0) * Math.sin(t * 2.4 + L.seed) + (s.beat ? beat * 0.03 : 0));
      L.img
        .setPosition(x, y)
        .setScale(sc)
        .setAlpha(Phaser.Math.Clamp(a, 0, 1))
        .setRotation(L.img.rotation + dt * (s.spin ?? 0));
    }

    // 生成：速率按半径缩放（周长越大粒子越多），并受每个发射器与总量上限约束
    const area = Phaser.Math.Clamp(R / 100, 0.7, 2);
    this.theme.emitters.forEach((e, i) => {
      this.acc[i] += e.rate * area * dt;
      while (this.acc[i] >= 1) {
        this.acc[i] -= 1;
        if (this.live[i] < e.max * area && this.parts.length < MAX_PARTICLES) this.spawn(e.spawn(this.color), i);
      }
    });

    // 推进粒子
    const k = this.k;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.age += dt;
      const persistent = p.life <= 0;
      const u = persistent ? 0 : p.age / p.life;
      if (!persistent && u >= 1) {
        this.kill(i);
        continue;
      }
      p.a += p.va * dt;
      p.r = Math.max(0.02, p.r + p.vr * dt);
      p.ry += p.vy * dt;
      const px = x + Math.cos(p.a) * p.r * R;
      const py = y + Math.sin(p.a) * p.r * R + p.ry * R;
      // 淡入 20%、淡出最后 40%；常驻物只闪烁
      const env = persistent ? 1 : Math.min(1, u / 0.2) * Math.min(1, (1 - u) / 0.4);
      const fl = p.flicker ? 1 - p.flicker + p.flicker * (0.5 + 0.5 * Math.sin(t * 5 + p.ph) * Math.sin(t * 2.3 + p.ph * 2)) : 1;
      const sc = (p.pop ? p.scale * Math.sin(Math.PI * u) : p.scale + (p.scaleEnd - p.scale) * u) * k;
      p.img.setPosition(px, py).setAlpha(Phaser.Math.Clamp(p.alpha * env * fl * (1 + this.flash * 0.5), 0, 1));
      if (p.flap) p.img.setScale(sc, sc * (0.35 + 0.65 * Math.abs(Math.sin(t * p.flap + p.ph))));
      else p.img.setScale(sc);
      const dir = p.va >= 0 ? 1 : -1;
      if (p.rot === 'tangent') p.img.setRotation(p.a + (Math.PI / 2) * dir);
      else if (p.rot === 'in') p.img.setRotation(p.a + Math.PI);
      else if (p.rot === 'spin') p.img.setRotation(p.img.rotation + p.spin * dt);
    }
  }

  private kill(i: number): void {
    const p = this.parts[i];
    if (p.src >= 0) this.live[p.src]--;
    p.img.setVisible(false);
    this.pool.push(p.img);
    this.parts.splice(i, 1);
  }

  /** 每次结算伤害：冲击波 + 底层闪亮 + 命中点特效（最多 6 个） */
  pulse(hitPoints: { x: number; y: number }[]): void {
    const s = this.scene;
    const full = (this.R * 2) / 128;
    const inward = !!this.theme.inward;
    const w = s.add
      .image(this.x, this.y, this.theme.wave)
      .setTint(this.color)
      .setDepth(2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(inward ? full * 1.05 : full * 0.3)
      .setAlpha(0.55)
      .setRotation(Math.random() * TAU);
    s.tweens.add({
      targets: w,
      scale: inward ? full * 0.2 : full,
      alpha: 0,
      rotation: w.rotation + (inward ? 1.2 : 0.3),
      duration: 380,
      ease: inward ? 'Cubic.easeIn' : 'Cubic.easeOut',
      onComplete: () => w.destroy(),
    });
    this.flash = 1;
    for (const p of hitPoints.slice(0, 6)) this.theme.hit(this, p, this.color);
  }

  /** 命中点小爆发：n 个粒子从 (x,y) 向外散开 */
  burst(
    x: number,
    y: number,
    key: string,
    n: number,
    tints: number[],
    o: { dist: number; dur: number; scale: number; scaleEnd: number; alpha?: number; rise?: number; spin?: number; tangent?: boolean },
  ): void {
    const s = this.scene;
    const k = this.k;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU);
      const img = s.add
        .image(x, y, key)
        .setTint(pick(tints))
        .setDepth(3)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(o.scale * k)
        .setAlpha(o.alpha ?? 0.95)
        .setRotation(o.tangent ? a : rnd(0, TAU));
      s.tweens.add({
        targets: img,
        x: x + Math.cos(a) * o.dist,
        y: y + Math.sin(a) * o.dist - (o.rise ?? 0),
        scale: o.scaleEnd * k,
        alpha: 0,
        rotation: img.rotation + (o.spin ?? 0),
        duration: o.dur * rnd(0.85, 1.15),
        ease: 'Cubic.easeOut',
        onComplete: () => img.destroy(),
      });
    }
  }

  /** 吸血：血滴沿弧线从命中点飞回光环中心 */
  siphon(x: number, y: number, tint: number): void {
    const s = this.scene;
    const k = this.k;
    const tx = this.x,
      ty = this.y;
    for (let i = 0; i < 2; i++) {
      const img = s.add
        .image(x, y, 'fx_aura_drop')
        .setTint(tint)
        .setDepth(3)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.9 * k)
        .setAlpha(0.95);
      const bend = rnd(-30, 30);
      const mx = (x + tx) / 2 + bend,
        my = (y + ty) / 2 - Math.abs(bend);
      const st = { u: 0 };
      s.tweens.add({
        targets: st,
        u: 1,
        delay: i * 70,
        duration: 360,
        ease: 'Sine.easeIn',
        onUpdate: () => {
          const u = st.u,
            v = 1 - u;
          const nx = v * v * x + 2 * v * u * mx + u * u * tx;
          const ny = v * v * y + 2 * v * u * my + u * u * ty;
          img
            .setRotation(Math.atan2(ny - img.y, nx - img.x))
            .setPosition(nx, ny)
            .setAlpha(0.95 * (1 - u * 0.6));
        },
        onComplete: () => img.destroy(),
      });
    }
  }

  destroy(): void {
    for (const L of this.layers) L.img.destroy();
    for (const p of this.parts) p.img.destroy();
    for (const img of this.pool) img.destroy();
    this.layers = [];
    this.parts = [];
    this.pool = [];
  }
}

// 1.4.0 G5：新光环武器的外观
Object.assign(AURA_LOOK, EXTRA_AURA_LOOK);
