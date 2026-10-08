// 1.4.0 路线图 G1-G4：第六章「腐烂温室」、隐藏第七章「腐烂菜园」与真结局 Boss「腐烂之王」的内容数据。
//
// 【只是数据，尚未接线】本文件不修改任何已有表；接线（合并进 ENEMIES / BOSSES / CHAPTERS、
// 扩展 balance 曲线、ArenaArt / Terrain / Music 分支、i18n 覆盖表）由主会话完成，见文件末尾的接线清单。
//
// 数值约定：
//   · 小怪 / 精英 / Boss 的基础 hp / dmg 与第五章同层级持平，章节放大统一交给 ChapterDef 的
//     hpMult / dmgMult / bossHpMult / speedMult（取 EXTRA_CHAPTER_MULT），不要在基础值里重复放大。
//   · 行为、招式只使用现有 EnemyBehavior / PatternType 与 EnemyDef / BossDef 已有字段。
import type { EnemyDef } from './enemies';
import type { BossDef, Pattern } from './bosses';
import type { ChapterDef } from './chapters';
import type { StatusApply } from './statuses';
import type { RigSpec } from '../art/RigSpec';
import type { BossesEn, ChaptersEn, EnemiesEn } from '../i18n/types';
import { BALANCE, chapterHpMult, chapterDmgMult, chapterBossHpMult } from './balance';

const S = (id: StatusApply['id'], dur: number, stacks = 1, chance?: number): StatusApply => ({ id, dur, stacks, chance });

// ════════════════════════════ 解锁条件 ════════════════════════════

/** 第六章开放条件：任意一章（1-5）在危机 ≥ 5 下通关过 */
export const CH6_DANGER_REQ = 5;
/** 隐藏第七章开放条件：第 1-5 章全部在危机 ≥ 10 下通关过 */
export const CH7_DANGER_ALL = 10;
/** 判定所依据的「原始章节」（第六、七章本身不计入） */
export const BASE_CHAPTER_IDS = [1, 2, 3, 4, 5] as const;

/**
 * 第六章是否开放。bestDanger：章节 id → 该章通关过的最高危机等级（未通关可缺省或给负数）。
 * 纯函数，存档结构由主会话决定，这里只要一个「章 → 最高通关危机」的映射。
 */
export function isCh6Unlocked(bestDanger: Readonly<Record<number, number | undefined>>): boolean {
  return BASE_CHAPTER_IDS.some((id) => (bestDanger[id] ?? -1) >= CH6_DANGER_REQ);
}

/** 隐藏第七章是否开放：第 1-5 章都要在危机 ≥ CH7_DANGER_ALL 下通关 */
export function isCh7Unlocked(bestDanger: Readonly<Record<number, number | undefined>>): boolean {
  return BASE_CHAPTER_IDS.every((id) => (bestDanger[id] ?? -1) >= CH7_DANGER_ALL);
}

// ════════════════════════════ 章节倍率 ════════════════════════════

/** 第六、七章的倍率与其余章节同源：直接取 balance.ts 的 chapterHpMult() 等函数（第 3 章起按 chapterCurve.late 公比递增） */
const round2 = (v: number): number => Math.round(v * 100) / 100;

export interface ChapterMultSet {
  hp: number;
  dmg: number;
  bossHp: number;
  speed: number;
}

const multFor = (ch: number): ChapterMultSet => ({
  hp: chapterHpMult(ch),
  dmg: chapterDmgMult(ch),
  bossHp: chapterBossHpMult(ch),
  speed: round2(1 + BALANCE.chapterCurve.speedStep * (ch - 1)),
});

export const EXTRA_CHAPTER_MULT: Record<6 | 7, ChapterMultSet> = {
  6: multFor(6),
  7: multFor(7),
};

// ════════════════════════════ 小怪 ════════════════════════════

