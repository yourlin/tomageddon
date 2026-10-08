// 天赋树界面：六个专精方向整合在一张放射状星盘上（参考《盐和避难所》）。
// 中心是起点，每个方向占一个 60° 扇区，扇区用该方向颜色的淡色背景区分；核心天赋靠近中心，道路向外延伸。
// 操作：点天赋选中，再点一次加点；右键或长按退点；拖动平移，滚轮 / 双指 / 右下角按钮缩放。
import Phaser from 'phaser';
import { text, button, panel, COLORS, autoRelayout, toast } from '../ui/UI';
import {
  BRANCHES,
  BRANCH_MAP,
  TALENT_NODES,
  TALENT_MAP,
  branchCost,
  type BranchId,
  type TalentNode,
  type NodeKind,
} from '../data/talentTree';
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
  masterUnlocked,
  masterCost,
  masterMods,
  buyMaster,
  MASTER_CYCLE,
  type RaiseBlock,
  exclusiveTaken,
  setTalentProfile,
  hasCustomTalents,
  clearCustomTalents,
} from '../systems/TalentTree';
import { reveal } from '../systems/Reveal';
import { save, persist, isUnlocked } from '../systems/Save';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { STAT_INFO } from '../data/stats';
import { tx, lang } from '../i18n';
import { audio } from '../systems/Audio';
import { VW, VH, RES } from '../systems/HiDpi';

/** 世界坐标布局：核心离中心 R0，每一步向外 DR，同一方向的道路之间隔 GAP 度 */
const R0 = 120;
const DR = 100;
const GAP = 11.5;
const SECTOR = 60;
const NODE_R: Record<NodeKind, number> = { core: 26, minor: 16, notable: 19, star: 21, keystone: 28 };
const KIND_NAME: Record<NodeKind, [string, string]> = {
  core: ['核心天赋', 'Core'],
  minor: ['属性天赋', 'Attribute'],
  notable: ['特殊能力', 'Ability'],
  star: ['明星天赋 · 可点 5 级', 'Star talent · up to 5 ranks'],
  keystone: ['终极天赋', 'Keystone'],
};
const INFO_W = 330;
const TOP = 84;
const LONG_PRESS_MS = 450;
const DRAG_PX = 8;
const pick = (t: [string, string]): string => (lang === 'en' ? t[1] : t[0]);
const rad = (deg: number): number => (deg * Math.PI) / 180;

/** 每个方向扇区的中心角度（力量在正上方，顺时针排列） */
const BRANCH_ANGLE = Object.fromEntries(BRANCHES.map((b, i) => [b.id, -90 + i * SECTOR])) as Record<BranchId, number>;
/** 每个方向的道路按基准角度排序后的序号 */
const ROAD_INDEX: Record<string, { idx: number; count: number }> = (() => {
  const out: Record<string, { idx: number; count: number }> = {};
  for (const b of BRANCHES) {
    const mine = TALENT_NODES.filter((n) => n.branch === b.id);
    const roads = [...new Set(mine.flatMap((n) => (n.road === undefined ? [] : [n.road])))].sort((a, c) => a - c);
    for (const n of mine) if (n.road !== undefined) out[n.id] = { idx: roads.indexOf(n.road), count: roads.length };
  }
  return out;
})();

/** 每个方向各条道路（按序号）上非终极天赋的最远一步 */
const ROAD_STEPS: Record<string, number[]> = (() => {
  const out: Record<string, number[]> = {};
  for (const b of BRANCHES) {
    const steps: number[] = [];
    for (const n of TALENT_NODES)
      if (n.branch === b.id && n.kind !== 'keystone' && ROAD_INDEX[n.id])
        steps[ROAD_INDEX[n.id].idx] = Math.max(steps[ROAD_INDEX[n.id].idx] ?? 0, n.step);
    out[b.id] = steps.map((x) => x ?? 0);
  }
  return out;
})();

/** 道路间隔：道路多时收窄，保证整个方向不超出自己的扇区 */
const gapFor = (count: number): number => Math.min(GAP, (SECTOR - 6) / Math.max(1, count));

