// 部件骨骼 + 状态机动画：所有角色 / 怪物 / Boss 都由它渲染
// 状态：idle / move / attack / hurt / windup / charge / stun / die / spawn / cast / victory
import Phaser from 'phaser';
import type { RigSpec } from '../art/RigSpec';
import { P, drawBody, drawTop } from '../art/RigBody';
import {
  eyeTex,
  pupilTex,
  eyeGroupTex,
  eyeFxTex,
  mouthTex,
  mouthFor,
  browTex,
  blushTex,
  footTex,
  legTex,
  wingTex,
  tailTex,
  shellTex,
  tentacleTex,
  wheelTex,
  starFxTex,
  type MouthFace,
} from '../art/RigParts';
import { accessoryPart, type AccPart } from '../art/RigAcc';
import { paint, darken, hashStr } from '../art/Painter';

export type RigState = 'idle' | 'move' | 'attack' | 'hurt' | 'windup' | 'charge' | 'stun' | 'die' | 'spawn' | 'cast' | 'victory' | 'frozen';

type Img = Phaser.GameObjects.Image;

interface Swayer {
  img: Img;
  amp: number;
  base: number;
  phase: number;
}

const TIMED: Partial<Record<RigState, number>> = { attack: 0.22, hurt: 0.28, die: 0.3, spawn: 0.35, cast: 0.45 };

export class Rig extends Phaser.GameObjects.Container {
  puppet: Phaser.GameObjects.Container;
  shadow: Img;
  bodyImg!: Img;
  private face: Phaser.GameObjects.Container;
  private eyes: Img[] = [];
  private pupils: Img[] = [];
  private eyeFx: Img[] = [];
  private brows: Img[] = [];
  private mouth: Img | null = null;
  private feet: Img[] = [];
  private legs: { img: Img; base: number; side: number }[] = [];
  private wings: Img[] = [];
  private tail: Img | null = null;
  private tints: Img[] = [];
  private swayers: Swayer[] = [];
  private stars: Img[] = [];
  private spec: RigSpec;
  private specialEyes: boolean;
  state: RigState = 'idle';
  private base: 'idle' | 'move' = 'idle';
  private stateT = 0;
  private t = Math.random() * 10;
  private blinkT = 1 + Math.random() * 3;
  private dir = 1;
  radius: number;
  private hasFaceFx = false;
  private tintColor = -1;
  private flashT = 0;
  onDieDone: (() => void) | null = null;

