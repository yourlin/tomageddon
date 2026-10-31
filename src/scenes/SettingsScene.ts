import { settingSlider, type SettingRange } from '../ui/SettingSlider';
// 分类设置：声音 / 画面 / 操作 / 存档。战斗中只开放即时生效的设置。
import { resetTutorial } from '../systems/Tutorial';
import Phaser from 'phaser';
import { text, button, panel, COLORS, autoRelayout, tu } from '../ui/UI';
import { MENU, menuButton, menuPanel, menuHeading, menuRule, menuToggle, preloadSettingsArt } from '../ui/GameMenuUI';
import { toggleFullscreen } from '../systems/Fullscreen';
import { save, persist, resetSave, exportSave, importSave } from '../systems/Save';
import { audio } from '../systems/Audio';
import { rumble } from '../systems/Controls';
import { applyFpsLimit, setFpsDisplay } from '../systems/Perf';
import { errorLog, errorReport, clearErrorLog } from '../systems/ErrorLog';
import { tx, lang } from '../i18n';
import { VW, VH, RES } from '../systems/HiDpi';
import type { GraphicsQuality } from '../systems/GraphicsQuality';
import { currentArtStyle, type ArtStyle } from '../systems/ArtStyle';
import { applyArtStyle } from '../systems/ArtStyleSwitch';
import { loadArt, readyArt, releaseArt, unloadUnusedArt } from '../systems/ArtRegistry';
import { createEntityVisual } from '../objects/visualFactory';

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** 画质 / 高清渲染 / 语言要重新加载才生效：选好后统一用「应用」按钮重载，而不是一点就重载（画风切换会重建本场景，所以状态放在模块里） */
let reloadPending = false;
type SettingsTab = 'sound' | 'graphics' | 'controls' | 'data';
type Row = [string, () => string, (refresh: () => void) => void, (SettingRange & { id: string })?];
const TOMATO = { kind: 'char', id: 'tomato' } as const;

export class SettingsScene extends Phaser.Scene {
  private resetDialog?: Phaser.GameObjects.Container;
  private choice?: Phaser.GameObjects.Container;
  private applyBtn?: Phaser.GameObjects.Container;
  private stylePreview?: Phaser.GameObjects.Container;
  constructor() {
    super('Settings');
  }

  private fromPause = false;
  private tab: SettingsTab = 'graphics';
  private body?: Phaser.GameObjects.Container;
  private tabs?: Phaser.GameObjects.Container;
  private rows: Row[] = [];
  private frame = { x: 0, y: 0, w: 0, h: 0 };

  preload(): void {
    preloadSettingsArt(this);
  }

