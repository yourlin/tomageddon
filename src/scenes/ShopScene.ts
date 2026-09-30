// 商店：购买武器/道具、合成、出售、刷新、锁定
import Phaser from 'phaser';
import { describeItem } from '../data/describe';
import { itemIconKey } from '../art/ItemArt';
import { run, saveRun, type ShopOffer, type OwnedWeapon } from '../systems/RunState';
import { WEAPONS, WEAPON_MAP, TIER_PRICE_MULT, TIER_NAMES, WEAPON_SETS } from '../data/weapons';
import { ALL_ITEMS, ITEM_MAP } from '../data/items';
import { STAT_ORDER, STAT_INFO } from '../data/stats';
import { BALANCE, RARITY, pickRarity, rerollPrice, shopPrice, sellPrice } from '../data/balance';
import { weaponDamage, weaponCooldown, weaponRange } from '../systems/WeaponSystem';
import { text, button, panel, COLORS, fitImage, hitArea, toast, autoRelayout } from '../ui/UI';
import { audio } from '../systems/Audio';
import { markSeen, persist } from '../systems/Save';
import { tx } from '../i18n';
import { tagName } from '../i18n/apply';

export class ShopScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private popup: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('Shop');
  }

  create(data?: { keep?: boolean }): void {
    autoRelayout(this, { keep: true });
    this.cameras.main.setBackgroundColor(COLORS.bg);
    audio.playMusic(this, 'bgm_shop');
    if (!data?.keep) {
      run.rerolls = 0;
      this.rollShop(true);
    }
    saveRun();
    this.layer = this.add.container(0, 0);
    this.draw();
  }

  private price(base: number): number {
    return Math.max(1, Math.round(shopPrice(base, run.wave + 1) * (1 - run.specials.shopDiscount / 100)));
  }

  private rollShop(keepLocked: boolean): void {
    const kept = keepLocked ? run.shop.filter((o) => o.locked && !o.sold) : [];
    const offers: ShopOffer[] = [...kept];
    const luck = run.stats.luck;
    const wave = run.wave + 1;
    while (offers.length < BALANCE.shopSlots) {
      const wantWeapon = Math.random() < (run.weapons.length < run.maxWeapons ? 0.4 : 0.25);
      if (wantWeapon) {
        let def = Phaser.Utils.Array.GetRandom(WEAPONS);
        if (run.weapons.length && Math.random() < 0.25) def = WEAPON_MAP[Phaser.Utils.Array.GetRandom(run.weapons).id];
        const tier = Math.max(def.minTier ?? 0, Math.min(3, pickRarity(wave, luck)));
        offers.push({ kind: 'weapon', id: def.id, tier, price: this.price(def.price * TIER_PRICE_MULT[tier]), locked: false, sold: false });
      } else {
        const rar = pickRarity(wave, luck);
        const pool = ALL_ITEMS.filter((i) => i.rarity === rar && (!i.max || (run.items[i.id] ?? 0) < i.max));
        if (!pool.length) continue;
        const it = Phaser.Utils.Array.GetRandom(pool);
        offers.push({
          kind: 'item',
          id: it.id,
          tier: it.rarity,
          price: this.price(it.price * (1 + 0.3 * Math.min(1, run.wave / 8))),
          locked: false,
          sold: false,
        });
      }
    }
    run.shop = offers;
    for (const o of offers) markSeen(o.kind === 'weapon' ? 'weapons' : 'items', o.id);
    persist();
  }

  private draw(): void {
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
          (run.wave + 1 === BALANCE.waves.bossWave
            ? tx('（BOSS）', ' (BOSS)')
            : BALANCE.waves.eliteWaves.includes(run.wave + 1)
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
      } else {
        const it = ITEM_MAP[o.id];
        name = it.name;
        icon = itemIconKey(this, it);
        lines = describeItem(it);
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
    L.add(text(this, sx + 16, 86, tx('属性', 'Stats'), 22, '#ffd166'));
    const s = run.stats;
    const lineH = Math.min(26, (H - 250) / STAT_ORDER.length);
    STAT_ORDER.forEach((k, i) => {
      const v = s[k];
      const info = STAT_INFO[k];
      const y = 120 + i * lineH;
      L.add(text(this, sx + 16, y, info.name, 16, info.color));
      const col = v > 0 ? '#52ff8a' : v < 0 ? '#ff6b6b' : '#fff4ea';
      L.add(text(this, sx + sw - 16, y, `${Math.round(v * 10) / 10}${info.pct ? '%' : ''}`, 16, col).setOrigin(1, 0));
    });

    // 底部按钮
    const rp = rerollPrice(run.wave, run.rerolls);
    L.add(
      button(
        this,
        sx + sw / 2,
        H - 82,
        sw,
        50,
        tx(`刷新 🌱${rp}`, `Reroll 🌱${rp}`),
        () => {
          if (run.seeds < rp) return;
          run.seeds -= rp;
          run.rerolls++;
          this.rollShop(true);
          audio.play(this, 'buy');
          this.draw();
        },
        0x7a2e35,
        20,
      ).setEnabled(run.seeds >= rp),
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
    } else run.addItem(o.id);
    run.seeds -= o.price;
    o.sold = true;
    o.locked = false;
    audio.play(this, 'buy');
    this.draw();
  }

  private weaponPopup(w: OwnedWeapon, x: number, y: number): void {
    this.popup?.destroy();
    const d = WEAPON_MAP[w.id];
    const c = this.add.container(Math.min(x, this.scale.width * 0.7 - 280), y - 190);
    const g = this.add.graphics();
    g.fillStyle(COLORS.panelLight, 0.98)
      .fillRoundedRect(0, 0, 270, 180, 12)
      .lineStyle(3, RARITY[w.tier].color, 1)
      .strokeRoundedRect(0, 0, 270, 180, 12);
    c.add(g);
    const s = run.stats;
    c.add(text(this, 14, 10, `${d.name} ${TIER_NAMES[w.tier]}`, 20, RARITY[w.tier].css));
    c.add(
      text(
        this,
        14,
        40,
        tx(
          `伤害 ${Math.round(weaponDamage(d, w.tier, s))} · 冷却 ${weaponCooldown(d, w.tier, s).toFixed(2)}s · 射程 ${Math.round(weaponRange(d, s))}`,
          `DMG ${Math.round(weaponDamage(d, w.tier, s))} · CD ${weaponCooldown(d, w.tier, s).toFixed(2)}s · Range ${Math.round(weaponRange(d, s))}`,
        ),
        14,
        '#fff4ea',
      ),
    );
    c.add(text(this, 14, 62, d.desc, 13, COLORS.textDim, { wordWrap: { width: 240 } }));
    const canCombine = w.tier < 3 && run.weapons.some((o) => o.uid !== w.uid && o.id === w.id && o.tier === w.tier);
    const sp = sellPrice(this.price(d.price * TIER_PRICE_MULT[w.tier]));
    c.add(
      button(
        this,
        50,
        145,
        84,
        44,
        tx('合成', 'Combine'),
        () => {
          if (run.combine(w.uid)) {
            audio.play(this, 'levelup');
            this.draw();
          }
        },
        COLORS.green,
        18,
      ).setEnabled(canCombine),
    );
    c.add(
      button(
        this,
        138,
        145,
        84,
        44,
        tx(`卖 ${sp}`, `Sell ${sp}`),
        () => {
          if (run.weapons.length <= 1) {
            toast(this, tx('至少保留一把武器', 'Keep at least one weapon'));
            return;
          }
          run.removeWeapon(w.uid);
          run.seeds += sp;
          audio.play(this, 'buy');
          this.draw();
        },
        0x7a2e35,
        18,
      ),
    );
    c.add(
      button(
        this,
        226,
        145,
        70,
        44,
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
    run.wave++;
    run.shop.forEach((o) => {
      if (!o.locked) o.sold = true;
    });
    this.scene.start('Game');
  }
}
