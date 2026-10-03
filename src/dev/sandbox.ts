// 开发者沙盒控制器：驱动 GameScene 的沙盒模式。
// - 启动 / 重启沙盒（把构筑写入 run 后重开 Game 场景）
// - 按指定章节 + 波次生成小怪 / 精英 / Boss，可设为木桩（锁定位置、禁止攻击、锁血）或手动触发招式
// - 伤害统计（DPS、来源排行）、承伤统计、强度测试（击杀用时 TTK）
// - 叠加层：武器射程 / 光环半径、拾取范围、技能范围、爆炸半径
import Phaser from 'phaser';
import { GameScene, type SandboxOpts } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import { run } from '../systems/RunState';
import { BALANCE } from '../data/balance';
import { BOSS_MAP, type AffixId } from '../data/bosses';
import { ENEMY_MAP } from '../data/enemies';
import { WEAPON_MAP } from '../data/weapons';
import { weaponRange } from '../systems/WeaponSystem';
import { applyBuild, type DevBuild, type DevWeapon } from './build';

export type AttackMode = 'ai' | 'none' | 'manual';
export interface SpawnOpts {
  chapterId: number;
  wave: number;
  count: number;
  affixes: AffixId[] | null; // null = 按游戏规则随机（精英）/ 无（小怪）
  lock: boolean;
  attack: AttackMode;
  immortal: boolean;
  /** 作为强度测试计时（全部击杀后记录 TTK） */
  test: boolean;
  /** 生成距离（离玩家）；不填按默认（小怪 200~300，Boss 280）。近战看特效时用近距离 */
  dist?: number[];
  /** 指定生成位置（世界坐标）；数量大于 1 时围绕该点排开 */
  at?: { x: number; y: number };
}

export interface Tracked {
  e: Enemy;
  uid: number;
  label: string;
  boss: boolean;
  anchor: { x: number; y: number };
  opts: SpawnOpts;
  /** 手动触发：待触发的招式下标（Boss）或 -1 = 小怪立即行动 */
  pending: number | null;
  text: Phaser.GameObjects.Text | null;
  dealt: number;
}

export interface TestResult {
  id: number;
  label: string;
  chapterId: number;
  wave: number;
  count: number;
  totalHp: number;
  startT: number;
  ttk: number | null;
  /** 沙盒重启 / 清场导致测试中断 */
  aborted?: boolean;
  taken: number;
  takenMax: number;
  deaths: number;
  /** 构筑摘要（用于对比） */
  build: string;
  members: Tracked[];
  takenAtStart: number;
  deathsAtStart: number;
}

export interface Overlay {
  range: boolean;
  explode: boolean;
  pickup: boolean;
  skill: boolean;
  labels: boolean;
  /** 碰撞框 / 受击框 / 弹道 */
  hitbox: boolean;
  /** 性能数据（实体数、对象池、帧耗时） */
  perf: boolean;
  /** 怪物 AI 状态（D6） */
  ai: boolean;
}

/** 叠加层配色：按武器栏位循环（面板图例使用同一配色） */
export const OVERLAY_COLORS = [0xffd166, 0x9be564, 0x6ec6ff, 0xc77dff, 0xff7b9c, 0x55efc4, 0xffa94d, 0xe0e0e0];

interface Hit {
  t: number;
  dmg: number;
  src: string;
}

let testSeq = 1;

export class Sandbox {
  readonly opts: SandboxOpts = { terrain: false, deaths: 0 };
  god = true;
  noSkillCd = false;
  speed = 1;
  paused = false;
  overlay: Overlay = { range: true, explode: true, pickup: false, skill: true, labels: true, hitbox: false, perf: false, ai: false };
  /** 慢放倍率（1 = 正常） */
  slow = 1;
  zoom = 1;
  camMode: 'player' | 'target' | 'free' = 'player';
  /** 点击画面的作用：none = 选中 / 拖动目标，spawn = 在点击处生成，teleport = 传送玩家 */
  placeMode: 'none' | 'spawn' | 'teleport' = 'none';
  placeSel: { id: string; boss: boolean; opts: SpawnOpts } | null = null;
  lockPlayer = false;
  playerAnchor: { x: number; y: number } | null = null;
  /** 检查器选中的实体 */
  selected: Enemy | null = null;
  onSelect: ((e: Enemy | null) => void) | null = null;
  onMessage: ((msg: string, bad?: boolean) => void) | null = null;
  trial: DevWeapon[] | null = null;
  tracked: Tracked[] = [];
  tests: TestResult[] = [];
  /** 造成的伤害事件（最近 60 秒） */
  hits: Hit[] = [];
  dmgBySrc: Record<string, number> = {};
  dmgTotal = 0;
  meterStart = 0;
  /** 受到的伤害（来自 GameScene 的 window.__dmg 调试钩子） */
  taken: Hit[] = [];
  takenTotal = 0;
  takenMax = 0;
  private takenRead = 0;
  private explosions: { x: number; y: number; r: number; t: number }[] = [];
  private gfx: Phaser.GameObjects.Graphics | null = null;
  private lastLabelT = 0;
  /** 最近一次生成，用于「重复上次生成」 */
  lastSpawn: { id: string; boss: boolean; opts: SpawnOpts } | null = null;
  onChange: (() => void) | null = null;