  create(data?: { from?: string; tab?: SettingsTab }): void {
    this.fromPause = data?.from === 'pause';
    this.tab = data?.tab ?? 'graphics';
    if (this.fromPause && this.tab === 'data') this.tab = 'graphics';
    // Preserve the selected category when rotating or resizing.
    const layoutData = { ...data, tab: this.tab };
    this.registry.set('settingsLayoutData', layoutData);
    autoRelayout(this, layoutData);
    const W = VW(this),
      H = VH(this);
    this.resetDialog = undefined;
    this.choice = undefined;
    this.applyBtn = undefined;
    this.stylePreview = undefined;
    this.body = undefined;
    this.tabs = undefined;
    this.cameras.main.setBackgroundColor(this.fromPause ? 'rgba(0,0,0,0)' : COLORS.bg);
    if (this.fromPause) this.add.rectangle(W / 2, H / 2, W, H, 0x140d12, 0.84).setInteractive();
    else if (currentArtStyle() === 'cute' && this.textures.exists('settings:kitchen')) {
      const bg = this.add.image(W / 2, H / 2, 'settings:kitchen');
      bg.setScale(Math.max(W / bg.width, H / bg.height));
    }
    const PW = Math.min(this.fromPause ? 920 : 880, W * (this.fromPause ? 0.86 : 0.65));
    const px = this.fromPause ? (W - PW) / 2 : Math.min(W - PW - 50, W * 0.32);
    this.frame = { x: px, y: 36, w: PW, h: H - 72 };
    menuPanel(this, px, 36, PW, H - 72);
    menuHeading(this, px + PW / 2, 86, tx('设置', 'Settings'), 42).setOrigin(0.5);
    menuButton(this, W - 40, 40, 44, 42, '', () => toggleFullscreen(this), false, 18, 'fullscreen').setName('settings:fullscreen');
    menuRule(this, px + 34, H - 136, PW - 68);
    menuButton(this, px + 115, H - 84, 166, 48, tx('返回', 'Back'), () => this.back(), false, 21, 'arrow-left');
    text(
      this,
      px + PW / 2,
      H - 157,
      this.fromPause
        ? tx('战斗中仅显示即时生效的设置', 'Only live settings are available during a run')
        : tx('设置自动保存 · 画质与语言更改后需重新加载', 'Auto-saved · Quality and language changes require a reload'),
      14,
      MENU.dim,
    ).setOrigin(0.5);
    const st = save.settings;
    const onOff = (v: boolean) => (v ? tx('开', 'On') : tx('关', 'Off'));
    const numeric = (
      id: string,
      name: string,
      min: number,
      max: number,
      step: number,
      read: () => number,
      write: (n: number) => void,
      format = () => pct(read()),
    ): Row => [
      name,
      format,
      () => {},
      {
        id,
        min,
        max,
        step,
        read,
        write,
        commit: () => {
          persist();
          if (id === 'sfx') audio.play(this, 'click');
          // 松手时试震一次（中等强度的受击震动），让玩家当场感受到这一档的力度：镜头抖动 + 手柄震动
          if (id === 'shake' && st.shake) {
            this.cameras.main.shake(300, 0.012 * (st.shakeScale ?? 1));
            rumble(0.012 * (st.shakeScale ?? 1), 300);
          }
        },
      },
    ];
    const rows: Row[] = [
      numeric(
        'sfx',
        tx('音效', 'Sound FX'),
        0,
        1,
        0.01,
        () => st.sfx,
        (n) => {
          st.sfx = n;
        },
      ),
      numeric(
        'music',
        tx('音乐', 'Music'),
        0,
        1,
        0.01,
        () => st.music,
        (n) => {
          st.music = n;
          audio.setMusicVolume(n);
        },
      ),
      [
        tx('技能释放', 'Skill Cast'),
        () => (st.autoSkill ? tx('自动', 'Auto') : tx('手动', 'Manual')),
        () => {
          st.autoSkill = !st.autoSkill;
        },
      ],
      numeric(
        'shake',
        tx('屏幕震动', 'Screen Shake'),
        0,
        1.5,
        0.05,
        () => (st.shake ? (st.shakeScale ?? 1) : 0),
        (n) => {
          st.shake = n > 0;
          st.shakeScale = n || 1;
        },
      ),
      [
        tx('伤害数字', 'Damage Numbers'),
        () => onOff(st.showDmg),
        () => {
          st.showDmg = !st.showDmg;
        },
      ],
      numeric(
        'dmgDensity',
        tx('伤害数字密度', 'Number Density'),
        0.1,
        1,
        0.05,
        () => st.dmgDensity ?? 1,
        (n) => {
          st.dmgDensity = n;
        },
      ),
      numeric(
        'particles',
        tx('粒子数量', 'Particles'),
        0,
        1,
        0.05,
        () => st.particles ?? 1,
        (n) => {
          st.particles = n;
        },
      ),
      [
        tx('显示帧数', 'Show FPS'),
        () => onOff(st.showFps),
        () => {
          st.showFps = !st.showFps;
          setFpsDisplay(this.game, st.showFps);
        },
      ],
      numeric(
        'fpsLimit',
        tx('帧数上限', 'FPS Limit'),
        30,
        120,
        30,
        () => st.fpsLimit,
        (n) => {
          st.fpsLimit = n;
          applyFpsLimit(this.game, n);
        },
        () => `${st.fpsLimit} FPS`,
      ),
      numeric(
        'joyScale',
        tx('摇杆大小', 'Joystick Size'),
        0.8,
        1.5,
        0.05,
        () => st.joyScale ?? 1,
        (n) => {
          st.joyScale = n;
        },
      ),
      [
        tx('摇杆位置', 'Joystick Side'),
        () => (st.joyRight ? tx('右手', 'Right') : tx('左手', 'Left')),
        () => {
          st.joyRight = !st.joyRight;
        },
      ],
      numeric(
        'btnScale',
        tx('按钮大小', 'Button Size'),
        0.85,
        1.4,
        0.05,
        () => st.btnScale ?? 1,
        (n) => {
          st.btnScale = n;
        },
      ),
    ];
    // 以下选项在战斗中暂停时不提供，避免丢失本波进度
    if (!this.fromPause)
      rows.push(
        // 语言：数据文本在启动时按语言写入，需要重新加载
        [
          tx('语言', 'Language'),
          () => (lang === 'en' ? 'English' : '中文'),
          (refresh) =>
            this.openChoice(
              [
                { label: '中文', value: 'zh' },
                { label: 'English', value: 'en' },
              ],
              st.lang ?? lang,
              (v) => {
                st.lang = v as 'zh' | 'en';
                this.markReload();
                refresh();
              },
            ),
        ],
        // 画质：下载的贴图档位在启动时确定，需要重新加载
        [
          tx('画质', 'Graphics quality'),
          () => this.qualityName(st.graphicsQuality ?? 'auto'),
          (refresh) =>
            this.openChoice(
              (['auto', 'low', 'standard', 'high'] as GraphicsQuality[]).map((v) => ({ label: this.qualityName(v), value: v })),
              st.graphicsQuality ?? 'auto',
              (v) => {
                st.graphicsQuality = v as GraphicsQuality;
                this.markReload();
                refresh();
              },
            ),
        ],
        // 高清渲染：按屏幕物理像素渲染（高分屏 / 全屏更清晰，GPU 负担更大）；渲染倍率在启动时确定，需要重新加载
        [
          tx('高清渲染', 'High-res rendering'),
          () =>
            st.hiDpi !== false
              ? tx(`开（${Math.round(RES * 100) / 100}×）`, `On (${Math.round(RES * 100) / 100}×)`)
              : tx('关（更省电）', 'Off (saves power)'),
          (refresh) =>
            this.openChoice(
              [
                { label: tx('开', 'On'), value: 'on' },
                { label: tx('关（更省电）', 'Off (saves power)'), value: 'off' },
              ],
              st.hiDpi !== false ? 'on' : 'off',
              (v) => {
                st.hiDpi = v === 'on';
                this.markReload();
                refresh();
              },
            ),
        ],
        [
          tx('新手引导', 'Tutorial tips'),
          () => (Object.keys(save.tutorial).length ? tx('重新显示', 'Show again') : tx('会显示', 'On')),
          () => resetTutorial(),
        ],
      );
    this.rows = rows;
    this.drawCategory();
    if (reloadPending && !this.fromPause) this.markReload();
    // ESC：弹窗打开时只关闭弹窗，否则返回
    const escape = () => (this.choice ? this.closeChoice() : this.resetDialog ? this.closeResetDialog() : this.back());
    this.input.keyboard?.on('keydown-ESC', escape);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown-ESC', escape);
      releaseArt('style-thumb');
      this.game.events.once('poststep', () => unloadUnusedArt(this.textures));
    });
  }

  private drawCategory(): void {
    this.closeChoice();
    this.stylePreview?.destroy();
    this.stylePreview = undefined;
    this.body?.destroy();
    this.tabs?.destroy();
    const { x, w } = this.frame;
    const H = VH(this);
    const before = new Set(this.children.list);
    const defs: [SettingsTab, string, string][] = [
      ['sound', tx('声音', 'Sound'), 'volume-up-fill'],
      ['graphics', tx('画面', 'Graphics'), 'display'],
      ['controls', tx('操作', 'Controls'), 'controller'],
      ['data', tx('存档', 'Save'), 'archive-fill'],
    ];
    const available = this.fromPause ? defs.slice(0, 3) : defs;
    const tw = (w - 68) / available.length;
    available.forEach(([id, title, icon], i) => {
      menuButton(
        this,
        x + 34 + tw * (i + 0.5),
        148,
        tw - 5,
        44,
        title,
        () => {
          this.tab = id;
          const data = this.registry.get('settingsLayoutData') as { tab: SettingsTab };
          data.tab = id;
          this.drawCategory();
        },
        id === this.tab,
        19,
        icon,
      ).setName(`settings-tab:${id}`);
    });
    this.tabs = this.add.container(
      0,
      0,
      this.children.list.filter((o) => !before.has(o)),
    );
    const start = new Set(this.children.list);
    const indices =
      this.tab === 'sound'
        ? [1, 0]
        : this.tab === 'graphics'
          ? this.fromPause
            ? [6, 7, 8]
            : [13, 14, 6, 7, 8]
          : this.tab === 'controls'
            ? [2, 3, 4, 5, 9, 10, 11]
            : [12, 15];
    const rowH = this.tab === 'sound' ? 100 : this.tab === 'controls' ? 46 : 48;
    const top = this.tab === 'sound' ? 248 : 211;
    indices.forEach((index, i) => {
      const [name, value, act, range] = this.rows[index];
      const y = top + i * rowH;
      this.add
        .graphics()
        .fillStyle(MENU.row, 0.6)
        .fillRoundedRect(x + 34, y - 20, w - 68, 40, 10);
      text(this, x + 54, y, name, tu(19), MENU.cream).setOrigin(0, 0.5);
      if (range) {
        settingSlider(this, x + w - 197, y - 2, Math.min(270, w * 0.36), range.id, range, value);
      } else if (index === 4 || index === 7 || index === 14) {
        const read = () => (index === 4 ? save.settings.showDmg : index === 7 ? save.settings.showFps : save.settings.hiDpi !== false);
        menuToggle(
          this,
          x + w - 132,
          y,
          read,
          () => {
            if (index === 14) {
              save.settings.hiDpi = !read();
              this.markReload();
            } else {
              act(() => {});
              persist();
            }
          },
          tx('开', 'On'),
          tx('关', 'Off'),
        );
      } else {
        const b = menuButton(
          this,
          x + w - 160,
          y,
          240,
          34,
          value(),
          () => {
            act(() => {
              persist();
              b.setLabel(value());
            });
            persist();
            b.setLabel(value());
          },
          false,
          tu(17),
        );
      }
    });
    if (this.tab === 'graphics' && !this.fromPause) this.drawStylePreviews();
    if (this.tab === 'data') this.dataRow(x, w);
    if (this.tab === 'sound') {
      text(this, x + 54, 419, tx('调整音量，即时试听。', 'Adjust the volume and hear the change.'), 16, MENU.dim);
    }
    if (this.tab === 'controls') {
      text(
        this,
        x + w / 2,
        H - 192,
        tx('WASD / 方向键移动 · 空格释放技能 · ESC 暂停', 'WASD / Arrows to move · Space for skill · ESC to pause'),
        13,
        MENU.dim,
      ).setOrigin(0.5);
    }
    this.body = this.add.container(
      0,
      0,
      this.children.list.filter((o) => !start.has(o)),
    );
  }

  private qualityName(v: GraphicsQuality): string {
    return { auto: tx('自动', 'Auto'), low: tx('低', 'Low'), standard: tx('标准', 'Standard'), high: tx('高', 'High') }[v];
  }

  private styleName(v: ArtStyle): string {
    return v === 'retro' ? tx('复古风', 'Retro') : tx('可爱风', 'Cute');
  }

  /** 有需要重新加载才生效的改动：在「返回」旁边出现「应用并重新加载」 */
  private markReload(): void {
    persist();
    reloadPending = true;
    if (this.applyBtn) return;
    if (this.fromPause) return;
    const { x, w } = this.frame;
    this.applyBtn = menuButton(
      this,
      x + w - 175,
      VH(this) - 84,
      282,
      48,
      tx('应用并重载', 'Apply & reload'),
      () => location.reload(),
      true,
      20,
    );
    this.applyBtn.setDepth(5);
  }

  private closeChoice(): void {
    this.choice?.destroy();
    this.choice = undefined;
  }

  /** 下拉选项：在页面中央列出全部选项，点选后关闭 */
  private openChoice(opts: { label: string; value: string }[], cur: string, pick: (v: string) => void): void {
    this.closeChoice();
    const W = VW(this),
      H = VH(this);
    const c = this.add.container(0, 0).setDepth(1500);
    this.choice = c;
    const mask = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    mask.on('pointerup', () => this.closeChoice());
    const bw = 280,
      bh = 48,
      gap = 10;
    const PH = opts.length * (bh + gap) + gap + 16;
    const px = W / 2 - bw / 2 - 20,
      py = H / 2 - PH / 2;
    const block = this.add.zone(W / 2, H / 2, bw + 40, PH).setInteractive();
    c.add([mask, block, panel(this, px, py, bw + 40, PH, MENU.panel, MENU.gold)]);
    opts.forEach((o, i) => {
      const on = o.value === cur;
      c.add(
        menuButton(
          this,
          W / 2,
          py + 8 + gap + bh / 2 + i * (bh + gap),
          bw,
          bh,
          `${on ? '✓ ' : ''}${o.label}`,
          () => {
            this.closeChoice();
            if (!on) pick(o.value);
          },
          on,
          22,
        ),
      );
    });
  }

  /** 两种画风用同一个番茄妹缩略图：可爱风 = 插画贴图，复古风 = 程序绘制（没有任何贴图） */
  private styleThumb(style: ArtStyle): string | null {
    const key = `style_thumb_${style}`;
    if (this.textures.exists(key)) return key;
    const illustrated = style === 'cute';
    if (illustrated && !readyArt(this, TOMATO, true)) return null;
    const vis = createEntityVisual(this, TOMATO, 44, illustrated ? { illustrated: true } : { procedural: true });
    vis.tick(0.001, 0, 1);
    const rt = this.make.renderTexture({ width: 128, height: 128 }, false);
    rt.draw(vis, 64, 70);
    rt.saveTexture(key);
    vis.destroy();
    rt.destroy();
    return key;
  }

  /** 两种画风直接并排预览；不需要先打开下拉框或弹窗。 */
  private drawStylePreviews(): void {
    this.stylePreview?.destroy();
    const { x, w } = this.frame;
    const c = this.add.container(0, 0).setName('art-style-previews');
    this.stylePreview = c;
    const cardW = (w - 82) / 2,
      cardH = 74,
      gap = 14;
    (['cute', 'retro'] as ArtStyle[]).forEach((style, i) => {
      const cx = x + w / 2 + ((i ? 1 : -1) * (cardW + gap)) / 2;
      const cy = 507;
      const on = style === currentArtStyle();
      const card = this.add.container(cx, cy).setName(`art-style-card:${style}`);
      const bg = this.add.graphics();
      bg.fillStyle(on ? 0x51332c : 0x35231f, 1).fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
      bg.lineStyle(on ? 3 : 2, on ? 0xefc679 : 0xa47750, 1).strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
      card.add(bg);
      const tk = this.styleThumb(style);
      if (tk)
        card.add(
          this.add
            .image(-cardW / 2 + 40, 0, tk)
            .setDisplaySize(66, 66)
            .setName(`art-style-image:${style}`),
        );
      else card.add(text(this, -cardW / 2 + 40, 0, tx('加载中…', 'Loading…'), 13, COLORS.textDim).setOrigin(0.5));
      card.add(
        text(this, -cardW / 2 + 84, -14, `${on ? '✓ ' : ''}${this.styleName(style)}`, 20, on ? '#ffe1a5' : '#fff4ea').setOrigin(0, 0.5),
      );
      card.add(
        text(
          this,
          -cardW / 2 + 84,
          16,
          style === 'cute' ? tx('插画（AI 生成）', 'Illustrated (AI-generated)') : tx('经典简洁', 'Classic'),
          15,
          '#d4b8a4',
        ).setOrigin(0, 0.5),
      );
      card.setSize(cardW, cardH).setInteractive({ useHandCursor: true });
      card.on('pointerup', () => {
        if (style === currentArtStyle()) return;
        audio.play(this, 'click');
        if (style === 'cute' && !readyArt(this, TOMATO, true)) return;
        this.switchStyle(style);
      });
      c.add(card);
    });
    if (!readyArt(this, TOMATO, true))
      void loadArt(this, { bodies: [TOMATO], raw: true }, 'style-thumb').then(() => {
        if (this.stylePreview === c && this.scene.isActive() && readyArt(this, TOMATO, true)) {
          this.drawStylePreviews();
          if (this.stylePreview) this.body?.add(this.stylePreview);
        }
      });
  }

  private switchStyle(style: ArtStyle): void {
    applyArtStyle(this, style, () => {
      if (this.scene.isActive()) this.scene.restart({ from: this.fromPause ? 'pause' : undefined, tab: this.tab });
    });
  }

  /** 存档导出 / 导入、错误日志、重置存档 */
  private dataRow(x: number, w: number): void {
    const y = 355;
    const msg = text(this, x + w / 2, 495, '', 16, COLORS.textDim).setOrigin(0.5);
    const say = (s: string, ok = true) => msg.setText(s).setColor(ok ? '#52ff8a' : '#ff6b6b');
    menuButton(
      this,
      x + w * 0.28,
      y,
      w * 0.36,
      50,
      tx('导出存档', 'Export Save'),
      () => {
        const t = exportSave();
        // 下载为文件，同时复制到剪贴板
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' }));
        a.download = `tomageddon-save-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        void navigator.clipboard?.writeText(t).catch(() => {});
        say(tx('已下载存档文件，并复制到剪贴板', 'Save downloaded and copied to clipboard'));
      },
      false,
      20,
    );
    menuButton(
      this,
      x + w * 0.72,
      y,
      w * 0.36,
      50,
      tx('导入存档', 'Import Save'),
      () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.json,text/plain,application/json';
        input.onchange = () => {
          const f = input.files?.[0];
          if (!f) return;
          void f.text().then((t) => {
            const err = importSave(t);
            if (err) return say(tx('文件不是有效的存档', 'Not a valid save file'), false);
            say(tx('存档已导入', 'Save imported'));
            this.time.delayedCall(600, () => this.scene.start('Menu'));
          });
        };
        input.click();
      },
      false,
      20,
    );
    const n = errorLog().length;
    const eb = menuButton(
      this,
      x + w * 0.28,
      y + 76,
      w * 0.36,
      50,
      tx(`复制错误日志 (${n})`, `Copy Error Log (${n})`),
      () => {
        if (!errorLog().length) return say(tx('没有错误记录', 'No errors recorded'));
        void navigator.clipboard
          ?.writeText(errorReport())
          .then(() => say(tx('已复制，可以发给开发者', 'Copied — send it to the developer')))
          .catch(() => say(tx('剪贴板不可用', 'Clipboard unavailable'), false));
      },
      false,
      18,
    );
    if (n)
      eb.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) {
          clearErrorLog();
          eb.setLabel(tx('复制错误日志 (0)', 'Copy Error Log (0)'));
        }
      });
    menuButton(
      this,
      x + w * 0.72,
      y + 76,
      w * 0.36,
      50,
      tx('重置存档', 'Reset Save'),
      () => this.openResetDialog(1),
      false,
      20,
      'trash3-fill',
    );
  }

  /**
   * 重置存档的三步确认弹窗，防止误操作：
   * 1. 警告 + 3 秒倒计时后才能继续；
   * 2. 再次警告，确认/取消按钮左右互换位置 + 3 秒倒计时；
   * 3. 长按 3 秒才执行（松手即中断）。
   * 任何一步都可以取消、点遮罩或按 ESC 退出。
   */
  private openResetDialog(step: 1 | 2 | 3): void {
    this.closeResetDialog();
    const W = VW(this),
      H = VH(this);
    const c = this.add.container(0, 0).setDepth(2000);
    this.resetDialog = c;
    const mask = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setInteractive();
    mask.on('pointerup', () => this.closeResetDialog());
    const PW = Math.min(W - 40, 620),
      PH = 340;
    const px = W / 2 - PW / 2,
      py = H / 2 - PH / 2;
    // 面板本身吞掉点击，避免点到遮罩关闭
    const block = this.add.zone(W / 2, H / 2, PW, PH).setInteractive();
    const g = panel(this, px, py, PW, PH, COLORS.panel, 0xff4b3e);
    const title = text(this, W / 2, py + 40, tx(`重置存档（${step}/3）`, `Reset Save (${step}/3)`), 30, '#ff6b6b').setOrigin(0.5);
    const bodies = {
      1: tx(
        '将永久清除全部进度：角色、天赋、成就、金币、图鉴和设置。\n此操作无法撤销！',
        'This permanently erases ALL progress: characters, talents,\nachievements, gold, codex and settings.\nThis cannot be undone!',
      ),
      2: tx(
        '真的要重置吗？\n如果之后可能想恢复，请先取消并点「导出存档」备份。',
        'Are you really sure?\nIf you may want it back, cancel and use "Export Save" first.',
      ),
      3: tx('最后一步：按住下方按钮 3 秒执行重置。\n松手即取消。', 'Final step: hold the button below for 3 seconds.\nRelease to abort.'),
    };
    const body = text(this, W / 2, py + 130, bodies[step], 20, COLORS.text, { align: 'center', wordWrap: { width: PW - 60 } }).setOrigin(
      0.5,
    );
    c.add([mask, block, g, title, body]);
    const by = py + PH - 60;
    const cancelLabel = tx('取消', 'Cancel');

    if (step < 3) {
      // 第 2 步左右互换，连点同一位置不会一路确认下去
      const okX = step === 1 ? W / 2 + 130 : W / 2 - 130;
      const cancelX = step === 1 ? W / 2 - 130 : W / 2 + 130;
      c.add(button(this, cancelX, by, 220, 54, cancelLabel, () => this.closeResetDialog(), 0x555555, 22));
      const okLabel = step === 1 ? tx('继续', 'Continue') : tx('确定重置', 'Yes, reset');
      const ok = button(this, okX, by, 220, 54, '', () => this.openResetDialog((step + 1) as 2 | 3), 0x7a2e35, 22);
      c.add(ok);
      let left = 3;
      const tick = () => {
        if (left > 0) ok.setEnabled(false).setLabel(`${okLabel} (${left})`);
        else ok.setEnabled(true).setLabel(okLabel);
      };
      tick();
      const timer = this.time.addEvent({
        delay: 1000,
        repeat: 2,
        callback: () => {
          left--;
          tick();
        },
      });
      c.once('destroy', () => timer.remove());
      return;
    }

    // 第 3 步：长按 3 秒
    c.add(button(this, W / 2 - 150, by, 180, 54, cancelLabel, () => this.closeResetDialog(), 0x555555, 22));
    const HW = 260,
      HH = 54,
      hx = W / 2 + 90,
      HOLD_MS = 3000;
    const hold = this.add.container(hx, by);
    const hg = this.add.graphics();
    const holdLabel = tx('按住 3 秒重置', 'Hold 3s to reset');
    const ht = text(this, 0, 0, holdLabel, 22).setOrigin(0.5);
    hold.add([hg, ht]).setSize(HW, HH).setInteractive({ useHandCursor: true });
    c.add(hold);
    let held = 0;
    let timer: Phaser.Time.TimerEvent | null = null;
    const draw = () => {
      const p = held / HOLD_MS;
      hg.clear();
      hg.fillStyle(0x4a1c22, 1).fillRoundedRect(-HW / 2, -HH / 2, HW, HH, 14);
      if (p > 0) hg.fillStyle(0xd62828, 1).fillRoundedRect(-HW / 2, -HH / 2, Math.max(28, HW * p), HH, 14);
      hg.lineStyle(2, 0xff6b6b, 1).strokeRoundedRect(-HW / 2, -HH / 2, HW, HH, 14);
      ht.setText(
        p > 0
          ? tx(`保持按住… ${((HOLD_MS - held) / 1000).toFixed(1)}s`, `Keep holding… ${((HOLD_MS - held) / 1000).toFixed(1)}s`)
          : holdLabel,
      );
    };
    const stop = () => {
      timer?.remove();
      timer = null;
      held = 0;
      draw();
    };
    draw();
    hold.on('pointerdown', () => {
      if (timer) return;
      audio.play(this, 'click');
      timer = this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          held += 50;
          if (held >= HOLD_MS) {
            stop();
            this.closeResetDialog();
            resetSave();
            this.scene.restart();
            return;
          }
          draw();
        },
      });
    });
    hold.on('pointerup', stop);
    hold.on('pointerout', stop);
    c.once('destroy', () => timer?.remove());
  }

  private closeResetDialog(): void {
    this.resetDialog?.destroy();
    this.resetDialog = undefined;
  }

  private back(): void {
    if (this.fromPause) {
      this.scene.stop();
      this.scene.wake('Pause');
    } else this.scene.start('Menu');
  }
}
