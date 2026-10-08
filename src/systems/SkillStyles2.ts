// 角色专属技能演出（第二批）：分身、环形弹幕、连射、导弹、治疗、领域、自身增益
import Phaser from 'phaser';
import type { BulletShield, GameScene, HitInfo } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import { Rig } from '../objects/Rig';
import { run } from './RunState';
import { audio } from './Audio';
import { HEAL_SCALE, CLONE_HP_PCT, CLONE_BOOM_R, CLONE_BOOM_MULT } from '../data/skills';
import { WEAPON_MAP } from '../data/weapons';
import type { StyleCtx } from './SkillStyles';

const ADD = Phaser.BlendModes.ADD;

function hitAround(g: GameScene, x: number, y: number, r: number, info: HitInfo, knock = 40): Enemy[] {
  const list = [...g.grid.query(x, y, r, g.tmp)];
  for (const e of list) g.weaponHit(e, { ...info, knockback: knock }, x, y);
  return list;
}

function floatText(g: GameScene, x: number, y: number, s: string, color: string, size = 24, life = 900): void {
  const t = g.add
    .text(x, y, s, { fontFamily: 'system-ui', fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 4 })
    .setOrigin(0.5)
    .setDepth(12400);
  g.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: life, onComplete: () => t.destroy() });
}

/** 跟随玩家的增益倒计时圈 */
function buffRing(c: StyleCtx, dur: number, color: number): void {
  const { g, host } = c;
  const gr = g.add.graphics().setDepth(8).setBlendMode(ADD);
  host.linger({
    t: dur,
    tick: (_dt, left) => {
      const p = g.player;
      gr.clear();
      gr.lineStyle(5, color, 0.25).strokeEllipse(p.x, p.y + 20, 96, 38);
      gr.lineStyle(5, color, 0.95);
      gr.beginPath();
      const k = Math.max(0, left / dur);
      for (let i = 0; i <= 32 * k; i++) {
        const a = -Math.PI / 2 + (i / 32) * Math.PI * 2;
        const x = p.x + Math.cos(a) * 48,
          y = p.y + 20 + Math.sin(a) * 19;
        if (i === 0) gr.moveTo(x, y);
        else gr.lineTo(x, y);
      }
      gr.strokePath();
    },
    end: () => gr.destroy(),
  });
}

function makeRig(g: GameScene, scale = 0.9, tint = -1): Rig {
  const p = g.player;
  const rig = new Rig(g, run.char.look, `char_${run.charId}`, p.radius * scale);
  g.add.existing(rig);
  rig.setPosition(p.x, p.y);
  if (tint >= 0) rig.setStatusTint(tint);
  rig.play('spawn', true);
  return rig;
}

// ================================================================
// 分身类：四种完全不同的召唤物
// ================================================================

/** 蓝莓双子：左右各一个分身，以玩家为中心对称旋转，两者之间连着能量线。
 *  分身拿着本体的全部武器一起攻击（伤害 CLONE_WEAPON_MULT，见 WeaponSystem.echo），身体能挡子弹；
 *  被打掉或时间到时，分身的尸体会爆炸。 */
function twinClones(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const dur = host.dur(sk.duration ?? 8);
  const rigs = [makeRig(g, 0.8, 0x74c0fc), makeRig(g, 0.8, 0x74c0fc)];
  for (const r of rigs) r.setAlpha(0.8);
  const link = g.add.graphics().setDepth(10500).setBlendMode(ADD);
  let a = 0;
  const hpMax = Math.max(10, g.stats.maxHp * CLONE_HP_PCT);
  interface Twin {
    rig: Rig;
    hp: number;
    alive: boolean;
    pos: { x: number; y: number };
    shield: BulletShield;
    /** 分身手里的本体武器（只是外观，攻击由 WeaponSystem.echo 结算） */
    guns: Phaser.GameObjects.Image[];
  }
  const twins: Twin[] = rigs.map((rig) => {
    const guns = run.weapons.map((w) => {
      const img = g.add.image(rig.x, rig.y, `weapon_${WEAPON_MAP[w.id].id}`).setAlpha(0.85);
      return img.setScale(40 / Math.max(img.width, img.height));
    });
    const tw: Twin = {
      guns,
      rig,
      hp: hpMax,
      alive: true,
      pos: { x: rig.x, y: rig.y },
      shield: { x: rig.x, y: rig.y, r: rig.radius * 0.9 + 6, color: 0x74c0fc },
    };
    tw.shield.block = (dmg) => {
      tw.hp -= dmg;
      if (tw.hp <= 0) pop(tw);
    };
    g.weaponClones.push(tw.pos);
    g.bulletShields.push(tw.shield);
    return tw;
  });
  // 分身倒下：从武器 / 挡弹列表移除，尸体原地爆炸
  const pop = (tw: Twin): void => {
    if (!tw.alive) return;
    tw.alive = false;
    g.weaponClones = g.weaponClones.filter((x) => x !== tw.pos);
    g.bulletShields = g.bulletShields.filter((x) => x !== tw.shield);
    g.explode(tw.rig.x, tw.rig.y, host.radius(CLONE_BOOM_R), info.dmg * CLONE_BOOM_MULT, info, 0x4dabf7);
    g.shake(0.006, 140);
    for (const gun of tw.guns) gun.destroy();
    tw.rig.die(() => tw.rig.destroy());
  };
  host.linger({
    t: dur,
    tick: (dt) => {
      const p = g.player;
      a += dt * 1.6;
      link.clear();
      twins.forEach((tw, i) => {
        if (!tw.alive) return;
        const r = tw.rig;
        const ang = a + i * Math.PI;
        const ox = r.x;
        r.x = p.x + Math.cos(ang) * 90;
        r.y = p.y + Math.sin(ang) * 50 - 10;
        r.setDepth(r.y);
        tw.pos.x = tw.shield.x = r.x;
        tw.pos.y = tw.shield.y = r.y;
        const t = g.grid.nearest(r.x, r.y, 450);
        r.tick(dt, Math.min(1, Math.abs(r.x - ox) / (dt * 150 + 0.001)), t ? t.x - r.x : 1);
        // 武器环绕分身、朝向最近的敌人
        const aim = t ? Math.atan2(t.y - r.y, t.x - r.x) : 0;
        tw.guns.forEach((gun, k) => {
          const sa = (k / tw.guns.length) * Math.PI * 2 - Math.PI / 2;
          gun
            .setPosition(r.x + Math.cos(sa) * 30, r.y + 5 + Math.sin(sa) * 22)
            .setRotation(aim)
            .setFlipY(Math.cos(aim) < 0)
            .setDepth(r.y + 1);
        });
      });
      if (twins[0].alive && twins[1].alive)
        link.lineStyle(3, 0x74c0fc, 0.6 + Math.sin(g.time.now / 90) * 0.3).lineBetween(rigs[0].x, rigs[0].y, rigs[1].x, rigs[1].y);
    },
    end: () => {
      link.destroy();
      for (const tw of twins) pop(tw);
    },
  });
}

