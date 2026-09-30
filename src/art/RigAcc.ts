// 配饰：帽子、眼镜、披风、角……（程序绘制）
import Phaser from 'phaser';
import { paint, rgb, darken, lighten, toon, ellipsePath, roundRectPath, starPath, OUTLINE } from './Painter';
import type { Acc, RigSpec } from './RigSpec';
import { P } from './RigBody';

export interface AccPart {
  key: string;
  x: number;
  y: number; // 相对身体中心（贴图像素）
  ox: number;
  oy: number; // origin
  layer: 'back' | 'front';
  sway?: number; // 摆动幅度（弧度）
  rot?: number;
}

const hex = (c: number) => c.toString(16).padStart(6, '0');

export function accessoryPart(s: Phaser.Scene, a: Acc, spec: RigSpec): AccPart {
  const c = a.color ?? 0xffffff,
    c2 = a.color2 ?? darken(c, 0.3);
  const top = -P * spec.h; // 头顶
  const eyeY = -P * spec.h * 0.12; // 眼睛高度
  const w = P * spec.w;
  const key = `acc_${a.id}_${hex(c)}_${hex(c2)}`;
  const T = (W: number, H: number, fn: (ctx: CanvasRenderingContext2D) => void) => paint(s, key, W, H, fn);
  switch (a.id) {
    case 'chefHat':
      T(90, 90, (ctx) => {
        ctx.beginPath();
        ctx.arc(28, 36, 20, 0, Math.PI * 2);
        ctx.arc(62, 36, 20, 0, Math.PI * 2);
        ctx.arc(45, 24, 22, 0, Math.PI * 2);
        toon(ctx, c, 8, 2, 74, 56, { noShine: true, lineW: 3 });
        roundRectPath(ctx, 20, 48, 50, 34, 6);
        toon(ctx, c, 20, 48, 50, 34, { flat: true, lineW: 3 });
      });
      return { key, x: 0, y: top + 14, ox: 0.5, oy: 1, layer: 'front', sway: 0.05 };
    case 'helmet':
    case 'visorHelm':
      T(120, 80, (ctx) => {
        ctx.beginPath();
        ctx.ellipse(60, 70, 54, 62, 0, Math.PI, 0);
        ctx.closePath();
        toon(ctx, c, 6, 8, 108, 62);
        ctx.fillStyle = rgb(c2);
        ctx.fillRect(54, 6, 12, 64);
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(54, 6, 12, 64);
        if (a.id === 'visorHelm') {
          ctx.fillStyle = '#1b263b';
          roundRectPath(ctx, 20, 52, 80, 16, 6);
          ctx.fill();
          ctx.stroke();
        }
      });
      return { key, x: 0, y: top + 30, ox: 0.5, oy: 1, layer: 'front' };
    case 'pirateHat':
      T(130, 70, (ctx) => {
        ctx.beginPath();
        ctx.moveTo(4, 56);
        ctx.quadraticCurveTo(65, -20, 126, 56);
        ctx.quadraticCurveTo(65, 40, 4, 56);
        ctx.closePath();
        toon(ctx, 0x222222, 4, 4, 122, 52);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(65, 30, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.fillRect(60, 28, 3, 3);
        ctx.fillRect(67, 28, 3, 3);
        ctx.strokeStyle = rgb(c);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(10, 54);
        ctx.quadraticCurveTo(65, 34, 120, 54);
        ctx.stroke();
      });
      return { key, x: 0, y: top + 22, ox: 0.5, oy: 1, layer: 'front', sway: 0.04 };
    case 'headband':
    case 'bandana':
      T(140, 50, (ctx) => {
        roundRectPath(ctx, 10, 12, 120, 18, 8);
        toon(ctx, c, 10, 12, 120, 18, { noShine: true, lineW: 3 });
        ctx.beginPath();
        ctx.moveTo(122, 20);
        ctx.quadraticCurveTo(138, 30, 134, 46);
        ctx.lineTo(126, 30);
        ctx.closePath();
        toon(ctx, c, 122, 20, 16, 26, { flat: true, lineW: 2.5 });
        if (a.id === 'headband') {
          ctx.fillStyle = '#e0e0e0';
          roundRectPath(ctx, 55, 12, 30, 18, 3);
          ctx.fill();
          ctx.strokeStyle = OUTLINE;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
      return { key, x: 0, y: top + P * spec.h * 0.45, ox: 0.5, oy: 0.5, layer: 'front', rot: -0.05 };
    case 'wizardHat':
      T(110, 120, (ctx) => {
        ctx.beginPath();
        ctx.moveTo(18, 100);
        ctx.quadraticCurveTo(50, 60, 60, 4);
        ctx.quadraticCurveTo(80, 50, 92, 100);
        ctx.closePath();
        toon(ctx, c, 18, 4, 74, 96);
        ctx.beginPath();
        ctx.ellipse(55, 102, 52, 14, 0, 0, Math.PI * 2);
        toon(ctx, c, 3, 88, 104, 28, { noShine: true });
        starPath(ctx, 52, 64, 9, 4, 5);
        ctx.fillStyle = '#ffd166';
        ctx.fill();
      });
      return { key, x: 0, y: top + 20, ox: 0.5, oy: 1, layer: 'front', sway: 0.07 };
    case 'crown':
    case 'tiara':
      T(100, 60, (ctx) => {
        const h = a.id === 'tiara' ? 30 : 50;
        ctx.beginPath();
        ctx.moveTo(8, 56);
        ctx.lineTo(8, 56 - h * 0.6);
        ctx.lineTo(28, 56 - h * 0.25);
        ctx.lineTo(50, 56 - h);
        ctx.lineTo(72, 56 - h * 0.25);
        ctx.lineTo(92, 56 - h * 0.6);
        ctx.lineTo(92, 56);
        ctx.closePath();
        toon(ctx, c, 8, 56 - h, 84, h, { lineW: 3 });
        for (const [x, col] of [
          [30, 0xe63946],
          [50, 0x4cc9f0],
          [70, 0x52b788],
        ] as [number, number][]) {
          ctx.fillStyle = rgb(col);
          ctx.beginPath();
          ctx.arc(x, 48, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = OUTLINE;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      return { key, x: 0, y: top + 12, ox: 0.5, oy: 1, layer: 'front' };
    case 'cowboy':
      T(140, 70, (ctx) => {
        ctx.beginPath();
        ctx.ellipse(70, 56, 66, 12, 0, 0, Math.PI * 2);
        toon(ctx, c, 4, 44, 132, 24, { noShine: true });
        roundRectPath(ctx, 36, 10, 68, 48, 18);
        toon(ctx, c, 36, 10, 68, 48);
        ctx.fillStyle = rgb(c2);
        ctx.fillRect(38, 40, 64, 8);
      });
      return { key, x: 0, y: top + 18, ox: 0.5, oy: 1, layer: 'front' };
    case 'beret':
    case 'cap':
      T(110, 60, (ctx) => {
        if (a.id === 'beret') {
          ctx.beginPath();
          ctx.ellipse(55, 34, 50, 22, -0.1, 0, Math.PI * 2);
          toon(ctx, c, 5, 12, 100, 44);
          ctx.fillStyle = rgb(c2);
          ctx.fillRect(52, 6, 6, 10);
        } else {
          ctx.beginPath();
          ctx.ellipse(50, 40, 40, 30, 0, Math.PI, 0);
          ctx.closePath();
          toon(ctx, c, 10, 10, 80, 30);
          ctx.beginPath();
          ctx.ellipse(86, 42, 22, 7, 0, 0, Math.PI * 2);
          toon(ctx, c2, 64, 35, 44, 14, { noShine: true });
        }
      });
      return { key, x: 0, y: top + 14, ox: 0.5, oy: 1, layer: 'front' };
    case 'tophat':
      T(90, 100, (ctx) => {
        roundRectPath(ctx, 20, 6, 50, 76, 6);
        toon(ctx, 0x222222, 20, 6, 50, 76);
        ctx.fillStyle = rgb(c);
        ctx.fillRect(20, 60, 50, 10);
        ctx.beginPath();
        ctx.ellipse(45, 84, 42, 9, 0, 0, Math.PI * 2);
        toon(ctx, 0x222222, 3, 75, 84, 18, { noShine: true });
      });
      return { key, x: 0, y: top + 16, ox: 0.5, oy: 1, layer: 'front', sway: 0.04 };
    case 'goggles':
      T(130, 50, (ctx) => {
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(4, 20, 122, 10);
        for (const x of [42, 88]) {
          ctx.beginPath();
          ctx.arc(x, 25, 20, 0, Math.PI * 2);
          toon(ctx, 0xadb5bd, x - 20, 5, 40, 40, { noShine: true });
          ctx.beginPath();
          ctx.arc(x, 25, 13, 0, Math.PI * 2);
          ctx.fillStyle = rgb(c, 0.85);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillRect(x - 7, 17, 6, 4);
        }
      });
      return { key, x: 0, y: top + P * spec.h * 0.3, ox: 0.5, oy: 0.5, layer: 'front' };
    case 'glasses':
    case 'monocle':
      T(110, 44, (ctx) => {
        ctx.strokeStyle = rgb(c);
        ctx.lineWidth = 4;
        const xs = a.id === 'monocle' ? [74] : [32, 78];
        for (const x of xs) {
          ctx.fillStyle = 'rgba(200,240,255,0.35)';
          ctx.beginPath();
          ctx.arc(x, 22, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        if (a.id === 'glasses') {
          ctx.beginPath();
          ctx.moveTo(48, 20);
          ctx.quadraticCurveTo(55, 14, 62, 20);
          ctx.stroke();
        } else {
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(74, 38);
          ctx.quadraticCurveTo(80, 44, 90, 42);
          ctx.stroke();
        }
      });
      return { key, x: 0, y: eyeY, ox: 0.5, oy: 0.5, layer: 'front' };
    case 'eyepatch':
      T(120, 40, (ctx) => {
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(4, 8);
        ctx.lineTo(116, 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(78, 24, 14, 12, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
      });
      return { key, x: 0, y: eyeY, ox: 0.5, oy: 0.5, layer: 'front' };
    case 'mask':
      T(130, 40, (ctx) => {
        roundRectPath(ctx, 6, 8, 118, 24, 12);
        toon(ctx, c, 6, 8, 118, 24, { noShine: true, lineW: 3 });
        ctx.fillStyle = '#fff';
        for (const x of [42, 88]) {
          ctx.beginPath();
          ctx.ellipse(x, 20, 12, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111';
          ctx.beginPath();
          ctx.arc(x + 2, 20, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
        }
      });
      return { key, x: 0, y: eyeY, ox: 0.5, oy: 0.5, layer: 'front' };
    case 'headphones':
      T(150, 110, (ctx) => {
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(75, 78, 62, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
        ctx.strokeStyle = rgb(c);
        ctx.lineWidth = 7;
        ctx.stroke();
        for (const x of [14, 136]) {
          roundRectPath(ctx, x - 13, 62, 26, 40, 10);
          toon(ctx, c, x - 13, 62, 26, 40, { lineW: 3 });
        }
      });
      return { key, x: 0, y: top + P * spec.h * 0.75, ox: 0.5, oy: 0.7, layer: 'front' };
    case 'bow':
      T(70, 44, (ctx) => {
        for (const d of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(35, 22);
          ctx.quadraticCurveTo(35 + d * 34, -4, 35 + d * 30, 40);
          ctx.closePath();
          toon(ctx, c, d < 0 ? 5 : 35, 4, 30, 36, { lineW: 3 });
        }
        ctx.beginPath();
        ctx.arc(35, 22, 7, 0, Math.PI * 2);
        toon(ctx, darken(c, 0.1), 28, 15, 14, 14, { noShine: true, lineW: 2.5 });
      });
      return { key, x: w * 0.45, y: top + 10, ox: 0.5, oy: 0.5, layer: 'front', sway: 0.08 };
    case 'flower':
      T(56, 56, (ctx) => {
        for (let i = 0; i < 5; i++) {
          const a2 = i * 1.256;
          ctx.beginPath();
          ctx.ellipse(28 + Math.cos(a2) * 13, 28 + Math.sin(a2) * 13, 11, 8, a2, 0, Math.PI * 2);
          toon(ctx, c, 10, 10, 36, 36, { noShine: true, lineW: 2 });
        }
        ctx.beginPath();
        ctx.arc(28, 28, 8, 0, Math.PI * 2);
        toon(ctx, 0xffd166, 20, 20, 16, 16, { lineW: 2 });
      });
      return { key, x: w * 0.5, y: top + 16, ox: 0.5, oy: 0.5, layer: 'front', sway: 0.1 };
    case 'halo':
      T(90, 34, (ctx) => {
        ctx.strokeStyle = 'rgba(255,209,102,0.5)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.ellipse(45, 17, 36, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 5;
        ctx.stroke();
      });
      return { key, x: 0, y: top - 18, ox: 0.5, oy: 0.5, layer: 'front', sway: 0.05 };
    case 'horns':
    case 'antlers':
      T(150, 70, (ctx) => {
        for (const d of [-1, 1]) {
          const x0 = 75 + d * 40;
          ctx.beginPath();
          if (a.id === 'horns') {
            ctx.moveTo(x0 - 10, 66);
            ctx.quadraticCurveTo(x0 + d * 30, 40, x0 + d * 20, 4);
            ctx.quadraticCurveTo(x0 + d * 12, 40, x0 + 10, 66);
          } else {
            ctx.moveTo(x0, 66);
            ctx.lineTo(x0 + d * 10, 30);
            ctx.lineTo(x0 + d * 30, 10);
            ctx.moveTo(x0 + d * 10, 30);
            ctx.lineTo(x0 - d * 6, 8);
          }
          if (a.id === 'horns') toon(ctx, c, x0 - 20, 4, 40, 62, { lineW: 3 });
          else {
            ctx.strokeStyle = OUTLINE;
            ctx.lineWidth = 10;
            ctx.stroke();
            ctx.strokeStyle = rgb(c);
            ctx.lineWidth = 6;
            ctx.stroke();
          }
        }
      });
      return { key, x: 0, y: top + 16, ox: 0.5, oy: 1, layer: 'back' };
    case 'cape':
    case 'scarf':
      T(160, 130, (ctx) => {
        if (a.id === 'cape') {
          ctx.beginPath();
          ctx.moveTo(40, 6);
          ctx.quadraticCurveTo(0, 90, 14, 126);
          ctx.lineTo(146, 126);
          ctx.quadraticCurveTo(160, 90, 120, 6);
          ctx.closePath();
          toon(ctx, c, 0, 6, 160, 120, { noShine: true });
          ctx.fillStyle = rgb(c2);
          ctx.beginPath();
          ctx.moveTo(48, 10);
          ctx.quadraticCurveTo(20, 80, 28, 118);
          ctx.lineTo(132, 118);
          ctx.quadraticCurveTo(140, 80, 112, 10);
          ctx.closePath();
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          roundRectPath(ctx, 20, 20, 120, 24, 12);
          toon(ctx, c, 20, 20, 120, 24, { noShine: true, lineW: 3 });
          roundRectPath(ctx, 104, 30, 22, 60, 8);
          toon(ctx, c, 104, 30, 22, 60, { noShine: true, lineW: 3 });
          ctx.fillStyle = rgb(c2);
          for (let i = 0; i < 5; i++) ctx.fillRect(30 + i * 22, 22, 8, 20);
        }
      });
      return a.id === 'cape'
        ? { key, x: 0, y: -P * spec.h * 0.35, ox: 0.5, oy: 0, layer: 'back', sway: 0.06 }
        : { key, x: 0, y: P * spec.h * 0.28, ox: 0.5, oy: 0.3, layer: 'front', sway: 0.03 };
    case 'mustache':
      T(70, 28, (ctx) => {
        ctx.beginPath();
        ctx.moveTo(35, 8);
        ctx.bezierCurveTo(20, 0, 2, 12, 4, 22);
        ctx.bezierCurveTo(14, 14, 24, 18, 35, 14);
        ctx.bezierCurveTo(46, 18, 56, 14, 66, 22);
        ctx.bezierCurveTo(68, 12, 50, 0, 35, 8);
        toon(ctx, c, 2, 2, 66, 22, { noShine: true, lineW: 2.5 });
      });
      return { key, x: 0, y: P * spec.h * 0.18, ox: 0.5, oy: 0.5, layer: 'front' };
    case 'tie':
      T(40, 70, (ctx) => {
        ctx.beginPath();
        ctx.moveTo(12, 4);
        ctx.lineTo(28, 4);
        ctx.lineTo(24, 14);
        ctx.lineTo(32, 54);
        ctx.lineTo(20, 66);
        ctx.lineTo(8, 54);
        ctx.lineTo(16, 14);
        ctx.closePath();
        toon(ctx, c, 8, 4, 24, 62, { lineW: 3 });
      });
      return { key, x: 0, y: P * spec.h * 0.45, ox: 0.5, oy: 0, layer: 'front', sway: 0.05 };
    case 'apron':
      T(100, 90, (ctx) => {
        ctx.beginPath();
        ctx.moveTo(26, 4);
        ctx.lineTo(74, 4);
        ctx.quadraticCurveTo(98, 60, 88, 86);
        ctx.lineTo(12, 86);
        ctx.quadraticCurveTo(2, 60, 26, 4);
        ctx.closePath();
        toon(ctx, c, 2, 4, 96, 82, { noShine: true, lineW: 3 });
        ctx.strokeStyle = rgb(c2);
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(14, 60);
        ctx.lineTo(86, 60);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      return { key, x: 0, y: P * spec.h * 0.1, ox: 0.5, oy: 0, layer: 'front' };
    case 'spikes':
    case 'mohawk':
      T(120, 50, (ctx) => {
        ctx.beginPath();
        ctx.moveTo(4, 48);
        const n = a.id === 'mohawk' ? 5 : 7;
        for (let i = 0; i < n; i++) {
          const x = 4 + (i + 0.5) * (112 / n);
          ctx.lineTo(x, a.id === 'mohawk' ? 4 + Math.abs(i - 2) * 6 : 6);
          ctx.lineTo(4 + (i + 1) * (112 / n), 48);
        }
        ctx.closePath();
        toon(ctx, c, 4, 4, 112, 44, { lineW: 3 });
      });
      return { key, x: 0, y: top + 10, ox: 0.5, oy: 1, layer: 'back' };
    case 'armor':
      T(150, 90, (ctx) => {
        ctx.beginPath();
        ctx.moveTo(10, 10);
        ctx.quadraticCurveTo(75, -6, 140, 10);
        ctx.lineTo(132, 70);
        ctx.quadraticCurveTo(75, 96, 18, 70);
        ctx.closePath();
        toon(ctx, c, 10, 2, 130, 86);
        ctx.fillStyle = rgb(c2);
        ctx.beginPath();
        ctx.arc(75, 40, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });
      return { key, x: 0, y: P * spec.h * 0.42, ox: 0.5, oy: 0, layer: 'front' };
    case 'hood':
      T(160, 140, (ctx) => {
        ctx.beginPath();
        ctx.moveTo(10, 136);
        ctx.quadraticCurveTo(0, 10, 80, 4);
        ctx.quadraticCurveTo(160, 10, 150, 136);
        ctx.quadraticCurveTo(120, 60, 80, 56);
        ctx.quadraticCurveTo(40, 60, 10, 136);
        ctx.closePath();
        toon(ctx, c, 0, 4, 160, 132, { noShine: true });
      });
      return { key, x: 0, y: -P * spec.h * 1.12, ox: 0.5, oy: 0, layer: 'front' };
    case 'bunnyEars':
    case 'catEars':
    case 'ratEars':
      T(150, 80, (ctx) => {
        for (const d of [-1, 1]) {
          const x = 75 + d * 36;
          ctx.beginPath();
          if (a.id === 'bunnyEars') ctx.ellipse(x, 40, 12, 38, d * 0.15, 0, Math.PI * 2);
          else if (a.id === 'catEars') {
            ctx.moveTo(x - 20, 78);
            ctx.lineTo(x + d * 6, 10);
            ctx.lineTo(x + 20, 78);
            ctx.closePath();
          } else ctx.ellipse(x + d * 8, 50, 26, 24, 0, 0, Math.PI * 2);
          toon(ctx, c, x - 26, 4, 52, 76, { noShine: true, lineW: 3 });
          ctx.fillStyle = rgb(lighten(c2, 0.3), 0.8);
          ctx.beginPath();
          if (a.id === 'ratEars') ctx.ellipse(x + d * 8, 52, 15, 14, 0, 0, Math.PI * 2);
          else ctx.ellipse(x, 48, 6, 20, d * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      return { key, x: 0, y: top + 22, ox: 0.5, oy: 1, layer: 'back', sway: 0.06 };
    case 'antenna':
      T(120, 70, (ctx) => {
        for (const d of [-1, 1]) {
          ctx.strokeStyle = OUTLINE;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(60 + d * 14, 68);
          ctx.quadraticCurveTo(60 + d * 20, 30, 60 + d * 44, 12);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(60 + d * 46, 11, 7, 0, Math.PI * 2);
          toon(ctx, c, 60 + d * 46 - 7, 4, 14, 14, { lineW: 2.5 });
        }
      });
      return { key, x: 0, y: top + 12, ox: 0.5, oy: 1, layer: 'back', sway: 0.12 };
    case 'bell':
      T(40, 40, (ctx) => {
        ctx.beginPath();
        ctx.arc(20, 22, 15, 0, Math.PI * 2);
        toon(ctx, 0xffd166, 5, 7, 30, 30, { lineW: 3 });
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(10, 22, 20, 3);
        ctx.beginPath();
        ctx.arc(20, 30, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      return { key, x: 0, y: P * spec.h * 0.55, ox: 0.5, oy: 0.5, layer: 'front', sway: 0.2 };
    case 'crack':
      T(80, 80, (ctx) => {
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(10, 10);
        ctx.lineTo(30, 30);
        ctx.lineTo(24, 44);
        ctx.lineTo(46, 60);
        ctx.lineTo(44, 74);
        ctx.moveTo(30, 30);
        ctx.lineTo(52, 24);
        ctx.stroke();
      });
      return { key, x: -w * 0.3, y: -P * spec.h * 0.45, ox: 0.5, oy: 0.5, layer: 'front' };
    case 'bandage':
      T(70, 40, (ctx) => {
        ctx.save();
        ctx.translate(35, 20);
        ctx.rotate(-0.5);
        roundRectPath(ctx, -30, -9, 60, 18, 6);
        toon(ctx, 0xf1e3d3, -30, -9, 60, 18, { noShine: true, lineW: 2.5 });
        ctx.fillStyle = 'rgba(200,120,100,0.5)';
        ctx.fillRect(-8, -6, 16, 12);
        ctx.restore();
      });
      return { key, x: w * 0.35, y: -P * spec.h * 0.5, ox: 0.5, oy: 0.5, layer: 'front' };
    case 'star':
      T(50, 50, (ctx) => {
        starPath(ctx, 25, 25, 22, 10, 5);
        toon(ctx, c, 3, 3, 44, 44, { lineW: 3 });
      });
      return { key, x: w * 0.55, y: top + 14, ox: 0.5, oy: 0.5, layer: 'front', sway: 0.1 };
    case 'leafHat':
      T(110, 60, (ctx) => {
        ctx.beginPath();
        ctx.moveTo(6, 54);
        ctx.quadraticCurveTo(55, -20, 104, 54);
        ctx.quadraticCurveTo(55, 40, 6, 54);
        toon(ctx, c, 6, 4, 98, 50);
        ctx.strokeStyle = rgb(darken(c, 0.35));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(55, 44);
        ctx.lineTo(55, 10);
        ctx.stroke();
      });
      return { key, x: 0, y: top + 16, ox: 0.5, oy: 1, layer: 'front', sway: 0.06 };
  }
}

export function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ellipsePath(ctx, x, y, rx, ry);
}
