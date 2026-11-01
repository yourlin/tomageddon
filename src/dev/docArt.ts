// 文档导图（scripts/export-images.mjs、export-anim.mjs）用：先把要画的高清插画全部加载完，再交给 portraitKey / createEntityVisual 取图。
// 不加载时它们会退回旧版程序化外观（复古风），导出的文档图就和游戏里看到的不一致。
import type Phaser from 'phaser';
import { loadArt } from '../systems/ArtRegistry';
import { queueWeaponArt } from '../systems/WeaponArtRegistry';
import type { VisualIdent } from '../objects/EntityVisual';

export async function loadDocArt(
  scene: Phaser.Scene,
  req: { portraits?: VisualIdent[]; bodies?: VisualIdent[]; weapons?: boolean; maps?: number[] },
): Promise<void> {
  await loadArt(scene, {
    portraits: req.portraits,
    bodies: req.bodies,
    maps: req.maps?.map((ch) => ({ ch, parts: ['ground', 'foreground'] as ('ground' | 'foreground')[] })),
  });
  if (req.weapons) {
    queueWeaponArt(scene);
    await new Promise<void>((resolve) => {
      scene.load.once('complete', () => resolve());
      scene.load.start();
    });
  }
}
