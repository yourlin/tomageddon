import { preloadWorkbench, workbenchBackground, workbenchButton as button, workbenchPanel as panel } from '../ui/WorkbenchUI';
import { requestWeaponArt } from '../systems/WeaponArtRegistry';
// 合成表：按配方合成 T4 与超武（参考王者荣耀的装备合成树）。
// 布局：顶部是分类（配方类型 + 伤害类型 + 只看能合成）与「我的武器」条；左侧是配方列表；
// 右侧是横向升级树——从左到右是「材料 → 产物 → 可继续合成」，底部列出还缺的材料与「合成」按钮。
// 点「我的武器」里的一把，列表就只剩和它相关的配方，并自动选中最接近完成的那条。
import Phaser from 'phaser';
import { text, COLORS, fitImage, hitArea, autoRelayout, toast, tu, fs, PHONE } from '../ui/UI';
import { run, saveRun, type OwnedWeapon } from '../systems/RunState';
import { WEAPON_MAP, TIER_NAMES, type WeaponDef } from '../data/weapons';
import { ITEM_MAP } from '../data/items';
import { RARITY } from '../data/balance';
import { weaponDmgType } from '../data/describe';
import { weaponTags } from '../data/weaponTags';
import { itemIconKey } from '../art/ItemArt';
import { RECIPES, RECIPE_BY_TO, missingItems, slotLabel, type Recipe, type RecipeKind } from '../data/recipes';
import { superBuffText } from '../systems/SuperBuffs';
import { tx, lang } from '../i18n';
import { audio } from '../systems/Audio';
import { isFavoredWeapon, isDoubleFavored } from '../data/affinity';
import { weaponDamage, weaponCooldown, weaponRange } from '../systems/WeaponSystem';
import { VW, VH } from '../systems/HiDpi';

const KIND_NAME: Record<RecipeKind, [string, string]> = {
  t4: ['T4', 'T4'],
  super: ['超武', 'Super'],
};
const KIND_COLOR: Record<RecipeKind, string> = { t4: '#6ec6ff', super: '#ffd166' };
type KindFilter = 'recommend' | 'all' | RecipeKind;
type TypeFilter = 'all' | 'melee' | 'ranged' | 'elemental' | 'aura';
const typeOf = (d: WeaponDef): Exclude<TypeFilter, 'all'> => (d.kind === 'aura' ? 'aura' : d.cls);
const kname = (k: RecipeKind) => KIND_NAME[k][lang === 'en' ? 1 : 0];
const iconKey = (s: Phaser.Scene, id: string) => {
  requestWeaponArt(s, new Set([id]));
  return s.textures.exists(`icon_weapon_${id}`) ? `icon_weapon_${id}` : `weapon_${id}`;
};

/** 树上的一个武器节点：材料在左边（children），产物在右边 */
interface TreeNode {
  id: string;
  tier: number;
  /** 已持有（武器栏 / 仓库里有一把能用作这个节点） */
  owned: OwnedWeapon | null;
  /** 产出这个节点的配方（没有持有且能合成时才展开） */
  recipe: Recipe | null;
  /** 配方各道具槽实际能用的道具（null = 缺） */
  items: (string | null)[];
  children: TreeNode[];
  x: number;
  y: number;
}

