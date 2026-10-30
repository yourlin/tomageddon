// 敌人逻辑对象（小怪 / 精英 / Boss）。渲染交给 EntityVisual（Rig 或外部美术），状态效果交给 StatusSet。
import { bump } from '../systems/Counters';
import { motionFacing } from './MotionFacing';
import { dotColor, type StatusId } from '../data/statuses';
import Phaser from 'phaser';
import type { EnemyDef } from '../data/enemies';
import { AFFIXES, type AffixId, type BossDef, type BossPhase, type Pattern } from '../data/bosses';
import { drawAffixDeco } from './AffixDeco';
import type { StatusApply } from '../data/statuses';
import type { GameScene } from '../scenes/GameScene';
import { StatusSet } from '../systems/Status';
import { run } from '../systems/RunState';
import type { EntityVisual, VisualIdent } from './EntityVisual';
import { tx } from '../i18n';
import { BALANCE, seedValue, volleySpeedMult, bombFuse } from '../data/balance';

let enemySeq = 1;

/** 远程小怪的射程（见 BALANCE.enemyRanged） */
export const shooterRange = (d: EnemyDef): number => (d.keepDist ?? 280) * BALANCE.enemyRanged.rangeMult;

/** 前两波掉落加成：保证第一波结束就能买得起道具 */

export class Enemy {
  uid = 0;
  x = 0;
  y = 0;
  alive = false;
  radius = 16;
  def: EnemyDef | null = null;
  boss: BossDef | null = null;
  rig: EntityVisual | null = null;
  ring: Phaser.GameObjects.Image | null = null;
  /** 精英词缀装饰（每帧重画） */
  deco: Phaser.GameObjects.Graphics | null = null;
  affixes: AffixId[] = [];
  status = Object.assign(new StatusSet(), { onApplied: (id: StatusId) => bump(`inflict:${id}`) });
  hp = 1;
  maxHp = 1;
  dmg = 1;
  speed = 80;
  seeds = 1;
  /** 番茄籽（货币）掉落倍率：(当前血量 / 基础血量 × 商店涨价倍率)^0.42，血越厚、波次越后掉得越多 */
  lootMult = 1;
  knockResist = 0;
  kvx = 0;
  kvy = 0;
  state: 'move' | 'windup' | 'charge' | 'fuse' | 'blink' = 'move';
  stateT = 0;
  stateSpeed = 600;
  actT = 0;
  affixT = 0;
  dirX = 0;
  dirY = 0;
  wander = Math.random() * 10;
  /** 绕障碍物的方向（Arena.steer 读写；每只怪随机一侧，被墙堵死时翻转） */
  nav = { side: Math.random() < 0.5 ? -1 : 1 };
  patternT: number[] = [];
  patterns: Pattern[] = [];
  phase2 = false;
  /** 多阶段 Boss：当前阶段、本阶段已过时间、转阶段剩余时间（> 0 时无敌、不行动）、阶段色调 */
  phaseIdx = 0;
  phaseT = 0;
  phaseTrans = 0;
  phaseTint = -1;
  /** 前代 Boss 的残影（腐烂之王召唤）：不分阶段、不掉落、不计成就，本体死亡时一起消失 */
  shadow = false;
  /** 危机等级追加的招式（多阶段 Boss 换阶段时保留） */
  extraPatterns: Pattern[] = [];
  /** Rig 的基础缩放（转阶段脉动、阶段体型变化以它为基准） */
  baseScale = 1;
  enraged = false;
  contactCd = 0;
  lifeT = 0; // 地形生物剩余存在时间
  chargeDebuff: StatusApply[] | undefined;
  spiral: { left: number; t: number; angle: number; p: Pattern } | null = null;
  private tintVer = -1;
  /** 自爆引信：总时长（闪烁频率按剩余比例加快）、闪烁相位、地上爆炸范围圈的取消函数（引信中被打死时撤掉） */
  private fuseMax = 0;
  private fusePhase = 0;
  private fuseCancel: (() => void) | null = null;

  get isBoss(): boolean {
    return this.boss !== null;
  }
  get isElite(): boolean {
    return this.boss?.elite === true || this.affixes.length > 0;
  }
  get name(): string {
    return this.boss?.name ?? this.def?.name ?? '';
  }

