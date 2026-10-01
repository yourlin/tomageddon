// 天赋树界面：每个专精方向是一张「地图」，核心天赋居中，道路向外延展；不同方向有各自的地形背景
import Phaser from 'phaser';
import { text, button, panel, COLORS, autoRelayout, toast } from '../ui/UI';
import { BRANCHES, BRANCH_MAP, TALENT_NODES, branchCost, type BranchId, type TalentNode, type NodeKind } from '../data/talentTree';
import {
  rankOf,
  raise,
  lower,
  raiseBlock,
  canLower,
  resetBranch,
  branchSpent,
  talentPointsFree,
  talentPointsEarned,
  talentPointsTotal,
  nodeText,
} from '../systems/TalentTree';
import { tx, lang } from '../i18n';
import { audio } from '../systems/Audio';

const MAP = { x: 20, y: 128, w: 860, h: 572 };
const NODE_R: Record<NodeKind, number> = { core: 34, minor: 21, notable: 25, star: 27, keystone: 38 };
const KIND_NAME: Record<NodeKind, [string, string]> = {
  core: ['核心天赋', 'Core'],
  minor: ['属性天赋', 'Attribute'],
  notable: ['特殊能力', 'Ability'],
  star: ['明星天赋 · 可点 5 级', 'Star talent · up to 5 ranks'],
  keystone: ['终极天赋', 'Keystone'],
};
const pick = (t: [string, string]): string => (lang === 'en' ? t[1] : t[0]);

export class TalentTreeScene extends Phaser.Scene {
  private branch: BranchId = 'might';
  private selected: TalentNode | null = null;
  private layer!: Phaser.GameObjects.Container;
  private tabs: ReturnType<typeof button>[] = [];
  private pointsText!: Phaser.GameObjects.Text;

  constructor() {
    super('TalentTree');
  }

