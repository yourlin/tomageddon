// K3 特效预览：在玩家位置单独播放 Fx / SkillFx / AuraFx 中纯表现、无战斗副作用的特效
import Phaser from 'phaser';
import { h, btn, select, num, hex } from '../dom';
import type { DevCtx } from '../ctx';
import type { GameScene } from '../../scenes/GameScene';
import { CHARACTERS } from '../../data/characters';
import { castFx, drainLines } from '../../systems/SkillFx';
import { AuraFx, AURA_LOOK } from '../../systems/AuraFx';

const COLORS: [number, string][] = [
  [0xff7b00, '橙'],
  [0xff3b30, '红'],
  [0xffd166, '黄'],
  [0x52ff8a, '绿'],
  [0x6ec6ff, '蓝'],
  [0xc77dff, '紫'],
  [0xffffff, '白'],
];
let color = COLORS[0][0];
let radius = 120;

interface FxDef {
  name: string;
  tip: string;
  run: (g: GameScene, x: number, y: number) => void;
}

/** 在指定点周围取 n 个点（闪电、吸取线等需要多个目标点） */
const around = (x: number, y: number, n: number, r: number) =>
  Array.from({ length: n }, (_, i) => ({ x: x + Math.cos((i / n) * Math.PI * 2) * r, y: y + Math.sin((i / n) * Math.PI * 2) * r * 0.75 }));

const FX: FxDef[] = [
  { name: '伤害数字', tip: 'fx.number（受「显示伤害数字」设置影响）', run: (g, x, y) => g.fx.number(x, y, 128, '#ffffff') },
  { name: '暴击数字', tip: 'fx.number crit', run: (g, x, y) => g.fx.number(x, y, 512, '#ffffff', true) },
  { name: '文字标签', tip: 'fx.label', run: (g, x, y) => g.fx.label(x, y, '特效预览', hex(color)) },
  { name: '火花迸发', tip: 'fx.burst', run: (g, x, y) => g.fx.burst(x, y, color, 24) },
  { name: '扩散环', tip: 'fx.ring', run: (g, x, y) => g.fx.ring(x, y, radius, color, 400) },
  { name: '实心扩散', tip: 'fx.ring fill', run: (g, x, y) => g.fx.ring(x, y, radius, color, 400, true) },
  { name: '刀光', tip: 'fx.slash', run: (g, x, y) => g.fx.slash(x + radius * 0.5, y, 0, radius * 0.6, color) },
  { name: '突刺', tip: 'fx.thrust', run: (g, x, y) => g.fx.thrust(x, y, 0, radius * 1.6) },
  { name: '激光', tip: 'fx.beam', run: (g, x, y) => g.fx.beam(x, y, 0, radius * 3, 16, color) },
  {
    name: '闪电链',
    tip: 'fx.bolt',
    run: (g, x, y) =>
      g.fx.bolt(
        [
          { x, y },
          { x: x + radius, y: y - 40 },
          { x: x + radius * 2, y: y + 30 },
          { x: x + radius * 2.6, y: y - 20 },
        ],
        color,
      ),
  },
  { name: '命中火花', tip: 'fx.hit', run: (g, x, y) => g.fx.hit(x + 40, y, 0, false) },
  { name: '暴击火花', tip: 'fx.hit crit', run: (g, x, y) => g.fx.hit(x + 40, y, 0, true) },
  {
    name: '爆炸',
    tip: 'fx.explosion（沙盒开启「爆炸半径」叠加时会画出半径）',
    run: (g, x, y) => g.fx.explosion(x + radius * 1.2, y, radius * 0.75, color),
  },
  { name: '新星', tip: 'fx.nova', run: (g, x, y) => g.fx.nova(x, y, radius * 1.3, color) },
  { name: '残影', tip: 'fx.afterimage', run: (g, x, y) => g.fx.afterimage({ x, y }, color) },
  { name: '地面汁液', tip: 'fx.splat（地面效果，5 秒后淡出）', run: (g, x, y) => g.fx.splat(x + radius, y + 20, color, 30) },
  {
    name: '预警圈',
    tip: 'fx.telegraphCircle（地面效果，1.2 秒后结束，不造成伤害）',
    run: (g, x, y) =>
      g.fx.telegraphCircle(x + radius * 1.2, y, radius * 0.7, 1.2, 0xff3b30, () =>
        g.fx.ring(x + radius * 1.2, y, radius * 0.7, 0xff3b30, 250),
      ),
  },
  {
    name: '预警线',
    tip: 'fx.telegraphLine（地面效果，不造成伤害）',
    run: (g, x, y) => g.fx.telegraphLine(x, y, 1, 0, radius * 3, 28, 1.2),
  },
  { name: '吸取生命线', tip: 'SkillFx.drainLines', run: (g, x, y) => drainLines(g, around(x, y, 6, radius * 1.4), color) },
];

