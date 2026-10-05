// 地雷造型：每种地雷长得和名字一样（胡椒雷是辣椒、海胆雷是刺球……），超武在原造型上加强
import { toon, ellipsePath, roundRectPath, starPath, glow, OUTLINE, type Ctx } from './Painter';

/** 地雷贴图尺寸（正方形） */
export const MINE_SIZE = 48;

/** 地雷外观：爆炸颜色（超武沿用进化前的颜色） */
export const MINE_BOOM_COLOR: Record<string, number> = {
  pepper_mine: 0xff5400,
  pepper_minefield: 0xff3b00,
  popcorn_machine: 0xffe066,
  mint_frost_mine: 0x9bf6ff,
  soy_bomb: 0x9c6644,
  umami_bomb: 0xc9a227,
  sea_urchin_mine: 0xb5179e,
};

function dot(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** 引信 + 火星 */
function fuse(ctx: Ctx, x0: number, y0: number, x1: number, y1: number): void {
  ctx.strokeStyle = '#6b4f2a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2 + 4, Math.min(y0, y1) - 4, x1, y1);
  ctx.stroke();
  glow(ctx, x1, y1, 6, 0xffd166, 1);
  dot(ctx, x1, y1, 2, '#fff3b0');
}

/** 胡椒雷：一根红辣椒，绿蒂 + 引信 */
function pepper(ctx: Ctx, body: number): void {
  ctx.beginPath();
  ctx.moveTo(10, 22);
  ctx.bezierCurveTo(12, 12, 30, 14, 40, 26);
  ctx.bezierCurveTo(44, 32, 40, 38, 34, 36);
  ctx.bezierCurveTo(26, 34, 14, 34, 10, 22);
  ctx.closePath();
  toon(ctx, body, 9, 13, 35, 25, { lineW: 2 });
  // 蒂
  ctx.beginPath();
  ctx.moveTo(7, 18);
  ctx.quadraticCurveTo(9, 22, 13, 21);
  ctx.quadraticCurveTo(12, 16, 7, 18);
  toon(ctx, 0x2d6a4f, 6, 15, 8, 8, { lineW: 1.5, noShine: true });
  fuse(ctx, 8, 17, 4, 8);
}

/** 爆米花机：一堆蓬松的爆米花，底下黄油色玉米粒 */
function popcorn(ctx: Ctx): void {
  ctx.beginPath();
  ellipsePath(ctx, 24, 36, 13, 6);
  toon(ctx, 0xffb703, 11, 30, 26, 12, { lineW: 2 });
  for (const [x, y, r] of [
    [16, 28, 8],
    [31, 28, 8],
    [24, 21, 9],
    [18, 16, 6],
    [30, 16, 6],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    toon(ctx, 0xfff3d6, x - r, y - r, r * 2, r * 2, { lineW: 2 });
  }
  dot(ctx, 22, 28, 2, '#ffd23f');
  dot(ctx, 29, 20, 1.8, '#ffd23f');
}

/** 薄荷冰雷：冰蓝圆雷，顶上两片薄荷叶，雪花纹 */
function mint(ctx: Ctx): void {
  glow(ctx, 24, 27, 22, 0x9bf6ff, 0.5);
  ctx.beginPath();
  ctx.arc(24, 28, 14, 0, Math.PI * 2);
  toon(ctx, 0x48cae4, 10, 14, 28, 28, { lineW: 2 });
  // 雪花
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(24 - Math.cos(a) * 8, 28 - Math.sin(a) * 8);
    ctx.lineTo(24 + Math.cos(a) * 8, 28 + Math.sin(a) * 8);
    ctx.stroke();
  }
  // 薄荷叶
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(24, 15);
    ctx.quadraticCurveTo(24 + s * 4, 4, 24 + s * 13, 7);
    ctx.quadraticCurveTo(24 + s * 10, 15, 24, 15);
    toon(ctx, 0x52b788, s < 0 ? 11 : 24, 4, 13, 11, { lineW: 1.5, noShine: true });
  }
}

/** 酱油炸弹：圆肚酱油瓶，红盖白标签，带引信 */
function soy(ctx: Ctx, nuke: boolean): void {
  if (nuke) glow(ctx, 24, 28, 24, 0xffd166, 0.55);
  ctx.beginPath();
  ctx.arc(24, 30, 14, 0, Math.PI * 2);
  toon(ctx, nuke ? 0x2b1a0e : 0x4a2511, 10, 16, 28, 28, { lineW: 2 });
  roundRectPath(ctx, 19, 9, 10, 9, 2);
  toon(ctx, nuke ? 0xc9a227 : 0xd62828, 19, 9, 10, 9, { lineW: 1.5, noShine: true });
  // 标签
  roundRectPath(ctx, 15, 25, 18, 10, 2);
  ctx.fillStyle = nuke ? '#ffd166' : '#fff4ea';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if (nuke) {
    // 核弹标志
    ctx.fillStyle = '#2b1a0e';
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(24, 30);
      ctx.arc(24, 30, 4.5, a - 0.5, a + 0.5);
      ctx.closePath();
      ctx.fill();
    }
    dot(ctx, 24, 30, 1.2, '#ffd166');
  } else {
    ctx.fillStyle = '#4a2511';
    ctx.fillRect(18, 29, 12, 2);
  }
  fuse(ctx, 26, 9, 33, 3);
}

/** 海胆雷：紫色刺球，橙色内核 */
function urchin(ctx: Ctx): void {
  starPath(ctx, 24, 26, 20, 11, 14);
  toon(ctx, 0x5a189a, 4, 6, 40, 40, { lineW: 1.5 });
  ctx.beginPath();
  ctx.arc(24, 26, 10, 0, Math.PI * 2);
  toon(ctx, 0x7b2cbf, 14, 16, 20, 20, { lineW: 1.5 });
  for (const [x, y] of [
    [21, 23],
    [27, 24],
    [24, 29],
  ] as const)
    dot(ctx, x, y, 2, '#f77f00');
}

/** 超武光晕：金色外圈 + 小火星 */
function evolvedAura(ctx: Ctx, color: number): void {
  glow(ctx, 24, 26, 24, color, 0.6);
}

export function drawMine(ctx: Ctx, id: string): void {
  switch (id) {
    case 'pepper_mine':
      return pepper(ctx, 0xd62828);
    case 'pepper_minefield':
      evolvedAura(ctx, 0xff7b00);
      pepper(ctx, 0xff3b00);
      // 泡打粉鼓起的气泡
      dot(ctx, 30, 22, 2.2, 'rgba(255,255,255,0.85)');
      dot(ctx, 22, 25, 1.6, 'rgba(255,255,255,0.85)');
      return;
    case 'popcorn_machine':
      return popcorn(ctx);
    case 'mint_frost_mine':
      return mint(ctx);
    case 'soy_bomb':
      return soy(ctx, false);
    case 'umami_bomb':
      return soy(ctx, true);
    case 'sea_urchin_mine':
      return urchin(ctx);
    default:
      // 没有专属造型：通用黑色圆雷 + 红灯
      ctx.beginPath();
      ctx.arc(24, 26, 15, 0, Math.PI * 2);
      toon(ctx, 0x2d3142, 9, 11, 30, 30);
      glow(ctx, 24, 26, 10, 0xff3b30, 1);
  }
}
