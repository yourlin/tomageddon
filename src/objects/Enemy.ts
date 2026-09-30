// 敌人逻辑对象（小怪 / 精英 / Boss）。渲染交给 Rig，状态效果交给 StatusSet。
import Phaser from 'phaser';
import type { EnemyDef } from '../data/enemies';
import { AFFIXES, type AffixId, type BossDef, type Pattern } from '../data/bosses';
import type { StatusApply } from '../data/statuses';
import type { GameScene } from '../scenes/GameScene';
import { StatusSet } from '../systems/Status';
import type { Rig } from './Rig';
import { tx } from '../i18n';
import { priceInflation } from '../data/balance';
import { run } from '../systems/RunState';

let enemySeq = 1;

export class Enemy {
  uid = 0;
  x = 0;
  y = 0;
  alive = false;
  radius = 16;
  def: EnemyDef | null = null;
  boss: BossDef | null = null;
  rig: Rig | null = null;
  rigKey = '';
  ring: Phaser.GameObjects.Image | null = null;
  affixes: AffixId[] = [];
  status = new StatusSet();
  hp = 1;
  maxHp = 1;
  dmg = 1;
  speed = 80;
  seeds = 1;
  /** 番茄籽（货币）掉落倍率：√(当前血量 / 基础血量 × 商店涨价倍率)，血越厚、波次越后掉得越多 */
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
  patternT: number[] = [];
  patterns: Pattern[] = [];
  phase2 = false;
  enraged = false;
  contactCd = 0;
  lifeT = 0; // 地形生物剩余存在时间
  chargeDebuff: StatusApply[] | undefined;
  spiral: { left: number; t: number; angle: number; p: Pattern } | null = null;
  private tintVer = -1;

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
    return out;
  }

  private reset(g: GameScene, x: number, y: number, key: string, spec: Parameters<GameScene['rigs']['acquire']>[1], radius: number): void {
    this.uid = enemySeq++;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.alive = true;
    this.kvx = this.kvy = 0;
    this.state = 'move';
    this.stateT = 0;
    this.contactCd = 0;
    this.affixT = 0;
    this.status.clear();
    this.status.ccResist = 0;
    this.rigKey = key;
    this.rig = g.rigs.acquire(key, spec, radius * 1.12);
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
    this.reset(g, x, y, `enemy_${def.id}`, def.look, r);
    this.def = def;
    this.boss = null;
    this.affixes = affixes;
    const eliteMult = affixes.length ? 3.5 : 1;
    this.hp = this.maxHp = Math.round(hp * eliteMult);
    this.dmg = Math.round(dmg * (affixes.length ? 1.3 : 1));
    this.speed = def.speed * speedMult * Phaser.Math.FloatBetween(0.9, 1.1);
    this.seeds = def.seeds * (affixes.length ? 4 : 1);
    this.lootMult = Math.sqrt(Math.max(1, hp / def.hp) * priceInflation(run.wave));
    this.knockResist = def.knockResist ?? 0;
    this.actT = Phaser.Math.FloatBetween(0.5, def.shootCd ?? def.chargeCd ?? def.summonCd ?? def.healCd ?? 1.5);
    this.lifeT = def.life ?? 0;
    this.applyAffixes(g);
  }

  spawnBoss(g: GameScene, def: BossDef, x: number, y: number, hp: number, dmg: number, affixes: AffixId[]): void {
    this.reset(g, x, y, `boss_${def.id}`, def.look, def.radius);
    this.def = null;
    this.boss = def;
    this.affixes = [...(def.affixes ?? []), ...affixes];
    this.hp = this.maxHp = hp;
    this.dmg = dmg;
    this.speed = def.speed;
    this.seeds = def.seeds;
    this.lootMult = Math.sqrt(Math.max(1, hp / def.hp) * priceInflation(run.wave));
    this.knockResist = 0.95;
    this.status.ccResist = def.elite ? 0.5 : 0.75;
    this.patterns = [...def.patterns];
    this.patternT = this.patterns.map((p, i) => p.cd * 0.5 + i * 0.7);
    this.phase2 = false;
    this.enraged = false;
    this.spiral = null;
    this.applyAffixes(g);
  }

  private applyAffixes(g: GameScene): void {
    if (this.affixes.includes('swift')) this.speed *= 1.35;
    if (this.affixes.includes('armored')) this.knockResist = 1;
    if (this.affixes.length || this.boss) {
      const col = this.affixes.length ? AFFIXES[this.affixes[0]].color : (this.boss!.look.aura ?? 0xff3b30);
      this.ring = g.add.image(this.x, this.y, 'fx_ring').setTint(col).setAlpha(0.55).setDepth(2);
      this.ring.setScale((this.radius * 2.6) / 128, (this.radius * 1.3) / 128);
    }
  }

  kill(g: GameScene, animate = true): void {
    this.alive = false;
    this.ring?.destroy();
    this.ring = null;
    const rig = this.rig;
    const key = this.rigKey;
    this.rig = null;
    if (!rig) return;
    if (animate) {
      rig.die(() => g.rigs.release(key, rig));
      g.dying.push(rig);
    } else g.rigs.release(key, rig);
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

  tick(dt: number, g: GameScene): void {
    const p = g.player;
    const dx = p.x - this.x,
      dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    let nx = dx / dist,
      ny = dy / dist;
    const st = this.status;

    const dot = st.update(dt);
    if (dot > 0) {
      g.damageEnemy(this, dot * (1 + g.statusDmgBonus / 100), { color: '#c0ff7a', dot: true });
      if (!this.alive) return;
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
    }
    const sp = this.state === 'charge' ? 1 : slow;
    this.x += (vx * sp + this.kvx) * dt;
    this.y += (vy * sp + this.kvy) * dt;
    const decay = Math.pow(0.0005, dt);
    this.kvx *= decay;
    this.kvy *= decay;
    const a = g.arena;
    this.x = Phaser.Math.Clamp(this.x, a.x + this.radius, a.right - this.radius);
    this.y = Phaser.Math.Clamp(this.y, a.y + this.radius, a.bottom - this.radius);

    // 渲染同步
    const moveAmt = Math.min(1, Math.hypot(vx, vy) / Math.max(1, this.speed));
    rig.setPosition(this.x, this.y).setDepth(this.y);
    rig.tick(dt, moveAmt, dx, nx, ny);
    if (this.ring) this.ring.setPosition(this.x, this.y + this.radius * 0.85).setRotation(this.ring.rotation + dt * 1.5);
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
                  : this.enraged
                    ? 0xff9a9a
                    : -1,
      );
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
    this.actT -= dt;
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
      case 'shooter':
      case 'healer': {
        const keep = d.keepDist ?? 280;
        let m = 0;
        if (dist > keep) m = 1;
        else if (dist < keep * 0.7) m = -0.8;
        if (this.actT <= 0 && !noAttack) {
          if (d.behavior === 'shooter' && dist < keep + 200) {
            this.actT = d.shootCd ?? 2.5;
            rig.play('attack');
            g.enemyShoot(
              this,
              d.shots ?? 1,
              d.spread ?? 0,
              d.projSpeed ?? 250,
              (d.projDmg ?? this.dmg) * this.dealtMult,
              d.projSlow ?? 0,
              d.projKey ?? 'proj_enemy',
              1,
              this.attackDebuffs(),
            );
          } else if (d.behavior === 'healer') {
            this.actT = d.healCd ?? 3;
            rig.play('cast');
            g.healEnemiesAround(this, d.healRadius ?? 180, d.healAmount ?? 0.2);
          }
        }
        return [nx * s * m, ny * s * m];
      }
      case 'bomber': {
        if (this.state === 'fuse') {
          this.stateT -= dt;
          if (this.stateT <= 0) g.enemyExplode(this, d.blastRadius ?? 80);
          return [nx * s * 0.3, ny * s * 0.3];
        }
        if (dist < 70) {
          this.state = 'fuse';
          this.stateT = d.fuse ?? 0.8;
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
          g.addSlime(this.x, this.y, d.id === 'oil_blob' ? 0x3d2c2e : 0xb5e48c);
        }
        return [nx * s, ny * s];
      default:
        return [nx * s, ny * s];
    }
  }

  private bossAI(dt: number, g: GameScene, nx: number, ny: number, dist: number): [number, number] {
    const b = this.boss!;
    const rig = this.rig!;
    if (!this.phase2 && b.phase2 && this.hp / this.maxHp <= b.phase2.at) {
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
        g.bossRing(this, sp.p.count ?? 6, sp.p.speed ?? 220, sp.p.dmg ?? 1, sp.angle, sp.p.slow ?? 0, sp.p.debuff);
        if (--sp.left <= 0) this.spiral = null;
      }
    }
    if (this.state === 'windup') {
      this.stateT -= dt;
      if (this.stateT <= 0) {
        this.state = 'charge';
        this.stateT = 0.7;
        rig.play('charge');
      }
      return [0, 0];
    }
    if (this.state === 'charge') {
      this.stateT -= dt;
      if (this.stateT <= 0) {
        this.state = 'move';
        rig.play('move', true);
      }
      return [this.dirX * this.stateSpeed, this.dirY * this.stateSpeed];
    }
    if (this.state === 'blink') {
      this.stateT -= dt;
      return [0, 0];
    }
    const noAttack = this.status.totals.noAttack;
    for (let i = 0; i < this.patterns.length && !noAttack; i++) {
      this.patternT[i] -= dt;
      if (this.patternT[i] > 0) continue;
      const p = this.patterns[i];
      this.patternT[i] = p.cd * cdMult;
      const dmg = this.dmg * this.dealtMult;
      if (p.type !== 'charge') rig.play(p.type === 'summon' || p.type === 'buff' ? 'cast' : 'attack');
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
          for (let k = 0; k < (p.count ?? 8); k++)
            g.enemyShoot(
              this,
              1,
              0,
              (p.speed ?? 260) * Phaser.Math.FloatBetween(0.7, 1.2),
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
          return [0, 0];
      }
      break;
    }
    const s = this.speed * (this.enraged ? 1.5 : 1);
    return dist > this.radius + 40 ? [nx * s, ny * s] : [0, 0];
  }
}
