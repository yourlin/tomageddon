// 精英词缀专属装饰：每个词缀一种一眼能认出来的造型，多个词缀叠加时分别绘制（最多 3 个）
import Phaser from 'phaser';
import { AFFIXES, type AffixId } from '../data/bosses';

type Draw = (gr: Phaser.GameObjects.Graphics, x: number, y: number, r: number, t: number, color: number) => void;

const star = (gr: Phaser.GameObjects.Graphics, x: number, y: number, r: number, n: number, inner = 0.45): void => {
  const pts: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr });
  }
  gr.fillPoints(pts, true);
};

const orbit = (n: number, x: number, y: number, r: number, t: number, speed: number, flat = 0.45) =>
  Array.from({ length: n }, (_, i) => {
    const a = t * speed + (i / n) * Math.PI * 2;
    return { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * flat, front: Math.sin(a) > 0 };
  });

/** 每个词缀的造型（x, y = 敌人中心；r = 敌人半径） */
const DRAW: Record<AffixId, Draw> = {
  // 迅捷：身后三道风线
  swift: (gr, x, y, r, t, c) => {
    for (let i = 0; i < 3; i++) {
      const off = ((t * 3 + i * 0.33) % 1) * 20;
      gr.lineStyle(3, c, 0.8).lineBetween(x - r - 6 - off, y - 8 + i * 8, x - r - 26 - off, y - 8 + i * 8);
    }
  },
  // 坚甲：六边形装甲外框 + 铆钉
  armored: (gr, x, y, r, _t, c) => {
    const pts = Array.from({ length: 6 }, (_, i) => ({
      x: x + Math.cos((i / 6) * Math.PI * 2) * (r + 6),
      y: y + Math.sin((i / 6) * Math.PI * 2) * (r + 6),
    }));
    gr.lineStyle(5, c, 0.9).strokePoints(pts, true);
    gr.fillStyle(0x495057, 1);
    for (const p of pts) gr.fillCircle(p.x, p.y, 3);
  },
  // 狂暴：头顶红色怒筋
  berserk: (gr, x, y, r, t, c) => {
    const s = 1 + Math.sin(t * 10) * 0.15;
    const hx = x + r * 0.5,
      hy = y - r - 4;
    gr.lineStyle(4, c, 1);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      gr.lineBetween(hx + Math.cos(a) * 3 * s, hy + Math.sin(a) * 3 * s, hx + Math.cos(a) * 10 * s, hy + Math.sin(a) * 10 * s);
    }
  },
  // 再生：绿色十字绕身漂浮
  regen: (gr, x, y, r, t, c) => {
    for (const p of orbit(3, x, y - r * 0.2, r + 12, t, 1.2)) {
      gr.fillStyle(c, p.front ? 1 : 0.5)
        .fillRect(p.x - 2, p.y - 6, 4, 12)
        .fillRect(p.x - 6, p.y - 2, 12, 4);
    }
  },
  // 冰霜：头顶一圈冰晶
  frost: (gr, x, y, r, t, c) => {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.45;
      const px = x + Math.cos(a) * (r + 2),
        py = y + Math.sin(a) * (r + 2);
      const len = 10 + Math.sin(t * 3 + i) * 2;
      gr.fillStyle(c, 0.95).fillTriangle(px - 4, py, px + 4, py, px + Math.cos(a) * len, py + Math.sin(a) * len);
    }
  },
  // 剧毒：身上往下滴绿色毒液
  venom: (gr, x, y, r, t, c) => {
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.9 + i / 3) % 1;
      const dx = x - r * 0.5 + i * r * 0.5;
      gr.fillStyle(c, 1 - k).fillEllipse(dx, y + r * 0.4 + k * 22, 6, 9);
    }
  },
  // 诅咒：头顶浮着一只紫色邪眼
  cursed: (gr, x, y, r, t, c) => {
    const ey = y - r - 18 + Math.sin(t * 3) * 3;
    gr.fillStyle(0x10002b, 0.9).fillEllipse(x, ey, 26, 14);
    gr.lineStyle(2, c, 1).strokeEllipse(x, ey, 26, 14);
    gr.fillStyle(c, 1).fillCircle(x + Math.sin(t * 2) * 4, ey, 4);
  },
  // 护盾：淡蓝色六角泡泡
  shielded: (gr, x, y, r, t, c) => {
    gr.lineStyle(2, c, 0.55 + Math.sin(t * 4) * 0.15).strokeCircle(x, y, r + 10);
    gr.fillStyle(c, 0.1).fillCircle(x, y, r + 10);
    gr.lineStyle(1.5, 0xffffff, 0.4);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + t * 0.3;
      gr.lineBetween(
        x + Math.cos(a) * (r + 10),
        y + Math.sin(a) * (r + 10),
        x + Math.cos(a + 1.05) * (r + 10),
        y + Math.sin(a + 1.05) * (r + 10),
      );
    }
  },
  // 爆裂：头顶点燃的引信，火花闪烁
  explosive: (gr, x, y, r, t, c) => {
    const tx = x + r * 0.3,
      ty = y - r - 2;
    gr.lineStyle(3, 0x6c584c, 1).lineBetween(tx, ty, tx + 6, ty - 12);
    const s = 5 + Math.sin(t * 20) * 2;
    gr.fillStyle(c, 1);
    star(gr, tx + 6, ty - 14, s + 3, 5);
    gr.fillStyle(0xfff3b0, 1).fillCircle(tx + 6, ty - 14, s * 0.5);
  },
  // 吸血：嘴边两颗獠牙 + 一对小蝠翼
  vampiric: (gr, x, y, r, t, c) => {
    gr.fillStyle(0xffffff, 1).fillTriangle(x - 7, y + r * 0.3, x - 3, y + r * 0.3, x - 5, y + r * 0.3 + 9);
    gr.fillTriangle(x + 3, y + r * 0.3, x + 7, y + r * 0.3, x + 5, y + r * 0.3 + 9);
    const flap = Math.sin(t * 8) * 4;
    gr.fillStyle(c, 0.9);
    for (const sd of [-1, 1])
      gr.fillTriangle(x + sd * r * 0.9, y - 4, x + sd * (r + 18), y - 14 - flap, x + sd * (r + 14), y + 6 + flap * 0.5);
  },
  // 荆棘：外圈尖刺
  thorny: (gr, x, y, r, t, c) => {
    gr.fillStyle(c, 1);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + t * 0.4;
      gr.fillTriangle(
        x + Math.cos(a - 0.15) * r,
        y + Math.sin(a - 0.15) * r,
        x + Math.cos(a + 0.15) * r,
        y + Math.sin(a + 0.15) * r,
        x + Math.cos(a) * (r + 12),
        y + Math.sin(a) * (r + 12),
      );
    }
  },
  // 统帅：头顶金色王冠 + 地面号令圈
  commander: (gr, x, y, r, t, c) => {
    const cy = y - r - 10;
    gr.fillStyle(c, 1).fillPoints(
      [
        { x: x - 14, y: cy + 6 },
        { x: x - 14, y: cy - 6 },
        { x: x - 7, y: cy },
        { x, y: cy - 10 },
        { x: x + 7, y: cy },
        { x: x + 14, y: cy - 6 },
        { x: x + 14, y: cy + 6 },
      ],
      true,
    );
    gr.fillStyle(0xe63946, 1).fillCircle(x, cy + 1, 2.5);
    gr.lineStyle(2, c, 0.35 + Math.sin(t * 3) * 0.15).strokeEllipse(x, y + r * 0.8, r * 5, r * 1.8);
  },
  // 巨大：脚下深色裂纹底座
  giant: (gr, x, y, r, _t, c) => {
    gr.fillStyle(0x000000, 0.25).fillEllipse(x, y + r * 0.9, r * 2.8, r * 0.9);
    gr.lineStyle(3, c, 0.9);
    for (const sd of [-1, 1])
      gr.lineBetween(x + sd * r * 0.6, y + r * 0.9, x + sd * r * 1.3, y + r * 1.05).lineBetween(
        x + sd * r * 1.0,
        y + r * 0.95,
        x + sd * r * 1.2,
        y + r * 0.7,
      );
  },
  // 残暴：身后交叉的两把刀
  brutal: (gr, x, y, r, _t, c) => {
    gr.lineStyle(5, 0xadb5bd, 1)
      .lineBetween(x - r - 6, y - r - 6, x + r - 2, y + 2)
      .lineBetween(x + r + 6, y - r - 6, x - r + 2, y + 2);
    gr.lineStyle(5, c, 1)
      .lineBetween(x - r - 10, y - r - 10, x - r - 2, y - r - 2)
      .lineBetween(x + r + 10, y - r - 10, x + r + 2, y - r - 2);
  },
  // 灼热：身体周围窜动的火苗
  burning: (gr, x, y, r, t, c) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const h = 10 + Math.sin(t * 14 + i * 2) * 5;
      const px = x + Math.cos(a) * r * 0.85,
        py = y + Math.sin(a) * r * 0.6;
      gr.fillStyle(i % 2 ? c : 0xffd166, 0.85).fillTriangle(px - 5, py, px + 5, py, px, py - h);
    }
  },
  // 撕裂：身上三道爪痕
  bleeding: (gr, x, y, r, _t, c) => {
    gr.lineStyle(3, c, 1);
    for (let i = -1; i <= 1; i++) gr.lineBetween(x + i * 8 - 6, y - r * 0.5, x + i * 8 + 6, y + r * 0.5);
  },
  // 衰弱：头顶灰色向下箭头
  weakening: (gr, x, y, r, t, c) => {
    const ay = y - r - 16 + ((t * 20) % 8);
    gr.fillStyle(c, 1)
      .fillTriangle(x - 8, ay, x + 8, ay, x, ay + 10)
      .fillRect(x - 3, ay - 10, 6, 10);
  },
  // 不屈：头上一对公牛角
  unstoppable: (gr, x, y, r, _t, c) => {
    gr.fillStyle(c, 1);
    for (const sd of [-1, 1]) gr.fillTriangle(x + sd * r * 0.3, y - r * 0.7, x + sd * r * 0.75, y - r * 0.5, x + sd * (r + 10), y - r - 12);
  },
  // 富有：绕身旋转的金币 + 闪光
  rich: (gr, x, y, r, t, c) => {
    for (const p of orbit(4, x, y, r + 14, t, 2)) {
      gr.fillStyle(c, p.front ? 1 : 0.55).fillEllipse(p.x, p.y, 10, 12);
      gr.fillStyle(0xb08900, p.front ? 1 : 0.55).fillRect(p.x - 1, p.y - 3, 2, 6);
    }
    if (Math.sin(t * 5) > 0.7) {
      gr.fillStyle(0xffffff, 1);
      star(gr, x + r * 0.6, y - r * 0.6, 6, 4, 0.3);
    }
  },
  // 分裂：身体中间一道虚线裂缝 + 两侧小分身轮廓
  splitting: (gr, x, y, r, t, c) => {
    gr.lineStyle(3, c, 0.9);
    for (let k = -r; k < r; k += 8) gr.lineBetween(x + Math.sin(k) * 2, y + k, x + Math.sin(k + 4) * 2, y + k + 4);
    const o = 4 + Math.sin(t * 4) * 3;
    gr.lineStyle(2, c, 0.5)
      .strokeCircle(x - r - o, y + 4, r * 0.35)
      .strokeCircle(x + r + o, y + 4, r * 0.35);
  },
};

/** 绘制一个敌人的全部词缀装饰（graphics 需每帧 clear 后调用） */
export function drawAffixDeco(gr: Phaser.GameObjects.Graphics, affixes: AffixId[], x: number, y: number, r: number, t: number): void {
  for (const id of affixes.slice(0, 3)) DRAW[id]?.(gr, x, y, r, t, AFFIXES[id].color);
}

export const AFFIX_DECO_IDS = Object.keys(DRAW) as AffixId[];
