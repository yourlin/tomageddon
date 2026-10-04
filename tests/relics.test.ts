// C 模块：遗物数据约束（数量、类别、套装、进化联动、描述由数据生成且与数值一致）
import { describe, it, expect } from 'vitest';
import { RELICS, RELIC_SETS, RELIC_SET_SIZE, describeRelic, relicTotals } from '../src/data/relics';
import { STAT_INFO } from '../src/data/stats';
import { EVOLUTION_OF } from '../src/data/evolutions';

describe('遗物数据', () => {
  it('首批至少 40 个，id 唯一', () => {
    expect(RELICS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(RELICS.map((r) => r.id)).size).toBe(RELICS.length);
  });
  it('三类遗物都有', () => {
    for (const k of ['boon', 'trade', 'curse'] as const) expect(RELICS.filter((r) => r.kind === k).length).toBeGreaterThanOrEqual(8);
  });
  it('交易型都有代价（负属性、负面规则或归零类效果）', () => {
    for (const r of RELICS.filter((x) => x.kind !== 'boon')) {
      const neg =
        Object.values(r.mods ?? {}).some((v) => v! < 0) ||
        Object.entries(r.rule ?? {}).some(([k, v]) => (k === 'heal' || k === 'xp' ? v! < 0 : v! > 0)) ||
        !!(r.flags?.noRegen || r.flags?.noLifeSteal || r.flags?.noDodge || r.flags?.noArmor || (r.flags?.maxHpMult ?? 1) < 1);
      expect(neg, r.id).toBe(true);
    }
  });
  it('属性键都合法', () => {
    for (const r of RELICS) for (const k of Object.keys(r.mods ?? {})) expect(STAT_INFO, `${r.id}.${k}`).toHaveProperty(k);
  });
});

describe('遗物描述（C6）', () => {
  it('每个遗物都能生成非空描述，且没有占位符', () => {
    for (const r of RELICS) {
      const lines = describeRelic(r);
      expect(lines.length, r.id).toBeGreaterThan(0);
      for (const l of lines) expect(l).not.toMatch(/undefined|NaN|\{v\}/);
    }
  });
  it('描述里出现每个属性 / 规则数值', () => {
    for (const r of RELICS) {
      const text = describeRelic(r).join(' ');
      for (const v of [...Object.values(r.mods ?? {}), ...Object.values(r.rule ?? {})]) expect(text, r.id).toContain(String(Math.abs(v!)));
    }
  });
});

describe('套装与进化联动（C7 / C8）', () => {
  it('8 套，每套正好 3 件', () => {
    expect(RELIC_SETS.length).toBe(8);
    for (const s of RELIC_SETS) expect(RELICS.filter((r) => r.set === s.id).length, s.id).toBe(RELIC_SET_SIZE);
  });
  it('集齐 3 件激活套装，2 件不激活', () => {
    const ids = RELICS.filter((r) => r.set === 'stone').map((r) => r.id);
    expect(relicTotals(ids.slice(0, 2)).sets).toEqual([]);
    expect(relicTotals(ids).sets).toEqual(['stone']);
  });
  it('5 组进化联动，武器都有进化路线', () => {
    const early = RELICS.flatMap((r) => r.flags?.evolveEarly ?? []);
    expect(early.length).toBe(5);
    for (const w of early) expect(EVOLUTION_OF[w], w).toBeTruthy();
  });
  it('汇总：规则相加、最大生命倍率相乘', () => {
    const t = relicTotals(['glass_heart', 'broken_mirror', 'greedy_sack']);
    expect(t.flags.maxHpMult).toBeCloseTo(0.75 * 0.85);
    expect(t.rule.income).toBe(25);
    expect(t.rule.shopPrice).toBe(15);
  });
});