  /** 本敌人攻击附带的减益（自身 + 词缀） */
  attackDebuffs(extra?: StatusApply[]): StatusApply[] {
    const out: StatusApply[] = [...(extra ?? []), ...(this.def?.onHit ?? []), ...(this.boss?.contact ?? [])];
    if (this.affixes.includes('frost')) out.push({ id: 'slow', dur: 2, stacks: 2 });
    if (this.affixes.includes('venom')) out.push({ id: 'poison', dur: 4, stacks: 3 });
    if (this.affixes.includes('cursed')) out.push({ id: 'curse', dur: 3 });
    if (this.affixes.includes('burning')) out.push({ id: 'burn', dur: 3, stacks: 2 });
    if (this.affixes.includes('bleeding')) out.push({ id: 'bleed', dur: 3, stacks: 2 });
    if (this.affixes.includes('weakening')) out.push({ id: 'weaken', dur: 3 });
    return out;
  }

  private reset(g: GameScene, x: number, y: number, ident: VisualIdent, radius: number): void {
    this.uid = enemySeq++;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.alive = true;
    this.kvx = this.kvy = 0;
    this.state = 'move';
    this.stateT = 0;
    this.fuseMax = 0;
    this.fuseCancel = null;
    this.contactCd = 0;
    this.affixT = 0;
    this.status.clear();
    this.status.ccResist = 0;
    this.rig = g.rigs.acquire(ident, radius * 1.12);
    this.rig.setPosition(x, y).setDepth(y);
    this.rig.play('spawn', true);
    this.tintVer = -1;
  }

  spawnMinion(
    g: GameScene,
    def: EnemyDef,
    x: number,
    y: number,
    hp: number,
    dmg: number,
    speedMult: number,
    affixes: AffixId[] = [],
  ): void {
    const r = def.radius * (affixes.length ? 1.25 : 1);
    // 词缀精英：独立的 champ 变体（Rig 换金色配色 / 外部素材的精英图或金色光环），怪多时也一眼能认出
    this.reset(g, x, y, affixes.length ? { kind: 'enemy', id: def.id, variant: 'champ' } : { kind: 'enemy', id: def.id }, r);
    this.def = def;
    this.boss = null;
    this.affixes = affixes;
    const eliteMult = affixes.length ? 3.5 : 1;
    this.hp = this.maxHp = Math.round(hp * eliteMult);
    this.dmg = Math.round(dmg * (affixes.length ? 1.3 : 1));
    this.speed = def.speed * speedMult * Phaser.Math.FloatBetween(0.9, 1.1);
    this.seeds = def.seeds * (affixes.length ? 4 : 1);
    this.lootMult = seedValue();
    this.knockResist = def.knockResist ?? 0;
    this.actT = Phaser.Math.FloatBetween(0.5, def.shootCd ?? def.chargeCd ?? def.summonCd ?? def.healCd ?? 1.5);
    this.lifeT = def.life ?? 0;
    this.applyAffixes(g);
  }

  spawnBoss(g: GameScene, def: BossDef, x: number, y: number, hp: number, dmg: number, affixes: AffixId[]): void {
    this.reset(g, x, y, { kind: 'boss', id: def.id }, def.radius);
    this.def = null;
    this.boss = def;
    this.affixes = [...(def.affixes ?? []), ...affixes];
    this.hp = this.maxHp = hp;
    this.dmg = dmg;
    this.speed = def.speed;
    this.seeds = def.seeds;
    this.lootMult = seedValue();
    this.knockResist = 0.95;
    this.status.ccResist = def.elite ? 0.5 : 0.75;
    this.shadow = false;
    this.extraPatterns = [];
    this.phaseIdx = 0;
    this.phaseT = 0;
    this.phaseTrans = 0;
    this.phaseTint = -1;
    this.baseScale = this.rig?.scaleX ?? 1;
    if (def.phases?.length) this.setPhasePatterns(def.phases[0], true);
    else {
      this.patterns = [...def.patterns];
      this.patternT = this.patterns.map((p, i) => p.cd * 0.5 + i * 0.7);
    }
    this.phase2 = false;
    this.enraged = false;
    this.spiral = null;
    this.applyAffixes(g);
  }

