import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { titleName, titleRarity, unlockedTitles } from '../src/data/titles';

describe('称号', () => {
  it('称号名不带 {char} / {boss} / {x} 等模板占位符', () => {
    const bad = ACHIEVEMENTS.map((a) => titleName(a.id)).filter((n) => /\{\w+\}/.test(n));
    expect(bad).toEqual([]);
  });

  it('稀有度四档都有，且越难的成就（点数越高）稀有度不会更低', () => {
    const r = ACHIEVEMENTS.map((a) => titleRarity(a.id));
    for (const k of [0, 1, 2, 3]) expect(r.filter((x) => x === k).length, `稀有度 ${k}`).toBeGreaterThan(0);
    const pts = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!.tiers.reduce((s, t) => s + t.points, 0);
    const sorted = [...ACHIEVEMENTS].sort((a, b) => pts(a.id) - pts(b.id));
    for (let i = 1; i < sorted.length; i++) expect(titleRarity(sorted[i].id)).toBeGreaterThanOrEqual(titleRarity(sorted[i - 1].id));
  });

  it('只有成就升到最高等级才解锁称号', () => {
    const a = ACHIEVEMENTS.find((x) => x.tiers.length > 1)!;
    expect(unlockedTitles({ [a.id]: { tier: a.tiers.length - 1 } })).not.toContain(a.id);
    expect(unlockedTitles({ [a.id]: { tier: a.tiers.length } })).toContain(a.id);
  });
});
