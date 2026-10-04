// 「荆棘」词缀反伤：按实际伤害、经护甲、单次 / 每秒封顶，高伤害近战不会被自己秒杀
import { describe, it, expect } from 'vitest';
import { thornyReflect, THORNY, armorMultiplier } from '../src/data/balance';

describe('荆棘反伤', () => {
  it('低伤害时按 5% 反弹并经护甲减免', () => {
    expect(thornyReflect(100, 1000, 0, 0)).toBeCloseTo(100 * THORNY.pct);
    expect(thornyReflect(100, 1000, 10, 0)).toBeCloseTo(100 * THORNY.pct * armorMultiplier(10));
  });
  it('单次反伤不超过 2% 最大生命', () => {
    expect(thornyReflect(1e6, 150, 0, 0)).toBeCloseTo(150 * THORNY.hitCap);
  });
  it('一秒内连续 120 次超高伤害命中，累计不超过 8% 最大生命', () => {
    const maxHp = 150;
    let used = 0;
    for (let i = 0; i < 120; i++) used += thornyReflect(50000, maxHp, 0, used);
    expect(used).toBeCloseTo(maxHp * THORNY.secCap);
    expect(used).toBeLessThan(maxHp);
  });
  it('没造成伤害时不反弹', () => {
    expect(thornyReflect(0, 150, 0, 0)).toBe(0);
  });
});
