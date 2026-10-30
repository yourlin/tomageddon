import { CharacterJournal, queueJournalArt } from '../ui/CharacterJournal';
import { requestWeaponArt } from '../systems/WeaponArtRegistry';
// 角色与关卡选择
import { bump, counter } from '../systems/Counters';
import { tip } from '../systems/Tutorial';
import Phaser from 'phaser';
import { portraitKey, showcaseRig } from '../ui/Portrait';
import { arenaThumb } from '../art/ArenaArt';
import { CHARACTERS, type CharacterDef } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { WEAPON_MAP } from '../data/weapons';
import { affinityText } from '../data/affinity';
import { SKILL_TYPE_NAME } from '../data/skills';
import { save, persist, isUnlocked } from '../systems/Save';
import { unlockHint, unlockProgress, checkAchievements, achTier, medalOf } from '../systems/Achievements';
import { ACH_MAP } from '../data/achievements';
import { run, clearRun, defaultStartWeapon } from '../systems/RunState';
import { hasCustomTalents } from '../systems/TalentTree';
import { charTraitLines, weaponDmgType } from '../data/describe';
import { favoredWeapons, doubleFavoredWeapons } from '../data/affinity';
import { TAG_MAP } from '../data/weaponTags';
import { tagName } from '../i18n/apply';
import { text, button, panel, COLORS, fitImage, hitArea, autoRelayout, toast, statLines, tu } from '../ui/UI';
import { tx, lang } from '../i18n';
import { DANGER_LEVELS, MAX_DANGER } from '../data/danger';
import { dangerReward, chapterWaves } from '../data/balance';
import { chapterAvailable, chapterCleared, chapterVisible, chapterUnlockHint } from '../systems/Danger';
import {
  questDone,
  questProgress,
  awakenUnlocked,
  awakenOn,
  awakeningOf,
  masteryLabel,
  skinOwned,
  activeSkin,
  buySkin,
  equipSkin,
} from '../systems/Progress';
import { SKINS_OF, skinName } from '../data/skins';
import { reveal } from '../systems/Reveal';
import { questsOf } from '../data/quests';
import { dangerUnlocked, dangerBest, hasGoldFrame } from '../systems/Danger';
import { VW, VH } from '../systems/HiDpi';
import { titleBadge } from '../ui/TitleBadge';

/** 未解锁角色的剪影颜色 */
const LOCKED_TINT = 0x5c5c66;

export class CharSelectScene extends Phaser.Scene {
  private journal: CharacterJournal | null = null;
  private weaponFocus = 0;
  private selected: CharacterDef = CHARACTERS[0];
  private chapter = 1;
  private detail!: Phaser.GameObjects.Container;
  private cards: { c: CharacterDef; g: Phaser.GameObjects.Graphics; x: number; y: number; s: number }[] = [];
  private chapterText!: Phaser.GameObjects.Text;
  private chThumbs: { n: number; frame: Phaser.GameObjects.Graphics; w: number; h: number; name: string }[] = [];
  private chapterDesc!: Phaser.GameObjects.Text;
  private startBtn!: ReturnType<typeof button>;
  private endlessBtn!: ReturnType<typeof button>;
  private dangerBtn!: ReturnType<typeof button>;
  /** 番茄危机等级（A4）：跨场景记住上次的选择 */
  private static lastDanger: Record<number, number> = {};
  private danger = 0;
  private dangerPanel: Phaser.GameObjects.Container | null = null;
  private weaponPanel: Phaser.GameObjects.Container | null = null;
  /** 无尽模式（通关该章后可选） */
  private endless = false;
  private showcase: ReturnType<typeof showcaseRig> | null = null;
  private detailX = 0;
  /** 详情页：0 基本信息，1 成长（熟练度/任务/觉醒/皮肤） */
  private page: 0 | 1 = 0;
  /** 详情正文超出面板时在面板内滚动（不缩小字号：手机上字本来就小）。key = 当前角色与页，换了就回到顶部 */
  private scroll = { key: '', y: 0, max: 0, top: 0, bottom: 0 };
  private scrollBody: Phaser.GameObjects.Container | null = null;
  private scrollMaskG: Phaser.GameObjects.Graphics | null = null;
  private scrollBar: Phaser.GameObjects.Graphics | null = null;
  private scrollHint: Phaser.GameObjects.Text | null = null;
  private drag: { y: number; s: number } | null = null;
  /** 本次按下后拖动过（超过 8 像素）：抬起时不触发正文里的点击（皮肤、觉醒开关） */
  private dragMoved = false;