/** 第六章「腐烂温室」8 种新小怪 */
const CH6_ENEMIES: EnemyDef[] = [
  {
    id: 'blight_sprout',
    name: '枯萎嫩芽',
    desc: '刚冒头就烂掉的幼苗，成群扑来。',
    color: 0x8a9a5b,
    radius: 12,
    hp: 5,
    hpGrowth: 0.5,
    dmg: 1,
    dmgGrowth: 0.5,
    speed: 130,
    seeds: 1,
    behavior: 'chase',
    group: 3,
    look: {
      shape: 'bean',
      w: 0.85,
      h: 0.95,
      color: 0x8a9a5b,
      pattern: 'spots',
      patternColor: 0x5c4b2e,
      top: 'sprout',
      topColor: 0x6b705c,
      eyes: 'dot',
      mouth: 'evil',
      limbs: 'none',
    },
  },
  {
    id: 'fungus_gnat',
    name: '菌蚊',
    desc: '从潮湿花盆里飞出的小蚊子，叮咬可能致盲。',
    color: 0x3d405b,
    radius: 13,
    hp: 9,
    hpGrowth: 0.55,
    dmg: 2,
    dmgGrowth: 0.45,
    speed: 145,
    seeds: 1,
    behavior: 'wander',
    group: 2,
    onHit: [S('blind', 1.2, 1, 25)],
    look: {
      shape: 'oval',
      w: 0.85,
      h: 0.75,
      color: 0x3d405b,
      pattern: 'segments',
      patternColor: 0x81b29a,
      eyes: 'compound',
      pupil: 0x81b29a,
      mouth: 'none',
      limbs: 'wings',
      limbColor: 0xb8c0ff,
    },
  },
  {
    id: 'rot_chili',
    name: '腐辣椒',
    desc: '发霉的朝天椒，远远喷出灼烧辣籽。',
    color: 0x9d0208,
    radius: 17,
    hp: 13,
    hpGrowth: 0.65,
    dmg: 2,
    dmgGrowth: 0.6,
    speed: 105,
    seeds: 2,
    behavior: 'shooter',
    shootCd: 3.5,
    projSpeed: 340,
    projMult: 0.4,
    keepDist: 280,
    shots: 3,
    spread: 22,
    projKey: 'proj_flame',
    onHit: [S('burn', 2, 1)],
    look: {
      shape: 'long',
      w: 0.8,
      h: 1.1,
      color: 0x9d0208,
      pattern: 'spots',
      patternColor: 0x3d2c2e,
      top: 'curlStem',
      topColor: 0x4f772d,
      eyes: 'fierce',
      eyeWhite: 0xffd166,
      mouth: 'fangs',
      brows: true,
      limbs: 'feet',
      limbColor: 0x6a040f,
    },
  },
  {
    id: 'slime_cucumber',
    name: '流汗黄瓜',
    desc: '闷在温室里发酵的黄瓜，一路淌下粘液。',
    color: 0x52796f,
    radius: 20,
    hp: 18,
    hpGrowth: 0.7,
    dmg: 2,
    dmgGrowth: 0.6,
    speed: 80,
    seeds: 2,
    behavior: 'trail',
    trailCd: 0.45,
    onHit: [S('sticky', 1.5)],
    look: {
      shape: 'long',
      w: 0.85,
      h: 1.15,
      color: 0x52796f,
      color2: 0x84a98c,
      pattern: 'bumps',
      patternColor: 0x354f52,
      top: 'stem',
      topColor: 0x354f52,
      eyes: 'sleepy',
      mouth: 'evil',
      limbs: 'none',
    },
  },
  {
    id: 'spore_puff',
    name: '孢子马勃',
    desc: '圆滚滚的毒蘑菇球，凑近就炸出毒孢子。',
    color: 0xc9ada7,
    radius: 17,
    hp: 10,
    hpGrowth: 0.6,
    dmg: 4,
    dmgGrowth: 0.85,
    speed: 125,
    seeds: 2,
    behavior: 'bomber',
    fuse: 0.8,
    blastRadius: 100,
    onHit: [S('poison', 3, 3)],
    look: {
      shape: 'round',
      w: 1,
      h: 0.95,
      color: 0xc9ada7,
      pattern: 'dots',
      patternColor: 0x9a8c98,
      eyes: 'glow',
      eyeWhite: 0xb5e48c,
      mouth: 'cute',
      limbs: 'none',
    },
  },
  {
    id: 'vine_lasher',
    name: '腐藤鞭',
    desc: '缠满倒刺的烂藤，蓄力后猛抽过来。',
    color: 0x606c38,
    radius: 21,
    hp: 24,
    hpGrowth: 0.75,
    dmg: 3,
    dmgGrowth: 0.8,
    speed: 75,
    seeds: 3,
    behavior: 'charger',
    chargeSpeed: 600,
    chargeCd: 3.2,
    windup: 0.7,
    knockResist: 0.5,
    onHit: [S('bleed', 3, 2)],
    look: {
      shape: 'segment',
      w: 1.1,
      h: 0.8,
      color: 0x606c38,
      pattern: 'segments',
      patternColor: 0x283618,
      top: 'bigLeaf',
      topColor: 0x283618,
      eyes: 'fierce',
      eyeWhite: 0xdda15e,
      mouth: 'fangs',
      brows: true,
      limbs: 'none',
      acc: [{ id: 'spikes', color: 0x283618 }],
    },
  },
  {
    id: 'moldy_pumpkin',
    name: '霉变南瓜',
    desc: '烂透的南瓜，被打破就滚出一窝枯萎嫩芽。',
    color: 0xbc6c25,
    radius: 27,
    hp: 30,
    hpGrowth: 0.75,
    dmg: 3,
    dmgGrowth: 0.7,
    speed: 65,
    seeds: 3,
    behavior: 'splitter',
    splitInto: 'blight_sprout',
    splitCount: 4,
    knockResist: 0.5,
    look: {
      shape: 'wide',
      w: 1.15,
      h: 0.95,
      color: 0xbc6c25,
      pattern: 'bands',
      patternColor: 0x7f4f24,
      top: 'stem',
      topColor: 0x3a5a40,
      eyes: 'glow',
      eyeWhite: 0xffd166,
      mouth: 'evil',
      limbs: 'none',
      acc: [{ id: 'crack', color: 0x582f0e }],
    },
  },
  {
    id: 'compost_heap',
    name: '堆肥桶',
    desc: '咕嘟冒泡的堆肥桶，不停孵出菌蚊。',
    color: 0x6f4e37,
    radius: 27,
    hp: 34,
    hpGrowth: 0.8,
    dmg: 3,
    dmgGrowth: 0.65,
    speed: 45,
    seeds: 4,
    behavior: 'summoner',
    summon: 'fungus_gnat',
    summonCount: 3,
    summonCd: 5,
    knockResist: 0.7,
    look: {
      shape: 'can',
      w: 1,
      h: 1.1,
      color: 0x6f4e37,
      color2: 0x99582a,
      pattern: 'bands',
      patternColor: 0x432818,
      top: 'tuft',
      topColor: 0x606c38,
      eyes: 'sleepy',
      pupil: 0x70e000,
      mouth: 'tough',
      limbs: 'none',
    },
  },
];

