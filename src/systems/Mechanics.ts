// 局内机制按章节逐步开放：第一幕只有核心玩法，之后每一章引入一两个新机制，避免开局就把所有系统一次摊开
import type { RelicKind } from '../data/relics';
import { run } from './RunState';

/** 各机制从第几章开始出现（同一章的无尽模式沿用该章的开放情况） */
export const MECHANIC_CHAPTER = {
  /** H1 事件波、H5 局内小任务 */
  events: 2,
  quests: 2,
  /** 交易型遗物（有代价）进入精英三选一 */
  relicTrade: 2,
  /** H3 危险路线、H6 天气 */
  route: 3,
  weather: 3,
  /** 诅咒型遗物（高风险高收益）进入精英三选一 */
  relicCurse: 3,
  /** H2 神秘商人 */
  merchant: 4,
} as const;
export type MechanicId = keyof typeof MECHANIC_CHAPTER;

export const mechanicOpenAt = (id: MechanicId, chapterId: number): boolean => chapterId >= MECHANIC_CHAPTER[id];
export const mechanicOpen = (id: MechanicId): boolean => mechanicOpenAt(id, run.chapterId);

/** 当前章节能抽到的遗物类别（第一幕只有增益型） */
export function relicKindsOpen(chapterId = run.chapterId): RelicKind[] {
  const out: RelicKind[] = ['boon'];
  if (mechanicOpenAt('relicTrade', chapterId)) out.push('trade');
  if (mechanicOpenAt('relicCurse', chapterId)) out.push('curse');
  return out;
}

/** H2：神秘商人只在本章第 6 波之后出现；卖的类别也随章节放开（第 4 章只卖交易型，第 5 章起才有诅咒型） */
export const MERCHANT_MIN_WAVE = 6;
export const MERCHANT_CHANCE = 0.18;
export function merchantKinds(chapterId = run.chapterId): RelicKind[] {
  return chapterId >= MECHANIC_CHAPTER.merchant + 1 ? ['trade', 'curse'] : ['trade'];
}
