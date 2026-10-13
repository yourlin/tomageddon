// 武器专属造型 · 第 6 批：融合武器（二）
// 每个函数在 128×64 画布上画一把武器：手柄 / 握把在左、朝右，中线 y = 32，描边统一用 OUTLINE，上色用 toon / metal
import { type Ctx, OUTLINE, rgb, ellipsePath, roundRectPath, starPath, toon, glow } from '../Painter';
import { handle, metal } from '../weaponKit';

const cy = 32;
const TAU = Math.PI * 2;

/** 粗描边 + 内色的线（先描深色粗线，再描彩色细线） */
function line2(ctx: Ctx, pts: [number, number][], w: number, color: number, ow = 3): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w + ow;
  ctx.stroke();
  ctx.strokeStyle = rgb(color);
  ctx.lineWidth = w;
  ctx.stroke();
}

/** 闪电折线 */
function bolt(ctx: Ctx, pts: [number, number][], color = 0xfff176): void {
  line2(ctx, pts, 2.5, color, 2.5);
}

/** 朝右的火苗：根部在 (x,y)，长 len、半高 h */
function flame(ctx: Ctx, x: number, y: number, len: number, h: number): void {
  glow(ctx, x + len * 0.5, y, Math.abs(len) * 0.8, 0xff7b00, 0.6);
  for (const [c, k] of [
    [0xff4b1f, 1],
    [0xffb703, 0.62],
    [0xfff3b0, 0.3],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x, y - h * k);
    ctx.quadraticCurveTo(x + len * k * 0.6, y - h * k * 1.1, x + len * k, y);
    ctx.quadraticCurveTo(x + len * k * 0.6, y + h * k * 1.1, x, y + h * k);
    ctx.quadraticCurveTo(x - Math.sign(len) * 3 * k, y, x, y - h * k);
    ctx.fillStyle = rgb(c);
    ctx.fill();
    if (k === 1) {
      ctx.strokeStyle = rgb(0x9d0208);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

/** 雪花 */
function snow(ctx: Ctx, x: number, y: number, r: number, color = 0xe0fbfc): void {
  ctx.lineCap = 'round';
  for (const [c, w] of [
    [0x1d3557, 3.5],
    [color, 1.6],
  ] as const) {
    ctx.strokeStyle = rgb(c);
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.stroke();
  }
}

/** 向下的冰棱 */
function icicle(ctx: Ctx, x: number, y: number, len: number, w = 5): void {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x, y + len);
  ctx.closePath();
  toon(ctx, 0xbde0fe, x - w / 2, y, w, len, { lineW: 2, noShine: true, outline: 0x1d3557 });
}

/** 水滴（尖头朝上） */
function drop(ctx: Ctx, x: number, y: number, r: number, color: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.8);
  ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.3, x + r, y);
  ctx.arc(x, y, r, 0, Math.PI);
  ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.3, x, y - r * 1.8);
  toon(ctx, color, x - r, y - r * 1.8, r * 2, r * 2.8, { lineW: 2 });
}

/** 斜握把（枪托） */
function grip(ctx: Ctx, x: number, y: number, w: number, h: number, color: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 4, y + h);
  ctx.quadraticCurveTo(x - 6, y + h + 2, x - 6, y + h - 4);
  ctx.closePath();
  toon(ctx, color, x - 6, y, w + 6, h, { noShine: true, lineW: 3 });
}

/** 小圆点（孢子、种子、糖粒等） */
function dots(ctx: Ctx, pts: [number, number, number][], color: number, a = 1): void {
  ctx.fillStyle = rgb(color, a);
  for (const [x, y, r] of pts) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
}

