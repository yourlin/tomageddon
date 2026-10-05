// 商店：购买武器/道具、合成、出售、刷新、锁定
import { tip } from '../systems/Tutorial';
import { pickOf } from '../systems/Rng';
import { EVOLUTION_OF, EVOLUTIONS } from '../data/evolutions';
import { treeTotals } from '../systems/TalentTree';
import { bump, bumpMax } from '../systems/Counters';
import Phaser from 'phaser';
import { describeItem } from '../data/describe';
import { itemIconKey } from '../art/ItemArt';
import { run, saveRun, type ShopOffer, type OwnedWeapon } from '../systems/RunState';
import { WEAPONS, WEAPON_MAP, TIER_PRICE_MULT, TIER_NAMES, WEAPON_SETS } from '../data/weapons';
import { isFavoredWeapon, affinityText } from '../data/affinity';
import { ALL_ITEMS, ITEM_MAP } from '../data/items';
import { STAT_ORDER, STAT_INFO } from '../data/stats';
import {
  BALANCE,
  RARITY,
  pickRarity,
  rerollPrice,
  pickWeaponTier,
  shopPrice,
  sellPrice,
  isBossWaveFor,
  isEliteWaveFor,
  regenPerSecond,
  lifeStealMaxPerSecond,
} from '../data/balance';
import { weaponDamage, weaponCooldown, weaponRange } from '../systems/WeaponSystem';
import { text, button, panel, COLORS, fitImage, hitArea, toast, autoRelayout } from '../ui/UI';
import { audio } from '../systems/Audio';
import { markSeen, persist } from '../systems/Save';
import { tx, lang } from '../i18n';
import { GameScene } from './GameScene';
import { rollRelics, grantRelic } from '../systems/Relics';
import { RELIC_MAP, RELIC_KIND_INFO, describeRelic, describeRule } from '../data/relics';
import { routeChoiceAvailable, HARD_ROUTE_RULE } from '../systems/RunEvents';
import { mechanicOpen, merchantKinds, MERCHANT_MIN_WAVE, MERCHANT_CHANCE } from '../systems/Mechanics';
import { ITEM_COMBOS, describeCombo } from '../data/gearExtra';
import { tagName } from '../i18n/apply';
import { checkAchievements, setInRun } from '../systems/Achievements';
import { freeFirstReroll } from '../systems/Talents';
import {
  affixSlots,
  affixText,
  AFFIX_TIER_COLOR,
  rerollAll,
  rerollOne,
  rerollAllCost,
  rerollOneCost,
  forge,
  forgeCost,
  forgeChance,
  canForge,
} from '../systems/WeaponMods';

/** 商店标价：completedWave 为刚打完的波次（商店卖的是下一波的价格），计入折扣与挑战修饰 */
export function offerPrice(base: number, completedWave = run.wave): number {
  return Math.max(
    1,
    Math.round(
      shopPrice(base, completedWave + 1) * (1 - run.specials.shopDiscount / 100) * (run.mod('rich_start') ? 1.25 : 1) * run.rules.shopPrice,
    ),
  );
}
/** 道具基础价随波次上浮（前 8 波逐步 +30%），再交给 offerPrice */
export const itemBasePrice = (price: number, completedWave = run.wave): number => price * (1 + 0.3 * Math.min(1, completedWave / 8));

