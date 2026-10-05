// 更新日志：最新版本默认展开，历史版本折叠（点击标题展开/收起）；完整改动指向 git 提交记录
import Phaser from 'phaser';
import { openExternal } from '../platform';
import { text, button, panel, COLORS, autoRelayout, hitArea } from '../ui/UI';
import { CHANGELOG } from '../data/changelog';
import { tx, lang } from '../i18n';
import { save, persist } from '../systems/Save';

export class ChangelogScene extends Phaser.Scene {
  /** 展开的版本号，默认最新 */
  private open = new Set<string>([CHANGELOG[0].version]);
  private layer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScroll = 0;

  constructor() {
    super('Changelog');
  }

  create(): void {
    autoRelayout(this);
    save.seenVersion = __APP_VERSION__;
    persist();
    const W = this.scale.width;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    text(this, 24, 18, tx('更新日志', "What's New"), 36);
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);
    button(
      this,
      W - 290,
      44,
      250,
      52,
      tx('查看完整改动 ↗', 'Full changelog ↗'),
      () => openExternal(`${__REPO_URL__}/blob/main/${lang === 'en' ? 'docs/en' : 'docs'}/CHANGELOG.md`),
      0x4a6fa5,
      19,
    );
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.scrollBy(dy));
    this.input.on('drag', () => {});
    this.draw();
  }

  private scrollBy(dy: number): void {
    const next = Phaser.Math.Clamp(this.scrollY + dy, 0, this.maxScroll);
    if (next === this.scrollY) return;
    this.scrollY = next;
    this.layer.setY(-this.scrollY);
  }

  private draw(): void {
    this.layer?.destroy();
    const L = (this.layer = this.add.container(0, -this.scrollY));
    const W = this.scale.width;
    const cw = Math.min(980, W - 80);
    const x = (W - cw) / 2;
    let y = 108;
    CHANGELOG.forEach((e, i) => {
      const open = this.open.has(e.version);
      const latest = i === 0;
      const lines = open
        ? e.items.map((it) => {
            const t = text(this, 0, 0, `· ${it[lang === 'en' ? 1 : 0]}`, 18, COLORS.text);
            t.setWordWrapWidth(cw - 72, true); // 高级换行：中文按字断行，否则整段挤成一行
            return t;
          })
        : [];
      const bodyH = lines.reduce((a, t) => a + t.height + 10, 0);
      const head = text(this, 0, 0, e.highlight[lang === 'en' ? 1 : 0], 19, '#ffd166');
      head.setWordWrapWidth(cw - 72, true);
      const ch = 76 + head.height + 12 + (open ? bodyH + 8 : 0);
      L.add(panel(this, x, y, cw, ch, COLORS.panel, latest ? COLORS.primary : 0x3a3a3a));
      L.add(text(this, x + 24, y + 20, `v${e.version}`, 28, latest ? '#ff6b5e' : COLORS.text));
      L.add(text(this, x + 24 + 26 + `v${e.version}`.length * 15, y + 30, e.date, 16, COLORS.textDim));
      if (latest) {
        L.add(panel(this, x + cw - 116, y + 20, 92, 30, 0x8a2f28, COLORS.primary));
        L.add(text(this, x + cw - 70, y + 35, tx('最新', 'Latest'), 17, '#ffd7d2').setOrigin(0.5));
      } else {
        L.add(text(this, x + cw - 30, y + 34, open ? '▲' : '▼', 20, COLORS.textDim).setOrigin(1, 0.5));
      }
      head.setPosition(x + 24, y + 62);
      L.add(head);
      let ly = y + 62 + head.height + 14;
      for (const t of lines) {
        t.setPosition(x + 36, ly);
        L.add(t);
        ly += t.height + 10;
      }
      // 点击标题条展开 / 收起（最新版也可收起）
      L.add(
        hitArea(this, x, y, cw, 56, () => {
          if (this.open.has(e.version)) this.open.delete(e.version);
          else this.open.add(e.version);
          this.draw();
        }),
      );
      y += ch + 16;
    });
    L.add(
      text(
        this,
        W / 2,
        y + 6,
        tx('详细改动记录见 GitHub 仓库的更新日志与提交历史', 'See the changelog and commit history in the GitHub repo for full detail'),
        16,
        COLORS.textDim,
      ).setOrigin(0.5, 0),
    );
    this.maxScroll = Math.max(0, y + 80 - this.scale.height);
    this.scrollY = Math.min(this.scrollY, this.maxScroll);
    L.setY(-this.scrollY);
  }
}