/** 隐藏第七章「腐烂菜园」4 种新小怪 */
const CH7_ENEMIES: EnemyDef[] = [
  {
    id: 'rot_cabbage',
    name: '烂心卷心菜',
    desc: '一层层烂叶裹着的重型菜头，碰到会染上腐烂。',
    color: 0x6a8d73,
    radius: 25,
    hp: 32,
    hpGrowth: 0.8,
    dmg: 3,
    dmgGrowth: 0.75,
    speed: 75,
    seeds: 3,
    behavior: 'chase',
    knockResist: 0.8,
    onHit: [S('rot', 3, 1)],
    look: {
      shape: 'round',
      w: 1.1,
      h: 1,
      color: 0x6a8d73,
      color2: 0xa3b18a,
      pattern: 'layers',
      patternColor: 0x3a5a40,
      top: 'crownLeaves',
      topColor: 0x3a5a40,
      eyes: 'fierce',
      eyeWhite: 0xe9edc9,
      mouth: 'tough',
      brows: true,
      limbs: 'feet',
      limbColor: 0x344e41,
    },
  },
  {
    id: 'zombie_carrot',
    name: '僵尸胡萝卜',
    desc: '从烂泥里拔出来的胡萝卜，蓄力后一头扎来。',
    color: 0xd9822b,
    radius: 20,
    hp: 24,
    hpGrowth: 0.75,
    dmg: 3,
    dmgGrowth: 0.65,
    speed: 80,
    seeds: 3,
    behavior: 'charger',
    chargeSpeed: 640,
    chargeCd: 3,
    windup: 0.65,
    knockResist: 0.6,
    onHit: [S('rot', 3, 1)],
    look: {
      shape: 'triangle',
      w: 0.8,
      h: 1.15,
      color: 0xd9822b,
      pattern: 'cracks',
      patternColor: 0x7f4f24,
      top: 'tuft',
      topColor: 0x4f772d,
      eyes: 'one',
      pupil: 0xd00000,
      mouth: 'fangs',
      limbs: 'none',
      acc: [{ id: 'bandage', color: 0xe9edc9 }],
    },
  },
  {
    id: 'rot_sprinkler',
    name: '腐水洒水器',
    desc: '喷洒腐水的洒水器，给周围的怪物浇水回血。先打它！',
    color: 0x4895ef,
    radius: 21,
    hp: 22,
    hpGrowth: 0.7,
    dmg: 2,
    dmgGrowth: 0.5,
    speed: 70,
    seeds: 3,
    behavior: 'healer',
    keepDist: 320,
    healCd: 3,
    healRadius: 200,
    healAmount: 0.2,
    look: {
      shape: 'bulb',
      w: 0.95,
      h: 1.05,
      color: 0x4895ef,
      color2: 0x6a994e,
      pattern: 'rivets',
      patternColor: 0x3a0ca3,
      eyes: 'visor',
      pupil: 0x70e000,
      mouth: 'none',
      limbs: 'wheels',
      acc: [{ id: 'antenna', color: 0x70e000 }],
    },
  },
  {
    id: 'blight_onion',
    name: '枯萎洋葱',
    desc: '一剥就流泪的烂洋葱，远程喷出呛眼的辛辣汁。',
    color: 0x9b5de5,
    radius: 19,
    hp: 15,
    hpGrowth: 0.65,
    dmg: 2,
    dmgGrowth: 0.6,
    speed: 95,
    seeds: 2,
    behavior: 'shooter',
    shootCd: 2.5,
    projSpeed: 360,
    projMult: 0.7,
    keepDist: 300,
    shots: 2,
    spread: 16,
    projKey: 'proj_enemy',
    onHit: [S('blind', 1.5, 1, 35)],
    look: {
      shape: 'drop',
      w: 1,
      h: 1.05,
      color: 0x9b5de5,
      pattern: 'layers',
      patternColor: 0x6a4c93,
      top: 'sprout',
      topColor: 0x6a994e,
      eyes: 'sleepy',
      pupil: 0x3d2c2e,
      mouth: 'evil',
      limbs: 'float',
    },
  },
];

export const EXTRA_ENEMIES: EnemyDef[] = [...CH6_ENEMIES, ...CH7_ENEMIES];
/** 第六章新增小怪 id（测试与图鉴分组用） */
export const CH6_ENEMY_IDS = CH6_ENEMIES.map((e) => e.id);
/** 第七章新增小怪 id */
export const CH7_ENEMY_IDS = CH7_ENEMIES.map((e) => e.id);

// ════════════════════════════ 精英 / Boss ════════════════════════════

/**
 * 在 BossDef 之上多一个「真结局」标记。BossDef 本身没有这个字段，所以 bosses.ts 现有的
 * bossPool(7) = BOSS_LIST.filter(chapter === 7) 若直接合并进来会把 rot_king 也抽到——
 * 主会话合并时必须过滤 trueFinal（或改用下方 extraBossPool）。
 */
