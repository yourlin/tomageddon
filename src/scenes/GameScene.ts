// 核心战斗场景：固定竞技场，玩家移动躲避，武器自动攻击
import { tip, seenTip } from '../systems/Tutorial';
import { treeTotals } from '../systems/TalentTree';
import { bump, bumpMax } from '../systems/Counters';
import Phaser from 'phaser';
import { run } from '../systems/RunState';
import {
  BALANCE,
  waveDuration,
  spawnInterval,
  spawnBatch,
  armorMultiplier,
  moveSpeed,
  fruitDropChance,
  crateDropChance,
  chapterScale,
  regenPerSecond,
  explodeSizeMultiplier,
} from '../data/balance';
import { addMods, type Stats } from '../data/stats';
import { ENEMY_MAP } from '../data/enemies';
import { BOSS_MAP, AFFIX_IDS, type AffixId, type Pattern } from '../data/bosses';
import type { WeaponEffect, WeaponClass } from '../data/weapons';
import { STATUSES, type StatusApply, type StatusId } from '../data/statuses';
import { Enemy } from '../objects/Enemy';
import { Bullet } from '../objects/Bullet';
import { Rig } from '../objects/Rig';
import { SpatialGrid } from '../systems/Grid';
import { WeaponSystem } from '../systems/WeaponSystem';
import { SkillSystem } from '../systems/SkillSystem';
import { StatusSet } from '../systems/Status';
import { RigPool } from '../systems/RigPool';
import { Fx } from '../systems/Fx';
import { controls, readPad } from '../systems/Controls';
import { addDangerPatterns } from '../systems/Danger';
import { audio } from '../systems/Audio';
import { save, persist, markSeen } from '../systems/Save';
import { paintArena } from '../art/ArenaArt';
import { Terrain, TERRAIN_INFO } from '../systems/Terrain';
import { tx } from '../i18n';
import { checkAchievements, setInRun } from '../systems/Achievements';
import { TalentSystem, waveGrowthMods } from '../systems/Talents';
import { saveRun } from '../systems/RunState';
import { minionStats, bossStats } from '../systems/EnemyScaling';

/** 开发者沙盒（?dev）：不刷怪、不计时、不掉落、不结算；玩家阵亡时原地复活。其余行为由开发者界面通过 onStep 驱动 */
export interface SandboxOpts {
  /** 是否运行章节地形机制（油渍、地鼠、冰面…） */
  terrain: boolean;
  /** 本次沙盒的阵亡次数（非无敌模式下统计） */
  deaths: number;
  /** 按本章本波的真实刷怪逻辑持续出怪 */
  waves?: boolean;
}

export interface HitInfo {
  dmg: number;
  crit: boolean;
  knockback?: number;
  effect?: WeaponEffect;
  lifeSteal?: number;
  weaponId?: string;
  cls?: WeaponClass;
  status?: StatusApply[];
  /** 爆炸造成的伤害（部分天赋按此判断） */
  explosion?: boolean;
  /** 武器词条带来的暴击伤害 %，暴击时与道具暴击伤害相加后统一结算 */
  critBonus?: number;
}

interface Pickup {
  img: Phaser.GameObjects.Image;
  kind: 'seed' | 'fruit' | 'crate';
  value: number;
  /** 番茄籽附带的经验（与货币分开计算） */
  xp: number;
  alive: boolean;
  magnet: boolean;
  t: number;
}
interface Hazard {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  r: number;
  t: number;
  slow: number;
  dps: number;
  tick: number;
  debuff?: StatusApply[];
}
interface SpawnMark {
  img: Phaser.GameObjects.Image;
  t: number;
  x: number;
  y: number;
  id: string;
  boss: boolean;
  affixes: AffixId[];
}

const isDebuff = (id: StatusId) => STATUSES[id].kind === 'debuff';
const HEADLESS_MODE = new URLSearchParams(location.search).has('headless');
/** 调试：window.__dmg = [] 后记录玩家受到的每次伤害 */
const DEBUG_DMG = {
  push: (r: unknown[]) => {
    const w = window as unknown as { __dmg?: unknown[][] };
    w.__dmg?.push(r);
  },
};

export class GameScene extends Phaser.Scene {
  /** 调试：每帧模拟步数（用于自动化平衡测试）；Infinity = 每帧在 simBudgetMs 内尽可能多跑 */
  static simSpeed = 1;
  /** 开发者沙盒：慢放倍率（< 1 慢放，仅在 simSpeed ≤ 1 时生效） */
  static simScale = 1;
  /** 加速模拟时每帧最多占用的毫秒数（0 = 不限，按 simSpeed 固定步数） */
  static simBudgetMs = 0;
  /** 调试：每个模拟步开始前回调（测试机器人按模拟时间决策，与帧率无关） */
  static onStep: ((g: GameScene) => void) | null = null;
  /** 开发者沙盒配置；null = 正常游戏 */
  static sandbox: SandboxOpts | null = null;

  arena!: Phaser.Geom.Rectangle;
  player!: Rig;
  pstatus = new StatusSet();
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  enemyBullets: Bullet[] = [];
  pickups: Pickup[] = [];
  hazards: Hazard[] = [];
  marks: SpawnMark[] = [];
  grid = new SpatialGrid<Enemy>(80);
  tmp: Enemy[] = [];
  tmp2: Enemy[] = [];
  dying: Rig[] = [];
  fx!: Fx;
  rigs!: RigPool;
  weapons!: WeaponSystem;
  skill!: SkillSystem;
  stats!: Stats;
  rangeMult = 1;
  statusDmgBonus = 0;
  moveX = 0;
  /** 当前这次命中的伤害来源（weaponHit 设置，damageEnemy 读取） */
  dmgSrc = '';
  moveY = 0;
  facing = 1;
  timeLeft = 20;
  waveOver = false;
  boss: Enemy | null = null;
  spawnT = 1;
  iframes = 0;
  talent!: TalentSystem;
  /** 最近一次武器命中的信息（击杀类天赋使用） */
  private lastHit = { crit: false, explosion: false };
  regenAcc = 0;
  shieldT = 0;
  shieldUp = false;
  lsCd = 0;
  killCounter = 0;
  eliteSpawned = false;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  shieldImg!: Phaser.GameObjects.Image;
  dead = false;
  statusVer = -1;
  periodicT: number[] = [];
  auraT: number[] = [];
  cleanseT = 0;
  cratesDropped = 0;
  /** 本波小怪掉落的果实数（有上限） */
  fruitsDropped = 0;
  ccImmuneUntil = 0;
  terrain!: Terrain;
  overtime = 0;
  /** 本波是否受过伤（无伤成就） */
  tookDamage = false;
  /** Boss 加时层数与狂暴威压计时 */
  enrageStacks = 0;
  private pressureT = 0;
  envVX = 0;
  envVY = 0;
  slippery = false;
  velX = 0;
  velY = 0;

  constructor() {
    super('Game');
  }

  create(): void {
    const A = BALANCE.arena;
    this.arena = new Phaser.Geom.Rectangle(0, 0, A.width, A.height);
    this.dying = [];
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.pickups = [];
    this.hazards = [];
    this.marks = [];
    this.waveOver = false;
    this.boss = null;
    this.dead = false;
    this.eliteSpawned = false;
    this.iframes = 0;
    this.regenAcc = 0;
    this.shieldT = 0;
    this.killCounter = 0;
    this.cleanseT = 0;
    this.statusVer = -1;
    this.cratesDropped = 0;
    this.fruitsDropped = 0;
    this.overtime = 0;
    this.tookDamage = false;
    setInRun(true);
    const sandbox = GameScene.sandbox;
    // 每波开始时自动保存，暂停后可“保存并退出”，下次从本波开始继续
    if (!HEADLESS_MODE && !sandbox) saveRun('wave');
    this.enrageStacks = 0;
    this.pressureT = 0;
    this.pstatus = new StatusSet();
    controls.reset();

    const ch = run.chapter;
    this.cameras.main.setBackgroundColor(ch.bgColor);
    const bgKey = this.textures.exists(`arena_ch${ch.id}`) ? `arena_ch${ch.id}` : paintArena(this, ch.id);
    this.add
      .image(A.width / 2, A.height / 2, bgKey)
      .setDisplaySize(A.width + 160, A.height + 160)
      .setDepth(-10);

    this.rigs = new RigPool(this);
    this.fx = new Fx(this);

    const c = run.char;
    this.player = new Rig(this, c.look, `char_${c.id}`, BALANCE.player.radius * 1.25);
    this.add.existing(this.player);
    this.player.setPosition(A.width / 2, A.height / 2);
    this.player.play('spawn', true);
    this.shieldImg = this.add.image(0, 0, 'fx_bubble').setAlpha(0.8).setVisible(false);

    this.velX = this.velY = 0;
    this.terrain = new Terrain(this);
    this.recalcStats();
    this.weapons = new WeaponSystem(this);
    this.skill = new SkillSystem(this);
    this.talent = new TalentSystem(this);
    run.hp = this.stats.maxHp; // 每波开始回满生命
    const sp = run.specials;
    for (const s of sp.waveStartSelf) this.pstatus.apply(s);
    this.periodicT = sp.periodicSelf.map((p) => p.every);
    this.auraT = sp.aura.map(() => 0);

    for (let i = 0; i < BALANCE.maxEnemies + 20; i++) this.enemies.push(new Enemy());
    for (let i = 0; i < 300; i++) {
      const b = new Bullet(this);
      this.add.existing(b);
      b.setDepth(12000);
      this.bullets.push(b);
    }
    for (let i = 0; i < 300; i++) {
      const b = new Bullet(this);
      this.add.existing(b);
      b.setDepth(12001);
      this.enemyBullets.push(b);
    }
    for (const p of ch.pool.filter((q) => q.from <= run.wave + 2)) {
      const d = ENEMY_MAP[p.enemy];
      this.rigs.warm(`enemy_${d.id}`, d.look, d.radius * 1.12, 6);
    }

    const cam = this.cameras.main;
    if (HEADLESS_MODE) cam.setVisible(false); // 测试模式不绘制战斗画面
    cam.setBounds(-60, -60, A.width + 120, A.height + 120);
    cam.startFollow(this.player, true, 0.12, 0.12);

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ESC,P') as Record<string, Phaser.Input.Keyboard.Key>;

    this.timeLeft = sandbox ? 999 : waveDuration(run.wave);
    this.spawnT = 0.5;
    if (!sandbox && run.isBossWave()) {
      const bossId = run.bossForWave();
      this.time.delayedCall(800, () => this.queueSpawn(bossId, true));
    }

    if (!HEADLESS_MODE) {
      this.scene.launch('Hud');
      this.scene.bringToTop('Hud');
    }
    // 章节音乐；Boss 登场时切到 Boss 战音乐，Boss 倒下后切回章节音乐
    audio.playMusic(this, ch.music);
    if (!sandbox && run.wave === 1)
      TERRAIN_INFO[ch.id]?.forEach((m, i) => this.time.delayedCall(1500 + i * 2600, () => this.terrainNotice(m)));
    // 新手引导：第 1 波讲移动，技能第一次就绪时讲技能；精英 / Boss 出场时各讲一次
    if (!sandbox && run.wave === 1) this.time.delayedCall(500, () => tip('move', this, true));
    if (!sandbox && !seenTip('skill'))
      this.time.addEvent({ delay: 1000, loop: true, callback: () => this.skill?.ready && tip('skill', this, true) });
    this.events.on('bossSpawn', (e: Enemy) => {
      if (e.boss && !GameScene.sandbox) tip(e.boss.elite ? 'elite' : 'boss', this, true);
    });
    audio.play(this, 'wave');
    this.events.once('shutdown', () => {
      this.weapons.destroy();
      this.skill.destroy();
    });
  }

