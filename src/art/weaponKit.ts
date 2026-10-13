// 武器绘制公共部件：手柄、金属件（WeaponArt 与 src/art/weapons/* 共用）。画布 128×64，手柄在左、朝右，中线 y = 32
import { type Ctx, rgb, darken, lighten, toon, roundRectPath, OUTLINE } from './Painter';

/** 木纹手柄：x0~x1、中线 y、粗细 h */
export const handle = (ctx: Ctx, x0: number, x1: number, y: number, h: number, c = 0x8d5b3a) => {
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

/** 给当前路径填金属渐变 + 描边（先画好路径再调用） */
export const metal = (ctx: Ctx, x: number, y: number, w: number, h: number, c = 0xc9d1d9) => {
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
