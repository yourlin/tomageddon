// K1 Rig 动画预览：在沙盒场景里放一个展示 Rig，逐个播放 Rig 支持的全部动画状态
import Phaser from 'phaser';
import { h, btn, select, num, check } from '../dom';
import type { DevCtx } from '../ctx';
import { Rig, type RigState } from '../../objects/Rig';
import { CHARACTERS, CHARACTER_MAP } from '../../data/characters';
import { ENEMIES, ENEMY_MAP } from '../../data/enemies';
import { BOSSES, BOSS_MAP } from '../../data/bosses';
import { lookOf, type PortraitKind } from '../../ui/Portrait';

/** Rig 支持的全部状态（与 objects/Rig.ts 的 RigState 一致；Record 保证新增状态时这里会报类型错误） */
const STATE_NAME: Record<RigState, string> = {
  idle: '待机',
  move: '移动',
  attack: '攻击',
  hurt: '受击',
  windup: '蓄力',
  charge: '冲锋',
  stun: '眩晕',
  die: '死亡',
  spawn: '出生',
  cast: '施法',
  victory: '胜利',
  frozen: '冰冻',
};
const STATES = Object.keys(STATE_NAME) as RigState[];
/** 计时类状态（播完自动回到待机），其余为持续状态 */
const TIMED = new Set<RigState>(['attack', 'hurt', 'die', 'spawn', 'cast']);

let kind: PortraitKind = 'enemy';
let id = '';
let radius = 0; // 0 = 按数据默认
let face = 1;
let cycling = false;

interface Preview {
  rig: Rig;
  label: Phaser.GameObjects.Text;
  scene: Phaser.Scene;
  kind: PortraitKind;
  id: string;
  moving: boolean;
  cycleT: number;
  cycleIdx: number;
}
let pv: Preview | null = null;

function options(): [string, string][] {
  if (kind === 'char') return CHARACTERS.map((c) => [c.id, `${c.name}（${c.id}）`]);
  if (kind === 'enemy') return ENEMIES.map((e) => [e.id, `${e.name}（${e.id}）`]);
  return BOSSES.map((b) => [b.id, `${b.elite ? '精英' : 'Boss'} · ${b.name}（${b.id}）`]);
}

function defRadius(ctx: DevCtx): number {
  if (kind === 'enemy') return ENEMY_MAP[id]?.radius ?? 24;
  if (kind === 'boss') return BOSS_MAP[id]?.radius ?? 60;
  return ctx.sb.running ? ctx.sb.g.player?.radius || 30 : 30;
}

function nameOf(k: PortraitKind, i: string): string {
  return k === 'char' ? (CHARACTER_MAP[i]?.name ?? i) : k === 'enemy' ? (ENEMY_MAP[i]?.name ?? i) : (BOSS_MAP[i]?.name ?? i);
}

/** 预览是否还在（沙盒重启后场景对象被销毁） */
function alive(): Preview | null {
  if (pv && (!pv.rig.active || !pv.rig.scene)) pv = null;
  return pv;
}

export function removeRigPreview(): void {
  const p = pv;
  pv = null;
  if (!p) return;
  if (p.rig.active) p.rig.destroy();
  if (p.label.active) p.label.destroy();
}

function setState(st: RigState): void {
  const p = alive();
  if (!p) return;
  const r = p.rig;
  if (r.state === 'die' || r.alpha < 1) r.resetVisual();
  p.moving = st === 'move';
  r.setStatusTint(st === 'frozen' ? 0x9be7ff : -1);
  if (st === 'die') r.die(() => p.scene.time.delayedCall(400, () => r.active && (r.resetVisual(), r.play('idle', true))));
  else r.play(st, true);
  p.label.setText(`${nameOf(p.kind, p.id)}\n${STATE_NAME[st]}（${st}）`);
}

