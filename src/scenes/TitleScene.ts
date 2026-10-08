// 称号选择：按成就分类 / 稀有度筛选、搜索，点一张卡片佩戴；顶部预览当前称号。
// 称号只是展示用（主菜单、选角、结算、分享海报），不影响数值。
import Phaser from 'phaser';
import { text, button, panel, COLORS, hitArea, autoRelayout } from '../ui/UI';
import { save, persist } from '../systems/Save';
import { ACHIEVEMENTS, type AchCategory } from '../data/achievements';
import { RARITY } from '../data/balance';
import { unlockedTitles, titleName, titleDesc, titleRarity, titleCategory, categoryName } from '../data/titles';
import { titleBadge, TITLE_MARK } from '../ui/TitleBadge';
import { promptText } from '../ui/DomInput';
import { tx } from '../i18n';
import { VW, VH } from '../systems/HiDpi';

type RarityFilter = -1 | 0 | 1 | 2 | 3;

export class TitleScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private cat: AchCategory | 'all' = 'all';
  private rarity: RarityFilter = -1;
  private query = '';
  private page = 0;
  /** 从哪个场景进来，返回时回到那里 */
  private from = 'Menu';

  constructor() {
    super('Title');
  }

  init(data?: { from?: string }): void {
    this.from = data?.from ?? 'Menu';
    this.page = 0;
  }

  create(): void {
    autoRelayout(this, { from: this.from });
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.layer = this.add.container(0, 0);
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.page = Math.max(0, this.page + (dy > 0 ? 1 : -1));
      this.draw();
    });
    this.draw();
  }

  private all(): string[] {
    // 稀有度高的排前面，同稀有度按名字
    return unlockedTitles(save.achievements).sort(
      (a, b) => titleRarity(b) - titleRarity(a) || titleName(a).localeCompare(titleName(b), 'zh'),
    );
  }

  private list(): string[] {
    const q = this.query.trim().toLowerCase();
    return this.all().filter(
      (id) =>
        (this.cat === 'all' || titleCategory(id) === this.cat) &&
        (this.rarity < 0 || titleRarity(id) === this.rarity) &&
        (!q || titleName(id).toLowerCase().includes(q) || titleDesc(id).toLowerCase().includes(q)),
    );
  }

  private equip(id: string): void {
    save.meta.title = id;
    persist();
    this.draw();
  }

  private draw(): void {
    const W = VW(this),
      H = VH(this);
    const L = this.layer;
    L.removeAll(true);
    L.add(text(this, 24, 16, tx('称号', 'Titles'), 32));
    L.add(button(this, W - 80, 34, 130, 44, tx('返回', 'Back'), () => this.scene.start(this.from), 0x555555, 18));

    const all = this.all();
    // 当前称号预览
    L.add(text(this, 130, 36, tx('当前：', 'Wearing:'), 17, COLORS.textDim).setOrigin(0, 0.5));
    const cur = save.meta.title ? titleBadge(this, 0, 36, save.meta.title, 17) : null;
    if (cur) {
      cur.x = 200 + cur.width / 2;
      L.add(cur);
      L.add(button(this, cur.x + cur.width / 2 + 80, 36, 130, 36, tx('不显示称号', 'Hide title'), () => this.equip(''), 0x5a4a4a, 14));
    } else L.add(text(this, 200, 36, tx('未佩戴（点下面的称号佩戴）', 'None — pick one below'), 16, COLORS.textDim).setOrigin(0, 0.5));
    L.add(
      text(
        this,
        W - 160,
        36,
        tx(`已解锁 ${all.length} / ${ACHIEVEMENTS.length}`, `Unlocked ${all.length} / ${ACHIEVEMENTS.length}`),
        15,
        '#ffd166',
      ).setOrigin(1, 0.5),
    );

    // 分类（只列出有已解锁称号的分类，带数量）
    const counts = new Map<AchCategory, number>();
    for (const id of all) {
      const c = titleCategory(id);
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    let x = 24;
    const y1 = 82;
    const chip = (label: string, on: boolean, onClick: () => void, color = COLORS.primary, y = y1) => {
      const probe = text(this, 0, 0, label, 14);
      const w = Math.max(64, probe.width + 22);
      probe.destroy();
      if (x + w > W - 20) return;
      L.add(button(this, x + w / 2, y, w, 32, label, onClick, on ? color : 0x3d2f2f, 14));
      x += w + 6;
    };
    const set = (fn: () => void) => () => {
      fn();
      this.page = 0;
      this.draw();
    };
    chip(
      tx(`全部 ${all.length}`, `All ${all.length}`),
      this.cat === 'all',
      set(() => (this.cat = 'all')),
    );
    for (const [c, n] of [...counts].sort((a, b) => b[1] - a[1]))
      chip(
        `${categoryName(c)} ${n}`,
        this.cat === c,
        set(() => (this.cat = c)),
      );

    // 稀有度 + 搜索
    x = 24;
    const y2 = 124;
    chip(
      tx('全部稀有度', 'Any rarity'),
      this.rarity < 0,
      set(() => (this.rarity = -1)),
      0x2d6a8a,
      y2,
    );
    for (const r of [3, 2, 1, 0] as const)
      chip(
        `${TITLE_MARK[r]} ${tx(RARITY[r].name, ['Common', 'Rare', 'Epic', 'Legendary'][r])}`,
        this.rarity === r,
        set(() => (this.rarity = r)),
        RARITY[r].color,
        y2,
      );
    x += 16;
    chip(
      this.query ? tx(`🔍 「${this.query}」`, `🔍 "${this.query}"`) : tx('🔍 搜索', '🔍 Search'),
      !!this.query,
      () =>
        void promptText(
          tx('搜索称号（名称或成就说明）', 'Search titles (name or description)'),
          tx('例如：番茄、Boss、无尽', 'e.g. Boss, Endless'),
          this.query,
        ).then((q) => {
          this.query = q ?? '';
          this.page = 0;
          this.draw();
        }),
      COLORS.green,
      y2,
    );
    if (this.query)
      chip(
        '×',
        false,
        set(() => (this.query = '')),
        0x5a4a4a,
        y2,
      );

    // 称号卡片网格
    const rows = this.list();
    const top = 152,
      bottom = H - 56;
    const cw = 290,
      ch = 70,
      gx = 12,
      gy = 10;
    const cols = Math.max(1, Math.floor((W - 48 + gx) / (cw + gx)));
    const rowsN = Math.max(1, Math.floor((bottom - top + gy) / (ch + gy)));
    const per = cols * rowsN;
    const pages = Math.max(1, Math.ceil(rows.length / per));
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    const left = (W - (cols * cw + (cols - 1) * gx)) / 2;
    rows.slice(this.page * per, (this.page + 1) * per).forEach((id, i) => {
      const cx = left + (i % cols) * (cw + gx),
        cy = top + Math.floor(i / cols) * (ch + gy);
      const r = titleRarity(id);
      const on = save.meta.title === id;
      L.add(panel(this, cx, cy, cw, ch, on ? COLORS.panelLight : COLORS.panel, on ? COLORS.gold : RARITY[r].color));
      L.add(text(this, cx + 12, cy + 10, `${TITLE_MARK[r]} ${titleName(id)}`, 17, RARITY[r].css));
      const c = titleCategory(id);
      L.add(
        text(
          this,
          cx + cw - 10,
          cy + 12,
          `${on ? tx('✓ 佩戴中 · ', '✓ Wearing · ') : ''}${c ? categoryName(c) : ''}`,
          12,
          on ? '#ffd166' : COLORS.textDim,
        ).setOrigin(1, 0),
      );
      const d = text(this, cx + 12, cy + 40, titleDesc(id), 12, COLORS.textDim);
      // 说明太长时截断到卡片宽度
      if (d.width > cw - 24) {
        let s = d.text;
        while (s.length > 1 && d.width > cw - 24) d.setText((s = s.slice(0, -1)) + '…');
      }
      L.add(d);
      L.add(hitArea(this, cx, cy, cw, ch, () => this.equip(id)));
    });
    if (!rows.length)
      L.add(
        text(
          this,
          W / 2,
          (top + bottom) / 2,
          all.length
            ? tx('没有符合条件的称号', 'No titles match')
            : tx(
                '还没有称号：把任意一项成就升到最高等级，就能获得它的名字作为称号',
                'No titles yet — max out any achievement to earn its name as a title',
              ),
          17,
          COLORS.textDim,
        ).setOrigin(0.5),
      );

    // 翻页
    if (pages > 1) {
      const by = H - 28;
      const go = (d: number) => () => {
        this.page = Phaser.Math.Clamp(this.page + d, 0, pages - 1);
        this.draw();
      };
      L.add(button(this, W / 2 - 110, by, 120, 38, tx('上一页', 'Prev'), go(-1), 0x4a3a3a, 15).setEnabled(this.page > 0));
      L.add(text(this, W / 2, by, `${this.page + 1} / ${pages}`, 15, COLORS.textDim).setOrigin(0.5));
      L.add(button(this, W / 2 + 110, by, 120, 38, tx('下一页', 'Next'), go(1), 0x4a3a3a, 15).setEnabled(this.page < pages - 1));
    }
  }
}