  private applyAffixes(g: GameScene): void {
    if (this.affixes.includes('swift')) this.speed *= 1.35;
    if (this.affixes.includes('armored')) this.knockResist = 1;
    if (this.affixes.includes('giant')) {
      this.hp = this.maxHp = Math.round(this.maxHp * 1.6);
      this.radius *= 1.2;
    }
    if (this.affixes.includes('brutal')) this.dmg = Math.round(this.dmg * 1.4);
    if (this.affixes.includes('unstoppable')) {
      this.knockResist = 1;
      this.status.ccResist = 1;
    }
    if (this.affixes.includes('rich')) this.seeds *= 3;
    if (this.affixes.length || this.boss) {
      const col = this.affixes.length ? AFFIXES[this.affixes[0]].color : (this.boss!.look.aura ?? 0xff3b30);
      this.ring = g.add.image(this.x, this.y, 'fx_ring').setTint(col).setAlpha(0.55).setDepth(2);
      this.ring.setScale((this.radius * 2.6) / 128, (this.radius * 1.3) / 128);
    }
    this.deco?.destroy();
    this.deco = this.affixes.length ? g.add.graphics() : null;
  }

  /** 熄灭自爆引信（撤掉地上的范围圈，回到移动状态） */
  cancelFuse(): void {
    this.fuseCancel?.();
    this.fuseCancel = null;
    if (this.state === 'fuse') this.state = 'move';
  }

  kill(g: GameScene, animate = true): void {
    this.alive = false;
    this.fuseCancel?.();
    this.fuseCancel = null;
    this.ring?.destroy();
    this.ring = null;
    this.deco?.destroy();
    this.deco = null;
    const rig = this.rig;
    this.rig = null;
    if (!rig) return;
    if (animate) {
      rig.die(() => g.rigs.release(rig));
      g.dying.push(rig);
    } else g.rigs.release(rig);
  }

  /** 伤害倍率（易伤、坚甲、屏障…） */
  get takenMult(): number {
    let m = 1 + this.status.totals.dmgTaken / 100;
    if (this.affixes.includes('armored')) m *= 0.7;
    return Math.max(0.1, m);
  }

  get dealtMult(): number {
    return Math.max(0.2, 1 + this.status.totals.dmgDealt / 100) * (this.enraged ? 1.3 : 1);
  }

  /** 攻击 / 技能冷却推进倍率（急速、浸湿、腐烂等 attackSpeed 汇总；下限 0.3） */
  get actRate(): number {
    return Math.max(0.3, 1 + this.status.totals.attackSpeed / 100);
  }

