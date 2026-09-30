// 主菜单
import Phaser from 'phaser';
import { portraitKey, showcaseRig } from '../ui/Portrait';
import { paintArena } from '../art/ArenaArt';
import { text, button, COLORS, autoRelayout } from '../ui/UI';
import { audio } from '../systems/Audio';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { run, hasSavedRun, loadRun } from '../systems/RunState';
import { save, unlockedCount } from '../systems/Save';
import { lang, tx } from '../i18n';
import { checkAchievements, setInRun, pointsBalance } from '../systems/Achievements';
import { toggleFullscreen } from '../systems/Fullscreen';
import { paint } from '../art/Painter';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    setInRun(false);
    checkAchievements();
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
    // 版本号点击进入更新日志；未读过本版本时带红点
    const vLabel = text(
      this,
      W / 2,
      titleBottom + 14,
      tx(
        `v${__APP_VERSION__}${import.meta.env.DEV ? '-dev' : ''} · 更新日志`,
        `v${__APP_VERSION__}${import.meta.env.DEV ? '-dev' : ''} · What's New`,
      ),
      16,
      COLORS.textDim,
    ).setOrigin(0.5);
    vLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('Changelog'));
    vLabel.on('pointerover', () => vLabel.setColor(COLORS.text));
    vLabel.on('pointerout', () => vLabel.setColor(COLORS.textDim));
    if (save.seenVersion !== __APP_VERSION__) {
      const dot = this.add.circle(vLabel.getBounds().right + 10, titleBottom + 14, 5, 0xff4b3e);
      this.tweens.add({ targets: dot, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
    }
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

    // GitHub 主页入口（右上角图标）
    const GITHUB_MARK =
      'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z';
    const ghKey = paint(this, 'ui_github', 64, 64, (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(32, 32, 31, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(12, 12);
      ctx.scale(2.5, 2.5);
      ctx.fillStyle = '#fff4ea';
      ctx.fill(new Path2D(GITHUB_MARK));
    });
    const gh = this.add
      .image(W - 44, 44, ghKey)
      .setDisplaySize(52, 52)
      .setAlpha(0.85)
      .setInteractive({ useHandCursor: true });
    gh.on('pointerover', () => gh.setAlpha(1));
    gh.on('pointerout', () => gh.setAlpha(0.85));
    gh.on('pointerup', () => window.open(__REPO_URL__, '_blank', 'noopener'));
    // 请作者喝杯咖啡：跳转到 README 的收款码章节
    const donateUrl = lang === 'en' ? `${__REPO_URL__}/blob/main/README.en.md#support-the-author` : `${__REPO_URL__}#支持作者`;
    button(
      this,
      W - 175,
      44,
      190,
      46,
      tx('☕ 请作者喝杯咖啡', '☕ Buy me a coffee'),
      () => window.open(donateUrl, '_blank', 'noopener'),
      0x8a5a2b,
      17,
    );

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
          const phase = saved.phase;
          if (!loadRun()) return;
          if (phase === 'wave') this.scene.start('Game');
          else this.scene.start(run.pendingLevelUps || run.pendingCrates ? 'LevelUp' : 'Shop', { keep: true });
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
    button(this, W / 2 - 82, by + 90, 156, 60, tx('图鉴', 'Codex'), () => this.scene.start('Codex'), 0x8d5a97, 26);
    button(this, W / 2 + 82, by + 90, 156, 60, tx('成就', 'Awards'), () => this.scene.start('Achievements'), 0xb07d2b, 26);
    button(this, W / 2, by + 165, 320, 60, tx('设置', 'Settings'), () => this.scene.start('Settings'), 0x4a6fa5, 26);
    button(
      this,
      W / 2,
      by + 240,
      320,
      60,
      tx('全屏', 'Fullscreen'),
      () => {
        toggleFullscreen(this);
      },
      0x3a7d44,
      26,
    );

    text(
      this,
      W - 20,
      H - 20,
      tx(
        `成就点 🏅${pointsBalance()} · 已拥有角色 ${unlockedCount()}/${CHARACTERS.length} · 通关章节 ${save.clearedChapters}/5 · 击杀 ${save.totalKills}`,
        `Points 🏅${pointsBalance()} · Characters ${unlockedCount()}/${CHARACTERS.length} · Chapters cleared ${save.clearedChapters}/5 · Kills ${save.totalKills}`,
      ),
      16,
      COLORS.textDim,
    ).setOrigin(1, 1);
    this.input.once('pointerdown', () => audio.unlock());
  }
}
