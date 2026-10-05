import { describe, expect, test } from 'vitest';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { pointsTotal } from '../src/systems/Achievements';

// 回归：新增第 6、7 章后「角色·第N章」成就的成就点数组没跟上，总成就点变成 NaN，成就页显示「NaN」
describe('成就点', () => {
  test('每个成就每一级都有有效的成就点与图标', () => {
    const bad = ACHIEVEMENTS.flatMap((a) =>
      a.tiers.filter((t) => !Number.isFinite(t.points) || t.points <= 0).map((_, i) => `${a.id}#${i}`),
    );
    expect(bad).toEqual([]);
    expect(ACHIEVEMENTS.filter((a) => !a.icon).map((a) => a.id)).toEqual([]);
  });

  test('总成就点是正整数', () => {
    expect(Number.isInteger(pointsTotal())).toBe(true);
    expect(pointsTotal()).toBeGreaterThan(0);
  });
});
