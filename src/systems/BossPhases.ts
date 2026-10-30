// Boss 阶段：门槛锁血（保证最短战斗时间）、3 秒转阶段（定格 → 蓄势 → 爆发 → 收势）、运镜与场地变化。
// 阶段数据写在 BossDef.phases（data/bossPhases.ts）；设计见 docs/design/BOSS_PHASES.md
import type { GameScene } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import type { CameraStep } from '../data/bosses';
import { save } from './Save';
import { tx } from '../i18n';
import { viewZoom } from './HiDpi';
import { BALANCE } from '../data/balance';
import { SHADOWS } from '../data/bossPhases';
import type { ArenaChange } from './Arena';
import { BossAura } from './BossAura';
import { PHASE_ANIMS, type AnimCtx, type PhaseAnim } from './BossPhaseAnims';
import { bossForm } from './CombatArt';

/** 阶段数据里的场地变化坐标是相对 Boss 的：换算成场地坐标 */
function relative(c: ArenaChange, e: Enemy): ArenaChange {
  if (c.kind === 'obstacle') return { ...c, obstacles: c.obstacles.map((o) => ({ ...o, x: o.x + e.x, y: o.y + e.y })) };
  if (c.kind === 'flood' && 'circle' in c.area) {
    const [x, y, r] = c.area.circle;
    return { ...c, area: { circle: [x + e.x, y + e.y, r] } };
  }
  return c;
}

const P = () => BALANCE.bossPhase;

/** 转阶段时间轴（秒，相对开始） */
const T_FREEZE = 0.4;
const T_BURST = 1.8;
const T_SETTLE = 2.4;

interface Transition {
  e: Enemy;
  next: number;
  t: number;
  burst: boolean;
  settle: boolean;
  anim?: PhaseAnim;
  ctx: AnimCtx;
}

export class BossPhaseDirector {
  private trans: Transition[] = [];
  /** 「坚韧」「无敌」跳字的节流 */
  private labelT = new WeakMap<Enemy, number>();
  private camBase: { zoom: number } | null = null;

  /** 阶段常驻外观（光晕、火焰、环绕物……） */
  readonly aura: BossAura;

  constructor(private g: GameScene) {
    this.aura = new BossAura(g);
  }

  /** 本 Boss 是否使用阶段系统 */
  static has(e: Enemy): boolean {
    return !!e.boss?.phases?.length && !e.shadow;
  }

  /** 在扣血前调用：返回实际可扣的伤害（门槛锁血、转阶段无敌）；可能触发转阶段 */
  gate(e: Enemy, dmg: number): number {
    if (dmg <= 0) return dmg;
    // 冲锋无敌（蟑螂皇帝）：冲锋途中免疫伤害，冲锋前的蓄力仍可打
    if (e.boss?.chargeImmune && e.state === 'charge') {
      this.label(e, tx('无敌', 'Immune'), '#ffd54f');
      return 0;
    }
    if (!BossPhaseDirector.has(e)) return dmg;
    if (e.phaseTrans > 0) {
      this.label(e, tx('无敌', 'Immune'), '#cfd8dc');
      return 0;
    }
    const phases = e.boss!.phases!;
    const nxt = phases[e.phaseIdx + 1];
    if (!nxt) return dmg;
    const floor = nxt.at * e.maxHp;
    if (e.hp - dmg > floor) return dmg;
    const minTime = phases[e.phaseIdx].minTime ?? P().minTime;
    if (e.phaseT < minTime) {
      // 阶段时间没到：生命停在门槛上，多出来的伤害作废
      this.label(e, tx('坚韧', 'Tough'), '#9e9e9e');
      return Math.max(0, e.hp - floor - 1);
    }
    this.begin(e, e.phaseIdx + 1);
    return Math.max(0, e.hp - floor);
  }

