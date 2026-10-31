// 章节开场四格漫画：2×2 格子逐格出现，点击 / 按键翻下一格，右上角可跳过。
// 剧本与分镜在 data/comics.ts；优先用章节插画，没有插画时用游戏素材拼场景。
import Phaser from 'phaser';
import type { EntityVisual, RigState } from '../objects/EntityVisual';
import { createEntityVisual, isForceProcedural } from '../objects/visualFactory';
import { arenaThumb } from '../art/ArenaArt';
import { COMICS, type ComicPanel, type ComicActor } from '../data/comics';
import { CHARACTER_MAP } from '../data/characters';
import { ENEMY_MAP } from '../data/enemies';
import { BOSS_MAP } from '../data/bosses';
import { text, button, COLORS, fs } from '../ui/UI';
import { save, persist } from '../systems/Save';
import { audio } from '../systems/Audio';
import { tx } from '../i18n';
import { VW, VH } from '../systems/HiDpi';
import { RUNTIME_ART_URLS } from '../systems/RuntimeArt';
import { queueArt, queueThumbArt, releaseArt, unloadUnusedArt } from '../systems/ArtRegistry';
import { retainSceneTexture } from '../systems/SceneArtLease';

export interface ComicData {
  ch: number;
  /** 看完后进入的场景（开局为 Game，回看为 CharSelect） */
  next: string;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Live {
  rig: EntityVisual;
  face: number;
  anim: RigState;
  t: number;
}

const GAP = 14;

/**
 * 插画：src/assets/comics/ch{章}.png 为 2×2 四格图，运行时按纹理帧分别展示。
 * 也支持 ch{章}-{格}.{png|jpg|webp} 单格替换，优先于整章四格图。
 * 某一格有插画时，这一格只显示插画（cover 铺满），旁白 / 对白 / 拟声改成格子底部的中英文字幕条；
 * 没有插画的格子仍按 data/comics.ts 的分镜用游戏素材拼。只在进入漫画场景时加载当前章节的插画。
 */
const ART = Object.fromEntries(Object.entries(RUNTIME_ART_URLS).filter(([p]) => p.startsWith('comics/')));
const artUrl = (ch: number, i: number): string | undefined =>
  Object.entries(ART).find(([p]) => new RegExp(`/ch${ch}-${i}\\.(png|jpe?g|webp)$`).test(p))?.[1];
const artKey = (ch: number, i: number): string => `comic_art_${ch}_${i}`;
const sheetUrl = (ch: number): string | undefined =>
  Object.entries(ART).find(([p]) => new RegExp(`/ch${ch}\\.(png|jpe?g|webp)$`).test(p))?.[1];
const sheetKey = (ch: number): string => `comic_sheet_${ch}`;

export class ComicScene extends Phaser.Scene {
  private cd!: ComicData;
  private boxes: Box[] = [];
  private shown = 0;
  private busy = false;
  private finished = false;
  private live: Live[] = [];
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super('Comic');
  }

  init(data: ComicData): void {
    this.cd = data;
  }

  preload(): void {
    const ch = this.cd?.ch ?? 0;
    const sheet = sheetUrl(ch);
    const owner = `comic:${ch}`;
    const failed = new Set<string>();
    const queuedPanels = new Set<number>();
    const candidates = (COMICS[ch]?.panels ?? []).map((_, i) => [
      ...(sheet ? [sheetKey(ch)] : []),
      ...(artUrl(ch, i + 1) ? [artKey(ch, i + 1)] : []),
    ]);
    const imageKeys = new Set(candidates.flat());
    const queueFallbacks = () => {
      if (isForceProcedural()) return;
      candidates.forEach((keys, i) => {
        if (queuedPanels.has(i) || keys.some((key) => !failed.has(key))) return;
        queuedPanels.add(i);
        const panel = COMICS[ch].panels[i];
        queueArt(this, { bodies: (panel.actors ?? []).map((a) => ({ kind: a.kind, id: a.id })) }, owner);
        queueThumbArt(this, [panel.bg]);
      });
    };
    const onError = (file: Phaser.Loader.File) => {
      if (!imageKeys.has(file.key)) return;
      failed.add(file.key);
      queueFallbacks();
    };
    this.load.on('loaderror', onError);
    this.events.once('shutdown', () => {
      this.load.off('loaderror', onError);
      releaseArt(owner);
      this.game.events.once('poststep', () => unloadUnusedArt(this.textures));
    });
    const queueIllustration = (key: string, url: string) => {
      retainSceneTexture(this, key, (scene, unused) => {
        if (scene.textures.exists(unused)) scene.textures.remove(unused);
      });
      if (!this.textures.exists(key)) this.load.image(key, url);
    };
    if (!isForceProcedural()) {
      if (sheet) queueIllustration(sheetKey(ch), sheet);
      for (let i = 1; i <= 4; i++) {
        const url = artUrl(ch, i);
        if (url) queueIllustration(artKey(ch, i), url);
      }
    }
    queueFallbacks();
  }