  tick(dt: number, g: GameScene): void {
    // 隐身技能留下的诱饵：敌人会去追诱饵而不是玩家
    const p = g.decoy ?? g.player;
    const dx = p.x - this.x,
      dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    let nx = dx / dist,
      ny = dy / dist;
    const st = this.status;

    const dot = st.update(dt);
    if (dot > 0) {
      // 每种持续伤害各跳一个数字，颜色区分（灼烧红、中毒绿……）
      for (const p of st.dotParts) {
        // 角色专属（黑莓女巫）：持续伤害按暴击率暴击（×2）
        const crit = run.specials.dotPerk === 'dotCrit' && Math.random() * 100 < g.stats.crit;
        g.damageEnemy(this, p.dmg * (1 + g.statusDmgBonus / 100) * (crit ? 2 : 1), { color: dotColor(p.id), dot: true, crit, src: p.src });
        if (!this.alive) return;
      }
    }
    this.contactCd -= dt;
    if (this.lifeT > 0) {
      this.lifeT -= dt;
      if (this.lifeT <= 0) {
        g.burrow(this);
        return;
      }
    }
    this.affixTick(dt, g);
    const tot = st.totals;
    const slow = Math.max(0.2, 1 + tot.speed / 100);
    if (tot.confuse) {
      const a = this.wander + g.time.now / 700;
      nx = Math.cos(a);
      ny = Math.sin(a);
    }

    let vx = 0,
      vy = 0;
    const rig = this.rig!;
    if (tot.disable) {
      rig.play(st.has('freeze') ? 'frozen' : 'stun');
      if (this.state === 'windup' || this.state === 'charge') this.state = 'move';
    } else {
      if (rig.state === 'frozen' || rig.state === 'stun') rig.play('idle', true);
      const v = this.boss ? this.bossAI(dt, g, nx, ny, dist) : this.minionAI(dt, g, nx, ny, dist);
      vx = v[0];
      vy = v[1];
      // 贴着障碍物时沿边缘绕行（冲锋保持直线）：否则正面顶上圆形障碍物会原地卡住
      if (this.state !== 'charge') [vx, vy] = g.arena.steer(this.x, this.y, this.radius, vx, vy, this.nav);
    }
    const sp = this.state === 'charge' ? 1 : slow;
    this.x += (vx * sp + this.kvx) * dt;
    this.y += (vy * sp + this.kvy) * dt;
    const decay = Math.pow(0.0005, dt);
    this.kvx *= decay;
    this.kvy *= decay;
    // 留在场地内并推出障碍物（沿障碍物边缘滑开）
    ({ x: this.x, y: this.y } = g.arena.clamp(this.x, this.y, this.radius));

    // 渲染同步
    const moveAmt = Math.min(1, Math.hypot(vx, vy) / Math.max(1, this.speed));
    rig.setPosition(this.x, this.y).setDepth(this.y);
    rig.tick(dt, moveAmt, motionFacing(vx, vy, dx), nx, ny);
    if (this.ring) this.ring.setPosition(this.x, this.y + this.radius * 0.85).setRotation(this.ring.rotation + dt * 1.5);
    if (this.deco) {
      this.deco.clear().setDepth(this.y + 0.5);
      drawAffixDeco(this.deco, this.affixes, this.x, this.y - this.radius * 0.2, this.radius, g.time.now / 1000);
    }
    if (st.version !== this.tintVer) {
      this.tintVer = st.version;
      rig.setStatusTint(
        st.has('freeze')
          ? 0x9bd8ff
          : st.has('burn')
            ? 0xffb38a
            : st.has('poison')
              ? 0xb8f28a
              : st.has('curse')
                ? 0xc8a2ff
                : st.has('slow')
                  ? 0xbfe9ff
                  : st.has('corrode')
                    ? 0xd4e09b
                    : st.has('soaked')
                      ? 0xa0c4ff
                      : this.enraged
                        ? 0xff9a9a
                        : this.boss?.chargeImmune && this.state === 'charge'
                          ? 0xffe082
                          : this.phaseTint,
      );
    }
    // 自爆引信：红色与原色交替闪烁，越接近爆炸闪得越快（每秒 3 → 12 次）
    if (this.state === 'fuse' && this.fuseMax > 0) {
      const left = Math.max(0, this.stateT) / this.fuseMax;
      this.fusePhase += dt * (3 + (1 - left) * 9);
      rig.setStatusTint(this.fusePhase % 1 < 0.5 ? 0xff2a2a : -1);
      this.tintVer = -1; // 引信被打断（被冰冻、开发者改状态等）后按状态重新上色
    }
  }

  private affixTick(dt: number, g: GameScene): void {
    if (!this.affixes.length) return;
    this.affixT += dt;
    if (this.affixes.includes('regen') && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.015 * dt);
    if (this.affixes.includes('berserk') && !this.enraged && this.hp < this.maxHp * 0.4) {
      this.enraged = true;
      this.speed *= 1.3;
      g.fx.label(this.x, this.y - this.radius, tx('狂暴！', 'Enraged!'), '#ff3b30');
    }
    if (this.affixT >= 8) {
      this.affixT = 0;
      if (this.affixes.includes('shielded')) {
        this.status.apply({ id: 'barrier', dur: 3 });
        g.fx.ring(this.x, this.y, this.radius * 1.6, 0x4cc9f0, 400);
      }
    }
    if (this.affixes.includes('commander') && Math.floor(this.affixT * 2) !== Math.floor((this.affixT - dt) * 2))
      g.buffAllies(this, 220, [{ id: 'haste', dur: 1.2, stacks: 2 }], false);
  }

