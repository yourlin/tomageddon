// I3：收藏度总览——「储藏柜」。每一类收藏是货架上的一只罐子，收集多少罐子就装多满；
// 左边的番茄酱大瓶是总完成度和收藏等级。点罐子拉开抽屉，看到已收集的实物和还没见过的剪影。
import { storage } from '../platform';
import Phaser from 'phaser';
import { text, button, COLORS, fitImage, autoRelayout } from '../ui/UI';
import { tx, lang } from '../i18n';
import { save, unlockedCount, isUnlocked } from '../systems/Save';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { EVOLVED_WEAPONS } from '../data/evolutions';
import { ITEMS } from '../data/items';
import { RELICS, RELIC_KIND_INFO } from '../data/relics';
import { ACHIEVEMENTS } from '../data/achievements';
import { ENEMIES } from '../data/enemies';
import { BOSSES } from '../data/bosses';
import { SKINS } from '../data/skins';
import { QUESTS } from '../data/quests';
import { skinOwned, questDone } from '../systems/Progress';
import { achTier, unlockHint } from '../systems/Achievements';
import { unlockedTitles } from '../data/titles';
import { itemIconKey } from '../art/ItemArt';
import { portraitKey } from '../ui/Portrait';
import { audio } from '../systems/Audio';

export interface CollectionRow {
  /** 稳定 id：记录「上次看到时有几个」用 */
  id: string;
  name: [string, string];
  have: number;
  total: number;
}

/** 收藏度各项（纯数据，测试可直接调用） */
export function collectionRows(): CollectionRow[] {
  const seen = save.seen;
  const has = (list: string[], ids: { id: string }[]): number => ids.filter((x) => list.includes(x.id)).length;
  return [
    { id: 'char', name: ['角色', 'Characters'], have: unlockedCount(), total: CHARACTERS.length },
    { id: 'weapon', name: ['武器', 'Weapons'], have: has(seen.weapons, WEAPONS), total: WEAPONS.length },
    { id: 'evo', name: ['超武', 'Evolved'], have: has(seen.weapons, EVOLVED_WEAPONS), total: EVOLVED_WEAPONS.length },
    { id: 'item', name: ['道具', 'Items'], have: has(seen.items, ITEMS), total: ITEMS.length },
    { id: 'relic', name: ['遗物', 'Relics'], have: RELICS.filter((r) => save.meta.relics.includes(r.id)).length, total: RELICS.length },
    { id: 'enemy', name: ['敌人', 'Enemies'], have: has(seen.enemies, ENEMIES), total: ENEMIES.length },
    { id: 'boss', name: ['首领', 'Bosses'], have: has(seen.bosses, BOSSES), total: BOSSES.length },
    {
      id: 'ach',
      name: ['成就等级', 'Ach. tiers'],
      have: ACHIEVEMENTS.reduce((s, a) => s + Math.min(achTier(a.id), a.tiers.length), 0),
      total: ACHIEVEMENTS.reduce((s, a) => s + a.tiers.length, 0),
    },
    { id: 'title', name: ['称号', 'Titles'], have: unlockedTitles(save.achievements).length, total: ACHIEVEMENTS.length },
    { id: 'quest', name: ['角色任务', 'Quests'], have: QUESTS.filter((q) => questDone(q)).length, total: QUESTS.length },
    { id: 'skin', name: ['皮肤', 'Skins'], have: SKINS.filter((s) => skinOwned(s.charId)).length, total: SKINS.length },
  ];
}

export function collectionPercent(rows = collectionRows()): number {
  const p = rows.reduce((s, r) => s + (r.total ? r.have / r.total : 1), 0) / rows.length;
  return Math.round(p * 1000) / 10;
}

/** 收藏等级：按总完成度晋升，只是称呼，不发奖励 */
export const COLLECTION_RANKS: { at: number; name: [string, string] }[] = [
  { at: 0, name: ['空罐子', 'Empty Jar'] },
  { at: 5, name: ['腌菜学徒', 'Pickling Apprentice'] },
  { at: 15, name: ['酱料帮厨', 'Sauce Cook'] },
  { at: 30, name: ['储藏室管家', 'Pantry Keeper'] },
  { at: 50, name: ['酱料大厨', 'Sauce Chef'] },
  { at: 75, name: ['罐头收藏家', 'Jar Collector'] },
  { at: 100, name: ['番茄酱之神', 'Ketchup Deity'] },
];

