// 合成表：按配方合成 T4 与超武（参考王者荣耀的装备合成树）。
// 布局：顶部是分类（配方类型 + 伤害类型 + 只看能合成）与「我的武器」条；左侧是配方列表；
// 右侧是横向升级树——从左到右是「材料 → 产物 → 可继续合成」，底部列出还缺的材料与「合成」按钮。
// 点「我的武器」里的一把，列表就只剩和它相关的配方，并自动选中最接近完成的那条。
import Phaser from 'phaser';
import { text, button, panel, COLORS, fitImage, hitArea, autoRelayout, toast, tu } from '../ui/UI';
import { run, saveRun, type OwnedWeapon } from '../systems/RunState';
import { WEAPON_MAP, TIER_NAMES, type WeaponDef } from '../data/weapons';
import { ITEM_MAP } from '../data/items';
import { RARITY } from '../data/balance';
import { itemIconKey } from '../art/ItemArt';
import { RECIPES, RECIPE_BY_TO, missingItems, slotLabel, type Recipe, type RecipeKind } from '../data/recipes';
import { weaponTags, TAG_MAP } from '../data/weaponTags';
import { weaponDmgType } from '../data/describe';
import { superBuffText } from '../systems/SuperBuffs';
import { tx, lang } from '../i18n';
import { tagName } from '../i18n/apply';
import { audio } from '../systems/Audio';
import { isFavoredWeapon } from '../data/affinity';
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
const iconKey = (s: Phaser.Scene, id: string) => (s.textures.exists(`icon_weapon_${id}`) ? `icon_weapon_${id}` : `weapon_${id}`);

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
    return [...rows].sort((a, b) => fav(a) - fav(b) || this.closeness(a) - this.closeness(b) || order[a.kind] - order[b.kind]);
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
    L.add(text(this, 24, 14, tx('合成表', 'Crafting'), 32));
    L.add(
      text(
        this,
        160,
        28,
        tx(
          'T4 与超武只能按配方合成：两把武器 + 道具（道具会被消耗），仓库里的武器也能当材料',
          'T4s and supers come only from recipes: two weapons + items (consumed). Storage counts as materials.',
        ),
        14,
        COLORS.textDim,
      ),
    );
    L.add(button(this, W - 80, 34, 130, 44, tx('返回', 'Back'), () => this.scene.start('Shop'), 0x555555, 18));

    // 没选中配方时默认选列表第一条（推荐视图下就是最值得合成的契合武器），右侧树不空着
    if (!this.selected) this.selected = this.list()[0] ?? null;
    this.drawFilters(W);
    this.drawMyWeapons(W);

    const top = 186;
    const listW = Math.min(360, W * 0.27);
    this.listRight = 20 + listW;
    this.drawList(20, top, listW, H - top - 16);
    this.drawTree(this.listRight + 14, top, W - this.listRight - 34, H - top - 16);
  }

  /** 分类：配方类型 + 伤害类型 + 只看能合成 */
  private drawFilters(W: number): void {
    const L = this.layer;
    const y = 82;
    const chip = (x: number, w0: number, label: string, on: boolean, onClick: () => void, color = COLORS.primary) => {
      // 宽度至少容纳文字（触屏放大字号后，写死的宽度会放不下）
      const probe = text(this, 0, 0, label, tu(15));
      const w = Math.max(w0, probe.width + 22);
      probe.destroy();
      L.add(button(this, x + w / 2, y, w, tu(34), label, onClick, on ? color : 0x3d2f2f, tu(15)));
      return x + w + 8;
    };
    const set = (fn: () => void) => () => {
      fn();
      this.scroll = 0;
      this.draw();
    };
    let x = 20;
    for (const k of ['recommend', 'all', 'super', 't4'] as KindFilter[])
      x = chip(
        x,
        k === 'recommend' ? 96 : 66,
        k === 'recommend' ? tx('★ 推荐', '★ For you') : k === 'all' ? tx('全部', 'All') : kname(k),
        this.kind === k,
        set(() => (this.kind = k)),
        k === 'recommend' ? 0xb07d2b : COLORS.primary,
      );
    x += 14;
    const TYPES: [TypeFilter, string][] = [
      ['all', tx('全部类型', 'Any')],
      ['melee', tx('近战', 'Melee')],
      ['ranged', tx('远程', 'Ranged')],
      ['elemental', tx('元素', 'Elemental')],
      ['aura', tx('光环', 'Aura')],
    ];
    for (const [t, name] of TYPES) {
      // 类型按钮左侧留出图标位置（标签前补空格），宽度按文字算，英文「Elemental」也放得下
      const label = t === 'all' ? name : `    ${name}`;
      const probe = text(this, 0, 0, label, tu(15));
      const cw = t === 'all' ? 70 : Math.max(76, probe.width + 22);
      probe.destroy();
      const nx = chip(
        x,
        cw,
        label,
        this.type === t,
        set(() => (this.type = t)),
        0x2d6a8a,
      );
      // 伤害类型用图标标出（与商店一致）
      if (t !== 'all') {
        const key = `dmgtype_${t}`;
        if (this.textures.exists(key)) L.add(fitImage(this.add.image(x + 14, y - 1, key), 18));
      }
      x = nx;
    }
    x += 14;
    const ready = RECIPES.filter((r) => run.canCraft(r)).length;
    chip(
      x,
      150,
      tx(`✔ 只看能合成（${ready}）`, `✔ Ready only (${ready})`),
      this.readyOnly,
      set(() => (this.readyOnly = !this.readyOnly)),
      COLORS.green,
    );
    void W;
  }

  /** 「我的武器」：武器栏 + 仓库。点一把看它的合成可能 */
  private drawMyWeapons(W: number): void {
    const L = this.layer;
    const y = 112,
      s = Math.min(62, tu(54));
    const lbl = text(this, 20, y + s / 2, tx('我的武器', 'My weapons'), 15, '#ffb347').setOrigin(0, 0.5);
    L.add(lbl);
    const all = run.allWeapons;
    let x = lbl.x + lbl.width + 14;
    if (!all.length) L.add(text(this, x, y + s / 2, tx('还没有武器', 'No weapons yet'), 14, COLORS.textDim).setOrigin(0, 0.5));
    for (const w of all) {
      if (x + s > W - 200) break;
      const on = this.focusId === w.id;
      const n = this.relatedRecipes(w.id).length;
      L.add(panel(this, x, y, s, s, COLORS.panel, on ? COLORS.gold : RARITY[w.tier].color));
      L.add(fitImage(this.add.image(x + s / 2, y + s / 2 - 2, iconKey(this, w.id)), s - 14));
      L.add(text(this, x + s - 4, y + s - 3, TIER_NAMES[w.tier], 11, RARITY[w.tier].css).setOrigin(1, 1));
      if (run.inStorage(w.uid)) L.add(text(this, x + 4, y + 2, tx('仓', 'S'), 11, COLORS.textDim));
      if (n && !on) L.add(text(this, x + s - 3, y + 2, String(n), 11, '#ffd166').setOrigin(1, 0));
      if (isFavoredWeapon(run.char.favored, WEAPON_MAP[w.id])) L.add(text(this, x + 3, y + s - 3, '★', 12, '#ffd166').setOrigin(0, 1));
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
    const title = this.focusId
      ? tx(
          `与「${WEAPON_MAP[this.focusId].name}」相关的配方 · ${rows.length} 条`,
          `Recipes with ${WEAPON_MAP[this.focusId].name} · ${rows.length}`,
        )
      : this.kind === 'recommend'
        ? tx(`推荐 ${rows.length} 条 · ★ = 契合「${run.char.name}」`, `${rows.length} picks · ★ = synergy`)
        : tx(`共 ${rows.length} 条配方`, `${rows.length} recipes`);
    L.add(text(this, x, y, title, 14, this.focusId ? '#ffd166' : COLORS.textDim));
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
          tu(16),
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
          tu(12),
          ready ? '#9be564' : COLORS.textDim,
        ),
      );
      L.add(text(this, x + w - 10, ry + 8, kname(r.kind), tu(13), KIND_COLOR[r.kind]).setOrigin(1, 0));
      L.add(
        hitArea(this, x, ry, w, rowH - 6, () => {
          this.selected = r;
          this.draw();
        }),
      );
    });
    if (!rows.length) L.add(text(this, x, y + head + 10, tx('没有符合条件的配方', 'No recipes match'), 15, COLORS.textDim));
    // 翻页（触屏没有滚轮）
    if (rows.length > perPage) {
      const by = y + h - 18;
      const step = (d: number) => () => {
        this.scroll = Phaser.Math.Clamp(this.scroll + d * perPage, 0, rows.length - perPage);
        this.draw();
      };
      L.add(button(this, x + 50, by, 90, 32, '▲', step(-1), 0x4a3a3a, 14).setEnabled(this.scroll > 0));
      L.add(button(this, x + 150, by, 90, 32, '▼', step(1), 0x4a3a3a, 14).setEnabled(this.scroll + perPage < rows.length));
      L.add(
        text(
          this,
          x + w - 6,
          by,
          `${this.scroll + 1}-${Math.min(rows.length, this.scroll + perPage)} / ${rows.length}`,
          12,
          COLORS.textDim,
        ).setOrigin(1, 0.5),
      );
    }
  }

  /** 横向升级树：左边是材料，往右是产物，再往右是「可继续合成」 */
  private drawTree(x: number, y: number, w: number, h: number): void {
    const L = this.layer;
    L.add(panel(this, x, y, w, h, COLORS.panel, COLORS.border));
    const r = this.selected;
    if (!r) {
      L.add(
        text(
          this,
          x + w / 2,
          y + h / 2,
          tx('从左侧选一条配方，或点上面「我的武器」看它能合成什么', 'Pick a recipe, or tap one of your weapons above'),
          16,
          COLORS.textDim,
        ).setOrigin(0.5),
      );
      return;
    }
    const root = this.buildTree(r);
    const next = RECIPES.filter((n) => n.kind === 'super' && n.from[0][0] === r.to && n.from[0][1] === 3);

    // 布局：叶子从上到下依次占行，父节点取子节点的竖向中点；列 = 深度（根在最右，可继续合成再往右一列）
    const NODE_W = 210,
      NODE_H = 58,
      ROW = 104;
    let depth = 0;
    let leaves = 0;
    const walk = (n: TreeNode, d: number): number => {
      depth = Math.max(depth, d);
      if (!n.children.length) return (n.y = leaves++);
      const ys = n.children.map((c) => walk(c, d + 1));
      return (n.y = (ys[0] + ys[ys.length - 1]) / 2);
    };
    walk(root, 0);
    const cols = depth + 1 + (next.length ? 1 : 0);
    const treeTop = y + 46;
    const treeH = h - 46 - 150; // 底部留给「缺少的材料」与合成按钮
    const rows = Math.max(leaves, next.length, 1);
    const rowH = Math.min(ROW, treeH / rows);
    const colW = Math.min(290, (w - 40) / cols);
    const left = x + (w - colW * cols) / 2 + (colW - NODE_W) / 2;
    // 整棵树在可用区域里竖向居中（最后一行下面还有一排道具图标，要算进去）
    const top0 = treeTop + Math.max(0, (treeH - (rows - 1) * rowH - NODE_H - 34) / 2);
    const place = (n: TreeNode, d: number) => {
      n.x = left + (depth - d) * colW;
      n.y = top0 + n.y * rowH;
      n.children.forEach((c) => place(c, d + 1));
    };
    place(root, 0);

    // 标题：产物 + 类型 + 标签
    const d = WEAPON_MAP[r.to];
    L.add(
      text(
        this,
        x + 16,
        y + 12,
        `${this.favored(r) ? '★ ' : ''}${d.name} ${TIER_NAMES[3]} · ${kname(r.kind)} · ${weaponDmgType(d).name} · ${weaponTags(d)
          .map((t) => `${TAG_MAP[t]?.icon ?? ''}${tagName(t)}`)
          .join(' ')}`,
        16,
        KIND_COLOR[r.kind],
      ),
    );

    const g = this.add.graphics();
    L.add(g);
    // 连线：子节点右边 → 父节点左边（直角折线）；已持有的材料用绿色
    const link = (a: TreeNode, b: TreeNode) => {
      const x1 = a.x + NODE_W,
        y1 = a.y + NODE_H / 2,
        x2 = b.x,
        y2 = b.y + NODE_H / 2;
      const mx = (x1 + x2) / 2;
      g.lineStyle(3, a.owned || this.complete(a) ? 0x52ff8a : 0x6c5a5a, 1);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(mx, y1);
      g.lineTo(mx, y2);
      g.lineTo(x2, y2);
      g.strokePath();
    };
    const all: TreeNode[] = [];
    const collect = (n: TreeNode) => {
      all.push(n);
      n.children.forEach((c) => {
        link(c, n);
        collect(c);
      });
    };
    collect(root);
    for (const n of all) this.drawNode(n, n === root, NODE_W, NODE_H);

    // 可继续合成（根是 T4 时：用它当主材料的超武）——虚线，点击切换过去
    if (next.length) {
      const nx = root.x + colW;
      next.forEach((nr, i) => {
        const ny = root.y + (i - (next.length - 1) / 2) * Math.min(rowH, 74);
        const x1 = root.x + NODE_W,
          y1 = root.y + NODE_H / 2;
        g.lineStyle(2, 0xffd166, 0.7);
        for (let t = 0; t < 1; t += 0.12) {
          const a = Phaser.Math.Linear(x1, nx, t),
            b = Phaser.Math.Linear(y1, ny + NODE_H / 2, t);
          const a2 = Phaser.Math.Linear(x1, nx, t + 0.06),
            b2 = Phaser.Math.Linear(y1, ny + NODE_H / 2, t + 0.06);
          g.lineBetween(a, b, a2, b2);
        }
        const nd = WEAPON_MAP[nr.to];
        L.add(panel(this, nx, ny, NODE_W, NODE_H, COLORS.panelLight, 0xffd166));
        L.add(fitImage(this.add.image(nx + 26, ny + NODE_H / 2, iconKey(this, nd.id)), 38));
        L.add(text(this, nx + 50, ny + 8, nd.name, 14, '#ffd166'));
        L.add(text(this, nx + 50, ny + 28, tx('可继续合成 ▶', 'Crafts into ▶'), 12, COLORS.textDim));
        L.add(
          hitArea(this, nx, ny, NODE_W, NODE_H, () => {
            this.selected = nr;
            this.draw();
          }),
        );
      });
      L.add(
        text(
          this,
          nx + NODE_W / 2,
          root.y - ((next.length - 1) / 2) * Math.min(rowH, 74) - 24,
          tx('可继续合成', 'Next'),
          13,
          '#ffd166',
        ).setOrigin(0.5, 0),
      );
    }

    this.drawMissing(r, root, x, y + h - 144, w);
  }

  /** 这个节点（含它的子树）是否已经齐了：持有，或者配方材料与道具全部齐全 */
  private complete(n: TreeNode): boolean {
    if (n.owned) return true;
    if (!n.recipe) return false;
    return n.children.every((c) => this.complete(c)) && n.items.every(Boolean);
  }

  private drawNode(n: TreeNode, isRoot: boolean, NW: number, NH: number): void {
    const L = this.layer;
    const d = WEAPON_MAP[n.id];
    const ok = this.complete(n);
    const border = isRoot ? (ok ? 0x52ff8a : COLORS.gold) : n.owned ? 0x52ff8a : ok ? 0xffd166 : 0x8a4a4a;
    L.add(panel(this, n.x, n.y, NW, NH, isRoot ? COLORS.panelLight : COLORS.panel, border));
    const icon = fitImage(this.add.image(n.x + 28, n.y + NH / 2, iconKey(this, n.id)), 42);
    if (!n.owned && !ok) icon.setAlpha(0.55);
    L.add(icon);
    L.add(text(this, n.x + 56, n.y + 8, d.name, 15, RARITY[n.tier].css));
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
    L.add(text(this, n.x + 56, n.y + 31, status, 12, n.owned ? '#52ff8a' : ok ? '#ffd166' : '#ff9f9f'));
    // 这个节点的配方道具：每件一行「图标 + 名字 + ✓/✗」（都是指定的 T3 道具，名字要看得到）
    if (n.recipe) {
      n.recipe.items.forEach((slot, i) => {
        const id = n.items[i] ?? slot[0];
        const have = !!n.items[i];
        const it = ITEM_MAP[id];
        const iy = n.y + NH + 14 + i * 24;
        const im = fitImage(this.add.image(n.x + 16, iy, itemIconKey(this, it)), 22);
        if (!have) im.setAlpha(0.45);
        L.add(im);
        L.add(text(this, n.x + 32, iy, `${it.name}`, 13, have ? RARITY[it.rarity].css : '#c9a9a6').setOrigin(0, 0.5));
        L.add(text(this, n.x + NW - 6, iy, have ? '✓' : '✗', 14, have ? '#52ff8a' : '#ff6b6b').setOrigin(1, 0.5));
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
    let ty = y + 10;
    if (d.superBuff) {
      L.add(
        text(this, x + 16, ty, `⚡ ${superBuffText(d.superBuff)[lang === 'en' ? 1 : 0]}`, 12, '#ffd166', {
          wordWrap: { width: w - 32, useAdvancedWrap: true },
        }),
      );
      ty += 32;
    }
    const sep = tx('、', ', ');
    if (!missW.length && !missI.length) L.add(text(this, x + 16, ty, tx('✓ 材料齐全', '✓ All materials ready'), 15, '#52ff8a'));
    else {
      if (missW.length)
        L.add(
          text(this, x + 16, ty, tx('缺武器：', 'Missing weapons: ') + missW.join(sep), 14, '#ff9f9f', {
            wordWrap: { width: w - 32, useAdvancedWrap: true },
          }),
        );
      if (missI.length)
        L.add(
          text(this, x + 16, ty + 22, tx('缺道具：', 'Missing items: ') + missI.join(sep), 14, '#ff9f9f', {
            wordWrap: { width: w - 32, useAdvancedWrap: true },
          }),
        );
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
