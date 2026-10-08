// 战斗 HUD：血条、经验、番茄籽、波次计时、Boss 血条、虚拟摇杆、技能按钮
import { WEATHER_MAP } from '../systems/Weather';
import Phaser from 'phaser';
import { run } from '../systems/RunState';
import { controls } from '../systems/Controls';
import { text } from '../ui/UI';
import { xpToNext } from '../data/balance';
import type { GameScene } from './GameScene';
import type { Enemy } from '../objects/Enemy';
import { STATUSES, type StatusId } from '../data/statuses';
import type { StatusEntry } from '../systems/Status';
import { statusIconKey, STATUS_ICON_SIZE, STATUS_EMOJI } from '../art/StatusArt';
import { AFFIXES } from '../data/bosses';
import { FONT } from '../systems/Textures';
import { tx, lang } from '../i18n';
import { save, persist } from '../systems/Save';
import { RELIC_MAP, RELIC_KIND_INFO, RELIC_SET_MAP, describeRelic, describeRelicSet, relicSetCounts } from '../data/relics';
import { WEAPON_MAP } from '../data/weapons';
import { VW, VH, viewZoom } from '../systems/HiDpi';

/** 技能按钮：徽章图标显示尺寸，与徽章内圈面半径（SkillIconArt 里内圈半径为 39.5 / 100） */
const SKILL_ICON = 112;
const SKILL_FACE = SKILL_ICON * 0.395;

export class HudScene extends Phaser.Scene {
  private g!: GameScene;
  private bars!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private lvText!: Phaser.GameObjects.Text;
  private seedText!: Phaser.GameObjects.Text;
  private bonusText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private bossName!: Phaser.GameObjects.Text;
  private skillBtn!: Phaser.GameObjects.Container;
  private skillGfx!: Phaser.GameObjects.Graphics;
  private skillIcon!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private skillCdText!: Phaser.GameObjects.Text;
  private joyBase!: Phaser.GameObjects.Image;
  private joyKnob!: Phaser.GameObjects.Image;
  private joyId = -1;
  private joyOrigin = new Phaser.Math.Vector2();
  private bosses: Enemy[] = [];
  /** 精英 / Boss 方位指示：屏幕外的边缘箭头 + 射程外的头顶箭头 */
  private markers!: Phaser.GameObjects.Graphics;
  private isTouch = false;
  private statusIcons: {
    c: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Image;
    t: Phaser.GameObjects.Text;
    n: Phaser.GameObjects.Text;
    arc: Phaser.GameObjects.Graphics;
    nbg: Phaser.GameObjects.Graphics;
    id: StatusId | null;
  }[] = [];
  private statusTip!: Phaser.GameObjects.Container;
  private statusTipBg!: Phaser.GameObjects.Graphics;
  private statusTipText!: Phaser.GameObjects.Text;
  /** 当前显示说明的状态图标序号，-1 表示没有 */
  private statusTipIdx = -1;
  /** 触屏点按显示的说明在这个时间（ms）后自动收起 */
  private statusTipUntil = 0;

  constructor() {
    super('Hud');
  }