export function collectionRank(pct: number): { level: number; next: (typeof COLLECTION_RANKS)[number] | null } {
  let level = 0;
  COLLECTION_RANKS.forEach((r, i) => pct >= r.at && (level = i));
  return { level, next: COLLECTION_RANKS[level + 1] ?? null };
}

/** 每只罐子里的酱是什么颜色 */
const SAUCE: Record<string, number> = {
  char: 0xe63946,
  weapon: 0xf77f00,
  evo: 0xffc300,
  item: 0x52b788,
  relic: 0x9d4edd,
  enemy: 0x8aa83a,
  boss: 0xa4161a,
  ach: 0xf4a261,
  title: 0x4cc9f0,
  quest: 0xff9f1c,
  skin: 0xff70a6,
};

/** 抽屉里的一格 */
interface Cell {
  name: string;
  have: boolean;
  /** 贴图 key（延迟生成：肖像要现画） */
  key?: () => string;
  /** 没有贴图时画成这个颜色的宝石 */
  gem?: number;
  hint?: string;
}

const LAST_KEY = 'tomageddon_collection_last';
const PAPER = 0xf3e2c0;
const INK = '#4a2a16';

function loadLast(): Record<string, number> {
  try {
    return JSON.parse(storage.getItem(LAST_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

export class CollectionScene extends Phaser.Scene {
  private drawer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('Collection');
  }

  create(): void {
    autoRelayout(this);
    this.drawer = null;
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.setBackgroundColor(0x170b09);
    const rows = collectionRows();
    const pct = collectionPercent(rows);
    const last = loadLast();
    const firstVisit = Object.keys(last).length === 0;

    this.drawWall(W, H);
    text(this, 32, 22, tx('储藏柜', 'The Pantry'), 38);
    text(this, 34, 70, tx('每找到一样新东西，对应的罐子就装满一点。', 'Every new find fills its jar a little more.'), 17, COLORS.textDim);
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);

    this.drawBottle(40, 112, 270, H - 150, pct);

    // —— 货架：两层，6 + 5 只罐子 ——
    const sx = 350;
    const sw = W - sx - 30;
    const perRow = 6;
    const slot = sw / perRow;
    const jw = Math.min(118, slot - 22);
    const jh = Math.min(170, (H - 230) / 2 - 40);
    const shelfY = [118 + jh + 26, 118 + jh * 2 + 96];
    for (const y of shelfY) this.drawPlank(sx - 10, y, sw + 20);
    rows.forEach((r, i) => {
      const row = i < perRow ? 0 : 1;
      const col = row === 0 ? i : i - perRow;
      // 第二层少一只：整体右移半格，像随手摆的
      const cx = sx + slot * col + slot / 2 + (row === 1 ? slot / 2 : 0);
      const gained = firstVisit ? 0 : Math.max(0, r.have - (last[r.id] ?? 0));
      this.jar(r, cx, shelfY[row], jw, jh, i, gained);
    });

    // —— 底部小票：离装满最近的一罐 + 本次新发现 ——
    const near = rows
      .filter((r) => r.have < r.total && r.total - r.have <= Math.max(3, r.total * 0.25))
      .sort((a, b) => a.total - a.have - (b.total - b.have))[0];
    const gainedAll = firstVisit ? 0 : rows.reduce((s, r) => s + Math.max(0, r.have - (last[r.id] ?? 0)), 0);
    const tip = near
      ? tx(
          `离装满最近：「${near.name[0]}」罐，还差 ${near.total - near.have} 个`,
          `Closest to full: ${near.name[1]}, ${near.total - near.have} to go`,
        )
      : tx('挑一只罐子点开，看看还缺哪些。', 'Open any jar to see what is still missing.');
    const ticket = text(this, sx, H - 46, tip, 18, '#ffd166');
    if (gainedAll > 0)
      text(
        this,
        ticket.x + ticket.width + 24,
        H - 46,
        tx(`上次来过之后新收集 ${gainedAll} 样`, `${gainedAll} new since last visit`),
        18,
        '#9be564',
      );

    // 记住这次看到的数量（下次来算「新收集」）
    try {
      storage.setItem(LAST_KEY, JSON.stringify(Object.fromEntries(rows.map((r) => [r.id, r.have]))));
    } catch {
      /* 忽略 */
    }

    this.input.keyboard?.on('keydown-ESC', () => (this.drawer ? this.closeDrawer() : this.scene.start('Menu')));
  }

  /** 背景：深色木墙板 */
  private drawWall(W: number, H: number): void {
    const g = this.add.graphics();
    for (let x = 0, i = 0; x < W; x += 92, i++) {
      g.fillStyle(i % 2 ? 0x1d0f0b : 0x1a0d0a, 1).fillRect(x, 0, 92, H);
      g.fillStyle(0x000000, 0.25).fillRect(x, 0, 2, H);
    }
  }

  private drawPlank(x: number, y: number, w: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35).fillRect(x + 6, y + 18, w, 10);
    g.fillStyle(0x7a4a2a, 1).fillRect(x, y, w, 18);
    g.fillStyle(0x9b6238, 1).fillRect(x, y, w, 5);
    g.fillStyle(0x4e2c17, 1).fillRect(x, y + 14, w, 4);
    // 托架
    for (const bx of [x + 30, x + w - 46]) g.fillStyle(0x3a2112, 1).fillTriangle(bx, y + 18, bx + 16, y + 18, bx, y + 46);
  }

  /** 左边的大番茄酱瓶：总完成度 + 收藏等级 */
  private drawBottle(x: number, y: number, w: number, h: number, pct: number): void {
    const { level, next } = collectionRank(pct);
    const cx = x + w / 2;
    const bh = Math.min(h - 120, 420);
    const bw = Math.min(w - 40, 190);
    const top = y + 70;
    const neckW = bw * 0.36;
    const g = this.add.graphics();
    const fill = this.add.graphics();
    const glass = this.add.graphics();
    // 瓶盖
    g.fillStyle(0xc1121f, 1).fillRoundedRect(cx - neckW / 2 - 6, y, neckW + 12, 34, 8);
    g.fillStyle(0xffffff, 0.18).fillRect(cx - neckW / 2, y + 6, neckW, 5);
    // 瓶颈 + 瓶身轮廓
    const neck = new Phaser.Geom.Rectangle(cx - neckW / 2, y + 34, neckW, 40);
    const body = new Phaser.Geom.Rectangle(cx - bw / 2, top, bw, bh);
    const drawFill = (p: number) => {
      fill.clear();
      const fh = (bh - 12) * p;
      if (fh <= 0) return;
      fill.fillStyle(0xd62828, 1).fillRoundedRect(body.x + 6, body.bottom - 6 - fh, bw - 12, fh, Math.min(22, fh / 2));
      fill.fillStyle(0xff6b5e, 0.5).fillRect(body.x + 14, body.bottom - 6 - fh + 2, bw - 28, Math.min(6, fh));
    };
    glass.fillStyle(0xffffff, 0.06).fillRect(neck.x, neck.y, neck.width, neck.height);
    glass.lineStyle(3, 0xffffff, 0.35).strokeRect(neck.x, neck.y, neck.width, neck.height);
    glass.fillStyle(0xffffff, 0.06).fillRoundedRect(body.x, body.y, body.width, body.height, 26);
    glass.lineStyle(3, 0xffffff, 0.35).strokeRoundedRect(body.x, body.y, body.width, body.height, 26);
    glass.fillStyle(0xffffff, 0.14).fillRoundedRect(body.x + 14, body.y + 20, 10, bh * 0.55, 5);
    // 刻度：每个等级一道线
    COLLECTION_RANKS.slice(1, -1).forEach((r) => {
      const ly = body.bottom - 6 - (bh - 12) * (r.at / 100);
      glass.lineStyle(2, 0xffffff, 0.22).lineBetween(body.right - 26, ly, body.right - 8, ly);
    });
    // 瓶身贴纸：百分比
    const label = this.add.graphics();
    const ly = top + bh * 0.36;
    label.fillStyle(PAPER, 1).fillRoundedRect(cx - bw / 2 + 10, ly, bw - 20, 86, 10);
    label.lineStyle(2, 0xc1121f, 1).strokeRoundedRect(cx - bw / 2 + 16, ly + 6, bw - 32, 74, 7);
    const num = text(this, cx, ly + 36, '0%', 40, '#c1121f', { stroke: '#f3e2c0', strokeThickness: 2, fontStyle: 'bold' }).setOrigin(0.5);
    text(this, cx, ly + 68, tx('总完成度', 'Complete'), 15, INK, { stroke: '#f3e2c0', strokeThickness: 1 }).setOrigin(0.5);
    // 入场：酱从瓶底灌上来（全场唯一的编排动效）
    const v = { p: 0 };
    this.tweens.add({
      targets: v,
      p: pct / 100,
      duration: 900 + pct * 8,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        drawFill(v.p);
        num.setText(`${(v.p * 100).toFixed(pct >= 10 ? 0 : 1)}%`);
      },
      onComplete: () => num.setText(`${pct}%`),
    });
    drawFill(0);
    // 等级
    const ry = top + bh + 20;
    text(this, cx, ry, COLLECTION_RANKS[level].name[lang === 'zh' ? 0 : 1], 24, '#ffd166').setOrigin(0.5, 0);
    const pips = this.add.graphics();
    const n = COLLECTION_RANKS.length - 1;
    for (let i = 0; i < n; i++) {
      const px = cx - (n - 1) * 11 + i * 22;
      pips.fillStyle(i < level ? 0xffd166 : 0x3a2418, 1).fillCircle(px, ry + 44, 6);
      pips.lineStyle(1, 0xffd166, 0.6).strokeCircle(px, ry + 44, 6);
    }
    if (next) {
      const gap = Math.max(0.1, Math.round((next.at - pct) * 10) / 10);
      text(this, cx, ry + 60, tx(`再收集 ${gap}% 晋升「${next.name[0]}」`, `${gap}% more to become ${next.name[1]}`), 15, COLORS.textDim, {
        align: 'center',
        wordWrap: { width: w },
      }).setOrigin(0.5, 0);
    }
  }

  /** 货架上的一只罐子。底部压在 shelfY 上 */
  private jar(r: CollectionRow, cx: number, shelfY: number, w: number, h: number, i: number, gained: number): void {
    const p = r.total ? r.have / r.total : 1;
    const full = p >= 1;
    const color = SAUCE[r.id] ?? 0xe63946;
    const c = this.add.container(cx, shelfY);
    c.setAngle(i % 3 === 0 ? -1.5 : i % 3 === 1 ? 1 : 0);
    const bodyTop = -h;
    const sauce = this.add.graphics();
    const g = this.add.graphics();
    const drawSauce = (q: number) => {
      sauce.clear();
      const fh = (h - 26) * q;
      if (fh <= 0) return;
      sauce.fillStyle(color, 0.92).fillRoundedRect(-w / 2 + 5, -5 - fh, w - 10, fh, Math.min(14, fh / 2));
      sauce.fillStyle(0xffffff, 0.22).fillRect(-w / 2 + 12, -5 - fh + 2, w - 24, Math.min(4, fh));
    };
    // 玻璃
    g.fillStyle(0xffffff, 0.06).fillRoundedRect(-w / 2, bodyTop + 14, w, h - 14, 16);
    g.lineStyle(2.5, full ? 0xffd166 : 0xffffff, full ? 0.9 : 0.32).strokeRoundedRect(-w / 2, bodyTop + 14, w, h - 14, 16);
    g.fillStyle(0xffffff, 0.12).fillRoundedRect(-w / 2 + 9, bodyTop + 30, 7, h * 0.45, 3);
    // 盖子：装满的是金盖
    g.fillStyle(full ? 0xffc300 : 0x8d99ae, 1).fillRoundedRect(-w / 2 + 6, bodyTop, w - 12, 18, 5);
    g.fillStyle(0xffffff, 0.25).fillRect(-w / 2 + 10, bodyTop + 3, w - 20, 3);
    // 贴纸
    const paperY = bodyTop + h * 0.42;
    g.fillStyle(PAPER, 1).fillRoundedRect(-w / 2 + 8, paperY, w - 16, 52, 6);
    g.lineStyle(2, color, 1).strokeRoundedRect(-w / 2 + 12, paperY + 4, w - 24, 44, 4);
    const name = text(this, 0, paperY + 15, r.name[lang === 'zh' ? 0 : 1], 16, INK, {
      stroke: '#f3e2c0',
      strokeThickness: 1,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    if (name.width > w - 30) name.setScale((w - 30) / name.width);
    const count = text(this, 0, paperY + 36, `${r.have} / ${r.total}`, 15, INK, { stroke: '#f3e2c0', strokeThickness: 1 }).setOrigin(0.5);
    c.add([sauce, g, name, count]);
    if (full) {
      const star = text(this, w / 2 - 6, bodyTop + 4, '★', 26, '#ffd166').setOrigin(0.5);
      c.add(star);
    }
    // 新收集角标
    if (gained > 0) {
      const badge = this.add.container(w / 2 - 4, bodyTop - 2);
      const bg = this.add.graphics().fillStyle(0x2b9348, 1).fillRoundedRect(-22, -12, 44, 24, 12);
      badge.add([bg, text(this, 0, 0, `+${gained}`, 15).setOrigin(0.5)]);
      badge.setScale(0);
      c.add(badge);
      this.tweens.add({ targets: badge, scale: 1, delay: 700 + i * 60, duration: 260, ease: 'Back.easeOut' });
    }
    // 入场灌酱：和大瓶同一时刻，按顺序稍微错开
    const v = { q: 0 };
    this.tweens.add({ targets: v, q: p, delay: 120 + i * 50, duration: 700, ease: 'Cubic.easeOut', onUpdate: () => drawSauce(v.q) });
    // 交互：悬停拿起来一点，点击拉开抽屉（点击区是罐身，放进容器里跟着罐子一起动）
    const hz = this.add.zone(0, -h / 2, w, h).setInteractive({ useHandCursor: true });
    c.add(hz);
    hz.on('pointerover', () => !this.drawer && this.tweens.add({ targets: c, y: shelfY - 8, duration: 120 }));
    hz.on('pointerout', () => this.tweens.add({ targets: c, y: shelfY, duration: 120 }));
    hz.on('pointerup', () => {
      if (this.drawer) return;
      audio.play(this, 'click');
      c.y = shelfY;
      this.openDrawer(r);
    });
  }

  // ---------------- 抽屉 ----------------

  private cells(id: string): Cell[] | null {
    const zh = lang === 'zh';
    const seen = save.seen;
    const wIcon = (wid: string) => () => (this.textures.exists(`icon_weapon_${wid}`) ? `icon_weapon_${wid}` : `weapon_${wid}`);
    const findHint = tx('在一局里遇到后收入', 'Collected the first time you meet it in a run');
    switch (id) {
      case 'char':
        return CHARACTERS.map((c) => ({
          name: c.name,
          have: isUnlocked(c),
          key: () => portraitKey(this, 'char', c.id),
          hint: unlockHint(c),
        }));
      case 'weapon':
        return WEAPONS.map((w) => ({ name: w.name, have: seen.weapons.includes(w.id), key: wIcon(w.id), hint: findHint }));
      case 'evo':
        return EVOLVED_WEAPONS.map((w) => ({
          name: w.name,
          have: seen.weapons.includes(w.id),
          key: wIcon(w.id),
          hint: tx('把基础武器升到 T4，再配上对应道具进化', 'Evolve the base weapon at T4 with its paired item'),
        }));
      case 'item':
        return ITEMS.map((it) => ({ name: it.name, have: seen.items.includes(it.id), key: () => itemIconKey(this, it), hint: findHint }));
      case 'relic':
        return RELICS.map((r) => ({
          name: r.name[zh ? 0 : 1],
          have: save.meta.relics.includes(r.id),
          gem: RELIC_KIND_INFO[r.kind].color,
          hint: tx('在一局中拿到后收入', 'Collected after you obtain it in a run'),
        }));
      case 'enemy':
        return ENEMIES.map((e) => ({
          name: e.name,
          have: seen.enemies.includes(e.id),
          key: () => portraitKey(this, 'enemy', e.id),
          hint: findHint,
        }));
      case 'boss':
        return BOSSES.map((b) => ({
          name: b.name,
          have: seen.bosses.includes(b.id),
          key: () => portraitKey(this, 'boss', b.id),
          hint: tx(`第 ${b.chapter} 章的${b.elite ? '精英' : '首领'}`, `${b.elite ? 'Elite' : 'Boss'} of chapter ${b.chapter}`),
        }));
      case 'quest':
        return QUESTS.map((q) => ({
          name: `${CHARACTER_MAP[q.charId]?.name ?? ''} · ${q.name[zh ? 0 : 1]}`,
          have: questDone(q),
          key: () => portraitKey(this, 'char', q.charId),
          hint: q.desc[zh ? 0 : 1],
        }));
      case 'skin':
        return SKINS.map((s) => ({
          name: `${CHARACTER_MAP[s.charId]?.name ?? ''} · ${s.name[zh ? 0 : 1]}`,
          have: skinOwned(s.charId),
          key: () => portraitKey(this, 'char', s.charId),
          hint: tx('商店里用金番茄购买，或角色熟练度 10 级', 'Buy with golden tomatoes, or reach mastery 10'),
        }));
      default:
        return null; // 成就等级、称号：数量太多，去成就页看
    }
  }

  private openDrawer(r: CollectionRow): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const color = SAUCE[r.id] ?? 0xe63946;
    const x = 330;
    const y = 96;
    const pw = W - x - 20;
    const ph = H - y - 20;
    const d = this.add.container(0, 0).setDepth(50);
    this.drawer = d;
    // 挡住下面的罐子
    const block = this.add.zone(0, 0, W, H).setOrigin(0).setInteractive();
    block.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.x < x || p.y < y) this.closeDrawer();
    });
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRect(0, 0, W, H);
    g.fillStyle(0x24130e, 1).fillRoundedRect(x, y, pw, ph, 14);
    g.lineStyle(3, color, 1).strokeRoundedRect(x, y, pw, ph, 14);
    g.fillStyle(color, 1).fillRoundedRect(x, y, pw, 58, { tl: 14, tr: 14, bl: 0, br: 0 });
    d.add([block, g]);
    const pct = r.total ? Math.floor((r.have / r.total) * 100) : 100;
    const title = text(this, x + 22, y + 12, r.name[lang === 'zh' ? 0 : 1], 26);
    d.add(title);
    d.add(text(this, title.x + title.width + 18, y + 18, `${r.have} / ${r.total} · ${pct}%`, 20, '#fff4ea'));
    d.add(button(this, x + pw - 70, y + 29, 100, 40, tx('关上', 'Close'), () => this.closeDrawer(), 0x3a2418, 18));
    const tip = text(this, x + 22, y + ph - 40, '', 17, COLORS.textDim, { wordWrap: { width: pw - 44 } });
    d.add(tip);

    const cells = this.cells(r.id);
    if (!cells) {
      d.add(
        text(
          this,
          x + pw / 2,
          y + ph / 2 - 30,
          tx(
            `${r.name[0]}一共 ${r.total} 个，太多了放不进抽屉。\n去「成就」页看看下一个最近的目标。`,
            `${r.total} in total, too many for one drawer.\nCheck the Achievements page for your nearest goal.`,
          ),
          20,
          COLORS.text,
          { align: 'center' },
        ).setOrigin(0.5),
      );
      d.add(
        button(
          this,
          x + pw / 2,
          y + ph / 2 + 50,
          200,
          50,
          tx('打开成就', 'Open Achievements'),
          () => this.scene.start('Achievements'),
          color,
          20,
        ),
      );
      return;
    }
    // 保持图鉴顺序，不把已收集的排前面：空着的剪影格就是「还缺这个」，更想补齐
    const cell = 76;
    const gx = x + 22;
    const gy = y + 74;
    const cols = Math.max(1, Math.floor((pw - 44) / cell));
    const rowsN = Math.max(1, Math.floor((ph - 74 - 56) / cell));
    const per = cols * rowsN;
    const pages = Math.ceil(cells.length / per);
    const grid = this.add.container(0, 0);
    d.add(grid);
    let page = 0;
    const idle = tx(
      `已收集 ${r.have} 个，剪影是还没找到的。把鼠标放在格子上看名字。`,
      `${r.have} collected. Silhouettes are still missing. Hover a slot to see its name.`,
    );
    tip.setText(idle);
    const draw = () => {
      grid.removeAll(true);
      cells.slice(page * per, page * per + per).forEach((cl, i) => {
        const cx = gx + (i % cols) * cell + cell / 2;
        const cy = gy + Math.floor(i / cols) * cell + cell / 2;
        const bg = this.add.graphics();
        bg.fillStyle(cl.have ? 0x3a2418 : 0x170b09, 1).fillRoundedRect(cx - 33, cy - 33, 66, 66, 10);
        bg.lineStyle(2, cl.have ? color : 0x3a2418, cl.have ? 0.9 : 1).strokeRoundedRect(cx - 33, cy - 33, 66, 66, 10);
        grid.add(bg);
        if (cl.key) {
          const img = fitImage(this.add.image(cx, cy, cl.key()), 54);
          // 没收集的：纯黑剪影，看得出形状但看不清是什么
          if (!cl.have) img.setTintFill(0x000000).setAlpha(0.75);
          grid.add(img);
        } else {
          const gem = this.add.graphics();
          gem.fillStyle(cl.have ? (cl.gem ?? color) : 0x000000, cl.have ? 1 : 0.75);
          gem.fillPoints(
            [
              new Phaser.Math.Vector2(cx, cy - 22),
              new Phaser.Math.Vector2(cx + 18, cy - 4),
              new Phaser.Math.Vector2(cx, cy + 22),
              new Phaser.Math.Vector2(cx - 18, cy - 4),
            ],
            true,
          );
          if (cl.have) gem.fillStyle(0xffffff, 0.35).fillTriangle(cx, cy - 22, cx + 18, cy - 4, cx, cy - 4);
          grid.add(gem);
        }
        if (!cl.have) grid.add(text(this, cx, cy, '?', 26, '#5a3a2a').setOrigin(0.5));
        const z = this.add
          .zone(cx - 33, cy - 33, 66, 66)
          .setOrigin(0)
          .setInteractive({ useHandCursor: false });
        z.on('pointerover', () => {
          bg.lineStyle(2, 0xffd166, 1).strokeRoundedRect(cx - 33, cy - 33, 66, 66, 10);
          tip.setColor(cl.have ? '#fff4ea' : COLORS.textDim);
          tip.setText(cl.have ? cl.name : tx(`？？？ · ${cl.hint ?? '尚未发现'}`, `??? · ${cl.hint ?? 'Not found yet'}`));
        });
        z.on('pointerout', () => {
          bg.lineStyle(2, cl.have ? color : 0x3a2418, 1).strokeRoundedRect(cx - 33, cy - 33, 66, 66, 10);
          tip.setColor(COLORS.textDim).setText(idle);
        });
        grid.add(z);
      });
      if (pages > 1) {
        const py = y + ph - 32;
        grid.add(text(this, x + pw - 150, py, `${page + 1} / ${pages}`, 18).setOrigin(0.5));
        grid.add(button(this, x + pw - 210, py, 56, 36, '◀', () => ((page = (page - 1 + pages) % pages), draw()), 0x3a2418, 18));
        grid.add(button(this, x + pw - 90, py, 56, 36, '▶', () => ((page = (page + 1) % pages), draw()), 0x3a2418, 18));
      }
    };
    draw();
    // 抽屉拉开：从下往上滑一段
    d.y = 30;
    d.alpha = 0;
    this.tweens.add({ targets: d, y: 0, alpha: 1, duration: 180, ease: 'Cubic.easeOut' });
  }

  private closeDrawer(): void {
    const d = this.drawer;
    if (!d) return;
    this.drawer = null;
    this.tweens.add({ targets: d, y: 30, alpha: 0, duration: 140, onComplete: () => d.destroy(true) });
  }
}