/** 葡萄魔术师：原地留下戴礼帽的幻象吸引敌人，结束时幻象炸成一地葡萄 */
function grapeDecoy(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const dur = Math.min(host.dur(sk.duration ?? 8), 6);
  const rig = makeRig(g, 1, 0xd0a2f7);
  const x = g.player.x,
    y = g.player.y;
  rig.setPosition(x, y).setAlpha(0.85);
  g.decoy = { x, y };
  const hat = g.add.graphics().setDepth(12000);
  hat
    .fillStyle(0x1b1b1b, 1)
    .fillRect(x - 18, y - 74, 36, 30)
    .fillRect(x - 28, y - 46, 56, 6);
  hat.fillStyle(0x9d4edd, 1).fillRect(x - 18, y - 52, 36, 6);
  const lure = g.add.graphics().setDepth(1.6);
  host.linger({
    t: dur,
    tick: (dt) => {
      rig.tick(dt, 0, 1);
      lure
        .clear()
        .lineStyle(3, 0xc77dff, 0.5 + Math.sin(g.time.now / 120) * 0.3)
        .strokeCircle(x, y, 60 + Math.sin(g.time.now / 200) * 10);
      if (Math.random() < 0.15)
        floatText(g, x + Phaser.Math.Between(-40, 40), y - 50, Phaser.Math.RND.pick(['✦', '♣', '♠', '♥']), '#e0aaff', 20);
    },
    end: () => {
      g.decoy = null;
      lure.destroy();
      hat.destroy();
      rig.destroy();
      const r = host.radius(170);
      g.explode(x, y, r, info.dmg * 4, info, 0x9d4edd);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const gp = g.add.circle(x, y, 9, 0x7b2cbf).setDepth(11800);
        g.tweens.add({
          targets: gp,
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.8,
          duration: 420,
          ease: 'Quad.easeOut',
          onComplete: () => {
            g.fx.splat(gp.x, gp.y, 0x7b2cbf, 14);
            gp.destroy();
          },
        });
      }
    },
  });
}

/** 青椒机甲：一架真正的无人机（机身 + 旋翼）绕着玩家飞，发射激光 */
function droneSupport(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const dur = host.dur(sk.duration ?? 8);
  const drone = g.add.graphics().setDepth(12300);
  let a = 0,
    cd = 0,
    rot = 0;
  let x = g.player.x,
    y = g.player.y - 80;
  host.linger({
    t: dur,
    tick: (dt) => {
      const p = g.player;
      a += dt * 1.2;
      rot += dt * 40;
      x += (p.x + Math.cos(a) * 70 - x) * Math.min(1, dt * 5);
      y += (p.y - 80 + Math.sin(a * 2) * 14 - y) * Math.min(1, dt * 5);
      drone.clear();
      drone.fillStyle(0x000000, 0.25).fillEllipse(x, p.y + 30, 44, 12);
      drone.lineStyle(3, 0x495057, 1).lineBetween(x - 26, y, x + 26, y);
      for (const sx of [-26, 26]) {
        const w = Math.abs(Math.cos(rot + sx)) * 18 + 4;
        drone.fillStyle(0xadb5bd, 0.7).fillEllipse(x + sx, y - 6, w * 2, 5);
      }
      drone.fillStyle(0x38b000, 1).fillRoundedRect(x - 16, y - 8, 32, 18, 6);
      drone.fillStyle(0xff1744, 1).fillCircle(x, y + 4, 4);
      cd -= dt;
      const t = g.grid.nearest(x, y, 520);
      if (cd <= 0 && t) {
        cd = 0.35;
        g.fx.beam(x, y + 4, Math.atan2(t.y - y, t.x - x), Math.hypot(t.x - x, t.y - y), 5, 0x80ffdb);
        g.weaponHit(t, { ...info, knockback: 10 }, x, y);
        audio.play(g, 'shoot', 0.03);
      }
    },
    end: () => {
      drone.destroy();
      g.fx.explosion(x, y, 30, 0xadb5bd);
    },
  });
}