  constructor(scene: Phaser.Scene, spec: RigSpec, key: string, radius: number) {
    super(scene, 0, 0);
    this.spec = spec;
    this.radius = radius;
    const s = scene;
    const w = spec.w,
      h = spec.h;

    // 阴影（不随身体挤压）
    this.shadow = s.add.image(0, P * h * 0.92, 'fx_shadow').setAlpha(0.5);
    this.shadow.setDisplaySize(P * w * 2.1, P * 0.5);
    this.add(this.shadow);

    this.puppet = s.add.container(0, 0);
    this.add(this.puppet);
    const pp = this.puppet;
    const accParts: AccPart[] = (spec.acc ?? []).map((a) => accessoryPart(s, a, spec));
    const limbColor = spec.limbColor ?? darken(spec.color, 0.35);

    // ---------- 背面部件 ----------
    for (const a of accParts.filter((p) => p.layer === 'back')) this.addAcc(a);
    if (spec.limbs === 'wings' || spec.limbs === 'wingsFeet') {
      for (const d of [-1, 1]) {
        const wg = s.add
          .image(d * P * w * 0.35, -P * h * 0.55, wingTex(s, 0xdff6ff))
          .setOrigin(d < 0 ? 1 : 0, 0.8)
          .setFlipX(d < 0);
        wg.setScale(w * 1.1);
        this.wings.push(wg);
        pp.add(wg);
      }
    }
    if (spec.limbs === 'tail') {
      this.tail = s.add
        .image(-P * w * 0.7, P * h * 0.45, tailTex(s, limbColor))
        .setOrigin(1, 0.75)
        .setScale(Math.max(0.8, w));
      pp.add(this.tail);
    }
    if (spec.limbs === 'snail') {
      const sh = s.add.image(-P * w * 0.25, -P * h * 0.35, shellTex(s, spec.color2 ?? 0xc9ada7)).setScale(w * 1.15);
      pp.add(sh);
      this.tints.push(sh);
    }
    if (spec.limbs === 'legs6' || spec.limbs === 'legs8') {
      const n = spec.limbs === 'legs6' ? 3 : 4;
      for (let i = 0; i < n; i++)
        for (const d of [-1, 1]) {
          const base = d * (0.5 + (i - (n - 1) / 2) * 0.45);
          const lg = s.add
            .image(d * P * w * 0.55, P * h * (0.05 + i * 0.22), legTex(s, limbColor))
            .setOrigin(0, 0.3)
            .setFlipX(d < 0);
          if (d < 0) lg.setOrigin(1, 0.3);
          lg.setScale(Math.max(0.8, w * 0.95));
          lg.rotation = base * 0.4;
          this.legs.push({ img: lg, base: base * 0.4, side: d });
          pp.add(lg);
        }
    }
    if (spec.limbs === 'tentacles') {
      for (let i = 0; i < 4; i++) {
        const tn = s.add
          .image((i - 1.5) * P * w * 0.45, P * h * 0.6, tentacleTex(s, limbColor))
          .setOrigin(0.5, 0.05)
          .setScale(w);
        this.swayers.push({ img: tn, amp: 0.3, base: 0, phase: i * 1.3 });
        pp.add(tn);
        this.tints.push(tn);
      }
    }

    // ---------- 脚 ----------
    if (spec.limbs === 'feet' || spec.limbs === 'wingsFeet' || spec.limbs === 'tail') {
      for (const d of [-1, 1]) {
        const f = s.add.image(d * P * w * 0.42, P * h * 0.88, footTex(s, limbColor)).setScale(Math.max(0.9, w));
        this.feet.push(f);
        pp.add(f);
        this.tints.push(f);
      }
    }
    if (spec.limbs === 'wheels') {
      for (const d of [-1, 1]) {
        const f = s.add.image(d * P * w * 0.5, P * h * 0.9, wheelTex(s)).setScale(w * 1.1);
        this.feet.push(f);
        pp.add(f);
      }
    }

    // ---------- 身体 ----------
    const bw = Math.ceil(P * w * 2.3 + 20),
      bh = Math.ceil(P * h * 2.3 + 20);
    const bodyKey = paint(s, `rigbody_${key}`, bw, bh, (ctx) =>
      drawBody(ctx, spec.shape, w, h, spec.color, spec.pattern ?? 'none', spec.patternColor, spec.color2, hashStr(key)),
    );
    this.bodyImg = s.add.image(0, 0, bodyKey);
    pp.add(this.bodyImg);
    this.tints.push(this.bodyImg);

    // ---------- 头顶 ----------
    if (spec.top && spec.top !== 'none') {
      const tk = paint(s, `rigtop_${spec.top}_${(spec.topColor ?? 0x3fa34d).toString(16)}`, 110, 70, (ctx) =>
        drawTop(ctx, spec.top!, spec.topColor ?? 0x3fa34d),
      );
      const isCap = spec.top === 'cap';
      const top = s.add
        .image(0, -P * h * (isCap ? 0.55 : 0.92), tk)
        .setOrigin(0.5, 0.92)
        .setScale(isCap ? w * 1.9 : Math.max(0.8, Math.min(1.3, w)));
      pp.add(top);
      this.tints.push(top);
      this.swayers.push({ img: top, amp: 0.12, base: 0, phase: 0 });
    }

    // ---------- 面部 ----------
    this.face = s.add.container(P * w * 0.08, -P * h * 0.12);
    pp.add(this.face);
    const es = (spec.eyeScale ?? 1) * Math.min(1.3, Math.max(0.75, w));
    const gap = P * w * 0.34;
    this.specialEyes = ['visor', 'one', 'three', 'compound', 'shades'].includes(spec.eyes);
    if (this.specialEyes) {
      const eg = s.add.image(0, 0, eyeGroupTex(s, spec.eyes, spec.pupil ?? 0xff3b30)).setScale(es * w * 0.95);
      this.eyes.push(eg);
      this.face.add(eg);
    } else {
      for (const d of [-1, 1]) {
        const e = s.add.image(d * gap, 0, eyeTex(s, spec.eyes, spec.eyeWhite ?? 0xffffff)).setScale(es);
        if (spec.eyes === 'fierce') e.setFlipX(d > 0);
        const p = s.add
          .image(d * gap, 2, pupilTex(s, spec.pupil ?? 0x1b1b1b))
          .setScale(es * (spec.eyes === 'dot' ? 0.7 : spec.eyes === 'big' ? 1.25 : 1));
        const fx = s.add
          .image(d * gap, 0, eyeFxTex(s, 'closed'))
          .setScale(es)
          .setVisible(false);
        this.eyes.push(e);
        this.pupils.push(p);
        this.eyeFx.push(fx);
        this.face.add([e, p, fx]);
      }
    }
    for (const d of [-1, 1]) {
      const b = s.add
        .image(d * gap, -P * 0.3 * es, browTex(s))
        .setScale(es * 0.9)
        .setVisible(!!spec.brows);
      b.rotation = spec.brows ? d * 0.35 : 0;
      this.brows.push(b);
      this.face.add(b);
    }
    if (spec.blush) for (const d of [-1, 1]) this.face.add(s.add.image(d * gap * 1.45, P * 0.28, blushTex(s)).setScale(es));
    const mf = mouthFor(spec.mouth, 'idle');
    if (mf) {
      this.mouth = s.add.image(0, P * h * 0.36, mouthTex(s, mf)).setScale(Math.min(1.4, Math.max(0.8, w)));
      this.face.add(this.mouth);
    }

    // ---------- 前景配饰 ----------
    for (const a of accParts.filter((p) => p.layer === 'front')) this.addAcc(a);

    this.setRadius(radius);
  }

