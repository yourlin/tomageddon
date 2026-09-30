// 身体形状、花纹、头顶部件的绘制
import { type Ctx, ellipsePath, roundRectPath, polarPath, starPath, toon, clipDraw, rgb, darken, lighten, outlineOf, rng } from './Painter';
import type { BodyShape, Pattern, Top } from './RigSpec';

export const P = 64; // 贴图中 1 个单位半径 = 64 像素

export function bodyPath(ctx: Ctx, shape: BodyShape, cx: number, cy: number, rx: number, ry: number): void {
  switch (shape) {
    case 'round':
    case 'oval':
    case 'tall':
    case 'wide':
      ellipsePath(ctx, cx, cy, rx, ry);
      break;
    case 'long':
      polarPath(ctx, cx, cy, 24, (a) => {
        const k = 1 - 0.25 * Math.max(0, Math.sin(a));
        return [rx * k, ry];
      });
      break;
    case 'pear':
      polarPath(ctx, cx, cy, 24, (a) => {
        const s = Math.sin(a);
        return [rx * (0.78 + 0.25 * s), ry];
      });
      break;
    case 'drop':
      polarPath(ctx, cx, cy, 28, (a) => {
        const s = Math.sin(a);
        return [rx * (0.55 + 0.45 * Math.max(0, s) + 0.1), ry * (s < 0 ? 1.1 : 1)];
      });
      break;
    case 'bean':
      polarPath(ctx, cx, cy, 24, (a) => [rx * (1 - 0.12 * Math.cos(a * 2)), ry * (1 + 0.05 * Math.cos(a))]);
      break;
    case 'blob':
      polarPath(ctx, cx, cy, 16, (a) => {
        const k = 1 + 0.07 * Math.sin(a * 5) + 0.04 * Math.cos(a * 3);
        return [rx * k, ry * k];
      });
      break;
    case 'cloud':
      polarPath(ctx, cx, cy, 30, (a) => {
        const k = 1 + 0.08 * Math.abs(Math.sin(a * 4));
        return [rx * k, ry * k];
      });
      break;
    case 'star':
      starPath(ctx, cx, cy, Math.min(rx, ry) * 1.1, Math.min(rx, ry) * 0.7, 5);
      break;
    case 'heart':
      polarPath(ctx, cx, cy, 32, (a) => {
        const d = Math.sin(a) < 0 ? 1 - 0.18 * Math.pow(Math.cos(a), 8) : 1 - 0.3 * Math.pow(Math.sin(a), 6);
        return [rx * d, ry * d];
      });
      break;
    case 'triangle':
      polarPath(ctx, cx, cy, 30, (a) => {
        const k = 0.82 + 0.18 * Math.cos(3 * (a + Math.PI / 2));
        return [rx * k, ry * k];
      });
      break;
    case 'cube':
      roundRectPath(ctx, cx - rx, cy - ry, rx * 2, ry * 2, Math.min(rx, ry) * 0.35);
      break;
    case 'can':
      roundRectPath(ctx, cx - rx, cy - ry, rx * 2, ry * 2, Math.min(rx, ry) * 0.2);
      break;
    case 'bag':
      polarPath(ctx, cx, cy, 28, (a) => {
        const s = Math.sin(a);
        const k = s < -0.7 ? 0.35 : 1;
        return [rx * (k + 0.05 * Math.sin(a * 7)), ry];
      });
      break;
    case 'mushroom':
      polarPath(ctx, cx, cy, 28, (a) => {
        const s = Math.sin(a);
        return [rx * (s > 0.2 ? 0.6 : 1.05), ry * (s < 0 ? 0.95 : 1)];
      });
      break;
    case 'segment':
      polarPath(ctx, cx, cy, 30, (a) => [rx * (1 + 0.06 * Math.sin(a * 8)), ry]);
      break;
    case 'bulb':
      polarPath(ctx, cx, cy, 28, (a) => {
        const s = Math.sin(a);
        return [rx * (s < -0.6 ? 0.55 + (s + 1) : 1), ry * (s < 0 ? 1.12 : 1)];
      });
      break;
  }
}