  recalcStats(): void {
    const s: Stats = { ...run.stats };
    if (this.skill?.buffMods) addMods(s, this.skill.buffMods);
    const t = this.pstatus.totals;
    s.speed += Math.max(-50, t.speed);
    s.attackSpeed += t.attackSpeed;
    s.damage += t.dmgDealt;
    s.armor += t.armor;
    s.crit += t.crit;
    s.dodge += t.dodge;
    s.luck += t.luck;
    s.lifeSteal += t.lifeSteal;
    s.dodge = Math.min(s.dodge, run.dodgeCap);
    // 吸血不设百分比上限：强度由触发冷却（每秒最多回复量）限制，见 BALANCE.player.lifeStealTickCd
    this.rangeMult = Math.max(0.3, 1 + t.range / 100);
    this.statusDmgBonus = run.specials.statusDmg;
    this.stats = s;
  }

  update(_t: number, dms: number): void {
    const n = GameScene.simSpeed;
    if (n > 1) {
      // 加速模拟：固定步长。计时器随每个模拟步手动推进，与帧率无关（Boss 预警、延时效果不失真）；
      // 补间按“本帧模拟时长 / 真实帧时长”加速
      const budget = GameScene.simBudgetMs,
        t0 = performance.now();
      let steps = 0;
      this.time.timeScale = 0;
      while (steps < n && this.sys.isActive()) {
        if (budget && performance.now() - t0 >= budget) break;
        // 阵亡后只推进计时器（结算界面由延时调用触发）
        if (!this.dead) GameScene.onStep?.(this);
        this.advanceClock(1000 / 60);
        if (!this.dead) this.step(1 / 60);
        steps++;
      }
      this.tweens.timeScale = Math.max(1, (steps * 1000) / 60 / Math.max(1, dms));
      return;
    }
    this.time.timeScale = GameScene.simScale;
    this.tweens.timeScale = GameScene.simScale;
    if (!this.dead) GameScene.onStep?.(this);
    this.step(Math.min(dms / 1000, 1 / 20) * GameScene.simScale);
  }

  /** 开发者沙盒：场景暂停时手动推进一个 1/60 秒的模拟步（单步调试） */
  devFrame(): void {
    if (this.dead) return;
    const ts = this.time.timeScale;
    this.time.timeScale = 0;
    GameScene.onStep?.(this);
    this.advanceClock(1000 / 60);
    this.step(1 / 60, true);
    this.time.timeScale = ts;
  }

  /** 手动推进场景计时器 ms 毫秒（自动推进已被 timeScale = 0 关闭） */
  private advanceClock(ms: number): void {
    const c = this.time;
    c.timeScale = 1;
    c.preUpdate(c.now, ms);
    c.update(c.now + ms, ms);
    c.timeScale = 0;
  }

  private step(dt: number, force = false): void {
    if (this.dead || (!force && !this.sys.isActive())) return;
    const sandbox = GameScene.sandbox;
    if (
      !sandbox &&
      (Phaser.Input.Keyboard.JustDown(this.keys.ESC) || Phaser.Input.Keyboard.JustDown(this.keys.P) || controls.pausePressed)
    ) {
      controls.pausePressed = false;
      this.scene.pause();
      this.scene.pause('Hud');
      this.scene.launch('Pause');
      return;
    }
    this.grid.clear();
    for (const e of this.enemies) if (e.alive) this.grid.insert(e);
    this.updatePlayerStatus(dt);
    if (!sandbox || sandbox.terrain) this.terrain.update(dt);
    this.updatePlayer(dt);
    // 沙盒可选「真实刷怪」：按本章本波的刷怪逻辑出怪，但不计时、不结算
    if (!this.waveOver && (!sandbox || sandbox.waves)) {
      if (!sandbox) this.updateTimer(dt);
      this.updateSpawning(dt);
    }
    this.weapons.update(dt);
    this.skill.update(dt);
    this.talent.update(dt);
    for (const e of this.enemies) if (e.alive) e.tick(dt, this);
    if (this.dying.length) {
      for (const r of this.dying) r.tick(dt, 0, 0);
      this.dying = this.dying.filter((r) => r.state === 'die' && r.visible);
    }
    this.separate();
    this.updateContact();
    this.updateBullets(dt);
    this.updateEnemyBullets(dt);
    this.updatePickups(dt);
    this.updateHazards(dt);
    this.updateMarks(dt);
    this.fx.update(dt);
  }

  // ---------------- 玩家状态 ----------------
  applyPlayerStatus(list: StatusApply[] | undefined): void {
    if (!list || this.waveOver) return;
    const now = this.time.now;
    for (let s of list) {
      if (isDebuff(s.id) && (this.skill.invulnerable || this.pstatus.totals.immune)) continue;
      // 控制类减益：最长 0.8 秒，结束后 1.5 秒免疫，防止被连续控死
      if (STATUSES[s.id].disable) {
        if (now < this.ccImmuneUntil) continue;
        if (s.chance !== undefined && Math.random() * 100 >= s.chance) continue;
        s = { ...s, chance: undefined, dur: Math.min(0.8, s.dur) };
        this.ccImmuneUntil = now + (s.dur + 1.5) * 1000;
      }
      // 只在「新获得」减益时弹出名称；刷新持续时间 / 叠层不再重复弹字（地面效果每帧刷新会刷屏、拖慢性能）
      const had = this.pstatus.has(s.id);
      if (this.pstatus.apply(s) && isDebuff(s.id) && !had && (s.chance === undefined || s.chance < 100)) {
        this.fx.label(this.player.x, this.player.y - 40, STATUSES[s.id].name, '#' + STATUSES[s.id].color.toString(16).padStart(6, '0'));
      }
    }
  }

  private updatePlayerStatus(dt: number): void {
    const st = this.pstatus;
    const dot = st.update(dt);
    // 玩家承受的持续伤害随波次与章节成长（早期生命值低，避免被毒死）
    if (dot > 0 && !this.waveOver)
      this.hurtDirect(dot * (0.35 + 0.045 * (run.wave - 1)) * chapterScale(run.chapter.dmgMult, run.wave), '#9ef01a');
    if (st.version !== this.statusVer) {
      this.statusVer = st.version;
      this.recalcStats();
      this.player.setStatusTint(
        st.has('freeze') ? 0x9bd8ff : st.has('poison') ? 0xb8f28a : st.has('burn') ? 0xffb38a : st.has('curse') ? 0xc8a2ff : -1,
      );
    }
    if (st.totals.regen > 0) this.heal(st.totals.regen * dt, false);
    const sp = run.specials;
    sp.periodicSelf.forEach((p, i) => {
      this.periodicT[i] -= dt;
      if (this.periodicT[i] <= 0) {
        this.periodicT[i] = p.every;
        this.applyPlayerStatus(p.status);
      }
    });
    sp.aura.forEach((a, i) => {
      this.auraT[i] -= dt;
      if (this.auraT[i] > 0) return;
      this.auraT[i] = a.every;
      for (const e of this.grid.query(this.player.x, this.player.y, a.radius, this.tmp2)) for (const s of a.status) e.status.apply(s);
    });
    if (sp.cleanseEvery) {
      this.cleanseT += dt;
      if (this.cleanseT >= sp.cleanseEvery) {
        this.cleanseT = 0;
        if (st.list.some((x) => isDebuff(x.id))) {
          st.cleanse();
          this.fx.ring(this.player.x, this.player.y, 70, 0xfff3b0, 400);
        }
      }
    }
  }

