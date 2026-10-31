// 头像缩略图（图鉴 / 选角格子等大量静态图）与可动的展示外观。
// 与战斗外观共用一套解析规则（见 ArtResolve.chooseArt）：清单头像 → 旧版 char_xxx / enemy_xxx / boss_xxx 外部图 →
// 用战斗外观（外部素材或 Rig）烘焙。缓存键带上外观来源，素材加载完成后自动换成新头像（旧的回退缓存不再命中）。
import Phaser from 'phaser';
import { CHARACTER_MAP } from '../data/characters';
import { ENEMY_MAP } from '../data/enemies';
import { BOSS_MAP } from '../data/bosses';
import type { RigSpec } from '../art/RigSpec';
import type { SkinDef } from '../data/skins';
import type { EntityVisual, VisualIdent, VisualKind } from '../objects/EntityVisual';
import { createEntityVisual, isForceProcedural } from '../objects/visualFactory';
import { loadArt, readyArt, readyPortrait, artStatus, releaseArt, unloadUnusedArt } from '../systems/ArtRegistry';
import { chooseArt, entryTexKey } from '../systems/ArtResolve';

export type PortraitKind = VisualKind;

export function lookOf(kind: PortraitKind, id: string): RigSpec {
  return kind === 'char' ? CHARACTER_MAP[id].look : kind === 'enemy' ? ENEMY_MAP[id].look : BOSS_MAP[id].look;
}

const identOf = (kind: PortraitKind, id: string, skinId?: string): VisualIdent => ({ kind, id, ...(skinId ? { skinId } : {}) });

/** 静态缩略图（128×128 或清单头像原图），skinId 可选（局内显示当前皮肤） */
export function portraitKey(scene: Phaser.Scene, kind: PortraitKind, id: string, skinId?: string): string {
  const v = identOf(kind, id, skinId);
  if (!isForceProcedural()) {
    const pa = readyPortrait(scene, v);
    if (pa && pa.tint === undefined) return pa.key;
    if (pa) {
      const key = `portrait_${pa.key}_${pa.tint!.toString(16)}`;
      if (scene.textures.exists(key)) return key;
      const src = scene.textures.get(pa.key).getSourceImage();
      const img = scene.make.image({ key: pa.key }, false).setOrigin(0).setTint(pa.tint!);
      const rt = scene.make.renderTexture({ width: src.width, height: src.height }, false);
      rt.draw(img, 0, 0);
      rt.saveTexture(key);
      img.destroy();
      rt.destroy();
      return key;
    }
    const ext = `${kind}_${id}`;
    if (!skinId && scene.textures.exists(ext) && !scene.textures.get(ext).key.startsWith('rig')) return ext;
  }
  const art = isForceProcedural() ? null : readyArt(scene, v);
  const key = `portrait_${kind}_${id}${skinId ? `_${skinId}` : ''}${art ? `@${art.texKey}` : ''}`;
  if (scene.textures.exists(key)) return key;
  const vis = createEntityVisual(scene, v, 44);
  vis.tick(0.001, 0, 1);
  const rt = scene.make.renderTexture({ width: 128, height: 128 }, false);
  rt.draw(vis, 64, 70);
  rt.saveTexture(key);
  vis.destroy();
  rt.destroy();
  return key;
}

/** 有清单头像但还没加载（或加载失败可重试）时返回 true */
export function portraitPending(kind: PortraitKind, id: string, skinId?: string): boolean {
  const c = chooseArt(identOf(kind, id, skinId), 'portrait');
  return !!c && artStatus(entryTexKey(c.entry, 'portrait')) !== 'ready';
}

/**
 * 可动的展示外观（自动播放待机 / 偶尔庆祝）。
 * 可爱风下清单里有该外观但还没加载时，先隐藏占位的 Rig（不能露出复古风画面）并按需加载：
 * 传了 onArt 就交给调用方重建（需要重新排版的界面），否则加载完成后原地换成新外观；
 * 加载失败时改为显示可爱风的静态头像。
 */
let showcaseSerial = 0;

export function showcaseRig(
  scene: Phaser.Scene,
  kind: PortraitKind,
  id: string,
  x: number,
  y: number,
  radius: number,
  skin?: SkinDef,
  onArt?: () => void,
): EntityVisual {
  const v = identOf(kind, id, skin?.id);
  const owner = `showcase:${scene.scene.key}:${++showcaseSerial}`;
  const collect = () => scene.game.events.once('poststep', () => unloadUnusedArt(scene.textures));
  let vis = createEntityVisual(scene, v, radius);
  scene.add.existing(vis);
  vis.setPosition(x, y);
  const scale0 = vis.scaleX;
  vis.play('spawn', true);
  let t = 0;
  let next = 3 + Math.random() * 3;
  const upd = (_: number, dms: number) => {
    if (!vis.active) return;
    const dt = dms / 1000;
    t += dt;
    if (t > next) {
      t = 0;
      next = 3 + Math.random() * 4;
      vis.play(Math.random() < 0.5 ? 'victory' : 'attack', true);
      const cur = vis;
      scene.time.delayedCall(900, () => cur.active && cur.play('idle', true));
    }
    const p = scene.input.activePointer;
    vis.tick(dt, 0, 1, Phaser.Math.Clamp((p.x - x) / 300, -1, 1), Phaser.Math.Clamp((p.y - y) / 300, -1, 1));
  };
  scene.events.on('update', upd);
  const bind = (o: EntityVisual) =>
    o.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (o !== vis) return; // 同一展示对象异步换图时，新实例继续持有。
      scene.events.off('update', upd);
      releaseArt(owner);
      collect();
    });
  bind(vis);
  if (vis.mode === 'procedural' && !isForceProcedural() && chooseArt(v, 'body')) {
    vis.setVisible(false);
    void loadArt(scene, { bodies: [v] }, owner).then(() => {
      if (!vis.active || !vis.scene) {
        collect();
        return;
      }
      if (!readyArt(scene, v)) return void showPortraitInstead(scene, vis, kind, id, skin?.id, radius);
      if (onArt) return onArt();
      const old = vis;
      vis = createEntityVisual(scene, v, radius);
      scene.add.existing(vis);
      // 保留调用方对展示外观做过的额外缩放
      vis
        .setPosition(old.x, old.y)
        .setDepth(old.depth)
        .setScale(vis.scaleX * (old.scaleX / scale0));
      // 保留调用方指定的结算庆祝等动作，异步换图不重新播入场。
      vis.play(old.state, true);
      bind(vis);
      old.parentContainer?.add(vis);
      old.destroy();
    });
  }
  return vis;
}

/** 展示外观加载失败：在同一位置放静态头像（与原对象同层、随它一起销毁），原对象保持隐藏，画风不变 */
function showPortraitInstead(
  scene: Phaser.Scene,
  vis: EntityVisual,
  kind: PortraitKind,
  id: string,
  skinId: string | undefined,
  radius: number,
): void {
  if (!readyPortrait(scene, identOf(kind, id, skinId))) return;
  const img = scene.add
    .image(vis.x, vis.y, portraitKey(scene, kind, id, skinId))
    .setDepth(vis.depth)
    .setAlpha(vis.alpha);
  img.setScale((radius * 2.4 * (vis.scaleX || 1)) / Math.max(img.width, img.height));
  vis.parentContainer?.addAt(img, vis.parentContainer.getIndex(vis));
  vis.once(Phaser.GameObjects.Events.DESTROY, () => img.destroy());
}
