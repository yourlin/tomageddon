import { describe, expect, it } from 'vitest';
import { chapterWaves, isBossWaveFor, isEliteWaveFor, endlessHp, isBossWaveNo, isEliteWaveNo } from '../src/data/balance';

describe('章节波数', () => {
  it('第 1–4 章 15 波，第 5 章 20 波，之后每章 +5，最多 50', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(chapterWaves)).toEqual([15, 15, 15, 15, 20, 25, 30, 35, 40, 45, 50]);
    expect(chapterWaves(20)).toBe(50);
  });

  it('正常模式：每 5 波精英，最后一波 Boss，之后没有波次', () => {
    for (const ch of [1, 5, 7]) {
      const n = chapterWaves(ch);
      const bosses = [];
      const elites = [];
      for (let w = 1; w <= n + 20; w++) {
        if (isBossWaveFor(ch, w, false)) bosses.push(w);
        if (isEliteWaveFor(ch, w, false)) elites.push(w);
      }
      expect(bosses).toEqual([n]);
      expect(elites).toEqual(Array.from({ length: n / 5 - 1 }, (_, i) => (i + 1) * 5));
    }
  });

  it('15 波章节的无尽节奏与旧规则完全一致', () => {
    for (let w = 1; w <= 120; w++) {
      expect(isBossWaveFor(1, w, true)).toBe(isBossWaveNo(w));
      expect(isEliteWaveFor(1, w, true)).toBe(isEliteWaveNo(w));
    }
  });

  it('长章节的无尽：本章最后一波后每 15 波一轮（第 5 / 10 波精英、第 15 波 Boss）', () => {
    // 第 5 章 20 波：无尽 Boss 在 35 / 50，精英在 25 / 30 / 40 / 45
    const bosses = [];
    const elites = [];
    for (let w = 21; w <= 50; w++) {
      if (isBossWaveFor(5, w, true)) bosses.push(w);
      if (isEliteWaveFor(5, w, true)) elites.push(w);
    }
    expect(bosses).toEqual([35, 50]);
    expect(elites).toEqual([25, 30, 40, 45]);
  });

  it('无尽倍率从本章最后一波之后才开始（正常模式的长章节不吃无尽倍率）', () => {
    expect(endlessHp(20, chapterWaves(5))).toBe(1);
    expect(endlessHp(21, chapterWaves(5))).toBeCloseTo(1.12);
    // 进入无尽后第 k 波的倍率与 15 波章节相同
    for (const k of [1, 10, 20, 40]) expect(endlessHp(20 + k, 20)).toBeCloseTo(endlessHp(15 + k));
  });
});