  /** 开始转阶段（门槛被打破） */
  begin(e: Enemy, next: number): void {
    const g = this.g;
    const ph = e.boss!.phases![next];
    e.phaseTrans = P().transTime;
    e.state = 'move';
    e.spiral = null;
    // 专属动画：落点（障碍物 / 淹没圆心）先换算好，供动画对准
    const changes = (ph.arena ?? []).map((c) => relative(c, e));
    const targets = changes.flatMap((c) =>
      c.kind === 'obstacle'
        ? c.obstacles.map((o) =>
            o.kind === 'circle' ? { x: o.x, y: o.y, r: o.r } : { x: o.x + o.w / 2, y: o.y + o.h / 2, r: Math.min(o.w, o.h) / 2 },
          )
        : c.kind === 'flood' && 'circle' in c.area
          ? [{ x: c.area.circle[0], y: c.area.circle[1], r: c.area.circle[2] }]
          : [],
    );
    const anim = PHASE_ANIMS[`${e.boss!.id}:${next}`];
    const ctx: AnimCtx = { g, e, targets, mem: {} };
    this.trans.push({ e, next, t: 0, burst: false, settle: false, anim, ctx });
    anim?.start?.(ctx);
    const fx = save.settings.shake;
    // 定格：慢动作 + 闪白 + 震屏
    if (fx) g.hitStop(0.3, 0.25);
    e.rig?.play('hurt', true);
    g.fx.ring(e.x, e.y, e.radius * 2.2, 0xffffff, 300, true);
    g.shake(0.01, 300);
    g.events.emit('bossPhase', e, next, ph);
    // 场地变化在开始时下令：自带 1.5 秒预警，正好在爆发段生效
    for (const c of changes) g.arenaFx.change(c);
    // 运镜
    if (fx) this.camera(e, ph.camera ?? [{ kind: 'push', zoom: 1.08 }]);
  }

  update(dt: number): void {
    const g = this.g;
    this.aura.update(dt);
    for (const tr of this.trans) {
      const e = tr.e;
      tr.t += dt;
      e.phaseTrans = Math.max(0, P().transTime - tr.t);
      if (!e.alive) continue;
      const ph = e.boss!.phases![tr.next];
      // 蓄势：颤抖、体型脉动、四周粒子汇聚
      if (tr.t >= T_FREEZE && tr.t < T_BURST && e.rig) {
        const k = (tr.t - T_FREEZE) / (T_BURST - T_FREEZE);
        tr.anim?.charge?.(tr.ctx, k);
        e.rig.setScale(e.baseScale * (1 + 0.075 * (1 + Math.sin(tr.t * 18)) * k));
        e.rig.x += (Math.random() - 0.5) * 6 * k;
        if (Math.random() < dt * 14) {
          const a = Math.random() * Math.PI * 2,
            r = e.radius * (3 + Math.random() * 2);
          g.fx.burst(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, ph.color ?? e.boss!.color, 2);
        }
      }
      // 爆发：换形态、冲击波清弹、轻推玩家、放转场招式
      if (!tr.burst && tr.t >= T_BURST) {
        tr.burst = true;
        if (e.boss!.id === SHADOWS.boss && tr.next === SHADOWS.phase) g.spawnShadows(e, SHADOWS.ids, SHADOWS.hpMult);
        e.rig?.setScale(e.baseScale * (ph.scale ?? 1));
        const form = bossForm(g, e.boss!.id, tr.next);
        const illustrated = form && e.rig?.setBossForm(form, 0.45);
        e.phaseTint = illustrated ? -1 : (ph.tint ?? -1);
        e.refreshTint();
        g.fx.nova(e.x, e.y, e.radius * 4, ph.color ?? e.boss!.color);
        g.clearEnemyBullets(true);
        const p = g.player;
        const d = Math.hypot(p.x - e.x, p.y - e.y) || 1;
        if (d < 360) g.pushPlayer(((p.x - e.x) / d) * 260, ((p.y - e.y) / d) * 260);
        g.shake(0.018, 450);
        const dx = p.x - e.x,
          dy = p.y - e.y;
        for (const pat of ph.transition ?? []) e.firePattern(g, pat, dx / d, dy / d);
        tr.anim?.burst?.(tr.ctx);
      }
      // 收势：镜头复位
      if (!tr.settle && tr.t >= T_SETTLE) {
        tr.settle = true;
        this.cameraReset();
      }
      // 结束：切到新阶段的招式表
      if (tr.t >= P().transTime) this.finish(e, tr.next);
    }
    this.trans = this.trans.filter((tr) => tr.t < P().transTime && tr.e.alive);
  }