  create(data: ComicData): void {
    this.cd = data;
    this.shown = 0;
    this.busy = false;
    this.finished = false;
    this.live = [];
    const comic = COMICS[data.ch];
    if (!comic) {
      this.scene.start(data.next);
      return;
    }
    const seen = new Set(save.meta.comicsSeen ?? []);
    if (!seen.has(data.ch)) {
      seen.add(data.ch);
      save.meta.comicsSeen = [...seen].sort((a, b) => a - b);
      persist();
    }
    const W = VW(this),
      H = VH(this);
    this.cameras.main.setBackgroundColor(0x120a0a);
    audio.playMusic(this, 'bgm_menu');

    text(this, W / 2, 34, tx(comic.title[0], comic.title[1]), 30, '#ffd166').setOrigin(0.5);
    text(this, 24, 26, tx('番茄酱小镇的故事', 'Tales of Ketchup Town'), fs(15), COLORS.textDim);
    button(this, W - 80, 34, 130, 44, tx('跳过 ⏭', 'Skip ⏭'), () => this.finish(), 0x555555, 18);

    // 章节插画按原始单格比例排版，保留人物叶冠、帽子和画面上方的线索。
    const sheetTexture =
      !isForceProcedural() && this.textures.exists(sheetKey(data.ch)) ? this.textures.get(sheetKey(data.ch)).getSourceImage() : undefined;
    const panelAspect = sheetTexture ? sheetTexture.width / sheetTexture.height : 1.9;
    const top = 66,
      bottom = 56;
    const availW = W - 48,
      availH = H - top - bottom;
    const pw = Math.min((availW - GAP) / 2, ((availH - GAP) / 2) * panelAspect);
    const ph = Math.min((availH - GAP) / 2, pw / (sheetTexture ? panelAspect : 1.45));
    const x0 = (W - (pw * 2 + GAP)) / 2,
      y0 = top + (availH - (ph * 2 + GAP)) / 2;
    this.boxes = [0, 1, 2, 3].map((i) => ({ x: x0 + (i % 2) * (pw + GAP), y: y0 + Math.floor(i / 2) * (ph + GAP), w: pw, h: ph }));
    // 还没翻开的格子先画个空框
    for (const b of this.boxes) this.add.rectangle(b.x, b.y, b.w, b.h, 0x000000, 0.35).setOrigin(0).setStrokeStyle(3, 0x3a2a2a);

    this.hint = text(this, W / 2, H - 26, tx('点击继续', 'Click to continue'), fs(16), COLORS.textDim).setOrigin(0.5);
    this.tweens.add({ targets: this.hint, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      // 跳过按钮自己处理
      if (p.y < 64 && p.x > W - 160) return;
      this.advance();
    });
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => (e.key === 'Escape' ? this.finish() : this.advance()));

