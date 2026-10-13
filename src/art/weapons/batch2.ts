// 武器专属造型 · 第 2 批：规则生成（二）
// 每个函数在 128×64 画布上画一把武器：手柄 / 握把在左、朝右，中线 y = 32，描边统一用 OUTLINE，上色用 toon / metal
import { type Ctx, OUTLINE, rgb, toon, ellipsePath, roundRectPath, starPath, glow } from '../Painter';
import { handle, metal } from '../weaponKit';

const cy = 32;

/** 折线闪电：先粗描边再亮色 */
const bolt = (ctx: Ctx, pts: [number, number][], c = 0x9bf6ff, w = 2.5) => {
  for (const [lw, col] of [
    [w + 2.5, OUTLINE],
    [w, rgb(c)],
  ] as const) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
};

/** 粗描边线条（先描边色再本色） */
const line = (ctx: Ctx, pts: [number, number][], c: number, w: number) => {
  for (const [lw, col] of [
    [w + 3, OUTLINE],
    [w, rgb(c)],
  ] as const) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
};

/** 实心小圆点 */
const dots = (ctx: Ctx, pts: number[][], c: string) => {
  ctx.fillStyle = c;
  for (const [x, y, r] of pts) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
};

/** 枪托握把（斜向下） */
const grip = (ctx: Ctx, x: number, y: number, c: number) => {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 16, y);
  ctx.lineTo(x + 12, y + 24);
  ctx.lineTo(x - 4, y + 24);
  ctx.closePath();
  toon(ctx, c, x - 4, y, 20, 24, { noShine: true, lineW: 3 });
};

/** 六角雪花 */
const snowflake = (ctx: Ctx, x: number, y: number, r: number, c: string, w: number) => {
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const ex = x + Math.cos(a) * r,
      ey = y + Math.sin(a) * r;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    const mx = x + Math.cos(a) * r * 0.55,
      my = y + Math.sin(a) * r * 0.55;
    for (const s of [-0.7, 0.7]) {
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(a + s) * r * 0.35, my + Math.sin(a + s) * r * 0.35);
    }
    ctx.stroke();
  }
};

