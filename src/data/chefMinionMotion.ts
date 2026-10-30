import type { EntityArtEntry } from './artManifest';
import { currentGraphicsProfile } from '../systems/GraphicsQuality';
const profile = currentGraphicsProfile();
const frameSize = profile.frameSize;
export const CHEF_MINION_MOTION_ART: EntityArtEntry = {
  kind: 'boss',
  id: 'chef_minion',
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
  refRadius: (61 * frameSize) / 256,
  anims: {
    idle: {
      frames: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 2, 3],
      fps: 10,
    },
    move: { frames: [4, 5, 6, 7] },
    hurt: { frames: [8, 9, 10, 11] },
    die: { frames: [12, 13, 14, 15] },
    attack: { frames: [16, 17, 18, 19] },
    cast: { frames: [20, 21, 22, 23] },
    spawn: { frames: [24, 25, 26, 27] },
  },
  credit: 'Built-in image_gen;28 authored frames; ART_CHEF_MINION_ANIMATION_PILOT.json; final visual/performance acceptance pending.',
};