    const animate = (_t: number, dms: number) => {
      const dt = dms / 1000;
      for (const l of this.live) {
        if (!l.rig.active) continue;
        // 非待机动作每隔一会儿重播一次，让格子“活”起来
        if (l.anim !== 'idle' && l.anim !== 'move' && (l.t += dt) > 2.2) {
          l.t = 0;
          l.rig.play(l.anim, true);
        }
        l.rig.tick(dt, l.anim === 'move' ? 1 : 0, l.face);
      }
    };
    this.events.on('update', animate);
    this.events.once('shutdown', () => this.events.off('update', animate));
    this.time.delayedCall(250, () => this.advance());
  }

  private advance(): void {
    if (this.finished || this.busy) return;
    const comic = COMICS[this.cd.ch];
    if (this.shown >= comic.panels.length) {
      this.finish();
      return;
    }
    const i = this.shown++;
    this.busy = true;
    this.drawPanel(comic.panels[i], this.boxes[i], i + 1);
    audio.play(this, 'click');
    this.time.delayedCall(380, () => (this.busy = false));
    if (this.shown >= comic.panels.length) {
      this.hint.setText(this.cd.next === 'Game' ? tx('点击开始战斗 ▶', 'Click to start the fight ▶') : tx('点击返回', 'Click to go back'));
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.start(this.cd.next, this.cd.next === 'CharSelect' ? { chapter: this.cd.ch } : undefined),
    );
  }

  private drawPanel(p: ComicPanel, b: Box, n: number): void {
    const c = this.add.container(0, 0);
    const maskG = this.make.graphics({}, false);
    maskG.fillStyle(0xffffff).fillRect(b.x, b.y, b.w, b.h);
    c.setMask(maskG.createGeometryMask());
    const key = artKey(this.cd.ch, n);
    if (!isForceProcedural() && this.textures.exists(key)) {
      this.drawArtPanel(c, p, b, key);
      return;
    }
    const sheet = sheetKey(this.cd.ch);
    if (!isForceProcedural() && this.textures.exists(sheet)) {
      const texture = this.textures.get(sheet);
      if (!texture.has(String(n))) {
        const source = texture.getSourceImage();
        const w = Math.floor(source.width / 2),
          h = Math.floor(source.height / 2);
        // 去掉格线，避免 cover 缩放后边缘出现相邻格；源图保持完整。
        const inset = Math.max(4, Math.round(source.width / 256));
        texture.add(n, 0, ((n - 1) % 2) * w + inset, Math.floor((n - 1) / 2) * h + inset, w - inset * 2, h - inset * 2);
      }
      this.drawArtPanel(c, p, b, sheet, n);
      return;
    }

    // 背景：章节场地缩略图（cover）+ 罩色
    const tw = Math.round(b.w),
      th = Math.round(b.h);
    c.add(
      this.add
        .image(b.x, b.y, arenaThumb(this, p.bg, tw, th))
        .setOrigin(0)
        .setDisplaySize(b.w, b.h),
    );
    if (p.dim) c.add(this.add.rectangle(b.x, b.y, b.w, b.h, p.tint ?? 0x000000, p.dim).setOrigin(0));
    if (p.fx === 'speed') c.add(this.speedLines(b));

    const P = (x: number, y: number) => ({ x: b.x + x * b.w, y: b.y + y * b.h });
    for (const pr of p.props ?? []) {
      const at = P(pr.x, pr.y);
      const obj = pr.emoji
        ? this.add.text(at.x, at.y, pr.emoji, { fontSize: `${Math.round((pr.size ?? 0.14) * b.h)}px` })
        : text(this, at.x, at.y, tx(pr.text![0], pr.text![1]), Math.round((pr.size ?? 0.06) * b.h), '#2b1d16', {
            backgroundColor: '#f6e7c8',
            padding: { x: 8, y: 4 },
          });
      obj.setOrigin(0.5).setAngle(pr.angle ?? 0);
      c.add(obj);
      if (pr.motion === 'breathe') this.tweens.add({ targets: obj, scaleY: 1.08, scaleX: 0.96, duration: 900, yoyo: true, repeat: -1 });
      else if (pr.motion === 'float')
        this.tweens.add({ targets: obj, y: at.y - b.h * 0.04, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      else if (pr.motion === 'conveyor')
        this.tweens.add({ targets: obj, x: at.x + b.w * 0.22, duration: 1600, repeat: -1, onRepeat: () => obj.setX(at.x) });
    }

    const rigs: { rig: EntityVisual; a: ComicActor; r: number }[] = [];
    for (const a of p.actors ?? []) {
      const r = (a.r ?? 0.15) * b.h;
      const at = P(a.x, a.y);
      const rig = createEntityVisual(this, { kind: a.kind, id: a.id }, r);
      rig.setPosition(at.x, at.y);
      if (a.shadow) {
        rig.setStatusTint(0x1a0f14);
        rig.setAlpha(0.92);
      }
      c.add(rig);
      const face = a.face ?? 1;
      const anim = a.anim ?? 'idle';
      rig.play(anim === 'idle' ? 'spawn' : anim, true);
      rig.tick(0.001, 0, face);
      this.live.push({ rig, face, anim, t: 0 });
      rigs.push({ rig, a, r });
      // 演员依次“跳”进格子
      const scale = rig.scaleX;
      rig.setScale(scale * 0.6);
      this.tweens.add({ targets: rig, scale, duration: 260, ease: 'Back.out', delay: 60 * rigs.length });
    }

    if (p.caption) c.add(this.caption(b, tx(p.caption[0], p.caption[1])));
    if (p.sfx) {
      const at = P(p.sfx.x, p.sfx.y);
      const s = text(this, at.x, at.y, tx(p.sfx.text[0], p.sfx.text[1]), Math.round(b.h * 0.11), p.sfx.color ?? '#ffffff', {
        stroke: '#000000',
        strokeThickness: 6,
        fontStyle: 'bold',
      })
        .setOrigin(0.5)
        .setAngle(-8)
        .setScale(0.3);
      c.add(s);
      this.tweens.add({ targets: s, scale: 1, duration: 240, ease: 'Back.out', delay: 160 });
    }
    if (p.say) {
      const sp = rigs[p.say.who];
      if (sp) {
        const nm = p.say.name ? tx(p.say.name[0], p.say.name[1]) : actorName(sp.a);
        c.add(this.bubble(b, sp.rig.x, sp.rig.y - sp.r * 1.15, nm, tx(p.say.text[0], p.say.text[1])));
      }
    }

    // 漫画格边框
    c.add(this.add.rectangle(b.x, b.y, b.w, b.h).setOrigin(0).setStrokeStyle(5, 0xfff4ea));

    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 260 });
    if (p.fx === 'shake') this.cameras.main.shake(180, 0.006);
    else if (p.fx === 'flash') this.cameras.main.flash(160, 255, 255, 255);
  }

  /** 插画格：对白和旁白作为独立文字层，不能依赖原画里烘焙文字。 */
  private drawArtPanel(c: Phaser.GameObjects.Container, p: ComicPanel, b: Box, key: string, frame?: number): void {
    const img = this.add.image(b.x + b.w / 2, b.y + b.h / 2, key, frame);
    img.setScale(Math.max(b.w / img.width, b.h / img.height));
    c.add(img);
    const lines: string[] = [];
    for (const prop of p.props ?? []) if (prop.text) lines.push(tx(prop.text[0], prop.text[1]));
    if (p.caption) lines.push(tx(p.caption[0], p.caption[1]));
    if (p.say) {
      const a = p.actors?.[p.say.who];
      const nm = p.say.name ? tx(p.say.name[0], p.say.name[1]) : a ? actorName(a) : '';
      lines.push(`${nm ? `${nm}：` : ''}${tx(p.say.text[0], p.say.text[1])}`);
    }
    if (p.sfx && !lines.length) lines.push(tx(p.sfx.text[0], p.sfx.text[1]));
    if (lines.length) {
      const panelIndex = COMICS[this.cd.ch].panels.indexOf(p) + 1;
      const fontSize = Math.max(20, Math.min(25, Math.round(b.h * 0.078)));
      const t = text(this, b.x + b.w / 2, b.y + b.h - 17, lines.join('\n'), fontSize, '#302018', {
        align: 'left',
        wordWrap: { width: b.w - 56, useAdvancedWrap: true },
        strokeThickness: 0,
        lineSpacing: 3,
        fontStyle: p.say ? 'bold' : 'normal',
      })
        .setOrigin(0.5, 1)
        .setName(`comic-copy-${this.cd.ch}-${panelIndex}`);
      // Long translated copy must remain inside its own panel.
      while (t.height > b.h * 0.48 && Number.parseInt(String(t.style.fontSize)) > 16)
        t.setFontSize(Number.parseInt(String(t.style.fontSize)) - 1);
      const left = b.x + 12,
        top = t.y - t.height - 10;
      const box = this.add.graphics();
      box.fillStyle(p.say ? 0xfff6df : 0xffe8a3, 0.97).lineStyle(2, 0x553626, 1);
      box.fillRoundedRect(left, top, b.w - 24, t.height + 20, 10);
      box.strokeRoundedRect(left, top, b.w - 24, t.height + 20, 10);
      if (p.say) {
        const tailX = b.x + b.w * 0.27;
        box.fillTriangle(tailX, top + 1, tailX + 18, top + 1, tailX + 5, top - 12);
        box.lineBetween(tailX, top, tailX + 5, top - 12).lineBetween(tailX + 5, top - 12, tailX + 18, top);
      }
      c.add([box, t]);
    }
    c.add(this.add.rectangle(b.x, b.y, b.w, b.h).setOrigin(0).setStrokeStyle(5, 0xfff4ea));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 260 });
    if (p.fx === 'shake') this.cameras.main.shake(180, 0.006);
    else if (p.fx === 'flash') this.cameras.main.flash(160, 255, 255, 255);
  }

  /** 旁白框：左上角的米黄色方块 */
  private caption(b: Box, s: string): Phaser.GameObjects.Container {
    const pad = 10;
    const t = text(this, b.x + 12 + pad, b.y + 12 + pad, s, Math.max(14, Math.round(b.h * 0.055)), '#2b1d16', {
      wordWrap: { width: b.w * 0.7, useAdvancedWrap: true },
      lineSpacing: 2,
    });
    const bg = this.add
      .rectangle(b.x + 12, b.y + 12, t.width + pad * 2, t.height + pad * 2, 0xffe8a3)
      .setOrigin(0)
      .setStrokeStyle(3, 0x2b1d16);
    return this.add.container(0, 0, [bg, t]);
  }

  /** 对白气泡：放在说话者头顶，超出格子时往里挪；尾巴指向说话者 */
  private bubble(b: Box, sx: number, sy: number, name: string, s: string): Phaser.GameObjects.Container {
    const fs = Math.max(14, Math.round(b.h * 0.058));
    const maxW = b.w * 0.72;
    const nameT = text(this, 0, 0, name, Math.max(12, fs - 3), '#9d0208', { fontStyle: 'bold' });
    const t = text(this, 0, 0, s, fs, '#1a1010', { wordWrap: { width: maxW, useAdvancedWrap: true }, lineSpacing: 2 });
    const pad = 12;
    const bw = Math.max(t.width, nameT.width) + pad * 2,
      bh = t.height + nameT.height + pad * 2 + 2;
    const tail = 18;
    let bx = sx - bw / 2,
      by = sy - bh - tail;
    bx = Phaser.Math.Clamp(bx, b.x + 8, b.x + b.w - bw - 8);
    by = Phaser.Math.Clamp(by, b.y + 8, b.y + b.h - bh - 8);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1).lineStyle(3, 0x1a1010, 1);
    g.fillRoundedRect(bx, by, bw, bh, 14).strokeRoundedRect(bx, by, bw, bh, 14);
    // 尾巴：从气泡底边指向说话者头顶
    const tx0 = Phaser.Math.Clamp(sx, bx + 20, bx + bw - 20);
    const tipY = Math.max(by + bh + 4, Math.min(sy, by + bh + tail));
    g.fillTriangle(tx0 - 9, by + bh - 2, tx0 + 9, by + bh - 2, sx, tipY);
    g.lineBetween(tx0 - 9, by + bh, sx, tipY).lineBetween(tx0 + 9, by + bh, sx, tipY);
    nameT.setPosition(bx + pad, by + pad);
    t.setPosition(bx + pad, by + pad + nameT.height + 2);
    const c = this.add.container(0, 0, [g, nameT, t]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 200, delay: 220 });
    return c;
  }

  /** 速度线：从格子中心向外的放射线 */
  private speedLines(b: Box): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.lineStyle(2, 0xffffff, 0.35);
    const cx = b.x + b.w / 2,
      cy = b.y + b.h / 2;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const r0 = b.h * (0.42 + Math.random() * 0.1),
        r1 = b.w;
      g.lineBetween(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    }
    return g;
  }
}

function actorName(a: ComicActor): string {
  if (a.kind === 'char') return CHARACTER_MAP[a.id]?.name ?? a.id;
  if (a.kind === 'enemy') return ENEMY_MAP[a.id]?.name ?? a.id;
  return BOSS_MAP[a.id]?.name ?? a.id;
}