export function nodePos(n: TalentNode): [number, number] {
  const base = BRANCH_ANGLE[n.branch];
  if (n.kind === 'core') return [Math.cos(rad(base)) * R0, Math.sin(rad(base)) * R0];
  const { idx, count } = ROAD_INDEX[n.id];
  const gap = gapFor(count);
  let slot = idx - (count - 1) / 2;
  let r = R0 + 30 + n.step * DR + (n.kind === 'keystone' ? 14 : 0);
  if (n.exclusive) {
    // 二选一的关键天赋：两个并排（lane ±0.5），整体往扇区内侧收；
    // 并放到相邻两条道路最外侧天赋之外半步，避免压到边界和相邻道路的天赋
    const edge = (count - 1) / 2 - 0.5;
    slot = Phaser.Math.Clamp(slot, -edge, edge);
    const c = Math.round(slot + (count - 1) / 2);
    const near = ROAD_STEPS[n.branch].slice(Math.max(0, c - 1), c + 2);
    r = R0 + 30 + Math.max(n.step + 0.5, ...near.map((x) => x + 0.6)) * DR;
  }
  const a = rad(base + (slot + (n.lane ?? 0)) * gap);
  return [Math.cos(a) * r, Math.sin(a) * r];
}

/** 地图半径：按最外侧的天赋自动放大（专精道路比原来更长） */
const EXTENT = Math.max(545, ...TALENT_NODES.map((n) => Math.hypot(...nodePos(n)) + 70));

/** 离开界面时记住镜头和正在编辑的方案，下次回来还在原处 */
const view: { zoom: number; sx: number; sy: number; profile: string | null } = { zoom: 0, sx: 0, sy: 0, profile: null };

export class TalentTreeScene extends Phaser.Scene {
  private selected: TalentNode | null = null;
  private world!: Phaser.GameObjects.Container;
  private ui!: Phaser.GameObjects.Container;
  private mapCam!: Phaser.Cameras.Scene2D.Camera;
  private building = false;
  private halos: Phaser.GameObjects.Arc[] = [];
  private pointsText!: Phaser.GameObjects.Text;
  private masterBtn!: ReturnType<typeof button>;
  private vp = { x: 0, y: 0, w: 0, h: 0 };
  private fitZoom = 0.5;
  // 指针状态：拖动 / 长按 / 双指缩放
  private downInView = false;
  private moved = false;
  private downAt = { x: 0, y: 0 };
  private nodeHandled = false;
  private longTimer: Phaser.Time.TimerEvent | null = null;
  private longFired = false;
  private pinchDist = 0;
  /** 可编辑的天赋方案：null = 默认方案，其余为已解锁角色 */
  private profiles: (string | null)[] = [null];
  private profIdx = 0;
  private profText!: Phaser.GameObjects.Text;
  private inheritBtn!: ReturnType<typeof button>;

  constructor() {
    super('TalentTree');
  }

