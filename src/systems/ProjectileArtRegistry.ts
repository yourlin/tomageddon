// 敌我弹体共用的插画接入：烘焙至小贴图后释放原始大图，碰撞与运动仍由 Bullet 管理。
import type Phaser from 'phaser';
import rows from '../data/projectileArt.generated.json';
import { isForceProcedural } from '../objects/visualFactory';
import { RUNTIME_ART_URLS, runtimeArtBounds } from './RuntimeArt';
import { retainSceneTexture, sceneTextureRetained } from './SceneArtLease';
import { textureTasks } from './Textures';
export interface ProjectileArtEntry {
  id: string;
  key: string;
  file: string;
  bounds: [number, number, number, number];
  size: [number, number];
  color: number;
  spin: number;
}
export const PROJECTILE_ART = rows as ProjectileArtEntry[];
export const isIllustratedProjectile = (key: string, textures: Phaser.Textures.TextureManager): boolean =>
  textures.exists(key) && !!(textures.get(key).customData as { illustratedProjectile?: string }).illustratedProjectile;
export const enemyProjectileEntry = (id: string): ProjectileArtEntry | undefined =>
  PROJECTILE_ART.find((a) => a.key === `proj_enemy_${id}`);
export function queueProjectileArt(scene: Phaser.Scene, ids?: ReadonlySet<string>): void {
  if (isForceProcedural()) return;
  for (const art of PROJECTILE_ART) {
    if (ids && !ids.has(art.id)) continue;
    const url = RUNTIME_ART_URLS[`projectiles/${art.file}`];
    if (!url) continue;
    retainSceneTexture(scene, art.key, (active, key) => {
      if (!isIllustratedProjectile(key, active.textures)) return;
      active.textures.remove(key);
      // 恢复小型程序贴图，保证离开场景或网络失败时仍有安全回退。
      for (const task of textureTasks(active)) if (task.k === key) task.run();
    });
    if (isIllustratedProjectile(art.key, scene.textures)) continue;
    const sourceKey = `projectile-art-source:${art.id}`;
    scene.load.once(`filecomplete-image-${sourceKey}`, () => {
      if (!scene.textures.exists(sourceKey)) return;
      if (!sceneTextureRetained(scene, art.key)) {
        scene.textures.remove(sourceKey);
        return;
      }
      const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
      const [l, t, r, b] = runtimeArtBounds(`projectiles/${art.file}`, art.bounds),
        [w, h] = art.size,
        sw = r - l,
        sh = b - t;
      if (sw <= 0 || sh <= 0) {
        scene.textures.remove(sourceKey);
        return;
      }
      if (scene.textures.exists(art.key)) scene.textures.remove(art.key);
      const texture = scene.textures.createCanvas(art.key, w, h);
      if (!texture) {
        scene.textures.remove(sourceKey);
        return;
      }
      const ctx = texture.getContext();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const scale = Math.min((w - 4) / sw, (h - 4) / sh);
      ctx.drawImage(source, l, t, sw, sh, (w - sw * scale) / 2, (h - sh * scale) / 2, sw * scale, sh * scale);
      texture.refresh();
      texture.customData = { ...texture.customData, illustratedProjectile: art.id };
      scene.textures.remove(sourceKey);
    });
    scene.load.image(sourceKey, url);
  }
}
