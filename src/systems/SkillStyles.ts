// 角色专属技能演出与机制（1.4.0）：同一类技能按角色给出不同的动画形式与玩法差异，
// 让玩家不看说明也能看出技能的作用范围与效果。未在 STYLES 中的角色走 SkillSystem 的通用实现。
import Phaser from 'phaser';
import type { GameScene, HitInfo } from '../scenes/GameScene';
import type { SkillDef } from '../data/characters';
import type { StatusApply } from '../data/statuses';
import type { Enemy } from '../objects/Enemy';

/** 持续效果：每帧 tick，到时 end */
export interface Lingering {
  t: number;
  tick?: (dt: number, left: number) => void;
  end?: () => void;
}

/** 冲刺参数（由 SkillSystem.update 推进） */
export interface DashSpec {
  t: number;
  vx: number;
  vy: number;
  hit: Set<Enemy>;
  info: HitInfo;
  /** 碰撞判定半径（默认 50） */
  hitR?: number;
  /** 撞墙反弹 */
  bounce?: boolean;
  /** 同一敌人重复命中间隔（秒）；不填则只命中一次 */
  rehit?: number;
  rehitAt?: Map<Enemy, number>;
  /** 冲刺击退（默认 80） */
  knock?: number;
  /** 是否在路径上命中（默认是） */
  noHit?: boolean;
  onStep?: (dt: number) => void;
  onEnd?: () => void;
  /** 不画通用残影 */
  noAfterimage?: boolean;
}

export interface SkillHost {
  readonly g: GameScene;
  radius(base: number): number;
  dur(base: number): number;
  linger(e: Lingering): void;
  setDash(d: DashSpec): void;
  /** 额外无敌时间（秒） */
  invulnT: number;
}

export interface StyleCtx {
  host: SkillHost;
  g: GameScene;
  sk: SkillDef;
  info: HitInfo;
  status?: StatusApply[];
  /** 冲刺方向（单位向量） */
  dir: { x: number; y: number };
}

// ---------------- 通用小工具 ----------------
const ADD = Phaser.BlendModes.ADD;

function hitAround(g: GameScene, x: number, y: number, r: number, info: HitInfo, knock = 40): Enemy[] {
  const list = [...g.grid.query(x, y, r, g.tmp)];
  for (const e of list) g.weaponHit(e, { ...info, knockback: knock }, x, y);
  return list;
}

/** 只施加状态（不造成伤害），用于持续性的云雾 */
function applyAround(g: GameScene, x: number, y: number, r: number, status: StatusApply[] | undefined): Enemy[] {
  const list = [...g.grid.query(x, y, r, g.tmp)];
  if (status) for (const e of list) for (const s of status) e.status.apply(s);
  return list;
}

/** 柔和的烟团（fx_glow 着色），自动漂移淡出 */
function puff(
  g: GameScene,
  x: number,
  y: number,
  color: number,
  size: number,
  life: number,
  alpha = 0.4,
  depth = 9000,
): Phaser.GameObjects.Image {
  const im = g.add
    .image(x, y, 'fx_glow')
    .setTint(color)
    .setAlpha(0)
    .setDepth(depth)
    .setScale((size * 2) / 128);
  g.tweens.add({ targets: im, alpha, duration: Math.min(400, life * 300) });
  g.tweens.add({
    targets: im,
    x: x + Phaser.Math.Between(-30, 30),
    y: y + Phaser.Math.Between(-30, 10),
    scale: im.scale * 1.25,
    duration: life * 1000,
  });
  g.tweens.add({ targets: im, alpha: 0, delay: life * 1000 - 400, duration: 400, onComplete: () => im.destroy() });
  return im;
}

/** 地面上的半透明圆形印记 */
function decal(g: GameScene, x: number, y: number, r: number, color: number, alpha: number, life: number): Phaser.GameObjects.Image {
  const im = g.add
    .image(x, y, 'fx_pool')
    .setTint(color)
    .setAlpha(alpha)
    .setDepth(1.5)
    .setScale((r * 2) / 256);
  g.tweens.add({ targets: im, alpha: 0, delay: Math.max(0, life * 1000 - 500), duration: 500, onComplete: () => im.destroy() });
  return im;
}