export interface ExtraBossDef extends BossDef {
  /** 真结局 Boss：不进入任何章节的随机 Boss 池，由真结局流程单独生成 */
  trueFinal?: boolean;
}

export const TRUE_FINAL_BOSS_ID = 'rot_king';

const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七'];

/** 精英构造：与 bosses.ts 的 E() 同口径（seeds = 18 + 章 × 4） */
const E = (
  id: string,
  name: string,
  chapter: number,
  desc: string,
  look: RigSpec,
  radius: number,
  hp: number,
  dmg: number,
  speed: number,
  patterns: Pattern[],
  extra: Partial<ExtraBossDef> = {},
): ExtraBossDef => ({
  id,
  name,
  title: '精英',
  desc,
  chapter,
  color: look.color,
  look,
  radius,
  hp,
  dmg,
  speed,
  elite: true,
  seeds: 18 + chapter * 4,
  patterns,
  ...extra,
});

/** Boss 构造：与 bosses.ts 的 B() 同口径（seeds = 60 + 章 × 12）。bosses.ts 的标题只写到「五」，这里自带六、七 */
const B = (
  id: string,
  name: string,
  chapter: number,
  desc: string,
  look: RigSpec,
  radius: number,
  hp: number,
  dmg: number,
  speed: number,
  patterns: Pattern[],
  phase2: BossDef['phase2'],
  extra: Partial<ExtraBossDef> = {},
): ExtraBossDef => ({
  id,
  name,
  title: `第${CN_NUM[chapter]}章 Boss`,
  desc,
  chapter,
  color: look.color,
  look,
  radius,
  hp,
  dmg,
  speed,
  seeds: 60 + chapter * 12,
  patterns,
  phase2,
  ...extra,
});

const CH6_BOSSES: ExtraBossDef[] = [
  E(
    'pumpkin_brute',
    '南瓜蛮汉',
    6,
    '烂成空壳的巨型南瓜，横冲直撞、落地震地。',
    {
      shape: 'wide',
      w: 1.2,
      h: 1,
      color: 0xbc6c25,
      pattern: 'bands',
      patternColor: 0x7f4f24,
      top: 'curlStem',
      topColor: 0x3a5a40,
      eyes: 'glow',
      eyeWhite: 0xffba08,
      mouth: 'fangs',
      brows: true,
      limbs: 'feet',
      limbColor: 0x582f0e,
      acc: [{ id: 'crack', color: 0x582f0e }],
    },
    48,
    580,
    7,
    75,
    [
      { type: 'charge', cd: 4, speed: 680, windup: 0.8 },
      { type: 'slam', cd: 5, count: 3, radius: 115, windup: 1, dmg: 1.5, debuff: [S('stun', 0.6)] },
    ],
    { affixes: ['armored'] },
  ),
  E(
    'spore_matron',
    '孢子女王',
    6,
    '温室角落里的巨型马勃，散播毒雾、催生孢子。',
    {
      shape: 'mushroom',
      w: 1.1,
      h: 1.05,
      color: 0x9a8c98,
      color2: 0xf2e9e4,
      pattern: 'dots',
      patternColor: 0xc9ada7,
      eyes: 'sleepy',
      pupil: 0x70e000,
      mouth: 'evil',
      limbs: 'none',
      acc: [{ id: 'tiara', color: 0xb5e48c }],
      aura: 0x70e000,
    },
    44,
    520,
    6,
    60,
    [
      { type: 'summon', cd: 7, count: 3, enemy: 'spore_puff' },
      { type: 'hazard', cd: 5, count: 4, radius: 95, windup: 0.9, dmg: 0.4, debuff: [S('poison', 3, 3)] },
      { type: 'ring', cd: 4, count: 14, speed: 220, dmg: 0.7 },
    ],
  ),
  B(
    'blight_gardener',
    '枯萎园丁',
    6,
    '把温室变成腐烂苗圃的疯园丁，挥着生锈的修枝剪。',
    {
      shape: 'tall',
      w: 1,
      h: 1.1,
      color: 0x606c38,
      color2: 0xdda15e,
      pattern: 'belly',
      eyes: 'fierce',
      eyeWhite: 0xfefae0,
      pupil: 0xd00000,
      mouth: 'evil',
      brows: true,
      limbs: 'feet',
      limbColor: 0x283618,
      acc: [
        { id: 'leafHat', color: 0x283618 },
        { id: 'apron', color: 0xdda15e, color2: 0x7f4f24 },
      ],
    },
    72,
    4200,
    9,
    80,
    [
      { type: 'aimed', cd: 2.2, count: 5, spread: 45, speed: 340, dmg: 0.8, debuff: [S('bleed', 3, 2)] },
      { type: 'hazard', cd: 5, count: 5, radius: 95, windup: 0.9, dmg: 0.5, debuff: [S('poison', 3, 2), S('sticky', 1.5)] },
      { type: 'summon', cd: 8, count: 5, enemy: 'blight_sprout' },
      { type: 'charge', cd: 5, speed: 720, windup: 0.7 },
    ],
    {
      at: 0.5,
      speedMult: 1.25,
      cdMult: 0.7,
      add: [
        { type: 'spiral', cd: 7, count: 7, waves: 14, speed: 240, dmg: 0.7, debuff: [S('poison', 2, 1)] },
        { type: 'summon', cd: 9, count: 2, enemy: 'vine_lasher' },
      ],
      buff: [S('enrage', 999)],
    },
  ),
];

