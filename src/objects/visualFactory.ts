// 统一外观工厂：所有战斗 / 展示 / 分身 / 技能里的实体外观都从这里创建。
// 外观选择：精确素材 → 显式声明可复用的基础素材（调色 / 金色光环）→ 对应皮肤 / 变体的程序化 Rig。
// 素材未加载或加载失败时同样回退 Rig，不影响开局、战斗与旧存档。
import Phaser from 'phaser';
import { Rig } from './Rig';
import { SpriteVisual } from './SpriteVisual';
import { identKey, type EntityVisual, type VisualIdent } from './EntityVisual';
import { readyArt } from '../systems/ArtRegistry';
import { isForceProcedural, setForceProcedural } from '../systems/ArtStyle';
import { CHARACTER_MAP } from '../data/characters';
import { ENEMY_MAP } from '../data/enemies';
import { BOSS_MAP } from '../data/bosses';
import { applySkin, SKIN_MAP } from '../data/skins';
import type { RigSpec } from '../art/RigSpec';

/** 词缀精英配色：金色身体、红色花纹，保留原造型与五官 */
export function championLook(look: RigSpec): RigSpec {
  return {
    ...look,
    color: 0xffc300,
    color2: 0xfff1b8,
    patternColor: 0xc1121f,
    ...(look.limbColor !== undefined ? { limbColor: 0xb5651d } : {}),
    ...(look.topColor !== undefined ? { topColor: 0xe85d04 } : {}),
  };
}

/** 程序化外观（皮肤换色、词缀精英金色） */
export function rigSpecFor(v: VisualIdent): RigSpec {
  const look = v.kind === 'char' ? CHARACTER_MAP[v.id].look : v.kind === 'enemy' ? ENEMY_MAP[v.id].look : BOSS_MAP[v.id].look;
  if (v.kind === 'char') return applySkin(look, v.skinId ? SKIN_MAP[v.skinId] : undefined);
  return v.variant === 'champ' ? championLook(look) : look;
}

export interface VisualOpts {
  /** 强制程序化 Rig（调试对比 / 截图基线） */
  procedural?: boolean;
  /** 即使当前是复古风也用插画（画风选择界面的缩略图） */
  illustrated?: boolean;
}

export { setForceProcedural, isForceProcedural };

/** 创建外观（未加入场景显示列表，调用方 scene.add.existing） */
export function createEntityVisual(scene: Phaser.Scene, v: VisualIdent, radius: number, opts: VisualOpts = {}): EntityVisual {
  const art = opts.procedural || (isForceProcedural() && !opts.illustrated) ? null : readyArt(scene, v, !!opts.illustrated);
  const vis: EntityVisual = art ? new SpriteVisual(scene, art, radius) : new Rig(scene, rigSpecFor(v), identKey(v), radius);
  vis.ident = { ...v };
  return vis;
}

/** 对象池 / 缓存用的键：同一身份的 Rig 与外部素材实例分开存放，避免素材加载完成前后的实例混用 */
export function visualPoolKey(scene: Phaser.Scene, v: VisualIdent): string {
  const art = isForceProcedural() ? null : readyArt(scene, v);
  return `${identKey(v)}|${art ? art.texKey : 'rig'}`;
}
