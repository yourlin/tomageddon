// 可复用的面部与肢体部件贴图（按颜色缓存）
import Phaser from 'phaser';
import { paint, rgb, darken, lighten, outlineOf, toon, ellipsePath, roundRectPath, starPath, OUTLINE, glow } from './Painter';
import type { Eyes, Mouth } from './RigSpec';

const hex = (c: number) => c.toString(16).padStart(6, '0');

/** 眼白（带描边），style 决定形状 */
export function eyeTex(s: Phaser.Scene, style: Eyes, white = 0xffffff): string {
  return paint(s, `rig_eye_${style}_${hex(white)}`, 44, 44, (ctx) => {
    const cx = 22,
      cy = 22;
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.fillStyle = rgb(white);
    switch (style) {
      case 'big':
        ellipsePath(ctx, cx, cy, 17, 19);
        break;
      case 'sleepy':
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 15, 11, 0, Math.PI * 1.05, Math.PI * 1.95, true);
        ctx.closePath();
        break;
      case 'fierce':
        ctx.beginPath();
        ctx.moveTo(6, 14);
        ctx.quadraticCurveTo(22, 12, 38, 22);
        ctx.quadraticCurveTo(26, 40, 8, 30);
        ctx.closePath();
        break;
      case 'dot':
        ellipsePath(ctx, cx, cy, 9, 10);
        break;
      case 'glow':
        glow(ctx, cx, cy, 20, white, 0.9);
        ellipsePath(ctx, cx, cy, 10, 10);
        break;
      default:
        ellipsePath(ctx, cx, cy, 14, 15);
    }
    ctx.fill();
    ctx.stroke();
  });
}

