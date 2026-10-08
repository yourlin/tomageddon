// 持续伤害跳字：按状态分色
import { describe, it, expect } from 'vitest';

describe('持续伤害跳字', () => {
  it('灼烧红、中毒绿，同时中多种时各跳各的', async () => {
    const { StatusSet } = await import('../src/systems/Status');
    const { dotColor } = await import('../src/data/statuses');
    expect(dotColor('burn')).toBe('#ff4b3e');
    expect(dotColor('poison')).toBe('#7cff4f');
    const st = new StatusSet();
    st.apply({ id: 'burn', stacks: 2, duration: 3 });
    st.apply({ id: 'poison', stacks: 1, duration: 3 });
    let total = 0;
    for (let i = 0; i < 6 && total === 0; i++) total = st.update(0.1);
    expect(total).toBeGreaterThan(0);
    expect(st.dotParts.map((p) => p.id).sort()).toEqual(['burn', 'poison']);
    expect(st.dotParts.reduce((s, p) => s + p.dmg, 0)).toBeCloseTo(total);
  });
});