/** 绘制完整身体贴图（含花纹）。返回画布尺寸 */
export function drawBody(
  ctx: Ctx,
  shape: BodyShape,
  w: number,
  h: number,
  color: number,
  pattern: Pattern,
  pColor: number | undefined,
  color2: number | undefined,
  seed: number,
): void {
  const W = ctx.canvas.width,
    H = ctx.canvas.height;
  const cx = W / 2,
    cy = H / 2,
    rx = P * w,
    ry = P * h;
  const path = () => bodyPath(ctx, shape, cx, cy, rx, ry);
  path();
  toon(ctx, color, cx - rx, cy - ry, rx * 2, ry * 2, { noShine: true });
  const pc = pColor ?? darken(color, 0.25);
  const r = rng(seed);
  clipDraw(ctx, path, () => {
    ctx.fillStyle = rgb(pc);
    ctx.strokeStyle = rgb(pc);
    switch (pattern) {
      case 'stripes':
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * rx * 0.42, cy - ry * 1.1);
          for (let k = 0; k <= 10; k++) {
            const y = cy - ry * 1.1 + (k / 10) * ry * 2.2;
            ctx.lineTo(cx + i * rx * 0.42 * (1 - Math.abs(y - cy) / (ry * 2.4)) + Math.sin(k * 1.7 + i) * rx * 0.04 - rx * 0.07, y);
          }
          for (let k = 10; k >= 0; k--) {
            const y = cy - ry * 1.1 + (k / 10) * ry * 2.2;
            ctx.lineTo(cx + i * rx * 0.42 * (1 - Math.abs(y - cy) / (ry * 2.4)) + Math.sin(k * 1.7 + i) * rx * 0.04 + rx * 0.07, y);
          }
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'bands':
        for (let i = -2; i <= 2; i += 2) {
          ctx.fillRect(cx - rx * 1.2, cy + i * ry * 0.3 - ry * 0.12, rx * 2.4, ry * 0.26);
        }
        break;
      case 'seeds':
        for (let i = 0; i < 16; i++) {
          const a = r() * Math.PI * 2,
            d = Math.sqrt(r()) * 0.8;
          ctx.save();
          ctx.translate(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d);
          ctx.rotate(r() * 3);
          ctx.beginPath();
          ctx.ellipse(0, 0, 2.5, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        break;
      case 'dots':
      case 'spots':
        for (let i = 0; i < (pattern === 'dots' ? 10 : 6); i++) {
          const a = r() * Math.PI * 2,
            d = Math.sqrt(r()) * 0.8,
            s = (pattern === 'dots' ? 0.07 : 0.16) * rx * (0.7 + r() * 0.6);
          ctx.globalAlpha = pattern === 'spots' ? 0.6 : 0.9;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      case 'rings':
      case 'layers':
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.6;
        for (let i = 1; i <= 4; i++) {
          ctx.beginPath();
          ctx.ellipse(cx, cy + ry * 0.1, rx * (0.2 + i * 0.2), ry * 1.05, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      case 'segments':
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.55;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.ellipse(cx, cy + i * ry * 0.3, rx * 1.2, ry * 0.18, 0, 0, Math.PI);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      case 'bumps':
        for (let i = 0; i < 12; i++) {
          const a = r() * Math.PI * 2,
            d = Math.sqrt(r()) * 0.85;
          const x = cx + Math.cos(a) * rx * d,
            y = cy + Math.sin(a) * ry * d;
          ctx.fillStyle = rgb(lighten(color, 0.2), 0.7);
          ctx.beginPath();
          ctx.arc(x - 1, y - 1, rx * 0.06, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = rgb(darken(color, 0.25), 0.5);
          ctx.beginPath();
          ctx.arc(x + 1.5, y + 1.5, rx * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'grid':
      case 'scales': {
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        const s = rx * 0.32;
        for (let y = cy - ry; y < cy + ry; y += s * 0.7)
          for (let x = cx - rx; x < cx + rx; x += s) {
            const ox = (Math.round((y - cy) / (s * 0.7)) % 2) * s * 0.5;
            ctx.beginPath();
            if (pattern === 'grid') {
              ctx.moveTo(x + ox, y);
              ctx.lineTo(x + ox + s * 0.5, y + s * 0.35);
              ctx.lineTo(x + ox + s, y);
            } else ctx.arc(x + ox, y, s * 0.5, 0, Math.PI);
            ctx.stroke();
          }
        ctx.globalAlpha = 1;
        break;
      }
      case 'kernels': {
        const s = rx * 0.22;
        for (let y = cy - ry; y < cy + ry; y += s * 0.85)
          for (let x = cx - rx; x < cx + rx; x += s) {
            const ox = (Math.round((y - cy) / (s * 0.85)) % 2) * s * 0.5;
            ctx.fillStyle = rgb(lighten(color, 0.25));
            ctx.beginPath();
            ctx.ellipse(x + ox, y, s * 0.42, s * 0.38, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = rgb(darken(color, 0.2), 0.6);
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        break;
      }
      case 'fuzz':
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = rgb(lighten(color, 0.35));
        for (let i = 0; i < 70; i++) {
          const a = r() * Math.PI * 2,
            d = Math.sqrt(r());
          const x = cx + Math.cos(a) * rx * d,
            y = cy + Math.sin(a) * ry * d;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + (r() - 0.5) * 8, y + (r() - 0.5) * 8);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      case 'cracks':
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = rgb(darken(color, 0.45), 0.8);
        for (let i = 0; i < 4; i++) {
          let x = cx + (r() - 0.5) * rx * 1.4,
            y = cy + (r() - 0.5) * ry * 1.4;
          ctx.beginPath();
          ctx.moveTo(x, y);
          for (let j = 0; j < 4; j++) {
            x += (r() - 0.5) * rx * 0.5;
            y += (r() - 0.5) * ry * 0.5;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        break;
      case 'swirl':
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        for (let t = 0; t < 14; t += 0.1) {
          const rr = t * rx * 0.06;
          const x = cx + Math.cos(t) * rr,
            y = cy + Math.sin(t) * rr;
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      case 'belly':
        ctx.fillStyle = rgb(color2 ?? lighten(color, 0.45));
        ctx.beginPath();
        ctx.ellipse(cx, cy + ry * 0.35, rx * 0.62, ry * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'rivets':
        ctx.lineWidth = 3;
        ctx.strokeStyle = rgb(darken(color, 0.3), 0.8);
        ctx.beginPath();
        ctx.moveTo(cx - rx, cy - ry * 0.45);
        ctx.lineTo(cx + rx, cy - ry * 0.45);
        ctx.moveTo(cx - rx, cy + ry * 0.55);
        ctx.lineTo(cx + rx, cy + ry * 0.55);
        ctx.stroke();
        for (let i = -3; i <= 3; i++) {
          ctx.fillStyle = rgb(lighten(color, 0.35));
          ctx.beginPath();
          ctx.arc(cx + i * rx * 0.28, cy - ry * 0.45, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + i * rx * 0.28, cy + ry * 0.55, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'frost':
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const x = cx + (r() - 0.5) * rx * 1.5,
            y = cy + (r() - 0.5) * ry * 1.5,
            s = rx * 0.12;
          for (let k = 0; k < 3; k++) {
            const a = (k / 3) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s);
            ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
            ctx.stroke();
          }
        }
        break;
      case 'drips':
        ctx.fillStyle = rgb(pc);
        ctx.beginPath();
        ctx.moveTo(cx - rx * 1.2, cy - ry);
        for (let i = 0; i <= 8; i++) {
          const x = cx - rx + (i / 8) * rx * 2,
            d = ry * (0.25 + r() * 0.4);
          ctx.lineTo(x, cy - ry * 0.6);
          ctx.quadraticCurveTo(x + rx * 0.06, cy - ry * 0.6 + d, x + rx * 0.12, cy - ry * 0.6);
        }
        ctx.lineTo(cx + rx * 1.2, cy - ry);
        ctx.closePath();
        ctx.fill();
        break;
    }
    if (color2 !== undefined && pattern !== 'belly' && shape === 'can') {
      ctx.fillStyle = rgb(color2);
      ctx.fillRect(cx - rx, cy - ry * 0.25, rx * 2, ry * 0.5);
    }
  });
  // 重新描边 + 高光（花纹之上）
  path();
  ctx.lineWidth = Math.max(3, Math.min(rx, ry) * 0.075);
  ctx.strokeStyle = outlineOf(color);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.4, cy - ry * 0.5, rx * 0.2, ry * 0.11, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(cx - rx * 0.18, cy - ry * 0.66, Math.max(2, rx * 0.05), 0, Math.PI * 2);
  ctx.fill();
}

/** 头顶部件（独立贴图，锚点在底部中心） */
export function drawTop(ctx: Ctx, top: Top, color: number): void {
  const W = ctx.canvas.width,
    H = ctx.canvas.height;
  const cx = W / 2,
    by = H - 6;
  const leaf = (x: number, y: number, len: number, ang: number, wid = 0.35) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * wid, -len * 0.5, 0, -len);
    ctx.quadraticCurveTo(-len * wid, -len * 0.5, 0, 0);
    toon(ctx, color, -len * wid, -len, len * wid * 2, len, { noShine: true, lineW: 3 });
    ctx.strokeStyle = rgb(darken(color, 0.3), 0.7);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, -len * 0.8);
    ctx.stroke();
    ctx.restore();
  };
  switch (top) {
    case 'calyx':
      for (let i = 0; i < 5; i++) leaf(cx, by - 6, 30, -1.3 + i * 0.65, 0.3);
      ctx.fillStyle = rgb(darken(color, 0.1));
      ctx.beginPath();
      ctx.arc(cx, by - 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = outlineOf(color);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = rgb(darken(color, 0.2));
      roundRectPath(ctx, cx - 3, by - 26, 6, 18, 3);
      ctx.fill();
      ctx.stroke();
      break;
    case 'tuft':
      for (let i = 0; i < 4; i++) leaf(cx + (i - 1.5) * 5, by, 38 + (i % 2) * 8, -0.45 + i * 0.3, 0.22);
      break;
    case 'crownLeaves':
      for (let i = 0; i < 7; i++) leaf(cx, by, 30 + (3 - Math.abs(i - 3)) * 8, -1.1 + i * 0.37, 0.2);
      break;
    case 'stem':
      ctx.strokeStyle = outlineOf(color);
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(cx, by);
      ctx.quadraticCurveTo(cx + 4, by - 16, cx + 10, by - 26);
      ctx.stroke();
      ctx.strokeStyle = rgb(color);
      ctx.lineWidth = 5;
      ctx.stroke();
      leaf(cx + 8, by - 20, 24, 1.1, 0.4);
      break;
    case 'curlStem':
      ctx.strokeStyle = outlineOf(color);
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(cx, by);
      ctx.bezierCurveTo(cx - 4, by - 24, cx + 20, by - 30, cx + 14, by - 16);
      ctx.stroke();
      ctx.strokeStyle = rgb(color);
      ctx.lineWidth = 5;
      ctx.stroke();
      break;
    case 'sprout':
      ctx.strokeStyle = rgb(darken(color, 0.2));
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, by);
      ctx.lineTo(cx, by - 18);
      ctx.stroke();
      leaf(cx, by - 16, 22, -0.9, 0.45);
      leaf(cx, by - 16, 22, 0.9, 0.45);
      break;
    case 'bigLeaf':
      leaf(cx - 4, by, 46, -0.4, 0.4);
      leaf(cx + 4, by, 30, 0.7, 0.4);
      break;
    case 'cap':
      ctx.beginPath();
      ctx.ellipse(cx, by - 18, 44, 24, 0, Math.PI, 0);
      ctx.closePath();
      toon(ctx, color, cx - 44, by - 42, 88, 30);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (const [dx, dy, r] of [
        [-20, -26, 6],
        [8, -32, 5],
        [24, -22, 4],
        [-4, -22, 3],
      ]) {
        ctx.beginPath();
        ctx.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'husk':
      leaf(cx - 14, by + 4, 40, -0.5, 0.35);
      leaf(cx + 14, by + 4, 40, 0.5, 0.35);
      leaf(cx, by, 34, 0, 0.3);
      break;
    case 'flame': {
      const g = ctx.createLinearGradient(0, by - 50, 0, by);
      g.addColorStop(0, '#fff3b0');
      g.addColorStop(0.5, '#ffba08');
      g.addColorStop(1, '#e85d04');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - 18, by);
      ctx.quadraticCurveTo(cx - 24, by - 30, cx - 4, by - 50);
      ctx.quadraticCurveTo(cx, by - 30, cx + 8, by - 38);
      ctx.quadraticCurveTo(cx + 22, by - 20, cx + 18, by);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9d0208';
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    }
  }
}
