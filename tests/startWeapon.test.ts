import { afterEach, describe, expect, it, vi } from 'vitest';
import { run, defaultStartWeapon, mergeTier } from '../src/systems/RunState';
import { BALANCE } from '../src/data/balance';
import { CHARACTERS, CHARACTER_MAP } from '../src/data/characters';
import { favoredWeapons } from '../src/data/affinity';

describe('开局武器：契合武器三选一', () => {
  it('每个角色至少有 3 把契合武器可选，默认武器是契合武器', () => {
    for (const c of CHARACTERS) {
      const fav = favoredWeapons(c).map((w) => w.id);
      expect(fav.length, c.id).toBeGreaterThanOrEqual(3);
      expect(fav, c.id).toContain(defaultStartWeapon(c));
    }
  });
  it('开局只拿选中的那 1 把；「再来一局」沿用上次选择', () => {
    const pick = favoredWeapons(CHARACTER_MAP.blueberry)[2].id;
    run.start('blueberry', 1, false, 0, pick);
    expect(run.weapons.map((w) => w.id)).toEqual([pick]);
    run.start('blueberry', 1);
    expect(run.weapons.map((w) => w.id)).toEqual([pick]);
    // 换角色：上次的选择不在契合武器里，回到默认
    run.start('tomato', 1);
    expect(run.weapons.map((w) => w.id)).toEqual([defaultStartWeapon(CHARACTER_MAP.tomato)]);
  });
});

describe('芋头术士：同类吞噬升级', () => {
  afterEach(() => vi.restoreAllMocks());
  it('栏位满时买入契合武器，手上的武器升 1 级、不占格子', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // 不触发合成暴击
    run.start('taro', 1, false, 0, 'curry_aura');
    expect(run.maxWeapons).toBe(1);
    expect(run.canAddWeapon('garlic_aura', 0)).toBe(true);
    run.addWeapon('garlic_aura', 0);
    expect(run.weapons).toHaveLength(1);
    expect(run.weapons[0]).toMatchObject({ id: 'curry_aura', tier: 1 });
    // 买入的品质更高：直接升到该品质
    run.addWeapon('salt_aura', 3);
    expect(run.weapons[0].tier).toBe(3);
    // 已经 T4：不能再吞噬，但仓库还有位置，买入的武器进仓库
    expect(run.absorbTarget('garlic_aura')).toBeUndefined();
    expect(run.canAddWeapon('garlic_aura', 0)).toBe(true);
    run.addWeapon('garlic_aura', 0);
    expect(run.weapons).toHaveLength(1);
    expect(run.storage.map((w) => w.id)).toEqual(['garlic_aura']);
  });
  it('非契合武器不能吞噬；其他角色不吞噬', () => {
    run.start('taro', 1, false, 0, 'curry_aura');
    expect(run.absorbTarget('knife')).toBeUndefined();
    run.start('blueberry', 1);
    expect(run.absorbTarget('pea_shooter')).toBeUndefined();
  });
});

describe('合成暴击', () => {
  it('+1 级，按 mergeBonus 概率 +2 级，同名合成最高只到 T3（T4 只能走配方）', () => {
    expect(mergeTier(0, () => 0.99)).toBe(1);
    expect(mergeTier(1, () => 0)).toBe(2);
    expect(mergeTier(2, () => 0)).toBe(2);
    expect(mergeTier(0, () => BALANCE.mergeBonus - 1e-6)).toBe(2);
    expect(mergeTier(0, () => BALANCE.mergeBonus)).toBe(1);
  });
});