/** 头顶符号，跟随目标若干秒（标记、混乱、诅咒的可视化） */
function stickyGlyph(g: GameScene, e: Enemy, glyph: string, color: string, life: number): void {
  const t = g.add
    .text(e.x, e.y - e.radius - 18, glyph, { fontFamily: 'system-ui', fontSize: '22px', color, stroke: '#000000', strokeThickness: 4 })
    .setOrigin(0.5)
    .setDepth(12500);
  const follow = () => {
    if (!e.alive) return;
    t.setPosition(e.x, e.y - e.radius - 18 + Math.sin(g.time.now / 160) * 3);
  };
  g.events.on('postupdate', follow);
  g.time.delayedCall(life * 1000, () => {
    g.events.off('postupdate', follow);
    g.tweens.add({ targets: t, alpha: 0, duration: 250, onComplete: () => t.destroy() });
  });
  // 敌人死亡时立即收起
  const check = g.time.addEvent({
    delay: 200,
    loop: true,
    callback: () => {
      if (!e.alive && t.active) {
        g.events.off('postupdate', follow);
        t.destroy();
        check.remove();
      }
    },
  });
  g.time.delayedCall(life * 1000 + 300, () => check.remove());
}

/** 跟随玩家的地面倒计时圈：剩余时间一目了然 */
function countdownRing(c: StyleCtx, dur: number, color: number, r = 46): void {
  const { g, host } = c;
  const gr = g.add.graphics().setDepth(8).setBlendMode(ADD);
  host.linger({
    t: dur,
    tick: (_dt, left) => {
      const p = g.player;
      gr.clear();
      gr.lineStyle(5, color, 0.25).strokeEllipse(p.x, p.y + 20, r * 2, r * 0.8);
      gr.lineStyle(5, color, 0.95);
      gr.beginPath();
      const k = Math.max(0, left / dur);
      for (let i = 0; i <= 32 * k; i++) {
        const a = -Math.PI / 2 + (i / 32) * Math.PI * 2;
        const x = p.x + Math.cos(a) * r,
          y = p.y + 20 + Math.sin(a) * r * 0.4;
        if (i === 0) gr.moveTo(x, y);
        else gr.lineTo(x, y);
      }
      gr.strokePath();
    },
    end: () => gr.destroy(),
  });
}

/** 附近敌人头上冒问号：它们找不到你了 */
function lostTarget(g: GameScene, r: number, dur: number): void {
  const p = g.player;
  for (const e of g.grid.query(p.x, p.y, r, g.tmp).slice(0, 14)) stickyGlyph(g, e, '?', '#ffffff', dur);
}

// ================================================================
// 冲刺类
// ================================================================

/** 胡萝卜骑士：蓄力 → 长枪冲锋 → 终点冲击波 */
function carrotCharge(c: StyleCtx): void {
  const { g, host, sk, info, dir } = c;
  const p = g.player;
  const dist = host.radius(sk.distance ?? 320) * 1.15;
  // 蓄力：路径预警 + 角色后仰
  g.fx.telegraphLine(p.x, p.y, dir.x, dir.y, dist, 46, 0.22);
  host.invulnT = Math.max(host.invulnT, 0.75);
  const dur = 0.38;
  g.time.delayedCall(220, () => {
    const lance = g.add.graphics().setDepth(11600).setBlendMode(ADD);
    host.setDash({
      t: dur,
      vx: (dir.x * dist) / dur,
      vy: (dir.y * dist) / dur,
      hit: new Set(),
      info,
      hitR: 64,
      knock: 150,
      onStep: () => {
        const a = Math.atan2(dir.y, dir.x);
        lance.clear();
        lance.fillStyle(sk.color, 0.55);
        lance.fillTriangle(
          p.x + Math.cos(a) * 110,
          p.y + Math.sin(a) * 110,
          p.x + Math.cos(a + 2.4) * 36,
          p.y + Math.sin(a + 2.4) * 36,
          p.x + Math.cos(a - 2.4) * 36,
          p.y + Math.sin(a - 2.4) * 36,
        );
        lance.fillStyle(0xffffff, 0.6).fillCircle(p.x + Math.cos(a) * 70, p.y + Math.sin(a) * 70, 10);
        puff(g, p.x - dir.x * 30, p.y - dir.y * 30 + 18, 0xc8a27a, 22, 0.6, 0.35, 2);
      },
      onEnd: () => {
        lance.destroy();
        g.cameras.main.shake(220, 0.018);
        g.fx.ring(p.x, p.y, 150, sk.color, 420, true);
        g.fx.ring(p.x, p.y, 110, 0xffffff, 300);
        hitAround(g, p.x + dir.x * 40, p.y + dir.y * 40, host.radius(130), info, 120);
        for (let i = 0; i < 10; i++)
          puff(g, p.x + Phaser.Math.Between(-60, 60), p.y + Phaser.Math.Between(-20, 40), 0xc8a27a, 34, 0.9, 0.4, 2);
      },
    });
  });
}

