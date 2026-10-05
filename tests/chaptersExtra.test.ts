// 第六章 / 隐藏第七章 / 真结局 Boss 数据自检：id 不冲突、引用完整、数量与招式类型合法、英文覆盖完整、倍率曲线延续
import { describe, it, expect } from 'vitest';
import { ENEMY_MAP, ENEMIES } from '../src/data/enemies';
import { BOSS_MAP, BOSSES, bossPool, type PatternType } from '../src/data/bosses';
import { CHAPTERS } from '../src/data/chapters';
import { BALANCE, chapterHpMult, chapterDmgMult, chapterBossHpMult, chapterSpeedMult } from '../src/data/balance';
import {
  EXTRA_ENEMIES,
  EXTRA_BOSSES,
  EXTRA_CHAPTERS,
  EXTRA_EN,
  EXTRA_EN_ENEMIES,
  EXTRA_EN_BOSSES,
  EXTRA_CHAPTER_EN,
  EXTRA_CHAPTER_MULT,
  CH6_ENEMY_IDS,
  CH7_ENEMY_IDS,
  CH6_DANGER_REQ,
  CH7_DANGER_ALL,
  TRUE_FINAL_BOSS_ID,
  TERRAIN_INFO_EXTRA,
  extraElitePool,
  extraBossPool,
  isCh6Unlocked,
  isCh7Unlocked,
} from '../src/data/chaptersExtra';

/** 现有招式类型（与 bosses.ts 的 PatternType 联合类型保持一致；新增类型时 TS 会在这里报缺项） */
const PATTERN_TYPES: Record<PatternType, true> = {
  ring: true,
  spiral: true,
  aimed: true,
  charge: true,
  summon: true,
  slam: true,
  hazard: true,
  laser: true,
  teleport: true,
  buff: true,
  scatter: true,
};

const newEnemyIds = EXTRA_ENEMIES.map((e) => e.id);
const newBossIds = EXTRA_BOSSES.map((b) => b.id);
const allNewIds = [...newEnemyIds, ...newBossIds];
const enemyExists = (id: string) => id in ENEMY_MAP || newEnemyIds.includes(id);

describe('id 唯一性', () => {
  it('新 id 之间互不重复', () => {
    expect(new Set(allNewIds).size).toBe(allNewIds.length);
  });
  // 1.4.0 接线后新内容已合并进总表：改为检查合并后的表里没有重复 id、而且确实都并进去了
  it('新小怪已并入 ENEMY_MAP，且不与精英 / Boss 同名', () => {
    for (const id of newEnemyIds) {
      expect(ENEMY_MAP[id], id).toBeDefined();
      expect(BOSS_MAP[id], id).toBeUndefined();
    }
    expect(new Set(ENEMIES.map((e) => e.id)).size).toBe(ENEMIES.length);
  });
  it('新精英 / Boss 已并入 BOSS_MAP，且不与小怪同名', () => {
    for (const id of newBossIds) {
      expect(BOSS_MAP[id], id).toBeDefined();
      expect(ENEMY_MAP[id], id).toBeUndefined();
    }
    expect(new Set(BOSSES.map((b) => b.id)).size).toBe(BOSSES.length);
    expect(bossPool(7).some((b) => b.id === TRUE_FINAL_BOSS_ID)).toBe(false);
  });
  it('新章节已并入 CHAPTERS，id 连续', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(EXTRA_CHAPTERS.map((c) => c.id)).toEqual([6, 7]);
  });
});

