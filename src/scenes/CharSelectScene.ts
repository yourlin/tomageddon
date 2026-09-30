// 角色与关卡选择
import Phaser from 'phaser';
import { portraitKey, showcaseRig } from '../ui/Portrait';
import { CHARACTERS, type CharacterDef } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { WEAPON_MAP } from '../data/weapons';
import { SKILL_TYPE_NAME } from '../data/skills';
import { describeMods } from '../data/stats';
import { save, isUnlocked } from '../systems/Save';
import { run, clearRun } from '../systems/RunState';
import { text, button, panel, COLORS, fitImage, hitArea, autoRelayout } from '../ui/UI';
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
        img.setTint(0x000000).setAlpha(0.6);
        text(this, x + s / 2, y + s / 2, '?', 40).setOrigin(0.5);
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
    if (!unlocked) this.showcase.setStatusTint(0x000000);
    this.showcase.setDepth(10);
    d.add(text(this, 180, 24, unlocked ? c.name : '？？？', 34, '#ffffff'));
    d.add(text(this, 180, 70, unlocked ? c.title : (c.unlock?.text ?? ''), 20, unlocked ? '#ffd166' : '#ff6b6b'));
    if (unlocked) {
      d.add(text(this, 180, 104, c.desc, 17, COLORS.textDim, { wordWrap: { width: pw - 200 } }));
      let y = 190;
      d.add(text(this, 20, y, tx('特性', 'Traits'), 22, '#ffb347'));
      y += 32;
      const traits = [...c.traits];
      if (!traits.length) traits.push(...describeMods(c.mods));
      d.add(text(this, 30, y, traits.map((t) => '• ' + t).join('\n'), 18, '#fff4ea', { lineSpacing: 4 }));
      y += traits.length * 26 + 12;
      d.add(
        text(
          this,
          20,
          y,
          tx(
            `技能：${c.skill.name}【${SKILL_TYPE_NAME[c.skill.type]}】冷却 ${c.skill.cd} 秒`,
            `Skill: ${c.skill.name} [${SKILL_TYPE_NAME[c.skill.type]}] cooldown ${c.skill.cd}s`,
          ),
          20,
          '#6ec6ff',
        ),
      );
      y += 30;
      d.add(text(this, 30, y, c.skill.desc, 17, '#fff4ea', { wordWrap: { width: pw - 60 } }));
      y += 50;
      d.add(
        text(
          this,
          20,
          y,
          tx('初始武器：', 'Starting weapons: ') + c.startWeapons.map((w) => WEAPON_MAP[w].name).join(tx('、', ', ')),
          18,
          '#9be564',
        ),
      );
      const best = save.bestWave[`${c.id}_${this.chapter}`];
      if (best) d.add(text(this, 20, y + 30, tx(`本章最佳：第 ${best} 波`, `Best this chapter: wave ${best}`), 16, COLORS.textDim));
    }
    const ch = CHAPTERS[this.chapter - 1];
    const chUnlocked = save.clearedChapters >= this.chapter - 1;
    this.chapterText.setText(
      `${ch.name}  ${chUnlocked ? '' : '🔒'}  ${tx(`（怪物生命 x${ch.hpMult} 伤害 x${ch.dmgMult}）`, `(HP x${ch.hpMult} · DMG x${ch.dmgMult})`)}`,
    );
    this.chapterDesc.setText(chUnlocked ? ch.desc : tx(`通关第 ${this.chapter - 1} 章解锁`, `Clear Chapter ${this.chapter - 1} to unlock`));
    this.startBtn.setEnabled(unlocked && chUnlocked);
  }

  private start(): void {
    clearRun();
    run.start(this.selected.id, this.chapter);
    this.scene.start('Game');
  }
}
