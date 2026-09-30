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
    // ---------------- 新增近战 ----------------
    case 'spatula':
      handle(ctx, 4, 62, cy, 10, 0xe76f51);
      roundRectPath(ctx, 58, cy - 3, 18, 6, 3);
      metal(ctx, 58, cy - 3, 18, 6);
      roundRectPath(ctx, 74, cy - 20, 48, 40, 8);
      metal(ctx, 74, cy - 20, 48, 40);
      ctx.fillStyle = rgb(0x6c757d);
      for (const dy of [-10, 0, 10]) {
        roundRectPath(ctx, 84, cy + dy - 2, 28, 4, 2);
        ctx.fill();
      }
      break;
    case 'whisk_spin':
      glow(ctx, 80, cy, 34, 0xfff3b0, 0.6);
      handle(ctx, 4, 50, cy, 12, 0xf4a261);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 5;
      for (const ry of [18, 11, 4]) {
        ctx.beginPath();
        ctx.ellipse(84, cy, 36, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = rgb(0xdee2e6);
      ctx.lineWidth = 2.5;
      for (const ry of [18, 11, 4]) {
        ctx.beginPath();
        ctx.ellipse(84, cy, 36, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      roundRectPath(ctx, 46, cy - 5, 8, 10, 3);
      metal(ctx, 46, cy - 5, 8, 10);
      break;
    case 'meat_tenderizer':
      handle(ctx, 4, 80, cy, 11, 0x6f4518);
      roundRectPath(ctx, 78, cy - 26, 36, 52, 6);
      metal(ctx, 78, cy - 26, 36, 52, 0xadb5bd);
      roundRectPath(ctx, 112, cy - 22, 10, 44, 3);
      metal(ctx, 112, cy - 22, 10, 44, 0x8d99ae);
      ctx.fillStyle = rgb(0x495057);
      for (let y = cy - 18; y <= cy + 18; y += 6) {
        ctx.beginPath();
        ctx.moveTo(122, y - 3);
        ctx.lineTo(126, y);
        ctx.lineTo(122, y + 3);
        ctx.fill();
      }
      break;
    case 'skewer':
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(4, cy);
      ctx.lineTo(124, cy);
      ctx.stroke();
      ctx.strokeStyle = rgb(0xe9c46a);
      ctx.lineWidth = 3;
      ctx.stroke();
      for (const [x, c, r] of [
        [34, 0xe63946, 10],
        [56, 0x6a994e, 9],
        [78, 0x9c6644, 11],
        [100, 0xffb703, 9],
      ] as const) {
        roundRectPath(ctx, x - r, cy - r, r * 2, r * 2, 4);
        toon(ctx, c, x - r, cy - r, r * 2, r * 2, { lineW: 2.5 });
      }
      glow(ctx, 70, cy - 20, 14, 0xff7b00, 0.5);
      break;
    case 'ladle':
      handle(ctx, 4, 70, cy - 4, 8, 0x8d99ae);
      ctx.beginPath();
      ctx.arc(96, cy + 2, 24, 0, Math.PI * 2);
      metal(ctx, 72, cy - 22, 48, 48, 0xced4da);
      ctx.beginPath();
      ctx.ellipse(96, cy - 2, 18, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0xe76f51);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(90, cy - 6, 6, 3, -0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'baguette_sword':
      roundRectPath(ctx, 26, cy - 16, 8, 32, 3);
      metal(ctx, 26, cy - 16, 8, 32, 0xffd166);
      handle(ctx, 4, 28, cy, 10, 0x6f4518);
      roundRectPath(ctx, 34, cy - 10, 90, 20, 10);
      toon(ctx, 0xd4a373, 34, cy - 10, 90, 20);
      ctx.strokeStyle = rgb(0xfefae0);
      ctx.lineWidth = 3;
      for (const x of [50, 70, 90, 108]) {
        ctx.beginPath();
        ctx.moveTo(x - 4, cy + 5);
        ctx.lineTo(x + 6, cy - 5);
        ctx.stroke();
      }
      break;
    case 'cucumber_katana':
      handle(ctx, 4, 40, cy, 10, 0x1d3557);
      ctx.beginPath();
      ctx.ellipse(42, cy, 5, 14, 0, 0, Math.PI * 2);
      toon(ctx, 0xffd166, 37, cy - 14, 10, 28, { lineW: 2.5 });
      ctx.beginPath();
      ctx.moveTo(46, cy - 8);
      ctx.quadraticCurveTo(90, cy - 14, 124, cy - 4);
      ctx.quadraticCurveTo(90, cy + 8, 46, cy + 8);
      ctx.closePath();
      toon(ctx, 0x2d6a4f, 46, cy - 14, 78, 22);
      ctx.fillStyle = rgb(0xb7e4c7);
      for (const x of [60, 76, 92, 106]) {
        ctx.beginPath();
        ctx.arc(x, cy - 1, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'pizza_cutter':
      handle(ctx, 4, 64, cy, 12, 0xd62828);
      roundRectPath(ctx, 62, cy - 4, 26, 8, 3);
      metal(ctx, 62, cy - 4, 26, 8);
      ctx.beginPath();
      ctx.arc(96, cy, 26, 0, Math.PI * 2);
      metal(ctx, 70, cy - 26, 52, 52);
      ctx.beginPath();
      ctx.arc(96, cy, 7, 0, Math.PI * 2);
      toon(ctx, 0xd62828, 89, cy - 7, 14, 14, { lineW: 2 });
      ctx.fillStyle = rgb(0xffd166);
      ctx.beginPath();
      ctx.moveTo(96, cy);
      ctx.lineTo(116, cy - 12);
      ctx.lineTo(116, cy + 12);
      ctx.closePath();
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    case 'chopsticks':
      for (const dy of [-6, 6]) {
        ctx.beginPath();
        ctx.moveTo(6, cy + dy * 1.4 - 4);
        ctx.lineTo(122, cy + dy * 0.3 - 1.5);
        ctx.lineTo(122, cy + dy * 0.3 + 1.5);
        ctx.lineTo(6, cy + dy * 1.4 + 4);
        ctx.closePath();
        toon(ctx, 0xc68b59, 6, cy + dy - 4, 116, 8, { noShine: true, lineW: 2.5 });
        roundRectPath(ctx, 6, cy + dy * 1.4 - 4, 22, 8, 2);
        toon(ctx, 0xd62828, 6, cy + dy * 1.4 - 4, 22, 8, { noShine: true, lineW: 2 });
      }
      ctx.beginPath();
      ctx.arc(116, cy, 6, 0, Math.PI * 2);
      toon(ctx, 0xfefae0, 110, cy - 6, 12, 12, { lineW: 2 });
      break;
    case 'bamboo_spear':
      roundRectPath(ctx, 4, cy - 5, 84, 10, 4);
      toon(ctx, 0x90be6d, 4, cy - 5, 84, 10, { noShine: true, lineW: 2.5 });
      ctx.strokeStyle = rgb(0x4f772d);
      ctx.lineWidth = 3;
      for (const x of [26, 50, 74]) {
        ctx.beginPath();
        ctx.moveTo(x, cy - 5);
        ctx.lineTo(x, cy + 5);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(84, cy - 14);
      ctx.quadraticCurveTo(108, cy - 10, 126, cy);
      ctx.quadraticCurveTo(108, cy + 10, 84, cy + 14);
      ctx.closePath();
      toon(ctx, 0xe9c46a, 84, cy - 14, 42, 28);
      ctx.strokeStyle = rgb(0xbc6c25);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(90, cy - 10);
      ctx.lineTo(116, cy - 2);
      ctx.moveTo(90, cy + 10);
      ctx.lineTo(116, cy + 2);
      ctx.stroke();
      break;
    case 'pineapple_mace':
      handle(ctx, 4, 70, cy, 11);
      for (const a of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.ellipse(118 + Math.cos(a) * 4, cy + Math.sin(a) * 12, 10, 4, a, 0, Math.PI * 2);
        toon(ctx, 0x40916c, 108, cy - 16, 20, 32, { noShine: true, lineW: 2 });
      }
      ctx.beginPath();
      ctx.ellipse(92, cy, 24, 22, 0, 0, Math.PI * 2);
      toon(ctx, 0xf4a261, 68, cy - 22, 48, 44);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(92, cy, 24, 22, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = rgb(0xbc6c25);
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(72 + i * 10, cy - 24);
        ctx.lineTo(112 + i * 10, cy + 24);
        ctx.moveTo(112 + i * 10, cy - 24);
        ctx.lineTo(72 + i * 10, cy + 24);
        ctx.stroke();
      }
      ctx.restore();
      break;
    // ---------------- 新增远程 ----------------
    case 'olive_launcher':
      roundRectPath(ctx, 8, cy + 2, 16, 22, 5);
      toon(ctx, 0x6b4226, 8, cy + 2, 16, 22, { noShine: true });
      roundRectPath(ctx, 10, cy - 12, 90, 22, 8);
      toon(ctx, 0x606c38, 10, cy - 12, 90, 22);
      roundRectPath(ctx, 96, cy - 7, 16, 12, 3);
      metal(ctx, 96, cy - 7, 16, 12, 0x6c757d);
      ctx.beginPath();
      ctx.ellipse(118, cy - 1, 8, 6, 0, 0, Math.PI * 2);
      toon(ctx, 0x283618, 110, cy - 7, 16, 12, { lineW: 2 });
      ctx.beginPath();
      ctx.arc(120, cy - 1, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e63946';
      ctx.fill();
      break;
    case 'popcorn_machine':
      roundRectPath(ctx, 38, cy - 10, 52, 36, 4);
      toon(ctx, 0xd62828, 38, cy - 10, 52, 36);
      ctx.fillStyle = '#fff';
      for (const x of [44, 58, 72]) ctx.fillRect(x, cy - 10, 7, 36);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.strokeRect(38, cy - 10, 52, 36);
      for (const [x, y, r] of [
        [46, cy - 16, 8],
        [60, cy - 22, 9],
        [76, cy - 18, 8],
        [86, cy - 12, 6],
        [52, cy - 26, 6],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        toon(ctx, 0xfff3b0, x - r, y - r, r * 2, r * 2, { lineW: 2, noShine: true });
      }
      break;
    case 'grape_shotgun':
      roundRectPath(ctx, 6, cy, 26, 22, 6);
      toon(ctx, 0x6b4226, 6, cy, 26, 22, { noShine: true });
      roundRectPath(ctx, 28, cy - 12, 60, 20, 6);
      toon(ctx, 0x7b2cbf, 28, cy - 12, 60, 20);
      for (const [x, y] of [
        [96, cy - 10],
        [108, cy - 10],
        [120, cy - 4],
        [102, cy],
        [114, cy + 6],
        [96, cy + 10],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        toon(ctx, 0x9d4edd, x - 7, y - 7, 14, 14, { lineW: 2 });
      }
      ctx.strokeStyle = rgb(0x40916c);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(88, cy - 2);
      ctx.lineTo(98, cy - 14);
      ctx.stroke();
      break;
    case 'bean_bazooka':
      roundRectPath(ctx, 30, cy + 6, 14, 20, 4);
      toon(ctx, 0x495057, 30, cy + 6, 14, 20, { noShine: true });
      ctx.beginPath();
      ctx.moveTo(4, cy - 6);
      ctx.bezierCurveTo(30, cy - 22, 100, cy - 22, 122, cy - 8);
      ctx.lineTo(122, cy + 8);
      ctx.bezierCurveTo(100, cy + 18, 30, cy + 18, 4, cy + 6);
      ctx.closePath();
      toon(ctx, 0x52b788, 4, cy - 20, 118, 38);
      for (const x of [34, 60, 86]) {
        ctx.beginPath();
        ctx.arc(x, cy - 2, 8, 0, Math.PI * 2);
        ctx.fillStyle = rgb(0x95d5b2);
        ctx.fill();
        ctx.strokeStyle = rgb(0x2d6a4f);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(122, cy, 5, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1b4332';
      ctx.fill();
      break;
    case 'cherry_bomb':
      ctx.strokeStyle = rgb(0x40916c);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(78, cy + 12);
      ctx.quadraticCurveTo(60, cy - 24, 40, cy - 22);
      ctx.moveTo(100, cy + 8);
      ctx.quadraticCurveTo(70, cy - 20, 40, cy - 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(34, cy - 24, 10, 5, -0.4, 0, Math.PI * 2);
      toon(ctx, 0x52b788, 24, cy - 29, 20, 10, { noShine: true, lineW: 2 });
      for (const [x, y] of [
        [76, cy + 14],
        [102, cy + 10],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        toon(ctx, 0xc1121f, x - 14, y - 14, 28, 28);
      }
      glow(ctx, 20, cy - 26, 8, 0xffd166, 0.9);
      break;
    case 'blueberry_sniper':
      roundRectPath(ctx, 4, cy - 2, 34, 18, 6);
      toon(ctx, 0x3a0ca3, 4, cy - 2, 34, 18, { noShine: true });
      roundRectPath(ctx, 34, cy - 6, 90, 10, 4);
      metal(ctx, 34, cy - 6, 90, 10, 0x495057);
      roundRectPath(ctx, 46, cy - 20, 38, 12, 5);
      metal(ctx, 46, cy - 20, 38, 12, 0x212529);
      ctx.beginPath();
      ctx.arc(84, cy - 14, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#9bf6ff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(60, cy + 10, 9, 0, Math.PI * 2);
      toon(ctx, 0x4361ee, 51, cy + 1, 18, 18, { lineW: 2 });
      starPath(ctx, 60, cy + 4, 4, 2, 5);
      ctx.fillStyle = '#1b1b3a';
      ctx.fill();
      break;
    case 'plate_frisbee':
      ctx.beginPath();
      ctx.ellipse(64, cy, 44, 26, 0, 0, Math.PI * 2);
      toon(ctx, 0xf8f9fa, 20, cy - 26, 88, 52);
      ctx.beginPath();
      ctx.ellipse(64, cy, 30, 17, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rgb(0x4895ef);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(64, cy, 38, 22, 0, 0, Math.PI * 2);
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.ellipse(64, cy, 10, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0xffd166);
      ctx.fill();
      break;
    case 'seed_spitter':
      roundRectPath(ctx, 8, cy + 2, 16, 22, 5);
      toon(ctx, 0x2d6a4f, 8, cy + 2, 16, 22, { noShine: true });
      ctx.beginPath();
      ctx.moveTo(10, cy - 16);
      ctx.lineTo(80, cy - 16);
      ctx.arc(80, cy, 16, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(10, cy + 16);
      ctx.closePath();
      toon(ctx, 0xef476f, 10, cy - 16, 86, 32);
      ctx.fillStyle = '#1b1b1b';
      for (const [x, y] of [
        [30, cy - 6],
        [48, cy + 4],
        [64, cy - 6],
        [80, cy + 4],
      ]) {
        ctx.beginPath();
        ctx.ellipse(x, y, 2.5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      roundRectPath(ctx, 94, cy - 5, 28, 10, 4);
      metal(ctx, 94, cy - 5, 28, 10, 0x40916c);
      break;
    case 'carrot_crossbow':
      handle(ctx, 4, 66, cy, 10);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(56, cy - 28);
      ctx.quadraticCurveTo(74, cy, 56, cy + 28);
      ctx.stroke();
      ctx.strokeStyle = rgb(0x8d5b3a);
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = '#fefae0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(56, cy - 28);
      ctx.lineTo(40, cy);
      ctx.lineTo(56, cy + 28);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40, cy - 6);
      ctx.lineTo(96, cy - 6);
      ctx.lineTo(126, cy);
      ctx.lineTo(96, cy + 6);
      ctx.lineTo(40, cy + 6);
      ctx.closePath();
      toon(ctx, 0xf77f00, 40, cy - 6, 86, 12, { lineW: 2.5 });
      for (const a of [-0.5, 0.5]) {
        ctx.beginPath();
        ctx.ellipse(34, cy + a * 10, 8, 3, a, 0, Math.PI * 2);
        toon(ctx, 0x52b788, 26, cy - 8, 16, 16, { noShine: true, lineW: 2 });
      }
      break;
    case 'honey_blaster':
      roundRectPath(ctx, 10, cy + 4, 16, 22, 5);
      toon(ctx, 0x6b4226, 10, cy + 4, 16, 22, { noShine: true });
      ctx.beginPath();
      ctx.ellipse(46, cy - 2, 32, 22, 0, 0, Math.PI * 2);
      toon(ctx, 0xffb703, 14, cy - 24, 64, 44);
      ctx.fillStyle = rgb(0xfb8500);
      for (const [x, y] of [
        [36, cy - 6],
        [52, cy - 6],
        [44, cy + 6],
      ]) {
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6);
        }
        ctx.closePath();
        ctx.fill();
      }
      roundRectPath(ctx, 76, cy - 6, 34, 12, 4);
      metal(ctx, 76, cy - 6, 34, 12, 0xadb5bd);
      ctx.beginPath();
      ctx.moveTo(110, cy + 2);
      ctx.quadraticCurveTo(122, cy + 4, 118, cy + 18);
      ctx.quadraticCurveTo(114, cy + 8, 108, cy + 6);
      ctx.fillStyle = rgb(0xffb703);
      ctx.fill();
      break;
    case 'soy_pistol':
      roundRectPath(ctx, 14, cy - 2, 20, 28, 6);
      toon(ctx, 0x3d2c2e, 14, cy - 2, 20, 28, { noShine: true });
      roundRectPath(ctx, 10, cy - 16, 92, 20, 7);
      toon(ctx, 0x582f0e, 10, cy - 16, 92, 20);
      roundRectPath(ctx, 98, cy - 11, 22, 10, 3);
      metal(ctx, 98, cy - 11, 22, 10, 0xd62828);
      ctx.fillStyle = '#fff3e0';
      roundRectPath(ctx, 34, cy - 12, 36, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#582f0e';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('SOY', 42, cy - 3);
      break;
    // ---------------- 新增元素 ----------------
    case 'ice_cube_tray':
      glow(ctx, 64, cy, 40, 0xcaf0f8, 0.5);
      roundRectPath(ctx, 8, cy - 16, 112, 32, 6);
      toon(ctx, 0x4895ef, 8, cy - 16, 112, 32, { noShine: true });
      for (let i = 0; i < 4; i++) {
        const x = 14 + i * 26;
        roundRectPath(ctx, x, cy - 12, 22, 24, 4);
        toon(ctx, 0xcaf0f8, x, cy - 12, 22, 24, { lineW: 2 });
      }
      break;
    case 'lightning_whisk':
      handle(ctx, 4, 54, cy, 12, 0x3a0ca3);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 5;
      for (const ry of [16, 8]) {
        ctx.beginPath();
        ctx.ellipse(86, cy, 34, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = rgb(0x9bf6ff);
      ctx.lineWidth = 2.5;
      for (const ry of [16, 8]) {
        ctx.beginPath();
        ctx.ellipse(86, cy, 34, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      glow(ctx, 110, cy, 18, 0x9bf6ff, 0.8);
      ctx.strokeStyle = '#fff3b0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(96, cy - 26);
      ctx.lineTo(106, cy - 12);
      ctx.lineTo(100, cy - 6);
      ctx.lineTo(114, cy + 6);
      ctx.stroke();
      break;
    case 'steam_kettle':
      ctx.beginPath();
      ctx.ellipse(52, cy + 4, 34, 24, 0, 0, Math.PI * 2);
      toon(ctx, 0xe63946, 18, cy - 20, 68, 48);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(52, cy - 12, 18, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(80, cy);
      ctx.lineTo(106, cy - 10);
      ctx.lineTo(108, cy - 4);
      ctx.lineTo(84, cy + 10);
      ctx.closePath();
      metal(ctx, 80, cy - 10, 28, 20, 0xadb5bd);
      for (const [x, y, r] of [
        [114, cy - 14, 8],
        [122, cy - 24, 6],
        [110, cy - 26, 5],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      }
      break;
    case 'curry_aura':
      glow(ctx, 64, cy, 34, 0xffb703, 0.75);
      ctx.beginPath();
      ctx.ellipse(64, cy + 6, 30, 16, 0, 0, Math.PI);
      ctx.closePath();
      toon(ctx, 0xf8f9fa, 34, cy - 10, 60, 32);
      ctx.beginPath();
      ctx.ellipse(64, cy + 6, 26, 7, 0, 0, Math.PI * 2);
      toon(ctx, 0xe09f3e, 38, cy - 1, 52, 14, { lineW: 2 });
      ctx.beginPath();
      ctx.ellipse(56, cy + 4, 8, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2.5;
      for (const x of [52, 64, 76]) {
        ctx.beginPath();
        ctx.moveTo(x, cy - 4);
        ctx.bezierCurveTo(x - 6, cy - 12, x + 6, cy - 16, x, cy - 26);
        ctx.stroke();
      }
      break;
    case 'pepper_spray':
      roundRectPath(ctx, 14, cy - 14, 56, 28, 8);
      toon(ctx, 0x212529, 14, cy - 14, 56, 28);
      ctx.fillStyle = rgb(0xe63946);
      roundRectPath(ctx, 24, cy - 8, 36, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      for (const [x, y] of [
        [34, cy - 2],
        [44, cy + 3],
        [50, cy - 3],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      roundRectPath(ctx, 68, cy - 8, 20, 16, 4);
      metal(ctx, 68, cy - 8, 20, 16, 0xadb5bd);
      roundRectPath(ctx, 86, cy - 3, 10, 6, 2);
      metal(ctx, 86, cy - 3, 10, 6, 0x495057);
      glow(ctx, 112, cy, 16, 0xff5400, 0.7);
      ctx.fillStyle = rgb(0x6c3a2a, 0.8);
      for (const [x, y] of [
        [104, cy - 4],
        [112, cy + 5],
        [118, cy - 8],
        [122, cy + 2],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'mint_frost_mine':
      glow(ctx, 64, cy + 4, 32, 0xb7e4c7, 0.7);
      ctx.beginPath();
      ctx.arc(64, cy + 4, 22, 0, Math.PI * 2);
      toon(ctx, 0x48cae4, 42, cy - 18, 44, 44);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(64 + Math.cos(a) * 14, cy + 4 + Math.sin(a) * 14);
        ctx.lineTo(64 - Math.cos(a) * 14, cy + 4 - Math.sin(a) * 14);
        ctx.stroke();
      }
      for (const a of [-0.6, 0.6]) {
        ctx.beginPath();
        ctx.ellipse(64 + a * 14, cy - 20, 10, 5, a, 0, Math.PI * 2);
        toon(ctx, 0x52b788, 50, cy - 26, 28, 12, { noShine: true, lineW: 2 });
      }
      break;
    case 'thunder_durian':
      glow(ctx, 64, cy, 36, 0xfff3b0, 0.7);
      starPath(ctx, 64, cy, 30, 24, 14);
      toon(ctx, 0x9a8c2a, 34, cy - 30, 60, 60, { noShine: true });
      ctx.beginPath();
      ctx.arc(64, cy, 22, 0, Math.PI * 2);
      toon(ctx, 0xc9b458, 42, cy - 22, 44, 44);
      ctx.strokeStyle = '#fff3b0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, cy - 16);
      ctx.lineTo(54, cy);
      ctx.lineTo(68, cy);
      ctx.lineTo(62, cy + 16);
      ctx.stroke();
      break;
    case 'dragonfruit_orb':
      glow(ctx, 64, cy, 36, 0xff5400, 0.6);
      ctx.beginPath();
      ctx.ellipse(64, cy, 26, 24, 0, 0, Math.PI * 2);
      toon(ctx, 0xf72585, 38, cy - 24, 52, 48);
      for (const [x, y, a] of [
        [44, cy - 16, -2.4],
        [84, cy - 16, -0.7],
        [40, cy + 10, 2.6],
        [88, cy + 10, 0.5],
        [64, cy - 26, -1.57],
      ]) {
        ctx.beginPath();
        ctx.ellipse(x, y, 9, 4, a, 0, Math.PI * 2);
        toon(ctx, 0x80b918, x - 9, y - 4, 18, 8, { noShine: true, lineW: 2 });
      }
      ctx.fillStyle = '#1b1b1b';
      for (const [x, y] of [
        [58, cy - 4],
        [70, cy + 2],
        [62, cy + 8],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'star_anise_shuriken':
      glow(ctx, 64, cy, 34, 0xff7b00, 0.45);
      starPath(ctx, 64, cy, 28, 9, 8);
      toon(ctx, 0x9c4221, 36, cy - 28, 56, 56);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.ellipse(64 + Math.cos(a) * 16, cy + Math.sin(a) * 16, 3.5, 2.5, a, 0, Math.PI * 2);
        ctx.fillStyle = rgb(0xe9c46a);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(64, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = rgb(0x5a2a0e);
      ctx.fill();
      break;
    case 'lemon_battery':
      ctx.beginPath();
      ctx.ellipse(60, cy, 40, 24, 0, 0, Math.PI * 2);
      toon(ctx, 0xffe45e, 20, cy - 24, 80, 48);
      ctx.beginPath();
      ctx.ellipse(100, cy, 6, 5, 0, 0, Math.PI * 2);
      toon(ctx, 0xf9c74f, 94, cy - 5, 12, 10, { noShine: true, lineW: 2 });
      roundRectPath(ctx, 36, cy - 30, 8, 14, 2);
      metal(ctx, 36, cy - 30, 8, 14, 0xe07a5f);
      roundRectPath(ctx, 72, cy - 30, 8, 14, 2);
      metal(ctx, 72, cy - 30, 8, 14, 0xadb5bd);
      ctx.fillStyle = OUTLINE;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('+', 34, cy + 6);
      ctx.fillText('−', 70, cy + 6);
      glow(ctx, 112, cy, 14, 0x9bf6ff, 0.9);
      ctx.strokeStyle = '#9bf6ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(106, cy - 14);
      ctx.lineTo(116, cy - 4);
      ctx.lineTo(110, cy + 2);
      ctx.lineTo(122, cy + 12);
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
