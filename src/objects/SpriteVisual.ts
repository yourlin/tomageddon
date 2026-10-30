// 外部美术外观：静态透明图 / 规则精灵表 / 图集。帧由游戏时间手动推进（暂停、慢动作、冻结都与玩法一致），
// 不依赖 Phaser 动画完成事件。缺某个动作时用基准帧 + 通用反馈（呼吸、弹跳、挤压、闪白、旋转、淡出），不切换画风。
import Phaser from 'phaser';
import { BlinkState } from './BlinkState';
import { EntityVisual, TIMED, type RigState } from './EntityVisual';
import { VisualState } from './VisualState';
import { frameIndexAt } from '../systems/ArtResolve';
import type { ArtChoice } from '../systems/ArtResolve';
import type { ArtAnim } from '../data/artManifest';
import { starFxTex } from '../art/RigParts';
import { trackLive } from '../systems/ArtRegistry';
import type { VisualForm } from './visualTypes';

/** 已加载、可直接显示的素材（由 ArtRegistry 提供） */
export interface ReadyArt {
  choice: ArtChoice;
  texKey: string;
  blinkKey?: string;
  mode: 'static' | 'spritesheet' | 'atlas';
  /** 基准帧（Phaser 帧名；静态图为 undefined） */
  baseFrame: string | number | undefined;
  /** 单帧裁切前尺寸（锚点 / 默认参考半径按它计算） */
  frameW: number;
  frameH: number;
}

/** 词缀精英的金色光环（替代 Rig 的金色配色） */
const GOLD = 0xffc300;

export class SpriteVisual extends EntityVisual {
  readonly mode: 'static' | 'spritesheet' | 'atlas';
  readonly art: ReadyArt;
  private img: Phaser.GameObjects.Image;
  private shadowImg: Phaser.GameObjects.Image | null = null;
  private aura: Phaser.GameObjects.Image | null = null;
  private stars: Phaser.GameObjects.Image[] = [];
  private sm = new VisualState();
  private blink = new BlinkState();
  private t = Math.random() * 10;
  private dir = 1;
  private tintColor = -1;
  private flashing = false;
  /** 源图像素 → 1 个玩法半径 */
  private ref: number;
  private ground: number;
  bossFormPhase = 0;
  private formScale = 1;
  private formGhost: Phaser.GameObjects.Image | null = null;
  private ghostScale = 1;
  private blendAge = 0;
  private blendDuration = 0;
  private formAnimation: VisualForm['animation'];

