// 商店：购买武器/道具、合成、出售、刷新、锁定
import { tip } from '../systems/Tutorial';
import { pickOf } from '../systems/Rng';
import { EVOLUTION_OF, EVOLUTIONS } from '../data/evolutions';
import { treeTotals } from '../systems/TalentTree';
import { bump, bumpMax } from '../systems/Counters';
import Phaser from 'phaser';
import { charTraitLines, describeItem, describeWeaponSets, weaponDmgType, armorText, speedText } from '../data/describe';
import { itemIconKey } from '../art/ItemArt';
import { run, saveRun, type ShopOffer, type OwnedWeapon } from '../systems/RunState';
import { WEAPONS, WEAPON_MAP, TIER_PRICE_MULT, TIER_NAMES, WEAPON_SETS, isShopWeapon, SHOP_MAX_TIER } from '../data/weapons';
import { isFavoredWeapon, affinityText, favoredWeapons } from '../data/affinity';
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
import {
  text,
  button,
  panel,
  COLORS,
  fitImage,
  hitArea,
  toast,
  autoRelayout,
  statLines,
  NEG_LINE,
  NEG_COLOR,
  tu,
  TOUCH_UI,
} from '../ui/UI';
import { audio } from '../systems/Audio';
import { markSeen, persist } from '../systems/Save';
import { tx, lang } from '../i18n';
import { GameScene } from './GameScene';
import { rollRelics, grantRelic } from '../systems/Relics';
import { RELIC_MAP, RELIC_KIND_INFO, describeRelic, describeRelicSet, describeRule, relicSetCounts } from '../data/relics';
import { routeChoiceAvailable, HARD_ROUTE_RULE } from '../systems/RunEvents';
import { mechanicOpen, merchantKinds, MERCHANT_MIN_WAVE, MERCHANT_CHANCE } from '../systems/Mechanics';
import { ITEM_COMBOS, describeCombo } from '../data/gearExtra';
import { tagName } from '../i18n/apply';
import { weaponTags, TAG_MAP } from '../data/weaponTags';
import { superBuffText } from '../systems/SuperBuffs';
import { RECIPES, RECIPE_BY_TO, wantedRecipeItems } from '../data/recipes';
import { FORGE } from '../data/weaponAffixes';

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
import { VW, VH } from '../systems/HiDpi';
import { setToastAnchor } from '../systems/Achievements';
import { portraitKey } from '../ui/Portrait';