  private addAcc(a: AccPart): void {
    const img = this.scene.add
      .image(a.x, a.y, a.key)
      .setOrigin(a.ox, a.oy)
      .setScale(Math.max(0.8, Math.min(1.4, this.spec.w)));
    if (a.rot) img.rotation = a.rot;
    this.puppet.add(img);
    if (a.sway) this.swayers.push({ img, amp: a.sway, base: a.rot ?? 0, phase: Math.random() * 3 });
  }

  setRadius(r: number): void {
    this.radius = r;
    this.setScale(r / (P * Math.max(this.spec.w, this.spec.h)));
  }

  /** 切换状态（计时类状态会在结束后回到 idle/move） */
  play(state: RigState, force = false): void {
    if (this.state === 'die' && !force) return;
    if (this.state === 'frozen' && state !== 'die' && !force) return;
    if (!force && state === this.state && TIMED[state] === undefined) return;
    this.state = state;
    this.stateT = TIMED[state] ?? 0;
    if (state === 'hurt') this.flashT = 0.08;
    this.refreshFace();
  }

  private refreshFace(): void {
    const st = this.state;
    const exprState =
      st === 'hurt' || st === 'die'
        ? st
        : st === 'attack' || st === 'charge'
          ? 'attack'
          : st === 'windup'
            ? 'windup'
            : st === 'victory' || st === 'cast'
              ? 'happy'
              : 'idle';
    const mf = mouthFor(this.spec.mouth, exprState as 'idle');
    if (this.mouth && mf) this.mouth.setTexture(mouthTex(this.scene, mf as MouthFace));
    const fxKind =
      st === 'die' ? 'x' : st === 'stun' ? 'spiral' : st === 'hurt' ? 'squeeze' : st === 'victory' || st === 'cast' ? 'happy' : null;
    this.hasFaceFx = !!fxKind;
    if (!this.specialEyes) {
      this.eyeFx.forEach((f, i) => {
        if (fxKind) f.setTexture(eyeFxTex(this.scene, fxKind as 'x')).setFlipX(i === 0 && fxKind === 'squeeze');
        f.setVisible(!!fxKind);
      });
      this.eyes.forEach((e) => e.setVisible(!fxKind));
      this.pupils.forEach((p) => p.setVisible(!fxKind));
    }
    const angry = st === 'windup' || st === 'charge' || !!this.spec.brows;
    this.brows.forEach((b, i) => {
      b.setVisible(angry);
      b.rotation = (i === 0 ? 1 : -1) * 0.4;
    });
    // 眩晕星星
    if (st === 'stun' && !this.stars.length) {
      for (let i = 0; i < 3; i++) {
        const st2 = this.scene.add.image(0, 0, starFxTex(this.scene)).setScale(1.2);
        this.stars.push(st2);
        this.puppet.add(st2);
      }
    } else if (st !== 'stun' && this.stars.length) {
      this.stars.forEach((x) => x.destroy());
      this.stars = [];
    }
  }

