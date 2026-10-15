// 场地运行中变化的画面与结算：缩场遮罩、淹没区域、临时障碍物，以及变化前的 1.5 秒预警。
// 场地几何在 systems/Arena.ts；这里只负责「画出来」和「站在淹没区里受伤」。设计见 docs/design/ARENAS.md 3.5
import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { ArenaChange, FloodArea, Obstacle } from './Arena';

/** 预警时长（秒）：变化生效前先闪烁提示 */
export const ARENA_WARN = 1.5;
/** 淹没区伤害结算间隔（秒） */
const FLOOD_TICK = 0.5;

export class ArenaFx {
  private shrinkMaskG: Phaser.GameObjects.Graphics;
  private shrinkFill: Phaser.GameObjects.Rectangle;
  private floodG: Phaser.GameObjects.Graphics;
  private obsG: Phaser.GameObjects.Graphics;
  private warnG: Phaser.GameObjects.Graphics;
  private version = -1;
  private floodTick = 0;
  private warns: { t: number; draw: (g: Phaser.GameObjects.Graphics, k: number) => void }[] = [];

  constructor(private g: GameScene) {
    const A = g.arena;
    // 缩场：整块场外颜色铺满，用「当前场地形状」做反向遮罩 → 只有收缩出去的部分可见
    this.shrinkMaskG = g.make.graphics({}, false);
    const mask = this.shrinkMaskG.createGeometryMask();
    mask.setInvertAlpha(true);
    this.shrinkFill = g.add
      .rectangle(A.centerX, A.centerY, A.width + 400, A.height + 400, 0x2b1a10, 0.85)
      .setDepth(0.9)
      .setMask(mask)
      .setVisible(false);
    this.floodG = g.add.graphics().setDepth(0.8);
    this.obsG = g.add.graphics().setDepth(1);
    this.warnG = g.add.graphics().setDepth(0.95);
  }

  /** 预警 ARENA_WARN 秒后施加变化 */
  change(c: ArenaChange, warn = ARENA_WARN): void {
    const A = this.g.arena;
    let draw: (gr: Phaser.GameObjects.Graphics, k: number) => void;
    if (c.kind === 'shrink') {
      draw = (gr, k) => {
        // 新边界：红色虚线圈随预警闪烁
        gr.lineStyle(6, 0xff3b30, 0.4 + 0.5 * Math.abs(Math.sin(k * 12)));
        this.traceScaled(gr, c.to);
        gr.strokePath();
      };
    } else if (c.kind === 'flood') {
      draw = (gr, k) => {
        gr.fillStyle(c.color ?? 0xc0392b, 0.12 + 0.18 * Math.abs(Math.sin(k * 10)));
        this.fillArea(gr, c.area);
      };
    } else {
      draw = (gr, k) => {
        gr.lineStyle(5, 0xffd166, 0.4 + 0.5 * Math.abs(Math.sin(k * 12)));
        for (const o of c.obstacles) this.strokeObstacle(gr, o);
      };
    }
    if (warn <= 0) {
      A.apply(c);
      return;
    }
    this.warns.push({ t: warn, draw });
    this.g.time.delayedCall(warn * 1000, () => {
      if (this.g.arena === A) A.apply(c);
    });
  }

