// 波次间：升级属性选择 + 宝箱开启
import { tip } from '../systems/Tutorial';
import { pickOf, shuffleWith } from '../systems/Rng';
import { treeTotals, effectiveRank, nodeText } from '../systems/TalentTree';
import { TALENT_NODES, BRANCH_MAP } from '../data/talentTree';
import { bump } from '../systems/Counters';
import Phaser from 'phaser';
import { describeItem } from '../data/describe';
import { itemIconKey } from '../art/ItemArt';
import { run, saveRun } from '../systems/RunState';
import { LEVELUP_OPTIONS, ALL_ITEMS, type ItemDef } from '../data/items';
import { WEAPON_MAP } from '../data/weapons';
import { formatMod, type StatKey } from '../data/stats';
import { BALANCE, RARITY, pickRarity, pickUpgradeRarity, rerollPrice, shopPrice, sellPrice } from '../data/balance';
import { text, button, panel, COLORS, fitImage, autoRelayout, NEG_LINE, NEG_COLOR } from '../ui/UI';
import { audio } from '../systems/Audio';
import { tx, lang } from '../i18n';
import { rollRelics, grantRelic } from '../systems/Relics';
import { relicKindsOpen } from '../systems/Mechanics';
import { describeRelic, describeRelicSet, RELIC_KIND_INFO, RELIC_SET_MAP, relicSetCounts, type RelicDef } from '../data/relics';
import { VW, VH } from '../systems/HiDpi';