  private minionAI(dt: number, g: GameScene, nx: number, ny: number, dist: number): [number, number] {
    const d = this.def!;
    this.actT -= dt * this.actRate;
    const s = this.speed;
    const noAttack = this.status.totals.noAttack;
    const rig = this.rig!;
    switch (d.behavior) {
      case 'flee': {
        // 远离玩家并左右跳跃
        const t = (this.wander += dt * 4);
        const away = dist < 320 ? 1 : 0.2;
        return [(-nx * away + Math.cos(t) * 0.8) * s, (-ny * away + Math.sin(t * 1.3) * 0.8) * s];
      }
      case 'wander': {
        const t = (this.wander += dt * 3);
        return [(nx + Math.cos(t) * -ny * 1.2) * s, (ny + Math.cos(t) * nx * 1.2) * s];
      }
      case 'charger': {
        if (this.state === 'move') {
          if (this.actT <= 0 && dist < 420 && !noAttack) {
            this.state = 'windup';
            this.stateT = d.windup ?? 0.5;
            this.dirX = nx;
            this.dirY = ny;
            rig.play('windup');
          }
          return [nx * s, ny * s];
        }
        if (this.state === 'windup') {
          this.stateT -= dt;
          if (this.stateT <= 0) {
            this.state = 'charge';
            this.stateT = 0.55;
            rig.play('charge');
          }
          return [0, 0];
        }
        this.stateT -= dt;
        if (this.stateT <= 0) {
          this.state = 'move';
          this.actT = d.chargeCd ?? 3;
          rig.play('move', true);
        }
        return [this.dirX * (d.chargeSpeed ?? 500), this.dirY * (d.chargeSpeed ?? 500)];
      }
      case 'shooter': {
        // 射程边缘游走：远了靠近、太近后退，在射程内绕着玩家横向移动（每隔一段时间换方向），只在射程内开火
        const ER = BALANCE.enemyRanged;
        const range = shooterRange(d);
        let mx: number, my: number;
        if (dist > range * 0.95) [mx, my] = [nx, ny];
        else if (dist < range * 0.6) [mx, my] = [-nx * 0.8, -ny * 0.8];
        else {
          const side = Math.sin(g.time.now / 1700 + this.wander * 3) > 0 ? 0.55 : -0.55;
          const radial = Phaser.Math.Clamp((dist - range * ER.hover) / (range * 0.2), -1, 1) * 0.5;
          mx = -ny * side + nx * radial;
          my = nx * side + ny * radial;
        }
        if (this.actT <= 0 && !noAttack && dist <= range) {
          // 远程小怪多时每只开火变慢（精英不受影响）
          this.actT = (d.shootCd ?? 2.5) * (this.isElite ? 1 : g.shooterCrowdMult());
          rig.play('attack');
          g.enemyShoot(
            this,
            d.shots ?? 1,
            d.spread ?? 0,
            (d.projSpeed ?? 250) * ER.projSpeed,
            this.dmg * (d.projMult ?? 1) * this.dealtMult,
            d.projSlow ?? 0,
            d.projKey ?? 'proj_enemy',
            1,
            this.attackDebuffs(),
            undefined,
            this.isElite ? undefined : range * ER.bulletReach,
          );
        }
        return [mx * s, my * s];
      }
      case 'healer': {
        const keep = d.keepDist ?? 280;
        let m = 0;
        if (dist > keep) m = 1;
        else if (dist < keep * 0.7) m = -0.8;
        if (this.actT <= 0 && !noAttack) {
          if (d.behavior === 'healer') {
            this.actT = d.healCd ?? 3;
            rig.play('cast');
            g.healEnemiesAround(this, d.healRadius ?? 180, d.healAmount ?? 0.2);
          }
        }
        return [nx * s * m, ny * s * m];
      }
      case 'bomber': {
        const r = d.blastRadius ?? 80;
        if (this.state === 'fuse') {
          this.stateT -= dt;
          if (this.stateT <= 0) {
            this.fuseCancel = null; // 预警圈此时正好涨满、自己消失
            g.enemyExplode(this, r);
          }
          return [0, 0]; // 点燃后原地不动，地上的范围圈才准
        }
        if (dist < 70) {
          // 引信按威力算（最短 1.5 秒，见 bombFuse）；「急燃」词缀减半
          this.state = 'fuse';
          this.stateT = this.fuseMax = bombFuse(this.dmg * this.dealtMult, r, this.affixes.includes('shortFuse'));
          this.fusePhase = 0;
          this.fuseCancel = g.fx.telegraphCircle(this.x, this.y, r, this.stateT, 0xff5400);
          rig.play('windup');
        }
        return [nx * s, ny * s];
      }
      case 'summoner':
        if (this.actT <= 0) {
          this.actT = d.summonCd ?? 5;
          rig.play('cast');
          g.summonAround(this, d.summon ?? 'fly', d.summonCount ?? 2);
        }
        return [nx * s, ny * s];
      case 'trail':
        if (this.actT <= 0) {
          this.actT = d.trailCd ?? 0.5;
          // 粘液伤害 = 留下它的怪物接触伤害的 35%（随波次 / 章节 / 精英缩放同步成长）
          g.addSlime(this.x, this.y, d.id === 'oil_blob' ? 0x3d2c2e : 0xb5e48c, this.dmg * this.dealtMult * 0.35);
        }
        return [nx * s, ny * s];
      default:
        return [nx * s, ny * s];
    }
  }

