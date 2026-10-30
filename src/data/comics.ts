// 章节开场四格漫画（剧本见 2026-10-18 定稿）：主角固定为番茄妹，三位初始伙伴轮流客串。
// 画面优先使用 src/assets/comics 的章节插画；以下 Rig、场地和道具也作为缺图时的回退分镜。
// 坐标都是格子内的相对值（0–1）；半径 r 是相对格子高度的比例。第 1–5 章的 Boss 每局随机抽，漫画只画剪影不点名。
import type { RigState } from '../objects/Rig';
import type { PortraitKind } from '../ui/Portrait';

type T = [string, string];

export interface ComicActor {
  kind: PortraitKind;
  id: string;
  x: number;
  y: number;
  /** 半径（相对格子高度），默认 0.15 */
  r?: number;
  /** 循环播放的动作，默认待机 */
  anim?: RigState;
  /** 朝向：1 朝右、-1 朝左 */
  face?: 1 | -1;
  /** 剪影（还没登场的 Boss） */
  shadow?: boolean;
}

export interface ComicProp {
  /** emoji 或一小段文字（label 用 text） */
  emoji?: string;
  text?: T;
  x: number;
  y: number;
  /** 字号（相对格子高度），默认 0.14；文字默认 0.06 */
  size?: number;
  angle?: number;
  /** 呼吸起伏 / 沿 x 方向滚动 / 上下漂浮 */
  motion?: 'breathe' | 'conveyor' | 'float';
}

export interface ComicPanel {
  /** 背景用哪一章的场地 */
  bg: number;
  /** 背景罩色与不透明度 */
  tint?: number;
  dim?: number;
  props?: ComicProp[];
  actors?: ComicActor[];
  /** 旁白框（左上角） */
  caption?: T;
  /** 对白：说话的演员下标、可选的名字（不写就用角色名） */
  say?: { who: number; text: T; name?: T };
  /** 拟声字 */
  sfx?: { text: T; x: number; y: number; color?: string };
  /** 格子出现时的效果 */
  fx?: 'shake' | 'flash' | 'speed';
}

export interface Comic {
  title: T;
  panels: [ComicPanel, ComicPanel, ComicPanel, ComicPanel];
}

const tomato = (x: number, y: number, o: Partial<ComicActor> = {}): ComicActor => ({ kind: 'char', id: 'tomato', x, y, ...o });
const char = (id: string, x: number, y: number, o: Partial<ComicActor> = {}): ComicActor => ({ kind: 'char', id, x, y, ...o });
const mob = (id: string, x: number, y: number, o: Partial<ComicActor> = {}): ComicActor => ({ kind: 'enemy', id, x, y, r: 0.09, ...o });
const boss = (id: string, x: number, y: number, o: Partial<ComicActor> = {}): ComicActor => ({ kind: 'boss', id, x, y, r: 0.28, ...o });

