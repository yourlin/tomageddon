import { describe, expect, it } from 'vitest';
import { meleeInReach, MELEE_THRUST_PAD } from '../src/data/balance';

describe('近战触及判定（目标选择与命中共用）', () => {
  it('按敌人身体边缘计算：边缘进入射程即可命中', () => {
    expect(meleeInReach('sweep', 120, 0, 120)).toBe(true);
    expect(meleeInReach('sweep', 121, 0, 120)).toBe(false);
    // 大体型精英：中心远在射程外，但身体边缘已进入射程
    expect(meleeInReach('sweep', 160, 45, 120)).toBe(true);
    expect(meleeInReach('sweep', 166, 45, 120)).toBe(false);
  });

  it('小怪在「射程 + 20」处不再被选为目标（旧逻辑会挥空）', () => {
    // 旧目标选择：中心距 ≤ 射程 + 20；旧命中：边缘 ≤ 射程。半径 13 的小怪在 135 处会被选中但打不到
    expect(meleeInReach('sweep', 135, 13, 120)).toBe(false);
  });

  it('直刺刀身有宽度，额外放宽', () => {
    expect(meleeInReach('thrust', 120 + 10 + MELEE_THRUST_PAD, 10, 120)).toBe(true);
    expect(meleeInReach('thrust', 120 + 10 + MELEE_THRUST_PAD + 1, 10, 120)).toBe(false);
  });
});