  private drawRelics(W: number): void {
    const owned = run.relics.map((id) => RELIC_MAP[id]).filter(Boolean);
    if (!owned.length) return;
    const zh = lang === 'zh';
    const setN = relicSetCounts(run.relics);
    const perRow = 8;
    let tipBox: Phaser.GameObjects.Container | null = null;
    const hide = () => {
      tipBox?.destroy();
      tipBox = null;
    };
    owned.forEach((r, i) => {
      const x = W - 50 - (i % perRow) * 38,
        y = 100 + Math.floor(i / perRow) * 38;
      const k = RELIC_KIND_INFO[r.kind];
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.45).fillCircle(0, 0, 17).lineStyle(2, k.color, 1).strokeCircle(0, 0, 17);
      c.add([g, this.add.text(0, 1, r.icon, { fontFamily: FONT, fontSize: '18px' }).setOrigin(0.5)]);
      c.setSize(36, 36).setInteractive({ useHandCursor: true });
      const show = () => {
        hide();
        const lines = [r.name[zh ? 0 : 1], ...describeRelic(r, (id) => WEAPON_MAP[id]?.name ?? id)];
        const sl = describeRelicSet(r, r.set ? setN[r.set] : 0);
        if (sl) lines.push(sl);
        const t = text(this, 0, 0, lines.join('\n'), 15, '#ffffff', { wordWrap: { width: 260 } }).setOrigin(1, 0);
        const bg = this.add.graphics();
        bg.fillStyle(0x1a0a0c, 0.92)
          .fillRoundedRect(-t.width - 10, -6, t.width + 20, t.height + 12, 8)
          .lineStyle(2, k.color, 1);
        bg.strokeRoundedRect(-t.width - 10, -6, t.width + 20, t.height + 12, 8);
        tipBox = this.add.container(x + 18, y + 24, [bg, t]).setDepth(50);
      };
      c.on('pointerover', show);
      c.on('pointerdown', show);
      c.on('pointerout', hide);
    });
    // 已集齐的套装
    const sets = run.relicFx.sets;
    if (sets.length)
      text(
        this,
        W - 30,
        100 + Math.ceil(owned.length / perRow) * 38 - 10,
        sets.map((s) => `✦ ${RELIC_SET_MAP[s].name[zh ? 0 : 1]}`).join('  '),
        13,
        '#ffd166',
      ).setOrigin(1, 0);
  }

  private weatherFx!: Phaser.GameObjects.Graphics;
  private weatherDrops: { x: number; y: number; life: number }[] = [];
  private weatherAcc = 0;
  private questText!: Phaser.GameObjects.Text;

  /** H6：雨 / 雪 / 沙尘 / 落叶粒子与全屏叠色 */
  private drawWeather(dt: number): void {
    const v = WEATHER_MAP[run.weather].visual;
    const g = this.weatherFx;
    g.clear();
    if (v.overlayAlpha > 0) g.fillStyle(v.overlay, v.overlayAlpha).fillRect(0, 0, VW(this), VH(this));
    if (v.kind === 'none' || (save.settings.particles ?? 1) <= 0) {
      this.weatherDrops.length = 0;
      return;
    }
    const W = VW(this),
      H = VH(this);
    const rate = v.density * (W / 960) * (save.settings.particles ?? 1);
    this.weatherAcc += rate * dt;
    while (this.weatherAcc >= 1 && this.weatherDrops.length < 400) {
      this.weatherAcc--;
      this.weatherDrops.push({ x: Math.random() * (W + 200) - 100, y: -10, life: 0 });
    }
    const a = (v.angle * Math.PI) / 180;
    const vx = Math.sin(a) * v.speed,
      vy = Math.cos(a) * v.speed;
    g.lineStyle(2, v.color, v.alpha).fillStyle(v.color, v.alpha);
    this.weatherDrops = this.weatherDrops.filter((d) => {
      d.x += vx * dt;
      d.y += vy * dt;
      d.life += dt;
      if (v.kind === 'rain') g.lineBetween(d.x, d.y, d.x - vx * 0.03, d.y - vy * 0.03);
      else if (v.kind === 'snow') g.fillCircle(d.x + Math.sin(d.life * 3 + d.x) * 6, d.y, 2.5);
      else if (v.kind === 'dust') g.fillRect(d.x, d.y, 3, 3);
      else g.lineBetween(d.x, d.y, d.x + 6, d.y + 4);
      return d.y < H + 20 && d.x > -120 && d.x < W + 120;
    });
  }

  create(): void {
    this.g = this.scene.get('Game') as GameScene;
    this.bosses = [];
    this.joyId = -1;
    this.isTouch = this.sys.game.device.input.touch;
    const W = VW(this),
      H = VH(this);

    // H6：天气层（屏幕空间，画在 HUD 最底下）
    this.weatherFx = this.add.graphics().setDepth(-10);
    this.weatherDrops = [];
    this.weatherAcc = 0;
    this.markers = this.add.graphics().setDepth(-5);
    // H5：小任务进度
    this.questText = text(this, 20, 136, '', 15, '#9bf6ff');
    this.bars = this.add.graphics();
    this.hpText = text(this, 30 + 150, 34, '', 20).setOrigin(0.5);
    this.lvText = text(this, 30 + 150, 66, '', 16).setOrigin(0.5);
    this.add.image(40, 104, 'ui_seed_icon');
    this.seedText = text(this, 60, 104, '0', 24, '#ffe066').setOrigin(0, 0.5);
    this.bonusText = text(this, 60, 104, '', 15, '#52ff8a').setOrigin(0, 0.5);
    this.waveText = text(this, W / 2, 24, '', 26).setOrigin(0.5, 0);
    this.timeText = text(this, W / 2, 58, '', 40).setOrigin(0.5, 0);
    this.bossName = text(this, W / 2, H - 70, '', 20, '#ffb4a2')
      .setOrigin(0.5)
      .setVisible(false);
    // 玩家状态图标（悬停 / 点按显示效果说明）
    this.statusIcons = [];
    for (let i = 0; i < 10; i++) {
      const c = this.add.container(40 + i * 48, 140).setVisible(false);
      const bg = this.add.image(0, 0, statusIconKey(this, 'haste'));
      const arc = this.add.graphics();
      const t = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '1px' }).setVisible(false);
      const nbg = this.add.graphics();
      const n = this.add
        .text(15, 14, '', { fontFamily: FONT, fontSize: '12px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 })
        .setOrigin(0.5);
      c.add([arc, bg, t, nbg, n]);
      c.setSize(STATUS_ICON_SIZE, STATUS_ICON_SIZE).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => this.showStatusTip(i, false));
      c.on('pointerout', () => this.hideStatusTip());
      c.on('pointerdown', () => {
        if (this.statusTipIdx === i && this.isTouch) this.hideStatusTip();
        else this.showStatusTip(i, this.isTouch);
      });
      this.statusIcons.push({ c, bg, t, n, arc, nbg, id: null });
    }
    this.statusTipBg = this.add.graphics();
    this.statusTipText = text(this, 0, 0, '', 14, '#ffffff', { wordWrap: { width: 250, useAdvancedWrap: true }, lineSpacing: 3 });
    this.statusTip = this.add.container(0, 0, [this.statusTipBg, this.statusTipText]).setDepth(60).setVisible(false);
    this.statusTipIdx = -1;

    // 暂停按钮
    const pause = this.add.container(W - 50, 46);
    const pg = this.add.graphics();
    pg.fillStyle(0x000000, 0.4).fillCircle(0, 0, 30);
    pg.fillStyle(0xffffff, 0.9).fillRect(-10, -12, 7, 24).fillRect(3, -12, 7, 24);
    pause.add(pg).setSize(64, 64).setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => {
      controls.pausePressed = true;
    });

    // C4：遗物图标（右上角，悬停 / 点按显示说明）
    this.drawRelics(W);

    // 技能按钮（L2：大小可调；「摇杆在右」时按钮放到左下角）
    const sk = run.char.skill;
    const st = save.settings;
    const bs = st.btnScale ?? 1;
    const right = !!st.joyRight;
    const bx = right ? 110 * bs : W - 110 * bs,
      by = H - 110 * bs;
    this.skillBtn = this.add.container(bx, by);
    this.skillBtn.setScale(bs);
    this.skillGfx = this.add.graphics();
    // 徽章图标本身就是按钮（不再外套圆圈）；技能名与按键提示放在图标下方
    const skName = text(this, 0, 68, sk.name, 15).setOrigin(0.5);
    const icon = this.textures.exists(`skill_${run.charId}`)
      ? this.add.image(0, -6, `skill_${run.charId}`).setDisplaySize(SKILL_ICON, SKILL_ICON)
      : text(this, 0, -6, '★', 40, '#ffffff').setOrigin(0.5);
    this.skillIcon = icon;
    this.skillCdText = text(this, 0, -6, '', 34).setOrigin(0.5);
    const keyHint = text(this, 0, 86, '', 14).setOrigin(0.5);
    // 自动释放：图标外圈一圈绿色弧段持续旋转
    const autoRing = this.add.graphics().setPosition(0, -6);
    const rr = SKILL_ICON / 2 + 7;
    autoRing.lineStyle(9, 0x52ff8a, 0.22).strokeCircle(0, 0, rr);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      autoRing
        .lineStyle(5, 0x52ff8a, 0.95)
        .beginPath()
        .arc(0, 0, rr, a, a + 1.3)
        .strokePath();
      // 弧段头部的亮点，旋转方向更明显
      autoRing.fillStyle(0xeaffef, 1).fillCircle(Math.cos(a + 1.3) * rr, Math.sin(a + 1.3) * rr, 3.5);
    }
    this.tweens.add({ targets: autoRing, angle: 360, duration: 2400, repeat: -1 });
    this.skillBtn.add([autoRing, icon, this.skillGfx, skName, this.skillCdText, keyHint]);

    // 技能自动 / 手动切换（暂停键左边，随时一键切换，立即保存）
    const auto = this.add.container(W - 122, 46);
    const ag = this.add.graphics();
    const aLabel = text(this, 0, -6, '', 15).setOrigin(0.5);
    const aSub = text(this, 0, 13, tx('技能', 'SKILL'), 11, '#ffffff').setOrigin(0.5);
    auto.add([ag, aLabel, aSub]).setSize(64, 64).setInteractive({ useHandCursor: true });
    const paintAuto = () => {
      const on = !!save.settings.autoSkill;
      ag.clear()
        .fillStyle(0x000000, 0.4)
        .fillCircle(0, 0, 30)
        .lineStyle(3, on ? 0x52ff8a : 0xc9a9a6, 0.95)
        .strokeCircle(0, 0, 28);
      aLabel.setText(on ? tx('自动', 'AUTO') : tx('手动', 'MAN')).setColor(on ? '#52ff8a' : '#ffffff');
      autoRing.setVisible(on);
      keyHint.setText(on ? tx('自动', 'AUTO') : this.isTouch ? '' : tx('[空格]', '[Space]')).setColor(on ? '#52ff8a' : '#c9a9a6');
    };
    paintAuto();
    auto.on('pointerdown', () => {
      save.settings.autoSkill = !save.settings.autoSkill;
      persist();
      paintAuto();
      this.tweens.add({ targets: auto, scale: { from: 1.18, to: 1 }, duration: 160 });
    });
    this.skillBtn.setSize(130, 130).setInteractive();
    this.skillBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      controls.skillPressed = true;
      if (p.id === this.joyId) this.joyId = -1;
    });

    // 虚拟摇杆（默认左半屏任意位置按下；L2 可换到右手、调大小）
    const js = st.joyScale ?? 1;
    this.joyBase = this.add.image(0, 0, 'ui_joy_base').setVisible(false).setDepth(5).setScale(js);
    this.joyKnob = this.add.image(0, 0, 'ui_joy_knob').setVisible(false).setDepth(6).setScale(js);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.joyId !== -1) return;
      // 技能按钮所在的角落不触发摇杆
      if (right ? p.x < W * 0.4 && p.y > H * 0.5 : p.x > W * 0.6 && p.y > H * 0.5) return;
      this.joyId = p.id;
      this.joyOrigin.set(p.x, p.y);
      this.joyBase.setPosition(p.x, p.y).setVisible(true);
      this.joyKnob.setPosition(p.x, p.y).setVisible(true);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joyId) return;
      const dx = p.x - this.joyOrigin.x,
        dy = p.y - this.joyOrigin.y;
      const max = 70 * js;
      const d = Math.hypot(dx, dy);
      const k = d > max ? max / d : 1;
      this.joyKnob.setPosition(this.joyOrigin.x + dx * k, this.joyOrigin.y + dy * k);
      const m = Math.min(1, d / max);
      controls.joyX = d > 6 ? (dx / d) * m : 0;
      controls.joyY = d > 6 ? (dy / d) * m : 0;
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joyId) return;
      this.joyId = -1;
      controls.joyX = controls.joyY = 0;
      this.joyBase.setVisible(false);
      this.joyKnob.setVisible(false);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    if (this.isTouch) {
      const tip = text(this, W * 0.2, H - 60, tx('按住左侧拖动移动', 'Drag on the left side to move'), 18, '#ffffff')
        .setOrigin(0.5)
        .setAlpha(0.6);
      this.tweens.add({ targets: tip, alpha: 0, delay: 3000, duration: 800 });
    } else {
      const tip = text(
        this,
        W / 2,
        H - 40,
        tx('WASD / 方向键移动 · 空格释放技能 · ESC 暂停', 'WASD / Arrows to move · Space for skill · ESC to pause'),
        18,
        '#ffffff',
      )
        .setOrigin(0.5)
        .setAlpha(0.7);
      this.tweens.add({ targets: tip, alpha: 0, delay: 4000, duration: 800 });
    }

    const onBoss = (e: Enemy) => this.bosses.push(e);
    const onEnd = () => {
      const t = text(
        this,
        W / 2,
        H / 2 - 40,
        run.isBossWave() ? tx('胜利！', 'Victory!') : tx('波次完成！', 'Wave Complete!'),
        56,
        '#ffd166',
      ).setOrigin(0.5);
      t.setScale(0.3);
      this.tweens.add({ targets: t, scale: 1, duration: 400, ease: 'Back.easeOut' });
    };
    const notice = text(this, W / 2, 112, '', 22, '#ffe066')
      .setOrigin(0.5)
      .setAlpha(0);
    const onTerrain = (msg: string) => {
      this.tweens.killTweensOf(notice);
      notice.setText(msg).setAlpha(1).setScale(0.8);
      this.tweens.add({ targets: notice, scale: 1, duration: 200, ease: 'Back.easeOut' });
      this.tweens.add({ targets: notice, alpha: 0, delay: 2200, duration: 400 });
    };
    this.g.events.on('terrain', onTerrain);
    this.events.once('shutdown', () => this.g.events.off('terrain', onTerrain));
    this.g.events.on('bossSpawn', onBoss);
    this.g.events.on('waveEnd', onEnd);
    this.events.once('shutdown', () => {
      this.g.events.off('bossSpawn', onBoss);
      this.g.events.off('waveEnd', onEnd);
      controls.reset();
    });
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));

    const bossWave = run.isBossWave();
    this.waveText.setText(
      (bossWave ? tx(`第 ${run.wave} 波 · BOSS`, `Wave ${run.wave} · BOSS`) : tx(`第 ${run.wave} 波`, `Wave ${run.wave}`)) +
        (run.endless ? tx(' · 无尽', ' · Endless') : ''),
    );
  }

  private onResize(): void {
    this.scene.restart();
  }

  /**
   * 精英 / Boss 方位指示（屏幕空间）：
   * - 在屏幕外：屏幕边缘画脉动箭头，指向它的方向，离得越近箭头越不透明；
   * - 在屏幕内但超出玩家最大武器射程：头顶间歇出现向下的跳动箭头（每 1.6 秒亮 0.7 秒）。
   * Boss 红色、精英金色；Boss 箭头更大。
   */
  private drawMarkers(): void {
    const gr = this.markers;
    gr.clear();
    if (!this.bosses.length) return;
    const g = this.g;
    const cam = g.cameras.main;
    const wv = cam.worldView;
    // 逻辑缩放（高清渲染下相机实际 zoom 含渲染倍率，HUD 用的是逻辑坐标）
    const z = viewZoom(cam);
    const W = VW(this),
      H = VH(this);
    const now = this.time.now;
    const pulse = 0.5 + 0.5 * Math.sin(now / 140);
    const p = g.player;
    const range = g.weapons.maxRange;
    // 边缘箭头的可用区域：避开顶部 HUD 与底部 Boss 血条
    const L = 46,
      R = W - 46,
      T = 46,
      B = H - 92;
    const cx = W / 2,
      cy = H / 2;
    for (const e of this.bosses) {
      const isBoss = !!e.boss && !e.boss.elite;
      const col = isBoss ? 0xff3b3b : 0xffc23d;
      const sx = (e.x - wv.x) * z;
      const sy = (e.y - wv.y) * z;
      const er = e.radius * z;
      const onScreen = sx > -er && sx < W + er && sy > -er && sy < H + er;
      if (!onScreen) {
        const dx = sx - cx,
          dy = sy - cy;
        const kx = dx > 0 ? (R - cx) / dx : dx < 0 ? (L - cx) / dx : Infinity;
        const ky = dy > 0 ? (B - cy) / dy : dy < 0 ? (T - cy) / dy : Infinity;
        const k = Math.min(kx, ky);
        const ax = cx + dx * k,
          ay = cy + dy * k;
        const a = Math.atan2(dy, dx);
        const sc = (isBoss ? 1.35 : 1) * (1 + 0.15 * pulse);
        // 越远越淡（但不低于 0.55），保证一眼能看到
        const far = Math.hypot(e.x - p.x, e.y - p.y);
        const alpha = Math.max(0.55, 1 - Math.max(0, far - 600) / 2400);
        const c = Math.cos(a),
          s = Math.sin(a);
        const pt = (fx: number, fy: number): [number, number] => [ax + (fx * c - fy * s) * sc, ay + (fx * s + fy * c) * sc];
        const tip = pt(26, 0),
          l = pt(4, -14),
          r = pt(4, 14);
        gr.fillStyle(0x000000, 0.45 * alpha).fillCircle(ax, ay, 17 * sc);
        gr.lineStyle(3, 0x1b1b1b, alpha).fillStyle(col, alpha);
        gr.fillTriangle(tip[0], tip[1], l[0], l[1], r[0], r[1]);
        gr.strokeTriangle(tip[0], tip[1], l[0], l[1], r[0], r[1]);
        gr.fillCircle(ax, ay, 11 * sc).strokeCircle(ax, ay, 11 * sc);
        // 中心记号：Boss 画叉，精英画星点
        gr.lineStyle(2.5, 0xffffff, alpha);
        if (isBoss) {
          const q = 5 * sc;
          gr.lineBetween(ax - q, ay - q, ax + q, ay + q).lineBetween(ax - q, ay + q, ax + q, ay - q);
        } else gr.fillStyle(0xffffff, alpha).fillCircle(ax, ay, 4 * sc);
        continue;
      }
      // 屏幕内：超出射程时头顶间歇箭头
      if (Math.hypot(e.x - p.x, e.y - p.y) - e.radius <= range) continue;
      const ph = (now % 1600) / 1600;
      if (ph > 0.44) continue;
      const fade = Math.min(1, ph / 0.06, (0.44 - ph) / 0.08);
      const bob = Math.sin(ph * Math.PI * 6) * 6;
      const sc = isBoss ? 1.9 : 1.5;
      // 精英 / Boss 的头饰与词缀装饰会画到半径之外，所以箭头放在 1.7 倍半径之上
      const hx = sx,
        hy = sy - er * 1.7 - 26 * sc + bob;
      gr.lineStyle(3, 0x1b1b1b, fade).fillStyle(col, fade);
      gr.fillTriangle(hx, hy + 12 * sc, hx - 11 * sc, hy - 6 * sc, hx + 11 * sc, hy - 6 * sc);
      gr.strokeTriangle(hx, hy + 12 * sc, hx - 11 * sc, hy - 6 * sc, hx + 11 * sc, hy - 6 * sc);
    }
  }

  private showStatusTip(i: number, touch: boolean): void {
    if (!this.statusIcons[i]?.id) return;
    this.statusTipIdx = i;
    this.statusTipUntil = touch ? this.time.now + 3000 : 0;
    this.statusTip.setVisible(true);
    this.updateStatusTip(this.g?.pstatus.list ?? []);
  }

  private hideStatusTip(): void {
    this.statusTipIdx = -1;
    this.statusTip?.setVisible(false);
  }

  /** 刷新说明框：内容随层数、剩余时间实时变化；状态消失或触屏超时后收起 */
  private updateStatusTip(list: StatusEntry[]): void {
    const i = this.statusTipIdx;
    if (i < 0) return;
    const e = list[i];
    if (!e || (this.statusTipUntil && this.time.now > this.statusTipUntil)) return this.hideStatusTip();
    const d = STATUSES[e.id];
    const buff = d.kind === 'buff';
    const k = e.stacks;
    const fx: string[] = [];
    const pct = (v: number | undefined, zh: string, en: string) => {
      if (v) fx.push(`${tx(zh, en)} ${v * k > 0 ? '+' : ''}${Math.round(v * k * 10) / 10}%`);
    };
    const flat = (v: number | undefined, zh: string, en: string) => {
      if (v) fx.push(`${tx(zh, en)} ${v * k > 0 ? '+' : ''}${Math.round(v * k * 10) / 10}`);
    };
    pct(d.speed, '移速', 'Speed');
    pct(d.attackSpeed, '攻速', 'Attack speed');
    pct(d.dmgDealt, '造成伤害', 'Damage dealt');
    pct(d.dmgTaken, '受到伤害', 'Damage taken');
    flat(d.armor, '护甲', 'Armor');
    pct(d.crit, '暴击', 'Crit');
    pct(d.dodge, '闪避', 'Dodge');
    pct(d.range, '射程', 'Range');
    flat(d.luck, '幸运', 'Luck');
    pct(d.lifeSteal, '吸血', 'Life steal');
    if (d.regen) fx.push(tx(`每秒回复 ${Math.round(d.regen * k * 10) / 10}`, `Regen ${Math.round(d.regen * k * 10) / 10}/s`));
    if (d.dps) fx.push(tx(`每秒伤害 ${Math.round(d.dps * k * 10) / 10}`, `${Math.round(d.dps * k * 10) / 10} dmg/s`));
    if (d.reflect) fx.push(tx(`反弹伤害 ${Math.round(d.reflect * k)}`, `Reflects ${Math.round(d.reflect * k)} dmg`));
    const lines = [`${STATUS_EMOJI[e.id]} ${d.name}  ${buff ? tx('【增益】', '[Buff]') : tx('【减益】', '[Debuff]')}`, d.desc];
    if (fx.length) lines.push(fx.join(tx('，', ', ')));
    const meta: string[] = [];
    if (d.maxStacks > 1) meta.push(tx(`层数 ${k}/${d.maxStacks}`, `Stacks ${k}/${d.maxStacks}`));
    if (e.id === 'shield') meta.push(tx(`护盾值 ${Math.round(e.value)}`, `Shield ${Math.round(e.value)}`));
    meta.push(
      e.dur < 900 ? tx(`剩余 ${Math.max(0, e.t).toFixed(1)} 秒`, `${Math.max(0, e.t).toFixed(1)}s left`) : tx('持续生效', 'Permanent'),
    );
    lines.push(meta.join(' · '));
    const str = lines.join('\n');
    const t = this.statusTipText;
    if (t.text !== str) {
      t.setText(str);
      const w = t.width + 20,
        h = t.height + 14;
      t.setPosition(10, 7);
      this.statusTipBg
        .clear()
        .fillStyle(0x1a0a0c, 0.94)
        .fillRoundedRect(0, 0, w, h, 8)
        .lineStyle(2, buff ? 0xffc93c : 0xd6243f, 1)
        .strokeRoundedRect(0, 0, w, h, 8);
    }
    const ic = this.statusIcons[i].c;
    const W = VW(this);
    const tw = t.width + 20;
    this.statusTip.setPosition(Phaser.Math.Clamp(ic.x - 22, 8, W - tw - 8), ic.y + STATUS_ICON_SIZE / 2 + 6);
  }

  update(_t: number, dms: number): void {
    const g = this.g;
    if (!g || !g.stats) return;
    this.drawWeather(Math.min(0.05, dms / 1000));
    const qs = g.waveQuests.status();
    if (qs) {
      const mark = qs.state === 'done' ? '✅ ' : qs.state === 'failed' ? '❌ ' : `${qs.icon} `;
      this.questText.setText(`${mark}${tx(qs.name[0], qs.name[1])} · ${tx(qs.text[0], qs.text[1])}`);
      this.questText.setColor(qs.state === 'done' ? '#52ff8a' : qs.state === 'failed' ? '#ff8f8f' : '#9bf6ff');
    } else this.questText.setText('');
    const s = g.stats;
    const b = this.bars;
    b.clear();
    // 血条
    const hpPct = Phaser.Math.Clamp(run.hp / s.maxHp, 0, 1);
    b.fillStyle(0x000000, 0.55).fillRoundedRect(28, 18, 304, 34, 10);
    b.fillStyle(0xff3b30, 1).fillRoundedRect(30, 20, 300 * hpPct, 30, 9);
    this.hpText.setText(`${Math.max(0, Math.ceil(run.hp))} / ${s.maxHp}`);
    // 经验条
    const need = xpToNext(run.level);
    b.fillStyle(0x000000, 0.55).fillRoundedRect(28, 56, 304, 22, 8);
    b.fillStyle(0x52b788, 1).fillRoundedRect(30, 58, 300 * Phaser.Math.Clamp(run.xp / need, 0, 1), 18, 7);
    this.lvText.setText(`LV.${run.level}`);
    this.seedText.setText(String(run.seeds));
    this.bonusText.setText(run.bonusSeeds > 0 ? tx(`拾取翻倍 剩余 ${run.bonusSeeds}`, `Double pickup · ${run.bonusSeeds} left`) : '');
    this.bonusText.setX(this.seedText.x + this.seedText.width + 14);
    this.timeText.setText(run.isBossWave() && g.boss?.enraged ? tx('狂暴', 'ENRAGED') : String(Math.ceil(g.timeLeft)));
    this.timeText.setColor(g.timeLeft <= 5 && !run.isBossWave() ? '#ff6b6b' : '#fff4ea');

    // 状态图标：排在小任务文字下面，避免和文字重叠
    const list = g.pstatus.list;
    const iconY = this.questText.text ? this.questText.y + this.questText.height + 6 + STATUS_ICON_SIZE / 2 : 140;
    this.statusIcons.forEach((ic, i) => {
      const e = list[i];
      if (!e) {
        ic.c.setVisible(false);
        ic.id = null;
        return;
      }
      const d = STATUSES[e.id];
      ic.c.setVisible(true).setPosition(40 + i * 48, iconY);
      if (ic.id !== e.id) {
        ic.bg.setTexture(statusIconKey(this, e.id));
        ic.id = e.id;
      }
      const num = e.stacks > 1 ? String(e.stacks) : e.id === 'shield' ? String(Math.round(e.value)) : '';
      ic.n.setText(num);
      ic.nbg.clear();
      if (num) {
        const w = Math.max(16, ic.n.width + 6);
        ic.nbg
          .fillStyle(0x1a0a0c, 0.9)
          .fillRoundedRect(15 - w / 2, 6, w, 16, 8)
          .lineStyle(1.5, 0xffffff, 0.8)
          .strokeRoundedRect(15 - w / 2, 6, w, 16, 8);
      }
      ic.arc.clear();
      if (e.dur < 900) {
        const r = STATUS_ICON_SIZE / 2 - 1;
        ic.arc.lineStyle(4, 0x000000, 0.45).strokeCircle(0, 0, r);
        ic.arc.lineStyle(3, d.kind === 'buff' ? 0xffe680 : 0xff5a6e, 1);
        ic.arc.beginPath();
        ic.arc.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, e.t / e.dur), false);
        ic.arc.strokePath();
      }
    });
    this.updateStatusTip(list);

    // Boss 血条
    this.bosses = this.bosses.filter((e) => e.alive);
    this.drawMarkers();
    const W = VW(this),
      H = VH(this);
    if (this.bosses.length) {
      const e = this.bosses[0];
      const bw = Math.min(700, W * 0.6);
      b.fillStyle(0x000000, 0.6).fillRoundedRect(W / 2 - bw / 2 - 3, H - 50, bw + 6, 24, 8);
      b.fillStyle(e.phase2 ? 0xff006e : 0xb5179e, 1).fillRoundedRect(W / 2 - bw / 2, H - 47, bw * Math.max(0, e.hp / e.maxHp), 18, 6);
      this.bossName
        .setVisible(true)
        .setPosition(W / 2, H - 64)
        .setText(
          `${e.name}${e.boss?.elite || !e.boss ? tx('（精英）', ' (Elite)') : ''}${e.affixes.length ? '  ' + e.affixes.map((a) => tx('【' + AFFIXES[a].name + '】', '[' + AFFIXES[a].name + ']')).join('') : ''}`,
        );
    } else this.bossName.setVisible(false);

    // 技能按钮
    const sk = g.skill;
    const sg = this.skillGfx;
    sg.clear();
    // 没有图标贴图时的兜底底色
    if (!(this.skillIcon instanceof Phaser.GameObjects.Image))
      sg.fillStyle(run.char.skill.color, sk.ready ? 0.9 : 0.35).fillCircle(0, -6, SKILL_FACE);
    if (!sk.ready) {
      // 冷却遮罩只盖住徽章的内圈面
      const pct = sk.cd / sk.maxCd;
      sg.fillStyle(0x000000, 0.55)
        .slice(0, -6, SKILL_FACE, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct, false)
        .fillPath();
      this.skillCdText.setText(String(Math.ceil(sk.cd)));
    } else this.skillCdText.setText('');
    // 冷却中图标变灰变暗，就绪时恢复原色
    this.skillIcon.setAlpha(sk.ready ? 1 : 0.45);
    if (this.skillIcon instanceof Phaser.GameObjects.Image) {
      if (sk.ready) this.skillIcon.clearTint();
      else this.skillIcon.setTint(0x8a8a8a);
    }
  }
}