export const ART: Record<string, (ctx: Ctx) => void> = {
  // 刨冰机枪：方形枪身顶着手摇刨冰机（冰碗 + 红糖浆冰山 + 摇柄），短枪管喷冰屑
  shaved_ice_gun(ctx) {
    grip(ctx, 18, cy + 4, 0x1d3557);
    roundRectPath(ctx, 8, cy - 6, 84, 20, 6);
    toon(ctx, 0x48cae4, 8, cy - 6, 84, 20);
    for (const dy of [-1, 5]) {
      roundRectPath(ctx, 90, cy + dy - 3, 26, 6, 3);
      metal(ctx, 90, cy + dy - 3, 26, 6, 0x8d99ae);
    }
    // 冰碗
    ctx.beginPath();
    ctx.moveTo(28, cy - 8);
    ctx.lineTo(76, cy - 8);
    ctx.lineTo(70, cy - 18);
    ctx.lineTo(34, cy - 18);
    ctx.closePath();
    toon(ctx, 0xf8f9fa, 28, cy - 18, 48, 10, { noShine: true, lineW: 2.5 });
    // 刨冰山
    ctx.beginPath();
    ctx.moveTo(34, cy - 18);
    ctx.quadraticCurveTo(52, cy - 42, 70, cy - 18);
    ctx.closePath();
    toon(ctx, 0xffffff, 34, cy - 30, 36, 12, { lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(42, cy - 25);
    ctx.quadraticCurveTo(52, cy - 34, 62, cy - 25);
    ctx.quadraticCurveTo(56, cy - 20, 52, cy - 24);
    ctx.quadraticCurveTo(48, cy - 20, 42, cy - 25);
    ctx.fillStyle = rgb(0xef233c);
    ctx.fill();
    // 摇柄
    line(
      ctx,
      [
        [80, cy - 2],
        [86, cy - 22],
        [94, cy - 22],
      ],
      0xadb5bd,
      3,
    );
    ellipsePath(ctx, 96, cy - 22, 4, 4);
    toon(ctx, 0xef233c, 92, cy - 26, 8, 8, { lineW: 2, noShine: true });
    dots(
      ctx,
      [
        [120, cy - 4, 2.5],
        [124, cy + 4, 2],
        [119, cy + 9, 1.8],
        [125, cy - 10, 1.5],
      ],
      'rgba(220,245,255,0.95)',
    );
  },

  // 冰沙喷雾：带拱形盖和吸管的冰沙杯当储罐，前接扳机喷头，喷出蓝色冰沙雾
  slush_spray(ctx) {
    // 冰沙杯
    ctx.beginPath();
    ctx.moveTo(8, cy - 14);
    ctx.lineTo(46, cy - 14);
    ctx.lineTo(42, cy + 26);
    ctx.lineTo(12, cy + 26);
    ctx.closePath();
    toon(ctx, 0x4361ee, 8, cy - 14, 38, 40);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = rgb(0xf72585, 0.85);
    ctx.fillRect(0, cy - 2, 60, 8);
    ctx.fillStyle = rgb(0x4cc9f0, 0.9);
    ctx.fillRect(0, cy + 12, 60, 8);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(6, cy - 14);
    ctx.quadraticCurveTo(27, cy - 34, 48, cy - 14);
    ctx.closePath();
    toon(ctx, 0xe0fbfc, 6, cy - 26, 42, 12, { lineW: 2.5 });
    line(
      ctx,
      [
        [30, cy - 22],
        [38, cy - 30],
      ],
      0xff006e,
      2.5,
    );
    // 喷头
    ctx.beginPath();
    ctx.moveTo(44, cy - 8);
    ctx.lineTo(76, cy - 10);
    ctx.lineTo(84, cy - 4);
    ctx.lineTo(84, cy + 2);
    ctx.lineTo(56, cy + 4);
    ctx.lineTo(48, cy + 14);
    ctx.lineTo(44, cy + 4);
    ctx.closePath();
    toon(ctx, 0xf8f9fa, 44, cy - 10, 40, 24, { lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(62, cy + 4);
    ctx.quadraticCurveTo(70, cy + 8, 66, cy + 18);
    ctx.lineTo(60, cy + 16);
    ctx.quadraticCurveTo(62, cy + 10, 58, cy + 4);
    ctx.closePath();
    toon(ctx, 0x4cc9f0, 58, cy + 4, 12, 14, { noShine: true, lineW: 2 });
    roundRectPath(ctx, 82, cy - 6, 8, 7, 2);
    metal(ctx, 82, cy - 6, 8, 7, 0x4361ee);
    // 雾
    glow(ctx, 108, cy - 3, 18, 0x90e0ef, 0.8);
    dots(
      ctx,
      [
        [100, cy - 6, 3],
        [108, cy + 2, 2.5],
        [114, cy - 9, 2.5],
        [120, cy - 1, 2],
        [110, cy - 14, 1.8],
        [122, cy + 8, 1.8],
      ],
      'rgba(230,250,255,0.95)',
    );
  },

  // 寒霜光环：悬浮的六角大雪花冰晶，中心一颗冰钻，外圈寒气
  frost_aura(ctx) {
    glow(ctx, 64, cy, 32, 0xa9def9, 0.85);
    snowflake(ctx, 64, cy, 27, OUTLINE, 8);
    snowflake(ctx, 64, cy, 27, rgb(0xcaf0f8), 4);
    snowflake(ctx, 64, cy, 26, 'rgba(255,255,255,0.9)', 1.5);
    starPath(ctx, 64, cy, 11, 6, 6, 0);
    toon(ctx, 0x48cae4, 53, cy - 11, 22, 22, { lineW: 2.5 });
    dots(
      ctx,
      [
        [34, cy - 22, 2],
        [96, cy + 20, 2],
        [96, cy - 24, 1.5],
        [32, cy + 22, 1.5],
      ],
      '#ffffff',
    );
  },

  // 冰川迫击炮：一整块凿成炮身的多棱冰川巨冰（顶上积雪、冰裂纹），平放微翘，右端炮口吐出冰山块
  glacier_mortar(ctx) {
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(6, cy + 4);
      ctx.lineTo(14, cy - 16);
      ctx.lineTo(40, cy - 24);
      ctx.lineTo(70, cy - 22);
      ctx.lineTo(92, cy - 26);
      ctx.lineTo(100, cy - 8);
      ctx.lineTo(98, cy + 16);
      ctx.lineTo(80, cy + 26);
      ctx.lineTo(30, cy + 27);
      ctx.lineTo(10, cy + 20);
      ctx.closePath();
    };
    glow(ctx, 56, cy, 40, 0xcaf0f8, 0.35);
    body();
    toon(ctx, 0x90e0ef, 6, cy - 26, 94, 53, { lineW: 3 });
    ctx.save();
    body();
    ctx.clip();
    // 棱面
    ctx.fillStyle = rgb(0x4895ef, 0.35);
    ctx.beginPath();
    ctx.moveTo(60, cy + 30);
    ctx.lineTo(70, cy - 2);
    ctx.lineTo(104, cy - 6);
    ctx.lineTo(104, cy + 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgb(0xffffff, 0.3);
    ctx.beginPath();
    ctx.moveTo(14, cy - 16);
    ctx.lineTo(40, cy - 24);
    ctx.lineTo(34, cy - 2);
    ctx.lineTo(10, cy + 2);
    ctx.closePath();
    ctx.fill();
    // 冰裂纹
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(26, cy + 24);
    ctx.lineTo(34, cy + 8);
    ctx.lineTo(30, cy);
    ctx.lineTo(42, cy - 10);
    ctx.moveTo(34, cy + 8);
    ctx.lineTo(48, cy + 12);
    ctx.moveTo(70, cy - 2);
    ctx.lineTo(60, cy + 30);
    ctx.stroke();
    // 积雪顶
    ctx.beginPath();
    ctx.moveTo(10, cy - 8);
    ctx.lineTo(14, cy - 18);
    ctx.lineTo(40, cy - 26);
    ctx.lineTo(70, cy - 24);
    ctx.lineTo(94, cy - 28);
    ctx.lineTo(98, cy - 16);
    ctx.quadraticCurveTo(90, cy - 10, 84, cy - 15);
    ctx.quadraticCurveTo(74, cy - 8, 64, cy - 14);
    ctx.quadraticCurveTo(52, cy - 6, 42, cy - 14);
    ctx.quadraticCurveTo(28, cy - 4, 20, cy - 10);
    ctx.quadraticCurveTo(14, cy - 4, 10, cy - 8);
    ctx.closePath();
    toon(ctx, 0xffffff, 10, cy - 28, 88, 24, { lineW: 2.5, noShine: true });
    ctx.restore();
    body();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    // 炮口（冰面上凿出的黑洞，霜铁箍）
    ellipsePath(ctx, 100, cy + 4, 10, 15);
    metal(ctx, 90, cy - 11, 20, 30, 0x6c757d);
    ellipsePath(ctx, 101, cy + 4, 6, 10);
    ctx.fillStyle = rgb(0x0b2545);
    ctx.fill();
    // 冰山弹
    ctx.beginPath();
    ctx.moveTo(104, cy - 4);
    ctx.lineTo(114, cy - 12);
    ctx.lineTo(124, cy - 2);
    ctx.lineTo(122, cy + 10);
    ctx.lineTo(110, cy + 14);
    ctx.lineTo(104, cy + 8);
    ctx.closePath();
    toon(ctx, 0xe0fbfc, 104, cy - 12, 20, 26, { lineW: 2.5 });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(108, cy - 5);
    ctx.lineTo(114, cy - 12);
    ctx.lineTo(120, cy - 6);
    ctx.lineTo(113, cy - 3);
    ctx.closePath();
    ctx.fill();
    dots(
      ctx,
      [
        [118, cy - 20, 2],
        [124, cy + 18, 1.8],
        [112, cy + 22, 1.5],
      ],
      'rgba(220,245,255,0.95)',
    );
  },

  // 冰锥连射：左侧握着的冰晶块，向右扇形射出三根长短不一的冰锥
  icicle_volley(ctx) {
    glow(ctx, 70, cy, 34, 0xcaf0f8, 0.4);
    for (const [a, len] of [
      [-0.26, 84],
      [0.26, 84],
      [0, 100],
    ]) {
      ctx.save();
      ctx.translate(30, cy);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(4, -6);
      ctx.lineTo(len * 0.5, -4);
      ctx.lineTo(len, 0);
      ctx.lineTo(len * 0.5, 4);
      ctx.lineTo(4, 6);
      ctx.closePath();
      toon(ctx, 0x90e0ef, 4, -6, len, 12, { noShine: true, lineW: 2.5 });
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.lineTo(len * 0.7, -1);
      ctx.stroke();
      ctx.restore();
    }
    // 冰晶握块
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
      ctx.lineTo(24 + Math.cos(a) * 18, cy + Math.sin(a) * 18);
    }
    ctx.closePath();
    toon(ctx, 0x4895ef, 6, cy - 18, 36, 36);
    snowflake(ctx, 24, cy, 9, 'rgba(255,255,255,0.9)', 2);
  },

  // 电磁炒锅：侧视深口铁炒锅（长柄 + 右侧耳把），锅底缠铜线圈、锅沿冒电火花
  shock_wok(ctx) {
    handle(ctx, 4, 46, cy - 6, 10, 0x3d2c2e);
    roundRectPath(ctx, 42, cy - 9, 14, 6, 2);
    metal(ctx, 42, cy - 9, 14, 6, 0x6c757d);
    // 锅身（半圆碗）
    ctx.beginPath();
    ctx.moveTo(50, cy - 8);
    ctx.lineTo(120, cy - 8);
    ctx.quadraticCurveTo(116, cy + 28, 85, cy + 28);
    ctx.quadraticCurveTo(54, cy + 28, 50, cy - 8);
    ctx.closePath();
    toon(ctx, 0x343a40, 50, cy - 8, 70, 36);
    // 锅口
    ellipsePath(ctx, 85, cy - 8, 36, 7);
    toon(ctx, 0x6c757d, 49, cy - 15, 72, 14, { noShine: true, lineW: 3 });
    ellipsePath(ctx, 85, cy - 7, 30, 4.5);
    ctx.fillStyle = rgb(0x212529);
    ctx.fill();
    // 铜线圈
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(50, cy - 8);
    ctx.lineTo(120, cy - 8);
    ctx.quadraticCurveTo(116, cy + 28, 85, cy + 28);
    ctx.quadraticCurveTo(54, cy + 28, 50, cy - 8);
    ctx.clip();
    for (const y of [cy + 6, cy + 13, cy + 20]) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(130, y + 2);
      ctx.stroke();
      ctx.strokeStyle = rgb(0xf4a261);
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
    // 耳把
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(122, cy - 2, 5, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    glow(ctx, 92, cy - 18, 14, 0x9bf6ff, 0.8);
    bolt(ctx, [
      [74, cy - 28],
      [82, cy - 18],
      [78, cy - 14],
      [90, cy - 12],
    ]);
    bolt(
      ctx,
      [
        [104, cy - 28],
        [100, cy - 20],
        [108, cy - 18],
        [104, cy - 12],
      ],
      0xfff3b0,
      2,
    );
  },

  // 高压电叉：黄黑警示纹绝缘握把，前端插头式两根扁叉齿，齿间拉着电弧
  volt_fork(ctx) {
    roundRectPath(ctx, 4, cy - 7, 60, 14, 6);
    toon(ctx, 0xffd60a, 4, cy - 7, 60, 14, { noShine: true, lineW: 3 });
    ctx.save();
    roundRectPath(ctx, 4, cy - 7, 60, 14, 6);
    ctx.clip();
    ctx.fillStyle = rgb(0x212529);
    for (let x = 8; x < 64; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, cy + 8);
      ctx.lineTo(x + 6, cy + 8);
      ctx.lineTo(x + 12, cy - 8);
      ctx.lineTo(x + 6, cy - 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // 插头座
    ctx.beginPath();
    ctx.moveTo(60, cy - 10);
    ctx.lineTo(78, cy - 18);
    ctx.lineTo(78, cy + 18);
    ctx.lineTo(60, cy + 10);
    ctx.closePath();
    toon(ctx, 0x2b2d42, 60, cy - 18, 18, 36, { lineW: 3 });
    for (const dy of [-12, 12]) {
      ctx.beginPath();
      ctx.moveTo(76, cy + dy - 4);
      ctx.lineTo(116, cy + dy - 4);
      ctx.lineTo(124, cy + dy);
      ctx.lineTo(116, cy + dy + 4);
      ctx.lineTo(76, cy + dy + 4);
      ctx.closePath();
      metal(ctx, 76, cy + dy - 4, 48, 8, 0xffb703);
      ctx.beginPath();
      ctx.arc(100, cy + dy, 2, 0, Math.PI * 2);
      ctx.fillStyle = OUTLINE;
      ctx.fill();
    }
    glow(ctx, 104, cy, 14, 0x9bf6ff, 0.9);
    bolt(ctx, [
      [90, cy - 8],
      [98, cy - 2],
      [92, cy + 2],
      [102, cy + 8],
    ]);
    bolt(
      ctx,
      [
        [108, cy - 8],
        [114, cy - 1],
        [108, cy + 2],
        [116, cy + 8],
      ],
      0xfff3b0,
      2,
    );
  },

  // 微波炉炮：方盒微波炉当炮身（玻璃门 + 旋钮面板），下挂握把，炮口喷出一圈圈微波
  microwave_cannon(ctx) {
    grip(ctx, 30, cy + 10, 0x495057);
    roundRectPath(ctx, 6, cy - 20, 76, 34, 5);
    toon(ctx, 0xf8f9fa, 6, cy - 20, 76, 34, { noShine: true });
    roundRectPath(ctx, 11, cy - 15, 46, 24, 3);
    toon(ctx, 0x1d3557, 11, cy - 15, 46, 24, { lineW: 2.5 });
    ctx.fillStyle = rgb(0xffd166, 0.55);
    ellipsePath(ctx, 34, cy + 4, 12, 3);
    ctx.fill();
    roundRectPath(ctx, 54, cy - 13, 3, 20, 1.5);
    ctx.fillStyle = rgb(0xadb5bd);
    ctx.fill();
    roundRectPath(ctx, 61, cy - 16, 17, 26, 3);
    ctx.fillStyle = rgb(0xdee2e6);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    for (const y of [cy - 9, cy + 1]) {
      ctx.beginPath();
      ctx.arc(69.5, y, 4, 0, Math.PI * 2);
      toon(ctx, 0x6c757d, 65.5, y - 4, 8, 8, { lineW: 2, noShine: true });
    }
    roundRectPath(ctx, 64, cy + 6, 11, 3, 1);
    ctx.fillStyle = rgb(0x52b788);
    ctx.fill();
    // 炮口
    ctx.beginPath();
    ctx.moveTo(80, cy - 9);
    ctx.lineTo(96, cy - 14);
    ctx.lineTo(96, cy + 10);
    ctx.lineTo(80, cy + 5);
    ctx.closePath();
    metal(ctx, 80, cy - 14, 16, 24, 0x8d99ae);
    glow(ctx, 106, cy - 2, 18, 0xffd60a, 0.7);
    ctx.lineCap = 'round';
    for (const [r, a] of [
      [8, 0.95],
      [15, 0.8],
      [22, 0.6],
    ]) {
      ctx.strokeStyle = rgb(0xfff3b0, a);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(98, cy - 2, r, -0.8, 0.8);
      ctx.stroke();
    }
  },

  // 电饭煲光环：悬浮的白色电饭煲（拱盖 + 提手 + 指示灯面板），四周电弧
  rice_cooker_aura(ctx) {
    glow(ctx, 64, cy, 34, 0xfff3b0, 0.8);
    // 锅身
    ctx.beginPath();
    ctx.moveTo(38, cy - 6);
    ctx.lineTo(90, cy - 6);
    ctx.quadraticCurveTo(92, cy + 22, 82, cy + 24);
    ctx.lineTo(46, cy + 24);
    ctx.quadraticCurveTo(36, cy + 22, 38, cy - 6);
    ctx.closePath();
    toon(ctx, 0xf8f9fa, 38, cy - 6, 52, 30);
    // 盖
    ctx.beginPath();
    ctx.moveTo(35, cy - 4);
    ctx.quadraticCurveTo(36, cy - 22, 64, cy - 22);
    ctx.quadraticCurveTo(92, cy - 22, 93, cy - 4);
    ctx.closePath();
    toon(ctx, 0xe9ecef, 35, cy - 22, 58, 18);
    roundRectPath(ctx, 56, cy - 28, 16, 7, 3);
    toon(ctx, 0x6c757d, 56, cy - 28, 16, 7, { lineW: 2, noShine: true });
    // 面板
    roundRectPath(ctx, 50, cy + 2, 28, 14, 4);
    toon(ctx, 0xff8fab, 50, cy + 2, 28, 14, { lineW: 2, noShine: true });
    dots(
      ctx,
      [
        [57, cy + 9, 2.5],
        [71, cy + 9, 2.5],
      ],
      '#fff3b0',
    );
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(62, cy + 7, 4, 4);
    bolt(
      ctx,
      [
        [28, cy - 16],
        [34, cy - 6],
        [28, cy - 2],
        [34, cy + 8],
      ],
      0xffd60a,
    );
    bolt(
      ctx,
      [
        [100, cy - 14],
        [94, cy - 4],
        [100, cy],
        [94, cy + 10],
      ],
      0xffd60a,
    );
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    for (const x of [44, 84]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 24);
      ctx.bezierCurveTo(x - 4, cy - 26, x + 4, cy - 28, x, cy - 30);
      ctx.stroke();
    }
  },

  // 电烤架：长柄手持烤网夹（金属框 + 烧红网格 + 夹着两根香肠），尾部拖着电源插头，网上跳电弧
  grill_arc(ctx) {
    line(
      ctx,
      [
        [8, cy + 4],
        [4, cy + 18],
        [12, cy + 24],
      ],
      0x212529,
      2.5,
    );
    roundRectPath(ctx, 10, cy + 21, 10, 7, 2);
    metal(ctx, 10, cy + 21, 10, 7, 0xffd166);
    handle(ctx, 6, 50, cy, 10, 0x212529);
    for (const dy of [-4, 4]) {
      roundRectPath(ctx, 48, cy + dy - 2, 18, 4, 2);
      metal(ctx, 48, cy + dy - 2, 18, 4, 0x8d99ae);
    }
    roundRectPath(ctx, 64, cy - 24, 58, 48, 4);
    ctx.fillStyle = rgb(0x2b2d42, 0.85);
    ctx.fill();
    glow(ctx, 93, cy, 26, 0xff7b00, 0.45);
    for (const y of [cy - 9, cy + 9]) {
      roundRectPath(ctx, 70, y - 6, 46, 12, 6);
      toon(ctx, 0xc1440e, 70, y - 6, 46, 12, { lineW: 2.5 });
    }
    ctx.save();
    roundRectPath(ctx, 64, cy - 24, 58, 48, 4);
    ctx.clip();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = rgb(0xff7b00);
    for (let x = 73; x < 122; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 24);
      ctx.lineTo(x, cy + 24);
      ctx.stroke();
    }
    ctx.restore();
    roundRectPath(ctx, 64, cy - 24, 58, 48, 4);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = rgb(0xadb5bd);
    ctx.lineWidth = 3.5;
    ctx.stroke();
    bolt(ctx, [
      [96, cy - 30],
      [100, cy - 22],
      [94, cy - 18],
      [102, cy - 10],
    ]);
    bolt(
      ctx,
      [
        [124, cy - 8],
        [118, cy + 2],
        [124, cy + 6],
      ],
      0xfff3b0,
      2,
    );
  },

  // 电动打蛋机：带提手的电机机身，前端并排伸出两根螺旋打蛋棒，周围飞电花
  mixer_storm(ctx) {
    // 打蛋棒
    for (const dy of [-9, 9]) {
      roundRectPath(ctx, 56, cy + dy - 2, 20, 4, 2);
      metal(ctx, 56, cy + dy - 2, 20, 4, 0xadb5bd);
      for (const ry of [7, 3]) {
        ellipsePath(ctx, 98, cy + dy, 24, ry);
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 4.5;
        ctx.stroke();
        ctx.strokeStyle = rgb(0xe9ecef);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    // 机身
    ctx.beginPath();
    ctx.moveTo(8, cy - 6);
    ctx.quadraticCurveTo(10, cy - 18, 30, cy - 18);
    ctx.lineTo(54, cy - 16);
    ctx.quadraticCurveTo(64, cy - 14, 62, cy);
    ctx.quadraticCurveTo(62, cy + 18, 46, cy + 20);
    ctx.lineTo(18, cy + 20);
    ctx.quadraticCurveTo(6, cy + 18, 8, cy - 6);
    ctx.closePath();
    toon(ctx, 0x7209b7, 6, cy - 18, 58, 38);
    // 提手
    ctx.beginPath();
    ctx.moveTo(14, cy - 16);
    ctx.quadraticCurveTo(14, cy - 30, 30, cy - 30);
    ctx.lineTo(50, cy - 30);
    ctx.quadraticCurveTo(58, cy - 30, 56, cy - 16);
    ctx.lineTo(48, cy - 16);
    ctx.quadraticCurveTo(50, cy - 23, 44, cy - 23);
    ctx.lineTo(28, cy - 23);
    ctx.quadraticCurveTo(22, cy - 23, 22, cy - 16);
    ctx.closePath();
    toon(ctx, 0x560bad, 14, cy - 30, 44, 14, { noShine: true, lineW: 2.5 });
    roundRectPath(ctx, 28, cy - 4, 18, 8, 3);
    toon(ctx, 0xf8f9fa, 28, cy - 4, 18, 8, { noShine: true, lineW: 2 });
    dots(ctx, [[37, cy, 2]], '#ff006e');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (const x of [16, 20, 24]) ctx.fillRect(x, cy + 6, 2, 8);
    glow(ctx, 112, cy, 16, 0x9bf6ff, 0.8);
    bolt(ctx, [
      [104, cy - 28],
      [112, cy - 18],
      [106, cy - 14],
      [116, cy - 4],
    ]);
    bolt(
      ctx,
      [
        [110, cy + 26],
        [116, cy + 18],
        [112, cy + 14],
        [122, cy + 8],
      ],
      0xfff3b0,
      2,
    );
  },

  // 吐司闪电：圆角复古吐司机（两条槽 + 侧压杆），顶上弹出两片吐司，劈出一道闪电
  toaster_zap(ctx) {
    for (const [x, a] of [
      [38, -0.12],
      [62, 0.1],
    ]) {
      ctx.save();
      ctx.translate(x + 9, cy - 2);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-9, 6);
      ctx.lineTo(-9, -14);
      ctx.quadraticCurveTo(-13, -24, -4, -26);
      ctx.quadraticCurveTo(0, -30, 4, -26);
      ctx.quadraticCurveTo(13, -24, 9, -14);
      ctx.lineTo(9, 6);
      ctx.closePath();
      toon(ctx, 0xc68b59, -12, -28, 24, 34, { noShine: true, lineW: 2.5 });
      roundRectPath(ctx, -6, -20, 12, 22, 3);
      ctx.fillStyle = rgb(0xfde4b6);
      ctx.fill();
      ctx.restore();
    }
    roundRectPath(ctx, 20, cy - 6, 70, 30, 12);
    metal(ctx, 20, cy - 6, 70, 30, 0x4cc9f0);
    for (const x of [38, 62]) {
      roundRectPath(ctx, x - 1, cy - 6, 20, 5, 2);
      ctx.fillStyle = OUTLINE;
      ctx.fill();
    }
    roundRectPath(ctx, 28, cy + 10, 54, 5, 2.5);
    ctx.fillStyle = rgb(0xf8f9fa, 0.7);
    ctx.fill();
    roundRectPath(ctx, 10, cy + 2, 12, 6, 2);
    toon(ctx, 0x212529, 10, cy + 2, 12, 6, { noShine: true, lineW: 2 });
    for (const x of [28, 72]) {
      roundRectPath(ctx, x, cy + 23, 10, 5, 2);
      ctx.fillStyle = OUTLINE;
      ctx.fill();
    }
    glow(ctx, 108, cy - 4, 18, 0xfff3b0, 0.9);
    ctx.beginPath();
    ctx.moveTo(104, cy - 28);
    ctx.lineTo(118, cy - 28);
    ctx.lineTo(110, cy - 8);
    ctx.lineTo(122, cy - 8);
    ctx.lineTo(100, cy + 20);
    ctx.lineTo(106, cy);
    ctx.lineTo(96, cy);
    ctx.closePath();
    toon(ctx, 0xffd60a, 96, cy - 28, 26, 48, { lineW: 2.5 });
  },

  // 毒菇刺：苍白菌柄当握杆（带菌环），前端一根紫色带绿斑的螺纹长锥刺，尖端滴毒液
  toxic_spike(ctx) {
    roundRectPath(ctx, 4, cy - 6, 56, 12, 6);
    toon(ctx, 0xf1e3d3, 4, cy - 6, 56, 12, { noShine: true, lineW: 3 });
    ctx.strokeStyle = rgb(0xc9b79c);
    ctx.lineWidth = 1.5;
    for (const x of [14, 26, 38]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 4);
      ctx.quadraticCurveTo(x + 4, cy, x, cy + 4);
      ctx.stroke();
    }
    // 菌环（裙状）
    ctx.beginPath();
    ctx.moveTo(52, cy - 7);
    ctx.quadraticCurveTo(46, cy - 16, 56, cy - 18);
    ctx.lineTo(64, cy - 10);
    ctx.lineTo(64, cy + 10);
    ctx.lineTo(56, cy + 18);
    ctx.quadraticCurveTo(46, cy + 16, 52, cy + 7);
    ctx.closePath();
    toon(ctx, 0x9d4edd, 46, cy - 18, 18, 36, { noShine: true, lineW: 2.5 });
    // 锥刺
    ctx.beginPath();
    ctx.moveTo(60, cy - 12);
    ctx.quadraticCurveTo(96, cy - 8, 124, cy);
    ctx.quadraticCurveTo(96, cy + 8, 60, cy + 12);
    ctx.closePath();
    toon(ctx, 0x7b2cbf, 60, cy - 12, 64, 24);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgb(0x3c096c, 0.8);
    ctx.lineWidth = 2;
    for (let x = 68; x < 120; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 12);
      ctx.lineTo(x + 6, cy + 12);
      ctx.stroke();
    }
    ctx.restore();
    dots(
      ctx,
      [
        [74, cy - 4, 2.5],
        [86, cy + 4, 2.2],
        [98, cy - 2, 1.8],
      ],
      rgb(0x9ef01a),
    );
    // 毒滴
    ctx.beginPath();
    ctx.moveTo(116, cy + 3);
    ctx.quadraticCurveTo(122, cy + 12, 118, cy + 15);
    ctx.quadraticCurveTo(112, cy + 12, 116, cy + 3);
    toon(ctx, 0x70e000, 112, cy + 3, 10, 12, { lineW: 2, noShine: true });
  },

  // 孢子炮：枪身顶着一颗鼓胀的马勃菌弹仓，喇叭口枪管喷出绿色孢子团
  spore_cannon(ctx) {
    grip(ctx, 16, cy + 4, 0x6b4226);
    // 喇叭口枪管
    ctx.beginPath();
    ctx.moveTo(10, cy - 4);
    ctx.lineTo(92, cy - 4);
    ctx.quadraticCurveTo(104, cy - 6, 112, cy - 16);
    ctx.lineTo(112, cy + 16);
    ctx.quadraticCurveTo(104, cy + 8, 92, cy + 8);
    ctx.lineTo(10, cy + 8);
    ctx.closePath();
    toon(ctx, 0x606c38, 10, cy - 16, 102, 32);
    ellipsePath(ctx, 112, cy, 5, 16);
    toon(ctx, 0x283618, 107, cy - 16, 10, 32, { noShine: true, lineW: 2.5 });
    // 马勃菌弹仓
    ctx.beginPath();
    ctx.moveTo(34, cy - 4);
    ctx.quadraticCurveTo(26, cy - 30, 52, cy - 30);
    ctx.quadraticCurveTo(78, cy - 30, 70, cy - 4);
    ctx.closePath();
    toon(ctx, 0xe9d8a6, 30, cy - 30, 44, 26);
    dots(
      ctx,
      [
        [44, cy - 20, 2],
        [56, cy - 23, 1.6],
        [62, cy - 14, 2],
        [48, cy - 11, 1.6],
      ],
      rgb(0xbb9457),
    );
    ctx.beginPath();
    ctx.arc(52, cy - 30, 3, Math.PI, 0);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    glow(ctx, 52, cy - 34, 7, 0xb5e48c, 0.9);
    // 孢子团
    for (const [x, y, r] of [
      [118, cy - 20, 5],
      [122, cy - 8, 4],
      [118, cy + 22, 4],
      [124, cy + 12, 3],
    ]) {
      ellipsePath(ctx, x, y, r, r);
      toon(ctx, 0x9ef01a, x - r, y - r, r * 2, r * 2, { lineW: 2, noShine: true });
    }
  },

  // 毒雾喷壶：紫色浇花壶（顶提手 + 长壶嘴 + 莲蓬洒头），洒头冒出绿色毒雾
  miasma_sprayer(ctx) {
    // 壶嘴
    ctx.beginPath();
    ctx.moveTo(56, cy + 6);
    ctx.lineTo(96, cy - 12);
    ctx.lineTo(99, cy - 6);
    ctx.lineTo(60, cy + 16);
    ctx.closePath();
    toon(ctx, 0x5a189a, 56, cy - 12, 43, 28, { noShine: true, lineW: 2.5 });
    ctx.save();
    ctx.translate(100, cy - 10);
    ctx.rotate(-0.42);
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.lineTo(10, -10);
    ctx.lineTo(10, 10);
    ctx.lineTo(-2, 4);
    ctx.closePath();
    metal(ctx, -2, -10, 12, 20, 0xadb5bd);
    ctx.restore();
    // 提手
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(14, cy - 2);
    ctx.quadraticCurveTo(14, cy - 26, 36, cy - 26);
    ctx.quadraticCurveTo(52, cy - 26, 52, cy - 10);
    ctx.stroke();
    ctx.strokeStyle = rgb(0x7b2cbf);
    ctx.lineWidth = 4;
    ctx.stroke();
    // 壶身
    ctx.beginPath();
    ctx.moveTo(10, cy - 8);
    ctx.lineTo(60, cy - 8);
    ctx.lineTo(62, cy + 26);
    ctx.lineTo(8, cy + 26);
    ctx.closePath();
    toon(ctx, 0x7b2cbf, 8, cy - 8, 54, 34);
    roundRectPath(ctx, 6, cy - 12, 58, 6, 3);
    metal(ctx, 6, cy - 12, 58, 6, 0x5a189a);
    // 骷髅贴纸
    ellipsePath(ctx, 35, cy + 7, 9, 8);
    ctx.fillStyle = '#f8f9fa';
    ctx.fill();
    dots(
      ctx,
      [
        [31.5, cy + 6, 2.2],
        [38.5, cy + 6, 2.2],
      ],
      OUTLINE,
    );
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(31, cy + 12, 8, 4);
    // 毒雾
    glow(ctx, 114, cy - 18, 16, 0x9ef01a, 0.8);
    for (const [x, y, r] of [
      [112, cy - 22, 5],
      [120, cy - 14, 4],
      [118, cy - 26, 3.5],
      [124, cy - 6, 3],
    ]) {
      ellipsePath(ctx, x, y, r, r);
      ctx.fillStyle = rgb(0xb5e48c, 0.9);
      ctx.fill();
    }
  },

  // 腐菌光环：悬浮的一小截烂木头上长着一簇耷拉的紫褐色毒菇，周围飘孢子
  rot_aura(ctx) {
    glow(ctx, 64, cy, 34, 0x80b918, 0.6);
    // 烂木头
    roundRectPath(ctx, 34, cy + 12, 60, 14, 7);
    toon(ctx, 0x6f4518, 34, cy + 12, 60, 14, { noShine: true });
    ellipsePath(ctx, 90, cy + 19, 5, 7);
    toon(ctx, 0xc68b59, 85, cy + 12, 10, 14, { noShine: true, lineW: 2 });
    for (const [x, h, r, c] of [
      [48, 20, 13, 0x7f5539],
      [72, 30, 17, 0x6a4c93],
      [88, 14, 9, 0x7f5539],
    ]) {
      roundRectPath(ctx, x - 3, cy + 14 - h, 6, h, 3);
      toon(ctx, 0xede0d4, x - 3, cy + 14 - h, 6, h, { noShine: true, lineW: 2 });
      const top = cy + 14 - h;
      ctx.beginPath();
      ctx.moveTo(x - r, top + r * 0.45);
      ctx.quadraticCurveTo(x - r, top - r * 0.7, x, top - r * 0.7);
      ctx.quadraticCurveTo(x + r, top - r * 0.7, x + r, top + r * 0.45);
      ctx.quadraticCurveTo(x, top + r * 0.1, x - r, top + r * 0.45);
      ctx.closePath();
      toon(ctx, c, x - r, top - r * 0.7, r * 2, r * 1.15, { lineW: 2.5 });
      dots(
        ctx,
        [
          [x - r * 0.4, top - r * 0.2, r * 0.13],
          [x + r * 0.35, top - r * 0.3, r * 0.1],
        ],
        rgb(0xc7f9cc, 0.9),
      );
    }
    dots(
      ctx,
      [
        [30, cy - 8, 2.5],
        [100, cy - 18, 2.5],
        [40, cy - 22, 2],
        [104, cy + 2, 2],
        [62, cy - 30, 1.8],
      ],
      rgb(0xb5e48c, 0.95),
    );
  },

  // 毒蘑菇雷：铁环底座上的红底白点毒蘑菇，菌盖顶着三根引信触针和闪烁的绿灯
  toadstool_mine(ctx) {
    glow(ctx, 64, cy + 4, 32, 0x9ef01a, 0.45);
    ellipsePath(ctx, 64, cy + 24, 28, 6);
    metal(ctx, 36, cy + 18, 56, 12, 0x495057);
    roundRectPath(ctx, 54, cy + 2, 20, 22, 6);
    toon(ctx, 0xf1e3d3, 54, cy + 2, 20, 22, { noShine: true });
    for (const [x, a] of [
      [50, -0.5],
      [64, 0],
      [78, 0.5],
    ]) {
      const tx = x + Math.sin(a) * 16,
        ty = cy - 14 - Math.cos(a) * 14;
      line(
        ctx,
        [
          [x, cy - 10],
          [tx, ty],
        ],
        0xadb5bd,
        2.5,
      );
      ellipsePath(ctx, tx, ty, 3, 3);
      toon(ctx, 0x6c757d, tx - 3, ty - 3, 6, 6, { lineW: 2, noShine: true });
    }
    ctx.beginPath();
    ctx.moveTo(32, cy + 6);
    ctx.quadraticCurveTo(30, cy - 22, 64, cy - 22);
    ctx.quadraticCurveTo(98, cy - 22, 96, cy + 6);
    ctx.quadraticCurveTo(64, cy, 32, cy + 6);
    ctx.closePath();
    toon(ctx, 0xd00000, 30, cy - 22, 68, 28);
    dots(
      ctx,
      [
        [46, cy - 6, 4],
        [62, cy - 14, 4.5],
        [80, cy - 8, 4],
        [90, cy + 1, 2.5],
        [38, cy + 2, 2.5],
      ],
      '#fff8e7',
    );
    glow(ctx, 64, cy - 4, 8, 0x9ef01a, 0.95);
    dots(ctx, [[64, cy - 4, 3]], '#d8f3dc');
  },

  // 菌丝回旋镖：木色 V 形回旋镖，缠满白色菌丝，表面冒出几朵小蘑菇
  mycelium_boomerang(ctx) {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(10, cy + 22);
      ctx.quadraticCurveTo(40, cy - 4, 66, cy - 26);
      ctx.quadraticCurveTo(70, cy - 28, 74, cy - 26);
      ctx.quadraticCurveTo(96, cy - 4, 120, cy + 22);
      ctx.quadraticCurveTo(122, cy + 28, 114, cy + 26);
      ctx.quadraticCurveTo(92, cy + 6, 70, cy - 8);
      ctx.quadraticCurveTo(44, cy + 8, 18, cy + 28);
      ctx.quadraticCurveTo(8, cy + 28, 10, cy + 22);
      ctx.closePath();
    };
    glow(ctx, 70, cy, 30, 0xb5e48c, 0.4);
    path();
    toon(ctx, 0xd4a373, 8, cy - 28, 114, 56, { flat: true, lineW: 3 });
    ctx.save();
    path();
    ctx.clip();
    ctx.strokeStyle = 'rgba(248,244,230,0.9)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 11;
      ctx.beginPath();
      ctx.moveTo(x, cy - 30);
      ctx.bezierCurveTo(x + 8, cy - 10, x - 6, cy + 6, x + 4, cy + 30);
      ctx.stroke();
    }
    ctx.restore();
    for (const [x, y, r] of [
      [36, cy + 4, 6],
      [70, cy - 20, 5],
      [100, cy + 4, 6],
    ]) {
      roundRectPath(ctx, x - 1.5, y - 2, 3, 7, 1.5);
      ctx.fillStyle = '#f8f4e6';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.quadraticCurveTo(x, y - r * 1.4, x + r, y);
      ctx.closePath();
      toon(ctx, 0x9d4edd, x - r, y - r, r * 2, r, { lineW: 2, noShine: true });
    }
  },

  // 毒刺吹管：细长竹吹管（藤编箍 + 吹口），右端探出一枚带绒尾的毒刺
  blowpipe(ctx) {
    roundRectPath(ctx, 8, cy - 4, 106, 8, 4);
    toon(ctx, 0x6a994e, 8, cy - 4, 106, 8, { noShine: true, lineW: 2.5 });
    ctx.strokeStyle = rgb(0xffffff, 0.5);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(14, cy - 2);
    ctx.lineTo(110, cy - 2);
    ctx.stroke();
    for (const x of [30, 58, 86]) {
      roundRectPath(ctx, x, cy - 6, 7, 12, 2);
      toon(ctx, 0xbc6c25, x, cy - 6, 7, 12, { noShine: true, lineW: 2 });
    }
    // 吹口
    roundRectPath(ctx, 3, cy - 7, 12, 14, 4);
    toon(ctx, 0x6f4518, 3, cy - 7, 12, 14, { noShine: true, lineW: 2.5 });
    // 羽毛挂饰
    line(
      ctx,
      [
        [44, cy + 4],
        [46, cy + 16],
      ],
      0xbc6c25,
      1.5,
    );
    ctx.beginPath();
    ctx.ellipse(47, cy + 22, 3.5, 7, 0.2, 0, Math.PI * 2);
    toon(ctx, 0xe63946, 43, cy + 15, 8, 14, { noShine: true, lineW: 2 });
    // 毒刺（绒尾 + 绿色针尖）
    ellipsePath(ctx, 115, cy, 5, 6);
    toon(ctx, 0xf8f9fa, 110, cy - 6, 10, 12, { noShine: true, lineW: 2 });
    ctx.beginPath();
    ctx.moveTo(118, cy - 2.5);
    ctx.lineTo(126, cy);
    ctx.lineTo(118, cy + 2.5);
    ctx.closePath();
    toon(ctx, 0x70e000, 118, cy - 2.5, 8, 5, { noShine: true, lineW: 1.5 });
    dots(ctx, [[121, cy + 6, 1.8]], rgb(0x70e000));
  },

  // 烤肉长签：尾部绕成圆环的扁铁长签，中段串着焦烤肉块与洋葱彩椒，前段烧得通红
  bbq_skewer(ctx) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(13, cy, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = rgb(0xadb5bd);
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, cy - 3);
    ctx.lineTo(108, cy - 2.5);
    ctx.lineTo(126, cy);
    ctx.lineTo(108, cy + 2.5);
    ctx.lineTo(20, cy + 3);
    ctx.closePath();
    const g = ctx.createLinearGradient(70, 0, 126, 0);
    g.addColorStop(0, rgb(0xadb5bd));
    g.addColorStop(0.5, rgb(0xff7b00));
    g.addColorStop(1, rgb(0xfff3b0));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    glow(ctx, 112, cy, 12, 0xff5400, 0.7);
    for (const [x, c, rx, ry] of [
      [36, 0x7f4f24, 9, 12],
      [52, 0xf1e3d3, 4, 11],
      [64, 0x9c4221, 9, 13],
      [79, 0x52b788, 4, 10],
      [90, 0x7f4f24, 8, 11],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, cy, rx, ry, 0.15, 0, Math.PI * 2);
      toon(ctx, c, x - rx, cy - ry, rx * 2, ry * 2, { lineW: 2.5, noShine: c !== 0x9c4221 });
    }
    ctx.strokeStyle = rgb(0x2a1614, 0.7);
    ctx.lineWidth = 2;
    for (const x of [36, 64, 90]) {
      ctx.beginPath();
      ctx.moveTo(x - 5, cy - 6);
      ctx.lineTo(x + 4, cy - 1);
      ctx.moveTo(x - 5, cy + 2);
      ctx.lineTo(x + 4, cy + 7);
      ctx.stroke();
    }
  },

  // 炭火钳：尾端弹簧圈相连的两根长铁钳臂，前端弯爪夹着一块烧红的木炭
  coal_tongs(ctx) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(14, cy, 9, Math.PI * 0.35, Math.PI * 1.65);
    ctx.stroke();
    ctx.strokeStyle = rgb(0x6c757d);
    ctx.lineWidth = 4;
    ctx.stroke();
    for (const s of [-1, 1]) {
      line(
        ctx,
        [
          [18, cy + s * 8],
          [90, cy + s * 13],
          [104, cy + s * 9],
        ],
        0x495057,
        4,
      );
      roundRectPath(ctx, 26, cy + s * 9 - 4, 30, 8, 4);
      toon(ctx, 0x6f4518, 26, cy + s * 9 - 4, 30, 8, { noShine: true, lineW: 2.5 });
    }
    glow(ctx, 112, cy, 18, 0xff5400, 0.8);
    ctx.beginPath();
    ctx.moveTo(100, cy - 9);
    ctx.lineTo(116, cy - 11);
    ctx.lineTo(124, cy - 2);
    ctx.lineTo(120, cy + 10);
    ctx.lineTo(104, cy + 10);
    ctx.lineTo(98, cy);
    ctx.closePath();
    toon(ctx, 0x2b2d42, 98, cy - 11, 26, 21, { noShine: true, lineW: 2.5 });
    ctx.strokeStyle = rgb(0xff7b00);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(104, cy - 4);
    ctx.lineTo(112, cy);
    ctx.lineTo(108, cy + 6);
    ctx.moveTo(112, cy);
    ctx.lineTo(120, cy - 4);
    ctx.stroke();
    // 钳爪
    for (const s of [-1, 1]) {
      line(
        ctx,
        [
          [102, cy + s * 9],
          [110, cy + s * 12],
          [116, cy + s * 9],
        ],
        0x495057,
        3,
      );
    }
  },

  // 烧烤酱炮：架在木轮炮车上的箍铁酱料木桶当炮管，炮口淌出棕色烧烤酱
  bbq_sauce_cannon(ctx) {
    // 炮车尾架
    ctx.beginPath();
    ctx.moveTo(4, cy + 20);
    ctx.lineTo(56, cy + 8);
    ctx.lineTo(60, cy + 16);
    ctx.lineTo(8, cy + 26);
    ctx.closePath();
    toon(ctx, 0x6f4518, 4, cy + 8, 56, 18, { noShine: true, lineW: 2.5 });
    // 桶身炮管
    ctx.save();
    ctx.translate(66, cy - 2);
    ctx.rotate(-0.16);
    ctx.beginPath();
    ctx.moveTo(-48, -10);
    ctx.quadraticCurveTo(-10, -20, 40, -14);
    ctx.lineTo(40, 14);
    ctx.quadraticCurveTo(-10, 20, -48, 10);
    ctx.closePath();
    toon(ctx, 0xdda15e, -48, -18, 88, 36);
    for (const x of [-36, -6, 26]) {
      roundRectPath(ctx, x, -17, 5, 34, 2);
      metal(ctx, x, -17, 5, 34, 0x495057);
    }
    roundRectPath(ctx, -26, -9, 22, 16, 3);
    ctx.fillStyle = '#fff3e0';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#6a040f';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('BBQ', -23, 2);
    ellipsePath(ctx, 41, 0, 6, 15);
    toon(ctx, 0x582f0e, 35, -15, 12, 30, { noShine: true, lineW: 2.5 });
    ellipsePath(ctx, 42, 0, 3.5, 10);
    ctx.fillStyle = rgb(0x7f2704);
    ctx.fill();
    ctx.restore();
    // 酱汁滴
    ctx.beginPath();
    ctx.moveTo(108, cy - 4);
    ctx.quadraticCurveTo(126, cy - 4, 120, cy + 8);
    ctx.quadraticCurveTo(122, cy + 18, 116, cy + 18);
    ctx.quadraticCurveTo(110, cy + 14, 114, cy + 6);
    ctx.quadraticCurveTo(108, cy + 4, 108, cy - 4);
    toon(ctx, 0x7f2704, 108, cy - 4, 18, 22, { lineW: 2 });
    // 木轮
    ctx.beginPath();
    ctx.arc(58, cy + 16, 13, 0, Math.PI * 2);
    toon(ctx, 0x8d5b3a, 45, cy + 3, 26, 26, { noShine: true });
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(58 + Math.cos(a) * 11, cy + 16 + Math.sin(a) * 11);
      ctx.lineTo(58 - Math.cos(a) * 11, cy + 16 - Math.sin(a) * 11);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(58, cy + 16, 4, 0, Math.PI * 2);
    metal(ctx, 54, cy + 12, 8, 8, 0x6c757d);
  },

  // 炭烤光环：悬浮的一堆枕形炭块，裂缝透出橙红火光，上方飘火星与热浪
  charcoal_aura(ctx) {
    glow(ctx, 64, cy + 2, 34, 0xff5400, 0.75);
    for (const [x, y, a] of [
      [48, cy + 12, -0.15],
      [80, cy + 12, 0.15],
      [64, cy - 2, 0],
    ]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      roundRectPath(ctx, -17, -11, 34, 22, 10);
      toon(ctx, 0x343a40, -17, -11, 34, 22, { noShine: true });
      ctx.strokeStyle = rgb(0xff7b00);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(-3, 2);
      ctx.lineTo(4, -3);
      ctx.lineTo(10, 3);
      ctx.moveTo(-3, 2);
      ctx.lineTo(-1, 7);
      ctx.stroke();
      glow(ctx, 0, 1, 8, 0xffb703, 0.5);
      ctx.restore();
    }
    for (const [x, b] of [
      [48, 0],
      [64, 1],
      [80, 0],
    ]) {
      ctx.strokeStyle = rgb(0xffd166, 0.85);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, cy - 14 - b * 2);
      ctx.bezierCurveTo(x - 5, cy - 18, x + 5, cy - 22, x, cy - 28);
      ctx.stroke();
    }
    dots(
      ctx,
      [
        [36, cy - 12, 2],
        [92, cy - 16, 2.2],
        [56, cy - 28, 1.6],
        [76, cy - 26, 1.8],
      ],
      rgb(0xffb703),
    );
  },
};
