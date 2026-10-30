import type { EntityArtEntry } from './artManifest';
import { currentGraphicsProfile } from '../systems/GraphicsQuality';
const profile = currentGraphicsProfile();
const frameSize = profile.frameSize;
export const GOPHER_ENEMY_MOTION_ART: EntityArtEntry = {
  kind: 'enemy',
  id: 'gopher',
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
  refRadius: (80 * frameSize) / 256,
  anims: {
    idle: {
      frames: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 2, 3],
      fps: 10,
    },
    hurt: { frames: [4, 5, 6, 7] },
    die: { frames: [8, 9, 10, 11] },
    attack: { frames: [12, 13, 14, 15] },
  },
  credit: 'Built-in image_gen;16 authored frames; ART_ENEMY_GOPHER_ANIMATION_PILOT.json; final visual/performance acceptance pending.',
};