  // ---------------- 玩家 ----------------
  private updatePlayer(dt: number): void {
    const k = this.keys;
    let mx = controls.joyX,
      my = controls.joyY;
    const pad = readPad();
    if (pad.connected && (pad.x || pad.y)) {
      mx = pad.x;
      my = pad.y;
    }
    if (pad.skill) controls.skillPressed = true;
    if (pad.pause) controls.pausePressed = true;
    if (k.A.isDown || k.LEFT.isDown) mx = -1;
    if (k.D.isDown || k.RIGHT.isDown) mx = 1;
    if (k.W.isDown || k.UP.isDown) my = -1;
    if (k.S.isDown || k.DOWN.isDown) my = 1;
    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    const tot = this.pstatus.totals;
    if (tot.confuse) {
      const a = Math.sin(this.time.now / 300) * 1.6;
      const c = Math.cos(a),
        s = Math.sin(a);
      [mx, my] = [mx * c - my * s, mx * s + my * c];
    }
    if (tot.disable) {
      mx = 0;
      my = 0;
    }
    this.moveX = mx;
    this.moveY = my;

    const canCast = !this.waveOver && !tot.disable && !this.pstatus.has('silence');
    if (Phaser.Input.Keyboard.JustDown(k.SPACE) || controls.skillPressed) {
      controls.skillPressed = false;
      if (canCast) this.skill.use();
    } else if (canCast && save.settings.autoSkill && this.skill.ready && this.skill.autoWants()) this.skill.use();

    const p = this.player;
    if (!this.skill.dash) {
      const sp = moveSpeed(this.stats) * (this.slippery ? 1.2 : 1);
      if (this.slippery) {
        // 冰面：速度更快但有惯性
        const k = Math.min(1, dt * 2.2);
        this.velX += (mx * sp - this.velX) * k;
        this.velY += (my * sp - this.velY) * k;
      } else {
        this.velX = mx * sp;
        this.velY = my * sp;
      }
      p.x = Phaser.Math.Clamp(p.x + (this.velX + this.envVX) * dt, this.arena.x + 20, this.arena.right - 20);
      p.y = Phaser.Math.Clamp(p.y + (this.velY + this.envVY) * dt, this.arena.y + 20, this.arena.bottom - 20);
    }
    if (mx < -0.1) this.facing = -1;
    else if (mx > 0.1) this.facing = 1;
    const t = this.weapons.list[0]?.target;
    const lx = t ? Math.sign(t.x - p.x) * 0.8 : 0,
      ly = t ? Phaser.Math.Clamp((t.y - p.y) / 300, -1, 1) : 0;
    if (tot.disable) p.play(this.pstatus.has('freeze') ? 'frozen' : 'stun');
    else if (p.state === 'frozen' || p.state === 'stun') p.play('idle', true);
    p.tick(dt, Math.hypot(mx, my), this.facing, lx, ly);
    p.setDepth(11000); // 玩家始终绘制在怪物之上，保证可读性

    if (this.iframes > 0) {
      this.iframes -= dt;
      if (!this.skill.invulnerable) p.setAlpha(Math.sin(this.time.now / 40) > 0 ? 0.55 : 1);
      if (this.iframes <= 0 && !this.skill.invulnerable) p.setAlpha(1);
    }
    const s = this.stats;
    if (s.regen > 0 && run.hp < s.maxHp) {
      this.regenAcc += regenPerSecond(s.regen) * dt;
      if (this.regenAcc >= 1) {
        const h = Math.floor(this.regenAcc);
        this.regenAcc -= h;
        this.heal(h, false);
      }
    }
    const sp = run.specials;
    if (sp.shield && !this.shieldUp) {
      this.shieldT += dt;
      if (this.shieldT >= sp.shield) {
        this.shieldUp = true;
        this.shieldT = 0;
      }
    }
    const hasShield = this.shieldUp || this.pstatus.has('shield');
    this.shieldImg
      .setVisible(hasShield)
      .setPosition(p.x, p.y - 4)
      .setDepth(11002)
      .setScale(0.9 + Math.sin(this.time.now / 200) * 0.03);
    if (this.lsCd > 0) this.lsCd -= dt;
  }

  heal(n: number, show = true): void {
    if (n <= 0 || this.pstatus.totals.noHeal || this.dead) return;
    n *= run.rules.heal;
    const before = run.hp;
    run.hp = Math.min(this.stats.maxHp, run.hp + n);
    if (show && run.hp - before >= 1) this.fx.number(this.player.x, this.player.y - 20, run.hp - before, '#52ff8a');
  }

  /** 不经过闪避/护甲的直接伤害（持续伤害） */
  private hurtDirect(amount: number, color: string): void {
    if (this.dead || this.skill.invulnerable || this.pstatus.totals.immune) return;
    const dmg = this.pstatus.absorb(amount);
    if (dmg <= 0) return;
    run.hp -= dmg;
    this.tookDamage = true;
    DEBUG_DMG?.push([run.wave, Math.round(this.timeLeft), 'dot:' + color, Math.round(dmg * 10) / 10]);
    if (dmg >= 1) this.fx.number(this.player.x, this.player.y - 10, dmg, color);
    if (run.hp <= 0) this.onPlayerDeath();
  }

  damagePlayer(amount: number, source?: Enemy, debuffs?: StatusApply[]): void {
    if (this.waveOver || this.dead || this.iframes > 0 || this.skill.invulnerable || this.pstatus.totals.immune) return;
    const s = this.stats;
    const sp = run.specials;
    if (Math.random() * 100 < s.dodge) {
      this.fx.label(this.player.x, this.player.y, tx('闪避', 'Dodge'), '#81ecec');
      this.iframes = 0.15;
      this.applyPlayerStatus(sp.onDodgeSelf);
      this.talent.onDodge();
      if (treeTotals().dodgeKnives) this.throwKnives(treeTotals().dodgeKnives);
      return;
    }
    if (this.shieldUp) {
      this.shieldUp = false;
      this.fx.ring(this.player.x, this.player.y, 60, 0x9bf6ff);
      this.iframes = 0.3;
      return;
    }
    let dmg = amount * armorMultiplier(s.armor) * (1 + this.pstatus.totals.dmgTaken / 100) * this.talent.takenMult();
    dmg = this.pstatus.absorb(dmg);
    this.applyPlayerStatus(debuffs);
    if (dmg <= 0) {
      this.fx.ring(this.player.x, this.player.y, 50, 0x9bf6ff, 200);
      this.iframes = 0.2;
      return;
    }
    dmg = Math.max(1, Math.round(dmg));
    run.hp -= dmg;
    this.tookDamage = true;
    DEBUG_DMG?.push([
      run.wave,
      Math.round(this.timeLeft),
      source?.name ?? (debuffs?.length ? 'bullet/aoe+' + debuffs.map((d) => d.id).join('/') : 'bullet/aoe'),
      dmg,
    ]);
    this.iframes = BALANCE.player.iframes;
    this.player.play('hurt');
    this.fx.number(this.player.x, this.player.y - 10, dmg, '#ff4d4d');
    audio.play(this, 'hurt', 0.1);
    this.shake(0.008, 120);
    this.cameras.main.flash(80, 120, 0, 0, false);
    this.applyPlayerStatus(sp.onHurtSelf);
    this.talent.onHurt();
    if (source?.alive) {
      for (const d of sp.onHurtEnemy) source.status.apply(d);
      const th = sp.thorns + this.pstatus.totals.reflect;
      if (th) this.damageEnemy(source, th * (1 + s.damage / 100), { color: '#b2bec3' });
      if (source.alive && source.affixes.includes('vampiric')) source.hp = Math.min(source.maxHp, source.hp + dmg * 5);
    }
    if (run.hp <= 0) this.onPlayerDeath();
  }

  /** 狂暴威压伤害：直接扣血，不可闪避/格挡 */
  private enragePressure(amount: number): void {
    if (this.waveOver || this.dead) return;
    const dmg = Math.max(1, Math.round(amount));
    run.hp -= dmg;
    this.tookDamage = true;
    DEBUG_DMG?.push([run.wave, 0, 'enrage-pressure', dmg]);
    this.fx.number(this.player.x, this.player.y - 10, dmg, '#ff3b30');
    if (run.hp <= 0) this.onPlayerDeath();
  }

  private onPlayerDeath(): void {
    if (this.dead) return;
    // 开发者沙盒：不结算，原地满血复活并计数
    const sandbox = GameScene.sandbox;
    if (sandbox) {
      sandbox.deaths++;
      run.hp = this.stats.maxHp;
      this.iframes = 1;
      this.pstatus.cleanse();
      this.fx.ring(this.player.x, this.player.y, 160, 0xff3b30, 500, true);
      this.fx.label(
        this.player.x,
        this.player.y - 40,
        tx(`阵亡 ×${sandbox.deaths}（沙盒复活）`, `Died ×${sandbox.deaths} (sandbox revive)`),
        '#ff6b6b',
      );
      return;
    }
    if (this.talent.preventDeath()) return;
    // 天赋「不屈」：每局一次，以少量生命站起来
    const cd = treeTotals().cheatDeath;
    if (cd && !run.cheatDeathUsed) {
      run.cheatDeathUsed = true;
      run.hp = Math.ceil(this.stats.maxHp * (cd / 100));
      this.iframes = 1.5;
      this.fx.ring(this.player.x, this.player.y, 220, 0x4cc9f0, 600, true);
      this.fx.label(this.player.x, this.player.y, tx('不屈！', 'Unyielding!'), '#4cc9f0');
      return;
    }
    if (run.specials.revive > run.revivesUsed) {
      run.revivesUsed++;
      save.stats.revives++;
      run.hp = Math.ceil(this.stats.maxHp * 0.5);
      this.iframes = 2;
      this.pstatus.cleanse();
      this.fx.ring(this.player.x, this.player.y, 300, 0xffd166, 700, true);
      this.fx.label(this.player.x, this.player.y, tx('凤凰涅槃！', 'Phoenix Rebirth!'), '#ffd166');
      for (const b of this.enemyBullets) if (b.alive) b.kill();
      return;
    }
    run.hp = 0;
    this.dead = true;
    audio.play(this, 'die');
    audio.stopMusic();
    this.fx.burst(this.player.x, this.player.y, run.char.color, 40);
    this.fx.splat(this.player.x, this.player.y, run.char.color, 60);
    this.player.die(() => this.player.setVisible(false));
    this.recordProgress();
    this.time.delayedCall(1400, () => {
      this.scene.stop('Hud');
      this.scene.start('Result', { win: false });
    });
  }

