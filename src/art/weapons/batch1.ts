// 武器专属造型 · 第 1 批：扩展 / 契合 / 规则生成（一）
// 每个函数在 128×64 画布上画一把武器：手柄 / 握把在左、朝右，中线 y = 32，描边统一用 OUTLINE，上色用 toon / metal
import { type Ctx, OUTLINE, rgb, darken, toon, ellipsePath, roundRectPath, smoothPath, glow, rng } from '../Painter';
import { handle, metal } from '../weaponKit';

const cy = 32;
const TAU = Math.PI * 2;
const OUTLINE_NUM = 0x2a1614;

/** 描边粗线：先画深色粗线再叠彩色细线（path 只需 moveTo/lineTo 等，不必 beginPath） */
function bar(ctx: Ctx, path: () => void, w: number, c: number, dash?: [number, number], dashC?: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  path();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w + 3;
  ctx.stroke();
  ctx.strokeStyle = rgb(c);
  ctx.lineWidth = w;
  ctx.stroke();
  if (dash && dashC !== undefined) {
    ctx.lineCap = 'butt';
    ctx.setLineDash(dash);
    ctx.strokeStyle = rgb(dashC);
    ctx.stroke();
  }
  ctx.restore();
}

/** 实心小圆点 */
function dot(ctx: Ctx, x: number, y: number, r: number, c: number, a = 1): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = rgb(c, a);
  ctx.fill();
}

/** 卡通小球 */
function ball(ctx: Ctx, x: number, y: number, r: number, c: number, lineW = 2.5): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  toon(ctx, c, x - r, y - r, r * 2, r * 2, { lineW });
}

/** 四角星闪光 */
function sparkle(ctx: Ctx, x: number, y: number, r: number, c = 0xfff3b0): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fillStyle = rgb(c, 0.95);
  ctx.fill();
}

/** 闪电折线（描边 + 亮色） */
function bolt(ctx: Ctx, pts: [number, number][], c: number, w = 2.5): void {
  bar(
    ctx,
    () => {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
    },
    w,
    c,
  );
}

/** 多边形路径 */
function poly(ctx: Ctx, pts: [number, number][]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
}

/** 平面填色 + 描边 */
function flatFill(ctx: Ctx, c: number, lineW = 2.5, outline = OUTLINE): void {
  ctx.fillStyle = rgb(c);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = lineW;
  ctx.stroke();
}

/** 等轴小方块（盐晶） */
function cube(ctx: Ctx, x: number, y: number, s: number, lineW = 2): void {
  const h = s * 0.5;
  const faces: [[number, number][], number][] = [
    [
      [
        [x, y - s],
        [x + s, y - h],
        [x, y],
        [x - s, y - h],
      ],
      0xffffff,
    ],
    [
      [
        [x - s, y - h],
        [x, y],
        [x, y + s],
        [x - s, y + h],
      ],
      0xdbe9f4,
    ],
    [
      [
        [x, y],
        [x + s, y - h],
        [x + s, y + h],
        [x, y + s],
      ],
      0x9fbcd6,
    ],
  ];
  for (const [p, c] of faces) {
    poly(ctx, p);
    flatFill(ctx, c, lineW, rgb(0x34506e));
  }
}