const CH7_BOSSES: ExtraBossDef[] = [
  E(
    'carrot_knight',
    '胡萝卜亡骑',
    7,
    '披着烂叶披风的僵尸胡萝卜骑士，冲锋后乱刺。',
    {
      shape: 'triangle',
      w: 0.95,
      h: 1.15,
      color: 0xd9822b,
      pattern: 'cracks',
      patternColor: 0x7f4f24,
      top: 'tuft',
      topColor: 0x3a5a40,
      eyes: 'visor',
      pupil: 0xd00000,
      mouth: 'tough',
      limbs: 'feet',
      limbColor: 0x582f0e,
      acc: [
        { id: 'visorHelm', color: 0x6c757d },
        { id: 'cape', color: 0x3a5a40 },
      ],
    },
    46,
    640,
    7,
    95,
    [
      { type: 'charge', cd: 3.5, speed: 760, windup: 0.7 },
      { type: 'scatter', cd: 3, count: 10, speed: 320, dmg: 0.6, debuff: [S('rot', 3, 1)] },
      { type: 'teleport', cd: 6 },
    ],
    { affixes: ['swift'] },
  ),
  E(
    'onion_witch',
    '洋葱巫婆',
    7,
    '一层层剥开全是诅咒的老洋葱，让人泪流满面。',
    {
      shape: 'drop',
      w: 1.05,
      h: 1.1,
      color: 0x9b5de5,
      pattern: 'layers',
      patternColor: 0x6a4c93,
      top: 'sprout',
      topColor: 0x6a994e,
      eyes: 'glow',
      eyeWhite: 0xf15bb5,
      mouth: 'evil',
      limbs: 'float',
      acc: [{ id: 'wizardHat', color: 0x3c096c, color2: 0xf15bb5 }],
      aura: 0x9b5de5,
    },
    42,
    560,
    6,
    70,
    [
      { type: 'ring', cd: 4, count: 16, speed: 230, dmg: 0.7, debuff: [S('blind', 1.5, 1, 40)] },
      { type: 'aimed', cd: 2.4, count: 3, spread: 20, speed: 380, dmg: 0.8, debuff: [S('curse', 3)] },
      { type: 'buff', cd: 10, buff: [S('haste', 4), S('regen', 4)] },
    ],
  ),
  B(
    'rot_mother',
    '腐土之母',
    7,
    '整座菜园腐烂的温床，从烂泥里不断孕育新的腐烂。',
    {
      shape: 'blob',
      w: 1.2,
      h: 1,
      color: 0x5c4b2e,
      color2: 0x7f5539,
      pattern: 'drips',
      patternColor: 0x3d2c2e,
      top: 'crownLeaves',
      topColor: 0x3a5a40,
      eyes: 'three',
      pupil: 0xb5e48c,
      mouth: 'fangs',
      limbs: 'tentacles',
      limbColor: 0x3d2c2e,
      acc: [{ id: 'flower', color: 0x9d0208 }],
      aura: 0x606c38,
    },
    80,
    4600,
    10,
    55,
    [
      { type: 'hazard', cd: 4.5, count: 6, radius: 100, windup: 0.9, dmg: 0.5, slow: 30, debuff: [S('rot', 4, 1)] },
      { type: 'summon', cd: 8, count: 3, enemy: 'rot_cabbage' },
      { type: 'spiral', cd: 6, count: 7, waves: 14, speed: 230, dmg: 0.7 },
      { type: 'slam', cd: 5, count: 4, radius: 110, windup: 1, dmg: 1.5 },
    ],
    {
      at: 0.5,
      speedMult: 1.25,
      cdMult: 0.7,
      add: [
        { type: 'summon', cd: 9, count: 1, enemy: 'rot_sprinkler' },
        { type: 'scatter', cd: 2.5, count: 14, speed: 300, dmg: 0.6, debuff: [S('weaken', 3)] },
      ],
    },
  ),
];

/**
 * 真结局 Boss：腐烂之王。招式数量最多（一阶段 7 招 + 二阶段追加 4 招），使用现有 phase2 机制。
 * chapter 记作 7（数值按第七章倍率生成、seeds 按第七章算），但带 trueFinal 标记，不进任何随机池。
 */
