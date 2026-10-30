// 第一关美术试装：静态透明插画，动作由 SpriteVisual 的通用反馈驱动。
// 文件及生成提示词见 docs/design/ART_CH1_GENERATION.json。
import type { EntityArtEntry } from './artManifest';

type SpriteRow = [id: string, anchorX: number, anchorY: number, refRadius: number];
const ENEMIES: SpriteRow[] = [
  ['mold', 0.5064, 0.8533, 479],
  ['fly', 0.498, 0.8748, 498],
  ['rotten_apple', 0.5391, 0.9027, 451],
  ['maggot', 0.4992, 0.8278, 467],
  ['ant', 0.5159, 0.8573, 486],
  ['cockroach', 0.5391, 0.933, 470],
  ['beetle', 0.5179, 0.8764, 463],
  ['splitter', 0.5092, 0.9035, 494],
  ['crumb_mite', 0.4992, 0.8525, 443],
  ['grease_drop', 0.5355, 0.9522, 480],
  ['burnt_toast', 0.5159, 0.9059, 444],
  ['dust_bunny', 0.5, 0.9179, 468],
  ['sour_milk', 0.5439, 0.8939, 419],
  ['pan_beetle', 0.5116, 0.8892, 487],
  ['sponge_slug', 0.5, 0.9322, 456],
  ['stink_egg', 0.5526, 0.9322, 441],
  ['moldy_bread', 0.5255, 0.9171, 459],
  ['teabag_ghost', 0.5586, 0.9402, 474],
  ['rabbit', 0.4825, 0.9872, 512],
  ['gopher', 0.4777, 0.9211, 439],
  ['blight_sprout', 0.51, 0.8987, 414],
];
const BOSSES: SpriteRow[] = [
  ['roach_general', 0.5271, 0.949, 491],
  ['mold_elder', 0.5044, 0.933, 476],
  ['greasy_pan', 0.5443, 0.933, 458],
  ['fork_knight', 0.4825, 0.9514, 488],
  ['fly_swarm_king', 0.5048, 0.9577, 499],
  ['rotten_onion', 0.4996, 0.9466, 484],
  ['mold_king', 0.5036, 0.9466, 516],
  ['grease_chef', 0.506, 0.9211, 517],
  ['cockroach_emperor', 0.4992, 0.9426, 489],
];
const credit = 'Built-in image_gen; reference comics/ch1.png. Prompts: docs/design/ART_CH1_GENERATION.json';

export const CH1_ENTITY_ART: EntityArtEntry[] = [
  ...ENEMIES.map(([id, x, y, refRadius]): EntityArtEntry => ({
    kind: 'enemy',
    id,
    version: 1,
    source: { type: 'static', file: 'body.png' },
    anchor: { x, y },
    refRadius,
    reuse: { champ: 'goldAura' },
    credit,
  })),
  ...BOSSES.map(([id, x, y, refRadius]): EntityArtEntry => ({
    kind: 'boss',
    id,
    version: 1,
    source: { type: 'static', file: 'body.png' },
    anchor: { x, y },
    refRadius,
    credit,
  })),
];
