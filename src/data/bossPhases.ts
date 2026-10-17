// 章节 Boss 与真结局 Boss 的阶段设计（设计见 docs/design/BOSS_PHASES.md 第 3 节）。
// 每个阶段是一套完整的招式表；at 是进入该阶段的生命比例；transition 是转阶段爆发时的转场招式。
// arena 里的障碍物坐标与淹没圆心都是「相对 Boss 当前位置」的偏移（转阶段开始时换算成场地坐标）。
// 数值沿用各 Boss 原有招式的量级，阶段只改组合与节奏；伤害由 BALANCE.boss 统一缩放。
import type { BossPhase, CameraStep, Pattern } from './bosses';
import type { StatusApply } from './statuses';

const S = (id: StatusApply['id'], dur: number, stacks = 1, chance?: number): StatusApply => ({ id, dur, stacks, chance });
/** 转场招式统一伤害 ×0.8（可躲、制造压力，不用来秒人） */
const T = (p: Pattern): Pattern => ({ ...p, dmg: (p.dmg ?? 1) * 0.8 });
const ENRAGE = [S('enrage', 999)];

// 常用运镜
const PUSH: CameraStep[] = [
  { kind: 'push', zoom: 1.1, dur: 0.6, hold: 1.2 },
  { kind: 'shake', intensity: 0.012, dur: 0.4 },
];
const PULL: CameraStep[] = [{ kind: 'pull', zoom: 0.85, dur: 0.6, hold: 1.4 }];
const TRACK: CameraStep[] = [
  { kind: 'track', hold: 1.6 },
  { kind: 'shake', intensity: 0.014, dur: 0.4 },
];
const CENTER: CameraStep[] = [
  { kind: 'pan', to: 'center', dur: 0.6, hold: 1.0 },
  { kind: 'pull', zoom: 0.88, dur: 0.5 },
];