/** 西瓜胖墩：变成大西瓜翻滚 0.9 秒，撞墙反弹，持续碾压 */
function melonRoll(c: StyleCtx): void {
  const { g, host, sk, info, dir } = c;
  const p = g.player;
  const dur = 0.9;
  const speed = (host.radius(sk.distance ?? 260) * 1.8) / dur;
  const ball = g.add.graphics().setDepth(11700);
  const base = p.scale;
  host.invulnT = Math.max(host.invulnT, dur + 0.1);
  let spin = 0;
  host.setDash({
    t: dur,
    vx: dir.x * speed,
    vy: dir.y * speed,
    hit: new Set(),
    info: { ...info, dmg: info.dmg * 0.6 },
    hitR: 62,
    rehit: 0.3,
    bounce: true,
    knock: 160,
    noAfterimage: true,
    onStep: (dt) => {
      spin += dt * 18;
      p.setAlpha(0);
      ball.clear();
      ball.fillStyle(0x2d6a4f, 1).fillCircle(p.x, p.y, 46);
      ball.lineStyle(6, 0x95d5b2, 1);
      for (let i = 0; i < 4; i++) {
        const a = spin + (i * Math.PI) / 2;
        ball.beginPath();
        ball.arc(p.x, p.y, 46, a, a + 0.9);
        ball.strokePath();
      }
      ball.fillStyle(0xffffff, 0.35).fillEllipse(p.x - 14, p.y - 18, 22, 12);
      if (Math.random() < 0.5) g.fx.splat(p.x, p.y + 30, 0xff4d6d, 10);
    },
    onEnd: () => {
      ball.destroy();
      p.setAlpha(1).setScale(base * 1.25);
      g.tweens.add({ targets: p, scale: base, duration: 260, ease: 'Back.easeOut' });
      g.fx.ring(p.x, p.y, 90, 0x52b788, 300, true);
    },
  });
}

/** 生姜忍者：瞬移到终点，路径留下墨色刀痕，0.35 秒后刀痕一齐爆开 */
function gingerBlink(c: StyleCtx): void {
  const { g, host, sk, info, dir } = c;
  const p = g.player;
  const dist = host.radius(sk.distance ?? 360) * 1.1;
  const sx = p.x,
    sy = p.y;
  const ex = Phaser.Math.Clamp(sx + dir.x * dist, g.arena.x + 20, g.arena.right - 20);
  const ey = Phaser.Math.Clamp(sy + dir.y * dist, g.arena.y + 20, g.arena.bottom - 20);
  // 路径上的残影
  for (let i = 0; i <= 4; i++) {
    const k = i / 4;
    const ghost = g.add.circle(sx + (ex - sx) * k, sy + (ey - sy) * k, 26, 0x1b1b1b, 0.55).setDepth(11500);
    g.tweens.add({ targets: ghost, alpha: 0, scale: 1.4, delay: i * 40, duration: 500, onComplete: () => ghost.destroy() });
  }
  p.setPosition(ex, ey);
  host.invulnT = Math.max(host.invulnT, 0.6);
  const ink = g.add.graphics().setDepth(10500);
  ink.lineStyle(16, 0x111111, 0.85).lineBetween(sx, sy, ex, ey);
  ink.lineStyle(4, sk.color, 1).lineBetween(sx, sy, ex, ey);
  g.cameras.main.flash(80, 255, 255, 255, false);
  g.time.delayedCall(350, () => {
    ink.clear();
    ink.lineStyle(26, 0xffffff, 1).lineBetween(sx, sy, ex, ey).setBlendMode(ADD);
    g.tweens.add({ targets: ink, alpha: 0, duration: 300, onComplete: () => ink.destroy() });
    g.cameras.main.shake(160, 0.012);
    // 沿路径判定
    const len = Math.hypot(ex - sx, ey - sy) || 1;
    for (let d = 0; d <= len; d += 50) {
      const x = sx + ((ex - sx) * d) / len,
        y = sy + ((ey - sy) * d) / len;
      for (const e of [...g.grid.query(x, y, 55, g.tmp)]) {
        if ((e as Enemy & { _gin?: number })._gin === g.time.now) continue;
        (e as Enemy & { _gin?: number })._gin = g.time.now;
        g.weaponHit(e, { ...info, knockback: 0 }, x, y);
        g.fx.slash(e.x, e.y, Math.atan2(ey - sy, ex - sx), 50, sk.color, 1.6);
      }
    }
  });
}