/** 引信火花 */
function spark(ctx: Ctx, x: number, y: number, r: number): void {
  glow(ctx, x, y, r * 2, 0xffd166, 0.9);
  starPath(ctx, x, y, r, r * 0.4, 6, 0);
  ctx.fillStyle = rgb(0xfff3b0);
  ctx.fill();
  ctx.strokeStyle = rgb(0xff7b00);
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** 蘑菇（伞盖朝上），底部中心 (x,y) */
function shroom(ctx: Ctx, x: number, y: number, r: number, cap: number): void {
  roundRectPath(ctx, x - r * 0.35, y - r * 0.9, r * 0.7, r * 0.9, r * 0.3);
  toon(ctx, 0xf1e3d3, x - r * 0.35, y - r * 0.9, r * 0.7, r * 0.9, { lineW: 2, noShine: true });
  ctx.beginPath();
  ctx.moveTo(x - r, y - r * 0.7);
  ctx.quadraticCurveTo(x - r, y - r * 1.9, x, y - r * 1.9);
  ctx.quadraticCurveTo(x + r, y - r * 1.9, x + r, y - r * 0.7);
  ctx.closePath();
  toon(ctx, cap, x - r, y - r * 1.9, r * 2, r * 1.2, { lineW: 2 });
  dots(
    ctx,
    [
      [x - r * 0.4, y - r * 1.25, r * 0.18],
      [x + r * 0.35, y - r * 1.45, r * 0.15],
    ],
    0xffffff,
    0.85,
  );
}

export const ART: Record<string, (ctx: Ctx) => void> = {
  // 烈焰蜂蜜喷枪：带棱的南瓜储料罐坐在握把上，枪管是一根带螺纹的蜂蜜棒，枪口滴蜜并喷火
  fz_honey_blaster_pumpkin_mortar(ctx) {
    grip(ctx, 18, cy + 6, 16, 22, 0x6f4518);
    roundRectPath(ctx, 58, cy - 4, 40, 10, 4);
    metal(ctx, 58, cy - 4, 40, 10, 0xd4a373);
    // 蜂蜜棒头：一圈圈螺纹
    for (const x of [96, 102, 108]) {
      ellipsePath(ctx, x, cy + 1, 4, 9);
      toon(ctx, 0xf4a261, x - 4, cy - 8, 8, 18, { lineW: 2.5, noShine: true });
    }
    drop(ctx, 106, cy + 16, 3.5, 0xffb703);
    flame(ctx, 112, cy + 1, 14, 7);
    // 南瓜罐
    ellipsePath(ctx, 38, cy - 2, 26, 18);
    toon(ctx, 0xf77f00, 12, cy - 20, 52, 36);
    ctx.strokeStyle = rgb(0xb5530a);
    ctx.lineWidth = 2.5;
    for (const k of [-0.55, 0, 0.55]) {
      ctx.beginPath();
      ctx.ellipse(38, cy - 2, 26 * Math.abs(k) + 3, 17, 0, -Math.PI / 2, Math.PI / 2, k < 0);
      ctx.stroke();
    }
    roundRectPath(ctx, 34, cy - 26, 7, 9, 2);
    toon(ctx, 0x2d6a4f, 34, cy - 26, 7, 9, { lineW: 2, noShine: true });
    // 蜂蜜窗口
    ctx.beginPath();
    starPath(ctx, 38, cy, 7, 6, 6, 0);
    ctx.fillStyle = rgb(0xffd23f);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
  },

  // 剧毒爆米花机：小推车式爆米花锅——玻璃罩里堆满发绿的毒爆米花，顶上是斑点毒菇盖，罩外冒毒泡
  fz_popcorn_machine_rot_aura(ctx) {
    glow(ctx, 64, cy, 32, 0x80ed99, 0.45);
    // 底座
    roundRectPath(ctx, 40, cy + 12, 48, 14, 4);
    toon(ctx, 0x5a189a, 40, cy + 12, 48, 14, { noShine: true });
    for (const x of [46, 82]) {
      ctx.beginPath();
      ctx.arc(x, cy + 27, 4, 0, TAU);
      toon(ctx, 0x343a40, x - 4, cy + 23, 8, 8, { lineW: 2, noShine: true });
    }
    // 玻璃罩
    roundRectPath(ctx, 44, cy - 14, 40, 28, 6);
    ctx.fillStyle = rgb(0xd8f3dc, 0.35);
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (const [x, y, r] of [
      [50, 10, 6],
      [60, 12, 7],
      [72, 10, 6],
      [80, 12, 6],
      [55, 3, 6],
      [67, 3, 6],
      [77, 4, 5],
      [62, -5, 5],
    ]) {
      ctx.beginPath();
      ctx.arc(x, cy + y, r, 0, TAU);
      toon(ctx, 0xb5e48c, x - r, cy + y - r, r * 2, r * 2, { lineW: 1.5, noShine: true, outline: 0x386641 });
    }
    ctx.restore();
    roundRectPath(ctx, 44, cy - 14, 40, 28, 6);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(49, cy - 9);
    ctx.lineTo(49, cy + 4);
    ctx.stroke();
    // 毒菇盖
    ctx.beginPath();
    ctx.moveTo(38, cy - 13);
    ctx.quadraticCurveTo(40, cy - 30, 64, cy - 30);
    ctx.quadraticCurveTo(88, cy - 30, 90, cy - 13);
    ctx.closePath();
    toon(ctx, 0x9d4edd, 38, cy - 30, 52, 17);
    dots(
      ctx,
      [
        [52, cy - 21, 3],
        [66, cy - 25, 2.5],
        [78, cy - 19, 3],
      ],
      0xe0aaff,
    );
    // 毒泡
    for (const [x, y, r] of [
      [98, cy - 10, 5],
      [106, cy + 2, 3.5],
      [28, cy - 4, 4],
      [22, cy + 8, 2.5],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      toon(ctx, 0x70e000, x - r, y - r, r * 2, r * 2, { lineW: 1.5 });
    }
  },

  // 爆裂甜甜圈飞环：粉色糖霜甜甜圈，四根红色炸药棒绑在环上，顶上一根引信在冒火花
  fz_donut_ring_dynamite_drumstick(ctx) {
    const x = 62;
    ctx.beginPath();
    ctx.ellipse(x, cy, 27, 25, 0, 0, TAU);
    ctx.ellipse(x, cy, 9, 8, 0, 0, TAU, true);
    toon(ctx, 0xd4a373, x - 27, cy - 25, 54, 50);
    // 糖霜（波浪）
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * TAU;
      const r = 20 + Math.sin(i * 2.2) * 2;
      const px = x + Math.cos(a) * r,
        py = cy + Math.sin(a) * r * 0.92;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.ellipse(x, cy, 12, 11, 0, 0, TAU, true);
    toon(ctx, 0xff8fab, x - 21, cy - 20, 42, 40, { lineW: 2 });
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7 + 0.3,
        r = 16;
      ctx.save();
      ctx.translate(x + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9);
      ctx.rotate(i * 1.3);
      ctx.fillStyle = rgb([0xffd166, 0x4cc9f0, 0xffffff, 0x80ed99][i % 4]);
      ctx.fillRect(-2.5, -1, 5, 2);
      ctx.restore();
    }
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      ctx.save();
      ctx.translate(x + Math.cos(a) * 22, cy + Math.sin(a) * 20);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = rgb(0x2a1614);
      roundRectPath(ctx, -8, -5, 16, 10, 2);
      toon(ctx, 0xd62828, -8, -5, 16, 10, { lineW: 2.5, noShine: true });
      ctx.fillStyle = rgb(0xfefae0);
      ctx.fillRect(-1.5, -5, 3, 10);
      ctx.restore();
    }
    // 引信
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 16, cy - 18);
    ctx.quadraticCurveTo(x + 26, cy - 30, x + 34, cy - 24);
    ctx.stroke();
    spark(ctx, x + 35, cy - 24, 6);
  },

  // 连环锅铲：锅铲头分成弹弓一样的两叉，叉尖之间绷着皮筋，兜里装着一颗番茄
  fz_spatula_slingshot(ctx) {
    handle(ctx, 4, 56, cy, 10, 0xe76f51);
    roundRectPath(ctx, 52, cy - 3, 14, 6, 3);
    metal(ctx, 52, cy - 3, 14, 6);
    ctx.beginPath();
    ctx.moveTo(64, cy - 8);
    ctx.lineTo(80, cy - 12);
    ctx.lineTo(108, cy - 27);
    ctx.quadraticCurveTo(118, cy - 28, 117, cy - 20);
    ctx.lineTo(96, cy - 4);
    ctx.quadraticCurveTo(92, cy, 96, cy + 4);
    ctx.lineTo(117, cy + 20);
    ctx.quadraticCurveTo(118, cy + 28, 108, cy + 27);
    ctx.lineTo(80, cy + 12);
    ctx.lineTo(64, cy + 8);
    ctx.closePath();
    metal(ctx, 64, cy - 28, 54, 56);
    ctx.fillStyle = rgb(0x6c757d);
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(92, cy + s * 13);
      ctx.rotate(s * -0.55);
      roundRectPath(ctx, -10, -2, 20, 4, 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = rgb(0xe9c46a);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(114, cy - 22);
    ctx.lineTo(118, cy);
    ctx.lineTo(114, cy + 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(116, cy, 9, 0, TAU);
    toon(ctx, 0xe63946, 107, cy - 9, 18, 18, { lineW: 2.5 });
    roundRectPath(ctx, 114, cy - 11, 4, 4, 1);
    ctx.fillStyle = rgb(0x2d6a4f);
    ctx.fill();
  },

  // 主厨可乐电击枪：方形汽水分配机做机身（可乐窗口、出水龙头），机顶插着两根打蛋棒，彼此之间放电
  fz_cola_zapper_mixer_storm(ctx) {
    grip(ctx, 26, cy + 14, 16, 16, 0x343a40);
    // 顶上两根打蛋棒
    for (const x of [34, 58]) {
      line2(
        ctx,
        [
          [x, cy - 12],
          [x, cy - 18],
        ],
        3,
        0xadb5bd,
        3,
      );
      for (const [c, w] of [
        [0x2a1614, 4.5],
        [0xdee2e6, 2],
      ] as const) {
        ctx.strokeStyle = rgb(c);
        ctx.lineWidth = w;
        for (const rx of [7, 3]) {
          ctx.beginPath();
          ctx.ellipse(x, cy - 21, rx, 6, 0, 0, TAU);
          ctx.stroke();
        }
      }
    }
    glow(ctx, 46, cy - 21, 12, 0x9bf6ff, 0.6);
    bolt(ctx, [
      [40, cy - 23],
      [45, cy - 18],
      [48, cy - 24],
      [53, cy - 19],
    ]);
    // 方形机箱
    roundRectPath(ctx, 8, cy - 14, 74, 30, 5);
    toon(ctx, 0xd00000, 8, cy - 14, 74, 30);
    roundRectPath(ctx, 14, cy - 9, 30, 20, 3);
    ctx.fillStyle = rgb(0x3d0c02);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    dots(
      ctx,
      [
        [20, cy + 6, 2],
        [28, cy + 2, 1.6],
        [36, cy + 7, 2],
        [24, cy - 3, 1.4],
      ],
      0xffd8be,
      0.8,
    );
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(17, cy - 6);
    ctx.lineTo(22, cy - 6);
    ctx.stroke();
    ctx.strokeStyle = rgb(0xffffff);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, cy - 4);
    ctx.bezierCurveTo(56, cy - 10, 64, cy + 2, 76, cy - 6);
    ctx.stroke();
    for (const [x, c] of [
      [52, 0xffd166],
      [62, 0x38b000],
      [72, 0x4cc9f0],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x, cy + 7, 3, 0, TAU);
      toon(ctx, c, x - 3, cy + 4, 6, 6, { lineW: 1.5, noShine: true });
    }
    // 出水龙头当枪口
    ctx.beginPath();
    ctx.moveTo(80, cy - 8);
    ctx.lineTo(104, cy - 8);
    ctx.quadraticCurveTo(112, cy - 8, 112, cy);
    ctx.lineTo(112, cy + 8);
    ctx.lineTo(104, cy + 8);
    ctx.lineTo(104, cy + 1);
    ctx.lineTo(80, cy + 1);
    ctx.closePath();
    metal(ctx, 80, cy - 8, 32, 16, 0xadb5bd);
    roundRectPath(ctx, 88, cy - 14, 6, 7, 2);
    metal(ctx, 88, cy - 14, 6, 7, 0x495057);
    glow(ctx, 108, cy + 14, 12, 0x9bf6ff, 0.7);
    bolt(ctx, [
      [108, cy + 9],
      [104, cy + 16],
      [112, cy + 18],
      [108, cy + 27],
    ]);
    bolt(ctx, [
      [113, cy + 6],
      [120, cy + 10],
      [117, cy + 14],
      [124, cy + 18],
    ]);
  },

  // 酱爆豆子火箭筒：深褐色酱缸改成的粗短肩扛炮，缸口塞着带引信的大豆子弹，侧面斜挂一串豆荚弹药带
  fz_bean_bazooka_soy_bomb(ctx) {
    grip(ctx, 46, cy + 12, 14, 16, 0x3d2c2e);
    // 后部尾喷口
    ctx.beginPath();
    ctx.moveTo(18, cy - 8);
    ctx.lineTo(4, cy - 12);
    ctx.lineTo(4, cy + 12);
    ctx.lineTo(18, cy + 8);
    ctx.closePath();
    metal(ctx, 4, cy - 12, 14, 24, 0x6c757d);
    // 酱缸炮身（鼓肚）
    ctx.beginPath();
    ctx.moveTo(16, cy - 12);
    ctx.bezierCurveTo(40, cy - 26, 72, cy - 26, 90, cy - 14);
    ctx.lineTo(90, cy + 14);
    ctx.bezierCurveTo(72, cy + 26, 40, cy + 26, 16, cy + 12);
    ctx.closePath();
    toon(ctx, 0x5c2e0e, 16, cy - 24, 74, 48);
    ctx.strokeStyle = rgb(0x8b4513);
    ctx.lineWidth = 2.5;
    for (const dx of [-14, 14]) {
      ctx.beginPath();
      ctx.moveTo(52 + dx, cy - 21);
      ctx.lineTo(52 + dx, cy + 21);
      ctx.stroke();
    }
    // 酱字封签
    ctx.beginPath();
    ctx.moveTo(52, cy - 11);
    ctx.lineTo(63, cy);
    ctx.lineTo(52, cy + 11);
    ctx.lineTo(41, cy);
    ctx.closePath();
    toon(ctx, 0xd00000, 41, cy - 11, 22, 22, { lineW: 2, noShine: true });
    ctx.fillStyle = rgb(0xffd166);
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('酱', 52, cy + 1);
    // 缸口
    roundRectPath(ctx, 88, cy - 12, 10, 24, 3);
    toon(ctx, 0x3d1d08, 88, cy - 12, 10, 24, { noShine: true });
    // 豆子弹
    ctx.beginPath();
    ctx.ellipse(106, cy, 13, 10, 0, 0, TAU);
    toon(ctx, 0xd4a373, 93, cy - 10, 26, 20);
    ctx.strokeStyle = rgb(0x7f5539);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(104, cy - 9);
    ctx.quadraticCurveTo(110, cy, 104, cy + 9);
    ctx.stroke();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(112, cy - 8);
    ctx.quadraticCurveTo(116, cy - 20, 122, cy - 20);
    ctx.stroke();
    spark(ctx, 122, cy - 21, 4.5);
    // 豆荚弹药带
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, cy + 12);
    ctx.quadraticCurveTo(40, cy + 30, 78, cy + 18);
    ctx.stroke();
    for (const [x, y] of [
      [28, cy + 20],
      [40, cy + 25],
      [54, cy + 26],
      [68, cy + 23],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 3.5, 0.2, 0, TAU);
      toon(ctx, 0x52b788, x - 6, y - 3.5, 12, 7, { lineW: 2, noShine: true });
    }
  },

  // 贯穿蒸汽水壶：银青色鸣笛壶，壶嘴是一根长长的芦笋（尖头带鳞片），顶部提手是一张拉满的弓
  fz_steam_kettle_asparagus_bow(ctx) {
    // 弓形提手
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(14, cy - 6);
    ctx.quadraticCurveTo(36, cy - 40, 58, cy - 6);
    ctx.stroke();
    ctx.strokeStyle = rgb(0x6a994e);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = rgb(0xfefae0);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, cy - 8);
    ctx.lineTo(56, cy - 8);
    ctx.stroke();
    // 壶身
    ctx.beginPath();
    ctx.moveTo(14, cy + 22);
    ctx.lineTo(58, cy + 22);
    ctx.quadraticCurveTo(64, cy - 2, 48, cy - 12);
    ctx.lineTo(24, cy - 12);
    ctx.quadraticCurveTo(8, cy - 2, 14, cy + 22);
    ctx.closePath();
    metal(ctx, 8, cy - 12, 56, 34, 0x83c5be);
    roundRectPath(ctx, 30, cy - 18, 12, 7, 3);
    metal(ctx, 30, cy - 18, 12, 7, 0x495057);
    // 芦笋壶嘴
    ctx.beginPath();
    ctx.moveTo(54, cy + 8);
    ctx.lineTo(102, cy - 4);
    ctx.lineTo(104, cy + 4);
    ctx.lineTo(58, cy + 16);
    ctx.closePath();
    toon(ctx, 0x6a994e, 54, cy - 4, 50, 20, { lineW: 2.5 });
    ctx.fillStyle = rgb(0x386641);
    for (const t of [0.3, 0.55, 0.8]) {
      const x = 56 + t * 46,
        y = cy + 12 - t * 12;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 2);
      ctx.lineTo(x + 3, y - 4);
      ctx.lineTo(x, y + 1);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(100, cy - 7);
    ctx.quadraticCurveTo(114, cy - 6, 120, cy - 4);
    ctx.quadraticCurveTo(114, cy + 4, 102, cy + 7);
    ctx.closePath();
    toon(ctx, 0x9c89b8, 100, cy - 7, 20, 14, { lineW: 2.5 });
    // 蒸汽
    for (const [x, y, r] of [
      [118, cy - 14, 5],
      [112, cy - 22, 4],
      [122, cy - 24, 3],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();
    }
  },

  // 贯穿闪电打蛋器：握柄是一支细腰胡椒研磨器，前端打蛋丝收拢成锋利的长尖，缠着闪电
  fz_lightning_whisk_pepper_grinder(ctx) {
    // 研磨器握柄
    ctx.beginPath();
    ctx.moveTo(6, cy - 8);
    ctx.quadraticCurveTo(22, cy - 12, 28, cy - 5);
    ctx.quadraticCurveTo(36, cy - 4, 44, cy - 10);
    ctx.lineTo(48, cy - 10);
    ctx.lineTo(48, cy + 10);
    ctx.lineTo(44, cy + 10);
    ctx.quadraticCurveTo(36, cy + 4, 28, cy + 5);
    ctx.quadraticCurveTo(22, cy + 12, 6, cy + 8);
    ctx.closePath();
    toon(ctx, 0x5c3317, 6, cy - 12, 42, 24);
    ctx.beginPath();
    ctx.arc(5, cy, 4, 0, TAU);
    metal(ctx, 1, cy - 4, 8, 8, 0xadb5bd);
    roundRectPath(ctx, 46, cy - 6, 8, 12, 2);
    metal(ctx, 46, cy - 6, 8, 12);
    // 尖头打蛋丝
    for (const [c, w] of [
      [0x2a1614, 5],
      [0xdee2e6, 2.2],
    ] as const) {
      ctx.strokeStyle = rgb(c);
      ctx.lineWidth = w;
      for (const k of [18, 11, 4]) {
        ctx.beginPath();
        ctx.moveTo(54, cy);
        ctx.bezierCurveTo(70, cy - k * 1.3, 96, cy - k, 122, cy);
        ctx.bezierCurveTo(96, cy + k, 70, cy + k * 1.3, 54, cy);
        ctx.stroke();
      }
    }
    glow(ctx, 90, cy, 20, 0x9bf6ff, 0.5);
    bolt(ctx, [
      [70, cy - 22],
      [80, cy - 10],
      [74, cy - 6],
      [88, cy + 4],
      [84, cy + 8],
      [98, cy + 20],
    ]);
    dots(
      ctx,
      [
        [62, cy - 24, 1.8],
        [104, cy + 24, 1.8],
        [112, cy - 16, 1.5],
      ],
      0x343a40,
    );
  },

  // 烈焰巧克力地雷：装在褶边纸托里的圆滚巧克力松露，表面淋着白巧克力纹，顶上一支喷枪嘴喷着蓝火
  fz_choco_mine_bbq_torch(ctx) {
    // 纸托
    ctx.beginPath();
    ctx.moveTo(40, cy + 6);
    ctx.lineTo(88, cy + 6);
    ctx.lineTo(82, cy + 28);
    ctx.lineTo(46, cy + 28);
    ctx.closePath();
    toon(ctx, 0xe63946, 40, cy + 6, 48, 22, { noShine: true });
    ctx.strokeStyle = rgb(0x9d0208);
    ctx.lineWidth = 2;
    for (let x = 48; x <= 80; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, cy + 8);
      ctx.lineTo(x + (x - 64) * 0.1, cy + 27);
      ctx.stroke();
    }
    // 松露
    ctx.beginPath();
    ctx.arc(64, cy + 2, 22, 0, TAU);
    toon(ctx, 0x6f4518, 42, cy - 20, 44, 44);
    ctx.save();
    ctx.beginPath();
    ctx.arc(64, cy + 2, 21, 0, TAU);
    ctx.clip();
    ctx.strokeStyle = rgb(0xfefae0);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 40; x <= 88; x += 2) ctx.lineTo(x, cy - 6 + Math.sin(x * 0.45) * 4);
    ctx.stroke();
    ctx.beginPath();
    for (let x = 40; x <= 88; x += 2) ctx.lineTo(x, cy + 4 + Math.sin(x * 0.45 + 2) * 4);
    ctx.stroke();
    ctx.restore();
    // 喷枪嘴 + 火
    roundRectPath(ctx, 58, cy - 28, 12, 10, 2);
    metal(ctx, 58, cy - 28, 12, 10, 0x495057);
    roundRectPath(ctx, 68, cy - 26, 16, 6, 2);
    metal(ctx, 68, cy - 26, 16, 6, 0xadb5bd);
    glow(ctx, 92, cy - 23, 10, 0x4cc9f0, 0.8);
    flame(ctx, 84, cy - 23, 16, 6);
    ellipsePath(ctx, 89, cy - 23, 4, 2.5);
    ctx.fillStyle = rgb(0x4cc9f0);
    ctx.fill();
    glow(ctx, 64, cy + 6, 7, 0xff3b30, 0.9);
  },

  // 致命樱桃炸弹：竹节火箭——竹管机身后端插着竹叶尾翼，前端是一颗装尖刺的大樱桃弹头
  fz_cherry_bomb_bamboo_spear(ctx) {
    flame(ctx, 10, cy, -8, 5);
    // 竹叶尾翼
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(16, cy + s * 4);
      ctx.quadraticCurveTo(10, cy + s * 20, 4, cy + s * 24);
      ctx.quadraticCurveTo(26, cy + s * 18, 32, cy + s * 4);
      ctx.closePath();
      toon(ctx, 0x52b788, 4, cy - 24, 28, 48, { lineW: 2.5, noShine: true });
    }
    // 竹管
    roundRectPath(ctx, 12, cy - 7, 70, 14, 4);
    toon(ctx, 0x95d5b2, 12, cy - 7, 70, 14, { noShine: true });
    for (const x of [30, 50, 70]) {
      roundRectPath(ctx, x - 2, cy - 8, 4, 16, 2);
      toon(ctx, 0x40916c, x - 2, cy - 8, 4, 16, { lineW: 2, noShine: true, flat: true });
    }
    // 樱桃梗
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(92, cy - 14);
    ctx.quadraticCurveTo(84, cy - 26, 74, cy - 24);
    ctx.stroke();
    ctx.strokeStyle = rgb(0x6a994e);
    ctx.lineWidth = 2;
    ctx.stroke();
    // 樱桃弹头 + 尖刺
    ctx.beginPath();
    ctx.moveTo(104, cy - 6);
    ctx.lineTo(125, cy);
    ctx.lineTo(104, cy + 6);
    ctx.closePath();
    metal(ctx, 104, cy - 6, 21, 12, 0xced4da);
    ctx.beginPath();
    ctx.arc(94, cy, 16, 0, TAU);
    toon(ctx, 0xc1121f, 78, cy - 16, 32, 32);
    ctx.fillStyle = rgb(0x780000);
    for (const a of [-1.2, 1.2, -2.2, 2.2]) {
      ctx.beginPath();
      ctx.moveTo(94 + Math.cos(a) * 15, cy + Math.sin(a) * 15);
      ctx.lineTo(94 + Math.cos(a) * 22, cy + Math.sin(a) * 22);
      ctx.lineTo(94 + Math.cos(a + 0.25) * 15, cy + Math.sin(a + 0.25) * 15);
      ctx.fill();
    }
  },

  // 剧毒厨房剪刀：真正的剪刀——左边两个紫色指环，中间铆钉，两片微张的刀刃带毒菇锯齿并滴着毒液
  fz_kitchen_scissors_toxic_spike(ctx) {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(16, cy + s * 11, 12, 8, s * 0.25, 0, TAU);
      ctx.ellipse(16, cy + s * 11, 6, 3.5, s * 0.25, 0, TAU, true);
      toon(ctx, 0x7b2cbf, 4, cy + s * 11 - 8, 24, 16, { lineW: 3 });
      ctx.beginPath();
      ctx.moveTo(24, cy + s * 8);
      ctx.lineTo(48, cy + s * 2);
      ctx.lineTo(48, cy - s * 3);
      ctx.lineTo(26, cy + s * 16);
      ctx.closePath();
      toon(ctx, 0x7b2cbf, 24, cy - 16, 24, 32, { lineW: 2.5, noShine: true });
    }
    // 两片刀刃
    for (const s of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(44, cy - s * 4);
      ctx.lineTo(122, cy - s * 14);
      ctx.lineTo(112, cy - s * 4);
      ctx.lineTo(44, cy + s * 4);
      ctx.closePath();
      metal(ctx, 44, cy - 14, 78, 28, s > 0 ? 0xced4da : 0xadb5bd);
      ctx.fillStyle = rgb(0x70e000);
      for (const x of [62, 78, 94]) {
        const y = cy - s * (4 + (x - 44) * 0.13);
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x, y - s * 5);
        ctx.lineTo(x + 4, y);
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(48, cy, 5, 0, TAU);
    toon(ctx, 0x9d4edd, 43, cy - 5, 10, 10, { lineW: 2 });
    shroom(ctx, 48, cy - 4, 4, 0xe63946);
    drop(ctx, 100, cy + 18, 3, 0x70e000);
    drop(ctx, 82, cy + 22, 2.4, 0x70e000);
  },

  // 主厨胡萝卜弩：胡萝卜做弩托，金属弓臂拉满，弩槽里装着一支三叉餐叉弩箭，叉尖串着番茄
  fz_carrot_crossbow_fork(ctx) {
    // 胡萝卜弩托
    ctx.beginPath();
    ctx.moveTo(4, cy - 9);
    ctx.quadraticCurveTo(40, cy - 9, 70, cy - 4);
    ctx.lineTo(70, cy + 4);
    ctx.quadraticCurveTo(40, cy + 9, 4, cy + 9);
    ctx.closePath();
    toon(ctx, 0xf77f00, 4, cy - 9, 66, 18);
    ctx.strokeStyle = rgb(0xb5530a);
    ctx.lineWidth = 2;
    for (const x of [20, 34, 48]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 6);
      ctx.lineTo(x + 3, cy - 1);
      ctx.stroke();
    }
    for (const a of [-0.5, 0, 0.5])
      line2(
        ctx,
        [
          [6, cy],
          [-2 + Math.cos(a + Math.PI) * 2, cy + Math.sin(a) * 12],
        ],
        3,
        0x52b788,
        2,
      );
    grip(ctx, 30, cy + 6, 12, 18, 0x6f4518);
    // 弓臂
    ctx.strokeStyle = rgb(0xdee2e6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(58, cy - 26);
    ctx.lineTo(48, cy);
    ctx.lineTo(58, cy + 26);
    ctx.stroke();
    ctx.lineCap = 'round';
    for (const [c, w] of [
      [0x2a1614, 8],
      [0x8d99ae, 4.5],
    ] as const) {
      ctx.strokeStyle = rgb(c);
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(58, cy - 26);
      ctx.quadraticCurveTo(76, cy, 58, cy + 26);
      ctx.stroke();
    }
    // 叉形弩箭
    roundRectPath(ctx, 48, cy - 2.5, 50, 5, 2);
    metal(ctx, 48, cy - 2.5, 50, 5, 0xced4da);
    roundRectPath(ctx, 94, cy - 11, 6, 22, 2);
    metal(ctx, 94, cy - 11, 6, 22, 0xced4da);
    for (const dy of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(98, cy + dy - 2);
      ctx.lineTo(120, cy + dy - 1);
      ctx.lineTo(124, cy + dy);
      ctx.lineTo(120, cy + dy + 1);
      ctx.lineTo(98, cy + dy + 2);
      ctx.closePath();
      metal(ctx, 98, cy + dy - 2, 26, 4, 0xe9ecef);
    }
    ctx.beginPath();
    ctx.arc(112, cy, 6, 0, TAU);
    toon(ctx, 0xe63946, 106, cy - 6, 12, 12, { lineW: 2 });
  },

  // 霜寒孢子喷壶：园艺喷雾瓶——结霜的紫色瓶身挂着冰棱，瓶里漂着小蘑菇，扳机喷头喷出雪花孢子
  fz_spore_sprayer_shaved_ice_gun(ctx) {
    // 瓶身
    roundRectPath(ctx, 6, cy - 14, 54, 30, 12);
    ctx.fillStyle = rgb(0xc8b6ff, 0.9);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = rgb(0x7b2cbf, 0.8);
    ctx.fillRect(6, cy - 2, 54, 20);
    ctx.restore();
    roundRectPath(ctx, 6, cy - 14, 54, 30, 12);
    toon(ctx, 0xb8c0ff, 6, cy - 14, 54, 30, { flat: true, noShine: true, outline: 0x2a1614, lineW: 3 });
    ctx.save();
    roundRectPath(ctx, 6, cy - 14, 54, 30, 12);
    ctx.clip();
    ctx.fillStyle = rgb(0x5a189a, 0.85);
    ctx.fillRect(6, cy, 54, 18);
    ctx.restore();
    shroom(ctx, 22, cy + 12, 5, 0xe0aaff);
    shroom(ctx, 40, cy + 13, 4, 0xff8fab);
    // 霜顶
    ctx.beginPath();
    ctx.moveTo(8, cy - 8);
    for (let x = 8; x <= 58; x += 5) ctx.lineTo(x, cy - 12 + ((x / 5) % 2) * 5);
    ctx.lineTo(58, cy - 14);
    ctx.lineTo(8, cy - 14);
    ctx.fillStyle = rgb(0xe0fbfc);
    ctx.fill();
    for (const [x, l] of [
      [16, 9],
      [32, 12],
      [48, 8],
    ])
      icicle(ctx, x, cy + 15, l, 5);
    // 喷头 + 扳机
    roundRectPath(ctx, 56, cy - 18, 30, 14, 4);
    toon(ctx, 0x4cc9f0, 56, cy - 18, 30, 14);
    ctx.beginPath();
    ctx.moveTo(70, cy - 4);
    ctx.quadraticCurveTo(78, cy + 4, 72, cy + 14);
    ctx.lineTo(66, cy + 12);
    ctx.quadraticCurveTo(70, cy + 4, 64, cy - 4);
    ctx.closePath();
    toon(ctx, 0x0077b6, 64, cy - 4, 14, 18, { lineW: 2.5, noShine: true });
    roundRectPath(ctx, 84, cy - 15, 10, 8, 2);
    metal(ctx, 84, cy - 15, 10, 8, 0xadb5bd);
    // 喷出的雪花孢子
    snow(ctx, 104, cy - 11, 6);
    snow(ctx, 118, cy - 2, 4.5);
    snow(ctx, 114, cy - 22, 3.5);
    dots(
      ctx,
      [
        [100, cy + 2, 2.5],
        [122, cy - 14, 2],
        [110, cy + 10, 2],
      ],
      0xe0aaff,
    );
  },

  // 连环冰棍刺剑：木冰棍棒当握柄，橄榄护手，剑身是三色分层的细长冰棍，下方挂一根小橄榄发射管
  fz_popsicle_blade_olive_launcher(ctx) {
    roundRectPath(ctx, 4, cy - 5, 30, 10, 5);
    toon(ctx, 0xe9c46a, 4, cy - 5, 30, 10, { noShine: true });
    // 橄榄护手
    ctx.beginPath();
    ctx.ellipse(36, cy, 6, 15, 0, 0, TAU);
    toon(ctx, 0x606c38, 30, cy - 15, 12, 30, { lineW: 2.5 });
    dots(
      ctx,
      [
        [36, cy - 9, 2.5],
        [36, cy + 9, 2.5],
      ],
      0xe63946,
    );
    // 冰棍剑身
    const blade = () => {
      ctx.beginPath();
      ctx.moveTo(40, cy - 8);
      ctx.lineTo(98, cy - 6);
      ctx.lineTo(125, cy);
      ctx.lineTo(98, cy + 5);
      ctx.lineTo(40, cy + 7);
      ctx.closePath();
    };
    blade();
    ctx.save();
    ctx.clip();
    for (const [x, c] of [
      [40, 0xff8fab],
      [66, 0xfefae0],
      [92, 0x4cc9f0],
    ] as const) {
      ctx.fillStyle = rgb(c);
      ctx.fillRect(x, cy - 10, 27, 20);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(40, cy + 1, 90, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(44, cy - 5, 70, 2);
    ctx.restore();
    blade();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    // 橄榄发射管
    roundRectPath(ctx, 44, cy + 9, 34, 7, 3);
    metal(ctx, 44, cy + 9, 34, 7, 0x606c38);
    for (const x of [84, 96]) {
      ctx.beginPath();
      ctx.ellipse(x, cy + 13, 5, 4, 0, 0, TAU);
      toon(ctx, 0x6a994e, x - 5, cy + 9, 10, 8, { lineW: 2 });
      dots(ctx, [[x + 2, cy + 13, 1.6]], 0xe63946);
    }
  },

  // 霜寒烤肉长签：长签上串着冻住的肉块，每块顶着一团奶油、底下挂冰棱，签尖是一枚冰晶矛头
  fz_bbq_skewer_cream_torch(ctx) {
    line2(
      ctx,
      [
        [4, cy],
        [100, cy],
      ],
      4,
      0xe9c46a,
      3,
    );
    roundRectPath(ctx, 4, cy - 5, 18, 10, 4);
    toon(ctx, 0x6f4518, 4, cy - 5, 18, 10, { noShine: true });
    // 冰晶矛头
    ctx.beginPath();
    ctx.moveTo(96, cy);
    ctx.lineTo(108, cy - 10);
    ctx.lineTo(125, cy);
    ctx.lineTo(108, cy + 10);
    ctx.closePath();
    toon(ctx, 0xa2d2ff, 96, cy - 10, 29, 20, { outline: 0x1d3557 });
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, cy);
    ctx.lineTo(122, cy);
    ctx.stroke();
    for (const x of [36, 58, 80]) {
      roundRectPath(ctx, x - 9, cy - 9, 18, 18, 5);
      toon(ctx, 0x9c6644, x - 9, cy - 9, 18, 18, { lineW: 2.5 });
      ctx.fillStyle = rgb(0xbde0fe, 0.45);
      ctx.fillRect(x - 7, cy + 2, 14, 5);
      // 奶油
      ctx.beginPath();
      ctx.moveTo(x - 9, cy - 7);
      ctx.quadraticCurveTo(x - 8, cy - 16, x - 2, cy - 14);
      ctx.quadraticCurveTo(x, cy - 22, x + 4, cy - 15);
      ctx.quadraticCurveTo(x + 10, cy - 15, x + 9, cy - 7);
      ctx.closePath();
      toon(ctx, 0xfffcf2, x - 9, cy - 22, 18, 15, { lineW: 2 });
      icicle(ctx, x - 4, cy + 9, 8, 4);
      icicle(ctx, x + 4, cy + 9, 6, 4);
    }
    snow(ctx, 112, cy - 20, 4);
  },

  // 霜寒椰壳拳套：左边缠绷带的护腕，前面是半个毛椰壳做的大拳头，指节上嵌着四颗透明冰块
  fz_coconut_gloves_ice_cube_tray(ctx) {
    roundRectPath(ctx, 6, cy - 12, 36, 24, 6);
    toon(ctx, 0xfefae0, 6, cy - 12, 36, 24, { noShine: true });
    ctx.strokeStyle = rgb(0xccc5b9);
    ctx.lineWidth = 2;
    for (const x of [14, 22, 30]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 11);
      ctx.lineTo(x + 6, cy + 11);
      ctx.stroke();
    }
    // 椰壳拳
    ctx.beginPath();
    ctx.moveTo(40, cy - 16);
    ctx.quadraticCurveTo(70, cy - 30, 100, cy - 22);
    ctx.quadraticCurveTo(114, cy, 100, cy + 22);
    ctx.quadraticCurveTo(70, cy + 30, 40, cy + 16);
    ctx.closePath();
    toon(ctx, 0x7f5539, 40, cy - 28, 74, 56);
    ctx.strokeStyle = rgb(0x582f0e);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      const x = 48 + (i % 7) * 7,
        y = cy - 16 + Math.floor(i / 7) * 26 + (i % 2) * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4, y + 3);
      ctx.stroke();
    }
    roundRectPath(ctx, 52, cy + 4, 26, 10, 5);
    toon(ctx, 0x9c6644, 52, cy + 4, 26, 10, { lineW: 2, noShine: true });
    // 冰块指节
    for (let i = 0; i < 4; i++) {
      const y = cy - 20 + i * 10;
      roundRectPath(ctx, 100, y, 14, 10, 2.5);
      ctx.fillStyle = rgb(0xcaf0f8, 0.9);
      ctx.fill();
      ctx.strokeStyle = rgb(0x1d3557);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(103, y + 2, 4, 2);
    }
    snow(ctx, 120, cy - 22, 4);
    snow(ctx, 121, cy + 22, 3);
  },

  // 爆裂飞刀匣：白色微波炉机身当枪匣，玻璃门里发着红光，背上斜插着一排刀柄，炮口吐出一把菜刀
  fz_knife_case_microwave_cannon(ctx) {
    grip(ctx, 30, cy + 10, 14, 18, 0x343a40);
    // 背上斜插刀柄
    for (const x of [18, 30, 42]) {
      ctx.save();
      ctx.translate(x, cy - 12);
      ctx.rotate(-0.5);
      roundRectPath(ctx, -4, -16, 8, 16, 3);
      toon(ctx, 0x3d2c2e, -4, -16, 8, 16, { lineW: 2.5, noShine: true });
      ctx.restore();
    }
    // 微波炉
    roundRectPath(ctx, 8, cy - 14, 66, 28, 4);
    toon(ctx, 0xe9ecef, 8, cy - 14, 66, 28, { noShine: true });
    roundRectPath(ctx, 12, cy - 10, 40, 20, 3);
    ctx.fillStyle = rgb(0x212529);
    ctx.fill();
    glow(ctx, 32, cy, 16, 0xff4d6d, 0.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, cy + 6);
    ctx.lineTo(26, cy - 7);
    ctx.stroke();
    for (const [y, c] of [
      [cy - 8, 0x38b000],
      [cy - 1, 0x6c757d],
      [cy + 6, 0x6c757d],
    ] as const) {
      roundRectPath(ctx, 58, y, 10, 4, 1.5);
      ctx.fillStyle = rgb(c);
      ctx.fill();
    }
    // 炮口 + 飞出的菜刀
    roundRectPath(ctx, 72, cy - 8, 10, 16, 2);
    metal(ctx, 72, cy - 8, 10, 16, 0x495057);
    ctx.beginPath();
    ctx.moveTo(82, cy - 6);
    ctx.lineTo(116, cy - 4);
    ctx.quadraticCurveTo(126, cy, 120, cy + 5);
    ctx.lineTo(82, cy + 6);
    ctx.closePath();
    metal(ctx, 82, cy - 6, 44, 12, 0xdee2e6);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(86, cy - 3);
    ctx.lineTo(114, cy - 2);
    ctx.stroke();
    starPath(ctx, 84, cy - 14, 6, 2.5, 5);
    ctx.fillStyle = rgb(0xffd166);
    ctx.fill();
  },

  // 霜寒炭火钳：长长的双臂火钳，尾端是铰链圆环，臂上缠着打蛋器钢丝，钳口夹着一块结冰的蓝炭
  fz_coal_tongs_whisk_spin(ctx) {
    ctx.beginPath();
    ctx.arc(12, cy, 8, 0, TAU);
    ctx.arc(12, cy, 4, 0, TAU, true);
    metal(ctx, 4, cy - 8, 16, 16, 0x6c757d);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(18, cy + s * 2);
      ctx.lineTo(96, cy + s * 12);
      ctx.lineTo(100, cy + s * 18);
      ctx.lineTo(96, cy + s * 18);
      ctx.lineTo(18, cy + s * 7);
      ctx.closePath();
      metal(ctx, 18, cy - 18, 82, 36, 0x495057);
    }
    // 缠绕的钢丝
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 30; x <= 74; x += 2) ctx.lineTo(x, cy + Math.sin(x * 0.4) * (4 + (x - 30) * 0.15));
    ctx.stroke();
    ctx.strokeStyle = rgb(0xdee2e6);
    ctx.lineWidth = 2;
    ctx.stroke();
    // 冰炭
    glow(ctx, 108, cy, 20, 0x90e0ef, 0.6);
    ctx.beginPath();
    ctx.moveTo(96, cy - 8);
    ctx.lineTo(108, cy - 15);
    ctx.lineTo(122, cy - 6);
    ctx.lineTo(120, cy + 9);
    ctx.lineTo(106, cy + 14);
    ctx.lineTo(94, cy + 5);
    ctx.closePath();
    toon(ctx, 0x264653, 94, cy - 15, 28, 29, { lineW: 3 });
    ctx.strokeStyle = rgb(0x90e0ef);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, cy - 2);
    ctx.lineTo(108, cy + 2);
    ctx.lineTo(116, cy - 4);
    ctx.moveTo(108, cy + 2);
    ctx.lineTo(110, cy + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(98, cy - 9);
    ctx.lineTo(108, cy - 15);
    ctx.lineTo(122, cy - 6);
    ctx.lineTo(112, cy - 7);
    ctx.closePath();
    ctx.fillStyle = rgb(0xe0fbfc);
    ctx.fill();
    for (const x of [100, 112]) icicle(ctx, x, cy + 12, 8, 4);
    snow(ctx, 124, cy + 18, 3);
  },

  // 烈焰吐司闪电：镀铬面包机机身，两片冒火的吐司从槽里弹出，前面接一支辣酱瓶当枪管，瓶口放电
  fz_toaster_zap_hot_sauce_gun(ctx) {
    grip(ctx, 24, cy + 10, 14, 18, 0x3d2c2e);
    // 弹出的吐司
    for (const x of [18, 38]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 6);
      ctx.lineTo(x, cy - 18);
      ctx.quadraticCurveTo(x - 2, cy - 28, x + 8, cy - 27);
      ctx.quadraticCurveTo(x + 18, cy - 28, x + 16, cy - 18);
      ctx.lineTo(x + 16, cy - 6);
      ctx.closePath();
      toon(ctx, 0xe9a35b, x - 2, cy - 28, 18, 22, { lineW: 2.5, noShine: true });
      ctx.fillStyle = rgb(0xffe8b0);
      ctx.fillRect(x + 3, cy - 20, 10, 10);
    }
    glow(ctx, 36, cy - 22, 12, 0xff7b00, 0.6);
    // 面包机
    roundRectPath(ctx, 8, cy - 10, 54, 24, 9);
    metal(ctx, 8, cy - 10, 54, 24, 0xced4da);
    ctx.fillStyle = rgb(0x212529);
    for (const x of [18, 38]) {
      roundRectPath(ctx, x, cy - 11, 16, 4, 2);
      ctx.fill();
    }
    roundRectPath(ctx, 4, cy - 2, 6, 10, 2);
    metal(ctx, 4, cy - 2, 6, 10, 0xd00000);
    // 辣酱瓶枪管
    ctx.beginPath();
    ctx.moveTo(60, cy - 9);
    ctx.lineTo(86, cy - 9);
    ctx.quadraticCurveTo(94, cy - 9, 98, cy - 4);
    ctx.lineTo(106, cy - 4);
    ctx.lineTo(106, cy + 4);
    ctx.lineTo(98, cy + 4);
    ctx.quadraticCurveTo(94, cy + 9, 86, cy + 9);
    ctx.lineTo(60, cy + 9);
    ctx.closePath();
    toon(ctx, 0xd00000, 60, cy - 9, 46, 18);
    roundRectPath(ctx, 66, cy - 5, 16, 10, 2);
    ctx.fillStyle = rgb(0xfefae0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(70, cy + 3);
    ctx.quadraticCurveTo(74, cy - 6, 78, cy + 3);
    ctx.fillStyle = rgb(0xff7b00);
    ctx.fill();
    roundRectPath(ctx, 104, cy - 5, 8, 10, 2);
    toon(ctx, 0x2d6a4f, 104, cy - 5, 8, 10, { lineW: 2, noShine: true });
    glow(ctx, 118, cy, 12, 0xfff176, 0.7);
    bolt(ctx, [
      [112, cy],
      [118, cy - 8],
      [116, cy - 2],
      [124, cy - 10],
    ]);
    bolt(ctx, [
      [112, cy + 2],
      [120, cy + 6],
      [116, cy + 9],
      [124, cy + 14],
    ]);
  },

  // 爆裂汤勺：长柄汤勺，勺头是侧看的半个西瓜（绿皮条纹、红瓤黑籽），瓤面上噼啪冒火花
  fz_ladle_watermelon_hammer(ctx) {
    handle(ctx, 4, 72, cy - 10, 8, 0x8d99ae);
    ctx.beginPath();
    ctx.moveTo(66, cy - 14);
    ctx.quadraticCurveTo(76, cy - 10, 78, cy - 4);
    ctx.lineTo(74, cy - 2);
    ctx.quadraticCurveTo(72, cy - 8, 64, cy - 8);
    ctx.closePath();
    metal(ctx, 64, cy - 14, 14, 12, 0x8d99ae);
    // 西瓜勺头（半圆碗）
    ctx.beginPath();
    ctx.moveTo(72, cy - 6);
    ctx.lineTo(124, cy - 6);
    ctx.arc(98, cy - 6, 26, 0, Math.PI);
    ctx.closePath();
    toon(ctx, 0x2d6a4f, 72, cy - 6, 52, 30);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgb(0x1b4332);
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(98 + i * 10, cy - 6);
      ctx.quadraticCurveTo(98 + i * 13, cy + 8, 98 + i * 6, cy + 22);
      ctx.stroke();
    }
    ctx.restore();
    // 红瓤面
    ctx.beginPath();
    ctx.ellipse(98, cy - 6, 26, 7, 0, 0, TAU);
    toon(ctx, 0xfefae0, 72, cy - 13, 52, 14, { lineW: 2.5, noShine: true });
    ctx.beginPath();
    ctx.ellipse(98, cy - 6, 22, 5, 0, 0, TAU);
    ctx.fillStyle = rgb(0xef233c);
    ctx.fill();
    dots(
      ctx,
      [
        [88, cy - 6, 1.5],
        [96, cy - 8, 1.5],
        [104, cy - 5, 1.5],
        [112, cy - 7, 1.5],
      ],
      0x2a1614,
    );
    spark(ctx, 90, cy - 18, 5);
    spark(ctx, 110, cy - 22, 4);
    spark(ctx, 120, cy - 14, 3);
  },

  // 致命薄荷冰雷：一圈冰尖刺包着的薄荷色冰球，球心透出破壁机的十字刀片，顶上两片薄荷叶
  fz_mint_frost_mine_blender_aura(ctx) {
    const x = 64,
      y = cy + 3;
    glow(ctx, x, y, 30, 0x99e2b4, 0.5);
    starPath(ctx, x, y, 28, 17, 8, -Math.PI / 2 + Math.PI / 8);
    toon(ctx, 0xbde0fe, x - 28, y - 28, 56, 56, { outline: 0x1d3557, lineW: 2.5, noShine: true });
    ctx.beginPath();
    ctx.arc(x, y, 19, 0, TAU);
    toon(ctx, 0x52d1a6, x - 19, y - 19, 38, 38, { lineW: 3 });
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, TAU);
    ctx.fillStyle = rgb(0xe0fbfc, 0.55);
    ctx.fill();
    // 十字刀片
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.4 + (i * Math.PI) / 2);
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.quadraticCurveTo(8, -5, 11, 1);
      ctx.lineTo(0, 2);
      ctx.closePath();
      metal(ctx, 0, -5, 11, 7, 0xced4da);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, TAU);
    toon(ctx, 0x495057, x - 3, y - 3, 6, 6, { lineW: 1.5, noShine: true });
    // 薄荷叶
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, y - 20);
      ctx.quadraticCurveTo(x + s * 6, y - 32, x + s * 16, y - 30);
      ctx.quadraticCurveTo(x + s * 12, y - 20, x, y - 20);
      ctx.closePath();
      toon(ctx, 0x2d6a4f, x - 16, y - 32, 32, 12, { lineW: 2, noShine: true });
    }
  },

  // 贯穿西瓜榴弹：带尾翼的西瓜条纹榴弹，瓜皮上刻着发光的南瓜鬼脸，前端是一枚钻头弹尖
  fz_melon_grenade_pumpkin_lantern(ctx) {
    // 尾翼与尾杆
    roundRectPath(ctx, 6, cy - 4, 30, 8, 3);
    metal(ctx, 6, cy - 4, 30, 8, 0x6c757d);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(8, cy + s * 3);
      ctx.lineTo(4, cy + s * 18);
      ctx.lineTo(18, cy + s * 18);
      ctx.lineTo(26, cy + s * 3);
      ctx.closePath();
      toon(ctx, 0xf77f00, 4, cy - 18, 22, 36, { lineW: 2.5, noShine: true });
    }
    // 钻头弹尖
    ctx.beginPath();
    ctx.moveTo(96, cy - 12);
    ctx.lineTo(125, cy);
    ctx.lineTo(96, cy + 12);
    ctx.closePath();
    metal(ctx, 96, cy - 12, 29, 24, 0xadb5bd);
    ctx.strokeStyle = rgb(0x495057);
    ctx.lineWidth = 2;
    for (const x of [104, 112]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - (125 - x) * 0.4);
      ctx.lineTo(x + 6, cy + (125 - x - 6) * 0.4);
      ctx.stroke();
    }
    // 西瓜弹体
    ctx.beginPath();
    ctx.ellipse(66, cy, 34, 24, 0, 0, TAU);
    toon(ctx, 0x40916c, 32, cy - 24, 68, 48);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgb(0x1b4332);
    ctx.lineWidth = 4;
    for (const r of [-14, 0, 14]) {
      ctx.beginPath();
      ctx.ellipse(66, cy + r, 36, 3, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(66, cy, 34, 24, 0, 0, TAU);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    // 鬼脸
    glow(ctx, 68, cy + 2, 18, 0xffd166, 0.6);
    ctx.fillStyle = rgb(0xffd23f);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(68 + s * 4, cy - 4);
      ctx.lineTo(68 + s * 14, cy - 4);
      ctx.lineTo(68 + s * 9, cy - 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(52, cy + 4);
    for (let i = 1; i <= 8; i++) ctx.lineTo(52 + i * 4, cy + 4 + (i % 2 ? 5 : 0));
    ctx.quadraticCurveTo(68, cy + 18, 52, cy + 4);
    ctx.fill();
    ctx.stroke();
  },

  // 烈焰毒刺吹管：细长芦苇吹管，中段绑着一个枫糖浆小瓶当储料仓，右端吹出一支燃烧的毒刺
  fz_blowpipe_syrup_sprayer(ctx) {
    roundRectPath(ctx, 4, cy - 5, 12, 10, 4);
    toon(ctx, 0x6f4518, 4, cy - 5, 12, 10, { noShine: true });
    roundRectPath(ctx, 14, cy - 4, 82, 8, 4);
    toon(ctx, 0xa7c957, 14, cy - 4, 82, 8, { noShine: true });
    for (const x of [26, 76, 90]) {
      roundRectPath(ctx, x, cy - 5, 3, 10, 1);
      ctx.fillStyle = rgb(0x6a994e);
      ctx.fill();
    }
    // 糖浆瓶
    ctx.beginPath();
    ctx.moveTo(42, cy + 2);
    ctx.lineTo(42, cy - 12);
    ctx.quadraticCurveTo(42, cy - 18, 48, cy - 20);
    ctx.lineTo(48, cy - 26);
    ctx.lineTo(56, cy - 26);
    ctx.lineTo(56, cy - 20);
    ctx.quadraticCurveTo(62, cy - 18, 62, cy - 12);
    ctx.lineTo(62, cy + 2);
    ctx.closePath();
    toon(ctx, 0xbc6c25, 42, cy - 26, 20, 28);
    ctx.beginPath();
    starPath(ctx, 52, cy - 9, 5, 2.5, 5);
    ctx.fillStyle = rgb(0xd00000);
    ctx.fill();
    // 绑带
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    for (const x of [45, 59]) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 2);
      ctx.lineTo(x, cy + 5);
      ctx.stroke();
    }
    drop(ctx, 52, cy + 14, 3, 0xdda15e);
    // 燃烧毒刺
    roundRectPath(ctx, 94, cy - 2, 14, 4, 2);
    ctx.fillStyle = rgb(0x70e000);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(106, cy - 4);
    ctx.lineTo(118, cy);
    ctx.lineTo(106, cy + 4);
    ctx.closePath();
    metal(ctx, 106, cy - 4, 12, 8, 0xced4da);
    flame(ctx, 116, cy, 10, 5);
  },

  // 烈焰竹筷：一双交叉收拢的竹筷，红色筷尾缠着喷雾罐，筷尖夹着一根燃烧的红辣椒
  fz_chopsticks_pepper_spray(ctx) {
    for (const [y0, y1] of [
      [cy - 12, cy + 1],
      [cy + 12, cy - 1],
    ]) {
      line2(
        ctx,
        [
          [6, y0],
          [100, y1],
        ],
        5,
        0xe9c46a,
        3,
      );
      line2(
        ctx,
        [
          [6, y0],
          [24, y0 + (y1 - y0) * 0.19],
        ],
        6,
        0xd62828,
        3,
      );
    }
    // 喷雾罐
    roundRectPath(ctx, 28, cy - 8, 22, 16, 4);
    toon(ctx, 0x212529, 28, cy - 8, 22, 16);
    roundRectPath(ctx, 31, cy - 5, 16, 8, 2);
    ctx.fillStyle = rgb(0xe63946);
    ctx.fill();
    dots(
      ctx,
      [
        [36, cy - 1, 1.5],
        [42, cy - 1, 1.5],
      ],
      0xffffff,
    );
    roundRectPath(ctx, 50, cy - 3, 6, 6, 1.5);
    metal(ctx, 50, cy - 3, 6, 6);
    // 辣椒
    ctx.beginPath();
    ctx.moveTo(94, cy - 4);
    ctx.bezierCurveTo(106, cy - 8, 116, cy - 4, 124, cy + 6);
    ctx.bezierCurveTo(114, cy + 4, 104, cy + 6, 94, cy + 4);
    ctx.closePath();
    toon(ctx, 0xe71d36, 94, cy - 8, 30, 14, { lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(96, cy - 3);
    ctx.lineTo(88, cy - 6);
    ctx.lineTo(90, cy + 3);
    ctx.closePath();
    toon(ctx, 0x2d6a4f, 88, cy - 6, 8, 9, { lineW: 2, noShine: true });
    ctx.save();
    ctx.translate(108, cy - 8);
    ctx.rotate(-Math.PI / 2);
    flame(ctx, 0, 0, 18, 7);
    ctx.restore();
  },

  // 爆裂披萨滚刀：短柄滚刀，锯齿圆刀圈里嵌着一颗带芽眼的土豆炸弹，土豆顶上插着点燃的引信
  fz_pizza_cutter_potato_mine(ctx) {
    handle(ctx, 4, 50, cy, 11, 0xd62828);
    roundRectPath(ctx, 48, cy - 4, 22, 8, 3);
    metal(ctx, 48, cy - 4, 22, 8);
    const x = 92;
    starPath(ctx, x, cy, 28, 24, 18, 0);
    metal(ctx, x - 28, cy - 28, 56, 56, 0xdee2e6);
    ctx.beginPath();
    ctx.arc(x, cy, 21, 0, TAU);
    ctx.strokeStyle = rgb(0x8d99ae);
    ctx.lineWidth = 2;
    ctx.stroke();
    // 土豆
    ctx.beginPath();
    ctx.ellipse(x, cy + 1, 17, 14, -0.2, 0, TAU);
    toon(ctx, 0xc9a66b, x - 17, cy - 13, 34, 28);
    dots(
      ctx,
      [
        [x - 7, cy - 2, 1.8],
        [x + 6, cy + 6, 1.8],
        [x + 3, cy - 6, 1.5],
        [x - 4, cy + 8, 1.5],
      ],
      0x7f5539,
    );
    ctx.beginPath();
    ctx.arc(x, cy, 4, 0, TAU);
    toon(ctx, 0xd62828, x - 4, cy - 4, 8, 8, { lineW: 2 });
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 8, cy - 11);
    ctx.quadraticCurveTo(x + 14, cy - 20, x + 22, cy - 22);
    ctx.stroke();
    spark(ctx, x + 23, cy - 23, 5);
  },

  // 重击跳跳糖电击：双头把手的擀面杖，中段换成装满彩色跳跳糖的玻璃管，两端铜帽之间电弧缠绕
  fz_popping_candy_rolling_pin(ctx) {
    handle(ctx, 4, 24, cy, 12, 0xc68b59);
    handle(ctx, 104, 124, cy, 12, 0xc68b59);
    for (const x of [20, 98]) {
      roundRectPath(ctx, x, cy - 15, 10, 30, 3);
      metal(ctx, x, cy - 15, 10, 30, 0xd4a373);
    }
    roundRectPath(ctx, 30, cy - 13, 68, 26, 10);
    ctx.fillStyle = rgb(0xffc8dd, 0.5);
    ctx.fill();
    ctx.save();
    ctx.clip();
    const cols = [0xff4d6d, 0x4cc9f0, 0xffd166, 0x80ed99, 0xc77dff, 0xffffff];
    for (let i = 0; i < 46; i++) {
      const px = 32 + ((i * 37) % 64),
        py = cy - 11 + ((i * 23) % 22);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(i);
      ctx.fillStyle = rgb(cols[i % cols.length]);
      ctx.fillRect(-2.5, -2, 5, 4);
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(34, cy - 10, 60, 3);
    ctx.restore();
    roundRectPath(ctx, 30, cy - 13, 68, 26, 10);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    glow(ctx, 64, cy - 18, 14, 0x9bf6ff, 0.5);
    bolt(ctx, [
      [26, cy - 16],
      [40, cy - 24],
      [52, cy - 17],
      [66, cy - 26],
      [80, cy - 18],
      [102, cy - 17],
    ]);
    bolt(ctx, [
      [26, cy + 16],
      [44, cy + 24],
      [60, cy + 18],
      [78, cy + 26],
      [102, cy + 17],
    ]);
  },

  // 剧毒法棍剑：向上弯成弯刀的发霉法棍，面包上长出紫色毒菇和绿霉斑，刀尖的破口喷着孢子
  fz_baguette_sword_spore_cannon(ctx) {
    roundRectPath(ctx, 24, cy - 14, 8, 28, 3);
    metal(ctx, 24, cy - 14, 8, 28, 0x9d4edd);
    handle(ctx, 4, 26, cy, 10, 0x3d2c2e);
    const bread = () => {
      ctx.beginPath();
      ctx.moveTo(32, cy - 8);
      ctx.quadraticCurveTo(84, cy - 8, 120, cy - 26);
      ctx.quadraticCurveTo(126, cy - 18, 120, cy - 10);
      ctx.quadraticCurveTo(84, cy + 12, 32, cy + 9);
      ctx.closePath();
    };
    bread();
    toon(ctx, 0xc89f6a, 32, cy - 26, 94, 38);
    ctx.save();
    bread();
    ctx.clip();
    dots(
      ctx,
      [
        [48, cy + 4, 4],
        [70, cy - 2, 5],
        [96, cy - 6, 4],
        [112, cy - 16, 3],
      ],
      0x80b918,
      0.65,
    );
    ctx.restore();
    ctx.strokeStyle = rgb(0xfefae0);
    ctx.lineWidth = 3;
    for (const [x, y] of [
      [56, cy],
      [80, cy - 4],
      [102, cy - 12],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 4);
      ctx.lineTo(x + 5, y - 5);
      ctx.stroke();
    }
    shroom(ctx, 62, cy - 6, 6, 0x7b2cbf);
    shroom(ctx, 90, cy - 11, 4.5, 0x9d4edd);
    // 孢子
    glow(ctx, 118, cy - 22, 10, 0x80ed99, 0.6);
    dots(
      ctx,
      [
        [116, cy - 28, 2.5],
        [124, cy - 26, 2],
        [110, cy - 26, 1.8],
      ],
      0xc7f9cc,
    );
  },

  // 霜寒菌丝回旋镖：Y 形三翼回旋镖，每片翼是结霜的冰蓝蘑菇伞片（带菌褶），中心嵌一枚电饭煲内锅般的金属圆盘
  fz_mycelium_boomerang_rice_cooker_aura(ctx) {
    const x = 64;
    glow(ctx, x, cy, 32, 0xcaf0f8, 0.45);
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 3;
      ctx.save();
      ctx.translate(x, cy);
      ctx.rotate(a);
      // 伞片翼：根部窄、外端圆
      const wing = () => {
        ctx.beginPath();
        ctx.moveTo(4, -6);
        ctx.quadraticCurveTo(16, -15, 27, -10);
        ctx.quadraticCurveTo(33, 0, 27, 10);
        ctx.quadraticCurveTo(16, 15, 4, 6);
        ctx.closePath();
      };
      wing();
      toon(ctx, 0x90e0ef, 4, -15, 29, 30, { outline: 0x1d3557, lineW: 3 });
      ctx.save();
      wing();
      ctx.clip();
      ctx.strokeStyle = rgb(0x0077b6, 0.55);
      ctx.lineWidth = 1.2;
      for (const t of [-0.5, -0.25, 0, 0.25, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(8, t * 6);
        ctx.lineTo(32, t * 26);
        ctx.stroke();
      }
      ctx.fillStyle = rgb(0xffffff, 0.75);
      ctx.beginPath();
      ctx.ellipse(27, 0, 4, 11, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      dots(
        ctx,
        [
          [18, -7, 2],
          [22, 6, 1.6],
        ],
        0xffffff,
        0.9,
      );
      ctx.restore();
    }
    // 内锅圆盘
    ctx.beginPath();
    ctx.arc(x, cy, 11, 0, TAU);
    metal(ctx, x - 11, cy - 11, 22, 22, 0xced4da);
    ctx.beginPath();
    ctx.arc(x, cy, 7, 0, TAU);
    ctx.fillStyle = rgb(0x6c757d);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (const [px, py, r] of [
      [x - 2, cy - 2, 0.5],
      [x + 3, cy + 1, -0.6],
      [x - 1, cy + 3, 1.2],
    ]) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(r);
      ellipsePath(ctx, 0, 0, 2.4, 1.3);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
    snow(ctx, x + 30, cy - 22, 3.5);
    snow(ctx, x - 32, cy + 20, 3);
  },
  // 贯穿孜然飞镖：四尖长刃手里剑，每片刃都是带切缝的切片器钢板，中心是一圈孜然籽，斜角再伸出四根短尖
  fz_cumin_star_mandoline(ctx) {
    const x = 64;
    starPath(ctx, x, cy, 22, 9, 4, Math.PI / 4);
    toon(ctx, 0x8d6e63, x - 20, cy - 20, 40, 40, { lineW: 2.5, noShine: true });
    starPath(ctx, x, cy, 30, 12, 4, 0);
    metal(ctx, x - 30, cy - 30, 60, 60, 0xe9ecef);
    // 切缝
    ctx.strokeStyle = rgb(0x495057);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      for (const t of [13, 19]) {
        const px = x + Math.cos(a) * t,
          py = cy + Math.sin(a) * t;
        ctx.beginPath();
        ctx.moveTo(px - Math.sin(a) * 2.5, py + Math.cos(a) * 2.5);
        ctx.lineTo(px + Math.sin(a) * 2.5, py - Math.cos(a) * 2.5);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.arc(x, cy, 9, 0, TAU);
    toon(ctx, 0xa0522d, x - 9, cy - 9, 18, 18, { lineW: 2.5 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      ctx.save();
      ctx.translate(x + Math.cos(a) * 5, cy + Math.sin(a) * 5);
      ctx.rotate(a);
      ellipsePath(ctx, 0, 0, 2.6, 1.2);
      ctx.fillStyle = rgb(0xe9c46a);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(x, cy, 2.5, 0, TAU);
    ctx.fillStyle = rgb(0x2a1614);
    ctx.fill();
    // 甩出的孜然籽
    for (const [px, py, a] of [
      [102, cy - 20, 0.5],
      [110, cy + 16, -0.4],
      [24, cy + 18, 0.8],
    ]) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a);
      ellipsePath(ctx, 0, 0, 3.5, 1.6);
      toon(ctx, 0xbc8a5f, -3.5, -1.6, 7, 3.2, { lineW: 1.2, noShine: true });
      ctx.restore();
    }
  },

  // 鲜果松肉锤：锤头是一整块带绿皮的方形西瓜，锤面排满黑瓜子尖钉，锤头顶上架着一根小瓜子枪管
  fz_meat_tenderizer_seed_spitter(ctx) {
    handle(ctx, 4, 78, cy, 11, 0x6f4518);
    roundRectPath(ctx, 66, cy - 7, 12, 14, 3);
    metal(ctx, 66, cy - 7, 12, 14, 0x8d99ae);
    // 枪管
    roundRectPath(ctx, 82, cy - 30, 34, 7, 3);
    metal(ctx, 82, cy - 30, 34, 7, 0x2d6a4f);
    // 西瓜锤头：绿皮 + 白层 + 红瓤
    roundRectPath(ctx, 76, cy - 24, 38, 48, 6);
    toon(ctx, 0x2d6a4f, 76, cy - 24, 38, 48, { noShine: true });
    roundRectPath(ctx, 82, cy - 22, 32, 44, 5);
    ctx.fillStyle = rgb(0xf1faee);
    ctx.fill();
    roundRectPath(ctx, 86, cy - 21, 28, 42, 5);
    toon(ctx, 0xef476f, 86, cy - 21, 28, 42, { lineW: 2 });
    roundRectPath(ctx, 76, cy - 24, 38, 48, 6);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    dots(
      ctx,
      [
        [94, cy - 12, 1.8],
        [104, cy - 4, 1.8],
        [94, cy + 6, 1.8],
        [104, cy + 14, 1.8],
      ],
      0x2a1614,
    );
    // 瓜子尖钉锤面
    for (let y = cy - 18; y <= cy + 18; y += 6) {
      ctx.beginPath();
      ctx.moveTo(113, y - 3);
      ctx.quadraticCurveTo(122, y - 2, 125, y);
      ctx.quadraticCurveTo(122, y + 2, 113, y + 3);
      ctx.closePath();
      ctx.fillStyle = rgb(0x2a1614);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(116, y - 1, 3, 1);
    }
    dots(ctx, [[120, cy - 27, 2.5]], 0x2a1614);
  },
};
