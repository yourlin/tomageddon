// 章节竞技场地面（程序绘制，按章节主题）
import Phaser from 'phaser';
import { paint, rgb, darken, lighten, rng, roundRectPath, type Ctx } from './Painter';
import { ARENA_PALETTE_EXTRA } from '../data/chaptersExtra';

const W = 1300,
  H = 850; // 显示时拉伸到 2080×1360（竞技场 + 每边 80px 边缘）

function vignette(ctx: Ctx, color: number): void {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  g.addColorStop(0, rgb(color, 0));
  g.addColorStop(1, rgb(color, 0.55));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** 竞技场边框：墙体 + 内侧阴影 */
function border(ctx: Ctx, wall: number): void {
  const m = 50; // 对应显示时额外的 80px 边缘
  ctx.fillStyle = rgb(darken(wall, 0.2));
  ctx.fillRect(0, 0, W, m);
  ctx.fillRect(0, H - m, W, m);
  ctx.fillRect(0, 0, m, H);
  ctx.fillRect(W - m, 0, m, H);
  ctx.fillStyle = rgb(lighten(wall, 0.15));
  ctx.fillRect(0, m - 8, W, 6);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 10;
  ctx.strokeRect(m + 5, m + 5, W - m * 2 - 10, H - m * 2 - 10);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
}

function scatter(ctx: Ctx, r: () => number, n: number, fn: (x: number, y: number, s: number) => void): void {
  for (let i = 0; i < n; i++) fn(40 + r() * (W - 80), 40 + r() * (H - 80), r());
}

export function paintArena(scene: Phaser.Scene, ch: number): string {
  return paint(scene, `arena_gen_${ch}`, W, H, (ctx) => {
    const r = rng(ch * 7919);
    switch (ch) {
      case 1: {
        // 深夜厨房：木地板 + 地砖区
        const plank = 46;
        for (let y = 0; y < H; y += plank) {
          let x = -r() * 200;
          while (x < W) {
            const len = 160 + r() * 200;
            const c = [0x8a5a3b, 0x7d5236, 0x94633f, 0x805437][Math.floor(r() * 4)];
            const g = ctx.createLinearGradient(0, y, 0, y + plank);
            g.addColorStop(0, rgb(lighten(c, 0.08)));
            g.addColorStop(1, rgb(darken(c, 0.12)));
            ctx.fillStyle = g;
            ctx.fillRect(x, y, len, plank);
            ctx.strokeStyle = 'rgba(40,20,10,0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, len, plank);
            ctx.strokeStyle = 'rgba(60,30,15,0.25)';
            ctx.lineWidth = 1;
            for (let k = 0; k < 3; k++) {
              const yy = y + 8 + r() * (plank - 16);
              ctx.beginPath();
              ctx.moveTo(x + 6, yy);
              ctx.bezierCurveTo(x + len * 0.3, yy + 4, x + len * 0.6, yy - 4, x + len - 6, yy);
              ctx.stroke();
            }
            if (r() < 0.3) {
              ctx.fillStyle = 'rgba(50,25,10,0.5)';
              ctx.beginPath();
              ctx.ellipse(x + len * r(), y + plank / 2, 5, 3, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            x += len;
          }
        }
        scatter(ctx, r, 40, (x, y, s) => {
          ctx.fillStyle = `rgba(255,240,200,${0.25 + s * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, 2 + s * 3, 0, Math.PI * 2);
          ctx.fill();
        });
        scatter(ctx, r, 6, (x, y, s) => {
          ctx.fillStyle = `rgba(200,40,30,${0.18 + s * 0.12})`;
          ctx.beginPath();
          ctx.ellipse(x, y, 30 + s * 40, 18 + s * 20, s * 3, 0, Math.PI * 2);
          ctx.fill();
        });
        scatter(ctx, r, 5, (x, y, s) => {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath();
          ctx.ellipse(x, y, 40 + s * 40, 24 + s * 20, s * 3, 0, Math.PI * 2);
          ctx.fill();
        });
        vignette(ctx, 0x1a0a05);
        border(ctx, 0x5e3d27);
        break;
      }
      case 2: {
        // 荒芜菜园：泥土 + 菜畦 + 杂草
        ctx.fillStyle = rgb(0x6b4f2e);
        ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 1800; i++) {
          ctx.fillStyle = rgb([0x5c4326, 0x7a5a36, 0x846540, 0x4e3920][Math.floor(r() * 4)], 0.6);
          ctx.fillRect(r() * W, r() * H, 3 + r() * 6, 2 + r() * 4);
        }
        for (let y = 120; y < H - 60; y += 150) {
          const g = ctx.createLinearGradient(0, y - 25, 0, y + 25);
          g.addColorStop(0, 'rgba(40,25,10,0)');
          g.addColorStop(0.5, 'rgba(40,25,10,0.35)');
          g.addColorStop(1, 'rgba(40,25,10,0)');
          ctx.fillStyle = g;
          ctx.fillRect(40, y - 25, W - 80, 50);
        }
        scatter(ctx, r, 70, (x, y, s) => {
          ctx.strokeStyle = rgb([0x6a994e, 0x7fb069, 0x4f772d][Math.floor(s * 3)]);
          ctx.lineWidth = 3;
          for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + (k - 1.5) * 6, y - 10, x + (k - 1.5) * 9, y - 16 - s * 10);
            ctx.stroke();
          }
        });
        scatter(ctx, r, 30, (x, y, s) => {
          ctx.fillStyle = rgb(0x9a8c7a);
          ctx.beginPath();
          ctx.ellipse(x, y, 6 + s * 8, 4 + s * 5, s, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        vignette(ctx, 0x0f1a08);
        border(ctx, 0x4f3a24);
        break;
      }
      case 3: {
        // 冰箱：白蓝搁板 + 霜花
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, rgb(0xcfe8f5));
        g.addColorStop(1, rgb(0x9cc9e0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(90,140,170,0.35)';
        ctx.lineWidth = 3;
        for (let x = 40; x < W; x += 34) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(90,140,170,0.2)';
        for (let y = 40; y < H; y += 170) {
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        scatter(ctx, r, 35, (x, y, s) => {
          ctx.strokeStyle = `rgba(255,255,255,${0.4 + s * 0.4})`;
          ctx.lineWidth = 2;
          const L = 8 + s * 14;
          for (let k = 0; k < 3; k++) {
            const a = (k / 3) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L);
            ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
            ctx.stroke();
          }
        });
        scatter(ctx, r, 8, (x, y, s) => {
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.ellipse(x, y, 40 + s * 50, 20 + s * 25, s * 2, 0, Math.PI * 2);
          ctx.fill();
        });
        vignette(ctx, 0x0b2436);
        border(ctx, 0xe8f4fa);
        break;
      }
      case 4: {
        // 垃圾场：水泥 + 裂缝 + 油渍
        ctx.fillStyle = rgb(0x77776a);
        ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 2500; i++) {
          ctx.fillStyle = `rgba(${r() < 0.5 ? 40 : 200},${r() < 0.5 ? 40 : 200},${r() < 0.5 ? 30 : 180},0.08)`;
          ctx.fillRect(r() * W, r() * H, 2, 2);
        }
        ctx.strokeStyle = 'rgba(40,40,35,0.35)';
        ctx.lineWidth = 3;
        for (let x = 40; x < W; x += 260) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 40; y < H; y += 260) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        scatter(ctx, r, 12, (x, y) => {
          ctx.strokeStyle = 'rgba(30,30,25,0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          let cx = x,
            cy = y;
          for (let k = 0; k < 6; k++) {
            cx += (r() - 0.5) * 60;
            cy += (r() - 0.5) * 60;
            ctx.lineTo(cx, cy);
          }
          ctx.stroke();
        });
        scatter(ctx, r, 9, (x, y, s) => {
          const g2 = ctx.createRadialGradient(x, y, 2, x, y, 40 + s * 40);
          g2.addColorStop(0, 'rgba(20,15,30,0.6)');
          g2.addColorStop(0.7, 'rgba(80,50,120,0.25)');
          g2.addColorStop(1, 'rgba(20,15,30,0)');
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.arc(x, y, 40 + s * 40, 0, Math.PI * 2);
          ctx.fill();
        });
        scatter(ctx, r, 18, (x, y, s) => {
          ctx.fillStyle = rgb([0xe63946, 0x457b9d, 0xadb5bd, 0xffd166][Math.floor(s * 4)], 0.7);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(s * 6);
          roundRectPath(ctx, -8, -4, 16, 8, 3);
          ctx.fill();
          ctx.restore();
        });
        vignette(ctx, 0x111111);
        border(ctx, 0x4a4a40);
        break;
      }
      case 6:
      case 7: {
        // 1.4.0：腐烂温室 / 腐烂菜园——泥地渐变 + 地块杂点 + 枯草与霉斑 + 毒液污渍（调色板见 chaptersExtra）
        const P = ARENA_PALETTE_EXTRA[ch as 6 | 7];
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, rgb(P.base));
        g.addColorStop(1, rgb(P.baseDark));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 1800; i++) {
          ctx.fillStyle = rgb(P.tiles[Math.floor(r() * P.tiles.length)], 0.6);
          ctx.fillRect(r() * W, r() * H, 3 + r() * 6, 2 + r() * 4);
        }
        if (ch === 6) {
          // 温室玻璃框投下的格子阴影
          ctx.strokeStyle = 'rgba(0,0,0,0.12)';
          ctx.lineWidth = 6;
          for (let x = 0; x < W; x += 220) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 120, H);
            ctx.stroke();
          }
        }
        scatter(ctx, r, 70, (x, y, sc) => {
          ctx.strokeStyle = rgb(P.decor[Math.floor(sc * P.decor.length)]);
          ctx.lineWidth = 3;
          for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + (k - 1.5) * 6, y - 8, x + (k - 1.5) * 10, y - 12 - sc * 8);
            ctx.stroke();
          }
        });
        const [sr, sg, sb] = P.stain.rgb;
        scatter(ctx, r, 9, (x, y, sc) => {
          ctx.fillStyle = `rgba(${sr},${sg},${sb},${P.stain.alpha + sc * 0.1})`;
          ctx.beginPath();
          ctx.ellipse(x, y, 30 + sc * 50, 18 + sc * 26, sc * 3, 0, Math.PI * 2);
          ctx.fill();
        });
        vignette(ctx, P.vignette);
        border(ctx, P.wall);
        break;
      }
      default: {
        // 番茄酱工厂：金属板 + 警示条 + 酱渍
        const s = 120;
        for (let y = 0; y < H; y += s)
          for (let x = 0; x < W; x += s) {
            const g = ctx.createLinearGradient(x, y, x + s, y + s);
            g.addColorStop(0, rgb(0x8a8f96));
            g.addColorStop(1, rgb(0x5d6168));
            ctx.fillStyle = g;
            ctx.fillRect(x, y, s, s);
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, s, s);
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            for (const [dx, dy] of [
              [10, 10],
              [s - 10, 10],
              [10, s - 10],
              [s - 10, s - 10],
            ]) {
              ctx.beginPath();
              ctx.arc(x + dx, y + dy, 3.5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            for (let k = 0; k < 6; k++) {
              ctx.beginPath();
              ctx.moveTo(x + 20 + k * 14, y + 30);
              ctx.lineTo(x + 30 + k * 14, y + 20);
              ctx.stroke();
            }
          }
        for (const yy of [60, H - 76]) {
          for (let x = 40; x < W - 40; x += 40) {
            ctx.fillStyle = (x / 40) % 2 ? '#ffd60a' : '#1b1b1b';
            ctx.beginPath();
            ctx.moveTo(x, yy);
            ctx.lineTo(x + 20, yy);
            ctx.lineTo(x + 36, yy + 16);
            ctx.lineTo(x + 16, yy + 16);
            ctx.closePath();
            ctx.fill();
          }
        }
        scatter(ctx, r, 10, (x, y, s2) => {
          ctx.fillStyle = `rgba(174,32,18,${0.4 + s2 * 0.3})`;
          ctx.beginPath();
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2,
              rr = (25 + s2 * 35) * (0.7 + r() * 0.5);
            ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7);
          }
          ctx.closePath();
          ctx.fill();
        });
        vignette(ctx, 0x2a0508);
        border(ctx, 0x3d1f22);
      }
    }
  });
}

/**
 * 章节缩略图（选关用）：画完整场地再缩小到 w×h；gray = 灰度 + 压暗（未解锁）。
 * 只为缩略图临时画的大场地贴图画完就删掉（7 张 1300×850 常驻太占显存）
 */
export function arenaThumb(scene: Phaser.Scene, ch: number, w: number, h: number, gray = false): string {
  const key = `arena_thumb_${ch}_${w}x${h}${gray ? '_g' : ''}`;
  if (scene.textures.exists(key)) return key;
  const bigKey = `arena_gen_${ch}`;
  const had = scene.textures.exists(bigKey);
  const src = scene.textures.get(paintArena(scene, ch)).getSourceImage() as CanvasImageSource;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return key;
  const ctx = tex.getContext();
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, W, H, 0, 0, w, h);
  if (gray) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) * 0.55;
      d[i] = d[i + 1] = d[i + 2] = l;
    }
    ctx.putImageData(img, 0, 0);
  }
  tex.refresh();
  if (!had) scene.textures.remove(bigKey);
  return key;
}