const TRUE_FINAL: ExtraBossDef = B(
  TRUE_FINAL_BOSS_ID,
  '腐烂之王',
  7,
  '所有腐烂的真正源头——腐烂大厨也不过是他的一枚棋子。',
  {
    shape: 'round',
    w: 1.15,
    h: 1.05,
    color: 0x370617,
    color2: 0x6a040f,
    pattern: 'swirl',
    patternColor: 0x3d2c2e,
    top: 'calyx',
    topColor: 0x1b1b1b,
    eyes: 'glow',
    eyeWhite: 0x70e000,
    mouth: 'fangs',
    brows: true,
    limbs: 'tentacles',
    limbColor: 0x1b1b1b,
    acc: [
      { id: 'crown', color: 0x6b705c, color2: 0x70e000 },
      { id: 'cape', color: 0x1b1b1b },
    ],
    aura: 0x70e000,
  },
  88,
  6000,
  11,
  70,
  [
    { type: 'ring', cd: 3.5, count: 20, speed: 230, dmg: 0.7, debuff: [S('rot', 3, 1)] },
    { type: 'aimed', cd: 2.2, count: 7, spread: 60, speed: 360, dmg: 0.8, debuff: [S('curse', 3)] },
    { type: 'charge', cd: 5, speed: 760, windup: 0.7 },
    { type: 'slam', cd: 6, count: 5, radius: 110, windup: 0.9, dmg: 1.5, debuff: [S('stun', 0.6)] },
    { type: 'hazard', cd: 5, count: 6, radius: 95, windup: 0.9, dmg: 0.5, debuff: [S('poison', 3, 3), S('sticky', 1.5)] },
    { type: 'summon', cd: 9, count: 3, enemy: 'zombie_carrot' },
    { type: 'teleport', cd: 7 },
  ],
  {
    at: 0.5,
    speedMult: 1.3,
    cdMult: 0.65,
    add: [
      { type: 'spiral', cd: 7, count: 8, waves: 16, speed: 240, dmg: 0.7, debuff: [S('rot', 2, 1)] },
      { type: 'laser', cd: 5, windup: 1, dmg: 1.6, debuff: [S('burn', 3, 2)] },
      { type: 'scatter', cd: 3, count: 16, speed: 300, dmg: 0.6, debuff: [S('weaken', 3)] },
      { type: 'buff', cd: 12, buff: [S('barrier', 3)] },
    ],
    buff: [S('enrage', 999)],
  },
  { title: '真结局 Boss', trueFinal: true, seeds: 200 },
);

export const EXTRA_BOSSES: ExtraBossDef[] = [...CH6_BOSSES, ...CH7_BOSSES, TRUE_FINAL];

/** 新章节精英池（与 bosses.ts 的 elitePool 同语义） */
export const extraElitePool = (chapter: number): ExtraBossDef[] => EXTRA_BOSSES.filter((b) => b.elite && b.chapter === chapter);
/** 新章节 Boss 池：排除真结局 Boss */
export const extraBossPool = (chapter: number): ExtraBossDef[] =>
  EXTRA_BOSSES.filter((b) => !b.elite && !b.trueFinal && b.chapter === chapter);

// ════════════════════════════ 章节 ════════════════════════════

export const EXTRA_CHAPTERS: ChapterDef[] = [
  {
    id: 6,
    name: '第六章 · 腐烂温室',
    subtitle: 'Rotting Greenhouse',
    desc: '闷热潮湿的玻璃温室里，蔬菜们正在一棵棵烂掉。危机 5 的老手才能推开这扇门。',
    bgColor: 0x1b2a1f,
    floorColor: 0x5a6b45,
    lineColor: 0x3f4d31,
    hpMult: EXTRA_CHAPTER_MULT[6].hp,
    bossHpMult: EXTRA_CHAPTER_MULT[6].bossHp,
    dmgMult: EXTRA_CHAPTER_MULT[6].dmg,
    speedMult: EXTRA_CHAPTER_MULT[6].speed,
    pool: [
      { enemy: 'blight_sprout', from: 1, to: 5, weight: 8 },
      { enemy: 'fly', from: 1, to: 6, weight: 4 },
      { enemy: 'aphid', from: 1, to: 7, weight: 3 },
      { enemy: 'fungus_gnat', from: 2, weight: 4 },
      { enemy: 'slime_cucumber', from: 3, weight: 3 },
      { enemy: 'rot_chili', from: 3, weight: 3 },
      { enemy: 'garden_slug', from: 3, weight: 3 },
      { enemy: 'spore_puff', from: 4, weight: 3 },
      { enemy: 'thorn_weed', from: 4, weight: 3 },
      { enemy: 'vine_lasher', from: 5, weight: 3 },
      { enemy: 'spider', from: 5, weight: 3 },
      { enemy: 'mushroom', from: 5, weight: 2 },
      { enemy: 'beetle', from: 6, weight: 3 },
      { enemy: 'pollen_bloom', from: 6, weight: 2 },
      { enemy: 'rat', from: 6, weight: 3 },
      { enemy: 'moldy_pumpkin', from: 7, weight: 3 },
      { enemy: 'splitter', from: 7, weight: 2 },
      { enemy: 'mantis', from: 8, weight: 3 },
      { enemy: 'rivet_bot', from: 8, weight: 2 },
      { enemy: 'compost_heap', from: 9, weight: 2 },
      { enemy: 'ketchup_slime', from: 10, weight: 2 },
      { enemy: 'press_piston', from: 11, weight: 2 },
    ],
    music: 'bgm_greenhouse',
  },
  {
    id: 7,
    name: '第七章 · 腐烂菜园',
    subtitle: 'Rot Garden',
    desc: '【隐藏章节】一切腐烂真正的起点。打穿它，去见腐烂之王。',
    bgColor: 0x1a120b,
    floorColor: 0x4a3b2a,
    lineColor: 0x33281c,
    hpMult: EXTRA_CHAPTER_MULT[7].hp,
    bossHpMult: EXTRA_CHAPTER_MULT[7].bossHp,
    dmgMult: EXTRA_CHAPTER_MULT[7].dmg,
    speedMult: EXTRA_CHAPTER_MULT[7].speed,
    pool: [
      { enemy: 'blight_sprout', from: 1, to: 5, weight: 8 },
      { enemy: 'fungus_gnat', from: 1, weight: 4 },
      { enemy: 'caterpillar', from: 1, to: 8, weight: 3 },
      { enemy: 'rot_cabbage', from: 2, weight: 4 },
      { enemy: 'zombie_carrot', from: 3, weight: 3 },
      { enemy: 'spore_puff', from: 3, weight: 3 },
      { enemy: 'slime_cucumber', from: 3, weight: 2 },
      { enemy: 'blight_onion', from: 4, weight: 3 },
      { enemy: 'rot_chili', from: 4, weight: 3 },
      { enemy: 'vine_lasher', from: 4, weight: 3 },
      { enemy: 'weevil', from: 5, weight: 3 },
      { enemy: 'mantis', from: 5, weight: 3 },
      { enemy: 'rot_sprinkler', from: 6, weight: 2 },
      { enemy: 'moldy_pumpkin', from: 6, weight: 3 },
      { enemy: 'ladybug_bomb', from: 6, weight: 2 },
      { enemy: 'mushroom', from: 6, weight: 2 },
      { enemy: 'rotten_potato', from: 7, weight: 2 },
      { enemy: 'compost_heap', from: 8, weight: 2 },
      { enemy: 'ketchup_slime', from: 9, weight: 2 },
      { enemy: 'rivet_bot', from: 9, weight: 2 },
      { enemy: 'press_piston', from: 10, weight: 2 },
    ],
    music: 'bgm_rotgarden',
  },
];

