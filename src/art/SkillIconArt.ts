// 角色技能图标：统一的金属边徽章底 + 每个角色一枚贴合技能名的专属图案。
// 图案在 100×100 的坐标系里绘制，再整体缩放到贴图尺寸；没有专属图案的角色按技能类型回退。
import { type Ctx, rgb, mix, lighten, darken, toon, starPath, polarPath, ellipsePath, roundRectPath, OUTLINE } from './Painter';
import type { SkillDef, SkillType } from '../data/characters';

const INK = 0x2a1614;

/** 亮度 0~1 */
function lum(c: number): number {
  return (0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255)) / 255;
}

interface Pal {
  /** 徽章底色（浅色技能压暗，保证图案对比度） */
  base: number;
  /** 图案主色 */
  g: number;
  /** 点缀色 */
  a: number;
}

function palette(c: number): Pal {
  const L = lum(c);
  const base = L > 0.62 ? darken(c, 0.42) : L < 0.22 ? lighten(c, 0.12) : c;
  const g = L > 0.62 ? lighten(c, 0.25) : lighten(c, 0.62);
  return { base, g, a: 0xffe08a };
}

// ---------------- 绘制工具 ----------------
type Path = () => void;

/** 带落影的卡通填充形状 */
function shape(ctx: Ctx, path: Path, color: number, bb: [number, number, number, number] = [24, 24, 52, 52], lineW = 3.2): void {
  ctx.save();
  ctx.translate(1.2, 3);
  path();
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fill();
  ctx.restore();
  path();
  toon(ctx, color, bb[0], bb[1], bb[2], bb[3], { lineW, outline: INK });
}

/** 带描边的粗线（速度线、刀光、波纹） */
function stroke(ctx: Ctx, path: Path, color: number, w: number, alpha = 1): void {
  path();
  ctx.lineWidth = w + 3.6;
  ctx.strokeStyle = rgb(INK, alpha);
  ctx.stroke();
  path();
  ctx.lineWidth = w;
  ctx.strokeStyle = rgb(color, alpha);
  ctx.stroke();
}

const circle =
  (ctx: Ctx, x: number, y: number, r: number): Path =>
  () => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
  };
const poly =
  (ctx: Ctx, pts: number[][]): Path =>
  () => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };
const line =
  (ctx: Ctx, pts: number[][]): Path =>
  () => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  };
/** 尖头朝上的水滴 */
const drop =
  (ctx: Ctx, x: number, y: number, r: number): Path =>
  () => {
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.7);
    ctx.bezierCurveTo(x + r * 0.6, y - r * 0.9, x + r, y - r * 0.3, x + r, y + r * 0.15);
    ctx.arc(x, y + r * 0.15, r, 0, Math.PI);
    ctx.bezierCurveTo(x - r, y - r * 0.3, x - r * 0.6, y - r * 0.9, x, y - r * 1.7);
    ctx.closePath();
  };
/** 火焰 */
const flame =
  (ctx: Ctx, x: number, y: number, s: number): Path =>
  () => {
    ctx.beginPath();
    ctx.moveTo(x, y + 22 * s);
    ctx.bezierCurveTo(x - 20 * s, y + 20 * s, x - 22 * s, y - 2 * s, x - 10 * s, y - 14 * s);
    ctx.bezierCurveTo(x - 9 * s, y - 6 * s, x - 5 * s, y - 4 * s, x - 3 * s, y - 6 * s);
    ctx.bezierCurveTo(x - 6 * s, y - 18 * s, x + 2 * s, y - 26 * s, x + 6 * s, y - 30 * s);
    ctx.bezierCurveTo(x + 6 * s, y - 18 * s, x + 22 * s, y - 10 * s, x + 20 * s, y + 6 * s);
    ctx.bezierCurveTo(x + 19 * s, y + 18 * s, x + 10 * s, y + 22 * s, x, y + 22 * s);
    ctx.closePath();
  };
/** 蓬松的云 */
const cloud =
  (ctx: Ctx, x: number, y: number, s: number): Path =>
  () => {
    ctx.beginPath();
    ctx.moveTo(x - 24 * s, y + 10 * s);
    ctx.arc(x - 16 * s, y + 2 * s, 9 * s, Math.PI * 0.6, Math.PI * 1.45);
    ctx.arc(x - 4 * s, y - 8 * s, 13 * s, Math.PI * 1.1, Math.PI * 1.85);
    ctx.arc(x + 13 * s, y - 2 * s, 10 * s, Math.PI * 1.3, Math.PI * 0.15);
    ctx.arc(x + 18 * s, y + 6 * s, 6 * s, Math.PI * 1.6, Math.PI * 0.5);
    ctx.closePath();
  };
const sparkle = (ctx: Ctx, x: number, y: number, r: number, color = 0xffffff): void => {
  starPath(ctx, x, y, r, r * 0.3, 4);
  ctx.fillStyle = rgb(color);
  ctx.fill();
};

// ---------------- 图案库 ----------------
type Glyph = (ctx: Ctx, p: Pal) => void;

