// Default chili sister animation pilot; external originals, compiled runtime tiers only.
import type { EntityArtEntry } from './artManifest';
import { currentGraphicsProfile } from '../systems/GraphicsQuality';
const profile = currentGraphicsProfile();
const frameSize = profile.frameSize;
export const CHILI_MOTION_ART: EntityArtEntry = {
  kind: 'char',
  id: 'chili',
  version: 1,
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
  // Two closed-eye frames at 20fps keep total closed time at 0.1 seconds.
  anims: {
    idle: {
      frames: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 1, 2, 3,
      ],
      fps: 20,
    },
    move: { frames: [4, 5, 6, 7] },
    attack: { frames: [8, 9, 10, 11] },
    hurt: { frames: [12, 13, 14, 15] },
    windup: { frames: [16, 17, 18, 19], fps: 8 },
    charge: { frames: [20, 21, 22, 23], fps: 12, loop: true },
    stun: { frames: [24, 25, 26, 27] },
    die: { frames: [28, 29, 30, 31] },
    spawn: { frames: [32, 33, 34, 35] },
    cast: { frames: [36, 37, 38, 39] },
    victory: { frames: [40, 41, 42, 43], fps: 6 },
  },
  credit: 'Built-in image_gen; 44 authored frames; ART_CHILI_ANIMATION_PILOT.json. Visual calibration pending.',
};
