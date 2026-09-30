// 暂停菜单（覆盖在战斗之上）
import Phaser from 'phaser';
import { text, button, panel, COLORS, autoRelayout } from '../ui/UI';
import { run, clearRun } from '../systems/RunState';
import { STAT_ORDER, STAT_INFO } from '../data/stats';
import { WEAPON_MAP, TIER_NAMES } from '../data/weapons';
import { audio } from '../systems/Audio';
import { tx } from '../i18n';
import { toggleFullscreen } from '../systems/Fullscreen';
import { save, persist } from '../systems/Save';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(): void {
    autoRelayout(this);
    // 战斗界面（HUD）每波会被置顶，暂停界面需盖在它之上
    this.scene.bringToTop();
    this.scene.setVisible(false, 'Hud'); // 暂停时隐藏战斗界面（技能按钮、血条等）
    const W = this.scale.width,
      H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
    panel(this, W / 2 - 420, 40, 840, H - 80);
    text(this, W / 2, 80, tx('暂停', 'Paused'), 44).setOrigin(0.5);
    const s = run.stats;
    const col = Math.ceil(STAT_ORDER.length / 2);
    STAT_ORDER.forEach((k, i) => {
      const x = W / 2 - 390 + Math.floor(i / col) * 250,
        y = 130 + (i % col) * 26;
      const info = STAT_INFO[k];
      text(this, x, y, `${info.name}：${Math.round(s[k] * 10) / 10}${info.pct ? '%' : ''}`, 17, info.color);
    });
    text(this, W / 2 + 120, 130, tx('武器', 'Weapons'), 20, '#ffb347');
    run.weapons.forEach((w, i) => text(this, W / 2 + 120, 160 + i * 24, `${WEAPON_MAP[w.id].name} ${TIER_NAMES[w.tier]}`, 17));
    text(
      this,
      W / 2 + 120,
      360,
      tx(
        `击杀：${run.kills}\n等级：${run.level}\n章节：${run.chapter.name}`,
        `Kills: ${run.kills}\nLevel: ${run.level}\nChapter: ${run.chapter.name}`,
      ),
      17,
      COLORS.textDim,
    );

    const by = H - 110;
    button(this, W / 2 - 380, by, 180, 64, tx('继续', 'Resume'), () => this.resume(), COLORS.green, 26);
    button(
      this,
      W / 2 - 190,
      by,
      180,
      64,
      tx('设置', 'Settings'),
      () => {
        this.scene.launch('Settings', { from: 'pause' });
        this.scene.bringToTop('Settings');
        this.scene.sleep();
      },
      0x4a6fa5,
      24,
    );
    button(this, W / 2, by, 180, 64, tx('全屏', 'Fullscreen'), () => toggleFullscreen(this), 0x3a7d44, 22);
    button(this, W / 2 + 190, by, 180, 64, tx('保存退出', 'Save & Quit'), () => this.saveAndQuit(), 0xb07d2b, 22);
    button(
      this,
      W / 2 + 380,
      by,
      180,
      64,
      tx('放弃本局', 'Abandon Run'),
      () => {
        clearRun();
        audio.stopMusic();
        this.scene.stop('Hud');
        this.scene.stop('Game');
        this.scene.start('Menu');
      },
      0x7a2e35,
      24,
    );
    this.input.keyboard?.once('keydown-ESC', () => this.resume());
  }

  private resume(): void {
    this.scene.resume('Game');
    this.scene.resume('Hud');
    this.scene.setVisible(true, 'Hud');
    this.scene.stop();
  }

  /** 保存并退出：对局已在本波开始时自动保存，下次从本波开始继续 */
  private saveAndQuit(): void {
    const g = this.scene.get('Game') as unknown as { killCounter: number };
    save.totalKills += g.killCounter ?? 0;
    g.killCounter = 0;
    persist();
    audio.stopMusic();
    this.scene.stop('Hud');
    this.scene.stop('Game');
    this.scene.start('Menu');
  }
}