function create(ctx: DevCtx): string | null {
  const sb = ctx.sb;
  if (!sb.running) return '沙盒未运行';
  const g = sb.g;
  if (!g.player) return '沙盒场景尚未就绪';
  if (!id) return '先选择一个对象';
  removeRigPreview();
  const r = radius > 0 ? radius : defRadius(ctx);
  const A = g.arena;
  const x = Phaser.Math.Clamp(g.player.x + 140 + r, A.x + r + 20, A.right - r - 20);
  const y = Phaser.Math.Clamp(g.player.y, A.y + r + 40, A.bottom - r - 20);
  const rig = new Rig(g, lookOf(kind, id), `${kind}_${id}`, r);
  g.add.existing(rig);
  rig.setPosition(x, y).setDepth(19000);
  const label = g.add
    .text(x, y - r - 26, '', {
      fontFamily: 'system-ui',
      fontSize: '14px',
      color: '#ffd166',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    })
    .setOrigin(0.5, 1)
    .setDepth(19001);
  const p: Preview = { rig, label, scene: g, kind, id, moving: false, cycleT: 0, cycleIdx: 0 };
  pv = p;
  const upd = (_t: number, dms: number) => {
    if (!rig.active) return;
    const dt = dms / 1000;
    if (cycling) {
      p.cycleT -= dt;
      if (p.cycleT <= 0) {
        const st = STATES[p.cycleIdx % STATES.length];
        p.cycleIdx++;
        setState(st);
        p.cycleT = st === 'die' ? 1.4 : TIMED.has(st) ? 0.9 : 1.6;
      }
    }
    const ptr = g.input.activePointer;
    const wp = g.cameras.main.getWorldPoint(ptr.x, ptr.y);
    rig.tick(dt, p.moving ? 1 : 0, face, Phaser.Math.Clamp((wp.x - rig.x) / 300, -1, 1), Phaser.Math.Clamp((wp.y - rig.y) / 300, -1, 1));
    label.setPosition(rig.x, rig.y - rig.radius - 26);
  };
  g.events.on(Phaser.Scenes.Events.UPDATE, upd);
  rig.once(Phaser.GameObjects.Events.DESTROY, () => {
    g.events.off(Phaser.Scenes.Events.UPDATE, upd);
    if (label.active) label.destroy();
    if (pv === p) pv = null;
  });
  setState('spawn');
  return null;
}

export function renderRig(ctx: DevCtx): HTMLElement {
  const opts = options();
  if (!opts.some(([v]) => v === id)) id = opts[0]?.[0] ?? '';
  const root = h('div');
  const status = h('div', { class: 'muted' });
  const refreshStatus = () => {
    const p = alive();
    status.textContent = p
      ? `预览中：${nameOf(p.kind, p.id)} · 当前状态 ${STATE_NAME[p.rig.state]}（${p.rig.state}）· 半径 ${Math.round(p.rig.radius)}`
      : ctx.sb.running
        ? '当前没有预览（沙盒重启后预览会消失，需重新创建）'
        : '沙盒未运行';
  };
  const redraw = () => root.replaceWith(renderRig(ctx));
  root.append(
    h(
      'div',
      { class: 'row' },
      select(
        [
          ['char', '角色'],
          ['enemy', '怪物'],
          ['boss', '精英 / Boss'],
        ],
        kind,
        (v) => {
          kind = v as PortraitKind;
          id = '';
          redraw();
        },
      ),
      select(opts, id, (v) => {
        id = v;
      }),
      h('span', null, '半径'),
      num(radius, (v) => (radius = v), { min: 0, max: 200, width: 56 }),
      h('span', { class: 'muted small' }, '0=按数据'),
    ),
    h(
      'div',
      { class: 'row' },
      btn(
        '创建预览',
        () => {
          const e = create(ctx);
          if (e) ctx.toast(e, true);
          refreshStatus();
        },
        'pri',
      ),
      btn('移除预览', () => {
        removeRigPreview();
        refreshStatus();
      }),
      check('朝右', face > 0, (v) => (face = v ? 1 : -1)),
      check('自动循环全部动画', cycling, (v) => {
        cycling = v;
        const p = alive();
        if (p) p.cycleT = 0;
      }),
    ),
    h(
      'div',
      { class: 'row' },
      ...STATES.map((st) =>
        btn(
          `${STATE_NAME[st]}${TIMED.has(st) ? '' : ' ∞'}`,
          () => {
            if (!alive()) {
              const e = create(ctx);
              if (e) return ctx.toast(e, true);
            }
            cycling = false;
            setState(st);
            refreshStatus();
          },
          '',
          `${st}${TIMED.has(st) ? '（计时，播完回到待机）' : '（持续，直到切换其他状态）'}`,
        ),
      ),
    ),
    status,
    h('div', { class: 'muted small' }, '∞ 为持续状态；「移动」会让 Rig 原地踏步；视线跟随鼠标。预览放在玩家右侧，敌人不会把它当作目标。'),
  );
  refreshStatus();
  return root;
}
