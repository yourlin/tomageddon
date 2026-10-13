// 武器专属造型 · 第 4 批：超武
// 每个函数在 128×64 画布上画一把武器：手柄 / 握把在左、朝右，中线 y = 32，描边统一用 OUTLINE，上色用 toon / metal
import { type Ctx, OUTLINE, rgb, darken, ellipsePath, roundRectPath, starPath, toon, glow } from '../Painter';
import { handle, metal } from '../weaponKit';

const CY = 32;
const GOLD = 0xffd166;

/** 四角星闪光（超武身份点缀） */
function sparkle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fillStyle = rgb(0xfff3b0, 0.95);
  ctx.fill();
}

/** 带描边的粗线：先描深色粗线再叠彩色细线 */
function line2(ctx: Ctx, pts: [number, number][], w: number, color: number, outline = OUTLINE): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = outline;
  ctx.lineWidth = w + 3;
  ctx.stroke();
  ctx.strokeStyle = rgb(color);
  ctx.lineWidth = w;
  ctx.stroke();
}

/** 闪电折线（带光晕） */
function bolt(ctx: Ctx, pts: [number, number][], color = 0xfff3b0, w = 2.5): void {
  ctx.save();
  ctx.shadowColor = rgb(0x9bf6ff);
  ctx.shadowBlur = 6;
  line2(ctx, pts, w, color, rgb(0x3a0ca3));
  ctx.restore();
}

/** 火舌：底在 (x, y)，朝 dir 方向（弧度）伸出长 len、宽 w */
function flame(ctx: Ctx, x: number, y: number, len: number, w: number, dir: number, c1 = 0xff5400, c2 = 0xffd166): void {
  const cos = Math.cos(dir),
    sin = Math.sin(dir);
  const p = (u: number, v: number): [number, number] => [x + cos * u - sin * v, y + sin * u + cos * v];
  const shape = (s: number) => {
    const a = p(0, -w * s),
      b = p(len * s, 0),
      c = p(0, w * s),
      m1 = p(len * 0.5 * s, -w * 0.9 * s),
      m2 = p(len * 0.5 * s, w * 0.9 * s);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(m1[0], m1[1], b[0], b[1]);
    ctx.quadraticCurveTo(m2[0], m2[1], c[0], c[1]);
    ctx.closePath();
  };
  shape(1);
  ctx.fillStyle = rgb(c1);
  ctx.fill();
  ctx.strokeStyle = rgb(darken(c1, 0.5));
  ctx.lineWidth = 2;
  ctx.stroke();
  shape(0.55);
  ctx.fillStyle = rgb(c2);
  ctx.fill();
}

/** 金箍：竖直的金色环带 */
function band(ctx: Ctx, x: number, y: number, w: number, h: number, c = GOLD): void {
  roundRectPath(ctx, x, y - h / 2, w, h, 2);
  metal(ctx, x, y - h / 2, w, h, c);
}

