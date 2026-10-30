import type { EntityArtEntry } from './artManifest';
import { currentGraphicsProfile } from '../systems/GraphicsQuality';
const profile = currentGraphicsProfile();
export const ONION_JACK_O_LANTERN_SKIN_MOTION_ART: EntityArtEntry = {
  kind: 'char',
  id: 'onion',
  skinId: 'skin_onion_4',
  dir: 'char/onion/skins/skin_onion_4',
  version: 1,
  facing: 1,
  mirror: true,
  source: {
    type: 'spritesheet',
    file: profile.tier === 'high' ? 'motion.png' : `motion-${profile.tier}.png`,
    frameWidth: profile.frameSize,
    frameHeight: profile.frameSize,
    margin: 4,
    spacing: 8,
  },
  baseFrame: 0,
  anchor: { x: 0.5, y: 0.9 },
  refRadius: (80 * profile.frameSize) / 256,
  anims: {
    idle: { frames: [...Array.from({ length: 19 }, () => [0, 1]).flat(), 2, 3], fps: 10 },
    move: { frames: [4, 5, 6, 7], fps: 10 },
    hurt: { frames: [8, 9, 10, 11] },
    die: { frames: [12, 13, 14, 15] },
    cast: { frames: [16, 17, 18, 19] },
  },
  credit:
    'Built-in image_gen;20 authored skin frames;external originals;ART_SKIN_SKIN_ONION_4_ANIMATION_PILOT.json;final visual acceptance pending.',
};
