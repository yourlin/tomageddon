import type { EntityArtEntry } from './artManifest';
import { currentGraphicsProfile } from '../systems/GraphicsQuality';
const profile = currentGraphicsProfile();
const frameSize = profile.frameSize;
export const WORM_ENEMY_MOTION_ART: EntityArtEntry = {
  kind: 'enemy',
  id: 'worm',
  version: 1,
  mirror: true,
  facing: 1,
  source: {
    type: 'spritesheet',
    file: profile.tier === 'high' ? 'motion.png' : `motion-${profile.tier}.png`,
    frameWidth: frameSize,
    frameHeight: frameSize,
    margin: 4,
    spacing: 8,
  },
  baseFrame: 0,
  anchor: { x: 0.5, y: 0.9 },
  refRadius: (62.5 * frameSize) / 256,
  anims: {
    idle: {
      frames: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 2, 3],
      fps: 10,
    },
    move: { frames: [4, 5, 6, 7] },
    hurt: { frames: [8, 9, 10, 11] },
    die: { frames: [12, 13, 14, 15] },
    windup: { frames: [16, 17, 18, 19] },
    charge: { frames: [20, 21, 22, 23] },
  },
  credit: 'Built-in image_gen;24 authored frames; ART_ENEMY_WORM_ANIMATION_PILOT.json; final visual/performance acceptance pending.',
};
