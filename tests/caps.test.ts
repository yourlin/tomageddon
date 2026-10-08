import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  speedBonusPct,
  armorMultiplier,
  lootHarvestMult,
  regenPerSecond,
  lifeStealMaxPerSecond,
  weaponTierWeights,
} from '../src/data/balance';
import { LEVELUP_OPTIONS } from '../src/data/items';

// 防止属性无限膨胀（参考 1.4 无尽模式「站着不动也打不死、钱花不完」）
describe('属性上限', () => {
  it('生命再生趋近但不超过每秒 maxPerSec', () => {
    for (const r of [10, 100, 1000]) expect(regenPerSecond(r)).toBeLessThan(BALANCE.regen.maxPerSec);
    expect(regenPerSecond(1e6)).toBeLessThanOrEqual(BALANCE.regen.maxPerSec);
    expect(regenPerSecond(100)).toBeGreaterThan(regenPerSecond(50));
  });
  it('吸血每秒最多 maxPerSec', () => {
    for (const hp of [50, 400, 5000]) expect(lifeStealMaxPerSecond(hp)).toBeLessThanOrEqual(BALANCE.lifeSteal.maxPerSec);
  });
  it('护甲减伤有上限', () => {
    expect(armorMultiplier(15)).toBeCloseTo(0.5, 6);
    expect(armorMultiplier(1000)).toBe(BALANCE.armorMinTaken);
  });
  it('收获对掉落的加成收益递减、有上限', () => {
    expect(lootHarvestMult(0)).toBe(1);
    expect(lootHarvestMult(100)).toBeGreaterThan(lootHarvestMult(50));
    expect(lootHarvestMult(1e6)).toBeLessThan(BALANCE.harvestLoot.max);
  });
  it('商店不出 T4', () => {
    for (const l of [0, 100, 1366]) expect(weaponTierWeights(l)[3]).toBe(0);
  });
  it('升级：没有拾取范围；生命再生、吸血每次只加 1 点', () => {
    expect(LEVELUP_OPTIONS.some((o) => o.key === 'pickup')).toBe(false);
    for (const k of ['regen', 'lifeSteal']) expect(LEVELUP_OPTIONS.find((o) => o.key === k)?.values).toEqual([1, 1, 1, 1]);
  });
  it('移动速度按点数：收益递减趋近上限，负向有下限', () => {
    expect(speedBonusPct(10)).toBeGreaterThan(15);
    expect(speedBonusPct(100) - speedBonusPct(50)).toBeLessThan(speedBonusPct(50) - speedBonusPct(0));
    expect(speedBonusPct(1e6)).toBeLessThanOrEqual(BALANCE.speed.cap);
    expect(speedBonusPct(-1000)).toBe(BALANCE.speed.min);
  });
});