  update(dt: number): void {
    const A = this.g.arena;
    A.update(dt);
    // 预警
    this.warnG.clear();
    for (const w of this.warns) {
      w.t -= dt;
      w.draw(this.warnG, w.t);
    }
    this.warns = this.warns.filter((w) => w.t > 0);
    // 淹没区：闪烁的半透明色块（每帧画，带波动）
    this.floodG.clear();
    for (const f of A.floods) {
      const fade = Math.min(1, f.t / 0.6);
      this.floodG.fillStyle(f.color, (0.38 + 0.06 * Math.sin(this.g.time.now / 180)) * fade);
      this.fillArea(this.floodG, f.area);
    }
    if (A.version !== this.version) {
      this.version = A.version;
      // 缩场遮罩
      this.shrinkMaskG.clear();
      this.shrinkMaskG.fillStyle(0xffffff, 1);
      this.traceScaled(this.shrinkMaskG, A.scale);
      this.shrinkMaskG.fillPath();
      this.shrinkFill.setVisible(A.scale < 0.999);
      // 临时障碍物（常驻障碍物画在地图贴图里）
      this.obsG.clear();
      const base = new Set(A.def.obstacles ?? []);
      for (const o of A.obstacles) {
        if (base.has(o)) continue;
        this.obsG.fillStyle(0x000000, 0.3);
        this.fillObstacle(this.obsG, o, 8, 10);
        const col = o.color ?? 0x5a3d26;
        this.obsG.fillStyle(col, 1);
        this.fillObstacle(this.obsG, o);
        if (o.look === 'scoop' && o.kind === 'circle') {
          // 冰淇淋球：高光 + 底部融化的奶油滴
          this.obsG.fillStyle(0xffffff, 0.45).fillCircle(o.x - o.r * 0.35, o.y - o.r * 0.35, o.r * 0.28);
          for (let i = -2; i <= 2; i++)
            this.obsG.fillStyle(col, 1).fillEllipse(o.x + i * o.r * 0.32, o.y + o.r * 0.85, o.r * 0.26, o.r * 0.5);
          this.obsG.lineStyle(4, 0x000000, 0.2);
        } else if (o.look === 'vine' && o.kind === 'circle') {
          // 藤蔓：一圈尖刺 + 叶片
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            this.obsG
              .fillStyle(0x33691e, 1)
              .fillTriangle(
                o.x + Math.cos(a - 0.25) * o.r,
                o.y + Math.sin(a - 0.25) * o.r,
                o.x + Math.cos(a + 0.25) * o.r,
                o.y + Math.sin(a + 0.25) * o.r,
                o.x + Math.cos(a) * o.r * 1.45,
                o.y + Math.sin(a) * o.r * 1.45,
              );
          }
          this.obsG.fillStyle(0x9ccc65, 1).fillEllipse(o.x - o.r * 0.2, o.y - o.r * 0.2, o.r * 0.7, o.r * 0.35);
          this.obsG.lineStyle(4, 0x1b5e20, 1);
        } else this.obsG.lineStyle(4, 0x2b1a10, 1);
        this.strokeObstacle(this.obsG, o);
      }
    }
    // 站在淹没区里：每 FLOOD_TICK 秒受伤并减速
    const p = this.g.player;
    const f = A.floodAt(p.x, p.y);
    if (f) {
      this.floodTick -= dt;
      if (this.floodTick <= 0) {
        this.floodTick = FLOOD_TICK;
        this.g.damagePlayer(Math.max(1, Math.round(f.dps * FLOOD_TICK)));
        if (f.slow) this.g.applyPlayerStatus([{ id: 'slow', dur: 0.8, stacks: Math.max(1, Math.round(f.slow / 15)) }]);
      }
    } else this.floodTick = 0;
  }

  destroy(): void {
    for (const o of [this.shrinkFill, this.floodG, this.obsG, this.warnG, this.shrinkMaskG]) o.destroy();
  }

  // ---------- 绘制辅助 ----------

  /** 按缩放比例 k 描场地形状（以外接矩形中心为基准） */
  private traceScaled(gr: Phaser.GameObjects.Graphics, k: number): void {
    const A = this.g.arena;
    const cx = A.centerX,
      cy = A.centerY;
    const T = (x: number, y: number): [number, number] => [cx + (x - cx) * k, cy + (y - cy) * k];
    const outline = A.def.outline;
    const shape = outline ? ({ kind: 'polygon', pts: outline } as const) : A.def.shape;
    const poly = (pts: [number, number][]) => {
      gr.beginPath();
      pts.forEach(([x, y], i) => {
        const [px, py] = T(x, y);
        if (i) gr.lineTo(px, py);
        else gr.moveTo(px, py);
      });
      gr.closePath();
    };
    const walk = (s: typeof shape): void => {
      switch (s.kind) {
        case 'rect':
          poly([
            [0, 0],
            [s.w, 0],
            [s.w, s.h],
            [0, s.h],
          ]);
          break;
        case 'roundRect': {
          const pts: [number, number][] = [];
          const r = Math.min(s.r, s.w / 2, s.h / 2);
          const corners: [number, number, number][] = [
            [s.w - r, r, -Math.PI / 2],
            [s.w - r, s.h - r, 0],
            [r, s.h - r, Math.PI / 2],
            [r, r, Math.PI],
          ];
          for (const [ccx, ccy, a0] of corners)
            for (let i = 0; i <= 6; i++) {
              const a = a0 + (i / 6) * (Math.PI / 2);
              pts.push([ccx + Math.cos(a) * r, ccy + Math.sin(a) * r]);
            }
          poly(pts);
          break;
        }
        case 'ellipse':
          poly(
            Array.from({ length: 48 }, (_, i) => {
              const a = (i / 48) * Math.PI * 2;
              return [s.rx + Math.cos(a) * s.rx, s.ry + Math.sin(a) * s.ry] as [number, number];
            }),
          );
          break;
        case 'polygon':
          poly(s.pts);
          break;
        case 'union':
          for (const q of s.parts) walk(q);
          break;
      }
    };
    walk(shape);
  }

  private fillArea(gr: Phaser.GameObjects.Graphics, area: FloodArea): void {
    const A = this.g.arena;
    if ('circle' in area) {
      gr.fillCircle(area.circle[0], area.circle[1], area.circle[2]);
      return;
    }
    const m = 200;
    const L = A.left - m,
      T = A.top - m,
      W = A.width + m * 2,
      H = A.height + m * 2;
    if (area.half === 'left') gr.fillRect(L, T, A.centerX - L, H);
    else if (area.half === 'right') gr.fillRect(A.centerX, T, A.right + m - A.centerX, H);
    else if (area.half === 'top') gr.fillRect(L, T, W, A.centerY - T);
    else gr.fillRect(L, A.centerY, W, A.bottom + m - A.centerY);
  }

  private fillObstacle(gr: Phaser.GameObjects.Graphics, o: Obstacle, ox = 0, oy = 0): void {
    if (o.kind === 'circle') gr.fillCircle(o.x + ox, o.y + oy, o.r);
    else gr.fillRoundedRect(o.x + ox, o.y + oy, o.w, o.h, 8);
  }

  private strokeObstacle(gr: Phaser.GameObjects.Graphics, o: Obstacle): void {
    if (o.kind === 'circle') gr.strokeCircle(o.x, o.y, o.r);
    else gr.strokeRoundedRect(o.x, o.y, o.w, o.h, 8);
  }
}