  recordProgress(): void {
    const key = `${run.charId}_${run.chapterId}`;
    save.bestWave[key] = Math.max(save.bestWave[key] ?? 0, run.wave);
    save.totalKills += this.killCounter;
    this.killCounter = 0;
    persist();
  }

  shake(intensity: number, dur: number): void {
    if (save.settings.shake) this.cameras.main.shake(dur, intensity * (save.settings.shakeScale ?? 1));
  }

  // ---------------- 波次与刷怪 ----------------
  private updateTimer(dt: number): void {
    this.timeLeft -= dt;
    if (run.isBossWave()) {
      if (this.timeLeft <= 0 && this.boss?.alive && !this.boss.enraged) {
        this.boss.enraged = true;
        this.boss.status.apply({ id: 'enrage', dur: 999 });
        this.fx.label(this.boss.x, this.boss.y - 60, tx('狂暴！', 'Enraged!'), '#ff3b30');
        this.shake(0.01, 400);
      }
      // 加时：每 10 秒 Boss 伤害 ×1.25 并叠一层狂暴威压，不设上限
      if (this.timeLeft <= 0 && this.boss?.alive) {
        this.overtime += dt;
        if (this.overtime >= 10) {
          this.overtime = 0;
          this.enrageStacks++;
          this.boss.dmg *= 1.25;
          this.fx.label(this.boss.x, this.boss.y - 60, tx('越来越狂暴！', 'Growing more furious!'), '#ff3b30');
        }
        // 狂暴威压：Boss 打不中时也能结束战斗（高闪避/高回复的僵局）。
        // 每秒 3% 最大生命 × 1.25^层数，无视闪避、护甲与无敌帧；复活道具仍然生效
        this.pressureT += dt;
        if (this.pressureT >= 1) {
          this.pressureT -= 1;
          this.enragePressure(this.stats.maxHp * 0.03 * 1.25 ** this.enrageStacks);
        }
      }
      this.timeLeft = Math.max(0, this.timeLeft);
      return;
    }
    const dur = waveDuration(run.wave);
    if (run.isEliteWave() && !this.eliteSpawned && this.timeLeft < dur * 0.75) {
      this.eliteSpawned = true;
      this.queueSpawn(run.eliteForWave(), true);
    }
    if (this.timeLeft <= 0) this.endWave();
  }

  aliveCount(): number {
    let n = this.marks.length;
    for (const e of this.enemies) if (e.alive) n++;
    return n;
  }

  /** 随机词缀 */
  rollAffixes(n: number): AffixId[] {
    const pool = [...AFFIX_IDS];
    Phaser.Utils.Array.Shuffle(pool);
    return pool.slice(0, n);
  }

  private updateSpawning(dt: number): void {
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    const w = run.wave;
    const boss = run.isBossWave();
    this.spawnT = spawnInterval(w) * (boss ? 1.8 : 1);
    if (this.aliveCount() >= BALANCE.maxEnemies) return;
    const pool = run.chapter.pool.filter((p) => w >= p.from && (p.to === undefined || w <= p.to));
    const total = pool.reduce((a, p) => a + p.weight, 0);
    let batch = Math.round(spawnBatch(w) * (run.mod('swarm') ? 1.4 : 1) * run.rules.spawn);
    if (boss) batch = Math.ceil(batch / 2);
    // 第 7 波起有概率出现“词缀精英小怪”
    const affixedAlive = this.enemies.filter((e) => e.alive && !e.boss && e.affixes.length).length;
    while (batch > 0) {
      let r = Math.random() * total;
      let pick = pool[0];
      for (const p of pool) {
        r -= p.weight;
        if (r <= 0) {
          pick = p;
          break;
        }
      }
      const def = ENEMY_MAP[pick.enemy];
      const group = def.group ?? 1;
      const [cx, cy] = this.randomSpawnPos();
      const champ = (run.mod('champions') ? 3 : 1) * run.rules.champ;
      const affixed =
        w >= 7 && affixedAlive < (2 + run.chapterId / 2) * champ && Math.random() < 0.015 * (w - 5) * (0.8 + run.chapterId * 0.2) * champ;
      if (affixed) {
        this.queueSpawn(def.id, false, cx, cy, this.rollAffixes(w >= 12 ? 2 : 1));
        batch -= 3;
        continue;
      }
      for (let i = 0; i < group; i++) this.queueSpawn(def.id, false, cx + Phaser.Math.Between(-40, 40), cy + Phaser.Math.Between(-40, 40));
      batch -= Math.max(1, group * 0.6);
    }
  }

