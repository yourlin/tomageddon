// 设置
import { resetTutorial } from '../systems/Tutorial';
import Phaser from 'phaser';
import { text, button, panel, COLORS, autoRelayout } from '../ui/UI';
import { save, persist, resetSave } from '../systems/Save';
import { audio } from '../systems/Audio';
import { FPS_OPTIONS, applyFpsLimit, setFpsDisplay } from '../systems/Perf';
import { tx, lang } from '../i18n';

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
    panel(this, W / 2 - 300, 40, 600, H - 80);
    text(this, W / 2, 90, tx('设置', 'Settings'), 40).setOrigin(0.5);
    const st = save.settings;
    const rows: [string, () => string, () => void][] = [
      [
        tx('音效', 'Sound FX'),
        () => `${Math.round(st.sfx * 100)}%`,
        () => {
          st.sfx = st.sfx >= 1 ? 0 : Math.round((st.sfx + 0.25) * 100) / 100;
          audio.play(this, 'click');
        },
      ],
      [
        tx('音乐', 'Music'),
        () => `${Math.round(st.music * 100)}%`,
        () => {
          st.music = st.music >= 1 ? 0 : Math.round((st.music + 0.25) * 100) / 100;
          audio.setMusicVolume(st.music);
        },
      ],
      [
        tx('屏幕震动', 'Screen Shake'),
        () => (st.shake ? tx('开', 'On') : tx('关', 'Off')),
        () => {
          st.shake = !st.shake;
        },
      ],
      [
        tx('伤害数字', 'Damage Numbers'),
        () => (st.showDmg ? tx('开', 'On') : tx('关', 'Off')),
        () => {
          st.showDmg = !st.showDmg;
        },
      ],
      [
        tx('显示帧数', 'Show FPS'),
        () => (st.showFps ? tx('开', 'On') : tx('关', 'Off')),
        () => {
          st.showFps = !st.showFps;
          setFpsDisplay(this.game, st.showFps);
        },
      ],
      [
        tx('帧数上限', 'FPS Limit'),
        () => `${st.fpsLimit} FPS`,
        () => {
          const i = FPS_OPTIONS.indexOf(st.fpsLimit);
          st.fpsLimit = FPS_OPTIONS[(i + 1) % FPS_OPTIONS.length];
          applyFpsLimit(this.game, st.fpsLimit);
        },
      ],
    ];
    rows.splice(2, 0, [
      tx('技能释放', 'Skill Cast'),
      () => (st.autoSkill ? tx('自动', 'Auto') : tx('手动', 'Manual')),
      () => {
        st.autoSkill = !st.autoSkill;
      },
    ]);
    // 切换语言需要重新加载（数据文本在启动时按语言写入）；战斗中暂停时不提供，避免丢失本波进度
    if (!this.fromPause)
      rows.push([
        tx('语言', 'Language'),
        () => (lang === 'en' ? 'English' : '中文'),
        () => {
          st.lang = lang === 'en' ? 'zh' : 'en';
          persist();
          location.reload();
        },
      ]);
    if (!this.fromPause)
      rows.push([
        tx('新手引导', 'Tutorial tips'),
        () => (Object.keys(save.tutorial).length ? tx('重新显示', 'Show again') : tx('会显示', 'On')),
        () => resetTutorial(),
      ]);
    rows.forEach(([name, val, act], i) => {
      const y = 130 + i * 45;
      text(this, W / 2 - 230, y, name, 26).setOrigin(0, 0.5);
      const b = button(
        this,
        W / 2 + 140,
        y,
        200,
        44,
        val(),
        () => {
          act();
          persist();
          b.setLabel(val());
        },
        0x4a6fa5,
        24,
      );
    });
    if (!this.fromPause) {
      const rb = button(
        this,
        W / 2,
        H - 170,
        300,
        56,
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
        22,
      );
    }
    button(this, W / 2, H - 90, 300, 60, tx('返回', 'Back'), () => this.back(), 0x555555, 24);
    this.input.keyboard?.once('keydown-ESC', () => this.back());
  }

  private back(): void {
    if (this.fromPause) {
      this.scene.stop();
      this.scene.wake('Pause');
    } else this.scene.start('Menu');
  }
}