  create(): void {
    autoRelayout(this);
    const W = this.scale.width;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    text(this, 24, 18, tx('天赋树', 'Talent Tree'), 36);
    this.pointsText = text(this, 200, 30, '', 20, '#ffd166');
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);
    button(
      this,
      W - 250,
      44,
      160,
      52,
      tx('全部重置', 'Reset all'),
      () => {
        resetBranch();
        audio.play(this, 'buy');
        toast(this, tx('天赋已全部重置', 'All talents reset'), '#52ff8a');
        this.draw();
      },
      0x7a2e35,
      19,
    );
    const tw = (W - 40) / BRANCHES.length;
    this.tabs = BRANCHES.map((b, i) =>
      button(
        this,
        20 + tw / 2 + i * tw,
        100,
        tw - 8,
        44,
        '',
        () => {
          this.branch = b.id;
          this.selected = null;
          this.draw();
        },
        b.color,
        18,
      ),
    );
    this.layer = this.add.container(0, 0);
    this.draw();
  }

  private draw(): void {
    this.layer.removeAll(true);
    const b = BRANCH_MAP[this.branch];
    const free = talentPointsFree();
    this.pointsText.setText(
      tx(
        `可用天赋点 ${free} · 已获得 ${talentPointsEarned()} / ${talentPointsTotal()}（完成里程碑成就获得）`,
        `Free points ${free} · earned ${talentPointsEarned()} / ${talentPointsTotal()} (from milestone achievements)`,
      ),
    );
    BRANCHES.forEach((x, i) => {
      this.tabs[i].setLabel(`${pick(x.name)}  ${branchSpent(x.id)}/${branchCost(x.id)}`);
      this.tabs[i].setAlpha(x.id === this.branch ? 1 : 0.55);
    });
    this.drawLand(b.id);
    this.drawRoads();
    for (const n of TALENT_NODES) if (n.branch === this.branch) this.drawNode(n);
    this.drawInfo();
  }

  // ---------------- 地图背景 ----------------
  private drawLand(id: BranchId): void {
    const { x, y, w, h } = MAP;
    const g = this.add.graphics();
    this.layer.add(g);
    const rnd = new Phaser.Math.RandomDataGenerator([id]);
    const R = (a: number, b: number) => rnd.realInRange(a, b);
    const P = () => [R(x + 10, x + w - 10), R(y + 10, y + h - 10)] as const;
    const LAND: Record<BranchId, { base: [number, number]; draw: () => void }> = {
      might: {
        base: [0x2a0a06, 0x4a130b],
        draw: () => {
          // 熔岩河：几条发光的弯曲河道 + 余烬
          for (let k = 0; k < 4; k++) {
            const pts: Phaser.Math.Vector2[] = [];
            let px = x - 20,
              py = R(y, y + h);
            while (px < x + w + 20) {
              pts.push(new Phaser.Math.Vector2(px, py));
              px += R(60, 120);
              py = Phaser.Math.Clamp(py + R(-70, 70), y, y + h);
            }
            const curve = new Phaser.Curves.Spline(pts);
            g.lineStyle(18, 0xff5400, 0.18).strokePoints(curve.getPoints(80));
            g.lineStyle(6, 0xff9e00, 0.5).strokePoints(curve.getPoints(80));
          }
          for (let k = 0; k < 26; k++) {
            const [cx, cy] = P();
            g.lineStyle(2, 0x1a0503, 0.7);
            g.beginPath().moveTo(cx, cy);
            let lx = cx,
              ly = cy;
            for (let s = 0; s < 4; s++) {
              lx += R(-22, 22);
              ly += R(-22, 22);
              g.lineTo(lx, ly);
            }
            g.strokePath();
          }
          for (let k = 0; k < 70; k++) {
            const [cx, cy] = P();
            g.fillStyle(rnd.pick([0xffb703, 0xff7b00, 0xff4b3e]), R(0.25, 0.7)).fillCircle(cx, cy, R(1, 3));
          }
        },
      },
      guard: {
        base: [0x0b1e33, 0x14365a],
        draw: () => {
          // 冰原浮冰 + 堡垒城墙 + 雪
          for (let k = 0; k < 14; k++) {
            const [cx, cy] = P();
            const r = R(30, 80),
              pts: Phaser.Math.Vector2[] = [];
            for (let s = 0; s < 7; s++) {
              const a = (s / 7) * Math.PI * 2 + R(-0.3, 0.3);
              pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r * R(0.6, 1), cy + Math.sin(a) * r * 0.6 * R(0.6, 1)));
            }
            g.fillStyle(0xcaf0f8, 0.1).fillPoints(pts, true);
            g.lineStyle(2, 0x90e0ef, 0.25).strokePoints(pts, true);
          }
          // 城墙：地图四周的砖墙
          g.fillStyle(0x6c757d, 0.35);
          for (let bx = x; bx < x + w; bx += 34) {
            g.fillRect(bx + 2, y + 2, 30, 12);
            g.fillRect(bx + 2, y + h - 14, 30, 12);
          }
          for (let k = 0; k < 90; k++) {
            const [cx, cy] = P();
            g.fillStyle(0xffffff, R(0.25, 0.7)).fillCircle(cx, cy, R(0.8, 2.2));
          }
        },
      },
      agility: {
        base: [0x0b2416, 0x1b4332],
        draw: () => {
          // 森林：成簇的树冠 + 风的流线
          for (let k = 0; k < 60; k++) {
            const [cx, cy] = P();
            const r = R(10, 22);
            g.fillStyle(rnd.pick([0x2d6a4f, 0x40916c, 0x1b4332]), 0.7);
            g.fillCircle(cx, cy, r)
              .fillCircle(cx + r * 0.7, cy + r * 0.3, r * 0.8)
              .fillCircle(cx - r * 0.6, cy + r * 0.4, r * 0.7);
            g.fillStyle(0x081c15, 0.5).fillEllipse(cx, cy + r * 0.9, r * 2.2, r * 0.5);
          }
          for (let k = 0; k < 12; k++) {
            const [cx, cy] = P();
            const len = R(60, 140);
            g.lineStyle(2, 0xd8f3dc, 0.25);
            g.beginPath().arc(cx, cy, len, -0.5, 0.3).strokePath();
          }
        },
      },
      arcane: {
        base: [0x10002b, 0x240046],
        draw: () => {
          // 星空：星云、群星与星座连线
          for (let k = 0; k < 6; k++) {
            const [cx, cy] = P();
            g.fillStyle(rnd.pick([0x7b2cbf, 0x5a189a, 0x3c096c]), 0.2).fillEllipse(cx, cy, R(160, 320), R(80, 160));
          }
          for (let k = 0; k < 150; k++) {
            const [cx, cy] = P();
            g.fillStyle(0xffffff, R(0.2, 0.9)).fillCircle(cx, cy, R(0.5, 1.8));
          }
          for (let k = 0; k < 5; k++) {
            let [cx, cy] = P();
            g.lineStyle(1, 0xe0aaff, 0.35);
            for (let s = 0; s < 4; s++) {
              const nx = cx + R(-60, 60),
                ny = cy + R(-40, 40);
              g.lineBetween(cx, cy, nx, ny);
              g.fillStyle(0xe0aaff, 0.9).fillCircle(nx, ny, 2.2);
              cx = nx;
              cy = ny;
            }
          }
        },
      },
      fortune: {
        base: [0x3a2a05, 0x5c4210],
        draw: () => {
          // 麦田：一垄垄麦穗 + 阳光 + 篱笆
          for (let row = y + 20; row < y + h; row += 26) {
            const off = R(-10, 10);
            for (let cx = x + off; cx < x + w; cx += 9) {
              const hgt = R(6, 12);
              g.lineStyle(2, rnd.pick([0xe9c46a, 0xf4a261, 0xffd166]), 0.22).lineBetween(cx, row, cx + 2, row - hgt);
            }
          }
          for (let k = 0; k < 9; k++) {
            const a = -Math.PI / 2 + (k - 4) * 0.18;
            g.lineStyle(14, 0xfff3b0, 0.05).lineBetween(
              x + w - 60,
              y + 40,
              x + w - 60 + Math.cos(a + Math.PI) * 600,
              y + 40 - Math.sin(a) * 600,
            );
          }
          g.fillStyle(0xffe066, 0.5).fillCircle(x + w - 60, y + 40, 26);
          g.lineStyle(3, 0x6b4f1d, 0.6);
          for (let fx = x + 30; fx < x + 260; fx += 22) g.lineBetween(fx, y + h - 50, fx, y + h - 26);
          g.lineBetween(x + 30, y + h - 44, x + 258, y + h - 44).lineBetween(x + 30, y + h - 32, x + 258, y + h - 32);
        },
      },
      alchemy: {
        base: [0x041f1a, 0x0b3d33],
        draw: () => {
          // 毒沼：浑浊水洼、气泡与芦苇
          for (let k = 0; k < 16; k++) {
            const [cx, cy] = P();
            g.fillStyle(rnd.pick([0x2a9d8f, 0x06d6a0, 0x118ab2]), 0.14).fillEllipse(cx, cy, R(70, 180), R(30, 80));
          }
          for (let k = 0; k < 40; k++) {
            const [cx, cy] = P();
            const r = R(2, 7);
            g.lineStyle(1.5, 0xb7e4c7, 0.5).strokeCircle(cx, cy, r);
            g.fillStyle(0xffffff, 0.35).fillCircle(cx - r * 0.3, cy - r * 0.3, r * 0.25);
          }
          for (let k = 0; k < 30; k++) {
            const [cx, cy] = P();
            g.lineStyle(2, 0x588157, 0.6).lineBetween(cx, cy, cx + R(-4, 4), cy - R(14, 26));
          }
        },
      },
    };
    const land = LAND[id];
    g.fillGradientStyle(land.base[0], land.base[0], land.base[1], land.base[1], 1).fillRect(x, y, w, h);
    land.draw();
    // 羊皮纸地图边框、指南针与地名牌
    const b = BRANCH_MAP[id];
    g.lineStyle(6, 0x2b1a10, 1).strokeRoundedRect(x, y, w, h, 14);
    g.lineStyle(2, b.color, 0.8).strokeRoundedRect(x + 6, y + 6, w - 12, h - 12, 10);
    const cx = x + w - 52,
      cy = y + h - 52;
    g.lineStyle(2, 0xfff4ea, 0.45).strokeCircle(cx, cy, 30);
    g.fillStyle(0xfff4ea, 0.5)
      .fillTriangle(cx, cy - 34, cx - 6, cy, cx + 6, cy)
      .fillTriangle(cx, cy + 34, cx - 6, cy, cx + 6, cy);
    g.fillStyle(0xfff4ea, 0.3)
      .fillTriangle(cx - 34, cy, cx, cy - 6, cx, cy + 6)
      .fillTriangle(cx + 34, cy, cx, cy - 6, cx, cy + 6);
    this.layer.add(
      text(this, cx, cy - 46, 'N', 14, '#fff4ea')
        .setOrigin(0.5)
        .setAlpha(0.6),
    );
    const sign = panel(this, x + 18, y + 16, 230, 58, 0x2b1a10, b.color);
    sign.setAlpha(0.92);
    this.layer.add(sign);
    this.layer.add(text(this, x + 32, y + 22, `${pick(b.name)} · ${pick(b.land)}`, 20, b.css, { fontStyle: 'bold' }));
    this.layer.add(text(this, x + 32, y + 48, pick(b.desc), 13, COLORS.textDim));
  }

  /** 每个方向按自身范围拉伸铺满地图（各方向道路长短不同） */
  private pos(n: TalentNode): [number, number] {
    const list = TALENT_NODES.filter((x) => x.branch === n.branch);
    const mx = Math.max(...list.map((x) => Math.abs(x.x))),
      my = Math.max(...list.map((x) => Math.abs(x.y)));
    const kx = (MAP.w / 2 - 80) / Math.max(1, mx),
      ky = (MAP.h / 2 - 70) / Math.max(1, my);
    return [MAP.x + MAP.w / 2 + n.x * kx, MAP.y + MAP.h / 2 + 18 + n.y * ky];
  }

  /** 道路：未开通为虚线，已开通为亮色实线 */
  private drawRoads(): void {
    const g = this.add.graphics();
    this.layer.add(g);
    const color = BRANCH_MAP[this.branch].color;
    for (const n of TALENT_NODES) {
      if (n.branch !== this.branch || !n.parent) continue;
      const p = TALENT_NODES.find((x) => x.id === n.parent)!;
      const [x1, y1] = this.pos(p),
        [x2, y2] = this.pos(n);
      const lit = rankOf(n.id) > 0;
      if (lit) {
        g.lineStyle(9, color, 0.25).lineBetween(x1, y1, x2, y2);
        g.lineStyle(4, color, 1).lineBetween(x1, y1, x2, y2);
        continue;
      }
      const len = Math.hypot(x2 - x1, y2 - y1),
        dx = (x2 - x1) / len,
        dy = (y2 - y1) / len;
      g.lineStyle(3, 0xfff4ea, rankOf(p.id) > 0 ? 0.6 : 0.25);
      for (let d = 0; d < len; d += 14)
        g.lineBetween(x1 + dx * d, y1 + dy * d, x1 + dx * Math.min(len, d + 7), y1 + dy * Math.min(len, d + 7));
    }
  }

  private drawNode(n: TalentNode): void {
    const [x, y] = this.pos(n);
    const r = NODE_R[n.kind],
      rank = rankOf(n.id),
      b = BRANCH_MAP[n.branch];
    const can = !raiseBlock(n),
      maxed = rank >= n.max,
      locked = rank === 0 && !can && raiseBlock(n) !== 'points';
    const g = this.add.graphics();
    this.layer.add(g);
    if (this.selected?.id === n.id) g.lineStyle(4, 0xffffff, 1).strokeCircle(x, y, r + 9);
    // 外框：明星天赋是星形光芒，终极天赋是六边形
    if (n.kind === 'star' || n.kind === 'keystone') {
      const k = n.kind === 'keystone' ? 6 : 10,
        pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 - Math.PI / 2;
        const rr = n.kind === 'keystone' ? r + 8 : i % 2 ? r + 2 : r + 10;
        pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
      }
      g.fillStyle(maxed ? 0xffd166 : rank ? b.color : 0x3a3a3a, locked ? 0.4 : 0.9).fillPoints(pts, true);
    }
    g.fillStyle(0x000000, 0.45).fillCircle(x + 2, y + 4, r);
    g.fillStyle(rank ? b.color : 0x2b2b2b, locked ? 0.55 : 1).fillCircle(x, y, r);
    g.lineStyle(n.kind === 'minor' ? 3 : 4, maxed ? 0xffd166 : rank ? 0xfff4ea : can ? b.color : 0x6c6c6c, 1).strokeCircle(x, y, r);
    if (can && !rank) {
      // 可以点的天赋：呼吸光圈
      const halo = this.add.circle(x, y, r + 5).setStrokeStyle(3, b.color, 0.9);
      this.tweens.add({ targets: halo, scale: 1.18, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });
      this.layer.add(halo);
    }
    const icon = text(this, x, y, n.icon, Math.round(r * 1.05)).setOrigin(0.5);
    if (locked) icon.setAlpha(0.4);
    this.layer.add(icon);
    if (n.max > 1 || rank)
      this.layer.add(
        text(this, x, y + r + 11, `${rank}/${n.max}`, 14, maxed ? '#ffd166' : rank ? '#fff4ea' : COLORS.textDim, {
          strokeThickness: 4,
        }).setOrigin(0.5),
      );
    const hit = this.add.circle(x, y, r + 8, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => {
      this.selected = n;
      this.draw();
    });
    this.layer.add(hit);
  }

  // ---------------- 右侧信息栏 ----------------
  private drawInfo(): void {
    const W = this.scale.width;
    const x = MAP.x + MAP.w + 14,
      y = MAP.y,
      w = W - x - 20,
      h = MAP.h;
    const b = BRANCH_MAP[this.branch];
    this.layer.add(panel(this, x, y, w, h, COLORS.panel, b.color));
    const spent = branchSpent(this.branch),
      cost = branchCost(this.branch);
    this.layer.add(text(this, x + 18, y + 14, `${pick(b.name)} · ${spent} / ${cost}`, 22, b.css, { fontStyle: 'bold' }));
    const bar = this.add.graphics();
    bar.fillStyle(0x1a0a0c, 1).fillRoundedRect(x + 18, y + 46, w - 36, 10, 5);
    if (spent) bar.fillStyle(b.color, 1).fillRoundedRect(x + 18, y + 46, Math.max(10, ((w - 36) * spent) / cost), 10, 5);
    this.layer.add(bar);
    this.layer.add(
      button(
        this,
        x + w - 80,
        y + 82,
        130,
        36,
        tx('重置本方向', 'Reset branch'),
        () => {
          resetBranch(this.branch);
          this.selected = null;
          this.draw();
        },
        0x7a2e35,
        15,
      ),
    );
    const n = this.selected;
    if (!n) {
      this.layer.add(
        text(
          this,
          x + 18,
          y + 120,
          tx(
            '点击地图上的天赋查看详情并加点。\n\n· 从中心的核心天赋开始，沿道路向外解锁\n· 少数明星天赋可以点 5 级\n· 终极天赋需要在本方向投入足够的点数\n· 天赋可随时免费重置\n· 全部天赋点大约够精通 2 个半方向',
            'Tap a talent on the map to see details and spend points.\n\n· Start from the core in the middle and follow the roads outward\n· A few star talents go up to 5 ranks\n· Keystones need enough points spent in the branch\n· Reset any time for free\n· All points together master about 2.5 branches',
          ),
          16,
          COLORS.text,
          { wordWrap: { width: w - 36, useAdvancedWrap: true }, lineSpacing: 6 },
        ),
      );
      return;
    }
    const rank = rankOf(n.id);
    let ty = y + 120;
    this.layer.add(text(this, x + 18, ty, `${n.icon} ${nodeText(n, 'name')}`, 24, '#fff4ea', { fontStyle: 'bold' }));
    ty += 36;
    this.layer.add(text(this, x + 18, ty, `${pick(KIND_NAME[n.kind])} · ${tx('等级', 'Rank')} ${rank} / ${n.max}`, 15, b.css));
    ty += 30;
    const wrap = { wordWrap: { width: w - 36, useAdvancedWrap: true }, lineSpacing: 4 };
    if (rank) {
      const t = text(this, x + 18, ty, `${tx('当前', 'Now')}：${nodeText(n, 'desc', rank)}`, 17, COLORS.text, wrap);
      this.layer.add(t);
      ty += t.height + 10;
    }
    if (rank < n.max) {
      const t = text(
        this,
        x + 18,
        ty,
        `${rank ? tx('下一级', 'Next') : tx('效果', 'Effect')}：${nodeText(n, 'desc', rank + 1)}`,
        17,
        '#9be564',
        wrap,
      );
      this.layer.add(t);
      ty += t.height + 10;
    }
    const block = raiseBlock(n);
    const why =
      block === 'parent'
        ? tx('需要先点亮相连的上一个天赋', 'Unlock the connected talent first')
        : block === 'branch'
          ? tx(
              `需要在本方向投入 ${n.needPoints} 点（当前 ${branchSpent(n.branch)}）`,
              `Needs ${n.needPoints} points in this branch (now ${branchSpent(n.branch)})`,
            )
          : block === 'points'
            ? tx('天赋点不足：完成里程碑成就可获得', 'Not enough points — earn more from milestone achievements')
            : '';
    if (why) this.layer.add(text(this, x + 18, ty + 4, why, 15, '#ff8f8f', wrap));
    const by = y + h - 50;
    this.layer.add(
      button(
        this,
        x + w / 2 - 72,
        by,
        128,
        52,
        tx('－ 退点', '－ Refund'),
        () => {
          if (lower(n)) audio.play(this, 'buy');
          else toast(this, tx('有后续天赋依赖它，先退掉后面的天赋', 'Later talents depend on this — refund those first'), '#ff6b6b');
          this.draw();
        },
        0x7a2e35,
        19,
      ).setEnabled(canLower(n)),
    );
    this.layer.add(
      button(
        this,
        x + w / 2 + 72,
        by,
        128,
        52,
        tx('＋ 加点', '＋ Learn'),
        () => {
          if (raise(n)) audio.play(this, 'levelup');
          this.draw();
        },
        COLORS.green,
        19,
      ).setEnabled(!block),
    );
  }
}
