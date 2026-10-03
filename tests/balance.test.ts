// 平衡曲线平滑性（来自 1.3.1 发布前的属性测试）：章节倍率单调、成长曲线不回退、收入收敛、稀有度归一化
import { describe, it, expect } from 'vitest';
import {
  BALANCE,
  chapterHpMult,
  chapterDmgMult,
  chapterBossHpMult,
  chapterSpeedMult,
  enemyHp,
  enemyDamage,
  incomeCalib,
  incomeTarget,
  rarityWeights,
  weaponTierWeights,
  dangerReward,
  dangerMult,
  goldReward,
} from '../src/data/balance';
import { DANGER_LEVELS, MAX_DANGER } from '../src/data/danger';

const CH = Array.from({ length: BALANCE.chapterCount }, (_, i) => i + 1);
const WAVES = Array.from({ length: 100 }, (_, i) => i + 1);

describe('章节倍率', () => {
  it.each([
    ['HP', chapterHpMult],
    ['伤害', chapterDmgMult],
    ['Boss HP', chapterBossHpMult],
    ['速度', chapterSpeedMult],
  ])('%s 严格递增且第 1 章为 1', (_n, fn) => {
    expect(fn(1)).toBe(1);
    for (let c = 2; c <= BALANCE.chapterCount; c++) expect(fn(c)).toBeGreaterThan(fn(c - 1));
  });
});

describe('敌人成长曲线', () => {
  it.each(CH)('第 %i 章 1–100 波 HP / 伤害不回退', (c) => {
    let hp = 0;
    let dmg = 0;
    for (const w of WAVES) {
      const h = enemyHp(10, 0.5, w, chapterHpMult(c));
      const d = enemyDamage(3, 0.4, w, chapterDmgMult(c));
      expect(h).toBeGreaterThanOrEqual(hp);
      expect(d).toBeGreaterThanOrEqual(dmg);
      hp = h;
      dmg = d;
    }
  });
  it('同一波次章节越后越强', () => {
    for (const w of [1, 5, 10, 15, 30])
      for (let c = 2; c <= BALANCE.chapterCount; c++)
        expect(enemyHp(10, 0.5, w, chapterHpMult(c))).toBeGreaterThanOrEqual(enemyHp(10, 0.5, w, chapterHpMult(c - 1)));
  });
});

describe('经济', () => {
  it('收入校准连续下降并收敛到 calib', () => {
    let prev = Infinity;
    for (let w = 1; w <= 30; w += 0.01) {
      const v = incomeCalib(w);
      expect(v).toBeLessThanOrEqual(prev + 1e-12);
      prev = v;
    }
    expect(incomeCalib(60)).toBeCloseTo(BALANCE.income.calib, 3);
  });
  it('收入目标递增', () => {
    for (let w = 2; w <= 40; w++) expect(incomeTarget(w)).toBeGreaterThan(incomeTarget(w - 1));
  });
});

describe('概率表', () => {
  it('稀有度权重合法且归一化', () => {
    for (let w = 1; w <= 40; w++)
      for (const luck of [-50, 0, 50, 200]) {
        const ws = rarityWeights(w, luck);
        for (const x of ws) expect(x).toBeGreaterThanOrEqual(0);
        expect(ws.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
      }
  });
  it('武器品质权重合法且归一化', () => {
    for (let w = 1; w <= 40; w++)
      for (const luck of [0, 100]) {
        const ws = weaponTierWeights(w, luck);
        for (const x of ws) expect(x).toBeGreaterThanOrEqual(0);
        expect(ws.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
      }
  });
});

describe('番茄危机（A8）', () => {
  it('奖励倍率严格递增且二阶差分平滑', () => {
    let prev = dangerReward(0);
    let prevD = 0;
    for (let l = 1; l <= MAX_DANGER; l++) {
      const v = dangerReward(l);
      expect(v).toBeGreaterThan(prev);
      const d = v - prev;
      if (l > 1) expect(Math.abs(d - prevD)).toBeLessThan(0.03);
      prev = v;
      prevD = d;
    }
  });
  it('敌人生命 / 伤害倍率随等级单调不减，20 级在合理范围', () => {
    let hp = 1;
    let dmg = 1;
    for (let l = 0; l <= MAX_DANGER; l++) {
      const m = dangerMult(l);
      expect(m.hp).toBeGreaterThanOrEqual(hp);
      expect(m.dmg).toBeGreaterThanOrEqual(dmg);
      hp = m.hp;
      dmg = m.dmg;
    }
    expect(hp).toBeGreaterThan(1.5);
    expect(hp).toBeLessThan(2.5);
    expect(dmg).toBeLessThan(2);
  });
  it('每一级都恰好一条，且描述里的数字与规则一致', () => {
    expect(DANGER_LEVELS.map((d) => d.level)).toEqual(Array.from({ length: MAX_DANGER }, (_, i) => i + 1));
    for (const d of DANGER_LEVELS)
      for (const v of Object.values(d.rule)) if (Math.abs(v) > 1) expect(d.desc[0], `危机 ${d.level}`).toContain(String(Math.abs(v)));
  });
  it('金番茄：0 级普通模式不产出，危机越高越多', () => {
    expect(goldReward(15, 0, false, true)).toBe(0);
    expect(goldReward(15, 10, false, true)).toBeGreaterThan(goldReward(15, 1, false, true));
    expect(goldReward(40, 0, true, false)).toBeGreaterThan(0);
  });
});
