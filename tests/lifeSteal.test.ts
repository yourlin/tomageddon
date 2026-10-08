import { describe, expect, it } from 'vitest';
import { BALANCE, lifeStealHeal, lifeStealMaxPerSecond } from '../src/data/balance';
import { CHARACTER_MAP } from '../src/data/characters';

describe('吸血', () => {
  it('每次回复 max(1, 2% 最大生命)，向下取整，且不超过每秒上限对应的单次量', () => {
    expect(lifeStealHeal(35)).toBe(1);
    expect(lifeStealHeal(99)).toBe(1);
    expect(lifeStealHeal(100)).toBe(2);
    expect(lifeStealHeal(150)).toBe(2);
  });

  it('每秒上限 = 触发次数上限 × 每次回复量，最多 maxPerSec', () => {
    expect(lifeStealMaxPerSecond(50)).toBe(5);
    expect(lifeStealMaxPerSecond(150)).toBe(BALANCE.lifeSteal.maxPerSec);
    expect(lifeStealMaxPerSecond(1000)).toBe(BALANCE.lifeSteal.maxPerSec);
  });

  it('大蒜伯爵契合武器只是削弱冷却，不是取消', () => {
    const L = BALANCE.lifeSteal;
    expect(L.favoredCdMult).toBeGreaterThan(0);
    expect(L.favoredCdMult).toBeLessThan(1);
    expect(L.favoredBurst).toBeGreaterThan(1);
    expect(L.favoredBurst).toBeLessThanOrEqual(3);
  });

  it('大蒜伯爵不再有负生命再生，改为 +15 最大生命', () => {
    const g = CHARACTER_MAP.garlic;
    expect(g.mods.regen ?? 0).toBeGreaterThanOrEqual(0);
    expect(g.mods.maxHp).toBe(15);
  });
});
