// 把 Rig 渲染成静态贴图（用于图鉴/选角格子等大量缩略图），以及创建可动的展示 Rig
import Phaser from 'phaser';
import { Rig } from '../objects/Rig';
import { CHARACTER_MAP } from '../data/characters';
import { ENEMY_MAP } from '../data/enemies';
import { BOSS_MAP } from '../data/bosses';
import type { RigSpec } from '../art/RigSpec';
import { applySkin, type SkinDef } from '../data/skins';

export type PortraitKind = 'char' | 'enemy' | 'boss';

export function lookOf(kind: PortraitKind, id: string): RigSpec {
  return kind === 'char' ? CHARACTER_MAP[id].look : kind === 'enemy' ? ENEMY_MAP[id].look : BOSS_MAP[id].look;
}

/** 静态缩略图（128×128），外部美术 char_xxx/enemy_xxx/boss_xxx 存在时优先使用 */
export function portraitKey(scene: Phaser.Scene, kind: PortraitKind, id: string): string {
  const ext = `${kind}_${id}`;
  if (scene.textures.exists(ext) && !scene.textures.get(ext).key.startsWith('rig')) return ext;
  const key = `portrait_${kind}_${id}`;
  if (scene.textures.exists(key)) return key;
  const rig = new Rig(scene, lookOf(kind, id), `${kind}_${id}`, 44);
  rig.tick(0.001, 0, 1);
  const rt = scene.make.renderTexture({ width: 128, height: 128 }, false);
  rt.draw(rig, 64, 70);
  rt.saveTexture(key);
  rig.destroy();
  rt.destroy();
  return key;
}

/** 可动的展示角色（自动播放待机/偶尔庆祝） */
export function showcaseRig(
  scene: Phaser.Scene,
  kind: PortraitKind,
  id: string,
  x: number,
  y: number,
  radius: number,
  skin?: SkinDef,
): Rig {
  const rig = new Rig(scene, applySkin(lookOf(kind, id), skin), `${kind}_${id}${skin ? `_${skin.id}` : ''}`, radius);
  scene.add.existing(rig);
  rig.setPosition(x, y);
  rig.play('spawn', true);
  let t = 0;
  let next = 3 + Math.random() * 3;
  const upd = (_: number, dms: number) => {
    if (!rig.active) return;
    const dt = dms / 1000;
    t += dt;
    if (t > next) {
      t = 0;
      next = 3 + Math.random() * 4;
      rig.play(Math.random() < 0.5 ? 'victory' : 'attack', true);
      scene.time.delayedCall(900, () => rig.active && rig.play('idle', true));
    }
    const p = scene.input.activePointer;
    rig.tick(dt, 0, 1, Phaser.Math.Clamp((p.x - x) / 300, -1, 1), Phaser.Math.Clamp((p.y - y) / 300, -1, 1));
  };
  scene.events.on('update', upd);
  rig.once('destroy', () => scene.events.off('update', upd));
  return rig;
}