/** 黄豆军师：召唤 4 名戴头盔的豆兵，冲向敌人近身肉搏 */
function beanSoldiers(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const dur = host.dur(sk.duration ?? 10);
  const p = g.player;
  const troops = Array.from({ length: 4 }, (_, i) => ({
    x: p.x + Math.cos((i / 4) * Math.PI * 2) * 50,
    y: p.y + Math.sin((i / 4) * Math.PI * 2) * 40,
    cd: 0,
    gfx: g.add.graphics(),
  }));
  const hit = { ...info, dmg: info.dmg * 0.9, knockback: 30 };
  host.linger({
    t: dur,
    tick: (dt) => {
      for (const s of troops) {
        const t = g.grid.nearest(s.x, s.y, 500);
        const tx = t ? t.x : g.player.x + 60,
          ty = t ? t.y : g.player.y;
        const d = Math.hypot(tx - s.x, ty - s.y) || 1;
        if (d > 26) {
          s.x += ((tx - s.x) / d) * 260 * dt;
          s.y += ((ty - s.y) / d) * 260 * dt;
        }
        s.cd -= dt;
        if (t && d < 40 && s.cd <= 0) {
          s.cd = 0.5;
          g.weaponHit(t, hit, s.x, s.y);
          g.fx.slash(t.x, t.y, Math.atan2(ty - s.y, tx - s.x), 30, 0xffd166);
        }
        const bob = Math.abs(Math.sin(g.time.now / 70 + s.x)) * 4;
        s.gfx.clear().setDepth(s.y);
        s.gfx.fillStyle(0x000000, 0.25).fillEllipse(s.x, s.y + 14, 26, 8);
        s.gfx.fillStyle(0xe9c46a, 1).fillEllipse(s.x, s.y - bob, 24, 28);
        s.gfx.fillStyle(0x606c38, 1).fillEllipse(s.x, s.y - 12 - bob, 28, 14);
        s.gfx
          .fillStyle(0x1b1b1b, 1)
          .fillCircle(s.x - 4, s.y - 2 - bob, 2)
          .fillCircle(s.x + 4, s.y - 2 - bob, 2);
      }
    },
    end: () => {
      for (const s of troops) {
        g.fx.burst(s.x, s.y, 0xe9c46a, 6);
        s.gfx.destroy();
      }
    },
  });
}

// ================================================================
// 环形弹幕 / 连射
// ================================================================

/** 玉米枪手：玉米粒抛向四周，落地后“砰”地炸成爆米花（二段伤害） */
function popcorn(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const p = g.player;
  const n = sk.count ?? 18;
  const R = host.radius(240);
  const sx = p.x,
    sy = p.y;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.1, 0.1);
    const d = R * Phaser.Math.FloatBetween(0.55, 1);
    const tx = sx + Math.cos(a) * d,
      ty = sy + Math.sin(a) * d * 0.8;
    const k = g.add.ellipse(sx, sy, 12, 16, 0xffd60a).setDepth(11800);
    g.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 420 + (i % 3) * 60,
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        k.setPosition(sx + (tx - sx) * t, sy + (ty - sy) * t - Math.sin(t * Math.PI) * 90).setRotation(t * 10);
      },
      onComplete: () => {
        k.destroy();
        hitAround(g, tx, ty, 52, info, 30);
        for (let j = 0; j < 5; j++) {
          const pc = g.add.circle(tx, ty, Phaser.Math.Between(6, 10), 0xfff8e1).setDepth(11900);
          g.tweens.add({
            targets: pc,
            x: tx + Phaser.Math.Between(-36, 36),
            y: ty - Phaser.Math.Between(10, 40),
            alpha: 0,
            duration: 500,
            onComplete: () => pc.destroy(),
          });
        }
        g.fx.ring(tx, ty, 52, 0xffd60a, 200);
      },
    });
  }
  audio.play(g, 'shoot', 0.05);
}

/** 石榴炮手：籽弹螺旋喷射 1 秒（不是一次性一圈） */
function seedSpiral(c: StyleCtx): void {
  const { g, host, sk, info, status } = c;
  const n = sk.count ?? 30;
  for (let i = 0; i < n; i++) {
    g.time.delayedCall(i * 33, () => {
      const p = g.player;
      for (const arm of [0, Math.PI]) {
        const a = i * 0.42 + arm;
        const b = g.spawnPlayerBullet('proj_player', p.x, p.y, a, 560, 0.95 * Math.max(0.5, 1 + g.stats.skillRange / 100), 10);
        b.dmg = info.dmg * 0.5;
        b.pierce = 1;
        b.status = status;
        b.setTint(Phaser.Math.RND.pick([0xc1121f, 0xff4d6d, 0xffccd5]));
      }
      if (i % 4 === 0) audio.play(g, 'shoot', 0.03);
    });
  }
  void host;
}

