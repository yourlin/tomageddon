// 设置：两列选项 + 存档导入导出（K5）+ 错误日志（K10）
import { resetTutorial } from '../systems/Tutorial';
import Phaser from 'phaser';
import { text, button, panel, COLORS, autoRelayout } from '../ui/UI';
import { save, persist, resetSave, exportSave, importSave } from '../systems/Save';
import { audio } from '../systems/Audio';
import { FPS_OPTIONS, applyFpsLimit, setFpsDisplay } from '../systems/Perf';
import { errorLog, errorReport, clearErrorLog } from '../systems/ErrorLog';
import { tx, lang } from '../i18n';

const pct = (v: number) => `${Math.round(v * 100)}%`;
/** 在 opts 里循环取下一个值 */
const cycle = <T>(opts: T[], cur: T): T => opts[(opts.indexOf(cur) + 1) % opts.length];

export class SettingsScene extends Phaser.Scene {
  private confirmReset = false;
  constructor() {
    super('Settings');
  }

  private fromPause = false;

  create(data?: { from?: string }): void {
    this.fromPause = data?.from === 'pause';
    autoRelayout(this, data);
    const W = this.scale.width,
      H = this.scale.height;
    this.confirmReset = false;
    if (this.fromPause) this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive();
    else this.cameras.main.setBackgroundColor(COLORS.bg);
    const PW = Math.min(W - 40, 1100);
    panel(this, W / 2 - PW / 2, 30, PW, H - 60);
    text(this, W / 2, 70, tx('设置', 'Settings'), 38).setOrigin(0.5);
    const st = save.settings;
    const onOff = (v: boolean) => (v ? tx('开', 'On') : tx('关', 'Off'));
    const rows: [string, () => string, () => void][] = [
      [
        tx('音效', 'Sound FX'),
        () => pct(st.sfx),
        () => {
          st.sfx = st.sfx >= 1 ? 0 : Math.round((st.sfx + 0.25) * 100) / 100;
          audio.play(this, 'click');
        },
      ],
      [
        tx('音乐', 'Music'),
        () => pct(st.music),
        () => {
          st.music = st.music >= 1 ? 0 : Math.round((st.music + 0.25) * 100) / 100;
          audio.setMusicVolume(st.music);
        },
      ],
      [
        tx('技能释放', 'Skill Cast'),
        () => (st.autoSkill ? tx('自动', 'Auto') : tx('手动', 'Manual')),
        () => (st.autoSkill = !st.autoSkill),
      ],
      // L1：震动强度（关 / 弱 / 中 / 强）
      [
        tx('屏幕震动', 'Screen Shake'),
        () => (!st.shake ? tx('关', 'Off') : pct(st.shakeScale ?? 1)),
        () => {
          const levels = [0, 0.5, 1, 1.5];
          const cur = st.shake ? (st.shakeScale ?? 1) : 0;
          const next = cycle(levels, levels.includes(cur) ? cur : 1);
          st.shake = next > 0;
          st.shakeScale = next || 1;
        },
      ],
      [tx('伤害数字', 'Damage Numbers'), () => onOff(st.showDmg), () => (st.showDmg = !st.showDmg)],
      // L1：伤害数字密度（暴击总显示）
      [tx('伤害数字密度', 'Number Density'), () => pct(st.dmgDensity ?? 1), () => (st.dmgDensity = cycle([1, 0.5, 0.25, 0.1], st.dmgDensity ?? 1))],
      // L1：粒子数量
      [tx('粒子数量', 'Particles'), () => pct(st.particles ?? 1), () => (st.particles = cycle([1, 0.5, 0.25, 0], st.particles ?? 1))],
      [
        tx('显示帧数', 'Show FPS'),
        () => onOff(st.showFps),
        () => {
          st.showFps = !st.showFps;
          setFpsDisplay(this.game, st.showFps);
        },
      ],
      [
        tx('帧数上限', 'FPS Limit'),
        () => `${st.fpsLimit} FPS`,
        () => {
          st.fpsLimit = cycle(FPS_OPTIONS, st.fpsLimit);
          applyFpsLimit(this.game, st.fpsLimit);
        },
      ],
      // L2：移动端操作
      [tx('摇杆大小', 'Joystick Size'), () => pct(st.joyScale ?? 1), () => (st.joyScale = cycle([1, 1.25, 1.5, 0.8], st.joyScale ?? 1))],
      [
        tx('摇杆位置', 'Joystick Side'),
        () => (st.joyRight ? tx('右手', 'Right') : tx('左手', 'Left')),
        () => (st.joyRight = !st.joyRight),
      ],
      [tx('按钮大小', 'Button Size'), () => pct(st.btnScale ?? 1), () => (st.btnScale = cycle([1, 1.2, 1.4, 0.85], st.btnScale ?? 1))],
    ];
    // 切换语言需要重新加载（数据文本在启动时按语言写入）；战斗中暂停时不提供，避免丢失本波进度
    if (!this.fromPause)
      rows.push(
        [
          tx('语言', 'Language'),
          () => (lang === 'en' ? 'English' : '中文'),
          () => {
            st.lang = lang === 'en' ? 'zh' : 'en';
            persist();
            location.reload();
          },
        ],
        [
          tx('新手引导', 'Tutorial tips'),
          () => (Object.keys(save.tutorial).length ? tx('重新显示', 'Show again') : tx('会显示', 'On')),
          () => resetTutorial(),
        ],
      );
    const perCol = Math.ceil(rows.length / 2);
    const top = 120;
    const rowH = Math.min(48, (H - 300 - top) / perCol);
    const colW = PW / 2;
    rows.forEach(([name, val, act], i) => {
      const col = Math.floor(i / perCol);
      const x0 = W / 2 - PW / 2 + col * colW;
      const y = top + (i % perCol) * rowH;
      text(this, x0 + 40, y, name, 22).setOrigin(0, 0.5);
      const b = button(
        this,
        x0 + colW - 130,
        y,
        190,
        Math.min(42, rowH - 4),
        val(),
        () => {
          act();
          persist();
          b.setLabel(val());
        },
        0x4a6fa5,
        20,
      );
    });
    if (!this.fromPause) this.dataRow(W, H);
    button(this, W / 2, H - 70, 260, 54, tx('返回', 'Back'), () => this.back(), 0x555555, 22);
    this.input.keyboard?.once('keydown-ESC', () => this.back());
  }