export class LevelUpScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private rerolls = 0;
  /** 当前可选项（供自动化测试读取） */
  options: { key: string; value: number; pick: () => void }[] = [];
  crateItem: ItemDef | null = null;
  /** 当前遗物三选一（供自动化测试读取） */
  relicChoices: RelicDef[] = [];

  constructor() {
    super('LevelUp');
  }

  create(): void {
    autoRelayout(this);
    tip('levelup', this);
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
    else if (run.pendingRelics > 0) this.showRelics();
    else this.scene.start('Shop');
  }

  /** 局内天赋三选一：从未点满的天赋里随机 3 个（不含核心、终极天赋和只在开局生效的天赋）；可选不足 3 个时返回 false */
  private showTalentPick(R: () => number): boolean {
    const pool = TALENT_NODES.filter((n) => n.kind !== 'core' && n.kind !== 'keystone' && !n.fx.startSeeds && effectiveRank(n.id) < n.max);
    if (pool.length < 3) return false;
    const picks = shuffleWith([...pool], R).slice(0, 3);
    const W = VW(this);
    const L = this.layer;
    L.add(text(this, W / 2, 50, tx('本局天赋 · 三选一', 'Run Talent · Pick One'), 40, '#e0aaff').setOrigin(0.5));
    L.add(
      text(
        this,
        W / 2,
        96,
        tx(
          `LV.${run.level}  ·  本次升级改为获得 1 级天赋，只在本局生效`,
          `LV.${run.level}  ·  This level-up grants 1 talent rank for this run only`,
        ),
        20,
        COLORS.textDim,
      ).setOrigin(0.5),
    );
    const cw = Math.min(260, (W - 60) / 3 - 16),
      ch = 300;
    const x0 = W / 2 - (3 * (cw + 16) - 16) / 2;
    picks.forEach((n, i) => {
      const b = BRANCH_MAP[n.branch];
      const cur = effectiveRank(n.id);
      const x = x0 + i * (cw + 16),
        y = 140;
      L.add(panel(this, x, y, cw, ch, COLORS.panel, b.color));
      L.add(text(this, x + cw / 2, y + 56, n.icon, 54).setOrigin(0.5));
      L.add(text(this, x + cw / 2, y + 112, nodeText(n, 'name'), 22, '#ffffff').setOrigin(0.5));
      L.add(text(this, x + cw / 2, y + 138, `${b.name[lang === 'en' ? 1 : 0]} · ${cur} → ${cur + 1} / ${n.max}`, 15, b.css).setOrigin(0.5));
      L.add(
        text(this, x + cw / 2, y + 190, nodeText(n, 'desc', cur + 1), 16, '#fff4ea', {
          align: 'center',
          wordWrap: { width: cw - 24 },
        }).setOrigin(0.5),
      );
      const pick = () => {
        run.addRunTalent(n.id);
        bump('levelups');
        bump('runTalents');
        run.pendingLevelUps--;
        this.next();
      };
      this.options.push({ key: `talent:${n.id}`, value: 1, pick });
      L.add(button(this, x + cw / 2, y + ch - 40, cw - 40, 52, tx('选择', 'Pick'), pick, COLORS.green, 22));
    });
    return true;
  }

  private showLevelUp(): void {
    const W = VW(this),
      H = VH(this);
    audio.play(this, 'levelup');
    const L = this.layer;
    this.options = [];
    this.crateItem = null;
    // 局内天赋：按 treeChance 概率，这次升级改为从天赋里三选一（只在本局生效）
    const RT = run.rand(`lvltree:${run.level}:${run.pendingLevelUps}`);
    if (this.rerolls === 0 && RT() < BALANCE.treeChance && this.showTalentPick(RT)) return;
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
    const n = (run.char.levelUpChoices ?? BALANCE.levelUpChoices) + treeTotals().levelChoices + run.relicFx.flags.levelChoices;
    // 只提供当前武器涉及的流派伤害选项（否则 4 种流派会把有用选项稀释掉）
    const cls = new Set(run.weapons.map((w) => WEAPON_MAP[w.id]).map((d) => (d.kind === 'aura' ? 'aura' : d.cls)));
    const CLASS_KEY = { melee: 'meleePct', ranged: 'rangedPct', elemental: 'elementalPct', aura: 'auraPct' };
    const own = new Set<string>([...cls].map((c) => CLASS_KEY[c as keyof typeof CLASS_KEY]));
    // 流派伤害只在持有对应流派武器时提供；爆炸范围不在升级选项里（只能靠道具获得）
    const gated = Object.values(CLASS_KEY) as string[];
    const pool = LEVELUP_OPTIONS.filter((o) => !gated.includes(o.key) || own.has(o.key));
    const R = run.rand(`lvl:${run.level}:${run.pendingLevelUps}:${this.rerolls}`);
    const opts = shuffleWith([...pool], R).slice(0, n);
    const cw = Math.min(230, (W - 60) / n - 16),
      ch = 280;
    const x0 = W / 2 - (n * (cw + 16) - 16) / 2;
    opts.forEach((o, i) => {
      const rar = pickUpgradeRarity(run.stats.luck, R);
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
    const price = rerollPrice(run.wave, this.rerolls, run.chapterId, run.netWorth());
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
    // 当前持有的番茄籽紧贴刷新按钮显示，刷新前一眼能看到够不够（原来放在左下角，很容易被忽略）
    // 右对齐：「持有 [番茄籽图标] 数量」，图标用与顶栏一致的番茄籽贴图（不用 🌱 emoji）
    const haveCol = run.seeds >= price ? '#ffe066' : '#ff6b6b';
    const haveNum = text(this, W / 2 - 150, H - 70, String(run.seeds), 24, haveCol).setOrigin(1, 0.5);
    const haveIcon = this.add.image(haveNum.x - haveNum.width - 16, H - 72, 'ui_seed_icon').setDisplaySize(26, 26);
    const haveLbl = text(this, haveIcon.x - 18, H - 70, tx('持有', 'You have'), 24, haveCol).setOrigin(1, 0.5);
    L.add([haveLbl, haveIcon, haveNum]);
  }

  private showCrate(): void {
    const W = VW(this),
      H = VH(this);
    const L = this.layer;
    const R = run.rand(`crate:${run.wave}:${run.pendingCrates}`);
    // 与商店道具同一张幸运分层表（不再额外 +20 幸运，否则幸运 0 也能开出史诗 / 传说）
    const rar = Math.min(3, pickRarity(run.stats.luck, R));
    const pool = ALL_ITEMS.filter((it) => it.rarity === rar && run.canTakeItem(it.id));
    const item: ItemDef = pickOf(pool.length ? pool : ALL_ITEMS.filter((i) => i.rarity === 0), R);
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
    // 逐行居中；负向属性（道具代价）用红色
    let ly = y + 200;
    for (const line of lines) {
      const t = text(this, W / 2, ly, line, 19, NEG_LINE.test(line) ? NEG_COLOR : '#ffffff', {
        align: 'center',
        wordWrap: { width: cw - 40 },
      }).setOrigin(0.5, 0);
      L.add(t);
      ly += t.height + 2;
    }
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

  /** C2：遗物三选一（精英奖励 / 无尽里程碑），可以放弃换番茄籽 */
  private showRelics(): void {
    const W = VW(this),
      H = VH(this);
    const L = this.layer;
    const R = run.rand(`relic:${run.wave}:${run.pendingRelics}`);
    const picks = rollRelics(3, R, relicKindsOpen());
    this.options = [];
    this.crateItem = null;
    this.relicChoices = picks;
    tip('relic', this);
    const done = () => {
      run.pendingRelics--;
      this.relicChoices = [];
      this.next();
    };
    if (!picks.length) return done();
    audio.play(this, 'levelup');
    L.add(text(this, W / 2, 50, tx('选择一件遗物', 'Choose a Relic'), 40, '#ffd166').setOrigin(0.5));
    L.add(
      text(
        this,
        W / 2,
        96,
        tx('遗物会改变本局规则，持续到本局结束', 'Relics change the rules until the run ends'),
        20,
        COLORS.textDim,
      ).setOrigin(0.5),
    );
    const zh = lang === 'zh';
    const sets = relicSetCounts(run.relics);
    const cw = Math.min(300, (W - 60) / picks.length - 16),
      ch = 340;
    const x0 = W / 2 - (picks.length * (cw + 16) - 16) / 2;
    picks.forEach((r, i) => {
      const x = x0 + i * (cw + 16),
        y = 130;
      const k = RELIC_KIND_INFO[r.kind];
      L.add(panel(this, x, y, cw, ch, COLORS.panel, k.color));
      L.add(text(this, x + cw / 2, y + 50, r.icon, 56).setOrigin(0.5));
      L.add(text(this, x + cw / 2, y + 108, r.name[zh ? 0 : 1], 24, k.css).setOrigin(0.5));
      let sub = k.name[zh ? 0 : 1];
      if (r.set) {
        const sd = RELIC_SET_MAP[r.set];
        sub += `  ·  ${tx('套装', 'Set')} ${sd.name[zh ? 0 : 1]}`;
      }
      L.add(text(this, x + cw / 2, y + 138, sub, 16, COLORS.textDim).setOrigin(0.5));
      const lines = describeRelic(r, (id) => WEAPON_MAP[id]?.name ?? id);
      const body = text(this, x + cw / 2, y + 162, lines.join('\n'), 18, '#ffffff', {
        align: 'center',
        wordWrap: { width: cw - 24 },
      }).setOrigin(0.5, 0);
      L.add(body);
      // 套装进度按拿下这件后的件数显示
      const sl = r.set ? describeRelicSet(r, (sets[r.set] ?? 0) + 1) : null;
      if (sl)
        L.add(
          text(this, x + cw / 2, body.y + body.height + 10, sl, 15, '#9be564', { align: 'center', wordWrap: { width: cw - 24 } }).setOrigin(
            0.5,
            0,
          ),
        );
      const pick = () => {
        grantRelic(r.id);
        done();
      };
      this.options.push({ key: `relic:${r.id}`, value: 0, pick });
      L.add(button(this, x + cw / 2, y + ch - 36, cw - 40, 50, tx('拿走', 'Take'), pick, COLORS.green, 22));
    });
    const skip = 15 + run.wave * 2;
    L.add(
      button(
        this,
        W / 2,
        H - 70,
        280,
        56,
        tx(`放弃，换 🌱${skip}`, `Skip for 🌱${skip}`),
        () => {
          run.earn(skip, 'relicSkip');
          done();
        },
        0x7a2e35,
        20,
      ),
    );
  }
}