describe('数量', () => {
  it('第六章：8 种新小怪 + 2 精英 + 1 Boss', () => {
    expect(CH6_ENEMY_IDS).toHaveLength(8);
    expect(extraElitePool(6)).toHaveLength(2);
    expect(extraBossPool(6)).toHaveLength(1);
  });
  it('第七章：4 种新小怪 + 2 精英 + 1 Boss（不含真结局 Boss）', () => {
    expect(CH7_ENEMY_IDS).toHaveLength(4);
    expect(extraElitePool(7)).toHaveLength(2);
    expect(extraBossPool(7)).toHaveLength(1);
  });
  it('真结局 Boss 存在、带 trueFinal 标记且不进入任何随机池', () => {
    const k = EXTRA_BOSSES.find((b) => b.id === TRUE_FINAL_BOSS_ID);
    expect(k).toBeDefined();
    expect(k!.trueFinal).toBe(true);
    expect(k!.elite).toBeFalsy();
    for (const ch of [1, 2, 3, 4, 5, 6, 7]) {
      expect(extraBossPool(ch).some((b) => b.id === TRUE_FINAL_BOSS_ID)).toBe(false);
      expect(extraElitePool(ch).some((b) => b.id === TRUE_FINAL_BOSS_ID)).toBe(false);
      expect(bossPool(ch).some((b) => b.id === TRUE_FINAL_BOSS_ID)).toBe(false);
    }
  });
  it('真结局 Boss 招式最多（含二阶段）', () => {
    const total = (b: (typeof EXTRA_BOSSES)[number]) => b.patterns.length + (b.phase2?.add.length ?? 0);
    const king = EXTRA_BOSSES.find((b) => b.id === TRUE_FINAL_BOSS_ID)!;
    for (const b of [...EXTRA_BOSSES, ...Object.values(BOSS_MAP)]) if (b.id !== king.id) expect(total(king)).toBeGreaterThan(total(b));
    expect(king.phase2).toBeDefined();
  });
});

describe('引用完整', () => {
  it('新章节刷怪池引用的敌人都存在', () => {
    for (const ch of EXTRA_CHAPTERS)
      for (const p of ch.pool) {
        expect(enemyExists(p.enemy), `第 ${ch.id} 章 ${p.enemy}`).toBe(true);
        expect(p.weight).toBeGreaterThan(0);
        expect(p.from).toBeGreaterThanOrEqual(1);
        if (p.to !== undefined) expect(p.to).toBeGreaterThanOrEqual(p.from);
      }
  });
  it('每种新小怪都至少出现在一个新章节刷怪池里', () => {
    const pooled = new Set(EXTRA_CHAPTERS.flatMap((c) => c.pool.map((p) => p.enemy)));
    for (const id of newEnemyIds) expect(pooled.has(id), id).toBe(true);
  });
  it('第一波就有可刷的敌人', () => {
    for (const ch of EXTRA_CHAPTERS) expect(ch.pool.some((p) => p.from === 1)).toBe(true);
  });
  it('splitter / summoner 与 summon 招式引用的敌人都存在', () => {
    for (const e of EXTRA_ENEMIES) {
      if (e.splitInto) expect(enemyExists(e.splitInto), e.id).toBe(true);
      if (e.summon) expect(enemyExists(e.summon), e.id).toBe(true);
    }
    for (const b of EXTRA_BOSSES)
      for (const p of [...b.patterns, ...(b.phase2?.add ?? [])])
        if (p.type === 'summon') expect(p.enemy && enemyExists(p.enemy), `${b.id} → ${p.enemy}`).toBe(true);
  });
});

describe('招式与行为', () => {
  it('所有 Pattern.type 都是已有类型', () => {
    for (const b of EXTRA_BOSSES)
      for (const p of [...b.patterns, ...(b.phase2?.add ?? [])]) expect(PATTERN_TYPES[p.type], `${b.id}: ${p.type}`).toBe(true);
  });
  it('精英与 Boss 都属于第六或第七章', () => {
    for (const b of EXTRA_BOSSES) expect([6, 7]).toContain(b.chapter);
  });
  it('新小怪不是地形生物，基础数值在第五章同层级范围内', () => {
    for (const e of EXTRA_ENEMIES) {
      expect(e.critter, e.id).toBeFalsy();
      expect(e.hp, e.id).toBeLessThanOrEqual(40);
      expect(e.dmg, e.id).toBeLessThanOrEqual(5);
    }
  });
});

