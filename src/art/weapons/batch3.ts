// 武器专属造型 · 第 3 批：规则生成（三）
// 每个函数在 128×64 画布上画一把武器：手柄 / 握把在左、朝右，中线 y = 32，描边统一用 OUTLINE，上色用 toon / metal
import {
  type Ctx,
  OUTLINE,
  rgb,
  lighten,
  darken,
  ellipsePath,
  roundRectPath,
  smoothPath,
  polarPath,
  starPath,
  toon,
  glow,
  rng,
} from '../Painter';
import { handle, metal } from '../weaponKit';

const cy = 32;

/** 先粗描边再细彩线的线条（当前路径） */
const line2 = (ctx: Ctx, w: number, c: number) => {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w + 3;
  ctx.stroke();
  ctx.strokeStyle = rgb(c);
  ctx.lineWidth = w;
  ctx.stroke();
};

/** 圆点 */
const dot = (ctx: Ctx, x: number, y: number, r: number, c: string) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = c;
  ctx.fill();
};

/** 四角闪光 */
const sparkle = (ctx: Ctx, x: number, y: number, r: number, c: string) => {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fillStyle = c;
  ctx.fill();
};

/** 闪电折线 */
const bolt = (ctx: Ctx, pts: [number, number][], c = '#fff3b0') => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = 'rgba(80,180,255,0.6)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = c;
  ctx.lineWidth = 2.5;
  ctx.stroke();
};

/** 局部坐标系里画（平移 + 旋转） */
const at = (ctx: Ctx, x: number, y: number, a: number, draw: () => void) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  draw();
  ctx.restore();
};

/** 锯齿叶片路径：从 (x,y) 沿角度 a 长 len、最宽 w，n 个齿 */
const leafPath = (ctx: Ctx, x: number, y: number, a: number, len: number, w: number, n: number) => {
  const pts: [number, number][] = [];
  const ca = Math.cos(a),
    sa = Math.sin(a);
  const P = (u: number, v: number): [number, number] => [x + u * ca - v * sa, y + u * sa + v * ca];
  const N = n * 2;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const hw = w * Math.pow(Math.sin(Math.PI * t), 0.8) * (i % 2 ? 1.12 : 0.92);
    pts.push(P(t * len, -hw));
  }
  for (let i = N - 1; i > 0; i--) {
    const t = i / N;
    const hw = w * Math.pow(Math.sin(Math.PI * t), 0.8) * (i % 2 ? 1.12 : 0.92);
    pts.push(P(t * len, hw));
  }
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
};

