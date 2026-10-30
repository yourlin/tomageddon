// 外观相关的纯类型与常量（不依赖 Phaser：校验脚本、单测可以直接导入）
import type { ArtAnim } from '../data/artManifest';
export type RigState = 'idle' | 'move' | 'attack' | 'hurt' | 'windup' | 'charge' | 'stun' | 'die' | 'spawn' | 'cast' | 'victory' | 'frozen';

export const RIG_STATES: readonly RigState[] = [
  'idle',
  'move',
  'attack',
  'hurt',
  'windup',
  'charge',
  'stun',
  'die',
  'spawn',
  'cast',
  'victory',
  'frozen',
];

/** 一次性动作的时长（秒）：结束后回到 idle / move。外部动画按这个时长适配，不能反过来拖慢玩法 */
export const TIMED: Partial<Record<RigState, number>> = { attack: 0.22, hurt: 0.28, die: 0.3, spawn: 0.35, cast: 0.45 };

export type VisualKind = 'char' | 'enemy' | 'boss';

/** 已加载的阶段形态；脚底锚点和参考半径独立校准，不改变玩法尺寸。 */
export interface VisualForm {
  key: string;
  phase: number;
  anchor: { x: number; y: number };
  refRadius: number;
  /** Authored phase frames; omitted for legacy static forms. */
  animation?: {
    baseFrame: string | number;
    anims: Partial<Record<RigState, ArtAnim>>;
    mirror?: boolean;
    facing?: 1 | -1;
  };
}

/** 外观身份：结构化的实体类型 + id + 皮肤 + 变体，不从字符串拆解 */
export interface VisualIdent {
  kind: VisualKind;
  id: string;
  skinId?: string;
  /** champ = 词缀精英（金色） */
  variant?: 'champ';
}

/** 身份的稳定字符串（对象池 / 缓存键用），格式与旧 Rig 缓存键保持一致 */
export function identKey(v: VisualIdent): string {
  return `${v.kind}_${v.id}${v.skinId ? `_${v.skinId}` : ''}${v.variant ? `_${v.variant}` : ''}`;
}
