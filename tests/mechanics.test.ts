import { describe, expect, it } from 'vitest';
import { MECHANIC_CHAPTER, mechanicOpenAt, relicKindsOpen, merchantKinds } from '../src/systems/Mechanics';

describe('局内机制按章节逐步开放', () => {
  it('第一幕不出现商人、危险路线、事件波、小任务、天气', () => {
    for (const id of ['merchant', 'route', 'events', 'quests', 'weather'] as const) expect(mechanicOpenAt(id, 1)).toBe(false);
  });
  it('每章最多新开放 3 项，且全部机制在第 4 章前开放完', () => {
    const per = new Map<number, number>();
    for (const ch of Object.values(MECHANIC_CHAPTER)) per.set(ch, (per.get(ch) ?? 0) + 1);
    for (const n of per.values()) expect(n).toBeLessThanOrEqual(3);
    expect(Math.max(...Object.values(MECHANIC_CHAPTER))).toBeLessThanOrEqual(4);
  });
  it('遗物类别随章节放开', () => {
    expect(relicKindsOpen(1)).toEqual(['boon']);
    expect(relicKindsOpen(2)).toEqual(['boon', 'trade']);
    expect(relicKindsOpen(3)).toEqual(['boon', 'trade', 'curse']);
  });
  it('神秘商人：第 4 章只卖交易型，第 5 章起才有诅咒型', () => {
    expect(merchantKinds(4)).toEqual(['trade']);
    expect(merchantKinds(5)).toEqual(['trade', 'curse']);
  });
});