  /** 存档导出 / 导入、错误日志、重置存档 */
  private dataRow(W: number, H: number): void {
    const y = H - 140;
    const msg = text(this, W / 2, y - 42, '', 16, COLORS.textDim).setOrigin(0.5);
    const say = (s: string, ok = true) => msg.setText(s).setColor(ok ? '#52ff8a' : '#ff6b6b');
    button(
      this,
      W / 2 - 390,
      y,
      180,
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
      0x2a6f97,
      20,
    );
    button(
      this,
      W / 2 - 195,
      y,
      180,
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
      0x2a6f97,
      20,
    );
    const n = errorLog().length;
    const eb = button(
      this,
      W / 2,
      y,
      180,
      50,
      tx(`复制错误日志 (${n})`, `Copy Error Log (${n})`),
      () => {
        if (!errorLog().length) return say(tx('没有错误记录', 'No errors recorded'));
        void navigator.clipboard
          ?.writeText(errorReport())
          .then(() => say(tx('已复制，可以发给开发者', 'Copied — send it to the developer')))
          .catch(() => say(tx('剪贴板不可用', 'Clipboard unavailable'), false));
      },
      0x6a4c93,
      18,
    );
    if (n)
      eb.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) {
          clearErrorLog();
          eb.setLabel(tx('复制错误日志 (0)', 'Copy Error Log (0)'));
        }
      });
    const rb = button(
      this,
      W / 2 + 290,
      y,
      240,
      50,
      tx('重置存档', 'Reset Save'),
      () => {
        if (!this.confirmReset) {
          this.confirmReset = true;
          rb.setLabel(tx('再次点击确认重置', 'Click again to confirm'));
          return;
        }
        resetSave();
        this.scene.restart();
      },
      0x7a2e35,
      20,
    );
  }

  private back(): void {
    if (this.fromPause) {
      this.scene.stop();
      this.scene.wake('Pause');
    } else this.scene.start('Menu');
  }
}
