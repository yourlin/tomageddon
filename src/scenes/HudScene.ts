// 战斗 HUD：血条、经验、番茄籽、波次计时、Boss 血条、虚拟摇杆、技能按钮
import Phaser from 'phaser';
import { run } from '../systems/RunState';
import { controls } from '../systems/Controls';
import { text } from '../ui/UI';
import { xpToNext } from '../data/balance';
import type { GameScene } from './GameScene';
import type { Enemy } from '../objects/Enemy';
import { STATUSES } from '../data/statuses';
import { AFFIXES } from '../data/bosses';
import { FONT } from '../systems/Textures';
import { tx } from '../i18n';
import { save } from '../systems/Save';

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
  private skillCdText!: Phaser.GameObjects.Text;
  private joyBase!: Phaser.GameObjects.Image;
  private joyKnob!: Phaser.GameObjects.Image;
  private joyId = -1;
  private joyOrigin = new Phaser.Math.Vector2();
  private bosses: Enemy[] = [];
  private isTouch = false;
  private statusIcons: {
    c: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Image;
    t: Phaser.GameObjects.Text;
    n: Phaser.GameObjects.Text;
    arc: Phaser.GameObjects.Graphics;
  }[] = [];

  constructor() {
    super('Hud');
  }

  create(): void {
    this.g = this.scene.get('Game') as GameScene;
    this.bosses = [];
    this.joyId = -1;
    this.isTouch = this.sys.game.device.input.touch;
    const W = this.scale.width,
      H = this.scale.height;

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
    // 玩家状态图标
    this.statusIcons = [];
    for (let i = 0; i < 10; i++) {
      const c = this.add.container(40 + i * 40, 140).setVisible(false);
      const bg = this.add.image(0, 0, 'ui_status').setScale(0.85);
      const arc = this.add.graphics();
      const t = this.add
        .text(0, 0, '', { fontFamily: FONT, fontSize: '15px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 })
        .setOrigin(0.5);
      const n = this.add
        .text(13, 11, '', { fontFamily: FONT, fontSize: '11px', color: '#ffffff', stroke: '#000', strokeThickness: 3 })
        .setOrigin(0.5);
      c.add([bg, arc, t, n]);
      this.statusIcons.push({ c, bg, t, n, arc });
    }

    // 暂停按钮
    const pause = this.add.container(W - 50, 46);
    const pg = this.add.graphics();
    pg.fillStyle(0x000000, 0.4).fillCircle(0, 0, 30);
    pg.fillStyle(0xffffff, 0.9).fillRect(-10, -12, 7, 24).fillRect(3, -12, 7, 24);
    pause.add(pg).setSize(64, 64).setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => {
      controls.pausePressed = true;
    });

    // 技能按钮
    const sk = run.char.skill;
    const bx = W - 110,
      by = H - 110;
    this.skillBtn = this.add.container(bx, by);
    this.skillGfx = this.add.graphics();
    const skName = text(this, 0, 18, sk.name, 16).setOrigin(0.5);
    const icon = this.textures.exists(`skill_${run.charId}`)
      ? this.add.image(0, -8, `skill_${run.charId}`).setDisplaySize(56, 56)
      : text(this, 0, -12, '★', 34, '#ffffff').setOrigin(0.5);
    this.skillCdText = text(this, 0, -8, '', 30).setOrigin(0.5);
    const hint = save.settings.autoSkill ? tx('自动', 'AUTO') : this.isTouch ? '' : tx('[空格]', '[Space]');
    const keyHint = text(this, 0, 64, hint, 14, save.settings.autoSkill ? '#52ff8a' : '#c9a9a6').setOrigin(0.5);
    this.skillBtn.add([this.skillGfx, icon, skName, this.skillCdText, keyHint]);
    this.skillBtn.setSize(130, 130).setInteractive();
    this.skillBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      controls.skillPressed = true;
      if (p.id === this.joyId) this.joyId = -1;
    });

    // 虚拟摇杆（左半屏任意位置按下）
    this.joyBase = this.add.image(0, 0, 'ui_joy_base').setVisible(false).setDepth(5);
    this.joyKnob = this.add.image(0, 0, 'ui_joy_knob').setVisible(false).setDepth(6);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.joyId !== -1) return;
      if (p.x > W * 0.6 && p.y > H * 0.5) return;
      this.joyId = p.id;
      this.joyOrigin.set(p.x, p.y);
      this.joyBase.setPosition(p.x, p.y).setVisible(true);
      this.joyKnob.setPosition(p.x, p.y).setVisible(true);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joyId) return;
      const dx = p.x - this.joyOrigin.x,
        dy = p.y - this.joyOrigin.y;
      const max = 70;
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

  update(): void {
    const g = this.g;
    if (!g || !g.stats) return;
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

    // 状态图标
    const list = g.pstatus.list;
    this.statusIcons.forEach((ic, i) => {
      const e = list[i];
      if (!e) {
        ic.c.setVisible(false);
        return;
      }
      const d = STATUSES[e.id];
      ic.c.setVisible(true);
      ic.bg.setTint(d.color);
      ic.t.setText(d.glyph).setColor(d.kind === 'buff' ? '#ffffff' : '#ffe0e0');
      ic.n.setText(e.stacks > 1 ? String(e.stacks) : e.id === 'shield' ? String(Math.round(e.value)) : '');
      ic.arc.clear();
      if (e.dur < 900) {
        ic.arc.lineStyle(3, d.kind === 'buff' ? 0xffffff : 0x1b1b1b, 0.9);
        ic.arc.beginPath();
        ic.arc.arc(0, 0, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, e.t / e.dur), false);
        ic.arc.strokePath();
      }
    });

    // Boss 血条
    this.bosses = this.bosses.filter((e) => e.alive);
    const W = this.scale.width,
      H = this.scale.height;
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
    const color = run.char.skill.color;
    sg.fillStyle(0x000000, 0.45).fillCircle(0, 0, 60);
    sg.fillStyle(color, sk.ready ? 0.9 : 0.35).fillCircle(0, 0, 54);
    sg.lineStyle(4, 0xffffff, sk.ready ? 0.9 : 0.3).strokeCircle(0, 0, 56);
    if (!sk.ready) {
      const pct = sk.cd / sk.maxCd;
      sg.fillStyle(0x000000, 0.5)
        .slice(0, 0, 54, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct, false)
        .fillPath();
      this.skillCdText.setText(String(Math.ceil(sk.cd)));
    } else this.skillCdText.setText('');
  }
}