/** 火龙果龙骑：冲锋路径留下持续 3 秒的火焰带 */
function dragonCharge(c: StyleCtx): void {
  const { g, host, sk, info, dir } = c;
  const p = g.player;
  const dist = host.radius(sk.distance ?? 330);
  const dur = 0.42;
  host.invulnT = Math.max(host.invulnT, dur + 0.1);
  const trail: { x: number; y: number }[] = [];
  let acc = 0;
  host.setDash({
    t: dur,
    vx: (dir.x * dist) / dur,
    vy: (dir.y * dist) / dur,
    hit: new Set(),
    info,
    hitR: 56,
    onStep: () => {
      if (Phaser.Math.Distance.Between(p.x, p.y, trail.at(-1)?.x ?? -1e4, trail.at(-1)?.y ?? -1e4) < 34) return;
      trail.push({ x: p.x, y: p.y });
      decal(g, p.x, p.y + 10, 40, 0xff5400, 0.55, 3.2);
      puff(g, p.x, p.y, 0xff9e00, 30, 0.7, 0.6, 10600).setBlendMode(ADD);
    },
  });
  const burn = { ...info, dmg: info.dmg * 0.18, knockback: 0 };
  host.linger({
    t: 3.4,
    tick: (dt) => {
      acc += dt;
      if (Math.random() < 0.6 && trail.length) {
        const s = Phaser.Utils.Array.GetRandom(trail);
        const f = g.add
          .circle(s.x + Phaser.Math.Between(-16, 16), s.y, Phaser.Math.Between(4, 8), 0xffb703)
          .setDepth(10600)
          .setBlendMode(ADD);
        g.tweens.add({ targets: f, y: f.y - 50, alpha: 0, duration: 500, onComplete: () => f.destroy() });
      }
      if (acc < 0.5) return;
      acc = 0;
      const seen = new Set<Enemy>();
      for (const s of trail)
        for (const e of g.grid.query(s.x, s.y, 42, g.tmp))
          if (!seen.has(e)) {
            seen.add(e);
            g.weaponHit(e, burn, s.x, s.y);
          }
    },
  });
}

// ================================================================
// 新星爆发类
// ================================================================

/** 番茄妹：番茄酱四溅，地面留下 4 秒黏糊糊的酱汁（减速） */
function ketchupBurst(c: StyleCtx): void {
  const { g, host, sk, info, status } = c;
  const p = g.player;
  const r = host.radius((sk.radius ?? 180) * 1.3);
  const cx = p.x,
    cy = p.y;
  hitAround(g, cx, cy, r, info, 70);
  g.cameras.main.shake(200, 0.012);
  g.fx.explosion(cx, cy, r * 0.6, sk.color);
  const pools: { x: number; y: number; r: number }[] = [{ x: cx, y: cy, r: r * 0.45 }];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2);
    const d = r * Phaser.Math.FloatBetween(0.45, 0.95);
    const x = cx + Math.cos(a) * d,
      y = cy + Math.sin(a) * d * 0.8;
    const drop = g.add.circle(cx, cy, 10, 0xd00000).setDepth(11800);
    g.tweens.add({
      targets: drop,
      x,
      y,
      duration: 380,
      ease: 'Quad.easeOut',
      onUpdate: (tw) => drop.setScale(1 + Math.sin(tw.progress * Math.PI) * 1.2),
      onComplete: () => {
        drop.destroy();
        g.fx.splat(x, y, 0xd00000, 30);
      },
    });
    pools.push({ x, y, r: r * 0.22 });
  }
  const imgs = pools.map((q) => decal(g, q.x, q.y, q.r, 0xc1121f, 0.55, 4));
  void imgs;
  let acc = 0;
  host.linger({
    t: 4,
    tick: (dt) => {
      acc += dt;
      if (acc < 0.5) return;
      acc = 0;
      for (const q of pools) applyAround(g, q.x, q.y, q.r, status);
    },
  });
}

/** 辣椒姐：火环由内向外扩散 0.7 秒，火线扫过的敌人才被点燃 */
function flameWave(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const p = g.player;
  const R = host.radius((sk.radius ?? 200) * 1.35);
  const cx = p.x,
    cy = p.y;
  const hit = new Set<Enemy>();
  const gr = g.add.graphics().setDepth(10400).setBlendMode(ADD);
  const dur = 0.7;
  g.cameras.main.shake(300, 0.008);
  host.linger({
    t: dur + 0.5,
    tick: (_dt, left) => {
      const k = Math.min(1, (dur + 0.5 - left) / dur);
      const r = R * k;
      gr.clear();
      gr.lineStyle(26, 0xff5400, 0.75 * (1 - k * 0.5)).strokeCircle(cx, cy, r);
      gr.lineStyle(10, 0xffd166, 0.9 * (1 - k * 0.5)).strokeCircle(cx, cy, r);
      gr.fillStyle(0xff7b00, 0.12 * (1 - k)).fillCircle(cx, cy, r);
      if (k < 1) {
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * Math.PI * 2;
          const f = g.add
            .circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Phaser.Math.Between(5, 10), 0xffb703)
            .setDepth(10600)
            .setBlendMode(ADD);
          g.tweens.add({ targets: f, y: f.y - 40, alpha: 0, duration: 420, onComplete: () => f.destroy() });
        }
        for (const e of g.grid.query(cx, cy, r + 20, g.tmp)) {
          if (hit.has(e) || Phaser.Math.Distance.Between(e.x, e.y, cx, cy) < r - 50) continue;
          hit.add(e);
          g.weaponHit(e, { ...info, knockback: 50 }, cx, cy);
        }
      }
    },
    end: () => {
      gr.destroy();
      decal(g, cx, cy, R, 0x3d0c02, 0.35, 1.5);
    },
  });
}