/** 一把小菜刀（局部坐标：手柄从 0 起，刀背在上） */
const miniCleaver = (ctx: Ctx, c: number, hc: number) => {
  handle(ctx, 0, 40, 0, 9, hc);
  ctx.beginPath();
  ctx.moveTo(38, -15);
  ctx.lineTo(84, -15);
  ctx.lineTo(84, 8);
  ctx.quadraticCurveTo(60, 13, 38, 7);
  ctx.closePath();
  metal(ctx, 38, -15, 46, 28, c);
  ctx.beginPath();
  ctx.arc(76, -8, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#495057';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(43, 5);
  ctx.quadraticCurveTo(62, 9, 81, 6);
  ctx.stroke();
};

export const ART: Record<string, (ctx: Ctx) => void> = {
  // 火炭雷：扁平铁盘地雷上堆着三块裂纹发红光的火炭，火星四溅
  ember_mine: (ctx) => {
    glow(ctx, 64, 28, 36, 0xff6b00, 0.55);
    ellipsePath(ctx, 64, 46, 42, 13);
    metal(ctx, 22, 33, 84, 26, 0x6c6f78);
    ctx.fillStyle = rgb(0xffd166);
    for (const x of [32, 48, 64, 80, 96]) dot(ctx, x, 50, 2.2, '#ffb703');
    ellipsePath(ctx, 64, 41, 36, 9);
    toon(ctx, 0x3a3d44, 28, 32, 72, 18, { noShine: true, lineW: 2.5 });
    const r = rng(7);
    for (const [x, y, s] of [
      [46, 33, 13],
      [82, 33, 13],
      [64, 24, 15],
    ]) {
      const k = [0, 1, 2, 3, 4, 5, 6].map(() => 0.78 + r() * 0.3);
      polarPath(ctx, x, y, 7, (a) => {
        const i = Math.round(((a + Math.PI / 2) / (Math.PI * 2)) * 7) % 7;
        return [s * k[i], s * 0.8 * k[i]];
      });
      toon(ctx, 0x2b2522, x - s, y - s, s * 2, s * 2, { noShine: true, lineW: 2.5 });
      ctx.save();
      ctx.clip();
      glow(ctx, x, y + 2, s, 0xff5400, 0.8);
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.6, y - 2);
      ctx.lineTo(x - 2, y + 2);
      ctx.lineTo(x + 3, y - 4);
      ctx.lineTo(x + s * 0.7, y + 3);
      ctx.moveTo(x - 2, y + 2);
      ctx.lineTo(x, y + s * 0.7);
      ctx.stroke();
      ctx.restore();
    }
    for (const [x, y, s] of [
      [40, 10, 4],
      [92, 8, 5],
      [108, 22, 3.5],
      [22, 24, 3],
      [66, 5, 3],
    ])
      sparkle(ctx, x, y, s, '#ffd166');
  },
  // 孜然飞镖：两枚四刃手里剑，每片刃都是带棱纹的孜然籽形状
  cumin_star: (ctx) => {
    glow(ctx, 56, cy, 34, 0xe09f3e, 0.4);
    const star = (x: number, y: number, R: number, rot: number) => {
      for (let k = 0; k < 4; k++) {
        const a = rot + (k * Math.PI) / 2;
        at(ctx, x, y, a, () => {
          ctx.beginPath();
          ctx.moveTo(R * 0.15, -R * 0.24);
          ctx.quadraticCurveTo(R * 0.6, -R * 0.34, R, 0);
          ctx.quadraticCurveTo(R * 0.6, R * 0.22, R * 0.15, R * 0.2);
          ctx.closePath();
          toon(ctx, 0xb5835a, 0, -R * 0.3, R, R * 0.55, { noShine: true, lineW: 2.5 });
          ctx.strokeStyle = rgb(0x6f4518);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(R * 0.3, -R * 0.12);
          ctx.quadraticCurveTo(R * 0.6, -R * 0.14, R * 0.88, -R * 0.02);
          ctx.moveTo(R * 0.3, R * 0.06);
          ctx.quadraticCurveTo(R * 0.6, R * 0.06, R * 0.88, 0.02);
          ctx.stroke();
        });
      }
      ctx.beginPath();
      ctx.arc(x, y, R * 0.3, 0, Math.PI * 2);
      metal(ctx, x - R * 0.3, y - R * 0.3, R * 0.6, R * 0.6, 0xadb5bd);
      dot(ctx, x, y, R * 0.11, '#2a1614');
    };
    star(104, 22, 17, 0.5);
    star(54, cy + 2, 29, 0.25);
    const r = rng(11);
    for (let i = 0; i < 9; i++) {
      const x = 86 + r() * 36,
        y = 38 + r() * 20;
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 1.4, r() * 3, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0x8d5b3a);
      ctx.fill();
    }
  },
  // 辣酱手枪：枪身是一瓶横放的红色辣酱（绿瓶盖当枪口），下面接握把和扳机护圈
  hot_sauce_gun: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(22, 36);
    ctx.lineTo(42, 36);
    ctx.lineTo(38, 58);
    ctx.quadraticCurveTo(28, 62, 18, 58);
    ctx.closePath();
    toon(ctx, 0x5a3a28, 18, 36, 24, 24, { noShine: true });
    ctx.beginPath();
    ctx.arc(50, 40, 7, 0, Math.PI);
    line2(ctx, 2.5, 0x343a40);
    ctx.beginPath();
    ctx.moveTo(16, 12);
    ctx.lineTo(70, 12);
    ctx.bezierCurveTo(80, 12, 84, 21, 92, 21);
    ctx.lineTo(102, 21);
    ctx.lineTo(102, 31);
    ctx.lineTo(92, 31);
    ctx.bezierCurveTo(84, 31, 80, 40, 70, 40);
    ctx.lineTo(16, 40);
    ctx.quadraticCurveTo(10, 40, 10, 34);
    ctx.lineTo(10, 18);
    ctx.quadraticCurveTo(10, 12, 16, 12);
    ctx.closePath();
    toon(ctx, 0xd62828, 10, 12, 92, 28);
    roundRectPath(ctx, 100, 18, 14, 16, 4);
    toon(ctx, 0x2d6a4f, 100, 18, 14, 16, { noShine: true, lineW: 2.5 });
    roundRectPath(ctx, 113, 23, 10, 6, 2);
    metal(ctx, 113, 23, 10, 6, 0xadb5bd);
    // 标签：白色菱形里一只小辣椒
    ctx.beginPath();
    ctx.moveTo(44, 15);
    ctx.lineTo(60, 26);
    ctx.lineTo(44, 37);
    ctx.lineTo(28, 26);
    ctx.closePath();
    ctx.fillStyle = '#fff3e0';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(36, 24);
    ctx.quadraticCurveTo(46, 20, 53, 29);
    ctx.quadraticCurveTo(44, 31, 36, 28);
    ctx.closePath();
    ctx.fillStyle = '#e63946';
    ctx.fill();
    ctx.strokeStyle = rgb(0x2d6a4f);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, 26);
    ctx.lineTo(33, 22);
    ctx.stroke();
    // 枪口滴下的辣酱
    ctx.beginPath();
    ctx.moveTo(119, 29);
    ctx.quadraticCurveTo(125, 36, 121, 42);
    ctx.quadraticCurveTo(116, 38, 117, 29);
    ctx.fillStyle = '#e63946';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  },
  // 寿司刀：白木八角柄 + 黑角箍，极细长的柳刃，刀身上方飘着一片被切开的三文鱼
  sushi_blade: (ctx) => {
    roundRectPath(ctx, 4, cy - 5, 38, 10, 2);
    toon(ctx, 0xe9d8a6, 4, cy - 5, 38, 10, { noShine: true, lineW: 2.5 });
    ctx.strokeStyle = rgb(0xc9b27a);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(6, cy - 1.5);
    ctx.lineTo(40, cy - 1.5);
    ctx.moveTo(6, cy + 2);
    ctx.lineTo(40, cy + 2);
    ctx.stroke();
    roundRectPath(ctx, 40, cy - 6, 9, 12, 2);
    toon(ctx, 0x1b1b1b, 40, cy - 6, 9, 12, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(49, cy - 5);
    ctx.lineTo(116, cy - 5);
    ctx.quadraticCurveTo(124, cy - 4, 125, cy + 1);
    ctx.quadraticCurveTo(90, cy + 5, 49, cy + 5);
    ctx.closePath();
    metal(ctx, 49, cy - 5, 76, 10, 0xdee2e6);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 52; x < 116; x += 8) {
      ctx.moveTo(x, cy + 1);
      ctx.quadraticCurveTo(x + 2, cy - 1, x + 4, cy + 1);
      ctx.quadraticCurveTo(x + 6, cy + 3, x + 8, cy + 1);
    }
    ctx.stroke();
    // 三文鱼片（两半）
    for (const [x, y, a] of [
      [84, 15, -0.25],
      [104, 13, 0.3],
    ]) {
      at(ctx, x, y, a, () => {
        ctx.beginPath();
        ctx.moveTo(-9, 4);
        ctx.quadraticCurveTo(-8, -6, 9, -4);
        ctx.lineTo(9, 4);
        ctx.closePath();
        toon(ctx, 0xff8c5a, -9, -6, 18, 10, { lineW: 2 });
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, 2);
        ctx.lineTo(-1, -4);
        ctx.moveTo(1, 3);
        ctx.lineTo(4, -4);
        ctx.stroke();
      });
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(78, 24);
    ctx.lineTo(112, 22);
    ctx.stroke();
  },
  // 双持菜刀：两把小剁刀交叉成 X，刀柄在左
  twin_cleavers: (ctx) => {
    at(ctx, 4, 48, -0.33, () => miniCleaver(ctx, 0xced4da, 0x3d2c2e));
    ctx.save();
    ctx.translate(0, 64);
    ctx.scale(1, -1);
    at(ctx, 4, 48, -0.33, () => miniCleaver(ctx, 0xe9ecef, 0x9c2a2a));
    ctx.restore();
    sparkle(ctx, 116, 32, 6, '#fff3b0');
  },
  // 飞刀匣：铜包角的木匣，右侧扇形探出五把带环飞刀
  knife_case: (ctx) => {
    for (const a of [-0.36, 0.36, -0.18, 0.18, 0]) {
      at(ctx, 54, cy, a, () => {
        ctx.beginPath();
        ctx.arc(14, 0, 4, 0, Math.PI * 2);
        line2(ctx, 2, 0xadb5bd);
        roundRectPath(ctx, 18, -2.5, 16, 5, 2);
        toon(ctx, 0x2b2d42, 18, -2.5, 16, 5, { noShine: true, lineW: 2 });
        ctx.beginPath();
        ctx.moveTo(34, -5);
        ctx.lineTo(56, -3);
        ctx.lineTo(68, 0);
        ctx.lineTo(56, 3);
        ctx.lineTo(34, 5);
        ctx.closePath();
        metal(ctx, 34, -5, 34, 10, 0xdee2e6);
      });
    }
    roundRectPath(ctx, 8, 12, 54, 40, 5);
    toon(ctx, 0x8d5b3a, 8, 12, 54, 40, { noShine: true });
    ctx.strokeStyle = rgb(0x5c3a22, 0.7);
    ctx.lineWidth = 1.5;
    for (const y of [22, 32, 42]) {
      ctx.beginPath();
      ctx.moveTo(12, y);
      ctx.lineTo(58, y);
      ctx.stroke();
    }
    for (const [x, y] of [
      [8, 12],
      [50, 12],
      [8, 40],
      [50, 40],
    ]) {
      roundRectPath(ctx, x, y, 12, 12, 3);
      metal(ctx, x, y, 12, 12, 0xe9c46a);
    }
    roundRectPath(ctx, 28, 26, 14, 12, 3);
    metal(ctx, 28, 26, 14, 12, 0xe9c46a);
    dot(ctx, 35, 32, 2, '#2a1614');
  },
  // 刃风光环：一圈新月形小刀刃沿椭圆轨道飞旋，中间卷着青白色的风
  blade_aura: (ctx) => {
    glow(ctx, 64, cy, 36, 0xbde0fe, 0.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 3;
    for (const [rx, ry, s] of [
      [38, 20, 0.3],
      [26, 13, 2.2],
      [14, 7, 4],
    ]) {
      ctx.beginPath();
      ctx.ellipse(64, cy, rx, ry, -0.12, s, s + Math.PI * 1.3);
      ctx.stroke();
    }
    for (let k = 0; k < 7; k++) {
      const t = (k / 7) * Math.PI * 2;
      const x = 64 + Math.cos(t) * 44,
        y = cy + Math.sin(t) * 21;
      const a = Math.atan2(Math.cos(t) * 21, -Math.sin(t) * 44);
      at(ctx, x, y, a, () => {
        ctx.beginPath();
        ctx.moveTo(-13, 4);
        ctx.quadraticCurveTo(-2, -14, 14, -2);
        ctx.quadraticCurveTo(0, -4, -13, 4);
        ctx.closePath();
        ctx.fillStyle = rgb(0xe9ecef);
        ctx.fill();
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(120,200,255,0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-9, 1);
        ctx.quadraticCurveTo(0, -5, 10, -2);
        ctx.stroke();
      });
    }
    sparkle(ctx, 64, cy, 6, '#ffffff');
  },
  // 刨丝刀：黑柄 + 细长带框刨板，板上一排排刨孔，刨下的奶酪丝卷落下来
  grater_sweep: (ctx) => {
    handle(ctx, 4, 44, cy, 12, 0x2b2d42);
    roundRectPath(ctx, 40, cy - 12, 84, 24, 6);
    metal(ctx, 40, cy - 12, 84, 24, 0x8d99ae);
    roundRectPath(ctx, 46, cy - 8, 70, 16, 3);
    metal(ctx, 46, cy - 8, 70, 16, 0xdee2e6);
    for (let x = 50; x < 112; x += 6)
      for (const dy of [-4, 0, 4]) {
        const ox = dy === 0 ? 3 : 0;
        ctx.beginPath();
        ctx.ellipse(x + ox, cy + dy, 1.8, 1.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#343a40';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + ox, cy + dy + 0.5, 2, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    dot(ctx, 119, cy, 3, '#2a1614');
    for (const [x, y, a] of [
      [62, 52, 0.4],
      [80, 55, -0.5],
      [98, 51, 0.2],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 3);
      ctx.quadraticCurveTo(x + 2, y - 7 + a * 6, x + 6, y + 2);
      line2(ctx, 2.5, 0xffd23f);
    }
  },
  // 剁椒飞轮：带斜齿的圆锯片，沾满红剁椒碎和青椒丁，中间是轴心
  chili_shuriken: (ctx) => {
    glow(ctx, 64, cy, 34, 0xff5400, 0.45);
    const n = 14;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const b = a + (Math.PI * 2) / n;
      ctx.lineTo(64 + Math.cos(a) * 23, cy + Math.sin(a) * 23);
      ctx.lineTo(64 + Math.cos(b - 0.12) * 29, cy + Math.sin(b - 0.12) * 29);
    }
    ctx.closePath();
    metal(ctx, 35, cy - 29, 58, 58, 0xced4da);
    ctx.beginPath();
    ctx.arc(64, cy, 19, 0, Math.PI * 2);
    ctx.fillStyle = rgb(0xadb5bd);
    ctx.fill();
    // 剁椒酱涂抹
    polarPath(ctx, 64, cy, 9, (a) => {
      const k = 15 + Math.sin(a * 5 + 1) * 1.8 + Math.cos(a * 2) * 1.5;
      return [k, k];
    });
    toon(ctx, 0xc1121f, 46, cy - 18, 36, 36, { noShine: true, lineW: 2 });
    const r = rng(23);
    for (let i = 0; i < 12; i++) {
      const a = r() * Math.PI * 2,
        d = 5 + r() * 10;
      const x = 64 + Math.cos(a) * d,
        y = cy + Math.sin(a) * d;
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 1.5);
      ctx.lineTo(x + 2.5, y - 0.5);
      ctx.lineTo(x - 0.5, y + 2.5);
      ctx.closePath();
      ctx.fillStyle = i % 3 ? '#ff6b35' : '#80b918';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(64, cy, 6, 0, Math.PI * 2);
    metal(ctx, 58, cy - 6, 12, 12, 0x6c757d);
    dot(ctx, 64, cy, 2.5, '#2a1614');
  },
  // 切片器：握把接一块斜放的平切板，板上推着半根黄瓜过斜刀口，下方支脚，刀口后飞出一串黄瓜片
  mandoline: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(78, 40);
    ctx.lineTo(90, 58);
    ctx.moveTo(86, 40);
    ctx.lineTo(76, 58);
    line2(ctx, 3, 0x6c757d);
    handle(ctx, 4, 30, 36, 11, 0x2a9d8f);
    ctx.beginPath();
    ctx.moveTo(32, 32);
    ctx.lineTo(104, 26);
    ctx.lineTo(106, 36);
    ctx.lineTo(28, 44);
    ctx.closePath();
    toon(ctx, 0xf1f3f5, 28, 26, 78, 18, { noShine: true });
    ctx.beginPath();
    ctx.moveTo(28, 44);
    ctx.lineTo(106, 36);
    ctx.lineTo(106, 40);
    ctx.lineTo(28, 48);
    ctx.closePath();
    toon(ctx, 0x2a9d8f, 28, 36, 78, 12, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(72, 29.5);
    ctx.lineTo(80, 29);
    ctx.lineTo(86, 37.5);
    ctx.lineTo(78, 38.5);
    ctx.closePath();
    metal(ctx, 72, 29, 14, 10, 0x9aa5b1);
    // 半根黄瓜
    ctx.beginPath();
    ctx.ellipse(52, 28, 18, 8, -0.08, 0, Math.PI * 2);
    toon(ctx, 0x2d6a4f, 34, 20, 36, 16, { lineW: 2.5 });
    ctx.beginPath();
    ctx.ellipse(69, 27, 4, 7.5, -0.08, 0, Math.PI * 2);
    toon(ctx, 0xb7e4c7, 65, 19, 8, 15, { noShine: true, lineW: 2 });
    ctx.fillStyle = rgb(0xb7e4c7);
    for (const x of [42, 50, 58]) dot(ctx, x, 26, 1.4, rgb(0xb7e4c7));
    for (const [x, y, s] of [
      [104, 16, 0.75],
      [113, 22, 0.9],
      [121, 30, 1],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 4 * s, 7 * s, 0.3, 0, Math.PI * 2);
      toon(ctx, 0x52b788, x - 4, y - 7, 8, 14, { noShine: true, lineW: 2 });
      ctx.beginPath();
      ctx.ellipse(x, y, 2.6 * s, 5 * s, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0xd8f3dc);
      ctx.fill();
    }
  },
  // 椰子炮：带竹节的竹筒炮管 + 铜箍，炮口顶着一颗毛茸茸的整椰子
  coconut_cannon: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(28, 38);
    ctx.lineTo(44, 38);
    ctx.lineTo(40, 58);
    ctx.quadraticCurveTo(30, 62, 22, 58);
    ctx.closePath();
    toon(ctx, 0x6b4226, 22, 38, 22, 22, { noShine: true });
    ctx.beginPath();
    ctx.arc(12, 28, 7, 0, Math.PI * 2);
    toon(ctx, 0x6c757d, 5, 21, 14, 14, { lineW: 2.5 });
    roundRectPath(ctx, 14, 15, 80, 26, 8);
    toon(ctx, 0x95b85a, 14, 15, 80, 26);
    ctx.strokeStyle = rgb(0x4f772d);
    ctx.lineWidth = 3;
    for (const x of [38, 62]) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, 40);
      ctx.stroke();
    }
    for (const x of [22, 78]) {
      roundRectPath(ctx, x, 13, 7, 30, 2);
      metal(ctx, x, 13, 7, 30, 0xe9c46a);
    }
    roundRectPath(ctx, 88, 11, 9, 34, 3);
    metal(ctx, 88, 11, 9, 34, 0xe9c46a);
    // 椰子
    ctx.beginPath();
    ctx.arc(109, 28, 16, 0, Math.PI * 2);
    toon(ctx, 0x7f5539, 93, 12, 32, 32);
    ctx.save();
    ctx.beginPath();
    ctx.arc(109, 28, 16, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = rgb(0x4a2c17, 0.7);
    ctx.lineWidth = 1.3;
    const r = rng(5);
    for (let i = 0; i < 18; i++) {
      const x = 94 + r() * 30,
        y = 13 + r() * 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 3 - r() * 6, y + 4);
      ctx.stroke();
    }
    ctx.restore();
    for (const [x, y] of [
      [104, 24],
      [113, 24],
      [108.5, 32],
    ])
      dot(ctx, x, y, 2.6, '#2a1614');
  },
  // 南瓜迫击炮：掏空的大南瓜本身就是炮身（刻着发光鬼脸），瓜蒂变成朝上的短粗炮口，左侧木握把和冒火星的引信，炮口蹦出小南瓜灯炸弹
  pumpkin_mortar: (ctx) => {
    glow(ctx, 60, 40, 30, 0xff7b00, 0.4);
    handle(ctx, 4, 30, 42, 11, 0x8d5b3a);
    ctx.beginPath();
    ctx.moveTo(34, 24);
    ctx.bezierCurveTo(28, 14, 20, 18, 16, 10);
    line2(ctx, 2, 0xc9b27a);
    sparkle(ctx, 15, 8, 5, '#ffd166');
    for (const [dx, rx, sh] of [
      [-20, 18, true],
      [20, 18, true],
      [-9, 18, true],
      [9, 18, true],
      [0, 15, false],
    ] as const) {
      ellipsePath(ctx, 62 + dx, 41, rx, 19);
      toon(ctx, 0xf77f00, 62 + dx - rx, 22, rx * 2, 38, { noShine: sh, lineW: 2.5 });
    }
    // 发光鬼脸
    ctx.fillStyle = '#ffe066';
    for (const x of [50, 74]) {
      ctx.beginPath();
      ctx.moveTo(x - 6, 40);
      ctx.lineTo(x + 6, 40);
      ctx.lineTo(x, 32);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(44, 46);
    ctx.lineTo(50, 50);
    ctx.lineTo(56, 47);
    ctx.lineTo(62, 51);
    ctx.lineTo(68, 47);
    ctx.lineTo(74, 50);
    ctx.lineTo(80, 46);
    ctx.quadraticCurveTo(76, 56, 62, 56);
    ctx.quadraticCurveTo(48, 56, 44, 46);
    ctx.closePath();
    ctx.fill();
    // 瓜蒂炮口
    ctx.beginPath();
    ctx.moveTo(56, 25);
    ctx.lineTo(58, 12);
    ctx.lineTo(74, 10);
    ctx.lineTo(70, 25);
    ctx.closePath();
    toon(ctx, 0x6a994e, 56, 10, 18, 15, { noShine: true, lineW: 2.5 });
    ellipsePath(ctx, 66, 10.5, 9, 3.5);
    toon(ctx, 0x386641, 57, 7, 18, 7, { noShine: true, lineW: 2.5 });
    ellipsePath(ctx, 66, 10.5, 6, 2);
    ctx.fillStyle = '#2a1614';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(72, 18);
    ctx.quadraticCurveTo(84, 14, 84, 22);
    line2(ctx, 2, 0x90be6d);
    // 小南瓜灯炸弹
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(78, 8);
    ctx.quadraticCurveTo(88, 2, 96, 6);
    ctx.stroke();
    for (const dx of [-4, 4, 0]) {
      ellipsePath(ctx, 106 + dx, 14, 7, 8);
      toon(ctx, 0xf77f00, 99 + dx, 6, 14, 16, { noShine: dx !== 0, lineW: 2 });
    }
    ctx.beginPath();
    ctx.moveTo(106, 6);
    ctx.lineTo(108, 3);
    line2(ctx, 1.8, 0x6a994e);
    ctx.fillStyle = '#ffe066';
    for (const x of [103, 109]) {
      ctx.beginPath();
      ctx.moveTo(x - 2, 14);
      ctx.lineTo(x + 2, 14);
      ctx.lineTo(x, 11);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillRect(102, 17, 8, 2);
  },
  // 西瓜榴弹：带西瓜条纹的蛋形手雷，左边是引信头、保险握片和拉环，后面跟一颗小的
  melon_grenade: (ctx) => {
    const melon = (x: number, y: number, rx: number, ry: number) => {
      ellipsePath(ctx, x, y, rx, ry);
      toon(ctx, 0x52b788, x - rx, y - ry, rx * 2, ry * 2);
      ctx.save();
      ellipsePath(ctx, x, y, rx, ry);
      ctx.clip();
      ctx.strokeStyle = rgb(0x1b4332);
      ctx.lineWidth = Math.max(2.5, rx * 0.14);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        const yy = y + i * ry * 0.42;
        ctx.moveTo(x - rx, yy);
        for (let k = 1; k <= 8; k++) ctx.lineTo(x - rx + (k * rx) / 4, yy + (k % 2 ? -2.5 : 2.5));
        ctx.stroke();
      }
      ctx.restore();
      ellipsePath(ctx, x, y, rx, ry);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };
    melon(108, 46, 13, 10);
    roundRectPath(ctx, 99, 40, 4, 12, 1.5);
    metal(ctx, 99, 40, 4, 12, 0x6c757d);
    melon(72, 34, 32, 23);
    roundRectPath(ctx, 30, 24, 14, 20, 4);
    metal(ctx, 30, 24, 14, 20, 0x6c757d);
    ctx.beginPath();
    ctx.moveTo(38, 24);
    ctx.quadraticCurveTo(52, 6, 86, 12);
    line2(ctx, 4, 0xadb5bd);
    ctx.beginPath();
    ctx.arc(20, 34, 7, 0, Math.PI * 2);
    line2(ctx, 2.5, 0xffd166);
    ctx.beginPath();
    ctx.moveTo(27, 34);
    ctx.lineTo(32, 34);
    line2(ctx, 2, 0xffd166);
  },
  // 土豆地雷：半埋在土堆里的坑洼土豆，顶上插着闪红光的引爆钮
  potato_mine: (ctx) => {
    ellipsePath(ctx, 64, 52, 50, 9);
    toon(ctx, 0x7f5539, 14, 43, 100, 18, { noShine: true });
    ctx.beginPath();
    ctx.moveTo(64, 20);
    ctx.lineTo(64, 9);
    line2(ctx, 2.5, 0x6c757d);
    glow(ctx, 64, 8, 9, 0xff3b30, 0.9);
    dot(ctx, 64, 8, 4, '#ff3b30');
    smoothPath(ctx, [
      [30, 44],
      [28, 32],
      [40, 20],
      [58, 18],
      [76, 17],
      [94, 22],
      [100, 34],
      [96, 46],
      [64, 50],
    ]);
    toon(ctx, 0xc89f62, 28, 17, 72, 33);
    for (const [x, y] of [
      [42, 30],
      [56, 38],
      [74, 27],
      [86, 38],
      [48, 24],
      [90, 28],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 2.5, 1.6, 0.4, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0x8d6234);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(84, 21);
    ctx.quadraticCurveTo(88, 12, 94, 12);
    line2(ctx, 2, 0xb5e48c);
    // 土粒
    for (const [x, y] of [
      [22, 48],
      [104, 47],
      [36, 56],
      [94, 56],
    ])
      dot(ctx, x, y, 2, '#5c3a22');
  },
  // 玉米散弹：木枪托 + 裹着玉米苞叶的枪管，枪口是喇叭形铜口，喷出玉米粒
  corn_scatter: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 36);
    ctx.lineTo(36, 26);
    ctx.lineTo(40, 38);
    ctx.lineTo(10, 52);
    ctx.quadraticCurveTo(3, 50, 4, 36);
    ctx.closePath();
    toon(ctx, 0x8d5b3a, 3, 26, 37, 26, { noShine: true });
    roundRectPath(ctx, 32, 22, 64, 14, 5);
    metal(ctx, 32, 22, 64, 14, 0x6c757d);
    for (const [x, a] of [
      [42, -0.25],
      [60, 0.2],
      [76, -0.2],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x + 6, 29, 12, 5, a, 0, Math.PI * 2);
      toon(ctx, 0x90be6d, x - 6, 24, 24, 10, { noShine: true, lineW: 2 });
    }
    ctx.beginPath();
    ctx.moveTo(92, 24);
    ctx.quadraticCurveTo(104, 22, 112, 12);
    ctx.lineTo(116, 14);
    ctx.lineTo(116, 44);
    ctx.lineTo(112, 46);
    ctx.quadraticCurveTo(104, 36, 92, 34);
    ctx.closePath();
    metal(ctx, 92, 12, 24, 34, 0xe9c46a);
    ellipsePath(ctx, 115, 29, 3.5, 14);
    ctx.fillStyle = '#3d2c2e';
    ctx.fill();
    for (const [x, y] of [
      [122, 14],
      [124, 26],
      [121, 38],
      [124, 48],
      [120, 6],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 2.6, 0, 0, Math.PI * 2);
      toon(ctx, 0xffd23f, x - 3, y - 3, 6, 6, { noShine: true, lineW: 1.5 });
    }
  },
  // 豆荚狙击：叶片形枪托 + 长长的弯豆荚枪管（裂口露出一排豆子），藤蔓瞄准镜和两脚架
  pea_sniper: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(88, 36);
    ctx.lineTo(80, 56);
    ctx.moveTo(90, 36);
    ctx.lineTo(100, 56);
    line2(ctx, 2.5, 0x6c757d);
    leafPath(ctx, 4, 40, -0.25, 36, 9, 3);
    toon(ctx, 0x2d6a4f, 4, 30, 36, 20, { noShine: true });
    roundRectPath(ctx, 34, 26, 22, 14, 4);
    toon(ctx, 0x386641, 34, 26, 22, 14, { noShine: true });
    ctx.beginPath();
    ctx.moveTo(52, 28);
    ctx.quadraticCurveTo(90, 22, 124, 24);
    ctx.quadraticCurveTo(92, 42, 52, 38);
    ctx.closePath();
    toon(ctx, 0x70e000, 52, 22, 72, 18);
    ctx.beginPath();
    ctx.moveTo(58, 32);
    ctx.quadraticCurveTo(88, 28, 116, 26);
    ctx.quadraticCurveTo(88, 36, 58, 34);
    ctx.closePath();
    ctx.fillStyle = rgb(0x386641);
    ctx.fill();
    for (const x of [64, 76, 88, 100]) {
      const y = 32.5 - (x - 60) * 0.06;
      ctx.beginPath();
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      toon(ctx, 0xb5e48c, x - 4, y - 4, 8, 8, { lineW: 1.5 });
    }
    roundRectPath(ctx, 40, 12, 34, 9, 4);
    toon(ctx, 0x4f772d, 40, 12, 34, 9, { noShine: true, lineW: 2.5 });
    dot(ctx, 74, 16.5, 3.5, '#9bf6ff');
    ctx.beginPath();
    ctx.moveTo(48, 21);
    ctx.lineTo(48, 27);
    ctx.moveTo(66, 21);
    ctx.lineTo(66, 26);
    line2(ctx, 2, 0x4f772d);
    ctx.beginPath();
    ctx.moveTo(40, 15);
    ctx.bezierCurveTo(32, 12, 30, 4, 36, 4);
    ctx.bezierCurveTo(40, 4, 40, 9, 37, 9);
    ctx.strokeStyle = rgb(0x52b788);
    ctx.lineWidth = 2;
    ctx.stroke();
  },
  // 薄荷清凉光环：悬浮的一枝三叶锯齿薄荷，周围飘着雪花和冷光
  mint_aura: (ctx) => {
    glow(ctx, 64, cy, 36, 0x9bf6ff, 0.7);
    ctx.beginPath();
    ctx.moveTo(64, 56);
    ctx.quadraticCurveTo(62, 48, 64, 40);
    line2(ctx, 3, 0x40916c);
    for (const [a, len, w] of [
      [-2.75, 36, 11],
      [-0.39, 36, 11],
      [-1.57, 32, 11],
    ]) {
      leafPath(ctx, 64, 42, a, len, w, 5);
      toon(ctx, 0x52b788, 64 - 36, 4, 72, 40, { lineW: 2.5 });
      ctx.strokeStyle = rgb(0xd8f3dc, 0.9);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(64, 42);
      ctx.lineTo(64 + Math.cos(a) * len * 0.85, 42 + Math.sin(a) * len * 0.85);
      for (const t of [0.35, 0.6]) {
        const bx = 64 + Math.cos(a) * len * t,
          by = 42 + Math.sin(a) * len * t;
        for (const s of [-1, 1]) {
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(a + s * 0.8) * 7, by + Math.sin(a + s * 0.8) * 7);
        }
      }
      ctx.stroke();
    }
    const flake = (x: number, y: number, r: number) => {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3;
        ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.stroke();
    };
    flake(20, 14, 5);
    flake(108, 12, 5);
    flake(106, 50, 4);
    flake(22, 50, 4);
  },
  // 胡椒风暴：悬浮的灰褐色龙卷风漏斗，旋带里卷着一颗颗黑胡椒粒
  pepper_storm_aura: (ctx) => {
    glow(ctx, 64, cy, 36, 0xff7b00, 0.4);
    const L: [number, number][] = [],
      R: [number, number][] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const y = 6 + t * 52;
      const w = 34 * (1 - t) + 5 * t;
      const sx = Math.sin(t * 5) * 5 * t;
      L.push([64 + sx - w, y]);
      R.push([64 + sx + w, y]);
    }
    ctx.beginPath();
    L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    R.reverse().forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    toon(ctx, 0xa89a88, 30, 6, 68, 52, { noShine: true });
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2.5;
    for (let i = 1; i < 7; i++) {
      const t = i / 8;
      const y = 6 + t * 52;
      const w = 34 * (1 - t) + 5 * t;
      const sx = Math.sin(t * 5) * 5 * t;
      ctx.beginPath();
      ctx.ellipse(64 + sx, y, w * 0.85, 3, 0, 0.1, Math.PI - 0.6);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(64, 8, 32, 5, 0, 0, Math.PI * 2);
    toon(ctx, 0xc9bba8, 32, 3, 64, 10, { noShine: true, lineW: 2 });
    for (const [x, y, r] of [
      [26, 18, 4.5],
      [104, 16, 4.5],
      [34, 38, 4],
      [96, 40, 4],
      [50, 52, 3.5],
      [84, 56, 3],
      [116, 30, 3.5],
      [14, 30, 3.5],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      toon(ctx, 0x2b2522, x - r, y - r, r * 2, r * 2, { lineW: 1.5 });
    }
  },
  // 蜂蜜光环：悬浮的陶土蜂蜜罐，罐口溢出金色蜂蜜往下淌，插着蜂蜜棒，旁边一只小蜜蜂
  honey_aura: (ctx) => {
    glow(ctx, 64, cy, 36, 0xffb703, 0.7);
    ctx.beginPath();
    ctx.moveTo(78, 22);
    ctx.lineTo(98, 6);
    line2(ctx, 3, 0xc68b59);
    ctx.beginPath();
    ctx.ellipse(101, 8, 6, 4.5, -0.7, 0, Math.PI * 2);
    toon(ctx, 0xc68b59, 95, 3, 12, 10, { noShine: true, lineW: 2 });
    ctx.beginPath();
    ctx.ellipse(64, 40, 28, 20, 0, 0, Math.PI * 2);
    toon(ctx, 0xbc6c25, 36, 20, 56, 40);
    roundRectPath(ctx, 44, 16, 40, 9, 4);
    toon(ctx, 0x99582a, 44, 16, 40, 9, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(44, 21);
    ctx.lineTo(84, 21);
    ctx.lineTo(84, 26);
    ctx.quadraticCurveTo(80, 36, 76, 26);
    ctx.quadraticCurveTo(70, 30, 66, 26);
    ctx.quadraticCurveTo(60, 42, 56, 26);
    ctx.quadraticCurveTo(50, 30, 48, 26);
    ctx.quadraticCurveTo(46, 34, 44, 26);
    ctx.closePath();
    toon(ctx, 0xffb703, 44, 18, 40, 20, { lineW: 2 });
    ctx.beginPath();
    ctx.ellipse(64, 18, 18, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgb(0xffd166);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    // 小蜜蜂
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const dx of [-3, 3]) {
      ctx.beginPath();
      ctx.ellipse(22 + dx, 14, 3.5, 5, dx * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(22, 21, 7, 5, 0, 0, Math.PI * 2);
    toon(ctx, 0xffd166, 15, 16, 14, 10, { noShine: true, lineW: 2 });
    ctx.fillStyle = OUTLINE;
    for (const x of [20, 24]) ctx.fillRect(x, 17, 2, 8);
  },
  // 茶壶雷暴：青花瓷圆茶壶（左侧环形把手、右侧弯壶嘴），壶嘴喷出闪电和雷云
  teapot_storm: (ctx) => {
    glow(ctx, 112, 14, 16, 0x9bf6ff, 0.8);
    ctx.beginPath();
    ctx.arc(28, 38, 11, Math.PI * 0.5, Math.PI * 1.5);
    line2(ctx, 5, 0xe9f1f7);
    ctx.beginPath();
    ctx.moveTo(82, 34);
    ctx.quadraticCurveTo(96, 34, 104, 16);
    ctx.lineTo(110, 18);
    ctx.quadraticCurveTo(102, 44, 84, 48);
    ctx.closePath();
    toon(ctx, 0xe9f1f7, 82, 16, 28, 32, { noShine: true, lineW: 2.5 });
    ellipsePath(ctx, 58, 40, 28, 19);
    toon(ctx, 0xe9f1f7, 30, 21, 56, 38);
    ctx.strokeStyle = rgb(0x1d4e89);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(58, 40, 22, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const x of [46, 58, 70]) {
      ctx.beginPath();
      ctx.arc(x, 40, 3, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0x1d4e89);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(58, 22, 18, 6, 0, Math.PI, 0);
    ctx.closePath();
    toon(ctx, 0xdbe7f3, 40, 16, 36, 7, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.arc(58, 14, 4, 0, Math.PI * 2);
    toon(ctx, 0x1d4e89, 54, 10, 8, 8, { lineW: 2 });
    for (const [x, y, r] of [
      [108, 9, 6],
      [117, 7, 7],
      [123, 12, 4],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0x8d99ae);
      ctx.fill();
    }
    bolt(ctx, [
      [108, 18],
      [116, 26],
      [112, 30],
      [124, 42],
    ]);
    bolt(ctx, [
      [104, 16],
      [98, 8],
      [92, 10],
      [86, 3],
    ]);
  },
  // 果冻弹：盘子上两层带竖棱的红色透明果冻，顶上一颗樱桃，两侧弹跳线
  jelly_bounce: (ctx) => {
    ellipsePath(ctx, 64, 54, 38, 6);
    toon(ctx, 0xf8f9fa, 26, 48, 76, 12, { noShine: true, lineW: 2.5 });
    const tier = (x0: number, x1: number, y0: number, y1: number) => {
      ctx.beginPath();
      ctx.moveTo(x0, y1);
      ctx.quadraticCurveTo(x0 - 2, y0 + 2, x0 + 6, y0);
      ctx.lineTo(x1 - 6, y0);
      ctx.quadraticCurveTo(x1 + 2, y0 + 2, x1, y1);
      ctx.quadraticCurveTo(64, y1 + 4, x0, y1);
      ctx.closePath();
      toon(ctx, 0xef233c, x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      const n = 5;
      for (let i = 1; i < n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        ctx.beginPath();
        ctx.moveTo(x, y0 + 3);
        ctx.lineTo(x + (x - 64) * 0.08, y1 - 1);
        ctx.stroke();
      }
    };
    tier(38, 90, 34, 53);
    tier(46, 82, 18, 35);
    ctx.beginPath();
    ctx.ellipse(64, 18, 16, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgb(0xff8fa3);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(65, 10);
    ctx.quadraticCurveTo(68, 3, 74, 3);
    line2(ctx, 1.8, 0x40916c);
    ctx.beginPath();
    ctx.arc(64, 12, 6, 0, Math.PI * 2);
    toon(ctx, 0x9d0208, 58, 6, 12, 12, { lineW: 2 });
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2.5;
    for (const s of [-1, 1]) {
      for (const d of [0, 7]) {
        ctx.beginPath();
        ctx.arc(64 + s * (32 + d), 34, 10, s > 0 ? -0.6 : Math.PI - 0.6, s > 0 ? 0.6 : Math.PI + 0.6);
        ctx.stroke();
      }
    }
  },
  // 糖浆喷枪：带指环把手的枫糖浆壶当储罐，接扳机握把和长喷嘴，喷口滴着滚烫糖浆
  syrup_sprayer: (ctx) => {
    ctx.beginPath();
    ctx.arc(18, 16, 7, 0, Math.PI * 2);
    line2(ctx, 4, 0xa0522d);
    ctx.beginPath();
    ctx.moveTo(14, 22);
    ctx.quadraticCurveTo(14, 14, 26, 12);
    ctx.lineTo(36, 10);
    ctx.lineTo(44, 10);
    ctx.lineTo(46, 18);
    ctx.quadraticCurveTo(58, 22, 58, 34);
    ctx.lineTo(58, 52);
    ctx.quadraticCurveTo(58, 58, 52, 58);
    ctx.lineTo(16, 58);
    ctx.quadraticCurveTo(10, 58, 10, 52);
    ctx.lineTo(10, 30);
    ctx.closePath();
    toon(ctx, 0xc0601a, 10, 10, 48, 48);
    roundRectPath(ctx, 34, 4, 12, 8, 2);
    toon(ctx, 0xe63946, 34, 4, 12, 8, { noShine: true, lineW: 2 });
    // 枫叶标签
    roundRectPath(ctx, 18, 30, 32, 22, 4);
    ctx.fillStyle = '#fff3e0';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    starPath(ctx, 34, 40, 8, 4, 5);
    ctx.fillStyle = '#d00000';
    ctx.fill();
    ctx.fillRect(33, 44, 2, 6);
    // 管 + 扳机握把 + 喷嘴
    ctx.beginPath();
    ctx.moveTo(56, 40);
    ctx.quadraticCurveTo(64, 40, 66, 34);
    line2(ctx, 4, 0x495057);
    ctx.beginPath();
    ctx.moveTo(66, 30);
    ctx.lineTo(78, 30);
    ctx.lineTo(76, 54);
    ctx.lineTo(66, 54);
    ctx.closePath();
    toon(ctx, 0x343a40, 66, 30, 12, 24, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(80, 36);
    ctx.lineTo(84, 46);
    line2(ctx, 2.5, 0xe63946);
    roundRectPath(ctx, 64, 25, 46, 9, 4);
    metal(ctx, 64, 25, 46, 9, 0xadb5bd);
    roundRectPath(ctx, 108, 23, 8, 13, 3);
    metal(ctx, 108, 23, 8, 13, 0x6c757d);
    glow(ctx, 120, 29, 9, 0xff7b00, 0.8);
    for (const [x, y, r] of [
      [119, 36, 3.5],
      [123, 24, 2.5],
      [114, 44, 3],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.8);
      ctx.quadraticCurveTo(x + r, y, x, y + r);
      ctx.quadraticCurveTo(x - r, y, x, y - r * 1.8);
      ctx.fillStyle = rgb(lighten(0xc0601a, 0.2));
      ctx.fill();
      ctx.strokeStyle = rgb(darken(0xc0601a, 0.4));
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
  },
};
