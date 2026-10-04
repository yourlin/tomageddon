// 角色与关卡选择
import { bump, counter } from '../systems/Counters';
import { tip } from '../systems/Tutorial';
import Phaser from 'phaser';
import { portraitKey, showcaseRig } from '../ui/Portrait';
import { CHARACTERS, type CharacterDef } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { WEAPON_MAP } from '../data/weapons';
import { SKILL_TYPE_NAME } from '../data/skills';
import { describeMods } from '../data/stats';
import { save, persist, isUnlocked } from '../systems/Save';
import { unlockHint, unlockProgress, checkAchievements, achTier, medalOf } from '../systems/Achievements';
import { ACH_MAP } from '../data/achievements';
import { run, clearRun } from '../systems/RunState';
import { text, button, panel, COLORS, fitImage, hitArea, autoRelayout, toast } from '../ui/UI';
import { tx, lang } from '../i18n';
import { DANGER_LEVELS, MAX_DANGER } from '../data/danger';
import { dangerReward } from '../data/balance';
import { chapterAvailable, chapterCleared, chapterVisible } from '../systems/Danger';
import {
  questDone,
  questProgress,
  awakenUnlocked,
  awakenOn,
  awakeningOf,
  masteryLabel,
  skinOwned,
  skinActive,
  buySkin,
  toggleSkin,
} from '../systems/Progress';
import { SKIN_OF, skinName } from '../data/skins';
import { questsOf } from '../data/quests';
import { CH6_DANGER_REQ } from '../data/chaptersExtra';
import { dangerUnlocked, dangerBest, hasGoldFrame } from '../systems/Danger';

export class CharSelectScene extends Phaser.Scene {
  private selected: CharacterDef = CHARACTERS[0];
  private chapter = 1;
  private detail!: Phaser.GameObjects.Container;
  private cards: { c: CharacterDef; g: Phaser.GameObjects.Graphics; x: number; y: number; s: number }[] = [];
  private chapterText!: Phaser.GameObjects.Text;
  private chapterDesc!: Phaser.GameObjects.Text;
  private startBtn!: ReturnType<typeof button>;
  private endlessBtn!: ReturnType<typeof button>;
  private dangerBtn!: ReturnType<typeof button>;
  /** 番茄危机等级（A4）：跨场景记住上次的选择 */
  private static lastDanger: Record<number, number> = {};
  private danger = 0;
  private dangerPanel: Phaser.GameObjects.Container | null = null;
  /** 无尽模式（通关该章后可选） */
  private endless = false;
  private showcase: ReturnType<typeof showcaseRig> | null = null;
  private detailX = 0;

  constructor() {
    super('CharSelect');
  }

  create(): void {
    autoRelayout(this);
    const W = this.scale.width,
      H = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.chapter = Math.min(save.clearedChapters + 1, CHAPTERS.length);
    this.cards = [];
    if (!isUnlocked(this.selected)) this.selected = CHARACTERS[0];

    text(this, 30, 20, tx('选择角色', 'Choose Character'), 36).setOrigin(0, 0);
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);
    {
      const owned = CHARACTERS.filter(isUnlocked).length;
      text(
        this,
        W - 180,
        44,
        tx(`已解锁角色 ${owned}/${CHARACTERS.length}`, `Characters ${owned}/${CHARACTERS.length}`),
        22,
        '#ffd166',
      ).setOrigin(1, 0.5);
    }

    // 角色网格
    const cols = 8,
      s = Math.min(84, (W * 0.5 - 60) / cols - 8);
    const gx = 30,
      gy = 90;
    CHARACTERS.forEach((c, i) => {
      const x = gx + (i % cols) * (s + 8),
        y = gy + Math.floor(i / cols) * (s + 8);
      const g = this.add.graphics();
      this.cards.push({ c, g, x, y, s });
      const unlocked = isUnlocked(c);
      const img = fitImage(this.add.image(x + s / 2, y + s / 2, portraitKey(this, 'char', c.id)), s * 0.95);
      // 角色成就角标：左上为开局次数奖章（铜/银/金），右上为通关奖杯
      const runsAch = ACH_MAP[`char_runs_${c.id}`];
      if (runsAch && achTier(runsAch.id) > 0) text(this, x + 3, y + 1, medalOf(runsAch), 17).setOrigin(0, 0);
      if (achTier(`char_wins_${c.id}`) > 0) text(this, x + s - 3, y + 1, '🏆', 15).setOrigin(1, 0);
      if (!unlocked) {
        // 未拥有：半透明显示本体，角标为锁和解锁成就的完成进度
        img.setAlpha(0.45);
        const p = unlockProgress(c);
        const pct = Math.floor((p.value / p.goal) * 100);
        text(this, x + s - 4, y + s - 2, `🔒${pct}%`, 13, '#ffd166', { stroke: '#000000', strokeThickness: 4 }).setOrigin(1, 1);
      }
      hitArea(this, x, y, s, s, () => {
        this.selected = c;
        this.refresh();
      });
    });
    // L5：新系统引导
    if (save.wins >= 1) tip('quests', this);
    if (dangerUnlocked(this.chapter) >= 1) tip('danger', this);

