// Default jackfruit animation pilot; external originals, compiled runtime tiers only.
import type { EntityArtEntry } from './artManifest';
import { currentGraphicsProfile } from '../systems/GraphicsQuality';
const profile = currentGraphicsProfile();
const frameSize = profile.frameSize;
export const JACKFRUIT_MOTION_ART: EntityArtEntry = {
  kind: 'char',
  id: 'jackfruit',
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
  // Closed-eye frame 2 appears once at 10fps in the four-second idle cycle.
  anims: {
    idle: {
      frames: [0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 2, 3, 0],
      fps: 10,
    },
    move: { frames: [4, 5, 6, 7] },
    hurt: { frames: [8, 9, 10, 11] },
    die: { frames: [12, 13, 14, 15] },
    cast: { frames: [16, 17, 18, 19] },
  },
  credit:
    'Built-in image_gen; 20 authored frames; core actions + actual skill cast; weapon-driven ordinary attack; ART_JACKFRUIT_ANIMATION_PILOT.json. Visual calibration pending.',
};
