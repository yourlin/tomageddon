// L1：开发者构筑（src/dev/build.ts）与游戏共用的商店 / 合成 / 撤销逻辑
import { describe, it, expect, beforeEach } from 'vitest';
import {
  newBuild,
  buyWeapon,
  buyItem,
  sellWeapon,
  combineWeapon,
  canCombine,
  undo,
  money,
  spent,
  weaponPrice,
  applyBuild,
} from '../src/dev/build';
import { CHARACTER_MAP } from '../src/data/characters';
import { ALL_ITEMS } from '../src/data/items';
import { run } from '../src/systems/RunState';

const cheapItem = () => [...ALL_ITEMS].filter((i) => !i.max).sort((a, b) => a.price - b.price)[0];

describe('开发者构筑', () => {
  let b = newBuild('tomato');
  beforeEach(() => {
    b = newBuild('tomato');
    b.wave = 5;
    b.budget = 5000;
  });

  it('新构筑带角色初始武器', () => {
    expect(b.weapons.map((w) => w.id)).toEqual(CHARACTER_MAP.tomato.startWeapons);
  });

  it('购买武器扣款并记账，撤销后恢复', () => {
    const id = b.weapons[0].id;
    const p = weaponPrice(b, id, 0);
    const n = b.weapons.length;
    expect(buyWeapon(b, id, 0)).toBeNull();
    expect(spent(b)).toBe(p);
    expect(money(b)).toBe(5000 - p);
    undo(b);
    expect(b.ledger.length).toBe(0);
    expect(b.weapons.length).toBe(n);
  });

  it('同名同品质可以合成为高一级', () => {
    const id = b.weapons[0].id;
    buyWeapon(b, id, 0);
    // 武器栏未满时购买不会自动合成
    const i = b.weapons.findIndex((w) => w.id === id && w.tier === 0);
    if (canCombine(b, i)) {
      expect(combineWeapon(b, i)).toBe(true);
      expect(b.weapons.some((w) => w.id === id && w.tier === 1)).toBe(true);
    } else expect(b.weapons.some((w) => w.id === id && w.tier === 1)).toBe(true);
  });

  it('出售武器返还资金（负花费）', () => {
    const id = b.weapons[0].id;
    buyWeapon(b, id, 0);
    const before = money(b);
    sellWeapon(b, b.weapons.length - 1);
    expect(money(b)).toBeGreaterThan(before);
  });

  it('资金不足时拒绝购买', () => {
    b.budget = 0;
    expect(buyItem(b, cheapItem().id)).toBe('资金不足');
    b.ignoreBudget = true;
    expect(buyItem(b, cheapItem().id)).toBeNull();
  });

  it('applyBuild 写入 run：等级每级 +1 最大生命', () => {
    b.level = 0;
    applyBuild(b);
    const hp0 = run.stats.maxHp;
    b.level = 10;
    applyBuild(b);
    expect(run.stats.maxHp).toBeGreaterThanOrEqual(hp0 + 10);
    expect(run.hp).toBe(run.stats.maxHp);
  });
});
