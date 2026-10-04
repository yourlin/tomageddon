// 传说道具持有上限：默认每种 1 件，max 可单独放宽，legendCap（角色 / 天赋等）可提高
import { describe, it, expect } from 'vitest';
import { ALL_ITEMS, LEGEND_RARITY, LEGEND_ITEM_CAP, baseItemCap, itemCapFor, type ItemDef } from '../src/data/items';
import { run } from '../src/systems/RunState';

const legends = ALL_ITEMS.filter((i) => i.rarity >= LEGEND_RARITY);
const firstLegend = legends[0];

describe('传说道具持有上限', () => {
  it('游戏里确实有传说道具，且默认上限都是 1', () => {
    expect(legends.length).toBeGreaterThan(0);
    for (const it of legends) if (it.max === undefined) expect(baseItemCap(it)).toBe(LEGEND_ITEM_CAP);
    expect(LEGEND_ITEM_CAP).toBe(1);
  });

  it('非传说道具不受影响：没填 max 就无上限', () => {
    const common = ALL_ITEMS.find((i) => i.rarity < LEGEND_RARITY && i.max === undefined)!;
    expect(baseItemCap(common)).toBeUndefined();
    expect(itemCapFor(common, 5)).toBe(Infinity);
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