export const COMICS: Record<number, Comic> = {
  1: {
    title: ['第一章 · 守护者的第一夜', 'Chapter 1 · The Guardian’s First Night'],
    panels: [
      {
        bg: 1,
        tint: 0x0b1030,
        dim: 0.7,
        props: [
          { emoji: '🌙', x: 0.85, y: 0.2, size: 0.18 },
          { emoji: '💤', x: 0.52, y: 0.35, size: 0.12, motion: 'float' },
        ],
        actors: [tomato(0.38, 0.64, { r: 0.17 })],
        caption: ['番茄酱小镇的守护者，今晚也在认真“值班”。', 'Ketchup Town’s guardian is, as always, hard at work on night watch.'],
      },
      {
        bg: 1,
        tint: 0x1e3a12,
        dim: 0.45,
        props: [{ emoji: '🍳', x: 0.5, y: 0.66, size: 0.5 }],
        actors: [mob('maggot', 0.38, 0.5), mob('mold', 0.52, 0.4, { r: 0.1 }), mob('maggot', 0.64, 0.5, { face: -1 })],
        sfx: { text: ['咕嘟……咕嘟……', 'Blub… blub…'], x: 0.74, y: 0.18, color: '#a7e163' },
      },
      {
        bg: 1,
        dim: 0.3,
        props: [{ emoji: '❗', x: 0.5, y: 0.2, size: 0.16 }],
        actors: [tomato(0.5, 0.66, { r: 0.22, anim: 'attack' })],
        say: { who: 0, text: ['谁敢在我的锅里长毛？！', 'Who dares grow mold in MY pan?!'] },
        fx: 'shake',
      },
      {
        bg: 1,
        dim: 0.45,
        actors: [
          tomato(0.22, 0.64, { r: 0.17, anim: 'victory' }),
          boss('mold_king', 0.74, 0.46, { shadow: true, face: -1 }),
          mob('mold', 0.45, 0.78),
          mob('maggot', 0.6, 0.8, { face: -1 }),
          mob('pan_beetle', 0.86, 0.8, { face: -1 }),
        ],
        say: {
          who: 0,
          text: ['番茄酱小镇，我来守护！……先把锅洗了再说！', 'Ketchup Town, I will protect you! …Right after I wash this pan!'],
        },
      },
    ],
  },
  2: {
    title: ['第二章 · 骑士来了', 'Chapter 2 · Enter the Knight'],
    panels: [
      {
        bg: 2,
        dim: 0.25,
        props: [
          { emoji: '🍃', x: 0.75, y: 0.7, size: 0.1, angle: 30 },
          { emoji: '🥬', x: 0.85, y: 0.45, size: 0.12 },
        ],
        actors: [tomato(0.38, 0.62, { r: 0.18, anim: 'move' })],
        say: { who: 0, text: ['我的菜园！谁干的！', 'My garden! Who did this?!'] },
        fx: 'speed',
      },
      {
        bg: 2,
        dim: 0.3,
        actors: [
          tomato(0.3, 0.66, { r: 0.14, anim: 'hurt' }),
          char('carrot', 0.58, 0.6, { r: 0.18, anim: 'attack', face: -1 }),
          mob('aphid', 0.86, 0.66, { face: -1 }),
          mob('aphid', 0.78, 0.34, { face: -1 }),
          mob('mushroom', 0.12, 0.34),
        ],
        say: { who: 1, text: ['小心，番茄小姐！蔬菜骑士团前来支援！', 'Look out, Miss Tomato! The Vegetable Knights are here!'] },
        fx: 'flash',
      },
      {
        bg: 2,
        dim: 0.3,
        props: [
          { emoji: '💢', x: 0.22, y: 0.3, size: 0.12 },
          { emoji: '💧', x: 0.8, y: 0.36, size: 0.08 },
        ],
        actors: [tomato(0.32, 0.64, { r: 0.2 }), char('carrot', 0.72, 0.64, { r: 0.17, face: -1 })],
        say: { who: 0, text: ['说了多少次了——番茄才不是蔬菜！', 'How many times do I have to say it — tomatoes are NOT vegetables!'] },
      },
      {
        bg: 2,
        dim: 0.45,
        props: [
          { emoji: '🕳️', x: 0.8, y: 0.8, size: 0.16 },
          { emoji: '❄️', x: 0.12, y: 0.22, size: 0.12, motion: 'float' },
        ],
        actors: [
          tomato(0.2, 0.66, { r: 0.15, face: -1 }),
          char('carrot', 0.46, 0.66, { r: 0.15 }),
          boss('mole_general', 0.8, 0.5, { shadow: true, face: -1, r: 0.22 }),
        ],
        say: { who: 1, text: ['霉迹往冰箱去了……那边，很冷。', 'The mold trail leads to the fridge… It’s cold over there.'] },
      },
    ],
  },
  3: {
    title: ['第三章 · 火辣的援军', 'Chapter 3 · Hot Reinforcements'],
    panels: [
      {
        bg: 3,
        tint: 0x9ad1ff,
        dim: 0.25,
        props: [
          { emoji: '❄️', x: 0.15, y: 0.25, size: 0.1, motion: 'float' },
          { emoji: '❄️', x: 0.85, y: 0.3, size: 0.08, motion: 'float' },
          { emoji: '🧣', x: 0.5, y: 0.56, size: 0.1 },
        ],
        actors: [tomato(0.5, 0.64, { r: 0.2, anim: 'stun' })],
        say: { who: 0, text: ['好、好、好冷……番茄会、会冻成冰沙的……', 'S-s-so cold… A tomato could t-turn into a slushie…'] },
      },
      {
        bg: 3,
        dim: 0.25,
        actors: [
          tomato(0.28, 0.72, { r: 0.15, anim: 'hurt' }),
          mob('frozen_shrimp', 0.68, 0.55, { face: -1, r: 0.11 }),
          mob('icicle_imp', 0.86, 0.36, { face: -1 }),
          mob('frozen_shrimp', 0.84, 0.76, { face: -1, r: 0.11 }),
        ],
        sfx: { text: ['吱——啪！', 'Skrrt — THUD!'], x: 0.3, y: 0.3, color: '#9ad1ff' },
        fx: 'shake',
      },
      {
        bg: 3,
        dim: 0.2,
        props: [
          { emoji: '🔥', x: 0.42, y: 0.5, size: 0.14, motion: 'float' },
          { emoji: '🔥', x: 0.5, y: 0.66, size: 0.1, motion: 'float' },
        ],
        actors: [tomato(0.22, 0.68, { r: 0.14 }), char('chili', 0.68, 0.6, { r: 0.19, anim: 'attack', face: -1 })],
        say: { who: 1, text: ['哟，小番茄，要不要姐姐给你加加热？', 'Hey there, little tomato. Need big sis to warm you up?'] },
        fx: 'flash',
      },
      {
        bg: 3,
        dim: 0.5,
        props: [
          { emoji: '🛍️', x: 0.58, y: 0.56, size: 0.42, motion: 'breathe' },
          { text: ['送往：城市垃圾场', 'To: City Dump'], x: 0.58, y: 0.86 },
        ],
        actors: [tomato(0.18, 0.68, { r: 0.14 })],
        say: { who: 0, text: ['……这袋垃圾，在呼吸？', '…Is this trash bag breathing?'] },
      },
    ],
  },
  4: {
    title: ['第四章 · 工厂的废料', 'Chapter 4 · Factory Waste'],
    panels: [
      {
        bg: 4,
        dim: 0.25,
        props: [
          { emoji: '🍌', x: 0.5, y: 0.3, size: 0.1, angle: -20 },
          { emoji: '🚛', x: 0.86, y: 0.22, size: 0.16 },
          { emoji: '🗑️', x: 0.18, y: 0.8, size: 0.12 },
        ],
        actors: [tomato(0.5, 0.6, { r: 0.18, anim: 'hurt' })],
        say: { who: 0, text: ['我是守护者，不是垃圾——！', 'I’m a guardian, not GARBAGE—!'] },
        fx: 'shake',
      },
      {
        bg: 4,
        dim: 0.3,
        actors: [
          char('corn', 0.8, 0.46, { r: 0.17, anim: 'attack', face: -1 }),
          mob('rat', 0.16, 0.56, { anim: 'hurt' }),
          mob('rat', 0.32, 0.74),
          mob('can_crab', 0.5, 0.78),
        ],
        sfx: { text: ['砰！', 'BANG!'], x: 0.52, y: 0.3, color: '#ffd166' },
        say: { who: 0, text: ['这片垃圾场，归我管。', 'This dump is my turf.'] },
      },
      {
        bg: 4,
        dim: 0.35,
        props: [
          { emoji: '🛢️', x: 0.42, y: 0.52, size: 0.42 },
          { text: ['番茄酱工厂 · 废料', 'Ketchup Factory · WASTE'], x: 0.42, y: 0.84 },
        ],
        actors: [tomato(0.82, 0.62, { r: 0.16, face: -1 })],
        say: { who: 0, text: ['番茄酱工厂……？那里做的可是我的同胞！', 'The Ketchup Factory…? That’s where they make my kin!'] },
      },
      {
        bg: 4,
        tint: 0x2a0a30,
        dim: 0.5,
        props: [
          { emoji: '🏭', x: 0.78, y: 0.42, size: 0.3 },
          { emoji: '💨', x: 0.86, y: 0.16, size: 0.14, motion: 'float' },
        ],
        actors: [boss('trash_golem', 0.3, 0.52, { shadow: true })],
        caption: ['所有线索，都指向同一个地方。', 'Every clue points to the same place.'],
      },
    ],
  },
  5: {
    title: ['第五章 · 腐烂的配方', 'Chapter 5 · The Rot Recipe'],
    panels: [
      {
        bg: 5,
        dim: 0.3,
        props: [
          { emoji: '🍅', x: 0.1, y: 0.42, size: 0.1, motion: 'conveyor' },
          { emoji: '🍅', x: 0.35, y: 0.42, size: 0.1, motion: 'conveyor' },
          { emoji: '🍅', x: 0.6, y: 0.42, size: 0.1, motion: 'conveyor' },
          { emoji: '🥫', x: 0.88, y: 0.42, size: 0.14 },
          { emoji: '📦', x: 0.2, y: 0.82, size: 0.14 },
        ],
        actors: [tomato(0.34, 0.8, { r: 0.12 })],
        say: { who: 0, text: ['太、太过分了……', 'Th-that’s horrible…'] },
      },
      {
        bg: 5,
        tint: 0x3a0000,
        dim: 0.3,
        props: [{ emoji: '🚨', x: 0.5, y: 0.14, size: 0.12, motion: 'float' }],
        actors: [
          char('carrot', 0.3, 0.66, { r: 0.15, anim: 'attack' }),
          char('chili', 0.48, 0.7, { r: 0.15, anim: 'victory' }),
          char('corn', 0.66, 0.64, { r: 0.15, anim: 'attack' }),
          mob('robot_can', 0.88, 0.52, { face: -1, r: 0.1 }),
          mob('robot_can', 0.1, 0.4, { r: 0.1 }),
        ],
        say: { who: 1, text: ['守护者，我们来了！', 'Guardian, we’re here!'], name: ['三人', 'All three'] },
        fx: 'flash',
      },
      {
        bg: 5,
        dim: 0.45,
        props: [
          { emoji: '🖥️', x: 0.56, y: 0.44, size: 0.5 },
          { text: ['腐烂配方 · 第 7 版：整个小镇', 'ROT RECIPE v7: THE WHOLE TOWN'], x: 0.56, y: 0.84 },
        ],
        actors: [tomato(0.16, 0.7, { r: 0.14 })],
        say: { who: 0, text: ['它们要把整个小镇……都做成酱！', 'They want to turn the whole town… into sauce!'] },
      },
      {
        bg: 5,
        tint: 0x000000,
        dim: 0.55,
        actors: [tomato(0.22, 0.7, { r: 0.16, anim: 'attack' }), boss('rotten_chef', 0.68, 0.44, { shadow: true, face: -1, r: 0.32 })],
        say: {
          who: 1,
          text: ['欢迎参观。你会是最好的原料。', 'Welcome to the tour. You’ll make the finest ingredient.'],
          name: ['？？？', '???'],
        },
      },
    ],
  },
  6: {
    title: ['第六章 · 园丁的孩子们', 'Chapter 6 · The Gardener’s Children'],
    panels: [
      {
        bg: 6,
        dim: 0.3,
        props: [
          { emoji: '🎉', x: 0.12, y: 0.22, size: 0.12 },
          { emoji: '🏮', x: 0.3, y: 0.16, size: 0.1 },
          { emoji: '🌫️', x: 0.8, y: 0.36, size: 0.2, motion: 'float' },
        ],
        actors: [tomato(0.32, 0.66, { r: 0.18 })],
        say: { who: 0, text: ['工厂停了……可为什么，还有腐烂的味道？', 'The factory’s shut down… so why does it still smell like rot?'] },
      },
      {
        bg: 6,
        dim: 0.3,
        props: [{ emoji: '💧', x: 0.82, y: 0.48, size: 0.08, motion: 'float' }],
        actors: [
          tomato(0.24, 0.66, { r: 0.16 }),
          mob('slime_cucumber', 0.72, 0.66, { face: -1, r: 0.11 }),
          mob('fungus_gnat', 0.6, 0.28, { face: -1 }),
          mob('fungus_gnat', 0.84, 0.22, { face: -1 }),
        ],
        say: { who: 0, text: ['好闷……这里的菜，正在一棵棵烂掉。', 'So muggy… The plants in here are rotting, one by one.'] },
      },
      {
        bg: 6,
        dim: 0.25,
        actors: [tomato(0.28, 0.64, { r: 0.16, anim: 'hurt' }), mob('vine_lasher', 0.7, 0.56, { r: 0.18, anim: 'attack', face: -1 })],
        sfx: { text: ['啪！！', 'CRACK!!'], x: 0.5, y: 0.24, color: '#ff6b6b' },
        fx: 'speed',
      },
      {
        bg: 6,
        tint: 0x10200f,
        dim: 0.45,
        props: [{ emoji: '🌫️', x: 0.88, y: 0.2, size: 0.18, motion: 'float' }],
        actors: [tomato(0.2, 0.68, { r: 0.14 }), boss('blight_gardener', 0.64, 0.5, { face: -1, r: 0.3 })],
        say: { who: 1, text: ['别碰它们……这些，都是我的孩子。', 'Don’t touch them… They are all my children.'] },
      },
    ],
  },
  7: {
    title: ['第七章 · 等雨的种子', 'Chapter 7 · The Seed That Waits for Rain'],
    panels: [
      {
        bg: 6,
        dim: 0.45,
        props: [{ emoji: '⚡', x: 0.42, y: 0.86, size: 0.12, angle: 90 }],
        actors: [boss('blight_gardener', 0.42, 0.6, { r: 0.24, anim: 'stun' }), tomato(0.8, 0.62, { r: 0.15, face: -1 })],
        say: { who: 0, text: ['根……在下面……它一直在叫我……', 'The roots… below… It’s been calling me…'] },
      },
      {
        bg: 7,
        tint: 0x000000,
        dim: 0.6,
        props: [
          { emoji: '🌱', x: 0.2, y: 0.3, size: 0.1 },
          { emoji: '🪵', x: 0.78, y: 0.24, size: 0.16, angle: 70 },
        ],
        actors: [tomato(0.5, 0.58, { r: 0.16, anim: 'move' })],
        say: { who: 0, text: ['这次……就让我一个人去吧。', 'This time… let me go alone.'] },
      },
      {
        bg: 7,
        dim: 0.4,
        actors: [
          boss('rot_mother', 0.55, 0.46, { face: -1, r: 0.28 }),
          mob('zombie_carrot', 0.18, 0.74, { r: 0.1 }),
          mob('zombie_carrot', 0.86, 0.78, { r: 0.1, face: -1 }),
        ],
        say: { who: 0, text: ['嘘……别吵醒它。', 'Shh… Don’t wake it.'] },
      },
      {
        bg: 7,
        tint: 0x200000,
        dim: 0.45,
        actors: [boss('rot_king', 0.66, 0.46, { face: -1, r: 0.33, anim: 'spawn' }), tomato(0.2, 0.7, { r: 0.15, anim: 'attack' })],
        say: { who: 1, text: ['番茄酱小镇的守护者，来叫你起床了。', 'Ketchup Town’s guardian is here to wake you up.'] },
        fx: 'flash',
      },
    ],
  },
};