  constructor(scene: Phaser.Scene, art: ReadyArt, radius: number) {
    super(scene, 0, 0);
    this.art = art;
    this.mode = art.mode;
    const e = art.choice.entry;
    this.ref = e.refRadius ?? art.frameW * 0.4;
    this.ground = this.ref * (e.groundY ?? 0.9);
    const sh = e.shadow ?? 1.8;
    if (sh > 0) {
      this.shadowImg = scene.add.image(0, this.ground, 'fx_shadow').setAlpha(0.45);
      this.shadowImg.setDisplaySize(this.ref * sh, this.ref * 0.32);
      this.add(this.shadowImg);
    }
    if (art.choice.aura === 'gold') {
      this.aura = scene.add.image(0, 0, 'fx_glow').setTint(GOLD).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
      this.aura.setDisplaySize(this.ref * 2.8, this.ref * 2.8);
      this.add(this.aura);
    }
    const a = e.anchor ?? { x: 0.5, y: 0.95 };
    this.img = scene.add.image(0, this.ground, art.texKey, art.baseFrame).setOrigin(a.x, a.y);
    this.img.setScale(e.displayScale ?? 1);
    this.formScale = e.displayScale ?? 1;
    this.add(this.img);
    this.applyTint();
    this.setRadius(radius);
    // 纹理引用：对象销毁（场景关闭）后才允许卸载
    trackLive(art.texKey, 1);
    if (art.blinkKey) trackLive(art.blinkKey, 1);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      trackLive(art.texKey, -1);
      if (art.blinkKey) trackLive(art.blinkKey, -1);
    });
  }

  setRadius(r: number): void {
    this.radius = r;
    this.setScale(r / this.ref);
  }

  override setBossForm(form: VisualForm, blendSeconds = 0.45): boolean {
    if (!this.scene.textures.exists(form.key) || !(form.refRadius > 0)) return false;
    if (this.img.texture.key === form.key) return true;
    this.formGhost?.destroy();
    this.formGhost = this.img;
    this.ghostScale = this.formScale;
    this.img = this.scene.add
      .image(this.formGhost.x, this.formGhost.y, form.key, form.animation?.baseFrame)
      .setOrigin(form.anchor.x, form.anchor.y)
      .setFlipX(this.formGhost.flipX)
      .setRotation(this.formGhost.rotation);
    this.add(this.img);
    this.formScale = (this.ref / form.refRadius) * (this.art.choice.entry.displayScale ?? 1);
    this.img.setScale(this.formScale);
    this.bossFormPhase = form.phase;
    this.formAnimation = form.animation;
    this.blendAge = 0;
    this.blendDuration = Math.max(0, blendSeconds);
    this.img.setAlpha(this.blendDuration ? 0 : 1);
    if (!this.blendDuration) {
      this.formGhost.destroy();
      this.formGhost = null;
    }
    this.applyTint();
    this.showFrame();
    return true;
  }

  override hasAuthoredAnimation(state: RigState): boolean {
    return (this.activeAnims()?.[state]?.frames.length ?? 0) > 0;
  }

  play(state: RigState, force = false): void {
    if (this.sm.play(state, force)) this.enterState();
  }

  die(cb: () => void): void {
    this.sm.die(cb);
    this.enterState();
  }

  private enterState(): void {
    this.state = this.sm.state;
    if (!this.scene) return; // 已随场景销毁（被晚到的回调调用）
    this.showFrame();
    this.applyTint();
    // 眩晕星星
    if (this.state === 'stun' && !this.stars.length) {
      for (let i = 0; i < 3; i++) {
        const s = this.scene.add.image(0, 0, starFxTex(this.scene)).setScale(this.ref / 40);
        this.stars.push(s);
        this.add(s);
      }
    } else if (this.state !== 'stun' && this.stars.length) this.clearStars();
  }

  private clearStars(): void {
    this.stars.forEach((s) => s.destroy());
    this.stars = [];
  }

  private activeAnims(): Partial<Record<RigState, ArtAnim>> | undefined {
    return this.bossFormPhase > 0 ? this.formAnimation?.anims : this.art.choice.entry.anims;
  }

  private anim(state: RigState): ArtAnim | undefined {
    const anims = this.activeAnims();
    if (!anims || (this.mode === 'static' && !this.formAnimation)) return undefined;
    // 冻结固定在进入冻结前的姿态（若有专门的 frozen 帧则用它）
    return anims[state];
  }

  private showFrame(): void {
    if (this.bossFormPhase > 0 && !this.formAnimation) return;
    const st = this.sm.state;
    if (!this.formAnimation && this.mode === 'static' && this.art.blinkKey && st !== 'frozen') {
      const key = this.blink.closed && (st === 'idle' || st === 'move') ? this.art.blinkKey : this.art.texKey;
      if (this.img.texture.key !== key) {
        this.img.setTexture(key);
        this.applyTint();
      }
      return;
    }
    const a = this.anim(st);
    let f: string | number | undefined = this.formAnimation?.baseFrame ?? this.art.baseFrame;
    if (a) f = a.frames[frameIndexAt(a, st, st === 'idle' || st === 'move' ? this.t : this.sm.elapsed, TIMED[st])];
    else if (st === 'frozen') return;
    else if (st !== 'idle') {
      // 缺动作：一次性反馈与移动沿用 idle 帧序列，保持画风一致
      const idle = this.anim('idle');
      if (idle) f = idle.frames[frameIndexAt(idle, 'idle', this.t, undefined)];
    }
    if (f !== undefined && this.img.frame.name !== String(f)) this.img.setFrame(f);
  }

  setStatusTint(color: number): void {
    if (color === this.tintColor) return;
    this.tintColor = color;
    if (!this.flashing) this.applyTint();
  }

  private applyTint(): void {
    const b = this.img;
    this.flashing = this.sm.flash > 0;
    if (this.flashing) b.setTintFill(0xffffff);
    else if (this.tintColor >= 0) b.setTint(this.tintColor);
    else if (this.art.choice.tint !== undefined) b.setTint(this.art.choice.tint);
    else b.clearTint();
  }

  tick(dt: number, mv: number, face: number): void {
    if (this.sm.state === 'frozen') return;
    this.t += dt;
    if (face !== 0) this.dir = face > 0 ? 1 : -1;
    const wasFlash = this.flashing;
    const r = this.sm.tick(dt, mv);
    if (r === 'died') {
      this.state = 'idle';
      return;
    }
    if (r === 'changed') this.enterState();
    if (wasFlash !== this.sm.flash > 0) this.applyTint();
    this.blink.tick(dt, this.sm.state);
    this.showFrame();

    const e = this.art.choice.entry;
    const st = this.sm.state;
    const has = !!this.anim(st);
    const k = this.sm.progress;
    const moving = mv > 0.15;
    const R = this.ref;
    let sx = 1,
      sy = 1,
      x = 0,
      y = 0,
      rot = 0,
      alpha = 1;
    // 通用反馈：有专门动作帧时只保留轻微的位移，没有时用和 Rig 同样的挤压 / 弹跳
    const amp = has ? 0.35 : 1;
    if (st === 'idle' || st === 'stun') {
      sy = 1 + Math.sin(this.t * 2.4) * 0.03 * amp;
      sx = 1 - Math.sin(this.t * 2.4) * 0.02 * amp;
    }
    if (st === 'move' || ((st === 'attack' || st === 'hurt') && moving)) {
      const ph = this.t * 13;
      y = -Math.abs(Math.sin(ph)) * R * 0.12 * amp;
      rot = 0.06 * mv * amp;
    }
    switch (st) {
      case 'attack':
        sx *= 1 + Math.sin(k * Math.PI) * 0.12 * amp;
        sy *= 1 - Math.sin(k * Math.PI) * 0.08 * amp;
        break;
      case 'hurt': {
        const s = Math.sin(k * Math.PI);
        sx *= 1 + s * 0.18 * amp;
        sy *= 1 - s * 0.14 * amp;
        x = Math.sin(this.t * 60) * R * 0.05 * (1 - k);
        break;
      }
      case 'windup':
        x = Math.sin(this.t * 70) * R * 0.04;
        if (!has) {
          sx = 1.06;
          sy = 0.94;
        }
        break;
      case 'charge':
        if (!has) {
          sx = 1.15;
          sy = 0.88;
          rot = 0.12;
        }
        break;
      case 'die':
        // 有死亡帧时先播帧、最后 40% 淡出；没有时放大 + 旋转 + 淡出
        if (has) alpha = k < 0.6 ? 1 : (1 - k) / 0.4;
        else {
          sx = sy = 1 + k * 0.4;
          rot = k * 1.2;
          alpha = 1 - k;
        }
        break;
      case 'spawn': {
        const s = Phaser.Math.Easing.Back.Out(k);
        sx = sy = has ? 0.6 + 0.4 * s : s;
        y = (1 - k) * R * 0.3;
        break;
      }
      case 'cast':
        y = -Math.sin(k * Math.PI) * R * 0.3 * amp;
        break;
      case 'victory':
        if (!has) y = -Math.abs(Math.sin(this.t * 8)) * R * 0.3;
        break;
    }
    const flip = (this.formAnimation?.mirror ?? e.mirror) !== false && this.dir !== (this.formAnimation?.facing ?? e.facing ?? 1);
    const ds = this.formScale;
    this.img.setPosition(x, this.ground + y);
    this.img.setScale(sx * ds, sy * ds);
    this.img.setFlipX(flip);
    this.img.rotation = rot * this.dir;
    if (this.formGhost) {
      this.blendAge += dt;
      const raw = Math.min(1, this.blendAge / this.blendDuration);
      const blend = raw * raw * (3 - 2 * raw);
      this.img.setAlpha(blend);
      this.formGhost
        .setAlpha(1 - blend)
        .setPosition(x, this.ground + y)
        .setScale(sx * this.ghostScale, sy * this.ghostScale)
        .setFlipX(flip)
        .setRotation(rot * this.dir);
      if (raw >= 1) {
        this.formGhost.destroy();
        this.formGhost = null;
      }
    }
    if (st === 'die') this.setAlpha(alpha);
    if (this.shadowImg) this.shadowImg.setAlpha(0.45 * (1 + y / (R * 2)));
    if (this.aura) this.aura.setAlpha(0.45 + Math.sin(this.t * 4) * 0.12).setPosition(0, this.ground * 0.2 + y);
    for (let i = 0; i < this.stars.length; i++) {
      const ang = this.t * 5 + (i / 3) * Math.PI * 2;
      this.stars[i].setPosition(Math.cos(ang) * R * 0.8, -R * 1.15 + Math.sin(ang) * R * 0.2);
    }
  }

  resetVisual(): void {
    this.formGhost?.destroy();
    this.formGhost = null;
    this.bossFormPhase = 0;
    this.formAnimation = undefined;
    this.dir = 1;
    this.blendAge = this.blendDuration = 0;
    const e = this.art.choice.entry;
    this.formScale = e.displayScale ?? 1;
    const anchor = e.anchor ?? { x: 0.5, y: 0.95 };
    this.img.setTexture(this.art.texKey, this.art.baseFrame).setOrigin(anchor.x, anchor.y).setAlpha(1);
    this.sm.reset();
    this.blink.reset();
    this.state = 'idle';
    this.onDieDone = null;
    this.tintColor = -1;
    this.setAlpha(1);
    this.clearStars();
    this.img.setPosition(0, this.ground).setRotation(0).setFlipX(false);
    this.img.setScale(this.art.choice.entry.displayScale ?? 1);
    if (this.art.baseFrame !== undefined) this.img.setFrame(this.art.baseFrame);
    this.applyTint();
  }
}
