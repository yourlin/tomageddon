// 道具图标：30 种造型 × 颜色参数，按需绘制（542 件道具懒加载）
import Phaser from 'phaser';
import { paint, type Ctx, rgb, darken, lighten, toon, ellipsePath, roundRectPath, starPath, glow, OUTLINE, hashStr, rng } from './Painter';
import type { ItemDef } from '../data/items';

/** 手工道具的图标造型 */
const HAND_ICONS: Record<string, [string, number, number]> = {
  band_aid: ['bandage', 0xf4c29b, 0xe0a07a],
  tomato_juice: ['cup', 0xe63946, 0xffffff],
  toothpick: ['blade', 0xdda15e, 0x8d6e63],
  rubber_band: ['ring', 0xf15bb5, 0xfee440],
  lighter: ['battery', 0xe63946, 0xffba08],
  apron: ['shield', 0xf8f9fa, 0xe63946],
  coffee: ['cup', 0x6f4518, 0xf1e3d3],
  sneakers: ['shoe', 0x457b9d, 0xffffff],
  clover: ['leaf', 0x52b788, 0x2d6a4f],
  seed_bag: ['bag', 0xc9a227, 0x6b4226],
  magnet: ['heart', 0xe63946, 0xadb5bd],
  glasses: ['ring', 0x343a40, 0x9bf6ff],
  feather: ['feather', 0xffffff, 0x90e0ef],
  hot_sauce: ['bottle', 0xd00000, 0xffd166],
  notebook: ['book', 0xe63946, 0xffffff],
  chef_hat: ['hat', 0xffffff, 0xdee2e6],
  scope: ['gear', 0x343a40, 0x4cc9f0],
  battery: ['battery', 0x38b000, 0x222222],
  mosquito: ['bug', 0x6c757d, 0xd00000],
  energy_drink: ['can', 0x9ef01a, 0x1b1b1b],
  helmet: ['hat', 0xadb5bd, 0x495057],
  piggy_bank: ['coin', 0xffafcc, 0xffd166],
  bomb_seed: ['seed', 0x2b2d42, 0xff7b00],
  cactus: ['leaf', 0x2d6a4f, 0xffafcc],
  lucky_cat: ['heart', 0xffffff, 0xffd166],
  running_shoes: ['shoe', 0xffd60a, 0xe63946],
  lemonade: ['cup', 0xfff3b0, 0xf7ec59],
  bandage_roll: ['bandage', 0xf8f9fa, 0xe63946],
  iron_wok: ['shield', 0x343a40, 0xadb5bd],
  sharpener: ['blade', 0x8d99ae, 0xffd166],
  tesla_coil: ['orb', 0x4361ee, 0x9bf6ff],
  bubble: ['orb', 0xffafcc, 0xffffff],
  fire_pepper: ['fruit', 0xd00000, 0xff7b00],
  backpack: ['bag', 0xe63946, 0x6b4226],
  coupon: ['scroll', 0xffd166, 0xe63946],
  protein: ['jar', 0x457b9d, 0xffffff],
  golden_tomato: ['fruit', 0xffd166, 0x2d6a4f],
  phoenix_feather: ['feather', 0xff7b00, 0xffd166],
  chef_knife_set: ['blade', 0xdee2e6, 0x6b4226],
  railgun_core: ['orb', 0x4cc9f0, 0xffffff],
  grandma_recipe: ['scroll', 0xf1e3d3, 0x6b4226],
  vampire_cape: ['mask', 0x9d0208, 0x1b1b1b],
  firecracker: ['candy', 0xe63946, 0xffd166],
  baking_powder: ['bag', 0xfff3e0, 0xffba08],
  pressure_cooker: ['jar', 0xb2bec3, 0xff7b00],
  powder_keg: ['box', 0x8d5524, 0xe63946],
};

type Shape = (ctx: Ctx, c: number, c2: number, r: () => number) => void;