/** 樱桃双枪：左右手交替开火，分别锁定两个不同的目标，枪口火光与弹壳飞出 */
function dualGuns(c: StyleCtx): void {
  const { g, sk, info, status } = c;
  const n = sk.count ?? 12;
  for (let i = 0; i < n; i++) {
    g.time.delayedCall(i * 75, () => {
      const p = g.player;
      const side = i % 2 ? 1 : -1;
      const near = g.grid.query(p.x, p.y, 600, g.tmp).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      const t = near[i % 2] ?? near[0];
      if (!t) return;
      const mx = p.x + side * 26,
        my = p.y - 6;
      const a = Math.atan2(t.y - my, t.x - mx);
      const b = g.spawnPlayerBullet('proj_player', mx, my, a, 1000, 0.8, 10);
      b.dmg = info.dmg;
      b.status = status;
      b.setTint(0xff4d6d);
      const flash = g.add
        .circle(mx + Math.cos(a) * 20, my + Math.sin(a) * 20, 12, 0xffd166)
        .setDepth(12000)
        .setBlendMode(ADD);
      g.tweens.add({ targets: flash, scale: 0.2, alpha: 0, duration: 90, onComplete: () => flash.destroy() });
      const shell = g.add.rectangle(mx, my, 4, 8, 0xe9c46a).setDepth(11900);
      g.tweens.add({
        targets: shell,
        x: mx - side * 30,
        y: my + 30,
        angle: 360,
        alpha: 0,
        duration: 400,
        onComplete: () => shell.destroy(),
      });
      audio.play(g, 'shoot', 0.03);
    });
  }
}

/** 豌豆士兵：在脚下种下一座豌豆炮台，持续 5 秒自动开火 */
function peaTurret(c: StyleCtx): void {
  const { g, host, sk, info, status } = c;
  const x = g.player.x,
    y = g.player.y + 10;
  const dur = host.dur(5);
  const shots = Math.round((sk.count ?? 16) * 1.25);
  const every = dur / shots;
  const gun = g.add.graphics().setDepth(y);
  let cd = 0,
    aim = 0;
  g.fx.burst(x, y, 0x38b000, 10);
  host.linger({
    t: dur,
    tick: (dt) => {
      const t = g.grid.nearest(x, y, 520);
      if (t) aim = Math.atan2(t.y - (y - 20), t.x - x);
      gun.clear();
      gun.fillStyle(0x8d5524, 1).fillRoundedRect(x - 20, y - 6, 40, 22, 5);
      gun.fillStyle(0x38b000, 1).fillCircle(x, y - 20, 18);
      gun.lineStyle(12, 0x2d6a4f, 1).lineBetween(x, y - 20, x + Math.cos(aim) * 34, y - 20 + Math.sin(aim) * 34);
      gun.fillStyle(0x1b1b1b, 1).fillCircle(x + Math.cos(aim) * 34, y - 20 + Math.sin(aim) * 34, 5);
      cd -= dt;
      if (cd <= 0 && t) {
        cd = every;
        const b = g.spawnPlayerBullet('proj_pea', x + Math.cos(aim) * 34, y - 20 + Math.sin(aim) * 34, aim, 850, 0.8, 10);
        b.dmg = info.dmg * 0.8;
        b.status = status;
        audio.play(g, 'shoot', 0.02);
      }
    },
    end: () => {
      gun.destroy();
      g.fx.burst(x, y, 0x38b000, 12);
    },
  });
}

/** 芦笋弓手：蓄力 0.4 秒，射出一支贯穿整条直线的巨型穿心箭 */
function piercingArrow(c: StyleCtx): void {
  const { g, sk, info, status } = c;
  const p = g.player;
  let best: Enemy | null = null;
  for (const e of g.grid.query(p.x, p.y, 700, g.tmp)) if (!best || e.hp > best.hp) best = e;
  const a = best ? Math.atan2(best.y - p.y, best.x - p.x) : g.facing > 0 ? 0 : Math.PI;
  const len = 1400;
  g.fx.telegraphLine(p.x, p.y, Math.cos(a), Math.sin(a), len, 40, 0.4);
  const charge = g.add.circle(p.x, p.y, 40, 0x9be564, 0.4).setDepth(12000).setBlendMode(ADD);
  g.tweens.add({ targets: charge, scale: 0.2, duration: 400, onComplete: () => charge.destroy() });
  g.time.delayedCall(400, () => {
    const sx = g.player.x,
      sy = g.player.y;
    g.fx.beam(sx, sy, a, len, 34, 0x9be564);
    g.fx.beam(sx, sy, a, len, 12, 0xffffff);
    g.cameras.main.shake(180, 0.012);
    const dmg = { ...info, dmg: info.dmg * ((sk.count ?? 8) * 0.45), status, knockback: 90 };
    const seen = new Set<Enemy>();
    for (let d = 0; d <= len; d += 45) {
      const x = sx + Math.cos(a) * d,
        y = sy + Math.sin(a) * d;
      for (const e of g.grid.query(x, y, 40, g.tmp))
        if (!seen.has(e)) {
          seen.add(e);
          g.weaponHit(e, dmg, sx, sy);
        }
    }
  });
}

// ================================================================
// 导弹类
// ================================================================

