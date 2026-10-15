// 各章地图（程序绘制）：每张地图都是一件「放大的物件」——平底锅、菜畦、冰箱冷藏室……
// 画布 = 场地外接矩形 + 每边 MARGIN 的场外区域，按 SCALE 缩小绘制，显示时再放大。
// 三层：场外环境 → 按场地形状裁剪的地面 → 沿形状描的边缘（墙）→ 障碍物。设计见 docs/design/ARENAS.md
import Phaser from 'phaser';
import { paint, rgb, lighten, rng, roundRectPath, type Ctx } from './Painter';
import type { Arena, ArenaShape, Obstacle } from '../systems/Arena';
import { LOW_MEM } from '../systems/Device';

/** 场外区域宽度（逻辑像素） */
export const MAP_MARGIN = 220;
/** 绘制分辨率（逻辑像素 → 画布像素）；手机低内存模式用低一档，省显存 */
const SCALE = LOW_MEM ? 0.5 : 0.65;

interface MapCtx {
  ctx: Ctx;
  /** 画布尺寸（像素） */
  W: number;
  H: number;
  /** 逻辑坐标 → 画布坐标 */
  X: (x: number) => number;
  Y: (y: number) => number;
  /** 逻辑长度 → 画布长度 */
  L: (v: number) => number;
  arena: Arena;
  r: () => number;
}

/** 沿场地形状描路径（不 beginPath，调用方负责） */
function tracePath(m: MapCtx, s: ArenaShape): void {
  const { ctx, X, Y, L } = m;
  switch (s.kind) {
    case 'rect':
      ctx.rect(X(0), Y(0), L(s.w), L(s.h));
      break;
    case 'roundRect': {
      const r = Math.min(s.r, s.w / 2, s.h / 2);
      const x = X(0),
        y = Y(0),
        w = L(s.w),
        h = L(s.h),
        rr = L(r);
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
      break;
    }
    case 'ellipse':
      ctx.moveTo(X(s.rx * 2), Y(s.ry));
      ctx.ellipse(X(s.rx), Y(s.ry), L(s.rx), L(s.ry), 0, 0, Math.PI * 2);
      break;
    case 'polygon':
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
      ctx.closePath();
      break;
    case 'union':
      for (const p of s.parts) tracePath(m, p);
      break;
  }
}

function shapePath(m: MapCtx): void {
  m.ctx.beginPath();
  const o = m.arena.def.outline;
  tracePath(m, o ? { kind: 'polygon', pts: o } : m.arena.def.shape);
}

/** 只在场地内绘制 */
function clipped(m: MapCtx, fn: () => void): void {
  m.ctx.save();
  shapePath(m);
  m.ctx.clip();
  fn();
  m.ctx.restore();
}

/** 沿边缘描一圈厚边：先粗暗色，再细亮色，最后内侧阴影 */
function rim(m: MapCtx, width: number, dark: number, light: number, inner = 'rgba(0,0,0,0.45)'): void {
  const { ctx, L } = m;
  ctx.lineJoin = 'round';
  shapePath(m);
  ctx.strokeStyle = rgb(dark);
  ctx.lineWidth = L(width);
  ctx.stroke();
  shapePath(m);
  ctx.strokeStyle = rgb(light);
  ctx.lineWidth = L(width * 0.45);
  ctx.stroke();
  clipped(m, () => {
    shapePath(m);
    ctx.strokeStyle = inner;
    ctx.lineWidth = L(width * 1.2);
    ctx.stroke();
  });
}

/** 在场地外接矩形（含场外）内随机撒点 */
function scatter(m: MapCtx, n: number, fn: (x: number, y: number, s: number) => void, insideOnly = false): void {
  const A = m.arena;
  for (let i = 0, k = 0; i < n * 4 && k < n; i++) {
    const x = A.left - MAP_MARGIN + m.r() * (A.width + MAP_MARGIN * 2),
      y = A.top - MAP_MARGIN + m.r() * (A.height + MAP_MARGIN * 2);
    if (insideOnly && !A.contains(x, y, 10)) continue;
    fn(x, y, m.r());
    k++;
  }
}