  /** 状态色调（灼烧/中毒/冰冻等），-1 清除 */
  setStatusTint(color: number): void {
    if (color === this.tintColor) return;
    this.tintColor = color;
    if (this.flashT <= 0) this.applyTint();
  }

  private applyTint(): void {
    for (const im of this.tints) {
      if (this.flashT > 0) im.setTintFill(0xffffff);
      else if (this.tintColor >= 0) im.setTint(this.tintColor);
      else im.clearTint();
    }
  }

  /**
   * 每帧更新动画
   * @param mv 0~1 移动强度  @param face 朝向 (-1/1)  @param lookX/lookY 视线方向（单位向量）
   */
  tick(dt: number, mv: number, face: number, lookX = 0, lookY = 0): void {
    this.t += dt;
    const t = this.t;
    if (face !== 0) this.dir = face > 0 ? 1 : -1;
    if (this.state === 'frozen') return;

    if (this.flashT > 0) {
      this.flashT -= dt;
      this.applyTint();
      if (this.flashT <= 0) this.applyTint();
    }
    if (this.stateT > 0) {
      this.stateT -= dt;
      if (this.stateT <= 0) {
        if (this.state === 'die') {
          const cb = this.onDieDone;
          this.onDieDone = null;
          this.state = 'idle';
          cb?.();
          return;
        }
        this.state = this.base;
        this.refreshFace();
      }
    }
    const moving = mv > 0.15;
    this.base = moving ? 'move' : 'idle';
    if ((this.state === 'idle' || this.state === 'move') && this.state !== this.base) {
      this.state = this.base;
    }

    let sx = 1,
      sy = 1,
      y = 0,
      x = 0,
      rot = 0;
    const st = this.state;
    const k = TIMED[st] ? 1 - Math.max(0, this.stateT) / TIMED[st]! : 0;
    if (st === 'idle' || st === 'stun') {
      sy = 1 + Math.sin(t * 2.4) * 0.035;
      sx = 1 - Math.sin(t * 2.4) * 0.025;
    }
    if (st === 'move' || ((st === 'attack' || st === 'hurt') && moving)) {
      const ph = t * 13;
      y = -Math.abs(Math.sin(ph)) * P * 0.16;
      const land = Math.max(0, Math.cos(ph * 2)) * 0.07;
      sx = 1 + land;
      sy = 1 - land;
      rot = 0.07 * this.dir * mv;
    }
    switch (st) {
      case 'attack':
        sx *= 1 + Math.sin(k * Math.PI) * 0.12;
        sy *= 1 - Math.sin(k * Math.PI) * 0.08;
        break;
      case 'hurt': {
        const a = Math.sin(k * Math.PI);
        sx *= 1 + a * 0.22;
        sy *= 1 - a * 0.18;
        x = Math.sin(t * 60) * P * 0.05 * (1 - k);
        break;
      }
      case 'windup':
        x = Math.sin(t * 70) * P * 0.05;
        sx = 1.08;
        sy = 0.92;
        break;
      case 'charge':
        sx = 1.22;
        sy = 0.84;
        rot = 0.15 * this.dir;
        break;
      case 'die': {
        sx = sy = 1 + k * 0.5;
        rot = k * 1.2 * this.dir;
        this.setAlpha(1 - k);
        break;
      }
      case 'spawn': {
        const e = Phaser.Math.Easing.Back.Out(k);
        sx = sy = e;
        y = (1 - k) * P * 0.3;
        break;
      }
      case 'cast':
        y = -Math.sin(k * Math.PI) * P * 0.4;
        sx = 1 - Math.sin(k * Math.PI) * 0.1;
        sy = 1 + Math.sin(k * Math.PI) * 0.12;
        break;
      case 'victory':
        y = -Math.abs(Math.sin(t * 8)) * P * 0.35;
        break;
    }
    if (this.spec.limbs === 'float' || this.spec.limbs === 'wings' || this.spec.limbs === 'tentacles')
      y += -P * 0.18 + Math.sin(t * 4) * P * 0.08;

    const pp = this.puppet;
    pp.setPosition(x, y);
    pp.setScale(sx * this.dir, sy);
    pp.rotation = rot * this.dir;
    this.shadow.setScale(this.shadow.scaleX, this.shadow.scaleY);
    const shK = 1 + y / (P * 2);
    this.shadow.setAlpha(0.45 * shK);

    // 脚步
    if (this.feet.length === 2) {
      const ph = t * 13;
      for (let i = 0; i < 2; i++) {
        const f = this.feet[i];
        const off = moving ? Math.sin(ph + i * Math.PI) : 0;
        f.x = (i === 0 ? -1 : 1) * P * this.spec.w * 0.42 + off * P * 0.12;
        f.y = P * this.spec.h * 0.88 - Math.max(0, off) * P * 0.12 - y * 0.6;
        if (this.spec.limbs === 'wheels') f.rotation += dt * (moving ? 14 : 0);
      }
    }
    for (let i = 0; i < this.legs.length; i++) {
      const l = this.legs[i];
      l.img.rotation = l.base + Math.sin(t * (moving ? 24 : 6) + i * 1.7) * (moving ? 0.35 : 0.08) * l.side;
    }
    for (const wg of this.wings) wg.scaleY = Math.abs(wg.scaleX) * (0.35 + 0.65 * Math.abs(Math.sin(t * 32)));
    if (this.tail) this.tail.rotation = Math.sin(t * (moving ? 10 : 4)) * 0.3;
    for (const sw of this.swayers) sw.img.rotation = sw.base + Math.sin(t * 3 + sw.phase) * sw.amp - rot * 0.8;
    for (let i = 0; i < this.stars.length; i++) {
      const a = t * 5 + (i / 3) * Math.PI * 2;
      this.stars[i].setPosition(Math.cos(a) * P * this.spec.w * 0.8, -P * this.spec.h * 1.1 + Math.sin(a) * P * 0.2);
    }

    // 眨眼与视线
    if (!this.specialEyes && !this.hasFaceFx) {
      this.blinkT -= dt;
      let eyeSy = 1;
      if (this.blinkT < 0) {
        eyeSy = 0.12;
        if (this.blinkT < -0.1) this.blinkT = 2 + Math.random() * 3.5;
      }
      const es = (this.spec.eyeScale ?? 1) * Math.min(1.3, Math.max(0.75, this.spec.w));
      for (const e of this.eyes) e.scaleY = es * eyeSy;
      const lx = lookX * this.dir,
        ly = lookY;
      const gap = P * this.spec.w * 0.34;
      this.pupils.forEach((p, i) => {
        p.x = (i === 0 ? -gap : gap) + lx * 5;
        p.y = 2 + ly * 4;
        p.scaleY = p.scaleX * eyeSy;
      });
    }
  }

  die(cb: () => void): void {
    this.onDieDone = cb;
    this.play('die', true);
  }

  resetVisual(): void {
    this.setAlpha(1);
    this.state = 'idle';
    this.stateT = 0;
    this.flashT = 0;
    this.tintColor = -1;
    this.applyTint();
    this.refreshFace();
    this.onDieDone = null;
  }
}
