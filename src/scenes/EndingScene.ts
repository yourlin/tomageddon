// G4：真结局演出——击败第 7 章的腐烂之王后播放。逐行淡入的旁白 + 番茄雨，结束后进入结算
import Phaser from 'phaser';
import { text, button, COLORS } from '../ui/UI';
import { save, persist } from '../systems/Save';
import { bump } from '../systems/Counters';
import { audio } from '../systems/Audio';
import { tx } from '../i18n';

const LINES: [string, string][] = [
  ['腐烂之王倒下了。', 'The Rot King has fallen.'],
  ['菜园深处的黑泥慢慢退去，露出底下湿润的土壤。', 'The black sludge drains from the garden, revealing moist soil beneath.'],
  ['原来一切腐烂，都只是种子在等一场雨。', 'All that rot was only seeds, waiting for the rain.'],
  ['第二天早上，番茄酱小镇的每一块菜地都发了芽。', 'The next morning, every plot in Ketchup Town sprouted.'],
  ['而你，是第一个看到它们的人。', 'And you were the first to see them.'],
];

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create(): void {
    const W = this.scale.width,
      H = this.scale.height;
    this.cameras.main.setBackgroundColor(0x0a0604);
    save.meta.trueEnding = (save.meta.trueEnding ?? 0) + 1;
    bump('trueEndings');
    persist();
    audio.playMusic(this, 'bgm_menu');
    // 番茄雨
    this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        const t = this.add.text(Math.random() * W, -30, Math.random() < 0.8 ? '🍅' : '🌱', { fontSize: `${18 + Math.random() * 18}px` });
        this.tweens.add({
          targets: t,
          y: H + 40,
          angle: Math.random() * 360,
          duration: 3000 + Math.random() * 2000,
          onComplete: () => t.destroy(),
        });
      },
    });
    LINES.forEach(([zh, en], i) => {
      const t = text(this, W / 2, H * 0.22 + i * 56, tx(zh, en), i === 0 ? 34 : 24, i === 0 ? '#ffd166' : '#fff4ea', {
        align: 'center',
        wordWrap: { width: W - 120 },
      })
        .setOrigin(0.5)
        .setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, delay: 600 + i * 1800, duration: 1200 });
    });
    const done = () => this.scene.start('Result', { win: true });
    this.time.delayedCall(600 + LINES.length * 1800 + 800, () => {
      const title = text(this, W / 2, H * 0.22 + LINES.length * 56 + 30, tx('—— 真结局 ——', '— True Ending —'), 30, '#ff4b3e')
        .setOrigin(0.5)
        .setAlpha(0);
      this.tweens.add({ targets: title, alpha: 1, duration: 1000 });
      button(this, W / 2, H - 70, 240, 60, tx('继续', 'Continue'), done, COLORS.primary, 24);
    });
    // 想跳过可以直接点继续（小按钮）
    button(this, W - 80, 40, 120, 40, tx('跳过', 'Skip'), done, 0x555555, 16);
  }
}
