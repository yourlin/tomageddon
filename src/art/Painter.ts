// Canvas 2D 绘图工具：卡通渲染（渐变体积、粗描边、边缘光、高光）
import Phaser from 'phaser';

export type Ctx = CanvasRenderingContext2D;

export const OUTLINE = '#2a1614';

export function rgb(c: number, a = 1): string {
  return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
}

export function mix(a: number, b: number, t: number): number {
  const r = ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t;
  const g = ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t;
  const bl = (a & 255) * (1 - t) + (b & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}
export const lighten = (c: number, t: number) => mix(c, 0xffffff, t);
export const darken = (c: number, t: number) => mix(c, 0x000000, t);
/** 描边色：颜色本身压暗并偏向暖棕，比纯黑更柔和 */
export const outlineOf = (c: number) => rgb(mix(darken(c, 0.72), 0x2a1614, 0.5));

/** 生成 canvas 贴图（已存在则跳过），返回 key */
export function paint(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx, w: number, h: number) => void): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  if (!tex) return key;
  const ctx = tex.getContext();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, w, h);
  tex.refresh();
  return key;
}

// ---------------- 路径 ----------------
export function ellipsePath(ctx: Ctx, cx: number, cy: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
}

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 平滑闭合曲线（Catmull-Rom → Bezier） */
export function smoothPath(ctx: Ctx, pts: [number, number][]): void {
  const n = pts.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n],
      p1 = pts[i],
      p2 = pts[(i + 1) % n],
      p3 = pts[(i + 2) % n];
    if (i === 0) ctx.moveTo(p1[0], p1[1]);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6,
      c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6,
      c2y = p2[1] - (p3[1] - p1[1]) / 6;
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
  }
  ctx.closePath();
}

/** 由极坐标函数生成平滑形状 r(θ) */
export function polarPath(ctx: Ctx, cx: number, cy: number, n: number, r: (a: number) => [number, number]): void {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const [rx, ry] = r(a);
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  smoothPath(ctx, pts);
}

export function starPath(ctx: Ctx, cx: number, cy: number, r1: number, r2: number, n: number, rot = -Math.PI / 2): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = rot + (i / (n * 2)) * Math.PI * 2;
    const x = cx + Math.cos(a) * r,
      y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// ---------------- 着色 ----------------
/**
 * 卡通体积填充：当前路径 → 径向渐变 + 暗部 + 描边 + 边缘高光
 * bbox 用于计算光照位置
 */
export function toon(
  ctx: Ctx,
  color: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  opts: { outline?: number; noShine?: boolean; flat?: boolean; lineW?: number } = {},
): void {
  const cx = bx + bw / 2,
    cy = by + bh / 2;
  const r = Math.max(bw, bh) * 0.75;
  // 1) 体积渐变填充
  if (opts.flat) {
    ctx.fillStyle = rgb(color);
  } else {
    const g = ctx.createRadialGradient(cx - bw * 0.22, cy - bh * 0.28, r * 0.05, cx, cy, r);
    g.addColorStop(0, rgb(lighten(color, 0.35)));
    g.addColorStop(0.45, rgb(color));
    g.addColorStop(1, rgb(darken(color, 0.35)));
    ctx.fillStyle = g;
  }
  ctx.fill();
  // 2) 描边（路径仍是调用者构建的形状）
  ctx.save();
  ctx.lineWidth = opts.lineW ?? Math.max(2.5, Math.min(bw, bh) * 0.06);
  ctx.strokeStyle = opts.outline !== undefined ? rgb(opts.outline) : outlineOf(color);
  ctx.stroke();
  ctx.restore();
  // 3) 在形状内部绘制暗部、反光与高光
  ctx.save();
  ctx.clip();
  if (!opts.flat) {
    const g2 = ctx.createLinearGradient(0, by + bh * 0.55, 0, by + bh);
    g2.addColorStop(0, rgb(darken(color, 0.25), 0));
    g2.addColorStop(1, rgb(darken(color, 0.3), 0.45));
    ctx.fillStyle = g2;
    ctx.fillRect(bx - 4, by + bh * 0.5, bw + 8, bh * 0.55);
    ctx.strokeStyle = rgb(lighten(color, 0.5), 0.35);
    ctx.lineWidth = Math.max(2, bw * 0.04);
    ctx.beginPath();
    ctx.ellipse(cx, cy + bh * 0.02, bw * 0.38, bh * 0.38, 0, Math.PI * 0.25, Math.PI * 0.75);
    ctx.stroke();
  }
  if (!opts.noShine) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - bw * 0.2, cy - bh * 0.25, bw * 0.13, bh * 0.08, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(cx - bw * 0.05, cy - bh * 0.33, Math.max(1.5, bw * 0.03), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 在当前路径内裁剪绘制（用于花纹） */
export function clipDraw(ctx: Ctx, pathFn: () => void, draw: () => void): void {
  ctx.save();
  pathFn();
  ctx.clip();
  draw();
  ctx.restore();
}

/** 发光 */
export function glow(ctx: Ctx, cx: number, cy: number, r: number, color: number, a = 0.6): void {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgb(color, a));
  g.addColorStop(1, rgb(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/** 确定性伪随机（让程序生成的图每次一致） */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
