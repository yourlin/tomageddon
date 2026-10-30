// Three attached scoops float; no walking legs. Originals remain outside Git.
import type { EntityArtEntry } from './artManifest';
import { currentGraphicsProfile } from '../systems/GraphicsQuality';
const profile = currentGraphicsProfile();
const frameSize = profile.frameSize;
export const ICE_CREAM_TYRANT_MOTION_ART: EntityArtEntry = {
  kind: 'boss',
  id: 'ice_cream_tyrant',
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
  // One fully closed drawing lasts 0.1 seconds per four-second idle cycle.
  anims: {
    idle: {
      frames: [0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 2, 3, 0],
      fps: 10,
    },
    move: { frames: [4, 5, 6, 7] },
    hurt: { frames: [8, 9, 10, 11] },
    die: { frames: [12, 13, 14, 15] },
    spawn: { frames: [16, 17, 18, 19] },
    stun: { frames: [20, 21, 22, 23] },
    attack: { frames: [24, 25, 26, 27] },
    cast: { frames: [28, 29, 30, 31] },
  },
  credit: 'Built-in image_gen; 32 authored frames; ART_ICE_CREAM_TYRANT_ANIMATION_PILOT.json. Final visual/performance acceptance pending.',
};