/** 菠萝船长：海盗炮齐射，三发金币炮弹依次砸向三处敌群 */
function cannonVolley(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const r = host.radius((sk.radius ?? 150) * 0.75);
  const p = g.player;
  const targets = g.grid
    .query(p.x, p.y, 700, g.tmp)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((e) => ({ x: e.x, y: e.y }));
  while (targets.length < 3) targets.push({ x: p.x + Phaser.Math.Between(-250, 250), y: p.y + Phaser.Math.Between(-180, 180) });
  targets.forEach((t, i) => {
    g.time.delayedCall(i * 220, () => {
      const sx = g.player.x,
        sy = g.player.y;
      g.fx.telegraphCircle(t.x, t.y, r, 0.5, 0xffd166);
      g.fx.burst(sx, sy - 10, 0xffffff, 10);
      const ball = g.add.image(sx, sy, 'proj_coin').setDepth(14000).setScale(2.2);
      g.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 500,
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          ball.setPosition(sx + (t.x - sx) * k, sy + (t.y - sy) * k - Math.sin(k * Math.PI) * 220).setRotation(k * 10);
        },
        onComplete: () => {
          ball.destroy();
          g.explode(t.x, t.y, r, info.dmg * 0.6, info, 0xffd166, true);
          g.cameras.main.shake(160, 0.01);
        },
      });
    });
  });
}

/** 山葵爆破手：倒计时 → 从天而降的核弹 → 蘑菇云，地面绿色辣火持续 3 秒 */
function wasabiNuke(c: StyleCtx): void {
  const { g, host, sk, info, status } = c;
  const r = host.radius((sk.radius ?? 190) * 1.2);
  const p = g.player;
  let best = { x: p.x + g.facing * 250, y: p.y },
    bestN = -1;
  for (const e of g.grid.query(p.x, p.y, 650, g.tmp)) {
    const n = g.grid.query(e.x, e.y, r * 0.8, g.tmp2).length;
    if (n > bestN) {
      bestN = n;
      best = { x: e.x, y: e.y };
    }
  }
  const { x, y } = best;
  g.fx.telegraphCircle(x, y, r, 0.9, 0x70e000);
  for (let i = 3; i >= 1; i--) g.time.delayedCall((3 - i) * 300, () => floatText(g, x, y - 20, String(i), '#d9ed92', 40, 300));
  const bomb = g.add
    .image(x, y - 600, 'proj_rocket')
    .setDepth(14000)
    .setScale(3)
    .setRotation(Math.PI / 2);
  g.tweens.add({
    targets: bomb,
    y,
    delay: 400,
    duration: 500,
    ease: 'Quad.easeIn',
    onComplete: () => {
      bomb.destroy();
      g.cameras.main.flash(200, 220, 255, 200, false);
      g.cameras.main.shake(400, 0.03);
      g.explode(x, y, r, info.dmg, info, 0x70e000);
      // 蘑菇云
      for (let i = 0; i < 10; i++) {
        const puffY = y - i * 22;
        const im = g.add
          .image(x + Phaser.Math.Between(-20, 20), puffY, 'fx_glow')
          .setTint(i > 6 ? 0xd9ed92 : 0x70e000)
          .setScale((i > 6 ? 2.2 : 1.1) * (r / 190))
          .setAlpha(0.7)
          .setDepth(13000);
        g.tweens.add({
          targets: im,
          y: puffY - 80,
          alpha: 0,
          scale: im.scale * 1.4,
          duration: 1300,
          delay: i * 30,
          onComplete: () => im.destroy(),
        });
      }
      const ground = g.add
        .image(x, y, 'fx_pool')
        .setTint(0x70e000)
        .setAlpha(0.5)
        .setDepth(1.5)
        .setScale((r * 2) / 256);
      let acc = 0;
      host.linger({
        t: 3,
        tick: (dt) => {
          ground.setAlpha(0.4 + Math.sin(g.time.now / 100) * 0.1);
          acc += dt;
          if (acc < 0.5) return;
          acc = 0;
          for (const e of g.grid.query(x, y, r, g.tmp)) g.weaponHit(e, { ...info, dmg: info.dmg * 0.12, status, knockback: 0 }, x, y);
        },
        end: () => ground.destroy(),
      });
    },
  });
}

// ================================================================
// 治疗类
// ================================================================

/** 蜜桃天使：天降圣光柱 + 一对翅膀，羽毛飘落，回复分 3 次脉冲 */
function angelLight(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const p = g.player;
  const s = g.stats;
  const r = host.radius(sk.radius ?? 150);
  hitAround(g, p.x, p.y, r, info, 60);
  const beam = g.add.graphics().setDepth(11400).setBlendMode(ADD);
  const wings = g.add.graphics().setDepth(10900);
  const total = Math.round(s.maxHp * (sk.heal ?? 0.2) * HEAL_SCALE);
  let pulses = 0,
    acc = 0;
  host.linger({
    t: 1.6,
    tick: (dt, left) => {
      const fade = Math.min(1, left / 0.4);
      beam.clear();
      beam.fillStyle(0xfff3b0, 0.25 * fade).fillRect(p.x - 46, p.y - 700, 92, 720);
      beam.fillStyle(0xffffff, 0.35 * fade).fillRect(p.x - 16, p.y - 700, 32, 720);
      beam.fillStyle(0xfff3b0, 0.3 * fade).fillEllipse(p.x, p.y + 18, 140, 40);
      const flap = Math.sin(g.time.now / 90) * 0.25;
      wings.clear();
      wings.fillStyle(0xffffff, 0.85 * fade);
      for (const side of [-1, 1]) {
        wings.fillEllipse(p.x + side * 44, p.y - 22 - flap * 20, 60, 30 + flap * 18);
        wings.fillEllipse(p.x + side * 60, p.y - 6, 44, 20);
      }
      wings.lineStyle(4, 0xffd166, fade).strokeEllipse(p.x, p.y - 62, 40, 12);
      if (Math.random() < 0.4) {
        const f = g.add.ellipse(p.x + Phaser.Math.Between(-80, 80), p.y - 120, 8, 16, 0xffffff).setDepth(11500);
        g.tweens.add({ targets: f, y: f.y + 140, angle: 200, alpha: 0, duration: 1100, onComplete: () => f.destroy() });
      }
      acc += dt;
      if (acc >= 0.45 && pulses < 3) {
        acc = 0;
        pulses++;
        g.heal(Math.round(total / 3));
        g.fx.ring(p.x, p.y, 80, 0xffd166, 300);
      }
    },
    end: () => {
      beam.destroy();
      wings.destroy();
    },
  });
}

