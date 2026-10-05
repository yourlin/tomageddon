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
  upgradeRarityWeights,
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
  it('伤害成长指数独立且比血量平缓：同样的成长系数下，第 15 波伤害倍数低于血量倍数', () => {
    expect(BALANCE.enemyDmgGrowthExp).toBeLessThan(BALANCE.enemyGrowthExp);
    const hpX = enemyHp(1000, 0.5, 15, 1) / enemyHp(1000, 0.5, 1, 1);
    const dmgX = enemyDamage(1000, 0.5, 15, 1) / enemyDamage(1000, 0.5, 1, 1);
    expect(dmgX).toBeLessThan(hpX);
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
  it('道具稀有度权重合法、归一化，且与波次无关', () => {
    for (const luck of [-200, -50, 0, 50, 200, 1000]) {
      const ws = rarityWeights(luck);
      for (const x of ws) expect(x).toBeGreaterThanOrEqual(0);
      expect(ws.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    }
  });
  it('武器品质权重合法、归一化，且与波次无关', () => {
    for (const luck of [-200, 0, 100, 1000])
      for (const t4 of [1, 1.5]) {
        const ws = weaponTierWeights(luck, t4);
        for (const x of ws) expect(x).toBeGreaterThanOrEqual(0);
        expect(ws.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
      }
  });
  it('幸运越高，高档概率单调不减、最低档单调不增', () => {
    for (const f of [rarityWeights, (l: number) => weaponTierWeights(l)]) {
      let prev = f(-100);
      for (let l = -90; l <= 500; l += 10) {
        const cur = f(l);
        expect(cur[0]).toBeLessThanOrEqual(prev[0] + 1e-9);
        expect(cur[3]).toBeGreaterThanOrEqual(prev[3] - 1e-9);
        prev = cur;
      }
    }
  });
  it('升级属性选项的稀有度权重合法且归一化', () => {
    for (const luck of [-50, 0, 50, 200, 1000]) {
      const ws = upgradeRarityWeights(luck);
      for (const x of ws) expect(x).toBeGreaterThanOrEqual(0);
      expect(ws.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    }
  });
  it('幸运分层：未到门槛的档位概率为 0，高档门槛依次升高', () => {
    for (const [key, f] of [
      ['weapon', (l: number) => weaponTierWeights(l)],
      ['item', rarityWeights],
      ['upgrade', upgradeRarityWeights],
    ] as const) {
      const tiers = BALANCE.luckTiers[key];
      for (let i = 1; i < tiers.length; i++) expect(tiers[i].from).toBeGreaterThan(tiers[i - 1].from);
      // 低幸运只出最低档
      expect(f(tiers[0].from - 1)).toEqual([1, 0, 0, 0]);
      expect(f(-100)).toEqual([1, 0, 0, 0]);
      tiers.forEach((t, i) => {
        expect(f(t.from - 1)[i + 1]).toBe(0);
        expect(f(t.from)[i + 1]).toBeCloseTo(t.start / 100, 6);
      });
    }
  });
  it('幸运曲线：T4 在幸运 30 时 1%、100 时 5%，先快后慢', () => {
    const t4 = (l: number) => weaponTierWeights(l)[3];
    expect(t4(29)).toBe(0);
    expect(t4(30)).toBeCloseTo(0.01, 6);
    expect(t4(100)).toBeCloseTo(0.05, 6);
    // 前 35 点涨得比后 35 点多
    expect(t4(65) - t4(30)).toBeGreaterThan(t4(100) - t4(65));
    expect(t4(1000)).toBeLessThanOrEqual(BALANCE.luckTiers.weapon[2].cap / 100 + 1e-9);
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