/** 第七章是隐藏章节（选关界面在未解锁时不显示，而不是显示为锁定） */
export const HIDDEN_CHAPTER_IDS: readonly number[] = [7];

/**
 * 新章节音乐回退表（曲目 key → 已有曲目）。1.4.0 起 bgm_greenhouse / bgm_rotgarden
 * 已在 Music.ts 中定义，不再需要回退；保留空表以便日后新章节先占位。
 */
export const EXTRA_MUSIC_FALLBACK: Record<string, string> = {};

// ════════════════════════════ 地形 / 竞技场美术 ════════════════════════════

/** 新章节地形说明（与 chapters.ts 的 TERRAIN_INFO 同格式，合并即可） */
export const TERRAIN_INFO_EXTRA: Record<number, string[]> = {
  6: [
    '孢子喷口：地面周期性喷出中毒孢子云',
    '堆肥坑：定期钻出枯萎嫩芽',
    '补光灯：光区内的玩家与怪物都会硬化（护甲提高、受到伤害降低），灯会定期换位',
  ],
  7: ['腐泥沼：会把人和怪物吸入中心，并染上腐烂', '烂果坠落：注意地面的预警圈', '荆棘藤：脚下会钻出荆棘，造成伤害并附加流血与腐蚀'],
};

/**
 * 建议的地形机制（全部复用 Terrain.ts 现有实现，只换贴图 / 状态 / 刷怪 id）：
 *   第六章：'oil' 分支（预警圈 → addHazard）改为 poison 减益 → 孢子喷口；
 *           'sewer' 分支（洞口定期 spawnEnemyNow）刷 'blight_sprout' → 堆肥坑。
 *   第七章：'quicksand' 分支（addQuicksand + 吸附）→ 腐泥沼，伤害时额外附加 rot；
 *           'debris' 分支（坠物预警）→ 烂果坠落。
 * 键名与 TERRAIN_MECHS 同格式，供开发者面板开关。
 */
export const TERRAIN_MECHS_EXTRA: Record<number, [string, string][]> = {
  6: [
    ['spore', '孢子喷口'],
    ['compost', '堆肥坑钻怪'],
    ['lamp', '补光灯'],
  ],
  7: [
    ['quicksand', '腐泥沼'],
    ['qs', '腐泥伤害'],
    ['debris', '烂果坠落'],
    ['bramble', '荆棘藤'],
  ],
};

/** ArenaArt.paintArena 的第六 / 七章调色参数（ArenaArt 目前 1-4 章有 case，其余都走 default 工厂地面） */
export interface ArenaPalette {
  /** 地面主色（底色 / 渐变起点） */
  base: number;
  /** 地面渐变终点 */
  baseDark: number;
  /** 地块 / 杂点随机色 */
  tiles: number[];
  /** 装饰物（杂草、霉斑、烂叶）色 */
  decor: number[];
  /** 污渍（毒液 / 腐水）rgba 字符串的 rgb 部分与基础透明度 */
  stain: { rgb: [number, number, number]; alpha: number };
  /** vignette(ctx, color) 的暗角色 */
  vignette: number;
  /** border(ctx, wall) 的墙体色 */
  wall: number;
}

