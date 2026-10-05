// HUD 状态图标：按状态颜色画一枚带渐变和高光的徽章，中间放对应的图案（emoji）。
// 增益是金色外圈的圆徽章，减益是暗红外圈、带尖角的盾形徽章，一眼能分清好坏。
import Phaser from 'phaser';
import { STATUSES, type StatusId } from '../data/statuses';
import { rgb, lighten, darken, type Ctx, paint } from './Painter';

export const STATUS_ICON_SIZE = 44;

/** 每种状态的图案 */
export const STATUS_EMOJI: Record<StatusId, string> = {
  burn: '🔥',
  poison: '☠️',
  bleed: '🩸',
  slow: '🐌',
  freeze: '🧊',
  stun: '💫',
  weaken: '🥀',
  vulnerable: '💔',
  armorBreak: '🔨',
  curse: '💀',
  blind: '🙈',
  confuse: '🌀',
  sticky: '🍯',
  mark: '📍',
  silence: '🔇',
  rot: '🍂',
  soaked: '💧',
  corrode: '🧪',
  haste: '💨',
  rage: '💢',
  shield: '🛡️',
  regen: '💚',
  fortify: '🏰',
  invuln: '✨',
  thorns: '🌵',
  focus: '🎯',
  barrier: '🔮',
  enrage: '😡',
  lucky: '🍀',
  vampiric: '🦇',
  tailwind: '🍃',
  hardened: '💎',
};

const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

/** 减益的盾形轮廓：上沿平直、下方收成尖角 */
function shieldPath(ctx: Ctx, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r * 0.78);
  ctx.quadraticCurveTo(cx, cy - r * 1.12, cx + r, cy - r * 0.78);
  ctx.lineTo(cx + r * 0.92, cy + r * 0.2);
  ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 0.82, cx, cy + r * 1.08);
  ctx.quadraticCurveTo(cx - r * 0.6, cy + r * 0.82, cx - r * 0.92, cy + r * 0.2);
  ctx.closePath();
}

/** 生成（或复用）某个状态的图标贴图，返回贴图 key */
export function statusIconKey(scene: Phaser.Scene, id: StatusId): string {
  const d = STATUSES[id];
  const S = STATUS_ICON_SIZE;
  return paint(scene, `status_icon_${id}`, S, S, (ctx) => {
    const cx = S / 2,
      cy = S / 2,
      r = S / 2 - 4;
    const buff = d.kind === 'buff';
    const body = (rr: number) => (buff ? (ctx.beginPath(), ctx.arc(cx, cy, rr, 0, Math.PI * 2)) : shieldPath(ctx, cx, cy, rr));
    // 投影
    ctx.save();
    ctx.translate(0, 2);
    body(r + 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();
    ctx.restore();
    // 外圈
    body(r + 2);
    const rim = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    if (buff) {
      rim.addColorStop(0, '#fff3b0');
      rim.addColorStop(0.5, '#ffc93c');
      rim.addColorStop(1, '#a86b00');
    } else {
      rim.addColorStop(0, '#ff8a8a');
      rim.addColorStop(0.5, '#b3122a');
      rim.addColorStop(1, '#4a0610');
    }
    ctx.fillStyle = rim;
    ctx.fill();
    // 内芯：状态色的径向渐变
    body(r - 1.5);
    const core = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 1, cx, cy, r);
    core.addColorStop(0, rgb(lighten(d.color, 0.45)));
    core.addColorStop(0.6, rgb(d.color));
    core.addColorStop(1, rgb(darken(d.color, 0.45)));
    ctx.fillStyle = core;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.stroke();
    // 图案
    ctx.save();
    ctx.font = `${Math.round(S * 0.46)}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText(STATUS_EMOJI[id] ?? d.glyph, cx, cy + (buff ? 1 : 0));
    ctx.restore();
    // 高光
    ctx.save();
    body(r - 1.5);
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.62, r * 0.75, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.restore();
  });
}
