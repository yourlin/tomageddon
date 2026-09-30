// 主菜单
import Phaser from 'phaser';
import { portraitKey, showcaseRig } from '../ui/Portrait';
import { paintArena } from '../art/ArenaArt';
import { text, button, COLORS, toast, autoRelayout } from '../ui/UI';
import { audio } from '../systems/Audio';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { run, hasSavedRun, loadRun } from '../systems/RunState';
import { save, unlockedCount } from '../systems/Save';
import { tx } from '../i18n';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    autoRelayout(this);
    const W = this.scale.width,
      H = this.scale.height;
    audio.playMusic(this, 'bgm_menu');
    if (this.textures.exists('bg_menu')) {
      const bg = this.add.image(W / 2, H / 2, 'bg_menu');
      bg.setScale(Math.max(W / bg.width, H / bg.height));
    } else {
      this.add
        .image(W / 2, H / 2, paintArena(this, 1))
        .setDisplaySize(W * 1.1, H * 1.1)
        .setAlpha(0.5);
      this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a0c, 0.5);
    }
    // 飘落的角色
    const chars = CHARACTERS.map((c) => portraitKey(this, 'char', c.id));
    for (let i = 0; i < 10; i++) {
      const img = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(-H, 0), Phaser.Utils.Array.GetRandom(chars)).setAlpha(0.35);
      img.setScale(Phaser.Math.FloatBetween(0.4, 0.8));
      this.tweens.add({
        targets: img,
        y: H + 100,
        angle: 360,
        duration: Phaser.Math.Between(7000, 14000),
        repeat: -1,
        delay: i * 700,
        onRepeat: () => {
          img.x = Phaser.Math.Between(0, W);
          img.y = -80;
        },
      });
    }

    let titleBottom = H * 0.2 + 102;
    if (this.textures.exists('ui_logo')) {
      const logo = this.add.image(W / 2, H * 0.26, 'ui_logo');
      logo.setScale(Math.min((W * 0.5) / logo.width, (H * 0.32) / logo.height));
      titleBottom = logo.getBounds().bottom;
    } else {
      text(this, W / 2, H * 0.2, '番茄酱', 110, '#ff4b3e', { strokeThickness: 14, fontStyle: 'bold' }).setOrigin(0.5);
      text(this, W / 2, H * 0.2 + 80, 'TOMAGEDDON', 34, '#ffd166', { strokeThickness: 6 }).setOrigin(0.5);
    }
    text(this, W / 2, titleBottom + 14, `v${__APP_VERSION__}${import.meta.env.DEV ? '-dev' : ''}`, 16, COLORS.textDim).setOrigin(0.5);
    if (this.textures.exists('art_hero')) {
      const hero = this.add.image(W * 0.18, H * 0.62, 'art_hero');
      hero.setScale((H * 0.45) / hero.height);
    } else {
      showcaseRig(this, 'char', 'tomato', W * 0.17, H * 0.62, 110);
      // 身后追着跑的小怪
      const foes = ['mold', 'fly', 'rat'];
      foes.forEach((id, i) => {
        const r = showcaseRig(this, 'enemy', id, W * 0.06 + i * 70, H * 0.9, 26);
        r.setDepth(1);
      });
    }

    const by = H * 0.52;
    const saved = hasSavedRun();
    if (saved) {
      const c = CHARACTER_MAP[saved.charId];
      button(
        this,
        W / 2,
        by - 90,
        320,
        72,
        tx('继续游戏', 'Continue'),
        () => {
          if (loadRun()) this.scene.start(run.pendingLevelUps || run.pendingCrates ? 'LevelUp' : 'Shop', { keep: true });
        },
        0xe09f3e,
        30,
      );
      text(
        this,
        W / 2 + 175,
        by - 90,
        tx(`${c.name} · 第${saved.chapterId}章 第${saved.wave}波`, `${c.name} · Chapter ${saved.chapterId} wave ${saved.wave}`),
        16,
        COLORS.textDim,
      ).setOrigin(0, 0.5);
    }
    button(this, W / 2, by, 320, 72, tx('开始游戏', 'Start'), () => this.scene.start('CharSelect'), COLORS.primary, 32);
    button(this, W / 2, by + 90, 320, 60, tx('图鉴', 'Codex'), () => this.scene.start('Codex'), 0x8d5a97, 26);
    button(this, W / 2, by + 165, 320, 60, tx('设置', 'Settings'), () => this.scene.start('Settings'), 0x4a6fa5, 26);
    button(
      this,
      W / 2,
      by + 240,
      320,
      60,
      tx('全屏', 'Fullscreen'),
      () => {
        if (this.scale.isFullscreen) this.scale.stopFullscreen();
        else {
          this.scale.startFullscreen();
          const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
          o?.lock?.('landscape').catch(() => toast(this, tx('请手动横屏', 'Please rotate to landscape')));
        }
      },
      0x3a7d44,
      26,
    );

    text(
      this,
      W - 20,
      H - 20,
      tx(
        `已解锁角色 ${unlockedCount()}/${CHARACTERS.length} · 通关章节 ${save.clearedChapters}/5 · 击杀 ${save.totalKills}`,
        `Characters ${unlockedCount()}/${CHARACTERS.length} · Chapters cleared ${save.clearedChapters}/5 · Kills ${save.totalKills}`,
      ),
      16,
      COLORS.textDim,
    ).setOrigin(1, 1);
    this.input.once('pointerdown', () => audio.unlock());
  }
}