/** 红薯厨神：身边掉下 3 个热腾腾的烤红薯，走过去捡起来才回血（8 秒内有效） */
function yamFeast(c: StyleCtx): void {
  const { g, host, sk, info } = c;
  const p = g.player;
  const s = g.stats;
  hitAround(g, p.x, p.y, host.radius(sk.radius ?? 160), info, 60);
  const each = Math.round((s.maxHp * (sk.heal ?? 0.2) * HEAL_SCALE * 1.2) / 3);
  const yams = Array.from({ length: 3 }, (_, i) => {
    const a = (i / 3) * Math.PI * 2 + Math.random();
    const x = Phaser.Math.Clamp(p.x + Math.cos(a) * 130, g.arena.x + 40, g.arena.right - 40);
    const y = Phaser.Math.Clamp(p.y + Math.sin(a) * 100, g.arena.y + 40, g.arena.bottom - 40);
    const gr = g.add.graphics().setDepth(y);
    gr.fillStyle(0x000000, 0.25).fillEllipse(0, 14, 50, 12);
    gr.fillStyle(0x9c4221, 1).fillEllipse(0, 0, 54, 28);
    gr.fillStyle(0xffb703, 1).fillEllipse(8, -4, 22, 12);
    gr.setPosition(p.x, p.y);
    g.tweens.add({ targets: gr, x, y, duration: 400, ease: 'Back.easeOut' });
    return { x, y, gr, taken: false };
  });
  host.linger({
    t: 8,
    tick: () => {
      for (const yv of yams) {
        if (yv.taken) continue;
        if (Math.random() < 0.15) {
          const st = g.add.circle(yv.x + Phaser.Math.Between(-10, 10), yv.y - 20, 6, 0xffffff, 0.5).setDepth(11000);
          g.tweens.add({ targets: st, y: st.y - 40, alpha: 0, scale: 2, duration: 800, onComplete: () => st.destroy() });
        }
        if (Phaser.Math.Distance.Between(g.player.x, g.player.y, yv.x, yv.y) < 50) {
          yv.taken = true;
          g.heal(each);
          g.fx.ring(yv.x, yv.y, 60, 0xffb703, 260);
          yv.gr.destroy();
        }
      }
    },
    end: () => {
      for (const yv of yams) if (!yv.taken) g.tweens.add({ targets: yv.gr, alpha: 0, duration: 300, onComplete: () => yv.gr.destroy() });
    },
  });
}

// ================================================================
// 领域类
// ================================================================

function fieldLoop(c: StyleCtx, r: number, dur: number, x: number, y: number, tickFx: (left: number) => void, end: () => void): void {
  const { g, host, info } = c;
  let acc = 0.5;
  host.linger({
    t: dur,
    tick: (dt, left) => {
      tickFx(left);
      acc += dt;
      if (acc < 0.5) return;
      acc = 0;
      for (const e of g.grid.query(x, y, r, g.tmp)) g.weaponHit(e, { ...info, knockback: 0 }, x, y);
    },
    end,
  });
}

/** 洋葱大叔：催泪瓦斯云，雾里的敌人头上不停掉眼泪 */
function tearGas(c: StyleCtx): void {
  const { g, host, sk } = c;
  const r = host.radius((sk.radius ?? 180) * 1.15);
  const dur = host.dur(sk.duration ?? 5);
  const x = g.player.x,
    y = g.player.y;
  const clouds = Array.from({ length: 12 }, () => {
    const a = Math.random() * Math.PI * 2,
      d = Math.sqrt(Math.random()) * r * 0.8;
    return g.add
      .image(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.85, 'fx_glow')
      .setTint(0xe9edc9)
      .setAlpha(0.45)
      .setDepth(10800)
      .setScale((r * 0.8) / 128);
  });
  const edge = g.add.graphics().setDepth(1.6);
  fieldLoop(
    c,
    r,
    dur,
    x,
    y,
    (left) => {
      const fade = Math.min(1, left / 0.5);
      clouds.forEach((im, i) => im.setAlpha((0.38 + Math.sin(g.time.now / 400 + i) * 0.08) * fade));
      edge
        .clear()
        .lineStyle(3, 0xccd5ae, 0.6 * fade)
        .strokeCircle(x, y, r);
      if (Math.random() < 0.5) {
        const near = g.grid.query(x, y, r, g.tmp);
        const e = near[Math.floor(Math.random() * near.length)];
        if (e) {
          const d = g.add.ellipse(e.x + Phaser.Math.Between(-8, 8), e.y - e.radius, 6, 10, 0x4cc9f0).setDepth(12000);
          g.tweens.add({ targets: d, y: d.y + 30, alpha: 0, duration: 500, onComplete: () => d.destroy() });
        }
      }
    },
    () => {
      for (const im of clouds) im.destroy();
      edge.destroy();
    },
  );
}

