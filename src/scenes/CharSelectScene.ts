// 角色与关卡选择
import Phaser from 'phaser';
import { portraitKey, showcaseRig } from '../ui/Portrait';
import { CHARACTERS, type CharacterDef } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { WEAPON_MAP } from '../data/weapons';
import { SKILL_TYPE_NAME } from '../data/skills';
import { describeMods } from '../data/stats';
import { save, persist, isUnlocked } from '../systems/Save';
import { pointsBalance, missingRequirement, unlockHint, tryBuyCharacter, checkAchievements } from '../systems/Achievements';
import { run, clearRun } from '../systems/RunState';
import { text, button, panel, COLORS, fitImage, hitArea, autoRelayout, toast } from '../ui/UI';
import { tx } from '../i18n';

export class CharSelectScene extends Phaser.Scene {
  private selected: CharacterDef = CHARACTERS[0];
  private chapter = 1;
  private detail!: Phaser.GameObjects.Container;
  private cards: { c: CharacterDef; g: Phaser.GameObjects.Graphics; x: number; y: number; s: number }[] = [];
  private chapterText!: Phaser.GameObjects.Text;
  private chapterDesc!: Phaser.GameObjects.Text;
  private startBtn!: ReturnType<typeof button>;
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
    text(this, W - 180, 44, tx(`成就点 🏅 ${pointsBalance()}`, `Points 🏅 ${pointsBalance()}`), 22, '#ffd166').setOrigin(1, 0.5);

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
      if (!unlocked) {
        // 未拥有：半透明显示本体，角标为价格（有未满足的前置成就时显示锁）
        img.setAlpha(0.45);
        const tag = missingRequirement(c) ? '🔒' : `🏅${c.cost}`;
        text(this, x + s - 4, y + s - 2, tag, 15, '#ffd166', { stroke: '#000000', strokeThickness: 4 }).setOrigin(1, 1);
      }
      hitArea(this, x, y, s, s, () => {
        this.selected = c;
        this.refresh();
      });
    });

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
        this.chapter = Math.min(CHAPTERS.length, this.chapter + 1);
        this.refresh();
      },
      0x7a2e35,
      28,
    );
    this.chapterText = text(this, 130, cy, '', 26, '#ffd166');
    this.chapterDesc = text(this, 130, cy + 40, '', 18, COLORS.textDim, { wordWrap: { width: W * 0.62 - 180 } });
    this.startBtn = button(this, W - 150, cy + 35, 220, 76, tx('出发！', 'Go!'), () => this.start(), COLORS.primary, 32);
    this.refresh();
  }

  private refresh(): void {
    for (const k of this.cards) {
      k.g.clear();
      const sel = k.c === this.selected;
      k.g.fillStyle(sel ? 0x7a2e35 : COLORS.panel, 1).fillRoundedRect(k.x, k.y, k.s, k.s, 12);
      k.g.lineStyle(sel ? 4 : 2, sel ? COLORS.gold : COLORS.border, 1).strokeRoundedRect(k.x, k.y, k.s, k.s, 12);
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
        text(this, 180, 104, hint, 17, unlocked ? COLORS.textDim : missingRequirement(c) ? '#ff6b6b' : '#ffd166', {
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
        ) + 4;
      const best = save.bestWave[`${c.id}_${this.chapter}`];
      if (best) add(20, y, tx(`本章最佳：第 ${best} 波`, `Best this chapter: wave ${best}`), 15, COLORS.textDim);
    }
    const ch = CHAPTERS[this.chapter - 1];
    const chUnlocked = save.clearedChapters >= this.chapter - 1;
    this.chapterText.setText(
      `${ch.name}  ${chUnlocked ? '' : '🔒'}  ${tx(`（怪物生命 x${ch.hpMult} 伤害 x${ch.dmgMult}）`, `(HP x${ch.hpMult} · DMG x${ch.dmgMult})`)}`,
    );
    this.chapterDesc.setText(chUnlocked ? ch.desc : tx(`通关第 ${this.chapter - 1} 章解锁`, `Clear Chapter ${this.chapter - 1} to unlock`));
    if (unlocked) {
      this.startBtn.setLabel(tx('出发！', 'Go!'));
      this.startBtn.setEnabled(chUnlocked);
    } else {
      this.startBtn.setLabel(tx(`购买 🏅${c.cost}`, `Buy 🏅${c.cost}`));
      this.startBtn.setEnabled(!missingRequirement(c) && pointsBalance() >= (c.cost ?? 0));
    }
  }

  private start(): void {
    const c = this.selected;
    if (!isUnlocked(c)) {
      const r = tryBuyCharacter(c);
      if (r === 'ok') {
        toast(this, tx(`获得新角色：${c.name}`, `New character: ${c.name}`), '#52ff8a');
        this.time.delayedCall(700, () => this.scene.restart());
      } else toast(this, r === 'poor' ? tx('成就点不足', 'Not enough points') : tx('尚未满足解锁条件', 'Requirement not met'), '#ff6b6b');
      return;
    }
    clearRun();
    save.charRuns[this.selected.id] = (save.charRuns[this.selected.id] ?? 0) + 1;
    persist();
    checkAchievements();
    run.start(this.selected.id, this.chapter);
    this.scene.start('Game');
  }
}