/** 椰子拳师：跃起 → 砸地，裂纹向外放射并停留 1.5 秒 */
function groundPound(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const p = g.player;
  const base = p.scale;
  const r = host.radius((sk.radius ?? 170) * 1.3);
  host.invulnT = Math.max(host.invulnT, 0.6);
  const shadow = g.add.ellipse(p.x, p.y + 22, 70, 24, 0x000000, 0.4).setDepth(2);
  g.tweens.add({ targets: p, scale: base * 1.45, duration: 260, ease: 'Quad.easeOut' });
  g.tweens.add({ targets: shadow, scaleX: 0.6, scaleY: 0.6, duration: 260 });
  g.fx.telegraphCircle(p.x, p.y, r, 0.32, sk.color);
  g.time.delayedCall(260, () => {
    g.tweens.add({
      targets: p,
      scale: base,
      duration: 90,
      ease: 'Quad.easeIn',
      onComplete: () => {
        shadow.destroy();
        const x = p.x,
          y = p.y;
        g.cameras.main.shake(320, 0.028);
        hitAround(g, x, y, r, info, 100);
        g.fx.ring(x, y, r, sk.color, 500, true);
        g.fx.ring(x, y, r * 0.6, 0xffffff, 350);
        const cracks = g.add.graphics().setDepth(1.6);
        for (let i = 0; i < 12; i++) {
          let a = (i / 12) * Math.PI * 2,
            cx = x,
            cy = y;
          cracks.lineStyle(5, 0x3a2412, 0.9);
          cracks.beginPath();
          cracks.moveTo(cx, cy);
          for (let s = 0; s < 5; s++) {
            a += Phaser.Math.FloatBetween(-0.4, 0.4);
            cx += Math.cos(a) * (r / 5);
            cy += Math.sin(a) * (r / 5) * 0.8;
            cracks.lineTo(cx, cy);
          }
          cracks.strokePath();
        }
        g.tweens.add({ targets: cracks, alpha: 0, delay: 1100, duration: 500, onComplete: () => cracks.destroy() });
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          const rock = g.add.rectangle(x, y, 10, 8, 0x8d6e63).setDepth(11800);
          g.tweens.add({
            targets: rock,
            x: x + Math.cos(a) * r * 0.8,
            y: y + Math.sin(a) * r * 0.6,
            angle: 360,
            alpha: 0,
            duration: 600,
            onComplete: () => rock.destroy(),
          });
        }
      },
    });
  });
}

// ================================================================
// 大范围诅咒类：在地图上留下持续的云雾，雾里的敌人每秒被再次施加减益
// ================================================================

interface FogOpts {
  color: number;
  dur: number;
  /** 云团数量 */
  n: number;
  /** 云团大小 */
  size: number;
  /** 跟随玩家 */
  follow?: boolean;
  /** 每秒对雾中敌人做什么（默认重新施加状态） */
  onTick?: (inside: Enemy[]) => void;
  /** 额外的每帧表现 */
  extra?: (cx: number, cy: number) => void;
}

