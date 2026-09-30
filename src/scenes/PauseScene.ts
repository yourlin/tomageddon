// 暂停菜单（覆盖在战斗之上）
import Phaser from 'phaser';
import { text, button, panel, COLORS, autoRelayout } from '../ui/UI';
import { run, clearRun } from '../systems/RunState';
import { STAT_ORDER, STAT_INFO } from '../data/stats';
import { WEAPON_MAP, TIER_NAMES } from '../data/weapons';
import { audio } from '../systems/Audio';
import { tx } from '../i18n';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(): void {
    autoRelayout(this);
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
    button(this, W / 2 - 250, by, 220, 64, tx('继续', 'Resume'), () => this.resume(), COLORS.green, 26);
    button(
      this,
      W / 2,
      by,
      220,
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
    button(
      this,
      W / 2 + 250,
      by,
      220,
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
    this.scene.stop();
  }
}
