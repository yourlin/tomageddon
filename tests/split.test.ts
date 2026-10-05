// 道具「分裂」：层数可叠加但有总上限，描述里写明伤害递减
import { describe, it, expect } from 'vitest';
import { ITEM_MAP } from '../src/data/items';
import { describeItem } from '../src/data/describe';
import { BALANCE } from '../src/data/balance';
import { run } from '../src/systems/RunState';

const SPLIT_ITEMS = ['pomegranate', 'onion_layers', 'cluster_tomato'];

describe('子弹分裂道具', () => {
  it('三件分裂道具都存在且带 split', () => {
    for (const id of SPLIT_ITEMS) expect(ITEM_MAP[id]?.special?.split, id).toBeGreaterThan(0);
  });

  it('叠加后的分裂层数不超过上限', () => {
    run.start('tomato', 1);
    run.items = { pomegranate: 2, onion_layers: 2, cluster_tomato: 1 }; // 合计 6 层
    run.dirty();
    expect(run.specials.split).toBe(BALANCE.split.cap);
    run.items = { pomegranate: 1 };
    run.dirty();
    expect(run.specials.split).toBe(1);
  });

  it('每层伤害递减，单发子弹的碎片总数有限', () => {
    const S = BALANCE.split;
    expect(S.dmg).toBeGreaterThan(0);
    expect(S.dmg).toBeLessThan(1);
    let total = 0;
    for (let g = 1; g <= S.cap; g++) total += Math.pow(S.shards, g);
    expect(total).toBeLessThanOrEqual(20);
  });

  it('描述写明层数、伤害比例与上限', () => {
    const text = describeItem(ITEM_MAP.cluster_tomato).join(' ');
    expect(text).toContain(`${Math.round(BALANCE.split.dmg * 100)}%`);
    expect(text).toContain(`最多 ${BALANCE.split.cap}`);
  });
});
