import Phaser from 'phaser';
import { CHARACTERS, type CharacterDef } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { SKINS_OF, skinName, type SkinDef } from '../data/skins';
import { persist, isUnlocked } from '../systems/Save';
import { activeSkin, skinOwned, equipSkin, buySkin } from '../systems/Progress';
import { skinsEnabled } from '../systems/Features';
import { chapterAvailable, chapterCleared, chapterUnlockHint, chapterVisible } from '../systems/Danger';
import { unlockHint, unlockProgress } from '../systems/Achievements';
import { currentGraphicsProfile } from '../systems/GraphicsQuality';
import { RUNTIME_ART_URLS } from '../systems/RuntimeArt';
import { retainSceneTexture } from '../systems/SceneArtLease';
import { portraitKey, showcaseRig } from './Portrait';
import { text, button, fitImage, toast } from './UI';
import { tx, lang } from '../i18n';
import { VW, VH } from '../systems/HiDpi';
import { charTraitLines } from '../data/describe';
import { WEAPON_MAP } from '../data/weapons';
import { defaultStartWeapon } from '../systems/RunState';
import { arenaThumb } from '../art/ArenaArt';

export function queueJournalArt(scene: Phaser.Scene): void {
  const tier = currentGraphicsProfile().tier;
  for (const part of ['background', 'stage']) {
    const key = `journal:${part}:${tier}`,
      url = RUNTIME_ART_URLS[`effects/ui/journal/${part}-${tier}.png`];
    if (!url) continue;
    retainSceneTexture(scene, key, (active, unused) => {
      if (active.textures.exists(unused)) active.textures.remove(unused);
    });
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}

export interface JournalActions {
  character: () => CharacterDef;
  select: (c: CharacterDef) => void;
  chapter: () => number;
  selectChapter: (n: number) => void;
  endless: () => boolean;
  toggleEndless: () => void;
  danger: () => number;
  showDanger: () => void;
  setDanger: (n: number) => void;
  details: () => void;
  start: () => void;
  back: () => void;
  modalInput: (key: string) => boolean;
}
type Group = 'roster' | 'skins' | 'chapters' | 'mode' | 'start';
interface Focus {
  group: Group;
  index: number;
}
interface Target {
  group: Group;
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  act: () => void;
}
const INK = '#542a20';

/** The journal owns presentation and navigation; progression and run setup stay in the existing scene. */
export class CharacterJournal {
  private root?: Phaser.GameObjects.Container;
  private hero?: ReturnType<typeof showcaseRig>;
  private targets: Target[] = [];
  private focus: Focus = { group: 'roster', index: 0 };
  private page = 0;
  private skinIndex = 0;
  private skinOffset = 0;
  private previewSkin?: SkinDef;
  private previewing = false;
  /** 皮肤玩法未开放时，整块换肤区与 LT/RT 翻皮肤都不出现 */
  private readonly skins = skinsEnabled();
  /** 不画换肤区时，腾出来的半页用来多放一行角色 */
  private readonly perPage = this.skins ? 18 : 24;
  private prev = new Set<number>();
  private nextMove = 0;
  private padConnected = false;
  private compact = Math.min(window.innerWidth, window.innerHeight) < 500;
  private focusGfx?: Phaser.GameObjects.Graphics;
  private keyListener: (e: KeyboardEvent) => void;
  constructor(
    private scene: Phaser.Scene,
    private actions: JournalActions,
  ) {
    const index = CHARACTERS.indexOf(actions.character());
    this.page = Math.floor(index / this.perPage);
    this.focus.index = index;
    this.resetSkin();
    this.keyListener = (e) => {
      const k = (
        {
          ArrowLeft: 'left',
          ArrowRight: 'right',
          ArrowUp: 'up',
          ArrowDown: 'down',
          Enter: 'a',
          Escape: 'b',
          x: 'details',
          X: 'details',
          y: 'details',
          Y: 'details',
          PageUp: 'lb',
          PageDown: 'rb',
          '[': 'lt',
          ']': 'rt',
          ' ': 'start',
          Tab: 'tab',
        } as Record<string, string>
      )[e.key];
      if (k) {
        e.preventDefault();
        this.input(k);
      }
    };
    scene.input.keyboard?.on('keydown', this.keyListener);
    const update = () => this.pollPad();
    scene.events.on('update', update);
    scene.events.once('shutdown', () => {
      scene.input.keyboard?.off('keydown', this.keyListener);
      scene.events.off('update', update);
      this.hero?.destroy();
    });
    this.refresh();
  }
  private resetSkin(): void {
    this.previewSkin = activeSkin(this.actions.character().id);
    this.skinIndex = this.previewSkin
      ? (SKINS_OF[this.actions.character().id] ?? []).findIndex((s) => s.id === this.previewSkin!.id) + 1
      : 0;
    this.skinOffset = Math.max(0, this.skinIndex - 3);
    this.previewing = false;
  }
  selectedChanged(): void {
    this.resetSkin();
    this.refresh();
  }
  private label(x: number, y: number, copy: string, size = 18, color = INK, wrap = 0): Phaser.GameObjects.Text {
    const t = text(this.scene, x, y, copy, this.compact ? Math.max(size, 20) : size, color, {
      strokeThickness: 0,
      ...(wrap ? { wordWrap: { width: wrap, useAdvancedWrap: true } } : {}),
    });
    this.root!.add(t);
    return t;
  }
  private control(
    x: number,
    y: number,
    w: number,
    h: number,
    copy: string,
    act: () => void,
    color = 0x854636,
    name?: string,
  ): ReturnType<typeof button> {
    const b = button(this.scene, x, y, w, h, copy, act, color, this.compact ? Math.min(24, h * 0.65) : Math.min(21, h * 0.4));
    if (name) b.setName(name);
    this.root!.add(b);
    return b;
  }
  private target(t: Target): void {
    this.targets.push(t);
    const hit = this.scene.add.zone(t.x, t.y, t.w, t.h).setInteractive({ useHandCursor: true });
    hit.setName(`journal-${t.group}:${t.index}`);
    hit.on('pointerup', () => {
      this.focus = { group: t.group, index: t.index };
      t.act();
      this.paintFocus();
    });
    this.root!.add(hit);
  }
  refresh(): void {
    this.hero?.destroy();
    this.hero = undefined;
    this.root?.destroy();
    this.targets = [];
    const scale = Math.min(VW(this.scene) / 1280, VH(this.scene) / 720);
    const root = this.scene.add
      .container((VW(this.scene) - 1280 * scale) / 2, (VH(this.scene) - 720 * scale) / 2)
      .setScale(scale)
      .setName('character-journal');
    this.root = root;
    const tier = currentGraphicsProfile().tier;
    if (this.scene.textures.exists(`journal:background:${tier}`))
      root.add(this.scene.add.image(640, 360, `journal:background:${tier}`).setDisplaySize(1280, 720));
    const stage = `journal:stage:${tier}`;
    if (this.scene.textures.exists(stage)) root.add(this.scene.add.image(330, 266, stage).setDisplaySize(530, 345));
    const c = this.actions.character(),
      unlocked = isUnlocked(c);
    this.label(72, 54, c.name, 38, '#5b211b').setFontStyle('bold');
    this.label(74, 101, c.title, 22, '#9d5a20');
    if (!this.compact) this.label(74, 137, unlocked ? c.desc : unlockHint(c), 16, INK, 165);
    const preview = this.previewSkin;
    const hero = showcaseRig(this.scene, 'char', c.id, 380, 335, 142, preview, () => {
      if (this.scene.scene.isActive() && this.actions.character() === c && this.previewSkin === preview) this.refresh();
    });
    const bounds = hero.getBounds(),
      fit = Math.min(1, 328 / Math.max(1, bounds.width), 316 / Math.max(1, bounds.height));
    hero.setScale(hero.scaleX * fit);
    const fitted = hero.getBounds();
    hero.setPosition(hero.x + 366 - fitted.centerX, hero.y + 288 - fitted.centerY);
    if (!unlocked) hero.setAlpha(0.28);
    root.add(hero);
    this.hero = hero;
    if (!unlocked) {
      const p = unlockProgress(c);
      this.label(
        130,
        397,
        tx(`未解锁 · ${Math.min(p.value, p.goal)}/${p.goal}`, `Locked · ${Math.min(p.value, p.goal)}/${p.goal}`),
        20,
        '#783d2a',
      );
    } else if (this.previewing) {
      this.label(
        74,
        398,
        tx(
          `试穿预览：${preview ? skinName(preview, false) : '原皮'}（尚未装备）`,
          `Preview: ${preview ? skinName(preview, true) : 'Original'} (not equipped)`,
        ),
        17,
        '#764125',
        500,
      );
    }
    if (unlocked) {
      this.label(74, 447, tx(`天赋  ${c.talent.name}`, `Talent  ${c.talent.name}`), 20, '#7a271c').setFontStyle('bold');
      if (!this.compact) this.label(74, 476, c.talent.desc, 15, INK, 350);
      else this.label(74, 481, tx('Y 详情：查看天赋与技能说明', 'Y Details: talent and skill'), 21, INK, 350);
      this.label(74, 524, tx(`技能  ${c.skill.name}`, `Skill  ${c.skill.name}`), 20, '#1e5261').setFontStyle('bold');
      const skillCopy = this.label(
        74,
        548,
        this.compact ? tx('普通攻击由武器自动施放', 'Weapons attack automatically') : c.skill.desc,
        14,
        INK,
        350,
      );
      if (skillCopy.height > 36) skillCopy.setScale(Math.min(1, 36 / skillCopy.height));
      this.label(455, 447, tx('基础属性', 'Stats'), 18, INK).setFontStyle('bold');
      this.label(455, 477, charTraitLines(c).slice(0, 2).join('\n'), 15, INK, 155);
      this.label(455, 531, tx('初始武器', 'Starting weapon'), 16, INK);
      this.label(455, 554, WEAPON_MAP[defaultStartWeapon(c)]?.name ?? '', 17, INK, 155);
    }
    this.drawRoster();
    this.drawSkins();
    this.drawChapters();
    this.control(1085, 568, 130, 35, tx('Y 详情', 'Y Details'), this.actions.details, 0x926b47, 'journal-details');
    this.control(1180, 33, 110, 34, tx('B 返回', 'B Back'), this.actions.back, 0x78452d, 'journal-back');
    const skinHint = this.skins ? tx('   LT/RT 皮肤', '   LT/RT Skins') : '';
    this.label(
      640,
      704,
      this.compact
        ? tx(
            `方向键 导航   A 选择   B 返回   LB/RB 翻页${skinHint}   Start 出发`,
            `Navigate   A Select   B Back   LB/RB Pages${skinHint}   Start Go`,
          )
        : tx(
            `方向键 / 左摇杆 导航    A 选择    B 返回    LB/RB 角色页${skinHint}    Start 出发`,
            `D-pad / Stick Navigate    A Select    B Back    LB/RB Roster${skinHint}    Start Go`,
          ),
      15,
      '#ffe3ad',
    )
      .setFontSize(15)
      .setOrigin(0.5);
    this.focusGfx = this.scene.add.graphics().setDepth(20);
    root.add(this.focusGfx);
    this.paintFocus();
  }
  private drawRoster(): void {
    const owned = CHARACTERS.filter(isUnlocked).length;
    this.label(
      708,
      49,
      tx(`选择角色  已解锁 ${owned}/${CHARACTERS.length}`, `Choose hero  ${owned}/${CHARACTERS.length}`),
      24,
      '#5b211b',
    ).setFontStyle('bold');
    const rows = Math.ceil(this.perPage / 6),
      midY = 117 + (rows - 1) * 44;
    this.control(680, midY, 38, 58, 'LB', () => this.turnPage(-1), 0x914b34, 'journal-roster-prev');
    this.control(1200, midY, 38, 58, 'RB', () => this.turnPage(1), 0x914b34, 'journal-roster-next');
    CHARACTERS.slice(this.page * this.perPage, this.page * this.perPage + this.perPage).forEach((c, i) => {
      const x = 742 + (i % 6) * 78,
        y = 117 + Math.floor(i / 6) * 88,
        sel = c === this.actions.character(),
        owned = isUnlocked(c);
      const frame = this.scene.add.graphics();
      frame.fillStyle(sel ? 0xe5b564 : 0x5d3c31, sel ? 0.95 : 0.92).fillRoundedRect(x - 35, y - 35, 70, 70, 8);
      frame.lineStyle(sel ? 3 : 1.5, sel ? 0xe78c20 : 0xa47a60, 1).strokeRoundedRect(x - 35, y - 35, 70, 70, 8);
      this.root!.add(frame);
      const img = fitImage(this.scene.add.image(x, y - 2, portraitKey(this.scene, 'char', c.id)), 61);
      if (!owned) img.setTintFill(0x392c2c).setAlpha(0.82);
      this.root!.add(img);
      if (!owned) this.label(x, y + 19, tx('未解锁', 'Locked'), 11, '#e1c99b').setOrigin(0.5);
      this.target({
        group: 'roster',
        index: this.page * this.perPage + i,
        x,
        y,
        w: 70,
        h: 70,
        act: () => {
          this.actions.select(c);
        },
      });
    });
    this.label(945, 117 + rows * 88 - 25, `${this.page + 1} / ${Math.ceil(CHARACTERS.length / this.perPage)}`, 16, '#925c35').setOrigin(
      0.5,
    );
  }
  private drawSkins(): void {
    if (!this.skins) return;
    const c = this.actions.character(),
      skins: (SkinDef | undefined)[] = [undefined, ...(SKINS_OF[c.id] ?? [])];
    this.label(708, 384, tx('切换皮肤', 'Choose skin'), 25, '#5b211b').setFontStyle('bold');
    this.control(681, 482, 38, 70, 'LT', () => this.preview(this.skinIndex - 1), 0x914b34, 'journal-skin-prev');
    this.control(1200, 482, 38, 70, 'RT', () => this.preview(this.skinIndex + 1), 0x914b34, 'journal-skin-next');
    const active = activeSkin(c.id)?.id ?? '';
    skins.slice(this.skinOffset, this.skinOffset + 4).forEach((skin, i) => {
      const index = this.skinOffset + i,
        x = 762 + i * 113,
        y = 475;
      const owned = !skin || skinOwned(skin.id),
        equipped = active === (skin?.id ?? ''),
        selected = index === this.skinIndex;
      const bg = this.scene.add
        .graphics()
        .fillStyle(owned ? 0xf2d39d : 0x533a32, 1)
        .fillRoundedRect(x - 51, y - 54, 102, 130, 8);
      bg.lineStyle(equipped ? 3 : 1.5, equipped ? 0xd59322 : 0xa47750, 1).strokeRoundedRect(x - 51, y - 54, 102, 130, 8);
      if (selected && this.previewing) bg.lineStyle(2, 0x438496, 1).strokeRoundedRect(x - 48, y - 51, 96, 124, 7);
      this.root!.add(bg);
      // Visible cards use the same authored skin and texture lease as battle.
      // Destroying the page releases each showcase owner; shared atlases remain shared.
      const card = showcaseRig(this.scene, 'char', c.id, x, y - 17, 35, skin, () => {
        if (this.root?.active && this.actions.character() === c) this.refresh();
      });
      const bounds = card.getBounds();
      card.setScale(card.scaleX * Math.min(1, 78 / Math.max(1, bounds.width), 74 / Math.max(1, bounds.height)));
      const fitted = card.getBounds();
      card.setPosition(card.x + x - fitted.centerX, card.y + y - 17 - fitted.centerY);
      if (!owned) card.setAlpha(0.45);
      this.root!.add(card);
      this.label(x, y + 30, skin ? skin.name[lang === 'en' ? 1 : 0] : tx('原皮', 'Original'), 14, owned ? INK : '#e1c8ad').setOrigin(0.5);
      this.label(
        x,
        y + 58,
        equipped ? tx('使用中', 'Equipped') : owned ? tx('已拥有', 'Owned') : tx('未解锁', 'Locked'),
        14,
        equipped ? '#316b37' : owned ? '#8b531c' : '#f5d8a2',
      ).setOrigin(0.5);
      this.target({ group: 'skins', index, x, y: y + 8, w: 102, h: 130, act: () => this.chooseSkin(index) });
    });
    const preview = skins[this.skinIndex];
    if (preview && !skinOwned(preview.id)) {
      this.label(
        708,
        554,
        tx(
          `未解锁 · ${preview.price} 金番茄${this.skinIndex === 1 ? ' / 熟练度10级免费' : ''}`,
          `Locked · ${preview.price} Golden Tomatoes${this.skinIndex === 1 ? ' / Mastery10 free' : ''}`,
        ),
        14,
        '#79482c',
        340,
      );
      this.control(
        903,
        580,
        210,
        28,
        tx('查看解锁 / 购买', 'Unlock / Purchase'),
        () => this.confirmPurchase(preview),
        0x875536,
        'journal-unlock-skin',
      );
    }
  }
  private drawChapters(): void {
    const chapter = this.actions.chapter();
    this.label(75, 604, tx('章节旅程', 'Chapter journey'), 17, '#ffe0a2');
    this.target({
      group: 'mode',
      index: 0,
      x: 776,
      y: 607,
      w: 134,
      h: 27,
      act: () => {
        if (chapterCleared(chapter)) this.actions.toggleEndless();
        else toast(this.scene, tx('通关本章后解锁无尽模式', 'Clear this chapter to unlock Endless'), '#ffd166');
      },
    });
    this.control(
      776,
      607,
      134,
      27,
      this.actions.endless() ? tx('无尽模式', 'Endless') : tx('普通模式', 'Normal'),
      () => {
        if (chapterCleared(chapter)) this.actions.toggleEndless();
        else toast(this.scene, tx('通关本章后解锁无尽模式', 'Clear this chapter to unlock Endless'), '#ffd166');
      },
      0x654734,
      'journal-mode',
    );
    this.target({ group: 'mode', index: 1, x: 940, y: 607, w: 170, h: 27, act: () => this.actions.showDanger() });
    this.control(
      940,
      607,
      170,
      27,
      tx(`番茄危机 ${this.actions.danger()}`, `Danger ${this.actions.danger()}`),
      () => this.actions.showDanger(),
      0x654734,
      'journal-danger',
    );
    CHAPTERS.forEach((ch, i) => {
      const x = 109 + i * 130,
        y = 655,
        available = chapterAvailable(ch.id),
        selected = chapter === ch.id;
      const frame = this.scene.add
        .graphics()
        .fillStyle(selected ? 0x9d542d : 0x2f221e, 0.9)
        .fillRoundedRect(x - 57, y - 29, 114, 58, 8)
        .lineStyle(selected ? 3 : 1, selected ? 0xffc75e : 0x775342, 1)
        .strokeRoundedRect(x - 57, y - 29, 114, 58, 8);
      this.root!.add(frame);
      const thumb = this.scene.add.image(x - 32, y - 4, arenaThumb(this.scene, ch.id, 48, 42)).setDisplaySize(44, 39);
      if (!available) thumb.setTint(0x4a4444);
      this.root!.add(thumb);
      const name = chapterVisible(ch.id) ? ch.name.replace(/^第.+?章[ ·：:]*/, '') : tx('未解锁', 'Locked');
      this.label(x - 5, y - 15, `${i + 1}`, 16, '#ffe0a2');
      if (this.compact) this.label(x - 45, y + 4, name.slice(0, 4), 16, '#f5dfbb');
      else this.label(x - 5, y + 4, name, 12, '#f5dfbb', 55);
      this.target({ group: 'chapters', index: i, x, y, w: 114, h: 58, act: () => this.actions.selectChapter(ch.id) });
    });
    const allowed = isUnlocked(this.actions.character()) && chapterAvailable(chapter);
    this.control(
      1135,
      650,
      205,
      76,
      allowed ? tx('出发！', 'Go!') : tx('未解锁', 'Locked'),
      () => this.launch(),
      0xe0442e,
      'journal-start',
    ).setEnabled(allowed);
    this.target({ group: 'start', index: 0, x: 1135, y: 650, w: 205, h: 76, act: () => this.launch() });
  }
  private launch(): void {
    if (!isUnlocked(this.actions.character())) return void toast(this.scene, unlockHint(this.actions.character()), '#ffd166');
    if (!chapterAvailable(this.actions.chapter()))
      return void toast(this.scene, chapterUnlockHint(this.actions.chapter()) ?? tx('章节未解锁', 'Chapter locked'), '#ffd166');
    this.actions.start();
  }
  private chooseSkin(index: number): void {
    const skin = (SKINS_OF[this.actions.character().id] ?? [])[index - 1];
    this.skinIndex = index;
    this.previewSkin = skin;
    this.previewing = true;
    this.skinOffset = Math.max(0, Math.min(index - 3, 1));
    if (isUnlocked(this.actions.character()) && (!skin || skinOwned(skin.id))) {
      equipSkin(this.actions.character().id, skin?.id ?? '');
      persist();
      this.previewing = false;
    }
    this.refresh();
  }
  private preview(index: number): void {
    const count = 1 + (SKINS_OF[this.actions.character().id]?.length ?? 0);
    this.skinIndex = (index + count) % count;
    this.skinOffset = Math.max(0, this.skinIndex - 3);
    this.previewSkin = SKINS_OF[this.actions.character().id]?.[this.skinIndex - 1];
    this.previewing = true;
    this.focus = { group: 'skins', index: this.skinIndex };
    this.refresh();
  }
  private confirmPurchase(skin: SkinDef): void {
    if (!isUnlocked(this.actions.character())) return void toast(this.scene, unlockHint(this.actions.character()), '#ffd166');
    // A separate explicit purchase action prevents browsing a locked skin from spending currency.
    if (!buySkin(skin.id))
      return void toast(this.scene, tx('金番茄不足，或已拥有此皮肤', 'Not enough Golden Tomatoes, or skin already owned'), '#ffd166');
    persist();
    this.previewing = false;
    this.refresh();
  }
  private turnPage(delta: number): void {
    this.page = (this.page + delta + Math.ceil(CHARACTERS.length / this.perPage)) % Math.ceil(CHARACTERS.length / this.perPage);
    this.focus = { group: 'roster', index: this.page * this.perPage };
    this.refresh();
  }
  private paintFocus(): void {
    this.focusGfx?.clear();
    const t = this.targets.find((t) => t.group === this.focus.group && t.index === this.focus.index);
    if (!t) return;
    this.focusGfx!.lineStyle(3, 0xfff1b2, 1).strokeRoundedRect(t.x - t.w / 2 - 4, t.y - t.h / 2 - 4, t.w + 8, t.h + 8, 9);
    this.root?.setData('focus', this.focus);
  }
  input(key: string): void {
    if (this.actions.modalInput(key)) return;
    if (key === 'b') return this.actions.back();
    if (key === 'details') return this.actions.details();
    if (key === 'start') return this.launch();
    if (key === 'lb' || key === 'rb') return this.turnPage(key === 'lb' ? -1 : 1);
    if (key === 'lt' || key === 'rt') {
      if (this.skins) this.preview(this.skinIndex + (key === 'lt' ? -1 : 1));
      return;
    }
    if (key === 'a') {
      this.targets.find((t) => t.group === this.focus.group && t.index === this.focus.index)?.act();
      return;
    }
    const groups: Group[] = this.skins ? ['roster', 'skins', 'chapters', 'mode', 'start'] : ['roster', 'chapters', 'mode', 'start'];
    if (key === 'tab') {
      const group = groups[(groups.indexOf(this.focus.group) + 1) % groups.length];
      this.focus = { group, index: group === 'roster' ? this.page * this.perPage : group === 'skins' ? this.skinIndex : 0 };
      this.paintFocus();
      return;
    }
    const dx = key === 'left' ? -1 : key === 'right' ? 1 : 0,
      dy = key === 'up' ? -1 : key === 'down' ? 1 : 0;
    if (this.focus.group === 'roster') {
      const local = this.focus.index - this.page * this.perPage,
        next = local + dx + dy * 6;
      if (next >= 0 && next < Math.min(this.perPage, CHARACTERS.length - this.page * this.perPage))
        this.focus.index = this.page * this.perPage + next;
      else if (dy > 0) this.focus = this.skins ? { group: 'skins', index: this.skinIndex } : { group: 'chapters', index: 0 };
    } else if (dy) {
      const gi = Math.max(0, Math.min(groups.length - 1, groups.indexOf(this.focus.group) + dy));
      this.focus = {
        group: groups[gi],
        index: groups[gi] === 'roster' ? this.page * this.perPage : groups[gi] === 'skins' ? this.skinIndex : 0,
      };
    } else if (dx) {
      const list = this.targets.filter((t) => t.group === this.focus.group);
      const at = list.findIndex((t) => t.index === this.focus.index);
      if (list.length) this.focus.index = list[(at + dx + list.length) % list.length].index;
    }
    this.paintFocus();
  }
  private pollPad(): void {
    const p = Array.from(navigator.getGamepads?.() ?? []).find((p) => p?.connected);
    if (!p) {
      this.padConnected = false;
      this.prev.clear();
      return;
    }
    const now = this.scene.time.now,
      down = new Set(p.buttons.flatMap((b, i) => (b.pressed ? [i] : [])));
    if (!this.padConnected) {
      this.padConnected = true;
      this.prev = down;
      return;
    }
    const hit = (i: number) => down.has(i) && !this.prev.has(i);
    for (const [i, key] of [
      [0, 'a'],
      [1, 'b'],
      [2, 'details'],
      [3, 'details'],
      [4, 'lb'],
      [5, 'rb'],
      [6, 'lt'],
      [7, 'rt'],
      [9, 'start'],
    ] as const)
      if (hit(i)) this.input(key);
    const dir =
      down.has(14) || (p.axes[0] ?? 0) < -0.55
        ? 'left'
        : down.has(15) || (p.axes[0] ?? 0) > 0.55
          ? 'right'
          : down.has(12) || (p.axes[1] ?? 0) < -0.55
            ? 'up'
            : down.has(13) || (p.axes[1] ?? 0) > 0.55
              ? 'down'
              : null;
    if (dir && now >= this.nextMove) {
      this.input(dir);
      this.nextMove = now + 180;
    }
    if (!dir) this.nextMove = 0;
    this.prev = down;
  }
}
