import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/data/chapters';
import { BOSSES } from '../src/data/bosses';
import { bossStats } from '../src/systems/EnemyScaling';
import { BALANCE, armorMultiplier, chapterWaves, isEliteWaveFor } from '../src/data/balance';

/** 开发者「典型构筑」（番茄妹，各章 Boss 波，12 局中位数）：最大生命 / 护甲 */
const TYPICAL: Record<number, { hp: number; armor: number }> = {
  1: { hp: 77, armor: 7 },
  2: { hp: 78, armor: 3 },
  3: { hp: 82, armor: 5 },
  4: { hp: 84, armor: 7 },
  5: { hp: 98, armor: 10 },
  6: { hp: 116, armor: 17 },
  7: { hp: 139, armor: 18 },
};

const chOf = (id: number) => CHAPTERS.find((c) => c.id === id)!;

describe('精英 / Boss 伤害', () => {
  it('每章 Boss 的基础伤害都高于本章任何一波的任何精英', () => {
    for (const c of CHAPTERS) {
      const last = chapterWaves(c.id);
      const bosses = BOSSES.filter((b) => b.chapter === c.id && !b.elite);
      const elites = BOSSES.filter((b) => b.chapter === c.id && b.elite);
      if (!bosses.length || !elites.length) continue;
      let eliteMax = 0;
      for (let w = 1; w < last; w++) {
        if (!isEliteWaveFor(c.id, w, false)) continue;
        for (const e of elites) eliteMax = Math.max(eliteMax, bossStats(e, w, c).dmg);
      }
      const bossMin = Math.min(...bosses.map((b) => bossStats(b, last, c).dmg));
      expect(bossMin, `第 ${c.id} 章`).toBeGreaterThan(eliteMax);
    }
  });

  // 各章 Boss 碰撞打死典型构筑的目标次数：第 1 章约 8 下，逐章递减到第 7 章约 3 下
  // 第 2 章 Boss 按平衡测试结果下调过伤害（阵亡 75% 集中在第 2 章 Boss 波），目标放宽到 8 下
  const GOAL: Record<number, number> = { 1: 8, 2: 8, 3: 6, 4: 6, 5: 5, 6: 4, 7: 3 };
  const hitsToKill = (b: (typeof BOSSES)[number]): number => {
    const t = TYPICAL[b.chapter];
    const raw = bossStats(b, chapterWaves(b.chapter), chOf(b.chapter)).dmg * BALANCE.enemyHit.contact;
    return Math.ceil(t.hp / Math.max(1, Math.round(raw * armorMultiplier(t.armor))));
  };

  it('各章 Boss 碰撞打死典型构筑的次数：不多于目标，也不少于目标 − 2', () => {
    for (const b of BOSSES.filter((x) => !x.elite && TYPICAL[x.chapter])) {
      const h = hitsToKill(b);
      expect(h, b.id).toBeLessThanOrEqual(GOAL[b.chapter]);
      expect(h, b.id).toBeGreaterThanOrEqual(GOAL[b.chapter] - 2);
    }
  });
});