export class ShopScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private popup: Phaser.GameObjects.Container | null = null;
  /** 右侧面板当前页签 */
  private sideTab: 'stats' | 'char' = 'stats';
  /** 当前弹窗的选项（供自动化测试读取；空 = 没有弹窗） */
  modalChoices: { label: string; enabled: boolean; pick: () => void }[] = [];

  constructor() {
    super('Shop');
  }

  create(data?: { keep?: boolean }): void {
    setInRun(true);
    autoRelayout(this, { keep: true });
    this.cameras.main.setBackgroundColor(COLORS.bg);
    audio.playMusic(this, 'bgm_shop');
    if (!data?.keep) {
      run.rerolls = 0;
      this.rollShop(true);
    } else if (!this.shelfValid()) {
      // 读档「继续游戏」或场景重建时沿用存档里的货架；若货架是上一波的（已被标记售罄）
      // 或本局还没生成过货架（第 1 波存档时为空），必须重新进货，否则会出现空商店
      run.rerolls = 0;
      this.rollShop(true);
    }
    saveRun();
    this.layer = this.add.container(0, 0);
    this.draw();
    // 新手引导：商店基础 → 合成 → 词条与打造 → 进化
    tip('shop', this);
    if (run.weapons.some((a) => run.weapons.some((b) => b.uid !== a.uid && b.id === a.id && b.tier === a.tier && a.tier < 3)))
      tip('combine', this);
    if (run.weapons.some((w) => w.tier >= 2)) tip('affix', this);
    if (run.weapons.some((w) => run.canEvolve(w))) tip('evolve', this);
    this.maybeMerchant();
    if (run.merchant && !run.merchant.done) tip('merchant', this);
  }

  /** H2：第 4 章起、本章第 6 波后每次商店 18% 概率出现神秘商人（见 Mechanics.ts） */
  private maybeMerchant(): void {
    if (GameScene.sandbox) return;
    if (!run.merchant || run.merchant.wave !== run.wave) {
      run.merchant = null;
      const R = run.rand(`merchant:${run.wave}`);
      if (mechanicOpen('merchant') && run.wave >= MERCHANT_MIN_WAVE && R() < MERCHANT_CHANCE) {
        const r = rollRelics(1, R, merchantKinds())[0];
        if (r) run.merchant = { wave: run.wave, relic: r.id, price: Math.round(offerPrice(28 + run.wave * 6)), done: false };
      }
    }
    const m = run.merchant;
    if (!m || m.done) return;
    const r = RELIC_MAP[m.relic];
    const zh = lang === 'zh';
    const lines = [
      `${r.icon} ${r.name[zh ? 0 : 1]}  ·  ${RELIC_KIND_INFO[r.kind].name[zh ? 0 : 1]}`,
      ...describeRelic(r, (id) => WEAPON_MAP[id]?.name ?? id),
    ];
    this.modal(tx('🧙 神秘商人出现了', '🧙 A Mysterious Merchant appears'), lines, [
      {
        label: tx(`买下 🌱${m.price}`, `Buy 🌱${m.price}`),
        color: COLORS.green,
        enabled: run.seeds >= m.price,
        onClick: () => {
          run.seeds -= m.price;
          m.done = true;
          grantRelic(m.relic);
          bump('merchantBuys');
          audio.play(this, 'buy');
          this.draw();
        },
      },
      {
        label: tx('离开', 'Leave'),
        color: 0x555555,
        onClick: () => {
          m.done = true;
          saveRun();
        },
      },
    ]);
  }

  /** 居中弹窗：标题 + 文字 + 一排按钮（点任一按钮关闭） */
  private modal(title: string, lines: string[], btns: { label: string; color: number; enabled?: boolean; onClick: () => void }[]): void {
    const W = this.scale.width,
      H = this.scale.height;
    const c = this.add.container(0, 0).setDepth(200);
    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive());
    const pw = Math.min(560, W - 40),
      ph = 300;
    const x = (W - pw) / 2,
      y = (H - ph) / 2;
    c.add(panel(this, x, y, pw, ph, COLORS.panelLight, COLORS.gold));
    c.add(text(this, W / 2, y + 36, title, 28, '#ffd166').setOrigin(0.5));
    c.add(text(this, W / 2, y + 70, lines.join('\n'), 18, '#fff4ea', { align: 'center', wordWrap: { width: pw - 40 } }).setOrigin(0.5, 0));
    const bw = Math.min(220, (pw - 40) / btns.length - 16);
    this.modalChoices = [];
    btns.forEach((b, i) => {
      const bx = W / 2 + (i - (btns.length - 1) / 2) * (bw + 16);
      const pick = () => {
        this.modalChoices = [];
        c.destroy();
        b.onClick();
      };
      this.modalChoices.push({ label: b.label, enabled: b.enabled ?? true, pick });
      c.add(button(this, bx, y + ph - 44, bw, 54, b.label, pick, b.color, 18).setEnabled(b.enabled ?? true));
    });
  }

  private price(base: number): number {
    return offerPrice(base);
  }

  /** 货架是否可用：为当前波次生成，且至少还有一件没卖出（全部买光时 buy() 会立即免费补货） */
  private shelfValid(): boolean {
    return run.shopWave === run.wave && run.shop.length > 0 && run.shop.some((o) => !o.sold);
  }

  private rollShop(keepLocked: boolean): void {
    // 锁定保留的道具若已达持有上限（比如在别处拿到了同款），刷新时一并移除
    const kept = keepLocked ? run.shop.filter((o) => o.locked && !o.sold && (o.kind !== 'item' || run.canTakeItem(o.id))) : [];
    // 挑战模式：按「波次 + 第几次刷新」取固定的随机序列
    if (run.shopRollWave !== run.wave) {
      run.shopRollWave = run.wave;
      run.shopRollNo = 0;
    }
    const R = run.rand(`shop:${run.wave}:${run.shopRollNo++}`);
    // 挑战修饰：只出某一类武器
    const onlyCls = run.mod('melee_only') ? 'melee' : run.mod('ranged_only') ? 'ranged' : run.mod('elemental_only') ? 'elemental' : null;
    const weaponPool = onlyCls ? WEAPONS.filter((w) => w.cls === onlyCls) : WEAPONS;
    const offers: ShopOffer[] = [...kept];
    const luck = run.stats.luck; // 武器品质 / 道具稀有度只看幸运，与波次无关
    // 进化催化剂：持有可进化的 T3+ 武器但还没有对应道具时，20% 概率直接上架
    const need = EVOLUTIONS.filter(
      (e) => !run.items[e.item] && run.weapons.some((w) => w.id === e.from && w.tier >= 2) && !offers.some((o) => o.id === e.item),
    );
    if (need.length && offers.length < BALANCE.shopSlots && R() < 0.2) {
      const it = ITEM_MAP[pickOf(need, R).item];
      offers.push({
        kind: 'item',
        id: it.id,
        tier: it.rarity,
        price: this.price(itemBasePrice(it.price)),
        locked: false,
        sold: false,
      });
    }
    while (offers.length < BALANCE.shopSlots) {
      const wantWeapon = R() < (run.weapons.length < run.maxWeapons ? 0.4 : 0.25);
      if (wantWeapon) {
        // 约 3 倍权重出现角色的契合武器
        let def = R() < 0.18 ? WEAPON_MAP[pickOf(run.char.favored, R)] : pickOf(weaponPool, R);
        if (run.weapons.length && R() < 0.25) def = WEAPON_MAP[pickOf(run.weapons, R).id];
        // 超武不进商店：抽到时改为原武器
        if (def.evolvedFrom) def = WEAPON_MAP[def.evolvedFrom];
        if (onlyCls && def.cls !== onlyCls) def = pickOf(weaponPool, R);
        const tier = Math.max(def.minTier ?? 0, pickWeaponTier(luck, run.chapter.t4Mult, R));
        offers.push({ kind: 'weapon', id: def.id, tier, price: this.price(def.price * TIER_PRICE_MULT[tier]), locked: false, sold: false });
      } else {
        const rar = pickRarity(luck, R);
        // 已持有 + 本货架已上架（未售出）的数量达到上限的道具不再刷出
        const onShelf = (id: string) => offers.filter((o) => o.kind === 'item' && o.id === id && !o.sold).length;
        const pool = ALL_ITEMS.filter((i) => i.rarity === rar && (run.items[i.id] ?? 0) + onShelf(i.id) < run.itemCap(i.id));
        if (!pool.length) continue;
        const it = pickOf(pool, R);
        offers.push({
          kind: 'item',
          id: it.id,
          tier: it.rarity,
          price: this.price(itemBasePrice(it.price)),
          locked: false,
          sold: false,
        });
      }
    }
    run.shop = offers;
    run.shopWave = run.wave;
    for (const o of offers) markSeen(o.kind === 'weapon' ? 'weapons' : 'items', o.id);
    persist();
  }

  private draw(): void {
    // 每次操作（购买、出售、刷新、锁定、合成、打造）后都会重绘：顺便写盘，
    // 保证「继续游戏」恢复的是当前货架与持有物，而不是进店时的快照
    saveRun();
    checkAchievements();
    const W = this.scale.width,
      H = this.scale.height;
    const L = this.layer;
    L.removeAll(true);
    this.popup?.destroy();
    this.popup = null;

    L.add(text(this, 24, 18, tx('商店', 'Shop'), 36));
    L.add(
      text(
        this,
        130,
        30,
        tx(`第 ${run.wave} 波完成 · 即将进入第 ${run.wave + 1} 波`, `Wave ${run.wave} complete · next: wave ${run.wave + 1}`) +
          (isBossWaveFor(run.chapterId, run.wave + 1, run.endless)
            ? tx('（BOSS）', ' (BOSS)')
            : isEliteWaveFor(run.chapterId, run.wave + 1, run.endless)
              ? tx('（精英）', ' (Elite)')
              : ''),
        20,
        COLORS.textDim,
      ),
    );
    L.add(this.add.image(W * 0.52, 40, 'ui_seed_icon').setScale(1.3));
    L.add(text(this, W * 0.52 + 22, 40, String(run.seeds), 32, '#ffe066').setOrigin(0, 0.5));

    // 商品
    const leftW = W * 0.7 - 30;
    const cw = (leftW - 3 * 14) / 4,
      ch = 300,
      cy = 76;
    run.shop.forEach((o, i) => {
      const x = 20 + i * (cw + 14);
      if (o.sold) {
        L.add(panel(this, x, cy, cw, ch, 0x1f0d10, 0x3d1d22));
        return;
      }
      const rc = RARITY[o.tier];
      L.add(panel(this, x, cy, cw, ch, COLORS.panel, o.locked ? COLORS.gold : rc.color));
      let name: string, lines: string[], icon: string;
      if (o.kind === 'weapon') {
        const d = WEAPON_MAP[o.id];
        name = `${d.name} ${TIER_NAMES[o.tier]}`;
        icon = this.textures.exists(`icon_weapon_${d.id}`) ? `icon_weapon_${d.id}` : `weapon_${d.id}`;
        const s = run.stats;
        lines = [
          tx(
            `伤害 ${Math.round(weaponDamage(d, o.tier, s))}  冷却 ${weaponCooldown(d, o.tier, s).toFixed(2)}s`,
            `DMG ${Math.round(weaponDamage(d, o.tier, s))}  CD ${weaponCooldown(d, o.tier, s).toFixed(2)}s`,
          ),
          tx(
            `射程 ${Math.round(weaponRange(d, s))}  [${d.tags.join('/')}]`,
            `Range ${Math.round(weaponRange(d, s))}  [${d.tags.map(tagName).join('/')}]`,
          ),
          d.desc,
        ];
        if (isFavoredWeapon(run.char.favored, d))
          lines.unshift(tx('★ 契合武器 · 伤害 +10%：', '★ Synergy · +10% damage: ') + affinityText(run.charId));
        const ev = EVOLUTION_OF[d.id];
        if (ev) lines.push(tx(`✨ T4 + ${ITEM_MAP[ev.item].name} 可进化`, `✨ T4 + ${ITEM_MAP[ev.item].name} evolves`));
        if (affixSlots(o.tier))
          lines.push(tx(`★ 购买后随机 ${affixSlots(o.tier)} 条词条`, `★ Rolls ${affixSlots(o.tier)} random affix(es)`));
      } else {
        const it = ITEM_MAP[o.id];
        name = it.name;
        icon = itemIconKey(this, it);
        lines = describeItem(it);
        // G7：与这件道具有关的组合（已持有另一件时标 ✓）
        for (const c of ITEM_COMBOS.filter((x) => x.item === it.id || x.needs === it.id)) {
          const other = c.item === it.id ? c.needs : c.item;
          const [zh, en] = describeCombo(c, (id) => ITEM_MAP[id]?.name ?? id);
          lines.push(`${(run.items[other] ?? 0) > 0 ? '✓ ' : '⚭ '}${tx(zh, en)}`);
        }
        // 进化催化剂：持有对应武器时提示
        const evoFor = EVOLUTIONS.filter((e) => e.item === it.id && run.weapons.some((w) => w.id === e.from));
        if (evoFor.length)
          lines.unshift(
            tx(
              `✨ 可让${evoFor.map((e) => WEAPON_MAP[e.from].name).join('、')}进化`,
              `✨ Evolves ${evoFor.map((e) => WEAPON_MAP[e.from].name).join(', ')}`,
            ),
          );
      }
      L.add(fitImage(this.add.image(x + cw / 2, cy + 55, icon), 76));
      L.add(text(this, x + cw / 2, cy + 106, name, 20, rc.css).setOrigin(0.5));
      L.add(
        text(this, x + cw / 2, cy + 126, o.kind === 'weapon' ? tx('武器', 'Weapon') : tx('道具', 'Item'), 13, COLORS.textDim).setOrigin(
          0.5,
        ),
      );
      L.add(text(this, x + 10, cy + 144, lines.join('\n'), 14, '#fff4ea', { wordWrap: { width: cw - 20 }, lineSpacing: 2 }));
      const can = run.seeds >= o.price && (o.kind === 'item' || run.canAddWeapon(o.id, o.tier));
      L.add(button(this, x + cw / 2 - 22, cy + ch - 30, cw - 64, 44, `🌱 ${o.price}`, () => this.buy(o), COLORS.green, 20).setEnabled(can));
      L.add(
        button(
          this,
          x + cw - 24,
          cy + ch - 30,
          40,
          44,
          o.locked ? '🔒' : '🔓',
          () => {
            o.locked = !o.locked;
            this.draw();
          },
          0x7a2e35,
          18,
        ),
      );
    });

    // 武器栏
    const wy = cy + ch + 18;
    L.add(
      text(
        this,
        20,
        wy,
        tx(
          `武器（${run.weapons.length}/${run.maxWeapons}）· 点击合成/出售`,
          `Weapons (${run.weapons.length}/${run.maxWeapons}) · click to combine/sell`,
        ),
        18,
        '#ffb347',
      ),
    );
    const ws = 62;
    run.weapons.forEach((w, i) => {
      const x = 20 + i * (ws + 8),
        y = wy + 28;
      const rc = RARITY[w.tier];
      const g = this.add.graphics();
      g.fillStyle(COLORS.panel, 1).fillRoundedRect(x, y, ws, ws, 10).lineStyle(3, rc.color, 1).strokeRoundedRect(x, y, ws, ws, 10);
      L.add(g);
      const d = WEAPON_MAP[w.id];
      L.add(
        fitImage(
          this.add.image(x + ws / 2, y + ws / 2, this.textures.exists(`icon_weapon_${d.id}`) ? `icon_weapon_${d.id}` : `weapon_${d.id}`),
          ws - 12,
        ),
      );
      L.add(text(this, x + ws - 6, y + ws - 4, TIER_NAMES[w.tier], 13, rc.css).setOrigin(1, 1));
      if (w.forge) L.add(text(this, x + 6, y + 4, `+${w.forge}`, 14, '#ffd166', { stroke: '#000000', strokeThickness: 3 }));
      // 可进化：闪烁的 ✨ 角标；已是超武：金色描边
      if (run.canEvolve(w)) {
        const sp = text(this, x + ws - 4, y - 6, '✨', 20).setOrigin(0.5);
        this.tweens.add({ targets: sp, scale: 1.3, duration: 500, yoyo: true, repeat: -1 });
        L.add(sp);
      } else if (d.evolvedFrom)
        L.add(
          this.add
            .graphics()
            .lineStyle(2, 0xffd166, 1)
            .strokeRoundedRect(x - 3, y - 3, ws + 6, ws + 6, 12),
        );
      L.add(hitArea(this, x, y, ws, ws, () => this.weaponPopup(w, x, y)));
    });

    // 套装
    const sets = Object.entries(run.setCounts()).filter(([t, n]) => n >= 2 && WEAPON_SETS[t]);
    if (sets.length)
      L.add(text(this, 20, wy + 100, tx('套装：', 'Sets: ') + sets.map(([t, n]) => `${tagName(t)}×${n}`).join('  '), 15, '#9be564'));

    // 道具
    const iy = wy + 124;
    L.add(text(this, 20, iy, tx('道具', 'Items'), 18, '#ffb347'));
    const is = 44;
    Object.entries(run.items).forEach(([id, n], i) => {
      const perRow = Math.floor(leftW / (is + 6));
      const x = 20 + (i % perRow) * (is + 6),
        y = iy + 26 + Math.floor(i / perRow) * (is + 6);
      if (y + is > H - 6) return;
      L.add(fitImage(this.add.image(x + is / 2, y + is / 2, itemIconKey(this, ITEM_MAP[id])), is));
      if (n > 1) L.add(text(this, x + is, y + is, `x${n}`, 13).setOrigin(1, 1));
      L.add(
        hitArea(this, x, y, is, is, () => {
          const it = ITEM_MAP[id];
          toast(this, `${it.name}：${describeItem(it).join('，')}`, RARITY[it.rarity].css);
        }),
      );
    });

    // 属性面板
    const sx = W * 0.7,
      sw = W - sx - 16;
    L.add(panel(this, sx, 76, sw, H - 180));
    // 右侧面板分两页：属性 / 角色（契合武器 + 天赋），选中的页签在本次商店内保持
    const tabW = (sw - 40) / 2;
    (['stats', 'char'] as const).forEach((tab, i) => {
      const on = this.sideTab === tab;
      L.add(
        button(
          this,
          sx + 16 + tabW / 2 + i * (tabW + 8),
          100,
          tabW,
          34,
          tab === 'stats' ? tx('属性', 'Stats') : tx('角色', 'Character'),
          () => {
            if (this.sideTab === tab) return;
            this.sideTab = tab;
            this.draw();
          },
          on ? COLORS.primary : 0x4a2228,
          18,
        ),
      );
    });
    if (this.sideTab === 'char') this.drawCharPanel(sx, 128, sw, H - 112);
    else this.drawStatsPanel(sx, sw, H);

    this.drawBottomButtons(sx, sw, H);
  }

  /** 角色页：契合武器（标出已持有）、契合特效、天赋与特性 */
  private drawCharPanel(sx: number, top: number, sw: number, bottom: number): void {
    const L = this.layer;
    const c = run.char;
    const ww = sw - 32;
    let y = top;
    const add = (str: string, size: number, color: string, gap = 4): void => {
      if (y > bottom - size) return;
      const t = text(this, sx + 16, y, str, size, color, { wordWrap: { width: ww, useAdvancedWrap: true }, lineSpacing: 2 });
      L.add(t);
      y += t.height + gap;
    };
    add(`${c.name} · ${c.title}`, 18, '#ffd166', 8);
    add(tx('★ 契合武器', '★ Synergy weapons'), 16, '#ffb347', 6);
    const iconS = 34;
    for (const fid of c.favored) {
      const d = WEAPON_MAP[fid];
      if (!d) continue;
      const owned = run.weapons.filter((w) => isFavoredWeapon([fid], WEAPON_MAP[w.id])).length;
      const key = this.textures.exists(`icon_weapon_${d.id}`) ? `icon_weapon_${d.id}` : `weapon_${d.id}`;
      L.add(fitImage(this.add.image(sx + 16 + iconS / 2, y + iconS / 2, key), iconS));
      L.add(text(this, sx + 24 + iconS, y + iconS / 2, d.name, 15, '#fff4ea').setOrigin(0, 0.5));
      if (owned)
        L.add(
          text(
            this,
            sx + sw - 16,
            y + iconS / 2,
            tx(`✓ 已持有${owned > 1 ? ` ×${owned}` : ''}`, `✓ Owned${owned > 1 ? ` ×${owned}` : ''}`),
            13,
            '#52ff8a',
          ).setOrigin(1, 0.5),
        );
      y += iconS + 4;
    }
    y += 4;
    add(tx('契合特效（伤害 +10%）', 'Synergy effect (+10% dmg)'), 15, '#ffb347', 2);
    add(affinityText(c.id), 14, '#ffe8a3', 10);
    add(tx(`天赋 · ${c.talent.name}`, `Talent · ${c.talent.name}`), 15, '#ffb347', 2);
    add(c.talent.desc, 14, '#fff4ea', 10);
    if (c.traits.length) {
      add(tx('特性', 'Traits'), 15, '#ffb347', 2);
      for (const tr of c.traits) add(`· ${tr}`, 13, COLORS.textDim, 2);
    }
  }

  private drawStatsPanel(sx: number, sw: number, H: number): void {
    const L = this.layer;
    const s = run.stats;
    const lineH = Math.min(26, (H - 272) / STAT_ORDER.length);
    const fs = Math.max(12, Math.min(16, Math.floor(lineH)));
    STAT_ORDER.forEach((k, i) => {
      const cap = run.statCap(k);
      const v = Math.min(s[k], cap);
      const info = STAT_INFO[k];
      const y = 128 + i * lineH;
      L.add(text(this, sx + 16, y, info.name, fs, info.color));
      const col = v > 0 ? '#52ff8a' : v < 0 ? '#ff6b6b' : '#fff4ea';
      L.add(
        text(
          this,
          sx + sw - 16,
          y,
          `${Math.round(v * 10) / 10}${info.pct ? '%' : ''}${k === 'regen' ? tx(`(${regenPerSecond(v).toFixed(2)}/秒)`, ` (${regenPerSecond(v).toFixed(2)}/s)`) : ''}${k === 'lifeSteal' && v > 0 ? tx(`(≤${lifeStealMaxPerSecond(s.maxHp)}/秒)`, ` (≤${lifeStealMaxPerSecond(s.maxHp)}/s)`) : ''}${s[k] >= cap ? tx('(上限)', ' cap') : ''}`,
          fs,
          col,
        ).setOrigin(1, 0),
      );
    });
  }

  private drawBottomButtons(sx: number, sw: number, H: number): void {
    const L = this.layer;
    // 底部按钮
    const rp = this.rerollCost();
    const left = run.maxRerolls - run.rerolls,
      canReroll = left > 0;
    L.add(
      button(
        this,
        sx + sw / 2,
        H - 82,
        sw,
        50,
        canReroll ? tx(`刷新 🌱${rp}（剩 ${left} 次）`, `Reroll 🌱${rp} (${left} left)`) : tx('本波刷新次数已用完', 'No rerolls left'),
        () => {
          if (run.seeds < rp || !canReroll) return;
          run.seeds -= rp;
          run.rerolls++;
          bump('shopRerolls');
          this.rollShop(true);
          audio.play(this, 'buy');
          this.draw();
        },
        0x7a2e35,
        20,
      ).setEnabled(canReroll && run.seeds >= rp),
    );
    L.add(button(this, sx + sw / 2, H - 30, sw, 52, tx('下一波 ▶', 'Next Wave ▶'), () => this.nextWave(), COLORS.primary, 24));
  }

  private buy(o: ShopOffer): void {
    if (run.seeds < o.price) return;
    if (o.kind === 'weapon') {
      if (!run.canAddWeapon(o.id, o.tier)) {
        toast(this, tx('武器栏已满', 'Weapon slots full'));
        return;
      }
      run.addWeapon(o.id, o.tier);
      bump('weaponsBought');
    } else {
      if (!run.canTakeItem(o.id)) {
        toast(this, tx(`已达持有上限（${run.itemCap(o.id)} 件）`, `Holding limit reached (${run.itemCap(o.id)})`));
        return;
      }
      run.addItem(o.id);
      bump('itemsBought');
      bump(`rarityBought:${o.tier}`);
    }
    run.seeds -= o.price;
    o.sold = true;
    o.locked = false;
    audio.play(this, 'buy');
    // 全部买光：免费补货（不计入刷新次数）
    if (run.shop.every((x) => x.sold)) {
      this.rollShop(true);
      toast(this, tx('商品已售罄，免费补货！', 'Sold out — free restock!'), '#52ff8a');
    }
    this.draw();
  }

  /** 刷新价格：随章节与波次上涨；当前货架每买走一件，价格 ×0.75 */
  private rerollCost(): number {
    const free =
      (freeFirstReroll(run.charId) ? 1 : 0) + treeTotals().freeRerolls + (run.mod('one_reroll') ? 1 : 0) + run.relicFx.flags.freeRerolls;
    if (run.rerolls < free) return 0;
    const bought = run.shop.filter((x) => x.sold).length;
    return Math.max(1, Math.round(rerollPrice(run.wave, run.rerolls, run.chapterId) * Math.pow(0.75, bought) * run.rules.rerollPrice));
  }

  private weaponPopup(w: OwnedWeapon, x: number, y: number): void {
    this.popup?.destroy();
    const d = WEAPON_MAP[w.id];
    const evo = EVOLUTION_OF[w.id];
    const PW = 340,
      PH = evo ? 366 : 312;
    const c = this.add.container(Math.min(x, this.scale.width * 0.7 - PW - 10), Math.max(10, y - PH - 10));
    // 点击弹窗以外的区域关闭弹窗：全屏透明底层（最先加入，位于按钮之下）；弹窗面板本身吸收点击
    const close = () => {
      c.destroy();
      if (this.popup === c) this.popup = null;
    };
    const backdrop = this.add.rectangle(-c.x, -c.y, this.scale.width, this.scale.height, 0x000000, 0.001).setOrigin(0, 0).setInteractive();
    backdrop.on('pointerdown', close);
    c.add(backdrop);
    c.add(this.add.rectangle(0, 0, PW, PH, 0x000000, 0.001).setOrigin(0, 0).setInteractive());
    const g = this.add.graphics();
    g.fillStyle(COLORS.panelLight, 0.98)
      .fillRoundedRect(0, 0, PW, PH, 12)
      .lineStyle(3, RARITY[w.tier].color, 1)
      .strokeRoundedRect(0, 0, PW, PH, 12);
    c.add(g);
    const s = run.stats;
    const redraw = () => {
      this.draw();
      this.weaponPopup(w, x, y);
    };
    const forgeLv = w.forge ?? 0;
    c.add(text(this, 14, 10, `${d.name} ${TIER_NAMES[w.tier]}${forgeLv ? ` +${forgeLv}` : ''}`, 20, RARITY[w.tier].css));
    c.add(
      text(
        this,
        14,
        40,
        tx(
          `伤害 ${Math.round(weaponDamage(d, w.tier, s, w))} · 冷却 ${weaponCooldown(d, w.tier, s, w).toFixed(2)}s · 射程 ${Math.round(weaponRange(d, s, w))}`,
          `DMG ${Math.round(weaponDamage(d, w.tier, s, w))} · CD ${weaponCooldown(d, w.tier, s, w).toFixed(2)}s · Range ${Math.round(weaponRange(d, s, w))}`,
        ),
        14,
        '#fff4ea',
      ),
    );
    c.add(text(this, 14, 62, d.desc, 13, COLORS.textDim, { wordWrap: { width: PW - 28, useAdvancedWrap: true } }));
    // 词条（T3 / T4）：逐条显示，可单独洗练
    const affixes = w.affixes ?? [];
    const one = rerollOneCost(run.wave);
    if (!affixes.length)
      c.add(text(this, 14, 110, tx('T3 / T4 武器会获得随机词条', 'T3 / T4 weapons roll random affixes'), 14, COLORS.textDim));
    affixes.forEach((a, i) => {
      const ay = 106 + i * 34;
      c.add(text(this, 14, ay + 6, affixText(a), 16, AFFIX_TIER_COLOR[a.tier - 1]));
      c.add(
        button(
          this,
          PW - 58,
          ay + 16,
          92,
          30,
          tx(`洗 🌱${one}`, `Reroll 🌱${one}`),
          () => {
            if (run.seeds < one) return;
            run.seeds -= one;
            rerollOne(w, i, s.luck);
            bump('affixRerolls');
            run.dirty();
            audio.play(this, 'buy');
            redraw();
          },
          0x6d597a,
          13,
        ).setEnabled(run.seeds >= one),
      );
    });
    // 打造（T4）：成功率随等级下降，失败只扣费用
    if (w.tier >= 3)
      c.add(
        text(
          this,
          14,
          178,
          canForge(w)
            ? tx(
                `打造 +${forgeLv} → +${forgeLv + 1}：伤害 +8% · 成功率 ${Math.round(forgeChance(w) * 100)}%`,
                `Forge +${forgeLv} → +${forgeLv + 1}: +8% damage · ${Math.round(forgeChance(w) * 100)}% success`,
              )
            : tx('已打造至满级 +10', 'Fully forged (+10)'),
          14,
          '#ffd166',
        ),
      );
    const all = rerollAllCost(run.wave),
      fc = forgeCost(w);
    c.add(
      button(
        this,
        88,
        222,
        150,
        40,
        tx(`洗全部 🌱${all}`, `Reroll all 🌱${all}`),
        () => {
          if (run.seeds < all) return;
          run.seeds -= all;
          rerollAll(w, s.luck);
          bump('affixRerolls');
          run.dirty();
          audio.play(this, 'buy');
          redraw();
        },
        0x6d597a,
        16,
      ).setEnabled(affixes.length > 0 && run.seeds >= all),
    );
    c.add(
      button(
        this,
        PW - 88,
        222,
        150,
        40,
        tx(`打造 🌱${fc}`, `Forge 🌱${fc}`),
        () => {
          if (run.seeds < fc || !canForge(w)) return;
          run.seeds -= fc;
          const ok = forge(w);
          bump('forges');
          bump(ok ? 'forgeOk' : 'forgeFail');
          bumpMax(`forge:${w.id}`, w.forge ?? 0);
          bumpMax('forgeMax', w.forge ?? 0);
          run.dirty();
          audio.play(this, ok ? 'levelup' : 'hurt');
          toast(this, ok ? tx(`打造成功！+${w.forge}`, `Forged! +${w.forge}`) : tx('打造失败', 'Forge failed'), ok ? '#52ff8a' : '#ff6b6b');
          redraw();
        },
        0xb07d2b,
        16,
      ).setEnabled(canForge(w) && run.seeds >= fc),
    );
    const canCombine = w.tier < 3 && run.weapons.some((o) => o.uid !== w.uid && o.id === w.id && o.tier === w.tier);
    const sp = sellPrice(this.price(d.price * TIER_PRICE_MULT[w.tier]));
    c.add(
      button(
        this,
        62,
        274,
        100,
        40,
        tx('合成', 'Combine'),
        () => {
          if (run.combine(w.uid)) {
            bump('combines');
            audio.play(this, 'levelup');
            redraw();
          }
        },
        COLORS.green,
        17,
      ).setEnabled(canCombine),
    );
    c.add(
      button(
        this,
        170,
        274,
        100,
        40,
        tx(`卖 ${sp}`, `Sell ${sp}`),
        () => {
          if (run.weapons.length <= 1) {
            toast(this, tx('至少保留一把武器', 'Keep at least one weapon'));
            return;
          }
          run.removeWeapon(w.uid);
          bump('sells');
          run.seeds += sp;
          audio.play(this, 'buy');
          c.destroy();
          this.popup = null;
          this.draw();
        },
        0x7a2e35,
        17,
      ),
    );
    if (evo) {
      const itemName = ITEM_MAP[evo.item].name;
      const ok = run.canEvolve(w);
      c.add(
        button(
          this,
          PW / 2,
          PH - 30,
          PW - 24,
          42,
          ok
            ? tx(`✨ 进化为「${evo.to.name}」`, `✨ Evolve into ${evo.to.name}`)
            : tx(`✨ T4 + ${itemName} 可进化为「${evo.to.name}」`, `✨ T4 + ${itemName} evolves into ${evo.to.name}`),
          () => {
            if (!run.evolve(w.uid)) return;
            audio.play(this, 'levelup');
            this.cameras.main.flash(250, 255, 209, 102);
            toast(this, tx(`进化成功：${evo.to.name}！`, `Evolved: ${evo.to.name}!`), '#ffd166');
            redraw();
          },
          0xc77d00,
          ok ? 17 : 14,
        ).setEnabled(ok),
      );
    }
    c.add(
      button(
        this,
        278,
        274,
        100,
        40,
        tx('关闭', 'Close'),
        () => {
          c.destroy();
          this.popup = null;
        },
        0x555555,
        16,
      ),
    );
    c.setDepth(100);
    this.popup = c;
  }

  private nextWave(): void {
    if (this.modalChoices.length) return; // 已有弹窗（路线 / 商人）时忽略重复点击
    // H3：每 3 波一次路线选择（挑战模式不提供，保证同一种子同一难度）
    if (!run.challenge && !GameScene.sandbox && mechanicOpen('route') && routeChoiceAvailable(run.wave + 1)) {
      const hard = describeRule(HARD_ROUTE_RULE).join(tx('，', ', '));
      this.modal(
        tx('选择路线', 'Choose a Route'),
        [
          tx('普通路线：照常进行', 'Normal route: business as usual'),
          tx(`危险路线：${hard}，结束时额外 1 个宝箱`, `Dangerous route: ${hard}, plus 1 crate at the end`),
        ],
        [
          { label: tx('普通路线', 'Normal'), color: COLORS.primary, onClick: () => this.startNext(false) },
          { label: tx('危险路线 ☠', 'Dangerous ☠'), color: 0x9d0208, onClick: () => this.startNext(true) },
        ],
      );
      return;
    }
    this.startNext(false);
  }

  private startNext(hard: boolean): void {
    run.hardRoute = hard;
    run.wave++;
    run.shop.forEach((o) => {
      if (!o.locked) o.sold = true;
    });
    this.scene.start('Game');
  }
}