function fogZone(c: StyleCtx, radius: number, o: FogOpts): void {
  const { g, host, status } = c;
  const p = g.player;
  let cx = p.x,
    cy = p.y;
  const offs = Array.from({ length: o.n }, (_, i) => {
    const a = (i / o.n) * Math.PI * 2 + Math.random() * 0.5;
    const d = radius * Math.sqrt(Math.random()) * 0.85;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d * 0.85, ph: Math.random() * 6 };
  });
  const clouds = offs.map((q) =>
    g.add
      .image(cx + q.dx, cy + q.dy, 'fx_glow')
      .setTint(o.color)
      .setAlpha(0)
      .setDepth(10800)
      .setScale((o.size * 2) / 128),
  );
  const edge = g.add.graphics().setDepth(1.6);
  for (const im of clouds) g.tweens.add({ targets: im, alpha: 0.42, duration: 500 });
  let acc = 1;
  const life = host.dur(o.dur);
  host.linger({
    t: life,
    tick: (dt, left) => {
      if (o.follow) {
        cx += (p.x - cx) * Math.min(1, dt * 5);
        cy += (p.y - cy) * Math.min(1, dt * 5);
      }
      const now = g.time.now / 1000;
      const fade = Math.min(1, left / 0.6);
      clouds.forEach((im, i) => {
        const q = offs[i];
        im.setPosition(cx + q.dx + Math.sin(now * 0.7 + q.ph) * 14, cy + q.dy + Math.cos(now * 0.5 + q.ph) * 10);
        im.setAlpha((0.34 + Math.sin(now * 1.5 + q.ph) * 0.08) * fade);
      });
      // 范围边界：虚线圈，让玩家看清雾的覆盖范围
      edge.clear();
      edge.lineStyle(3, o.color, 0.5 * fade);
      for (let i = 0; i < 36; i += 2) {
        const a0 = (i / 36) * Math.PI * 2 + now * 0.3,
          a1 = ((i + 1) / 36) * Math.PI * 2 + now * 0.3;
        edge.lineBetween(cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius, cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius);
      }
      o.extra?.(cx, cy);
      acc += dt;
      if (acc >= 1) {
        acc = 0;
        const inside = applyAround(g, cx, cy, radius, o.onTick ? undefined : status);
        o.onTick?.(inside);
      }
    },
    end: () => {
      for (const im of clouds) im.destroy();
      edge.destroy();
    },
  });
}

/** 蘑菇巫医：大片绿色孢子云，持续 6 秒，孢子不断上浮 */
function sporeCloud(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const r = host.radius((sk.radius ?? 320) * 1.1);
  hitAround(g, g.player.x, g.player.y, r, info, 0);
  fogZone(c, r, {
    color: 0x6a994e,
    dur: 6,
    n: 18,
    size: r * 0.42,
    extra: (cx, cy) => {
      if (Math.random() < 0.5) {
        const a = Math.random() * Math.PI * 2,
          d = Math.random() * r;
        const s = g.add.circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3, 0xd9ed92).setDepth(10900);
        g.tweens.add({ targets: s, y: s.y - 60, alpha: 0, duration: 1200, onComplete: () => s.destroy() });
      }
    },
  });
}

/** 榴莲霸王：臭气跟着你走 5 秒，雾中敌人头顶冒臭气波纹并晕头转向 */
function stinkAura(c: StyleCtx): void {
  const { g, host, sk, info, status } = c;
  const r = host.radius((sk.radius ?? 240) * 1.05);
  hitAround(g, g.player.x, g.player.y, r, info, 0);
  const marked = new WeakSet<Enemy>();
  fogZone(c, r, {
    color: 0xb5a642,
    dur: 5,
    n: 14,
    size: r * 0.4,
    follow: true,
    onTick: (inside) => {
      for (const e of inside) {
        for (const s of status ?? []) e.status.apply(s);
        if (!marked.has(e)) {
          marked.add(e);
          stickyGlyph(g, e, '〰', '#d4d700', 2.5);
        }
      }
    },
    extra: (cx, cy) => {
      if (Math.random() < 0.35) {
        const a = Math.random() * Math.PI * 2,
          d = Math.random() * r;
        const w = g.add
          .text(cx + Math.cos(a) * d, cy + Math.sin(a) * d, '~', { fontFamily: 'system-ui', fontSize: '30px', color: '#c9b13a' })
          .setOrigin(0.5)
          .setDepth(10900);
        g.tweens.add({ targets: w, y: w.y - 50, alpha: 0, angle: 30, duration: 900, onComplete: () => w.destroy() });
      }
    },
  });
}