  constructor() {
    super('CharSelect');
  }

  preload(): void {
    queueJournalArt(this);
  }

  create(data?: { chapter?: number; selectedId?: string; details?: boolean }): void {
    this.journal = null;
    this.showcase = null;
    this.weaponPanel = this.dangerPanel = null;
    if (data?.selectedId) this.selected = CHARACTERS.find((c) => c.id === data.selectedId) ?? CHARACTERS[0];
    if (data?.details) {
      this.createLegacy(data);
      const back = () => this.scene.restart({ chapter: this.chapter, selectedId: this.selected.id });
      this.input.keyboard?.on('keydown-ESC', back);
      this.events.once('shutdown', () => this.input.keyboard?.off('keydown-ESC', back));
      return;
    }
    autoRelayout(this, data);
    this.cameras.main.setBackgroundColor(0x21120d);
    this.chapter = data?.chapter ?? Math.min(save.clearedChapters + 1, CHAPTERS.length);
    this.danger = Math.min(dangerUnlocked(this.chapter), CharSelectScene.lastDanger[this.chapter] ?? this.danger);
    if (!chapterCleared(this.chapter)) this.endless = false;
    this.journal = new CharacterJournal(this, {
      character: () => this.selected,
      select: (c) => {
        this.selected = c;
        this.journal?.selectedChanged();
      },
      chapter: () => this.chapter,
      selectChapter: (n) => {
        this.chapter = n;
        this.danger = Math.min(dangerUnlocked(n), CharSelectScene.lastDanger[n] ?? 0);
        if (!chapterCleared(n)) this.endless = false;
        this.refresh();
      },
      endless: () => this.endless,
      toggleEndless: () => {
        this.endless = !this.endless;
        this.refresh();
      },
      danger: () => this.danger,
      showDanger: () => this.showDangerRules(),
      setDanger: (n) => this.setDanger(n),
      details: () => this.scene.restart({ details: true, chapter: this.chapter, selectedId: this.selected.id }),
      start: () => this.start(),
      back: () => this.scene.start('Menu'),
      modalInput: (key) => {
        if (this.dangerPanel) {
          if (key === 'b' || key === 'a') {
            this.dangerPanel.destroy();
            this.dangerPanel = null;
          } else if (key === 'left' || key === 'right') this.changeDangerInPanel(key === 'left' ? -1 : 1);
          return true;
        }
        if (!this.weaponPanel) return false;
        if (key === 'b') {
          this.weaponPanel.destroy();
          this.weaponPanel = null;
          return true;
        }
        const choices = this.weaponPanel.list.filter((o) => o.name?.startsWith('journal-weapon:')) as ReturnType<typeof button>[];
        if (key === 'left' || key === 'right')
          this.weaponFocus = (this.weaponFocus + (key === 'left' ? -1 : 1) + choices.length) % choices.length;
        if (key === 'a' || key === 'start') choices[this.weaponFocus]?.emit('pointerup');
        else choices.forEach((b, i) => b.setAlpha(i === this.weaponFocus ? 1 : 0.55));
        return true;
      },
    });
  }