export const BOSS_PHASES: Record<string, BossPhase[]> = {
  // ════════ 第 1 章 · 平底锅 ════════
  mold_king: [
    {
      at: 1,
      name: ['潮湿角落', 'Damp Corner'],
      patterns: [
        { type: 'ring', cd: 3.5, count: 14, speed: 200, dmg: 0.8 },
        { type: 'summon', cd: 7, count: 4, enemy: 'mold' },
        { type: 'slam', cd: 6, count: 3, radius: 110, windup: 1.1, dmg: 1.5 },
      ],
    },
    {
      at: 0.7,
      name: ['孢子爆发', 'Spore Burst'],
      tint: 0x9ccc65,
      color: 0x9ccc65,
      camera: PUSH,
      transition: [
        T({ type: 'ring', cd: 1, count: 24, speed: 200, dmg: 0.7 }),
        T({ type: 'hazard', cd: 1, count: 4, radius: 90, windup: 0.9, dmg: 0.5, debuff: [S('poison', 3, 2)] }),
      ],
      patterns: [
        { type: 'spiral', cd: 8, count: 6, waves: 12, speed: 230, dmg: 0.7, debuff: [S('poison', 3, 2)] },
        { type: 'hazard', cd: 6, count: 4, radius: 90, windup: 1, dmg: 0.5, debuff: [S('poison', 3, 2)] },
        { type: 'summon', cd: 8, count: 3, enemy: 'mold' },
      ],
    },
    {
      at: 0.35,
      name: ['菌落吞噬', 'Colony Devour'],
      tint: 0x7cb342,
      scale: 1.15,
      color: 0x76ff03,
      camera: PUSH,
      transition: [
        T({ type: 'summon', cd: 1, count: 6, enemy: 'mold' }),
        T({ type: 'hazard', cd: 1, count: 6, radius: 80, windup: 0.9, dmg: 0.5 }),
      ],
      patterns: [
        { type: 'ring', cd: 3, count: 18, speed: 210, dmg: 0.8 },
        { type: 'spiral', cd: 7, count: 6, waves: 12, speed: 230, dmg: 0.7, debuff: [S('poison', 3, 2)] },
        { type: 'hazard', cd: 4.5, count: 6, radius: 85, windup: 0.9, dmg: 0.5, debuff: [S('poison', 3, 2)] },
        { type: 'slam', cd: 5, count: 3, radius: 110, windup: 1, dmg: 1.5 },
      ],
    },
  ],
  grease_chef: [
    {
      at: 1,
      name: ['开火热锅', 'Heating the Pan'],
      patterns: [
        { type: 'aimed', cd: 2.5, count: 5, spread: 40, speed: 300, dmg: 0.8 },
        { type: 'hazard', cd: 5, count: 4, radius: 90, windup: 1, dmg: 0.5, debuff: [S('burn', 3, 1)] },
      ],
    },
    {
      at: 0.7,
      name: ['爆炒', 'Stir-Fry'],
      color: 0xffa94d,
      tint: 0xffc078,
      camera: PULL,
      transition: [T({ type: 'laser', cd: 1, windup: 1, dmg: 1.4 }), T({ type: 'laser', cd: 1, windup: 1.2, dmg: 1.4 })],
      patterns: [
        { type: 'laser', cd: 5, windup: 1, dmg: 1.4 },
        { type: 'scatter', cd: 3, count: 12, speed: 260, dmg: 0.7, debuff: [S('burn', 2, 1)] },
        { type: 'hazard', cd: 5.5, count: 3, radius: 90, windup: 1, dmg: 0.5, debuff: [S('burn', 3, 1)] },
      ],
    },
    {
      at: 0.35,
      name: ['满屋油烟', 'Kitchen Fog'],
      color: 0x495057,
      tint: 0x868e96,
      buff: ENRAGE,
      camera: CENTER,
      transition: [T({ type: 'hazard', cd: 1, count: 6, radius: 95, windup: 1, dmg: 0.5, debuff: [S('burn', 3, 1)] })],
      patterns: [
        { type: 'laser', cd: 4, windup: 0.9, dmg: 1.4 },
        { type: 'ring', cd: 3, count: 18, speed: 210, dmg: 0.7 },
        { type: 'aimed', cd: 2, count: 7, spread: 50, speed: 320, dmg: 0.8 },
      ],
    },
  ],
  cockroach_emperor: [
    {
      at: 1,
      name: ['巡视领地', 'Patrol'],
      patterns: [
        { type: 'charge', cd: 3.5, speed: 620, windup: 0.8, dmg: 1.2 },
        { type: 'summon', cd: 6, count: 4, enemy: 'cockroach' },
      ],
    },
    {
      at: 0.7,
      name: ['虫潮', 'Roach Tide'],
      color: 0xa0522d,
      camera: PULL,
      transition: [T({ type: 'summon', cd: 1, count: 8, enemy: 'cockroach' })],
      patterns: [
        { type: 'charge', cd: 2.8, speed: 680, windup: 0.7, dmg: 1.2 },
        { type: 'summon', cd: 6, count: 6, enemy: 'cockroach' },
        { type: 'buff', cd: 12, radius: 200, buff: [S('regen', 4)] },
      ],
    },
    {
      at: 0.35,
      name: ['不死之身', 'Undying'],
      color: 0xd4a017,
      tint: 0xd9b26a,
      speedMult: 1.2,
      camera: PUSH,
      transition: [T({ type: 'scatter', cd: 1, count: 18, speed: 260, dmg: 0.7, debuff: [S('armorBreak', 5, 2)] })],
      patterns: [
        { type: 'charge', cd: 2.2, speed: 720, windup: 0.6, dmg: 1.2 },
        { type: 'scatter', cd: 3, count: 12, speed: 260, dmg: 0.7, debuff: [S('armorBreak', 5, 2)] },
        { type: 'buff', cd: 10, radius: 200, buff: [S('regen', 4)] },
      ],
    },
  ],

  // ════════ 第 2 章 · 菜畦 ════════
  locust_queen: [
    {
      at: 1,
      name: ['振翅', 'Wingbeat'],
      patterns: [
        { type: 'aimed', cd: 2.8, count: 5, spread: 40, speed: 300, dmg: 0.8 },
        { type: 'summon', cd: 6, count: 4, enemy: 'fly' },
      ],
    },
    {
      at: 0.7,
      name: ['遮天蔽日', 'Blotting the Sun'],
      color: 0x8bc34a,
      camera: CENTER,
      transition: [
        T({ type: 'ring', cd: 1, count: 18, speed: 220, dmg: 0.8 }),
        T({ type: 'ring', cd: 1, count: 18, speed: 180, dmg: 0.8 }),
      ],
      patterns: [
        { type: 'charge', cd: 4, speed: 640, windup: 0.8, dmg: 1.2 },
        { type: 'summon', cd: 6, count: 6, enemy: 'fly' },
        { type: 'ring', cd: 4, count: 16, speed: 230, dmg: 0.8 },
      ],
    },
    {
      at: 0.35,
      name: ['蝗灾', 'The Plague'],
      color: 0xcddc39,
      tint: 0xd4e157,
      speedMult: 1.2,
      camera: PULL,
      transition: [T({ type: 'summon', cd: 1, count: 10, enemy: 'fly' })],
      patterns: [
        { type: 'charge', cd: 3.2, speed: 680, windup: 0.7, dmg: 1.2 },
        { type: 'ring', cd: 3.5, count: 18, speed: 240, dmg: 0.8 },
        { type: 'aimed', cd: 2.2, count: 5, spread: 40, speed: 320, dmg: 0.8 },
        { type: 'summon', cd: 7, count: 8, enemy: 'fly' },
      ],
    },
  ],
  rotten_pumpkin: [
    {
      at: 1,
      name: ['南瓜灯', 'Jack-o’-Lantern'],
      patterns: [
        { type: 'slam', cd: 4.5, count: 4, radius: 110, windup: 1, dmg: 1.4 },
        { type: 'spiral', cd: 8, count: 5, waves: 12, speed: 220, dmg: 0.7 },
      ],
    },
    {
      at: 0.7,
      name: ['滚动南瓜', 'Rolling Pumpkin'],
      color: 0x9c27b0,
      tint: 0xd1a3ff,
      camera: TRACK,
      transition: [T({ type: 'slam', cd: 1, count: 1, radius: 170, windup: 1.1, dmg: 1.5 })],
      patterns: [
        { type: 'charge', cd: 3.5, speed: 600, windup: 0.9, dmg: 1.3 },
        { type: 'summon', cd: 7, count: 4, enemy: 'worm' },
        { type: 'slam', cd: 5, count: 3, radius: 110, windup: 1, dmg: 1.4 },
      ],
    },
    {
      at: 0.35,
      name: ['南瓜炸裂', 'Pumpkin Burst'],
      color: 0xff6d00,
      scale: 1.1,
      camera: PUSH,
      transition: [T({ type: 'scatter', cd: 1, count: 20, speed: 260, dmg: 0.7 })],
      patterns: [
        { type: 'teleport', cd: 5 },
        { type: 'slam', cd: 4, count: 3, radius: 115, windup: 0.9, dmg: 1.4 },
        { type: 'spiral', cd: 7, count: 8, waves: 12, speed: 230, dmg: 0.7 },
        { type: 'summon', cd: 8, count: 4, enemy: 'worm' },
      ],
    },
  ],
  mole_general: [
    {
      at: 1,
      name: ['掘进', 'Tunneling'],
      patterns: [
        { type: 'teleport', cd: 4 },
        { type: 'scatter', cd: 3, count: 12, speed: 260, dmg: 0.7 },
      ],
    },
    {
      at: 0.7,
      name: ['地道网', 'Tunnel Network'],
      color: 0x8d6e63,
      camera: TRACK,
      transition: [T({ type: 'hazard', cd: 1, count: 5, radius: 85, windup: 1.1, dmg: 0.6, slow: 30 })],
      patterns: [
        { type: 'teleport', cd: 4 },
        { type: 'slam', cd: 3.5, count: 2, radius: 110, windup: 0.9, dmg: 1.4 },
        { type: 'summon', cd: 7, count: 4, enemy: 'worm' },
        { type: 'hazard', cd: 6, count: 3, radius: 85, windup: 1, dmg: 0.6, slow: 30 },
      ],
    },
    {
      at: 0.35,
      name: ['大将出阵', 'The General Rides Out'],
      color: 0xffb300,
      tint: 0xc8a165,
      speedMult: 1.2,
      camera: PUSH,
      transition: [T({ type: 'scatter', cd: 1, count: 16, speed: 280, dmg: 0.7 })],
      patterns: [
        { type: 'teleport', cd: 3 },
        { type: 'slam', cd: 3.5, count: 3, radius: 110, windup: 0.9, dmg: 1.4 },
        { type: 'scatter', cd: 2.8, count: 16, speed: 270, dmg: 0.7 },
      ],
    },
  ],

  // ════════ 第 3 章 · 冰箱冷藏室 ════════
  frost_rat_king: [
    {
      at: 1,
      name: ['寒风', 'Cold Wind'],
      patterns: [
        { type: 'spiral', cd: 7, count: 5, waves: 12, speed: 220, dmg: 0.7, slow: 30 },
        { type: 'charge', cd: 5, speed: 620, windup: 0.8, dmg: 1.3 },
      ],
    },
    {
      at: 0.7,
      name: ['鼠群', 'Rat Swarm'],
      color: 0x90caf9,
      tint: 0xbbdefb,
      camera: PULL,
      transition: [T({ type: 'ring', cd: 1, count: 20, speed: 200, dmg: 0.7, slow: 40 })],
      patterns: [
        { type: 'charge', cd: 4.5, speed: 640, windup: 0.8, dmg: 1.3 },
        { type: 'summon', cd: 7, count: 4, enemy: 'rat' },
        { type: 'hazard', cd: 6, count: 4, radius: 95, windup: 1, dmg: 0.5, slow: 40 },
      ],
    },
    {
      at: 0.35,
      name: ['极寒领域', 'Absolute Zero'],
      color: 0x4fc3f7,
      scale: 1.12,
      camera: CENTER,
      transition: [T({ type: 'ring', cd: 1, count: 28, speed: 170, dmg: 0.7, slow: 40 })],
      patterns: [
        { type: 'spiral', cd: 6, count: 7, waves: 12, speed: 230, dmg: 0.7, slow: 30 },
        { type: 'hazard', cd: 4.5, count: 5, radius: 95, windup: 0.9, dmg: 0.5, slow: 40 },
        { type: 'charge', cd: 3.5, speed: 680, windup: 0.7, dmg: 1.3 },
      ],
    },
  ],
  ice_cream_tyrant: [
    {
      at: 1,
      name: ['三球甜筒', 'Triple Scoop'],
      patterns: [
        { type: 'ring', cd: 3, count: 16, speed: 210, dmg: 0.7 },
        { type: 'summon', cd: 8, count: 4, enemy: 'ice_cube' },
      ],
    },
    {
      at: 0.7,
      name: ['双球', 'Double Scoop'],
      scale: 0.9,
      color: 0xf8bbd0,
      camera: PUSH,
      // 掉下一个冰淇淋球：在 Boss 身边变成 8 秒的障碍物
      arena: [{ kind: 'obstacle', obstacles: [{ kind: 'circle', x: 150, y: 40, r: 70, look: 'scoop', color: 0xf8bbd0 }], dur: 8 }],
      transition: [T({ type: 'ring', cd: 1, count: 20, speed: 200, dmg: 0.7 })],
      patterns: [
        { type: 'laser', cd: 5, windup: 1, dmg: 1.4 },
        { type: 'ring', cd: 3, count: 20, speed: 210, dmg: 0.7 },
        { type: 'summon', cd: 8, count: 4, enemy: 'ice_cube' },
      ],
    },
    {
      at: 0.35,
      name: ['最后一球', 'Last Scoop'],
      scale: 0.8,
      tint: 0xffe0f0,
      color: 0xff80ab,
      speedMult: 1.4,
      camera: PUSH,
      arena: [{ kind: 'obstacle', obstacles: [{ kind: 'circle', x: -150, y: 40, r: 70, look: 'scoop', color: 0xb2dfdb }], dur: 8 }],
      transition: [T({ type: 'ring', cd: 1, count: 20, speed: 200, dmg: 0.7 })],
      patterns: [
        { type: 'laser', cd: 4, windup: 0.9, dmg: 1.4 },
        { type: 'laser', cd: 6, windup: 1.2, dmg: 1.4 },
        { type: 'spiral', cd: 6, count: 6, waves: 14, speed: 230, dmg: 0.6 },
      ],
    },
  ],
  freezer_heart: [
    {
      at: 1,
      name: ['低温运转', 'Running Cold'],
      patterns: [
        { type: 'scatter', cd: 2.5, count: 12, speed: 260, dmg: 0.6, slow: 25 },
        { type: 'hazard', cd: 5, count: 5, radius: 90, windup: 1, dmg: 0.5, slow: 40 },
      ],
    },
    {
      at: 0.7,
      name: ['过载', 'Overload'],
      color: 0x81d4fa,
      tint: 0xb3e5fc,
      buff: [S('barrier', 4)],
      camera: PULL,
      transition: [T({ type: 'hazard', cd: 1, count: 8, radius: 90, windup: 1, dmg: 0.5, slow: 40 })],
      patterns: [
        { type: 'teleport', cd: 5 },
        { type: 'scatter', cd: 2.5, count: 16, speed: 270, dmg: 0.6, slow: 25 },
        { type: 'buff', cd: 12, radius: 120, buff: [S('barrier', 4)] },
      ],
    },
    {
      at: 0.35,
      name: ['临界', 'Critical'],
      color: 0xff5252,
      tint: 0xff8a80,
      camera: CENTER,
      transition: [
        T({ type: 'ring', cd: 1, count: 24, speed: 210, dmg: 0.6 }),
        T({ type: 'scatter', cd: 1, count: 16, speed: 270, dmg: 0.6 }),
      ],
      patterns: [
        { type: 'ring', cd: 3, count: 20, speed: 220, dmg: 0.6 },
        { type: 'hazard', cd: 4.5, count: 8, radius: 85, windup: 0.9, dmg: 0.5, slow: 40 },
        { type: 'teleport', cd: 3.5 },
      ],
    },
  ],

  // ════════ 第 4 章 · 垃圾场 ════════
  trash_golem: [
    {
      at: 1,
      name: ['垃圾山', 'Trash Heap'],
      patterns: [
        { type: 'slam', cd: 4.5, count: 4, radius: 120, windup: 1, dmg: 1.5 },
        { type: 'aimed', cd: 2.5, count: 3, spread: 24, speed: 300, dmg: 0.9 },
      ],
    },
    {
      at: 0.7,
      name: ['崩落', 'Crumbling'],
      scale: 0.92,
      color: 0x8d6e63,
      camera: PUSH,
      transition: [
        T({ type: 'summon', cd: 1, count: 3, enemy: 'trash_bag' }),
        T({ type: 'hazard', cd: 1, count: 6, radius: 70, windup: 1, dmg: 0.6 }),
      ],
      patterns: [
        { type: 'slam', cd: 4.5, count: 3, radius: 120, windup: 1, dmg: 1.5 },
        { type: 'summon', cd: 8, count: 2, enemy: 'trash_bag' },
        { type: 'ring', cd: 3.5, count: 20, speed: 200, dmg: 0.8 },
      ],
    },
    {
      at: 0.35,
      name: ['残骸风暴', 'Wreckage Storm'],
      scale: 0.82,
      speedMult: 1.4,
      tint: 0xa1887f,
      color: 0xffab40,
      camera: PULL,
      transition: [
        T({ type: 'summon', cd: 1, count: 3, enemy: 'trash_bag' }),
        T({ type: 'hazard', cd: 1, count: 6, radius: 70, windup: 1, dmg: 0.6 }),
      ],
      patterns: [
        { type: 'aimed', cd: 2, count: 5, spread: 30, speed: 330, dmg: 0.9 },
        { type: 'ring', cd: 3.5, count: 20, speed: 210, dmg: 0.8 },
        { type: 'slam', cd: 4, count: 3, radius: 115, windup: 0.9, dmg: 1.5 },
        { type: 'summon', cd: 8, count: 3, enemy: 'trash_bag' },
      ],
    },
  ],
  toxic_barrel: [
    {
      at: 1,
      name: ['渗漏', 'Leaking'],
      patterns: [
        { type: 'hazard', cd: 3.5, count: 4, radius: 90, windup: 1, dmg: 0.5, debuff: [S('poison', 3, 2)] },
        { type: 'spiral', cd: 7, count: 6, waves: 12, speed: 220, dmg: 0.7 },
      ],
    },
    {
      at: 0.7,
      name: ['喷涌', 'Gushing'],
      color: 0x76ff03,
      tint: 0xb2ff59,
      camera: PULL,
      transition: [T({ type: 'scatter', cd: 1, count: 20, speed: 260, dmg: 0.6, debuff: [S('poison', 3, 2)] })],
      patterns: [
        { type: 'scatter', cd: 2.5, count: 14, speed: 280, dmg: 0.6, debuff: [S('weaken', 3, 1)] },
        { type: 'hazard', cd: 4, count: 5, radius: 90, windup: 1, dmg: 0.5, debuff: [S('poison', 3, 2)] },
        { type: 'summon', cd: 8, count: 3, enemy: 'oil_blob' },
      ],
    },
    {
      at: 0.35,
      name: ['决堤', 'Breach'],
      color: 0x64dd17,
      scale: 1.08,
      camera: CENTER,
      // 毒液在 Boss 周围 320 范围内决堤，持续 10 秒
      arena: [{ kind: 'flood', area: { circle: [0, 0, 320] }, dur: 10, dps: 3, slow: 20, color: 0x76ff03 }],
      transition: [T({ type: 'hazard', cd: 1, count: 6, radius: 100, windup: 1, dmg: 0.5, debuff: [S('poison', 3, 2)] })],
      patterns: [
        { type: 'spiral', cd: 6, count: 8, waves: 12, speed: 230, dmg: 0.7 },
        { type: 'hazard', cd: 4, count: 5, radius: 90, windup: 0.9, dmg: 0.5, debuff: [S('poison', 3, 2)] },
        { type: 'scatter', cd: 3, count: 14, speed: 280, dmg: 0.6, debuff: [S('weaken', 3, 1)] },
      ],
    },
  ],
  scrap_dragon: [
    {
      at: 1,
      name: ['低空盘旋', 'Low Circling'],
      patterns: [
        { type: 'laser', cd: 4.5, windup: 1, dmg: 1.5 },
        { type: 'spiral', cd: 7, count: 5, waves: 12, speed: 220, dmg: 0.7 },
      ],
    },
    {
      at: 0.7,
      name: ['俯冲', 'Dive'],
      color: 0xff7043,
      camera: TRACK,
      transition: [T({ type: 'laser', cd: 1, windup: 1.1, dmg: 1.5 })],
      patterns: [
        { type: 'charge', cd: 4, speed: 700, windup: 0.8, dmg: 1.4, debuff: [S('burn', 3, 1)] },
        { type: 'laser', cd: 5, windup: 1, dmg: 1.5 },
        { type: 'summon', cd: 8, count: 3, enemy: 'gear_bug' },
      ],
    },
    {
      at: 0.35,
      name: ['熔炉之心', 'Furnace Heart'],
      color: 0xff3d00,
      tint: 0xffab91,
      camera: PUSH,
      transition: [T({ type: 'slam', cd: 1, count: 1, radius: 200, windup: 1, dmg: 1.5, debuff: [S('burn', 3, 2)] })],
      patterns: [
        { type: 'laser', cd: 3.5, windup: 0.9, dmg: 1.5 },
        { type: 'charge', cd: 3.5, speed: 720, windup: 0.7, dmg: 1.4, debuff: [S('burn', 3, 1)] },
        { type: 'spiral', cd: 6, count: 7, waves: 12, speed: 230, dmg: 0.7 },
      ],
    },
  ],

  // ════════ 第 5 章 · 番茄酱工厂 ════════
  rotten_chef: [
    {
      at: 1,
      name: ['备料', 'Prep'],
      patterns: [
        { type: 'aimed', cd: 2.2, count: 7, spread: 50, speed: 320, dmg: 0.8 },
        { type: 'charge', cd: 5, speed: 680, windup: 0.8, dmg: 1.3 },
      ],
    },
    {
      at: 0.7,
      name: ['下锅', 'Into the Pot'],
      color: 0xd84315,
      camera: PUSH,
      transition: [T({ type: 'aimed', cd: 1, count: 4, spread: 360, speed: 280, dmg: 0.8 })],
      patterns: [
        { type: 'slam', cd: 5, count: 5, radius: 115, windup: 1, dmg: 1.5 },
        { type: 'summon', cd: 9, count: 3, enemy: 'robot_can' },
        { type: 'hazard', cd: 6, count: 5, radius: 90, windup: 0.8, dmg: 0.5, slow: 30, debuff: [S('curse', 3, 1)] },
      ],
    },
    {
      at: 0.35,
      name: ['黑暗料理', 'Dark Cuisine'],
      color: 0x6a1b9a,
      tint: 0xce93d8,
      buff: ENRAGE,
      camera: CENTER,
      transition: [
        T({ type: 'hazard', cd: 1, count: 7, radius: 100, windup: 1, dmg: 0.5, debuff: [S('curse', 3, 1)] }),
        T({ type: 'ring', cd: 1, count: 22, speed: 210, dmg: 0.7 }),
      ],
      patterns: [
        { type: 'spiral', cd: 7, count: 8, waves: 14, speed: 240, dmg: 0.7 },
        { type: 'aimed', cd: 2.2, count: 7, spread: 50, speed: 320, dmg: 0.8 },
        { type: 'charge', cd: 4.5, speed: 700, windup: 0.7, dmg: 1.3 },
        { type: 'slam', cd: 5, count: 3, radius: 115, windup: 0.9, dmg: 1.5 },
      ],
    },
  ],
  factory_core: [
    {
      at: 1,
      name: ['协议 1：巡检', 'Protocol 1: Patrol'],
      patterns: [
        { type: 'laser', cd: 3.5, windup: 1, dmg: 1.4 },
        { type: 'summon', cd: 7, count: 3, enemy: 'robot_can' },
      ],
    },
    {
      at: 0.7,
      name: ['协议 2：封锁', 'Protocol 2: Lockdown'],
      color: 0x40c4ff,
      buff: [S('barrier', 4)],
      camera: PULL,
      transition: [T({ type: 'summon', cd: 1, count: 4, enemy: 'robot_can' })],
      patterns: [
        { type: 'teleport', cd: 5 },
        { type: 'laser', cd: 3.5, windup: 1, dmg: 1.4 },
        { type: 'laser', cd: 5, windup: 1.2, dmg: 1.4 },
        { type: 'buff', cd: 12, radius: 120, buff: [S('barrier', 4)] },
      ],
    },
    {
      at: 0.35,
      name: ['协议 3：清除', 'Protocol 3: Purge'],
      color: 0xff1744,
      tint: 0xff8a80,
      camera: PULL,
      transition: [T({ type: 'summon', cd: 1, count: 4, enemy: 'robot_can' }), T({ type: 'ring', cd: 1, count: 24, speed: 220, dmg: 0.7 })],
      patterns: [
        { type: 'ring', cd: 2.5, count: 22, speed: 230, dmg: 0.7, debuff: [S('silence', 2, 1, 30)] },
        { type: 'laser', cd: 3.5, windup: 0.9, dmg: 1.4 },
        { type: 'summon', cd: 8, count: 4, enemy: 'robot_can' },
      ],
    },
  ],
  ketchup_leviathan: [
    {
      at: 1,
      name: ['浮出', 'Surfacing'],
      patterns: [
        { type: 'hazard', cd: 4, count: 6, radius: 95, windup: 1, dmg: 0.5, slow: 30 },
        { type: 'slam', cd: 5, count: 4, radius: 115, windup: 1, dmg: 1.5 },
      ],
    },
    {
      at: 0.7,
      name: ['翻涌', 'Churning'],
      color: 0xe53935,
      camera: TRACK,
      transition: [T({ type: 'teleport', cd: 1 }), T({ type: 'slam', cd: 1, count: 1, radius: 160, windup: 1, dmg: 1.5 })],
      patterns: [
        { type: 'spiral', cd: 6, count: 7, waves: 12, speed: 230, dmg: 0.7 },
        { type: 'summon', cd: 7, count: 4, enemy: 'oil_blob' },
        { type: 'slam', cd: 5, count: 3, radius: 115, windup: 1, dmg: 1.5 },
      ],
    },
    {
      at: 0.35,
      name: ['酱潮', 'Ketchup Tide'],
      color: 0xb71c1c,
      tint: 0xef9a9a,
      scale: 1.08,
      camera: PULL,
      // 酱浪淹没半个场地 4 秒
      arena: [{ kind: 'flood', area: { half: 'left' }, dur: 4, dps: 6, slow: 30, color: 0xc0392b }],
      transition: [T({ type: 'scatter', cd: 1, count: 14, speed: 300, dmg: 0.6 })],
      patterns: [
        { type: 'scatter', cd: 2.5, count: 14, speed: 300, dmg: 0.6 },
        { type: 'hazard', cd: 4, count: 6, radius: 95, windup: 0.9, dmg: 0.5, slow: 30 },
        { type: 'spiral', cd: 6, count: 7, waves: 12, speed: 230, dmg: 0.7 },
      ],
    },
  ],

  // ════════ 第 6 章 · 腐烂温室 ════════
  blight_gardener: [
    {
      at: 1,
      name: ['修枝', 'Pruning'],
      patterns: [
        { type: 'aimed', cd: 2.2, count: 5, spread: 40, speed: 320, dmg: 0.8 },
        { type: 'charge', cd: 5, speed: 680, windup: 0.8, dmg: 1.3 },
      ],
    },
    {
      at: 0.7,
      name: ['播种', 'Sowing'],
      color: 0x8bc34a,
      camera: PUSH,
      transition: [
        T({ type: 'slam', cd: 1, count: 1, radius: 170, windup: 1, dmg: 1.5 }),
        T({ type: 'hazard', cd: 1, count: 6, radius: 85, windup: 1, dmg: 0.5, debuff: [S('poison', 2, 1)] }),
      ],
      patterns: [
        { type: 'hazard', cd: 5, count: 5, radius: 90, windup: 1, dmg: 0.5, debuff: [S('poison', 2, 1)] },
        { type: 'summon', cd: 8, count: 5, enemy: 'blight_sprout' },
        { type: 'spiral', cd: 7, count: 7, waves: 14, speed: 240, dmg: 0.7, debuff: [S('poison', 2, 1)] },
      ],
    },
    {
      // 2026-10-17：0.35 → 0.45，疯长阶段更早到来（第 6 章 Boss 偏弱）
      at: 0.45,
      name: ['疯长', 'Overgrowth'],
      color: 0x33691e,
      tint: 0xaed581,
      buff: ENRAGE,
      camera: PULL,
      // 地面长出 4 根藤蔓（只挡移动），10 秒后枯萎
      arena: [
        {
          kind: 'obstacle',
          obstacles: [
            { kind: 'circle', x: 200, y: 0, r: 46, look: 'vine', color: 0x558b2f },
            { kind: 'circle', x: -200, y: 0, r: 46, look: 'vine', color: 0x558b2f },
            { kind: 'circle', x: 0, y: 200, r: 46, look: 'vine', color: 0x558b2f },
            { kind: 'circle', x: 0, y: -200, r: 46, look: 'vine', color: 0x558b2f },
          ],
          dur: 10,
        },
      ],
      transition: [T({ type: 'summon', cd: 1, count: 2, enemy: 'vine_lasher' })],
      patterns: [
        { type: 'summon', cd: 9, count: 2, enemy: 'vine_lasher' },
        { type: 'charge', cd: 4.5, speed: 700, windup: 0.7, dmg: 1.3 },
        { type: 'spiral', cd: 7, count: 7, waves: 14, speed: 240, dmg: 0.7, debuff: [S('poison', 2, 1)] },
        { type: 'aimed', cd: 2.2, count: 5, spread: 40, speed: 320, dmg: 0.8 },
      ],
    },
  ],

  // ════════ 第 7 章 · 腐烂番茄 ════════
  rot_mother: [
    {
      at: 1,
      name: ['温床', 'Seedbed'],
      patterns: [
        { type: 'hazard', cd: 4.5, count: 6, radius: 100, windup: 0.9, dmg: 0.5, slow: 30, debuff: [S('rot', 4, 1)] },
        { type: 'spiral', cd: 6, count: 7, waves: 12, speed: 230, dmg: 0.7 },
      ],
    },
    {
      at: 0.7,
      name: ['孕育', 'Gestation'],
      color: 0x8d6e63,
      camera: CENTER,
      transition: [
        T({ type: 'hazard', cd: 1, count: 6, radius: 100, windup: 0.9, dmg: 0.5, debuff: [S('rot', 4, 1)] }),
        T({ type: 'ring', cd: 1, count: 20, speed: 200, dmg: 0.7 }),
      ],
      patterns: [
        { type: 'summon', cd: 8, count: 3, enemy: 'rot_cabbage' },
        { type: 'slam', cd: 5, count: 4, radius: 115, windup: 1, dmg: 1.5 },
        { type: 'hazard', cd: 5, count: 5, radius: 100, windup: 0.9, dmg: 0.5, slow: 30, debuff: [S('rot', 4, 1)] },
      ],
    },
    {
      at: 0.35,
      name: ['万物腐朽', 'All Things Rot'],
      color: 0x5d4037,
      tint: 0xbcaaa4,
      scale: 1.1,
      camera: PUSH,
      transition: [T({ type: 'summon', cd: 1, count: 3, enemy: 'rot_sprinkler' })],
      patterns: [
        { type: 'scatter', cd: 2.5, count: 14, speed: 300, dmg: 0.6, debuff: [S('weaken', 3, 1)] },
        { type: 'summon', cd: 9, count: 1, enemy: 'rot_sprinkler' },
        { type: 'spiral', cd: 6, count: 7, waves: 12, speed: 230, dmg: 0.7 },
        { type: 'slam', cd: 5, count: 3, radius: 115, windup: 0.9, dmg: 1.5 },
      ],
    },
  ],
  rot_king: [
    {
      at: 1,
      name: ['王座', 'The Throne'],
      minTime: 5,
      patterns: [
        { type: 'ring', cd: 3.5, count: 20, speed: 220, dmg: 0.8 },
        { type: 'aimed', cd: 2.2, count: 7, spread: 50, speed: 320, dmg: 0.8 },
        { type: 'summon', cd: 9, count: 3, enemy: 'zombie_carrot' },
      ],
    },
    {
      at: 0.75,
      name: ['腐烂之冠', 'Crown of Rot'],
      minTime: 5,
      color: 0x8e24aa,
      camera: PUSH,
      transition: [
        T({ type: 'slam', cd: 1, count: 1, radius: 220, windup: 1, dmg: 1.5 }),
        T({ type: 'ring', cd: 1, count: 24, speed: 210, dmg: 0.8 }),
      ],
      patterns: [
        { type: 'charge', cd: 5, speed: 720, windup: 0.8, dmg: 1.4 },
        { type: 'slam', cd: 6, count: 5, radius: 115, windup: 1, dmg: 1.5 },
        { type: 'hazard', cd: 5, count: 6, radius: 100, windup: 0.9, dmg: 0.5, debuff: [S('rot', 4, 1)] },
        { type: 'teleport', cd: 7 },
      ],
    },
    {
      // 群王之影：召唤前代 Boss 的残影（见 data/bossPhases.ts 的 SHADOWS 与 GameScene.spawnShadows）
      at: 0.5,
      name: ['群王之影', 'Shadows of Kings'],
      minTime: 5,
      color: 0x4a148c,
      tint: 0xb39ddb,
      camera: PULL,
      transition: [T({ type: 'ring', cd: 1, count: 24, speed: 200, dmg: 0.8 })],
      patterns: [
        { type: 'spiral', cd: 7, count: 6, waves: 12, speed: 230, dmg: 0.7, debuff: [S('poison', 3, 2)] },
        { type: 'laser', cd: 5, windup: 1, dmg: 1.5 },
        { type: 'hazard', cd: 5, count: 6, radius: 95, windup: 0.9, dmg: 0.5, slow: 30 },
      ],
    },
    {
      at: 0.25,
      name: ['终焉', 'The End'],
      color: 0xb71c1c,
      tint: 0xef9a9a,
      scale: 1.12,
      buff: ENRAGE,
      camera: CENTER,
      // 场地收缩到 70%（边缘腐烂塌陷），持续到战斗结束
      arena: [{ kind: 'shrink', to: 0.7, dur: 2 }],
      transition: [T({ type: 'slam', cd: 1, count: 1, radius: 240, windup: 1, dmg: 1.5 })],
      patterns: [
        { type: 'spiral', cd: 7, count: 8, waves: 16, speed: 240, dmg: 0.7, debuff: [S('rot', 2, 1)] },
        { type: 'laser', cd: 5, windup: 1, dmg: 1.6, debuff: [S('burn', 3, 2)] },
        { type: 'scatter', cd: 3, count: 16, speed: 300, dmg: 0.6 },
        { type: 'charge', cd: 5, speed: 720, windup: 0.7, dmg: 1.4 },
      ],
    },
  ],
};

/** 腐烂之王「群王之影」召唤的前代 Boss 残影（30% 生命，不掉落） */
export const SHADOWS = { boss: 'rot_king', phase: 2, ids: ['mold_king', 'rotten_chef'], hpMult: 0.3 };
