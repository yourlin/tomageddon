import type Phaser from 'phaser';
import { currentGraphicsProfile } from './GraphicsQuality';
import { RUNTIME_ART_URLS } from './RuntimeArt';
import { retainSceneTexture } from './SceneArtLease';
import { isForceProcedural } from '../objects/visualFactory';

export const juiceArtKey = (): string => `effects:juice-splats:${currentGraphicsProfile().tier}`;

/** One small shared atlas, requested only by combat scenes. */
export function queueJuiceArt(scene: Phaser.Scene): void {
  if (isForceProcedural()) return;
  const { tier, frameSize } = currentGraphicsProfile();
  const key = juiceArtKey();
  const url = RUNTIME_ART_URLS[`effects/juice/splats-${tier}.png`];
  if (!url) return;
  retainSceneTexture(scene, key, (active, unused) => {
    if (active.textures.exists(unused)) active.textures.remove(unused);
  });
  if (!scene.textures.exists(key))
    scene.load.spritesheet(key, url, { frameWidth: frameSize, frameHeight: frameSize, margin: 4, spacing: 8 });
}

export function readyJuiceArt(scene: Phaser.Scene): string | undefined {
  const key = juiceArtKey();
  return !isForceProcedural() && scene.textures.exists(key) ? key : undefined;
}

/** Decorative splashes inside an unchanged circular gameplay footprint. */
export function createSaucePool(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha = 0.55,
): Phaser.GameObjects.Container {
  const pool = scene.add.container(x, y).setDepth(1.4).setAlpha(alpha).setName('sauce-pool');
  pool.setData('radius', radius);
  const art = readyJuiceArt(scene);
  for (let i = 0; i < 3; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = i === 0 ? 0 : radius * 0.24;
    const frame = Math.floor(Math.random() * (art ? 6 : 3));
    const splash = scene.add
      .image(Math.cos(a) * d, Math.sin(a) * d, art ?? `fx_splat${frame}`, art ? frame : undefined)
      .setOrigin(0.5, art ? 0.6 : 0.5)
      .setTint(color)
      .setRotation(Math.random() * Math.PI * 2)
      .setFlip(Math.random() < 0.5, false);
    const diameter = radius * (i === 0 ? 1.45 : 1.1);
    splash.setDisplaySize(diameter, diameter * (0.7 + Math.random() * 0.25));
    pool.add(splash);
  }
  // A light dashed perimeter communicates the exact status/damage radius without a filled disk.
  const edge = scene.add.graphics().lineStyle(1.2, 0xffd6a5, 0.55);
  for (let i = 0; i < 20; i++) {
    edge.beginPath();
    edge.arc(0, 0, radius, (i * Math.PI) / 10, ((i + 0.42) * Math.PI) / 10);
    edge.strokePath();
  }
  pool.add(edge);
  return pool;
}
