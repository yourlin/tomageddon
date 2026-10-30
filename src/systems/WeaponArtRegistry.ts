// 武器插画按请求烘焙，随后释放输入纹理；显示尺寸与玩法保持一致。
import type Phaser from 'phaser';
import rows from '../data/weaponArt.generated.json';
import { isForceProcedural } from '../objects/visualFactory';
import { RUNTIME_ART_URLS, runtimeArtBounds } from './RuntimeArt';
import { retainSceneTexture, sceneTextureRetained } from './SceneArtLease';
import { textureTasks } from './Textures';

export interface WeaponArtEntry {
  id: string;
  file: string;
  /** alpha 可见范围，像素；仅用于把原始插画排入手持图与图标。 */
  bounds: [number, number, number, number];
  cls: 'melee' | 'ranged' | 'elemental';
}
export const WEAPON_ART = rows as WeaponArtEntry[];

function install(scene: Phaser.Scene, art: WeaponArtEntry, sourceKey: string): void {
  if (!scene.textures.exists(sourceKey)) return;
  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const [left, top, right, bottom] = runtimeArtBounds(`weapons/${art.file}`, art.bounds);
  const sw = right - left,
    sh = bottom - top;
  if (sw <= 0 || sh <= 0) {
    scene.textures.remove(sourceKey);
    return;
  }
  for (const icon of [false, true]) {
    const key = `${icon ? 'icon_weapon' : 'weapon'}_${art.id}`;
    const bindings: { image: Phaser.GameObjects.Image; width: number; height: number }[] = [];
    const visit = (objects: Phaser.GameObjects.GameObject[]) => {
      for (const object of objects) {
        const image = object as Phaser.GameObjects.Image;
        if (image.texture?.key === key && typeof image.setTexture === 'function')
          bindings.push({ image, width: image.displayWidth, height: image.displayHeight });
        const children = (object as Phaser.GameObjects.Container).list;
        if (Array.isArray(children)) visit(children);
      }
    };
    for (const owner of scene.game.scene.scenes) visit(owner.children.list);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const width = 256,
      height = icon ? 256 : 128;
    const texture = scene.textures.createCanvas(key, width, height);
    if (!texture) continue;
    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (icon) {
      const bg = ctx.createRadialGradient(105, 85, 10, 128, 128, 119);
      bg.addColorStop(0, '#57403b');
      bg.addColorStop(1, '#241b27');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(5, 5, 246, 246, 38);
      ctx.fill();
      ctx.strokeStyle = { melee: '#e8b96b', ranged: '#96c4a6', elemental: '#bd9cdb' }[art.cls];
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    const scale = Math.min((width - (icon ? 36 : 12)) / sw, (height - (icon ? 36 : 10)) / sh);
    ctx.drawImage(source, left, top, sw, sh, (width - sw * scale) / 2, (height - sh * scale) / 2, sw * scale, sh * scale);
    texture.refresh();
    texture.customData = { ...texture.customData, illustratedWeapon: art.id };
    for (const { image, width: displayWidth, height: displayHeight } of bindings)
      if (image.scene) image.setTexture(key).setDisplaySize(displayWidth, displayHeight);
  }
  scene.textures.remove(sourceKey);
}

/** Omit ids only for the legacy boot/gallery path; scoped callers retain just their requested weapons. */
export function queueWeaponArt(scene: Phaser.Scene, ids?: ReadonlySet<string>): void {
  if (isForceProcedural()) return;
  const pinKey = 'art.legacyPinnedWeapons';
  let pinned = scene.game.registry.get(pinKey) as Set<string> | undefined;
  if (!pinned) scene.game.registry.set(pinKey, (pinned = new Set()));
  if (WEAPON_ART.length > 16) scene.load.maxParallelDownloads = Math.min(scene.load.maxParallelDownloads, 6);
  for (const art of WEAPON_ART) {
    if (ids && !ids.has(art.id)) continue;
    const url = RUNTIME_ART_URLS[`weapons/${art.file}`];
    if (!url) continue;
    if (!ids) pinned.add(art.id);
    // The global boot path stays pinned until every UI consumer has migrated.
    if (ids) {
      for (const textureKey of [`weapon_${art.id}`, `icon_weapon_${art.id}`]) {
        retainSceneTexture(scene, textureKey, (active, unused) => {
          if (pinned.has(art.id) || !active.textures.exists(unused)) return;
          const data = active.textures.get(unused).customData as { illustratedWeapon?: string };
          if (!data.illustratedWeapon) return;
          active.textures.remove(unused);
          for (const task of textureTasks(active)) if (task.k === unused) task.run();
        });
      }
    }
    const held = `weapon_${art.id}`,
      icon = `icon_weapon_${art.id}`;
    if (
      [held, icon].every(
        (k) =>
          scene.textures.exists(k) && (scene.textures.get(k).customData as { illustratedWeapon?: string }).illustratedWeapon === art.id,
      )
    )
      continue;
    const key = `weapon-art-source:${art.id}`;
    if ([...scene.load.list.getArray(), ...scene.load.inflight.getArray()].some((file) => file.key === key)) continue;
    const event = `filecomplete-image-${key}`;
    const complete = () => {
      scene.load.off('loaderror', failed);
      if (pinned.has(art.id) || sceneTextureRetained(scene, held) || sceneTextureRetained(scene, icon)) install(scene, art, key);
      else if (scene.textures.exists(key)) scene.textures.remove(key);
    };
    const failed = (file: Phaser.Loader.File) => {
      if (file.key !== key) return;
      scene.load.off(event, complete);
      scene.load.off('loaderror', failed);
    };
    scene.load.once(event, complete);
    scene.load.on('loaderror', failed);
    scene.load.image(key, url);
  }
}

/** UI created after preload requests only the weapons it actually displays. */
export function requestWeaponArt(scene: Phaser.Scene, ids: ReadonlySet<string>): void {
  queueWeaponArt(scene, ids);
  if (!scene.load.isLoading()) scene.load.start();
}