/** 猕猴桃侦探：画面变暗，放大镜扫过全屏，每个被锁定的敌人头顶出现红色准星 */
function detectiveScan(c: StyleCtx): void {
  const { g, info, status } = c;
  const cam = g.cameras.main;
  const v = cam.worldView;
  const dim = g.add.rectangle(v.centerX, v.centerY, v.width * 1.2, v.height * 1.2, 0x000000, 0).setDepth(12000);
  g.tweens.add({ targets: dim, fillAlpha: 0.45, duration: 200, yoyo: true, hold: 500, onComplete: () => dim.destroy() });
  const lens = g.add.graphics().setDepth(12100);
  lens.lineStyle(10, 0xffd166, 1).strokeCircle(0, 0, 90);
  lens.lineStyle(14, 0x8d6e63, 1).lineBetween(64, 64, 140, 140);
  lens.fillStyle(0xffffff, 0.15).fillCircle(0, 0, 86);
  lens.setPosition(v.x - 100, v.centerY);
  g.tweens.add({ targets: lens, x: v.right + 160, duration: 800, ease: 'Sine.easeInOut', onComplete: () => lens.destroy() });
  const dur = Math.max(...(status ?? []).map((s) => s.dur), 4);
  const targets = g.enemies.filter((e) => e.alive && v.contains(e.x, e.y));
  targets.forEach((e, i) => {
    g.time.delayedCall(Math.max(0, ((e.x - v.x) / v.width) * 800), () => {
      if (!e.alive) return;
      g.weaponHit(e, { ...info, knockback: 0 }, e.x, e.y);
      const ret = g.add.graphics().setDepth(12200);
      const draw = () => {
        if (!e.alive) return ret.destroy();
        const rr = e.radius + 14 + Math.sin(g.time.now / 120) * 3;
        ret.clear();
        ret.lineStyle(3, 0xff1744, 1).strokeCircle(e.x, e.y, rr);
        ret.lineBetween(e.x - rr - 8, e.y, e.x - rr + 6, e.y).lineBetween(e.x + rr - 6, e.y, e.x + rr + 8, e.y);
        ret.lineBetween(e.x, e.y - rr - 8, e.x, e.y - rr + 6).lineBetween(e.x, e.y + rr - 6, e.x, e.y + rr + 8);
      };
      g.events.on('postupdate', draw);
      g.time.delayedCall(dur * 1000, () => {
        g.events.off('postupdate', draw);
        if (ret.active) ret.destroy();
      });
    });
    void i;
  });
}

/** 黑莓女巫：紫黑色瘴气笼罩一片区域 6 秒，地面浮现法阵，中咒敌人头顶出现骷髅 */
function witherHex(c: StyleCtx): void {
  const { g, host, sk, info, status } = c;
  const r = host.radius((sk.radius ?? 280) * 1.1);
  const p = g.player;
  hitAround(g, p.x, p.y, r, info, 0);
  const cx = p.x,
    cy = p.y;
  const circle = g.add.graphics().setDepth(1.6).setPosition(cx, cy);
  circle.lineStyle(4, 0x9d4edd, 0.8).strokeCircle(0, 0, r * 0.6);
  circle.lineStyle(2, 0xe0aaff, 0.7).strokeCircle(0, 0, r * 0.5);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2,
      b = ((i + 2) / 5) * Math.PI * 2 - Math.PI / 2;
    circle.lineBetween(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, Math.cos(b) * r * 0.5, Math.sin(b) * r * 0.5);
  }
  circle.setScale(1, 0.7);
  g.tweens.add({ targets: circle, angle: 120, duration: 6000 });
  g.time.delayedCall(host.dur(6) * 1000, () =>
    g.tweens.add({ targets: circle, alpha: 0, duration: 400, onComplete: () => circle.destroy() }),
  );
  const marked = new WeakSet<Enemy>();
  fogZone(c, r, {
    color: 0x3c096c,
    dur: 6,
    n: 16,
    size: r * 0.4,
    onTick: (inside) => {
      for (const e of inside) {
        for (const s of status ?? []) e.status.apply(s);
        if (!marked.has(e)) {
          marked.add(e);
          stickyGlyph(g, e, '☠', '#e0aaff', 3);
        }
      }
    },
  });
}

// ================================================================
// 隐身 / 灵体类
// ================================================================

/** 隐身期间的通用表现：半透明、闪烁描边、连续残影、倒计时圈 */
function stealthLook(c: StyleCtx, dur: number, color: number): void {
  const { g, host } = c;
  const p = g.player;
  countdownRing(c, dur, color);
  let acc = 0;
  host.linger({
    t: dur,
    tick: (dt) => {
      p.setAlpha(0.28 + Math.sin(g.time.now / 70) * 0.12);
      p.setStatusTint(color);
      acc += dt;
      if (acc >= 0.06) {
        acc = 0;
        g.fx.afterimage(p, color);
      }
    },
    end: () => {
      p.setAlpha(1);
      p.setStatusTint(-1);
      // 现身：一圈白光
      g.fx.ring(p.x, p.y, 70, 0xffffff, 260);
    },
  });
}

