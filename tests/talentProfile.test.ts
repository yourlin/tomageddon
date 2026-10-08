import { afterEach, describe, expect, it } from 'vitest';
import { TALENT_MAP } from '../src/data/talentTree';
import { save } from '../src/systems/Save';
import { run } from '../src/systems/RunState';
import {
  setTalents,
  setTalentProfile,
  rankOf,
  raise,
  lower,
  hasCustomTalents,
  clearCustomTalents,
  treeTotals,
  talentPointsSpent,
} from '../src/systems/TalentTree';

afterEach(() => {
  setTalentProfile(null);
  setTalents({});
  save.charTalents = {};
  save.meta.bonusTp = 0;
});

describe('角色专属天赋方案', () => {
  it('没有定制的角色继承默认方案', () => {
    setTalents({ might_core: 2 });
    setTalentProfile('tomato');
    expect(hasCustomTalents('tomato')).toBe(false);
    expect(rankOf('might_core')).toBe(2);
    expect(treeTotals().mods.crit).toBe(2);
  });
  it('角色方案第一次加点时复制默认方案，之后与默认方案互不影响', () => {
    save.meta.bonusTp = 20;
    setTalents({ might_core: 2 });
    setTalentProfile('tomato');
    expect(raise(TALENT_MAP.guard_core)).toBe(true);
    expect(hasCustomTalents('tomato')).toBe(true);
    expect(save.charTalents.tomato).toEqual({ might_core: 2, guard_core: 1 });
    expect(save.talents).toEqual({ might_core: 2 });
    expect(talentPointsSpent()).toBe(3);
    // 默认方案变化不影响已定制的角色
    setTalentProfile(null);
    expect(raise(TALENT_MAP.might_core)).toBe(true);
    setTalentProfile('tomato');
    expect(rankOf('might_core')).toBe(2);
    // 其他角色仍继承默认
    setTalentProfile('carrot');
    expect(rankOf('might_core')).toBe(3);
    expect(rankOf('guard_core')).toBe(0);
  });
  it('恢复继承：删除专属方案后回到默认方案', () => {
    save.meta.bonusTp = 20;
    setTalentProfile('tomato');
    raise(TALENT_MAP.guard_core);
    lower(TALENT_MAP.guard_core);
    expect(hasCustomTalents('tomato')).toBe(true);
    clearCustomTalents('tomato');
    expect(hasCustomTalents('tomato')).toBe(false);
  });
  it('开局使用该角色的方案', () => {
    save.charTalents = { tomato: { guard_core: 3 } };
    setTalents({ might_core: 3 });
    run.start('tomato', 1);
    expect(treeTotals().mods.maxHp).toBe(6);
    expect(treeTotals().mods.crit ?? 0).toBe(0);
    run.start('carrot', 1);
    expect(treeTotals().mods.crit).toBe(3);
  });
});