  private finish(e: Enemy, next: number): void {
    const ph = e.boss!.phases![next];
    e.phaseIdx = next;
    e.phaseT = 0;
    e.phaseTrans = 0;
    e.setPhasePatterns(ph);
    e.rig?.setAlpha(e.shadow ? 0.78 : 1);
    this.aura.set(e, PHASE_ANIMS[`${e.boss!.id}:${next}`]?.aura);
    for (const s of ph.buff ?? []) e.status.apply(s);
    this.g.events.emit('bossPhaseEnd', e, next);
  }

  private label(e: Enemy, s: string, color: string): void {
    const now = this.g.time.now;
    if ((this.labelT.get(e) ?? 0) > now) return;
    this.labelT.set(e, now + 600);
    this.g.fx.label(e.x, e.y - e.radius - 10, s, color);
  }

  // ---------- 运镜 ----------

  private camera(e: Enemy, steps: CameraStep[]): void {
    const cam = this.g.cameras.main;
    if (!this.camBase) this.camBase = { zoom: cam.zoom };
    const base = this.camBase.zoom;
    const p = this.g.player;
    // 镜头最多偏离玩家 40% 屏幕宽，保证玩家不出画
    const maxOff = (cam.width / cam.zoom) * 0.4;
    const clampTo = (x: number, y: number): [number, number] => {
      const dx = x - p.x,
        dy = y - p.y,
        d = Math.hypot(dx, dy);
      return d <= maxOff ? [x, y] : [p.x + (dx / d) * maxOff, p.y + (dy / d) * maxOff];
    };
    let at = 0;
    for (const s of steps) {
      const dur = (s.dur ?? 0.6) * 1000;
      this.g.time.delayedCall(at, () => {
        if (!e.alive) return;
        switch (s.kind) {
          case 'push':
            cam.zoomTo(base * (s.zoom ?? 1.08), dur, 'Sine.easeInOut', true);
            if (s.focus !== false) {
              cam.stopFollow();
              const [x, y] = clampTo((e.x + p.x) / 2, (e.y + p.y) / 2);
              cam.pan(x, y, dur, 'Sine.easeInOut', true);
            }
            break;
          case 'pull':
            cam.zoomTo(base * (s.zoom ?? 0.85), dur, 'Sine.easeInOut', true);
            break;
          case 'track':
            cam.startFollow(e, true, 0.08, 0.08);
            break;
          case 'pan': {
            cam.stopFollow();
            const tgt = s.to === 'center' ? [this.g.arena.centerX, this.g.arena.centerY] : s.to === 'boss' || !s.to ? [e.x, e.y] : s.to;
            const [x, y] = clampTo(tgt[0], tgt[1]);
            cam.pan(x, y, dur, 'Sine.easeInOut', true);
            break;
          }
          case 'shake':
            this.g.shake(s.intensity ?? 0.015, dur);
            break;
        }
      });
      at += (s.hold ?? s.dur ?? 0.6) * 1000;
    }
  }

  private cameraReset(): void {
    const cam = this.g.cameras.main;
    if (this.camBase) cam.zoomTo(this.camBase.zoom, 450, 'Sine.easeInOut', true);
    this.camBase = null;
    cam.startFollow(this.g.player, true, 0.12, 0.12);
  }

  /** 当前逻辑缩放（调试用） */
  get zoom(): number {
    return viewZoom(this.g.cameras.main);
  }
}

/** 阶段对应的罗马数字 */
export const ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'];
