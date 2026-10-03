// 番茄危机（A 模块）：解锁进度、局后结算、Boss 追加招式
import type { Enemy } from '../objects/Enemy';
import { BOSS_DANGER_PATTERNS, MAX_DANGER } from '../data/danger';
import { goldReward, dangerReward } from '../data/balance';
import { save } from './Save';
import { run } from './RunState';

/** 某章当前可选的最高危机等级（通关第 L 级后解锁 L+1；通关该章本身后才开放 1 级） */
export function dangerUnlocked(chapterId: number): number {
  if (save.clearedChapters < chapterId) return 0;
  return Math.min(MAX_DANGER, Math.max(1, save.meta.dangerUnlocked[chapterId] ?? 1));
}

/** 角色 × 章节 通关过的最高危机等级（未通关为 -1，0 表示普通难度通关过） */
export function dangerBest(charId: string, chapterId: number): number {
  return save.meta.dangerBest[`${charId}_${chapterId}`] ?? (save.bestWave[`${charId}_${chapterId}`] >= 15 ? 0 : -1);
}

/** A9：这个角色是否在任意章节通关过第 20 级 */
export const hasGoldFrame = (charId: string): boolean =>
  Object.entries(save.meta.dangerBest).some(([k, v]) => k.startsWith(charId + '_') && v >= MAX_DANGER);

/** A6：给 Boss 追加危机招式（招式对象复制一份，不改数据表） */
export function addDangerPatterns(e: Enemy, n: number): void {
  for (const p of BOSS_DANGER_PATTERNS.slice(0, n)) {
    e.patterns.push({ ...p });
    e.patternT.push(p.cd * 0.6 + e.patterns.length * 0.5);
  }
}

export interface DangerResult {
  /** 本次是该章该等级的第几次通关（A10） */
  clearNo: number;
  /** 新解锁的危机等级（没有则为 0） */
  unlocked: number;
  /** 获得的金番茄（I2） */
  gold: number;
  /** 获得的额外天赋点（A7） */
  tp: number;
  /** 是否刷新了本章本级的最快通关 */
  fastest: boolean;
}

/** 局后结算危机等级与金番茄；win = 普通模式打完第 15 波 */
export function settleDanger(win: boolean, sec: number): DangerResult {
  const m = save.meta;
  const lv = run.challenge ? 0 : run.danger;
  const ch = run.chapterId;
  const res: DangerResult = { clearNo: 0, unlocked: 0, gold: 0, tp: 0, fastest: false };
  if (win && !run.endless && !run.challenge) {
    const k = `${run.charId}_${ch}`;
    m.dangerBest[k] = Math.max(m.dangerBest[k] ?? -1, lv);
    const ck = `${ch}_${lv}`;
    res.clearNo = m.dangerClears[ck] = (m.dangerClears[ck] ?? 0) + 1;
    if (lv >= 1 && (m.fastest[ck] === undefined || sec < m.fastest[ck])) {
      m.fastest[ck] = sec;
      res.fastest = true;
    }
    const before = dangerUnlocked(ch);
    m.dangerUnlocked[ch] = Math.min(MAX_DANGER, Math.max(m.dangerUnlocked[ch] ?? 1, lv + 1));
    if (dangerUnlocked(ch) > before) res.unlocked = dangerUnlocked(ch);
    // 每章第 5 / 10 / 15 / 20 级首次通关分别 +1 / +2 / +3 / +4 天赋点
    if (res.clearNo === 1 && lv > 0 && lv % 5 === 0) {
      res.tp = lv / 5;
      m.bonusTp += res.tp;
    }
  }
  if (!run.challenge) {
    res.gold = goldReward(run.wave, lv, run.endless, win && !run.endless);
    m.gold += res.gold;
    m.goldEarned += res.gold;
  }
  if (run.endless) {
    const k = `${run.charId}_${ch}`;
    m.endlessBest[k] = Math.max(m.endlessBest[k] ?? 0, run.wave);
  }
  return res;
}

export { dangerReward };