/** 柠檬刺客：原地留下一团酸雾，敌人都去追那团雾；隐身结束时一记致命突袭 */
function lemonVanish(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const p = g.player;
  const dur = host.dur(sk.duration ?? 2.5);
  const sx = p.x,
    sy = p.y;
  for (let i = 0; i < 10; i++) puff(g, sx + Phaser.Math.Between(-50, 50), sy + Phaser.Math.Between(-40, 30), 0xe9ff70, 46, dur, 0.55);
  g.decoy = { x: sx, y: sy };
  lostTarget(g, 320, dur);
  stealthLook(c, dur, 0xfff3b0);
  host.linger({
    t: dur,
    end: () => {
      g.decoy = null;
      const t = g.grid.nearest(p.x, p.y, 260);
      if (t) {
        g.fx.slash(t.x, t.y, Math.atan2(t.y - p.y, t.x - p.x), 70, 0xfff3b0, 2);
        g.weaponHit(t, { ...info, dmg: info.dmg * 3, crit: true, knockback: 60 }, p.x, p.y);
        g.fx.label(t.x, t.y - 40, '✦', '#fff3b0');
      }
    },
  });
}

/** 南瓜幽灵：化作灵体穿过敌群，身后拖着鬼火，被穿过的敌人受到伤害 */
function pumpkinPhase(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const p = g.player;
  const dur = host.dur(sk.duration ?? 2.5);
  stealthLook(c, dur, 0xc77dff);
  lostTarget(g, 240, Math.min(1.5, dur));
  const touched = new Map<Enemy, number>();
  const phaseHit = { ...info, dmg: info.dmg * 0.5, knockback: 30 };
  host.linger({
    t: dur,
    tick: () => {
      const f = g.add
        .image(p.x + Phaser.Math.Between(-10, 10), p.y + 10, 'fx_glow')
        .setTint(Phaser.Math.RND.pick([0x7b2cbf, 0x9d4edd, 0xff9e00]))
        .setScale(0.35)
        .setAlpha(0.8)
        .setDepth(10700)
        .setBlendMode(ADD);
      g.tweens.add({ targets: f, y: f.y - 40, scale: 0.1, alpha: 0, duration: 600, onComplete: () => f.destroy() });
      const now = g.time.now;
      for (const e of g.grid.query(p.x, p.y, 48, g.tmp)) {
        if (now - (touched.get(e) ?? -1e9) < 600) continue;
        touched.set(e, now);
        g.weaponHit(e, phaseHit, p.x, p.y);
        g.fx.ring(e.x, e.y, 30, 0xc77dff, 220);
      }
    },
  });
}

/** 冬瓜和尚：罩下一口金钟，靠近的敌人被震开，被击中时钟声“当”地一响 */
function goldenBell(c: StyleCtx): void {
  const { g, host, sk } = c;
  const p = g.player;
  const dur = Math.max(host.dur(sk.duration ?? 2), 2.5);
  const bell = g.add.graphics().setDepth(11900);
  const R = 70;
  let ringT = 0;
  host.linger({
    t: dur,
    tick: (dt, left) => {
      const fade = Math.min(1, left / 0.4);
      bell.clear();
      bell.fillStyle(0xffd166, 0.18 * fade);
      bell.lineStyle(5, 0xffb703, 0.95 * fade);
      bell.beginPath();
      bell.moveTo(p.x - R, p.y + 30);
      bell.lineTo(p.x - R * 0.82, p.y - 30);
      bell.arc(p.x, p.y - 30, R * 0.82, Math.PI, 0);
      bell.lineTo(p.x + R, p.y + 30);
      bell.closePath();
      bell.fillPath();
      bell.strokePath();
      bell.lineStyle(3, 0xfff3b0, 0.8 * fade).lineBetween(p.x - R * 0.95, p.y + 12, p.x + R * 0.95, p.y + 12);
      bell.fillStyle(0xffffff, 0.35 * fade).fillEllipse(p.x - R * 0.4, p.y - 40, 16, 40);
      ringT -= dt;
      for (const e of g.grid.query(p.x, p.y, R + 20, g.tmp)) {
        if (e.isBoss) continue;
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        e.kvx += Math.cos(a) * 240;
        e.kvy += Math.sin(a) * 240;
        if (ringT <= 0) {
          ringT = 0.3;
          g.fx.ring(p.x, p.y - 10, R + 26, 0xffd166, 260);
          g.fx.label(p.x + Phaser.Math.Between(-30, 30), p.y - R - 20, '当', '#ffd166');
        }
      }
    },
    end: () => bell.destroy(),
  });
}

/** 角色 id → 专属实现（替换该技能类型的通用实现） */
export const STYLES: Record<string, (c: StyleCtx) => void> = {
  carrot: carrotCharge,
  watermelon: melonRoll,
  ginger: gingerBlink,
  dragonfruit: dragonCharge,
  tomato: ketchupBurst,
  chili: flameWave,
  coconut: groundPound,
  mushroom: sporeCloud,
  durian: stinkAura,
  kiwi: detectiveScan,
  blackberry: witherHex,
  lemon: lemonVanish,
  pumpkin: pumpkinPhase,
  wintermelon: goldenBell,
};
