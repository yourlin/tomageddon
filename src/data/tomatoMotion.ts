// 首角色逐帧接入试片；源图与编译中间文件保存在仓库外。
import type { EntityArtEntry } from './artManifest';
import { currentGraphicsProfile } from '../systems/GraphicsQuality';

const profile = currentGraphicsProfile();
const frameSize = profile.frameSize;

export const TOMATO_MOTION_ART: EntityArtEntry = {
  kind: 'char',
  id: 'tomato',
  version: 3,
  facing: 1,
  mirror: true,
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
    // 闭眼只保持100ms；四秒周期中保留呼吸帧，避免每秒反复眨眼。
    idle: {
      frames: [0, 0, 1, 1, 2, 2, 1, 1, 0, 0, 8, 8, 7, 7, 6, 6, 7, 7, 8, 8, 0, 0, 1, 1, 2, 2, 1, 1, 0, 0, 8, 8, 7, 7, 6, 6, 3, 4, 5, 8],
      fps: 10,
    },
    move: { frames: [9, 10, 11, 12], fps: 10 },
    attack: { frames: [13, 14, 15, 16] },
    hurt: { frames: [17, 18, 19, 20] },
    windup: { frames: [21, 22, 23, 24], fps: 8 },
    charge: { frames: [25, 26, 27, 28], fps: 12, loop: true },
    stun: { frames: [29, 30, 31, 32], fps: 6 },
    die: { frames: [33, 34, 35, 36] },
    spawn: { frames: [37, 38, 39, 40] },
    cast: { frames: [41, 42, 43, 44] },
    victory: { frames: [45, 46, 47, 48], fps: 6 },
    // frozen固定进入冻结时的帧，不播放新动作。
  },
  credit:
    'Built-in image_gen, 49 authored frames. External originals; plan: docs/design/ART_TOMATO_ANIMATION_PILOT.json. Pilot visual calibration pending.',
};