  private bossAI(dt: number, g: GameScene, nx: number, ny: number, dist: number): [number, number] {
    const b = this.boss!;
    const rig = this.rig!;
    if (b.phases?.length && !this.shadow) {
      this.phaseT += dt;
      // 转阶段：原地不动、不放招（动画与运镜由 BossPhaseDirector 驱动）
      if (this.phaseTrans > 0) return [0, 0];
    } else if (!this.phase2 && b.phase2 && this.hp / this.maxHp <= b.phase2.at) {
      this.phase2 = true;
      this.speed *= b.phase2.speedMult;
      this.patterns.push(...b.phase2.add);
      this.patternT.push(...b.phase2.add.map(() => 1.5));
      for (const s of b.phase2.buff ?? []) this.status.apply(s);
      g.onBossPhase2(this);
    }
    const cdMult = (this.phase2 && b.phase2 ? b.phase2.cdMult : 1) * (this.enraged ? 0.5 : 1);

    if (this.spiral) {
      this.spiral.t -= dt;
      if (this.spiral.t <= 0) {
        const sp = this.spiral;
        sp.t = 0.14;
        sp.angle += 0.28;
        // 螺旋每 0.14 秒一环、连续很多环：按约 3 环的总发数算齐射减速
        const c = sp.p.count ?? 6;
        g.bossRing(this, c, sp.p.speed ?? 220, sp.p.dmg ?? 1, sp.angle, sp.p.slow ?? 0, sp.p.debuff, c * 3);
        if (--sp.left <= 0) this.spiral = null;
      }
    }
    if (this.state === 'windup') {
      this.stateT -= dt;
      if (this.stateT <= 0) {
        this.state = 'charge';
        this.stateT = 0.7;
        rig.play('charge');
        if (b.chargeImmune) this.refreshTint();
      }
      return [0, 0];
    }
    if (this.state === 'charge') {
      this.stateT -= dt;
      if (this.stateT <= 0) {
        this.state = 'move';
        rig.play('move', true);
        if (b.chargeImmune) this.refreshTint();
      }
      return [this.dirX * this.stateSpeed, this.dirY * this.stateSpeed];
    }
    if (this.state === 'blink') {
      // 瞬移中原地不动；结束后回到移动状态（否则 Boss 第一次瞬移后就再也不走、不放招）
      this.stateT -= dt;
      if (this.stateT <= 0) {
        this.state = 'move';
        // Reappearance starts after 0.5s, just before the blink ends at 0.6s.
        // Let its timed spawn pose finish while movement/AI resumes normally.
        if (rig.state !== 'spawn') rig.play('move', true);
      }
      return [0, 0];
    }
    const noAttack = this.status.totals.noAttack;
    for (let i = 0; i < this.patterns.length && !noAttack; i++) {
      this.patternT[i] -= dt * this.actRate;
      if (this.patternT[i] > 0) continue;
      const p = this.patterns[i];
      this.patternT[i] = p.cd * cdMult;
      if (this.firePattern(g, p, nx, ny)) return [0, 0];
      break;
    }
    const s = this.speed * (this.enraged ? 1.5 : 1);
    return dist > this.radius + 40 ? [nx * s, ny * s] : [0, 0];
  }