/** 苦瓜冰法：地面结冰，冰刺不断破土，被冻住的敌人裹进冰块 */
function iceField(c: StyleCtx): void {
  const { g, host, sk } = c;
  const r = host.radius((sk.radius ?? 170) * 1.15);
  const dur = host.dur(sk.duration ?? 5);
  const x = g.player.x,
    y = g.player.y;
  const ice = g.add
    .image(x, y, 'fx_pool')
    .setTint(0xcaf0f8)
    .setAlpha(0.6)
    .setDepth(1.5)
    .setScale((r * 2) / 256);
  const frost = g.add.graphics().setDepth(1.6);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    frost.lineStyle(3, 0xffffff, 0.7).lineBetween(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85);
  }
  const blocks = new Map<Enemy, Phaser.GameObjects.Rectangle>();
  fieldLoop(
    c,
    r,
    dur,
    x,
    y,
    (left) => {
      const fade = Math.min(1, left / 0.5);
      ice.setAlpha(0.55 * fade);
      frost.setAlpha(fade);
      if (Math.random() < 0.35) {
        const a = Math.random() * Math.PI * 2,
          d = Math.random() * r;
        const sx = x + Math.cos(a) * d,
          sy = y + Math.sin(a) * d * 0.85;
        const sp = g.add.triangle(sx, sy, 0, 24, 8, 0, 16, 24, 0xe0fbfc).setDepth(sy).setOrigin(0.5, 1);
        sp.setScale(1, 0);
        g.tweens.add({ targets: sp, scaleY: 1.4, duration: 140, yoyo: true, hold: 200, onComplete: () => sp.destroy() });
      }
      for (const e of g.grid.query(x, y, r, g.tmp)) {
        if (e.status.has('freeze') && !blocks.has(e)) {
          const b = g.add
            .rectangle(e.x, e.y, e.radius * 2.2, e.radius * 2.4, 0x90e0ef, 0.45)
            .setStrokeStyle(3, 0xffffff, 0.8)
            .setDepth(e.y + 1);
          blocks.set(e, b);
        }
      }
      for (const [e, b] of blocks)
        if (!e.alive || !e.status.has('freeze')) {
          b.destroy();
          blocks.delete(e);
        } else b.setPosition(e.x, e.y);
    },
    () => {
      ice.destroy();
      frost.destroy();
      for (const b of blocks.values()) b.destroy();
    },
  );
}

// ================================================================
// 自身增益类：每个角色一种看得出来的光环
// ================================================================

function auraLoop(
  c: StyleCtx,
  color: number,
  draw: (gr: Phaser.GameObjects.Graphics, t: number, fade: number) => void,
  spawn?: () => void,
): void {
  const { g, host, sk } = c;
  const dur = host.dur(sk.duration ?? 5);
  buffRing(c, dur, color);
  const gr = g.add.graphics().setDepth(11800);
  host.linger({
    t: dur,
    tick: (_dt, left) => {
      gr.clear();
      draw(gr, g.time.now / 1000, Math.min(1, left / 0.4));
      if (spawn && Math.random() < 0.35) spawn();
    },
    end: () => gr.destroy(),
  });
}

/** 草莓偶像：头顶聚光灯 + 飘出音符与爱心 */
function idolStage(c: StyleCtx): void {
  const g = c.g;
  auraLoop(
    c,
    0xff4d6d,
    (gr, _t, f) => {
      const p = g.player;
      gr.fillStyle(0xfff3b0, 0.18 * f).fillTriangle(p.x - 20, p.y - 400, p.x + 20, p.y - 400, p.x + 80, p.y + 30);
      gr.fillTriangle(p.x - 20, p.y - 400, p.x - 80, p.y + 30, p.x + 80, p.y + 30);
    },
    () => floatText(g, g.player.x + Phaser.Math.Between(-50, 50), g.player.y - 30, Phaser.Math.RND.pick(['♪', '♫', '♥']), '#ff8fab', 24),
  );
}

/** 甜菜狂战士：血红色火焰光环，身体随心跳膨胀 */
function berserkFlames(c: StyleCtx): void {
  const g = c.g;
  const p = g.player;
  const base = p.scale;
  auraLoop(
    c,
    0xd00000,
    (gr, t, f) => {
      const beat = 1 + Math.max(0, Math.sin(t * 9)) * 0.12;
      p.setScale(base * (1 + (beat - 1) * f));
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + t * 2;
        const h = 30 + Math.sin(t * 12 + i) * 12;
        gr.fillStyle(i % 2 ? 0xd00000 : 0xff5400, 0.6 * f);
        gr.fillTriangle(p.x + Math.cos(a) * 34, p.y + 10, p.x + Math.cos(a + 0.3) * 34, p.y + 10, p.x + Math.cos(a + 0.15) * 30, p.y - h);
      }
    },
    undefined,
  );
  c.host.linger({ t: c.host.dur(c.sk.duration ?? 5), end: () => p.setScale(base) });
}