const G: Record<string, Glyph> = {
  // 番茄酱爆：酱汁四溅
  splash: (ctx, p) => {
    shape(
      ctx,
      () =>
        polarPath(ctx, 50, 52, 16, (a) => {
          const r = 17 + (Math.round((a + Math.PI) * 2.5) % 2 ? 9 : 0);
          return [r, r];
        }),
      p.g,
      [26, 28, 48, 48],
    );
    for (const [x, y, r] of [
      [25, 30, 5],
      [76, 32, 4],
      [74, 74, 5],
      [27, 72, 3.5],
    ])
      shape(ctx, circle(ctx, x, y, r), p.g, [x - r, y - r, r * 2, r * 2], 2.4);
  },
  // 冲锋：骑枪 + 速度线
  lance: (ctx, p) => {
    for (const [y, l] of [
      [34, 18],
      [50, 24],
      [66, 16],
    ])
      stroke(
        ctx,
        line(ctx, [
          [18, y + 14],
          [18 + l, y + 14 - l * 0.6],
        ]),
        0xffffff,
        3,
        0.85,
      );
    shape(
      ctx,
      poly(ctx, [
        [78, 22],
        [56, 38],
        [38, 64],
        [33, 74],
        [43, 69],
        [64, 46],
      ]),
      p.g,
      [33, 22, 45, 52],
    );
    shape(
      ctx,
      poly(ctx, [
        [30, 58],
        [44, 72],
        [38, 78],
        [24, 64],
      ]),
      p.a,
      [24, 58, 20, 20],
      2.6,
    );
  },
  flame: (ctx, p) => {
    shape(ctx, flame(ctx, 50, 50, 1.05), p.g, [28, 18, 46, 64]);
    shape(ctx, flame(ctx, 51, 60, 0.5), p.a, [41, 45, 20, 26], 2.2);
  },
  // 爆米花弹幕：一圈爆米花
  popcorn: (ctx, p) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = 50 + Math.cos(a) * 23,
        y = 50 + Math.sin(a) * 23;
      shape(
        ctx,
        () => polarPath(ctx, x, y, 10, (t) => [7.5 + Math.cos(t * 5) * 1.6, 7.5 + Math.cos(t * 5) * 1.6]),
        p.g,
        [x - 8, y - 8, 16, 16],
        2.4,
      );
    }
    shape(ctx, circle(ctx, 50, 50, 8), p.a, [42, 42, 16, 16], 2.4);
  },
  // 翻滚：带螺旋纹的球 + 动感线
  roll: (ctx, p) => {
    for (const [y, l] of [
      [38, 14],
      [52, 20],
      [66, 12],
    ])
      stroke(
        ctx,
        line(ctx, [
          [16, y],
          [16 + l, y],
        ]),
        0xffffff,
        3,
        0.85,
      );
    shape(ctx, circle(ctx, 56, 52, 22), p.g, [34, 30, 44, 44]);
    stroke(
      ctx,
      () => {
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.05) {
          const a = t * Math.PI * 3.2,
            r = 3 + t * 15;
          const x = 56 + Math.cos(a) * r,
            y = 52 + Math.sin(a) * r;
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      },
      darken(p.base, 0.1),
      2.6,
    );
  },
  // 隐身：雾中匕首
  mistBlade: (ctx, p) => {
    ctx.globalAlpha = 0.7;
    shape(ctx, cloud(ctx, 50, 62, 1.15), lighten(p.g, 0.3), [22, 44, 58, 30]);
    ctx.globalAlpha = 1;
    shape(
      ctx,
      poly(ctx, [
        [66, 18],
        [72, 22],
        [52, 50],
        [46, 46],
      ]),
      0xe9ecef,
      [46, 18, 26, 32],
      2.8,
    );
    shape(
      ctx,
      poly(ctx, [
        [40, 44],
        [54, 56],
        [50, 60],
        [36, 48],
      ]),
      p.a,
      [36, 44, 18, 16],
      2.6,
    );
    shape(
      ctx,
      poly(ctx, [
        [44, 54],
        [48, 58],
        [38, 70],
        [34, 66],
      ]),
      darken(p.base, 0.2),
      [34, 54, 14, 16],
      2.4,
    );
  },
  // 天罚：乌云落雷
  thunder: (ctx, p) => {
    shape(ctx, cloud(ctx, 50, 36, 1.1), lighten(p.base, 0.35), [24, 20, 54, 28]);
    shape(
      ctx,
      poly(ctx, [
        [54, 40],
        [38, 62],
        [50, 62],
        [42, 84],
        [66, 54],
        [54, 54],
        [62, 40],
      ]),
      p.a,
      [38, 40, 28, 44],
      3,
    );
  },
  // 血之领域：血滴 + 獠牙
  blood: (ctx, p) => {
    shape(ctx, drop(ctx, 50, 56, 18), p.g, [32, 25, 36, 50]);
    for (const x of [42, 58])
      shape(
        ctx,
        poly(ctx, [
          [x - 4, 52],
          [x + 4, 52],
          [x, 64],
        ]),
        0xffffff,
        [x - 4, 52, 8, 12],
        2.2,
      );
  },
  // 分身：一前一后两个身影
  twins: (ctx, p) => {
    const body =
      (x: number, y: number, s: number): Path =>
      () => {
        ctx.beginPath();
        ctx.arc(x, y - 14 * s, 9 * s, 0, Math.PI * 2);
        ctx.moveTo(x - 15 * s, y + 18 * s);
        ctx.bezierCurveTo(x - 15 * s, y - 2 * s, x + 15 * s, y - 2 * s, x + 15 * s, y + 18 * s);
        ctx.closePath();
      };
    ctx.globalAlpha = 0.6;
    shape(ctx, body(36, 52, 0.95), lighten(p.g, 0.2), [20, 30, 32, 40]);
    ctx.globalAlpha = 1;
    shape(ctx, body(60, 56, 1.1), p.g, [42, 32, 36, 46]);
  },
  // 炮击：冒火星的炮弹
  cannon: (ctx, p) => {
    shape(ctx, circle(ctx, 48, 56, 22), lighten(p.base, 0.15), [26, 34, 44, 44]);
    stroke(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(62, 38);
        ctx.quadraticCurveTo(70, 26, 66, 20);
      },
      0xc9a227,
      3,
    );
    starPath(ctx, 66, 19, 10, 4, 6);
    ctx.fillStyle = rgb(p.a);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    sparkle(ctx, 66, 19, 4);
  },
  ghost: (ctx, p) => {
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(28, 80);
        ctx.lineTo(28, 46);
        ctx.bezierCurveTo(28, 14, 72, 14, 72, 46);
        ctx.lineTo(72, 80);
        ctx.lineTo(63, 72);
        ctx.lineTo(55, 80);
        ctx.lineTo(46, 72);
        ctx.lineTo(37, 80);
        ctx.closePath();
      },
      p.g,
      [28, 20, 44, 60],
    );
    ctx.fillStyle = rgb(INK);
    for (const x of [41, 59]) {
      ellipsePath(ctx, x, 46, 4.5, 6);
      ctx.fill();
    }
    ellipsePath(ctx, 50, 60, 4, 3);
    ctx.fill();
  },
  // 应援：麦克风 + 音符
  mic: (ctx, p) => {
    stroke(
      ctx,
      line(ctx, [
        [44, 58],
        [36, 80],
      ]),
      lighten(p.base, 0.4),
      4,
    );
    shape(ctx, () => roundRectPath(ctx, 36, 24, 24, 36, 12), p.g, [36, 24, 24, 36]);
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.ellipse(70, 62, 6, 4.5, -0.4, 0, Math.PI * 2);
        ctx.moveTo(74, 60);
        ctx.lineTo(74, 34);
        ctx.lineTo(80, 38);
        ctx.lineTo(76, 39);
        ctx.lineTo(76, 60);
        ctx.closePath();
      },
      p.a,
      [64, 34, 16, 32],
      2.4,
    );
  },
  // 瞬影斩：手里剑 + 斩痕
  shuriken: (ctx, p) => {
    stroke(
      ctx,
      line(ctx, [
        [20, 78],
        [82, 22],
      ]),
      0xffffff,
      3.5,
      0.9,
    );
    shape(
      ctx,
      () => {
        starPath(ctx, 50, 50, 26, 8, 4, -Math.PI / 4);
      },
      lighten(p.g, 0.2),
      [24, 24, 52, 52],
    );
    shape(ctx, circle(ctx, 50, 50, 5), darken(p.base, 0.2), [45, 45, 10, 10], 2.2);
  },
  // 核心过载：原子
  atom: (ctx, p) => {
    for (const r of [0, Math.PI / 3, -Math.PI / 3])
      stroke(
        ctx,
        () => {
          ctx.beginPath();
          ctx.ellipse(50, 50, 28, 10, r, 0, Math.PI * 2);
        },
        p.g,
        3.2,
      );
    shape(ctx, circle(ctx, 50, 50, 10), p.a, [40, 40, 20, 20], 2.6);
  },
  // 催泪：泪滴 + 洋葱云
  tears: (ctx, p) => {
    shape(ctx, cloud(ctx, 50, 38, 1.05), lighten(p.base, 0.4), [24, 22, 54, 28]);
    for (const [x, y] of [
      [38, 66],
      [56, 72],
      [66, 58],
    ])
      shape(ctx, drop(ctx, x, y, 6), 0x9bf6ff, [x - 6, y - 10, 12, 16], 2.4);
  },
  // 孢子云：蘑菇 + 孢子
  mushroom: (ctx, p) => {
    shape(ctx, () => roundRectPath(ctx, 42, 50, 16, 28, 6), 0xfff4ea, [42, 50, 16, 28]);
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(20, 54);
        ctx.bezierCurveTo(20, 20, 80, 20, 80, 54);
        ctx.closePath();
      },
      p.g,
      [20, 26, 60, 28],
    );
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [x, y, r] of [
      [36, 40, 4],
      [52, 34, 5],
      [66, 44, 3.5],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const [x, y] of [
      [22, 70],
      [80, 66],
      [74, 80],
    ])
      shape(ctx, circle(ctx, x, y, 3), p.g, [x - 3, y - 3, 6, 6], 1.8);
  },
  // 震地拳：拳头 + 冲击
  fist: (ctx, p) => {
    stroke(
      ctx,
      () => {
        ctx.beginPath();
        ctx.arc(50, 50, 32, Math.PI * 0.15, Math.PI * 0.85);
      },
      0xffffff,
      3,
      0.7,
    );
    shape(ctx, () => roundRectPath(ctx, 28, 30, 44, 36, 12), p.g, [28, 30, 44, 36]);
    ctx.strokeStyle = rgb(INK);
    ctx.lineWidth = 2.6;
    for (const x of [39, 50, 61]) {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x, 46);
      ctx.stroke();
    }
    shape(ctx, () => roundRectPath(ctx, 24, 48, 22, 14, 7), lighten(p.g, 0.15), [24, 48, 22, 14], 2.6);
  },
  // 魔术师：礼帽 + 星星
  tophat: (ctx, p) => {
    shape(ctx, () => roundRectPath(ctx, 34, 26, 32, 36, 4), darken(p.base, 0.35), [34, 26, 32, 36]);
    shape(ctx, () => roundRectPath(ctx, 34, 50, 32, 7, 2), p.a, [34, 50, 32, 7], 2);
    shape(ctx, () => ellipsePath(ctx, 50, 64, 28, 7), darken(p.base, 0.3), [22, 57, 56, 14]);
    sparkle(ctx, 74, 30, 7, 0xffffff);
    sparkle(ctx, 26, 36, 5, p.g);
  },
  // 双枪 / 连射：两颗子弹
  bullets: (ctx, p) => {
    const bullet =
      (x: number, y: number): Path =>
      () => {
        ctx.beginPath();
        ctx.moveTo(x - 7, y + 20);
        ctx.lineTo(x - 7, y - 6);
        ctx.bezierCurveTo(x - 7, y - 16, x, y - 22, x, y - 22);
        ctx.bezierCurveTo(x, y - 22, x + 7, y - 16, x + 7, y - 6);
        ctx.lineTo(x + 7, y + 20);
        ctx.closePath();
      };
    for (const [x, y] of [
      [38, 54],
      [60, 46],
    ]) {
      shape(ctx, bullet(x, y), p.a, [x - 7, y - 22, 14, 42], 2.8);
      shape(ctx, () => roundRectPath(ctx, x - 8, y + 10, 16, 10, 2), p.g, [x - 8, y + 10, 16, 10], 2.4);
    }
  },
  // 豌豆炮台：豆荚
  peapod: (ctx, p) => {
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(18, 64);
        ctx.bezierCurveTo(30, 30, 66, 22, 84, 34);
        ctx.bezierCurveTo(72, 62, 40, 76, 18, 64);
        ctx.closePath();
      },
      darken(p.g, 0.2),
      [18, 26, 66, 46],
    );
    for (const [x, y] of [
      [34, 56],
      [48, 48],
      [63, 41],
    ])
      shape(ctx, circle(ctx, x, y, 7.5), lighten(p.g, 0.2), [x - 7.5, y - 7.5, 15, 15], 2.4);
  },
  // 天使祝福：光环 + 翅膀
  angel: (ctx, p) => {
    stroke(
      ctx,
      () => {
        ctx.beginPath();
        ctx.ellipse(50, 24, 16, 5, 0, 0, Math.PI * 2);
      },
      p.a,
      3.5,
    );
    for (const s of [-1, 1])
      shape(
        ctx,
        () => {
          ctx.beginPath();
          ctx.moveTo(50, 46);
          ctx.bezierCurveTo(50 + s * 14, 30, 50 + s * 32, 30, 50 + s * 34, 40);
          ctx.bezierCurveTo(50 + s * 30, 46, 50 + s * 32, 54, 50 + s * 26, 58);
          ctx.bezierCurveTo(50 + s * 24, 66, 50 + s * 14, 70, 50, 56);
          ctx.closePath();
        },
        0xffffff,
        [s < 0 ? 16 : 50, 32, 34, 38],
      );
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(50, 78);
        ctx.bezierCurveTo(30, 64, 38, 48, 50, 58);
        ctx.bezierCurveTo(62, 48, 70, 64, 50, 78);
        ctx.closePath();
      },
      p.g,
      [36, 50, 28, 28],
      2.6,
    );
  },
  // 龙焰冲锋：火焰包裹的长枪
  dragonLance: (ctx, p) => {
    shape(ctx, flame(ctx, 64, 36, 0.75), 0xff9e00, [48, 14, 32, 40], 2.6);
    shape(
      ctx,
      poly(ctx, [
        [76, 22],
        [56, 38],
        [36, 64],
        [31, 74],
        [41, 69],
        [62, 46],
      ]),
      p.g,
      [31, 22, 45, 52],
    );
    shape(ctx, flame(ctx, 64, 40, 0.38), 0xffe066, [56, 28, 16, 18], 2);
  },
  // 狂暴：怒气符号
  rage: (ctx) => {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = 50 + Math.cos(a) * 15,
        y = 50 + Math.sin(a) * 15;
      shape(
        ctx,
        () => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a + Math.PI / 4);
          ctx.beginPath();
          ctx.moveTo(-14, -4);
          ctx.quadraticCurveTo(0, -2, 4, -14);
          ctx.lineTo(10, -14);
          ctx.quadraticCurveTo(8, 4, -14, 4);
          ctx.closePath();
          ctx.restore();
        },
        0xffe08a,
        [x - 14, y - 14, 28, 28],
        2.6,
      );
    }
  },
  // 穿心箭：箭射穿靶心
  arrow: (ctx, p) => {
    for (const [r, c] of [
      [26, 0xffffff],
      [17, 0xff4d6d],
      [8, 0xffffff],
    ] as [number, number][])
      shape(ctx, circle(ctx, 58, 54, r), c, [58 - r, 54 - r, r * 2, r * 2], 2.6);
    stroke(
      ctx,
      line(ctx, [
        [16, 28],
        [56, 52],
      ]),
      0x8d6e63,
      3.5,
    );
    shape(
      ctx,
      poly(ctx, [
        [50, 42],
        [62, 56],
        [46, 54],
      ]),
      p.g,
      [46, 42, 16, 14],
      2.4,
    );
    shape(
      ctx,
      poly(ctx, [
        [14, 22],
        [24, 26],
        [20, 34],
        [12, 32],
      ]),
      p.a,
      [12, 22, 12, 12],
      2,
    );
  },
  // 盛宴：冒热气的爱心
  feast: (ctx, p) => {
    for (const x of [40, 52, 64])
      stroke(
        ctx,
        () => {
          ctx.beginPath();
          ctx.moveTo(x, 34);
          ctx.bezierCurveTo(x - 6, 28, x + 6, 22, x, 14);
        },
        0xffffff,
        2.6,
        0.8,
      );
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(50, 80);
        ctx.bezierCurveTo(18, 60, 22, 34, 38, 36);
        ctx.bezierCurveTo(44, 36, 48, 40, 50, 44);
        ctx.bezierCurveTo(52, 40, 56, 36, 62, 36);
        ctx.bezierCurveTo(78, 34, 82, 60, 50, 80);
        ctx.closePath();
      },
      p.g,
      [22, 36, 56, 44],
    );
  },
  // 侦探：放大镜
  magnifier: (ctx, p) => {
    shape(
      ctx,
      poly(ctx, [
        [56, 58],
        [64, 52],
        [82, 74],
        [74, 80],
      ]),
      0x8d6e63,
      [56, 52, 26, 28],
      2.8,
    );
    shape(ctx, circle(ctx, 44, 42, 20), p.a, [24, 22, 40, 40]);
    shape(ctx, circle(ctx, 44, 42, 13), 0xcaf0f8, [31, 29, 26, 26], 2.4);
    ctx.fillStyle = rgb(INK);
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 44, 43);
  },
  // 好运：四叶草
  clover: (ctx, p) => {
    stroke(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(50, 52);
        ctx.quadraticCurveTo(54, 70, 66, 80);
      },
      0x52b788,
      3.4,
    );
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 4;
      const x = 50 + Math.cos(a) * 13,
        y = 48 + Math.sin(a) * 13;
      shape(
        ctx,
        () => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a + Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 12);
          ctx.bezierCurveTo(-16, 0, -10, -14, 0, -6);
          ctx.bezierCurveTo(10, -14, 16, 0, 0, 12);
          ctx.closePath();
          ctx.restore();
        },
        0x74c69d,
        [x - 12, y - 12, 24, 24],
        2.6,
      );
    }
    sparkle(ctx, 74, 26, 6, p.a);
  },
  // 臭气：绿色臭云 + 波浪线
  stink: (ctx, p) => {
    shape(ctx, cloud(ctx, 50, 60, 1.15), 0xb5c99a, [22, 42, 58, 32]);
    for (const x of [36, 50, 64])
      stroke(
        ctx,
        () => {
          ctx.beginPath();
          ctx.moveTo(x, 40);
          ctx.bezierCurveTo(x - 7, 34, x + 7, 28, x, 18);
        },
        p.g,
        3,
        0.95,
      );
    ctx.fillStyle = rgb(INK);
    for (const x of [42, 58]) {
      ctx.beginPath();
      ctx.moveTo(x - 4, 56);
      ctx.lineTo(x + 4, 60);
      ctx.lineTo(x - 4, 64);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = rgb(INK);
      ctx.stroke();
    }
  },
  // 无人机
  drone: (ctx, p) => {
    for (const s of [-1, 1]) {
      stroke(
        ctx,
        line(ctx, [
          [50, 50],
          [50 + s * 24, 38],
        ]),
        lighten(p.base, 0.3),
        3,
      );
      shape(ctx, () => ellipsePath(ctx, 50 + s * 24, 34, 13, 3.5), 0xe9ecef, [50 + s * 24 - 13, 30, 26, 8], 2.2);
    }
    shape(ctx, () => roundRectPath(ctx, 34, 44, 32, 20, 9), p.g, [34, 44, 32, 20]);
    shape(ctx, circle(ctx, 50, 54, 5), 0xff4d6d, [45, 49, 10, 10], 2);
    stroke(
      ctx,
      line(ctx, [
        [42, 66],
        [38, 74],
      ]),
      lighten(p.base, 0.3),
      2.6,
    );
    stroke(
      ctx,
      line(ctx, [
        [58, 66],
        [62, 74],
      ]),
      lighten(p.base, 0.3),
      2.6,
    );
  },
  // 金钟罩：大钟
  bell: (ctx, p) => {
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(24, 70);
        ctx.bezierCurveTo(30, 66, 30, 58, 32, 46);
        ctx.bezierCurveTo(34, 26, 66, 26, 68, 46);
        ctx.bezierCurveTo(70, 58, 70, 66, 76, 70);
        ctx.closePath();
      },
      p.a,
      [24, 28, 52, 42],
    );
    shape(ctx, () => roundRectPath(ctx, 44, 20, 12, 10, 4), p.a, [44, 20, 12, 10], 2.4);
    shape(ctx, circle(ctx, 50, 74, 6), darken(p.a, 0.2), [44, 68, 12, 12], 2.4);
    stroke(
      ctx,
      line(ctx, [
        [34, 58],
        [66, 58],
      ]),
      darken(p.a, 0.35),
      2.4,
    );
  },
  // 冰封：雪花
  snowflake: (ctx, p) => {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      stroke(
        ctx,
        line(ctx, [
          [50 - Math.cos(a) * 28, 50 - Math.sin(a) * 28],
          [50 + Math.cos(a) * 28, 50 + Math.sin(a) * 28],
        ]),
        0xe0fbfc,
        4.2,
      );
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const bx = 50 + Math.cos(a) * 18,
        by = 50 + Math.sin(a) * 18;
      for (const s of [-1, 1])
        stroke(
          ctx,
          line(ctx, [
            [bx, by],
            [bx + Math.cos(a + s * 0.9) * 9, by + Math.sin(a + s * 0.9) * 9],
          ]),
          0xe0fbfc,
          3,
        );
    }
    shape(ctx, () => starPath(ctx, 50, 50, 8, 4, 6), p.g, [42, 42, 16, 16], 2.2);
  },
  // 拔苗助长：嫩芽 + 上升箭头
  sprout: (ctx, p) => {
    stroke(
      ctx,
      line(ctx, [
        [46, 80],
        [46, 46],
      ]),
      0x74c69d,
      4,
    );
    for (const s of [-1, 1])
      shape(
        ctx,
        () => {
          ctx.beginPath();
          ctx.moveTo(46, 50);
          ctx.bezierCurveTo(46 + s * 6, 30, 46 + s * 22, 26, 46 + s * 26, 30);
          ctx.bezierCurveTo(46 + s * 22, 46, 46 + s * 10, 52, 46, 50);
          ctx.closePath();
        },
        p.g,
        [s < 0 ? 20 : 46, 28, 26, 24],
      );
    shape(
      ctx,
      poly(ctx, [
        [74, 40],
        [84, 54],
        [78, 54],
        [78, 72],
        [70, 72],
        [70, 54],
        [64, 54],
      ]),
      p.a,
      [64, 40, 20, 32],
      2.4,
    );
  },
  // 核弹：辐射标志
  nuke: (ctx, p) => {
    shape(ctx, circle(ctx, 50, 50, 28), p.a, [22, 22, 56, 56]);
    ctx.fillStyle = rgb(INK);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(50, 50);
      ctx.arc(50, 50, 23, a - 0.5, a + 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgb(p.a);
    ctx.beginPath();
    ctx.arc(50, 50, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgb(INK);
    ctx.beginPath();
    ctx.arc(50, 50, 5, 0, Math.PI * 2);
    ctx.fill();
  },
  // 豆兵：三颗豆子列阵
  beans: (ctx, p) => {
    const bean =
      (x: number, y: number): Path =>
      () => {
        ctx.beginPath();
        ctx.ellipse(x, y, 10, 13, 0.3, 0, Math.PI * 2);
      };
    for (const [x, y] of [
      [30, 58],
      [70, 58],
      [50, 46],
    ]) {
      shape(ctx, bean(x, y), p.g, [x - 10, y - 13, 20, 26], 2.6);
      ctx.fillStyle = rgb(INK);
      for (const d of [-3.5, 3.5]) {
        ctx.beginPath();
        ctx.arc(x + d, y - 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    shape(
      ctx,
      poly(ctx, [
        [50, 18],
        [50, 32],
        [52, 32],
        [52, 24],
        [64, 21],
      ]),
      p.a,
      [50, 18, 14, 14],
      2,
    );
  },
  // 千刺甲：带尖刺的盾
  spikeShield: (ctx, p) => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      shape(
        ctx,
        poly(ctx, [
          [50 + Math.cos(a - 0.18) * 24, 52 + Math.sin(a - 0.18) * 24],
          [50 + Math.cos(a) * 36, 52 + Math.sin(a) * 36],
          [50 + Math.cos(a + 0.18) * 24, 52 + Math.sin(a + 0.18) * 24],
        ]),
        0xe9ecef,
        [14, 16, 72, 72],
        2,
      );
    }
    shape(ctx, circle(ctx, 50, 52, 25), p.g, [25, 27, 50, 50]);
    shape(ctx, circle(ctx, 50, 52, 9), p.a, [41, 43, 18, 18], 2.4);
  },
  // 石榴籽爆裂：一圈飞出的籽
  seedBurst: (ctx, p) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = 50 + Math.cos(a) * 26,
        y = 50 + Math.sin(a) * 26;
      shape(
        ctx,
        () => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a + Math.PI / 2);
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2);
          ctx.restore();
        },
        0xff4d6d,
        [x - 6, y - 6, 12, 12],
        2.2,
      );
    }
    shape(ctx, circle(ctx, 50, 50, 13), p.g, [37, 37, 26, 26], 2.6);
    shape(ctx, () => starPath(ctx, 50, 38, 6, 3, 5), p.a, [44, 32, 12, 12], 1.8);
  },
  // 结界：符文法阵
  rune: (ctx, p) => {
    stroke(ctx, circle(ctx, 50, 50, 28), p.g, 3.2);
    stroke(ctx, () => starPath(ctx, 50, 50, 26, 26 * 0.38, 5), p.a, 2.6);
    shape(ctx, circle(ctx, 50, 50, 7), p.g, [43, 43, 14, 14], 2.2);
  },
  // 不倒金身：盾牌
  shield: (ctx, p) => {
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(50, 20);
        ctx.lineTo(76, 30);
        ctx.bezierCurveTo(76, 56, 66, 72, 50, 82);
        ctx.bezierCurveTo(34, 72, 24, 56, 24, 30);
        ctx.closePath();
      },
      p.a,
      [24, 20, 52, 62],
    );
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(50, 30);
        ctx.lineTo(66, 36);
        ctx.bezierCurveTo(66, 54, 60, 64, 50, 71);
        ctx.bezierCurveTo(40, 64, 34, 54, 34, 36);
        ctx.closePath();
      },
      p.g,
      [34, 30, 32, 41],
      2.4,
    );
    shape(
      ctx,
      poly(ctx, [
        [46, 40],
        [54, 40],
        [54, 46],
        [60, 46],
        [60, 54],
        [54, 54],
        [54, 62],
        [46, 62],
        [46, 54],
        [40, 54],
        [40, 46],
        [46, 46],
      ]),
      0xffffff,
      [40, 40, 20, 22],
      2,
    );
  },
  // 枯萎咒：骷髅
  skull: (ctx, p) => {
    shape(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(36, 66);
        ctx.bezierCurveTo(20, 56, 22, 22, 50, 22);
        ctx.bezierCurveTo(78, 22, 80, 56, 64, 66);
        ctx.lineTo(64, 76);
        ctx.lineTo(36, 76);
        ctx.closePath();
      },
      p.g,
      [22, 22, 56, 54],
    );
    ctx.fillStyle = rgb(INK);
    for (const x of [40, 60]) {
      ellipsePath(ctx, x, 46, 7, 8);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(50, 54);
    ctx.lineTo(46, 62);
    ctx.lineTo(54, 62);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = rgb(INK);
    for (const x of [44, 50, 56]) {
      ctx.beginPath();
      ctx.moveTo(x, 68);
      ctx.lineTo(x, 76);
      ctx.stroke();
    }
    ctx.fillStyle = rgb(0xc77dff);
    for (const x of [40, 60]) {
      ctx.beginPath();
      ctx.arc(x, 47, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  // 通用回退
  nova: (ctx, p) => {
    shape(ctx, () => starPath(ctx, 50, 50, 30, 13, 8), p.g, [20, 20, 60, 60]);
    shape(ctx, circle(ctx, 50, 50, 8), p.a, [42, 42, 16, 16], 2.2);
  },
  heal: (ctx, p) => {
    shape(
      ctx,
      poly(ctx, [
        [42, 22],
        [58, 22],
        [58, 42],
        [78, 42],
        [78, 58],
        [58, 58],
        [58, 78],
        [42, 78],
        [42, 58],
        [22, 58],
        [22, 42],
        [42, 42],
      ]),
      p.g,
      [22, 22, 56, 56],
    );
  },
  buff: (ctx, p) => {
    shape(
      ctx,
      poly(ctx, [
        [50, 16],
        [78, 46],
        [60, 46],
        [60, 82],
        [40, 82],
        [40, 46],
        [22, 46],
      ]),
      p.g,
      [22, 16, 56, 66],
    );
  },
  field: (ctx, p) => {
    shape(ctx, () => ellipsePath(ctx, 50, 62, 32, 14), p.g, [18, 48, 64, 28]);
    for (const x of [36, 50, 64])
      stroke(
        ctx,
        line(ctx, [
          [x, 24],
          [x, 60],
        ]),
        0xffffff,
        3.2,
      );
  },
};

/** 每个角色的专属图案 */
const CHAR_GLYPH: Record<string, string> = {
  tomato: 'splash',
  carrot: 'lance',
  chili: 'flame',
  corn: 'popcorn',
  watermelon: 'roll',
  lemon: 'mistBlade',
  eggplant: 'thunder',
  garlic: 'blood',
  blueberry: 'twins',
  pineapple: 'cannon',
  pumpkin: 'ghost',
  strawberry: 'mic',
  ginger: 'shuriken',
  avocado: 'atom',
  onion: 'tears',
  mushroom: 'mushroom',
  coconut: 'fist',
  grape: 'tophat',
  cherry: 'bullets',
  pea: 'peapod',
  peach: 'angel',
  dragonfruit: 'dragonLance',
  beet: 'rage',
  asparagus: 'arrow',
  sweetpotato: 'feast',
  kiwi: 'magnifier',
  lychee: 'clover',
  durian: 'stink',
  bellpepper: 'drone',
  wintermelon: 'bell',
  bittermelon: 'snowflake',
  sprout: 'sprout',
  wasabi: 'nuke',
  soybean: 'beans',
  jackfruit: 'spikeShield',
  pomegranate: 'seedBurst',
  taro: 'rune',
  cabbage: 'shield',
  blackberry: 'skull',
};

/** 没有专属图案时按技能类型回退 */
const TYPE_GLYPH: Record<SkillType, string> = {
  nova: 'nova',
  dash: 'lance',
  buff: 'buff',
  ghost: 'ghost',
  ring: 'popcorn',
  heal: 'heal',
  strikes: 'thunder',
  clone: 'twins',
  barrage: 'bullets',
  missile: 'cannon',
  screen: 'thunder',
  field: 'field',
  curse: 'skull',
};

export const skillGlyphOf = (charId: string, type: SkillType): string => CHAR_GLYPH[charId] ?? TYPE_GLYPH[type] ?? 'nova';
export const SKILL_GLYPHS = Object.keys(G);

/** 徽章底：落影 → 金属边 → 渐变底 + 放射光 → 内圈 → 高光 */
function medallion(ctx: Ctx, p: Pal): void {
  const rim = mix(p.base, 0xffe8a3, 0.55);
  // 落影
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.arc(50, 52.5, 47, 0, Math.PI * 2);
  ctx.fill();
  // 金属边
  ctx.beginPath();
  ctx.arc(50, 50, 47, 0, Math.PI * 2);
  const gr = ctx.createLinearGradient(0, 4, 0, 96);
  gr.addColorStop(0, rgb(lighten(rim, 0.55)));
  gr.addColorStop(0.45, rgb(rim));
  gr.addColorStop(1, rgb(darken(rim, 0.5)));
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // 边上的刻痕
  ctx.strokeStyle = rgb(darken(rim, 0.45), 0.55);
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(50 + Math.cos(a) * 42, 50 + Math.sin(a) * 42);
    ctx.lineTo(50 + Math.cos(a) * 45.5, 50 + Math.sin(a) * 45.5);
    ctx.stroke();
  }
  // 渐变底
  ctx.save();
  ctx.beginPath();
  ctx.arc(50, 50, 39.5, 0, Math.PI * 2);
  const bg = ctx.createRadialGradient(46, 38, 4, 50, 50, 44);
  bg.addColorStop(0, rgb(lighten(p.base, 0.32)));
  bg.addColorStop(0.55, rgb(p.base));
  bg.addColorStop(1, rgb(darken(p.base, 0.62)));
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.clip();
  // 放射光
  ctx.fillStyle = rgb(lighten(p.base, 0.6), 0.13);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.arc(50, 50, 44, a, a + Math.PI / 12);
    ctx.closePath();
    ctx.fill();
  }
  // 底部内阴影
  const sh = ctx.createLinearGradient(0, 60, 0, 92);
  sh.addColorStop(0, 'rgba(0,0,0,0)');
  sh.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, 60, 100, 40);
  ctx.restore();
  // 内圈描线
  ctx.beginPath();
  ctx.arc(50, 50, 39.5, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = rgb(darken(p.base, 0.65));
  ctx.stroke();
}

function gloss(ctx: Ctx): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(50, 50, 39.5, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 10, 0, 46);
  g.addColorStop(0, 'rgba(255,255,255,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(50, 22, 34, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 边上的反光点
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(24, 20, 5, 2.4, -0.8, 0, Math.PI * 2);
  ctx.fill();
}

/** 在 size×size 的画布上画完整技能图标 */
export function drawSkillIcon(ctx: Ctx, charId: string, sk: Pick<SkillDef, 'type' | 'color'>, size: number): void {
  const p = palette(sk.color);
  ctx.save();
  ctx.scale(size / 100, size / 100);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  medallion(ctx, p);
  G[skillGlyphOf(charId, sk.type)](ctx, p);
  gloss(ctx);
  ctx.restore();
}
