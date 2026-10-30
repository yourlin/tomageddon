import { describe, expect, it } from 'vitest';
import { projectileArtDeps } from '../src/systems/ProjectileArtDeps';
import { chapterArtDeps } from '../src/systems/ArtResolve';

describe('波次美术依赖', () => {
  it('只选装备弹丸/地雷和可能出现的敌人弹丸', () => {
    const ids = projectileArtDeps(['pea_shooter', 'potato_mine'], ['rotten_apple']);
    expect(ids.has('player_pea_shooter')).toBe(true);
    expect(ids.has('mine_potato_mine')).toBe(true);
    expect(ids.has('enemy_rotten_apple')).toBe(true);
    expect(ids.has('player_chili_rocket')).toBe(false);
    expect(ids.has('mine_pepper_mine')).toBe(false);
    expect(ids.has('enemy_locust_queen')).toBe(false);
    expect(ids.has('legacy_player')).toBe(true);
  });
  it('首波不加载后续波怪物或未选择Boss', () => {
    const first = chapterArtDeps(1, 'tomato', undefined, { wave: 1, bossIds: [] });
    expect(first.some((v) => v.id === 'mold')).toBe(true);
    expect(first.some((v) => v.id === 'fly')).toBe(false);
    expect(first.some((v) => v.id === 'rotten_apple')).toBe(false);
    expect(first.some((v) => v.kind === 'boss')).toBe(false);
    const later = chapterArtDeps(1, 'tomato', undefined, { wave: 3, bossIds: ['mold_king'] });
    expect(later.some((v) => v.id === 'rotten_apple')).toBe(true);
    expect(later.filter((v) => v.kind === 'boss').map((v) => v.id)).toEqual(['mold_king']);
  });
});
