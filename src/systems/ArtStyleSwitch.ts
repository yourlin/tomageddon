// 运行中切换画风（不重载页面）。
// 复古风：把已装入的插画武器 / 弹体贴图换回程序贴图；头像、地图、角色外观的缓存键带来源，自然切换。
// 可爱风：补加载封面、武器、弹体插画；角色 / 头像 / 地图素材由各场景按需加载。
import Phaser from 'phaser';
import { save, persist } from './Save';
import { setForceProcedural, type ArtStyle } from './ArtStyle';
import { textureTasks } from './Textures';
import { WEAPON_ART, queueWeaponArt } from './WeaponArtRegistry';
import { PROJECTILE_ART, isIllustratedProjectile, queueProjectileArt } from './ProjectileArtRegistry';
import { RUNTIME_ART_URLS } from './RuntimeArt';
import { queueBootArt } from './ArtRegistry';

function restoreProcedural(scene: Phaser.Scene): void {
  const restore = new Set<string>();
  for (const a of WEAPON_ART)
    for (const k of [`weapon_${a.id}`, `icon_weapon_${a.id}`])
      if (scene.textures.exists(k) && (scene.textures.get(k).customData as { illustratedWeapon?: string }).illustratedWeapon) {
        scene.textures.remove(k);
        restore.add(k);
      }
  for (const a of PROJECTILE_ART)
    if (isIllustratedProjectile(a.key, scene.textures)) {
      scene.textures.remove(a.key);
      restore.add(a.key);
    }
  if (restore.size) for (const t of textureTasks(scene)) if (t.k && restore.has(t.k)) t.run();
}

/** 切换并保存画风，完成（含插画补加载）后调用 done */
export function applyArtStyle(scene: Phaser.Scene, style: ArtStyle, done: () => void): void {
  save.settings.artStyle = style;
  persist();
  setForceProcedural(style === 'retro');
  if (style === 'retro') {
    restoreProcedural(scene);
    done();
    return;
  }
  const cover = RUNTIME_ART_URLS['cover/cover_kitchen.png'];
  if (cover && !scene.textures.exists('cover_kitchen')) scene.load.image('cover_kitchen', cover);
  queueBootArt(scene);
  queueWeaponArt(scene);
  queueProjectileArt(scene);
  if (!scene.load.list.size) return done();
  scene.load.once(Phaser.Loader.Events.COMPLETE, done);
  scene.load.start();
}