  constructor(
    readonly game: Phaser.Game,
    private getBuild: () => DevBuild,
  ) {
    (window as unknown as { __dmg: unknown[][] }).__dmg = [];
    GameScene.onStep = (g) => this.step(g);
    this.g.events.on(Phaser.Scenes.Events.CREATE, () => this.onCreate());
  }

  get g(): GameScene {
    return this.game.scene.getScene('Game') as GameScene;
  }
  get running(): boolean {
    return this.game.scene.isActive('Game') || this.game.scene.isPaused('Game');
  }

  // ---------------- 启动 ----------------
  restart(): void {
    applyBuild(this.getBuild(), this.trial);
    GameScene.sandbox = this.opts;
    GameScene.simSpeed = this.speed;
    GameScene.simScale = this.slow;
    for (const k of ['Hud', 'Pause', 'LevelUp', 'Shop', 'Result', 'Menu', 'CharSelect'])
      if (this.game.scene.isActive(k) || this.game.scene.isPaused(k)) this.game.scene.stop(k);
    this.tracked = [];
    this.paused = false;
    this.game.scene.start('Game');
  }

  private onCreate(): void {
    const g = this.g;
    this.gfx = g.add.graphics().setDepth(20000);
    this.explosions = [];
    // 爆炸半径：包一层 Fx.explosion（Fx 每次 create 都会新建）
    const fx = g.fx;
    const orig = fx.explosion.bind(fx);
    fx.explosion = (x, y, r, color) => {
      orig(x, y, r, color);
      if (!this.overlay.explode) return;
      this.explosions.push({ x, y, r, t: g.time.now });
      if (this.explosions.length > 40) this.explosions.shift();
      if (this.overlay.labels && g.time.now - this.lastLabelT > 180) {
        this.lastLabelT = g.time.now;
        fx.label(x, y - r, `r=${Math.round(r)}`, '#ffd166');
      }
    };
    // 伤害统计：包一层 damageEnemy（实例属性，只包一次；场景重启后实例不变）
    const gs = g as GameScene & { __devWrapped?: boolean };
    if (!gs.__devWrapped) {
      gs.__devWrapped = true;
      const dmgOrig = GameScene.prototype.damageEnemy;
      g.damageEnemy = function (this: GameScene, e, dmg, opts = {}) {
        const src = opts.dot ? 'dot' : this.dmgSrc || 'other';
        const before = run.dmgBy[src] ?? 0;
        const alive = dmgOrig.call(this, e, dmg, opts);
        const d = (run.dmgBy[src] ?? 0) - before;
        if (d > 0) sandboxRef?.recordDmg(e, d, src);
        return alive;
      };
    }
    const draw = () => this.draw();
    g.events.on(Phaser.Scenes.Events.POST_UPDATE, draw);
    this.bindPointer(g);
    this.timeline = [];
    this.selected = null;
    this.applyCamera();
    // 快照还原：场景重建完成后再把目标放回去
    const snap = this.pendingSnap;
    this.pendingSnap = null;
    if (snap) g.time.delayedCall(30, () => this.applySnapshot(snap));
    g.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      g.events.off(Phaser.Scenes.Events.POST_UPDATE, draw);
      this.clearAiText();
      for (const t of this.tracked) t.text?.destroy();
      this.tracked = [];
      this.gfx = null;
      // 场景重启后旧敌人对象不再更新：未完成的测试标记为中断
      for (const r of this.tests) if (r.ttk === null) r.aborted = true;
    });
    this.onChange?.();
  }

  setSpeed(n: number): void {
    this.speed = n;
    GameScene.simSpeed = n;
  }
  togglePause(): void {
    if (!this.running) return;
    this.paused = !this.paused;
    if (this.paused) this.game.scene.pause('Game');
    else this.game.scene.resume('Game');
  }

  // ---------------- 每个模拟步 ----------------
  private step(g: GameScene): void {
    if (this.god) run.hp = g.stats.maxHp;
    if (this.noSkillCd && g.skill.cd > 0) g.skill.cd = 0;
    if (this.lockPlayer) {
      this.playerAnchor ??= { x: g.player.x, y: g.player.y };
      g.player.setPosition(this.playerAnchor.x, this.playerAnchor.y);
    } else this.playerAnchor = null;
    this.recordTimeline(g);
    for (const t of this.tracked) {
      const e = t.e;
      if (!this.isAlive(t)) continue;
      const o = t.opts;
      if (o.lock) {
        e.x = t.anchor.x;
        e.y = t.anchor.y;
        e.kvx = e.kvy = 0;
      }
      if (o.immortal) e.hp = e.maxHp;
      if (o.attack === 'none' || o.attack === 'manual') {
        e.contactCd = Math.max(e.contactCd, o.attack === 'none' ? 1 : 0);
        if (o.attack === 'none') {
          if (e.state !== 'move') e.state = 'move';
          e.spiral = null;
        } else if (e.state === 'fuse') e.state = 'move';
        if (t.boss) {
          for (let i = 0; i < e.patternT.length; i++) {
            if (t.pending === i) {
              // 上一步已触发（计时被重置为冷却）则清除；Boss 正忙（冲锋 / 瞬移中）则继续等待
              if (e.patternT[i] > 0.5) t.pending = null;
              else {
                e.patternT[i] = 0;
                continue;
              }
            }
            e.patternT[i] = Math.max(e.patternT[i], 0.6);
          }
        } else if (t.pending !== null) {
          e.actT = 0;
          t.pending = null;
        } else e.actT = Math.max(e.actT, 0.6);
      }
    }
    // 强度测试：全部目标死亡即记录用时
    for (const r of this.tests) {
      if (r.ttk !== null || r.aborted) continue;
      r.taken = this.takenTotal - r.takenAtStart;
      r.deaths = this.opts.deaths - r.deathsAtStart;
      if (r.members.every((m) => !this.isAlive(m))) {
        r.ttk = (g.time.now - r.startT) / 1000;
        this.onChange?.();
      }
    }
  }

  isAlive(t: Tracked): boolean {
    return t.e.alive && t.e.uid === t.uid;
  }

  recordDmg(e: Enemy, d: number, src: string): void {
    const now = this.g.time.now;
    this.hits.push({ t: now, dmg: d, src });
    this.dmgTotal += d;
    this.dmgBySrc[src] = (this.dmgBySrc[src] ?? 0) + d;
    for (const t of this.tracked) if (t.e === e && t.e.uid === t.uid) t.dealt += d;
  }

  resetMeter(): void {
    this.hits = [];
    this.dmgBySrc = {};
    this.dmgTotal = 0;
    this.taken = [];
    this.takenTotal = 0;
    this.takenMax = 0;
    this.opts.deaths = 0;
    this.meterStart = this.running ? this.g.time.now : 0;
  }

  /** 读取 GameScene 记录的受伤事件（[波次, 剩余时间, 来源, 伤害]） */
  private pollTaken(): void {
    const log = (window as unknown as { __dmg: [number, number, string, number][] }).__dmg;
    if (!log) return;
    const now = this.g.time.now;
    for (; this.takenRead < log.length; this.takenRead++) {
      const [, , src, dmg] = log[this.takenRead];
      this.taken.push({ t: now, dmg, src });
      this.takenTotal += dmg;
      this.takenMax = Math.max(this.takenMax, dmg);
      for (const r of this.tests) if (r.ttk === null && !r.aborted) r.takenMax = Math.max(r.takenMax, dmg);
    }
    if (log.length > 5000) {
      log.length = 0;
      this.takenRead = 0;
    }
  }

  /** 时间窗口内的每秒伤害 */
  rate(list: Hit[], windowSec: number): number {
    if (!this.running) return 0;
    const now = this.g.time.now;
    const from = Math.max(now - windowSec * 1000, this.meterStart);
    const span = Math.max(0.5, (now - from) / 1000);
    let s = 0;
    for (let i = list.length - 1; i >= 0 && list[i].t >= from; i--) s += list[i].dmg;
    return s / span;
  }

  // ---------------- 生成敌人 ----------------
  /** 临时把 run 的章节 / 波次换成指定值来生成（敌人数值在生成时确定） */
  private withScaling<T>(chapterId: number, wave: number, fn: () => T): T {
    const pc = run.chapterId,
      pw = run.wave;
    run.chapterId = chapterId;
    run.wave = wave;
    try {
      return fn();
    } finally {
      run.chapterId = pc;
      run.wave = pw;
    }
  }

  spawn(id: string, boss: boolean, opts: SpawnOpts): string | null {
    if (!this.running) return '沙盒未运行';
    if (this.paused) this.togglePause();
    const g = this.g;
    const p = g.player;
    const A = g.arena;
    const made: Tracked[] = [];
    const n = Math.max(1, Math.min(boss ? 6 : 80, opts.count));
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + 0.3;
      const dist = opts.dist?.length ? opts.dist[i % opts.dist.length] : boss ? 280 : 200 + (i % 3) * 50;
      const ox = opts.at ? opts.at.x : p.x,
        oy = opts.at ? opts.at.y : p.y;
      const rr = opts.at ? (n > 1 ? 40 + (i % 3) * 20 : 0) : dist;
      const x = Phaser.Math.Clamp(ox + Math.cos(ang) * rr, A.x + 60, A.right - 60);
      const y = Phaser.Math.Clamp(oy + Math.sin(ang) * rr * (opts.at ? 1 : 0.75), A.y + 60, A.bottom - 60);
      const e = this.withScaling(opts.chapterId, opts.wave, () =>
        boss ? g.spawnBossNow(id, x, y, opts.affixes ?? undefined) : g.spawnEnemyNow(id, x, y, opts.affixes ?? []),
      );
      if (!e) break;
      const label = boss ? BOSS_MAP[id].name : ENEMY_MAP[id].name;
      const t: Tracked = { e, uid: e.uid, label, boss, anchor: { x, y }, opts: { ...opts }, pending: null, text: null, dealt: 0 };
      if (this.overlay.labels)
        t.text = g.add
          .text(x, y, '', {
            fontFamily: 'system-ui',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
          })
          .setOrigin(0.5, 1)
          .setDepth(20001);
      made.push(t);
    }
    if (!made.length) return '敌人池已满，先清场';
    this.tracked.push(...made);
    this.lastSpawn = { id, boss, opts: { ...opts } };
    if (opts.test) {
      const b = this.getBuild();
      this.tests.unshift({
        id: testSeq++,
        label: `${made[0].label}${made.length > 1 ? ` ×${made.length}` : ''}${opts.affixes?.length ? `（${opts.affixes.length} 词缀）` : ''}`,
        chapterId: opts.chapterId,
        wave: opts.wave,
        count: made.length,
        totalHp: made.reduce((a, t) => a + t.e.maxHp, 0),
        startT: g.time.now,
        ttk: null,
        taken: 0,
        takenMax: 0,
        deaths: 0,
        build: `${run.char.name} 第${b.chapterId}章W${b.wave} Lv${b.level} · ${run.weapons.map((w) => `${WEAPON_MAP[w.id].name}T${w.tier + 1}`).join('/')}`,
        members: made,
        takenAtStart: this.takenTotal,
        deathsAtStart: this.opts.deaths,
      });
      this.tests.length = Math.min(this.tests.length, 30);
    }
    this.onChange?.();
    return null;
  }

  respawnLast(): string | null {
    const l = this.lastSpawn;
    return l ? this.spawn(l.id, l.boss, l.opts) : '还没有生成过';
  }

  /** 最近生成且仍存活的指定 Boss（手动触发招式用） */
  liveBoss(id: string): Tracked | null {
    for (let i = this.tracked.length - 1; i >= 0; i--) {
      const t = this.tracked[i];
      if (t.boss && t.e.boss?.id === id && this.isAlive(t)) return t;
    }
    return null;
  }

  trigger(t: Tracked, idx: number): void {
    if (t.opts.attack === 'manual') t.pending = idx;
    else if (t.boss) t.e.patternT[idx] = 0;
    else t.e.actT = 0;
  }

  /** 直接进入 Boss 二阶段（把生命压到阈值以下） */
  phase2(t: Tracked): void {
    const at = t.e.boss?.phase2?.at;
    if (!at || !this.isAlive(t)) return;
    t.opts.immortal = false;
    t.e.hp = Math.min(t.e.hp, t.e.maxHp * at - 1);
  }

  clear(): void {
    if (!this.running) return;
    const g = this.g;
    for (const e of g.enemies) if (e.alive) e.kill(g, false);
    for (const b of g.enemyBullets) if (b.alive) b.kill();
    for (const h of g.hazards) h.img.destroy();
    g.hazards = [];
    for (const m of g.marks) m.img.destroy();
    g.marks = [];
    g.boss = null;
    for (const t of this.tracked) t.text?.destroy();
    this.tracked = [];
    for (const r of this.tests) if (r.ttk === null) r.aborted = true;
    this.onChange?.();
  }

  castSkill(): void {
    if (!this.running) return;
    const g = this.g;
    g.skill.cd = 0;
    g.skill.use();
  }

  // ---------------- 叠加层 ----------------
  private draw(): void {
    const g = this.g;
    const gfx = this.gfx;
    if (!gfx || !g.player) return;
    this.pollTaken();
    const now = g.time.now;
    if (this.hits.length > 4000 || (this.hits.length && now - this.hits[0].t > 60000))
      this.hits = this.hits.filter((h) => now - h.t < 60000);
    if (this.taken.length > 2000 || (this.taken.length && now - this.taken[0].t > 60000))
      this.taken = this.taken.filter((h) => now - h.t < 60000);
    gfx.clear();
    const p = g.player;
    const s = g.stats;
    if (this.overlay.range) {
      g.weapons.list.forEach((w, i) => {
        const r = weaponRange(w.def, s, w.owned) * g.rangeMult;
        const c = OVERLAY_COLORS[i % OVERLAY_COLORS.length];
        gfx.lineStyle(w.def.kind === 'aura' ? 3 : 1.5, c, 0.75).strokeCircle(p.x, p.y, r);
      });
    }
    if (this.overlay.pickup) gfx.lineStyle(1, 0x74b9ff, 0.5).strokeCircle(p.x, p.y, BALANCE.pickup.baseRadius + Math.max(0, s.pickup));
    if (this.overlay.skill) {
      const sk = g.skill.skill;
      const base = sk.type === 'dash' ? sk.distance : sk.radius;
      if (base) gfx.lineStyle(2, sk.color, 0.6).strokeCircle(p.x, p.y, g.skill.radius(base));
    }
    if (this.overlay.explode) {
      this.explosions = this.explosions.filter((x) => now - x.t < 900);
      for (const x of this.explosions) {
        const a = 1 - (now - x.t) / 900;
        gfx.lineStyle(2, 0xffd166, a).strokeCircle(x.x, x.y, x.r);
        gfx
          .lineStyle(1, 0xffd166, a)
          .lineBetween(x.x - 8, x.y, x.x + 8, x.y)
          .lineBetween(x.x, x.y - 8, x.x, x.y + 8);
      }
    }
    // 目标头顶：名称、生命、承受伤害
    this.tracked = this.tracked.filter((t) => {
      if (this.isAlive(t)) {
        if (t.text) {
          const e = t.e;
          const mode = t.opts.attack === 'none' ? ' 木桩' : t.opts.attack === 'manual' ? ' 手动' : '';
          t.text
            .setVisible(this.overlay.labels)
            .setPosition(e.x, e.y - e.radius - 18)
            .setText(`${t.label}${mode}${t.opts.immortal ? ' 锁血' : ''}\n${Math.ceil(e.hp)}/${e.maxHp}`);
        }
        if (this.overlay.labels) gfx.lineStyle(1, 0xffffff, 0.35).strokeCircle(t.e.x, t.e.y, t.e.radius);
        return true;
      }
      t.text?.destroy();
      // 测试中的目标保留在测试记录里，这里只移出跟踪列表
      return false;
    });
    if (this.overlay.hitbox) this.drawHitboxes(gfx);
    if (this.overlay.ai) this.drawAi(gfx);
    this.recordPerf();
    // 选中目标高亮（检查器 / 拖动）
    const sel = this.selected;
    if (sel && sel.alive) gfx.lineStyle(2, 0x00e5ff, 0.9).strokeCircle(sel.x, sel.y, sel.radius + 6);
  }

  // ---------------- 碰撞框 / 性能 ----------------
  /** D6：怪物 AI 状态可视化：移动方向（箭头）、行为状态颜色、指向玩家的目标线 */
  private aiText: Phaser.GameObjects.Text[] = [];
  private drawAi(gfx: Phaser.GameObjects.Graphics): void {
    const g = this.g;
    const p = g.player;
    const STATE_COLOR: Record<string, number> = { move: 0x52ff8a, windup: 0xffd166, charge: 0xff3b30, fuse: 0xff9f1c, blink: 0xc08bff };
    let n = 0;
    for (const e of g.enemies) {
      if (!e.alive) continue;
      const c = STATE_COLOR[e.state] ?? 0xffffff;
      const len = Math.hypot(e.dirX, e.dirY) || 1;
      gfx.lineStyle(2, c, 0.9).lineBetween(e.x, e.y, e.x + (e.dirX / len) * (e.radius + 22), e.y + (e.dirY / len) * (e.radius + 22));
      if (e.isBoss || this.tracked.some((t) => t.e === e)) gfx.lineStyle(1, c, 0.25).lineBetween(e.x, e.y, p.x, p.y);
      if (n < 40) {
        const t = (this.aiText[n] ??= g.add
          .text(0, 0, '', { fontSize: '10px', color: '#ffffff', fontFamily: 'Consolas,monospace' })
          .setDepth(9999));
        const cd = e.patterns.length ? ' ' + e.patternT.map((x) => Math.max(0, x).toFixed(1)).join('/') : '';
        t.setVisible(true)
          .setPosition(e.x + e.radius + 4, e.y - 6)
          .setText(`${e.state}${e.state !== 'move' ? ' ' + e.stateT.toFixed(1) : ''}${cd}${e.enraged ? ' 狂暴' : ''}`);
        n++;
      }
    }
    for (let i = n; i < this.aiText.length; i++) this.aiText[i].setVisible(false);
  }
  private clearAiText(): void {
    for (const t of this.aiText) t.destroy();
    this.aiText = [];
  }

  private drawHitboxes(gfx: Phaser.GameObjects.Graphics): void {
    const g = this.g;
    const p = g.player;
    gfx.lineStyle(1.5, 0x52ff8a, 0.9).strokeCircle(p.x, p.y, BALANCE.player.radius);
    for (const e of g.enemies) if (e.alive) gfx.lineStyle(1, 0xff6b6b, 0.8).strokeCircle(e.x, e.y, e.radius);
    for (const b of g.enemyBullets) if (b.alive) gfx.lineStyle(1, 0xff3b30, 0.9).strokeCircle(b.x, b.y, b.radius);
    for (const b of g.bullets)
      if (b.alive) {
        gfx.lineStyle(1, 0x6ec6ff, 0.8).strokeCircle(b.x, b.y, b.radius);
        // 弹道：按当前速度画出 0.25 秒内的路径
        gfx.lineStyle(1, 0x6ec6ff, 0.35).lineBetween(b.x, b.y, b.x + b.vx * 0.25, b.y + b.vy * 0.25);
      }
    for (const b of g.enemyBullets) if (b.alive) gfx.lineStyle(1, 0xff3b30, 0.35).lineBetween(b.x, b.y, b.x + b.vx * 0.4, b.y + b.vy * 0.4);
  }

  /** 最近 180 帧的帧耗时（毫秒） */
  frameMs: number[] = [];
  private recordPerf(): void {
    this.frameMs.push(this.game.loop.delta);
    if (this.frameMs.length > 180) this.frameMs.shift();
  }
  perfStats(): Record<string, number> {
    const g = this.g;
    const cnt = <T extends { alive: boolean }>(a: T[]) => a.reduce((n, x) => n + (x.alive ? 1 : 0), 0);
    const fm = this.frameMs;
    const avg = fm.length ? fm.reduce((a, b) => a + b, 0) / fm.length : 0;
    return {
      fps: Math.round(this.game.loop.actualFps),
      frameAvg: Math.round(avg * 10) / 10,
      frameMax: Math.round(Math.max(0, ...fm) * 10) / 10,
      enemies: cnt(g.enemies),
      enemyPool: g.enemies.length,
      bullets: cnt(g.bullets),
      bulletPool: g.bullets.length,
      enemyBullets: cnt(g.enemyBullets),
      enemyBulletPool: g.enemyBullets.length,
      pickups: cnt(g.pickups),
      hazards: g.hazards.length,
      objects: g.children.length,
    };
  }

  // ---------------- 慢放 / 单步 ----------------
  setSlow(scale: number): void {
    this.slow = scale;
    GameScene.simScale = scale;
  }
  /** 暂停时前进 n 个 1/60 秒模拟步 */
  frame(n = 1): void {
    if (!this.running) return;
    if (!this.paused) this.togglePause();
    for (let i = 0; i < n; i++) this.g.devFrame();
  }

  // ---------------- 镜头 ----------------
  applyCamera(): void {
    if (!this.running) return;
    const cam = this.g.cameras.main;
    cam.setZoom(this.zoom);
    if (this.camMode === 'player') cam.startFollow(this.g.player, true, 0.12, 0.12);
    else if (this.camMode === 'target') {
      const t = [...this.tracked].reverse().find((x) => this.isAlive(x));
      if (t) cam.startFollow(t.e, true, 0.12, 0.12);
      else cam.startFollow(this.g.player, true, 0.12, 0.12);
    } else cam.stopFollow();
  }
  setZoom(z: number): void {
    this.zoom = Phaser.Math.Clamp(z, 0.3, 3);
    if (this.running) this.g.cameras.main.setZoom(this.zoom);
  }
  pan(dx: number, dy: number): void {
    if (!this.running) return;
    this.camMode = 'free';
    const cam = this.g.cameras.main;
    cam.stopFollow();
    cam.scrollX += dx / cam.zoom;
    cam.scrollY += dy / cam.zoom;
  }

  // ---------------- 鼠标交互：放置、传送、拖动、平移、缩放、选中 ----------------
  private bindPointer(g: GameScene): void {
    let drag: Enemy | null = null;
    let panFrom: { x: number; y: number } | null = null;
    const hit = (x: number, y: number): Enemy | null => {
      let best: Enemy | null = null,
        bd = Infinity;
      for (const e of g.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d < e.radius + 10 && d < bd) {
          bd = d;
          best = e;
        }
      }
      return best;
    };
    g.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() || p.middleButtonDown()) {
        panFrom = { x: p.x, y: p.y };
        return;
      }
      const x = p.worldX,
        y = p.worldY;
      if (this.placeMode === 'spawn' && this.placeSel) {
        const err = this.spawn(this.placeSel.id, this.placeSel.boss, { ...this.placeSel.opts, at: { x, y } });
        if (err) this.onMessage?.(err, true);
        return;
      }
      if (this.placeMode === 'teleport') {
        g.player.setPosition(x, y);
        this.playerAnchor = this.lockPlayer ? { x, y } : null;
        return;
      }
      const e = hit(x, y);
      this.selected = e;
      this.onSelect?.(e);
      if (e) drag = e;
    });
    g.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (panFrom) {
        this.pan(panFrom.x - p.x, panFrom.y - p.y);
        panFrom = { x: p.x, y: p.y };
        return;
      }
      if (drag && p.isDown && drag.alive) {
        drag.x = p.worldX;
        drag.y = p.worldY;
        const t = this.tracked.find((q) => q.e === drag && this.isAlive(q));
        if (t) t.anchor = { x: drag.x, y: drag.y };
      }
    });
    const up = () => {
      drag = null;
      panFrom = null;
    };
    g.input.on('pointerup', up);
    g.input.on('gameout', up);
    g.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.setZoom(this.zoom * (dy > 0 ? 0.9 : 1.1));
      this.onChange?.();
    });
  }

  // ---------------- 快照 / 回放 ----------------
  /** 抓取场上状态（玩家位置与生命、所有被跟踪目标的位置 / 生命 / 选项） */
  capture(label = ''): Snapshot | null {
    if (!this.running) return null;
    const g = this.g;
    return {
      t: Date.now(),
      simT: g.time.now,
      label,
      build: JSON.parse(JSON.stringify(this.getBuild())) as DevBuild,
      player: { x: g.player.x, y: g.player.y, hp: run.hp },
      enemies: this.tracked
        .filter((t) => this.isAlive(t))
        .map((t) => ({
          id: t.boss ? t.e.boss!.id : t.e.def!.id,
          boss: t.boss,
          x: t.e.x,
          y: t.e.y,
          hp: t.e.hp,
          phase2: !!t.e.phase2,
          opts: { ...t.opts, test: false },
        })),
    };
  }
  /** 场上直接还原（不重启场景）：清场后按快照位置重新生成目标 */
  applySnapshot(s: Snapshot): void {
    if (!this.running) return;
    const g = this.g;
    this.clear();
    g.player.setPosition(s.player.x, s.player.y);
    run.hp = Math.min(s.player.hp, g.stats.maxHp);
    for (const e of s.enemies) {
      this.spawn(e.id, e.boss, { ...e.opts, count: 1, at: { x: e.x, y: e.y } });
      const t = this.tracked[this.tracked.length - 1];
      if (t) {
        t.e.hp = Math.min(e.hp, t.e.maxHp);
        if (e.phase2 && t.boss) this.phase2(t);
      }
    }
    this.onChange?.();
  }
  /** 场景重启后要还原的快照（构筑不同时由面板先切构筑再重启） */
  pendingSnap: Snapshot | null = null;
  /** 回放：每秒记录一次，保留 30 秒 */
  timeline: Snapshot[] = [];
  private lastCapT = 0;
  private recordTimeline(g: GameScene): void {
    if (g.time.now - this.lastCapT < 1000) return;
    this.lastCapT = g.time.now;
    const s = this.capture();
    if (!s) return;
    this.timeline.push(s);
    if (this.timeline.length > 30) this.timeline.shift();
  }
  /** 回到 sec 秒前（按 1 秒粒度） */
  rewind(sec: number): string | null {
    const tl = this.timeline;
    if (!tl.length) return '还没有回放记录';
    const s = tl[Math.max(0, tl.length - 1 - Math.round(sec))];
    const keep = tl.indexOf(s);
    this.applySnapshot(s);
    tl.length = keep + 1;
    if (!this.paused) this.togglePause();
    return null;
  }

  // ---------------- 刷怪剧本 ----------------
  /** 每行「秒数 怪物id 数量 [b]」，b 表示精英 / Boss；# 开头为注释 */
  parseScript(src: string): { lines: ScriptLine[]; err: string | null } {
    const lines: ScriptLine[] = [];
    for (const [i, raw] of src.split('\n').entries()) {
      const s = raw.replace(/#.*/, '').trim();
      if (!s) continue;
      const [t, id, n, flag] = s.split(/\s+/);
      const boss = flag === 'b' || (!ENEMY_MAP[id] && !!BOSS_MAP[id]);
      if (!Number.isFinite(Number(t)) || !(boss ? BOSS_MAP[id] : ENEMY_MAP[id])) return { lines, err: `第 ${i + 1} 行无法识别：${raw}` };
      lines.push({ t: Number(t), id, count: Math.max(1, Number(n) || 1), boss });
    }
    return { lines, err: null };
  }
  private scriptTimers: Phaser.Time.TimerEvent[] = [];
  runScript(lines: ScriptLine[], base: SpawnOpts): string | null {
    if (!this.running) return '沙盒未运行';
    this.stopScript();
    const g = this.g;
    for (const l of lines)
      this.scriptTimers.push(
        g.time.delayedCall(l.t * 1000, () => {
          const err = this.spawn(l.id, l.boss, { ...base, count: l.count, test: false });
          if (err) this.onMessage?.(err, true);
        }),
      );
    return null;
  }
  stopScript(): void {
    for (const t of this.scriptTimers) t.remove(false);
    this.scriptTimers = [];
  }
}

export interface ScriptLine {
  t: number;
  id: string;
  count: number;
  boss: boolean;
}

export interface Snapshot {
  t: number;
  simT: number;
  label: string;
  build: DevBuild;
  player: { x: number; y: number; hp: number };
  enemies: { id: string; boss: boolean; x: number; y: number; hp: number; phase2: boolean; opts: SpawnOpts }[];
}

/** damageEnemy 包装函数需要找到当前控制器（场景实例只包一次） */
let sandboxRef: Sandbox | null = null;
export function createSandbox(game: Phaser.Game, getBuild: () => DevBuild): Sandbox {
  sandboxRef = new Sandbox(game, getBuild);
  return sandboxRef;
}
