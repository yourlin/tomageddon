import { describe, expect, it } from 'vitest';
import { CH1_PROJECTILES, CH1_BOSS_FORMS, enemyProjectileArt } from '../src/data/combatArt';
import { BOSS_MAP } from '../src/data/bosses';

describe('第一关弹体与形态设计', () => {
  it('两种远程小怪与全部可发射弹体的精英 / Boss 有对应材质', () => {
    const expected = {
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
    for (const [id, art] of Object.entries(expected)) expect(enemyProjectileArt(1, id, 0, 'proj_enemy'), id).toBe(art);
  });

  it('怪厨三个阶段弹体递进，未覆盖实体与冰 / 网等机制弹体保持原样', () => {
    expect([0, 1, 2].map((p) => enemyProjectileArt(1, 'grease_chef', p, 'proj_enemy'))).toEqual(['oil', 'ember', 'soot']);
    for (const key of ['proj_ice', 'proj_web', 'proj_soda', 'proj_flame']) expect(enemyProjectileArt(1, 'grease_chef', 2, key)).toBeNull();
    expect(enemyProjectileArt(2, 'mold_king', 1, 'proj_enemy')).toBeNull();
    expect(enemyProjectileArt(1, 'unknown', 1, 'proj_enemy')).toBeNull();
  });

  it('第一关三位 Boss 的后续阶段都有独立形态，阶段和玩法表一致', () => {
    for (const id of ['mold_king', 'grease_chef', 'cockroach_emperor']) {
      const phases = BOSS_MAP[id].phases!;
      expect(phases).toHaveLength(3);
      for (let phase = 1; phase < phases.length; phase++) {
        expect(CH1_BOSS_FORMS[id][phase]?.file).toBeTruthy();
        expect(CH1_BOSS_FORMS[id][phase].refRadius).toBeGreaterThan(0);
      }
    }
  });

  it('弹体脉动限制在 4%，定向飞行弹不自旋，避免误导命中范围', () => {
    for (const art of Object.values(CH1_PROJECTILES)) {
      expect(art.refRadius).toBeGreaterThan(0);
      expect(art.pulse).toBeGreaterThanOrEqual(0);
      expect(art.pulse).toBeLessThanOrEqual(0.04);
      expect(art.anchor.x).toBeGreaterThanOrEqual(0);
      expect(art.anchor.x).toBeLessThanOrEqual(1);
    }
    for (const id of ['milk', 'ember', 'metal'] as const) expect(CH1_PROJECTILES[id].spin).toBe(0);
  });
});
