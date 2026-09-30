// 关卡（章节）：每章 15 波，第 5/10 波出现精英，第 15 波 Boss。
export interface SpawnEntry {
  enemy: string;
  from: number; // 从第几波开始出现
  to?: number; // 到第几波为止
  weight: number;
}

export interface ChapterDef {
  id: number;
  name: string;
  subtitle: string;
  desc: string;
  bgColor: number;
  floorColor: number;
  lineColor: number;
  /** 小怪血量倍率（随波次渐进生效） */
  hpMult: number;
  /** 精英 / Boss 血量倍率（它们没有波次成长，单独设定） */
  bossHpMult: number;
  dmgMult: number;
  speedMult: number;
  pool: SpawnEntry[];
  music: string;
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 1,
    name: '第一章 · 深夜厨房',
    subtitle: 'Midnight Kitchen',
    desc: '厨房里长满了霉菌，番茄妹的冒险从这里开始。',
    bgColor: 0x3b2418,
    floorColor: 0x7a5236,
    lineColor: 0x5e3d27,
    hpMult: 1,
    bossHpMult: 1,
    dmgMult: 1,
    speedMult: 1,
    pool: [
      { enemy: 'mold', from: 1, weight: 10 },
      { enemy: 'fly', from: 2, weight: 5 },
      { enemy: 'rotten_apple', from: 3, weight: 4 },
      { enemy: 'maggot', from: 4, weight: 4 },
      { enemy: 'ant', from: 6, weight: 3 },
      { enemy: 'cockroach', from: 7, weight: 3 },
      { enemy: 'beetle', from: 9, weight: 3 },
      { enemy: 'splitter', from: 11, weight: 2 },
    ],
    music: 'bgm_kitchen',
  },
  {
    id: 2,
    name: '第二章 · 荒芜菜园',
    subtitle: 'Wild Garden',
    desc: '菜园被虫群占领，小心那些会治疗的毒蘑菇。',
    bgColor: 0x1f3d1c,
    floorColor: 0x4f7a3a,
    lineColor: 0x3d632c,
    hpMult: 2.9,
    bossHpMult: 1.45,
    dmgMult: 1.3,
    speedMult: 1.05,
    pool: [
      { enemy: 'mold', from: 1, to: 8, weight: 8 },
      { enemy: 'ant', from: 3, weight: 4 },
      { enemy: 'fly', from: 1, weight: 5 },
      { enemy: 'snail', from: 2, weight: 4 },
      { enemy: 'spider', from: 5, weight: 3 },
      { enemy: 'mushroom', from: 5, weight: 2 },
      { enemy: 'splitter', from: 6, weight: 3 },
      { enemy: 'brood', from: 8, weight: 2 },
      { enemy: 'beetle', from: 10, weight: 3 },
      { enemy: 'bee', from: 4, weight: 3 },
      { enemy: 'worm', from: 4, weight: 3 },
    ],
    music: 'bgm_garden',
  },
  {
    id: 3,
    name: '第三章 · 冰封冰箱',
    subtitle: 'Frozen Fridge',
    desc: '寒气弥漫的冰箱内部，冰晶会让你行动迟缓。',
    bgColor: 0x14304a,
    floorColor: 0x7fb3d5,
    lineColor: 0x5d95ba,
    hpMult: 3.2,
    bossHpMult: 1.6,
    dmgMult: 1.35,
    speedMult: 1.1,
    pool: [
      { enemy: 'mold', from: 1, to: 6, weight: 8 },
      { enemy: 'fly', from: 1, weight: 4 },
      { enemy: 'ice_cube', from: 3, weight: 3 },
      { enemy: 'rat', from: 7, weight: 3 },
      { enemy: 'maggot', from: 3, weight: 4 },
      { enemy: 'spider', from: 6, weight: 3 },
      { enemy: 'cockroach', from: 5, weight: 3 },
      { enemy: 'mushroom', from: 7, weight: 2 },
      { enemy: 'splitter', from: 9, weight: 3 },
      { enemy: 'frost_mosquito', from: 4, weight: 3 },
      { enemy: 'frozen_shrimp', from: 6, weight: 3 },
    ],
    music: 'bgm_fridge',
  },
  {
    id: 4,
    name: '第四章 · 城市垃圾场',
    subtitle: 'Junkyard',
    desc: '堆积如山的垃圾中，孕育着最恶心的怪物。',
    bgColor: 0x2b2b2b,
    floorColor: 0x6b6b5a,
    lineColor: 0x565646,
    hpMult: 4.2,
    bossHpMult: 2.1,
    dmgMult: 1.55,
    speedMult: 1.15,
    pool: [
      { enemy: 'mold', from: 1, to: 5, weight: 8 },
      { enemy: 'rat', from: 5, weight: 5 },
      { enemy: 'cockroach', from: 3, weight: 4 },
      { enemy: 'trash_bag', from: 5, weight: 4 },
      { enemy: 'beetle', from: 6, weight: 4 },
      { enemy: 'brood', from: 5, weight: 2 },
      { enemy: 'rotten_apple', from: 2, weight: 3 },
      { enemy: 'snail', from: 6, weight: 3 },
      { enemy: 'mushroom', from: 8, weight: 2 },
      { enemy: 'can_crab', from: 7, weight: 3 },
      { enemy: 'rag_ghost', from: 5, weight: 3 },
      { enemy: 'oil_blob', from: 6, weight: 3 },
    ],
    music: 'bgm_junkyard',
  },
  {
    id: 5,
    name: '第五章 · 番茄酱工厂',
    subtitle: 'Ketchup Factory',
    desc: '一切腐烂的源头。击败腐烂大厨，拯救番茄酱小镇！',
    bgColor: 0x3a0d12,
    floorColor: 0x8a3b3b,
    lineColor: 0x6e2b2b,
    hpMult: 5.2,
    bossHpMult: 2.6,
    dmgMult: 1.8,
    speedMult: 1.2,
    pool: [
      { enemy: 'mold', from: 1, to: 4, weight: 8 },
      { enemy: 'fly', from: 1, to: 6, weight: 4 },
      { enemy: 'robot_can', from: 3, weight: 4 },
      { enemy: 'rat', from: 5, weight: 5 },
      { enemy: 'beetle', from: 6, weight: 4 },
      { enemy: 'spider', from: 5, weight: 3 },
      { enemy: 'trash_bag', from: 5, weight: 3 },
      { enemy: 'ice_cube', from: 4, weight: 3 },
      { enemy: 'mushroom', from: 5, weight: 2 },
      { enemy: 'brood', from: 6, weight: 2 },
      { enemy: 'splitter', from: 7, weight: 3 },
      { enemy: 'gear_bug', from: 4, weight: 3 },
      { enemy: 'curse_doll', from: 5, weight: 3 },
    ],
    music: 'bgm_factory',
  },
];

/** 各章地形机关说明（战斗第 1 波提示，也用于文档生成） */
export const TERRAIN_INFO: Record<number, string[]> = {
  1: ['热油飞溅：地面会溅起灼烧油池', '下水道口：定期钻出小怪', '偶尔会有新鲜番茄从天而降'],
  2: ['兔子洞：兔子四处逃窜，击败掉落番茄籽与果实', '土拨鼠：从地洞探头扔石头'],
  3: ['冰面：在冰上会打滑，但速度更快', '冷风：周期性狂风吹动所有单位并减速'],
  4: ['流沙坑：会把人和怪物吸入中心，并造成伤害', '垃圾坠落：注意地面的预警圈'],
  5: ['传送带：推动站在上面的所有单位', '蒸汽阀门：周期性喷出灼热蒸汽'],
};