const SHAPES: Record<string, Shape> = {
  bottle: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(54, 20);
    ctx.lineTo(74, 20);
    ctx.lineTo(74, 40);
    ctx.quadraticCurveTo(96, 50, 96, 70);
    ctx.lineTo(96, 104);
    ctx.quadraticCurveTo(96, 112, 88, 112);
    ctx.lineTo(40, 112);
    ctx.quadraticCurveTo(32, 112, 32, 104);
    ctx.lineTo(32, 70);
    ctx.quadraticCurveTo(32, 50, 54, 40);
    ctx.closePath();
    toon(ctx, c, 32, 20, 64, 92);
    roundRectPath(ctx, 38, 66, 52, 26, 5);
    ctx.fillStyle = rgb(c2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    roundRectPath(ctx, 52, 12, 24, 12, 4);
    toon(ctx, darken(c2, 0.2), 52, 12, 24, 12, { noShine: true, lineW: 2.5 });
  },
  jar: (ctx, c, c2) => {
    roundRectPath(ctx, 30, 36, 68, 76, 16);
    toon(ctx, c, 30, 36, 68, 76);
    roundRectPath(ctx, 26, 22, 76, 20, 6);
    toon(ctx, c2, 26, 22, 76, 20, { noShine: true, lineW: 3 });
    roundRectPath(ctx, 40, 60, 48, 28, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  },
  can: (ctx, c, c2) => {
    roundRectPath(ctx, 34, 22, 60, 88, 10);
    toon(ctx, c, 34, 22, 60, 88);
    ctx.fillStyle = rgb(c2);
    ctx.fillRect(36, 54, 56, 22);
    ctx.beginPath();
    ctx.ellipse(64, 24, 28, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ced4da';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
  },
  cup: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.arc(94, 70, 14, -1.2, 1.2);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = rgb(0xf8f9fa);
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(28, 40);
    ctx.lineTo(96, 40);
    ctx.lineTo(88, 108);
    ctx.quadraticCurveTo(62, 116, 36, 108);
    ctx.closePath();
    toon(ctx, 0xf8f9fa, 28, 40, 68, 72);
    ctx.beginPath();
    ctx.ellipse(62, 42, 33, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgb(c);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = rgb(c2, 0.7);
    ctx.lineWidth = 3;
    for (const x of [50, 64, 78]) {
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.bezierCurveTo(x - 6, 22, x + 6, 16, x, 8);
      ctx.stroke();
    }
  },
  bowl: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(18, 56);
    ctx.quadraticCurveTo(64, 130, 110, 56);
    ctx.closePath();
    toon(ctx, c, 18, 56, 92, 50);
    ctx.beginPath();
    ctx.ellipse(64, 56, 46, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgb(c2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
  },
  fruit: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.arc(64, 72, 40, 0, Math.PI * 2);
    toon(ctx, c, 24, 32, 80, 80);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.55;
      ctx.beginPath();
      ctx.ellipse(64 + Math.cos(a) * 12, 34 + Math.sin(a) * 6, 13, 5, a, 0, Math.PI * 2);
      toon(ctx, c2, 50, 26, 28, 16, { noShine: true, lineW: 2 });
    }
  },
  leaf: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(24, 104);
    ctx.bezierCurveTo(20, 40, 70, 16, 108, 20);
    ctx.bezierCurveTo(110, 70, 70, 108, 24, 104);
    toon(ctx, c, 20, 16, 90, 90);
    ctx.strokeStyle = rgb(darken(c2, 0.2));
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, 104);
    ctx.quadraticCurveTo(60, 60, 104, 24);
    ctx.stroke();
  },
  seed: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.ellipse(64, 66, 30, 42, 0.3, 0, Math.PI * 2);
    toon(ctx, c, 34, 24, 60, 84);
    ctx.strokeStyle = rgb(c2);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(56, 34);
    ctx.quadraticCurveTo(70, 66, 62, 102);
    ctx.stroke();
  },
  bag: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.quadraticCurveTo(14, 110, 64, 112);
    ctx.quadraticCurveTo(114, 110, 88, 40);
    ctx.closePath();
    toon(ctx, c, 18, 40, 92, 72);
    roundRectPath(ctx, 40, 30, 48, 14, 6);
    toon(ctx, c2, 40, 30, 48, 14, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.arc(64, 22, 10, Math.PI, 0);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.stroke();
  },
  box: (ctx, c, c2) => {
    roundRectPath(ctx, 22, 44, 84, 66, 8);
    toon(ctx, c, 22, 44, 84, 66);
    roundRectPath(ctx, 16, 32, 96, 20, 6);
    toon(ctx, darken(c, 0.1), 16, 32, 96, 20, { noShine: true });
    ctx.fillStyle = rgb(c2);
    ctx.fillRect(56, 32, 16, 78);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 32, 16, 78);
    starPath(ctx, 64, 24, 14, 6, 5);
    toon(ctx, c2, 50, 10, 28, 28, { lineW: 2 });
  },
  book: (ctx, c, c2) => {
    roundRectPath(ctx, 28, 20, 72, 92, 8);
    toon(ctx, c, 28, 20, 72, 92);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(92, 26, 8, 80);
    ctx.fillStyle = rgb(c2);
    roundRectPath(ctx, 42, 40, 44, 20, 4);
    ctx.fill();
    starPath(ctx, 64, 84, 12, 5, 5);
    ctx.fillStyle = rgb(c2);
    ctx.fill();
  },
  scroll: (ctx, c, c2) => {
    roundRectPath(ctx, 30, 26, 68, 76, 4);
    toon(ctx, c, 30, 26, 68, 76, { noShine: true });
    for (const y of [26, 102]) {
      roundRectPath(ctx, 22, y - 8, 84, 16, 8);
      toon(ctx, darken(c, 0.2), 22, y - 8, 84, 16, { noShine: true, lineW: 2.5 });
    }
    ctx.strokeStyle = rgb(c2);
    ctx.lineWidth = 3;
    for (let y = 46; y < 90; y += 12) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(88, y);
      ctx.stroke();
    }
  },
  coin: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.arc(64, 64, 42, 0, Math.PI * 2);
    toon(ctx, c, 22, 22, 84, 84);
    ctx.beginPath();
    ctx.arc(64, 64, 30, 0, Math.PI * 2);
    ctx.strokeStyle = rgb(darken(c2, 0.2));
    ctx.lineWidth = 4;
    ctx.stroke();
    starPath(ctx, 64, 64, 16, 7, 5);
    ctx.fillStyle = rgb(darken(c2, 0.1));
    ctx.fill();
  },
  gem: (ctx, c) => {
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.lineTo(88, 30);
    ctx.lineTo(110, 54);
    ctx.lineTo(64, 110);
    ctx.lineTo(18, 54);
    ctx.closePath();
    toon(ctx, c, 18, 30, 92, 80);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 54);
    ctx.lineTo(110, 54);
    ctx.moveTo(40, 30);
    ctx.lineTo(52, 54);
    ctx.lineTo(64, 110);
    ctx.lineTo(76, 54);
    ctx.lineTo(88, 30);
    ctx.stroke();
  },
  ring: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.ellipse(64, 76, 36, 32, 0, 0, Math.PI * 2);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 16;
    ctx.stroke();
    ctx.strokeStyle = rgb(c);
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.strokeStyle = rgb(lighten(c, 0.5));
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(64, 76, 36, 32, 0, 3.6, 4.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(48, 40);
    ctx.lineTo(80, 40);
    ctx.lineTo(90, 30);
    ctx.lineTo(64, 12);
    ctx.lineTo(38, 30);
    ctx.closePath();
    toon(ctx, c2, 38, 12, 52, 30, { lineW: 2.5 });
  },
  amulet: (ctx, c, c2) => {
    ctx.strokeStyle = rgb(0xdda15e);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 10);
    ctx.quadraticCurveTo(64, 70, 98, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(64, 40);
    ctx.lineTo(96, 72);
    ctx.lineTo(64, 116);
    ctx.lineTo(32, 72);
    ctx.closePath();
    toon(ctx, c, 32, 40, 64, 76);
    ctx.beginPath();
    ctx.arc(64, 76, 12, 0, Math.PI * 2);
    toon(ctx, c2, 52, 64, 24, 24, { lineW: 2 });
  },
  potion: (ctx, c) => {
    roundRectPath(ctx, 52, 14, 24, 26, 4);
    toon(ctx, 0xdee2e6, 52, 14, 24, 26, { noShine: true, lineW: 2.5 });
    roundRectPath(ctx, 50, 8, 28, 10, 3);
    toon(ctx, 0x8d6e63, 50, 8, 28, 10, { noShine: true, lineW: 2 });
    ctx.beginPath();
    ctx.arc(64, 78, 36, 0, Math.PI * 2);
    toon(ctx, 0xe9f5ff, 28, 42, 72, 72, { noShine: true });
    ctx.save();
    ctx.beginPath();
    ctx.arc(64, 78, 33, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = rgb(c);
    ctx.fillRect(20, 70, 90, 50);
    ctx.fillStyle = rgb(lighten(c, 0.3));
    ctx.beginPath();
    ctx.ellipse(64, 70, 34, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(50, 62, 6, 12, 0.4, 0, Math.PI * 2);
    ctx.fill();
  },
  shoe: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(24, 40);
    ctx.lineTo(56, 40);
    ctx.quadraticCurveTo(62, 64, 98, 70);
    ctx.quadraticCurveTo(114, 76, 110, 96);
    ctx.lineTo(20, 96);
    ctx.closePath();
    toon(ctx, c, 20, 40, 94, 56);
    roundRectPath(ctx, 16, 92, 98, 14, 6);
    toon(ctx, c2, 16, 92, 98, 14, { noShine: true, lineW: 3 });
    ctx.strokeStyle = rgb(c2);
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(52 + i * 8, 52 + i * 4);
      ctx.lineTo(62 + i * 8, 46 + i * 4);
      ctx.stroke();
    }
  },
  hat: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.ellipse(64, 92, 52, 14, 0, 0, Math.PI * 2);
    toon(ctx, c, 12, 78, 104, 28, { noShine: true });
    roundRectPath(ctx, 32, 30, 64, 64, 18);
    toon(ctx, c, 32, 30, 64, 64);
    ctx.fillStyle = rgb(c2);
    ctx.fillRect(33, 74, 62, 12);
  },
  shield: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(64, 14);
    ctx.lineTo(108, 30);
    ctx.quadraticCurveTo(108, 90, 64, 116);
    ctx.quadraticCurveTo(20, 90, 20, 30);
    ctx.closePath();
    toon(ctx, c, 20, 14, 88, 102);
    ctx.beginPath();
    ctx.moveTo(64, 30);
    ctx.lineTo(90, 40);
    ctx.quadraticCurveTo(90, 82, 64, 98);
    ctx.quadraticCurveTo(38, 82, 38, 40);
    ctx.closePath();
    ctx.fillStyle = rgb(c2, 0.8);
    ctx.fill();
  },
  blade: (ctx, c, c2) => {
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-Math.PI / 4);
    roundRectPath(ctx, -8, 18, 16, 38, 6);
    toon(ctx, c2, -8, 18, 16, 38, { noShine: true, lineW: 2.5 });
    roundRectPath(ctx, -22, 12, 44, 10, 4);
    toon(ctx, darken(c2, 0.1), -22, 12, 44, 10, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(-12, 12);
    ctx.lineTo(-12, -40);
    ctx.lineTo(0, -58);
    ctx.lineTo(12, -40);
    ctx.lineTo(12, 12);
    ctx.closePath();
    toon(ctx, c, -12, -58, 24, 70);
    ctx.restore();
  },
  gear: (ctx, c, c2) => {
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 ? 36 : 46;
      ctx.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    }
    ctx.closePath();
    toon(ctx, c, 18, 18, 92, 92);
    ctx.beginPath();
    ctx.arc(64, 64, 14, 0, Math.PI * 2);
    ctx.fillStyle = rgb(c2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
  },
  battery: (ctx, c, c2) => {
    roundRectPath(ctx, 34, 26, 60, 86, 10);
    toon(ctx, c2, 34, 26, 60, 86);
    roundRectPath(ctx, 34, 26, 60, 44, 10);
    ctx.fillStyle = rgb(c);
    ctx.fill();
    roundRectPath(ctx, 54, 14, 20, 14, 3);
    toon(ctx, 0xadb5bd, 54, 14, 20, 14, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.moveTo(68, 40);
    ctx.lineTo(54, 72);
    ctx.lineTo(66, 72);
    ctx.lineTo(58, 100);
    ctx.lineTo(76, 64);
    ctx.lineTo(64, 64);
    ctx.closePath();
    ctx.fillStyle = '#ffd60a';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
  },
  bug: (ctx, c, c2) => {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++)
      for (const d of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(64, 56 + i * 16);
        ctx.lineTo(64 + d * 44, 44 + i * 22);
        ctx.stroke();
      }
    ctx.beginPath();
    ctx.ellipse(64, 72, 28, 36, 0, 0, Math.PI * 2);
    toon(ctx, c, 36, 36, 56, 72);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(64, 40);
    ctx.lineTo(64, 106);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(64, 34, 14, 0, Math.PI * 2);
    toon(ctx, darken(c, 0.3), 50, 20, 28, 28, { lineW: 2.5 });
    for (const [x, y] of [
      [52, 62],
      [76, 62],
      [56, 86],
      [72, 86],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = rgb(c2);
      ctx.fill();
    }
  },
  feather: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.bezierCurveTo(20, 60, 60, 20, 104, 14);
    ctx.bezierCurveTo(100, 60, 70, 100, 30, 110);
    toon(ctx, c, 20, 14, 86, 96);
    ctx.strokeStyle = rgb(c2);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, 118);
    ctx.quadraticCurveTo(60, 70, 100, 18);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const t = 0.2 + i * 0.12;
      ctx.beginPath();
      ctx.moveTo(30 + t * 70, 110 - t * 90);
      ctx.lineTo(50 + t * 70, 104 - t * 80);
      ctx.stroke();
    }
  },
  heart: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(64, 108);
    ctx.bezierCurveTo(10, 72, 18, 20, 64, 40);
    ctx.bezierCurveTo(110, 20, 118, 72, 64, 108);
    toon(ctx, c, 16, 24, 96, 84);
    ctx.fillStyle = rgb(c2, 0.9);
    ctx.beginPath();
    ctx.arc(64, 64, 10, 0, Math.PI * 2);
    ctx.fill();
  },
  candy: (ctx, c, c2) => {
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(64 + d * 26, 64);
      ctx.lineTo(64 + d * 54, 40);
      ctx.lineTo(64 + d * 54, 88);
      ctx.closePath();
      toon(ctx, c2, d < 0 ? 10 : 90, 40, 28, 48, { noShine: true, lineW: 3 });
    }
    ctx.beginPath();
    ctx.arc(64, 64, 30, 0, Math.PI * 2);
    toon(ctx, c, 34, 34, 60, 60);
    ctx.save();
    ctx.beginPath();
    ctx.arc(64, 64, 28, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 6;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(34 + i * 16, 30);
      ctx.lineTo(64 + i * 16, 98);
      ctx.stroke();
    }
    ctx.restore();
  },
  bread: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(20, 96);
    ctx.lineTo(20, 60);
    ctx.bezierCurveTo(20, 20, 108, 20, 108, 60);
    ctx.lineTo(108, 96);
    ctx.quadraticCurveTo(64, 108, 20, 96);
    toon(ctx, c, 20, 30, 88, 74);
    ctx.strokeStyle = rgb(c2, 0.7);
    ctx.lineWidth = 4;
    for (const x of [44, 64, 84]) {
      ctx.beginPath();
      ctx.moveTo(x - 8, 46);
      ctx.lineTo(x + 6, 62);
      ctx.stroke();
    }
  },
  cheese: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(16, 90);
    ctx.lineTo(104, 44);
    ctx.lineTo(112, 90);
    ctx.closePath();
    toon(ctx, c, 16, 44, 96, 46);
    ctx.fillStyle = rgb(c2);
    for (const [x, y, r] of [
      [60, 76, 8],
      [88, 70, 6],
      [96, 84, 4],
      [40, 86, 4],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  fish: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(98, 64);
    ctx.lineTo(118, 42);
    ctx.lineTo(118, 86);
    ctx.closePath();
    toon(ctx, c2, 98, 42, 20, 44, { noShine: true, lineW: 3 });
    ctx.beginPath();
    ctx.ellipse(60, 64, 44, 28, 0, 0, Math.PI * 2);
    toon(ctx, c, 16, 36, 88, 56);
    ctx.beginPath();
    ctx.arc(34, 58, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(34, 58, 3, 0, Math.PI * 2);
    ctx.fill();
  },
  egg: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.ellipse(64, 70, 34, 44, 0, 0, Math.PI * 2);
    toon(ctx, c, 30, 26, 68, 88);
    ctx.fillStyle = rgb(c2, 0.5);
    for (const [x, y] of [
      [54, 60],
      [76, 80],
      [60, 94],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  orb: (ctx, c, c2) => {
    glow(ctx, 64, 64, 56, c, 0.6);
    ctx.beginPath();
    ctx.arc(64, 64, 34, 0, Math.PI * 2);
    toon(ctx, c, 30, 30, 68, 68);
    ctx.strokeStyle = rgb(c2, 0.8);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(48, 50);
    ctx.lineTo(60, 64);
    ctx.lineTo(52, 72);
    ctx.lineTo(74, 84);
    ctx.stroke();
  },
  mask: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(18, 40);
    ctx.quadraticCurveTo(64, 20, 110, 40);
    ctx.quadraticCurveTo(110, 96, 64, 108);
    ctx.quadraticCurveTo(18, 96, 18, 40);
    toon(ctx, c, 18, 26, 92, 82);
    ctx.fillStyle = rgb(c2);
    for (const x of [44, 84]) {
      ctx.beginPath();
      ctx.ellipse(x, 58, 12, 8, x < 64 ? 0.3 : -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  bone: (ctx, c) => {
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-0.7);
    roundRectPath(ctx, -36, -9, 72, 18, 8);
    toon(ctx, c, -36, -9, 72, 18, { noShine: true });
    for (const x of [-38, 38])
      for (const y of [-10, 10]) {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        toon(ctx, c, x - 12, y - 12, 24, 24, { noShine: true, lineW: 3 });
      }
    ctx.restore();
  },
  star: (ctx, c, c2) => {
    glow(ctx, 64, 64, 60, c2, 0.5);
    starPath(ctx, 64, 64, 46, 20, 5);
    toon(ctx, c, 18, 18, 92, 92);
  },
  bell: (ctx, c, c2) => {
    ctx.beginPath();
    ctx.moveTo(30, 94);
    ctx.quadraticCurveTo(30, 30, 64, 24);
    ctx.quadraticCurveTo(98, 30, 98, 94);
    ctx.closePath();
    toon(ctx, c, 30, 24, 68, 70);
    roundRectPath(ctx, 24, 90, 80, 12, 6);
    toon(ctx, darken(c, 0.2), 24, 90, 80, 12, { noShine: true, lineW: 2.5 });
    ctx.beginPath();
    ctx.arc(64, 108, 8, 0, Math.PI * 2);
    toon(ctx, c2, 56, 100, 16, 16, { lineW: 2 });
  },
  bandage: (ctx, c, c2) => {
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-0.6);
    roundRectPath(ctx, -48, -16, 96, 32, 14);
    toon(ctx, c, -48, -16, 96, 32, { noShine: true });
    roundRectPath(ctx, -14, -12, 28, 24, 4);
    ctx.fillStyle = rgb(c2, 0.6);
    ctx.fill();
    ctx.restore();
  },
};

/** 名字中的颜色关键词 → 图标主色（按顺序匹配第一个） */
const NAME_COLORS: [RegExp, number][] = [
  [/红宝石|红|赤|血|火|烈|熔岩|辣|凤凰/, 0xe63946],
  [/蓝宝石|蓝|深海|海王/, 0x3a86ff],
  [/冰|雪|寒|霜|冻|极地/, 0x90e0ef],
  [/翡翠|绿|翠|草|叶|薄荷|毒|抹茶/, 0x2dc653],
  [/紫水晶|紫|魔|暗|混沌|虚空|深渊/, 0x9d4edd],
  [/黄金|金|黄|太阳|星|光明|神/, 0xffc300],
  [/银|钢|铁|铝/, 0xadb5bd],
  [/黑|影|夜|乌/, 0x3d3d4e],
  [/石英|钻石|水晶|白|圣|珍珠|玻璃/, 0xe8f4ff],
  [/粉|樱|桃|草莓|爱心/, 0xff8fab],
  [/橙|橘|南瓜|胡萝卜/, 0xff9f1c],
  [/玛瑙|棕|木|咖啡|巧克力|面包|吐司/, 0xb5651d],
];

/** 色相旋转（度） */
function hueRotate(c: number, deg: number): number {
  const r = ((c >> 16) & 255) / 255,
    g = ((c >> 8) & 255) / 255,
    b = (c & 255) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    l = (max + min) / 2;
  let h = 0,
    sat = 0;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  h = (h + deg + 360) % 360;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = sat * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

/** 叠加在造型内部的花纹（source-atop 只画在已有像素上） */
function overlayPattern(ctx: Ctx, kind: number, c2: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  if (kind === 1) {
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 9;
    for (let x = -40; x < 170; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 60, 128);
      ctx.stroke();
    }
  } else if (kind === 2) {
    ctx.fillStyle = rgb(c2, 0.45);
    for (let y = 18; y < 128; y += 22)
      for (let x = (y / 22) % 2 ? 18 : 29; x < 128; x += 22) {
        ellipsePath(ctx, x, y, 4.5, 4.5);
        ctx.fill();
      }
  } else if (kind === 3) {
    const gr = ctx.createRadialGradient(40, 36, 4, 40, 36, 70);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 128, 128);
  }
  ctx.restore();
}

export function itemIconKey(scene: Phaser.Scene, it: ItemDef): string {
  const key = `itemicon_${it.id}`;
  if (scene.textures.exists(`item_${it.id}`)) return `item_${it.id}`; // 外部美术覆盖
  return paint(scene, key, 128, 128, (ctx) => {
    const [shape, c0, c2] = it.icon ? [it.icon.shape, it.icon.color, it.icon.color2] : (HAND_ICONS[it.id] ?? ['orb', 0xffd166, 0xffffff]);
    // 同系列 10 件共用造型：按名字关键词或序号换主色，并按序号叠加不同花纹、角度与大小，保证每件图标都不同
    const m = /^(.+)_(\d+)$/.exec(it.id);
    const idx = m ? Number(m[2]) : hashStr(it.id) % 10;
    // 系列偏移：共用同一造型的不同系列，同序号道具也会得到不同的角度/花纹/大小/色相
    const sv = m ? hashStr(m[1]) : hashStr(it.id);
    const nameColor = NAME_COLORS.find(([re]) => re.test(it.nameZh ?? it.name))?.[1];
    const base = nameColor !== undefined ? hueRotate(nameColor, (idx - 4.5) * 6) : it.series ? hueRotate(c0, (idx - 4.5) * 16) : c0;
    const c = hueRotate(base, ((sv % 7) - 3) * 12);
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate((((idx * 37 + sv) % 9) - 4) * 0.06);
    const sc = 0.84 + ((idx + sv) % 4) * 0.055;
    // 奇偶系列镜像，进一步区分共用造型的系列
    ctx.scale((sv >> 3) % 2 ? -sc : sc, sc);
    ctx.translate(-64, -64);
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 4;
    (SHAPES[shape] ?? SHAPES.orb)(ctx, c, c2, rng(hashStr(it.id)));
    ctx.restore();
    overlayPattern(ctx, (idx + sv) % 4, c2);
    // 稀有度闪光：稀有 1 颗、史诗 2 颗、传说另有大星
    ctx.fillStyle = '#fff';
    for (let k = 0; k < Math.min(it.rarity, 2); k++) {
      starPath(ctx, 104 - k * 16, 20 + k * 10, 6 - k, 2.4, 4);
      ctx.fill();
    }
    if (it.rarity === 3) {
      starPath(ctx, 106, 22, 10, 4, 4);
      ctx.fill();
      starPath(ctx, 22, 104, 7, 3, 4);
      ctx.fill();
    }
  });
}

export { ellipsePath };