/** 当前播放中的光环预览 */
let aura: { fx: AuraFx; stop: () => void } | null = null;

function stopAura(): void {
  aura?.stop();
  aura = null;
}

function playAura(g: GameScene, look: (typeof AURA_LOOK)[string]): void {
  stopAura();
  const fx = new AuraFx(g, look.color, look.style);
  let t = 0,
    pulseT = 0;
  const upd = (_t: number, dms: number) => {
    const dt = dms / 1000;
    t += dt;
    pulseT -= dt;
    const p = g.player;
    fx.update(p.x, p.y, radius, dt);
    if (pulseT <= 0) {
      pulseT = 0.5;
      fx.pulse(around(p.x, p.y, 4, radius * 0.7));
    }
    if (t > 4) stopAura();
  };
  const stop = () => {
    g.events.off(Phaser.Scenes.Events.UPDATE, upd);
    g.events.off(Phaser.Scenes.Events.SHUTDOWN, stop);
    fx.destroy();
    if (aura?.fx === fx) aura = null;
  };
  g.events.on(Phaser.Scenes.Events.UPDATE, upd);
  g.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
  aura = { fx, stop };
}

export function renderFx(ctx: DevCtx): HTMLElement {
  const sb = ctx.sb;
  const scene = (): GameScene | null => {
    if (!sb.running || !sb.g.player || !sb.g.fx) {
      ctx.toast('沙盒未运行', true);
      return null;
    }
    if (sb.paused) sb.togglePause();
    return sb.g;
  };
  const play = (fn: (g: GameScene, x: number, y: number) => void) => {
    const g = scene();
    if (!g) return;
    fn(g, g.player.x, g.player.y);
  };
  return h(
    'div',
    null,
    h(
      'div',
      { class: 'row' },
      h('span', null, '颜色'),
      select(
        COLORS.map(([c, n]) => [c, n]),
        color,
        (v) => (color = Number(v)),
      ),
      h('span', null, '半径'),
      num(radius, (v) => (radius = v), { min: 20, max: 400, width: 60 }),
      h('span', { class: 'muted small' }, '均在玩家位置（或其右侧）播放，只有表现，不造成伤害'),
    ),
    h('div', { class: 'muted' }, '基础特效（systems/Fx.ts）'),
    h('div', { class: 'row' }, ...FX.map((f) => btn(f.name, () => play(f.run), '', f.tip))),
    h('div', { class: 'muted' }, '技能释放动画（SkillFx.castFx：横幅 + 光芒 + 镜头冲击 + 形态特效；不会真正释放技能）'),
    h(
      'div',
      { class: 'row' },
      ...CHARACTERS.map((c) =>
        h(
          'button',
          {
            title: `${c.name} · ${c.skill.type}`,
            style: `color:${hex(c.skill.color)}`,
            onclick: () => play((g) => castFx(g, c.skill, c.skill.duration ?? 1.5, 0)),
          },
          c.skill.name,
        ),
      ),
    ),
    h('div', { class: 'muted' }, '光环（AuraFx：跟随玩家 4 秒，每 0.5 秒一次结算冲击波；半径取上方设置）'),
    h(
      'div',
      { class: 'row' },
      ...Object.entries(AURA_LOOK).map(([id, look]) =>
        h(
          'button',
          { style: `color:${hex(look.color)}`, title: `${id} · ${look.style}`, onclick: () => play((g) => playAura(g, look)) },
          `${id}（${look.style}）`,
        ),
      ),
      btn('停止光环', stopAura),
    ),
  );
}