/** 荔枝公主：四叶草绕身旋转，金色闪光 */
function luckyClovers(c: StyleCtx): void {
  const g = c.g;
  const glyphs = Array.from({ length: 4 }, () =>
    g.add
      .text(0, 0, '☘', { fontFamily: 'system-ui', fontSize: '28px', color: '#52b788', stroke: '#1b4332', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(11900),
  );
  auraLoop(
    c,
    0xffd166,
    (_gr, t, f) => {
      const p = g.player;
      glyphs.forEach((gl, i) => {
        const a = t * 2.5 + (i / 4) * Math.PI * 2;
        gl.setPosition(p.x + Math.cos(a) * 56, p.y - 10 + Math.sin(a) * 26).setAlpha(f);
      });
    },
    () => {
      const p = g.player;
      const s = g.add
        .star(p.x + Phaser.Math.Between(-50, 50), p.y + Phaser.Math.Between(-60, 10), 4, 3, 8, 0xffd166)
        .setDepth(12000)
        .setBlendMode(ADD);
      g.tweens.add({ targets: s, scale: 0, angle: 90, duration: 500, onComplete: () => s.destroy() });
    },
  );
  c.host.linger({ t: c.host.dur(c.sk.duration ?? 6), end: () => glyphs.forEach((gl) => gl.destroy()) });
}

/** 豆芽学徒：身体一下子长高，头顶冒出新叶，经验光点被吸进身体 */
function sproutGrow(c: StyleCtx): void {
  const g = c.g;
  const p = g.player;
  const base = p.scale;
  g.tweens.add({ targets: p, scale: base * 1.3, duration: 300, ease: 'Back.easeOut' });
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const o = g.add
      .circle(p.x + Math.cos(a) * 200, p.y + Math.sin(a) * 160, 6, 0x52ff8a)
      .setDepth(12000)
      .setBlendMode(ADD);
    g.tweens.add({ targets: o, x: p.x, y: p.y, delay: i * 30, duration: 450, ease: 'Quad.easeIn', onComplete: () => o.destroy() });
  }
  auraLoop(
    c,
    0x52b788,
    (gr, t, f) => {
      for (let i = 0; i < 3; i++) {
        const sw = Math.sin(t * 4 + i) * 6;
        gr.fillStyle(0x52b788, f).fillEllipse(p.x - 16 + i * 16 + sw, p.y - 56 - (i % 2) * 8, 14, 26);
      }
    },
    undefined,
  );
  c.host.linger({
    t: c.host.dur(c.sk.duration ?? 5),
    end: () => g.tweens.add({ targets: p, scale: base, duration: 250 }),
  });
}

/** 菠萝蜜卫士：一圈尖刺绕身旋转，碰到的敌人被扎 */
function spikeArmor(c: StyleCtx): void {
  const { g, info } = c;
  let acc = 0;
  auraLoop(c, 0x9c6644, (gr, t, f) => {
    const p = g.player;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t * 1.5;
      gr.fillStyle(0x7f5539, f).fillTriangle(
        p.x + Math.cos(a - 0.12) * 34,
        p.y + Math.sin(a - 0.12) * 28,
        p.x + Math.cos(a + 0.12) * 34,
        p.y + Math.sin(a + 0.12) * 28,
        p.x + Math.cos(a) * 62,
        p.y + Math.sin(a) * 50,
      );
    }
  });
  c.host.linger({
    t: c.host.dur(c.sk.duration ?? 6),
    tick: (dt) => {
      acc += dt;
      if (acc < 0.4) return;
      acc = 0;
      for (const e of g.grid.query(g.player.x, g.player.y, 64, g.tmp))
        g.weaponHit(e, { ...info, dmg: info.dmg * 0.25, knockback: 50 }, g.player.x, g.player.y);
    },
  });
}

/** 卷心菜老兵：一层层菜叶包住身体，外面套着气泡屏障 */
function leafLayers(c: StyleCtx): void {
  const g = c.g;
  auraLoop(c, 0x95d5b2, (gr, t, f) => {
    const p = g.player;
    for (let i = 0; i < 3; i++) {
      gr.lineStyle(7 - i * 2, i % 2 ? 0x74c69d : 0x40916c, 0.85 * f);
      gr.beginPath();
      gr.arc(p.x, p.y - 4, 40 + i * 9, t * (i % 2 ? -1 : 1) + i, t * (i % 2 ? -1 : 1) + i + Math.PI * 1.3);
      gr.strokePath();
    }
    gr.lineStyle(3, 0xcaf0f8, 0.7 * f).strokeCircle(p.x, p.y - 4, 74 + Math.sin(t * 5) * 3);
    gr.fillStyle(0xcaf0f8, 0.08 * f).fillCircle(p.x, p.y - 4, 74);
  });
}

export const STYLES_2: Record<string, (c: StyleCtx) => void> = {
  blueberry: twinClones,
  grape: grapeDecoy,
  bellpepper: droneSupport,
  soybean: beanSoldiers,
  corn: popcorn,
  pomegranate: seedSpiral,
  cherry: dualGuns,
  pea: peaTurret,
  asparagus: piercingArrow,
  pineapple: cannonVolley,
  wasabi: wasabiNuke,
  peach: angelLight,
  sweetpotato: yamFeast,
  onion: tearGas,
  bittermelon: iceField,
  strawberry: idolStage,
  beet: berserkFlames,
  lychee: luckyClovers,
  sprout: sproutGrow,
  jackfruit: spikeArmor,
  cabbage: leafLayers,
};
