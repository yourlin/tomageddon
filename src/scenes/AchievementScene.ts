// 成就列表：分类筛选 + 分页；显示奖章等级、下一级目标、进度条与奖励成就点
import Phaser from 'phaser';
import { text, button, panel, COLORS, autoRelayout } from '../ui/UI';
import { ACHIEVEMENTS, ACH_CATEGORY_NAME, type AchCategory } from '../data/achievements';
import {
  achText,
  achTier,
  achValue,
  tierGoal,
  isMaxed,
  medalOf,
  pick,
  pointsBalance,
  pointsEarned,
  pointsTotal,
  checkAchievements,
} from '../systems/Achievements';
import { tx } from '../i18n';

type Filter = AchCategory | 'all';
const PER_PAGE = 12;

export class AchievementScene extends Phaser.Scene {
  private filter: Filter = 'all';
  private page = 0;
  private layer!: Phaser.GameObjects.Container;
  private tabBtns: ReturnType<typeof button>[] = [];
  /** 只看未满级的成就 */
  private unfinished = false;

  constructor() {
    super('Achievements');
  }

  create(): void {
    autoRelayout(this);
    checkAchievements();
    const W = this.scale.width;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    text(this, 24, 18, tx('成就', 'Achievements'), 36);
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);
    text(
      this,
      W - 180,
      44,
      tx(
        `可用成就点 🏅 ${pointsBalance()}  ·  累计 ${pointsEarned()} / ${pointsTotal()}`,
        `Points 🏅 ${pointsBalance()}  ·  earned ${pointsEarned()} / ${pointsTotal()}`,
      ),
      20,
      '#ffd166',
    ).setOrigin(1, 0.5);
    const tabs: [Filter, string][] = [
      ['all', tx('全部', 'All')],
      ...(Object.keys(ACH_CATEGORY_NAME) as AchCategory[]).map((c) => [c, pick(ACH_CATEGORY_NAME[c])] as [Filter, string]),
    ];
    // 分类标签：按数量自动收窄，一行放下
    const tw = Math.min(126, (W - 48) / tabs.length - 6);
    this.tabBtns = tabs.map(([f, n], i) =>
      button(
        this,
        24 + tw / 2 + i * (tw + 6),
        100,
        tw,
        42,
        n,
        () => {
          this.filter = f;
          this.page = 0;
          this.draw();
        },
        0x7a2e35,
        tw < 100 ? 15 : 17,
      ),
    );
    this.layer = this.add.container(0, 0);
    this.draw();
  }

  private draw(): void {
    this.layer.removeAll(true);
    const W = this.scale.width,
      H = this.scale.height;
    const tabKeys: Filter[] = ['all', ...(Object.keys(ACH_CATEGORY_NAME) as AchCategory[])];
    this.tabBtns.forEach((b, i) => b.setAlpha(tabKeys[i] === this.filter ? 1 : 0.6));
    const inCat = ACHIEVEMENTS.filter((a) => this.filter === 'all' || a.category === this.filter);
    // 未满级的排前面：已解锁一部分的最前，其次未解锁，满级的最后
    const list = (this.unfinished ? inCat.filter((a) => !isMaxed(a)) : inCat).sort(
      (a, b) => Number(isMaxed(a)) - Number(isMaxed(b)) || Number(achTier(b.id) > 0) - Number(achTier(a.id) > 0),
    );
    const done = inCat.filter((a) => achTier(a.id) > 0).length;
    this.layer.add(
      text(
        this,
        24,
        H - 34,
        tx(`本类已解锁 ${done} / ${inCat.length}`, `Unlocked ${done} / ${inCat.length}`),
        17,
        COLORS.textDim,
      ).setOrigin(0, 0.5),
    );
    this.layer.add(
      button(
        this,
        W - 120,
        H - 34,
        200,
        46,
        this.unfinished ? tx('☑ 只看未完成', '☑ Unfinished only') : tx('☐ 只看未完成', '☐ Unfinished only'),
        () => {
          this.unfinished = !this.unfinished;
          this.page = 0;
          this.draw();
        },
        0x4a6fa5,
        17,
      ),
    );
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    this.page = Math.min(this.page, pages - 1);
    const cols = 3,
      gap = 12,
      x0 = 24,
      y0 = 134;
    const cw = (W - x0 * 2 - gap * (cols - 1)) / cols,
      ch = 112;
    list.slice(this.page * PER_PAGE, (this.page + 1) * PER_PAGE).forEach((a, i) => {
      const x = x0 + (i % cols) * (cw + gap),
        y = y0 + Math.floor(i / cols) * (ch + gap);
      const tier = achTier(a.id),
        maxed = isMaxed(a),
        next = Math.min(tier, a.tiers.length - 1);
      this.layer.add(panel(this, x, y, cw, ch, maxed ? 0x3d2a14 : COLORS.panel, tier > 0 ? COLORS.gold : COLORS.border));
      const icon = text(this, x + 42, y + ch / 2 - 8, a.icon, 40).setOrigin(0.5);
      if (tier === 0) icon.setAlpha(0.35);
      this.layer.add(icon);
      if (tier > 0) this.layer.add(text(this, x + 42, y + ch - 18, medalOf(a), 22).setOrigin(0.5));
      this.layer.add(text(this, x + 80, y + 12, achText(a, 'name'), 20, tier > 0 ? '#ffd166' : '#fff4ea', { fontStyle: 'bold' }));
      // 等级进度点：●●○
      if (a.tiers.length > 1)
        this.layer.add(
          text(this, x + cw - 14, y + 16, '●'.repeat(tier) + '○'.repeat(a.tiers.length - tier), 14, '#ffd166').setOrigin(1, 0),
        );
      this.layer.add(
        text(this, x + 80, y + 40, achText(a, 'desc', next), 15, COLORS.textDim, { wordWrap: { width: cw - 96, useAdvancedWrap: true } }),
      );
      // 进度条（下一级）
      const goal = tierGoal(a, next),
        cur = maxed ? goal : Math.min(goal, achValue(a));
      const bw = cw - 96,
        by = y + ch - 22;
      const g = this.add.graphics();
      g.fillStyle(0x1a0a0c, 1).fillRoundedRect(x + 80, by, bw, 10, 5);
      if (cur > 0) g.fillStyle(maxed ? COLORS.gold : COLORS.green, 1).fillRoundedRect(x + 80, by, Math.max(10, (bw * cur) / goal), 10, 5);
      this.layer.add(g);
      const label = maxed
        ? tx('✓ 已满级', '✓ Maxed')
        : `${cur.toLocaleString()} / ${goal.toLocaleString()}  ·  +${a.tiers[next].points}${tx(' 点', ' pts')}` +
          (a.tp?.[next] ? tx(` · +${a.tp[next]} 天赋点`, ` · +${a.tp[next]} talent`) : '');
      this.layer.add(text(this, x + cw - 14, by - 3, label, 13, maxed ? '#ffd166' : COLORS.textDim).setOrigin(1, 1));
    });
    if (pages > 1) {
      const py = H - 34;
      const pageBtn = (dx: number, label: string, d: number) =>
        this.layer.add(
          button(
            this,
            W / 2 + dx,
            py,
            110,
            46,
            label,
            () => {
              this.page += d;
              this.draw();
            },
            0x7a2e35,
            20,
          ),
        );
      if (this.page > 0) {
        pageBtn(-240, '«', -this.page);
        pageBtn(-125, tx('上一页', 'Prev'), -1);
      }
      this.layer.add(text(this, W / 2, py, `${this.page + 1} / ${pages}`, 20).setOrigin(0.5));
      if (this.page < pages - 1) {
        pageBtn(125, tx('下一页', 'Next'), 1);
        pageBtn(240, '»', pages - 1 - this.page);
      }
    }
  }
}
