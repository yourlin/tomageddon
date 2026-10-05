// 传说道具持有上限：默认每种 1 件，max 可单独放宽，legendCap（角色 / 天赋等）可提高
import { describe, it, expect } from 'vitest';
import {
  ALL_ITEMS,
  LEGEND_RARITY,
  LEGEND_ITEM_CAP,
  LEVELUP_OPTIONS,
  RARITY_ITEM_CAP,
  baseItemCap,
  itemCapFor,
  type ItemDef,
} from '../src/data/items';
import { run } from '../src/systems/RunState';

const legends = ALL_ITEMS.filter((i) => i.rarity >= LEGEND_RARITY);
const firstLegend = legends[0];

describe('传说道具持有上限', () => {
  it('游戏里确实有传说道具，且默认上限都是 1', () => {
    expect(legends.length).toBeGreaterThan(0);
    for (const it of legends) if (it.max === undefined) expect(baseItemCap(it)).toBe(LEGEND_ITEM_CAP);
    expect(LEGEND_ITEM_CAP).toBe(1);
  });

  it('非传说道具按稀有度有默认上限：普通 3、稀有 2、史诗 1，legendCap 不影响', () => {
    for (const r of [0, 1, 2]) {
      const it = ALL_ITEMS.find((i) => i.rarity === r && i.max === undefined)!;
      expect(baseItemCap(it)).toBe(RARITY_ITEM_CAP[r]);
      expect(itemCapFor(it, 5)).toBe(RARITY_ITEM_CAP[r]);
    }
    expect(RARITY_ITEM_CAP).toEqual([3, 2, 1, 1]);
  });

  it('所有道具都有上限，且不超过稀有度默认值', () => {
    for (const it of ALL_ITEMS) {
      expect(Number.isFinite(baseItemCap(it))).toBe(true);
      expect(baseItemCap(it)).toBeLessThanOrEqual(RARITY_ITEM_CAP[it.rarity]);
    }
  });

  it('加武器栏的道具都是传说', () => {
    for (const it of ALL_ITEMS) if (it.special?.weaponSlot) expect(it.rarity).toBe(LEGEND_RARITY);
  });

  it('升级选项不提供光环范围与技能范围', () => {
    const keys = LEVELUP_OPTIONS.map((o) => o.key);
    expect(keys).not.toContain('auraSize');
    expect(keys).not.toContain('skillRange');
  });

  it('道具按上限买满，技能范围合计不超过 +225%', () => {
    const total = ALL_ITEMS.reduce((s, i) => s + Math.max(0, i.mods.skillRange ?? 0) * baseItemCap(i), 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(225);
  });

  it('单个道具可以用 max 覆盖默认上限（以后放宽个别传说道具）', () => {
    const custom: ItemDef = { ...firstLegend, max: 3 };
    expect(baseItemCap(custom)).toBe(3);
    expect(itemCapFor(custom, 1)).toBe(4);
  });

  it('legendCap 只加在传说道具上', () => {
    expect(itemCapFor(firstLegend, 2)).toBe(LEGEND_ITEM_CAP + 2);
    const capped = ALL_ITEMS.find((i) => i.rarity < LEGEND_RARITY && i.max !== undefined);
    if (capped) expect(itemCapFor(capped, 2)).toBe(capped.max);
  });

  it('run：拿满 1 件后 canTakeItem 为 false；角色提供 legendCap 后可再拿', () => {
    run.start('tomato', 1);
    run.items = {};
    run.dirty();
    expect(run.canTakeItem(firstLegend.id)).toBe(true);
    run.addItem(firstLegend.id);
    expect(run.itemCap(firstLegend.id)).toBe(1);
    expect(run.canTakeItem(firstLegend.id)).toBe(false);

    const ch = run.char;
    const old = ch.special;
    try {
      ch.special = { ...(old ?? {}), legendCap: 1 };
      run.dirty();
      expect(run.itemCap(firstLegend.id)).toBe(2);
      expect(run.canTakeItem(firstLegend.id)).toBe(true);
    } finally {
      ch.special = old;
      run.dirty();
    }
  });
});