  private createLegacy(data?: { chapter?: number }): void {
    autoRelayout(this);
    const W = VW(this),
      H = VH(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.weaponPanel = null;
    // 从「本章故事」回看返回时停在原来那一章
    this.chapter = data?.chapter ?? Math.min(save.clearedChapters + 1, CHAPTERS.length);
    this.cards = [];
    if (!isUnlocked(this.selected)) this.selected = CHARACTERS[0];

    const head = text(this, 30, 20, tx('选择角色', 'Choose Character'), 36).setOrigin(0, 0);
    // 佩戴中的称号：标题旁边，点击去换
    if (save.meta.title) {
      const b = titleBadge(this, 0, head.y + head.height / 2, save.meta.title, 15);
      if (b) {
        b.x = head.x + head.width + 20 + b.width / 2;
        b.setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('Title', { from: 'CharSelect' }));
      }
    }
    button(
      this,
      W - 90,
      44,
      140,
      52,
      tx('返回手册', 'Back'),
      () => this.scene.restart({ chapter: this.chapter, selectedId: this.selected.id }),
      0x555555,
      22,
    );
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
        // 未拥有：只显示灰色轮廓，角标为锁和解锁成就的完成进度
        img.setTintFill(LOCKED_TINT).setAlpha(0.85);
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
    // 详情正文滚动：滚轮 / 按住拖动（拖动超过 8 像素后抬起不触发正文里的点击）
    this.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      if (!this.inBody(p)) return;
      this.scroll.y += dy * 0.5;
      this.applyScroll();
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragMoved = false;
      this.drag = this.inBody(p) ? { y: p.worldY, s: this.scroll.y } : null;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.drag || !p.isDown) return;
      const dy = p.worldY - this.drag.y;
      if (Math.abs(dy) > 8) this.dragMoved = true;
      if (!this.dragMoved) return;
      this.scroll.y = this.drag.s - dy;
      this.applyScroll();
    });
    this.input.on('pointerup', () => (this.drag = null));

    // 章节选择
    const cy = H - 130;
    panel(this, 30, cy - 20, W - 60, 110, COLORS.panelLight);
    // 7 个章节的缩略图一字排开，点击选择；未解锁的灰色 + 🔒，隐藏章节解锁前显示「？」
    const TW = 68,
      TH = 44,
      TG = 8;
    this.chThumbs = CHAPTERS.map((chDef, idx) => {
      const n = idx + 1;
      const x = 46 + idx * (TW + TG) + TW / 2,
        y = cy + 6;
      const g = this.add.container(x, y);
      const frame = this.add.graphics();
      const img = this.add.image(0, 0, arenaThumb(this, n, TW, TH, !chapterAvailable(n))).setDisplaySize(TW, TH);
      const hidden = !chapterVisible(n);
      const badge = text(this, -TW / 2 + 4, -TH / 2 + 2, String(n), 13, '#ffffff', { stroke: '#000000', strokeThickness: 3 });
      const mark = text(this, 0, 2, hidden ? '？' : chapterAvailable(n) ? '' : '🔒', hidden ? 22 : 16, '#ffffff', {
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      g.add([img, frame, badge, mark]);
      g.setSize(TW + 6, TH + 6).setInteractive({ useHandCursor: true });
      g.on('pointerup', () => {
        if (hidden) {
          // 隐藏章节不剧透名字和内容，但把解锁条件和进度告诉玩家
          toast(this, `${tx('隐藏章节', 'Hidden chapter')} · ${chapterUnlockHint(n) ?? ''}`, '#ffd166');
          return;
        }
        if (!chapterAvailable(n)) toast(this, chapterUnlockHint(n) ?? '', '#ffd166');
        this.chapter = n;
        this.refresh();
      });
      return { n, frame, w: TW, h: TH, name: chDef.name };
    });
    this.chapterText = text(this, 46 + CHAPTERS.length * (TW + TG) + 6, cy - 6, '', 22, '#ffd166');
    this.chapterDesc = text(this, 46, cy + 34, '', 16, COLORS.textDim, { wordWrap: { width: W * 0.62 - 10 - 46 } });
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
    const dPrev = button(this, dx - 66, cy + 60, 36, 38, '◀', () => this.setDanger(this.danger - 1), 0x7a2e35, 18);
    this.dangerBtn = button(this, dx, cy + 60, 90, 38, '', () => this.showDangerRules(), 0x9d0208, 17);
    const dNext = button(this, dx + 66, cy + 60, 36, 38, '▶', () => this.setDanger(this.danger + 1), 0x7a2e35, 18);
    // 无尽、危机在首次通关前不显示（见 systems/Reveal）
    this.endlessBtn.setVisible(reveal.endless());
    for (const b of [dPrev, this.dangerBtn, dNext]) b.setVisible(reveal.danger());
    this.startBtn = button(this, W - 150, cy + 35, 220, 76, tx('出发！', 'Go!'), () => this.start(), COLORS.primary, 32);
    this.refresh();
  }

  /** 详情正文滚动到 this.scroll.y：移动正文、更新滚动条与提示；滚出可视区的可点击文字关掉点击（遮罩挡不住点击判定） */
  private applyScroll(): void {
    const body = this.scrollBody;
    if (!body) return;
    const sc = this.scroll;
    sc.y = Phaser.Math.Clamp(sc.y, 0, sc.max);
    body.y = -sc.y;
    for (const o of body.list as Phaser.GameObjects.Text[]) {
      if (!o.input) continue;
      const y0 = o.y - sc.y;
      o.input.enabled = y0 >= sc.top - 2 && y0 + o.height <= sc.bottom + 2;
    }
    const pw = VW(this) * 0.5 - 40;
    const h = sc.bottom - sc.top;
    const barH = Math.max(30, (h * h) / (h + sc.max));
    const barY = sc.top + ((h - barH) * sc.y) / sc.max;
    this.scrollBar
      ?.clear()
      .fillStyle(0xffffff, 0.12)
      .fillRoundedRect(pw - 10, sc.top, 5, h, 2.5)
      .fillStyle(0x9bf6ff, 0.75)
      .fillRoundedRect(pw - 10, barY, 5, barH, 2.5);
    this.scrollHint?.setVisible(sc.y < sc.max - 4);
  }

  /** 指针是否在详情正文区域里（逻辑坐标） */
  private inBody(p: Phaser.Input.Pointer): boolean {
    const pw = VW(this) * 0.5 - 40;
    const x = p.worldX - this.detailX,
      y = p.worldY - this.detail.y;
    return !!this.scrollBody && x >= 0 && x <= pw && y >= this.scroll.top && y <= this.scroll.bottom;
  }

  private refresh(): void {
    if (this.journal) {
      this.journal.refresh();
      return;
    }
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
    this.scrollBody = this.scrollBar = this.scrollHint = null;
    this.scrollMaskG?.destroy();
    this.scrollMaskG = null;
    const pw = VW(this) * 0.5 - 40;
    this.showcase?.destroy();
    this.showcase = null;
    if (!unlocked) {
      // 未解锁：灰色轮廓 + 解锁条件与进度，不展示天赋、特性、技能、成长等详情
      d.add(
        fitImage(this.add.image(90, 110, portraitKey(this, 'char', c.id)), 150)
          .setTintFill(LOCKED_TINT)
          .setAlpha(0.9),
      );
      d.add(text(this, 90, 110, '🔒', 40).setOrigin(0.5));
      d.add(text(this, 180, 24, c.name, 34, '#9a9aa6'));
      d.add(text(this, 180, 76, tx('解锁条件', 'How to unlock'), 21, '#ffd166'));
      d.add(text(this, 180, 108, unlockHint(c), 18, '#fff4ea', { wordWrap: { width: pw - 210, useAdvancedWrap: true } }));
      const p = unlockProgress(c);
      const ratio = Math.min(1, p.goal > 0 ? p.value / p.goal : 0);
      const bw = pw - 210,
        by = 200;
      const bar = this.add.graphics();
      bar.fillStyle(0x000000, 0.45).fillRoundedRect(180, by, bw, 18, 9);
      if (ratio > 0) bar.fillStyle(0xffd166, 1).fillRoundedRect(180, by, Math.max(18, bw * ratio), 18, 9);
      d.add(bar);
      d.add(
        text(this, 180 + bw / 2, by + 9, `${Math.min(p.value, p.goal)} / ${p.goal}（${Math.floor(ratio * 100)}%）`, 14, '#ffffff', {
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5),
      );
    } else {
      // 外部美术按需加载：加载完成时若仍选着这名角色，重新排版详情（新外观的外框尺寸不同）
      this.showcase = showcaseRig(this, 'char', c.id, this.detailX + 90, 90 + 110, 62, activeSkin(c.id), () => {
        if (this.selected === c && this.scene.isActive()) this.refresh();
      });
      this.showcase.setDepth(10);
      // 体型大 / 配件多的角色：按实际外框等比缩小，再居中到左上角的头像区（宽 160 × 高 160，
      // 面板内 x 10~170、y 6~166），不压到右侧名字与下方天赋
      const sc = this.showcase;
      const b0 = sc.getBounds();
      const k = Math.min(1, 160 / Math.max(1, b0.width), 160 / Math.max(1, b0.height));
      if (k < 1) sc.setScale(sc.scaleX * k);
      const b = sc.getBounds();
      sc.setPosition(sc.x + (this.detailX + 90 - b.centerX), sc.y + (90 + 86 - b.centerY));
      d.add(text(this, 180, 24, c.name, 34, '#ffffff'));
      d.add(text(this, 180, 70, c.title, 20, '#ffd166'));
    }
    if (unlocked) {
      const hint = c.desc;
      d.add(
        text(this, 180, 104, hint, 17, COLORS.textDim, {
          wordWrap: { width: pw - 200, useAdvancedWrap: true },
        }),
      );
      // 各段按实际文字高度依次排列，特性分两列，避免长文本溢出面板
      const add = (x: number, yy: number, str: string, size: number, color: string, wrap = 0) => {
        const t = text(this, x, yy, str, size, color, wrap ? { wordWrap: { width: wrap, useAdvancedWrap: true } } : {});
        d.add(t);
        return t.height;
      };
      // 多行逐行上色（负向属性红色），返回总高度
      const addLines = (x: number, yy: number, lines: string[], size: number, color: string, wrap: number) => {
        const r = statLines(this, x, yy, lines, size, color, wrap);
        d.add(r.box);
        return r.height;
      };
      // 详情分两页：基本（天赋/特性/技能/武器）与成长（战绩/熟练度/任务/觉醒/皮肤），内容多时不会溢出面板
      const pageBtn = text(this, pw - 20, 24, this.page === 0 ? tx('成长 ▸', 'Progress ▸') : tx('◂ 基本', '◂ Basics'), 18, '#9bf6ff')
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      pageBtn.on('pointerup', () => {
        this.page = this.page === 0 ? 1 : 0;
        this.refresh();
      });
      d.add(pageBtn);
      let y = 172;
      const bodyFrom = d.length; // 从这里开始是正文（两页的内容），超出面板时整体缩小
      if (this.page === 0) {
        y += add(20, y, tx(`天赋 · ${c.talent.name}`, `Talent · ${c.talent.name}`), 21, '#ffd166') + 4;
        y += add(30, y, c.talent.desc, 16, '#fff4ea', pw - 60) + 10;
        y += add(20, y, tx('属性与特性', 'Stats & traits'), 21, '#ffb347') + 4;
        const traits = charTraitLines(c);
        const half = Math.ceil(traits.length / 2);
        const colW = (pw - 60) / 2;
        const hL = addLines(
          30,
          y,
          traits.slice(0, half).map((t) => '•\u00a0' + t), // 不换行空格：圆点和正文连在一起，不会单独占一行
          16,
          '#fff4ea',
          colW - 10,
        );
        const hR =
          traits.length > 1
            ? addLines(
                30 + colW,
                y,
                traits.slice(half).map((t) => '•\u00a0' + t),
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
            tx('初始武器：契合武器三选一', 'Start: pick 1 of 3 synergy weapons') +
              ' · ' +
              (hasCustomTalents(c.id) ? tx('天赋：专属方案', 'Talents: custom') : tx('天赋：继承默认方案', 'Talents: default')),
            16,
            '#9be564',
            pw - 40,
          ) + 2;
        y +=
          add(
            20,
            y,
            tx('契合标签（伤害 +10%）：', 'Synergy tags (+10% dmg): ') +
              c.favored.map((t) => `${TAG_MAP[t]?.icon ?? ''}${tagName(t)}`).join(tx('、', ', ')) +
              tx(
                `（契合 ${favoredWeapons(c).length} 把 · 双契合 ${doubleFavoredWeapons(c).length} 把）`,
                ` (${favoredWeapons(c).length} weapons · ${doubleFavoredWeapons(c).length} double)`,
              ),
            16,
            '#ffd166',
            pw - 40,
          ) + 2;
        y += add(30, y, tx('契合特效：', 'Synergy effect: ') + affinityText(c.id), 15, '#ffe8a3', pw - 60) + 4;
      }
      if (this.page === 1) {
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
              if (this.dragMoved) return;
              save.meta.awaken[c.id] = !on;
              persist();
              this.refresh();
            });
          d.add(t);
          y += t.height + 2;
        }
        // F6：皮肤（每名角色 4 套，金番茄购买；第 1 套熟练度 10 级免费）：原皮 + 各套各一行，点击换上 / 购买
        const skins = SKINS_OF[c.id] ?? [];
        if (skins.length && unlocked && reveal.skins()) {
          const cur = activeSkin(c.id);
          d.add(
            text(this, 20, y, tx(`🎨 皮肤（拥有 🥇${save.meta.gold} 金番茄）`, `🎨 Skins (you have 🥇${save.meta.gold})`), 14, '#ffb347'),
          );
          y += 20;
          const rows: { id: string; label: string; color: string }[] = [
            { id: '', label: tx('原皮', 'Original'), color: cur ? '#fff4ea' : '#ffd166' },
            ...skins.map((sk, k) => {
              const owned = skinOwned(sk.id);
              const name = skinName(sk, lang === 'en');
              const free = k === 0 ? tx('，熟练度 10 级免费', '; free at Mastery 10') : '';
              return {
                id: sk.id,
                label: owned ? name : tx(`${name}  🥇${sk.price}${free}`, `${name}  🥇${sk.price}${free}`),
                color: cur?.id === sk.id ? '#ffd166' : owned ? '#fff4ea' : save.meta.gold >= sk.price ? '#52ff8a' : '#888888',
              };
            }),
          ];
          for (const r of rows) {
            const on = (cur?.id ?? '') === r.id;
            const st = text(this, 30, y, `${on ? '▶ ' : '· '}${r.label}${on ? tx('（使用中）', ' (equipped)') : ''}`, 14, r.color, {
              wordWrap: { width: pw - 50, useAdvancedWrap: true },
            }).setInteractive({ useHandCursor: true });
            st.on('pointerup', () => {
              if (this.dragMoved) return;
              if (!r.id || skinOwned(r.id)) equipSkin(c.id, r.id);
              else if (!buySkin(r.id)) return toast(this, tx('金番茄不够', 'Not enough Golden Tomatoes'), '#ff6b6b');
              persist();
              this.refresh();
            });
            d.add(st);
            y += st.height + 2;
          }
        }
      }
      // 正文超出面板（高 VH − 250）时改为在面板内滚动：拖动 / 滚轮，右侧滚动条，底部「▼」提示还有内容
      const key = `${c.id}:${this.page}`;
      if (this.scroll.key !== key) this.scroll = { ...this.scroll, key, y: 0 };
      const top = 168,
        bottom = VH(this) - 250 - 10;
      this.scroll.max = Math.max(0, y - bottom);
      if (this.scroll.max > 0) {
        Object.assign(this.scroll, { top, bottom });
        const body = this.add.container(0, 0);
        for (const o of d.list.slice(bodyFrom)) {
          d.remove(o);
          body.add(o);
        }
        d.add(body);
        this.scrollMaskG = this.make
          .graphics({}, false)
          .fillStyle(0xffffff)
          .fillRect(this.detailX, d.y + top, pw, bottom - top);
        body.setMask(this.scrollMaskG.createGeometryMask());
        this.scrollBar = this.add.graphics();
        this.scrollHint = text(this, pw - 18, bottom - 2, tx('▼ 拖动查看更多', '▼ Drag for more'), tu(14), '#9bf6ff', {
          backgroundColor: '#2b1418',
          padding: { x: 6, y: 2 },
        }).setOrigin(1, 1);
        d.add([this.scrollBar, this.scrollHint]);
        this.scrollBody = body;
        this.applyScroll();
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
    // 缩略图选中框
    for (const t of this.chThumbs)
      t.frame
        .clear()
        .lineStyle(t.n === this.chapter ? 3 : 1.5, t.n === this.chapter ? 0xffd166 : 0x000000, t.n === this.chapter ? 1 : 0.6)
        .strokeRoundedRect(-t.w / 2 - 2, -t.h / 2 - 2, t.w + 4, t.h + 4, 5);
    this.chapterText.setText(`${ch.name}${chUnlocked ? '' : ' 🔒'}`);
    // 英文章节名较长：超出到无尽 / 危机按钮前的宽度就缩小字号（最小 15）
    const room = VW(this) * 0.62 + 36 - this.chapterText.x;
    this.chapterText.setFontSize(22);
    for (let fs = 21; this.chapterText.width > room && fs >= 15; fs--) this.chapterText.setFontSize(fs);
    const mult = tx(`怪物生命 x${ch.hpMult} 伤害 x${ch.dmgMult} · `, `HP x${ch.hpMult} · DMG x${ch.dmgMult} · `);
    const endlessBest = counter(`endlessBest:ch:${ch.id}`);
    this.chapterDesc.setText(
      !chUnlocked
        ? (chapterUnlockHint(this.chapter) ?? '')
        : this.endless
          ? tx(
              `无尽模式：打完本章 ${chapterWaves(this.chapter)} 波后不限波数，每 15 波一轮（第 5 / 10 波精英、第 15 波 Boss），越往后怪物越强，直到倒下为止。本章最佳：第 ${endlessBest} 波`,
              `Endless: after this chapter's ${chapterWaves(this.chapter)} waves there is no limit, in 15-wave cycles (elites on 5/10, a boss on 15); monsters keep getting stronger until you fall. Best here: wave ${endlessBest}`,
            )
          : mult + ch.desc + dangerLine,
    );
    if (unlocked) {
      this.startBtn.setLabel(tx('出发！', 'Go!'));
      this.startBtn.setEnabled(chUnlocked);
    } else {
      this.startBtn.setLabel(tx('🔒 未解锁', '🔒 Locked'));
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

  private changeDangerInPanel(delta: number): void {
    this.setDanger(Math.max(0, this.danger + delta));
    this.dangerPanel?.destroy();
    this.dangerPanel = null;
    this.showDangerRules();
  }

  /** 叠加规则一览（点危机等级按钮打开，再点关闭） */
  private showDangerRules(): void {
    if (this.dangerPanel) {
      this.dangerPanel.destroy();
      this.dangerPanel = null;
      return;
    }
    const W = VW(this),
      H = VH(this);
    const c = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
    bg.on('pointerup', () => this.showDangerRules());
    c.add(bg);
    const lv = this.danger;
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
    c.add(button(this, W / 2 - 230, H / 2 - ph / 2 + 25, 42, 32, '−', () => this.changeDangerInPanel(-1), 0x654734, 22));
    c.add(button(this, W / 2 + 230, H / 2 - ph / 2 + 25, 42, 32, '+', () => this.changeDangerInPanel(1), 0x654734, 22));
    const max = dangerUnlocked(this.chapter);
    // 只列已解锁的等级，下一级显示为「？？？」（不提前剧透后面的规则）
    DANGER_LEVELS.filter((d) => d.level <= max + 1).forEach((d, i) => {
      const on = d.level <= this.danger;
      const locked = d.level > max;
      const color = on ? '#ffd166' : locked ? '#6b5450' : COLORS.textDim;
      c.add(
        text(
          this,
          W / 2 - pw / 2 + 24,
          H / 2 - ph / 2 + 56 + i * 26,
          locked
            ? tx(
                `${d.level}. ？？？ — 通关危机 ${max} 后揭晓${DANGER_LEVELS.length - max - 1 > 0 ? `（之后还有 ${DANGER_LEVELS.length - max - 1} 级）` : ''}`,
                `${d.level}. ??? — clear Danger ${max} to reveal${DANGER_LEVELS.length - max - 1 > 0 ? ` (${DANGER_LEVELS.length - max - 1} more after)` : ''}`,
              )
            : `${d.level}. ${d.icon} ${d.name[lang === 'en' ? 1 : 0]} — ${d.desc[lang === 'en' ? 1 : 0]}`,
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
        tx(`奖励倍率 ×${dangerReward(lv)} · 左右调整 · A/B 关闭`, `Reward ×${dangerReward(lv)} · Left/Right adjust · A/B close`),
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
    this.showWeaponPick();
  }

  /** 开局武器：从角色的 3 把契合武器里选 1 把（点空白处取消） */
  private showWeaponPick(): void {
    this.weaponPanel?.destroy();
    const ch = this.selected;
    const W = VW(this),
      H = VH(this);
    const c = this.add.container(0, 0).setDepth(100);
    this.weaponPanel = c;
    this.weaponFocus = 0;
    const close = () => {
      c.destroy();
      if (this.weaponPanel === c) this.weaponPanel = null;
    };
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setInteractive();
    bg.on('pointerup', close);
    c.add(bg);
    c.add(text(this, W / 2, H / 2 - 230, tx('选择开局武器', 'Choose your starting weapon'), 30, '#ffd166').setOrigin(0.5));
    c.add(
      text(
        this,
        W / 2,
        H / 2 - 192,
        tx('从契合标签的武器里随机 3 把，三选一（契合武器伤害 +10%）', 'Pick one of 3 random synergy-tag weapons (+10% damage)'),
        16,
        COLORS.textDim,
      ).setOrigin(0.5),
    );
    const cw = 250,
      chh = 330,
      gap = 24;
    // 从契合标签的全部武器里随机 3 把（上一局选过的那把保留在第一个）
    const pool = favoredWeapons(ch).filter((w) => !w.minTier);
    const prev = pool.some((w) => w.id === run.startWeaponId) ? run.startWeaponId : defaultStartWeapon(ch);
    const rest = Phaser.Utils.Array.Shuffle(pool.filter((w) => w.id !== prev).map((w) => w.id));
    const picks = [prev, ...rest].slice(0, 3);
    requestWeaponArt(this, new Set(picks));
    picks.forEach((id, i) => {
      const d = WEAPON_MAP[id];
      const x = W / 2 + (i - 1) * (cw + gap) - cw / 2,
        y = H / 2 - 160;
      const dt = weaponDmgType(d);
      c.add(panel(this, x, y, cw, chh, COLORS.panel, id === prev ? COLORS.gold : 0x6b5450));
      c.add(fitImage(this.add.image(x + 24, y + 24, dt.icon), 34));
      c.add(
        fitImage(this.add.image(x + cw / 2, y + 70, this.textures.exists(`icon_weapon_${id}`) ? `icon_weapon_${id}` : `weapon_${id}`), 84),
      );
      c.add(text(this, x + cw / 2, y + 128, d.name, 22, '#fff4ea').setOrigin(0.5));
      c.add(text(this, x + cw / 2, y + 152, tx(`${dt.name}武器`, `${dt.name} Weapon`), 14, dt.color).setOrigin(0.5));
      c.add(
        text(
          this,
          x + 14,
          y + 176,
          [
            tx(
              `伤害 ${d.damage[0]}  冷却 ${d.cooldown[0]}s  射程 ${d.range}`,
              `DMG ${d.damage[0]}  CD ${d.cooldown[0]}s  Range ${d.range}`,
            ),
            d.desc,
          ].join('\n'),
          14,
          '#fff4ea',
          { wordWrap: { width: cw - 28, useAdvancedWrap: true }, lineSpacing: 3 },
        ),
      );
      c.add(
        button(this, x + cw / 2, y + chh - 32, cw - 40, 44, tx('选择', 'Pick'), () => this.begin(id), COLORS.green, 20).setName(
          `journal-weapon:${id}`,
        ),
      );
    });
  }

  private begin(startWeapon: string): void {
    this.weaponPanel?.destroy();
    this.weaponPanel = null;
    clearRun();
    save.charRuns[this.selected.id] = (save.charRuns[this.selected.id] ?? 0) + 1;
    persist();
    checkAchievements();
    run.start(this.selected.id, this.chapter, this.endless, this.danger, startWeapon);
    if (this.endless) bump('endlessRuns');
    // 每次新开一局都展示本章开场；看过记录只作收藏标记，玩家可在漫画页主动跳过。
    this.scene.start('Comic', { ch: this.chapter, next: 'Game' });
  }
}