function obstacleShape(m: MapCtx, o: Obstacle, grow = 0): void {
  const { ctx, X, Y, L } = m;
  ctx.beginPath();
  if (o.kind === 'circle') ctx.arc(X(o.x), Y(o.y), L(o.r + grow), 0, Math.PI * 2);
  else roundRectPath(ctx, X(o.x - grow), Y(o.y - grow), L(o.w + grow * 2), L(o.h + grow * 2), L(8));
}

/** 障碍物底部投影 */
function obstacleShadow(m: MapCtx, o: Obstacle): void {
  const { ctx } = m;
  ctx.save();
  ctx.translate(m.L(10), m.L(14));
  obstacleShape(m, o, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.restore();
}

// ════════════════════════════ 各章 ════════════════════════════

/** 第 1 章 · 平底锅：灶台上的一口不粘锅，锅柄从右侧伸出 */
function pan(m: MapCtx): void {
  const { ctx, W, H, X, Y, L, arena: A } = m;
  const cx = X(A.centerX),
    cy = Y(A.centerY),
    R = L(A.width / 2);
  // 场外：不锈钢灶台面 + 铸铁炉架
  const top = ctx.createLinearGradient(0, 0, W, H);
  top.addColorStop(0, '#3a3d42');
  top.addColorStop(1, '#25272b');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = -H; x < W; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }
  // 炉火：锅底边缘透出的一圈蓝色火苗光
  const flame = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18);
  flame.addColorStop(0, 'rgba(80,160,255,0)');
  flame.addColorStop(0.45, 'rgba(80,160,255,0.35)');
  flame.addColorStop(1, 'rgba(80,160,255,0)');
  ctx.fillStyle = flame;
  ctx.fillRect(0, 0, W, H);
  // 炉架：放射状的铸铁条
  ctx.strokeStyle = '#141416';
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    ctx.lineWidth = L(34);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * 0.98, cy + Math.sin(a) * R * 0.98);
    ctx.lineTo(cx + Math.cos(a) * R * 1.32, cy + Math.sin(a) * R * 1.32);
    ctx.stroke();
  }
  // 锅柄：从右侧伸出画面（装饰，不可走）
  const hy = cy,
    hx0 = cx + R * 0.94,
    hx1 = W + 10,
    hh = L(110);
  ctx.save();
  ctx.translate(L(8), L(10));
  roundRectPath(ctx, hx0, hy - hh / 2, hx1 - hx0, hh, hh / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();
  ctx.restore();
  const hg = ctx.createLinearGradient(0, hy - hh / 2, 0, hy + hh / 2);
  hg.addColorStop(0, '#3b3b40');
  hg.addColorStop(0.35, '#1d1d21');
  hg.addColorStop(1, '#0d0d10');
  roundRectPath(ctx, hx0, hy - hh / 2, hx1 - hx0, hh, hh / 2);
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRectPath(ctx, hx0 + L(40), hy - hh / 2 + L(12), hx1 - hx0, L(16), L(8));
  ctx.fill();
  // 铆钉
  for (const dy of [-0.22, 0.22]) {
    ctx.fillStyle = '#c9ccd1';
    ctx.beginPath();
    ctx.arc(hx0 + L(55), hy + hh * dy, L(9), 0, Math.PI * 2);
    ctx.fill();
  }
  // 锅底：黑色不粘涂层
  clipped(m, () => {
    const base = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.15, R * 0.05, cx, cy, R);
    base.addColorStop(0, '#34343a');
    base.addColorStop(1, '#17171b');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    // 同心细旋纹
    for (let rr = L(10); rr < R; rr += L(9)) {
      ctx.strokeStyle = `rgba(255,255,255,${0.025 + m.r() * 0.025})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 中心受热发红
    const heat = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
    heat.addColorStop(0, 'rgba(255,90,40,0.28)');
    heat.addColorStop(0.6, 'rgba(200,50,20,0.1)');
    heat.addColorStop(1, 'rgba(200,50,20,0)');
    ctx.fillStyle = heat;
    ctx.fillRect(0, 0, W, H);
    // 斜向的反光带
    const sheen = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    sheen.addColorStop(0.3, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.42, 'rgba(255,255,255,0.07)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H);
    // 油星：带高光的小椭圆
    scatter(
      m,
      70,
      (x, y, s) => {
        const px = X(x),
          py = Y(y),
          rr = L(4 + s * 10);
        ctx.fillStyle = 'rgba(230,190,90,0.18)';
        ctx.beginPath();
        ctx.ellipse(px, py, rr, rr * 0.75, s * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(px - rr * 0.3, py - rr * 0.3, rr * 0.25, 0, Math.PI * 2);
        ctx.fill();
      },
      true,
    );
  });
  // 锅沿：银色金属厚边
  shapePath(m);
  ctx.lineWidth = L(70);
  const rg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  rg.addColorStop(0, '#e9ecef');
  rg.addColorStop(0.5, '#8d939b');
  rg.addColorStop(1, '#4a4f56');
  ctx.strokeStyle = rg;
  ctx.stroke();
  shapePath(m);
  ctx.lineWidth = L(14);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.stroke();
  clipped(m, () => {
    shapePath(m);
    ctx.lineWidth = L(90);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
  });
}

/** 第 2 章 · 菜畦：一垄一垄的泥土，木栅栏围边 */
function garden(m: MapCtx): void {
  const { ctx, W, H, X, Y, L, arena: A } = m;
  ctx.fillStyle = '#3d5a2a';
  ctx.fillRect(0, 0, W, H);
  scatter(m, 500, (x, y, s) => {
    ctx.strokeStyle = rgb(s > 0.5 ? 0x587c3a : 0x2f4720, 0.8);
    ctx.lineWidth = L(3);
    ctx.beginPath();
    ctx.moveTo(X(x), Y(y));
    ctx.lineTo(X(x + (s - 0.5) * 12), Y(y - 14 - s * 10));
    ctx.stroke();
  });
  clipped(m, () => {
    ctx.fillStyle = '#6b4a2f';
    ctx.fillRect(0, 0, W, H);
    // 田垄：亮的垄背与暗的垄沟交替
    for (let y = A.top - 40, i = 0; y < A.bottom + 40; y += 90, i++) {
      const g = ctx.createLinearGradient(0, Y(y), 0, Y(y + 90));
      g.addColorStop(0, '#5a3d26');
      g.addColorStop(0.5, '#86603c');
      g.addColorStop(1, '#5a3d26');
      ctx.fillStyle = g;
      ctx.fillRect(0, Y(y), W, L(90));
    }
    scatter(
      m,
      160,
      (x, y, s) => {
        ctx.fillStyle = s > 0.7 ? 'rgba(150,140,120,0.8)' : 'rgba(120,80,40,0.7)';
        ctx.beginPath();
        ctx.ellipse(X(x), Y(y), L(4 + s * 6), L(3 + s * 4), s * 3, 0, Math.PI * 2);
        ctx.fill();
      },
      true,
    );
  });
  // 木栅栏：粗木条 + 立柱
  rim(m, 46, 0x5c3b1e, 0xa47148);
  for (const o of A.obstacles) {
    obstacleShadow(m, o);
    if (o.kind !== 'circle') continue;
    if (o.r > 50) {
      // 土堆
      const g = ctx.createRadialGradient(X(o.x - o.r * 0.3), Y(o.y - o.r * 0.3), 0, X(o.x), Y(o.y), L(o.r));
      g.addColorStop(0, '#9a6e44');
      g.addColorStop(1, '#5a3d26');
      obstacleShape(m, o);
      ctx.fillStyle = g;
      ctx.fill();
    } else {
      // 稻草人：木十字 + 草帽
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(X(o.x - 6), Y(o.y - o.r), L(12), L(o.r * 2));
      ctx.fillRect(X(o.x - o.r), Y(o.y - o.r * 0.4), L(o.r * 2), L(10));
      ctx.fillStyle = '#e9c46a';
      ctx.beginPath();
      ctx.ellipse(X(o.x), Y(o.y - o.r * 0.8), L(o.r * 0.9), L(o.r * 0.35), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** 第 3 章 · 冰箱冷藏室：结霜的白色内壁，两层玻璃隔板 */
function fridge(m: MapCtx): void {
  const { ctx, W, H, X, Y, L, arena: A } = m;
  ctx.fillStyle = '#9fb7c8';
  ctx.fillRect(0, 0, W, H);
  clipped(m, () => {
    const g = ctx.createLinearGradient(0, Y(A.top), 0, Y(A.bottom));
    g.addColorStop(0, '#f4f9fc');
    g.addColorStop(1, '#dbe9f2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // 冰晶花纹
    scatter(
      m,
      60,
      (x, y, s) => {
        ctx.strokeStyle = 'rgba(150,200,235,0.45)';
        ctx.lineWidth = L(2);
        const r = L(14 + s * 20);
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(X(x) - Math.cos(a) * r, Y(y) - Math.sin(a) * r);
          ctx.lineTo(X(x) + Math.cos(a) * r, Y(y) + Math.sin(a) * r);
          ctx.stroke();
        }
      },
      true,
    );
  });
  // 冰箱内壁 + 门封条
  rim(m, 60, 0x7f99ab, 0xe8f1f7, 'rgba(60,90,120,0.3)');
  for (const o of A.obstacles) {
    if (o.kind !== 'rect') continue;
    obstacleShadow(m, o);
    obstacleShape(m, o);
    ctx.fillStyle = 'rgba(170,215,240,0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = L(4);
    ctx.stroke();
  }
}

/** 第 4 章 · 垃圾场空地：开裂的沥青，四角是垃圾山 */
function junkyard(m: MapCtx): void {
  const { ctx, W, H, X, Y, L } = m;
  ctx.fillStyle = '#2b2a28';
  ctx.fillRect(0, 0, W, H);
  // 场外的垃圾山：一堆堆彩色垃圾袋
  scatter(m, 260, (x, y, s) => {
    if (m.arena.contains(x, y, -60)) return;
    const c = [0x264653, 0x1b1b1b, 0x3a5a40, 0x6c584c, 0x2a9d8f][Math.floor(s * 5)];
    ctx.fillStyle = rgb(c);
    ctx.beginPath();
    ctx.ellipse(X(x), Y(y), L(40 + s * 50), L(30 + s * 30), s * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgb(lighten(c, 0.25), 0.6);
    ctx.beginPath();
    ctx.ellipse(X(x - 10), Y(y - 10), L(12 + s * 10), L(8 + s * 6), 0, 0, Math.PI * 2);
    ctx.fill();
  });
  clipped(m, () => {
    ctx.fillStyle = '#4a4a4c';
    ctx.fillRect(0, 0, W, H);
    // 沥青颗粒
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(${m.r() > 0.5 ? '255,255,255' : '0,0,0'},${0.04 + m.r() * 0.05})`;
      ctx.fillRect(m.r() * W, m.r() * H, 2, 2);
    }
    // 裂缝
    ctx.strokeStyle = 'rgba(20,20,20,0.7)';
    ctx.lineWidth = L(3);
    scatter(m, 18, (x, y, s) => {
      ctx.beginPath();
      ctx.moveTo(X(x), Y(y));
      let px = x,
        py = y;
      for (let k = 0; k < 5; k++) {
        px += (m.r() - 0.5) * 120;
        py += (m.r() - 0.5) * 120;
        ctx.lineTo(X(px), Y(py));
      }
      ctx.stroke();
      void s;
    });
    // 油污
    scatter(m, 14, (x, y, s) => {
      ctx.fillStyle = 'rgba(10,10,10,0.35)';
      ctx.beginPath();
      ctx.ellipse(X(x), Y(y), L(50 + s * 60), L(30 + s * 30), s * 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  // 水泥路沿
  rim(m, 40, 0x6b6b68, 0xa8a8a2);
}

/** 第 5 章 · 番茄酱生产线：金属防滑板，黄黑警示线，灌装机 */
function factory(m: MapCtx): void {
  const { ctx, W, H, X, Y, L, arena: A } = m;
  ctx.fillStyle = '#1d2228';
  ctx.fillRect(0, 0, W, H);
  clipped(m, () => {
    ctx.fillStyle = '#5c646d';
    ctx.fillRect(0, 0, W, H);
    // 菱形防滑纹
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let y = A.top; y < A.bottom; y += 40)
      for (let x = A.left + ((y / 40) % 2) * 20; x < A.right; x += 40) {
        ctx.save();
        ctx.translate(X(x), Y(y));
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-L(8), -L(2), L(16), L(4));
        ctx.restore();
      }
    // 番茄酱溅痕
    scatter(
      m,
      24,
      (x, y, s) => {
        ctx.fillStyle = 'rgba(180,20,20,0.45)';
        ctx.beginPath();
        ctx.ellipse(X(x), Y(y), L(20 + s * 40), L(14 + s * 20), s * 3, 0, Math.PI * 2);
        ctx.fill();
      },
      true,
    );
  });
  // 黄黑警示线
  shapePath(m);
  ctx.lineWidth = L(40);
  ctx.strokeStyle = '#f1c40f';
  ctx.stroke();
  ctx.setLineDash([L(40), L(40)]);
  shapePath(m);
  ctx.strokeStyle = '#111';
  ctx.stroke();
  ctx.setLineDash([]);
  for (const o of A.obstacles) {
    if (o.kind !== 'rect') continue;
    obstacleShadow(m, o);
    obstacleShape(m, o);
    const g = ctx.createLinearGradient(0, Y(o.y), 0, Y(o.y + o.h));
    g.addColorStop(0, '#9aa5ae');
    g.addColorStop(1, '#4b545c');
    ctx.fillStyle = g;
    ctx.fill();
    // 仪表
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.arc(X(o.x + o.w * 0.25), Y(o.y + o.h * 0.45), L(16), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(X(o.x + o.w * 0.55), Y(o.y + o.h * 0.3), L(o.w * 0.3), L(o.h * 0.3));
  }
}

/** 第 6 章 · 玻璃温室：长青苔的六角地砖，八面玻璃墙，中央花台 */
function greenhouse(m: MapCtx): void {
  const { ctx, W, H, X, Y, L, arena: A } = m;
  ctx.fillStyle = '#1e2b1c';
  ctx.fillRect(0, 0, W, H);
  scatter(m, 120, (x, y, s) => {
    ctx.fillStyle = rgb(s > 0.5 ? 0x2f4a2a : 0x3e5c35, 0.9);
    ctx.beginPath();
    ctx.ellipse(X(x), Y(y), L(30 + s * 30), L(20 + s * 20), s * 3, 0, Math.PI * 2);
    ctx.fill();
  });
  clipped(m, () => {
    ctx.fillStyle = '#7d7a6a';
    ctx.fillRect(0, 0, W, H);
    // 六角地砖
    const s = 46;
    ctx.strokeStyle = 'rgba(40,45,30,0.55)';
    ctx.lineWidth = L(3);
    for (let row = 0, y = A.top; y < A.bottom + s; y += s * 1.5, row++)
      for (let x = A.left + (row % 2) * s * 0.866; x < A.right + s; x += s * 1.732) {
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
          const px = X(x + Math.cos(a) * s),
            py = Y(y + Math.sin(a) * s);
          if (k) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.closePath();
        if (m.r() < 0.25) {
          ctx.fillStyle = 'rgba(90,120,60,0.35)';
          ctx.fill();
        }
        ctx.stroke();
      }
  });
  // 玻璃墙：半透明青色 + 窗框
  rim(m, 50, 0x3d5a5c, 0xbfe6e8, 'rgba(20,40,30,0.35)');
  for (const o of A.obstacles) {
    if (o.kind !== 'circle') continue;
    obstacleShadow(m, o);
    obstacleShape(m, o);
    ctx.fillStyle = '#8d8a7b';
    ctx.fill();
    obstacleShape(m, o, -18);
    ctx.fillStyle = '#4a3a28';
    ctx.fill();
    // 枯萎的花
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2,
        rr = o.r * 0.45;
      ctx.fillStyle = rgb(k % 2 ? 0x8a7a4a : 0x6b5b3a);
      ctx.beginPath();
      ctx.arc(X(o.x + Math.cos(a) * rr), Y(o.y + Math.sin(a) * rr), L(16), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** 第 7 章 · 腐烂番茄剖面：外圈红果肉、越往中心越褐越黑，籽腔是腐土坑 */
function rottenTomato(m: MapCtx): void {
  const { ctx, W, H, X, Y, L, arena: A } = m;
  ctx.fillStyle = '#140d0a';
  ctx.fillRect(0, 0, W, H);
  scatter(m, 80, (x, y, s) => {
    ctx.fillStyle = `rgba(70,50,30,${0.3 + s * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(X(x), Y(y), L(40 + s * 60), L(25 + s * 30), s * 3, 0, Math.PI * 2);
    ctx.fill();
  });
  clipped(m, () => {
    const cx = X(A.centerX),
      cy = Y(A.centerY),
      R = L(Math.max(A.width, A.height) / 2);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, '#2b1a10');
    g.addColorStop(0.45, '#5e2a14');
    g.addColorStop(0.8, '#a32a1c');
    g.addColorStop(1, '#c0392b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // 果肉纹理：从中心放射的筋络
    ctx.strokeStyle = 'rgba(255,170,140,0.12)';
    ctx.lineWidth = L(6);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + m.r() * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + Math.cos(a + 0.3) * R * 0.5, cy + Math.sin(a + 0.3) * R * 0.5, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.stroke();
    }
    // 霉斑
    scatter(
      m,
      40,
      (x, y, s) => {
        ctx.fillStyle = `rgba(120,140,80,${0.15 + s * 0.2})`;
        ctx.beginPath();
        ctx.arc(X(x), Y(y), L(10 + s * 30), 0, Math.PI * 2);
        ctx.fill();
      },
      true,
    );
  });
  // 番茄表皮：发皱的红色厚边 + 霉点
  rim(m, 64, 0x7a1d12, 0xd64533);
  for (const o of A.obstacles) {
    if (o.kind !== 'circle') continue;
    obstacleShape(m, o, 10);
    ctx.fillStyle = 'rgba(40,20,10,0.6)';
    ctx.fill();
    obstacleShape(m, o);
    const g = ctx.createRadialGradient(X(o.x), Y(o.y), 0, X(o.x), Y(o.y), L(o.r));
    g.addColorStop(0, '#0d0805');
    g.addColorStop(1, '#3a2614');
    ctx.fillStyle = g;
    ctx.fill();
    // 籽
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + m.r(),
        rr = o.r * 0.55;
      ctx.fillStyle = 'rgba(230,200,120,0.8)';
      ctx.beginPath();
      ctx.ellipse(X(o.x + Math.cos(a) * rr), Y(o.y + Math.sin(a) * rr), L(9), L(5), a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** 没有专属地图的场地（开发工具 / 沙盒用的默认矩形）：简单地板 + 边框 */
function plain(m: MapCtx): void {
  const { ctx, W, H } = m;
  ctx.fillStyle = '#2a1d18';
  ctx.fillRect(0, 0, W, H);
  clipped(m, () => {
    ctx.fillStyle = '#6f4e37';
    ctx.fillRect(0, 0, W, H);
  });
  rim(m, 40, 0x3e2a1e, 0x8a6a50);
}

const PAINTERS: Record<number, (m: MapCtx) => void> = {
  1: pan,
  2: garden,
  3: fridge,
  4: junkyard,
  5: factory,
  6: greenhouse,
  7: rottenTomato,
};

/** 画出本章地图，返回贴图 key；显示位置与尺寸见 mapPlacement */
export function paintArenaMap(scene: Phaser.Scene, ch: number, arena: Arena, key = `arena_map_${ch}`): string {
  const W = Math.ceil((arena.width + MAP_MARGIN * 2) * SCALE),
    H = Math.ceil((arena.height + MAP_MARGIN * 2) * SCALE);
  return paint(scene, key, W, H, (ctx) => {
    const m: MapCtx = {
      ctx,
      W,
      H,
      X: (x) => (x - arena.left + MAP_MARGIN) * SCALE,
      Y: (y) => (y - arena.top + MAP_MARGIN) * SCALE,
      L: (v) => v * SCALE,
      arena,
      r: rng(ch * 7919 + 17),
    };
    (PAINTERS[ch] ?? plain)(m);
  });
}

/** 地图贴图在世界坐标里的中心与显示尺寸 */
export function mapPlacement(arena: Arena): { x: number; y: number; w: number; h: number } {
  return { x: arena.centerX, y: arena.centerY, w: arena.width + MAP_MARGIN * 2, h: arena.height + MAP_MARGIN * 2 };
}