  private randomSpawnPos(): [number, number] {
    const a = this.arena,
      p = this.player;
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(a.x + 60, a.right - 60),
        y = Phaser.Math.Between(a.y + 60, a.bottom - 60);
      if (Phaser.Math.Distance.Between(x, y, p.x, p.y) > 280) return [x, y];
    }
    return [a.x + 60, a.y + 60];
  }

  queueSpawn(id: string, boss: boolean, x?: number, y?: number, affixes: AffixId[] = []): void {
    if (x === undefined || y === undefined) [x, y] = this.randomSpawnPos();
    x = Phaser.Math.Clamp(x, this.arena.x + 30, this.arena.right - 30);
    y = Phaser.Math.Clamp(y, this.arena.y + 30, this.arena.bottom - 30);
    const img = this.add
      .image(x, y, 'fx_warn')
      .setDepth(2)
      .setScale(boss ? 2.2 : affixes.length ? 1.3 : 0.8)
      .setAlpha(0.9);
    if (affixes.length) img.setTint(0xffd166);
    this.marks.push({ img, t: boss ? 1.5 : 0.9, x, y, id, boss, affixes });
    if (boss) audio.play(this, 'boss');
  }

  private updateMarks(dt: number): void {
    for (const m of this.marks) {
      m.t -= dt;
      m.img.setAlpha(0.4 + Math.abs(Math.sin(m.t * 8)) * 0.6).setRotation(m.t * 2);
      if (m.t <= 0) {
        m.img.destroy();
        if (this.waveOver) continue;
        if (m.boss) this.spawnBossNow(m.id, m.x, m.y);
        else if (Phaser.Math.Distance.Between(m.x, m.y, this.player.x, this.player.y) > 50) {
          const e = this.spawnEnemyNow(m.id, m.x, m.y, m.affixes);
          if (e && m.affixes.length) this.events.emit('bossSpawn', e);
        }
      }
    }
    this.marks = this.marks.filter((m) => m.t > 0);
  }

  private freeEnemy(): Enemy | null {
    for (const e of this.enemies) if (!e.alive) return e;
    return null;
  }

  spawnEnemyNow(id: string, x: number, y: number, affixes: AffixId[] = []): Enemy | null {
    const e = this.freeEnemy();
    if (!e) return null;
    const def = ENEMY_MAP[id];
    markSeen('enemies', id);
    const ms = minionStats(def, run.wave, run.chapter);
    const R = run.rules;
    e.spawnMinion(
      this,
      def,
      x,
      y,
      Math.round(ms.hp * (run.mod('giants') ? 1.5 : run.mod('swarm') ? 0.75 : 1) * R.enemyHp),
      Math.max(1, Math.round(ms.dmg * R.enemyDmg)),
      ms.speedMult * (run.mod('swift_foes') ? 1.25 : 1) * (run.mod('giants') ? 0.85 : 1) * R.enemySpeed,
      affixes,
    );
    return e;
  }

  /** 立即生成精英 / Boss。affixes 传入时替代随机词缀（开发者界面用） */
  spawnBossNow(id: string, x: number, y: number, affixes?: AffixId[]): Enemy | null {
    const e = this.freeEnemy();
    if (!e) return null;
    const def = BOSS_MAP[id];
    markSeen('bosses', id);
    // 精英 / Boss 的随波次缩放系数统一由 balance.ts 提供（不再在此散落 magic number）
    const R = run.rules;
    const base = bossStats(def, run.wave, run.chapter, run.mod('tough_bosses') ? 1.5 : 1);
    const hp = Math.round(base.hp * R.enemyHp * R.eliteHp);
    const dmg = Math.max(1, Math.round(base.dmg * R.enemyDmg));
    // 词缀数量：第 1~2 章第 5 波精英无随机词缀，之后逐步增加；危机等级可再加
    const nAffix = (run.wave >= 10 ? 1 : 0) + (run.chapterId >= 3 ? 1 : 0) + (run.chapterId >= 5 ? 1 : 0) + R.eliteAffix;
    affixes ??= def.elite ? this.rollAffixes(nAffix) : [];
    affixes = affixes.filter((a) => !(def.affixes ?? []).includes(a));
    e.spawnBoss(this, def, x, y, hp, dmg, affixes);
    // A6：危机 10 / 15 / 20 时 Boss 学会新招式
    if (!def.elite && R.bossSkill > 0) addDangerPatterns(e, R.bossSkill);
    if (!def.elite) {
      this.boss = e;
      audio.playMusic(this, 'bgm_boss');
    }
    this.events.emit('bossSpawn', e);
    this.shake(0.01, 300);
    return e;
  }

  private endWave(): void {
    if (this.waveOver || GameScene.sandbox) return;
    this.waveOver = true;
    audio.play(this, 'wave');
    for (const e of this.enemies)
      if (e.alive) {
        this.fx.burst(e.x, e.y, 0xffffff, 3);
        e.kill(this);
      }
    for (const b of this.enemyBullets) if (b.alive) b.kill();
    for (const m of this.marks) m.img.destroy();
    this.marks = [];
    for (const h of this.hazards) h.img.destroy();
    this.hazards = [];
    // 番茄籽不自动吸取：留在地上的计入加成池（下一波拾取时双倍）；宝箱与果实照常吸取
    for (const p of this.pickups) if (p.alive && p.kind !== 'seed') p.magnet = true;
    this.pstatus.cleanse();
    this.player.play('victory', true);
    const s = this.stats;
    if (s.harvest > 0) {
      run.earn(Math.round(s.harvest), 'harvest');
      run.addXp(s.harvest);
      run.harvestBonus += Math.max(1, Math.ceil(s.harvest * BALANCE.harvestGrowth));
      run.dirty();
    }
    const interest = run.specials.interest;
    if (interest > 0) run.earn(Math.min(run.wave * 6, Math.floor((run.seeds * interest) / 100)), 'interest'); // 利息有上限，防止滚雪球
    const growth = waveGrowthMods(run.charId);
    if (growth) {
      for (const [k, v] of Object.entries(growth) as [keyof typeof growth, number][]) run.levelMods[k] = (run.levelMods[k] ?? 0) + v;
      run.dirty();
    }
    save.totalKills += this.killCounter;
    this.killCounter = 0;
    if (!this.tookDamage) {
      save.stats.perfectWaves++;
      bump(`chPerfect:${run.chapterId}`);
    }
    bump('waves');
    bumpMax(`chWave:${run.chapterId}`, run.wave);
    bumpMax(`charWave:${run.charId}`, run.wave);
    bumpMax(`charLevel:${run.charId}`, run.level);
    if (run.endless) {
      bump('endlessWaves');
      bumpMax('endlessBest', run.wave);
      bumpMax(`endlessBest:ch:${run.chapterId}`, run.wave);
      bumpMax(`endlessBest:char:${run.charId}`, run.wave);
      bumpMax('endlessRunKills', run.kills);
    }
    persist();
    checkAchievements();
    this.events.emit('waveEnd');
    this.time.delayedCall(1500, () => {
      for (const p of this.pickups) {
        if (!p.alive) continue;
        if (p.kind === 'seed') {
          run.bonusSeeds += p.value;
          run.bonusXp += p.xp;
          p.alive = false;
          p.img.setVisible(false);
        } else this.collect(p);
      }
      this.scene.stop('Hud');
      if (run.isBossWave() && !run.endless) {
        this.recordProgress();
        this.scene.start('Result', { win: true });
      } else {
        this.scene.start('LevelUp');
      }
    });
  }

  // ---------------- 碰撞 ----------------
  private separate(): void {
    for (const e of this.enemies) {
      if (!e.alive || e.state === 'charge') continue;
      const near = this.grid.query(e.x, e.y, e.radius, this.tmp2);
      for (const o of near) {
        if (o === e) continue;
        const dx = e.x - o.x,
          dy = e.y - o.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const overlap = e.radius + o.radius - d;
        if (overlap <= 0) continue;
        const push = o.isBoss ? overlap : e.isBoss ? 0 : overlap * 0.5;
        e.x += (dx / d) * push * 0.5;
        e.y += (dy / d) * push * 0.5;
      }
    }
  }

  private updateContact(): void {
    const p = this.player;
    const near = this.grid.query(p.x, p.y, BALANCE.player.radius - 4, this.tmp2);
    for (const e of near) {
      if (e.contactCd > 0 || e.status.totals.disable || e.def?.critter) continue;
      e.contactCd = 0.5;
      e.rig?.play('attack');
      this.damagePlayer(e.dmg * e.dealtMult, e, e.attackDebuffs(e.state === 'charge' ? e.chargeDebuff : undefined));
      if (this.iframes > 0) break;
    }
  }

  /** 天赋「袖里飞刀」：闪避时向最近的敌人掷出飞刀 */
  private throwKnives(n: number): void {
    const p = this.player;
    const near = [...this.grid.query(p.x, p.y, 420, this.tmp2)]
      .filter((e) => e.alive)
      .sort((a, b) => Phaser.Math.Distance.Squared(p.x, p.y, a.x, a.y) - Phaser.Math.Distance.Squared(p.x, p.y, b.x, b.y));
    const s = this.stats;
    const dmg = (6 + run.wave * 1.2) * (1 + (s.damage + s.rangedPct) / 100);
    const key = this.textures.exists('proj_star_anise_shuriken') ? 'proj_star_anise_shuriken' : 'proj_player';
    for (let i = 0; i < n; i++) {
      const t = near[i % Math.max(1, near.length)];
      const ang = t ? Math.atan2(t.y - p.y, t.x - p.x) + (i >= near.length ? (i - near.length + 1) * 0.25 : 0) : (i / n) * Math.PI * 2;
      const b = this.spawnPlayerBullet(key, p.x, p.y, ang, 720, 0.6, 10);
      b.dmg = dmg;
      b.crit = Math.random() * 100 < s.crit;
      if (b.crit) b.dmg *= 1.5;
      b.knockback = 20;
      b.spin = 18;
      b.src = 'knives';
    }
  }

  spawnPlayerBullet(key: string, x: number, y: number, angle: number, speed: number, life: number, radius: number): Bullet {
    let b = this.bullets.find((x) => !x.alive);
    if (!b) {
      b = new Bullet(this);
      this.add.existing(b);
      b.setDepth(12000);
      this.bullets.push(b);
    }
    return b.fire(key, x, y, angle, speed, life, radius);
  }

  private updateBullets(dt: number): void {
    const a = this.arena;
    const p = this.player;
    for (const b of this.bullets) {
      if (!b.alive) continue;
      if (b.kind === 'boomerang') {
        b.outT -= dt;
        if (b.outT <= 0 && !b.returning) {
          b.returning = true;
          b.hitSet.clear();
        }
        if (b.returning) {
          const ang = Math.atan2(p.y - b.y, p.x - b.x);
          const sp = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(ang) * sp;
          b.vy = Math.sin(ang) * sp;
          if (Phaser.Math.Distance.Between(b.x, b.y, p.x, p.y) < 30) {
            b.kill();
            continue;
          }
        }
      } else {
        b.life -= dt;
        if (b.life <= 0) {
          if (b.kind === 'rocket') this.rocketBoom(b);
          b.kill();
          continue;
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.spin) b.rotation += b.spin * dt;
      if (b.kind === 'flame') {
        b.setScale(b.scale + dt * 3);
        b.setAlpha(Math.min(1, b.life * 3));
      }
      if (b.x < a.x - 40 || b.x > a.right + 40 || b.y < a.y - 40 || b.y > a.bottom + 40) {
        b.kill();
        continue;
      }

      const hits = this.grid.query(b.x, b.y, b.radius, this.tmp2);
      let target: Enemy | null = null;
      for (const e of hits)
        if (!b.hitSet.has(e)) {
          target = e;
          break;
        }
      if (!target) continue;
      b.hitSet.add(target);
      const info: HitInfo = {
        dmg: b.dmg,
        crit: b.crit,
        critBonus: b.critBonus,
        knockback: b.knockback,
        effect: b.effect,
        lifeSteal: b.lifeSteal,
        status: b.status,
        cls: 'ranged',
        weaponId: b.src || undefined,
      };
      if (b.kind === 'rocket') {
        this.rocketBoom(b);
        b.kill();
        continue;
      }
      this.fx.hit(b.x, b.y, b.rotation, b.crit);
      this.weaponHit(target, info, b.x - b.vx * 0.05, b.y - b.vy * 0.05);
      if (b.pierce > 0) {
        b.pierce--;
        b.dmg *= b.kind === 'flame' || b.kind === 'boomerang' ? 1 : 0.8;
        continue;
      }
      if (b.bounce > 0) {
        b.bounce--;
        const next = this.grid.nearest(b.x, b.y, 300, b.hitSet);
        if (next) {
          const ang = Math.atan2(next.y - b.y, next.x - b.x);
          const sp = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(ang) * sp;
          b.vy = Math.sin(ang) * sp;
          b.rotation = ang;
          b.life = 0.8;
          b.dmg *= 0.8;
          continue;
        }
      }
      b.kill();
    }
  }

  private rocketBoom(b: Bullet): void {
    this.explode(
      b.x,
      b.y,
      b.effect?.explode ?? 60,
      b.dmg,
      { dmg: b.dmg, crit: b.crit, critBonus: b.critBonus, effect: b.effect, knockback: 20, status: b.status, weaponId: b.src || undefined },
      0xff5400,
    );
  }

  private updateEnemyBullets(dt: number): void {
    const a = this.arena,
      p = this.player;
    for (const b of this.enemyBullets) {
      if (!b.alive) continue;
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rotation += dt * 6;
      if (b.life <= 0 || b.x < a.x - 20 || b.x > a.right + 20 || b.y < a.y - 20 || b.y > a.bottom + 20) {
        b.kill();
        continue;
      }
      const dx = b.x - p.x,
        dy = b.y - p.y,
        rr = b.radius + BALANCE.player.radius - 6;
      if (dx * dx + dy * dy < rr * rr) {
        const deb = b.slow
          ? [...(b.debuffs ?? []), { id: 'slow' as const, dur: 1.5, stacks: Math.max(1, Math.round(b.slow / 15)) }]
          : b.debuffs;
        this.damagePlayer(b.dmg, b.owner ?? undefined, deb);
        this.fx.burst(b.x, b.y, 0xff4d6d, 5);
        b.kill();
      }
    }
  }

  // ---------------- 伤害结算 ----------------
  weaponHit(e: Enemy, info: HitInfo, fromX: number, fromY: number): void {
    if (!e.alive) return;
    this.dmgSrc = info.weaponId ?? (info.explosion ? 'explosion' : 'other');
    const s = this.stats;
    const sp = run.specials;
    const eff = info.effect;
    let dmg = info.dmg;
    let crit = info.crit;
    // 标记：必定暴击
    if (!crit && e.status.has('mark')) {
      crit = true;
      dmg *= 1.5;
      e.status.remove('mark');
    }
    // 暴击伤害：武器词条 + 道具 / 角色 / 天赋相加成一个池子，总加成不超过 critDmgCap（不再两层相乘）
    if (crit) {
      const cd = Math.min(BALANCE.critDmgCap, sp.critDmg + (info.critBonus ?? 0));
      if (cd > 0) dmg *= 1 + cd / 100;
    }
    if (info.knockback && e.knockResist < 1) {
      const ang = Math.atan2(e.y - fromY, e.x - fromX);
      const k = info.knockback * 12 * (1 - e.knockResist);
      e.kvx += Math.cos(ang) * k;
      e.kvy += Math.sin(ang) * k;
    }
    // 武器自带效果 → 状态
    const statusScale = 1 + s.elemental * 0.08;
    if (eff?.slow) e.status.apply({ id: 'slow', dur: eff.slow.dur, stacks: Math.max(1, Math.round(eff.slow.pct / 15)) });
    if (eff?.stun) e.status.apply({ id: 'stun', dur: eff.stun });
    if (eff?.burn) e.status.apply({ id: 'burn', dur: eff.burn.dur, value: eff.burn.dps * 0.5 + s.elemental * 0.3 }, statusScale);
    else if (sp.burnChance && Math.random() * 100 < sp.burnChance)
      e.status.apply({ id: 'burn', dur: 2.5, value: 1 + s.elemental * 0.3 }, statusScale);
    for (const st of info.status ?? []) e.status.apply(st, statusScale);
    for (const st of sp.onHit) e.status.apply(st, statusScale);
    this.applyPlayerStatus(sp.onHitSelf);
    // 荆棘词缀反伤
    if (info.cls === 'melee' && e.affixes.includes('thorny')) this.hurtDirect(Math.max(1, dmg * 0.05), '#6a994e');
    // 吸血（参考土豆兄弟）：每次命中按吸血率概率回 1 点；吸到后 lifeStealTickCd 秒内不能再吸，
    // 即每秒最多回复 1 / lifeStealTickCd 点。吸血率本身不设上限，群体伤害也不打折（触发冷却已足够限制）。
    const ls = (s.lifeSteal + (info.lifeSteal ?? 0)) * this.talent.lifeStealMult();
    if (ls > 0 && this.lsCd <= 0 && Math.random() * 100 < ls) {
      this.lsCd = BALANCE.player.lifeStealTickCd;
      this.heal(1, false);
    }
    const lh = sp.lightningOnHit;
    dmg *= this.talent.dmgMult(e, info);
    this.talent.onHit(e, info);
    this.lastHit = { crit, explosion: !!info.explosion };
    const alive = this.damageEnemy(e, dmg, { crit });
    this.lastHit = { crit: false, explosion: false };
    if (lh && Math.random() * 100 < lh) {
      const t = alive ? e : this.grid.nearest(e.x, e.y, 200);
      if (t?.alive) {
        this.fx.bolt(
          [
            { x: t.x, y: t.y - 400 },
            { x: t.x, y: t.y },
          ],
          0xfff3b0,
        );
        this.damageEnemy(t, 5 + s.elemental * 1.5, { color: '#fff3b0' });
      }
    }
  }

  /** 返回敌人是否仍然存活 */
  damageEnemy(e: Enemy, dmg: number, opts: { crit?: boolean; color?: string; dot?: boolean } = {}): boolean {
    if (!e.alive) return false;
    dmg *= e.takenMult;
    // 天赋：对精英/Boss 增伤、低血增伤、暴击回血
    const tt = treeTotals();
    if (tt.bossDmg && e.boss) dmg *= 1 + tt.bossDmg / 100;
    if (tt.lowHpDmg && run.hp < this.stats.maxHp * 0.4) dmg *= 1 + tt.lowHpDmg / 100;
    if (tt.critHeal && opts.crit && Math.random() * 100 < tt.critHeal) this.heal(1, false);
    e.hp -= dmg;
    // 天赋：斩杀生命过低的小怪
    if (tt.execute && !e.boss && e.hp > 0 && e.hp < e.maxHp * (tt.execute / 100)) {
      this.fx.label(e.x, e.y - e.radius - 10, tx('斩杀', 'Execute'), '#ff4b3e');
      e.hp = 0;
    }
    bumpMax('maxHit', Math.round(dmg));
    // 局后统计：按来源累计实际造成的伤害（不计溢出）
    const src = opts.dot ? 'dot' : this.dmgSrc || 'other';
    run.dmgBy[src] = (run.dmgBy[src] ?? 0) + Math.min(dmg, Math.max(0, e.hp + dmg));
    if (opts.crit) bump('crits');
    this.fx.number(e.x, e.y - e.radius, dmg, opts.color ?? '#ffffff', opts.crit);
    if (!opts.dot) {
      e.rig?.play('hurt');
      audio.play(this, opts.crit ? 'crit' : 'hit', 0.05);
    }
    if (e.hp <= 0) {
      this.killEnemy(e);
      return false;
    }
    return true;
  }

  private killEnemy(e: Enemy): void {
    const color = e.def?.color ?? e.boss?.color ?? 0xffffff;
    // 成就计数：每种怪物、章节、角色击杀；词缀精英按词缀
    if (e.def) bump(`kill:${e.def.id}`);
    bump(`chKills:${run.chapterId}`);
    bump(`charKills:${run.charId}`);
    if (e.def && e.affixes.length) {
      bump('champions');
      for (const a of e.affixes) bump(`champ:${a}`);
    }
    if (e.boss?.elite) bump(`charElite:${run.charId}`);
    // 天赋「捡漏」：额外掉落 1 番茄籽
    if (Math.random() * 100 < treeTotals().killSeeds) this.dropPickup('seed', e.x, e.y, 1, 0);
    e.kill(this);
    run.kills++;
    this.killCounter++;
    const s = this.stats;
    const sp = run.specials;
    this.fx.burst(e.x, e.y, color, e.isBoss ? 40 : 8);
    this.fx.splat(e.x, e.y, color, e.radius);
    this.applyPlayerStatus(sp.onKillSelf);
    // 天赋「战意」：击杀补怒气，最多叠到上限
    const kr = treeTotals().killRage;
    if (kr && (this.pstatus.get('rage')?.stacks ?? 0) < kr) this.applyPlayerStatus([{ id: 'rage', dur: 2 }]);
    // 经验沿用原公式；货币按怪物血量成长放大（血越厚掉得越多），避免后期买不起
    if (e.boss) {
      save.killedBosses[e.boss.id] = (save.killedBosses[e.boss.id] ?? 0) + 1;
      if (e.boss.elite) save.stats.eliteKills++;
      else {
        save.stats.bossKills++;
        audio.playMusic(this, run.chapter.music);
        if (run.endless) bump('endlessBosses');
        if (e.enraged) save.stats.overtimeWins++;
      }
    }
    const boss = e.isBoss || e.isElite;
    let xp = boss ? e.seeds : Math.floor(e.seeds * (run.wave <= 5 ? 1 : BALANCE.seedMult) + Math.random());
    let seeds = Math.floor(e.seeds * e.lootMult + Math.random());
    if (sp.doubleSeed && Math.random() * 100 < sp.doubleSeed) {
      seeds *= 2;
      xp *= 2;
    }
    const n = Math.min(Math.max(seeds, xp), e.isBoss ? 25 : 5);
    for (let i = 0; i < n; i++) {
      const v = Math.floor(seeds / n) + (i < seeds % n ? 1 : 0);
      const x = Math.floor(xp / n) + (i < xp % n ? 1 : 0);
      if (v > 0 || x > 0)
        this.dropPickup('seed', e.x + Phaser.Math.Between(-e.radius, e.radius), e.y + Phaser.Math.Between(-e.radius, e.radius), v, x);
    }
    if (e.isBoss) {
      this.dropPickup('crate', e.x, e.y, 1);
      if (e.boss && !e.boss.elite) {
        this.shake(0.02, 600);
        this.time.delayedCall(400, () => this.endWave());
      }
    } else if (e.isElite) {
      // 词缀小怪：25% 概率宝箱，计入每波上限
      if (this.cratesDropped < BALANCE.cratesPerWave + 1 && Math.random() < 0.25) {
        this.cratesDropped++;
        this.dropPickup('crate', e.x, e.y, 1);
      } else if (Math.random() < 0.3) this.dropPickup('fruit', e.x, e.y, 1);
    } else {
      if (this.fruitsDropped < 2 + Math.floor(run.wave / 4) && Math.random() < fruitDropChance(s.luck)) {
        this.fruitsDropped++;
        this.dropPickup('fruit', e.x, e.y, 1);
      } else if (
        this.cratesDropped < BALANCE.cratesPerWave + (sp.crateMult > 1 ? 1 : 0) &&
        Math.random() < crateDropChance(s.luck) * sp.crateMult
      ) {
        this.cratesDropped++;
        this.dropPickup('crate', e.x, e.y, 1);
      }
    }
    if (e.affixes.includes('explosive')) {
      const x = e.x,
        y = e.y,
        dmg = e.dmg * 1.5;
      this.fx.telegraphCircle(x, y, 90, 0.6, 0xff7b00, () => {
        this.fx.ring(x, y, 90, 0xff7b00, 300, true);
        if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 90 + BALANCE.player.radius) this.damagePlayer(dmg);
      });
    }
    const d = e.def;
    if (d?.splitInto && !this.waveOver) {
      for (let i = 0; i < (d.splitCount ?? 2); i++) {
        const m = this.spawnEnemyNow(d.splitInto, e.x + Phaser.Math.Between(-20, 20), e.y + Phaser.Math.Between(-20, 20));
        if (m) {
          m.kvx = Phaser.Math.Between(-300, 300);
          m.kvy = Phaser.Math.Between(-300, 300);
        }
      }
    }
    for (const ex of sp.explodeOnKill) {
      if (Math.random() * 100 < ex.chance) {
        const dmg = ex.dmg * (1 + s.damage / 100) + s.elemental;
        const x = e.x,
          y = e.y;
        this.time.delayedCall(0, () => this.explode(x, y, 70, dmg, { dmg, crit: false }, 0xff9f1c));
        break;
      }
    }
    if (sp.killHeal && run.kills % sp.killHeal === 0) this.heal(1);
    this.talent.onKill(e, this.lastHit.crit, this.lastHit.explosion);
  }

  explode(x: number, y: number, r: number, dmg: number, info: HitInfo, color: number, goldDrop = false): void {
    // 爆炸范围属性对所有己方爆炸（武器、地雷、技能、击杀爆炸）生效，最低保留 50% 半径
    r *= explodeSizeMultiplier(this.stats.explodeSize);
    this.fx.explosion(x, y, r, color);
    audio.play(this, 'explode', 0.08);
    const hits = [...this.grid.query(x, y, r, this.tmp2)];
    for (const e of hits) {
      this.weaponHit(e, { ...info, dmg, knockback: 25, explosion: true }, x, y);
      if (goldDrop && !e.alive) this.dropPickup('seed', e.x, e.y, 1);
    }
  }

  // ---------------- 敌人攻击接口 ----------------
  private enemyBullet(
    key: string,
    x: number,
    y: number,
    ang: number,
    speed: number,
    dmg: number,
    slow: number,
    scale: number,
    debuffs: StatusApply[] | undefined,
    owner: Enemy,
  ): void {
    const b = this.enemyBullets.find((b) => !b.alive);
    if (!b) return;
    const k = this.textures.exists(key) ? key : 'proj_enemy';
    b.fire(k, x, y, ang, speed, 5, 9 * scale);
    b.setScale(scale);
    b.dmg = dmg;
    b.slow = slow;
    b.debuffs = debuffs;
    b.owner = owner;
    const deb = debuffs?.[0];
    if (deb && !slow && key === 'proj_enemy') b.setTint(STATUSES[deb.id].color);
  }

  enemyShoot(
    e: Enemy,
    n: number,
    spreadDeg: number,
    speed: number,
    dmg: number,
    slow: number,
    key: string,
    scale = 1,
    debuffs?: StatusApply[],
    fixedAngle?: number,
  ): void {
    const base = fixedAngle ?? Math.atan2(this.player.y - e.y, this.player.x - e.x);
    const spread = Phaser.Math.DegToRad(spreadDeg);
    for (let i = 0; i < n; i++) {
      const ang = n === 1 ? base : spreadDeg >= 360 ? (i / n) * Math.PI * 2 : base - spread / 2 + (spread * i) / (n - 1);
      this.enemyBullet(key, e.x, e.y, ang, speed, Math.max(1, Math.round(dmg)), slow, scale, debuffs, e);
    }
  }

  bossRing(e: Enemy, n: number, speed: number, dmgMult: number, angle: number, slow: number, debuff?: StatusApply[]): void {
    const deb = e.attackDebuffs(debuff);
    for (let i = 0; i < n; i++) {
      this.enemyBullet(
        slow ? 'proj_ice' : 'proj_enemy',
        e.x,
        e.y,
        angle + (i / n) * Math.PI * 2,
        speed,
        Math.max(1, Math.round(e.dmg * e.dealtMult * dmgMult)),
        slow,
        1.3,
        deb,
        e,
      );
    }
  }

  healEnemiesAround(e: Enemy, r: number, pct: number): void {
    this.fx.ring(e.x, e.y, r, 0x52ff8a, 400);
    for (const o of this.grid.query(e.x, e.y, r, this.tmp2)) {
      if (o === e || o.hp >= o.maxHp) continue;
      const amt = o.maxHp * pct * (o.isBoss ? 0.1 : 1); // Boss/精英只回复 2%
      o.hp = Math.min(o.maxHp, o.hp + amt);
      this.fx.number(o.x, o.y - o.radius, amt, '#52ff8a');
    }
  }

  /** Buff 招式：给自己和周围同伴施加增益 */
  buffAllies(e: Enemy, r: number, buffs: StatusApply[], showFx: boolean): void {
    for (const b of buffs) e.status.apply(b);
    if (r > 0) for (const o of this.grid.query(e.x, e.y, r, this.tmp2)) if (o !== e) for (const b of buffs) o.status.apply(b);
    if (showFx && buffs.length) {
      const c = STATUSES[buffs[0].id].color;
      this.fx.ring(e.x, e.y, Math.max(r, e.radius * 2), c, 500, true);
      this.fx.label(e.x, e.y - e.radius - 20, buffs.map((b) => STATUSES[b.id].name).join(' '), '#' + c.toString(16).padStart(6, '0'));
    }
  }

  /** 地形危险区（油池、蒸汽等） */
  addHazard(x: number, y: number, r: number, t: number, dps: number, debuff: StatusApply[] | undefined, color: number): void {
    if (this.waveOver) return;
    const img = this.add
      .image(x, y, 'fx_pool')
      .setTint(color)
      .setAlpha(0.6)
      .setDepth(1)
      .setScale((r * 2) / 256);
    this.hazards.push({ img, x, y, r, t, slow: 0, dps, tick: 0, debuff });
  }

  dropFruit(x: number, y: number): void {
    if (!this.waveOver) this.dropPickup('fruit', x, y, 1);
  }

  terrainNotice(msg: string): void {
    this.events.emit('terrain', msg);
  }

  /** 地形生物钻回地下（无掉落） */
  burrow(e: Enemy): void {
    this.fx.burst(e.x, e.y + e.radius * 0.6, 0x8d6e63, 8);
    e.kill(this, false);
  }

  enemyExplode(e: Enemy, r: number): void {
    e.kill(this, false);
    this.fx.explosion(e.x, e.y, r, 0xff5400);
    audio.play(this, 'explode', 0.08);
    if (Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < r + BALANCE.player.radius)
      this.damagePlayer(e.dmg * e.dealtMult, undefined, e.attackDebuffs([{ id: 'burn', dur: 2, stacks: 1 }]));
  }

  summonAround(e: Enemy, id: string, n: number): void {
    if (this.waveOver) return;
    for (let i = 0; i < n; i++) {
      if (this.aliveCount() >= BALANCE.maxEnemies) return;
      const a = Math.random() * Math.PI * 2;
      this.spawnEnemyNow(id, e.x + Math.cos(a) * (e.radius + 20), e.y + Math.sin(a) * (e.radius + 20));
    }
    this.fx.ring(e.x, e.y, e.radius + 40, 0xb5838d, 300);
  }

  /** 粘液 / 油渍拖尾：减速 + 每 0.5 秒结算 dps 点伤害（与其他地面效果重叠时只取最高） */
  addSlime(x: number, y: number, color = 0xb5e48c, dps = 0): void {
    if (this.hazards.length > 60) return;
    const img = this.add
      .image(x, y, 'fx_slime')
      .setTint(color)
      .setAlpha(0.35)
      .setDepth(1)
      .setRotation(Math.random() * 6);
    img.setScale(64 / img.width);
    this.hazards.push({ img, x, y, r: 28, t: 3, slow: 0, dps, tick: 0, debuff: [{ id: 'sticky', dur: 0.4 }] });
  }

  bossSlam(e: Enemy, p: Pattern): void {
    const n = p.count ?? 1;
    const r = p.radius ?? 110;
    const deb = e.attackDebuffs(p.debuff);
    for (let i = 0; i < n; i++) {
      const x = i === 0 ? this.player.x : this.player.x + Phaser.Math.Between(-260, 260);
      const y = i === 0 ? this.player.y : this.player.y + Phaser.Math.Between(-200, 200);
      this.fx.telegraphCircle(x, y, r, (p.windup ?? 1) + i * 0.15, 0xff3b30, () => {
        if (this.waveOver) return;
        this.fx.explosion(x, y, r, 0xffffff);
        this.shake(0.006, 120);
        audio.play(this, 'explode', 0.05);
        if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < r + BALANCE.player.radius * 0.5)
          this.damagePlayer(e.dmg * e.dealtMult * (p.dmg ?? 1), e, deb);
      });
    }
  }

  bossHazard(e: Enemy, p: Pattern): void {
    const n = p.count ?? 3;
    const r = p.radius ?? 90;
    const deb = p.debuff;
    for (let i = 0; i < n; i++) {
      const x = this.player.x + (i === 0 ? 0 : Phaser.Math.Between(-300, 300));
      const y = this.player.y + (i === 0 ? 0 : Phaser.Math.Between(-220, 220));
      const color = deb?.[0] ? STATUSES[deb[0].id].color : p.slow ? 0x48cae4 : 0x9d0208;
      this.fx.telegraphCircle(x, y, r, p.windup ?? 0.9, color, () => {
        if (this.waveOver) return;
        const img = this.add
          .image(x, y, 'fx_pool')
          .setTint(color)
          .setAlpha(0.65)
          .setDepth(1)
          .setScale((r * 2) / 256);
        this.hazards.push({
          img,
          x,
          y,
          r,
          t: 5,
          slow: p.slow ?? 0,
          dps: Math.max(1, e.dmg * e.dealtMult * (p.dmg ?? 0.4)),
          tick: 0,
          debuff: deb,
        });
      });
    }
  }

  /** 激光：预警一条直线，随后造成伤害 */
  bossLaser(e: Enemy, p: Pattern): void {
    const ang = Math.atan2(this.player.y - e.y, this.player.x - e.x);
    const len = 1400,
      w = 26;
    const windup = p.windup ?? 1;
    this.fx.telegraphLine(e.x, e.y, Math.cos(ang), Math.sin(ang), len, w, windup);
    const x0 = e.x,
      y0 = e.y;
    this.time.delayedCall(windup * 1000, () => {
      if (this.waveOver || !e.alive) return;
      this.fx.beam(x0, y0, ang, len, w, STATUSES[p.debuff?.[0]?.id ?? 'burn'].color);
      this.shake(0.008, 200);
      const px = this.player.x - x0,
        py = this.player.y - y0;
      const along = px * Math.cos(ang) + py * Math.sin(ang);
      const perp = Math.abs(-px * Math.sin(ang) + py * Math.cos(ang));
      if (along > 0 && along < len && perp < w + BALANCE.player.radius * 0.6)
        this.damagePlayer(e.dmg * e.dealtMult * (p.dmg ?? 1.4), e, e.attackDebuffs(p.debuff));
    });
  }

  /** 瞬移：消失后出现在玩家附近 */
  bossTeleport(e: Enemy): void {
    const a = Math.random() * Math.PI * 2;
    const tx = Phaser.Math.Clamp(this.player.x + Math.cos(a) * 260, this.arena.x + 80, this.arena.right - 80);
    const ty = Phaser.Math.Clamp(this.player.y + Math.sin(a) * 200, this.arena.y + 80, this.arena.bottom - 80);
    this.fx.ring(e.x, e.y, e.radius * 1.5, 0xc77dff, 300, true);
    this.fx.telegraphCircle(tx, ty, e.radius, 0.5, 0xc77dff);
    e.rig?.setAlpha(0.3);
    this.time.delayedCall(500, () => {
      if (!e.alive) return;
      e.x = tx;
      e.y = ty;
      e.rig?.setAlpha(1).play('spawn', true);
      this.fx.ring(tx, ty, e.radius * 2, 0xc77dff, 300);
    });
  }

  telegraphLine(x: number, y: number, dx: number, dy: number, len: number, width: number, dur: number): void {
    this.fx.telegraphLine(x, y, dx, dy, len, width, dur);
  }

  onBossPhase2(e: Enemy): void {
    this.fx.label(e.x, e.y - e.radius - 20, tx('第二阶段！', 'Phase Two!'), '#ff3b30');
    this.fx.ring(e.x, e.y, 260, 0xff3b30, 600);
    this.shake(0.012, 400);
  }

  /** 地面效果（热油、粘液、Boss 毒池等）统一结算：
   *  - 站在多个重叠区域里时只取「伤害最高」的一个，每 HAZARD_TICK 秒结算一次（只弹一个伤害数字）；
   *  - 概率类减益（灼烧等）也随结算节拍判定一次，而不是每帧判定；
   *  - 减速 / 黏液这类持续效果每帧刷新以保证手感，但不会重复弹字（见 applyPlayerStatus）。 */
  private hazardTickT = 0;
  private updateHazards(dt: number): void {
    const HAZARD_TICK = 0.5;
    const p = this.player;
    let worst: Hazard | null = null;
    let slow = 0;
    const sustained = new Map<string, StatusApply>(); // 持续刷新类（黏液）
    const procs = new Map<string, StatusApply>(); // 概率类（随节拍判定）
    for (const h of this.hazards) {
      h.t -= dt;
      if (h.t < 0.5) h.img.setAlpha(Math.max(0, h.t) * 1.3);
      if (h.t > 0 && Phaser.Math.Distance.Between(h.x, h.y, p.x, p.y) < h.r + 10) {
        slow = Math.max(slow, h.slow);
        if (h.dps > (worst?.dps ?? 0)) worst = h;
        for (const d of h.debuff ?? []) (d.id === 'sticky' ? sustained : procs).set(d.id, d);
      }
      if (h.t <= 0) h.img.destroy();
    }
    this.hazards = this.hazards.filter((h) => h.t > 0);
    this.hazardTickT -= dt;
    if (this.waveOver) return;
    if (slow) this.applyPlayerStatus([{ id: 'slow', dur: 0.3, stacks: Math.max(1, Math.round(slow / 15)) }]);
    if (sustained.size) this.applyPlayerStatus([...sustained.values()].map((d) => ({ ...d, chance: undefined })));
    if (this.hazardTickT > 0 || (!worst && !procs.size)) return;
    this.hazardTickT = HAZARD_TICK;
    if (procs.size) this.applyPlayerStatus([...procs.values()].map((d) => ({ ...d, chance: d.chance ?? 50 })));
    // Hazard.dps 实为「每次结算的伤害」（历史命名，结算节拍 0.5 秒）
    if (worst) this.damagePlayer(worst.dps);
  }

  // ---------------- 掉落物 ----------------
  private dropPickup(kind: Pickup['kind'], x: number, y: number, value: number, xp = value): void {
    // 沙盒不掉落：拾取会改变经验、等级与资金，破坏构筑的可复现性
    if (GameScene.sandbox) return;
    const key = kind === 'seed' ? 'pickup_seed' : kind === 'fruit' ? 'pickup_fruit' : 'pickup_crate';
    let p = this.pickups.find((q) => !q.alive && q.kind === kind);
    if (p) {
      p.img.setPosition(x, y).setVisible(true).setAlpha(1);
      p.alive = true;
      p.value = value;
      p.xp = xp;
      p.magnet = this.waveOver;
      p.t = 0;
    } else {
      const img = this.add.image(x, y, key).setDepth(5);
      p = { img, kind, value, xp, alive: true, magnet: this.waveOver, t: 0 };
      this.pickups.push(p);
    }
    p.img.setScale(kind === 'seed' ? (value > 1 ? 1.25 : 1) : 1);
    p.img.setRotation(kind === 'seed' ? Math.random() * 6 : 0);
    // 弹出动画
    const tx = x + Phaser.Math.Between(-18, 18),
      ty = y + Phaser.Math.Between(-18, 18);
    this.tweens.add({ targets: p.img, x: tx, y: ty, duration: 220, ease: 'Quad.easeOut' });
  }

  private updatePickups(dt: number): void {
    const pl = this.player;
    const r = BALANCE.pickup.baseRadius + Math.max(0, this.stats.pickup); // 拾取范围为像素数值
    const r2 = r * r;
    for (const p of this.pickups) {
      if (!p.alive) continue;
      p.t += dt;
      if (p.kind !== 'seed') p.img.y += Math.sin(p.t * 4) * 0.15;
      const dx = pl.x - p.img.x,
        dy = pl.y - p.img.y;
      const d2 = dx * dx + dy * dy;
      if (!p.magnet && d2 < r2) p.magnet = true;
      if (p.magnet) {
        const d = Math.sqrt(d2) || 1;
        const sp = BALANCE.pickup.magnetSpeed * (this.waveOver ? 1.6 : 1);
        p.img.x += (dx / d) * sp * dt;
        p.img.y += (dy / d) * sp * dt;
        if (d < 24) this.collect(p);
      }
    }
  }

  private collect(p: Pickup): void {
    p.alive = false;
    p.img.setVisible(false);
    if (p.kind === 'seed') {
      // 加成池：上一波没捡的番茄籽，本波每拾取一个就额外给同等数量（直到用完）
      const bonus = Math.min(p.value, run.bonusSeeds),
        bonusXp = Math.min(p.xp, run.bonusXp);
      run.bonusSeeds -= bonus;
      run.bonusXp -= bonusXp;
      run.earn(p.value + bonus, 'pickup');
      run.addXp(p.xp + bonusXp);
      if (bonus) this.fx.label(p.img.x, p.img.y - 10, '×2', '#52ff8a');
      if (!seenTip('seeds')) tip('seeds', this, true);
      audio.play(this, 'pickup', 0.03);
    } else if (p.kind === 'fruit') {
      bump('fruits');
      const bonus = this.talent.fruitSeeds();
      if (bonus) run.earn(bonus, 'talent');
      this.heal(Math.max(3, Math.round(this.stats.maxHp * 0.08 * (1 + run.specials.fruitHeal / 100))));
      this.fx.ring(this.player.x, this.player.y, 50, 0x52ff8a, 300);
      audio.play(this, 'pickup');
    } else {
      run.pendingCrates++;
      this.fx.label(p.img.x, p.img.y, tx('宝箱 +1', 'Crate +1'), '#ffd166');
      audio.play(this, 'buy');
    }
  }

  // ---------------- 攻击特效 ----------------
  fxThrust(x: number, y: number, a: number, range: number): void {
    this.fx.thrust(x, y, a, range);
  }
  fxSweep(x: number, y: number, a: number, range: number): void {
    this.fx.slash(x, y, a, range * 0.9, 0xfff3b0);
  }
  fxLightning(pts: { x: number; y: number }[], color: number): void {
    this.fx.bolt(pts, color);
  }
}
