// 角色 / 怪物 / Boss 的外观描述（程序化绘制 + 部件动画）
export type BodyShape =
  | 'round'
  | 'oval'
  | 'tall'
  | 'long'
  | 'pear'
  | 'cube'
  | 'drop'
  | 'bean'
  | 'blob'
  | 'star'
  | 'heart'
  | 'bag'
  | 'can'
  | 'mushroom'
  | 'segment'
  | 'bulb'
  | 'wide'
  | 'triangle'
  | 'cloud';
export type Pattern =
  | 'none'
  | 'stripes'
  | 'bands'
  | 'seeds'
  | 'dots'
  | 'rings'
  | 'segments'
  | 'spots'
  | 'bumps'
  | 'layers'
  | 'grid'
  | 'fuzz'
  | 'cracks'
  | 'scales'
  | 'swirl'
  | 'kernels'
  | 'belly'
  | 'rivets'
  | 'frost'
  | 'drips';
export type Top = 'none' | 'calyx' | 'tuft' | 'stem' | 'crownLeaves' | 'sprout' | 'cap' | 'bigLeaf' | 'curlStem' | 'husk' | 'flame';
export type Eyes = 'round' | 'big' | 'sleepy' | 'fierce' | 'dot' | 'visor' | 'one' | 'three' | 'compound' | 'shades' | 'glow';
export type Mouth = 'cute' | 'tough' | 'evil' | 'none' | 'beak' | 'fangs' | 'mandible';
export type Limbs = 'feet' | 'none' | 'legs6' | 'legs8' | 'wings' | 'wingsFeet' | 'tail' | 'snail' | 'float' | 'tentacles' | 'wheels';
export type AccId =
  | 'chefHat'
  | 'helmet'
  | 'pirateHat'
  | 'headband'
  | 'wizardHat'
  | 'crown'
  | 'cowboy'
  | 'goggles'
  | 'headphones'
  | 'bow'
  | 'halo'
  | 'horns'
  | 'mask'
  | 'eyepatch'
  | 'cape'
  | 'scarf'
  | 'glasses'
  | 'mustache'
  | 'tie'
  | 'beret'
  | 'antlers'
  | 'flower'
  | 'tophat'
  | 'cap'
  | 'bandana'
  | 'spikes'
  | 'armor'
  | 'monocle'
  | 'hood'
  | 'bunnyEars'
  | 'catEars'
  | 'bell'
  | 'antenna'
  | 'ratEars'
  | 'crack'
  | 'bandage'
  | 'visorHelm'
  | 'star'
  | 'leafHat'
  | 'apron'
  | 'tiara'
  | 'mohawk';

export interface Acc {
  id: AccId;
  color?: number;
  color2?: number;
}

export interface RigSpec {
  shape: BodyShape;
  w: number; // 宽度系数（1 = 标准圆）
  h: number; // 高度系数
  color: number;
  color2?: number; // 第二色（肚皮、花纹）
  pattern?: Pattern;
  patternColor?: number;
  top?: Top;
  topColor?: number;
  eyes: Eyes;
  pupil?: number;
  eyeWhite?: number;
  eyeScale?: number;
  mouth: Mouth;
  blush?: boolean;
  brows?: boolean; // 常驻眉毛（凶相）
  acc?: Acc[];
  limbs: Limbs;
  limbColor?: number;
  aura?: number; // Boss 光环色
}