export function pupilTex(s: Phaser.Scene, color = 0x1b1b1b): string {
  return paint(s, `rig_pupil_${hex(color)}`, 20, 20, (ctx) => {
    ctx.fillStyle = rgb(color);
    ctx.beginPath();
    ctx.arc(10, 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, 7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12.5, 13, 1.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** 特殊眼型：整组贴图（面罩、墨镜、独眼、三眼、复眼） */
export function eyeGroupTex(s: Phaser.Scene, style: Eyes, color: number): string {
  return paint(s, `rig_eyes_${style}_${hex(color)}`, 96, 48, (ctx) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    switch (style) {
      case 'visor': {
        roundRectPath(ctx, 6, 12, 84, 24, 12);
        const g = ctx.createLinearGradient(0, 12, 0, 36);
        g.addColorStop(0, rgb(lighten(color, 0.4)));
        g.addColorStop(1, rgb(darken(color, 0.3)));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(16, 17, 30, 4);
        break;
      }
      case 'shades':
        for (const x of [26, 70]) {
          roundRectPath(ctx, x - 18, 12, 36, 24, 8);
          ctx.fillStyle = '#1b1b1b';
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x - 12, 16, 10, 4);
        }
        ctx.beginPath();
        ctx.moveTo(44, 20);
        ctx.lineTo(52, 20);
        ctx.stroke();
        break;
      case 'one':
        ellipsePath(ctx, 48, 24, 20, 20);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = rgb(color);
        ctx.beginPath();
        ctx.arc(48, 25, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(48, 25, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(44, 21, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'three':
        for (const [x, y, r] of [
          [22, 28, 11],
          [48, 16, 12],
          [74, 28, 11],
        ]) {
          ellipsePath(ctx, x, y, r, r);
          ctx.fillStyle = '#fff3b0';
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = rgb(color);
          ctx.beginPath();
          ctx.arc(x, y + 1, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'compound':
        for (const x of [26, 70]) {
          ellipsePath(ctx, x, 24, 20, 18);
          const g = ctx.createRadialGradient(x - 6, 18, 2, x, 24, 20);
          g.addColorStop(0, rgb(lighten(color, 0.5)));
          g.addColorStop(1, rgb(darken(color, 0.3)));
          ctx.fillStyle = g;
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = rgb(darken(color, 0.4), 0.6);
          ctx.lineWidth = 1;
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 5, 8);
            ctx.lineTo(x + i * 5, 40);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - 18, 24 + i * 5);
            ctx.lineTo(x + 18, 24 + i * 5);
            ctx.stroke();
          }
          ctx.lineWidth = 3;
          ctx.strokeStyle = OUTLINE;
        }
        break;
    }
  });
}

/** 表情：闭眼线、X 眼、晕眩圈 */
export function eyeFxTex(s: Phaser.Scene, kind: 'closed' | 'x' | 'spiral' | 'happy' | 'squeeze'): string {
  return paint(s, `rig_eyefx_${kind}`, 36, 36, (ctx) => {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    switch (kind) {
      case 'closed':
        ctx.moveTo(7, 20);
        ctx.quadraticCurveTo(18, 26, 29, 20);
        break;
      case 'happy':
        ctx.moveTo(7, 22);
        ctx.quadraticCurveTo(18, 8, 29, 22);
        break;
      case 'squeeze':
        ctx.moveTo(6, 10);
        ctx.lineTo(26, 18);
        ctx.lineTo(6, 26);
        break;
      case 'x':
        ctx.moveTo(8, 8);
        ctx.lineTo(28, 28);
        ctx.moveTo(28, 8);
        ctx.lineTo(8, 28);
        break;
      case 'spiral':
        for (let t = 0; t < 12; t += 0.2) {
          const r = t * 1.2;
          const x = 18 + Math.cos(t) * r,
            y = 18 + Math.sin(t) * r;
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2.5;
        break;
    }
    ctx.stroke();
  });
}

export type MouthFace = 'smile' | 'grin' | 'open' | 'frown' | 'angry' | 'ouch' | 'fangs' | 'o' | 'flat' | 'beak' | 'mandible' | 'evil';

export function mouthTex(s: Phaser.Scene, face: MouthFace): string {
  return paint(s, `rig_mouth_${face}`, 48, 32, (ctx) => {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.5;
    ctx.fillStyle = '#6b1d1d';
    const tongue = () => {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#ff6b81';
      ctx.beginPath();
      ctx.ellipse(24, 28, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    switch (face) {
      case 'smile':
        ctx.beginPath();
        ctx.moveTo(12, 10);
        ctx.quadraticCurveTo(24, 24, 36, 10);
        ctx.stroke();
        break;
      case 'flat':
        ctx.beginPath();
        ctx.moveTo(15, 14);
        ctx.lineTo(33, 14);
        ctx.stroke();
        break;
      case 'frown':
        ctx.beginPath();
        ctx.moveTo(13, 20);
        ctx.quadraticCurveTo(24, 8, 35, 20);
        ctx.stroke();
        break;
      case 'grin':
        ctx.beginPath();
        ctx.moveTo(8, 8);
        ctx.quadraticCurveTo(24, 34, 40, 8);
        ctx.closePath();
        ctx.fill();
        tongue();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillRect(12, 8, 24, 4);
        break;
      case 'open':
        ctx.beginPath();
        ctx.ellipse(24, 16, 10, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        tongue();
        ctx.stroke();
        break;
      case 'o':
        ctx.beginPath();
        ctx.ellipse(24, 16, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'ouch':
        ctx.beginPath();
        ctx.moveTo(9, 16);
        for (let i = 0; i < 6; i++) ctx.lineTo(13 + i * 5, i % 2 ? 11 : 20);
        ctx.stroke();
        break;
      case 'angry':
        roundRectPath(ctx, 10, 8, 28, 14, 5);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 15);
        ctx.lineTo(38, 15);
        for (let i = 1; i < 4; i++) {
          ctx.moveTo(10 + i * 7, 8);
          ctx.lineTo(10 + i * 7, 22);
        }
        ctx.stroke();
        break;
      case 'fangs':
      case 'evil':
        ctx.beginPath();
        ctx.moveTo(6, 8);
        ctx.quadraticCurveTo(24, face === 'evil' ? 30 : 24, 42, 8);
        ctx.quadraticCurveTo(24, 14, 6, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        for (const x of face === 'evil' ? [12, 18, 24, 30, 36] : [15, 33]) {
          ctx.beginPath();
          ctx.moveTo(x - 3, 10);
          ctx.lineTo(x, 19);
          ctx.lineTo(x + 3, 10);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'beak':
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.moveTo(12, 8);
        ctx.lineTo(36, 8);
        ctx.lineTo(24, 26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'mandible':
        ctx.fillStyle = '#3d2c2e';
        ctx.beginPath();
        ctx.moveTo(10, 4);
        ctx.quadraticCurveTo(4, 20, 18, 28);
        ctx.lineTo(18, 20);
        ctx.quadraticCurveTo(12, 14, 16, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(38, 4);
        ctx.quadraticCurveTo(44, 20, 30, 28);
        ctx.lineTo(30, 20);
        ctx.quadraticCurveTo(36, 14, 32, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
  });
}

/** 各嘴型风格下不同状态对应的表情 */
export function mouthFor(style: Mouth, state: 'idle' | 'attack' | 'hurt' | 'windup' | 'die' | 'happy'): MouthFace | null {
  if (style === 'none') return null;
  if (style === 'beak') return state === 'hurt' ? 'o' : 'beak';
  if (style === 'mandible') return 'mandible';
  if (state === 'hurt') return 'ouch';
  if (state === 'die') return 'o';
  if (style === 'cute') return state === 'attack' ? 'open' : state === 'windup' ? 'angry' : state === 'happy' ? 'grin' : 'smile';
  if (style === 'tough') return state === 'attack' ? 'grin' : state === 'windup' ? 'angry' : 'flat';
  if (style === 'fangs') return state === 'attack' || state === 'windup' ? 'evil' : 'fangs';
  return state === 'attack' || state === 'windup' ? 'angry' : 'evil';
}

export function browTex(s: Phaser.Scene): string {
  return paint(s, 'rig_brow', 30, 12, (ctx) => {
    ctx.fillStyle = '#2a1614';
    roundRectPath(ctx, 2, 2, 26, 8, 4);
    ctx.fill();
  });
}

export function blushTex(s: Phaser.Scene): string {
  return paint(s, 'rig_blush', 28, 18, (ctx) => {
    const g = ctx.createRadialGradient(14, 9, 1, 14, 9, 13);
    g.addColorStop(0, 'rgba(255,120,150,0.8)');
    g.addColorStop(1, 'rgba(255,120,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 28, 18);
  });
}

export function footTex(s: Phaser.Scene, color: number): string {
  return paint(s, `rig_foot_${hex(color)}`, 34, 24, (ctx) => {
    ellipsePath(ctx, 17, 12, 14, 9);
    toon(ctx, color, 3, 3, 28, 18, { noShine: true, lineW: 3 });
  });
}

/** 细长的昆虫腿（锚点在左端） */
export function legTex(s: Phaser.Scene, color: number): string {
  return paint(s, `rig_leg_${hex(color)}`, 44, 20, (ctx) => {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(3, 6);
    ctx.lineTo(24, 4);
    ctx.lineTo(40, 16);
    ctx.stroke();
    ctx.strokeStyle = rgb(color);
    ctx.lineWidth = 3.5;
    ctx.stroke();
  });
}

export function wingTex(s: Phaser.Scene, color: number): string {
  return paint(s, `rig_wing_${hex(color)}`, 56, 40, (ctx) => {
    ctx.beginPath();
    ctx.ellipse(28, 20, 25, 15, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = rgb(color, 0.45);
    ctx.fill();
    ctx.strokeStyle = rgb(darken(color, 0.4), 0.9);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(6, 26);
    ctx.lineTo(48, 12);
    ctx.moveTo(18, 30);
    ctx.lineTo(40, 20);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(22, 14, 8, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function tailTex(s: Phaser.Scene, color: number): string {
  return paint(s, `rig_tail_${hex(color)}`, 70, 40, (ctx) => {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(66, 30);
    ctx.bezierCurveTo(44, 36, 30, 6, 6, 12);
    ctx.stroke();
    ctx.strokeStyle = rgb(color);
    ctx.lineWidth = 5;
    ctx.stroke();
  });
}

export function shellTex(s: Phaser.Scene, color: number): string {
  return paint(s, `rig_shell_${hex(color)}`, 110, 110, (ctx) => {
    ellipsePath(ctx, 55, 55, 50, 48);
    toon(ctx, color, 5, 7, 100, 96);
    ctx.strokeStyle = rgb(darken(color, 0.35));
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let t = 0; t < 16; t += 0.1) {
      const r = 42 - t * 2.5;
      const x = 55 + Math.cos(t) * r,
        y = 55 + Math.sin(t) * r;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

export function tentacleTex(s: Phaser.Scene, color: number): string {
  return paint(s, `rig_tent_${hex(color)}`, 26, 60, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.quadraticCurveTo(0, 30, 13, 58);
    ctx.quadraticCurveTo(26, 30, 22, 2);
    ctx.closePath();
    toon(ctx, color, 0, 2, 26, 56, { noShine: true, lineW: 3 });
  });
}

export function wheelTex(s: Phaser.Scene): string {
  return paint(s, 'rig_wheel', 34, 34, (ctx) => {
    ellipsePath(ctx, 17, 17, 14, 14);
    toon(ctx, 0x333333, 3, 3, 28, 28, { noShine: true });
    ctx.fillStyle = '#adb5bd';
    ctx.beginPath();
    ctx.arc(17, 17, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = i * 2.09;
      ctx.beginPath();
      ctx.moveTo(17, 17);
      ctx.lineTo(17 + Math.cos(a) * 12, 17 + Math.sin(a) * 12);
      ctx.stroke();
    }
  });
}

export function starFxTex(s: Phaser.Scene): string {
  return paint(s, 'rig_star', 24, 24, (ctx) => {
    starPath(ctx, 12, 12, 10, 4.5, 5);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.strokeStyle = '#8a5a00';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

export function sweatTex(s: Phaser.Scene): string {
  return paint(s, 'rig_sweat', 20, 28, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.quadraticCurveTo(20, 18, 10, 26);
    ctx.quadraticCurveTo(0, 18, 10, 2);
    ctx.fillStyle = '#9bf6ff';
    ctx.fill();
    ctx.strokeStyle = '#1d6f8a';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

export function outlineColor(c: number): string {
  return outlineOf(c);
}