/** 打造每级伤害加成（%），用于界面文字 */
const FORGE_PCT = Math.round(FORGE.dmgPerLevel * 100);

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
    // 成就提示条在商店里停到底部正中：顶部正中是持有的番茄籽，被挡住会妨碍购物
    setToastAnchor('bottom');
    this.events.once('shutdown', () => setToastAnchor('top'));
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
    const sl = r.set ? describeRelicSet(r, (relicSetCounts(run.relics)[r.set] ?? 0) + 1) : null;
    if (sl) lines.push(sl);
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
    const W = VW(this),
      H = VH(this);
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
    // 只从商店可售的武器里抽：只能合成的 T4 武器 / 超武不进商店
    const weaponPool = WEAPONS.filter((w) => isShopWeapon(w) && (!onlyCls || w.cls === onlyCls));
    const offers: ShopOffer[] = [...kept];
    const luck = run.stats.luck; // 武器品质 / 道具稀有度只看幸运，与波次无关
    // 配方道具：某条配方的材料武器都快凑齐时，25% 概率直接上架一件这条配方还缺的道具
    // （配方要求指定道具，全靠随机刷几乎凑不齐）；契合武器的配方优先
    const need = wantedRecipeItems(run.allWeapons, run.items, (to) => isFavoredWeapon(run.char.favored, WEAPON_MAP[to])).filter(
      (id) => run.canTakeItem(id) && !offers.some((o) => o.id === id),
    );
    if (need.length && offers.length < BALANCE.shopSlots && R() < 0.25) {
      // 前几件（契合配方的）更容易被选中
      const it = ITEM_MAP[need[Math.floor(Math.pow(R(), 2) * need.length)]];
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
        const favPool = favoredWeapons(run.char).filter(isShopWeapon);
        let def = favPool.length && R() < 0.18 ? pickOf(favPool, R) : pickOf(weaponPool, R);
        // 武器种类多（120 把）时很难自然凑出同名同级，而 T3 又几乎买不到（幸运分层最多 2%）：
        // 高概率补货已持有的武器，且「配对补货」直接按手上那把的品质定价出售，让 T3 配对与 T4 合成可行
        const owned = run.allWeapons;
        let pairTier = -1;
        if (owned.length && R() < BALANCE.shopOwnedChance) {
          // 只补货商店可售的武器（持有的合成专属 T4 / 超武不补货）
          const sellable = owned.filter((w) => isShopWeapon(WEAPON_MAP[w.id]));
          const single = sellable.filter(
            (w) => w.tier <= SHOP_MAX_TIER && sellable.filter((o) => o.id === w.id && o.tier === w.tier).length === 1,
          );
          if (sellable.length) {
            const pick = pickOf(single.length ? single : sellable, R);
            def = WEAPON_MAP[pick.id];
            if (single.length) pairTier = pick.tier;
          }
        }
        if (onlyCls && def.cls !== onlyCls) {
          def = pickOf(weaponPool, R);
          pairTier = -1;
        }
        // 保险：商店最高只卖 T3（T4 只能按配方合成）
        const tier = Math.min(SHOP_MAX_TIER, pairTier >= 0 ? pairTier : pickWeaponTier(luck, R));
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
    const W = VW(this),
      H = VH(this);
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
    // 购买 / 锁定按钮：按实际高度（触屏放大）放在卡片底部，连同按钮阴影（4）离边框留 12
    const bh = tu(44);
    const by = cy + ch - 12 - 4 - bh / 2;
    run.shop.forEach((o, i) => {
      const x = 20 + i * (cw + 14);
      if (o.sold) {
        L.add(panel(this, x, cy, cw, ch, 0x1f0d10, 0x3d1d22));
        return;
      }
      const rc = RARITY[o.tier];
      L.add(panel(this, x, cy, cw, ch, COLORS.panel, o.locked ? COLORS.gold : rc.color));
      let name: string, lines: string[], icon: string;
      // 卡片放不下时可以省略的行（按省略顺序）；武器的细节在点开后的弹窗里都能看到
      const optional: string[] = [];
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
          // 标签最多显示 3 个（完整标签在弹窗里）
          tx(
            `射程 ${Math.round(weaponRange(d, s))}  [${weaponTags(d).slice(0, 3).join('/')}${weaponTags(d).length > 3 ? '…' : ''}]`,
            `Range ${Math.round(weaponRange(d, s))}  [${weaponTags(d).slice(0, 3).map(tagName).join('/')}${weaponTags(d).length > 3 ? '…' : ''}]`,
          ),
          d.desc,
        ];
        optional.push(d.desc);
        if (d.superBuff) {
          const sb = `⚡ ${superBuffText(d.superBuff)[lang === 'en' ? 1 : 0]}`;
          lines.push(sb);
          optional.unshift(sb);
        }
        const sets = describeWeaponSets(d, run.setCounts(), !run.weapons.some((w) => w.id === d.id), tagName);
        lines.push(...sets);
        optional.splice(optional.length - 1, 0, ...sets);
        // 契合：卡片上只写一句，具体特效看右侧「角色」页签
        if (isFavoredWeapon(run.char.favored, d)) lines.unshift(tx('★ 契合武器 · 伤害 +10%', '★ Synergy weapon · +10% damage'));
        const ev = EVOLUTION_OF[d.id];
        if (ev) lines.push(tx(`✨ 可合成超武「${ev.to.name}」`, `✨ Crafts into ${ev.to.name}`));
        if (affixSlots(o.tier))
          lines.push(tx(`★ 购买后随机 ${affixSlots(o.tier)} 条词条`, `★ Rolls ${affixSlots(o.tier)} random affix(es)`));
        const host = run.absorbTarget(o.id, o.tier);
        if (host)
          lines.unshift(
            tx(
              `🌀 吞噬：${WEAPON_MAP[host.id].name} 升到 ${TIER_NAMES[Math.max(Math.min(2, host.tier + 1), o.tier)]}`,
              `🌀 Absorb: ${WEAPON_MAP[host.id].name} → ${TIER_NAMES[Math.max(Math.min(2, host.tier + 1), o.tier)]}`,
            ),
          );
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
        // 超武催化道具：持有配方主材料武器时提示
        const evoFor = EVOLUTIONS.filter((e) => e.item === it.id && run.weapons.some((w) => w.id === e.from));
        if (evoFor.length)
          lines.unshift(
            tx(
              `✨ 超武${evoFor.map((e) => `「${e.to.name}」`).join('')}的催化道具`,
              `✨ Catalyst for ${evoFor.map((e) => e.to.name).join(', ')}`,
            ),
          );
      }
      L.add(fitImage(this.add.image(x + cw / 2, cy + 55, icon), 76));
      L.add(text(this, x + cw / 2, cy + 106, name, 20, rc.css).setOrigin(0.5));
      // 武器卡左上角：伤害类型图标（近战 / 远程 / 元素 / 光环）
      if (o.kind === 'weapon') L.add(fitImage(this.add.image(x + 26, cy + 26, weaponDmgType(WEAPON_MAP[o.id]).icon), 38));
      L.add(
        text(
          this,
          x + cw / 2,
          cy + 126,
          o.kind === 'weapon'
            ? tx(`${weaponDmgType(WEAPON_MAP[o.id]).name}武器`, `${weaponDmgType(WEAPON_MAP[o.id]).name} Weapon`)
            : tx('道具', 'Item'),
          13,
          o.kind === 'weapon' ? weaponDmgType(WEAPON_MAP[o.id]).color : COLORS.textDim,
        ).setOrigin(0.5),
      );
      // 负向属性（道具代价，如「−1 护甲」）用红色
      // 说明文字放不下时：先按顺序省略次要的行（超武增益长说明 → 套装 → 武器说明），
      // 还放不下就只显示放得下的行、末行加「…」。字号不缩小（缩小后太难读）
      const room = by - bh / 2 - 8 - (cy + 142);
      let shown = [...lines];
      let desc = statLines(this, x + 10, cy + 142, shown, tu(13), '#fff4ea', cw - 20);
      for (const drop of optional) {
        if (desc.height <= room) break;
        if (!shown.includes(drop)) continue;
        desc.box.destroy();
        shown = shown.filter((l) => l !== drop);
        desc = statLines(this, x + 10, cy + 142, shown, tu(13), '#fff4ea', cw - 20);
      }
      if (desc.height > room) {
        const kids = desc.box.list as Phaser.GameObjects.Text[];
        let last: Phaser.GameObjects.Text | null = null;
        for (const t of kids) {
          if (t.y + t.height > room) t.setVisible(false);
          else last = t;
        }
        if (last) {
          // 末行截到一行并加「…」
          last.setWordWrapWidth(null);
          let str = last.text.split('\n')[0];
          while (str.length > 1 && last.setText(str + '…').width > cw - 20) str = str.slice(0, -1);
        }
      }
      L.add(desc.box);
      const can = run.seeds >= o.price && (o.kind === 'item' || run.canAddWeapon(o.id, o.tier));
      L.add(button(this, x + cw / 2 - 22, by, cw - 64, bh, `🌱 ${o.price}`, () => this.buy(o), COLORS.green, tu(20)).setEnabled(can));
      L.add(
        button(
          this,
          x + cw - 24,
          by,
          40,
          bh,
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
    // 武器格子：触屏放大到 70（左栏纵向空间紧，再大会把道具挤出屏幕）
    const ws = Math.min(70, tu(62));
    const drawSlot = (w: OwnedWeapon, x: number, y: number) => {
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
      // 伤害类型角标图标（近战 / 远程 / 元素 / 光环）
      L.add(
        this.add
          .graphics()
          .fillStyle(0x1a0a0c, 0.85)
          .fillCircle(x + 14, y + ws - 14, 13),
      );
      L.add(fitImage(this.add.image(x + 14, y + ws - 14, weaponDmgType(d).icon), 24));
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
    };
    run.weapons.forEach((w, i) => drawSlot(w, 20 + i * (ws + 8), wy + 28));

    // 仓库：不参与战斗，可与武器栏互换、出售，也能当合成材料
    const stY = wy + 36 + ws;
    L.add(
      text(
        this,
        20,
        stY,
        tx(
          `仓库（${run.storage.length}/${run.storageMax}）· 不参与战斗`,
          `Storage (${run.storage.length}/${run.storageMax}) · not in combat`,
        ),
        15,
        '#9d8189',
      ),
    );
    for (let i = 0; i < run.storageMax; i++) {
      const x = 20 + i * (ws + 8),
        y = stY + 22;
      const w = run.storage[i];
      if (w) {
        drawSlot(w, x, y);
        L.add(this.add.graphics().fillStyle(0x000000, 0.35).fillRoundedRect(x, y, ws, ws, 10));
      } else L.add(this.add.graphics().lineStyle(2, 0x5a4a4a, 1).strokeRoundedRect(x, y, ws, ws, 10));
    }

    // 套装
    const sets = Object.entries(run.setCounts()).filter(([t, n]) => n >= 2 && WEAPON_SETS[t]);
    if (sets.length)
      L.add(text(this, 20, stY + 32 + ws, tx('套装：', 'Sets: ') + sets.map(([t, n]) => `${tagName(t)}×${n}`).join('  '), 15, '#9be564'));

    // 道具
    const iy = stY + 50 + ws;
    L.add(text(this, 20, iy, tx('道具', 'Items'), 18, '#ffb347'));
    const is = tu(44);
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
    // 右栏自下而上：「下一波」（底边离屏幕 18px）→「合成表 / 刷新」一行 → 面板（下沿在按钮行上方留间隙）
    const B = this.bottomLayout(H);
    L.add(panel(this, sx, 76, sw, B.panelBottom - 76));
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
    if (this.sideTab === 'char') this.drawCharPanel(sx, 128, sw, B.panelBottom - 20);
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
    // 角色形象 + 名字 / 定位
    const ps = 76;
    L.add(fitImage(this.add.image(sx + 16 + ps / 2, y + ps / 2, portraitKey(this, 'char', run.charId)), ps));
    L.add(text(this, sx + 16 + ps + 12, y + 14, c.name, 22, '#ffd166'));
    L.add(text(this, sx + 16 + ps + 12, y + 46, c.title, 15, COLORS.textDim));
    y += ps + 10;
    add(tx('★ 契合标签（带这些标签的武器伤害 +10%）', '★ Synergy tags (+10% dmg on weapons with them)'), 16, '#ffb347', 6);
    for (const t of c.favored) {
      const td = TAG_MAP[t];
      const total = favoredWeapons({ favored: [t] }).length;
      const owned = run.weapons.filter((w) => weaponTags(WEAPON_MAP[w.id]).includes(t)).length;
      L.add(text(this, sx + 16, y, `${td?.icon ?? '◆'} ${tagName(t)}`, 16, td?.color ?? '#fff4ea'));
      L.add(
        text(
          this,
          sx + sw - 16,
          y + 2,
          tx(`共 ${total} 把 · 已持有 ${owned}`, `${total} weapons · owned ${owned}`),
          13,
          owned ? '#52ff8a' : COLORS.textDim,
        ).setOrigin(1, 0),
      );
      y += 24;
    }

    y += 4;
    add(tx('契合特效（伤害 +10%）', 'Synergy effect (+10% dmg)'), 15, '#ffb347', 2);
    add(affinityText(c.id), 14, '#ffe8a3', 10);
    add(tx(`天赋 · ${c.talent.name}`, `Talent · ${c.talent.name}`), 15, '#ffb347', 2);
    add(c.talent.desc, 14, '#fff4ea', 10);
    const traits = charTraitLines(c);
    if (traits.length) {
      add(tx('属性与特性', 'Stats & traits'), 15, '#ffb347', 2);
      for (const tr of traits) add(`· ${tr}`, 13, NEG_LINE.test(tr) ? NEG_COLOR : COLORS.textDim, 2);
    }
  }

  private drawStatsPanel(sx: number, sw: number, H: number): void {
    const L = this.layer;
    const s = run.stats;
    // 两列：每项「图标 + 名称 …… 数值」；面板到 H − 118 为止
    const cols = 2,
      gapX = 10;
    const colW = (sw - 32 - gapX) / cols;
    const rows = Math.ceil(STAT_ORDER.length / cols);
    const top = 126;
    const lineH = Math.min(tu(32), (this.bottomLayout(H).panelBottom - 16 - top - 6) / rows);
    const fs = Math.max(tu(12), Math.min(tu(15), Math.floor(lineH * 0.6)));
    const iconS = Math.min(22, lineH - 6);
    STAT_ORDER.forEach((k, i) => {
      const cap = run.statCap(k);
      const v = Math.min(s[k], cap);
      const info = STAT_INFO[k];
      const cx = sx + 16 + (i % cols) * (colW + gapX);
      const cy = top + Math.floor(i / cols) * lineH + lineH / 2;
      const icon = `stat_${k}`;
      if (this.textures.exists(icon)) L.add(fitImage(this.add.image(cx + iconS / 2, cy, icon), iconS));
      const name = text(this, cx + iconS + 5, cy, info.name, fs, info.color).setOrigin(0, 0.5);
      const col = v > 0 ? '#52ff8a' : v < 0 ? '#ff6b6b' : '#fff4ea';
      const val = text(
        this,
        cx + colW,
        cy,
        `${Math.round(v * 10) / 10}${info.pct ? '%' : ''}${k === 'regen' ? tx(`(${regenPerSecond(v).toFixed(2)}/秒)`, ` (${regenPerSecond(v).toFixed(2)}/s)`) : ''}${k === 'lifeSteal' && v > 0 ? tx(`(≤${lifeStealMaxPerSecond(s.maxHp)}/秒)`, ` (≤${lifeStealMaxPerSecond(s.maxHp)}/s)`) : ''}${k === 'armor' && v > 0 ? armorText(v) : ''}${k === 'speed' && v !== 0 ? speedText(v) : ''}${s[k] >= cap ? tx('(上限)', ' cap') : ''}`,
        fs,
        col,
      ).setOrigin(1, 0.5);
      // 一列放不下（英文名称长、或带括号说明的数值）时，名称与数值一起等比缩小
      const room = colW - iconS - 5 - 6;
      const need = name.width + val.width;
      if (need > room) {
        const k2 = Math.max(0.6, room / need);
        name.setScale(k2);
        val.setScale(k2);
      }
      L.add([name, val]);
    });
  }

  /** 右栏底部按钮的位置（自下而上推算，触屏放大后也不会互相挤压） */
  private bottomLayout(H: number): { nextY: number; nextH: number; rowY: number; rowH: number; panelBottom: number } {
    const nextH = tu(52),
      rowH = tu(50),
      gap = 10;
    const nextY = H - 18 - nextH / 2;
    const rowY = nextY - nextH / 2 - gap - rowH / 2;
    return { nextY, nextH, rowY, rowH, panelBottom: rowY - rowH / 2 - 12 };
  }

  private drawBottomButtons(sx: number, sw: number, H: number): void {
    const L = this.layer;
    const B = this.bottomLayout(H);
    // 底部按钮
    const rp = this.rerollCost();
    const left = run.maxRerolls - run.rerolls,
      canReroll = left > 0;
    // 「合成表」与「刷新」并排一行（左窄右宽），下面一行是「下一波」；原来两个按钮上下叠放会互相遮挡
    const gap = 8;
    const craftW = Math.round(sw * 0.36),
      rerollW = sw - craftW - gap;
    L.add(
      button(
        this,
        sx + craftW + gap + rerollW / 2,
        B.rowY,
        rerollW,
        B.rowH,
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
    // 合成表：T4 与超武按配方合成；有能合成的配方时按钮高亮
    const ready = RECIPES.filter((r) => run.canCraft(r)).length;
    L.add(
      button(
        this,
        sx + craftW / 2,
        B.rowY,
        craftW,
        B.rowH,
        ready ? tx(`🔨 合成 ${ready}`, `🔨 Craft ${ready}`) : tx('🔨 合成表', '🔨 Craft'),
        () => {
          saveRun();
          this.scene.start('Craft');
        },
        ready ? 0x2d7d5a : 0x4a5a6a,
        18,
      ),
    );
    L.add(button(this, sx + sw / 2, B.nextY, sw, B.nextH, tx('下一波 ▶', 'Next Wave ▶'), () => this.nextWave(), COLORS.primary, tu(24)));
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
    // 全部买光：自动补货一次，不花钱但算一次刷新（占用本波刷新次数、后续刷新价格照常上涨）；
    // 本波刷新次数已用完时不再补货，否则买光就能无限刷货架
    if (run.shop.every((x) => x.sold)) {
      if (run.rerolls < run.maxRerolls) {
        run.rerolls++;
        bump('shopRerolls');
        this.rollShop(true);
        const left = run.maxRerolls - run.rerolls;
        toast(
          this,
          tx(`商品已售罄，免费补货（算一次刷新，剩 ${left} 次）`, `Sold out — free restock (uses a reroll, ${left} left)`),
          '#52ff8a',
        );
      } else toast(this, tx('商品已售罄，本波刷新次数已用完', 'Sold out — no rerolls left this wave'), '#ffb347');
    }
    this.draw();
  }

  /** 刷新价格：随章节与波次上涨；当前货架每买走一件，价格 ×0.75 */
  private rerollCost(): number {
    const free =
      (freeFirstReroll(run.charId) ? 1 : 0) + treeTotals().freeRerolls + (run.mod('one_reroll') ? 1 : 0) + run.relicFx.flags.freeRerolls;
    if (run.rerolls < free) return 0;
    const bought = run.shop.filter((x) => x.sold).length;
    return Math.max(
      1,
      Math.round(rerollPrice(run.wave, run.rerolls, run.chapterId, run.netWorth()) * Math.pow(0.75, bought) * run.rules.rerollPrice),
    );
  }

  private weaponPopup(w: OwnedWeapon, x: number, y: number): void {
    this.popup?.destroy();
    const d = WEAPON_MAP[w.id];
    const s = run.stats;
    const affixes = w.affixes ?? [];
    // 按品质决定显示哪些功能：T1/T2 没有词条也不能打造 / 进化，相关行与按钮整块不显示
    const canForgeRow = w.tier >= 3;
    const superR = run.superRecipeFor(w);
    // T3：同名合成已到顶，升 T4 要走配方；给一个直接跳合成表的入口
    const refineR = w.tier === 2 ? RECIPE_BY_TO[w.id] : undefined;
    // 其余情况（T1/T2、合成专属 T4 等）：只要有相关配方，就给一个「查看合成路线」入口，打开合成表并聚焦这把武器
    const routeN = RECIPES.filter((r) => r.to === w.id || r.from.some(([id]) => id === w.id)).length;
    const openCraft = () => {
      saveRun();
      this.scene.start('Craft', { focus: w.id });
    };
    const forgeLv = w.forge ?? 0;
    const desc = text(
      this,
      14,
      0,
      [
        d.desc,
        ...(d.superBuff ? [`⚡ ${superBuffText(d.superBuff)[lang === 'en' ? 1 : 0]}`] : []),
        ...describeWeaponSets(d, run.setCounts(), false, tagName),
      ].join('\n'),
      13,
      COLORS.textDim,
      {
        wordWrap: { width: 312, useAdvancedWrap: true },
      },
    );
    // 自上而下累加各区块高度，算出面板高度（不显示的区块不占位）
    const PW = 340;
    let ty = 62 + desc.height + 8;
    const affixY = ty;
    ty += affixes.length * 34;
    const forgeTipY = ty;
    if (canForgeRow) ty += 26;
    const toolsY = ty;
    if (affixes.length || canForgeRow) ty += 52;
    const actY = ty;
    ty += 52;
    const storeY = ty;
    ty += 52;
    const evoY = ty;
    if (superR || refineR || routeN) ty += 54;
    const PH = ty + 8;
    // 优先放在点击点上方；放不下时下移，并夹在屏幕内（弹窗随品质变高，低品质很矮、T4 很高）
    const c = this.add.container(
      Math.min(x, VW(this) * 0.7 - PW - 10),
      Phaser.Math.Clamp(y - PH - 10, 10, Math.max(10, VH(this) - PH - 10)),
    );
    // 点击弹窗以外的区域关闭弹窗：全屏透明底层（最先加入，位于按钮之下）；弹窗面板本身吸收点击
    const close = () => {
      c.destroy();
      if (this.popup === c) this.popup = null;
    };
    const backdrop = this.add.rectangle(-c.x, -c.y, VW(this), VH(this), 0x000000, 0.001).setOrigin(0, 0).setInteractive();
    backdrop.on('pointerdown', close);
    c.add(backdrop);
    c.add(this.add.rectangle(0, 0, PW, PH, 0x000000, 0.001).setOrigin(0, 0).setInteractive());
    const g = this.add.graphics();
    g.fillStyle(COLORS.panelLight, 0.98)
      .fillRoundedRect(0, 0, PW, PH, 12)
      .lineStyle(3, RARITY[w.tier].color, 1)
      .strokeRoundedRect(0, 0, PW, PH, 12);
    c.add(g);
    const redraw = () => {
      this.draw();
      this.weaponPopup(w, x, y);
    };
    c.add(text(this, 14, 10, `${d.name} ${TIER_NAMES[w.tier]}${forgeLv ? ` +${forgeLv}` : ''}`, 20, RARITY[w.tier].css));
    const dt = weaponDmgType(d);
    const dtLabel = text(this, PW - 14, 14, tx(`${dt.name}武器`, `${dt.name} weapon`), 15, dt.color).setOrigin(1, 0);
    c.add(dtLabel);
    c.add(fitImage(this.add.image(PW - 26 - dtLabel.width, 24, dt.icon), 24));
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
    desc.setY(62);
    c.add(desc);
    // 词条（T3 / T4 才有）：逐条显示，可单独洗练
    const one = rerollOneCost(run.wave);
    affixes.forEach((a, i) => {
      const ay = affixY + i * 34;
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
    if (canForgeRow)
      c.add(
        text(
          this,
          14,
          forgeTipY,
          canForge(w)
            ? tx(
                `打造 +${forgeLv} → +${forgeLv + 1}：伤害 +${FORGE_PCT}% · 成功率 ${Math.round(forgeChance(w) * 100)}%`,
                `Forge +${forgeLv} → +${forgeLv + 1}: +${FORGE_PCT}% damage · ${Math.round(forgeChance(w) * 100)}% success`,
              )
            : tx('已打造至满级 +10', 'Fully forged (+10)'),
          14,
          '#ffd166',
        ),
      );
    // 洗全部 / 打造：只有能用的那个才出现（T1/T2 两个都不出现）
    const all = rerollAllCost(run.wave),
      fc = forgeCost(w);
    const both = affixes.length > 0 && canForgeRow;
    if (affixes.length)
      c.add(
        button(
          this,
          both ? 88 : PW / 2,
          toolsY + 20,
          both ? 150 : PW - 24,
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
        ).setEnabled(run.seeds >= all),
      );
    if (canForgeRow)
      c.add(
        button(
          this,
          both ? PW - 88 : PW / 2,
          toolsY + 20,
          both ? 150 : PW - 24,
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
            toast(
              this,
              ok ? tx(`打造成功！+${w.forge}`, `Forged! +${w.forge}`) : tx('打造失败', 'Forge failed'),
              ok ? '#52ff8a' : '#ff6b6b',
            );
            redraw();
          },
          0xb07d2b,
          16,
        ).setEnabled(canForge(w) && run.seeds >= fc),
      );
    // 合成（同名同级，最高到 T3）/ 卖 / 关闭
    // 「合成 / 卖 / 关闭」这一排对所有品质都固定（不能合成时「合成」置灰）：合成后弹窗按新品质刷新，
    // 按钮位置不变——否则「卖」会挪到原来「合成」的位置，连点两下就把刚合成的武器卖掉（合成暴击直接升 T3 时也一样）
    const canCombine = w.tier < 2 && run.allWeapons.some((o) => o.uid !== w.uid && o.id === w.id && o.tier === w.tier);
    const sp = sellPrice(this.price(d.price * TIER_PRICE_MULT[w.tier]));
    c.add(
      button(
        this,
        62,
        actY + 20,
        100,
        40,
        tx('合成', 'Combine'),
        () => {
          const up = run.combine(w.uid);
          if (up) {
            bump('combines');
            audio.play(this, 'levelup');
            toast(
              this,
              up > 1
                ? tx(`✨ 合成暴击！${d.name} 连升 2 级到 ${TIER_NAMES[w.tier]}`, `✨ Critical combine! ${d.name} → ${TIER_NAMES[w.tier]}`)
                : tx(`合成成功：${d.name} ${TIER_NAMES[w.tier]}`, `Combined: ${d.name} ${TIER_NAMES[w.tier]}`),
              up > 1 ? '#ffd166' : '#52ff8a',
            );
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
        actY + 20,
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
    c.add(
      button(
        this,
        278,
        actY + 20,
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
    // 仓库：存入 / 取回（武器栏满时与最弱的一把对调）
    const inSt = run.inStorage(w.uid);
    c.add(
      button(
        this,
        PW / 2,
        storeY + 20,
        PW - 24,
        40,
        inSt
          ? tx(`⬆ 取回武器栏（仓库 ${run.storage.length}/${run.storageMax}）`, `⬆ Equip (storage ${run.storage.length}/${run.storageMax})`)
          : tx(`⬇ 存入仓库（${run.storage.length}/${run.storageMax}）`, `⬇ Store (${run.storage.length}/${run.storageMax})`),
        () => {
          const ok = inSt ? run.fromStorage(w.uid, [...run.weapons].sort((a, b) => a.tier - b.tier)[0]?.uid) : run.toStorage(w.uid);
          if (!ok) {
            toast(
              this,
              inSt ? tx('武器栏已满', 'Weapon slots full') : tx('仓库已满或武器栏只剩一把', 'Storage full or last weapon'),
              '#ff6b6b',
            );
            return;
          }
          audio.play(this, 'buy');
          c.destroy();
          this.popup = null;
          this.draw();
        },
        0x4a5a6a,
        16,
      ),
    );
    // T3 → T4：按配方（同名 T3 × 2 + 道具），直接跳合成表看缺什么
    if (refineR && !superR) {
      const ok = run.canCraft(refineR);
      c.add(
        button(
          this,
          PW / 2,
          evoY + 21,
          PW - 24,
          42,
          ok
            ? tx(`⬆ 合成为 ${TIER_NAMES[3]}`, `⬆ Craft to ${TIER_NAMES[3]}`)
            : tx('⬆ 升 T4 需按配方合成（看合成表）', '⬆ T4 needs a recipe (see Crafting)'),
          () => {
            if (!ok) return openCraft();
            if (!run.craft(refineR)) return;
            audio.play(this, 'levelup');
            toast(this, tx(`合成成功：${d.name} ${TIER_NAMES[3]}`, `Crafted: ${d.name} ${TIER_NAMES[3]}`), '#52ff8a');
            redraw();
          },
          ok ? COLORS.green : 0x4a5a6a,
          ok ? 17 : 14,
        ),
      );
    }
    // 超武：只有这把已经是配方里的 T4 材料时才显示（T1~T3 不显示不可用的进化预告）
    if (superR) {
      const ok = run.canCraft(superR);
      const to = WEAPON_MAP[superR.to];
      c.add(
        button(
          this,
          PW / 2,
          evoY + 21,
          PW - 24,
          42,
          ok
            ? tx(`✨ 合成超武「${to.name}」`, `✨ Craft ${to.name}`)
            : tx(`✨ 可合成超武「${to.name}」（看合成表）`, `✨ Can craft ${to.name} (see Crafting)`),
          () => {
            if (!ok) return openCraft();
            if (!run.evolve(w.uid)) return;
            audio.play(this, 'levelup');
            this.cameras.main.flash(250, 255, 209, 102);
            toast(this, tx(`合成成功：${to.name}！`, `Crafted: ${to.name}!`), '#ffd166');
            redraw();
          },
          0xc77d00,
          ok ? 17 : 14,
        ),
      );
    }
    if (!superR && !refineR && routeN)
      c.add(
        button(
          this,
          PW / 2,
          evoY + 21,
          PW - 24,
          42,
          tx(`🔨 查看合成路线（${routeN} 条配方）`, `🔨 Crafting routes (${routeN})`),
          openCraft,
          0x4a5a6a,
          15,
        ),
      );
    // 触屏：弹窗整体放大，并重新夹回屏幕内
    if (TOUCH_UI > 1) {
      c.setScale(TOUCH_UI);
      c.x = Phaser.Math.Clamp(c.x, 10, VW(this) - PW * TOUCH_UI - 10);
      c.y = Phaser.Math.Clamp(y - PH * TOUCH_UI - 10, 10, Math.max(10, VH(this) - PH * TOUCH_UI - 10));
      backdrop.setPosition(-c.x / TOUCH_UI, -c.y / TOUCH_UI).setScale(1 / TOUCH_UI);
    }
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