  create(): void {
    autoRelayout(this);
    const W = VW(this),
      H = VH(this);
    this.selected = null;
    this.vp = { x: 20, y: TOP, w: W - 20 - INFO_W - 14 - 20, h: H - TOP - 16 };
    this.fitZoom = Math.min(this.vp.w, this.vp.h) / (EXTENT * 2);

    // 星盘用单独的镜头（只渲染视口区域，可平移缩放），先渲染；主镜头透明、后渲染，界面和飘字盖在星盘上
    // 高清渲染：相机视口与缩放都是物理像素（逻辑 × RES）；本场景的缩放值一律用逻辑缩放，见 lz() / setLz()
    this.mapCam = this.cameras.add(this.vp.x * RES, this.vp.y * RES, this.vp.w * RES, this.vp.h * RES, false, 'talentMap');
    this.mapCam.setBackgroundColor(0x0d0507);
    const cams = this.cameras.cameras;
    cams.splice(cams.indexOf(this.mapCam), 1);
    cams.unshift(this.mapCam);
    const main = this.cameras.main;
    const onAdded = (go: Phaser.GameObjects.GameObject) => (this.building ? main.ignore(go) : this.mapCam.ignore(go));
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdded);
    this.events.once('shutdown', () => {
      this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdded);
      view.zoom = this.lz();
      view.sx = this.mapCam.scrollX;
      view.sy = this.mapCam.scrollY;
      view.profile = this.profiles[this.profIdx];
      // 离开天赋界面后回到默认方案（开局时由 RunState 切到该角色的方案）
      setTalentProfile(null);
    });
    this.profiles = [null, ...CHARACTERS.filter((c) => isUnlocked(c)).map((c) => c.id)];
    this.profIdx = Math.max(0, this.profiles.indexOf(view.profile));
    setTalentProfile(this.profiles[this.profIdx]);

    if (view.zoom > 0) {
      this.setLz(Phaser.Math.Clamp(view.zoom, this.fitZoom * 0.9, 1.8));
      this.mapCam.setScroll(view.sx, view.sy);
      this.clampScroll();
    } else {
      this.setLz(this.fitZoom);
      this.mapCam.centerOn(0, 0);
    }

    // 视口以外的背景（主镜头透明，画四块把视口围起来）
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bg, 1)
      .fillRect(0, 0, W, this.vp.y)
      .fillRect(0, this.vp.y + this.vp.h, W, H)
      .fillRect(0, 0, this.vp.x, H)
      .fillRect(this.vp.x + this.vp.w, 0, W, H);
    bg.lineStyle(3, COLORS.border, 1).strokeRoundedRect(this.vp.x - 3, this.vp.y - 3, this.vp.w + 6, this.vp.h + 6, 8);

    const title = text(this, 24, 18, tx('天赋树', 'Talent Tree'), 36);
    this.pointsText = text(this, title.x + title.width + 24, 30, '', 20, '#ffd166');
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);
    button(this, W - 250, 44, 160, 52, tx('全部重置', 'Reset all'), () => this.resetAll(), 0x7a2e35, 19);
    // I1：大师层——天赋点满后用金番茄购买，每层小幅提升，无上限
    this.masterBtn = button(this, W - 440, 44, 200, 52, '', () => this.buyMasterLayer(), 0x8a6d1f, 18);
    // 天赋方案：默认方案 / 各角色的专属方案（没有定制的角色继承默认方案）
    const px = this.vp.x + 14,
      py = this.vp.y + 14;
    button(this, px + 20, py + 20, 40, 40, '◀', () => this.switchProfile(-1), 0x3d1d22, 20);
    button(this, px + 66, py + 20, 40, 40, '▶', () => this.switchProfile(1), 0x3d1d22, 20);
    this.profText = text(this, px + 96, py + 2, '', 16, '#fff4ea', { stroke: '#000000', strokeThickness: 3 });
    this.inheritBtn = button(this, px + 85, py + 68, 150, 36, tx('恢复继承默认', 'Use default'), () => this.useDefault(), 0x5a3a20, 15);
    // 缩放按钮（叠在视口右下角）
    const zx = this.vp.x + this.vp.w - 30,
      zy = this.vp.y + this.vp.h - 30;
    button(this, zx, zy - 100, 44, 44, '＋', () => this.zoomAt(this.vpCenter().x, this.vpCenter().y, this.lz() * 1.25), 0x3d1d22, 24);
    button(this, zx, zy - 50, 44, 44, '－', () => this.zoomAt(this.vpCenter().x, this.vpCenter().y, this.lz() / 1.25), 0x3d1d22, 24);
    button(this, zx, zy, 44, 44, '⤢', () => this.fitView(), 0x3d1d22, 22);

    this.world = this.addWorld(() => this.add.container(0, 0));
    this.ui = this.add.container(0, 0);
    this.setupInput();
    this.draw();
  }

  /** 在 fn 里创建的对象只在星盘镜头里显示 */
  private addWorld<T>(fn: () => T): T {
    this.building = true;
    try {
      return fn();
    } finally {
      this.building = false;
    }
  }

  private vpCenter(): { x: number; y: number } {
    return { x: this.vp.x + this.vp.w / 2, y: this.vp.y + this.vp.h / 2 };
  }

  private inView(p: Phaser.Input.Pointer): boolean {
    const { x, y, w, h } = this.vp;
    return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
  }

  // ---------------- 平移 / 缩放 ----------------
  /** 星盘的逻辑缩放（相机实际 zoom 含高清渲染倍率） */
  private lz(): number {
    return this.mapCam.zoom / RES;
  }
  private setLz(z: number): void {
    this.mapCam.setZoom(z * RES);
  }

  /** 以屏幕点 (px, py)（逻辑坐标）为中心缩放到逻辑缩放 z */
  private zoomAt(px: number, py: number, z: number): void {
    const cam = this.mapCam;
    const nz = Phaser.Math.Clamp(z, this.fitZoom * 0.9, 1.8) * RES;
    const hw = cam.width / 2,
      hh = cam.height / 2;
    // 相机按物理像素工作：把逻辑屏幕点换算过去，屏幕点下的世界坐标在缩放前后保持不变
    const X = px * RES,
      Y = py * RES;
    const wx = cam.scrollX + hw + (X - cam.x - hw) / cam.zoom;
    const wy = cam.scrollY + hh + (Y - cam.y - hh) / cam.zoom;
    cam.setZoom(nz);
    cam.setScroll(wx - hw - (X - cam.x - hw) / nz, wy - hh - (Y - cam.y - hh) / nz);
    this.clampScroll();
  }

  private fitView(): void {
    this.setLz(this.fitZoom);
    this.mapCam.centerOn(0, 0);
  }

  private clampScroll(): void {
    const cam = this.mapCam;
    const lim = EXTENT - 80;
    const cx = Phaser.Math.Clamp(cam.scrollX + cam.width / 2, -lim, lim);
    const cy = Phaser.Math.Clamp(cam.scrollY + cam.height / 2, -lim, lim);
    cam.setScroll(cx - cam.width / 2, cy - cam.height / 2);
  }

  private setupInput(): void {
    this.input.mouse?.disableContextMenu();
    this.input.addPointer(1);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        this.pinchDist = Phaser.Math.Distance.Between(
          this.input.pointer1.x,
          this.input.pointer1.y,
          this.input.pointer2.x,
          this.input.pointer2.y,
        );
        this.moved = true;
        this.cancelLongPress();
        return;
      }
      this.downInView = this.inView(p);
      this.moved = false;
      this.nodeHandled = false;
      this.downAt = { x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const p1 = this.input.pointer1,
        p2 = this.input.pointer2;
      if (p1.isDown && p2.isDown && this.pinchDist > 0) {
        const d = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        this.zoomAt((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (this.lz() * d) / this.pinchDist);
        this.pinchDist = d;
        return;
      }
      if (!p.isDown || !this.downInView) return;
      if (!this.moved && Phaser.Math.Distance.Between(p.x, p.y, this.downAt.x, this.downAt.y) > DRAG_PX) {
        this.moved = true;
        this.cancelLongPress();
      }
      if (this.moved) {
        // 指针是逻辑坐标，换成物理像素再除以相机实际缩放
        this.mapCam.scrollX -= ((p.x - p.prevPosition.x) * RES) / this.mapCam.zoom;
        this.mapCam.scrollY -= ((p.y - p.prevPosition.y) * RES) / this.mapCam.zoom;
        this.clampScroll();
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      this.cancelLongPress();
      if (!this.input.pointer1.isDown || !this.input.pointer2.isDown) this.pinchDist = 0;
      // 点在星盘空白处：取消选中
      if (this.downInView && this.inView(p) && !this.moved && !this.nodeHandled && this.selected) {
        this.selected = null;
        this.draw();
      }
      this.downInView = false;
    });
    this.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      if (this.inView(p)) this.zoomAt(p.x, p.y, this.lz() * (dy > 0 ? 1 / 1.12 : 1.12));
    });
  }

  private cancelLongPress(): void {
    this.longTimer?.remove();
    this.longTimer = null;
  }

  // ---------------- 加点 / 退点 ----------------
  private blockText(n: TalentNode, block: RaiseBlock): string {
    switch (block) {
      case 'max':
        return tx('已经点满了', 'Already maxed');
      case 'parent':
        return tx('需要先点亮相连的上一个天赋', 'Unlock the connected talent first');
      case 'branch':
        return tx(
          `需要在本方向投入 ${n.needPoints} 点（当前 ${branchSpent(n.branch)}）`,
          `Needs ${n.needPoints} points in this branch (now ${branchSpent(n.branch)})`,
        );
      case 'points':
        return tx('天赋点不足：完成里程碑成就可获得', 'Not enough points — earn more from milestone achievements');
      case 'exclusive': {
        const o = exclusiveTaken(n);
        return tx(
          `与「${o ? nodeText(o, 'name') : ''}」二选一：先退掉它`,
          `Exclusive with "${o ? nodeText(o, 'name') : ''}" — refund it first`,
        );
      }
      default:
        return '';
    }
  }

  private tryRaise(n: TalentNode): void {
    const block = raiseBlock(n);
    if (block) {
      audio.play(this, 'click');
      toast(this, this.blockText(n, block), block === 'max' ? '#ffd166' : '#ff6b6b');
      return;
    }
    raise(n);
    audio.play(this, 'levelup');
    this.draw();
  }

  private tryLower(n: TalentNode): void {
    if (rankOf(n.id) <= 0) return;
    if (!lower(n)) {
      toast(this, tx('有后续天赋依赖它，先退掉后面的天赋', 'Later talents depend on this — refund those first'), '#ff6b6b');
      return;
    }
    audio.play(this, 'buy');
    this.draw();
  }

  /** 切换正在编辑的天赋方案 */
  private switchProfile(d: number): void {
    this.profIdx = (this.profIdx + d + this.profiles.length) % this.profiles.length;
    setTalentProfile(this.profiles[this.profIdx]);
    this.selected = null;
    audio.play(this, 'click');
    this.draw();
  }

  /** 删掉当前角色的专属方案，改回继承默认方案 */
  private useDefault(): void {
    const id = this.profiles[this.profIdx];
    if (!id || !hasCustomTalents(id)) return;
    clearCustomTalents(id);
    this.selected = null;
    toast(this, tx('已恢复继承默认方案', 'Now using the default build'), '#52ff8a');
    this.draw();
  }

  private profileLabel(): string {
    const id = this.profiles[this.profIdx];
    if (!id) return tx('方案：默认\n未定制的角色都继承它', 'Build: Default\nCharacters without their own build use it');
    const name = CHARACTER_MAP[id]?.name ?? id;
    return hasCustomTalents(id)
      ? tx(`方案：${name}（专属）\n只在用该角色开局时生效`, `Build: ${name} (custom)\nUsed when starting as this character`)
      : tx(
          `方案：${name}（继承默认）\n加点或退点后自动另存为专属方案`,
          `Build: ${name} (inherits default)\nChanging a talent saves a custom build`,
        );
  }

  private resetAll(): void {
    resetBranch();
    this.selected = null;
    audio.play(this, 'buy');
    toast(this, tx('天赋已全部重置', 'All talents reset'), '#52ff8a');
    this.draw();
  }

  private buyMasterLayer(): void {
    // STAT_INFO 的 name 在英文模式下已被 i18n/apply 替换成英文
    const statName = (k: string): string => STAT_INFO[k as keyof typeof STAT_INFO]?.name ?? k;
    if (!masterUnlocked()) {
      toast(this, tx('天赋树全部点满后开放大师层', 'Max out every talent to unlock Master layers'), '#ff6b6b');
      return;
    }
    const cost = masterCost();
    if (!buyMaster()) {
      toast(
        this,
        tx(`金番茄不够：需要 🥇${cost}，拥有 🥇${save.meta.gold}`, `Need 🥇${cost} Golden Tomatoes (you have 🥇${save.meta.gold})`),
        '#ff6b6b',
      );
      return;
    }
    persist();
    audio.play(this, 'buy');
    const [k, v] = MASTER_CYCLE[(save.meta.master - 1) % MASTER_CYCLE.length];
    const total = Object.entries(masterMods())
      .map(([kk, vv]) => `${statName(kk)} +${vv}`)
      .join('  ');
    toast(
      this,
      tx(
        `大师层 ${save.meta.master}：${statName(k)} +${v}（累计 ${total}）`,
        `Master ${save.meta.master}: ${statName(k)} +${v} (total ${total})`,
      ),
      '#ffd166',
    );
    this.draw();
  }

  // ---------------- 绘制 ----------------
  private draw(): void {
    this.tweens.killTweensOf(this.halos);
    this.halos = [];
    this.world.removeAll(true);
    this.ui.removeAll(true);
    const free = talentPointsFree();
    this.pointsText.setText(
      tx(
        `可用天赋点 ${free} · 已获得 ${talentPointsEarned()} / ${talentPointsTotal()}（完成里程碑成就获得） · 🥇${save.meta.gold}`,
        `Points ${free} · earned ${talentPointsEarned()} / ${talentPointsTotal()} via milestones · 🥇${save.meta.gold}`,
      ),
    );
    this.masterBtn.setLabel(tx(`🥇 大师层 ${save.meta.master}`, `🥇 Master ${save.meta.master}`));
    this.masterBtn.setAlpha(masterUnlocked() ? 1 : 0.55);
    this.masterBtn.setVisible(reveal.master()); // 天赋树点满前不显示大师层
    this.profText.setText(this.profileLabel());
    const pid = this.profiles[this.profIdx];
    this.inheritBtn.setVisible(!!pid && hasCustomTalents(pid));
    this.addWorld(() => {
      this.drawBoard();
      this.drawRoads();
      for (const n of TALENT_NODES) this.drawNode(n);
    });
    this.drawInfo();
  }

  /** 世界里的文字：放大镜头时也清晰 */
  private wtext(
    x: number,
    y: number,
    s: string,
    size: number,
    color = COLORS.text,
    opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
  ) {
    const t = text(this, x, y, s, size, color, { resolution: 2, ...opts }).setOrigin(0.5);
    this.world.add(t);
    return t;
  }

  /** 星盘背景：每个方向一块淡色扇区 + 同心环 + 扇区分隔线 + 中心起点 */
  private drawBoard(): void {
    const g = this.add.graphics();
    this.world.add(g);
    g.fillStyle(0x120709, 1).fillCircle(0, 0, EXTENT);
    for (const b of BRANCHES) {
      const a = BRANCH_ANGLE[b.id];
      const a0 = rad(a - SECTOR / 2),
        a1 = rad(a + SECTOR / 2);
      // 从内到外几层叠加，越靠外颜色越明显，像淡淡的渐变
      g.fillStyle(b.color, 0.05)
        .slice(0, 0, EXTENT - 10, a0, a1, false)
        .fillPath();
      g.fillStyle(b.color, 0.04)
        .slice(0, 0, R0 + 3.6 * DR, a0, a1, false)
        .fillPath();
      g.fillStyle(0x120709, 0.5)
        .slice(0, 0, R0 - 40, a0, a1, false)
        .fillPath();
      // 外圈色带
      g.lineStyle(26, b.color, 0.16)
        .beginPath()
        .arc(0, 0, EXTENT - 23, a0 + 0.01, a1 - 0.01)
        .strokePath();
    }
    g.lineStyle(1, 0xfff4ea, 0.07);
    for (let k = 0; k <= 3; k++) g.strokeCircle(0, 0, k ? R0 + 30 + k * DR : R0);
    g.lineStyle(2, 0xfff4ea, 0.12);
    for (const b of BRANCHES) {
      const a = rad(BRANCH_ANGLE[b.id] + SECTOR / 2);
      g.lineBetween(Math.cos(a) * 60, Math.sin(a) * 60, Math.cos(a) * (EXTENT - 10), Math.sin(a) * (EXTENT - 10));
    }
    g.lineStyle(3, 0x7a2e35, 1).strokeCircle(0, 0, EXTENT);
    // 点点星光
    const rnd = new Phaser.Math.RandomDataGenerator(['talent-board']);
    for (let k = 0; k < 160; k++) {
      const a = rnd.realInRange(0, Math.PI * 2),
        r = rnd.realInRange(70, EXTENT - 40);
      g.fillStyle(0xfff4ea, rnd.realInRange(0.05, 0.25)).fillCircle(Math.cos(a) * r, Math.sin(a) * r, rnd.realInRange(0.6, 1.8));
    }
    // 方向名字与进度（外圈色带上）
    for (const b of BRANCHES) {
      const a = rad(BRANCH_ANGLE[b.id]);
      const r = EXTENT - 23;
      this.wtext(Math.cos(a) * r, Math.sin(a) * r, `${pick(b.name)}  ${branchSpent(b.id)}/${branchCost(b.id)}`, 20, b.css, {
        fontStyle: 'bold',
        strokeThickness: 5,
      });
    }
  }

  /** 道路：未开通为虚线，已开通为亮色实线；中心起点连到每个核心 */
  private drawRoads(): void {
    const g = this.add.graphics();
    this.world.add(g);
    const dashed = (x1: number, y1: number, x2: number, y2: number, alpha: number) => {
      const len = Math.hypot(x2 - x1, y2 - y1),
        dx = (x2 - x1) / len,
        dy = (y2 - y1) / len;
      g.lineStyle(2.5, 0xfff4ea, alpha);
      for (let d = 0; d < len; d += 12)
        g.lineBetween(x1 + dx * d, y1 + dy * d, x1 + dx * Math.min(len, d + 6), y1 + dy * Math.min(len, d + 6));
    };
    const solid = (x1: number, y1: number, x2: number, y2: number, color: number) => {
      g.lineStyle(8, color, 0.25).lineBetween(x1, y1, x2, y2);
      g.lineStyle(3.5, color, 1).lineBetween(x1, y1, x2, y2);
    };
    for (const n of TALENT_NODES) {
      const color = BRANCH_MAP[n.branch].color;
      const [x2, y2] = nodePos(n);
      let x1: number,
        y1: number,
        parentLit = true;
      if (n.parent) {
        const p = TALENT_MAP[n.parent];
        [x1, y1] = nodePos(p);
        parentLit = rankOf(p.id) > 0;
      } else {
        const a = Math.atan2(y2, x2);
        x1 = Math.cos(a) * 46;
        y1 = Math.sin(a) * 46;
      }
      if (rankOf(n.id) > 0) solid(x1, y1, x2, y2, color);
      else dashed(x1, y1, x2, y2, parentLit ? 0.55 : 0.2);
    }
    // 中心起点
    g.fillStyle(0x2b1418, 1).fillCircle(0, 0, 46);
    g.lineStyle(4, 0xffd166, 0.9).strokeCircle(0, 0, 46);
    g.lineStyle(1.5, 0xffd166, 0.4).strokeCircle(0, 0, 54);
    this.wtext(0, -8, '🍅', 40);
    this.wtext(0, 26, String(talentPointsFree()), 18, '#ffd166', { fontStyle: 'bold', strokeThickness: 4 });
  }

  private drawNode(n: TalentNode): void {
    const [x, y] = nodePos(n);
    const r = NODE_R[n.kind],
      rank = rankOf(n.id),
      b = BRANCH_MAP[n.branch];
    const block = raiseBlock(n);
    const can = !block,
      maxed = rank >= n.max,
      locked = rank === 0 && !can && block !== 'points';
    const g = this.add.graphics();
    this.world.add(g);
    if (this.selected?.id === n.id) {
      g.lineStyle(4, 0xffffff, 1).strokeCircle(x, y, r + 9);
      g.lineStyle(10, 0xffffff, 0.15).strokeCircle(x, y, r + 9);
    }
    // 外框：明星天赋是星形光芒，终极天赋是六边形
    if (n.kind === 'star' || n.kind === 'keystone') {
      const k = n.kind === 'keystone' ? 6 : 10,
        pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 - Math.PI / 2;
        const rr = n.kind === 'keystone' ? r + 7 : i % 2 ? r + 2 : r + 8;
        pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
      }
      g.fillStyle(maxed ? 0xffd166 : rank ? b.color : 0x3a3a3a, locked ? 0.4 : 0.9).fillPoints(pts, true);
    }
    g.fillStyle(0x000000, 0.45).fillCircle(x + 2, y + 3, r);
    g.fillStyle(rank ? b.color : 0x2b2b2b, locked ? 0.55 : 1).fillCircle(x, y, r);
    g.lineStyle(n.kind === 'minor' ? 2.5 : 3.5, maxed ? 0xffd166 : rank ? 0xfff4ea : can ? b.color : 0x6c6c6c, 1).strokeCircle(x, y, r);
    if (can && !rank) {
      // 可以点的天赋：呼吸光圈
      const halo = this.add.circle(x, y, r + 4).setStrokeStyle(2.5, b.color, 0.9);
      this.tweens.add({ targets: halo, scale: 1.2, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });
      this.halos.push(halo);
      this.world.add(halo);
    }
    const icon = this.wtext(x, y, n.icon, Math.round(r * 1.05));
    if (locked) icon.setAlpha(0.4);
    if (n.max > 1 || rank)
      this.wtext(x, y + r + 9, `${rank}/${n.max}`, 12, maxed ? '#ffd166' : rank ? '#fff4ea' : COLORS.textDim, { strokeThickness: 4 });
    const hit = this.add.circle(x, y, r + 7, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.longFired = false;
      if (p.rightButtonDown()) return;
      this.cancelLongPress();
      // 长按退点（手机）
      this.longTimer = this.time.delayedCall(LONG_PRESS_MS, () => {
        this.longTimer = null;
        if (this.moved) return;
        this.longFired = true;
        this.selected = n;
        this.tryLower(n);
        this.draw();
      });
    });
    hit.on('pointerup', (p: Phaser.Input.Pointer) => {
      this.nodeHandled = true;
      this.cancelLongPress();
      if (this.moved || this.longFired) return;
      if (p.rightButtonReleased()) {
        this.selected = n;
        this.tryLower(n);
        this.draw();
        return;
      }
      if (this.selected?.id === n.id) this.tryRaise(n);
      else {
        audio.play(this, 'click');
        this.selected = n;
        this.draw();
      }
    });
    this.world.add(hit);
  }

  // ---------------- 右侧信息栏 ----------------
  private drawInfo(): void {
    const W = VW(this);
    const x = W - INFO_W - 20,
      y = this.vp.y,
      w = INFO_W,
      h = this.vp.h;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => (this.ui.add(o), o);
    const wrap = { wordWrap: { width: w - 36, useAdvancedWrap: true }, lineSpacing: 4 };
    const n = this.selected;
    add(panel(this, x, y, w, h, COLORS.panel, n ? BRANCH_MAP[n.branch].color : COLORS.border));
    const bar = (by: number, id: BranchId) => {
      const b = BRANCH_MAP[id],
        spent = branchSpent(id),
        cost = branchCost(id);
      const g = add(this.add.graphics());
      g.fillStyle(0x1a0a0c, 1).fillRoundedRect(x + 18, by, w - 36, 8, 4);
      if (spent) g.fillStyle(b.color, 1).fillRoundedRect(x + 18, by, Math.max(8, ((w - 36) * spent) / cost), 8, 4);
    };
    const hint = tx(
      '· 点击天赋选中，再点一次加点\n· 右键或长按天赋退点\n· 拖动平移，滚轮或双指缩放',
      '· Tap a talent to select it, tap again to learn\n· Right-click or long-press to refund\n· Drag to pan, scroll or pinch to zoom',
    );
    if (!n) {
      add(text(this, x + 18, y + 14, tx('六大方向', 'Six branches'), 22, COLORS.text, { fontStyle: 'bold' }));
      let ty = y + 50;
      for (const b of BRANCHES) {
        add(text(this, x + 18, ty, pick(b.name), 17, b.css, { fontStyle: 'bold' }));
        add(text(this, x + w - 18, ty, `${branchSpent(b.id)} / ${branchCost(b.id)}`, 15, COLORS.textDim).setOrigin(1, 0));
        add(text(this, x + 18, ty + 23, pick(b.desc), 12, COLORS.textDim));
        bar(ty + 42, b.id);
        ty += 58;
      }
      add(
        text(
          this,
          x + 18,
          ty + 8,
          hint +
            tx(
              '\n· 从靠近中心的核心天赋开始，沿道路向外解锁\n· 终极天赋需要在本方向投入足够点数\n· 「全部重置」免费，随时可用',
              '\n· Start from a core near the center and follow the roads outward\n· Keystones need enough points spent in their branch\n· "Reset all" is free and always available',
            ),
          14,
          COLORS.text,
          wrap,
        ),
      );
      return;
    }
    const b = BRANCH_MAP[n.branch];
    const rank = rankOf(n.id);
    add(
      text(this, x + 18, y + 14, `${pick(b.name)} · ${branchSpent(n.branch)} / ${branchCost(n.branch)}`, 20, b.css, { fontStyle: 'bold' }),
    );
    bar(y + 44, n.branch);
    let ty = y + 70;
    add(text(this, x + 18, ty, `${n.icon} ${nodeText(n, 'name')}`, 24, '#fff4ea', { fontStyle: 'bold' }));
    ty += 36;
    add(text(this, x + 18, ty, `${pick(KIND_NAME[n.kind])} · ${tx('等级', 'Rank')} ${rank} / ${n.max}`, 15, b.css));
    ty += 30;
    // 二选一的关键天赋：标出另一个选项
    const rival = n.exclusive ? TALENT_NODES.find((o) => o.id !== n.id && o.exclusive === n.exclusive) : undefined;
    if (rival) {
      add(
        text(
          this,
          x + 18,
          ty,
          tx(`二选一：与「${nodeText(rival, 'name')}」互斥`, `Pick one: exclusive with "${nodeText(rival, 'name')}"`),
          15,
          '#ffd166',
        ),
      );
      ty += 26;
    }
    if (rank) {
      const t = add(text(this, x + 18, ty, `${tx('当前', 'Now')}：${nodeText(n, 'desc', rank)}`, 17, COLORS.text, wrap));
      ty += t.height + 10;
    }
    if (rank < n.max) {
      const t = add(
        text(
          this,
          x + 18,
          ty,
          `${rank ? tx('下一级', 'Next') : tx('效果', 'Effect')}：${nodeText(n, 'desc', rank + 1)}`,
          17,
          '#9be564',
          wrap,
        ),
      );
      ty += t.height + 10;
    }
    const block = raiseBlock(n);
    const status =
      block && block !== 'max'
        ? { s: this.blockText(n, block), c: '#ff8f8f' }
        : block === 'max'
          ? { s: tx('已点满', 'Maxed'), c: '#ffd166' }
          : { s: tx('▶ 再点一次这个天赋即可加点', '▶ Tap this talent again to learn it'), c: '#52ff8a' };
    const st = add(text(this, x + 18, ty + 4, status.s, 15, status.c, wrap));
    ty += st.height + 14;
    if (rank > 0 && !canLower(n))
      add(
        text(
          this,
          x + 18,
          ty,
          tx('有后续天赋依赖它，暂时不能退点', 'Later talents depend on this — cannot refund yet'),
          14,
          COLORS.textDim,
          wrap,
        ),
      );
    add(text(this, x + 18, y + h - 16, hint, 13, COLORS.textDim, wrap).setOrigin(0, 1));
  }
}