export class CraftScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  /** 当前选中的配方（宣传片录制脚本也会直接设置它再 draw()） */
  selected: Recipe | null = null;
  /** 默认「推荐」：契合当前角色的、以及用得上手头武器的配方，契合的排最前 */
  private kind: KindFilter = 'recommend';
  private type: TypeFilter = 'all';
  private readyOnly = false;
  /** 「我的武器」里点中的武器：列表只显示和它相关的配方 */
  private focusId: string | null = null;
  private scroll = 0;
  private weaponPage = 0;

  constructor() {
    super('Craft');
  }

  init(data?: { focus?: string }): void {
    this.selected = null;
    this.focusId = null;
    this.scroll = 0;
    if (data?.focus) this.focus(data.focus);
  }

  /** 聚焦一把武器：列表只剩和它相关的配方，并选中最接近完成的那条。
   *  同时清掉类型 / 只看能合成的筛选（场景会记住上次的筛选，否则可能把相关配方全筛掉） */
  private focus(id: string | null): void {
    this.focusId = id;
    this.scroll = 0;
    if (!id) return;
    this.kind = 'recommend';
    this.type = 'all';
    this.readyOnly = false;
    this.selected = this.relatedRecipes(id)[0] ?? this.selected;
  }

  preload(): void {
    preloadWorkbench(this);
  }

  create(): void {
    autoRelayout(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.layer = this.add.container(0, 0);
    this.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      if (p.x > this.listRight) return; // 只有鼠标在左侧列表上时滚动列表
      this.scroll = Math.max(0, this.scroll + (dy > 0 ? 2 : -2));
      this.draw();
    });
    this.draw();
  }

  private listRight = 0;

  // ---------------- 数据 ----------------

  /** 这条配方还缺几样（武器 + 道具），用于排序与列表提示 */
  private lack(r: Recipe): { weapons: number; items: number } {
    const pool = [...run.allWeapons];
    let weapons = 0;
    for (const [id, tier] of r.from) {
      const i = pool.findIndex((w) => w.id === id && w.tier === tier);
      if (i < 0) weapons++;
      else pool.splice(i, 1);
    }
    return { weapons, items: missingItems(r, run.items).length };
  }

  /** 产物契合当前角色（触发角色天赋与 +10% 伤害） */
  private favored = (r: Recipe) => isFavoredWeapon(run.char.favored, WEAPON_MAP[r.to]);

  private closeness = (r: Recipe) => {
    const l = this.lack(r);
    return l.weapons * 2 + l.items;
  };

  /** 和某把武器相关的配方：产出它的、用它当材料的；按「最接近完成」排序 */
  private relatedRecipes(id: string): Recipe[] {
    const fav = (r: Recipe) => (this.favored(r) ? 0 : 1);
    return RECIPES.filter((r) => r.to === id || r.from.some(([w]) => w === id)).sort(
      (a, b) => fav(a) - fav(b) || this.closeness(a) - this.closeness(b),
    );
  }

  private list(): Recipe[] {
    let rows = this.focusId ? this.relatedRecipes(this.focusId) : RECIPES;
    if (this.kind === 'recommend' && !this.focusId) {
      // 推荐：契合的配方 + 用得上手头武器的配方
      const mine = new Set(run.allWeapons.map((w) => w.id));
      rows = rows.filter((r) => this.favored(r) || r.from.some(([w]) => mine.has(w)));
    } else if (this.kind !== 'all' && this.kind !== 'recommend') rows = rows.filter((r) => r.kind === this.kind);
    if (this.type !== 'all') rows = rows.filter((r) => typeOf(WEAPON_MAP[r.to]) === this.type);
    if (this.readyOnly) rows = rows.filter((r) => run.canCraft(r));
    // 契合武器优先；其次能合成 / 缺得少的；同等时超武在前
    const order: Record<RecipeKind, number> = { super: 0, t4: 1 };
    const fav = (r: Recipe) => (this.favored(r) ? 0 : 1);
    return [...rows].sort(
      (a, b) =>
        Number(run.canCraft(b)) - Number(run.canCraft(a)) ||
        fav(a) - fav(b) ||
        this.closeness(a) - this.closeness(b) ||
        order[a.kind] - order[b.kind],
    );
  }

  /**
   * 以配方产物为根建树。持有的武器、道具在整棵树里只分配一次（同一把不能既当 T4 又当 T3 材料）。
   * 没持有的 T4 材料如果有配方就继续往左展开，直到 T3 为止（T3 由同名 T2 合成，不再展开）。
   */
  private buildTree(r: Recipe): TreeNode {
    const pool = [...run.allWeapons];
    const items: Record<string, number> = { ...run.items };
    const take = (id: string, tier: number) => {
      const i = pool.findIndex((w) => w.id === id && w.tier === tier);
      return i < 0 ? null : pool.splice(i, 1)[0];
    };
    const pickItems = (rec: Recipe) =>
      rec.items.map((slot) => {
        const pick = slot.find((id) => (items[id] ?? 0) > 0) ?? null;
        if (pick) items[pick]--;
        return pick;
      });
    const node = (id: string, tier: number, depth: number, rec: Recipe | null): TreeNode => {
      const n: TreeNode = { id, tier, owned: null, recipe: null, items: [], children: [], x: 0, y: 0 };
      if (!rec) {
        n.owned = take(id, tier);
        const sub = RECIPE_BY_TO[id];
        // 没持有、是 T4、有配方 → 展开（最多 3 层，防止配方链过深）
        if (!n.owned && tier === 3 && sub && depth < 3) rec = sub;
      }
      if (rec) {
        n.recipe = rec;
        n.children = rec.from.map(([cid, ct]) => node(cid, ct, depth + 1, null));
        n.items = pickItems(rec);
      }
      return n;
    };
    return node(r.to, 3, 0, r);
  }

  // ---------------- 绘制 ----------------

  draw(): void {
    const W = VW(this),
      H = VH(this);
    const L = this.layer;
    L.removeAll(true);
    workbenchBackground(this, L, W, H);
    L.add(text(this, W / 2, 24, tx('武器合成', 'Weapon crafting'), 34, '#fff0ce', { fontStyle: 'bold' }).setOrigin(0.5, 0));
    L.add(button(this, 112, 43, 184, 42, tx('返回商店', 'Back to shop'), () => this.scene.start('Shop', { keep: true }), 0x49302e, 18));
    if (!this.selected) this.selected = this.list().find((r) => run.canCraft(r)) ?? this.list()[0] ?? null;
    this.drawMyWeapons(W);
    const top = 184;
    const listW = Math.min(284, W * 0.23);
    this.listRight = 144 + listW;
    L.add(panel(this, 16, top - 12, this.listRight - 8, H - top - 6));
    const kinds = [
      ['recommend', tx('推荐', 'Picks')],
      ['t4', tx('T4 合成', 'T4')],
      ['super', tx('超武合成', 'Super')],
      ['all', tx('全部配方', 'All')],
    ] as const;
    kinds.forEach(([id, label], i) =>
      L.add(
        button(
          this,
          77,
          top + 24 + i * 66,
          104,
          54,
          label,
          () => {
            this.kind = id;
            this.scroll = 0;
            this.selected = this.list().find((r) => run.canCraft(r)) ?? this.list()[0] ?? null;
            this.draw();
          },
          this.kind === id ? COLORS.primary : 0x49302e,
          16,
        ),
      ),
    );
    L.add(
      button(
        this,
        77,
        top + 298,
        104,
        40,
        this.readyOnly ? tx('只看可合成', 'Ready only') : tx('所有材料', 'Any status'),
        () => {
          this.readyOnly = !this.readyOnly;
          this.scroll = 0;
          this.selected = this.list().find((r) => run.canCraft(r)) ?? this.list()[0] ?? null;
          this.draw();
        },
        this.readyOnly ? COLORS.green : 0x49302e,
        13,
      ),
    );
    const types: TypeFilter[] = ['all', 'melee', 'ranged', 'elemental', 'aura'];
    const names = [tx('全部类型', 'All types'), tx('近战', 'Melee'), tx('远程', 'Ranged'), tx('元素', 'Elemental'), tx('光环', 'Aura')];
    L.add(
      button(
        this,
        77,
        top + 348,
        104,
        40,
        names[types.indexOf(this.type)],
        () => {
          this.type = types[(types.indexOf(this.type) + 1) % types.length];
          this.scroll = 0;
          this.selected = this.list().find((r) => run.canCraft(r)) ?? this.list()[0] ?? null;
          this.draw();
        },
        0x49302e,
        13,
      ),
    );
    this.drawList(144, top, listW - 8, H - top - 26);
    this.drawTree(this.listRight + 16, top - 12, W - this.listRight - 32, H - top - 6);
  }

  /** 「我的武器」：武器栏 + 仓库。点一把看它的合成可能 */
  private drawMyWeapons(W: number): void {
    const L = this.layer;
    const y = 98,
      s = Math.min(62, tu(54));
    L.add(panel(this, 16, 86, W - 32, 82));
    const lbl = text(this, 28, y + s / 2, tx('我的武器', 'My weapons'), fs(15), '#ffb347').setOrigin(0, 0.5);
    L.add(lbl);
    const all = run.allWeapons;
    let x = lbl.x + lbl.width + 14;
    if (!all.length) L.add(text(this, x, y + s / 2, tx('还没有武器', 'No weapons yet'), fs(14), COLORS.textDim).setOrigin(0, 0.5));
    const perPage = Math.max(1, Math.floor((W - 420) / (s + 8)));
    const pages = Math.max(1, Math.ceil(all.length / perPage));
    this.weaponPage = Math.min(this.weaponPage, pages - 1);
    if (pages > 1)
      L.add(
        button(
          this,
          W - 250,
          y + s / 2,
          72,
          36,
          `${this.weaponPage + 1}/${pages} ›`,
          () => {
            this.weaponPage = (this.weaponPage + 1) % pages;
            this.draw();
          },
          0x49302e,
          14,
        ),
      );
    for (const w of all.slice(this.weaponPage * perPage, (this.weaponPage + 1) * perPage)) {
      if (x + s > W - 200) break;
      const on = this.focusId === w.id;
      const n = this.relatedRecipes(w.id).length;
      L.add(panel(this, x, y, s, s, COLORS.panel, on ? COLORS.gold : RARITY[w.tier].color));
      L.add(fitImage(this.add.image(x + s / 2, y + s / 2 - 2, iconKey(this, w.id)), s - 14));
      L.add(text(this, x + s - 4, y + s - 3, TIER_NAMES[w.tier], fs(11), RARITY[w.tier].css).setOrigin(1, 1));
      if (run.inStorage(w.uid)) L.add(text(this, x + 4, y + 2, tx('仓', 'S'), fs(11), COLORS.textDim));
      if (n && !on) L.add(text(this, x + s - 3, y + 2, String(n), fs(11), '#ffd166').setOrigin(1, 0));
      if (isFavoredWeapon(run.char.favored, WEAPON_MAP[w.id]))
        L.add(
          text(this, x + 3, y + s - 3, isDoubleFavored(run.char.favored, WEAPON_MAP[w.id]) ? '★★' : '★', fs(12), '#ffd166').setOrigin(0, 1),
        );
      L.add(
        hitArea(this, x, y, s, s, () => {
          this.focus(on ? null : w.id);
          this.draw();
        }),
      );
      x += s + 8;
    }
    if (this.focusId) {
      const d = WEAPON_MAP[this.focusId];
      L.add(
        button(
          this,
          W - 110,
          y + s / 2,
          190,
          36,
          tx(`× 取消「${d.name}」`, `× Clear ${d.name}`),
          () => {
            this.focusId = null;
            this.scroll = 0;
            this.draw();
          },
          0x5a4a4a,
          14,
        ),
      );
    }
  }

  private drawList(x: number, y: number, w: number, h: number): void {
    const L = this.layer;
    const rows = this.list();
    const rowH = tu(54);
    const head = 26;
    const perPage = Math.max(1, Math.floor((h - head - 40) / rowH));
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, Math.max(0, rows.length - perPage));
    const title = tx(`${rows.length} 条配方 · 点击查看`, `${rows.length} recipes · select one`);
    L.add(text(this, x, y, title, fs(14), '#c4ac91'));
    rows.slice(this.scroll, this.scroll + perPage).forEach((r, i) => {
      const ry = y + head + i * rowH;
      const d = WEAPON_MAP[r.to];
      const l = this.lack(r);
      const ready = l.weapons + l.items === 0;
      const sel = this.selected === r;
      L.add(panel(this, x, ry, w, rowH - 6, sel ? COLORS.panelLight : COLORS.panel, sel ? COLORS.gold : ready ? 0x52ff8a : 0x5a4a4a));
      L.add(fitImage(this.add.image(x + 26, ry + (rowH - 6) / 2, iconKey(this, d.id)), tu(36)));
      L.add(
        text(
          this,
          x + 52,
          ry + 6,
          (this.favored(r) ? '★ ' : '') + d.name,
          fs(tu(15)),
          ready ? '#52ff8a' : this.favored(r) ? '#ffd166' : '#fff4ea',
        ),
      );
      L.add(
        text(
          this,
          x + 52,
          ry + tu(27),
          ready
            ? tx('材料齐全，可以合成', 'Ready to craft')
            : tx(`缺 ${l.weapons} 把武器 · ${l.items} 个道具`, `need ${l.weapons} weapons · ${l.items} items`),
          fs(tu(12)),
          ready ? '#9be564' : COLORS.textDim,
        ),
      );
      L.add(text(this, x + w - 10, ry + 8, kname(r.kind), fs(tu(13)), KIND_COLOR[r.kind]).setOrigin(1, 0));
      L.add(
        hitArea(this, x, ry, w, rowH - 6, () => {
          this.selected = r;
          this.draw();
        }),
      );
    });
    if (!rows.length) L.add(text(this, x, y + head + 10, tx('没有符合条件的配方', 'No recipes match'), fs(15), COLORS.textDim));
    // 翻页（触屏没有滚轮）
    if (rows.length > perPage) {
      const by = y + h - 18;
      const step = (d: number) => () => {
        this.scroll = Phaser.Math.Clamp(this.scroll + d * perPage, 0, rows.length - perPage);
        this.draw();
      };
      // 手机上页码字号更大：翻页按钮收窄，给右下角的页码留位置
      const [bw, b1, b2] = PHONE ? [70, 40, 118] : [90, 50, 150];
      L.add(button(this, x + b1, by, bw, 32, '▲', step(-1), 0x4a3a3a, 14).setEnabled(this.scroll > 0));
      L.add(button(this, x + b2, by, bw, 32, '▼', step(1), 0x4a3a3a, 14).setEnabled(this.scroll + perPage < rows.length));
      L.add(
        text(
          this,
          x + w - 6,
          by,
          `${this.scroll + 1}-${Math.min(rows.length, this.scroll + perPage)} / ${rows.length}`,
          fs(12),
          COLORS.textDim,
        ).setOrigin(1, 0.5),
      );
    }
  }

  /** 横向升级树：左边是材料，往右是产物，再往右是「可继续合成」 */
  private drawTree(x: number, y: number, w: number, h: number): void {
    const L = this.layer;
    L.add(panel(this, x, y, w, h));
    const r = this.selected;
    if (!r) {
      L.add(
        text(this, x + w / 2, y + h / 2, tx('选择配方，查看合成材料', 'Select a recipe to see its materials'), 20, '#c4ac91').setOrigin(
          0.5,
        ),
      );
      return;
    }
    const root = this.buildTree(r),
      d = WEAPON_MAP[r.to];
    const ready = run.canCraft(r);
    iconKey(this, d.id);
    L.add(
      text(
        this,
        x + 24,
        y + 18,
        `${d.name} ${r.kind === 'super' ? kname(r.kind) : TIER_NAMES[3]} · ${weaponDmgType(d).name}`,
        23,
        '#fff0ce',
        { fontStyle: 'bold' },
      ),
    );
    L.add(
      text(
        this,
        x + 24,
        y + 51,
        tx('材料武器与指定道具 · 点击材料查看前置配方', 'Weapons & required items · select a material for prerequisites'),
        fs(13),
        '#c4ac91',
      ),
    );
    const rows = root.children.length + r.items.length;
    const diagramH = h - 252;
    const rowH = Math.min(74, diagramH / Math.max(1, rows));
    const nw = Math.min(220, w * 0.38),
      nh = Math.min(58, rowH - 10);
    const startY = y + 82;
    const resultX = x + w * 0.69,
      resultY = startY + diagramH / 2;
    const links = this.add.graphics().lineStyle(3, 0xb88d58, 0.8);
    L.add(links);
    root.children.forEach((node, i) => {
      node.x = x + 20;
      node.y = startY + i * rowH;
      links.lineBetween(node.x + nw, node.y + nh / 2, x + w * 0.47, node.y + nh / 2);
      links.lineBetween(x + w * 0.47, node.y + nh / 2, x + w * 0.47, resultY);
      // Only the selected step is expanded; material cards navigate to their own recipe.
      const recipe = node.recipe;
      this.drawNode(node, false, nw, nh, false);
      if (recipe)
        L.add(
          hitArea(this, node.x, node.y, nw, nh, () => {
            this.selected = recipe;
            this.draw();
          }),
        );
    });
    r.items.forEach((slot, i) => {
      const id = root.items[i] ?? slot[0],
        item = ITEM_MAP[id],
        have = !!root.items[i];
      const yy = startY + (root.children.length + i) * rowH;
      links.lineBetween(x + 20 + nw, yy + nh / 2, x + w * 0.47, yy + nh / 2);
      links.lineBetween(x + w * 0.47, yy + nh / 2, x + w * 0.47, resultY);
      L.add(panel(this, x + 20, yy, nw, nh, COLORS.panel, have ? 0x8cbb67 : 0x8b5677));
      L.add(fitImage(this.add.image(x + 46, yy + nh / 2, itemIconKey(this, item)), 36).setAlpha(have ? 1 : 0.55));
      const label = text(this, x + 72, yy + 8, item.name, fs(14), '#fff0ce');
      if (label.width > nw - 60) label.setScale((nw - 60) / label.width);
      L.add(label);
      L.add(
        text(
          this,
          x + 72,
          yy + 30,
          have ? tx('已持有 · 消耗 1 件', 'Owned · consumes 1') : tx('缺少指定道具', 'Required item missing'),
          fs(12),
          have ? '#9be564' : '#dc9e9e',
        ),
      );
      L.add(hitArea(this, x + 20, yy, nw, nh, () => toast(this, slotLabel(slot), '#fff0ce')));
    });
    links.lineBetween(x + w * 0.47, resultY, resultX - 64, resultY);
    L.add(fitImage(this.add.image(resultX, resultY - 22, `weapon_${d.id}`), Math.min(244, w * 0.4)));
    L.add(
      text(
        this,
        resultX,
        resultY + 62,
        ready ? tx('材料齐全', 'Ready to craft') : tx('等待材料', 'Materials needed'),
        21,
        ready ? '#9be564' : '#e3c08a',
      ).setOrigin(0.5),
    );
    L.add(
      hitArea(this, resultX - 125, resultY - 100, 250, 150, () =>
        toast(this, `${d.name}：${d.desc} [${weaponTags(d).join(' / ')}]`, '#fff0ce'),
      ),
    );
    const next = RECIPES.filter((n) => n.from.some(([id, tier]) => id === r.to && tier === 3));
    if (next.length)
      L.add(
        button(
          this,
          resultX,
          startY + diagramH + 20,
          Math.min(246, w * 0.43),
          36,
          tx(`后续：${WEAPON_MAP[next[0].to].name} ›`, `Next: ${WEAPON_MAP[next[0].to].name} ›`),
          () => {
            this.selected = next[0];
            this.draw();
          },
          0x49302e,
          14,
        ),
      );
    const statY = y + h - 188;
    L.add(
      text(
        this,
        x + 24,
        statY,
        tx(
          `伤害 ${Math.round(weaponDamage(d, 3, run.stats))}   冷却 ${weaponCooldown(d, 3, run.stats).toFixed(2)}s   射程 ${Math.round(weaponRange(d, run.stats, undefined, 0, 3))}`,
          `DMG ${Math.round(weaponDamage(d, 3, run.stats))}   CD ${weaponCooldown(d, 3, run.stats).toFixed(2)}s   Range ${Math.round(weaponRange(d, run.stats, undefined, 0, 3))}`,
        ),
        fs(16),
        '#f1d69e',
      ),
    );
    L.add(
      text(
        this,
        x + 24,
        statY + 27,
        tx(
          `将消耗 ${r.from.length} 把材料武器与 ${r.items.length} 件配方道具`,
          `Consumes ${r.from.length} weapons and ${r.items.length} required items`,
        ),
        fs(13),
        '#ef9992',
      ),
    );
    this.drawMissing(r, root, x, y + h - 144, w);
  }

  /** 这个节点（含它的子树）是否已经齐了：持有，或者配方材料与道具全部齐全 */
  private complete(n: TreeNode): boolean {
    if (n.owned) return true;
    if (!n.recipe) return false;
    return n.children.every((c) => this.complete(c)) && n.items.every(Boolean);
  }

  private drawNode(n: TreeNode, isRoot: boolean, NW: number, NH: number, showItems = true): void {
    const L = this.layer;
    const d = WEAPON_MAP[n.id];
    const ok = this.complete(n);
    const border = isRoot ? (ok ? 0x52ff8a : COLORS.gold) : n.owned ? 0x52ff8a : ok ? 0xffd166 : 0x8a4a4a;
    L.add(panel(this, n.x, n.y, NW, NH, isRoot ? COLORS.panelLight : COLORS.panel, border));
    const icon = fitImage(this.add.image(n.x + 28, n.y + NH / 2, iconKey(this, n.id)), 42);
    if (!n.owned && !ok) icon.setAlpha(0.55);
    L.add(icon);
    const nodeName = text(this, n.x + 56, n.y + 8, d.name, fs(15), RARITY[n.tier].css);
    if (nodeName.width > NW - 64) nodeName.setScale((NW - 64) / nodeName.width);
    L.add(nodeName);
    const where = n.owned ? (run.inStorage(n.owned.uid) ? tx('仓库', 'storage') : tx('武器栏', 'equipped')) : '';
    const status = n.owned
      ? tx(`✓ ${TIER_NAMES[n.tier]} · ${where}`, `✓ ${TIER_NAMES[n.tier]} · ${where}`)
      : n.recipe
        ? ok
          ? tx(`${TIER_NAMES[n.tier]} · 可合成`, `${TIER_NAMES[n.tier]} · craftable`)
          : tx(`${TIER_NAMES[n.tier]} · 需合成`, `${TIER_NAMES[n.tier]} · craft it`)
        : n.tier === 2
          ? tx('✗ 缺 III · 同名 II×2 合成', '✗ need III · merge 2× II')
          : tx(`✗ 缺 ${TIER_NAMES[n.tier]}`, `✗ need ${TIER_NAMES[n.tier]}`);
    L.add(text(this, n.x + 56, n.y + 31, status, fs(12), n.owned ? '#52ff8a' : ok ? '#ffd166' : '#ff9f9f'));
    // 这个节点的配方道具：每件一行「图标 + 名字 + ✓/✗」（都是指定的 T3 道具，名字要看得到）
    if (n.recipe && showItems) {
      n.recipe.items.forEach((slot, i) => {
        const id = n.items[i] ?? slot[0];
        const have = !!n.items[i];
        const it = ITEM_MAP[id];
        const iy = n.y + NH + 14 + i * 24;
        const im = fitImage(this.add.image(n.x + 16, iy, itemIconKey(this, it)), 22);
        if (!have) im.setAlpha(0.45);
        L.add(im);
        L.add(text(this, n.x + 32, iy, `${it.name}`, fs(13), have ? RARITY[it.rarity].css : '#c9a9a6').setOrigin(0, 0.5));
        L.add(text(this, n.x + NW - 6, iy, have ? '✓' : '✗', fs(14), have ? '#52ff8a' : '#ff6b6b').setOrigin(1, 0.5));
      });
    }
    // 点节点：有配方就切到这条配方；T3 材料则聚焦这把武器，看它相关的配方
    L.add(
      hitArea(this, n.x, n.y, NW, NH, () => {
        if (isRoot) return;
        if (n.recipe) this.selected = n.recipe;
        else this.focus(n.id);
        this.draw();
      }),
    );
  }

  /** 底部：还缺的武器与道具（整棵树汇总），以及合成按钮 */
  private drawMissing(r: Recipe, root: TreeNode, x: number, y: number, w: number): void {
    const L = this.layer;
    const missW: string[] = [];
    const missI: string[] = [];
    const walk = (n: TreeNode) => {
      if (n.owned) return;
      if (!n.recipe) {
        missW.push(`${WEAPON_MAP[n.id].name} ${TIER_NAMES[n.tier]}`);
        return;
      }
      n.recipe.items.forEach((slot, i) => {
        if (!n.items[i]) missI.push(slotLabel(slot));
      });
      n.children.forEach(walk);
    };
    walk(root);
    const g = this.add.graphics();
    g.lineStyle(1, 0x5a4a4a, 1).lineBetween(x + 16, y, x + w - 16, y);
    L.add(g);
    const d = WEAPON_MAP[r.to];
    let ty = y + 12;
    // Keep the summary bounded even for deep super-weapon recipes. Tap any row for the full text.
    const summary = (label: string, color: string, size = 14) => {
      const t = text(this, x + 16, ty, label, fs(size), color);
      let shown = label;
      while (shown.length > 1 && t.width > w - 32) {
        shown = shown.slice(0, -1);
        t.setText(shown + '…');
      }
      L.add(t);
      L.add(hitArea(this, x + 16, ty - 2, w - 32, PHONE ? 30 : 24, () => toast(this, label, color)));
      ty += PHONE ? 30 : 25;
    };
    if (d.superBuff) summary(superBuffText(d.superBuff)[lang === 'en' ? 1 : 0], '#ffd166', 12);
    const sep = tx('、', ', ');
    if (!missW.length && !missI.length) summary(tx('材料齐全', 'All materials ready'), '#9be564');
    else {
      if (missW.length) summary(tx('缺武器：', 'Missing weapons: ') + missW.join(sep), '#ff9f9f');
      if (missI.length) summary(tx('缺道具：', 'Missing items: ') + missI.join(sep), '#ff9f9f');
    }
    // 合成按钮只合成选中的这一步（下层的 T4 需要先选中对应配方合成）
    const ok = run.canCraft(r);
    L.add(
      button(
        this,
        x + w / 2,
        y + 118,
        Math.min(420, w - 40),
        46,
        ok
          ? tx(`合成「${d.name}」`, `Craft ${d.name}`)
          : root.children.some((c) => !c.owned && c.recipe && this.complete(c))
            ? tx('先合成左边的材料', 'Craft the materials first')
            : tx('材料不足', 'Missing materials'),
        () => {
          if (!run.craft(r)) {
            toast(this, tx('材料不足', 'Missing materials'), '#ff6b6b');
            return;
          }
          audio.play(this, 'levelup');
          toast(this, tx(`合成成功：${d.name}`, `Crafted: ${d.name}`), '#52ff8a');
          saveRun();
          this.draw();
        },
        ok ? COLORS.green : 0x4a3a3a,
        18,
      ).setEnabled(ok),
    );
  }
}
