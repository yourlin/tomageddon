import { afterEach, describe, expect, it, vi } from 'vitest';
import { run, defaultStartWeapon, mergeTier } from '../src/systems/RunState';
import { BALANCE } from '../src/data/balance';
import { CHARACTERS, CHARACTER_MAP } from '../src/data/characters';
import { favoredWeapons } from '../src/data/affinity';
import { RECIPE_BY_TO } from '../src/data/recipes';

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
  // 6 格都放上契合光环（同名同级不会自动合成：栏位没满时直接加进武器栏）
  const fillAuras = () => {
    run.start('taro', 1, false, 0, 'curry_aura');
    expect(run.maxWeapons).toBe(6);
    for (const id of ['garlic_aura', 'salt_aura', 'caramel_aura', 'frost_aura', 'honey_aura']) run.addWeapon(id, 1);
    expect(run.weapons).toHaveLength(6);
  };
  it('栏位满时买入契合武器，品质最低的契合武器升 1 级、不占格子', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // 不触发合成暴击
    fillAuras();
    expect(run.absorbTarget('rice_cooker_aura', 0)).toBe(run.weapons[0]); // 咖喱光环 T1 是最低的
    run.addWeapon('rice_cooker_aura', 0);
    expect(run.weapons).toHaveLength(6);
    expect(run.weapons[0]).toMatchObject({ id: 'curry_aura', tier: 1 });
    // 买入的品质更高：直接升到该品质
    run.addWeapon('rice_cooker_aura', 3);
    expect(run.weapons.some((w) => w.tier === 3)).toBe(true);
  });
  it('手上契合武器都是 T3 时买入 T3 及以下：吞噬不能升级，武器进仓库而不是消失', () => {
    fillAuras();
    for (const w of run.weapons) w.tier = 2;
    expect(run.absorbTarget('rice_cooker_aura', 2)).toBeUndefined();
    run.addWeapon('rice_cooker_aura', 2);
    expect(run.weapons.every((w) => w.tier === 2)).toBe(true);
    expect(run.storage.map((w) => [w.id, w.tier])).toEqual([['rice_cooker_aura', 2]]);
    // 买入 T4 仍可吞噬，直接升到 T4
    expect(run.absorbTarget('rice_cooker_aura', 3)).toBeDefined();
  });
  it('非契合武器不能吞噬；其他角色不吞噬', () => {
    fillAuras();
    expect(run.absorbTarget('knife')).toBeUndefined();
    run.start('blueberry', 1);
    expect(run.absorbTarget('pea_shooter')).toBeUndefined();
  });
});

describe('芋头术士：只能装备光环武器', () => {
  it('非光环武器买入直接进仓库（武器栏有空位也一样），不能换上武器栏；仓库满时买不了', () => {
    run.start('taro', 1, false, 0, 'curry_aura');
    expect(run.canEquip('knife')).toBe(false);
    expect(run.canEquip('garlic_aura')).toBe(true);
    run.addWeapon('knife', 0);
    expect(run.weapons.map((w) => w.id)).toEqual(['curry_aura']);
    expect(run.storage.map((w) => w.id)).toEqual(['knife']);
    expect(run.fromStorage(run.storage[0].uid)).toBe(false);
    // 光环武器照常进武器栏
    run.addWeapon('garlic_aura', 0);
    expect(run.weapons.map((w) => w.id)).toEqual(['curry_aura', 'garlic_aura']);
    // 仓库放满后不能再买非光环武器，光环武器仍可买
    while (run.storage.length < run.storageMax) run.addWeapon('pan', 0);
    expect(run.canAddWeapon('fork', 0)).toBe(false);
    expect(run.canAddWeapon('salt_aura', 0)).toBe(true);
  });
  it('其他角色不受限制', () => {
    run.start('tomato', 1);
    expect(run.canEquip('knife')).toBe(true);
    expect(run.canEquip('garlic_aura')).toBe(true);
  });
  it('仓库里的非光环武器能当配方材料；合成出的非光环武器进仓库，光环武器进武器栏', () => {
    run.start('taro', 1, false, 0, 'curry_aura');
    // 光环 + 非光环 → 非光环（玉米炮 T3 在仓库，刃风光环 T3 在武器栏）
    run.weapons = [];
    run.addWeapon('blade_aura', 2);
    run.addWeapon('corn_cannon', 2);
    expect(run.storage.map((w) => w.id)).toEqual(['corn_cannon']);
    run.items = { bones_7: 1, bones_8: 1 };
    const fz = RECIPE_BY_TO.fz_corn_cannon_blade_aura;
    expect(run.canCraft(fz)).toBe(true);
    expect(run.craft(fz)).toBe(true);
    expect(run.weapons.map((w) => w.id)).toEqual([]);
    expect(run.storage.map((w) => [w.id, w.tier])).toEqual([['fz_corn_cannon_blade_aura', 3]]);
    // 光环 + 光环 → 光环：一把材料在仓库也能合成，产出放进武器栏
    run.start('taro', 1, false, 0, 'curry_aura');
    run.weapons[0].tier = 2;
    run.addWeapon('garlic_aura', 2);
    run.toStorage(run.weapons[1].uid);
    expect(run.storage.map((w) => w.id)).toEqual(['garlic_aura']);
    run.items = { gems_7: 1, poisons_7: 1 };
    expect(run.craft(RECIPE_BY_TO.curry_garlic_field)).toBe(true);
    expect(run.weapons.map((w) => w.id)).toEqual(['curry_garlic_field']);
    expect(run.storage).toHaveLength(0);
  });
  it('升级选项只出光环相关的伤害，不出近战 / 远程 / 元素', () => {
    run.start('taro', 1, false, 0, 'curry_aura');
    run.addWeapon('knife', 0); // 进仓库，不算持有近战武器
    const keys = run.levelUpPool().map((o) => o.key);
    expect(keys).toContain('auraPct');
    for (const k of ['melee', 'ranged', 'elemental', 'meleePct', 'rangedPct', 'elementalPct']) expect(keys).not.toContain(k);
    // 其他角色仍有对应流派选项
    run.start('tomato', 1);
    expect(run.levelUpPool().map((o) => o.key)).toContain('melee');
  });
});

describe('升级选项数', () => {
  it('默认 3 个；草莓偶像 / 豆芽学徒 4 个', () => {
    expect(BALANCE.levelUpChoices).toBe(3);
    expect(CHARACTERS.filter((c) => c.levelUpChoices).map((c) => [c.id, c.levelUpChoices])).toEqual(
      CHARACTERS.filter((c) => c.levelUpChoices).map((c) => [c.id, 4]),
    );
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