    // 详情面板
    const px = W * 0.5 + 10,
      pw = W * 0.5 - 40;
    this.detailX = px;
    this.showcase = null;
    panel(this, px, 90, pw, H - 250);
    this.detail = this.add.container(px, 90);

    // 章节选择
    const cy = H - 130;
    panel(this, 30, cy - 20, W - 60, 110, COLORS.panelLight);
    button(
      this,
      80,
      cy + 35,
      64,
      64,
      '◀',
      () => {
        this.chapter = Math.max(1, this.chapter - 1);
        while (this.chapter > 1 && !chapterVisible(this.chapter)) this.chapter--;
        this.refresh();
      },
      0x7a2e35,
      28,
    );
    button(
      this,
      W * 0.62,
      cy + 35,
      64,
      64,
      '▶',
      () => {
        const next = Math.min(CHAPTERS.length, this.chapter + 1);
        if (chapterVisible(next)) this.chapter = next;
        this.refresh();
      },
      0x7a2e35,
      28,
    );
    this.chapterText = text(this, 130, cy, '', 26, '#ffd166');
    this.chapterDesc = text(this, 130, cy + 40, '', 18, COLORS.textDim, { wordWrap: { width: W * 0.62 - 180 } });
    this.endlessBtn = button(
      this,
      W * 0.62 + 130,
      cy + 12,
      170,
      40,
      '',
      () => {
        if (!chapterCleared(this.chapter)) {
          toast(
            this,
            tx(`通关第 ${this.chapter} 章后解锁本章无尽模式`, `Clear Chapter ${this.chapter} to unlock its Endless mode`),
            '#ff6b6b',
          );
          return;
        }
        this.endless = !this.endless;
        this.refresh();
      },
      0x5a189a,
      17,
    );
    // 番茄危机等级选择（A4）：◀ 等级 ▶，点等级查看叠加的全部规则
    const dx = W * 0.62 + 130;
    button(this, dx - 66, cy + 60, 36, 38, '◀', () => this.setDanger(this.danger - 1), 0x7a2e35, 18);
    this.dangerBtn = button(this, dx, cy + 60, 90, 38, '', () => this.showDangerRules(), 0x9d0208, 17);
    button(this, dx + 66, cy + 60, 36, 38, '▶', () => this.setDanger(this.danger + 1), 0x7a2e35, 18);
    this.startBtn = button(this, W - 150, cy + 35, 220, 76, tx('出发！', 'Go!'), () => this.start(), COLORS.primary, 32);
    this.refresh();
  }

  private refresh(): void {
    for (const k of this.cards) {
      k.g.clear();
      const sel = k.c === this.selected;
      k.g.fillStyle(sel ? 0x7a2e35 : COLORS.panel, 1).fillRoundedRect(k.x, k.y, k.s, k.s, 12);
      k.g.lineStyle(sel ? 4 : 2, sel ? COLORS.gold : COLORS.border, 1).strokeRoundedRect(k.x, k.y, k.s, k.s, 12);
      // A9：任意章节通关危机 20 的角色，头像加金色外框
      if (hasGoldFrame(k.c.id)) k.g.lineStyle(3, 0xffd700, 1).strokeRoundedRect(k.x - 3, k.y - 3, k.s + 6, k.s + 6, 14);
    }
    const c = this.selected;
    const unlocked = isUnlocked(c);
    const d = this.detail;
    d.removeAll(true);
    const pw = this.scale.width * 0.5 - 40;
    this.showcase?.destroy();
    this.showcase = showcaseRig(this, 'char', c.id, this.detailX + 90, 90 + 110, 62);
    if (!unlocked) this.showcase.setAlpha(0.55);
    this.showcase.setDepth(10);
    d.add(text(this, 180, 24, c.name, 34, '#ffffff'));
    d.add(text(this, 180, 70, c.title, 20, '#ffd166'));
    {
      const hint = unlocked ? c.desc : unlockHint(c);
      d.add(
        text(this, 180, 104, hint, 17, unlocked ? COLORS.textDim : '#ffd166', {
          wordWrap: { width: pw - 200, useAdvancedWrap: true },
        }),
      );
      // 各段按实际文字高度依次排列，特性分两列，避免长文本溢出面板
      const add = (x: number, yy: number, str: string, size: number, color: string, wrap = 0) => {
        const t = text(this, x, yy, str, size, color, wrap ? { wordWrap: { width: wrap, useAdvancedWrap: true } } : {});
        d.add(t);
        return t.height;
      };
      let y = 172;
      y += add(20, y, tx(`天赋 · ${c.talent.name}`, `Talent · ${c.talent.name}`), 21, '#ffd166') + 4;
      y += add(30, y, c.talent.desc, 16, '#fff4ea', pw - 60) + 10;
      y += add(20, y, tx('特性', 'Traits'), 21, '#ffb347') + 4;
      const traits = [...c.traits];
      if (!traits.length) traits.push(...describeMods(c.mods));
      const half = Math.ceil(traits.length / 2);
      const colW = (pw - 60) / 2;
      const hL = add(
        30,
        y,
        traits
          .slice(0, half)
          .map((t) => '• ' + t)
          .join('\n'),
        16,
        '#fff4ea',
        colW - 10,
      );
      const hR =
        traits.length > 1
          ? add(
              30 + colW,
              y,
              traits
                .slice(half)
                .map((t) => '• ' + t)
                .join('\n'),
              16,
              '#fff4ea',
              colW - 10,
            )
          : 0;
      y += Math.max(hL, hR) + 10;
      y +=
        add(
          20,
          y,
          tx(
            `技能：${c.skill.name}【${SKILL_TYPE_NAME[c.skill.type]}】冷却 ${c.skill.cd} 秒`,
            `Skill: ${c.skill.name} [${SKILL_TYPE_NAME[c.skill.type]}] cooldown ${c.skill.cd}s`,
          ),
          19,
          '#6ec6ff',
        ) + 4;
      y += add(30, y, c.skill.desc, 16, '#fff4ea', pw - 60) + 8;
      y +=
        add(
          20,
          y,
          tx('初始武器：', 'Starting weapons: ') + c.startWeapons.map((w) => WEAPON_MAP[w].name).join(tx('、', ', ')),
          17,
          '#9be564',
        ) + 2;
      y +=
        add(
          20,
          y,
          tx('契合武器（伤害 +20%）：', 'Synergy weapons (+20% dmg): ') + c.favored.map((w) => WEAPON_MAP[w].name).join(tx('、', ', ')),
          16,
          '#ffd166',
          pw - 40,
        ) + 4;
      const best = save.bestWave[`${c.id}_${this.chapter}`];
      // F4：本章最佳、最高危机、无尽最高波数（熟练度由角色系统追加）
      const stats: string[] = [];
      if (best) stats.push(tx(`本章最佳：第 ${best} 波`, `Best: wave ${best}`));
      const db = dangerBest(c.id, this.chapter);
      if (db > 0) stats.push(tx(`最高危机 ${db}`, `Top Danger ${db}`));
      const eb = save.meta.endlessBest[`${c.id}_${this.chapter}`];
      if (eb) stats.push(tx(`无尽最高 ${eb} 波`, `Endless best ${eb}`));
      if (stats.length) y += add(20, y, stats.join(' · '), 15, COLORS.textDim) + 4;
      // F4：熟练度、专属任务、觉醒（点击切换开关）
      y += add(20, y, masteryLabel(c.id), 15, '#9bf6ff') + 2;
      const qs = questsOf(c.id);
      if (qs.length)
        y +=
          add(
            20,
            y,
            qs
              .map((q) => {
                const done = questDone(q);
                const prog = q.kind === 'counter' && !done ? ` ${questProgress(q)}/${q.target}` : '';
                return `${done ? '✔' : '○'} ${q.name[lang === 'en' ? 1 : 0]}：${q.desc[lang === 'en' ? 1 : 0]}${prog}`;
              })
              .join('\n'),
            14,
            '#fff4ea',
            pw - 40,
          ) + 2;
      const aw = awakeningOf(c.id);
      if (aw) {
        const unlockedAw = awakenUnlocked(c.id);
        const on = awakenOn(c.id);
        const t = text(
          this,
          20,
          y,
          (unlockedAw ? (on ? '✨ ' : '◌ ') : '🔒 ') +
            tx(`觉醒【${aw.name[0]}】${aw.desc[0]}`, `Awakening [${aw.name[1]}] ${aw.desc[1]}`) +
            (unlockedAw
              ? tx(on ? '（已开启，点击关闭）' : '（已关闭，点击开启）', on ? ' (on — click to turn off)' : ' (off — click to turn on)')
              : tx('（完成 3 个任务解锁）', ' (complete 3 quests)')),
          14,
          unlockedAw ? (on ? '#ffd166' : COLORS.textDim) : '#888888',
          { wordWrap: { width: pw - 40, useAdvancedWrap: true } },
        );
        if (unlockedAw)
          t.setInteractive({ useHandCursor: true }).on('pointerup', () => {
            save.meta.awaken[c.id] = !on;
            persist();
            this.refresh();
          });
        d.add(t);
        y += t.height + 2;
      }
      // F6：皮肤（金番茄购买 / 熟练度 10 级免费），点击购买或切换
      const sk = SKIN_OF[c.id];
      if (sk && unlocked) {
        const owned = skinOwned(c.id);
        const active = skinActive(c.id);
        const label = owned
          ? tx(
              `🎨 皮肤「${skinName(sk, false)}」${active ? '（使用中，点击换回）' : '（点击换上）'}`,
              `🎨 Skin "${skinName(sk, true)}" ${active ? '(equipped — click to remove)' : '(click to equip)'}`,
            )
          : tx(
              `🎨 皮肤「${skinName(sk, false)}」 🥇${sk.price}（拥有 🥇${save.meta.gold}，熟练度 10 级免费）`,
              `🎨 Skin "${skinName(sk, true)}" 🥇${sk.price} (you have 🥇${save.meta.gold}; free at Mastery 10)`,
            );
        const st = text(
          this,
          20,
          y,
          label,
          14,
          owned ? (active ? '#ffd166' : '#fff4ea') : save.meta.gold >= sk.price ? '#52ff8a' : '#888888',
          {
            wordWrap: { width: pw - 40, useAdvancedWrap: true },
          },
        ).setInteractive({ useHandCursor: true });
        st.on('pointerup', () => {
          if (owned) toggleSkin(c.id);
          else if (!buySkin(c.id)) return toast(this, tx('金番茄不够', 'Not enough Golden Tomatoes'), '#ff6b6b');
          persist();
          this.refresh();
        });
        d.add(st);
      }
    }
    const ch = CHAPTERS[this.chapter - 1];
    const chUnlocked = chapterAvailable(this.chapter);
    const endlessOk = chapterCleared(this.chapter);
    if (!endlessOk) this.endless = false;
    this.endlessBtn.setLabel(
      endlessOk
        ? this.endless
          ? tx('♾️ 无尽：开', '♾️ Endless: ON')
          : tx('♾️ 无尽：关', '♾️ Endless: OFF')
        : tx('♾️ 无尽 🔒', '♾️ Endless 🔒'),
    );
    this.endlessBtn.setAlpha(endlessOk ? 1 : 0.55);
    // 危机等级：换章节时取该章上次的选择，超过解锁上限则回落
    const dMax = dangerUnlocked(this.chapter);
    this.danger = Math.min(dMax, CharSelectScene.lastDanger[this.chapter] ?? this.danger);
    this.dangerBtn.setLabel(this.danger ? tx(`危机 ${this.danger}`, `Danger ${this.danger}`) : tx('危机 0', 'Danger 0'));
    this.dangerBtn.setAlpha(dMax ? 1 : 0.55);
    const dangerLine =
      this.danger > 0
        ? '\n' +
          tx(
            `危机 ${this.danger}：${DANGER_LEVELS[this.danger - 1].desc[0]} 等 ${this.danger} 条规则 · 奖励 ×${dangerReward(this.danger)}`,
            `Danger ${this.danger}: ${DANGER_LEVELS[this.danger - 1].desc[1]} and ${this.danger - 1} more · reward ×${dangerReward(this.danger)}`,
          )
        : '';
    this.chapterText.setText(
      `${ch.name}  ${chUnlocked ? '' : '🔒'}  ${tx(`（怪物生命 x${ch.hpMult} 伤害 x${ch.dmgMult}）`, `(HP x${ch.hpMult} · DMG x${ch.dmgMult})`)}`,
    );
    const endlessBest = counter(`endlessBest:ch:${ch.id}`);
    this.chapterDesc.setText(
      !chUnlocked
        ? this.chapter === 6
          ? tx(`任意一章在番茄危机 ${CH6_DANGER_REQ} 级以上通关后解锁`, `Clear any chapter on Danger ${CH6_DANGER_REQ}+ to unlock`)
          : tx(`通关第 ${this.chapter - 1} 章解锁`, `Clear Chapter ${this.chapter - 1} to unlock`)
        : this.endless
          ? tx(
              `无尽模式：不限波数，每 15 波一轮（第 5 / 10 波精英、第 15 波 Boss），越往后怪物越强，直到倒下为止。本章最佳：第 ${endlessBest} 波`,
              `Endless: no wave limit, 15-wave cycles (elites on 5/10, a boss on 15), monsters keep getting stronger until you fall. Best here: wave ${endlessBest}`,
            )
          : ch.desc + dangerLine,
    );
    if (unlocked) {
      this.startBtn.setLabel(tx('出发！', 'Go!'));
      this.startBtn.setEnabled(chUnlocked);
    } else {
      this.startBtn.setLabel(tx('🔒 达成成就解锁', '🔒 Unlock via achievement'));
      this.startBtn.setEnabled(false);
    }
  }

  private setDanger(v: number): void {
    const max = dangerUnlocked(this.chapter);
    if (v > max) {
      toast(
        this,
        max === 0
          ? tx(`通关第 ${this.chapter} 章后开放番茄危机`, `Clear Chapter ${this.chapter} to unlock Danger levels`)
          : tx(`先在危机 ${max} 通关本章`, `Clear this chapter at Danger ${max} first`),
        '#ff6b6b',
      );
      return;
    }
    this.danger = Math.max(0, v);
    CharSelectScene.lastDanger[this.chapter] = this.danger;
    this.refresh();
  }

  /** 叠加规则一览（点危机等级按钮打开，再点关闭） */
  private showDangerRules(): void {
    if (this.dangerPanel) {
      this.dangerPanel.destroy();
      this.dangerPanel = null;
      return;
    }
    const W = this.scale.width,
      H = this.scale.height;
    const c = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
    bg.on('pointerup', () => this.showDangerRules());
    c.add(bg);
    const lv = Math.max(this.danger, 1);
    const pw = 560,
      ph = 70 + MAX_DANGER * 26;
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 0.98).fillRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 14);
    g.lineStyle(2, COLORS.gold, 1).strokeRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 14);
    c.add(g);
    c.add(
      text(
        this,
        W / 2,
        H / 2 - ph / 2 + 26,
        tx(`番茄危机 · 第 ${this.danger} 级`, `Danger · Level ${this.danger}`),
        24,
        '#ff9f1c',
      ).setOrigin(0.5),
    );
    const max = dangerUnlocked(this.chapter);
    DANGER_LEVELS.forEach((d, i) => {
      const on = d.level <= this.danger;
      const locked = d.level > max;
      const color = on ? '#ffd166' : locked ? '#6b5450' : COLORS.textDim;
      c.add(
        text(
          this,
          W / 2 - pw / 2 + 24,
          H / 2 - ph / 2 + 56 + i * 26,
          `${d.level}. ${d.icon} ${d.name[lang === 'en' ? 1 : 0]} — ${d.desc[lang === 'en' ? 1 : 0]}${locked ? ' 🔒' : ''}`,
          16,
          color,
        ),
      );
    });
    c.add(
      text(
        this,
        W / 2,
        H / 2 + ph / 2 - 16,
        tx(`奖励倍率 ×${dangerReward(lv)} · 点击任意处关闭`, `Reward ×${dangerReward(lv)} · click to close`),
        14,
        COLORS.textDim,
      ).setOrigin(0.5),
    );
    this.dangerPanel = c;
  }

  private start(): void {
    const c = this.selected;
    if (!isUnlocked(c)) {
      toast(this, unlockHint(c), '#ff6b6b');
      return;
    }
    clearRun();
    save.charRuns[this.selected.id] = (save.charRuns[this.selected.id] ?? 0) + 1;
    persist();
    checkAchievements();
    run.start(this.selected.id, this.chapter, this.endless, this.danger);
    if (this.endless) bump('endlessRuns');
    this.scene.start('Game');
  }
}
