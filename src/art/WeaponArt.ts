// 武器手持图（128×64，手柄在左、朝右）
import { type Ctx, rgb, darken, lighten, toon, ellipsePath, roundRectPath, starPath, glow, OUTLINE } from './Painter';

const handle = (ctx: Ctx, x0: number, x1: number, y: number, h: number, c = 0x8d5b3a) => {
  roundRectPath(ctx, x0, y - h / 2, x1 - x0, h, h / 2);
  toon(ctx, c, x0, y - h / 2, x1 - x0, h, { noShine: true, lineW: 3 });
  ctx.strokeStyle = rgb(darken(c, 0.3), 0.6);
  ctx.lineWidth = 1.5;
  for (let x = x0 + 6; x < x1 - 4; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2 + 2);
    ctx.lineTo(x - 3, y + h / 2 - 2);
    ctx.stroke();
  }
};

const metal = (ctx: Ctx, x: number, y: number, w: number, h: number, c = 0xc9d1d9) => {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgb(lighten(c, 0.5)));
  g.addColorStop(0.45, rgb(c));
  g.addColorStop(0.55, rgb(darken(c, 0.15)));
  g.addColorStop(1, rgb(darken(c, 0.35)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.stroke();
};

export function drawWeapon(ctx: Ctx, id: string): void {
  const cy = 32;
  switch (id) {
    case 'fork':
      handle(ctx, 6, 64, cy, 10);
      roundRectPath(ctx, 60, cy - 14, 14, 28, 5);
      metal(ctx, 60, cy - 14, 14, 28);
      for (const dy of [-11, 0, 11]) {
        ctx.beginPath();
        ctx.moveTo(72, cy + dy - 3);
        ctx.lineTo(118, cy + dy - 2);
        ctx.lineTo(122, cy + dy);
        ctx.lineTo(118, cy + dy + 2);
        ctx.lineTo(72, cy + dy + 3);
        ctx.closePath();
        metal(ctx, 72, cy + dy - 3, 50, 6);
      }
      ctx.beginPath();
      ctx.arc(106, cy, 8, 0, Math.PI * 2);
      toon(ctx, 0xe63946, 98, cy - 8, 16, 16, { lineW: 2.5 });
      break;
    case 'rolling_pin':
      handle(ctx, 4, 26, cy, 12, 0xc68b59);
      handle(ctx, 102, 124, cy, 12, 0xc68b59);
      roundRectPath(ctx, 22, cy - 15, 84, 30, 14);
      toon(ctx, 0xe0b084, 22, cy - 15, 84, 30);
      break;
    case 'knife':
      handle(ctx, 6, 50, cy, 14, 0x2b2d42);
      ctx.fillStyle = '#adb5bd';
      for (const x of [16, 30, 42]) {
        ctx.beginPath();
        ctx.arc(x, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(48, cy - 12);
      ctx.lineTo(112, cy - 8);
      ctx.quadraticCurveTo(126, cy - 2, 122, cy + 4);
      ctx.lineTo(48, cy + 10);
      ctx.closePath();
      metal(ctx, 48, cy - 12, 78, 22);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(54, cy - 8);
      ctx.lineTo(112, cy - 5);
      ctx.stroke();
      break;
    case 'pan':
      handle(ctx, 4, 58, cy, 12, 0x3d2c2e);
      ctx.beginPath();
      ctx.ellipse(92, cy, 32, 28, 0, 0, Math.PI * 2);
      toon(ctx, 0x343a40, 60, cy - 28, 64, 56);
      ctx.beginPath();
      ctx.ellipse(92, cy, 24, 20, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0x212529);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(84, cy - 8, 10, 5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'watermelon_hammer':
      handle(ctx, 4, 70, cy, 11);
      ctx.beginPath();
      ctx.ellipse(96, cy, 28, 30, 0, 0, Math.PI * 2);
      toon(ctx, 0x2d6a4f, 68, cy - 30, 56, 60);
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = rgb(0x1b4332);
      ctx.lineWidth = 5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(96 + i * 12, cy, 5, 32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath();
      ctx.ellipse(96, cy, 28, 30, 0, 0, Math.PI * 2);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    case 'slingshot':
      handle(ctx, 4, 58, cy, 11);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(56, cy);
      ctx.lineTo(86, cy - 20);
      ctx.moveTo(56, cy);
      ctx.lineTo(86, cy + 20);
      ctx.stroke();
      ctx.strokeStyle = rgb(0xa0522d);
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = rgb(0xe9c46a);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(86, cy - 20);
      ctx.lineTo(104, cy);
      ctx.lineTo(86, cy + 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(104, cy, 10, 0, Math.PI * 2);
      toon(ctx, 0xe63946, 94, cy - 10, 20, 20, { lineW: 2.5 });
      break;
    case 'pea_shooter':
      roundRectPath(ctx, 8, cy - 4, 20, 26, 6);
      toon(ctx, 0x38b000, 8, cy - 4, 20, 26, { noShine: true });
      ctx.beginPath();
      ctx.ellipse(66, cy - 4, 52, 14, 0, 0, Math.PI * 2);
      toon(ctx, 0x70e000, 14, cy - 18, 104, 28);
      for (const x of [44, 64, 84]) {
        ctx.beginPath();
        ctx.arc(x, cy - 4, 7, 0, Math.PI * 2);
        toon(ctx, 0x9ef01a, x - 7, cy - 11, 14, 14, { lineW: 2 });
      }
      break;
    case 'chili_rocket':
      roundRectPath(ctx, 10, cy + 2, 16, 22, 5);
      toon(ctx, 0x495057, 10, cy + 2, 16, 22, { noShine: true });
      ctx.beginPath();
      ctx.moveTo(8, cy - 4);
      ctx.bezierCurveTo(40, cy - 22, 90, cy - 18, 124, cy + 2);
      ctx.bezierCurveTo(90, cy + 14, 40, cy + 12, 8, cy + 6);
      ctx.closePath();
      toon(ctx, 0xe71d36, 8, cy - 20, 116, 34);
      ctx.beginPath();
      ctx.moveTo(6, cy);
      ctx.lineTo(-2, cy - 12);
      ctx.lineTo(14, cy - 6);
      ctx.closePath();
      toon(ctx, 0x2d6a4f, -2, cy - 12, 16, 12, { noShine: true, lineW: 2.5 });
      break;
    case 'corn_cannon':
      roundRectPath(ctx, 8, cy + 4, 18, 22, 5);
      toon(ctx, 0x6b4226, 8, cy + 4, 18, 22, { noShine: true });
      roundRectPath(ctx, 10, cy - 16, 112, 30, 14);
      toon(ctx, 0xffd23f, 10, cy - 16, 112, 30);
      ctx.save();
      roundRectPath(ctx, 10, cy - 16, 112, 30, 14);
      ctx.clip();
      for (let x = 16; x < 120; x += 10)
        for (let y = cy - 14; y < cy + 14; y += 9) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath();
          ctx.ellipse(x + ((y / 9) % 2) * 5, y, 3.5, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      ctx.restore();
      ctx.beginPath();
      ctx.ellipse(118, cy - 1, 6, 13, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#3d2c2e';
      ctx.fill();
      break;
    case 'ketchup':
      ctx.beginPath();
      ctx.moveTo(10, cy - 18);
      ctx.lineTo(80, cy - 18);
      ctx.quadraticCurveTo(96, cy - 18, 100, cy - 6);
      ctx.lineTo(118, cy - 3);
      ctx.lineTo(118, cy + 3);
      ctx.lineTo(100, cy + 6);
      ctx.quadraticCurveTo(96, cy + 18, 80, cy + 18);
      ctx.lineTo(10, cy + 18);
      ctx.closePath();
      toon(ctx, 0xd00000, 10, cy - 18, 108, 36);
      roundRectPath(ctx, 26, cy - 10, 40, 20, 4);
      ctx.fillStyle = '#fff3e0';
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(46, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#e63946';
      ctx.fill();
      break;
    case 'mustard_flamer':
      roundRectPath(ctx, 8, cy - 14, 70, 28, 10);
      toon(ctx, 0xffc300, 8, cy - 14, 70, 28);
      roundRectPath(ctx, 76, cy - 6, 36, 12, 4);
      metal(ctx, 76, cy - 6, 36, 12, 0x6c757d);
      glow(ctx, 118, cy, 12, 0xff7b00, 0.9);
      break;
    case 'soda':
      roundRectPath(ctx, 20, cy - 18, 60, 36, 8);
      metal(ctx, 20, cy - 18, 60, 36, 0x4cc9f0);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('SODA', 30, cy + 5);
      roundRectPath(ctx, 78, cy - 6, 30, 12, 4);
      metal(ctx, 78, cy - 6, 30, 12);
      for (const [x, y, r] of [
        [114, cy - 6, 5],
        [120, cy + 4, 4],
        [110, cy + 8, 3],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,240,255,0.8)';
        ctx.fill();
        ctx.strokeStyle = '#48cae4';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      break;
    case 'garlic_aura':
      glow(ctx, 64, cy, 32, 0xd8f3dc, 0.8);
      ctx.beginPath();
      ctx.moveTo(64, cy - 24);
      ctx.bezierCurveTo(88, cy - 14, 92, cy + 22, 64, cy + 24);
      ctx.bezierCurveTo(36, cy + 22, 40, cy - 14, 64, cy - 24);
      toon(ctx, 0xf1e3d3, 40, cy - 24, 52, 48);
      ctx.strokeStyle = rgb(0xd6c4b0);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(64, cy - 22);
      ctx.quadraticCurveTo(56, cy, 64, cy + 22);
      ctx.moveTo(64, cy - 22);
      ctx.quadraticCurveTo(74, cy, 66, cy + 22);
      ctx.stroke();
      break;
    case 'pepper_mine':
      ctx.beginPath();
      ctx.arc(64, cy + 4, 22, 0, Math.PI * 2);
      toon(ctx, 0x2d3142, 42, cy - 18, 44, 44);
      roundRectPath(ctx, 56, cy - 26, 16, 12, 3);
      metal(ctx, 56, cy - 26, 16, 12, 0xadb5bd);
      glow(ctx, 64, cy + 4, 12, 0xff3b30, 0.9);
      ctx.fillStyle = '#ff3b30';
      ctx.beginPath();
      ctx.arc(64, cy + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'onion_boomerang':
      ctx.beginPath();
      ctx.arc(64, cy, 26, 0, Math.PI * 2);
      toon(ctx, 0xcdb4db, 38, cy - 26, 52, 52);
      ctx.strokeStyle = rgb(0x9d4edd);
      ctx.lineWidth = 3;
      for (const r of [18, 10]) {
        ctx.beginPath();
        ctx.arc(64, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(64, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      break;
    case 'broccoli_staff':
      handle(ctx, 4, 92, cy, 9, 0x6b4226);
      for (const [x, y, r] of [
        [98, cy - 12, 11],
        [110, cy - 2, 12],
        [98, cy + 10, 11],
        [88, cy - 2, 10],
        [104, cy + 2, 9],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        toon(ctx, 0x2d6a4f, x - r, y - r, r * 2, r * 2, { lineW: 2.5 });
      }
      ctx.strokeStyle = '#9bf6ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(90, cy - 22);
      ctx.lineTo(100, cy - 14);
      ctx.lineTo(94, cy - 8);
      ctx.lineTo(108, cy - 2);
      ctx.stroke();
      break;
    case 'sauce_gatling':
      roundRectPath(ctx, 6, cy + 2, 18, 22, 5);
      toon(ctx, 0x343a40, 6, cy + 2, 18, 22, { noShine: true });
      ctx.beginPath();
      ctx.arc(34, cy - 2, 18, 0, Math.PI * 2);
      toon(ctx, 0xd00000, 16, cy - 20, 36, 36);
      for (const dy of [-9, 0, 9]) {
        roundRectPath(ctx, 46, cy - 2 + dy - 3.5, 76, 7, 3);
        metal(ctx, 46, cy - 2 + dy - 3.5, 76, 7, 0x8d99ae);
      }
      roundRectPath(ctx, 70, cy - 16, 10, 28, 3);
      metal(ctx, 70, cy - 16, 10, 28, 0x495057);
      break;
    case 'cleaver':
      handle(ctx, 4, 50, cy + 6, 12, 0x3d2c2e);
      ctx.beginPath();
      ctx.moveTo(48, cy - 22);
      ctx.lineTo(122, cy - 22);
      ctx.lineTo(122, cy + 14);
      ctx.quadraticCurveTo(84, cy + 20, 48, cy + 12);
      ctx.closePath();
      metal(ctx, 48, cy - 22, 74, 40);
      ctx.beginPath();
      ctx.arc(110, cy - 12, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#495057';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(54, cy + 9);
      ctx.quadraticCurveTo(86, cy + 15, 118, cy + 10);
      ctx.stroke();
      break;
    default:
      starPath(ctx, 64, cy, 24, 10, 5);
      toon(ctx, 0xffd166, 40, cy - 24, 48, 48);
  }
}

export function drawWeaponIcon(ctx: Ctx, id: string, cls: string): void {
  const bg = cls === 'melee' ? 0xffb347 : cls === 'ranged' ? 0x80b918 : 0x4cc9f0;
  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 70);
  g.addColorStop(0, rgb(lighten(bg, 0.25), 0.9));
  g.addColorStop(1, rgb(darken(bg, 0.45), 0.9));
  roundRectPath(ctx, 4, 4, 120, 120, 22);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.translate(64, 64);
  ctx.rotate(-Math.PI / 4);
  ctx.translate(-64, -32);
  drawWeapon(ctx, id);
  ctx.restore();
}

export { ellipsePath };