  /** 放出一个招式（Boss / 精英 AI 与转阶段的转场招式共用）；冲锋开始时返回 true（本帧不再移动） */
  firePattern(g: GameScene, p: Pattern, nx: number, ny: number): boolean {
    const rig = this.rig!;
    const dmg = this.dmg * this.dealtMult;
    if (p.type !== 'charge') {
      const action = p.type === 'summon' || p.type === 'buff' ? 'cast' : 'attack';
      // Independent pattern cooldowns can fire on consecutive updates. Keep a
      // special action visible; projectiles and effects still fire on time.
      if (action === 'attack') rig.tryAttackAnimation(true);
      else rig.play(action);
    }
    switch (p.type) {
      case 'ring':
        g.bossRing(this, p.count ?? 12, p.speed ?? 220, p.dmg ?? 1, Math.random() * Math.PI, p.slow ?? 0, p.debuff);
        break;
      case 'spiral':
        this.spiral = { left: p.waves ?? 12, t: 0, angle: Math.random() * 6, p };
        break;
      case 'aimed':
        g.enemyShoot(
          this,
          p.count ?? 3,
          p.spread ?? 30,
          p.speed ?? 300,
          dmg * (p.dmg ?? 1),
          p.slow ?? 0,
          'proj_enemy',
          1.4,
          this.attackDebuffs(p.debuff),
        );
        break;
      case 'scatter':
        // 逐发调用（每发随机方向）：按总发数算齐射减速
        for (let k = 0; k < (p.count ?? 8); k++)
          g.enemyShoot(
            this,
            1,
            0,
            (p.speed ?? 260) * volleySpeedMult(p.count ?? 8) * Phaser.Math.FloatBetween(0.7, 1.2),
            dmg * (p.dmg ?? 1),
            p.slow ?? 0,
            p.slow ? 'proj_ice' : 'proj_enemy',
            1.2,
            this.attackDebuffs(p.debuff),
            Math.random() * Math.PI * 2,
          );
        break;
      case 'summon':
        g.summonAround(this, p.enemy ?? 'mold', p.count ?? 4);
        break;
      case 'slam':
        g.bossSlam(this, p);
        break;
      case 'hazard':
        g.bossHazard(this, p);
        break;
      case 'laser':
        g.bossLaser(this, p);
        break;
      case 'buff':
        g.buffAllies(this, p.radius ?? 260, p.buff ?? [], true);
        break;
      case 'teleport':
        this.state = 'blink';
        this.stateT = 0.6;
        g.bossTeleport(this);
        break;
      case 'charge':
        this.state = 'windup';
        this.stateT = p.windup ?? 0.8;
        this.stateSpeed = p.speed ?? 600;
        this.chargeDebuff = p.debuff;
        this.dirX = nx;
        this.dirY = ny;
        rig.play('windup');
        g.telegraphLine(this.x, this.y, nx, ny, this.stateSpeed * 0.7, this.radius, this.stateT);
        return true;
    }
    return false;
  }

  /** 切换到某个阶段的招式表（first：开场第一阶段，冷却按原来的错开方式；之后每个招式 1.5 秒后才第一次放） */
  setPhasePatterns(ph: BossPhase, first = false): void {
    const b = this.boss!;
    this.patterns = [...ph.patterns, ...this.extraPatterns];
    this.patternT = this.patterns.map((p, i) => (first ? p.cd * 0.5 + i * 0.7 : 1.5 + i * 0.6));
    this.speed = b.speed * (ph.speedMult ?? 1);
  }

  /** 按当前状态重新上色（阶段色调变化后调用） */
  refreshTint(): void {
    this.tintVer = -1;
  }
}