export const ARENA_PALETTE_EXTRA: Record<6 | 7, ArenaPalette> = {
  // 腐烂温室：发霉的苗床 + 玻璃格框阴影 + 绿色毒斑
  6: {
    base: 0x5a6b45,
    baseDark: 0x3f4d31,
    tiles: [0x52603e, 0x65774d, 0x4a5737, 0x6f7f55],
    decor: [0x606c38, 0x283618, 0x8a9a5b],
    stain: { rgb: [112, 224, 0], alpha: 0.22 },
    vignette: 0x0c140a,
    wall: 0x9fb8ad,
  },
  // 腐烂菜园：黑褐烂泥 + 枯叶 + 紫褐腐水
  7: {
    base: 0x4a3b2a,
    baseDark: 0x2e2419,
    tiles: [0x3f3223, 0x55442f, 0x362a1d, 0x5e4c36],
    decor: [0x6b705c, 0x3a5a40, 0x7f5539],
    stain: { rgb: [90, 40, 110], alpha: 0.3 },
    vignette: 0x0a0604,
    wall: 0x33281c,
  },
};

// ════════════════════════════ 英文 ════════════════════════════

/** 新小怪英文（EnemiesEn 格式，可直接展开进 EN_ENEMIES） */
export const EXTRA_EN_ENEMIES: EnemiesEn = {
  blight_sprout: { name: 'Blight Sprout', desc: 'Seedlings that rot the moment they sprout, rushing in as a swarm.' },
  fungus_gnat: { name: 'Fungus Gnat', desc: 'Tiny gnats from soggy flowerpots; their bite may Blind.' },
  rot_chili: { name: 'Rotten Chili', desc: 'A moldy chili pepper that spits Burning seeds from afar.' },
  slime_cucumber: { name: 'Sweaty Cucumber', desc: 'A fermenting cucumber that leaves a Sticky slime trail.' },
  spore_puff: { name: 'Spore Puffball', desc: 'A round toxic puffball that bursts into Poison spores up close.' },
  vine_lasher: { name: 'Rot Vine', desc: 'A barbed rotten vine that winds up and lashes in to cause Bleed.' },
  moldy_pumpkin: { name: 'Moldy Pumpkin', desc: 'A rotten pumpkin that spills out Blight Sprouts when broken.' },
  compost_heap: { name: 'Compost Bin', desc: 'A bubbling compost bin that keeps hatching Fungus Gnats.' },
  rot_cabbage: { name: 'Rotheart Cabbage', desc: 'A heavy head of rotten leaves whose touch spreads Rot.' },
  zombie_carrot: { name: 'Zombie Carrot', desc: 'A carrot pulled from the muck that winds up and dives at you.' },
  rot_sprinkler: { name: 'Rot Sprinkler', desc: 'Waters nearby monsters with rot-water to heal them. Kill it first!' },
  blight_onion: { name: 'Blight Onion', desc: 'A tear-jerking rotten onion that sprays Blinding juice from range.' },
};

/** 新精英 / Boss 英文（BossesEn 格式，可直接展开进 EN_BOSSES） */
export const EXTRA_EN_BOSSES: BossesEn = {
  pumpkin_brute: { name: 'Pumpkin Brute', title: 'Elite', desc: 'A giant hollow pumpkin that charges and quakes the ground.' },
  spore_matron: { name: 'Spore Matron', title: 'Elite', desc: 'A giant puffball spreading toxic fog and hatching spores.' },
  blight_gardener: {
    name: 'Blight Gardener',
    title: 'Chapter 6 Boss',
    desc: 'A mad gardener who turned the greenhouse into a rot nursery, swinging rusty shears.',
  },
  carrot_knight: {
    name: 'Carrot Revenant',
    title: 'Elite',
    desc: 'A zombie carrot knight in a rotten-leaf cape; charges, then stabs wildly.',
  },
  onion_witch: { name: 'Onion Witch', title: 'Elite', desc: 'An old onion with curses in every layer. Bring tissues.' },
  rot_mother: {
    name: 'Mother of Rot',
    title: 'Chapter 7 Boss',
    desc: 'The seedbed of the garden’s decay, endlessly birthing new rot from the mud.',
  },
  rot_king: {
    name: 'Rot King',
    title: 'True Final Boss',
    desc: 'The true source of all rot. Even the Rotten Chef was only his pawn.',
  },
};

/** 新 id → 英文名（任务要求的扁平表） */
export const EXTRA_EN: Record<string, string> = Object.fromEntries(
  [...Object.entries(EXTRA_EN_ENEMIES), ...Object.entries(EXTRA_EN_BOSSES)].map(([id, v]) => [id, v.name]),
);

/** 新章节英文（ChaptersEn 格式，可直接展开进 EN_CHAPTERS；terrain 与 TERRAIN_INFO_EXTRA 一一对应） */
export const EXTRA_CHAPTER_EN: ChaptersEn = {
  6: {
    name: 'Chapter 6 · Rotting Greenhouse',
    desc: 'In the steamy glass greenhouse, the veggies are rotting one by one. Only Danger 5 veterans may enter.',
    terrain: [
      'Spore Vents: The ground periodically puffs Poison spore clouds',
      'Compost Pits: Blight Sprouts crawl out periodically',
      'Grow Lamps: Players and monsters in the light become Hardened (more Armor, less damage taken); lamps move periodically',
    ],
  },
  7: {
    name: 'Chapter 7 · Rot Garden',
    desc: '[Hidden Chapter] Where all rot truly began. Break through to face the Rot King.',
    terrain: [
      'Rot Mire: Pulls players and monsters toward the center and spreads Rot',
      'Falling Rotten Fruit: Watch for warning circles on the ground',
      'Brambles: Thorns burst from under your feet, dealing damage and inflicting Bleed and Corrode',
    ],
  },
};