describe('英文覆盖', () => {
  it('EXTRA_EN 覆盖全部新 id 且没有多余键', () => {
    expect(Object.keys(EXTRA_EN).sort()).toEqual([...allNewIds].sort());
    for (const id of allNewIds) expect(EXTRA_EN[id]?.length, id).toBeGreaterThan(0);
  });
  it('分表英文与数据一一对应', () => {
    expect(Object.keys(EXTRA_EN_ENEMIES).sort()).toEqual([...newEnemyIds].sort());
    expect(Object.keys(EXTRA_EN_BOSSES).sort()).toEqual([...newBossIds].sort());
  });
  it('章节英文与地形说明条数对应', () => {
    for (const ch of EXTRA_CHAPTERS) {
      expect(EXTRA_CHAPTER_EN[ch.id]?.name).toBeTruthy();
      expect(EXTRA_CHAPTER_EN[ch.id].terrain).toHaveLength(TERRAIN_INFO_EXTRA[ch.id].length);
    }
  });
});

describe('章节倍率延续现有曲线', () => {
  const last = 5;
  it.each([
    ['hp', chapterHpMult],
    ['dmg', chapterDmgMult],
    ['bossHp', chapterBossHpMult],
  ] as const)('%s：第五章 < 第六章 < 第七章，且公比与第四→五章一致', (k, fn) => {
    const m5 = fn(last),
      m6 = EXTRA_CHAPTER_MULT[6][k],
      m7 = EXTRA_CHAPTER_MULT[7][k];
    expect(m6).toBeGreaterThan(m5);
    expect(m7).toBeGreaterThan(m6);
    // 现有曲线以 5 章归一化时，相邻两章的比值恒定（允许两位小数取整误差）
    if (BALANCE.chapterCount === 5) {
      const ratio = m5 / fn(last - 1);
      expect(m6 / m5).toBeCloseTo(ratio, 1);
      expect(m7 / m6).toBeCloseTo(ratio, 1);
    }
  });
  it('速度：保持等差', () => {
    const step = BALANCE.chapterCurve.speedStep;
    expect(EXTRA_CHAPTER_MULT[6].speed).toBeCloseTo(chapterSpeedMult(last) + step, 5);
    expect(EXTRA_CHAPTER_MULT[7].speed).toBeCloseTo(chapterSpeedMult(last) + step * 2, 5);
  });
  it('章节表的倍率字段就是建议倍率', () => {
    for (const ch of EXTRA_CHAPTERS) {
      const m = EXTRA_CHAPTER_MULT[ch.id as 6 | 7];
      expect([ch.hpMult, ch.dmgMult, ch.bossHpMult, ch.speedMult]).toEqual([m.hp, m.dmg, m.bossHp, m.speed]);
    }
  });
});

describe('解锁条件', () => {
  it('常量', () => {
    expect(CH6_DANGER_REQ).toBe(5);
    expect(CH7_DANGER_ALL).toBe(10);
  });
  it('第六章：任一章危机 ≥ 5 通关即开放', () => {
    expect(isCh6Unlocked({})).toBe(false);
    expect(isCh6Unlocked({ 1: 4, 2: 4 })).toBe(false);
    expect(isCh6Unlocked({ 3: 5 })).toBe(true);
    // 第六 / 七章本身不计入
    expect(isCh6Unlocked({ 6: 20 })).toBe(false);
  });
  it('第七章：第 1-5 章全部危机 ≥ 10 通关才开放', () => {
    expect(isCh7Unlocked({ 1: 10, 2: 10, 3: 10, 4: 10 })).toBe(false);
    expect(isCh7Unlocked({ 1: 10, 2: 12, 3: 10, 4: 20, 5: 9 })).toBe(false);
    expect(isCh7Unlocked({ 1: 10, 2: 12, 3: 10, 4: 20, 5: 10 })).toBe(true);
  });
});
