// 波次间：升级属性选择 + 宝箱开启
import { treeTotals } from '../systems/TalentTree';
import { bump } from '../systems/Counters';
import Phaser from 'phaser';
import { describeItem } from '../data/describe';
import { itemIconKey } from '../art/ItemArt';
import { run, saveRun } from '../systems/RunState';
import { LEVELUP_OPTIONS, ALL_ITEMS, type ItemDef } from '../data/items';
import { WEAPON_MAP } from '../data/weapons';
import { formatMod, type StatKey } from '../data/stats';
import { BALANCE, RARITY, pickRarity, rerollPrice, shopPrice, sellPrice } from '../data/balance';
import { text, button, panel, COLORS, fitImage, autoRelayout } from '../ui/UI';
import { audio } from '../systems/Audio';
import { tx } from '../i18n';

export class LevelUpScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private rerolls = 0;
  /** 当前可选项（供自动化测试读取） */
  options: { key: string; value: number; pick: () => void }[] = [];
  crateItem: ItemDef | null = null;

  constructor() {
    super('LevelUp');
  }

  create(): void {
    autoRelayout(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.layer = this.add.container(0, 0);
    this.rerolls = 0;
    this.next();
  }

  private next(): void {
    saveRun();
    this.layer.removeAll(true);
    if (run.pendingLevelUps > 0) this.showLevelUp();
    else if (run.pendingCrates > 0) this.showCrate();
    else this.scene.start('Shop');
  }

  private showLevelUp(): void {
    const W = this.scale.width,
      H = this.scale.height;
    audio.play(this, 'levelup');
    const L = this.layer;
    this.options = [];
    this.crateItem = null;
    L.add(
      text(
        this,
        W / 2,
        50,
        tx(`升级！（剩余 ${run.pendingLevelUps} 次）`, `Level Up! (${run.pendingLevelUps} left)`),
        40,
        '#52ff8a',
      ).setOrigin(0.5),
    );
    L.add(
      text(
        this,
        W / 2,
        96,
        tx(`LV.${run.level}  ·  选择一项属性提升`, `LV.${run.level}  ·  Choose a stat to upgrade`),
        20,
        COLORS.textDim,
      ).setOrigin(0.5),
    );
    const n = (run.char.levelUpChoices ?? BALANCE.levelUpChoices) + treeTotals().levelChoices;
    // 只提供当前武器涉及的流派伤害选项（否则 4 种流派会把有用选项稀释掉）
    const cls = new Set(run.weapons.map((w) => WEAPON_MAP[w.id]).map((d) => (d.kind === 'aura' ? 'aura' : d.cls)));
    const CLASS_KEY = { melee: 'meleePct', ranged: 'rangedPct', elemental: 'elementalPct', aura: 'auraPct' };
    const own = new Set([...cls].map((c) => CLASS_KEY[c as keyof typeof CLASS_KEY]));
    const pool = LEVELUP_OPTIONS.filter((o) => !Object.values(CLASS_KEY).includes(o.key) || own.has(o.key));
    const opts = Phaser.Utils.Array.Shuffle([...pool]).slice(0, n);
    const cw = Math.min(230, (W - 60) / n - 16),
      ch = 280;
    const x0 = W / 2 - (n * (cw + 16) - 16) / 2;
    opts.forEach((o, i) => {
      const rar = pickRarity(run.wave, run.stats.luck);
      const v = o.values[rar];
      const x = x0 + i * (cw + 16),
        y = 140;
      const g = panel(this, x, y, cw, ch, COLORS.panel, RARITY[rar].color);
      L.add(g);
      const iconKey = `stat_${o.key}`;
      if (this.textures.exists(iconKey)) L.add(fitImage(this.add.image(x + cw / 2, y + 70, iconKey), 90));
      else L.add(text(this, x + cw / 2, y + 70, '▲', 60, RARITY[rar].css).setOrigin(0.5));
      L.add(text(this, x + cw / 2, y + 140, RARITY[rar].name, 18, RARITY[rar].css).setOrigin(0.5));
      L.add(
        text(this, x + cw / 2, y + 180, formatMod(o.key as StatKey, v), 22, '#ffffff', {
          align: 'center',
          wordWrap: { width: cw - 20 },
        }).setOrigin(0.5),
      );
      const pick = () => {
        run.addLevelMod({ [o.key]: v });
        bump('levelups');
        run.pendingLevelUps--;
        this.next();
      };
      this.options.push({ key: o.key, value: v, pick });
      const b = button(this, x + cw / 2, y + ch - 40, cw - 40, 52, tx('选择', 'Pick'), pick, COLORS.green, 22);
      L.add(b);
    });
    const price = rerollPrice(run.wave, this.rerolls, run.chapterId);
    const rb = button(
      this,
      W / 2,
      H - 70,
      260,
      58,
      tx(`刷新 🌱${price}`, `Reroll 🌱${price}`),
      () => {
        if (run.seeds < price) return;
        run.seeds -= price;
        this.rerolls++;
        this.next();
      },
      0x7a2e35,
      22,
    );
    rb.setEnabled(run.seeds >= price);
    L.add(rb);
    L.add(text(this, 30, H - 40, `🌱 ${run.seeds}`, 24, '#ffe066').setOrigin(0, 0.5));
  }

  private showCrate(): void {
    const W = this.scale.width,
      H = this.scale.height;
    const L = this.layer;
    const rar = Math.min(3, pickRarity(run.wave, run.stats.luck + 20));
    const pool = ALL_ITEMS.filter((it) => it.rarity === rar && (!it.max || (run.items[it.id] ?? 0) < it.max));
    const item: ItemDef = Phaser.Utils.Array.GetRandom(pool.length ? pool : ALL_ITEMS.filter((i) => i.rarity === 0));
    this.options = [];
    this.crateItem = item;
    audio.play(this, 'buy');
    L.add(
      text(
        this,
        W / 2,
        60,
        tx(`打开宝箱！（剩余 ${run.pendingCrates}）`, `Crate opened! (${run.pendingCrates} left)`),
        40,
        '#ffd166',
      ).setOrigin(0.5),
    );
    const cw = 360,
      ch = 360,
      x = W / 2 - cw / 2,
      y = 110;
    L.add(panel(this, x, y, cw, ch, COLORS.panel, RARITY[item.rarity].color));
    L.add(fitImage(this.add.image(W / 2, y + 80, itemIconKey(this, item)), 110));
    L.add(text(this, W / 2, y + 160, item.name, 30, RARITY[item.rarity].css).setOrigin(0.5));
    const lines = describeItem(item);
    L.add(text(this, W / 2, y + 200, lines.join('\n'), 19, '#ffffff', { align: 'center', wordWrap: { width: cw - 40 } }).setOrigin(0.5, 0));
    const recycle = sellPrice(shopPrice(item.price, run.wave));
    L.add(
      button(
        this,
        W / 2 - 100,
        H - 90,
        180,
        64,
        tx('拿走', 'Take'),
        () => {
          run.addItem(item.id);
          bump('crates');
          run.pendingCrates--;
          this.next();
        },
        COLORS.green,
        26,
      ),
    );
    L.add(
      button(
        this,
        W / 2 + 100,
        H - 90,
        180,
        64,
        tx(`回收 🌱${recycle}`, `Recycle 🌱${recycle}`),
        () => {
          run.earn(recycle, 'recycle');
          bump('crates');
          run.pendingCrates--;
          this.next();
        },
        0x7a2e35,
        22,
      ),
    );
  }
}
