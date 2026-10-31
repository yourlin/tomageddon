import { journalNav } from '../ui/JournalNav';
import { catalogButton as button } from '../ui/CatalogUI';
// Medal gallery with real progress, automatic rewards and a compact detail band.
import Phaser from 'phaser';
import { text, hitArea, fitImage, COLORS, autoRelayout, TOUCH, tu } from '../ui/UI';
import { preloadWorkbench, workbenchBackground, workbenchPanel as panel } from '../ui/WorkbenchUI';
import { ACHIEVEMENTS, ACH_CATEGORY_NAME, TIER_NAME, type AchievementDef, type AchCategory } from '../data/achievements';
import { achText, achTier, achValue, tierGoal, isMaxed, pick, pointsEarned, checkAchievements } from '../systems/Achievements';
import { promptText } from '../ui/DomInput';
import { tx } from '../i18n';
import { CHARACTERS } from '../data/characters';
import { VW, VH } from '../systems/HiDpi';

type Filter = AchCategory | 'all';
const MEDALS = ['bronze', 'silver', 'gold', 'diamond', 'slayer', 'forge', 'economy', 'crown'];
export class AchievementScene extends Phaser.Scene {
  private filter: Filter = 'all';
  private page = 0;
  private unfinished = false;
  private selected = '';
  private layer!: Phaser.GameObjects.Container;
  private popup: Phaser.GameObjects.Container | null = null;
  constructor() {
    super('Achievements');
  }
  preload(): void {
    preloadWorkbench(this);
    for (const name of MEDALS)
      if (!this.textures.exists(`medal:${name}`))
        this.load.image(`medal:${name}`, `${import.meta.env.BASE_URL}assets/ui/achievements/medal-${name}.webp`);
  }
  create(): void {
    autoRelayout(this);
    checkAchievements();
    this.layer = this.add.container(0, 0);
    this.draw();
  }
  private medal(a: AchievementDef): string {
    const tier = achTier(a.id);
    if (tier > 1 || (tier > 0 && a.tiers.length === 1)) return `medal:${a.tiers.length === 1 ? 'gold' : MEDALS[Math.min(3, tier - 1)]}`;
    if (a.id.includes('forge')) return 'medal:forge';
    if (a.category === 'economy') return 'medal:economy';
    if (['slayer', 'monster'].includes(a.category)) return 'medal:slayer';
    if (a.category === 'progress' || a.category === 'chapter') return 'medal:crown';
    return 'medal:bronze';
  }
  private label(x: number, y: number, value: string, size: number, width: number, color = '#fff0ce') {
    const t = text(this, x, y, value, size, color);
    let shown = value;
    while (shown.length > 1 && t.width > width) {
      shown = shown.slice(0, -1);
      t.setText(shown + '…');
    }
    this.layer.add(t);
    return t;
  }
  private selectFilter(filter: Filter): void {
    this.filter = filter;
    this.page = 0;
    this.selected = '';
    this.draw();
  }
  private categories(): void {
    this.popup?.destroy();
    const W = VW(this),
      H = VH(this),
      p = this.add.container(0, 0).setDepth(100);
    this.popup = p;
    p.add(this.add.rectangle(W / 2, H / 2, W, H, 0x100910, 0.85).setInteractive());
    const w = Math.min(800, W - 48),
      x = (W - w) / 2,
      y = Math.max(24, (H - (TOUCH ? 620 : 440)) / 2);
    p.add(panel(this, x, y, w, TOUCH ? 620 : 440));
    p.add(text(this, x + 24, y + 20, tx('成就分类', 'Achievement categories'), 26, '#fff0ce'));
    const list: [Filter, string][] = [
      ['all', tx('全部', 'All')],
      ...Object.entries(ACH_CATEGORY_NAME).map(([k, v]) => [k as Filter, pick(v)] as [Filter, string]),
    ];
    list.forEach(([key, name], i) =>
      p.add(
        button(
          this,
          x + 28 + ((i % 3) + 0.5) * ((w - 56) / 3),
          y + (TOUCH ? 136 : 94) + Math.floor(i / 3) * (TOUCH ? 92 : 62),
          (w - 80) / 3,
          50,
          name,
          () => {
            p.destroy();
            this.popup = null;
            this.selectFilter(key);
          },
          key === this.filter ? COLORS.primary : COLORS.gray,
          TOUCH ? 26 : tu(18),
        ),
      ),
    );
    p.add(
      button(
        this,
        x + w - 66,
        y + 44,
        92,
        44,
        tx('关闭', 'Close'),
        () => {
          p.destroy();
          this.popup = null;
        },
        COLORS.gray,
        17,
      ),
    );
  }
  private async jump(pages: number): Promise<void> {
    const value = await promptText(tx('跳转成就页码', 'Go to achievement page'), `1–${pages}`, String(this.page + 1));
    if (value === null || !this.scene.isActive()) return;
    const page = Number(value);
    if (Number.isInteger(page)) {
      this.page = Phaser.Math.Clamp(page - 1, 0, pages - 1);
      this.draw();
    }
  }
  private info(a: AchievementDef): void {
    this.popup?.destroy();
    const W = VW(this),
      H = VH(this),
      w = Math.min(900, W - 48),
      x = (W - w) / 2,
      y = Math.max(20, (H - 540) / 2);
    const p = this.add.container(0, 0).setDepth(100);
    this.popup = p;
    p.add(this.add.rectangle(W / 2, H / 2, W, H, 0x100910, 0.88).setInteractive());
    p.add(panel(this, x, y, w, 540));
    p.add(fitImage(this.add.image(x + 75, y + 72, this.medal(a)), 100));
    p.add(
      text(this, x + 140, y + 28, achText(a, 'name'), TOUCH ? 32 : 26, '#fff0ce', { wordWrap: { width: w - 280, useAdvancedWrap: true } }),
    );
    p.add(
      text(
        this,
        x + 140,
        y + 86,
        tx(`当前进度 ${achValue(a).toLocaleString()}`, `Current progress ${achValue(a).toLocaleString()}`),
        TOUCH ? 26 : 18,
        '#d8bca0',
      ),
    );
    let ty = y + 150;
    a.tiers.forEach((tier, i) => {
      const unlock = CHARACTERS.filter((c) => c.unlock?.ach === a.id && c.unlock.tier === i + 1).map((c) => c.name);
      const reward =
        tx(`成就点 +${tier.points}`, `Points +${tier.points}`) +
        (a.tp?.[i] ? tx(` · 天赋点 +${a.tp[i]}`, ` · Talent +${a.tp[i]}`) : '') +
        (unlock.length ? tx(` · 解锁 ${unlock.join('、')}`, ` · Unlock ${unlock.join(', ')}`) : '');
      p.add(
        text(
          this,
          x + 28,
          ty,
          `${i < achTier(a.id) ? '✓ ' : ''}${pick(TIER_NAME[a.tiers.length === 1 ? 2 : Math.min(i, 3)])} · ${achText(a, 'desc', i)}`,
          TOUCH ? 26 : 18,
          '#fff0ce',
          { wordWrap: { width: w - 56, useAdvancedWrap: true } },
        ),
      );
      p.add(text(this, x + 28, ty + 44, reward, TOUCH ? 26 : 16, '#f5d795', { wordWrap: { width: w - 56, useAdvancedWrap: true } }));
      ty += 84;
    });
    p.add(
      button(
        this,
        x + w - 70,
        y + 44,
        96,
        44,
        tx('关闭', 'Close'),
        () => {
          p.destroy();
          this.popup = null;
        },
        COLORS.gray,
        17,
      ),
    );
  }
  private draw(): void {
    const W = VW(this),
      H = VH(this),
      L = this.layer;
    L.removeAll(true);
    workbenchBackground(this, L, W, H);
    L.add(button(this, 80, 40, 112, 48, tx('返回', 'Back'), () => this.scene.start('Menu'), COLORS.gray, 19));
    L.add(text(this, 184, 18, tx('成就', 'Achievements'), 34, '#fff0ce', { fontStyle: 'bold' }));
    L.add(fitImage(this.add.image(W - 225, 39, 'medal:gold'), 42));
    L.add(text(this, W - 24, 39, tx(`成就点 ${pointsEarned()}`, `Points ${pointsEarned()}`), TOUCH ? 26 : 22, '#f5d795').setOrigin(1, 0.5));
    const categories: [Filter, string][] = [
      ['all', tx('全部', 'All')],
      ['combat', pick(ACH_CATEGORY_NAME.combat)],
      ['build', pick(ACH_CATEGORY_NAME.build)],
      ['arsenal', pick(ACH_CATEGORY_NAME.arsenal)],
      ['collection', pick(ACH_CATEGORY_NAME.collection)],
    ];
    const chipW = Math.min(150, (W - 310) / 6);
    categories.forEach(([key, name], i) =>
      L.add(
        button(
          this,
          24 + chipW / 2 + i * (chipW + 8),
          TOUCH ? 124 : 100,
          chipW,
          44,
          name,
          () => this.selectFilter(key),
          this.filter === key ? COLORS.primary : COLORS.gray,
          TOUCH ? 26 : tu(17),
        ),
      ),
    );
    const extra = this.filter !== 'all' && !categories.some(([k]) => k === this.filter);
    L.add(
      button(
        this,
        24 + chipW / 2 + 5 * (chipW + 8),
        TOUCH ? 124 : 100,
        chipW,
        44,
        extra ? pick(ACH_CATEGORY_NAME[this.filter as AchCategory]) : tx('更多', 'More'),
        () => this.categories(),
        extra ? COLORS.primary : COLORS.gray,
        TOUCH ? 26 : tu(17),
      ),
    );
    L.add(
      button(
        this,
        W - 116,
        TOUCH ? 124 : 100,
        184,
        44,
        this.unfinished ? tx('未满级：开', 'Unfinished: on') : tx('未满级：关', 'Unfinished: off'),
        () => {
          this.unfinished = !this.unfinished;
          this.page = 0;
          this.selected = '';
          this.draw();
        },
        this.unfinished ? COLORS.primary : COLORS.gray,
        TOUCH ? 26 : tu(16),
      ),
    );
    const inCat = ACHIEVEMENTS.filter((a) => this.filter === 'all' || a.category === this.filter);
    const list = inCat
      .filter((a) => !this.unfinished || !isMaxed(a))
      .sort((a, b) => Number(isMaxed(a)) - Number(isMaxed(b)) || Number(achTier(b.id) > 0) - Number(achTier(a.id) > 0));
    const cols = TOUCH ? 2 : 3,
      rows = 2,
      per = cols * rows,
      pages = Math.max(1, Math.ceil(list.length / per));
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    const visible = list.slice(this.page * per, (this.page + 1) * per);
    if (!visible.some((a) => a.id === this.selected)) this.selected = visible[0]?.id ?? '';
    const top = TOUCH ? 186 : 140,
      gap = 14,
      cw = (W - 48 - gap * (cols - 1)) / cols;
    const ch = TOUCH ? 162 : Math.max(146, Math.min(184, (H - 328) / 2));
    visible.forEach((a, i) => {
      const x = 24 + (i % cols) * (cw + gap),
        y = top + Math.floor(i / cols) * (ch + gap);
      const rank = achTier(a.id),
        max = isMaxed(a),
        next = Math.min(rank, a.tiers.length - 1),
        goal = tierGoal(a, next),
        cur = Math.min(goal, achValue(a));
      L.add(panel(this, x, y, cw, ch, COLORS.panel, this.selected === a.id ? COLORS.gold : 0x987347));
      L.add(fitImage(this.add.image(x + 62, y + ch / 2 - 5, this.medal(a)), TOUCH ? 92 : 106).setAlpha(rank ? 1 : 0.78));
      const tx0 = x + 122,
        tw = cw - 138;
      this.label(tx0, y + 18, achText(a, 'name'), TOUCH ? 26 : tu(20), tw, rank ? '#f7d58d' : '#fff0ce');
      this.label(tx0, y + 52, achText(a, 'desc', next), TOUCH ? 26 : tu(14), tw, '#d6bd9e');
      const by = y + ch - 57;
      L.add(
        this.add
          .graphics()
          .fillStyle(0x150d15)
          .fillRoundedRect(tx0, by, tw, TOUCH ? 24 : 14, 7),
      );
      if (cur > 0)
        L.add(
          this.add
            .graphics()
            .fillStyle(max ? 0xe6bc69 : 0xd75e43)
            .fillRoundedRect(tx0, by, Math.max(8, (tw * cur) / Math.max(1, goal)), TOUCH ? 24 : 14, 7),
        );
      L.add(
        text(
          this,
          tx0 + tw / 2,
          by - 1,
          max ? tx('已满级', 'Maxed') : `${cur.toLocaleString()} / ${goal.toLocaleString()}`,
          TOUCH ? 22 : 13,
          '#fff0ce',
        ).setOrigin(0.5, 0),
      );
      a.tiers.forEach((_, n) =>
        L.add(
          fitImage(
            this.add.image(
              tx0 + 15 + n * 34,
              y + ch - (TOUCH ? 16 : 22),
              `medal:${a.tiers.length === 1 ? 'gold' : MEDALS[Math.min(n, 3)]}`,
            ),
            26,
          ).setAlpha(n < rank ? 1 : 0.25),
        ),
      );
      L.add(
        hitArea(this, x, y, cw, ch, () => {
          this.selected = a.id;
          this.draw();
        }),
      );
    });
    const dy = top + 2 * ch + gap + 14;
    L.add(panel(this, 24, dy, W - 48, Math.min(142, H - dy - 18)));
    const a = list.find((v) => v.id === this.selected);
    if (a) {
      const tier = achTier(a.id),
        next = Math.min(tier, a.tiers.length - 1),
        goal = tierGoal(a, next);
      L.add(fitImage(this.add.image(82, dy + 61, this.medal(a)), 94));
      this.label(142, dy + 15, achText(a, 'name'), TOUCH ? 30 : 23, W * 0.4 - 150);
      this.label(142, dy + 49, achText(a, 'desc', next), TOUCH ? 26 : tu(15), W * 0.4 - 150, '#d6bd9e');
      L.add(
        text(this, 142, dy + 80, `${Math.min(goal, achValue(a)).toLocaleString()} / ${goal.toLocaleString()}`, TOUCH ? 26 : 17, '#f5d795'),
      );
      const nx = W * 0.43;
      L.add(fitImage(this.add.image(nx + 32, dy + 57, `medal:${a.tiers.length === 1 ? 'gold' : MEDALS[Math.min(next, 3)]}`), 70));
      this.label(
        nx + 80,
        dy + 18,
        isMaxed(a)
          ? tx('所有等级已完成', 'All tiers complete')
          : tx(
              `下一阶段：${pick(TIER_NAME[a.tiers.length === 1 ? 2 : Math.min(next, 3)])}章`,
              `Next: ${pick(TIER_NAME[a.tiers.length === 1 ? 2 : Math.min(next, 3)])}`,
            ),
        TOUCH ? 26 : tu(17),
        W * 0.3 - 90,
      );
      const unlock = CHARACTERS.filter((c) => c.unlock?.ach === a.id && c.unlock.tier === next + 1).map((c) => c.name);
      const reward =
        tx(`成就点 +${a.tiers[next].points}`, `Points +${a.tiers[next].points}`) +
        (a.tp?.[next] ? tx(` · 天赋点 +${a.tp[next]}`, ` · Talent +${a.tp[next]}`) : '');
      this.label(nx + 80, dy + 53, reward, TOUCH ? 26 : tu(15), W * 0.3 - 90, '#f5d795');
      this.label(
        nx + 80,
        dy + 83,
        unlock.length
          ? tx(`解锁：${unlock.join('、')}`, `Unlocks: ${unlock.join(', ')}`)
          : tx('达成后自动解锁奖励', 'Rewards unlock automatically'),
        TOUCH ? 26 : tu(13),
        W * 0.3 - 90,
        '#d6bd9e',
      );
    } else
      L.add(
        text(this, 48, dy + 44, tx('没有符合条件的成就', 'No matching achievements'), TOUCH ? 34 : tu(26), '#fff0ce', {
          fontStyle: 'bold',
        }),
      );
    if (a) L.add(hitArea(this, 30, dy + 8, W * 0.73, 120, () => this.info(a)));
    const px = W - 190,
      navGap = TOUCH ? 94 : 72;
    L.add(
      journalNav(
        this,
        px - navGap,
        dy + 43,
        'left',
        () => {
          this.page--;
          this.draw();
        },
        this.page > 0,
      ),
    );
    L.add(text(this, px + 1, dy + 43, `${this.page + 1} / ${pages}`, TOUCH ? 26 : 18, '#e6cda8').setOrigin(0.5));
    L.add(
      journalNav(
        this,
        px + navGap,
        dy + 43,
        'right',
        () => {
          this.page++;
          this.draw();
        },
        this.page < pages - 1,
      ),
    );
    L.add(
      text(
        this,
        px,
        dy + 88,
        tx(
          `本类 ${inCat.filter((v) => achTier(v.id) > 0).length}/${inCat.length} 已解锁`,
          `Unlocked ${inCat.filter((v) => achTier(v.id) > 0).length}/${inCat.length}`,
        ),
        TOUCH ? 22 : 13,
        '#d6bd9e',
      ).setOrigin(0.5),
    );
    L.add(hitArea(this, px - (TOUCH ? 42 : 34), dy + (TOUCH ? 2 : 22), TOUCH ? 84 : 68, TOUCH ? 82 : 44, () => void this.jump(pages)));
  }
}