export const ART: Record<string, (ctx: Ctx) => void> = {
  // 芥末太刀：缠绳刀柄 + 圆镡 + 微弯钢刀身，刀背抹着一层绿芥末并往下滴
  wasabi_katana: (ctx) => {
    roundRectPath(ctx, 2, cy - 4, 6, 8, 2);
    metal(ctx, 2, cy - 4, 6, 8, 0xffd166);
    roundRectPath(ctx, 6, cy - 5, 34, 10, 4);
    toon(ctx, 0x1b263b, 6, cy - 5, 34, 10, { noShine: true, lineW: 2.5 });
    ctx.fillStyle = rgb(0xe0e1dd);
    for (let x = 10; x < 37; x += 7) {
      poly(ctx, [
        [x, cy],
        [x + 3.5, cy - 4],
        [x + 7, cy],
        [x + 3.5, cy + 4],
      ]);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(43, cy, 4.5, 13, 0, 0, TAU);
    toon(ctx, 0x3a3a3a, 38, cy - 13, 9, 26, { lineW: 2.5 });
    ctx.beginPath();
    ctx.ellipse(43, cy, 2, 9, 0, 0, TAU);
    ctx.strokeStyle = rgb(0xffd166);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    roundRectPath(ctx, 46, cy - 5, 6, 10, 1.5);
    metal(ctx, 46, cy - 5, 6, 10, 0xffd166);
    const blade = () => {
      ctx.beginPath();
      ctx.moveTo(51, cy - 5);
      ctx.quadraticCurveTo(92, cy - 5, 125, cy - 13);
      ctx.quadraticCurveTo(96, cy + 5, 51, cy + 5);
      ctx.closePath();
    };
    blade();
    metal(ctx, 51, cy - 13, 74, 18, 0xdee2e6);
    // 刃纹
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 54; x <= 112; x += 4) ctx.lineTo(x, cy + 2 - (x - 54) * 0.1 + (x % 8 ? 1 : -1));
    ctx.stroke();
    // 刀背上的芥末
    ctx.save();
    blade();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(56, cy - 8);
    ctx.lineTo(112, cy - 16);
    ctx.lineTo(112, cy - 7);
    for (let x = 108; x >= 56; x -= 6)
      ctx.quadraticCurveTo(x - 3, cy - 1 + (x % 12 ? 1 : 3) - (x - 56) * 0.08, x - 6, cy - 2 - (x - 56) * 0.08);
    ctx.closePath();
    ctx.fillStyle = rgb(0x8ac926);
    ctx.fill();
    ctx.strokeStyle = rgb(0x4f772d);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    blade();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    // 一坨芥末 + 滴落
    ctx.beginPath();
    ctx.ellipse(98, cy - 7, 9, 6, -0.2, 0, TAU);
    toon(ctx, 0x9ef01a, 89, cy - 13, 18, 12, { lineW: 2.5 });
    for (const [x, len] of [
      [70, 10],
      [84, 14],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x - 3, cy + 3);
      ctx.quadraticCurveTo(x - 3, cy + 3 + len, x, cy + 4 + len);
      ctx.quadraticCurveTo(x + 3, cy + 3 + len, x + 3, cy + 3);
      ctx.closePath();
      toon(ctx, 0x8ac926, x - 3, cy + 3, 6, len, { noShine: true, lineW: 2 });
    }
  },

  // 厨房剪刀：左侧一大一小两个红色握环，中间带开瓶齿，铆钉处张开两片尖刃
  kitchen_scissors: (ctx) => {
    // 下刃
    poly(ctx, [
      [52, cy + 5],
      [60, cy - 2],
      [125, cy + 12],
      [118, cy + 15],
    ]);
    metal(ctx, 52, cy - 2, 73, 17, 0xced4da);
    // 上刃
    poly(ctx, [
      [52, cy - 5],
      [118, cy - 15],
      [125, cy - 12],
      [60, cy + 2],
    ]);
    metal(ctx, 52, cy - 15, 73, 17, 0xe9ecef);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(64, cy - 5);
    ctx.lineTo(116, cy - 13);
    ctx.stroke();
    // 开瓶齿
    roundRectPath(ctx, 42, cy - 5, 14, 10, 2);
    metal(ctx, 42, cy - 5, 14, 10, 0xadb5bd);
    ctx.fillStyle = rgb(0x495057);
    for (let x = 44; x < 55; x += 3) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 1);
      ctx.lineTo(x + 1.5, cy + 2);
      ctx.lineTo(x + 3, cy - 1);
      ctx.fill();
    }
    // 握环
    for (const [x, y, rx, ry] of [
      [26, cy - 14, 18, 11],
      [24, cy + 14, 20, 13],
    ]) {
      bar(
        ctx,
        () => {
          ctx.moveTo(x + rx - 4, y + (y < cy ? 6 : -6));
          ctx.lineTo(54, cy + (y < cy ? -3 : 3));
        },
        8,
        0xd62828,
      );
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      ctx.moveTo(x + rx - 6, y);
      ctx.ellipse(x, y, rx - 6, ry - 6, 0, 0, TAU, true);
      toon(ctx, 0xe63946, x - rx, y - ry, rx * 2, ry * 2, { lineW: 2.5 });
    }
    ctx.beginPath();
    ctx.arc(58, cy, 4.5, 0, TAU);
    metal(ctx, 53, cy - 5, 10, 10, 0x6c757d);
    dot(ctx, 58, cy, 1.5, 0x212529);
  },

  // 破壁机：悬浮的透明搅拌杯，杯里十字刀片高速旋转，下接电机底座
  blender_aura: (ctx) => {
    glow(ctx, 64, cy, 34, 0xcaf0f8, 0.6);
    // 杯把
    bar(
      ctx,
      () => {
        ctx.moveTo(84, 16);
        ctx.quadraticCurveTo(100, 16, 98, 30);
        ctx.quadraticCurveTo(96, 42, 82, 40);
      },
      5,
      0x8d99ae,
    );
    // 杯身
    const jar = () =>
      poly(ctx, [
        [40, 11],
        [88, 11],
        [82, 46],
        [46, 46],
      ]);
    jar();
    ctx.fillStyle = 'rgba(202,240,248,0.55)';
    ctx.fill();
    // 果昔
    ctx.save();
    jar();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.quadraticCurveTo(52, 22, 64, 30);
    ctx.quadraticCurveTo(78, 38, 96, 28);
    ctx.lineTo(96, 50);
    ctx.lineTo(30, 50);
    ctx.closePath();
    ctx.fillStyle = rgb(0xff6b9a, 0.9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    for (const ry of [5, 9]) {
      ctx.beginPath();
      ctx.ellipse(64, 39, 16, ry * 0.5, 0, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(46, 13, 5, 28);
    ctx.restore();
    // 十字刀片
    for (const a of [0.35, -0.35]) {
      ctx.save();
      ctx.translate(64, 39);
      ctx.rotate(a);
      poly(ctx, [
        [-17, -1],
        [0, -3],
        [17, 1],
        [0, 3],
      ]);
      metal(ctx, -17, -3, 34, 6, 0xdee2e6);
      ctx.restore();
    }
    dot(ctx, 64, 39, 3, 0x495057);
    jar();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    // 盖子
    roundRectPath(ctx, 37, 4, 54, 9, 4);
    toon(ctx, 0x343a40, 37, 4, 54, 9, { noShine: true, lineW: 2.5 });
    // 底座
    poly(ctx, [
      [44, 46],
      [84, 46],
      [90, 60],
      [38, 60],
    ]);
    toon(ctx, 0x495057, 38, 46, 52, 14, { lineW: 2.5 });
    ball(ctx, 64, 53, 4, 0x4cc9f0, 2);
    // 旋转弧线
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.5;
    for (const [s, e] of [
      [2.6, 3.6],
      [-0.5, 0.5],
    ]) {
      ctx.beginPath();
      ctx.ellipse(64, 34, 46, 22, 0, s, e);
      ctx.stroke();
    }
  },

  // 炸药鸡腿：骨头柄 + 烤得焦黄的大鸡腿，绑两根红炸药，引信冒火花
  dynamite_drumstick: (ctx) => {
    bar(
      ctx,
      () => {
        ctx.moveTo(10, cy);
        ctx.lineTo(50, cy);
      },
      9,
      0xf8f1e5,
    );
    for (const dy of [-5, 5]) ball(ctx, 8, cy + dy, 5.5, 0xf8f1e5, 2.5);
    ctx.beginPath();
    ctx.moveTo(44, cy - 6);
    ctx.bezierCurveTo(58, cy - 8, 62, cy - 26, 90, cy - 26);
    ctx.bezierCurveTo(116, cy - 26, 125, cy - 12, 125, cy + 1);
    ctx.bezierCurveTo(125, cy + 16, 112, cy + 27, 88, cy + 27);
    ctx.bezierCurveTo(62, cy + 27, 58, cy + 8, 44, cy + 6);
    ctx.closePath();
    toon(ctx, 0xc97b3a, 44, cy - 26, 81, 53);
    ctx.strokeStyle = rgb(0xffd8a8, 0.8);
    ctx.lineWidth = 2;
    for (const [x, y] of [
      [64, cy - 12],
      [70, cy + 14],
      [114, cy - 12],
      [112, cy + 14],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 4, Math.PI * 1.1, Math.PI * 1.7);
      ctx.stroke();
    }
    // 炸药
    for (const x of [78, 93]) {
      roundRectPath(ctx, x, cy - 21, 12, 42, 3);
      toon(ctx, 0xd62828, x, cy - 21, 12, 42, { lineW: 2.5 });
      for (const y of [cy - 21, cy + 17]) {
        roundRectPath(ctx, x, y, 12, 4, 1.5);
        flatFill(ctx, 0xfff3e0, 2);
      }
    }
    // 绳子
    bar(
      ctx,
      () => {
        ctx.moveTo(72, cy + 2);
        ctx.quadraticCurveTo(92, cy + 6, 112, cy + 2);
      },
      3,
      0xe9c46a,
    );
    // 引信
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(84, cy - 21);
    ctx.quadraticCurveTo(80, 6, 68, 8);
    ctx.stroke();
    glow(ctx, 67, 8, 9, 0xff7b00, 0.9);
    sparkle(ctx, 67, 8, 6);
  },

  // 胡椒研磨枪：横放的木质花瓶形研磨瓶当枪身，顶上摇柄、下挂握把，金属枪口喷出胡椒粒
  pepper_grinder: (ctx) => {
    roundRectPath(ctx, 30, cy + 2, 16, 26, 5);
    toon(ctx, 0x4a2c17, 30, cy + 2, 16, 26, { noShine: true });
    bar(
      ctx,
      () => {
        ctx.arc(54, cy + 10, 7, 0, Math.PI);
      },
      2.5,
      0x343a40,
    );
    // 摇柄
    bar(
      ctx,
      () => {
        ctx.moveTo(18, cy - 6);
        ctx.lineTo(18, 9);
        ctx.lineTo(30, 9);
      },
      3,
      0xadb5bd,
    );
    ball(ctx, 32, 9, 4.5, 0x6f4518, 2);
    // 瓶身轮廓
    const top: [number, number][] = [
      [10, 6],
      [18, 9],
      [25, 9],
      [30, 7],
      [36, 9],
      [48, 15],
      [62, 16],
      [76, 11],
      [86, 9],
      [94, 12],
    ];
    const pts: [number, number][] = [
      ...top.map(([x, h]): [number, number] => [x, cy - h]),
      ...top.reverse().map(([x, h]): [number, number] => [x, cy + h]),
    ];
    smoothPath(ctx, pts);
    toon(ctx, 0x8b5a2b, 10, cy - 16, 84, 32);
    ctx.strokeStyle = rgb(0x4a2c17);
    ctx.lineWidth = 2;
    for (const x of [30, 84]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 8);
      ctx.lineTo(x, cy + 8);
      ctx.stroke();
    }
    ball(ctx, 8, cy, 5, 0xadb5bd, 2);
    roundRectPath(ctx, 94, cy - 6, 20, 12, 3);
    metal(ctx, 94, cy - 6, 20, 12, 0xadb5bd);
    roundRectPath(ctx, 110, cy - 4, 6, 8, 2);
    metal(ctx, 110, cy - 4, 6, 8, 0x495057);
    // 胡椒粒
    for (const [x, y, r] of [
      [120, cy - 7, 2.5],
      [123, cy + 2, 2.2],
      [119, cy + 8, 2],
    ]) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x - 2, y);
      ctx.stroke();
      dot(ctx, x, y, r + 1, 0x111111);
      dot(ctx, x, y, r, 0x3d2c2e);
    }
  },

  // 酱油炸弹：红盖尖嘴的酱油瓶身做成炸弹，瓶身贴标签，壶嘴里伸出点燃的引信
  soy_bomb: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(57, 12);
    ctx.lineTo(71, 12);
    ctx.lineTo(71, 24);
    ctx.bezierCurveTo(92, 28, 90, 61, 64, 61);
    ctx.bezierCurveTo(38, 61, 36, 28, 57, 24);
    ctx.closePath();
    toon(ctx, 0x4a1f0c, 40, 12, 48, 49);
    // 标签
    roundRectPath(ctx, 50, 36, 28, 16, 4);
    flatFill(ctx, 0xfff3e0, 2);
    ctx.beginPath();
    ctx.moveTo(64, 38);
    ctx.quadraticCurveTo(70, 46, 64, 50);
    ctx.quadraticCurveTo(58, 46, 64, 38);
    ctx.fillStyle = rgb(0xd62828);
    ctx.fill();
    // 红盖 + 壶嘴
    poly(ctx, [
      [70, 6],
      [80, 3],
      [81, 7],
      [72, 11],
    ]);
    toon(ctx, 0xd62828, 70, 3, 11, 8, { noShine: true, lineW: 2 });
    roundRectPath(ctx, 54, 4, 20, 10, 4);
    toon(ctx, 0xe63946, 54, 4, 20, 10, { lineW: 2.5 });
    // 引信
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(80, 5);
    ctx.quadraticCurveTo(92, 2, 96, 12);
    ctx.stroke();
    glow(ctx, 97, 13, 10, 0xff7b00, 0.9);
    sparkle(ctx, 97, 13, 6);
    // 铁箍
    for (const y of [27, 56]) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(57, 12);
      ctx.lineTo(71, 12);
      ctx.lineTo(71, 24);
      ctx.bezierCurveTo(92, 28, 90, 61, 64, 61);
      ctx.bezierCurveTo(38, 61, 36, 28, 57, 24);
      ctx.clip();
      ctx.fillStyle = rgb(0x8d99ae);
      ctx.fillRect(30, y - 2, 70, 4);
      ctx.restore();
    }
  },

  // 烧烤喷枪：橙色卡式气罐当握把，黄铜阀门 + 红旋钮，长喷管吐出蓝芯火焰和酱汁
  bbq_torch: (ctx) => {
    roundRectPath(ctx, 6, cy - 10, 40, 28, 8);
    toon(ctx, 0xf77f00, 6, cy - 10, 40, 28);
    roundRectPath(ctx, 12, cy - 2, 28, 10, 2);
    flatFill(ctx, 0xfff3e0, 2);
    ctx.beginPath();
    ctx.moveTo(26, cy - 1);
    ctx.quadraticCurveTo(31, cy + 4, 26, cy + 7);
    ctx.quadraticCurveTo(21, cy + 4, 26, cy - 1);
    ctx.fillStyle = rgb(0xe63946);
    ctx.fill();
    // 阀门
    roundRectPath(ctx, 42, cy - 10, 18, 18, 4);
    metal(ctx, 42, cy - 10, 18, 18, 0xe9c46a);
    bar(
      ctx,
      () => {
        ctx.moveTo(51, cy - 10);
        ctx.lineTo(51, cy - 17);
      },
      3,
      0xadb5bd,
    );
    ctx.beginPath();
    ctx.ellipse(51, cy - 20, 8, 4, 0, 0, TAU);
    toon(ctx, 0xd62828, 43, cy - 24, 16, 8, { lineW: 2 });
    // 扳机
    bar(
      ctx,
      () => {
        ctx.moveTo(50, cy + 8);
        ctx.quadraticCurveTo(52, cy + 16, 46, cy + 18);
      },
      3,
      0x343a40,
    );
    // 喷管
    roundRectPath(ctx, 58, cy - 5, 36, 7, 3);
    metal(ctx, 58, cy - 5, 36, 7, 0xadb5bd);
    roundRectPath(ctx, 90, cy - 8, 14, 13, 3);
    metal(ctx, 90, cy - 8, 14, 13, 0x6c757d);
    // 火焰
    glow(ctx, 114, cy - 1, 14, 0xff7b00, 0.7);
    ctx.beginPath();
    ctx.moveTo(103, cy - 8);
    ctx.quadraticCurveTo(118, cy - 12, 126, cy - 1);
    ctx.quadraticCurveTo(118, cy + 9, 103, cy + 6);
    ctx.closePath();
    toon(ctx, 0xff9f1c, 103, cy - 12, 23, 21, { noShine: true, lineW: 2 });
    ctx.beginPath();
    ctx.moveTo(103, cy - 4);
    ctx.quadraticCurveTo(113, cy - 5, 117, cy - 1);
    ctx.quadraticCurveTo(113, cy + 3, 103, cy + 2);
    ctx.closePath();
    ctx.fillStyle = rgb(0x4cc9f0);
    ctx.fill();
    for (const [x, y] of [
      [112, cy + 12],
      [120, cy + 8],
      [116, cy - 12],
    ]) {
      dot(ctx, x, y, 3, OUTLINE_NUM);
      dot(ctx, x, y, 2, 0x7f2a0a);
    }
  },

  // 果酱迫击炮：底座钢板 + 两脚架撑起斜向炮管，管口绑格子布，喷出一大坨红果酱
  jam_mortar: (ctx) => {
    roundRectPath(ctx, 6, 50, 46, 10, 4);
    metal(ctx, 6, 50, 46, 10, 0x6c757d);
    // 两脚架
    for (const x of [72, 84]) {
      bar(
        ctx,
        () => {
          ctx.moveTo(66, 34);
          ctx.lineTo(x, 60);
        },
        3,
        0x495057,
      );
    }
    ctx.save();
    ctx.translate(28, 52);
    ctx.rotate(-0.5);
    roundRectPath(ctx, -4, -10, 70, 20, 5);
    metal(ctx, -4, -10, 70, 20, 0x606c38);
    // 格子布
    ctx.save();
    roundRectPath(ctx, 48, -12, 14, 24, 3);
    ctx.clip();
    ctx.fillStyle = '#fff';
    ctx.fillRect(48, -12, 14, 24);
    ctx.fillStyle = rgb(0xe63946, 0.85);
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(48 + i * 4, -12, 2, 24);
      ctx.fillRect(48, -12 + i * 6, 14, 3);
    }
    ctx.restore();
    roundRectPath(ctx, 48, -12, 14, 24, 3);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    roundRectPath(ctx, 62, -12, 8, 24, 3);
    metal(ctx, 62, -12, 8, 24, 0x495057);
    ctx.restore();
    ball(ctx, 28, 50, 5, 0xadb5bd, 2);
    // 喷出的果酱
    ctx.beginPath();
    ctx.moveTo(86, 22);
    ctx.bezierCurveTo(84, 10, 96, 2, 108, 5);
    ctx.bezierCurveTo(124, 8, 126, 22, 116, 28);
    ctx.bezierCurveTo(114, 36, 110, 38, 108, 30);
    ctx.bezierCurveTo(100, 32, 96, 30, 94, 34);
    ctx.bezierCurveTo(92, 40, 87, 38, 88, 30);
    ctx.closePath();
    toon(ctx, 0xc1121f, 84, 3, 42, 37);
    for (const [x, y] of [
      [102, 14],
      [112, 18],
      [98, 22],
    ]) {
      dot(ctx, x, y, 1.8, 0x6a040f, 0.8);
    }
  },

  // 海胆雷：紫黑球体四面伸出长长的尖刺，中央一颗闪红光的引爆灯
  sea_urchin_mine: (ctx) => {
    const ox = 64,
      oy = cy + 1;
    const r = rng(77);
    for (let layer = 0; layer < 2; layer++) {
      const n = layer ? 16 : 18;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + (layer ? 0.18 : 0);
        const len = layer ? 21 : 28 + (r() - 0.5) * 3;
        const cos = Math.cos(a),
          sin = Math.sin(a);
        const ex = ox + cos * len,
          ey = oy + sin * Math.min(len, 29);
        ctx.beginPath();
        ctx.moveTo(ox + cos * 12 - sin * 3.4, oy + sin * 12 + cos * 3.4);
        ctx.lineTo(ex, ey);
        ctx.lineTo(ox + cos * 12 + sin * 3.4, oy + sin * 12 - cos * 3.4);
        ctx.closePath();
        flatFill(ctx, layer ? 0xe0aaff : 0x9d4edd, 1.3);
      }
    }
    ball(ctx, ox, oy, 15, 0x5a189a, 2.5);
    ctx.fillStyle = rgb(0xe0aaff, 0.9);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      dot(ctx, ox + Math.cos(a) * 9, oy + Math.sin(a) * 9, 1.6, 0xe0aaff, 0.9);
    }
    glow(ctx, ox, oy, 10, 0xff3b30, 0.9);
    dot(ctx, ox, oy, 4.5, 0xff3b30);
    dot(ctx, ox - 1.5, oy - 1.5, 1.5, 0xffffff);
  },

  // 海盐结界：悬浮的大块立方盐晶，外绕一圈轨道，小盐晶在轨道上环绕闪光
  salt_aura: (ctx) => {
    glow(ctx, 64, cy, 34, 0xcaf0f8, 0.7);
    ctx.strokeStyle = rgb(0xffffff, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(64, cy + 4, 50, 13, -0.1, Math.PI, TAU);
    ctx.stroke();
    cube(ctx, 104, cy - 6, 7);
    cube(ctx, 64, cy + 2, 20, 3);
    ctx.strokeStyle = rgb(0xffffff, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(64, cy + 4, 50, 13, -0.1, 0, Math.PI);
    ctx.stroke();
    cube(ctx, 22, cy + 10, 7);
    cube(ctx, 92, cy + 16, 5, 1.5);
    cube(ctx, 34, cy - 4, 4, 1.5);
    sparkle(ctx, 76, cy - 16, 6, 0xffffff);
    sparkle(ctx, 112, cy + 10, 4, 0xffffff);
    sparkle(ctx, 14, cy - 8, 4, 0xffffff);
  },

  // 可乐电击枪：横放的曲线可乐玻璃瓶当枪身，下挂握把，瓶口两根电极打出电弧和气泡
  cola_zapper: (ctx) => {
    roundRectPath(ctx, 38, cy + 4, 16, 24, 5);
    toon(ctx, 0xb5172b, 38, cy + 4, 16, 24, { noShine: true });
    const top: [number, number][] = [
      [8, 12],
      [14, 14],
      [24, 14],
      [34, 10],
      [44, 13],
      [58, 15],
      [70, 12],
      [80, 7],
      [90, 5],
      [98, 5],
    ];
    const pts: [number, number][] = [
      ...top.map(([x, h]): [number, number] => [x, cy - h]),
      ...top.reverse().map(([x, h]): [number, number] => [x, cy + h]),
    ];
    smoothPath(ctx, pts);
    toon(ctx, 0x5a1e0a, 8, cy - 15, 90, 30);
    // 红标签
    ctx.save();
    smoothPath(ctx, pts);
    ctx.clip();
    ctx.fillStyle = rgb(0xe63946);
    ctx.fillRect(40, cy - 16, 22, 32);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(40, cy + 4);
    ctx.bezierCurveTo(48, cy - 6, 54, cy + 10, 62, cy - 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(10, cy - 10, 80, 3);
    ctx.restore();
    smoothPath(ctx, pts);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    roundRectPath(ctx, 96, cy - 7, 6, 14, 2);
    metal(ctx, 96, cy - 7, 6, 14, 0xadb5bd);
    // 电极
    for (const dy of [-5, 5]) {
      bar(
        ctx,
        () => {
          ctx.moveTo(102, cy + dy);
          ctx.lineTo(110, cy + dy);
        },
        2.5,
        0xced4da,
      );
    }
    glow(ctx, 114, cy, 14, 0x9bf6ff, 0.8);
    bolt(
      ctx,
      [
        [110, cy - 5],
        [115, cy - 1],
        [111, cy + 1],
        [116, cy + 5],
        [110, cy + 5],
      ],
      0xfff3b0,
      2,
    );
    for (const [x, y, rr] of [
      [120, cy - 10, 3.5],
      [123, cy + 1, 2.5],
      [119, cy + 11, 3],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, TAU);
      ctx.fillStyle = 'rgba(255,230,200,0.6)';
      ctx.fill();
      ctx.strokeStyle = rgb(0x9bf6ff);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  },

  // 火锅吐息：铜火锅（太极鸳鸯锅底，红油漂辣椒）侧耳双环，锅沿喷出一道滚烫红油火流
  hotpot_breath: (ctx) => {
    // 喷流
    glow(ctx, 100, cy - 4, 22, 0xff5400, 0.6);
    ctx.beginPath();
    ctx.moveTo(70, cy - 12);
    ctx.bezierCurveTo(88, cy - 26, 104, cy - 14, 126, cy - 18);
    ctx.bezierCurveTo(118, cy - 8, 122, cy - 2, 112, cy + 2);
    ctx.bezierCurveTo(98, cy + 6, 86, cy - 6, 72, cy - 2);
    ctx.closePath();
    toon(ctx, 0xe85d04, 70, cy - 26, 56, 32, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(74, cy - 9);
    ctx.bezierCurveTo(90, cy - 18, 104, cy - 10, 118, cy - 13);
    ctx.bezierCurveTo(106, cy - 4, 92, cy - 8, 76, cy - 5);
    ctx.closePath();
    ctx.fillStyle = rgb(0xffd166);
    ctx.fill();
    for (const [x, y] of [
      [96, cy - 14],
      [112, cy - 8],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 1.8, -0.4, 0, TAU);
      flatFill(ctx, 0xd00000, 1.5);
    }
    // 双耳环
    for (const x of [8, 80]) {
      ctx.beginPath();
      ctx.arc(x, cy + 4, 6, 0, TAU);
      ctx.moveTo(x + 3, cy + 4);
      ctx.arc(x, cy + 4, 3, 0, TAU, true);
      metal(ctx, x - 6, cy - 2, 12, 12, 0xd4a373);
    }
    // 锅身
    ctx.beginPath();
    ctx.moveTo(10, cy - 4);
    ctx.lineTo(78, cy - 4);
    ctx.bezierCurveTo(78, cy + 18, 66, cy + 26, 44, cy + 26);
    ctx.bezierCurveTo(22, cy + 26, 10, cy + 18, 10, cy - 4);
    ctx.closePath();
    metal(ctx, 10, cy - 4, 68, 30, 0xc06c34);
    roundRectPath(ctx, 26, cy + 24, 36, 6, 2);
    metal(ctx, 26, cy + 24, 36, 6, 0x6c3a1a);
    // 锅口：红油 + 白汤太极
    ellipsePath(ctx, 44, cy - 4, 35, 10);
    flatFill(ctx, 0xb5651d, 3);
    ellipsePath(ctx, 44, cy - 4, 30, 7.5);
    ctx.fillStyle = rgb(0xd00000);
    ctx.fill();
    ctx.save();
    ellipsePath(ctx, 44, cy - 4, 30, 7.5);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(44, cy - 12);
    ctx.bezierCurveTo(56, cy - 8, 32, cy, 44, cy + 4);
    ctx.lineTo(80, cy + 4);
    ctx.lineTo(80, cy - 12);
    ctx.closePath();
    ctx.fillStyle = rgb(0xfff1d6);
    ctx.fill();
    ctx.strokeStyle = rgb(0xadb5bd);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(44, cy - 12);
    ctx.bezierCurveTo(56, cy - 8, 32, cy, 44, cy + 4);
    ctx.stroke();
    ctx.restore();
    for (const [x, y, a] of [
      [24, cy - 5, 0.3],
      [34, cy - 2, -0.5],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 4.5, 1.8, a, 0, TAU);
      flatFill(ctx, 0xff4d4d, 1.2);
    }
    dot(ctx, 58, cy - 5, 2, 0x52b788);
    dot(ctx, 64, cy - 2, 1.6, 0x52b788);
    ellipsePath(ctx, 44, cy - 4, 35, 10);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    // 热气
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2.5;
    for (const x of [28, 46]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 12);
      ctx.bezierCurveTo(x - 5, cy - 18, x + 5, cy - 22, x, cy - 28);
      ctx.stroke();
    }
  },

  // 南瓜鬼火灯：木杆挑着提环，下吊一盏刻脸发光的南瓜灯，旁边飘着一团绿色鬼火
  pumpkin_lantern: (ctx) => {
    handle(ctx, 4, 80, 9, 7, 0x6f4518);
    bar(
      ctx,
      () => {
        ctx.moveTo(78, 9);
        ctx.quadraticCurveTo(84, 9, 82, 16);
      },
      2.5,
      0x495057,
    );
    // 提环
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(62, cy + 6);
    ctx.quadraticCurveTo(64, 14, 82, 15);
    ctx.quadraticCurveTo(100, 14, 102, cy + 6);
    ctx.stroke();
    const px = 82,
      py = cy + 13;
    glow(ctx, px, py, 30, 0xffb703, 0.55);
    for (const [dx, rx, c] of [
      [-12, 13, 0xe85d04],
      [12, 13, 0xe85d04],
      [0, 14, 0xf48c06],
    ] as const) {
      ctx.beginPath();
      ctx.ellipse(px + dx, py, rx, 17, 0, 0, TAU);
      toon(ctx, c, px + dx - rx, py - 17, rx * 2, 34, { lineW: 2.5, noShine: dx !== 0 });
    }
    // 瓜蒂
    roundRectPath(ctx, px - 3, py - 22, 6, 7, 2);
    toon(ctx, 0x386641, px - 3, py - 22, 6, 7, { noShine: true, lineW: 2 });
    // 刻脸
    ctx.fillStyle = rgb(0xffe066);
    for (const s of [-1, 1]) {
      poly(ctx, [
        [px + s * 4, py - 2],
        [px + s * 13, py - 2],
        [px + s * 8.5, py - 10],
      ]);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(px - 15, py + 3);
    ctx.quadraticCurveTo(px, py + 18, px + 15, py + 3);
    ctx.lineTo(px + 9, py + 6);
    ctx.lineTo(px + 6, py + 3);
    ctx.lineTo(px + 2, py + 7);
    ctx.lineTo(px - 2, py + 3);
    ctx.lineTo(px - 6, py + 7);
    ctx.lineTo(px - 9, py + 3);
    ctx.closePath();
    ctx.fill();
    // 鬼火
    glow(ctx, 114, 26, 13, 0x80ffdb, 0.7);
    ctx.beginPath();
    ctx.moveTo(114, 14);
    ctx.quadraticCurveTo(116, 22, 121, 26);
    ctx.quadraticCurveTo(122, 35, 114, 35);
    ctx.quadraticCurveTo(106, 35, 107, 27);
    ctx.quadraticCurveTo(110, 22, 114, 14);
    toon(ctx, 0x52e3a5, 106, 14, 16, 21, { noShine: true, lineW: 2 });
    dot(ctx, 111.5, 28, 1.5, 0x1b4332);
    dot(ctx, 116.5, 28, 1.5, 0x1b4332);
  },

  // 孢子喷壶：长嘴浇花壶，壶盖是一顶红白点蘑菇帽，莲蓬头喷出紫绿孢子团
  spore_sprayer: (ctx) => {
    // 壶把
    bar(
      ctx,
      () => {
        ctx.moveTo(18, cy - 4);
        ctx.bezierCurveTo(2, cy - 4, 2, cy + 20, 18, cy + 20);
      },
      5,
      0x40916c,
    );
    // 壶嘴
    poly(ctx, [
      [62, cy + 12],
      [96, cy - 14],
      [100, cy - 10],
      [66, cy + 20],
    ]);
    toon(ctx, 0x52b788, 62, cy - 14, 38, 34, { noShine: true, lineW: 2.5 });
    ctx.save();
    ctx.translate(100, cy - 14);
    ctx.rotate(-0.7);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 9, 0, 0, TAU);
    metal(ctx, -4, -9, 8, 18, 0xadb5bd);
    ctx.restore();
    // 壶身
    roundRectPath(ctx, 16, cy - 8, 52, 34, 9);
    toon(ctx, 0x52b788, 16, cy - 8, 52, 34);
    ctx.strokeStyle = rgb(0x2d6a4f);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, cy + 16);
    ctx.lineTo(66, cy + 16);
    ctx.stroke();
    // 蘑菇帽壶盖
    ctx.beginPath();
    ctx.moveTo(18, cy - 6);
    ctx.bezierCurveTo(20, cy - 26, 64, cy - 26, 66, cy - 6);
    ctx.closePath();
    toon(ctx, 0xd62828, 18, cy - 22, 48, 16, { lineW: 2.5 });
    for (const [x, y, r] of [
      [30, cy - 12, 3.5],
      [44, cy - 17, 3],
      [56, cy - 11, 3.2],
    ]) {
      dot(ctx, x, y, r, 0xfff3e0);
    }
    // 孢子团
    for (const [x, y, r, c] of [
      [112, cy - 22, 6, 0xb388eb],
      [120, cy - 10, 5, 0x9ef01a],
      [109, cy - 4, 4, 0xb388eb],
      [122, cy - 25, 3.5, 0x9ef01a],
    ] as const) {
      ball(ctx, x, y, r, c, 2);
      dot(ctx, x - r * 0.3, y + r * 0.2, r * 0.25, darken(c, 0.4));
    }
  },

  // 椰壳拳套：红色绑带腕套 + 棕色毛椰壳拳头（顶上一道拇指），拳面有椰子的三个"眼"，交界露一圈白椰肉
  coconut_gloves: (ctx) => {
    roundRectPath(ctx, 4, cy - 15, 32, 30, 6);
    toon(ctx, 0xd62828, 4, cy - 15, 32, 30, { noShine: true });
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    for (const x of [12, 20, 28]) {
      ctx.beginPath();
      ctx.moveTo(x - 3, cy - 11);
      ctx.lineTo(x + 3, cy - 3);
      ctx.moveTo(x + 3, cy - 11);
      ctx.lineTo(x - 3, cy - 3);
      ctx.stroke();
    }
    const glove = () => {
      ctx.beginPath();
      ctx.moveTo(34, cy - 17);
      ctx.bezierCurveTo(46, cy - 22, 54, cy - 29, 80, cy - 29);
      ctx.bezierCurveTo(108, cy - 29, 125, cy - 16, 125, cy + 2);
      ctx.bezierCurveTo(125, cy + 22, 106, cy + 29, 80, cy + 29);
      ctx.bezierCurveTo(56, cy + 29, 46, cy + 22, 34, cy + 17);
      ctx.closePath();
    };
    glove();
    toon(ctx, 0x8b5a2b, 34, cy - 29, 91, 58);
    const r = rng(9);
    ctx.save();
    glove();
    ctx.clip();
    ctx.strokeStyle = rgb(0xd4a373, 0.7);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 46; i++) {
      const x = 40 + r() * 82,
        y = cy - 26 + r() * 52;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 5, y + (r() - 0.5) * 4);
      ctx.stroke();
    }
    ctx.restore();
    // 拇指缝线
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(44, cy - 2);
    ctx.bezierCurveTo(58, cy - 6, 84, cy - 8, 96, cy - 16);
    ctx.bezierCurveTo(100, cy - 20, 96, cy - 24, 90, cy - 24);
    ctx.stroke();
    ctx.strokeStyle = rgb(0xd4a373, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, cy - 7);
    ctx.bezierCurveTo(62, cy - 10, 80, cy - 12, 90, cy - 18);
    ctx.stroke();
    // 椰眼
    for (const [x, y] of [
      [104, cy + 6],
      [112, cy + 1],
      [111, cy + 12],
    ]) {
      dot(ctx, x, y, 4, 0x2b1a0e);
      dot(ctx, x - 1, y - 1, 1.2, 0x7f5539);
    }
    // 白椰肉
    ctx.beginPath();
    ctx.moveTo(33, cy - 18);
    ctx.quadraticCurveTo(42, cy, 33, cy + 18);
    ctx.lineTo(39, cy + 20);
    ctx.quadraticCurveTo(48, cy, 39, cy - 20);
    ctx.closePath();
    flatFill(ctx, 0xfffcf2, 2.5);
  },

  // 芦笋长弓：竖着的芦笋茎弓身（两端是紫绿笋尖），拉满的弦上搭一支芦笋尖箭
  asparagus_bow: (ctx) => {
    // 弦
    ctx.strokeStyle = rgb(0xfefae0);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(66, 5);
    ctx.lineTo(28, cy);
    ctx.lineTo(66, 59);
    ctx.stroke();
    // 弓身
    bar(
      ctx,
      () => {
        ctx.moveTo(66, 5);
        ctx.quadraticCurveTo(108, cy, 66, 59);
      },
      7,
      0x6a994e,
    );
    ctx.fillStyle = rgb(0x386641);
    for (const t of [0.15, 0.3, 0.7, 0.85]) {
      const x = (1 - t) * (1 - t) * 66 + 2 * t * (1 - t) * 108 + t * t * 66;
      const y = (1 - t) * (1 - t) * 5 + 2 * t * (1 - t) * cy + t * t * 59;
      poly(ctx, [
        [x - 3, y - 2],
        [x + 3, y - 2],
        [x, y + 3],
      ]);
      ctx.fill();
    }
    for (const [y, a] of [
      [5, -2.3],
      [59, 2.3],
    ]) {
      ctx.save();
      ctx.translate(66, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(3, 0, 6, 4, 0, 0, TAU);
      toon(ctx, 0x8e5bc4, -3, -4, 12, 8, { noShine: true, lineW: 2 });
      ctx.restore();
    }
    roundRectPath(ctx, 82, cy - 7, 7, 14, 2);
    toon(ctx, 0x8d5b3a, 82, cy - 7, 7, 14, { noShine: true, lineW: 2 });
    // 箭
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(36, cy + s * 4, 8, 3, s * 0.4, 0, TAU);
      toon(ctx, 0x95d5b2, 28, cy - 7, 16, 14, { noShine: true, lineW: 2 });
    }
    roundRectPath(ctx, 28, cy - 2, 82, 4, 2);
    toon(ctx, 0x90be6d, 28, cy - 2, 82, 4, { noShine: true, lineW: 2 });
    ctx.beginPath();
    ctx.moveTo(106, cy - 5);
    ctx.quadraticCurveTo(118, cy - 6, 125, cy);
    ctx.quadraticCurveTo(118, cy + 6, 106, cy + 5);
    ctx.closePath();
    toon(ctx, 0x6a994e, 106, cy - 6, 19, 12, { lineW: 2 });
    ctx.strokeStyle = rgb(0x386641);
    ctx.lineWidth = 1.5;
    for (const x of [110, 116]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 4);
      ctx.lineTo(x + 4, cy);
      ctx.lineTo(x, cy + 4);
      ctx.stroke();
    }
  },

  // 拐杖糖锤：红白螺旋条纹的粗拐杖糖，右端大弯钩，弯处系绿缎带蝴蝶结
  candy_cane: (ctx) => {
    const path = () => {
      ctx.moveTo(8, cy + 12);
      ctx.lineTo(96, cy + 12);
      ctx.arc(96, cy - 5, 17, Math.PI / 2, -Math.PI * 0.95, true);
    };
    bar(ctx, path, 14, 0xfff8f0, [7, 7], 0xe63946);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(12, cy + 8);
    ctx.lineTo(94, cy + 8);
    ctx.stroke();
    // 蝴蝶结
    for (const s of [-1, 1]) {
      poly(ctx, [
        [86, cy + 12],
        [86 + s * 9, cy + 4],
        [86 + s * 9, cy + 20],
      ]);
      toon(ctx, 0x2d6a4f, 77, cy + 4, 18, 16, { noShine: true, lineW: 2 });
    }
    ball(ctx, 86, cy + 12, 3.5, 0x40916c, 2);
  },

  // 马卡龙连发：薄荷色玩具手枪，上下并排双枪管，枪背上插着两枚彩色马卡龙当弹匣
  macaron_gun: (ctx) => {
    ctx.save();
    ctx.translate(26, cy + 2);
    ctx.rotate(0.2);
    roundRectPath(ctx, -9, 0, 18, 26, 6);
    toon(ctx, 0xffafcc, -9, 0, 18, 26, { noShine: true });
    ctx.restore();
    bar(
      ctx,
      () => {
        ctx.arc(46, cy + 6, 7, 0.1, Math.PI - 0.1);
      },
      2.5,
      0xffafcc,
    );
    for (const y of [cy - 12, cy - 4]) {
      roundRectPath(ctx, 80, y, 38, 7, 3);
      metal(ctx, 80, y, 38, 7, 0xe9ecef);
      ctx.beginPath();
      ctx.ellipse(118, y + 3.5, 2, 3, 0, 0, TAU);
      flatFill(ctx, 0x495057, 1.5);
    }
    roundRectPath(ctx, 8, cy - 14, 76, 20, 8);
    toon(ctx, 0x95d5b2, 8, cy - 14, 76, 20);
    // 马卡龙
    const mac = (x: number, y: number, c: number) => {
      for (const dy of [-4, 4]) {
        ctx.beginPath();
        ctx.ellipse(x, y + dy, 11, 4.5, 0, 0, TAU);
        toon(ctx, c, x - 11, y + dy - 4.5, 22, 9, { lineW: 2 });
        ctx.strokeStyle = rgb(darken(c, 0.2));
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(x - 9, y + dy + 2.5);
        ctx.lineTo(x + 9, y + dy + 2.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      roundRectPath(ctx, x - 9, y - 1.5, 18, 3, 1.5);
      flatFill(ctx, 0xfff8f0, 1.5);
    };
    mac(34, cy - 22, 0xff8fab);
    mac(60, cy - 22, 0xb8a1e3);
  },

  // 奶油喷枪：布裱花袋，尾端拧成麻花扎绳，前端金属星形裱花嘴挤出一朵奶油花
  cream_torch: (ctx) => {
    // 拧尾
    for (const [x, y] of [
      [8, cy - 3],
      [12, cy + 3],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 4, 0.6, 0, TAU);
      toon(ctx, 0xdee2e6, x - 6, y - 4, 12, 8, { noShine: true, lineW: 2 });
    }
    roundRectPath(ctx, 15, cy - 7, 6, 14, 2);
    toon(ctx, 0xe63946, 15, cy - 7, 6, 14, { noShine: true, lineW: 2 });
    const bag = () => {
      ctx.beginPath();
      ctx.moveTo(20, cy - 14);
      ctx.quadraticCurveTo(60, cy - 22, 96, cy - 5);
      ctx.lineTo(96, cy + 5);
      ctx.quadraticCurveTo(60, cy + 22, 20, cy + 14);
      ctx.quadraticCurveTo(16, cy, 20, cy - 14);
      ctx.closePath();
    };
    bag();
    toon(ctx, 0xf1f6fa, 20, cy - 20, 76, 40);
    ctx.save();
    bag();
    ctx.clip();
    ctx.fillStyle = rgb(0xffc8dd, 0.55);
    ctx.beginPath();
    ctx.moveTo(50, cy + 20);
    ctx.quadraticCurveTo(70, cy - 4, 100, cy - 2);
    ctx.lineTo(100, cy + 20);
    ctx.fill();
    ctx.strokeStyle = rgb(0xadb5bd, 0.8);
    ctx.lineWidth = 1.5;
    for (const x of [40, 62]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 16);
      ctx.quadraticCurveTo(x + 6, cy, x, cy + 16);
      ctx.stroke();
    }
    ctx.restore();
    // 裱花嘴
    poly(ctx, [
      [94, cy - 7],
      [108, cy - 4],
      [108, cy + 4],
      [94, cy + 7],
    ]);
    metal(ctx, 94, cy - 7, 14, 14, 0xced4da);
    ctx.strokeStyle = rgb(0x6c757d);
    ctx.lineWidth = 1.5;
    for (const dy of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(97, cy + dy * 1.4);
      ctx.lineTo(107, cy + dy);
      ctx.stroke();
    }
    // 奶油花
    for (const [x, y, r] of [
      [113, cy + 4, 7],
      [113, cy - 4, 7],
      [119, cy, 6],
      [117, cy - 8, 4],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      toon(ctx, 0xfff8f0, x - r, y - r, r * 2, r * 2, { lineW: 2, noShine: true });
    }
    ctx.strokeStyle = rgb(0xffafcc);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(115, cy, 4, 0, Math.PI * 1.5);
    ctx.stroke();
  },

  // 甜甜圈飞环：粉色糖霜甜甜圈（波浪糖霜边 + 彩针糖），左侧拖着飞行速度线
  donut_ring: (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    for (const [y, x0] of [
      [cy - 14, 14],
      [cy, 6],
      [cy + 14, 14],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(36, y);
      ctx.stroke();
    }
    const ox = 74;
    ctx.beginPath();
    ctx.arc(ox, cy, 29, 0, TAU);
    ctx.moveTo(ox + 9, cy);
    ctx.arc(ox, cy, 9, 0, TAU, true);
    toon(ctx, 0xd99a5b, ox - 29, cy - 29, 58, 58);
    // 糖霜
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * TAU;
      const rr = 24 + Math.sin(a * 7) * 2.2 + (i % 12 === 0 ? 2.5 : 0);
      const x = ox + Math.cos(a) * rr,
        y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.moveTo(ox + 12, cy);
    ctx.arc(ox, cy, 12, 0, TAU, true);
    toon(ctx, 0xff8fab, ox - 26, cy - 26, 52, 52, { lineW: 2.5 });
    const r = rng(31);
    const cs = [0xffffff, 0x4cc9f0, 0xffd166, 0x80ed99, 0x9d4edd];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + r() * 0.3;
      const rr = 15 + r() * 7;
      const x = ox + Math.cos(a) * rr,
        y = cy + Math.sin(a) * rr;
      const t = r() * Math.PI;
      ctx.strokeStyle = rgb(cs[i % cs.length]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(t) * 2.5, y - Math.sin(t) * 2.5);
      ctx.lineTo(x + Math.cos(t) * 2.5, y + Math.sin(t) * 2.5);
      ctx.stroke();
    }
  },

  // 焦糖光环：悬浮的小碟焦糖布丁，顶上深色焦糖往下流淌，冒着香甜热气
  caramel_aura: (ctx) => {
    glow(ctx, 64, cy + 2, 34, 0xffb703, 0.7);
    ellipsePath(ctx, 64, cy + 21, 36, 8);
    toon(ctx, 0xf8f9fa, 28, cy + 13, 72, 16, { noShine: true });
    ellipsePath(ctx, 64, cy + 19, 30, 5);
    ctx.fillStyle = rgb(0xa0522d, 0.9);
    ctx.fill();
    // 布丁身
    ctx.beginPath();
    ctx.moveTo(46, cy - 10);
    ctx.lineTo(82, cy - 10);
    ctx.lineTo(90, cy + 16);
    ctx.quadraticCurveTo(64, cy + 24, 38, cy + 16);
    ctx.closePath();
    toon(ctx, 0xffd166, 38, cy - 10, 52, 30);
    // 焦糖顶 + 流淌
    ctx.beginPath();
    ctx.moveTo(44, cy - 10);
    ctx.lineTo(84, cy - 10);
    ctx.lineTo(85, cy - 2);
    ctx.quadraticCurveTo(84, cy + 6, 81, cy + 1);
    ctx.quadraticCurveTo(76, cy - 4, 72, cy);
    ctx.quadraticCurveTo(70, cy + 10, 66, cy + 2);
    ctx.quadraticCurveTo(60, cy - 4, 56, cy - 1);
    ctx.quadraticCurveTo(52, cy + 7, 49, cy);
    ctx.lineTo(44, cy - 3);
    ctx.closePath();
    toon(ctx, 0x9c4a1a, 44, cy - 10, 41, 18, { noShine: true, lineW: 2.5 });
    ellipsePath(ctx, 64, cy - 10, 20, 5);
    toon(ctx, 0xb5651d, 44, cy - 15, 40, 10, { lineW: 2.5 });
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(57, cy - 11, 6, 1.8, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2.5;
    for (const x of [54, 72]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 17);
      ctx.bezierCurveTo(x - 5, cy - 21, x + 5, cy - 25, x, cy - 29);
      ctx.stroke();
    }
  },

  // 巧克力地雷：扁圆盘地雷，雷身是一格格巧克力块，顶上压力钮亮红灯，巧克力酱沿边淌下
  choco_mine: (ctx) => {
    roundRectPath(ctx, 18, cy + 2, 92, 22, 9);
    toon(ctx, 0x5e3023, 18, cy + 2, 92, 22);
    ctx.strokeStyle = rgb(0x3b1d12);
    ctx.lineWidth = 2;
    for (const x of [36, 54, 74, 92]) {
      ctx.beginPath();
      ctx.moveTo(x, cy + 6);
      ctx.lineTo(x, cy + 22);
      ctx.stroke();
    }
    ellipsePath(ctx, 64, cy + 2, 46, 10);
    toon(ctx, 0x7f4f24, 18, cy - 8, 92, 20, { noShine: true, lineW: 3 });
    // 淌下的巧克力酱
    ctx.beginPath();
    ctx.moveTo(22, cy + 2);
    ctx.quadraticCurveTo(64, cy + 16, 106, cy + 2);
    ctx.lineTo(106, cy + 7);
    ctx.quadraticCurveTo(103, cy + 16, 100, cy + 9);
    ctx.quadraticCurveTo(86, cy + 14, 82, cy + 12);
    ctx.quadraticCurveTo(80, cy + 22, 76, cy + 12);
    ctx.quadraticCurveTo(58, cy + 16, 50, cy + 12);
    ctx.quadraticCurveTo(47, cy + 19, 44, cy + 11);
    ctx.quadraticCurveTo(30, cy + 10, 22, cy + 6);
    ctx.closePath();
    toon(ctx, 0x9c6644, 22, cy + 2, 84, 20, { noShine: true, lineW: 2 });
    // 压力钮
    roundRectPath(ctx, 48, cy - 12, 32, 12, 5);
    metal(ctx, 48, cy - 12, 32, 12, 0x6c757d);
    ellipsePath(ctx, 64, cy - 12, 16, 4);
    metal(ctx, 48, cy - 16, 32, 8, 0xadb5bd);
    glow(ctx, 64, cy - 14, 10, 0xff3b30, 0.9);
    dot(ctx, 64, cy - 14, 3.5, 0xff3b30);
    for (const [x, y] of [
      [32, cy + 1],
      [96, cy + 1],
    ]) {
      roundRectPath(ctx, x - 5, y - 3, 10, 6, 2);
      flatFill(ctx, 0x4a2511, 1.5);
    }
  },

  // 跳跳糖电击：锯齿封口的粉色跳跳糖小包，撕开的口子撒出彩色糖晶，糖晶间噼啪打着电火花
  popping_candy: (ctx) => {
    ctx.save();
    ctx.translate(44, cy + 4);
    ctx.rotate(-0.3);
    const pts: [number, number][] = [];
    for (let i = 0; i <= 8; i++) pts.push([-34 + (i % 2) * 4, -20 + i * 5]);
    for (let i = 8; i >= 0; i--) pts.push([30 - (i % 2) * 5, -20 + i * 5]);
    poly(ctx, pts);
    toon(ctx, 0xff4d6d, -34, -20, 64, 40);
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU - Math.PI / 2;
      const rr = k % 2 ? 9 : 13;
      ctx.lineTo(-4 + Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    flatFill(ctx, 0xffd166, 2);
    ctx.fillStyle = rgb(0xd00000);
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POP', -4, 3);
    ctx.restore();
    // 糖晶
    const r = rng(5);
    const cs = [0xff8fab, 0x4cc9f0, 0xffd166, 0x80ed99, 0xc77dff];
    for (let i = 0; i < 9; i++) {
      const x = 82 + r() * 40,
        y = 8 + r() * 40;
      const s = 2.5 + r() * 2;
      poly(ctx, [
        [x, y - s],
        [x + s, y],
        [x, y + s],
        [x - s, y],
      ]);
      flatFill(ctx, cs[i % cs.length], 1.5);
    }
    glow(ctx, 100, 22, 16, 0xfff3b0, 0.6);
    bolt(
      ctx,
      [
        [84, 24],
        [94, 14],
        [98, 22],
        [110, 10],
      ],
      0xfff3b0,
    );
    bolt(
      ctx,
      [
        [92, 36],
        [104, 32],
        [106, 40],
        [120, 34],
      ],
      0x9bf6ff,
    );
    sparkle(ctx, 118, 18, 5, 0xffffff);
  },

  // 冰棍刺剑：冰棍木棒当握柄，冰晶护手 + 护手弓，细长冰棍刀身是蓝白红三色火箭冰棍，尖头挂霜
  popsicle_blade: (ctx) => {
    roundRectPath(ctx, 4, cy - 5, 36, 10, 5);
    toon(ctx, 0xe9c46a, 4, cy - 5, 36, 10, { noShine: true, lineW: 2.5 });
    bar(
      ctx,
      () => {
        ctx.moveTo(42, cy + 12);
        ctx.quadraticCurveTo(30, cy + 20, 10, cy + 8);
      },
      3,
      0x90e0ef,
    );
    ctx.beginPath();
    ctx.ellipse(43, cy, 5, 14, 0, 0, TAU);
    toon(ctx, 0x90e0ef, 38, cy - 14, 10, 28, { lineW: 2.5 });
    const blade = () => {
      ctx.beginPath();
      ctx.moveTo(47, cy - 7);
      ctx.quadraticCurveTo(100, cy - 6, 125, cy);
      ctx.quadraticCurveTo(100, cy + 6, 47, cy + 7);
      ctx.closePath();
    };
    blade();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.save();
    blade();
    ctx.clip();
    ctx.fillStyle = rgb(0x4895ef);
    ctx.fillRect(46, cy - 8, 26, 16);
    ctx.fillStyle = rgb(0xf8f9fa);
    ctx.fillRect(72, cy - 8, 24, 16);
    ctx.fillStyle = rgb(0xef233c);
    ctx.fillRect(96, cy - 8, 32, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(46, cy - 5, 80, 2.5);
    ctx.restore();
    blade();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // 滴水 + 霜
    ctx.beginPath();
    ctx.moveTo(84, cy + 4);
    ctx.quadraticCurveTo(83, cy + 11, 85, cy + 12);
    ctx.quadraticCurveTo(87, cy + 11, 87, cy + 4);
    ctx.closePath();
    flatFill(ctx, 0xcaf0f8, 1.5);
    glow(ctx, 118, cy, 10, 0xcaf0f8, 0.8);
    sparkle(ctx, 112, cy - 9, 5, 0xffffff);
    sparkle(ctx, 62, cy - 10, 3.5, 0xffffff);
  },

  // 雪糕大锤：木柄 + 巧克力脆皮雪糕当锤头（顶角被咬了一口露出香草芯），底下结冰挂冰凌
  icecream_hammer: (ctx) => {
    handle(ctx, 4, 76, cy, 11);
    const x0 = 72,
      x1 = 120,
      t = cy - 27,
      b = cy + 22;
    const head = () => {
      ctx.beginPath();
      ctx.moveTo(x0 + 8, t);
      ctx.lineTo(96, t);
      ctx.arc(102, t, 6, Math.PI, 0, true);
      ctx.arc(114, t + 4, 6, Math.PI * 1.1, Math.PI * 0.4, true);
      ctx.lineTo(x1, b - 8);
      ctx.arcTo(x1, b, x1 - 8, b, 8);
      ctx.lineTo(x0 + 8, b);
      ctx.arcTo(x0, b, x0, b - 8, 8);
      ctx.lineTo(x0, t + 8);
      ctx.arcTo(x0, t, x0 + 8, t, 8);
      ctx.closePath();
    };
    head();
    toon(ctx, 0x5e3023, x0, t, x1 - x0, b - t, { lineW: 3 });
    // 咬口露出的香草芯
    ctx.save();
    head();
    ctx.clip();
    ctx.strokeStyle = rgb(0xfff3d6);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(102, t, 6, Math.PI, 0, true);
    ctx.arc(114, t + 4, 6, Math.PI * 1.1, Math.PI * 0.4, true);
    ctx.stroke();
    // 脆皮坚果碎
    ctx.fillStyle = rgb(0xd4a373);
    for (const [x, y] of [
      [82, cy - 14],
      [94, cy - 4],
      [84, cy + 6],
      [106, cy + 4],
      [110, cy - 10],
    ]) {
      ctx.fillRect(x, y, 3, 2.5);
    }
    // 结冰
    ctx.fillStyle = rgb(0xcaf0f8, 0.75);
    ctx.fillRect(x0 - 2, b - 9, x1 - x0 + 4, 12);
    ctx.restore();
    head();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    // 冰凌
    for (const [x, len] of [
      [80, 8],
      [90, 6],
      [100, 9],
      [110, 6],
    ]) {
      poly(ctx, [
        [x - 4, b - 1],
        [x + 4, b - 1],
        [x, b + len],
      ]);
      flatFill(ctx, 0xcaf0f8, 1.8, rgb(0x48cae4));
    }
    sparkle(ctx, 76, cy - 22, 5, 0xffffff);
  },
};
