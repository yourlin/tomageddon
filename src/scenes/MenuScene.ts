// 主菜单
import { tip } from '../systems/Tutorial';
import { talentPointsFree } from '../systems/TalentTree';
import Phaser from 'phaser';
import { portraitKey, showcaseRig } from '../ui/Portrait';
import { paintArena } from '../art/ArenaArt';
import { text, button, COLORS, autoRelayout } from '../ui/UI';
import { audio } from '../systems/Audio';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { run, hasSavedRun, loadRun } from '../systems/RunState';
import { save, unlockedCount, isUnlocked } from '../systems/Save';
import { lang, tx } from '../i18n';
import { checkAchievements, setInRun, pointsEarned } from '../systems/Achievements';
import { toggleFullscreen } from '../systems/Fullscreen';
import { paint } from '../art/Painter';
import { openExternal, SHOW_DONATE, IS_STEAM, quitApp } from '../platform';
import { dayKey } from '../systems/Rng';
import { persist } from '../systems/Save';
import { titleName, unlockedTitles } from '../data/titles';
import { shouldShowWhatsNew, showWhatsNew } from '../ui/WhatsNew';
import { gateSceneStart, MENU_PORTRAITS } from './BootScene';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    // 启动贴图还在后台生成时，离开主菜单要先等它们就绪（期间显示加载页）
    gateSceneStart(this);
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
    // I6：菜园随进度变繁茂（通关章节、危机等级、真结局都会让花草变多）
    this.drawGarden(W, H);
    // 飘落的角色：优先用启动时已生成的头像，其余头像在后台生成，这里不再一次生成全部
    let chars = CHARACTERS.map((c) => `portrait_char_${c.id}`).filter((k) => this.textures.exists(k));
    if (chars.length < MENU_PORTRAITS)
      chars = Phaser.Utils.Array.Shuffle(CHARACTERS.slice())
        .slice(0, MENU_PORTRAITS)
        .map((c) => portraitKey(this, 'char', c.id));
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

    // 有进行中的对局时「继续游戏」按钮在开始按钮上方 90px：标题与版本号必须让出这块位置，
    // 否则版本号 / 更新日志入口会被按钮盖住（1.3.x 的「版本号不显示」）
    const by = H * 0.52;
    const saved = hasSavedRun();
    const buttonsTop = (saved ? by - 90 - 36 : by - 36) - 8;
    let titleBottom = H * 0.2 + 102;
    if (this.textures.exists('ui_logo')) {
      const logo = this.add.image(W / 2, H * 0.26, 'ui_logo');
      logo.setScale(Math.min((W * 0.5) / logo.width, (H * 0.32) / logo.height));
      // 标题底边至少给版本号留 30px
      const over = logo.getBounds().bottom - (buttonsTop - 30);
      if (over > 0) {
        const s = Math.max(0.2, (logo.displayHeight - over) / logo.displayHeight);
        logo.setScale(logo.scale * s);
        logo.y = Math.min(logo.y, buttonsTop - 30 - logo.displayHeight / 2);
      }
      titleBottom = logo.getBounds().bottom;
    } else {
      text(this, W / 2, H * 0.2, '番茄酱', 110, '#ff4b3e', { strokeThickness: 14, fontStyle: 'bold' }).setOrigin(0.5);
      text(this, W / 2, H * 0.2 + 80, 'TOMAGEDDON', 34, '#ffd166', { strokeThickness: 6 }).setOrigin(0.5);
    }
    // 版本号点击进入更新日志；未读过本版本时带红点。标题下放不下时放到左下角
    const fits = titleBottom + 14 + 12 <= buttonsTop;
    const vx = fits ? W / 2 : 20;
    const vy = fits ? titleBottom + 14 : H - 30;
    const vLabel = text(
      this,
      vx,
      vy,
      tx(
        `v${__APP_VERSION__}${import.meta.env.DEV ? '-dev' : ''} · 更新日志`,
        `v${__APP_VERSION__}${import.meta.env.DEV ? '-dev' : ''} · What's New`,
      ),
      fits ? 16 : 18,
      COLORS.textDim,
    )
      .setOrigin(fits ? 0.5 : 0, 0.5)
      .setDepth(10);
    vLabel.setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('Changelog'));
    vLabel.on('pointerover', () => vLabel.setColor(COLORS.text));
    vLabel.on('pointerout', () => vLabel.setColor(COLORS.textDim));
    if (save.seenVersion !== __APP_VERSION__) {
      const dot = this.add.circle(vLabel.getBounds().right + 10, vy, 5, 0xff4b3e).setDepth(10);
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
    gh.on('pointerup', () => openExternal(__REPO_URL__));
    // 请作者喝杯咖啡：跳转到 README 的收款码章节（Steam 版不显示）
    const donateUrl = lang === 'en' ? `${__REPO_URL__}/blob/main/README.en.md#support-the-author` : `${__REPO_URL__}#支持作者`;
    if (SHOW_DONATE)
      button(this, W - 175, 44, 190, 46, tx('☕ 请作者喝杯咖啡', '☕ Buy me a coffee'), () => openExternal(donateUrl), 0x8a5a2b, 17);
    if (IS_STEAM) button(this, W - 150, H - 60, 120, 44, tx('退出游戏', 'Quit'), () => quitApp(), 0x555555, 18);

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
    button(this, W / 2, by + 80, 320, 58, tx('🗓️ 每日 / 每周挑战', '🗓️ Daily / Weekly'), () => this.scene.start('Challenge'), 0xc1121f, 24);
    // D4：今日挑战状态与刷新倒计时
    {
      const rec = save.challenges[`daily:${dayKey()}`];
      const now = new Date();
      const ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
      const h = Math.floor(ms / 3600000),
        m = Math.floor((ms % 3600000) / 60000);
      const st = rec?.won
        ? tx('今日 ✓ 已通关', 'Today ✓ cleared')
        : rec
          ? tx(`今日最佳 ${rec.best}`, `Today best ${rec.best}`)
          : tx('今日未挑战', 'Not played today');
      text(
        this,
        W / 2 + 175,
        by + 80,
        `${st}\n${tx(`${h} 小时 ${m} 分后刷新`, `resets in ${h}h ${m}m`)}`,
        14,
        rec?.won ? '#ffd166' : COLORS.textDim,
      ).setOrigin(0, 0.5);
    }
    // 次要入口收进一条托盘：天赋（成长）| 图鉴 · 收藏 · 成就 · 战绩（记录），统一配色，悬停才点亮
    this.drawDock(W / 2, by + 162);
    // I5：称号——点击在已解锁称号间切换（含「无称号」）
    this.drawTitle(W, by + 244);
    // 设置 / 全屏：右上角圆形图标，与 GitHub 图标排成一列
    this.roundIcon(W - 44, 104, 'gear', tx('设置', 'Settings'), () => this.scene.start('Settings'));
    this.roundIcon(W - 44, 164, 'fullscreen', tx('全屏', 'Fullscreen'), () => toggleFullscreen(this));

    text(
      this,
      W - 20,
      H - 20,
      tx(
        `成就点 🏅${pointsEarned()} · 金番茄 🥇${save.meta.gold} · 已拥有角色 ${unlockedCount()}/${CHARACTERS.length} · 通关章节 ${save.clearedChapters}/5 · 击杀 ${save.totalKills}`,
        `Points 🏅${pointsEarned()} · Golden 🥇${save.meta.gold} · Characters ${unlockedCount()}/${CHARACTERS.length} · Chapters cleared ${save.clearedChapters}/5 · Kills ${save.totalKills}`,
      ),
      16,
      COLORS.textDim,
    ).setOrigin(1, 1);
    this.input.once('pointerdown', () => audio.unlock());
    // M4：老玩家首次进入新版本，先弹「新功能」，本次不再叠加新手提示
    if (shouldShowWhatsNew(__APP_VERSION__)) {
      showWhatsNew(this, __APP_VERSION__, () => this.scene.start('Changelog'));
      return;
    }
    // 新手引导：天赋点、新解锁的角色、挑战
    if (talentPointsFree() > 0) tip('talents', this);
    if (CHARACTERS.some((c) => c.unlock && isUnlocked(c) && !save.charRuns[c.id])) tip('buyChar', this);
    if (save.wins >= 1 || Object.values(save.charRuns).reduce((a, b) => a + b, 0) >= 3) tip('challenge', this);
  }

  /** 菜单图标：统一线稿风格（奶油色描边 + 一点强调色），画在 80×80 的画布上按 36px 显示 */
  private icon(kind: string): string {
    return paint(this, `ui_menu_${kind}`, 80, 80, (ctx) => {
      const cream = '#fff4ea';
      const accent = '#ffd166';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = cream;
      ctx.fillStyle = cream;
      const path = (f: () => void) => {
        ctx.beginPath();
        f();
      };
      switch (kind) {
        case 'talent': // 发芽的种子
          path(() => {
            ctx.moveTo(40, 70);
            ctx.lineTo(40, 34);
          });
          ctx.stroke();
          ctx.fillStyle = '#52b788';
          path(() => ctx.ellipse(27, 30, 15, 8, -0.6, 0, Math.PI * 2));
          ctx.fill();
          ctx.stroke();
          path(() => ctx.ellipse(53, 24, 15, 8, 0.6, 0, Math.PI * 2));
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ff4b3e';
          path(() => ctx.ellipse(40, 68, 13, 7, 0, 0, Math.PI * 2));
          ctx.fill();
          break;
        case 'codex': // 摊开的书
          path(() => {
            ctx.moveTo(40, 22);
            ctx.quadraticCurveTo(26, 14, 10, 18);
            ctx.lineTo(10, 62);
            ctx.quadraticCurveTo(26, 58, 40, 66);
            ctx.quadraticCurveTo(54, 58, 70, 62);
            ctx.lineTo(70, 18);
            ctx.quadraticCurveTo(54, 14, 40, 22);
            ctx.lineTo(40, 66);
          });
          ctx.stroke();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 4;
          path(() => {
            ctx.moveTo(18, 32);
            ctx.lineTo(32, 33);
            ctx.moveTo(18, 44);
            ctx.lineTo(32, 45);
          });
          ctx.stroke();
          break;
        case 'collect': // 酱料罐（与收藏页同款）
          path(() => ctx.roundRect(22, 12, 36, 10, 3));
          ctx.fillStyle = accent;
          ctx.fill();
          ctx.stroke();
          path(() => ctx.roundRect(16, 22, 48, 48, 10));
          ctx.stroke();
          ctx.fillStyle = '#ff4b3e';
          path(() => ctx.roundRect(22, 44, 36, 20, 6));
          ctx.fill();
          break;
        case 'awards': // 奖牌
          ctx.strokeStyle = '#ff4b3e';
          path(() => {
            ctx.moveTo(26, 8);
            ctx.lineTo(36, 34);
            ctx.moveTo(54, 8);
            ctx.lineTo(44, 34);
          });
          ctx.stroke();
          ctx.strokeStyle = cream;
          ctx.fillStyle = accent;
          path(() => ctx.arc(40, 50, 20, 0, Math.PI * 2));
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#1a0a0c';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', 40, 51);
          break;
        case 'history': // 柱状图
          path(() => {
            ctx.moveTo(10, 70);
            ctx.lineTo(70, 70);
          });
          ctx.stroke();
          [
            [16, 46],
            [34, 30],
            [52, 14],
          ].forEach(([x, top], i) => {
            ctx.fillStyle = i === 2 ? accent : cream;
            path(() => ctx.roundRect(x, top, 13, 62 - top, 3));
            ctx.fill();
          });
          break;
        case 'gear': {
          path(() => {
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              ctx.moveTo(40 + Math.cos(a) * 20, 40 + Math.sin(a) * 20);
              ctx.lineTo(40 + Math.cos(a) * 30, 40 + Math.sin(a) * 30);
            }
          });
          ctx.lineWidth = 9;
          ctx.stroke();
          ctx.lineWidth = 6;
          path(() => ctx.arc(40, 40, 18, 0, Math.PI * 2));
          ctx.stroke();
          path(() => ctx.arc(40, 40, 6, 0, Math.PI * 2));
          ctx.fill();
          break;
        }
        case 'fullscreen':
          path(() => {
            ctx.moveTo(14, 30);
            ctx.lineTo(14, 14);
            ctx.lineTo(30, 14);
            ctx.moveTo(50, 14);
            ctx.lineTo(66, 14);
            ctx.lineTo(66, 30);
            ctx.moveTo(66, 50);
            ctx.lineTo(66, 66);
            ctx.lineTo(50, 66);
            ctx.moveTo(30, 66);
            ctx.lineTo(14, 66);
            ctx.lineTo(14, 50);
          });
          ctx.lineWidth = 7;
          ctx.stroke();
          break;
      }
    });
  }

  /** 次要入口托盘：一块暗色底板，5 个「图标 + 小字」格子；天赋单独成组（会影响下一局），其余是记录类 */
  private drawDock(cx: number, cy: number): void {
    const items: [string, string, string, string][] = [
      ['talent', tx('天赋', 'Talents'), 'TalentTree', tx('花点数强化下一局', 'Spend points for your next run')],
      ['codex', tx('图鉴', 'Codex'), 'Codex', tx('角色、武器、敌人资料', 'Characters, weapons, enemies')],
      ['collect', tx('收藏', 'Collect'), 'Collection', tx('看看还缺哪些', 'See what you are missing')],
      ['awards', tx('成就', 'Awards'), 'Achievements', tx('成就与成就点', 'Achievements and points')],
      ['history', tx('战绩', 'History'), 'History', tx('历次对局记录', 'Past runs')],
    ];
    const TW = 74,
      TH = 72,
      GAP = 4,
      SEP = 18; // 天赋与记录组之间的分隔
    const total = items.length * TW + (items.length - 1) * GAP + SEP;
    const left = cx - total / 2;
    const tray = this.add.graphics();
    tray.fillStyle(0x12070a, 0.72).fillRoundedRect(left - 10, cy - TH / 2 - 8, total + 20, TH + 16, 18);
    tray.lineStyle(2, 0x7a2e35, 0.8).strokeRoundedRect(left - 10, cy - TH / 2 - 8, total + 20, TH + 16, 18);
    const sepX = left + TW + GAP / 2 + SEP / 2;
    tray.lineStyle(2, 0x7a2e35, 0.9).lineBetween(sepX, cy - TH / 2 + 8, sepX, cy + TH / 2 - 8);
    const hint = text(this, cx, cy + TH / 2 + 22, '', 15, COLORS.textDim)
      .setOrigin(0.5)
      .setAlpha(0);
    items.forEach(([kind, label, scene, desc], i) => {
      const x = left + i * (TW + GAP) + (i > 0 ? SEP : 0) + TW / 2;
      const c = this.add.container(x, cy).setName(`dock:${scene}`);
      const bg = this.add.graphics();
      const ic = this.add.image(0, -10, this.icon(kind)).setDisplaySize(36, 36);
      const lb = text(this, 0, 22, label, 16, COLORS.textDim).setOrigin(0.5);
      c.add([bg, ic, lb]);
      c.setSize(TW, TH).setInteractive({ useHandCursor: true });
      const hl = (on: boolean) => {
        bg.clear();
        if (on) bg.fillStyle(0x3d1d22, 1).fillRoundedRect(-TW / 2, -TH / 2, TW, TH, 12);
        if (on) bg.lineStyle(2, COLORS.gold, 0.9).strokeRoundedRect(-TW / 2, -TH / 2, TW, TH, 12);
        lb.setColor(on ? '#ffd166' : COLORS.textDim);
        ic.y = on ? -13 : -10;
        hint.setText(desc).setAlpha(on ? 1 : 0);
      };
      c.on('pointerover', () => hl(true));
      c.on('pointerout', () => hl(false));
      c.on('pointerup', () => {
        audio.play(this, 'click');
        this.scene.start(scene);
      });
      // 有未分配的天赋点：格子右上角红点 + 数字
      if (kind === 'talent' && talentPointsFree() > 0) {
        const dot = this.add.circle(TW / 2 - 12, -TH / 2 + 10, 10, 0xff4b3e).setStrokeStyle(2, 0xffffff);
        const n = text(this, TW / 2 - 12, -TH / 2 + 10, String(talentPointsFree()), 12).setOrigin(0.5);
        c.add([dot, n]);
        this.tweens.add({ targets: dot, scale: 1.2, duration: 600, yoyo: true, repeat: -1 });
      }
    });
  }

  /** 右上角圆形图标按钮，悬停在左侧显示文字 */
  private roundIcon(x: number, y: number, kind: string, label: string, onClick: () => void): void {
    const bg = this.add.circle(x, y, 26, 0x000000, 0.35);
    const ic = this.add.image(x, y, this.icon(kind)).setDisplaySize(30, 30).setAlpha(0.85);
    const tip = text(this, x - 38, y, label, 16, COLORS.text)
      .setOrigin(1, 0.5)
      .setAlpha(0);
    bg.setInteractive({ useHandCursor: true }).setName(`icon:${kind}`);
    bg.on('pointerover', () => (ic.setAlpha(1), bg.setFillStyle(0x3d1d22, 0.9), tip.setAlpha(1)));
    bg.on('pointerout', () => (ic.setAlpha(0.85), bg.setFillStyle(0x000000, 0.35), tip.setAlpha(0)));
    bg.on('pointerup', () => {
      audio.play(this, 'click');
      onClick();
    });
  }

  private drawTitle(W: number, y: number): void {
    const list = unlockedTitles(save.achievements);
    if (!list.length) return;
    const label = (): string =>
      save.meta.title
        ? tx(`称号「${titleName(save.meta.title)}」 · 点击切换`, `Title "${titleName(save.meta.title)}" · click to change`)
        : tx('🎖️ 选择称号', '🎖️ Pick a title');
    const t = text(this, W / 2, y, label(), 17, '#ffd166')
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    t.on('pointerup', () => {
      const opts = ['', ...list];
      save.meta.title = opts[(opts.indexOf(save.meta.title) + 1) % opts.length];
      persist();
      t.setText(label());
    });
  }

  /** I6：进度越多，菜园越繁茂；分数 0~40 */
  static gardenScore(): number {
    const dangerMax = Math.max(0, ...Object.values(save.meta.dangerBest));
    return Math.min(
      40,
      save.clearedChapters * 3 + Math.min(10, dangerMax) + (save.meta.trueEnding ? 8 : 0) + Math.min(7, Math.floor(save.wins / 10)),
    );
  }

  private drawGarden(W: number, H: number): void {
    const n = MenuScene.gardenScore();
    if (n <= 0) return;
    const g = this.add.graphics().setDepth(0.5);
    const rnd = new Phaser.Math.RandomDataGenerator(['garden']);
    // 草丛
    for (let i = 0; i < 6 + n * 3; i++) {
      const x = rnd.between(0, W),
        y = H - rnd.between(0, 40);
      g.fillStyle(rnd.pick([0x2d6a4f, 0x40916c, 0x52b788]), 0.85);
      g.fillTriangle(x - 6, y, x + 6, y, x + rnd.between(-4, 4), y - rnd.between(14, 30));
    }
    // 花朵与果实
    const flowers = [0xff4b3e, 0xffd166, 0xff8fab, 0xf8f9fa, 0x9d4edd];
    for (let i = 0; i < Math.floor(n * 1.2); i++) {
      const x = rnd.between(10, W - 10),
        y = H - rnd.between(10, 60);
      g.lineStyle(2, 0x2d6a4f, 0.9).lineBetween(x, y, x, y + 18);
      g.fillStyle(rnd.pick(flowers), 0.95).fillCircle(x, y, rnd.between(4, 8));
    }
    // 真结局后：一轮金色光晕
    if (save.meta.trueEnding) {
      const sun = this.add.circle(W - 140, 150, 60, 0xffd166, 0.15).setDepth(0.4);
      this.tweens.add({ targets: sun, scale: 1.2, alpha: 0.25, duration: 2400, yoyo: true, repeat: -1 });
    }
  }
}