export const ART: Record<string, (ctx: Ctx) => void> = {
  // 地狱三叉戟：黑红长柄 + 骷髅护手，番茄叉的三齿变成三股燃烧倒钩长戟，中央托着火番茄
  hell_trident(ctx) {
    glow(ctx, 104, CY, 30, 0xff5400, 0.45);
    handle(ctx, 4, 52, CY, 10, 0x3d1418);
    band(ctx, 14, CY, 5, 13);
    band(ctx, 40, CY, 5, 13);
    // 三股戟齿：外侧两股向外弯再向前
    const prong = (dy: number) => {
      ctx.beginPath();
      if (dy === 0) {
        ctx.moveTo(70, CY - 3);
        ctx.lineTo(112, CY - 3);
        ctx.lineTo(125, CY);
        ctx.lineTo(112, CY + 3);
        ctx.lineTo(70, CY + 3);
      } else {
        const s = Math.sign(dy);
        ctx.moveTo(68, CY + s * 4);
        ctx.quadraticCurveTo(80, CY + s * 29, 106, CY + s * 25);
        ctx.lineTo(122, CY + s * 21);
        ctx.lineTo(106, CY + s * 15);
        ctx.quadraticCurveTo(90, CY + s * 16, 80, CY + s * 3);
      }
      ctx.closePath();
      metal(ctx, 70, CY - 28, 56, 56, 0xd04a3a);
    };
    flame(ctx, 98, CY - 22, 18, 5, -0.5);
    flame(ctx, 98, CY + 22, 18, 5, 0.5);
    prong(-1);
    prong(1);
    prong(0);
    // 倒钩
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(110, CY + s * 3);
      ctx.lineTo(104, CY + s * 9);
      ctx.lineTo(106, CY + s * 2);
      ctx.closePath();
      metal(ctx, 104, CY - 9, 8, 18, 0xd04a3a);
    }
    // 火番茄
    glow(ctx, 92, CY, 12, 0xffb703, 0.9);
    ctx.beginPath();
    ctx.arc(92, CY, 7, 0, Math.PI * 2);
    toon(ctx, 0xff3b30, 85, CY - 7, 14, 14, { lineW: 2.5 });
    flame(ctx, 92, CY - 6, 8, 3, -Math.PI / 2, 0xff7b00, 0xfff3b0);
    // 骷髅护手
    ctx.beginPath();
    ctx.ellipse(62, CY - 2, 11, 12, 0, 0, Math.PI * 2);
    toon(ctx, 0xf1e3d3, 51, CY - 14, 22, 24, { lineW: 2.5 });
    roundRectPath(ctx, 56, CY + 6, 12, 8, 2);
    toon(ctx, 0xf1e3d3, 56, CY + 6, 12, 8, { noShine: true, lineW: 2 });
    ctx.fillStyle = rgb(0x1b0a0a);
    for (const x of [58, 66]) {
      ctx.beginPath();
      ctx.ellipse(x, CY - 3, 3, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = rgb(0xff3b30);
    for (const x of [58, 66]) {
      ctx.beginPath();
      ctx.arc(x, CY - 3, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    for (const x of [60, 64]) {
      ctx.beginPath();
      ctx.moveTo(x, CY + 7);
      ctx.lineTo(x, CY + 13);
      ctx.stroke();
    }
    sparkle(ctx, 118, 8, 4);
  },

  // 擎天擀面柱：加粗加长的擀面柱身缠铁箍，右端扣一口铸铁锅当配重，左端金色柄头
  titan_pin(ctx) {
    handle(ctx, 4, 24, CY, 12, 0xc68b59);
    ctx.beginPath();
    ctx.arc(6, CY, 5, 0, Math.PI * 2);
    toon(ctx, GOLD, 1, CY - 5, 10, 10, { lineW: 2 });
    roundRectPath(ctx, 20, CY - 17, 78, 34, 15);
    toon(ctx, 0xe0b084, 20, CY - 17, 78, 34);
    for (const x of [34, 56, 78]) band(ctx, x, CY, 7, 36, 0x8d99ae);
    band(ctx, 45, CY, 3, 34, GOLD);
    band(ctx, 67, CY, 3, 34, GOLD);
    // 连接轴
    roundRectPath(ctx, 94, CY - 6, 10, 12, 3);
    metal(ctx, 94, CY - 6, 10, 12, 0x495057);
    // 铸铁锅配重（侧面看：锅底朝右的半圆碗）
    ctx.beginPath();
    ctx.moveTo(102, CY - 28);
    ctx.quadraticCurveTo(130, CY - 26, 125, CY);
    ctx.quadraticCurveTo(130, CY + 26, 102, CY + 28);
    ctx.closePath();
    toon(ctx, 0x343a40, 102, CY - 28, 24, 56);
    roundRectPath(ctx, 99, CY - 30, 7, 60, 3);
    metal(ctx, 99, CY - 30, 7, 60, 0x495057);
    ctx.fillStyle = rgb(0xadb5bd);
    for (const y of [CY - 14, CY, CY + 14]) {
      ctx.beginPath();
      ctx.arc(112, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 横扫气浪
    ctx.strokeStyle = rgb(0xfff3b0, 0.7);
    ctx.lineWidth = 2;
    for (const r of [8, 13]) {
      ctx.beginPath();
      ctx.arc(60, CY, r + 14, Math.PI * 1.15, Math.PI * 1.45);
      ctx.stroke();
    }
    sparkle(ctx, 88, 7, 4);
  },

  // 庖丁神刀：细长神刀，龙首护手，刀背流云纹，刃口泛青光
  paoding_blade(ctx) {
    handle(ctx, 4, 40, CY, 12, 0x1d1f33);
    ctx.fillStyle = rgb(GOLD);
    for (const x of [12, 24, 34]) {
      ctx.beginPath();
      ctx.arc(x, CY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 刀身
    ctx.beginPath();
    ctx.moveTo(48, CY - 12);
    ctx.lineTo(108, CY - 9);
    ctx.quadraticCurveTo(122, CY - 7, 126, CY - 1);
    ctx.quadraticCurveTo(110, CY + 9, 48, CY + 10);
    ctx.closePath();
    ctx.save();
    ctx.shadowColor = rgb(0x4cc9f0);
    ctx.shadowBlur = 8;
    metal(ctx, 48, CY - 12, 78, 22, 0xd7e3ea);
    ctx.restore();
    // 刃口青光
    ctx.strokeStyle = rgb(0x4cc9f0);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(52, CY + 8);
    ctx.quadraticCurveTo(108, CY + 7, 123, CY - 1);
    ctx.stroke();
    // 刀背流云纹
    ctx.strokeStyle = rgb(0x3a86a8);
    ctx.lineWidth = 1.6;
    for (const x of [62, 80, 98]) {
      ctx.beginPath();
      ctx.arc(x, CY - 6, 3.5, Math.PI, Math.PI * 2.6);
      ctx.moveTo(x + 4, CY - 6);
      ctx.quadraticCurveTo(x + 9, CY - 9, x + 13, CY - 7);
      ctx.stroke();
    }
    // 龙首护手：朝右张口的龙头
    ctx.beginPath();
    ctx.moveTo(38, CY - 14);
    ctx.quadraticCurveTo(46, CY - 22, 56, CY - 18);
    ctx.lineTo(62, CY - 13);
    ctx.lineTo(54, CY - 10);
    ctx.lineTo(52, CY + 9);
    ctx.lineTo(60, CY + 13);
    ctx.lineTo(52, CY + 16);
    ctx.quadraticCurveTo(42, CY + 18, 38, CY + 12);
    ctx.closePath();
    toon(ctx, GOLD, 38, CY - 22, 24, 40, { lineW: 2.5 });
    // 龙角与眼
    ctx.beginPath();
    ctx.moveTo(44, CY - 18);
    ctx.lineTo(36, CY - 27);
    ctx.lineTo(48, CY - 20);
    ctx.closePath();
    toon(ctx, 0xe09f3e, 36, CY - 27, 12, 9, { noShine: true, lineW: 2 });
    ctx.fillStyle = rgb(0xd00000);
    ctx.beginPath();
    ctx.arc(51, CY - 14, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgb(0xbc6c25);
    ctx.lineWidth = 1.5;
    for (const y of [CY - 4, CY + 2, CY + 8]) {
      ctx.beginPath();
      ctx.arc(45, y, 3, -0.6, 0.6);
      ctx.stroke();
    }
    sparkle(ctx, 116, 14, 4);
  },

  // 屠龙菜刀：多层刀片熔铸成的巨型剁刀，刀背龙脊锯齿，龙眼孔，刃口一线红光
  dragon_cleaver(ctx) {
    handle(ctx, 4, 42, CY + 8, 12, 0x3d1418);
    band(ctx, 38, CY + 8, 6, 15);
    // 后层刀片（熔铸的残影）
    ctx.beginPath();
    ctx.moveTo(44, CY - 18);
    ctx.lineTo(118, CY - 24);
    ctx.lineTo(118, CY + 18);
    ctx.lineTo(44, CY + 18);
    ctx.closePath();
    metal(ctx, 44, CY - 24, 74, 42, 0x8d99ae);
    // 主刀身 + 龙脊
    ctx.beginPath();
    ctx.moveTo(46, CY - 16);
    const teeth = 6;
    for (let i = 0; i < teeth; i++) {
      const x0 = 50 + i * 12;
      ctx.lineTo(x0, CY - 18);
      ctx.lineTo(x0 + 6, CY - 29);
      ctx.lineTo(x0 + 10, CY - 19);
    }
    ctx.lineTo(124, CY - 20);
    ctx.lineTo(125, CY + 16);
    ctx.quadraticCurveTo(88, CY + 26, 46, CY + 16);
    ctx.closePath();
    metal(ctx, 46, CY - 29, 79, 51, 0xc9d1d9);
    // 龙鳞纹
    ctx.save();
    ctx.beginPath();
    ctx.rect(52, CY - 16, 70, 14);
    ctx.clip();
    ctx.strokeStyle = rgb(0x9d0208, 0.75);
    ctx.lineWidth = 1.6;
    for (let x = 54; x < 100; x += 8)
      for (const y of [CY - 12, CY - 6]) {
        ctx.beginPath();
        ctx.arc(x + (y === CY - 6 ? 4 : 0), y, 4, 0, Math.PI);
        ctx.stroke();
      }
    ctx.restore();
    // 龙眼孔
    ctx.beginPath();
    ctx.ellipse(110, CY - 9, 7, 5, 0, 0, Math.PI * 2);
    toon(ctx, 0xffb703, 103, CY - 14, 14, 10, { lineW: 2.5, noShine: true });
    ctx.fillStyle = rgb(0x1b0a0a);
    ctx.beginPath();
    ctx.ellipse(110, CY - 9, 1.6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // 刃口红光
    ctx.save();
    ctx.shadowColor = rgb(0xff3b30);
    ctx.shadowBlur = 6;
    ctx.strokeStyle = rgb(0xff5d5d);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(52, CY + 14);
    ctx.quadraticCurveTo(88, CY + 22, 122, CY + 13);
    ctx.stroke();
    ctx.restore();
    sparkle(ctx, 30, 14, 4);
  },

  // 豌豆加特林：豆荚弹鼓 + 四根豆荚枪管旋转扫射，下挂一整袋豌豆
  pea_gatling(ctx) {
    roundRectPath(ctx, 8, CY + 2, 18, 24, 6);
    toon(ctx, 0x38b000, 8, CY + 2, 18, 24, { noShine: true });
    // 豆荚机身
    ctx.beginPath();
    ctx.ellipse(36, CY - 4, 28, 16, 0, 0, Math.PI * 2);
    toon(ctx, 0x52b788, 8, CY - 20, 56, 32);
    // 枪管束
    for (const dy of [-12, -4, 4, 12]) {
      roundRectPath(ctx, 56, CY - 4 + dy - 4, 64, 8, 4);
      toon(ctx, dy % 8 ? 0x70e000 : 0x55a630, 56, CY - 8 + dy, 64, 8, { noShine: true, lineW: 2.5 });
      ctx.beginPath();
      ctx.arc(120, CY - 4 + dy, 4, 0, Math.PI * 2);
      toon(ctx, 0x9ef01a, 116, CY - 8 + dy, 8, 8, { lineW: 2 });
    }
    band(ctx, 66, CY - 4, 7, 38);
    band(ctx, 98, CY - 4, 6, 36, 0x8d99ae);
    // 机身豌豆窗
    for (const x of [26, 42]) {
      ctx.beginPath();
      ctx.arc(x, CY - 6, 6, 0, Math.PI * 2);
      toon(ctx, 0x9ef01a, x - 6, CY - 12, 12, 12, { lineW: 2 });
    }
    // 豌豆袋
    ctx.beginPath();
    ctx.moveTo(34, CY + 10);
    ctx.quadraticCurveTo(28, CY + 30, 44, CY + 30);
    ctx.lineTo(60, CY + 30);
    ctx.quadraticCurveTo(70, CY + 28, 62, CY + 10);
    ctx.closePath();
    toon(ctx, 0xd4a373, 28, CY + 10, 40, 20, { noShine: true });
    for (const x of [44, 52]) {
      ctx.beginPath();
      ctx.arc(x, CY + 12, 3.5, 0, Math.PI * 2);
      toon(ctx, 0x9ef01a, x - 3.5, CY + 8.5, 7, 7, { lineW: 1.5, noShine: true });
    }
    // 叶子
    ctx.beginPath();
    ctx.ellipse(14, CY - 20, 9, 4, -0.6, 0, Math.PI * 2);
    toon(ctx, 0x2d6a4f, 5, CY - 26, 18, 10, { noShine: true, lineW: 2 });
    sparkle(ctx, 108, 6, 4);
  },

  // 番茄酱洪流：加压大酱瓶（带压力表与金冠瓶盖）+ 喇叭喷嘴，喷出卷起的番茄酱巨浪
  ketchup_flood(ctx) {
    roundRectPath(ctx, 22, CY + 8, 16, 22, 5);
    toon(ctx, 0x6b4226, 22, CY + 8, 16, 22, { noShine: true });
    // 瓶身
    ctx.beginPath();
    ctx.moveTo(6, CY - 18);
    ctx.lineTo(58, CY - 18);
    ctx.quadraticCurveTo(72, CY - 18, 76, CY - 8);
    ctx.lineTo(76, CY + 8);
    ctx.quadraticCurveTo(72, CY + 18, 58, CY + 18);
    ctx.lineTo(6, CY + 18);
    ctx.closePath();
    toon(ctx, 0xd00000, 6, CY - 18, 70, 36);
    roundRectPath(ctx, 14, CY - 9, 32, 18, 4);
    ctx.fillStyle = '#fff3e0';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(30, CY, 6, 0, Math.PI * 2);
    toon(ctx, 0xe63946, 24, CY - 6, 12, 12, { lineW: 1.5 });
    // 压力表
    ctx.beginPath();
    ctx.arc(58, CY - 20, 7, 0, Math.PI * 2);
    metal(ctx, 51, CY - 27, 14, 14, GOLD);
    ctx.beginPath();
    ctx.arc(58, CY - 20, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = rgb(0xd00000);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(58, CY - 20);
    ctx.lineTo(61, CY - 23);
    ctx.stroke();
    // 喇叭喷嘴
    ctx.beginPath();
    ctx.moveTo(74, CY - 6);
    ctx.lineTo(90, CY - 6);
    ctx.lineTo(98, CY - 13);
    ctx.lineTo(98, CY + 13);
    ctx.lineTo(90, CY + 6);
    ctx.lineTo(74, CY + 6);
    ctx.closePath();
    metal(ctx, 74, CY - 13, 24, 26, GOLD);
    // 酱浪：三道向前翻卷的浪头
    ctx.beginPath();
    ctx.moveTo(97, CY - 11);
    ctx.quadraticCurveTo(102, CY - 28, 116, CY - 27);
    ctx.quadraticCurveTo(124, CY - 25, 121, CY - 18);
    ctx.quadraticCurveTo(116, CY - 22, 112, CY - 16);
    ctx.quadraticCurveTo(122, CY - 14, 125, CY - 4);
    ctx.quadraticCurveTo(118, CY - 6, 114, CY);
    ctx.quadraticCurveTo(124, CY + 4, 124, CY + 14);
    ctx.quadraticCurveTo(116, CY + 10, 110, CY + 15);
    ctx.quadraticCurveTo(102, CY + 16, 97, CY + 11);
    ctx.closePath();
    toon(ctx, 0xe5383b, 96, CY - 27, 29, 43, { lineW: 2.5 });
    ctx.strokeStyle = rgb(0xffb3b3, 0.9);
    ctx.lineWidth = 2;
    for (const [x, y] of [
      [104, CY - 18],
      [108, CY - 6],
      [106, CY + 6],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 5, -Math.PI * 0.9, -Math.PI * 0.2);
      ctx.stroke();
    }
    ctx.fillStyle = rgb(0xe5383b);
    for (const [x, y, r] of [
      [112, CY + 18, 3],
      [120, CY + 22, 2.2],
      [94, CY - 26, 2.5],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    sparkle(ctx, 84, 8, 4);
  },

  // 魔鬼椒导弹：深红辣椒弹体长出恶魔角、怒眼与尖尾，尾部尾翼喷火，下挂发射握把
  devil_missile(ctx) {
    flame(ctx, 14, CY, 12, 6, Math.PI);
    roundRectPath(ctx, 30, CY + 6, 14, 22, 4);
    toon(ctx, 0x343a40, 30, CY + 6, 14, 22, { noShine: true });
    // 尾翼
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(14, CY + s * 4);
      ctx.lineTo(8, CY + s * 22);
      ctx.lineTo(30, CY + s * 8);
      ctx.closePath();
      metal(ctx, 8, CY - 22, 22, 44, 0x495057);
    }
    // 弹体
    ctx.beginPath();
    ctx.moveTo(12, CY - 6);
    ctx.bezierCurveTo(44, CY - 22, 96, CY - 18, 124, CY + 2);
    ctx.bezierCurveTo(96, CY + 16, 44, CY + 14, 12, CY + 6);
    ctx.closePath();
    toon(ctx, 0x9d0208, 12, CY - 20, 112, 36);
    // 恶魔角
    for (const x of [76, 92]) {
      ctx.beginPath();
      ctx.moveTo(x - 6, CY - 13);
      ctx.quadraticCurveTo(x - 4, CY - 26, x + 4, CY - 29);
      ctx.quadraticCurveTo(x, CY - 20, x + 5, CY - 12);
      ctx.closePath();
      toon(ctx, 0x1b1b1b, x - 6, CY - 29, 11, 17, { lineW: 2, noShine: true });
    }
    // 怒眼与獠牙嘴
    ctx.fillStyle = rgb(0xffd60a);
    for (const x of [88, 100]) {
      ctx.beginPath();
      ctx.moveTo(x - 4, CY - 6);
      ctx.lineTo(x + 4, CY - 3);
      ctx.lineTo(x - 3, CY - 1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(86, CY + 5);
    ctx.quadraticCurveTo(96, CY + 10, 108, CY + 4);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    for (const x of [92, 100]) {
      ctx.beginPath();
      ctx.moveTo(x, CY + 7);
      ctx.lineTo(x + 2, CY + 11);
      ctx.lineTo(x + 4, CY + 7);
      ctx.fill();
    }
    // 恶魔尖尾（辣椒蒂变的）
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(30, CY - 12);
    ctx.quadraticCurveTo(26, CY - 26, 42, CY - 26);
    ctx.stroke();
    ctx.strokeStyle = rgb(0x2d6a4f);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(42, CY - 31);
    ctx.lineTo(50, CY - 26);
    ctx.lineTo(42, CY - 21);
    ctx.closePath();
    toon(ctx, 0x2d6a4f, 42, CY - 31, 8, 10, { lineW: 2, noShine: true });
    sparkle(ctx, 116, 10, 4);
  },

  // 雷神打蛋器：铜线圈特斯拉护套 + 打蛋器钢丝笼，笼端焊着刻符文的雷神锤头，电弧乱跳
  thor_whisk(ctx) {
    handle(ctx, 4, 40, CY, 12, 0x3a0ca3);
    ctx.strokeStyle = rgb(0x1b1b3a);
    ctx.lineWidth = 1.5;
    for (let x = 10; x < 38; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, CY - 6);
      ctx.lineTo(x + 3, CY + 6);
      ctx.stroke();
    }
    // 特斯拉线圈
    for (let x = 40; x < 56; x += 4) {
      ctx.beginPath();
      ctx.ellipse(x, CY, 2.5, 9, 0, 0, Math.PI * 2);
      toon(ctx, 0xd9822b, x - 2.5, CY - 9, 5, 18, { lineW: 1.5, noShine: true });
    }
    // 钢丝笼
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    for (const ry of [20, 11]) {
      ctx.beginPath();
      ctx.ellipse(76, CY, 22, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = rgb(0x9bf6ff);
    ctx.lineWidth = 2.5;
    for (const ry of [20, 11]) {
      ctx.beginPath();
      ctx.ellipse(76, CY, 22, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    glow(ctx, 76, CY, 16, 0x9bf6ff, 0.6);
    // 锤头
    roundRectPath(ctx, 96, CY - 28, 28, 56, 5);
    metal(ctx, 96, CY - 28, 28, 56, 0x8d99ae);
    for (const y of [CY - 24, CY + 20]) {
      roundRectPath(ctx, 96, y, 28, 5, 2);
      metal(ctx, 96, y, 28, 5, GOLD);
    }
    roundRectPath(ctx, 92, CY - 6, 6, 12, 2);
    metal(ctx, 92, CY - 6, 6, 12, GOLD);
    // 符文闪电
    bolt(ctx, [
      [113, CY - 14],
      [106, CY - 1],
      [113, CY + 1],
      [107, CY + 14],
    ]);
    bolt(
      ctx,
      [
        [62, 4],
        [70, 12],
        [66, 16],
        [78, 22],
      ],
      0xfff3b0,
      2,
    );
    bolt(
      ctx,
      [
        [84, 60],
        [80, 52],
        [88, 50],
        [84, 44],
      ],
      0xfff3b0,
      2,
    );
    sparkle(ctx, 88, 8, 3.5);
  },

  // 吸血鬼大蒜：蒜头长出蝙蝠翼、红眼与獠牙，悬浮在紫色血雾里
  vampire_garlic(ctx) {
    glow(ctx, 64, CY, 34, 0x7b2cbf, 0.65);
    // 蝙蝠翼
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(64 + s * 14, CY - 6);
      ctx.quadraticCurveTo(64 + s * 34, CY - 28, 64 + s * 58, CY - 18);
      ctx.quadraticCurveTo(64 + s * 52, CY - 6, 64 + s * 54, CY + 4);
      ctx.quadraticCurveTo(64 + s * 46, CY - 2, 64 + s * 42, CY + 8);
      ctx.quadraticCurveTo(64 + s * 34, CY, 64 + s * 30, CY + 10);
      ctx.quadraticCurveTo(64 + s * 22, CY + 2, 64 + s * 14, CY + 8);
      ctx.closePath();
      toon(ctx, 0x3c096c, s < 0 ? 6 : 78, CY - 28, 44, 38, { noShine: true, lineW: 2.5 });
      ctx.strokeStyle = rgb(0x9d4edd);
      ctx.lineWidth = 1.5;
      for (const [tx, ty] of [
        [58, -18],
        [42, 8],
        [30, 10],
      ]) {
        ctx.beginPath();
        ctx.moveTo(64 + s * 16, CY - 4);
        ctx.lineTo(64 + s * tx * 0.9, CY + ty * 0.8);
        ctx.stroke();
      }
    }
    // 蒜头
    ctx.beginPath();
    ctx.moveTo(64, CY - 28);
    ctx.bezierCurveTo(86, CY - 16, 90, CY + 22, 64, CY + 26);
    ctx.bezierCurveTo(38, CY + 22, 42, CY - 16, 64, CY - 28);
    toon(ctx, 0xf1e3d3, 40, CY - 28, 50, 54);
    ctx.strokeStyle = rgb(0xc8b4a0);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, CY - 24);
    ctx.quadraticCurveTo(52, CY, 58, CY + 24);
    ctx.moveTo(64, CY - 24);
    ctx.quadraticCurveTo(78, CY, 70, CY + 24);
    ctx.stroke();
    // 红眼
    for (const x of [57, 71]) {
      ctx.beginPath();
      ctx.ellipse(x, CY - 2, 4, 3, x < 64 ? 0.3 : -0.3, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0xd00000);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // 嘴与獠牙
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(56, CY + 8);
    ctx.quadraticCurveTo(64, CY + 12, 72, CY + 8);
    ctx.stroke();
    for (const x of [59, 69]) {
      ctx.beginPath();
      ctx.moveTo(x - 2.5, CY + 9);
      ctx.lineTo(x, CY + 16);
      ctx.lineTo(x + 2.5, CY + 9.5);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    // 血滴
    ctx.fillStyle = rgb(0xd00000);
    ctx.beginPath();
    ctx.moveTo(69, CY + 16);
    ctx.quadraticCurveTo(72, CY + 22, 69, CY + 22);
    ctx.quadraticCurveTo(66, CY + 22, 69, CY + 16);
    ctx.fill();
    sparkle(ctx, 64, 4, 3.5);
  },

  // 蓝莓电磁炮：蓝莓枪托 + 上下两条导轨，导轨间电弧，线圈环加速，炮口夹着发光蓝莓
  blueberry_railgun(ctx) {
    roundRectPath(ctx, 4, CY - 2, 30, 18, 6);
    toon(ctx, 0x3a0ca3, 4, CY - 2, 30, 18, { noShine: true });
    roundRectPath(ctx, 28, CY - 10, 22, 20, 4);
    metal(ctx, 28, CY - 10, 22, 20, 0x343a40);
    // 电池蓝莓弹仓
    ctx.beginPath();
    ctx.arc(40, CY + 14, 8, 0, Math.PI * 2);
    toon(ctx, 0x4361ee, 32, CY + 6, 16, 16, { lineW: 2 });
    starPath(ctx, 40, CY + 9, 3.5, 1.8, 5);
    ctx.fillStyle = '#1b1b3a';
    ctx.fill();
    // 导轨间电弧（先画在下层）
    glow(ctx, 104, CY, 16, 0x00b4d8, 0.8);
    ctx.strokeStyle = rgb(0x9bf6ff, 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 52; x < 118; x += 6) {
      ctx.moveTo(x, CY - 6);
      ctx.lineTo(x + 3, CY);
      ctx.lineTo(x, CY + 6);
    }
    ctx.stroke();
    // 双导轨
    for (const y of [CY - 12, CY + 6]) {
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(118, y);
      ctx.lineTo(124, y + 3);
      ctx.lineTo(48, y + 6);
      ctx.closePath();
      metal(ctx, 48, y, 76, 6, 0x6c757d);
    }
    // 线圈环
    for (const x of [62, 78, 94]) {
      roundRectPath(ctx, x, CY - 15, 5, 30, 2);
      metal(ctx, x, CY - 15, 5, 30, 0xd9822b);
    }
    // 瞄准镜
    roundRectPath(ctx, 52, CY - 26, 34, 10, 4);
    metal(ctx, 52, CY - 26, 34, 10, 0x212529);
    ctx.beginPath();
    ctx.arc(86, CY - 21, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#9bf6ff';
    ctx.fill();
    // 发光蓝莓弹
    ctx.beginPath();
    ctx.arc(110, CY, 5.5, 0, Math.PI * 2);
    toon(ctx, 0x4cc9f0, 104.5, CY - 5.5, 11, 11, { lineW: 2 });
    sparkle(ctx, 116, 12, 4);
  },

  // 黄金爆米花炮：金色玉米棒炮身，尾部玉米叶向后张开成尾翼，金炮口喷出一团爆米花
  golden_corn(ctx) {
    // 玉米叶尾翼
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(30, CY + s * 4);
      ctx.quadraticCurveTo(10, CY + s * 12, 4, CY + s * 28);
      ctx.quadraticCurveTo(22, CY + s * 24, 40, CY + s * 12);
      ctx.closePath();
      toon(ctx, 0x80b918, 4, s < 0 ? CY - 28 : CY + 4, 36, 24, { noShine: true, lineW: 2.5 });
    }
    roundRectPath(ctx, 26, CY + 8, 16, 22, 5);
    toon(ctx, 0x6b4226, 26, CY + 8, 16, 22, { noShine: true });
    // 炮身
    roundRectPath(ctx, 18, CY - 16, 82, 32, 15);
    toon(ctx, 0xffc300, 18, CY - 16, 82, 32);
    ctx.save();
    roundRectPath(ctx, 18, CY - 16, 82, 32, 15);
    ctx.clip();
    for (let x = 24; x < 100; x += 9)
      for (let y = CY - 13; y < CY + 16; y += 8) {
        ctx.beginPath();
        ctx.ellipse(x + (Math.round((y - CY) / 8) % 2) * 4.5, y, 3.5, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();
        ctx.strokeStyle = rgb(0xc77d00, 0.6);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    ctx.restore();
    band(ctx, 52, CY, 5, 34, 0xe09f3e);
    // 金炮口
    ctx.beginPath();
    ctx.moveTo(96, CY - 12);
    ctx.lineTo(108, CY - 18);
    ctx.lineTo(108, CY + 18);
    ctx.lineTo(96, CY + 12);
    ctx.closePath();
    metal(ctx, 96, CY - 18, 12, 36, GOLD);
    // 爆米花
    glow(ctx, 114, CY, 16, 0xffd166, 0.8);
    for (const [x, y, r] of [
      [114, CY - 12, 7],
      [118, CY + 2, 7],
      [112, CY + 14, 6],
      [122, CY - 20, 4.5],
      [124, CY + 14, 4],
    ]) {
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + x;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.62, 0, Math.PI * 2);
        toon(ctx, 0xfff3b0, x - r, y - r, r * 2, r * 2, { lineW: 1.8, noShine: true });
      }
    }
    sparkle(ctx, 70, 8, 4);
  },

  // 八角风暴：放大的八角星每个角弯成旋刃，外圈卷起紫色旋风气流
  anise_storm(ctx) {
    glow(ctx, 64, CY, 34, 0xb5179e, 0.5);
    // 风环
    ctx.lineWidth = 2.5;
    for (const [r, a0, c] of [
      [30, 0.2, 0xf72585],
      [30, Math.PI + 0.2, 0xf72585],
      [24, 1.6, 0xe0aaff],
      [24, Math.PI + 1.6, 0xe0aaff],
    ] as const) {
      ctx.strokeStyle = rgb(c, 0.85);
      ctx.beginPath();
      ctx.ellipse(64, CY, r * 1.7, r, 0, a0, a0 + 1.6);
      ctx.stroke();
    }
    // 弯刃星：每个角向顺时针弯成旋刃
    const n = 8;
    const P = (ang: number, r: number): [number, number] => [64 + Math.cos(ang) * r, CY + Math.sin(ang) * r];
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const v0 = P(a - Math.PI / n, 11),
        c1 = P(a - 0.12, 25),
        tip = P(a + 0.32, 30),
        c2 = P(a + 0.22, 17),
        v1 = P(a + Math.PI / n, 11);
      if (i === 0) ctx.moveTo(v0[0], v0[1]);
      ctx.quadraticCurveTo(c1[0], c1[1], tip[0], tip[1]);
      ctx.quadraticCurveTo(c2[0], c2[1], v1[0], v1[1]);
    }
    ctx.closePath();
    toon(ctx, 0xa0522d, 34, CY - 30, 60, 60, { lineW: 2.5 });
    // 籽与刃光
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + 0.15;
      ctx.beginPath();
      ctx.ellipse(64 + Math.cos(a) * 15, CY + Math.sin(a) * 15, 3.5, 2.5, a, 0, Math.PI * 2);
      ctx.fillStyle = rgb(GOLD);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(64, CY, 6, 0, Math.PI * 2);
    toon(ctx, 0x5a189a, 58, CY - 6, 12, 12, { lineW: 2 });
    starPath(ctx, 64, CY, 3.5, 1.5, 4);
    ctx.fillStyle = rgb(0xfff3b0);
    ctx.fill();
    sparkle(ctx, 112, 8, 4);
    sparkle(ctx, 16, 54, 3);
  },

  // 铸铁壁垒锅：铁箍加固的长柄，锅面变成铆钉圆盾，焊着带十字筋和顶钮的锅盖头盔
  iron_bastion_pan(ctx) {
    handle(ctx, 4, 62, CY, 12, 0x3d2c2e);
    for (const x of [20, 44]) band(ctx, x, CY, 6, 15, 0x8d99ae);
    // 盾缘尖角
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const x = 94 + Math.cos(a) * 30,
        y = CY + Math.sin(a) * 28;
      ctx.beginPath();
      ctx.moveTo(94 + Math.cos(a - 0.2) * 26, CY + Math.sin(a - 0.2) * 25);
      ctx.lineTo(x, y);
      ctx.lineTo(94 + Math.cos(a + 0.2) * 26, CY + Math.sin(a + 0.2) * 25);
      ctx.closePath();
      metal(ctx, x - 4, y - 4, 8, 8, 0x8d99ae);
    }
    ellipsePath(ctx, 94, CY, 27, 26);
    toon(ctx, 0x343a40, 67, CY - 26, 54, 52);
    // 铆钉
    ctx.fillStyle = rgb(0xced4da);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(94 + Math.cos(a) * 23, CY + Math.sin(a) * 22, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // 锅盖头盔
    ellipsePath(ctx, 94, CY, 18, 17);
    metal(ctx, 76, CY - 17, 36, 34, 0x6c757d);
    ctx.strokeStyle = rgb(0x343a40);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(77, CY);
    ctx.lineTo(111, CY);
    ctx.moveTo(94, CY - 16);
    ctx.lineTo(94, CY + 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(94, CY, 6, 0, Math.PI * 2);
    toon(ctx, GOLD, 88, CY - 6, 12, 12, { lineW: 2 });
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(84, CY - 9, 6, 3, -0.6, 0, Math.PI * 2);
    ctx.fill();
    sparkle(ctx, 60, 10, 4);
  },

  // 西瓜震地锤：铁箍捆住的大西瓜火药锤头，裂口露出红瓤黑籽，顶部引信冒火花
  melon_quake(ctx) {
    handle(ctx, 4, 70, CY, 12, 0x6f4518);
    band(ctx, 12, CY, 5, 14);
    band(ctx, 60, CY, 6, 16, 0x8d99ae);
    // 引信
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(96, CY - 24);
    ctx.quadraticCurveTo(90, CY - 30, 80, CY - 28);
    ctx.stroke();
    ctx.strokeStyle = rgb(0xe9c46a);
    ctx.lineWidth = 2;
    ctx.stroke();
    glow(ctx, 78, CY - 28, 7, 0xffb703, 1);
    sparkle(ctx, 78, CY - 28, 4);
    // 锤头：横放的西瓜桶
    roundRectPath(ctx, 70, CY - 25, 54, 50, 18);
    toon(ctx, 0x2d6a4f, 70, CY - 25, 54, 50);
    ctx.save();
    roundRectPath(ctx, 70, CY - 25, 54, 50, 18);
    ctx.clip();
    ctx.strokeStyle = rgb(0x1b4332);
    ctx.lineWidth = 4;
    for (const y of [CY - 14, CY, CY + 14]) {
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.bezierCurveTo(84, y - 4, 108, y + 4, 124, y);
      ctx.stroke();
    }
    ctx.restore();
    // 裂口红瓤
    ctx.beginPath();
    ctx.moveTo(98, CY - 12);
    ctx.lineTo(106, CY - 4);
    ctx.lineTo(100, CY + 2);
    ctx.lineTo(110, CY + 10);
    ctx.lineTo(102, CY + 16);
    ctx.lineTo(94, CY + 6);
    ctx.lineTo(100, CY);
    ctx.closePath();
    toon(ctx, 0xef233c, 94, CY - 12, 16, 28, { lineW: 2, noShine: true });
    ctx.fillStyle = '#1b1b1b';
    for (const [x, y] of [
      [101, CY - 4],
      [103, CY + 9],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 1.3, 2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // 铁箍
    for (const x of [78, 116]) {
      roundRectPath(ctx, x - 3, CY - 26, 6, 52, 2);
      metal(ctx, x - 3, CY - 26, 6, 52, 0x8d99ae);
    }
    sparkle(ctx, 118, 58, 3.5);
  },

  // 风暴西兰花：长法杖缠电池，西兰花冠膨大成乌云状雷暴，劈出三道闪电
  storm_broccoli(ctx) {
    handle(ctx, 4, 84, CY, 9, 0x6b4226);
    // 电池
    roundRectPath(ctx, 54, CY - 8, 22, 16, 3);
    metal(ctx, 54, CY - 8, 22, 16, 0x212529);
    roundRectPath(ctx, 54, CY - 8, 8, 16, 2);
    metal(ctx, 54, CY - 8, 8, 16, 0xd9822b);
    ctx.fillStyle = rgb(GOLD);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('+', 65, CY + 4);
    glow(ctx, 102, CY, 30, 0x9bf6ff, 0.45);
    // 乌云冠
    for (const [x, y, r] of [
      [94, CY - 16, 12],
      [108, CY - 20, 11],
      [116, CY - 6, 10],
      [114, CY + 10, 11],
      [100, CY + 18, 11],
      [86, CY + 8, 11],
      [84, CY - 6, 11],
      [102, CY, 13],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      toon(ctx, x === 102 ? 0x40916c : 0x2d6a4f, x - r, y - r, r * 2, r * 2, { lineW: 2.5 });
    }
    // 冠上灰色雷云
    for (const [x, y, r] of [
      [98, CY - 25, 6],
      [108, CY - 28, 4.5],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      toon(ctx, 0x6c757d, x - r, y - r, r * 2, r * 2, { lineW: 2, noShine: true });
    }
    bolt(ctx, [
      [100, CY - 12],
      [94, CY - 2],
      [102, CY],
      [96, CY + 12],
    ]);
    bolt(
      ctx,
      [
        [118, CY - 14],
        [124, CY - 6],
        [119, CY - 3],
        [125, CY + 4],
      ],
      0xfff3b0,
      2,
    );
    bolt(
      ctx,
      [
        [80, CY - 18],
        [74, CY - 24],
        [78, CY - 25],
        [72, CY - 30],
      ],
      0xfff3b0,
      2,
    );
    sparkle(ctx, 70, 52, 3.5);
  },
  // 芥末龙息：芥末罐加压油箱 + 金属龙头喷嘴，龙嘴大张喷出黄绿色芥末烈焰
  mustard_dragon(ctx) {
    roundRectPath(ctx, 18, CY + 8, 14, 20, 4);
    toon(ctx, 0x6b4226, 18, CY + 8, 14, 20, { noShine: true });
    roundRectPath(ctx, 4, CY - 14, 54, 28, 10);
    toon(ctx, 0xffc300, 4, CY - 14, 54, 28);
    band(ctx, 18, CY, 4, 30, 0xe09f3e);
    band(ctx, 40, CY, 4, 30, 0xe09f3e);
    // 压力表
    ctx.beginPath();
    ctx.arc(30, CY - 18, 6, 0, Math.PI * 2);
    metal(ctx, 24, CY - 24, 12, 12, 0xadb5bd);
    ctx.fillStyle = rgb(0xd00000);
    ctx.beginPath();
    ctx.arc(30, CY - 18, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // 火焰（画在龙头下层）
    glow(ctx, 112, CY + 2, 16, 0xb5e48c, 0.8);
    flame(ctx, 88, CY + 3, 38, 15, 0, 0x99d98c, 0xfff3b0);
    flame(ctx, 100, CY - 4, 24, 6, -0.25, 0xffc300, 0xfff3b0);
    // 龙头：上颚
    ctx.beginPath();
    ctx.moveTo(56, CY - 10);
    ctx.quadraticCurveTo(66, CY - 18, 82, CY - 14);
    ctx.lineTo(100, CY - 8);
    ctx.lineTo(98, CY - 2);
    ctx.lineTo(80, CY - 2);
    ctx.lineTo(56, CY + 2);
    ctx.closePath();
    metal(ctx, 56, CY - 18, 44, 20, 0x52796f);
    // 下颚
    ctx.beginPath();
    ctx.moveTo(56, CY + 4);
    ctx.lineTo(80, CY + 6);
    ctx.lineTo(94, CY + 14);
    ctx.lineTo(80, CY + 14);
    ctx.quadraticCurveTo(64, CY + 16, 56, CY + 12);
    ctx.closePath();
    metal(ctx, 56, CY + 4, 38, 12, 0x52796f);
    // 獠牙
    ctx.fillStyle = '#fff';
    for (const [x, y, d] of [
      [88, CY - 3, 1],
      [94, CY - 3, 1],
      [84, CY + 7, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x - 2, y);
      ctx.lineTo(x, y + d * 5);
      ctx.lineTo(x + 2, y);
      ctx.closePath();
      ctx.fill();
    }
    // 角与眼
    ctx.beginPath();
    ctx.moveTo(62, CY - 14);
    ctx.quadraticCurveTo(52, CY - 22, 44, CY - 29);
    ctx.quadraticCurveTo(64, CY - 30, 72, CY - 15);
    ctx.closePath();
    toon(ctx, GOLD, 46, CY - 28, 24, 14, { lineW: 2, noShine: true });
    ctx.beginPath();
    ctx.ellipse(76, CY - 9, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgb(0xffd60a);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(75.5, CY - 11, 1.2, 4);
    sparkle(ctx, 116, 10, 4);
  },

  // 胡椒雷区：膨胀成带尖刺的大号胡椒水雷，两侧再用引线连着两颗小雷，核心红光
  pepper_minefield(ctx) {
    const mine = (x: number, y: number, r: number) => {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a - 0.22) * r * 0.9, y + Math.sin(a - 0.22) * r * 0.9);
        ctx.lineTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35);
        ctx.lineTo(x + Math.cos(a + 0.22) * r * 0.9, y + Math.sin(a + 0.22) * r * 0.9);
        ctx.closePath();
        metal(ctx, x - r, y - r, r * 2, r * 2, 0xadb5bd);
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      toon(ctx, 0x2d3142, x - r, y - r, r * 2, r * 2);
      glow(ctx, x, y, r * 0.6, 0xff3b30, 0.9);
      ctx.fillStyle = '#ff3b30';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.24, 0, Math.PI * 2);
      ctx.fill();
      // 胡椒粒
      ctx.fillStyle = rgb(0x6c3a2a);
      for (const a of [0.6, 2.4, 4.2]) {
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, Math.max(1.2, r * 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
    };
    glow(ctx, 64, CY + 2, 34, 0xff5400, 0.4);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(18, CY + 16);
    ctx.quadraticCurveTo(40, CY + 30, 64, CY + 20);
    ctx.quadraticCurveTo(88, CY + 30, 110, CY + 16);
    ctx.stroke();
    ctx.setLineDash([]);
    mine(18, CY + 14, 9);
    mine(110, CY + 14, 9);
    mine(64, CY + 2, 18);
    // 雷帽
    roundRectPath(ctx, 57, CY - 22, 14, 8, 2);
    metal(ctx, 57, CY - 22, 14, 8, GOLD);
    sparkle(ctx, 98, 8, 4);
    sparkle(ctx, 28, 8, 3);
  },

  // 怒涛芥末刀：浪花形护手 + 加长芥末绿太刀，刀身刃文是翻卷的海浪，刀尖卷起浪头
  tsunami_katana(ctx) {
    handle(ctx, 4, 38, CY, 10, 0x1d3557);
    ctx.strokeStyle = rgb(0xf1faee, 0.8);
    ctx.lineWidth = 1.5;
    for (let x = 8; x < 36; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, CY - 4);
      ctx.lineTo(x + 3, CY + 4);
      ctx.moveTo(x + 3, CY - 4);
      ctx.lineTo(x, CY + 4);
      ctx.stroke();
    }
    // 刀身
    ctx.beginPath();
    ctx.moveTo(44, CY - 7);
    ctx.quadraticCurveTo(92, CY - 16, 126, CY - 10);
    ctx.quadraticCurveTo(100, CY + 6, 44, CY + 7);
    ctx.closePath();
    toon(ctx, 0x7bd389, 44, CY - 16, 82, 23);
    // 浪纹刃文
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(44, CY - 7);
    ctx.quadraticCurveTo(92, CY - 16, 126, CY - 10);
    ctx.quadraticCurveTo(100, CY + 6, 44, CY + 7);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = rgb(0x0077b6, 0.75);
    ctx.beginPath();
    ctx.moveTo(44, CY + 8);
    for (let x = 44; x < 124; x += 12) {
      ctx.quadraticCurveTo(x + 4, CY - 4 - (x - 44) * 0.07, x + 9, CY - 1 - (x - 44) * 0.07);
      ctx.quadraticCurveTo(x + 6, CY + 3 - (x - 44) * 0.07, x + 12, CY + 2 - (x - 44) * 0.07);
    }
    ctx.lineTo(126, CY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 刀尖浪头
    ctx.beginPath();
    ctx.moveTo(104, CY - 12);
    ctx.quadraticCurveTo(112, CY - 28, 124, CY - 22);
    ctx.quadraticCurveTo(116, CY - 22, 116, CY - 16);
    ctx.quadraticCurveTo(110, CY - 14, 104, CY - 12);
    ctx.closePath();
    toon(ctx, 0x48cae4, 104, CY - 28, 20, 16, { lineW: 2, noShine: true });
    ctx.fillStyle = '#fff';
    for (const [x, y] of [
      [120, CY - 25],
      [112, CY - 27],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // 浪花护手
    ctx.beginPath();
    ctx.moveTo(42, CY - 16);
    ctx.quadraticCurveTo(52, CY - 14, 48, CY - 6);
    ctx.quadraticCurveTo(44, CY - 10, 46, CY - 2);
    ctx.lineTo(46, CY + 4);
    ctx.quadraticCurveTo(52, CY + 8, 48, CY + 16);
    ctx.quadraticCurveTo(36, CY + 14, 38, CY);
    ctx.quadraticCurveTo(36, CY - 12, 42, CY - 16);
    ctx.closePath();
    toon(ctx, 0x0096c7, 36, CY - 16, 16, 32, { lineW: 2.5 });
    ctx.beginPath();
    ctx.ellipse(42, CY, 2.5, 8, 0, 0, Math.PI * 2);
    toon(ctx, GOLD, 39.5, CY - 8, 5, 16, { lineW: 1.5, noShine: true });
    sparkle(ctx, 92, 46, 4);
  },

  // 龙卷破壁机：悬浮的破壁机——金属底座 + 透明杯，杯中刀片卷起绿色龙卷风，杯外环绕风刃
  tornado_blender(ctx) {
    glow(ctx, 64, CY, 34, 0x9bf6ff, 0.45);
    // 杯外风刃
    ctx.strokeStyle = rgb(0xcaf0f8, 0.85);
    ctx.lineWidth = 2.5;
    for (const [rx, a0] of [
      [44, -0.4],
      [40, Math.PI - 0.4],
    ]) {
      ctx.beginPath();
      ctx.ellipse(64, CY + 4, rx, 14, 0, a0, a0 + 1.4);
      ctx.stroke();
    }
    // 杯体
    ctx.beginPath();
    ctx.moveTo(42, 6);
    ctx.lineTo(86, 6);
    ctx.lineTo(80, 46);
    ctx.lineTo(48, 46);
    ctx.closePath();
    ctx.fillStyle = 'rgba(202,240,248,0.35)';
    ctx.fill();
    // 龙卷风
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 5; i++) {
      const y = 12 + i * 7;
      const rx = 18 - i * 3.2;
      ctx.beginPath();
      ctx.ellipse(64 + (i % 2 ? 2 : -2), y, rx, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgb(i % 2 ? 0x52b788 : 0x95d5b2, 0.9);
      ctx.fill();
      ctx.strokeStyle = rgb(0x1b4332);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(42, 6);
    ctx.lineTo(86, 6);
    ctx.lineTo(80, 46);
    ctx.lineTo(48, 46);
    ctx.closePath();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(47, 10);
    ctx.lineTo(51, 40);
    ctx.stroke();
    // 刀片
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(64, 42);
      ctx.lineTo(64 + s * 14, 38);
      ctx.lineTo(64 + s * 12, 43);
      ctx.closePath();
      metal(ctx, 50, 38, 28, 6, 0xdee2e6);
    }
    // 杯盖
    roundRectPath(ctx, 40, 2, 48, 6, 3);
    metal(ctx, 40, 2, 48, 6, 0x495057);
    // 底座
    ctx.beginPath();
    ctx.moveTo(44, 46);
    ctx.lineTo(84, 46);
    ctx.lineTo(88, 61);
    ctx.lineTo(40, 61);
    ctx.closePath();
    metal(ctx, 40, 46, 48, 15, 0x6c757d);
    ctx.beginPath();
    ctx.arc(64, 54, 4, 0, Math.PI * 2);
    toon(ctx, GOLD, 60, 50, 8, 8, { lineW: 1.5 });
    // 把手
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(85, 12);
    ctx.quadraticCurveTo(100, 14, 98, 26);
    ctx.quadraticCurveTo(96, 36, 82, 38);
    ctx.stroke();
    ctx.strokeStyle = rgb(0x495057);
    ctx.lineWidth = 3;
    ctx.stroke();
    sparkle(ctx, 110, 10, 4);
    sparkle(ctx, 20, 52, 3);
  },

  // 鲜味核弹：酱油瓶形的核弹弹体，尾部四片尾翼，瓶身黄色核标签，红色瓶盖弹头，背后蘑菇云光
  umami_bomb(ctx) {
    glow(ctx, 64, CY, 36, 0xffb703, 0.45);
    // 尾翼
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(26, CY + s * 6);
      ctx.lineTo(6, CY + s * 24);
      ctx.lineTo(4, CY + s * 12);
      ctx.lineTo(14, CY + s * 4);
      ctx.closePath();
      metal(ctx, 4, CY - 24, 22, 48, 0x6c757d);
    }
    roundRectPath(ctx, 4, CY - 4, 16, 8, 2);
    metal(ctx, 4, CY - 4, 16, 8, 0x495057);
    // 瓶身：胖肚 + 瓶颈
    ctx.beginPath();
    ctx.moveTo(18, CY - 10);
    ctx.bezierCurveTo(26, CY - 26, 76, CY - 26, 86, CY - 10);
    ctx.lineTo(102, CY - 6);
    ctx.lineTo(102, CY + 6);
    ctx.lineTo(86, CY + 10);
    ctx.bezierCurveTo(76, CY + 26, 26, CY + 26, 18, CY + 10);
    ctx.closePath();
    toon(ctx, 0x582f0e, 18, CY - 22, 84, 44);
    // 核标签
    ellipsePath(ctx, 52, CY, 17, 13);
    ctx.fillStyle = rgb(0xffd60a);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = OUTLINE;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(52, CY);
      ctx.arc(52, CY, 10, a - 0.5, a + 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(52, CY, 3, 0, Math.PI * 2);
    ctx.fillStyle = rgb(0xffd60a);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(52, CY, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    // 金箍
    band(ctx, 84, CY, 4, 22);
    // 红盖弹头
    ctx.beginPath();
    ctx.moveTo(100, CY - 9);
    ctx.lineTo(114, CY - 9);
    ctx.quadraticCurveTo(126, CY, 114, CY + 9);
    ctx.lineTo(100, CY + 9);
    ctx.closePath();
    toon(ctx, 0xd62828, 100, CY - 9, 24, 18, { lineW: 2.5 });
    ctx.strokeStyle = rgb(0x9d0208);
    ctx.lineWidth = 1.5;
    for (const x of [104, 108]) {
      ctx.beginPath();
      ctx.moveTo(x, CY - 8);
      ctx.lineTo(x, CY + 8);
      ctx.stroke();
    }
    sparkle(ctx, 98, 6, 4);
    sparkle(ctx, 30, 58, 3);
  },
};
