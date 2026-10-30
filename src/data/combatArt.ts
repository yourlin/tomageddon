// 第一关：敌方弹体与 Boss 形态美术。仅改变显示，不改变碰撞、弹速、伤害或阶段时间。
export interface ProjectileArt {
  file: string;
  /** 源图中的可见弹体半径；显示时对齐 Bullet.radius */
  refRadius: number;
  anchor: { x: number; y: number };
  spin: number;
  pulse: number;
  color: number;
}
export interface BossFormArt {
  file: string;
  anchor: { x: number; y: number };
  refRadius: number;
}
export const CH1_PROJECTILES = {
  spore: {
    file: 'projectiles/spore.png',
    refRadius: 491,
    anchor: {
      x: 0.5,
      y: 0.5008,
    },
    spin: 1.2,
    pulse: 0.04,
    color: 11134557,
  },
  seed: {
    file: 'projectiles/seed.png',
    refRadius: 440,
    anchor: {
      x: 0.5004,
      y: 0.49522,
    },
    spin: 4,
    pulse: 0,
    color: 12350029,
  },
  milk: {
    file: 'projectiles/milk.png',
    refRadius: 532,
    anchor: {
      x: 0.5012,
      y: 0.50319,
    },
    spin: 0,
    pulse: 0.04,
    color: 14284543,
  },
  pebble: {
    file: 'projectiles/pebble.png',
    refRadius: 389,
    anchor: {
      x: 0.50558,
      y: 0.49242,
    },
    spin: 5,
    pulse: 0,
    color: 13151619,
  },
  oil: {
    file: 'projectiles/oil.png',
    refRadius: 482,
    anchor: {
      x: 0.52313,
      y: 0.50199,
    },
    spin: 1,
    pulse: 0.03,
    color: 16758601,
  },
  ember: {
    file: 'projectiles/ember.png',
    refRadius: 480,
    anchor: {
      x: 0.4996,
      y: 0.5004,
    },
    spin: 0,
    pulse: 0.04,
    color: 16743480,
  },
  soot: {
    file: 'projectiles/soot.png',
    refRadius: 482,
    anchor: {
      x: 0.5008,
      y: 0.49482,
    },
    spin: 2.5,
    pulse: 0.04,
    color: 16753487,
  },
  chitin: {
    file: 'projectiles/chitin.png',
    refRadius: 440,
    anchor: {
      x: 0.50518,
      y: 0.49083,
    },
    spin: 4,
    pulse: 0,
    color: 15120226,
  },
  metal: {
    file: 'projectiles/metal.png',
    refRadius: 481,
    anchor: {
      x: 0.51116,
      y: 0.49601,
    },
    spin: 0,
    pulse: 0,
    color: 13100533,
  },
  onion: {
    file: 'projectiles/onion.png',
    refRadius: 500,
    anchor: {
      x: 0.5004,
      y: 0.50239,
    },
    spin: 1.5,
    pulse: 0.04,
    color: 13600476,
  },
  egg: {
    file: 'projectiles/egg.png',
    refRadius: 378,
    anchor: {
      x: 0.50518,
      y: 0.49322,
    },
    spin: 2,
    pulse: 0.03,
    color: 14280608,
  },
} satisfies Record<string, ProjectileArt>;
export type ProjectileArtId = keyof typeof CH1_PROJECTILES;
export const CH1_BOSS_FORMS: Record<string, Record<number, BossFormArt>> = {
  mold_king: {
    '1': {
      file: 'forms/mold_king-1.png',
      refRadius: 516,
      anchor: {
        x: 0.50159,
        y: 0.97209,
      },
    },
    '2': {
      file: 'forms/mold_king-2.png',
      refRadius: 518,
      anchor: {
        x: 0.5,
        y: 0.94418,
      },
    },
  },
  grease_chef: {
    '1': {
      file: 'forms/grease_chef-1.png',
      refRadius: 514,
      anchor: {
        x: 0.50439,
        y: 0.96332,
      },
    },
    '2': {
      file: 'forms/grease_chef-2.png',
      refRadius: 518,
      anchor: {
        x: 0.50518,
        y: 0.92185,
      },
    },
  },
  cockroach_emperor: {
    '1': {
      file: 'forms/cockroach_emperor-1.png',
      refRadius: 516,
      anchor: {
        x: 0.49801,
        y: 0.94418,
      },
    },
    '2': {
      file: 'forms/cockroach_emperor-2.png',
      refRadius: 500,
      anchor: {
        x: 0.50478,
        y: 0.95534,
      },
    },
  },
};

/** 有显式冰弹 / 蛛网等机制贴图时保留原机制，未覆盖的实体也不改。 */
export function enemyProjectileArt(chapter: number, id: string, phase: number, legacyKey: string): ProjectileArtId | null {
  if (chapter !== 1 || !['proj_enemy', 'proj_rock'].includes(legacyKey)) return null;
  if (id === 'grease_chef') return phase >= 2 ? 'soot' : phase >= 1 ? 'ember' : 'oil';
  const map: Record<string, ProjectileArtId> = {
    rotten_apple: 'seed',
    sour_milk: 'milk',
    gopher: 'pebble',
    mold_king: 'spore',
    mold_elder: 'spore',
    greasy_pan: 'oil',
    roach_general: 'chitin',
    cockroach_emperor: 'chitin',
    fork_knight: 'metal',
    rotten_onion: 'onion',
    fly_swarm_king: 'egg',
  };
  return map[id] ?? null;
}
